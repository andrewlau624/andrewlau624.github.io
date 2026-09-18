/* ==========================================================================
   dijkstra.js  |  Dijkstra's shortest path
   ========================================================================== */

import { MinHeap } from "../util.js";

export default {
  id: "graph-dijkstra",
  name: "Dijkstra's Algorithm",
  view: "graph",
  time: "O(E log V)",
  omega: "Ω(E log V)",
  theta: "Θ(E log V)",
  space: "O(V)",
  blurb: "Settles the closest node first and relaxes its edges, finding the shortest weighted route from the start to every other node.",
  code: [
    "dist[start] = 0, the rest infinity",
    "heap = [(0, start)]",
    "while heap is not empty:",
    "  u = the closest unsettled node",
    "  for each edge (u, v, w):",
    "    if dist[u] + w < dist[v]:",
    "      dist[v] = dist[u] + w",
    "      prev[v] = u, push (dist[v], v)",
    "walk prev from target back to start"
  ],
  lines: { frontier: 7, visit: 3, consider: 4, tree: 6, path: 8, done: 8 },

  *run(input) {
    const { adj, start, target, n } = input;
    const dist = new Float64Array(n).fill(Infinity);
    const prev = new Int32Array(n).fill(-1);
    const done = new Uint8Array(n);
    dist[start] = 0;
    const heap = new MinHeap();
    heap.push(0, start);
    yield ["frontier", start];

    while (heap.size) {
      const u = heap.pop().value;
      if (done[u]) continue;
      done[u] = 1;
      yield ["visit", u, dist[u]];

      for (const e of adj[u]) {
        yield ["consider", u, e.to];
        if (done[e.to]) continue;
        const next = dist[u] + e.w;
        if (next < dist[e.to]) {
          dist[e.to] = next;
          prev[e.to] = u;
          heap.push(next, e.to);
          yield ["tree", u, e.to];
          yield ["frontier", e.to];
        }
      }
    }

    if (dist[target] < Infinity) {
      let cur = target;
      while (prev[cur] !== -1) {
        yield ["path", prev[cur], cur];
        cur = prev[cur];
      }
    }
  }
};
