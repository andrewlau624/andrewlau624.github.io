/* ==========================================================================
   astar.js  |  A* on a grid
   ========================================================================== */

import { MinHeap } from "../util.js";

export default {
  id: "grid-astar",
  name: "A* Search",
  view: "grid",
  time: "O(rows × cols)",
  omega: "Ω(1)",
  theta: "Θ(rows × cols)",
  space: "O(rows × cols)",
  blurb: "Searches toward the end using a heuristic. Same shortest path as BFS, usually with many fewer cells visited.",
  code: [
    "open = [(h(start), start)]",
    "while open is not empty:",
    "  u = the node with the lowest f",
    "  if u is the end: stop",
    "  for each neighbour v:",
    "    g = dist[u] + 1",
    "    if g < dist[v]:",
    "      dist[v] = g, prev[v] = u",
    "      push (g + h(v), v)",
    "walk prev back from end to start"
  ],
  lines: { frontier: 8, visit: 2, path: 9 },

  *run(input) {
    const { rows, cols, walls, start, end } = input;
    const index = (r, c) => r * cols + c;
    const size = rows * cols;
    const dist = new Float64Array(size).fill(Infinity);
    const prev = new Int32Array(size).fill(-1);
    const closed = new Uint8Array(size);
    const dirs = [[0, 1], [1, 0], [0, -1], [-1, 0]];
    const heuristic = (r, c) => Math.abs(r - end.r) + Math.abs(c - end.c);

    const startK = index(start.r, start.c);
    dist[startK] = 0;
    const open = new MinHeap();
    open.push(heuristic(start.r, start.c), startK);
    yield ["frontier", start.r, start.c];

    while (open.size) {
      const k = open.pop().value;
      if (closed[k]) continue;
      closed[k] = 1;
      const r = Math.floor(k / cols);
      const c = k % cols;
      yield ["visit", r, c, dist[k]];
      if (r === end.r && c === end.c) break;

      for (const [dr, dc] of dirs) {
        const nr = r + dr;
        const nc = c + dc;
        if (nr < 0 || nc < 0 || nr >= rows || nc >= cols) continue;
        const nk = index(nr, nc);
        if (walls[nk] || closed[nk]) continue;
        const tentative = dist[k] + 1;
        if (tentative < dist[nk]) {
          dist[nk] = tentative;
          prev[nk] = k;
          open.push(tentative + heuristic(nr, nc), nk);
          yield ["frontier", nr, nc];
        }
      }
    }

    let k = index(end.r, end.c);
    if (dist[k] < Infinity) {
      while (k !== -1) {
        yield ["path", Math.floor(k / cols), k % cols, dist[k]];
        k = prev[k];
      }
    }
  }
};
