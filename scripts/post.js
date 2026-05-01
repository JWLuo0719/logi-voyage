(function () {
  var container = document.getElementById("post-page");
  var posts = Array.isArray(window.BLOG_POSTS) ? window.BLOG_POSTS : [];

  if (!container) {
    return;
  }

  var params = new URLSearchParams(window.location.search);
  var currentId = params.get("id") || posts[0] && posts[0].id;
  var currentPost = posts.find(function (post) { return post.id === currentId; });

  if (!currentPost) {
    container.innerHTML = '<section class="page-banner"><p class="eyebrow">Post Missing</p><h1>没有找到这篇文章。</h1><p>请返回文章列表重新选择内容。</p><a class="button button-primary" href="posts.html">返回文章列表</a></section>';
    return;
  }

  var recommendations = posts
    .filter(function (post) { return post.id !== currentPost.id; })
    .slice(0, 3)
    .map(function (post) {
      return '<li><a href="post.html?id=' + post.id + '">' + post.title + "</a></li>";
    })
    .join("");

  container.innerHTML = [
    '<section class="post-hero">',
    '  <p class="eyebrow">' + currentPost.category + "</p>",
    '  <h1 class="post-title">' + currentPost.title + "</h1>",
    '  <div class="post-meta"><time datetime="' + currentPost.date + '">' + window.formatDate(currentPost.date) + "</time><span>" + currentPost.readTime + "</span></div>",
    "  <p>" + currentPost.summary + "</p>",
    '  <img src="' + currentPost.cover + '" alt="' + currentPost.title + '">',
    "</section>",
    '<section class="post-layout">',
    '  <article class="post-article">' + createArticleBlocks(currentPost.content) + "</article>",
    '  <aside class="sidebar-stack">',
    '    <div class="sidebar-card">',
    "      <h3>文章信息</h3>",
    '      <p>分类：' + currentPost.category + "</p>",
    '      <p>阅读时长：' + currentPost.readTime + "</p>",
    "    </div>",
    '    <div class="sidebar-card">',
    "      <h3>推荐阅读</h3>",
    '      <ul class="recommend-list">' + recommendations + "</ul>",
    "    </div>",
    '    <div class="sidebar-card">',
    "      <h3>继续浏览</h3>",
    '      <a class="text-link" href="posts.html">回到文章列表</a>',
    "    </div>",
    "  </aside>",
    "</section>"
  ].join("");

  document.title = currentPost.title + " | Neon Pulse";

  function createArticleBlocks(blocks) {
    return blocks.map(function (block) {
      var parts = ['<section class="article-block">', "<h2>" + block.heading + "</h2>"];

      if (Array.isArray(block.paragraphs)) {
        parts = parts.concat(block.paragraphs.map(function (paragraph) {
          return "<p>" + paragraph + "</p>";
        }));
      }

      if (Array.isArray(block.list)) {
        parts.push('<ul class="article-list">' + block.list.map(function (item) {
          return "<li>" + item + "</li>";
        }).join("") + "</ul>");
      }

      parts.push("</section>");
      return parts.join("");
    }).join("");
  }
})();
