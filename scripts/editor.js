(function () {
  var blocksContainer = document.getElementById("blocks-container");
  var btnAddBlock = document.getElementById("add-block");
  var btnGenerate = document.getElementById("btn-generate");
  var btnPreview = document.getElementById("btn-preview");
  var btnExport = document.getElementById("btn-export");
  var btnClear = document.getElementById("btn-clear");
  var btnCopy = document.getElementById("btn-copy");
  var btnCopyPlatform = document.getElementById("btn-copy-platform");
  var outputSection = document.getElementById("output-section");
  var jsonOutput = document.getElementById("json-output");
  var previewSection = document.getElementById("preview-section");
  var previewContainer = document.getElementById("preview-container");
  var platformExportSection = document.getElementById("platform-export-section");
  var platformExportOutput = document.getElementById("platform-export-output");
  var platformExportLabel = document.getElementById("platform-export-label");
  var platformExportNote = document.getElementById("platform-export-note");
  var platformTabs = document.querySelectorAll(".platform-tab");

  if (!blocksContainer) return;

  var DRAFT_KEY = "editor-draft";
  var dirty = false;
  var saveTimer = null;

  // ── 离开页面保护 ──
  // 使用 document 级别 + capture 阶段监听，确保一定能捕获到
  document.addEventListener("input", function (e) {
    if (e.target.closest("#blocks-container") || e.target.closest(".editor-form-grid")) {
      dirty = true;
      scheduleAutoSave();
    }
  }, true);

  document.addEventListener("change", function (e) {
    if (e.target.closest("#blocks-container") || e.target.closest(".editor-form-grid")) {
      dirty = true;
      scheduleAutoSave();
    }
  }, true);

  window.addEventListener("beforeunload", function (e) {
    if (!dirty) return;
    e.preventDefault();
    e.returnValue = "您有未保存的编辑内容，确定要离开吗？";
    return e.returnValue;
  });

  // ── 恢复草稿 ──
  var savedDraft = null;
  try {
    var raw = localStorage.getItem(DRAFT_KEY);
    if (raw) savedDraft = JSON.parse(raw);
  } catch (err) {}

  if (savedDraft && savedDraft._meta) {
    var meta = savedDraft._meta;
    var msg = "检测到未发布的草稿（" + meta.title + "，保存于 " + meta.savedAt + "），是否恢复？";
    if (confirm(msg)) {
      restoreDraft(savedDraft);
    } else {
      localStorage.removeItem(DRAFT_KEY);
      initEmpty();
    }
  } else {
    initEmpty();
  }

  function scheduleAutoSave() {
    if (saveTimer) clearTimeout(saveTimer);
    saveTimer = setTimeout(autoSave, 2000);
  }

  function autoSave() {
    var data = collectDataRaw();
    if (!data) return;
    var now = new Date();
    data._meta = {
      title: data.title || "（无标题）",
      savedAt: now.getFullYear() + "-" +
        String(now.getMonth() + 1).padStart(2, "0") + "-" +
        String(now.getDate()).padStart(2, "0") + " " +
        String(now.getHours()).padStart(2, "0") + ":" +
        String(now.getMinutes()).padStart(2, "0")
    };
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(data));
    } catch (err) {}
  }

  // ── 初始化空表单 ──
  function initEmpty() {
    var dateInput = document.getElementById("editor-date");
    if (dateInput) {
      var today = new Date();
      var yyyy = today.getFullYear();
      var mm = String(today.getMonth() + 1).padStart(2, "0");
      var dd = String(today.getDate()).padStart(2, "0");
      dateInput.value = yyyy + "-" + mm + "-" + dd;
    }
    addBlock();
    dirty = false;
  }

  // ── 恢复草稿到表单 ──
  function restoreDraft(draft) {
    document.getElementById("editor-id").value = draft.id || "";
    document.getElementById("editor-title").value = draft.title || "";
    document.getElementById("editor-category").value = draft.category || "";
    document.getElementById("editor-date").value = draft.date || "";
    document.getElementById("editor-readtime").value = draft.readTime || "";
    document.getElementById("editor-summary").value = draft.summary || "";
    document.getElementById("editor-cover").value = draft.cover || "";

    blocksContainer.innerHTML = "";
    if (draft.content && draft.content.length > 0) {
      for (var i = 0; i < draft.content.length; i++) {
        restoreBlock(draft.content[i]);
      }
    } else {
      addBlock();
    }
    dirty = false;
  }

  function restoreBlock(blockData) {
    var type = "paragraphs";
    if (blockData.image) type = "image";
    else if (blockData.list) type = "list";

    addBlock();
    var lastBlock = blocksContainer.lastElementChild;

    var headingInput = lastBlock.querySelector(".block-heading");
    if (headingInput) headingInput.value = blockData.heading || "";

    var radio = lastBlock.querySelector('input[type="radio"][value="' + type + '"]');
    if (radio) {
      radio.checked = true;
      switchBlockType(lastBlock);
    }

    if (type === "paragraphs" && blockData.paragraphs) {
      var ta = lastBlock.querySelector(".block-paragraphs");
      if (ta) ta.value = blockData.paragraphs.join("\n");
    } else if (type === "list" && blockData.list) {
      var ta2 = lastBlock.querySelector(".block-list");
      if (ta2) ta2.value = blockData.list.join("\n");
    } else if (type === "image" && blockData.image) {
      var srcInput = lastBlock.querySelector(".block-image-src");
      var altInput = lastBlock.querySelector(".block-image-alt");
      if (srcInput) srcInput.value = blockData.image.src || "";
      if (altInput) altInput.value = blockData.image.alt || "";
    }
  }

  btnAddBlock.addEventListener("click", function () {
    addBlock();
    dirty = true;
    scheduleAutoSave();
  });
  btnGenerate.addEventListener("click", generateJSON);
  btnPreview.addEventListener("click", previewArticle);
  btnExport.addEventListener("click", exportPlatforms);
  btnClear.addEventListener("click", clearForm);
  btnCopy.addEventListener("click", copyJSON);
  btnCopyPlatform.addEventListener("click", copyPlatformExport);

  for (var tabIndex = 0; tabIndex < platformTabs.length; tabIndex++) {
    platformTabs[tabIndex].addEventListener("click", function () {
      setPlatformFormat(this.getAttribute("data-export-format"));
    });
  }

  function addBlock() {
    var index = blocksContainer.children.length;
    var block = document.createElement("div");
    block.className = "editor-block";
    block.innerHTML = [
      '<div class="editor-block-header">',
      '  <span class="editor-block-num">内容块 #' + (index + 1) + '</span>',
      '  <div class="editor-block-type-row">',
      '    <label><input type="radio" name="block-type-' + index + '" value="paragraphs" checked> 段落</label>',
      '    <label><input type="radio" name="block-type-' + index + '" value="list"> 列表</label>',
      '    <label><input type="radio" name="block-type-' + index + '" value="image"> 图片</label>',
      '  </div>',
      '  <button class="editor-block-remove" type="button" title="删除此块">×</button>',
      '</div>',
      '<div class="editor-field">',
      '  <label>小节标题 <span class="editor-optional">（图片块可留空）</span></label>',
      '  <input type="text" class="block-heading" placeholder="例如：事情是这样开始的">',
      '</div>',
      '<div class="editor-block-body">',
      '  <div class="editor-field">',
      '    <label>段落内容（每行一个段落）</label>',
      '    <textarea class="block-paragraphs" rows="4" placeholder="第一段内容&#10;第二段内容"></textarea>',
      '  </div>',
      '</div>'
    ].join("");

    var radios = block.querySelectorAll('input[type="radio"]');
    for (var i = 0; i < radios.length; i++) {
      radios[i].addEventListener("change", function () {
        if (switchBlockType(block)) {
          dirty = true;
          scheduleAutoSave();
        }
      });
    }

    block.querySelector(".editor-block-remove").addEventListener("click", function () {
      block.parentNode.removeChild(block);
      renumberBlocks();
      dirty = true;
      scheduleAutoSave();
    });

    blocksContainer.appendChild(block);
  }

  function hasBlockContent(body) {
    var ta = body.querySelector("textarea");
    if (ta && ta.value.trim()) return true;
    var srcInput = body.querySelector(".block-image-src");
    if (srcInput && srcInput.value.trim()) return true;
    return false;
  }

  function switchBlockType(block) {
    var radio = block.querySelector('input[type="radio"]:checked');
    var body = block.querySelector(".editor-block-body");
    var type = radio ? radio.value : "paragraphs";

    // 检查当前内容是否有内容，有则提示
    if (hasBlockContent(body) && !confirm("切换类型会丢失当前块的内容，确定切换吗？")) {
      // 恢复到之前的类型
      var allRadios = block.querySelectorAll('input[type="radio"]');
      for (var j = 0; j < allRadios.length; j++) {
        if (allRadios[j] !== radio) allRadios[j].checked = false;
      }
      // 取消当前选中，恢复之前的
      var prevType = body.querySelector(".block-paragraphs") ? "paragraphs"
        : body.querySelector(".block-list") ? "list" : "image";
      radio.checked = false;
      var prevRadio = block.querySelector('input[type="radio"][value="' + prevType + '"]');
      if (prevRadio) prevRadio.checked = true;
      return false;
    }

    if (type === "paragraphs") {
      body.innerHTML = [
        '<div class="editor-field">',
        '  <label>段落内容（每行一个段落）</label>',
        '  <textarea class="block-paragraphs" rows="4" placeholder="第一段内容&#10;第二段内容"></textarea>',
        '</div>'
      ].join("");
    } else if (type === "list") {
      body.innerHTML = [
        '<div class="editor-field">',
        '  <label>列表项（每行一项）</label>',
        '  <textarea class="block-list" rows="4" placeholder="第一项&#10;第二项"></textarea>',
        '</div>'
      ].join("");
    } else {
      body.innerHTML = [
        '<div class="editor-field">',
        '  <label>选择图片文件</label>',
        '  <input type="file" class="block-image-file" accept="image/*">',
        '</div>',
        '<div class="editor-field">',
        '  <label>图片路径 <span class="editor-optional">（自动生成或手动填写 assets/ 下的路径）</span></label>',
        '  <input type="text" class="block-image-src" placeholder="assets/my-image.png">',
        '</div>',
        '<div class="editor-field">',
        '  <label>图片描述（alt 文本）</label>',
        '  <input type="text" class="block-image-alt" placeholder="描述图片内容">',
        '</div>',
        '<div class="editor-image-preview"></div>'
      ].join("");

      var fileInput = body.querySelector(".block-image-file");
      var srcInput = body.querySelector(".block-image-src");
      var previewDiv = body.querySelector(".editor-image-preview");

      fileInput.addEventListener("change", function () {
        var file = fileInput.files[0];
        if (!file) return;
        srcInput.value = "assets/" + file.name;
        var reader = new FileReader();
        reader.onload = function (e) {
          previewDiv.innerHTML = '<img src="' + e.target.result + '" alt="预览">';
        };
        reader.readAsDataURL(file);
        dirty = true;
        scheduleAutoSave();
      });
    }
    return true;
  }

  function renumberBlocks() {
    var blocks = blocksContainer.querySelectorAll(".editor-block");
    for (var i = 0; i < blocks.length; i++) {
      var num = blocks[i].querySelector(".editor-block-num");
      if (num) num.textContent = "内容块 #" + (i + 1);
    }
  }

  // 不带校验的原始数据收集（用于自动保存）
  function collectDataRaw() {
    var content = [];
    var blocks = blocksContainer.querySelectorAll(".editor-block");
    for (var i = 0; i < blocks.length; i++) {
      var heading = blocks[i].querySelector(".block-heading").value.trim();
      var radio = blocks[i].querySelector('input[type="radio"]:checked');
      var type = radio ? radio.value : "paragraphs";

      var block = {};
      if (heading) block.heading = heading;

      if (type === "paragraphs") {
        var paraText = blocks[i].querySelector(".block-paragraphs").value;
        block.paragraphs = paraText.split("\n").map(function (s) { return s.trim(); }).filter(Boolean);
      } else if (type === "list") {
        var listText = blocks[i].querySelector(".block-list").value;
        block.list = listText.split("\n").map(function (s) { return s.trim(); }).filter(Boolean);
      } else {
        var srcInput = blocks[i].querySelector(".block-image-src");
        var altInput = blocks[i].querySelector(".block-image-alt");
        var src = srcInput ? srcInput.value.trim() : "";
        var alt = altInput ? altInput.value.trim() : "";
        if (!src) continue;
        block.image = { src: src };
        if (alt) block.image.alt = alt;
      }

      if (!block.heading) block.heading = "";
      content.push(block);
    }

    return {
      id: document.getElementById("editor-id").value.trim(),
      title: document.getElementById("editor-title").value.trim(),
      category: document.getElementById("editor-category").value.trim(),
      date: document.getElementById("editor-date").value,
      readTime: document.getElementById("editor-readtime").value.trim(),
      summary: document.getElementById("editor-summary").value.trim(),
      cover: document.getElementById("editor-cover").value.trim(),
      content: content
    };
  }

  function collectData() {
    var id = document.getElementById("editor-id").value.trim();
    var title = document.getElementById("editor-title").value.trim();
    if (!id || !title) {
      alert("请至少填写文章 ID 和标题。");
      return null;
    }
    return collectDataRaw();
  }

  function generateJSON() {
    var data = collectData();
    if (!data) return;

    var json = JSON.stringify(data, null, 2);
    jsonOutput.textContent = json;
    outputSection.style.display = "";
    previewSection.style.display = "none";
    platformExportSection.style.display = "none";
    outputSection.scrollIntoView({ behavior: "smooth" });
  }

  function copyJSON() {
    var text = jsonOutput.textContent;
    if (!text) return;

    copyText(text, btnCopy, "复制到剪贴板", function () {
      onCopySuccess();
    });
  }

  function copyPlatformExport() {
    if (!platformExportOutput || !platformExportOutput.value) return;
    copyText(platformExportOutput.value, btnCopyPlatform, "复制当前内容");
  }

  function copyText(text, button, defaultLabel, callback) {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text).then(function () {
        button.textContent = "已复制!";
        setTimeout(function () { button.textContent = defaultLabel; }, 2000);
        if (callback) callback();
      });
    } else {
      var ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      button.textContent = "已复制!";
      setTimeout(function () { button.textContent = defaultLabel; }, 2000);
      if (callback) callback();
    }
  }

  function onCopySuccess() {
    dirty = false;
    try { localStorage.removeItem(DRAFT_KEY); } catch (err) {}
  }

  function previewArticle() {
    var data = collectData();
    if (!data) return;

    outputSection.style.display = "none";
    previewSection.style.display = "";
    platformExportSection.style.display = "none";

    var articleHTML = [
      '<section class="post-hero post-hero-refined">',
      '  <div class="post-hero-main">',
      '    <div class="post-hero-copy">',
      '      <p class="eyebrow">' + data.category + '</p>',
      '      <h1 class="post-title">' + data.title + '</h1>',
      '      <p class="post-lead">' + data.summary + '</p>',
      '      <div class="post-meta post-meta-refined">',
      '        <time datetime="' + data.date + '">' + window.formatDate(data.date) + '</time>',
      '        <span>' + data.readTime + '</span>',
      '      </div>',
      '    </div>',
      '    <div class="post-hero-cover-wrap">',
      '      <img src="' + data.cover + '" alt="' + data.title + '">',
      '    </div>',
      '  </div>',
      '</section>',
      '<section class="post-layout">',
      '  <article class="post-article">' + createArticleBlocks(data.content) + '</article>',
      '  <aside class="sidebar-stack">',
      '    <div class="sidebar-card sidebar-card-emphasis">',
      '      <span class="post-category">Preview</span>',
      '      <h3>预览模式</h3>',
      '      <p>这是文章发布后的显示效果。</p>',
      '    </div>',
      '  </aside>',
      '</section>'
    ].join("");

    previewContainer.innerHTML = articleHTML;
    previewSection.scrollIntoView({ behavior: "smooth" });
  }

  function exportPlatforms() {
    var data = collectData();
    if (!data) return;

    outputSection.style.display = "none";
    previewSection.style.display = "none";
    platformExportSection.style.display = "";
    setPlatformFormat(getActivePlatformFormat() || "markdown");
    platformExportSection.scrollIntoView({ behavior: "smooth" });
  }

  function getActivePlatformFormat() {
    for (var i = 0; i < platformTabs.length; i++) {
      if (platformTabs[i].className.indexOf("is-active") >= 0) {
        return platformTabs[i].getAttribute("data-export-format");
      }
    }
    return "markdown";
  }

  function setPlatformFormat(format) {
    var data = collectData();
    if (!data) return;

    for (var i = 0; i < platformTabs.length; i++) {
      var isCurrent = platformTabs[i].getAttribute("data-export-format") === format;
      platformTabs[i].className = isCurrent ? "platform-tab is-active" : "platform-tab";
    }

    var pack = buildPlatformExport(data, format);
    platformExportLabel.textContent = pack.label;
    platformExportNote.textContent = pack.note;
    platformExportOutput.value = pack.content;
  }

  function buildPlatformExport(data, format) {
    if (format === "wechat") {
      return {
        label: "公众号 HTML",
        note: "适合粘贴到公众号编辑器，或交给公众号草稿箱 API 继续处理。",
        content: toWechatHTML(data)
      };
    }
    if (format === "zhihu") {
      return {
        label: "知乎 HTML",
        note: "适合粘贴到知乎编辑器；自动发布建议只作为实验功能。",
        content: toZhihuHTML(data)
      };
    }
    if (format === "xhs") {
      return {
        label: "小红书文案",
        note: "适合搭配封面和卡片图，在小红书创作服务平台或 App 内人工发布。",
        content: toXiaohongshuCopy(data)
      };
    }
    return {
      label: "Markdown",
      note: "适合归档、二次编辑，或交给发布脚本继续处理。",
      content: toMarkdown(data)
    };
  }

  function toMarkdown(data) {
    var lines = [];
    lines.push("# " + data.title);
    lines.push("");
    lines.push("> " + data.summary);
    lines.push("");
    lines.push("- 分类：" + data.category);
    lines.push("- 日期：" + data.date);
    lines.push("- 阅读时长：" + data.readTime);
    if (data.cover) lines.push("- 封面：" + data.cover);
    lines.push("");

    for (var i = 0; i < data.content.length; i++) {
      var block = data.content[i];
      if (block.heading) {
        lines.push("## " + block.heading);
        lines.push("");
      }
      if (block.paragraphs) {
        for (var p = 0; p < block.paragraphs.length; p++) {
          lines.push(block.paragraphs[p]);
          lines.push("");
        }
      }
      if (block.list) {
        for (var item = 0; item < block.list.length; item++) {
          lines.push("- " + block.list[item]);
        }
        lines.push("");
      }
      if (block.image && block.image.src) {
        lines.push("![" + (block.image.alt || data.title) + "](" + block.image.src + ")");
        lines.push("");
      }
    }
    return lines.join("\n").replace(/\n{3,}/g, "\n\n").trim() + "\n";
  }

  function toWechatHTML(data) {
    var html = [];
    html.push('<section style="max-width: 680px; margin: 0 auto; color: #1f2933; font-size: 16px; line-height: 1.9;">');
    html.push('<h1 style="margin: 0 0 16px; font-size: 28px; line-height: 1.35; color: #111827;">' + escapeHTML(data.title) + '</h1>');
    html.push('<p style="margin: 0 0 20px; color: #667085;">' + escapeHTML(data.summary) + '</p>');
    html.push('<p style="margin: 0 0 28px; color: #98a2b3; font-size: 14px;">' + escapeHTML(data.category) + ' · ' + escapeHTML(data.date) + ' · ' + escapeHTML(data.readTime) + '</p>');
    if (data.cover) {
      html.push('<p><img src="' + escapeHTML(data.cover) + '" alt="' + escapeHTML(data.title) + '" style="width: 100%; border-radius: 12px;"></p>');
    }
    html.push(blocksToHTML(data.content, "wechat"));
    html.push('</section>');
    return html.join("\n");
  }

  function toZhihuHTML(data) {
    var html = [];
    html.push('<h1>' + escapeHTML(data.title) + '</h1>');
    html.push('<blockquote>' + escapeHTML(data.summary) + '</blockquote>');
    html.push('<p>' + escapeHTML(data.category) + ' · ' + escapeHTML(data.date) + ' · ' + escapeHTML(data.readTime) + '</p>');
    if (data.cover) {
      html.push('<figure><img src="' + escapeHTML(data.cover) + '" alt="' + escapeHTML(data.title) + '"><figcaption>' + escapeHTML(data.title) + '</figcaption></figure>');
    }
    html.push(blocksToHTML(data.content, "zhihu"));
    return html.join("\n");
  }

  function blocksToHTML(blocks, target) {
    var html = [];
    for (var i = 0; i < blocks.length; i++) {
      var block = blocks[i];
      if (block.heading) {
        if (target === "wechat") {
          html.push('<h2 style="margin: 32px 0 14px; padding-left: 12px; border-left: 4px solid #355cff; font-size: 22px; line-height: 1.4; color: #111827;">' + escapeHTML(block.heading) + '</h2>');
        } else {
          html.push('<h2>' + escapeHTML(block.heading) + '</h2>');
        }
      }
      if (block.paragraphs) {
        for (var p = 0; p < block.paragraphs.length; p++) {
          if (target === "wechat") {
            html.push('<p style="margin: 0 0 16px;">' + escapeHTML(block.paragraphs[p]) + '</p>');
          } else {
            html.push('<p>' + escapeHTML(block.paragraphs[p]) + '</p>');
          }
        }
      }
      if (block.list) {
        html.push(target === "wechat" ? '<ul style="margin: 0 0 18px; padding-left: 22px;">' : '<ul>');
        for (var item = 0; item < block.list.length; item++) {
          html.push('<li>' + escapeHTML(block.list[item]) + '</li>');
        }
        html.push('</ul>');
      }
      if (block.image && block.image.src) {
        if (target === "wechat") {
          html.push('<p style="margin: 22px 0;"><img src="' + escapeHTML(block.image.src) + '" alt="' + escapeHTML(block.image.alt || "") + '" style="width: 100%; border-radius: 12px;"></p>');
        } else {
          html.push('<figure><img src="' + escapeHTML(block.image.src) + '" alt="' + escapeHTML(block.image.alt || "") + '">');
          if (block.image.alt) html.push('<figcaption>' + escapeHTML(block.image.alt) + '</figcaption>');
          html.push('</figure>');
        }
      }
    }
    return html.join("\n");
  }

  function toXiaohongshuCopy(data) {
    var hooks = collectXhsHooks(data);
    var tags = buildHashtags(data);
    var lines = [];
    lines.push("【标题】");
    lines.push(trimText(data.title, 20));
    lines.push("");
    lines.push("【正文】");
    lines.push(data.summary);
    lines.push("");
    for (var i = 0; i < hooks.length; i++) {
      lines.push((i + 1) + ". " + hooks[i]);
    }
    lines.push("");
    lines.push("完整长文可以回到博客继续看，发布前记得把这句改成你当前平台允许的引导方式。");
    lines.push("");
    lines.push("【话题】");
    lines.push(tags.join(" "));
    lines.push("");
    lines.push("【图片卡片建议】");
    lines.push("封面：" + trimText(data.title, 18));
    for (var c = 0; c < hooks.length && c < 8; c++) {
      lines.push("卡片 " + (c + 1) + "：" + trimText(hooks[c], 22));
    }
    if (data.cover) {
      lines.push("");
      lines.push("可用封面素材：" + data.cover);
    }
    return lines.join("\n");
  }

  function collectXhsHooks(data) {
    var hooks = [];
    for (var i = 0; i < data.content.length; i++) {
      var block = data.content[i];
      if (block.heading) hooks.push(block.heading);
      if (block.list) {
        for (var item = 0; item < block.list.length && hooks.length < 10; item++) {
          hooks.push(block.list[item]);
        }
      }
      if (block.paragraphs) {
        for (var p = 0; p < block.paragraphs.length && hooks.length < 10; p++) {
          hooks.push(trimText(block.paragraphs[p], 36));
        }
      }
      if (hooks.length >= 10) break;
    }
    if (!hooks.length && data.summary) hooks.push(data.summary);
    return hooks.slice(0, 9);
  }

  function buildHashtags(data) {
    var tags = ["#学游纪"];
    if (data.category) tags.push("#" + data.category.replace(/\s+/g, ""));
    tags.push("#个人博客");
    tags.push("#学习记录");
    tags.push("#效率工具");
    tags.push("#经验分享");
    return unique(tags).slice(0, 8);
  }

  function unique(items) {
    var seen = {};
    var result = [];
    for (var i = 0; i < items.length; i++) {
      if (!seen[items[i]]) {
        seen[items[i]] = true;
        result.push(items[i]);
      }
    }
    return result;
  }

  function trimText(text, max) {
    if (!text) return "";
    if (text.length <= max) return text;
    return text.slice(0, max - 1) + "…";
  }

  function escapeHTML(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function createArticleBlocks(blocks) {
    return blocks.map(function (block) {
      var parts = ['<section class="article-block">'];

      if (block.heading) {
        parts.push('<h2>' + block.heading + '</h2>');
      }

      if (block.paragraphs) {
        parts = parts.concat(block.paragraphs.map(function (p) { return '<p>' + p + '</p>'; }));
      }
      if (block.list) {
        parts.push('<ul class="article-list">' + block.list.map(function (item) {
          return '<li>' + item + '</li>';
        }).join("") + '</ul>');
      }
      if (block.image && block.image.src) {
        var alt = block.image.alt || "";
        parts.push('<figure class="article-figure"><img src="' + block.image.src + '" alt="' + alt + '">');
        if (alt) {
          parts.push('<figcaption>' + alt + '</figcaption>');
        }
        parts.push('</figure>');
      }

      parts.push('</section>');
      return parts.join("");
    }).join("");
  }

  function clearForm() {
    if (dirty && !confirm("当前有未保存的内容，确定要清空吗？")) return;
    document.getElementById("editor-id").value = "";
    document.getElementById("editor-title").value = "";
    document.getElementById("editor-category").value = "";
    document.getElementById("editor-readtime").value = "";
    document.getElementById("editor-summary").value = "";
    document.getElementById("editor-cover").value = "";
    blocksContainer.innerHTML = "";
    addBlock();
    outputSection.style.display = "none";
    previewSection.style.display = "none";
    platformExportSection.style.display = "none";
    dirty = false;
    try { localStorage.removeItem(DRAFT_KEY); } catch (err) {}
  }
})();
