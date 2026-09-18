/* ==========================================================================
   quick.js  |  quicksort, Lomuto partition
   ========================================================================== */

export default {
  id: "quick",
  name: "Quicksort",
  view: "array",
  time: "O(n²)",
  omega: "Ω(n log n)",
  theta: "Θ(n log n)",
  space: "O(log n)",
  blurb: "Partitions around a pivot, then sorts each side the same way. Average n log n, worst case n² on sorted input.",
  code: [
    "sort(lo, hi):",
    "  if lo >= hi: return",
    "  pivot = a[hi]",
    "  store = lo",
    "  for j = lo to hi-1:",
    "    if a[j] < pivot:",
    "      swap a[store], a[j]",
    "      store = store + 1",
    "  swap a[store], a[hi]",
    "  sort(lo, store-1), sort(store+1, hi)",
    "done"
  ],
  lines: { compare: 5, swap: 6, place: 8, pivot: 2, mark: 9, done: 10 },

  *run(input) {
    const a = input.values.slice();
    yield* sort(a, 0, a.length - 1);
    yield ["done"];

    function* sort(a, lo, hi) {
      if (lo > hi) return;
      if (lo === hi) {
        yield ["mark", lo, "sorted"];
        return;
      }
      const pivot = a[hi];
      yield ["pivot", hi];
      let store = lo;
      for (let j = lo; j < hi; j += 1) {
        yield ["compare", j, hi];
        if (a[j] < pivot) {
          if (store !== j) {
            const swap = a[store];
            a[store] = a[j];
            a[j] = swap;
            yield ["swap", store, j];
          }
          store += 1;
        }
      }
      if (store !== hi) {
        const swap = a[store];
        a[store] = a[hi];
        a[hi] = swap;
        yield ["place", store, hi];
      }
      yield ["mark", hi, "base"];
      yield ["mark", store, "sorted"];
      yield* sort(a, lo, store - 1);
      yield* sort(a, store + 1, hi);
    }
  }
};
