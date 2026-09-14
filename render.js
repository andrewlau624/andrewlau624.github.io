/* ==========================================================================
   render.js  |  components
   --------------------------------------------------------------------------
   One column: name, the tabs and their panels, links, and the car. All from
   window.PORTFOLIO.

   `window.renderPortfolio(P)` redraws everything except the car, so the
   editor can redraw after an edit without tearing down the 3D canvas.
   ========================================================================== */

(function () {
  "use strict";

  var P = window.PORTFOLIO;
  if (!P) {
    console.error("content.js did not load, so there is nothing to render.");
    return;
  }

  function esc(value) {
    return String(value == null ? "" : value).replace(/[&<>"']/g, function (ch) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch];
    });
  }

  function each(items, fn) {
    return (items || []).map(fn).join("");
  }

  function rel(href) {
    return /^https?:\/\//i.test(href || "") ? ' target="_blank" rel="noreferrer"' : "";
  }

  /* one line of a list: the name, a quiet note, and the year on the right */
  function row(item) {
    var inner =
      '<span class="row__name">' +
        '<span class="row__label">' + esc(item.name) + "</span>" +
        (item.note ? '<em>' + esc(item.note) + "</em>" : "") +
      "</span>" +
      (item.year ? '<span class="row__year">' + esc(item.year) + "</span>" : "");

    return (
      "<li>" +
        (item.href
          ? '<a class="row" href="' + esc(item.href) + '"' + rel(item.href) +
              ' aria-label="' + esc(item.name) + '">' + inner + "</a>"
          : '<span class="row">' + inner + "</span>") +
      "</li>"
    );
  }

  function groups(tab) {
    var many = tab.groups.length > 1;
    return each(tab.groups, function (group) {
      return (
        '<div class="group">' +
          (many ? '<p class="label">' + esc(group.label) + "</p>" : "") +
          '<ul class="rows">' + each(group.items, row) + "</ul>" +
        "</div>"
      );
    });
  }

  /* turns any open.spotify.com link into an embed */
  function spotify(url) {
    if (!url) return null;
    var m = String(url).match(/(track|album|playlist|artist|episode|show)[/:]([A-Za-z0-9]+)/);
    if (!m) return null;
    var tall = m[1] === "album" || m[1] === "playlist" || m[1] === "artist" || m[1] === "show";
    return {
      src: "https://open.spotify.com/embed/" + m[1] + "/" + m[2] + "?theme=0",
      height: tall ? 352 : 152
    };
  }

  function player(data) {
    var embed = spotify(data.song && data.song.url);
    if (!embed) {
      return '<div class="player player--empty"><span>Song</span></div>';
    }
    return (
      '<div class="player">' +
        '<div class="player__frame" style="height:' + embed.height + 'px">' +
          '<iframe title="Song" src="' + esc(embed.src) + '" loading="lazy" ' +
            'allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture">' +
          "</iframe>" +
        "</div>" +
      "</div>"
    );
  }

  /* the arrow keys, drawn small, in place of a sentence */
  function keyArrows(label) {
    var paths = {
      left: "M11 6H1M6 1L1 6l5 5",
      up: "M6 11V1M1 6l5-5 5 5",
      down: "M6 1v10M1 6l5 5 5-5",
      right: "M1 6h10M6 1l5 5-5 5"
    };
    return (
      '<span class="car__keys" role="img" aria-label="' + esc(label) + '">' +
        Object.keys(paths).map(function (dir) {
          return '<svg viewBox="0 0 12 12" aria-hidden="true"><path d="' +
            paths[dir] + '"/></svg>';
        }).join("") +
      "</span>"
    );
  }

  /* --------------------------------------------------------------- pieces */

  function intro(data) {
    return (
      '<h1 class="name">' + esc(data.meta.name) + "</h1>" +
      '<p class="role">' + esc(data.meta.role) + ", " + esc(data.meta.school) + "</p>" +
      '<p class="bio">' + esc(data.intro.bio) + "</p>"
    );
  }

  function tabRow(data) {
    return (
      each(data.tabs, function (tab, i) {
        return (
          '<button class="tab' + (i === 0 ? " is-active" : "") + '"' +
            ' type="button" role="tab"' +
            ' id="tab-' + esc(tab.id) + '"' +
            ' aria-controls="panel-' + esc(tab.id) + '"' +
            ' aria-selected="' + (i === 0 ? "true" : "false") + '"' +
            ' data-tab="' + esc(tab.id) + '">' + esc(tab.label) + "</button>"
        );
      }) +
      (data.blog
        ? '<a class="tab tab--link" href="' + esc(data.blog.href) + '">' +
            esc(data.blog.label) +
            '<svg viewBox="0 0 12 12" aria-hidden="true"><path d="M2.5 9.5L9.5 2.5M4.5 2.5h5v5"/></svg>' +
          "</a>"
        : "")
    );
  }

  function panelRow(data) {
    return each(data.tabs, function (tab, i) {
      return (
        '<section class="panel' + (i === 0 ? " is-active" : "") + '"' +
          ' role="tabpanel"' +
          ' id="panel-' + esc(tab.id) + '"' +
          ' aria-labelledby="tab-' + esc(tab.id) + '"' +
          ' data-panel="' + esc(tab.id) + '">' +
          groups(tab) +
          (tab.player ? player(data) : "") +
        "</section>"
      );
    });
  }

  function linkRow(data) {
    return each(data.links, function (link) {
      return '<a href="' + esc(link.href) + '"' + rel(link.href) + ">" +
        esc(link.label) + "</a>";
    });
  }

  function carBox(data) {
    return (
      '<canvas id="stage" aria-label="A drivable three dimensional model of a supercar"></canvas>' +
      '<div class="car__fallback"><span>Serve locally to drive the car</span></div>' +
      '<button class="car__arrow car__arrow--prev" id="carPrev" type="button" aria-label="Previous car">' +
        '<svg viewBox="0 0 10 16" aria-hidden="true"><path d="M8 1L2 8l6 7"/></svg>' +
      "</button>" +
      '<button class="car__arrow car__arrow--next" id="carNext" type="button" aria-label="Next car">' +
        '<svg viewBox="0 0 10 16" aria-hidden="true"><path d="M2 1l6 7-6 7"/></svg>' +
      "</button>" +
      keyArrows(data.car.note) +
      '<div class="car__hud">' +
        '<span><b id="speed">0</b> km/h</span>' +
        '<span><b id="dist">0</b> m</span>' +
      "</div>"
    );
  }

  /* ---------------------------------------------------------------- paint */

  var activeTab = null;

  function wireTabs() {
    var tabs = document.querySelectorAll(".tab[data-tab]");
    var panels = document.querySelectorAll(".panel");

    function activate(id) {
      activeTab = id;
      Array.prototype.forEach.call(tabs, function (button) {
        var on = button.getAttribute("data-tab") === id;
        button.classList.toggle("is-active", on);
        button.setAttribute("aria-selected", String(on));
      });
      Array.prototype.forEach.call(panels, function (panel) {
        panel.classList.toggle("is-active", panel.getAttribute("data-panel") === id);
      });
    }

    Array.prototype.forEach.call(tabs, function (button) {
      button.addEventListener("click", function () {
        activate(button.getAttribute("data-tab"));
      });
    });

    if (activeTab && document.getElementById("panel-" + activeTab)) activate(activeTab);
  }

  /* redraw everything except the car, so the 3D canvas survives */
  function paint(data) {
    data = data || window.PORTFOLIO;

    var introEl = document.getElementById("intro");
    var tabsEl = document.getElementById("tabs");
    var panelsEl = document.getElementById("panels");
    var linksEl = document.getElementById("links");
    var footEl = document.getElementById("foot");

    if (introEl) introEl.innerHTML = intro(data);
    if (tabsEl) tabsEl.innerHTML = tabRow(data);
    if (panelsEl) panelsEl.innerHTML = panelRow(data);
    if (linksEl) linksEl.innerHTML = linkRow(data);
    if (footEl) footEl.innerHTML = '<span>' + esc(data.meta.location) + "</span>";

    if (!activeTab) activeTab = data.tabs.length ? data.tabs[0].id : null;
    wireTabs();

    document.title = data.meta.name;
    var description = document.querySelector('meta[name="description"]');
    if (description) description.setAttribute("content", data.intro.bio);

    if (window.EDITOR) window.EDITOR.afterPaint();
  }

  paint(P);

  var carEl = document.getElementById("car");
  if (carEl) carEl.innerHTML = carBox(P);

  window.renderPortfolio = paint;
})();
