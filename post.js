/* ==========================================================================
   post.js  |  a single post
   --------------------------------------------------------------------------
   Reads ?p=<slug>, finds that post in window.POSTS (generated from the
   markdown files in posts/), fetches posts/<slug>.md, and renders the body
   with a small markdown renderer. No dependencies.

   The renderer here matches scripts/markdown.mjs, which the editor uses, so
   the preview and the page always agree.
   ========================================================================== */

(function () {
  "use strict";

  var P = window.PORTFOLIO;
  if (!P) return;

  function esc(value) {
    return String(value == null ? "" : value).replace(/[&<>"']/g, function (ch) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch];
    });
  }

  function inline(text) {
    return esc(text)
      .replace(/!\[([^\]]*)\]\(([^)\s]+)\)/g, '<img src="$2" alt="$1">')
      .replace(/`([^`]+)`/g, "<code>$1</code>")
      .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
      .replace(/\*([^*]+)\*/g, "<em>$1</em>")
      .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, '<a href="$2" rel="noreferrer">$1</a>');
  }

  var BULLET = /^(\s*)([-*+])\s+(.*)$/;
  var NUMBER = /^(\s*)(\d+)\.\s+(.*)$/;
  var HEADING = /^(#{1,3})\s+(.*)$/;
  var QUOTE = /^\s*>/;
  var RULE = /^\s*(-{3,}|\*{3,}|_{3,})\s*$/;
  var FENCE = /^\s*```/;
  var MATH = /^\s*\$\$/;
  var MATH_END = /\$\$\s*$/;

  /* a $$ block is kept as one piece, so it is not folded into a paragraph.
     KaTeX renders it on the page and in the editor preview. */
  function renderMath(start, lines, at) {
    var block = [start.trim()];
    var i = at;
    var single = MATH_END.test(start) && start.trim() !== "$$";
    while (!single && i < lines.length) {
      block.push(lines[i].trim());
      var closes = MATH_END.test(lines[i]);
      i += 1;
      if (closes) break;
    }
    return { html: '<div class="math">' + esc(block.join("\n")) + "</div>", at: i };
  }

  function isBlank(line) { return !line.trim(); }

  function listItem(line) {
    var bullet = line.match(BULLET);
    if (bullet) {
      return {
        indent: bullet[1].replace(/\t/g, "  ").length,
        ordered: false,
        number: 0,
        text: bullet[3]
      };
    }
    var numbered = line.match(NUMBER);
    if (numbered) {
      return {
        indent: numbered[1].replace(/\t/g, "  ").length,
        ordered: true,
        number: Number(numbered[2]),
        text: numbered[3]
      };
    }
    return null;
  }

  function renderList(items) {
    var ordered = items[0].ordered;
    var start = ordered && items[0].number > 1 ? ' start="' + items[0].number + '"' : "";
    var lis = [];
    var i = 0;

    while (i < items.length) {
      var item = items[i];
      var kids = [];
      var j = i + 1;
      while (j < items.length && items[j].indent > item.indent) {
        kids.push(items[j]);
        j += 1;
      }
      lis.push(
        "<li>" + inline(item.text) +
        (kids.length ? renderList(kids) : "") +
        "</li>"
      );
      i = j;
    }

    return "<" + (ordered ? "ol" + start : "ul") + ">" + lis.join("") + "</" + (ordered ? "ol" : "ul") + ">";
  }

  function render(markdown) {
    var lines = String(markdown || "").replace(/\r\n?/g, "\n").split("\n");
    var out = [];
    var i = 0;

    while (i < lines.length) {
      var line = lines[i];

      if (isBlank(line)) { i += 1; continue; }

      if (FENCE.test(line)) {
        var buf = [];
        i += 1;
        while (i < lines.length && !FENCE.test(lines[i])) { buf.push(lines[i]); i += 1; }
        i += 1;
        out.push("<pre><code>" + esc(buf.join("\n")) + "</code></pre>");
        continue;
      }

      var heading = line.match(HEADING);
      if (heading) {
        var level = heading[1].length === 1 ? 2 : heading[1].length;
        out.push("<h" + level + ">" + inline(heading[2]) + "</h" + level + ">");
        i += 1;
        continue;
      }

      if (RULE.test(line)) { out.push("<hr>"); i += 1; continue; }

      if (MATH.test(line)) {
        var block = renderMath(line, lines, i + 1);
        out.push(block.html);
        i = block.at;
        continue;
      }

      if (QUOTE.test(line)) {
        var quote = [];
        while (i < lines.length && QUOTE.test(lines[i])) {
          quote.push(lines[i].replace(/^\s*>\s?/, ""));
          i += 1;
        }
        out.push("<blockquote>" + render(quote.join("\n")) + "</blockquote>");
        continue;
      }

      if (listItem(line)) {
        var items = [];
        while (i < lines.length) {
          var item = listItem(lines[i]);
          if (!item) break;
          items.push(item);
          i += 1;
        }
        out.push(renderList(items));
        continue;
      }

      var para = [];
      while (
        i < lines.length &&
        !isBlank(lines[i]) &&
        !listItem(lines[i]) &&
        !HEADING.test(lines[i]) &&
        !QUOTE.test(lines[i]) &&
        !FENCE.test(lines[i]) &&
        !RULE.test(lines[i]) &&
        !MATH.test(lines[i])
      ) {
        para.push(lines[i].trim());
        i += 1;
      }
      if (para.length) out.push("<p>" + inline(para.join(" ")) + "</p>");
      else i += 1;
    }

    return out.join("");
  }

  /* the markdown files carry front matter, which the page does not need */
  function stripFrontMatter(raw) {
    return String(raw).replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/, "");
  }

  /* KaTeX turns the maths into type once it has arrived from the CDN, which
     can land after this script has drawn the post */
  function typeset(node) {
    var tries = 0;
    (function attempt() {
      if (window.renderMathInElement) {
        try {
          window.renderMathInElement(node, {
            delimiters: [
              { left: "$$", right: "$$", display: true },
              { left: "$", right: "$", display: false }
            ],
            throwOnError: false,
            strict: false
          });
        } catch (e) { /* leave the maths as it was written */ }
        return;
      }
      if (tries++ < 50) setTimeout(attempt, 100);
    })();
  }

  var slug = new URLSearchParams(window.location.search).get("p");
  var post = null;
  (window.POSTS || []).forEach(function (item) {
    if (item.slug === slug) post = item;
  });

  var titleEl = document.getElementById("postTitle");
  var dateEl = document.getElementById("postDate");
  var bodyEl = document.getElementById("postBody");

  if (!post) {
    document.title = "Not found / " + P.meta.name;
    if (titleEl) titleEl.textContent = "Not found";
    if (bodyEl) {
      bodyEl.innerHTML = '<p>That post does not exist. <a href="blog.html">Back to the blog</a>.</p>';
    }
    return;
  }

  document.title = post.title + " / " + P.meta.name;
  if (titleEl) titleEl.textContent = post.title;
  if (dateEl) dateEl.textContent = post.date;

  fetch("posts/" + encodeURIComponent(post.slug) + ".md")
    .then(function (res) { return res.ok ? res.text() : ""; })
    .then(function (raw) {
      var cover = post.image
        ? '<img class="post__cover" src="' + esc(post.image) + '" alt="">'
        : "";
      if (bodyEl) {
        bodyEl.innerHTML = cover + render(stripFrontMatter(raw));
        typeset(bodyEl);
      }
    })
    .catch(function () {
      if (bodyEl) {
        bodyEl.innerHTML = render(post.excerpt || "");
        typeset(bodyEl);
      }
    });
})();
