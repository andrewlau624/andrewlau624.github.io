/* ==========================================================================
   blog.js  |  the blog list
   --------------------------------------------------------------------------
   Renders window.POSTS, which is generated from the markdown files in posts/
   by scripts/build-posts.mjs. Add a post with `npm run new`.
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

  if (!posts.length) {
    list.innerHTML = '<li><div class="post"><span class="post__excerpt">' +
      "No posts yet. Run npm run new to write one.</span></div></li>";
    return;
  }

  list.innerHTML = posts.map(function (post) {
    var thumb = post.image
      ? '<span class="post__thumb" style="background-image:url(' + esc(post.image) + ')"></span>'
      : "";
    var text =
      '<span class="post__text">' +
        '<span class="post__date">' + esc(post.date) + "</span>" +
        '<span class="post__title">' + esc(post.title) + "</span>" +
        (post.excerpt ? '<span class="post__excerpt">' + esc(post.excerpt) + "</span>" : "") +
      "</span>";

    return '<li><a class="post" href="post.html?p=' + esc(post.slug) + '">' +
      thumb + text + "</a></li>";
  }).join("");
})();
