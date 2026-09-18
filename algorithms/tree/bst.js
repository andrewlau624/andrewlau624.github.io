/* ==========================================================================
   bst.js  |  binary search tree: insert, then search
   --------------------------------------------------------------------------
   Inserts a handful of values in the order they arrive, then searches for one
   target. The compare-bright node is where the search currently is.
   ========================================================================== */

export default {
  id: "tree-bst",
  name: "Binary Search Tree",
  view: "tree",
  time: "O(n)",
  omega: "Ω(1)",
  theta: "Θ(log n)",
  space: "O(n)",
  blurb: "Inserts a run of values, each one walking left when smaller and right when larger, then looks for one target down the same path.",
  code: [
    "insert(v):",
    "  cur = root",
    "  while cur is not empty:",
    "    if v < cur: go left",
    "    else: go right",
    "  attach v here",
    "",
    "search(target):",
    "  cur = root",
    "  while cur is not empty:",
    "    if target == cur: return found",
    "    if target < cur: cur = cur.left",
    "    else: cur = cur.right",
    "  return not found"
  ],
  lines(event) {
    const op = event[0];
    if (op === "compare") return 2;
    if (op === "insert") return event[2] === null || event[2] === undefined ? 5 : event[3] === "left" ? 3 : 4;
    if (op === "search") return 10;
    if (op === "found") return 10;
    if (op === "miss") return 13;
    if (op === "done") return 13;
    return -1;
  },

  *run(input) {
    const nodes = {};
    let root = null;

    for (const value of input.values) {
      if (root === null) {
        root = value;
        nodes[value] = { left: null, right: null };
        yield ["insert", value, null, null];
        continue;
      }
      let cur = root;
      for (;;) {
        yield ["compare", cur, value];
        const side = value < cur ? "left" : "right";
        const child = nodes[cur][side];
        if (child === null) {
          nodes[value] = { left: null, right: null };
          nodes[cur][side] = value;
          yield ["insert", value, cur, side];
          break;
        }
        cur = child;
      }
    }

    let cur = root;
    while (cur !== null) {
      yield ["search", cur, input.target];
      if (input.target === cur) {
        yield ["found", cur];
        break;
      }
      cur = input.target < cur ? nodes[cur].left : nodes[cur].right;
    }
    if (cur === null) yield ["miss"];
    yield ["done"];
  }
};
