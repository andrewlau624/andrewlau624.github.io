/* ==========================================================================
   util.js  |  the small shared parts
   --------------------------------------------------------------------------
   A seeded random, a clamp, and a binary heap. The heap is what Dijkstra and
   A* sit on. Everything here is dependency free, like the rest of the site.
   ========================================================================== */

/* the same seed always draws the same input, so a view can be rebuilt from
   scratch and land on exactly the state it was in before */
export function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function clamp(value, lo, hi) {
  return value < lo ? lo : value > hi ? hi : value;
}

export class MinHeap {
  constructor() {
    this.items = [];
  }

  get size() {
    return this.items.length;
  }

  push(priority, value) {
    const items = this.items;
    items.push({ priority, value });
    let i = items.length - 1;
    while (i > 0) {
      const parent = (i - 1) >> 1;
      if (items[parent].priority <= items[i].priority) break;
      const swap = items[parent];
      items[parent] = items[i];
      items[i] = swap;
      i = parent;
    }
  }

  pop() {
    const items = this.items;
    const top = items[0];
    const last = items.pop();
    if (items.length) {
      items[0] = last;
      let i = 0;
      for (;;) {
        const left = i * 2 + 1;
        const right = left + 1;
        let small = i;
        if (left < items.length && items[left].priority < items[small].priority) small = left;
        if (right < items.length && items[right].priority < items[small].priority) small = right;
        if (small === i) break;
        const swap = items[small];
        items[small] = items[i];
        items[i] = swap;
        i = small;
      }
    }
    return top;
  }
}
