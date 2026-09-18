/* ==========================================================================
   theme.js  |  one ink, one accent
   --------------------------------------------------------------------------
   The site is monochrome: every mark is the same warm off-white at a different
   wash, and numbers sit in the page ink so the canvas reads as part of the
   page. One blue runs through the views, and it only ever marks a result the
   work has produced.
   ========================================================================== */

export function wash(alpha) {
  return "rgba(236, 235, 231, " + alpha + ")";
}

/* the accent: the result, once the work has produced one */
export const accent = "#74b6e8";

export function tint(alpha) {
  return "rgba(116, 182, 232, " + alpha + ")";
}

/* numbers printed on top of a filled mark, in the page background */
export const ink = "rgba(6, 6, 6, 0.85)";

export const rule = "rgba(236, 235, 231, 0.13)";

/* nodes are filled solid, so they read as marks rather than washes */
export const node = {
  idle: "#2b2b29",
  frontier: "#63625e",
  visited: "#c7c5c0",
  active: "#ecebe7"
};

export const font = '"Schibsted Grotesk", system-ui, -apple-system, sans-serif';
