// src/generators/algebra/variationModelGenerators.js
//
// The best variation model for a table — syllabus E2.8b ("identify the best
// variation model for given data"), Haese 30C. Last in Ratio and proportion,
// after direct and inverse variation. The table follows Rayner's layout,
// headed down the side, and the data fit the model exactly:
//
//   foundation  y ∝ x or y ∝ 1/x, both offered
//   core        y ∝ x², x³ or √x, all three offered
//   stretch     nothing offered: any of those, or y ∝ 1/x² or 1/√x
//
// Every table holds a pair where x doubles (or, for a root, multiplies by
// four), so the model can be seen from how y changes there, and the working
// shows that before finding k.

import _ from 'lodash';
import { lcm } from '../shared';
import { PAIRS } from './variationGenerators';

const NL = '\n';
const SQUARES = [1, 4, 9, 16, 25, 36, 49, 64, 81, 100];

/** x^n written in TeX, for n = 1, 2, 3, ½ (and their negatives' denominators). */
const pow = (v, n) => (n === 1 ? v : n === 0.5 ? `\\sqrt{${v}}` : `${v}^${n}`);
/** The model's right-hand side, k given: "3l^2", "\frac{24}{l}". */
const rhs = (k, v, n) => (n > 0 ? `${k}${pow(v, n)}` : `\\frac{${k}}{${pow(v, -n)}}`);
const value = (x, n) => (Math.abs(n) === 0.5 ? Math.sqrt(x) : x ** Math.abs(n));

/** Four x values, increasing, holding a pair a and step × a. */
function xs(n) {
  const root = Math.abs(n) === 0.5;
  const pool = root ? SQUARES : _.range(1, n === 3 ? 7 : 11);
  const step = root ? 4 : 2;
  const a = _.sample(pool.filter((v) => pool.includes(v * step)));
  const rest = _.sampleSize(pool.filter((v) => v !== a && v !== a * step), 2);
  return _.sortBy([a, a * step, ...rest]);
}

export const generateVariationModel = (options = {}) => {
  const { difficulty = 'core' } = options;
  const metadata = { topic: 'variation-model', difficulty };
  // Not l: in the instruction's sans serif it reads as I or 1.
  const [D, I] = _.sample(PAIRS.filter(([, v]) => v !== 'l'));
  const ns = { foundation: [1, -1], core: [2, 3, 0.5], stretch: [-2, -2, -0.5, -0.5, -1, 2, 3, 0.5] }[difficulty];

  for (;;) {
    const n = _.sample(ns);
    const x = xs(n);
    let k;
    if (n > 0) {
      k = _.random(2, n === 3 ? 6 : n === 2 ? 9 : 12);
    } else {
      // k a multiple of every x^|n|, so each y is whole.
      const base = x.reduce((acc, v) => lcm(acc, value(v, n)), 1);
      k = base * _.random(1, 4);
      if (k > (n === -2 ? 3600 : 720) || k < 2) continue;
    }
    const y = x.map((v) => (n > 0 ? k * value(v, n) : k / value(v, n)));
    if (Math.max(...y) > 3600) continue;

    const root = Math.abs(n) === 0.5;
    const step = root ? 4 : 2;
    const i = x.findIndex((v) => x.includes(v * step));
    const j = x.indexOf(x[i] * step);
    const factor = step ** Math.abs(n);
    const model = n > 0 ? `${D} \\propto ${pow(I, n)}` : `${D} \\propto \\frac{1}{${pow(I, -n)}}`;
    const answer = `${D} = ${rhs(k, I, n)}`;
    // k from the first column: y ÷ x^n, or y × x^n for an inverse.
    const kLine = n > 0
      ? `k = ${y[0]} \\div ${pow(x[0], n)} = ${k}`
      : `k = ${y[0]} \\times ${pow(x[0], -n)} = ${k}`;

    const offered = {
      foundation: `${D} \\propto ${I} \\ \\text{ or } \\ ${D} \\propto \\frac{1}{${I}}`,
      core: `${D} \\propto ${I}^2, \\ \\ ${D} \\propto ${I}^3 \\ \\text{ or } \\ ${D} \\propto \\sqrt{${I}}`,
    }[difficulty];

    return {
      instruction: `Find a formula for ${D} in terms of ${I}`,
      ...(offered ? { questionMath: offered } : {}),
      answer,
      workingOut: [
        `${I}: ${x[i]} \\to ${x[j]}, \\ \\ ${D}: ${y[i]} \\to ${y[j]}`,
        `${I} \\times ${step} \\Rightarrow ${D} ${n > 0 ? '\\times' : '\\div'} ${factor}, \\text{ so } ${model}`,
        kLine,
        answer,
      ].join(NL),
      visualization: { type: 'table', header: 'column', rows: [[I, ...x.map(String)], [D, ...y.map(String)]] },
      metadata,
    };
  }
};
