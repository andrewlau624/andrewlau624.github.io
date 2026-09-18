/* ==========================================================================
   bubble.js  |  bubble sort
   ========================================================================== */

export default {
  id: "bubble",
  name: "Bubble Sort",
  view: "array",
  time: "O(n²)",
  omega: "Ω(n)",
  theta: "Θ(n²)",
  space: "O(1)",
  blurb: "Walks the array swapping neighbours that are out of order, and repeats until a whole pass goes without a swap.",
  code: [
    "for end = n-1 down to 1:",
    "  swapped = false",
    "  for i = 0 to end-1:",
    "    if a[i] > a[i+1]:",
    "      swap a[i], a[i+1]",
    "      swapped = true",
    "  mark a[end] sorted",
    "  if not swapped: stop",
    "done"
  ],
  lines: { compare: 3, swap: 4, mark: 6, done: 8 },

  *run(input) {
    const a = input.values.slice();
    const n = a.length;
    for (let end = n - 1; end > 0; end -= 1) {
      let swapped = false;
      for (let i = 0; i < end; i += 1) {
        yield ["compare", i, i + 1];
        if (a[i] > a[i + 1]) {
          const swap = a[i];
          a[i] = a[i + 1];
          a[i + 1] = swap;
          swapped = true;
          yield ["swap", i, i + 1];
        }
      }
      yield ["mark", end, "sorted"];
      if (!swapped) break;
    }
    yield ["done"];
  }
};
