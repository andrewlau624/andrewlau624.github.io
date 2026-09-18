/* ==========================================================================
   graph.js  |  the graph view
   --------------------------------------------------------------------------
   Nodes on a ring with a few chords, drawn as a small weighted graph. Edge
   weights are printed on every edge, and each node shows its shortest distance
   once it has one, otherwise its number.

   Events
     ["frontier", node]       discovered, still unsettled
     ["visit", node, value]   settled, with its distance
     ["consider", u, v]       an edge being looked at
     ["tree", u, v]           the edge that improved v, or joined the tree
     ["path", u, v]           an edge on the final route
     ["pass", u, v]           an edge skipped because it would close a cycle
   ========================================================================== */

import { wash, ink, accent, tint, node, font } from "../theme.js";

const NODE_FILL = { idle: node.idle, frontier: node.frontier, visited: node.visited };
const EDGE_COLOR = {
  idle: wash(0.1),
  consider: wash(0.55),
  tree: tint(0.6),
  path: accent,
  pass: wash(0.05)
};
const EDGE_WIDTH = { idle: 1, consider: 1, tree: 1.8, path: 2.4, pass: 1 };
const EDGE_LABEL = {
  idle: wash(0.35),
  consider: wash(0.6),
  tree: tint(0.72),
  path: accent,
  pass: wash(0.14)
};
const R = 12;

const key = (a, b) => (a < b ? a + "-" + b : b + "-" + a);

export default {
  label: "Graphs",

  defaults: { size: 12, anchors: true },

  make(params, rng) {
    const n = params.size | 0;
    const nodes = [];
    for (let i = 0; i < n; i += 1) {
      const angle = (i / n) * Math.PI * 2 - Math.PI / 2;
      const radius = 0.34 + rng() * 0.12;
      nodes.push({ x: 0.5 + Math.cos(angle) * radius, y: 0.5 + Math.sin(angle) * radius });
    }

    const adj = Array.from({ length: n }, () => []);
    const seen = new Set();
    const add = (u, v) => {
      if (u === v) return;
      const k = key(u, v);
      if (seen.has(k)) return;
      seen.add(k);
      const weight = Math.max(1, Math.round(Math.hypot(nodes[u].x - nodes[v].x, nodes[u].y - nodes[v].y) * 100));
      adj[u].push({ to: v, w: weight });
      adj[v].push({ to: u, w: weight });
    };

    for (let i = 0; i < n; i += 1) add(i, (i + 1) % n);
    const chords = Math.round(n * 0.6);
    for (let i = 0; i < chords; i += 1) add((rng() * n) | 0, (rng() * n) | 0);

    return { n, nodes, adj, start: 0, target: n >> 1, anchors: params.anchors !== false };
  },

  init(input) {
    const state = new Map();
    const edges = [];
    for (let u = 0; u < input.n; u += 1) {
      for (const e of input.adj[u]) {
        const k = key(u, e.to);
        if (state.has(k)) continue;
        state.set(k, "idle");
        edges.push({ a: u, b: e.to, w: e.w });
      }
    }
    return {
      n: input.n,
      nodes: input.nodes,
      edges,
      edgeState: state,
      node: Array(input.n).fill("idle"),
      value: new Array(input.n).fill(null),
      start: input.start,
      target: input.target,
      anchors: input.anchors !== false,
      active: -1
    };
  },

  apply(state, event) {
    const op = event[0];
    if (op === "frontier") {
      if (state.node[event[1]] === "idle") state.node[event[1]] = "frontier";
    } else if (op === "visit") {
      state.node[event[1]] = "visited";
      state.value[event[1]] = event[2];
      state.active = event[1];
    } else if (op === "consider") {
      /* looking is the step in progress, so the last edge considered drops
         back to idle; only settled edges keep their colour */
      for (const [k, status] of state.edgeState) {
        if (status === "consider") state.edgeState.set(k, "idle");
      }
      state.edgeState.set(key(event[1], event[2]), "consider");
    } else if (op === "tree") {
      state.edgeState.set(key(event[1], event[2]), "tree");
    } else if (op === "path") {
      state.edgeState.set(key(event[1], event[2]), "path");
      state.active = -1;
    } else if (op === "pass") {
      state.edgeState.set(key(event[1], event[2]), "pass");
    }
  },

  draw(ctx, state, w, h) {
    const pad = R + 8;
    const px = (i) => pad + state.nodes[i].x * (w - pad * 2);
    const py = (i) => pad + state.nodes[i].y * (h - pad * 2);

    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    for (const edge of state.edges) {
      const status = state.edgeState.get(key(edge.a, edge.b)) || "idle";
      const ax = px(edge.a);
      const ay = py(edge.a);
      const bx = px(edge.b);
      const by = py(edge.b);
      ctx.strokeStyle = EDGE_COLOR[status] || EDGE_COLOR.idle;
      ctx.lineWidth = EDGE_WIDTH[status];
      ctx.beginPath();
      ctx.moveTo(ax, ay);
      ctx.lineTo(bx, by);
      ctx.stroke();

      /* the weight sits just off the edge, and short edges go bare, so the
         numbers stay readable instead of piling up */
      const length = Math.hypot(bx - ax, by - ay);
      if (length > 46) {
        const off = 8;
        const nx = (-(by - ay) / length) * off;
        const ny = ((bx - ax) / length) * off;
        ctx.font = "9px " + font;
        ctx.fillStyle = EDGE_LABEL[status] || EDGE_LABEL.idle;
        ctx.fillText(String(edge.w), (ax + bx) / 2 + nx, (ay + by) / 2 + ny);
      }
    }

    for (let i = 0; i < state.n; i += 1) {
      const status = state.node[i];
      const current = i === state.active;
      const x = px(i);
      const y = py(i);
      ctx.fillStyle = current ? node.active : NODE_FILL[status] || NODE_FILL.idle;
      ctx.beginPath();
      ctx.arc(x, y, R, 0, Math.PI * 2);
      ctx.fill();

      const label = state.value[i] !== null ? state.value[i] : i;
      ctx.font = (state.value[i] !== null ? 10 : 9) + "px " + font;
      ctx.fillStyle = current || status === "visited" ? ink : wash(0.82);
      ctx.fillText(String(label), x, y + 0.5);
    }

    ctx.strokeStyle = wash(0.95);
    ctx.lineWidth = 1.4;
    if (state.anchors) {
      for (const i of [state.start, state.target]) {
        ctx.beginPath();
        ctx.arc(px(i), py(i), R + 4, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
  }
};
