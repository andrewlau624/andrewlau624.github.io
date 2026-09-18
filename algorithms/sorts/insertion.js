/* ==========================================================================
   insertion.js  |  insertion sort
   ========================================================================== */

export default {
  id: "insertion",
  name: "Insertion Sort",
  view: "array",
  time: "O(n²)",
  omega: "Ω(n)",
  theta: "Θ(n²)",
  space: "O(1)",
  blurb: "Keeps the left side sorted, lifting each new bar left over the taller ones until it lands.",
  code: [
    "for i = 1 to n-1:",
    "  j = i",
    "  while j > 0 and a[j-1] > a[j]:",
    "    swap a[j-1], a[j]",
    "    j = j - 1",
    "  mark a[i] sorted",
    "done"
  ],
  lines: { compare: 2, swap: 3, mark: 5, done: 6 },

  *run(input) {
    const a = input.values.slice();
    const n = a.length;
    for (let i = 1; i < n; i += 1) {
      let j = i;
      while (j > 0) {
        yield ["compare", j - 1, j];
        if (a[j - 1] <= a[j]) break;
        const swap = a[j - 1];
        a[j - 1] = a[j];
        a[j] = swap;
        yield ["swap", j - 1, j];
        j -= 1;
      }
      yield ["mark", i, "sorted"];
    }
    yield ["done"];
  }
};
