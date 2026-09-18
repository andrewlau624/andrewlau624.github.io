/* ==========================================================================
   kruskal.js  |  Kruskal's minimum spanning tree
   --------------------------------------------------------------------------
   Walks the edges cheapest first and keeps one whenever it joins two
   different components, so the cheap edges land first and the expensive ones
   only survive when they are the last way across. A union-find decides
   whether an edge is useful or would close a cycle.
   ========================================================================== */

const key = (a, b) => (a < b ? a + "-" + b : b + "-" + a);

export default {
  id: "graph-kruskal",
  name: "Kruskal's Algorithm",
  view: "graph",
  defaults: { anchors: false },
  time: "O(E log E)",
  omega: "Ω(E log E)",
  theta: "Θ(E log E)",
  space: "O(V)",
  blurb: "Sorts every edge by weight and takes the cheapest one that connects two different components, skipping the ones that would close a cycle.",
  code: [
    "sort the edges by weight",
    "for each edge (u, v, w) in that order:",
    "  if find(u) == find(v) then skip it, it would close a cycle",
    "  otherwise take it, and union(u, v)",
    "done"
  ],
  lines: { consider: 1, pass: 2, tree: 3, visit: 3, done: 4 },

  *run(input) {
    const { adj, n } = input;

    const seen = new Set();
    const edges = [];
    for (let u = 0; u < n; u += 1) {
      for (const e of adj[u]) {
        const k = key(u, e.to);
        if (seen.has(k)) continue;
        seen.add(k);
        edges.push({ a: u, b: e.to, w: e.w });
      }
    }
    edges.sort((x, y) => x.w - y.w);

    /* one component per node, named by its smallest member */
    const comp = new Int32Array(n);
    for (let i = 0; i < n; i += 1) comp[i] = i;

    const lit = new Uint8Array(n);
    let taken = 0;

    for (const edge of edges) {
      yield ["consider", edge.a, edge.b];

      if (comp[edge.a] === comp[edge.b]) {
        yield ["pass", edge.a, edge.b];
        continue;
      }

      taken += 1;
      yield ["tree", edge.a, edge.b];

      /* fold b's component into a's, then light up whatever was still dark,
         each node showing the edge that brought it in */
      const from = comp[edge.b];
      const to = comp[edge.a];
      for (let i = 0; i < n; i += 1) {
        if (comp[i] !== from) continue;
        comp[i] = to;
        if (!lit[i]) {
          lit[i] = true;
          yield ["visit", i, taken];
        }
      }
      if (!lit[edge.a]) {
        lit[edge.a] = true;
        yield ["visit", edge.a, taken];
      }
    }

    yield ["done"];
  }
};
