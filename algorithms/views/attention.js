/* ==========================================================================
   attention.js  |  the attention view
   --------------------------------------------------------------------------
   Self attention on a short phrase, drawn as the weight matrix you see in
   transformer diagrams. Queries run down the left, keys across the top. Each
   cell shows its number: first the raw score, then, once softmax has run, the
   weight. The block on the right is the output each query writes.

   Events
     ["row", i]              start query i
     ["score", i, j, value]  raw score for query i against key j
     ["weight", i, j, value] the softmax weight, which replaces the score
     ["output", i, k, value] element k of query i's output
   ========================================================================== */

import { wash, ink, accent, tint, font } from "../theme.js";

function fmt(value) {
  return (Math.round(value * 100) / 100).toFixed(2);
}

export default {
  label: "Attention",

  defaults: { size: 5 },

  make() {
    /* a phrase, and a small hand-set embedding per token. The embeddings are
       one-hot, so two tokens score high only when they share a feature, which
       is exactly the intuition a dot product is meant to show */
    const tokens = ["the", "cat", "sat", "on", "mat"];
    const emb = [
      [1, 0, 0, 0],
      [0, 1, 0, 0],
      [0, 0, 1, 0],
      [0, 0, 0, 1],
      [0, 1, 0, 0]
    ];
    return { tokens, emb };
  },

  init(input) {
    const n = input.tokens.length;
    const d = input.emb[0].length;
    const matrix = () => Array.from({ length: n }, () => new Array(n).fill(null));
    return {
      tokens: input.tokens,
      emb: input.emb,
      n,
      d,
      row: -1,
      scores: matrix(),
      weights: matrix(),
      outputs: Array.from({ length: n }, () => new Array(d).fill(null)),
      done: false
    };
  },

  apply(state, event) {
    const op = event[0];
    if (op === "row") {
      state.row = event[1];
    } else if (op === "score") {
      state.scores[event[1]][event[2]] = event[3];
    } else if (op === "weight") {
      state.weights[event[1]][event[2]] = event[3];
    } else if (op === "output") {
      state.outputs[event[1]][event[2]] = event[3];
    } else if (op === "done") {
      state.done = true;
      state.row = -1;
    }
  },

  draw(ctx, state, w, h) {
    const { tokens, n, d, scores, weights, outputs, row } = state;
    const labelW = 58;
    const labelH = 42;
    const gap = 18;

    const outCell = Math.min(30, Math.max(16, (w - labelW - gap) * 0.3 / d));
    const gridRoom = w - labelW - gap - outCell * d - gap;
    const cell = Math.floor(Math.min(gridRoom / n, (h - labelH - 8) / n));
    const gridW = cell * n;
    const blockW = labelW + gridW + gap + d * outCell;
    const gx = Math.max(labelW, (w - blockW) / 2 + labelW);
    const gy = Math.max(labelH, (h - (labelH + gridW)) / 2 + labelH);
    const ox = gx + gridW + gap;
    const top = gy - labelH;

    ctx.textBaseline = "middle";

    /* the labels */
    ctx.font = "11px " + font;
    ctx.textAlign = "center";
    ctx.fillStyle = wash(0.5);
    ctx.fillText("keys", gx + gridW / 2, top + 12);
    for (let c = 0; c < n; c += 1) {
      ctx.fillStyle = wash(0.75);
      ctx.fillText(tokens[c], gx + c * cell + cell / 2, gy - 12);
    }
    ctx.textAlign = "right";
    for (let r = 0; r < n; r += 1) {
      ctx.fillStyle = row === r ? wash(0.95) : wash(0.6);
      ctx.fillText(tokens[r], gx - 10, gy + r * cell + cell / 2);
    }
    ctx.textAlign = "left";
    ctx.font = "10px " + font;
    ctx.fillStyle = wash(0.4);
    ctx.fillText("output", ox, top + 12);

    /* the matrix */
    const numSize = Math.max(9, Math.min(13, cell * 0.34));
    ctx.font = numSize + "px " + font;
    ctx.textAlign = "center";
    for (let r = 0; r < n; r += 1) {
      for (let c = 0; c < n; c += 1) {
        const x = gx + c * cell;
        const y = gy + r * cell;
        const weight = weights[r][c];
        const score = scores[r][c];
        const lum = weight !== null ? 0.06 + weight * 0.94 : 0.02;
        ctx.fillStyle = wash(lum);
        ctx.fillRect(x + 1.5, y + 1.5, cell - 3, cell - 3);
        if (score !== null && weight === null) {
          ctx.strokeStyle = wash(0.14);
          ctx.lineWidth = 1;
          ctx.strokeRect(x + 1.5, y + 1.5, cell - 3, cell - 3);
        }
        const value = weight !== null ? weight : score;
        if (value !== null && cell >= 20) {
          ctx.fillStyle = weight !== null ? (lum > 0.32 ? ink : wash(0.92)) : wash(0.62);
          ctx.fillText(fmt(value), x + cell / 2, y + cell / 2 + 0.5);
        }
      }
    }

    if (row >= 0) {
      ctx.strokeStyle = wash(0.4);
      ctx.lineWidth = 1;
      ctx.strokeRect(gx + 0.5, gy + row * cell + 0.5, gridW - 1, cell - 1);
    }

    /* the output block */
    const outSize = Math.max(8, Math.min(11, outCell * 0.4));
    ctx.font = outSize + "px " + font;
    ctx.textAlign = "center";
    for (let r = 0; r < n; r += 1) {
      const y = gy + r * cell + (cell - outCell) / 2;
      for (let k = 0; k < d; k += 1) {
        const x = ox + k * outCell;
        const value = outputs[r][k];
        ctx.fillStyle = value !== null ? tint(0.22) : wash(0.03);
        ctx.fillRect(x + 1, y + 1, outCell - 2, outCell - 2);
        if (value !== null && outCell >= 18) {
          ctx.fillStyle = accent;
          ctx.fillText(fmt(value), x + outCell / 2, y + outCell / 2 + 0.5);
        }
      }
    }

    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
  }
};
