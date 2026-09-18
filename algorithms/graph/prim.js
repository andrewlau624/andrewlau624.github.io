/* ==========================================================================
   prim.js  |  Prim's minimum spanning tree
   --------------------------------------------------------------------------
   Grows one tree from a single node, always pulling in the cheapest edge that
   touches it. Each node carries its key, the weight of the cheapest edge that
   would attach it, so the tree visibly reaches for the closest outside node.
   ========================================================================== */

import { MinHeap } from "../util.js";

export default {
  id: "graph-prim",
  name: "Prim's Algorithm",
  view: "graph",
  defaults: { anchors: false },
  time: "O(E log V)",
  omega: "Ω(E log V)",
  theta: "Θ(E log V)",
  space: "O(V)",
  blurb: "Grows a single tree from one node, each step adding the cheapest edge from the tree to a node outside it, until every node is in.",
  code: [
    "key[start] = 0, the rest infinity",
    "heap = [(0, start)]",
    "while the heap is not empty:",
    "  u = the cheapest node not in the tree yet",
    "  add u, and the edge from parent[u]",
    "  for each edge (u, v, w):",
    "    if v is not in the tree and w < key[v]:",
    "      key[v] = w, parent[v] = u, push (w, v)",
    "done"
  ],
  lines: { frontier: 7, consider: 5, visit: 4, tree: 4, done: 8 },

  *run(input) {
    const { adj, n } = input;
    const start = input.start >= 0 ? input.start : 0;

    const inTree = new Uint8Array(n);
    const key = new Float64Array(n).fill(Infinity);
    const parent = new Int32Array(n).fill(-1);
    const heap = new MinHeap();

    key[start] = 0;
    heap.push(0, start);
    yield ["frontier", start];

    while (heap.size) {
      const u = heap.pop().value;
      if (inTree[u]) continue;
      inTree[u] = 1;
      yield ["visit", u, key[u]];
      if (parent[u] !== -1) yield ["tree", parent[u], u];

      for (const e of adj[u]) {
        /* both ends already in the tree: nothing to look at */
        if (inTree[e.to]) continue;
        yield ["consider", u, e.to];
        if (e.w < key[e.to]) {
          key[e.to] = e.w;
          parent[e.to] = u;
          yield ["frontier", e.to];
          heap.push(e.w, e.to);
        }
      }
    }

    yield ["done"];
  }
};
