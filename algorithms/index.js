/* ==========================================================================
   index.js  |  the registry
   --------------------------------------------------------------------------
   Add an algorithm by writing one module next to the others and adding it to
   the two lists below. If it uses an existing view it gets the whole shell —
   playback, the code panel, the stage — for free.

   A module carries: id, name, view, time, omega, theta, space, blurb, code
   (pseudocode), lines (which code line each event lights up), and *run, a
   generator. The three time bounds land in the footer under the pseudocode;
   space is a single bound.
   ========================================================================== */

import array from "./views/array.js";
import grid from "./views/grid.js";
import graph from "./views/graph.js";
import tree from "./views/tree.js";
import attention from "./views/attention.js";

import bubble from "./sorts/bubble.js";
import insertion from "./sorts/insertion.js";
import selection from "./sorts/selection.js";
import quick from "./sorts/quick.js";
import merge from "./sorts/merge.js";

import gridBfs from "./grid/bfs.js";
import gridDfs from "./grid/dfs.js";
import gridAstar from "./grid/astar.js";

import graphDijkstra from "./graph/dijkstra.js";
import graphKruskal from "./graph/kruskal.js";
import graphPrim from "./graph/prim.js";

import treeBst from "./tree/bst.js";

import attentionSelf from "./attention/self.js";

export const views = { array, grid, graph, tree, attention };

export const algorithms = [
  bubble,
  insertion,
  selection,
  quick,
  merge,
  gridBfs,
  gridDfs,
  gridAstar,
  graphDijkstra,
  graphKruskal,
  graphPrim,
  treeBst,
  attentionSelf
];
