/* ==========================================================================
   selection.js  |  selection sort
   ========================================================================== */

export default {
  id: "selection",
  name: "Selection Sort",
  view: "array",
  time: "O(n²)",
  omega: "Ω(n²)",
  theta: "Θ(n²)",
  space: "O(1)",
  blurb: "Finds the smallest bar in the tail and swaps it into the next slot, so it never moves a bar twice.",
  code: [
    "for i = 0 to n-2:",
    "  min = i",
    "  for j = i+1 to n-1:",
    "    if a[j] < a[min]: min = j",
    "  swap a[i], a[min]",
    "  mark a[i] sorted",
    "done"
  ],
  lines: { compare: 3, swap: 4, mark: 5, done: 6 },

  *run(input) {
    const a = input.values.slice();
    const n = a.length;
    for (let i = 0; i < n - 1; i += 1) {
      let min = i;
      for (let j = i + 1; j < n; j += 1) {
        yield ["compare", j, min];
        if (a[j] < a[min]) min = j;
      }
      if (min !== i) {
        const swap = a[i];
        a[i] = a[min];
        a[min] = swap;
        yield ["swap", i, min];
      }
      yield ["mark", i, "sorted"];
    }
    yield ["done"];
  }
};
