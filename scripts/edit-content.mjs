/* ==========================================================================
   scripts/edit-content.mjs
   --------------------------------------------------------------------------
   npm run edit

   One page for everything. It opens the main page exactly as it ships, with a
   small control beside every field, and it holds the writing too.

     the page      name, role, line, location, links, tabs, groups, items,
                   the song, and the three cars. every control can reorder.
     the writing   add, edit and delete posts, in the blog's own clothes,
                   with the real post preview

   Press Done and it writes content.js, then git add, commit and push.
   Saving a post writes posts/<slug>.md and rebuilds posts.js, so the single
   Done carries everything out together.

   Flags
     --port 4174   the port to serve on
     --no-git      write files but do not commit or push
     --no-open     do not open a browser
   ========================================================================== */

import http from "node:http";
import { readFile, writeFile, readdir, mkdir, unlink } from "node:fs/promises";
import { execFile } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildPosts, toSlug, parseFrontMatter } from "./build-posts.mjs";
import { renderMarkdown, esc } from "./markdown.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const contentFile = path.join(root, "content.js");
const postsDir = path.join(root, "posts");
const blogAssets = path.join(root, "assets", "blog");
const fileAssets = path.join(root, "assets", "files");

/* the preview renders at this width. The site column is 700px, so anything
   above 780 gives the same line breaks as the real page */
const VIEW = 800;

const args = process.argv.slice(2);
const port = Number(valueOf("--port") || 4174);
const useGit = args.indexOf("--no-git") === -1;
const shouldOpen = args.indexOf("--no-open") === -1;

function valueOf(flag) {
  const at = args.indexOf(flag);
  return at > -1 ? args[at + 1] : null;
}

function run(cmd, cmdArgs) {
  return new Promise((resolve) => {
    execFile(cmd, cmdArgs, { cwd: root }, (error, stdout, stderr) => {
      resolve({ ok: !error, out: (stdout || "") + (stderr || "") });
    });
  });
}

/* ------------------------------------------------------- the post preview */

function previewHtml(post) {
  const title = esc(post.title || "Untitled");
  const date = esc(post.date || "");
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Schibsted+Grotesk:wght@400;500;600;700&display=swap">
<link rel="stylesheet" href="styles.css">
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.css">
<script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.js"></script>
<script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/contrib/auto-render.min.js"></script>
<style>
  /* the page is one screen tall, but the preview needs its own height */
  html, body { height:auto; }
  body.doc { min-height:0; }
</style>
<title>preview</title>
</head>
<body class="doc">
<main class="blog">
  <a class="btn" href="#">
    <svg viewBox="0 0 14 12" aria-hidden="true"><path d="M13 6H1M6 1L1 6l5 5"/></svg>
    Back
  </a>
  <h1 class="blog__title">${title}</h1>
  <p class="blog__meta">${date}</p>
  <article class="prose">${renderMarkdown(post.body)}</article>
</main>
<script>
  (function () {
    var tries = 0;
    function typeset() {
      if (window.renderMathInElement) {
        try {
          renderMathInElement(document.body, {
            delimiters: [
              { left: "$$", right: "$$", display: true },
              { left: "$", right: "$", display: false }
            ],
            throwOnError: false,
            strict: false
          });
        } catch (e) { /* leave the maths as written */ }
        return;
      }
      if (tries++ < 50) setTimeout(typeset, 100);
    }
    window.addEventListener("DOMContentLoaded", typeset);
    if (document.readyState !== "loading") typeset();
  })();
</script>
</body>
</html>`;
}

/* --------------------------------------------------------------- the page */

const PAGE = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Edit</title>
<meta name="color-scheme" content="dark">
<link rel="icon" href="favicon.svg" type="image/svg+xml">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Schibsted+Grotesk:wght@400;500;600;700&display=swap">
<link rel="stylesheet" href="styles.css">
<style>
  /* The page keeps its shape. Every control sits inside the thing it changes,
     kept small and quiet so it reads as part of the page. */
  html, body { height:auto; min-height:100svh; overflow:auto; }
  .panels { max-height:none; overflow:visible; margin-right:0; padding-right:0; }
  .car canvas, .player iframe { pointer-events:none; }

  .edCtl { display:inline-flex; align-items:center; gap:.75rem; margin-left:.85rem;
           vertical-align:middle; white-space:nowrap; }
  .edCtl button { background:none; border:0; padding:0; font-family:inherit; font-size:.6rem;
                  letter-spacing:.16em; text-transform:uppercase; color:var(--fg-3);
                  cursor:pointer; transition:color .15s ease; }
  .edCtl button:hover { color:var(--fg); }
  .edCtl button:disabled { opacity:.25; cursor:default; }
  .edCtl button:disabled:hover { color:var(--fg-3); }

  /* a line of its own, for adding to a list */
  .edAdd { margin-top:.25rem; }
  .edAdd .edCtl { margin-left:0; }
  .label--blank { min-height:1.1em; }

  /* an item row keeps its year on the right, with the controls after it */
  .panels .row { justify-content:flex-start; }
  .panels .row__year { margin-left:auto; }

  /* the blog row puts its controls on the date line, so the title and the
     excerpt keep the blog's own width and line breaks */
  .post__head { display:flex; align-items:baseline; justify-content:space-between; gap:1rem; }
  .post__head .edCtl { margin-left:0; }

  /* the tab and link rows are one line each */
  .tabs .edCtl, .links .edCtl { margin-left:.85rem; }

  /* the dock that holds Done */
  .edDock { position:fixed; right:1.25rem; bottom:1.25rem; z-index:41; display:flex; align-items:center; gap:.6rem; }
  .edDock__hint { font-size:.72rem; color:var(--fg-3); }

  /* A sheet carries the page's own grain, so it reads like a page of the
     site and not a flat overlay. */
  .edSheet { position:fixed; inset:0; z-index:45; display:none; background:var(--bg); overflow:auto; }
  .edSheet::before {
    content:""; position:fixed; inset:0; z-index:-1; pointer-events:none; opacity:.16;
    background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='220' height='220'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='220' height='220' filter='url(%23n)'/%3E%3C/svg%3E");
  }
  .edSheet--on { display:block; }
  .edSheet--fill { overflow:hidden; }
  .edSheet--fill.edSheet--on { display:flex; flex-direction:column; }
  .edRow { display:flex; align-items:center; justify-content:space-between; gap:1rem; }
  .edRow__end { display:flex; align-items:center; gap:.6rem; }
  .edRow__count { font-size:.78rem; color:var(--fg-3); }

  .edSheet__bar { display:flex; align-items:center; gap:.9rem; padding:16px 22px; border-bottom:1px solid var(--rule); }
  .edSheet__title { font-size:.68rem; letter-spacing:.2em; text-transform:uppercase; color:var(--fg); }
  .edSheet__status { font-size:.78rem; color:var(--fg-3); }
  .edSheet__end { margin-left:auto; display:flex; align-items:center; gap:.6rem; }

  .edPost__fields { display:flex; flex-wrap:wrap; gap:1.75rem; padding:16px 22px; border-bottom:1px solid var(--rule); }
  .edPost__fields label { flex:1 1 200px; display:flex; flex-direction:column; gap:.4rem; }
  .edPost__fields span { font-size:.62rem; letter-spacing:.16em; text-transform:uppercase; color:var(--fg-3); }
  .edPost__fields input { background:none; border:0; border-bottom:1px solid var(--rule); color:var(--fg);
                          font-family:var(--font); font-size:1rem; padding:3px 0 6px; outline:none; color-scheme:dark; }
  .edPost__fields input::placeholder { color:var(--fg-3); }
  .edPost__fields input:focus { border-bottom-color:var(--fg-3); }

  .t { background:none; border:0; color:var(--fg-3); font-family:var(--font); font-size:.82rem;
       padding:5px 8px; border-radius:2px; cursor:pointer; transition:color .15s ease; }
  .t:hover { color:var(--fg); }
  .t__b { font-weight:600; }
  .t__i { font-style:italic; }
  .t__m { font-family:ui-monospace, Menlo, monospace; font-size:.76rem; }
  .edTools { display:flex; flex-wrap:wrap; align-items:center; gap:.1rem; padding:7px 18px; border-bottom:1px solid var(--rule); }
  .sep { width:1px; height:13px; background:var(--rule); margin:0 .45rem; }

  .edSplit { flex:1 1 auto; display:grid; grid-template-columns:1fr 1fr; min-height:0; }
  .edSplit textarea { border:0; border-right:1px solid var(--rule); background:none; color:var(--fg-2); resize:none;
                      padding:22px; outline:none; font-family:ui-monospace, "SFMono-Regular", Menlo, monospace;
                      font-size:13.5px; line-height:1.75; tab-size:2; }
  .edSplit__wrap { overflow:auto; background:var(--bg); }
  .edSplit__scale { position:relative; }
  .edSplit iframe { display:block; border:0; transform-origin:top left; background:var(--bg); }

  /* the small modal, for one field at a time */
  .edModal { position:fixed; inset:0; z-index:50; background:#060606d9; display:none; place-items:center; }
  .edModal--on { display:grid; }
  .edModal__box { width:min(560px, 100% - 3rem); max-height:80svh; overflow:auto; background:var(--bg);
                  border:1px solid var(--rule); border-radius:4px; padding:22px 24px 20px; }
  .edModal__title { font-size:.68rem; letter-spacing:.18em; text-transform:uppercase; color:var(--fg-3); }
  .edModal__fields label { display:block; margin-top:16px; }
  .edModal__fields span { display:block; font-size:.62rem; letter-spacing:.16em; text-transform:uppercase; color:var(--fg-3); }
  .edModal__fields input { width:100%; background:none; border:0; border-bottom:1px solid var(--rule); color:var(--fg);
                           font-family:var(--font); font-size:1rem; padding:3px 0 6px; outline:none; color-scheme:dark; }
  .edModal__fields input:focus { border-bottom-color:var(--fg-3); }
  .edModal__actions { display:flex; align-items:center; justify-content:flex-end; gap:.6rem; margin-top:24px; }
  .edGrow { flex:1 1 auto; }
  .edList { margin-top:16px; }
  .edList__row { display:flex; align-items:center; gap:1rem; padding:9px 0; border-top:1px solid var(--rule); }
  .edList__row span { flex:1 1 auto; font-size:.95rem; }
  .edList__row em { font-style:normal; font-size:.78rem; color:var(--fg-3); }
  .edList__row button { background:none; border:0; color:var(--fg-3); font-family:var(--font);
                        font-size:.74rem; text-transform:uppercase; letter-spacing:.08em; cursor:pointer; }
  .edList__row button:hover { color:var(--fg); }
  .edList__row button:disabled { opacity:.26; cursor:default; }
</style>
</head>
<body>
<a class="skip" href="#main">Skip to content</a>

<main class="page" id="main">
  <header class="intro" id="intro"></header>
  <nav class="tabs" id="tabs" role="tablist" aria-label="Sections"></nav>
  <div class="panels" id="panels"></div>
  <nav class="links" id="links" aria-label="Links"></nav>
  <div class="car" id="car"></div>
</main>

<footer class="foot" id="foot"></footer>

<div class="edDock">
  <span class="edDock__hint" id="edStatus">editing</span>
  <button class="btn" id="edTabs">tabs</button>
  <button class="btn" id="edPostsBtn">posts</button>
  <button class="btn" id="edCars">cars</button>
  <button class="btn btn--solid" id="edDone">Done</button>
</div>

<div class="edSheet" id="edPosts">
  <main class="blog">
    <div class="edRow">
      <a class="btn" id="edPostsBack" href="#">
        <svg viewBox="0 0 14 12" aria-hidden="true"><path d="M13 6H1M6 1L1 6l5 5"/></svg>
        Back
      </a>
      <span class="edRow__end">
        <span class="edRow__count" id="edPostsStatus"></span>
        <button class="btn btn--solid" id="edPostsNew">New post</button>
      </span>
    </div>
    <h1 class="blog__title" id="edPostsTitle"></h1>
    <p class="blog__note" id="edPostsNote"></p>
    <ul class="blog__list" id="edPostsList"></ul>
  </main>
</div>

<div class="edSheet edSheet--fill" id="edPost">
  <div class="edSheet__bar">
    <span class="edSheet__title">Post</span>
    <span class="edSheet__status" id="edPostStatus">new post</span>
    <span class="edSheet__end">
      <label class="btn">Cover<input id="edPostCover" type="file" accept="image/*" style="display:none"></label>
      <button class="btn" id="edPostDelete">Delete</button>
      <button class="btn btn--solid" id="edPostSave">Save &amp; push</button>
      <button class="btn" id="edPostBack">Back</button>
    </span>
  </div>

  <div class="edPost__fields">
    <label><span>Title</span><input id="edPostTitle" type="text" placeholder="A new post"></label>
    <label><span>Date</span><input id="edPostDate" type="date"></label>
    <label><span>Summary</span><input id="edPostExcerpt" type="text" placeholder="optional"></label>
  </div>

  <div class="edTools">
    <button class="t t__b" data-wrap="**" title="Bold">B</button>
    <button class="t t__i" data-wrap="*" title="Italic">I</button>
    <button class="t t__m" data-wrap="\`" title="Code">code</button>
    <span class="sep"></span>
    <button class="t" data-line="## " title="Heading">Heading</button>
    <button class="t" data-line="### " title="Small heading">Small</button>
    <button class="t" data-line="- " title="Bullet list">List</button>
    <button class="t" data-line="1. " title="Numbered list">1.</button>
    <button class="t" data-line="> " title="Quote">Quote</button>
    <span class="sep"></span>
    <button class="t" id="edPostLink" title="Link">Link</button>
    <button class="t" id="edPostImage" title="Upload an image">Image</button>
    <button class="t" id="edPostFile" title="Upload a file">File</button>
    <input id="edPostPicker" type="file" style="display:none">
  </div>

  <div class="edSplit">
    <textarea id="edPostBody" spellcheck="false"></textarea>
    <div class="edSplit__wrap" id="edPostWrap">
      <div class="edSplit__scale" id="edPostScale">
        <iframe id="edPostFrame" title="Post preview"></iframe>
      </div>
    </div>
  </div>
</div>

<div class="edModal" id="edModal">
  <div class="edModal__box">
    <p class="edModal__title" id="edModalTitle"></p>
    <div class="edModal__fields" id="edModalFields"></div>
    <div class="edList" id="edModalList"></div>
    <div class="edModal__actions">
      <button class="btn" id="edModalUp" title="Move up">↑</button>
      <button class="btn" id="edModalDown" title="Move down">↓</button>
      <span class="edGrow"></span>
      <button class="btn" id="edCancel">Cancel</button>
      <button class="btn btn--solid" id="edApply">Apply</button>
    </div>
  </div>
</div>

<script src="content.js"></script>
<script src="render.js"></script>
<script src="editor-client.js"></script>
<script type="importmap">
{
  "imports": {
    "three": "https://unpkg.com/three@0.160.0/build/three.module.js",
    "three/addons/": "https://unpkg.com/three@0.160.0/examples/jsm/"
  }
}
</script>
<script type="module" src="stage.js"></script>
</body>
</html>`;

/* --------------------------------------------------------------- the data */

function readJson(req) {
  return new Promise((resolve, reject) => {
    let raw = "";
    req.on("data", (chunk) => { raw += chunk; });
    req.on("end", () => {
      try { resolve(JSON.parse(raw || "{}")); }
      catch (e) { reject(e); }
    });
  });
}

function ok(res, payload) {
  res.writeHead(200, { "content-type": "application/json" });
  res.end(JSON.stringify(payload));
}

function fail(res, message) {
  res.writeHead(500, { "content-type": "application/json" });
  res.end(JSON.stringify({ ok: false, message: "Failed: " + message }));
}

/* content.js is a browser script, so read it through a fake window */
async function readContent() {
  const src = await readFile(contentFile, "utf8");
  const sandbox = {};
  new Function("window", src)(sandbox);
  return sandbox.PORTFOLIO;
}

function serialize(state) {
  return (
    "/* ==========================================================================\n" +
    "   content.js  |  the whole site\n" +
    "   --------------------------------------------------------------------------\n" +
    "   Written by npm run edit. Everything on the page renders from this object.\n" +
    "   ========================================================================== */\n\n" +
    "window.PORTFOLIO = " + JSON.stringify(state, null, 2) + ";\n"
  );
}

/* ------------------------------------------------------------ the writing */

async function listPosts() {
  let names = [];
  try {
    names = await readdir(postsDir);
  } catch (e) {
    names = [];
  }

  const posts = [];
  for (const file of names.filter((f) => f.endsWith(".md")).sort()) {
    const raw = await readFile(path.join(postsDir, file), "utf8");
    const { meta, body } = parseFrontMatter(raw);
    const slug = file.replace(/\.md$/, "");
    posts.push({
      slug,
      title: meta.title || slug,
      date: meta.date || "",
      excerpt: meta.excerpt || "",
      image: meta.image || "",
      body: body.replace(/\s+$/, "")
    });
  }

  posts.sort((a, b) => String(b.date).localeCompare(String(a.date)));
  return posts;
}

async function savePost(post) {
  const title = String(post.title || "").trim();
  if (!title) throw new Error("a title is needed");

  const slug = toSlug(title);
  const date = post.date || new Date().toISOString().slice(0, 10);
  const excerpt = String(post.excerpt || "").trim();

  let imagePath = post.image && post.image.indexOf("data:") === 0 ? "" : String(post.image || "");
  if (post.image && post.image.indexOf("data:") === 0) {
    const match = post.image.match(/^data:image\/([a-z+]+);base64,(.*)$/);
    if (match) {
      const ext = match[1] === "jpeg" ? "jpg" : match[1];
      await mkdir(blogAssets, { recursive: true });
      await writeFile(path.join(blogAssets, slug + "." + ext), Buffer.from(match[2], "base64"));
      imagePath = "assets/blog/" + slug + "." + ext;
    }
  }

  const front =
    "---\n" +
    "title: " + title + "\n" +
    "date: " + date + "\n" +
    "excerpt: " + excerpt + "\n" +
    "image: " + imagePath + "\n" +
    "---\n\n";

  await mkdir(postsDir, { recursive: true });
  await writeFile(path.join(postsDir, slug + ".md"), front + String(post.body || "").trim() + "\n");

  /* a changed title moves the file, so clear the one it left behind */
  if (post.original && post.original !== slug) {
    try { await unlink(path.join(postsDir, post.original + ".md")); } catch (e) { /* it was new */ }
  }

  await buildPosts();
  return { slug, image: imagePath };
}

async function deletePost(slug) {
  if (!slug) throw new Error("no post was named");
  const file = path.join(postsDir, slug + ".md");

  let image = "";
  try {
    const raw = await readFile(file, "utf8");
    image = parseFrontMatter(raw).meta.image || "";
  } catch (e) { /* already gone */ }

  try { await unlink(file); } catch (e) { /* already gone */ }
  if (image) {
    try { await unlink(path.join(root, image)); } catch (e) { /* shared or hand made */ }
  }

  await buildPosts();
  return { slug };
}

async function saveUpload(body) {
  const match = String(body.data || "").match(/^data:([^;,]+);base64,(.*)$/);
  if (!match) throw new Error("nothing to upload");
  const mime = match[1];
  let ext = (mime.split("/")[1] || "bin").replace(/[^a-z0-9]/gi, "");
  if (ext === "jpeg") ext = "jpg";

  const clean = String(body.name || "file").replace(/\.[^.]+$/, "").replace(/[^a-z0-9]+/gi, "-").toLowerCase();
  const stamp = Date.now().toString(36).slice(-4);
  const dir = body.kind === "image" ? blogAssets : fileAssets;
  await mkdir(dir, { recursive: true });
  const file = clean + "-" + stamp + "." + ext;
  await writeFile(path.join(dir, file), Buffer.from(match[2], "base64"));
  return (body.kind === "image" ? "assets/blog/" : "assets/files/") + file;
}

/* ------------------------------------------------------------------- git */

/* stage everything, commit it, and push. a fresh clone, or a branch made by
   hand, can arrive with no upstream, so set one on the first push. */
async function gitCommit(label, paths) {
  if (!useGit) return "--no-git was set, nothing was committed";

  /* only the files this change owns, so a post never sweeps up whatever else
     happens to be lying in the working tree */
  const add = await run("git", ["add", "-A", "--"].concat(paths || ["."]));
  if (!add.ok) return "git add failed:\n  " + add.out.trim();

  const commit = await run("git", ["commit", "-m", label]);
  const nothing = !commit.ok && /nothing to commit/i.test(commit.out);
  if (!commit.ok && !nothing) return "git commit failed:\n  " + commit.out.trim();

  let push = await run("git", ["push"]);
  if (!push.ok && /upstream/i.test(push.out)) {
    push = await run("git", ["push", "--set-upstream", "origin", "HEAD"]);
  }
  if (!push.ok) return "git push failed:\n  " + push.out.trim();

  return nothing ? "nothing new to commit, already up to date" : "committed and pushed";
}

async function saveContent(state) {
  await writeFile(contentFile, serialize(state));
  return "wrote content.js\n\n" + (await gitCommit("content: edit the page", ["content.js"]));
}

/* --------------------------------------------------------------- server */

function contentType(file) {
  if (file.endsWith(".css")) return "text/css; charset=utf-8";
  if (file.endsWith(".js") || file.endsWith(".mjs")) return "text/javascript; charset=utf-8";
  if (file.endsWith(".html")) return "text/html; charset=utf-8";
  if (file.endsWith(".svg")) return "image/svg+xml";
  if (file.endsWith(".glb")) return "model/gltf-binary";
  if (file.endsWith(".png")) return "image/png";
  if (file.endsWith(".jpg") || file.endsWith(".jpeg")) return "image/jpeg";
  return "application/octet-stream";
}

const server = http.createServer(async (req, res) => {
  const url = req.url.split("?")[0];

  if (req.method === "GET" && url === "/") {
    res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
    res.end(PAGE);
    return;
  }

  if (req.method === "GET" && url === "/editor-client.js") {
    try {
      const js = await readFile(path.join(root, "scripts", "editor-client.js"), "utf8");
      res.writeHead(200, { "content-type": "text/javascript; charset=utf-8" });
      res.end(js);
    } catch (e) {
      res.writeHead(404);
      res.end("");
    }
    return;
  }

  if (req.method === "GET" && url === "/state") {
    try {
      ok(res, await readContent());
    } catch (e) {
      fail(res, e.message);
    }
    return;
  }

  if (req.method === "GET" && url === "/posts") {
    try {
      ok(res, await listPosts());
    } catch (e) {
      fail(res, e.message);
    }
    return;
  }

  if (req.method === "POST" && url === "/preview") {
    try {
      ok(res, { ok: true, html: previewHtml(await readJson(req)) });
    } catch (e) {
      fail(res, e.message);
    }
    return;
  }

  if (req.method === "POST" && url === "/upload") {
    try {
      ok(res, { ok: true, path: await saveUpload(await readJson(req)) });
    } catch (e) {
      fail(res, e.message);
    }
    return;
  }

  if (req.method === "POST" && url === "/post/save") {
    try {
      const post = await readJson(req);
      const saved = await savePost(post);
      const posts = await listPosts();
      const message =
        "wrote posts/" + saved.slug + ".md\n" +
        "rebuilt posts.js (" + posts.length + " posts)\n\n" +
        (await gitCommit("post: " + (post.title || saved.slug), ["posts", "posts.js", "assets"]));
      ok(res, { ok: true, slug: saved.slug, posts: posts, message: message });
    } catch (e) {
      fail(res, e.message);
    }
    return;
  }

  if (req.method === "POST" && url === "/post/delete") {
    try {
      const body = await readJson(req);
      await deletePost(body.slug);
      const posts = await listPosts();
      const message =
        "deleted posts/" + body.slug + ".md\n" +
        "rebuilt posts.js (" + posts.length + " posts)\n\n" +
        (await gitCommit("post: delete " + body.slug, ["posts", "posts.js", "assets"]));
      ok(res, { ok: true, posts: posts, message: message });
    } catch (e) {
      fail(res, e.message);
    }
    return;
  }

  if (req.method === "POST" && url === "/save") {
    try {
      const body = await readJson(req);
      ok(res, { ok: true, message: await saveContent(body.state) });
    } catch (e) {
      fail(res, e.message);
    }
    return;
  }

  /* static: the files the page itself loads */
  if (req.method === "GET") {
    const safe = decodeURIComponent(url);
    const allowed =
      /^\/(styles\.css|render\.js|content\.js|posts\.js|blog\.js|post\.js|stage\.js|blog\.html|post\.html|favicon\.svg|resume\.pdf)$/.test(safe) ||
      (/^\/assets\/[A-Za-z0-9._\/-]+$/.test(safe) && safe.indexOf("..") === -1);

    if (allowed) {
      try {
        const file = await readFile(path.join(root, safe.slice(1)));
        res.writeHead(200, { "content-type": contentType(safe) });
        res.end(file);
      } catch (e) {
        res.writeHead(404);
        res.end("");
      }
      return;
    }
  }

  res.writeHead(404, { "content-type": "text/plain" });
  res.end("not found");
});

server.listen(port, () => {
  const url = "http://localhost:" + port;
  console.log("");
  console.log("  Editor running at " + url);
  console.log("  Every field has its own controls. Posts live behind the posts button.");
  console.log("  Press Done to write content.js and push.");
  console.log("");
  if (shouldOpen) execFile("open", [url], () => {});
});
