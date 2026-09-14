/* ==========================================================================
   scripts/markdown.mjs
   --------------------------------------------------------------------------
   The markdown renderer, shared. post.js has the same code inline so the
   site stays dependency free; this copy is what the editor preview uses, so
   the two always agree.

   Line based, the way markdown actually works:
     headings (#, ##, ###)      paragraphs
     fenced code                 blockquotes
     bullet lists (-, *, +)      numbered lists (any start, real numbers)
     nested lists (2 space indent)
     rules (---, ***, ___)
     inline: bold, italic, code, links, images
   ========================================================================== */

export function esc(value) {
  return String(value == null ? "" : value).replace(/[&<>"']/g, function (ch) {
    return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch];
  });
}

export function renderInline(text) {
  return esc(text)
    .replace(/!\[([^\]]*)\]\(([^)\s]+)\)/g, '<img src="$2" alt="$1">')
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/\*([^*]+)\*/g, "<em>$1</em>")
    .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, '<a href="$2" rel="noreferrer">$1</a>');
}

const BULLET = /^(\s*)([-*+])\s+(.*)$/;
const NUMBER = /^(\s*)(\d+)\.\s+(.*)$/;
const HEADING = /^(#{1,3})\s+(.*)$/;
const QUOTE = /^\s*>/;
const RULE = /^\s*(-{3,}|\*{3,}|_{3,})\s*$/;
const FENCE = /^\s*```/;
const MATH = /^\s*\$\$/;
const MATH_END = /\$\$\s*$/;

/* a $$ block is kept as one piece, so it is not folded into a paragraph.
   KaTeX renders it in the preview and on the page. */
function renderMath(start, lines, at) {
  const block = [start.trim()];
  let i = at;
  const single = MATH_END.test(start) && start.trim() !== "$$";
  while (!single && i < lines.length) {
    block.push(lines[i].trim());
    const closes = MATH_END.test(lines[i]);
    i += 1;
    if (closes) break;
  }
  return { html: '<div class="math">' + esc(block.join("\n")) + "</div>", at: i };
}

function isBlank(line) {
  return !line.trim();
}

function listItem(line) {
  const bullet = line.match(BULLET);
  if (bullet) {
    return {
      indent: bullet[1].replace(/\t/g, "  ").length,
      ordered: false,
      number: 0,
      text: bullet[3]
    };
  }
  const numbered = line.match(NUMBER);
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

/* items is a flat run; indentation decides nesting */
function renderList(items) {
  const ordered = items[0].ordered;
  const start = ordered && items[0].number > 1 ? ' start="' + items[0].number + '"' : "";
  const lis = [];
  let i = 0;

  while (i < items.length) {
    const item = items[i];
    const kids = [];
    let j = i + 1;
    while (j < items.length && items[j].indent > item.indent) {
      kids.push(items[j]);
      j += 1;
    }
    lis.push(
      "<li>" + renderInline(item.text) +
      (kids.length ? renderList(kids) : "") +
      "</li>"
    );
    i = j;
  }

  return "<" + (ordered ? "ol" + start : "ul") + ">" + lis.join("") + "</" + (ordered ? "ol" : "ul") + ">";
}

export function renderMarkdown(markdown) {
  const lines = String(markdown || "").replace(/\r\n?/g, "\n").split("\n");
  const out = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (isBlank(line)) {
      i += 1;
      continue;
    }

    if (FENCE.test(line)) {
      const buf = [];
      i += 1;
      while (i < lines.length && !FENCE.test(lines[i])) {
        buf.push(lines[i]);
        i += 1;
      }
      i += 1;
      out.push("<pre><code>" + esc(buf.join("\n")) + "</code></pre>");
      continue;
    }

    const heading = line.match(HEADING);
    if (heading) {
      const level = heading[1].length === 1 ? 2 : heading[1].length;
      out.push("<h" + level + ">" + renderInline(heading[2]) + "</h" + level + ">");
      i += 1;
      continue;
    }

    if (RULE.test(line)) {
      out.push("<hr>");
      i += 1;
      continue;
    }

    if (MATH.test(line)) {
      const block = renderMath(line, lines, i + 1);
      out.push(block.html);
      i = block.at;
      continue;
    }

    if (QUOTE.test(line)) {
      const buf = [];
      while (i < lines.length && QUOTE.test(lines[i])) {
        buf.push(lines[i].replace(/^\s*>\s?/, ""));
        i += 1;
      }
      out.push("<blockquote>" + renderMarkdown(buf.join("\n")) + "</blockquote>");
      continue;
    }

    if (listItem(line)) {
      const items = [];
      while (i < lines.length) {
        const item = listItem(lines[i]);
        if (!item) break;
        items.push(item);
        i += 1;
      }
      out.push(renderList(items));
      continue;
    }

    /* a paragraph runs until a blank line or the start of another block, so a
       list can interrupt it the way it does in a real editor */
    const buf = [];
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
      buf.push(lines[i].trim());
      i += 1;
    }
    if (buf.length) out.push("<p>" + renderInline(buf.join(" ")) + "</p>");
    else i += 1;
  }

  return out.join("");
}
