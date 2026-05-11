(function () {
  var toggle = document.querySelector(".nav-toggle");
  var nav = document.querySelector(".site-nav");

  if (toggle && nav) {
    // 移动端导航使用单个类 toggle并同步aria-expanded以实现无障碍访问
    toggle.addEventListener("click", function () {
      var open = nav.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
  }

  // 在主页和帖子列表页面之间重用一个卡片生成器。.
  window.createPostCard = function createPostCard(post) {
    return [
      '<article class="post-card">',
      '  <div class="post-meta">',
      '    <span>' + post.category + '</span>',
      '    <time datetime="' + post.date + '">' + formatDate(post.date) + "</time>",
      "  </div>",
      '  <h3><a href="post.html?id=' + post.id + '">' + post.title + "</a></h3>",
      "  <p>" + post.summary + "</p>",
      '  <a class="text-link" href="post.html?id=' + post.id + '">阅读全文</a>',
      "</article>"
    ].join("");
  };

  window.formatDate = formatDate;

  function formatDate(value) {
    var parts = value.split("-");
    return parts[0] + "年" + Number(parts[1]) + "月" + Number(parts[2]) + "日";
  }
})();
