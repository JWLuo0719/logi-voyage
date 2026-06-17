const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");

const targetUrl = process.argv[2];
const outDir = process.argv[3] || path.join(process.cwd(), ".doc-captures");
const waitMs = Number(process.argv[4] || 25000);
const edgePath = process.env.EDGE_PATH || "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const port = Number(process.env.CDP_PORT || 9333);
const userDataDir = path.join(outDir, "edge-profile-" + Date.now());

if (!targetUrl) {
  console.error("Usage: node scripts/capture_dynamic_doc.js <url> [outDir] [waitMs]");
  process.exit(1);
}

fs.mkdirSync(outDir, { recursive: true });

const edge = spawn(edgePath, [
  "--headless",
  "--disable-gpu",
  "--disable-extensions",
  "--remote-allow-origins=*",
  "--remote-debugging-port=" + port,
  "--user-data-dir=" + userDataDir,
  "about:blank",
], {
  stdio: ["ignore", "ignore", "pipe"],
  windowsHide: true,
});

const edgeLog = path.join(outDir, "edge-stderr.log");
edge.stderr.on("data", function (data) {
  fs.appendFileSync(edgeLog, data);
});

function sleep(ms) {
  return new Promise(function (resolve) {
    setTimeout(resolve, ms);
  });
}

async function getJson(url) {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error("HTTP " + res.status + " " + url);
  }
  return res.json();
}

async function waitForDevtools() {
  const endpoint = "http://127.0.0.1:" + port + "/json/version";
  const start = Date.now();
  while (Date.now() - start < 10000) {
    try {
      return await getJson(endpoint);
    } catch (error) {
      await sleep(250);
    }
  }
  throw new Error("Timed out waiting for Edge DevTools");
}

function connect(wsUrl) {
  let nextId = 1;
  const pending = new Map();
  const events = [];
  const ws = new WebSocket(wsUrl);

  ws.addEventListener("message", function (event) {
    const msg = JSON.parse(event.data);
    if (msg.id && pending.has(msg.id)) {
      const item = pending.get(msg.id);
      pending.delete(msg.id);
      if (msg.error) {
        item.reject(new Error(JSON.stringify(msg.error)));
      } else {
        item.resolve(msg.result);
      }
      return;
    }
    if (msg.method) {
      events.push(msg);
    }
  });

  return new Promise(function (resolve, reject) {
    ws.addEventListener("open", function () {
      resolve({
        events,
        close: function () {
          ws.close();
        },
        send: function (method, params) {
          const id = nextId++;
          ws.send(JSON.stringify({ id, method, params: params || {} }));
          return new Promise(function (resolve, reject) {
            pending.set(id, { resolve, reject });
          });
        },
      });
    });
    ws.addEventListener("error", reject);
  });
}

function safeName(value) {
  return value.replace(/[^a-z0-9_-]+/gi, "_").slice(0, 80);
}

async function main() {
  await waitForDevtools();
  const created = await getJson("http://127.0.0.1:" + port + "/json/new?" + encodeURIComponent(targetUrl));
  const cdp = await connect(created.webSocketDebuggerUrl);
  const responses = [];
  const requestMap = new Map();

  await cdp.send("Page.enable");
  await cdp.send("Runtime.enable");
  await cdp.send("Network.enable", { maxResourceBufferSize: 10485760, maxTotalBufferSize: 104857600 });

  const eventTimer = setInterval(function () {
    while (cdp.events.length) {
      const event = cdp.events.shift();
      if (event.method === "Network.responseReceived") {
        const p = event.params;
        requestMap.set(p.requestId, {
          requestId: p.requestId,
          url: p.response.url,
          status: p.response.status,
          mimeType: p.response.mimeType,
          type: p.type,
        });
      }
      if (event.method === "Network.loadingFinished") {
        const meta = requestMap.get(event.params.requestId);
        if (meta && /json|text|javascript|protobuf|octet|sheet|excel|html/i.test(meta.mimeType + " " + meta.url)) {
          responses.push(meta);
        }
      }
    }
  }, 100);

  await cdp.send("Page.navigate", { url: targetUrl });
  await sleep(waitMs);
  clearInterval(eventTimer);

  const dom = await cdp.send("Runtime.evaluate", {
    expression: "document.body ? document.body.innerText : ''",
    returnByValue: true,
  });
  const title = await cdp.send("Runtime.evaluate", {
    expression: "document.title",
    returnByValue: true,
  });

  const saved = [];
  for (let i = 0; i < responses.length; i++) {
    const meta = responses[i];
    try {
      const body = await cdp.send("Network.getResponseBody", { requestId: meta.requestId });
      if (!body || !body.body) continue;
      const ext = meta.mimeType.includes("json") ? ".json" : ".txt";
      const file = path.join(outDir, String(i).padStart(3, "0") + "-" + safeName(new URL(meta.url).pathname) + ext);
      fs.writeFileSync(file, body.base64Encoded ? Buffer.from(body.body, "base64") : body.body);
      saved.push({ file, url: meta.url, status: meta.status, mimeType: meta.mimeType, bytes: fs.statSync(file).size });
    } catch (error) {
      saved.push({ url: meta.url, error: error.message });
    }
  }

  fs.writeFileSync(path.join(outDir, "page-text.txt"), (dom.result && dom.result.value) || "", "utf8");
  fs.writeFileSync(path.join(outDir, "summary.json"), JSON.stringify({
    url: targetUrl,
    title: title.result && title.result.value,
    saved,
  }, null, 2), "utf8");

  cdp.close();
  edge.kill();
  console.log(JSON.stringify({ outDir, title: title.result && title.result.value, saved: saved.length }, null, 2));
}

main().catch(function (error) {
  try {
    edge.kill();
  } catch (_) {}
  console.error(error.stack || error.message);
  process.exit(1);
});
