(function () {
  var blocksContainer = document.getElementById("blocks-container");
  var btnAddBlock = document.getElementById("add-block");
  var btnGenerate = document.getElementById("btn-generate");
  var btnPreview = document.getElementById("btn-preview");
  var btnClear = document.getElementById("btn-clear");
  var btnCopy = document.getElementById("btn-copy");
  var outputSection = document.getElementById("output-section");
  var jsonOutput = document.getElementById("json-output");
  var previewSection = document.getElementById("preview-section");
  var previewContainer = document.getElementById("preview-container");

  if (!blocksContainer) return;

  var DRAFT_KEY = "editor-draft";
  var dirty = false;
  var saveTimer = null;

  // ── 离开页面保护 ──
  window.addEventListener("beforeunload", function (e) {
    if (!dirty) return;
    e.preventDefault();
    e.returnValue = "";
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

  // ── 监听所有输入变化，标记 dirty 并自动保存 ──
  document.querySelector("main").addEventListener("input", function () {
    dirty = true;
    scheduleAutoSave();
  });

  document.querySelector("main").addEventListener("change", function () {
    dirty = true;
    scheduleAutoSave();
  });

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

    // 设置标题
    var headingInput = lastBlock.querySelector(".block-heading");
    if (headingInput) headingInput.value = blockData.heading || "";

    // 设置类型
    var radio = lastBlock.querySelector('input[type="radio"][value="' + type + '"]');
    if (radio) {
      radio.checked = true;
      switchBlockType(lastBlock);
    }

    // 填充内容
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
  btnClear.addEventListener("click", clearForm);
  btnCopy.addEventListener("click", copyJSON);

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
        switchBlockType(block);
        dirty = true;
        scheduleAutoSave();
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

  function switchBlockType(block) {
    var radio = block.querySelector('input[type="radio"]:checked');
    var body = block.querySelector(".editor-block-body");
    var type = radio ? radio.value : "paragraphs";

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

  // 带校验的数据收集（用于生成 JSON / 预览）
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
    outputSection.scrollIntoView({ behavior: "smooth" });
  }

  function copyJSON() {
    var text = jsonOutput.textContent;
    if (!text) return;

    if (navigator.clipboard) {
      navigator.clipboard.writeText(text).then(function () {
        btnCopy.textContent = "已复制!";
        setTimeout(function () { btnCopy.textContent = "复制到剪贴板"; }, 2000);
        onCopySuccess();
      });
    } else {
      var ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      btnCopy.textContent = "已复制!";
      setTimeout(function () { btnCopy.textContent = "复制到剪贴板"; }, 2000);
      onCopySuccess();
    }
  }

  function onCopySuccess() {
    // 复制成功后清除草稿和 dirty 标记
    dirty = false;
    try { localStorage.removeItem(DRAFT_KEY); } catch (err) {}
  }

  function previewArticle() {
    var data = collectData();
    if (!data) return;

    outputSection.style.display = "none";
    previewSection.style.display = "";

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
    dirty = false;
    try { localStorage.removeItem(DRAFT_KEY); } catch (err) {}
  }
})();
