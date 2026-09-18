/* ==========================================================================
   dfs.js  |  depth first search on a grid
   ========================================================================== */

export default {
  id: "grid-dfs",
  name: "Depth First Search",
  view: "grid",
  time: "O(rows × cols)",
  omega: "Ω(1)",
  theta: "Θ(rows × cols)",
  space: "O(rows × cols)",
  blurb: "Follows one direction to the end before backtracking. It always finds a path if one exists, but rarely the shortest.",
  code: [
    "stack = [start]",
    "while stack is not empty:",
    "  (r, c) = stack.pop()",
    "  if visited: continue",
    "  mark (r, c) visited",
    "  for each neighbour (nr, nc):",
    "    if open and unseen:",
    "      prev[nr][nc] = (r, c)",
    "      stack.push(nr, nc)",
    "walk prev back from end to start"
  ],
  lines: { frontier: 8, visit: 4, path: 9 },

  *run(input) {
    const { rows, cols, walls, start, end } = input;
    const index = (r, c) => r * cols + c;
    const seen = new Uint8Array(rows * cols);
    const order = new Int32Array(rows * cols).fill(-1);
    const prev = new Int32Array(rows * cols).fill(-1);
    const dirs = [[0, 1], [1, 0], [0, -1], [-1, 0]];
    const stack = [start];
    const startK = index(start.r, start.c);
    prev[startK] = startK;
    yield ["frontier", start.r, start.c];
    let step = 0;

    while (stack.length) {
      const cur = stack.pop();
      const ck = index(cur.r, cur.c);
      if (seen[ck]) continue;
      seen[ck] = 1;
      order[ck] = step++;
      yield ["visit", cur.r, cur.c, order[ck]];
      if (cur.r === end.r && cur.c === end.c) break;

      for (const [dr, dc] of dirs) {
        const nr = cur.r + dr;
        const nc = cur.c + dc;
        if (nr < 0 || nc < 0 || nr >= rows || nc >= cols) continue;
        const k = index(nr, nc);
        if (walls[k] || prev[k] !== -1) continue;
        prev[k] = ck;
        stack.push({ r: nr, c: nc });
        yield ["frontier", nr, nc];
      }
    }

    let k = index(end.r, end.c);
    if (seen[k]) {
      while (k !== startK) {
        yield ["path", Math.floor(k / cols), k % cols, order[k]];
        k = prev[k];
      }
      yield ["path", start.r, start.c, order[startK]];
    }
  }
};
