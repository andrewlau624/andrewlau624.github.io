/* ==========================================================================
   grid.js  |  the grid view
   --------------------------------------------------------------------------
   Pathfinding, drawn as cells, with the distance (or visit order) printed in
   each cell the search has reached. Walls are part of the input, laid down in
   init; the algorithm only yields what it discovers.

   Events
     ["frontier", r, c]       reachable, not yet looked at
     ["visit", r, c, value]   taken off the frontier, with its number
     ["path", r, c, value]    on the final route
   ========================================================================== */

import { wash, ink, accent, font } from "../theme.js";

export default {
  label: "Pathfinding",

  defaults: { size: 16 },

  make(params, rng) {
    const cols = params.size | 0;
    const rows = Math.max(8, Math.round(cols * 0.62));
    const walls = new Uint8Array(rows * cols);
    const start = { r: rows >> 1, c: 0 };
    const end = { r: rows >> 1, c: cols - 1 };
    const index = (r, c) => r * cols + c;

    for (let r = 0; r < rows; r += 1) {
      for (let c = 0; c < cols; c += 1) {
        if (r === start.r && c === start.c) continue;
        if (r === end.r && c === end.c) continue;
        if (rng() < 0.22) walls[index(r, c)] = 1;
      }
    }

    /* carve one wavy route across the board, so a path always exists even
       when the random walls close everything else off */
    let r = start.r;
    let c = 0;
    walls[index(r, c)] = 0;
    let guard = 0;
    while (c < cols - 1 && guard < rows * cols * 2) {
      guard += 1;
      const roll = rng();
      let dr = 0;
      if (roll > 0.72) dr = 1;
      else if (roll > 0.6) dr = -1;
      const nr = r + dr;
      if (nr >= 0 && nr < rows) r = nr;
      c += 1;
      walls[index(r, c)] = 0;
    }
    while (r !== end.r) {
      r += r < end.r ? 1 : -1;
      walls[index(r, cols - 1)] = 0;
    }
    walls[index(start.r, start.c)] = 0;
    walls[index(end.r, end.c)] = 0;

    return { rows, cols, walls, start, end };
  },

  init(input) {
    const cells = new Uint8Array(input.rows * input.cols);
    for (let i = 0; i < cells.length; i += 1) {
      if (input.walls[i]) cells[i] = 1;
    }
    return {
      rows: input.rows,
      cols: input.cols,
      cells,
      value: new Array(input.rows * input.cols).fill(null),
      start: input.start,
      end: input.end
    };
  },

  apply(state, event) {
    const op = event[0];
    const k = event[1] * state.cols + event[2];
    if (op === "frontier") {
      if (state.cells[k] === 0) state.cells[k] = 2;
    } else if (op === "visit") {
      state.cells[k] = 3;
      state.value[k] = event[3];
    } else if (op === "path") {
      state.cells[k] = 4;
      state.value[k] = event[3];
    }
  },

  draw(ctx, state, w, h) {
    const { rows, cols, cells, value } = state;
    const cell = Math.min(w / cols, h / rows);
    const ox = (w - cell * cols) / 2;
    const oy = (h - cell * rows) / 2;
    const inset = Math.max(1, cell * 0.1);
    const showNumbers = cell >= 17;
    const size = Math.max(8, Math.min(12, cell * 0.34));

    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = size + "px " + font;

    for (let r = 0; r < rows; r += 1) {
      for (let c = 0; c < cols; c += 1) {
        const k = r * cols + c;
        const type = cells[k];
        const x = ox + c * cell + inset / 2;
        const y = oy + r * cell + inset / 2;
        const side = cell - inset;

        if (type === 1) {
          ctx.fillStyle = wash(0.42);
          ctx.fillRect(x, y, side, side);
        } else if (type === 4) {
          ctx.fillStyle = accent;
          ctx.fillRect(x, y, side, side);
        } else {
          ctx.fillStyle = wash(type === 2 ? 0.14 : type === 3 ? 0.09 : 0.045);
          ctx.fillRect(x, y, side, side);
        }

        if (showNumbers && value[k] !== null && (type === 3 || type === 4)) {
          ctx.fillStyle = type === 4 ? ink : wash(0.6);
          ctx.fillText(String(value[k]), ox + c * cell + cell / 2, oy + r * cell + cell / 2 + 0.5);
        }
      }
    }

    ring(ctx, ox, oy, cell, state.start, wash(0.95), 1.4);
    ring(ctx, ox, oy, cell, state.end, wash(0.95), 1.4);
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
  }
};

function ring(ctx, ox, oy, cell, pos, color, width) {
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  const pad = Math.max(1.5, cell * 0.16);
  ctx.strokeRect(ox + pos.c * cell + pad, oy + pos.r * cell + pad, cell - pad * 2, cell - pad * 2);
}
