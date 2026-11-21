// Test support only. Checks variation-model from the table alone: the
// answer is read as y = kx^n (n = 1, 2, 3, ½, or their negatives as
// fractions), must fit every column exactly, and must be the only model
// of that kind that fits any k. Each working line is recomputed from the
// table.

const must = (cond, msg) => { if (!cond) throw new Error(msg); };
const EPS = 1e-9;
const MODELS = [1, 2, 3, 0.5, -1, -2, -0.5];
const value = (x, n) => (Math.abs(n) === 0.5 ? Math.sqrt(x) : x ** Math.abs(n));
const f = (k, x, n) => (n > 0 ? k * value(x, n) : k / value(x, n));
const powTex = (v, n) => (n === 1 ? v : n === 0.5 ? `\\sqrt{${v}}` : `${v}^${n}`);

/** "T = 3l^2", "y = \frac{24}{x}", "P = \frac{8}{\sqrt{a}}" → { D, I, k, n }. */
export function readModel(s) {
  let m = /^([A-Za-z]) = (\d+)(?:([a-z])(?:\^(\d))?|\\sqrt\{([a-z])\})$/.exec(s);
  if (m) {
    const [, D, k, v, e, r] = m;
    return { D, I: v || r, k: Number(k), n: r ? 0.5 : e ? Number(e) : 1 };
  }
  m = /^([A-Za-z]) = \\frac\{(\d+)\}\{(?:([a-z])(?:\^(\d))?|\\sqrt\{([a-z])\})\}$/.exec(s);
  must(m, `a model y = kx^n or k / x^n: ${s}`);
  const [, D, k, v, e, r] = m;
  return { D, I: v || r, k: Number(k), n: r ? -0.5 : e ? -Number(e) : -1 };
}

export function checkVariationModel(q, band) {
  must(q.metadata?.topic === 'variation-model' && q.metadata.difficulty === band, 'metadata');
  must(!q.answerUnits && !q.questionText, 'no units or question text');
  must(typeof q.workingOut === 'string' && !/\\n(?![a-z])/.test(q.workingOut), 'real newlines');
  const t = q.visualization;
  must(t?.type === 'table' && t.header === 'column' && t.rows.length === 2, 'a two-row table headed down the side');
  const [[I, ...xr], [D, ...yr]] = t.rows;
  must(xr.length === 4 && yr.length === 4, 'four columns');
  const x = xr.map(Number), y = yr.map(Number);
  [...x, ...y].forEach((v) => must(Number.isInteger(v) && v > 0, 'whole positive values'));
  x.slice(1).forEach((v, i) => must(v > x[i], 'x increasing'));
  must(q.instruction === `Find a formula for ${D} in terms of ${I}`, 'instruction names the two letters');
  must(I !== 'l', 'no l, which reads as 1 in the instruction');
  must(Math.max(...y) <= 3600, 'y readable');

  const a = readModel(q.answer);
  must(a.D === D && a.I === I, 'the answer uses the table letters');
  must(a.k >= 2, 'k at least 2, so k is written');
  x.forEach((v, i) => must(Math.abs(f(a.k, v, a.n) - y[i]) < EPS, `the model misses (${v}, ${y[i]})`));
  // The only model that fits: any other n would need one k for every column.
  MODELS.filter((n) => n !== a.n).forEach((n) => {
    const k = n > 0 ? y[0] / value(x[0], n) : y[0] * value(x[0], n);
    must(!x.every((v, i) => Math.abs(f(k, v, n) - y[i]) < 1e-6), `y ∝ x^${n} fits too`);
  });
  const allowed = { foundation: [1, -1], core: [2, 3, 0.5], stretch: [2, 3, 0.5, -1, -2, -0.5] }[band];
  must(allowed.includes(a.n), `a model for ${band}`);
  if (band === 'stretch') must(!q.questionMath, 'Stretch offers no models');
  else {
    const offered = band === 'foundation'
      ? `${D} \\propto ${I} \\ \\text{ or } \\ ${D} \\propto \\frac{1}{${I}}`
      : `${D} \\propto ${I}^2, \\ \\ ${D} \\propto ${I}^3 \\ \\text{ or } \\ ${D} \\propto \\sqrt{${I}}`;
    must(q.questionMath === offered, 'the models offered');
  }

  const w = q.workingOut.split('\n');
  must(w.length === 4 && w[3] === q.answer, 'the step, the model, k, the answer');
  const step = Math.abs(a.n) === 0.5 ? 4 : 2;
  const m = new RegExp(`^${I}: (\\d+) \\\\to (\\d+), \\\\ \\\\ ${D}: (\\d+) \\\\to (\\d+)$`).exec(w[0]);
  must(m, `the step read from the table: ${w[0]}`);
  const [x1, x2, y1, y2] = m.slice(1).map(Number);
  must(x2 === x1 * step && x.includes(x1) && x.includes(x2), `a pair from the table, multiplied by ${step}`);
  must(y[x.indexOf(x1)] === y1 && y[x.indexOf(x2)] === y2, 'its y values from the table');
  const factor = a.n > 0 ? y2 / y1 : y1 / y2;
  must(Math.abs(factor - step ** Math.abs(a.n)) < EPS, 'the factor is right for the model');
  const model = a.n > 0 ? `${D} \\propto ${powTex(I, a.n)}` : `${D} \\propto \\frac{1}{${powTex(I, -a.n)}}`;
  must(w[1] === `${I} \\times ${step} \\Rightarrow ${D} ${a.n > 0 ? '\\times' : '\\div'} ${factor}, \\text{ so } ${model}`, `the model from the step: ${w[1]}`);
  const kLine = a.n > 0
    ? `k = ${y[0]} \\div ${powTex(x[0], a.n)} = ${a.k}`
    : `k = ${y[0]} \\times ${powTex(x[0], -a.n)} = ${a.k}`;
  must(w[2] === kLine, `k from the first column: ${w[2]}`);
  return { kind: { 1: 'direct', '-1': 'inverse', 2: 'square', 3: 'cube', 0.5: 'root', '-2': 'inverse square', '-0.5': 'inverse root' }[a.n] };
}
