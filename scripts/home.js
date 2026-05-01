(function () {
  var container = document.getElementById("featured-posts");

  if (!container || !Array.isArray(window.BLOG_POSTS)) {
    return;
  }

  container.innerHTML = window.BLOG_POSTS.slice(0, 3).map(window.createPostCard).join("");
})();
