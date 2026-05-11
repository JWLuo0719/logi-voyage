(function () {
  var posts = Array.isArray(window.BLOG_POSTS) ? window.BLOG_POSTS.slice() : [];
  var searchInput = document.getElementById("search-input");
  var filterContainer = document.getElementById("category-filters");
  var listContainer = document.getElementById("post-list");
  var countContainer = document.getElementById("results-count");
  var activeCategory = "全部";

  if (!searchInput || !filterContainer || !listContainer || !countContainer) {
    return;
  }

  // 从共享的帖子数据集中构建类别,以避免重复标记.
  var categories = ["全部"].concat(
    posts
      .map(function (post) { return post.category; })
      .filter(function (value, index, array) { return array.indexOf(value) === index; })
  );

  filterContainer.innerHTML = categories
    .map(function (category) {
      return '<button class="chip' + (category === activeCategory ? " is-active" : "") + '" type="button" data-category="' + category + '">' + category + "</button>";
    })
    .join("");

  filterContainer.addEventListener("click", function (event) {
    var button = event.target.closest(".chip");
    if (!button) {
      return;
    }

    activeCategory = button.getAttribute("data-category");
    Array.prototype.forEach.call(filterContainer.querySelectorAll(".chip"), function (chip) {
      chip.classList.toggle("is-active", chip === button);
    });
    render();
  });

  searchInput.addEventListener("input", render);

  render();

  function render() {
    var keyword = searchInput.value.trim().toLowerCase();
    // 结合类别和关键词过滤
    var filtered = posts.filter(function (post) {
      var matchesCategory = activeCategory === "全部" || post.category === activeCategory;
      var haystack = [post.title, post.summary, post.category].join(" ").toLowerCase();
      var matchesKeyword = !keyword || haystack.indexOf(keyword) !== -1;
      return matchesCategory && matchesKeyword;
    });

    countContainer.textContent = "共 " + filtered.length + " 篇文章";
    listContainer.innerHTML = filtered.length
      ? filtered.map(window.createPostCard).join("")
      : '<div class="empty-state">没有找到符合条件的文章，可以换个关键词试试。</div>';
  }
})();
