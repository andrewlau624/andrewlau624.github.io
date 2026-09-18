/* ==========================================================================
   algorithms.js  |  the visualizer shell
   --------------------------------------------------------------------------
   One shell, many algorithms. The shell owns the canvas, the clock, the three
   controls, the code panel and the progress line. An algorithm only yields
   events and lists the pseudocode line each event belongs to.

   Controls
     Next     one event. Space or the right arrow does the same
     Auto     run by itself, several events a frame
     Reset    back to the start. R
     Left     step back, with the left arrow

   To add an algorithm, write a module that yields events for an existing view
   and list it in algorithms/index.js. Nothing here changes.
   ========================================================================== */

import { algorithms, views } from "./algorithms/index.js";
import { mulberry32, clamp } from "./algorithms/util.js";

const EVENT_LIMIT = 400000;

const canvas = document.getElementById("algoCanvas");
const ctx = canvas ? canvas.getContext("2d") : null;

const els = {
  stage: document.getElementById("algoStage"),
  panel: document.getElementById("algoPanel"),
  bar: document.getElementById("algoBar"),
  list: document.getElementById("algoList"),
  name: document.getElementById("algoName"),
  blurb: document.getElementById("algoBlurb"),
  controls: document.getElementById("algoControls"),
  code: document.getElementById("algoCode")
};

const app = {
  algo: null,
  view: null,
  input: null,
  model: null,
  events: [],
  applied: 0,
  cursor: 0,
  line: -1,
  playing: false,
  seed: 1,
  params: {},
  open: new Set()
};
function esc(value) {
  return String(value == null ? "" : value).replace(/[&<>"']/g, function (ch) {
    return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch];
  });
}

function nextSeed() {
  return (Math.random() * 2147483647) | 0;
}

/* --------------------------------------------------------------- selection */

function select(id, scroll) {
  const algo = algorithms.find(function (a) { return a.id === id; }) || algorithms[0];
  app.algo = algo;
  app.view = views[algo.view];
  app.params = Object.assign({}, app.view.defaults, algo.defaults);
  app.seed = nextSeed();
  app.open.add(algo.view);

  rebuild();
  renderHead();
  renderList();
  renderControls();
  renderCode();
  setLine(app.line);

  try {
    history.replaceState(null, "", "#" + algo.id);
  } catch (e) {
    /* file:// and some sandboxes refuse history, and the page still works */
  }
  document.title = algo.name + " / Algorithms";

  if (scroll && els.panel) {
    els.panel.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

function rebuild() {
  const rng = mulberry32(app.seed);
  app.input = app.view.make(app.params, rng);

  app.events = [];
  for (const event of app.algo.run(app.input)) {
    app.events.push(event);
    if (app.events.length >= EVENT_LIMIT) break;
  }

  app.model = app.view.init(app.input);
  app.applied = 0;
  app.cursor = 0;
  app.line = -1;
  app.playing = false;
  updatePlay();
  setBar(0);
  paint();
}

/* ----------------------------------------------------------------- stepping */

function lineFor(algo, event) {
  const map = algo.lines;
  if (!map) return -1;
  if (typeof map === "function") return map(event);
  const line = map[event[0]];
  return line == null ? -1 : line;
}

function applyEvent(event) {
  if (event[0] === "line") {
    app.line = event[1];
    app.view.apply(app.model, event.slice(2));
  } else {
    const line = lineFor(app.algo, event);
    if (line >= 0) app.line = line;
    app.view.apply(app.model, event);
  }
}

function seek(target) {
  target = clamp(Math.round(target), 0, app.events.length);
  if (target < app.applied) {
    app.model = app.view.init(app.input);
    app.applied = 0;
    app.line = -1;
  }
  while (app.applied < target) {
    applyEvent(app.events[app.applied]);
    app.applied += 1;
  }
  app.cursor = target;
  setBar(target);
  setLine(app.line);
  paint();
}

function act(name) {
  if (name === "next") {
    app.playing = false;
    updatePlay();
    if (app.cursor >= app.events.length) return;
    seek(app.cursor + 1);
  } else if (name === "back") {
    app.playing = false;
    updatePlay();
    seek(app.cursor - 1);
  } else if (name === "auto") {
    togglePlay();
  } else if (name === "reset") {
    app.playing = false;
    updatePlay();
    seek(0);
  }
}

function togglePlay() {
  if (!app.events.length) return;
  if (!app.playing && app.cursor >= app.events.length) seek(0);
  app.playing = !app.playing;
  updatePlay();
}

function updatePlay() {
  const button = els.controls && els.controls.querySelector('[data-act="auto"]');
  if (button) button.textContent = app.playing ? "Pause" : "Auto";
}

/* ------------------------------------------------------------------- paint */

function paint() {
  if (!ctx || !app.model) return;
  const rect = canvas.getBoundingClientRect();
  const w = rect.width;
  const h = rect.height;
  if (w < 1 || h < 1) return;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const pw = Math.round(w * dpr);
  const ph = Math.round(h * dpr);
  if (canvas.width !== pw || canvas.height !== ph) {
    canvas.width = pw;
    canvas.height = ph;
  }
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, w, h);
  app.view.draw(ctx, app.model, w, h);
}

function loop() {
  if (app.playing) {
    const steps = Math.max(1, Math.floor(app.events.length / 420));
    const next = app.cursor + steps;
    if (next >= app.events.length) {
      seek(app.events.length);
      app.playing = false;
      updatePlay();
    } else {
      seek(next);
    }
  }
  requestAnimationFrame(loop);
}

/* ---------------------------------------------------------------- the page */

function renderHead() {
  els.name.textContent = app.algo.name;
  els.blurb.textContent = app.algo.blurb || "";
}

function renderList() {
  els.list.innerHTML = Object.keys(views).map(function (f) {
    const items = algorithms.filter(function (a) { return a.view === f; });
    if (!items.length) return "";
    const open = app.open.has(f) || (app.algo && app.algo.view === f);
    return '<div class="algo__group' + (open ? " is-open" : "") + '">' +
      '<button type="button" class="algo__group-toggle" data-group="' + esc(f) + '"' +
        ' aria-expanded="' + open + '">' +
        '<span class="label">' + esc(views[f].label) + "</span>" +
        '<svg viewBox="0 0 10 6" aria-hidden="true"><path d="M1 1l4 4 4-4"/></svg>' +
      "</button>" +
      "<ul>" + items.map(function (a) {
        return '<li><button type="button" class="algo__pick' +
          (app.algo && a.id === app.algo.id ? " is-active" : "") +
          '" data-id="' + esc(a.id) + '">' +
            '<span class="algo__pick-name">' + esc(a.name) + "</span>" +
          "</button></li>";
      }).join("") + "</ul></div>";
  }).join("");

  els.list.querySelectorAll(".algo__group-toggle").forEach(function (button) {
    button.addEventListener("click", function () {
      const group = button.closest(".algo__group");
      const open = group.classList.toggle("is-open");
      button.setAttribute("aria-expanded", String(open));
      const f = button.getAttribute("data-group");
      if (open) app.open.add(f);
      else app.open.delete(f);
    });
  });

  els.list.querySelectorAll("button[data-id]").forEach(function (button) {
    button.addEventListener("click", function () {
      select(button.getAttribute("data-id"), true);
    });
  });
}

function renderControls() {
  els.controls.innerHTML =
    '<button class="btn btn--solid" type="button" data-act="next">Next</button>' +
    '<button class="btn" type="button" data-act="auto">Auto</button>' +
    '<button class="btn" type="button" data-act="reset">Reset</button>';

  els.controls.querySelectorAll("button[data-act]").forEach(function (button) {
    button.addEventListener("click", function () { act(button.getAttribute("data-act")); });
  });
}

function renderCode() {
  const lines = app.algo.code || [];
  const time = [app.algo.time, app.algo.omega, app.algo.theta].filter(Boolean);
  const rows = [];
  if (time.length) rows.push(["time", time]);
  if (app.algo.space) rows.push(["space", [app.algo.space]]);
  const costs = rows.map(function (row) {
    return "<p>" +
      '<span class="algo__costs-label">' + esc(row[0]) + "</span>" +
      '<span class="algo__costs-values">' +
        row[1].map(function (bound) { return "<span>" + esc(bound) + "</span>"; }).join("") +
      "</span>" +
      "</p>";
  }).join("");
  els.code.innerHTML = "<ol>" + lines.map(function (line) {
    return "<li>" + (line ? esc(line) : "&nbsp;") + "</li>";
  }).join("") + "</ol>" +
    (costs ? '<div class="algo__costs">' + costs + "</div>" : "");
}

function setLine(n) {
  if (!els.code) return;
  const items = els.code.querySelectorAll("li");
  for (let i = 0; i < items.length; i += 1) {
    items[i].classList.toggle("is-on", i === n);
  }
}

function setBar(at) {
  if (!els.bar) return;
  const pct = app.events.length ? (at / app.events.length) * 100 : 0;
  els.bar.style.width = pct + "%";
}

/* -------------------------------------------------------------------- boot */

function start() {
  if (!canvas || !ctx || !els.list || !algorithms.length) return;

  const fromHash = (window.location.hash || "").replace("#", "");
  select(fromHash || algorithms[0].id);

  window.addEventListener("hashchange", function () {
    const id = (window.location.hash || "").replace("#", "");
    if (app.algo && id && id !== app.algo.id) select(id);
  });

  window.addEventListener("keydown", function (event) {
    if (event.metaKey || event.ctrlKey || event.altKey) return;
    if (/^(input|textarea|select)$/i.test(event.target.tagName)) return;
    if (event.key === "ArrowRight" || event.key === " ") {
      event.preventDefault();
      act("next");
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      act("back");
    } else if (event.key === "r" || event.key === "R") {
      act("reset");
    } else if (event.key === "a" || event.key === "A") {
      act("auto");
    }
  });

  if (window.ResizeObserver && els.stage) {
    new ResizeObserver(paint).observe(els.stage);
  }
  window.addEventListener("resize", paint);

  requestAnimationFrame(loop);
}

start();
