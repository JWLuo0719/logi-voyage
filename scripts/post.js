(function () {
  var container = document.getElementById("post-page");
  var posts = Array.isArray(window.BLOG_POSTS) ? window.BLOG_POSTS : [];

  if (!container) {
    return;
  }

  var params = new URLSearchParams(window.location.search);
  var currentId = params.get("id") || (posts[0] && posts[0].id);
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
    '<section class="post-hero post-hero-refined">',
    '  <div class="post-hero-main">',
    '    <div class="post-hero-copy">',
    '      <p class="eyebrow">' + currentPost.category + "</p>",
    '      <h1 class="post-title">' + currentPost.title + "</h1>",
    "      <p class=\"post-lead\">" + currentPost.summary + "</p>",
    '      <div class="post-meta post-meta-refined">',
    '        <time datetime="' + currentPost.date + '">' + window.formatDate(currentPost.date) + "</time>",
    '        <span>' + currentPost.readTime + "</span>",
    "      </div>",
    "    </div>",
    '    <div class="post-hero-cover-wrap">',
    '      <img src="' + currentPost.cover + '" alt="' + currentPost.title + '">',
    "    </div>",
    "  </div>",
    '  <div class="post-hero-notes">',
    '    <article class="mini-info-card">',
    '      <span class="post-category">Reading Notes</span>',
    "      <h3>这篇文章会讲什么</h3>",
    '      <p>围绕「' + currentPost.category + '」展开，适合快速了解这次练习或整理的核心思路。</p>',
    "    </article>",
    '    <article class="mini-info-card">',
    '      <span class="post-category">Quick Facts</span>',
    "      <h3>阅读信息</h3>",
    '      <ul class="plain-list compact-list">',
    '        <li>发布时间：' + window.formatDate(currentPost.date) + "</li>",
    '        <li>预计阅读：' + currentPost.readTime + "</li>",
    '        <li>所属分类：' + currentPost.category + "</li>",
    "      </ul>",
    "    </article>",
    "  </div>",
    "</section>",
    '<section class="post-layout post-layout-refined">',
    '  <article class="post-article">' + createArticleBlocks(currentPost.content) + "</article>",
    '  <aside class="sidebar-stack post-sidebar-refined">',
    '    <div class="sidebar-card sidebar-card-emphasis">',
    '      <span class="post-category">Article</span>',
    "      <h3>文章信息</h3>",
    '      <p>分类：' + currentPost.category + "</p>",
    '      <p>阅读时长：' + currentPost.readTime + "</p>",
    '      <a class="text-link" href="posts.html">回到文章列表</a>',
    "    </div>",
    '    <div class="sidebar-card">',
    '      <span class="post-category">Next</span>',
    "      <h3>推荐阅读</h3>",
    '      <ul class="recommend-list">' + recommendations + "</ul>",
    "    </div>",
    '    <div class="sidebar-card">',
    '      <span class="post-category">Author</span>',
    "      <h3>继续了解我</h3>",
    '      <p>如果你想继续看这个博客的整体方向，可以再看看关于页和主页里的账号入口。</p>',
    '      <a class="text-link" href="profile.html">查看关于页</a>',
    "    </div>",
    "  </aside>",
    "</section>"
  ].join("");

  document.title = currentPost.title + " | Logi Voyage";

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
