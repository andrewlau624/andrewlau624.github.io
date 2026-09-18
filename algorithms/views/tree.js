/* ==========================================================================
   tree.js  |  the binary tree view
   --------------------------------------------------------------------------
   A binary search tree. Each parent sits over the middle of its children, and
   leaves take the next slot left to right, so the drawing reads as a tree
   rather than a diagonal. Every node prints its value; the node being compared
   is the bright one.

   Events
     ["compare", value, key]         comparing an insert against a node
     ["insert", value, parent, side] attach a new node
     ["search", value, key]          comparing a search against a node
     ["found", value]                the search landed
     ["miss"]                        the search fell off the tree
   ========================================================================== */

import { wash, ink, accent, tint, node, font } from "../theme.js";

const R = 15;

export default {
  label: "Trees",

  defaults: { size: 9 },

  make(params, rng) {
    const n = params.size | 0;
    const pool = [];
    for (let v = 10; v <= 99; v += 1) pool.push(v);
    for (let i = pool.length - 1; i > 0; i -= 1) {
      const j = Math.floor(rng() * (i + 1));
      const swap = pool[i];
      pool[i] = pool[j];
      pool[j] = swap;
    }
    /* insert the values in median-first order, so the tree comes out balanced
       and every comparison is easy to follow */
    const values = balanced(pool.slice(0, n).sort((a, b) => a - b));
    const target = rng() < 0.6 ? values[Math.floor(rng() * n)] : pool[n];
    return { values, target };
  },

  init(input) {
    return { nodes: {}, root: null, active: null, result: null, target: input.target };
  },

  apply(state, event) {
    const op = event[0];
    if (op === "compare" || op === "search") {
      state.active = event[1];
    } else if (op === "insert") {
      const value = event[1];
      const parent = event[2];
      const side = event[3];
      state.nodes[value] = { left: null, right: null };
      if (parent === null || parent === undefined) state.root = value;
      else state.nodes[parent][side] = value;
      state.active = value;
    } else if (op === "found") {
      state.active = event[1];
      state.result = "found";
    } else if (op === "miss") {
      state.result = "miss";
    }
  },

  draw(ctx, state, w, h) {
    const pos = new Map();
    const seen = { slots: 0, depth: 0 };
    walk(state.root, 0, state.nodes, pos, seen);

    const left = R + 10;
    const right = w - R - 10;
    const top = R + 10;
    const bottom = h - R - 12;
    const span = seen.slots - 1;
    const rows = Math.max(1, seen.depth + 1);
    const sx = span > 0 ? (right - left) / span : 0;
    const sy = rows > 1 ? (bottom - top) / (rows - 1) : 0;
    const at = (v) => {
      const p = pos.get(v);
      return {
        x: span > 0 ? left + p.x * sx : (left + right) / 2,
        y: top + p.y * sy
      };
    };

    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    for (const v of pos.keys()) {
      const node = state.nodes[v];
      const from = at(v);
      for (const child of [node.left, node.right]) {
        if (child === null || child === undefined) continue;
        const to = at(child);
        ctx.strokeStyle = wash(0.2);
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(from.x, from.y);
        ctx.lineTo(to.x, to.y);
        ctx.stroke();
      }
    }

    for (const v of pos.keys()) {
      const p = at(v);
      const active = state.active === v;
      const found = state.result === "found" && active;
      ctx.fillStyle = active ? node.active : node.idle;
      ctx.beginPath();
      ctx.arc(p.x, p.y, R, 0, Math.PI * 2);
      ctx.fill();
      if (found) {
        ctx.strokeStyle = accent;
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.arc(p.x, p.y, R + 5, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.font = "11px " + font;
      ctx.fillStyle = active ? ink : wash(0.82);
      ctx.fillText(String(v), p.x, p.y + 0.5);
    }

    if (state.result === "miss") {
      ctx.font = "11px " + font;
      ctx.fillStyle = tint(0.75);
      ctx.textAlign = "left";
      ctx.fillText(state.target + " not found", 0, h - 6);
    }
  }
};

/* median-first order builds a balanced tree from a sorted list */
function balanced(sorted) {
  if (!sorted.length) return [];
  const mid = sorted.length >> 1;
  return [sorted[mid]].concat(balanced(sorted.slice(0, mid)), balanced(sorted.slice(mid + 1)));
}

/* a parent takes the middle of its children; a leaf takes the next slot */
function walk(value, depth, nodes, pos, seen) {
  if (value === null || value === undefined) return null;
  const node = nodes[value];
  const left = walk(node.left, depth + 1, nodes, pos, seen);
  const right = walk(node.right, depth + 1, nodes, pos, seen);
  let x;
  if (left === null && right === null) {
    x = seen.slots;
    seen.slots += 1;
  } else if (right === null) {
    x = left;
  } else if (left === null) {
    x = right;
  } else {
    x = (left + right) / 2;
  }
  pos.set(value, { x, y: depth });
  if (depth > seen.depth) seen.depth = depth;
  return x;
}
