/* ==========================================================================
   scripts/editor-client.js
   --------------------------------------------------------------------------
   The editing layer behind npm run edit. It loads after render.js has drawn
   the real page, then hands every field a small set of controls:

     up, down        reorder it in its list
     edit            change its fields
     del             remove it
     add             grow a list

   On the page the controls sit in the right margin, in one column, so they
   line up. The tab and link rows keep theirs inline, because they are one
   line each. The writing list is the real blog list, with controls on it.

   Press Done and the server writes content.js, then commits and pushes.
   Saving a post writes posts/<slug>.md and rebuilds posts.js, so one Done
   carries all of it out.

   Loaded only by scripts/edit-content.mjs.
   ========================================================================== */

(function () {
  "use strict";

  var S = window.PORTFOLIO;
  if (!S) {
    console.error("content.js did not load, so there is nothing to edit.");
    return;
  }

  /* the preview renders at this width, so the line breaks match the site */
  var VIEW = 800;
  var today = function () { return new Date().toISOString().slice(0, 10); };

  function el(id) { return document.getElementById(id); }
  function q(sel, root) { return (root || document).querySelector(sel); }
  function qa(sel, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(sel));
  }

  var modal = q("#edModal");
  var modalTitle = q("#edModalTitle");
  var modalFields = q("#edModalFields");
  var modalList = q("#edModalList");
  var applyBtn = q("#edApply");
  var statusEl = q("#edStatus");

  var formTarget = null;

  /* =========================================================== the page == */

  function move(list, from, to) {
    if (to < 0 || to >= list.length) return;
    var item = list.splice(from, 1)[0];
    list.splice(to, 0, item);
  }

  function tabById(id) {
    for (var i = 0; i < S.tabs.length; i++) if (S.tabs[i].id === id) return S.tabs[i];
    return null;
  }

  function target(title, obj, fields) {
    return { title: title, obj: obj, fields: fields };
  }

  /* a target that can be moved and removed inside a list */
  function listTarget(base, list, index) {
    base.up = function () { move(list, index, index - 1); };
    base.upOff = index === 0;
    base.down = function () { move(list, index, index + 1); };
    base.downOff = index === list.length - 1;
    base.remove = function () { list.splice(index, 1); };
    return base;
  }

  function itemTarget(item, list, index) {
    return listTarget({
      title: "Item",
      obj: item,
      fields: [["name", "Name"], ["note", "Note"], ["year", "Year"], ["href", "Link"]]
    }, list, index);
  }

  function carTarget(car, index) {
    return listTarget({
      title: "Car",
      obj: car,
      fields: [
        ["name", "Name"],
        ["src", "Model file"],
        ["color", "Colour"],
        ["accel", "Acceleration, m/s2"],
        ["top", "Top speed, km/h"]
      ],
      afterSave: function () { openList("cars"); },
      cancelTo: function () { openList("cars"); }
    }, S.car.models, index);
  }

  function linkTarget(link, index) {
    return listTarget({
      title: "Link",
      obj: link,
      fields: [["label", "Label"], ["href", "Link"]]
    }, S.links, index);
  }

  function tabTarget(tab, index) {
    return listTarget({
      title: "Tab",
      obj: tab,
      fields: [["label", "Label"], ["id", "Id"]]
    }, S.tabs, index);
  }

  function groupTarget(tab, group, index) {
    return listTarget({
      title: "Group",
      obj: group,
      fields: [["label", "Label"]]
    }, tab.groups, index);
  }

  function additionsOf(kind, make) {
    return {
      addLabel: kind,
      add: function () { return make(); }
    };
  }

  var linkAdd = additionsOf("add link", function () {
    var link = { label: "New link", href: "https://" };
    S.links.push(link);
    return linkTarget(link, S.links.length - 1);
  });

  var tabAdd = additionsOf("add tab", function () {
    var tab = { id: "tab-" + Date.now().toString(36), label: "New tab", groups: [{ label: "", items: [] }] };
    S.tabs.push(tab);
    return tabTarget(tab, S.tabs.length - 1);
  });

  function groupAdd(tab) {
    return additionsOf("add group", function () {
      var group = { label: "New group", items: [] };
      tab.groups.push(group);
      return groupTarget(tab, group, tab.groups.length - 1);
    });
  }

  function itemAdd(group) {
    return additionsOf("add item", function () {
      var item = { name: "New item", note: "", year: "" };
      group.items.push(item);
      return itemTarget(item, group.items, group.items.length - 1);
    });
  }

  /* -------------------------------------------------------------- controls */

  function button(label, onClick, title, disabled) {
    var b = document.createElement("button");
    b.type = "button";
    b.textContent = label;
    if (title) b.title = title;
    if (disabled) b.disabled = true;
    b.addEventListener("click", function (e) {
      e.preventDefault();
      e.stopPropagation();
      if (!disabled) onClick();
    });
    return b;
  }

  function cluster(items) {
    var wrap = document.createElement("span");
    wrap.className = "edCtl";
    items.forEach(function (item) {
      if (!item) return;
      wrap.appendChild(button(item[0], item[1], item[2], item[3]));
    });
    return wrap;
  }

  function runAdd(t) {
    var next = t.add();
    redraw();
    if (next) openForm(next);
  }

  function controls(t) {
    var items = [];
    if (t.up) items.push(["↑", function () { t.up(); redraw(); }, "Move up", t.upOff]);
    if (t.down) items.push(["↓", function () { t.down(); redraw(); }, "Move down", t.downOff]);
    if (t.fields) items.push(["edit", function () { openForm(t); }, "Edit " + t.title.toLowerCase()]);
    if (t.remove) items.push(["del", function () { t.remove(); redraw(); }, "Delete " + t.title.toLowerCase()]);
    if (t.add) items.push([t.addLabel || "add", function () { runAdd(t); }, t.addLabel]);
    return cluster(items);
  }

  /* a block hands its controls to the right margin. placeControls lines them up */
  function intoBlock(node, t) {
    if (!node) return;
    node.classList.add("edBlock");
    node.appendChild(controls(t));
  }

  function addBlock(t) {
    var wrap = document.createElement("div");
    wrap.className = "edBlock edAdd";
    wrap.appendChild(controls(t));
    return wrap;
  }

  function addInline(t) {
    var wrap = cluster([[t.addLabel || "add", function () { runAdd(t); }, t.addLabel]]);
    wrap.className = "edCtl edCtl--add";
    return wrap;
  }

  function after(node, next) {
    if (node && node.parentNode) node.parentNode.insertBefore(next, node.nextSibling);
  }

  /* line every block control up in the right margin of its container */
  function placeControls() {
    qa(".edBlock > .edCtl").forEach(function (ctl) {
      var block = ctl.parentNode;
      var host = block.closest(".foot") || block.closest(".page") || block.closest(".blog");
      if (!host) return;
      var b = block.getBoundingClientRect();
      var h = host.getBoundingClientRect();
      ctl.style.top = Math.round(b.top - h.top + b.height / 2) + "px";
      ctl.style.left = Math.round(h.width + 14) + "px";
    });
  }

  function annotate() {
    S = window.PORTFOLIO;

    /* the intro: name, role, line, and the location in the footer */
    intoBlock(q("#intro .name"), target("Name", S.meta, [["name", "Name"]]));
    intoBlock(q("#intro .role"), target("Role", S.meta, [["role", "Role"], ["school", "School"]]));
    intoBlock(q("#intro .bio"), target("Intro line", S.intro, [["bio", "Line"]]));
    intoBlock(q("#foot"), target("Location", S.meta, [["location", "Location"]]));

    /* the links row stays on one line, so its controls sit inline */
    qa("#links a").forEach(function (a, i) {
      if (!S.links[i]) return;
      after(a, controls(linkTarget(S.links[i], i)));
    });
    var linksNav = q("#links");
    if (linksNav) linksNav.appendChild(addInline(linkAdd));

    /* the tabs, and the blog tab, also on one line */
    qa("#tabs .tab[data-tab]").forEach(function (buttonEl) {
      var tab = tabById(buttonEl.getAttribute("data-tab"));
      if (!tab) return;
      after(buttonEl, controls(tabTarget(tab, S.tabs.indexOf(tab))));
    });
    after(q("#tabs .tab--link"), controls({
      title: "Blog tab",
      obj: S.blog,
      fields: [["label", "Label"], ["href", "Link"]]
    }));
    var tabsNav = q("#tabs");
    if (tabsNav) tabsNav.appendChild(addInline(tabAdd));

    /* the panels: groups and their items */
    qa("#panels .panel[data-panel]").forEach(function (panel) {
      var tab = tabById(panel.getAttribute("data-panel"));
      if (!tab) return;

      qa(".group", panel).forEach(function (groupEl, gi) {
        var group = tab.groups[gi];
        if (!group) return;

        var labelEl = q(".label", groupEl);
        if (!labelEl) {
          labelEl = document.createElement("p");
          labelEl.className = "label label--blank";
          groupEl.insertBefore(labelEl, groupEl.firstChild);
        }
        intoBlock(labelEl, groupTarget(tab, group, gi));

        var rowsEl = q(".rows", groupEl);
        if (rowsEl) {
          qa("li", rowsEl).forEach(function (li, ii) {
            if (group.items[ii]) intoBlock(li, itemTarget(group.items[ii], group.items, ii));
          });
          after(rowsEl, addBlock(itemAdd(group)));
        }
      });

      panel.appendChild(addBlock(groupAdd(tab)));

      var player = q(".player", panel);
      if (player) intoBlock(player, target("Song", S.song, [["url", "Spotify link"]]));
    });

    placeControls();
  }

  /* ------------------------------------------------------------- the modal */

  function openForm(t) {
    formTarget = t;
    modalTitle.textContent = t.title;
    modalFields.innerHTML = "";
    modalList.innerHTML = "";
    modalFields.style.display = "";
    applyBtn.style.display = "";

    (t.fields || []).forEach(function (pair) {
      var label = document.createElement("label");
      var key = document.createElement("span");
      key.textContent = pair[1];

      var input = document.createElement("input");
      input.type = "text";
      input.value = t.obj[pair[0]] == null ? "" : t.obj[pair[0]];
      input.setAttribute("data-key", pair[0]);

      label.appendChild(key);
      label.appendChild(input);
      modalFields.appendChild(label);
    });

    modal.classList.add("edModal--on");
    var first = q("input", modalFields);
    if (first) { first.focus(); first.select(); }
  }

  function openList(kind) {
    if (kind !== "cars") return;
    formTarget = null;
    modalTitle.textContent = "Cars";
    modalFields.innerHTML = "";
    modalFields.style.display = "none";
    applyBtn.style.display = "none";
    renderCarList();
    modal.classList.add("edModal--on");
  }

  function renderCarList() {
    modalList.innerHTML = "";

    S.car.models.forEach(function (car, i) {
      var row = document.createElement("div");
      row.className = "edList__row";

      var name = document.createElement("span");
      name.textContent = car.name;

      var meta = document.createElement("em");
      meta.textContent = car.accel + " m/s2, " + car.top + " km/h";

      row.appendChild(name);
      row.appendChild(meta);
      row.appendChild(button("↑", function () { move(S.car.models, i, i - 1); redraw(); renderCarList(); }, "Move up", i === 0));
      row.appendChild(button("↓", function () { move(S.car.models, i, i + 1); redraw(); renderCarList(); }, "Move down", i === S.car.models.length - 1));
      row.appendChild(button("edit", function () { openForm(carTarget(car, i)); }));
      row.appendChild(button("delete", function () {
        S.car.models.splice(i, 1);
        redraw();
        renderCarList();
      }));

      modalList.appendChild(row);
    });

    var addRow = document.createElement("div");
    addRow.className = "edList__row";
    addRow.appendChild(button("add car", function () {
      var car = { name: "New car", src: "assets/", color: "#a03328", accel: 10, top: 340 };
      S.car.models.push(car);
      redraw();
      openForm(carTarget(car, S.car.models.length - 1));
    }));
    modalList.appendChild(addRow);
  }

  function applyForm() {
    if (!formTarget) return;
    qa("input", modalFields).forEach(function (input) {
      var key = input.getAttribute("data-key");
      var value = input.value;
      if (key === "accel" || key === "top") value = Number(value) || 0;
      formTarget.obj[key] = value;
    });

    var next = formTarget.afterSave;
    redraw();
    if (next) next();
    else closeModal();
  }

  function closeModal() {
    modal.classList.remove("edModal--on");
    formTarget = null;
  }

  function showMessage(text) {
    formTarget = null;
    modalTitle.textContent = "Saved";
    modalFields.innerHTML = "";
    modalFields.style.display = "none";
    applyBtn.style.display = "none";
    modalList.innerHTML = "";

    var body = document.createElement("p");
    body.style.whiteSpace = "pre-wrap";
    body.style.fontSize = ".86rem";
    body.style.color = "var(--fg-2)";
    body.textContent = text;
    modalList.appendChild(body);

    modal.classList.add("edModal--on");
  }

  q("#edCancel").addEventListener("click", function () {
    if (formTarget && formTarget.cancelTo) formTarget.cancelTo();
    else closeModal();
  });

  applyBtn.addEventListener("click", applyForm);

  modal.addEventListener("click", function (e) {
    if (e.target === modal) closeModal();
  });

  document.addEventListener("keydown", function (e) {
    if (e.key !== "Escape") return;
    if (modal.classList.contains("edModal--on")) { closeModal(); return; }
    if (el("edPost").classList.contains("edSheet--on")) { closePost(); return; }
    if (el("edPosts").classList.contains("edSheet--on")) closePosts();
  });

  /* the page should not navigate off while it is being edited */
  document.addEventListener("click", function (e) {
    var a = e.target.closest ? e.target.closest("a[href]") : null;
    if (a) e.preventDefault();
  }, true);

  function redraw() {
    if (window.renderPortfolio) window.renderPortfolio(S);
    else annotate();
  }

  /* keep the controls lined up when the page changes shape */
  window.addEventListener("resize", placeControls);
  window.addEventListener("load", placeControls);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(placeControls);
  document.addEventListener("click", function (e) {
    if (e.target.closest && e.target.closest(".tab")) setTimeout(placeControls, 0);
  }, true);

  /* ========================================================= the writing == */

  var posts = [];
  var postForm = { original: "", image: "" };
  var postTimer = null;
  var pickerKind = "";

  function openPosts() {
    el("edPosts").classList.add("edSheet--on");
    loadPosts();
  }

  function closePosts() {
    el("edPosts").classList.remove("edSheet--on");
  }

  function loadPosts() {
    el("edPostsStatus").textContent = "loading";
    fetch("/posts").then(function (r) { return r.json(); }).then(function (list) {
      posts = list;
      el("edPostsStatus").textContent = list.length + (list.length === 1 ? " post" : " posts");
      renderPosts();
    }).catch(function () {
      el("edPostsStatus").textContent = "could not read the posts";
    });
  }

  function renderPosts() {
    var list = el("edPostsList");
    list.innerHTML = "";

    if (!posts.length) {
      var empty = document.createElement("li");
      var emptyRow = document.createElement("div");
      emptyRow.className = "post";
      var emptyText = document.createElement("span");
      emptyText.className = "post__excerpt";
      emptyText.textContent = "No posts yet. New post starts one.";
      emptyRow.appendChild(emptyText);
      empty.appendChild(emptyRow);
      list.appendChild(empty);
      return;
    }

    posts.forEach(function (p) {
      var li = document.createElement("li");
      var row = document.createElement("div");
      row.className = "post post--edit";

      if (p.image) {
        var thumb = document.createElement("span");
        thumb.className = "post__thumb";
        thumb.style.backgroundImage = "url(" + p.image + ")";
        row.appendChild(thumb);
      }

      var text = document.createElement("span");
      text.className = "post__text";

      var date = document.createElement("span");
      date.className = "post__date";
      date.textContent = p.date || "no date";

      var title = document.createElement("span");
      title.className = "post__title";
      title.textContent = p.title;

      text.appendChild(date);
      text.appendChild(title);

      if (p.excerpt) {
        var excerpt = document.createElement("span");
        excerpt.className = "post__excerpt";
        excerpt.textContent = p.excerpt;
        text.appendChild(excerpt);
      }

      row.appendChild(text);
      row.appendChild(cluster([
        ["edit", function () { openPost(p); }, "Edit this post"],
        ["del", function () { removePost(p); }, "Delete this post"]
      ]));

      li.appendChild(row);
      list.appendChild(li);
    });
  }

  function newPost() {
    openPost({ slug: "", title: "", date: today(), excerpt: "", image: "", body: "" });
  }

  function openPost(post) {
    postForm = { original: post.slug || "", image: post.image || "" };
    el("edPostTitle").value = post.title || "";
    el("edPostDate").value = post.date || today();
    el("edPostExcerpt").value = post.excerpt || "";
    el("edPostBody").value = post.body || "";
    el("edPostDelete").style.display = post.slug ? "" : "none";

    closePosts();
    el("edPost").classList.add("edSheet--on");
    el("edPostStatus").textContent = post.slug ? "editing" : "new post";
    paintPost();
  }

  function closePost() {
    el("edPost").classList.remove("edSheet--on");
    openPosts();
  }

  /* -------------------------------------------------------------- preview */

  function fitPost() {
    var wrap = el("edPostWrap");
    var frame = el("edPostFrame");
    var k = Math.max(0.3, Math.min(1, wrap.clientWidth / VIEW));
    var content = Number(frame.dataset.h || 800);
    var h = Math.max(content, wrap.clientHeight / k);

    frame.style.width = VIEW + "px";
    frame.style.height = h + "px";
    frame.style.transform = "scale(" + k + ")";
    el("edPostScale").style.width = (VIEW * k) + "px";
    el("edPostScale").style.height = (h * k) + "px";
  }

  function paintPost() {
    el("edPostStatus").textContent = el("edPostTitle").value.trim() || "draft";
    clearTimeout(postTimer);

    postTimer = setTimeout(function () {
      fetch("/preview", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          title: el("edPostTitle").value,
          date: el("edPostDate").value,
          body: el("edPostBody").value
        })
      }).then(function (r) { return r.json(); }).then(function (out) {
        if (out.ok) el("edPostFrame").srcdoc = out.html;
      });
    }, 250);
  }

  el("edPostFrame").addEventListener("load", function () {
    var frame = el("edPostFrame");
    var h = 800;
    try {
      var doc = frame.contentDocument;
      h = Math.max(400, doc.body ? doc.body.getBoundingClientRect().height : 800);
    } catch (e) { /* leave the guess */ }
    frame.dataset.h = Math.round(h);
    fitPost();
  });

  window.addEventListener("resize", fitPost);

  ["edPostTitle", "edPostDate", "edPostExcerpt", "edPostBody"].forEach(function (id) {
    el(id).addEventListener("input", paintPost);
  });

  /* ----------------------------------------------------- markdown helpers */

  function focusRange(start, end) {
    var t = el("edPostBody");
    t.focus();
    t.selectionStart = start;
    t.selectionEnd = end;
  }

  function insertText(text) {
    var t = el("edPostBody");
    var s = t.selectionStart;
    var e = t.selectionEnd;
    t.value = t.value.slice(0, s) + text + t.value.slice(e);
    focusRange(s + text.length, s + text.length);
    paintPost();
  }

  function wrapMark(mark) {
    var t = el("edPostBody");
    var s = t.selectionStart;
    var e = t.selectionEnd;
    var sel = t.value.slice(s, e);
    var len = mark.length;

    if (sel.length > len * 2 && sel.slice(0, len) === mark && sel.slice(-len) === mark) {
      var inner = sel.slice(len, -len);
      t.value = t.value.slice(0, s) + inner + t.value.slice(e);
      focusRange(s, s + inner.length);
    } else {
      var text = mark + (sel || "text") + mark;
      t.value = t.value.slice(0, s) + text + t.value.slice(e);
      focusRange(s + len, s + len + (sel || "text").length);
    }
    paintPost();
  }

  function currentLine() {
    var t = el("edPostBody");
    var start = t.value.lastIndexOf("\n", t.selectionStart - 1) + 1;
    var end = t.value.indexOf("\n", t.selectionStart);
    if (end === -1) end = t.value.length;
    return { start: start, end: end };
  }

  function toggleLine(prefix) {
    var t = el("edPostBody");
    var span = currentLine();
    var line = t.value.slice(span.start, span.end);
    var indent = (line.match(/^\s*/) || [""])[0];
    var rest = line.slice(indent.length);
    var had = rest.indexOf(prefix) === 0;
    var stripped = rest.replace(/^(#{1,3}\s+|[-*+]\s+|\d+\.\s+|>\s+)/, "");
    var next = had ? stripped : prefix + stripped;

    t.value = t.value.slice(0, span.start) + indent + next + t.value.slice(span.end);
    focusRange(span.start + indent.length + next.length, span.start + indent.length + next.length);
    paintPost();
  }

  function indentLines(add) {
    var t = el("edPostBody");
    var s = t.selectionStart;
    var e = t.selectionEnd;
    var start = t.value.lastIndexOf("\n", s - 1) + 1;
    var end = t.value.indexOf("\n", e);
    if (end === -1) end = t.value.length;

    var block = t.value.slice(start, end).split("\n").map(function (line) {
      return add ? "  " + line : line.replace(/^ {1,2}/, "");
    }).join("\n");

    t.value = t.value.slice(0, start) + block + t.value.slice(end);
    focusRange(start, start + block.length);
    paintPost();
  }

  el("edPostBody").addEventListener("keydown", function (e) {
    if ((e.metaKey || e.ctrlKey) && (e.key === "b" || e.key === "i")) {
      e.preventDefault();
      wrapMark(e.key === "b" ? "**" : "*");
      return;
    }

    if (e.key === "Tab") {
      e.preventDefault();
      indentLines(!e.shiftKey);
      return;
    }

    if (e.key !== "Enter" || e.shiftKey) return;

    var t = el("edPostBody");
    var span = currentLine();
    var line = t.value.slice(span.start, t.selectionStart);
    var m = line.match(/^(\s*)(>\s+|[-*+]\s+|\d+\.\s+)?(.*)$/);
    if (!m || !m[2]) return;

    e.preventDefault();
    var indent = m[1];
    var marker = m[2];

    if (!m[3].trim()) {
      /* an empty item ends the list */
      t.value = t.value.slice(0, span.start) + indent + t.value.slice(t.selectionStart);
      focusRange(span.start + indent.length, span.start + indent.length);
      paintPost();
      return;
    }

    var next = marker;
    if (/^\d+\.\s+$/.test(marker)) next = (parseInt(marker, 10) + 1) + ". ";
    insertText("\n" + indent + next);
  });

  qa("[data-wrap]").forEach(function (b) {
    b.addEventListener("click", function () { wrapMark(b.getAttribute("data-wrap")); });
  });

  qa("[data-line]").forEach(function (b) {
    b.addEventListener("click", function () { toggleLine(b.getAttribute("data-line")); });
  });

  el("edPostLink").addEventListener("click", function () {
    var url = window.prompt("Link to where?", "https://");
    if (url) wrapMark("[](" + url + ")");
  });

  function uploadPost(kind) {
    pickerKind = kind;
    el("edPostPicker").accept = kind === "image" ? "image/*" : "";
    el("edPostPicker").click();
  }

  el("edPostImage").addEventListener("click", function () { uploadPost("image"); });
  el("edPostFile").addEventListener("click", function () { uploadPost("file"); });

  el("edPostPicker").addEventListener("change", function (e) {
    var f = e.target.files && e.target.files[0];
    if (!f) return;

    el("edPostStatus").textContent = "uploading " + f.name;
    var r = new FileReader();
    r.onload = function () {
      fetch("/upload", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name: f.name, data: r.result, kind: pickerKind })
      }).then(function (res) { return res.json(); }).then(function (out) {
        if (!out.ok) { el("edPostStatus").textContent = "upload failed"; return; }
        var name = f.name.replace(/\.[^.]+$/, "");
        insertText(pickerKind === "image"
          ? "![" + name + "](" + out.path + ")"
          : "[" + name + "](" + out.path + ")");
        el("edPostStatus").textContent = "draft";
        e.target.value = "";
      });
    };
    r.readAsDataURL(f);
  });

  el("edPostCover").addEventListener("change", function (e) {
    var f = e.target.files && e.target.files[0];
    if (!f) return;
    var r = new FileReader();
    r.onload = function () {
      postForm.image = r.result;
      el("edPostStatus").textContent = "cover set";
    };
    r.readAsDataURL(f);
  });

  /* ----------------------------------------------------------- post saves */

  function removePost(p) {
    if (!window.confirm('Delete "' + p.title + '"?')) return;
    fetch("/post/delete", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ slug: p.slug })
    }).then(function (r) { return r.json(); }).then(function (out) {
      if (!out.ok) { showMessage(out.message); return; }
      posts = out.posts;
      renderPosts();
      el("edPostsStatus").textContent = posts.length + (posts.length === 1 ? " post" : " posts");
    });
  }

  el("edPostsBtn").addEventListener("click", openPosts);
  el("edPostsNew").addEventListener("click", newPost);
  el("edPostsBack").addEventListener("click", closePosts);
  el("edPostBack").addEventListener("click", closePost);

  el("edPostSave").addEventListener("click", function () {
    var save = el("edPostSave");
    save.disabled = true;

    fetch("/post/save", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        original: postForm.original,
        title: el("edPostTitle").value,
        date: el("edPostDate").value,
        excerpt: el("edPostExcerpt").value,
        body: el("edPostBody").value,
        image: postForm.image
      })
    }).then(function (r) { return r.json(); }).then(function (out) {
      save.disabled = false;
      if (!out.ok) { showMessage(out.message); return; }
      posts = out.posts;
      renderPosts();
      closePost();
    }).catch(function (err) {
      save.disabled = false;
      showMessage("Failed: " + err.message);
    });
  });

  el("edPostDelete").addEventListener("click", function () {
    if (!postForm.original) return;
    if (!window.confirm("Delete this post?")) return;
    fetch("/post/delete", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ slug: postForm.original })
    }).then(function (r) { return r.json(); }).then(function (out) {
      if (!out.ok) { showMessage(out.message); return; }
      posts = out.posts;
      renderPosts();
      closePost();
    });
  });

  /* ============================================================== the dock */

  q("#edCars").addEventListener("click", function () { openList("cars"); });

  q("#edDone").addEventListener("click", function () {
    var done = q("#edDone");
    done.disabled = true;
    statusEl.textContent = "saving";

    fetch("/save", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ state: S })
    }).then(function (r) {
      return r.json();
    }).then(function (out) {
      statusEl.textContent = out.ok ? "saved" : "failed";
      done.disabled = false;
      showMessage(out.message);
    }).catch(function (err) {
      statusEl.textContent = "failed";
      done.disabled = false;
      showMessage("Failed: " + err.message);
    });
  });

  /* render.js calls this after every paint */
  window.EDITOR = { afterPaint: annotate };
  annotate();
})();
