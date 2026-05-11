(function () {
  var container = document.getElementById("featured-posts");

  if (!container || !Array.isArray(window.BLOG_POSTS)) {
    return;
  }

  // 通过仅显示最新的三个帖子，保持主页轻量级.
  container.innerHTML = window.BLOG_POSTS.slice(0, 3).map(window.createPostCard).join("");
})();
