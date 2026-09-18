/* ==========================================================================
   bfs.js  |  breadth first search on a grid
   ========================================================================== */

export default {
  id: "grid-bfs",
  name: "Breadth First Search",
  view: "grid",
  time: "O(rows × cols)",
  omega: "Ω(1)",
  theta: "Θ(rows × cols)",
  space: "O(rows × cols)",
  blurb: "Expands evenly from the start in rings. Because it reaches cells in order of distance, the path it finds is the shortest one.",
  code: [
    "queue = [start], dist[start] = 0",
    "while queue is not empty:",
    "  (r, c) = queue.pop_front()",
    "  if (r, c) is the end: stop",
    "  for each neighbour (nr, nc):",
    "    if open and unvisited:",
    "      dist[nr][nc] = dist[r][c] + 1",
    "      queue.push_back(nr, nc)",
    "walk dist back from end to start"
  ],
  lines: { frontier: 7, visit: 2, path: 8 },

  *run(input) {
    const { rows, cols, walls, start, end } = input;
    const index = (r, c) => r * cols + c;
    const dist = new Int32Array(rows * cols).fill(-1);
    const prev = new Int32Array(rows * cols).fill(-1);
    const dirs = [[0, 1], [1, 0], [0, -1], [-1, 0]];
    const queue = [start];
    dist[index(start.r, start.c)] = 0;
    yield ["frontier", start.r, start.c];

    let head = 0;
    while (head < queue.length) {
      const cur = queue[head++];
      const ck = index(cur.r, cur.c);
      yield ["visit", cur.r, cur.c, dist[ck]];
      if (cur.r === end.r && cur.c === end.c) break;

      for (const [dr, dc] of dirs) {
        const nr = cur.r + dr;
        const nc = cur.c + dc;
        if (nr < 0 || nc < 0 || nr >= rows || nc >= cols) continue;
        const k = index(nr, nc);
        if (walls[k] || dist[k] !== -1) continue;
        dist[k] = dist[ck] + 1;
        prev[k] = ck;
        queue.push({ r: nr, c: nc });
        yield ["frontier", nr, nc];
      }
    }

    let k = index(end.r, end.c);
    if (dist[k] !== -1) {
      while (k !== -1) {
        yield ["path", Math.floor(k / cols), k % cols, dist[k]];
        k = prev[k];
      }
    }
  }
};
