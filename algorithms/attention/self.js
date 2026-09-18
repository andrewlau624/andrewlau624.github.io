/* ==========================================================================
   self.js  |  self attention
   --------------------------------------------------------------------------
   Scaled dot product attention with the queries, keys and values all set to
   the token embeddings, so the whole computation is one phrase and a handful
   of numbers. Scores are q·k / sqrt(d); softmax turns each row into weights
   that sum to 1; the output is the weights applied to the values.
   ========================================================================== */

export default {
  id: "attention-self",
  name: "Self Attention",
  view: "attention",
  time: "O(n² · d)",
  omega: "Ω(n² · d)",
  theta: "Θ(n² · d)",
  space: "O(n²)",
  blurb: "Every token scores itself against every token, softmax turns each row into weights that sum to 1, and the output mixes the values by those weights.",
  code: [
    "for each query i:",
    "  for each key j:",
    "    score[i][j] = q_i · k_j / sqrt(d)",
    "  weights[i] = softmax(scores[i])",
    "  output[i] = Σ weights[i][j] * v_j",
    "done"
  ],
  lines: { row: 0, score: 2, weight: 3, output: 4, done: 5 },

  *run(input) {
    const { emb } = input;
    const n = emb.length;
    const d = emb[0].length;
    const scale = 1 / Math.sqrt(d);

    for (let i = 0; i < n; i += 1) {
      yield ["row", i];

      const scores = [];
      for (let j = 0; j < n; j += 1) {
        let dot = 0;
        for (let k = 0; k < d; k += 1) dot += emb[i][k] * emb[j][k];
        const score = dot * scale;
        scores.push(score);
        yield ["score", i, j, score];
      }

      const max = Math.max.apply(null, scores);
      let sum = 0;
      const weights = scores.map((score) => {
        const value = Math.exp(score - max);
        sum += value;
        return value;
      });
      for (let j = 0; j < n; j += 1) {
        weights[j] /= sum;
        yield ["weight", i, j, weights[j]];
      }

      const output = new Array(d).fill(0);
      for (let j = 0; j < n; j += 1) {
        for (let k = 0; k < d; k += 1) output[k] += weights[j] * emb[j][k];
      }
      for (let k = 0; k < d; k += 1) yield ["output", i, k, output[k]];
    }

    yield ["done"];
  }
};
