/* ==========================================================================
   merge.js  |  merge sort
   ========================================================================== */

export default {
  id: "merge",
  name: "Merge Sort",
  view: "array",
  time: "O(n log n)",
  omega: "Ω(n log n)",
  theta: "Θ(n log n)",
  space: "O(n)",
  blurb: "Divides the array in half until runs are single bars, then merges the runs in order. Steady n log n, at the cost of an extra array.",
  code: [
    "sort(lo, hi):",
    "  if lo >= hi: return",
    "  mid = (lo + hi) / 2",
    "  sort(lo, mid), sort(mid+1, hi)",
    "  merge the two runs, smaller front first",
    "  write the merged run back",
    "done"
  ],
  lines: { compare: 4, set: 5, done: 6 },

  *run(input) {
    const a = input.values.slice();
    yield* sort(0, a.length - 1);
    yield ["done"];

    function* sort(lo, hi) {
      if (lo >= hi) return;
      const mid = (lo + hi) >> 1;
      yield* sort(lo, mid);
      yield* sort(mid + 1, hi);

      const buffer = [];
      let i = lo;
      let j = mid + 1;
      while (i <= mid && j <= hi) {
        yield ["compare", i, j];
        if (a[i] <= a[j]) buffer.push(a[i++]);
        else buffer.push(a[j++]);
      }
      while (i <= mid) buffer.push(a[i++]);
      while (j <= hi) buffer.push(a[j++]);

      for (let k = 0; k < buffer.length; k += 1) {
        a[lo + k] = buffer[k];
        yield ["set", lo + k, buffer[k]];
      }
    }
  }
};
