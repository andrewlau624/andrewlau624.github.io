/* ==========================================================================
   array.js  |  the bar view
   --------------------------------------------------------------------------
   Sorting, drawn as bars with their values printed above them. A view owns
   how to make an input, how to fold an event into its state, and how to draw.
   The shell owns the clock and the controls.

   Events
     ["compare", i, j]   look at two bars
     ["swap", i, j]      exchange them
     ["place", i, j]     exchange them, on a different line of the code
     ["set", i, value]   overwrite one (merge sort writes back)
     ["mark", i, tag]    tag one "sorted"
     ["pivot", i]        tag one "pivot"
     ["done"]            everything is in order
   ========================================================================== */

import { wash, tint, font } from "../theme.js";

export default {
  label: "Sorting",

  defaults: { size: 20 },

  make(params, rng) {
    const n = params.size | 0;
    const values = Array.from({ length: n }, (_, i) => i + 1);
    for (let i = n - 1; i > 0; i -= 1) {
      const j = Math.floor(rng() * (i + 1));
      const swap = values[i];
      values[i] = values[j];
      values[j] = swap;
    }
    return { values };
  },

  init(input) {
    return {
      values: input.values.slice(),
      tags: input.values.map(() => "base"),
      hot: null
    };
  },

  apply(state, event) {
    const op = event[0];
    if (op === "compare") {
      state.hot = [event[1], event[2]];
    } else if (op === "swap" || op === "place") {
      const a = event[1];
      const b = event[2];
      const swap = state.values[a];
      state.values[a] = state.values[b];
      state.values[b] = swap;
      state.hot = [a, b];
    } else if (op === "set") {
      state.values[event[1]] = event[2];
      state.hot = [event[1]];
    } else if (op === "mark") {
      state.tags[event[1]] = event[2];
    } else if (op === "pivot") {
      state.tags[event[1]] = "pivot";
    } else if (op === "done") {
      state.tags.fill("sorted");
      state.hot = null;
    }
  },

  draw(ctx, state, w, h) {
    const n = state.values.length;
    const max = Math.max.apply(null, state.values);
    const bw = w / n;
    const gap = Math.min(2, bw * 0.16);
    const base = h;
    const room = h - 22;
    const showNumbers = bw >= 16;
    const size = Math.max(9, Math.min(13, bw * 0.44));

    ctx.textAlign = "center";
    ctx.textBaseline = "alphabetic";
    ctx.font = size + "px " + font;

    for (let i = 0; i < n; i += 1) {
      const hot = state.hot !== null && (state.hot[0] === i || state.hot[1] === i);
      const tag = state.tags[i];
      let fill = wash(0.3);
      if (tag === "sorted") fill = tint(0.5);
      else if (tag === "pivot") fill = wash(0.85);
      if (hot) fill = wash(1);

      const bar = Math.max(1, (state.values[i] / max) * room);
      const x = i * bw + gap / 2;
      const y = base - bar;
      ctx.fillStyle = fill;
      ctx.fillRect(x, y, Math.max(1, bw - gap), bar);

      if (showNumbers) {
        ctx.fillStyle = hot ? wash(0.95) : tag === "sorted" ? tint(0.8) : wash(0.5);
        ctx.fillText(String(state.values[i]), i * bw + bw / 2, y - 4);
      }
    }

    ctx.textAlign = "left";
  }
};
