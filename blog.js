/* ==========================================================================
   blog.js  |  the blog list
   --------------------------------------------------------------------------
   Renders window.POSTS, which is generated from the markdown under posts/ by
   scripts/build-posts.mjs. Add a post with `npm run edit`.

   A folder under posts/ is a category, so the list can be filtered with
   ?c=<category> and paged with ?page=<n>. The page size comes from
   blog.perPage in content.js.
   ========================================================================== */

(function () {
  "use strict";

  var P = window.PORTFOLIO;
  if (!P) return;

  document.title = P.blog.label + " / " + P.meta.name;

  var titleEl = document.getElementById("blogTitle");
  var noteEl = document.getElementById("blogNote");
  if (titleEl) titleEl.textContent = P.blog.label;
  if (noteEl) noteEl.textContent = P.blog.note || "";

  var list = document.getElementById("posts");
  if (!list) return;

  function esc(value) {
    return String(value == null ? "" : value).replace(/[&<>"']/g, function (ch) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch];
    });
  }

  var posts = window.POSTS || [];
  var params = new URLSearchParams(window.location.search);
  var active = params.get("c") || "";
  var perPage = Math.max(1, Number(P.blog && P.blog.perPage) || 6);
  var page = Math.max(1, Number(params.get("page")) || 1);

  function href(category, at) {
    var query = [];
    if (category) query.push("c=" + encodeURIComponent(category));
    if (at && at > 1) query.push("page=" + at);
    return "blog.html" + (query.length ? "?" + query.join("&") : "");
  }

  /* the categories, in the order the posts arrive, which is by date */
  var cats = [];
  posts.forEach(function (post) {
    if (!post.category || !post.categoryKey) return;
    if (cats.some(function (c) { return c.key === post.categoryKey; })) return;
    cats.push({ key: post.categoryKey, label: post.category });
  });

  var catsEl = document.getElementById("blogCats");
  if (catsEl) {
    if (cats.length) {
      catsEl.innerHTML =
        '<a href="' + href("", 1) + '"' + (active ? "" : ' class="is-active"') + ">All</a>" +
        cats.map(function (c) {
          return '<a href="' + href(c.key, 1) + '"' +
            (active === c.key ? ' class="is-active"' : "") + ">" + esc(c.label) + "</a>";
        }).join("");
    } else {
      catsEl.innerHTML = "";
    }
  }

  var shown = active
    ? posts.filter(function (post) { return post.categoryKey === active; })
    : posts;

  var pages = Math.max(1, Math.ceil(shown.length / perPage));
  if (page > pages) page = pages;
  var slice = shown.slice((page - 1) * perPage, page * perPage);

  if (!slice.length) {
    list.innerHTML = '<li><div class="post"><span class="post__excerpt">' +
      (active ? "Nothing filed here yet." : "No posts yet.") +
      "</span></div></li>";
  } else {
    list.innerHTML = slice.map(function (post) {
      var thumb = post.image
        ? '<span class="post__thumb" style="background-image:url(' + esc(post.image) + ')"></span>'
        : "";
      var text =
        '<span class="post__text">' +
          '<span class="post__date">' + esc(post.date) +
            (post.category ? " · " + esc(post.category) : "") + "</span>" +
          '<span class="post__title">' + esc(post.title) + "</span>" +
          (post.excerpt ? '<span class="post__excerpt">' + esc(post.excerpt) + "</span>" : "") +
        "</span>";

      return '<li><a class="post" href="post.html?p=' + encodeURIComponent(post.slug) + '">' +
        thumb + text + "</a></li>";
    }).join("");
  }

  var pager = document.getElementById("blogPager");
  if (pager) {
    if (pages < 2) {
      pager.innerHTML = "";
    } else {
      var back = page > 1
        ? '<a href="' + href(active, page - 1) + '">← Newer</a>'
        : '<span class="is-off">← Newer</span>';
      var on = page < pages
        ? '<a href="' + href(active, page + 1) + '">Older →</a>'
        : '<span class="is-off">Older →</span>';
      var nums = [];
      for (var n = 1; n <= pages; n += 1) {
        nums.push('<a href="' + href(active, n) + '"' +
          (n === page ? ' class="is-active"' : "") + ">" + n + "</a>");
      }
      pager.innerHTML = back +
        '<span class="blog__nums">' + nums.join("") + "</span>" +
        on;
    }
  }
})();
