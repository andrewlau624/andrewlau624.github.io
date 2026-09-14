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

  function linkRel(href) {
    return /^https?:\/\//i.test(href) ? ' target="_blank" rel="noreferrer"' : "";
  }

  function inline(text) {
    return esc(text)
      .replace(/!\[([^\]]*)\]\(([^)\s]+)\)/g, '<img src="$2" alt="$1">')
      .replace(/`([^`]+)`/g, "<code>$1</code>")
      .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
      .replace(/\*([^*]+)\*/g, "<em>$1</em>")
      /* a link with no text falls back to the address, so it is never blank */
      .replace(/\[([^\]]*)\]\(([^)\s]+)\)/g, function (whole, label, href) {
        return '<a href="' + href + '"' + linkRel(href) + ">" + (label || href) + "</a>";
      });
  }

  var BULLET = /^(\s*)([-*+])\s+(.*)$/;
  var NUMBER = /^(\s*)(\d+)\.\s+(.*)$/;
  var HEADING = /^(#{1,3})\s+(.*)$/;
  var QUOTE = /^\s*>/;
  var RULE = /^\s*(-{3,}|\*{3,}|_{3,})\s*$/;
  var FENCE = /^\s*```/;
  var MATH = /^\s*\$\$/;
  var MATH_END = /\$\$\s*$/;
  var TABLE_SEP = /^\s*\|?\s*:?-{1,}:?\s*(\|\s*:?-{1,}:?\s*)+\|?\s*$/;

  /* a table is a row, a rule, then rows. the rule carries the alignment. */
  function tableAt(lines, i) {
    return i + 1 < lines.length && lines[i].indexOf("|") !== -1 && TABLE_SEP.test(lines[i + 1]);
  }

  function splitRow(line) {
    var s = String(line).trim();
    if (s.charAt(0) === "|") s = s.slice(1);
    if (s.charAt(s.length - 1) === "|") s = s.slice(0, -1);
    return s.split("|").map(function (cell) { return cell.trim(); });
  }

  function tableAlign(sep) {
    return splitRow(sep).map(function (cell) {
      var left = cell.charAt(0) === ":";
      var right = cell.charAt(cell.length - 1) === ":";
      if (left && right) return "center";
      if (right) return "right";
      if (left) return "left";
      return "";
    });
  }

  function renderTable(header, align, rows) {
    function cell(tag, text, at) {
      var style = align[at] ? ' style="text-align:' + align[at] + '"' : "";
      return "<" + tag + style + ">" + inline(text) + "</" + tag + ">";
    }
    var head = header.map(function (text, at) { return cell("th", text, at); }).join("");
    var body = rows.map(function (row) {
      return "<tr>" + row.map(function (text, at) { return cell("td", text, at); }).join("") + "</tr>";
    }).join("");
    return "<table><thead><tr>" + head + "</tr></thead><tbody>" + body + "</tbody></table>";
  }

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

      if (tableAt(lines, i)) {
        var header = splitRow(line);
        var align = tableAlign(lines[i + 1]);
        i += 2;
        var rows = [];
        while (i < lines.length && !isBlank(lines[i]) && lines[i].indexOf("|") !== -1 && !tableAt(lines, i)) {
          rows.push(splitRow(lines[i]));
          i += 1;
        }
        out.push(renderTable(header, align, rows));
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
        !MATH.test(lines[i]) &&
        !tableAt(lines, i)
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
  if (dateEl) {
    dateEl.innerHTML = esc(post.date) +
      (post.category
        ? ' · <a href="blog.html?c=' + encodeURIComponent(post.categoryKey) + '">' +
            esc(post.category) + "</a>"
        : "");
  }

  /* a slug can be llms/intro-to-llms, so encode each part, not the slash */
  var rel = post.slug.split("/").map(encodeURIComponent).join("/");
  fetch("posts/" + rel + ".md")
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
