// src/generators/algebra/algebraicDenominatorGenerators.js
//
// Equations with x in the denominator — Haese 3B, syllabus E2.5c ("linear
// algebraic denominators"). In Equations, after the two fraction skills,
// whose denominators are numbers or x alone:
//
//   foundation  a number over a linear expression: a / (px + q) = c
//   core        x above and below: (px + q) / (rx + s) = c
//   stretch     one fraction equal to another: a / (x + b) = c / (x + d)
//
// Each is built from its whole-number solution, and no denominator is zero
// there.

import _ from 'lodash';

const NL = '\n';
const nonZero = (a, b) => _.sample(_.range(a, b + 1).filter((v) => v !== 0));
/** px + q: "2x + 3", "x - 4", "-x + 5", "3x". */
const lin = (p, q) => {
  const x = p === 1 ? 'x' : p === -1 ? '-x' : `${p}x`;
  if (q === 0) return x;
  return `${x} ${q < 0 ? '-' : '+'} ${Math.abs(q)}`;
};
const times = (c, p, q) => `${c}(${lin(p, q)})`;

export const generateAlgebraicDenominators = (options = {}) => {
  const { difficulty = 'core' } = options;
  const metadata = { topic: 'algebraic-denominators', difficulty };
  const instruction = 'Solve';

  for (;;) {
    const x = nonZero(-9, 12);

    if (difficulty === 'foundation') {
      const p = _.sample([1, 1, 2, 3]);
      const q = nonZero(-9, 9);
      const den = p * x + q;
      const c = _.random(2, 9);
      if (den <= 0 || den > 12) continue;
      const a = c * den;
      return {
        instruction,
        questionMath: `\\frac{${a}}{${lin(p, q)}} = ${c}`,
        answer: `x = ${x}`,
        workingOut: [
          `${a} = ${times(c, p, q)}`,
          `${lin(p, q)} = ${den}`,
          ...(p === 1 ? [] : [`${p}x = ${den - q}`]),
          `x = ${x}`,
        ].join(NL),
        metadata,
      };
    }

    if (difficulty === 'core') {
      const r = _.sample([1, 1, 2, 3]);
      const s = nonZero(-8, 8);
      const c = _.random(2, 6);
      const p = _.random(1, 12);
      const den = r * x + s;
      if (den === 0 || p === c * r) continue;
      const q = c * den - p * x;
      if (q === 0 || Math.abs(q) > 40) continue;
      return {
        instruction,
        questionMath: `\\frac{${lin(p, q)}}{${lin(r, s)}} = ${c}`,
        answer: `x = ${x}`,
        workingOut: [
          `${lin(p, q)} = ${times(c, r, s)}`,
          `${lin(p, q)} = ${lin(c * r, c * s)}`,
          `${lin(p - c * r, 0)} = ${c * s - q}`,
          `x = ${x}`,
        ].join(NL),
        metadata,
      };
    }

    // stretch: cross-multiply two fractions.
    const [a, c] = _.sampleSize(_.range(2, 13), 2);
    const b = nonZero(-8, 8), d = nonZero(-8, 8);
    if (b === d || x + b === 0 || x + d === 0) continue;
    // a(x + d) = c(x + b) at this x: choose d to fit, from a, b, c, x.
    const dFit = (c * (x + b)) / a - x;
    if (!Number.isInteger(dFit) || dFit === 0 || dFit === b || Math.abs(dFit) > 9 || x + dFit === 0) continue;
    return {
      instruction,
      questionMath: `\\frac{${a}}{${lin(1, b)}} = \\frac{${c}}{${lin(1, dFit)}}`,
      answer: `x = ${x}`,
      workingOut: [
        `${times(a, 1, dFit)} = ${times(c, 1, b)}`,
        `${lin(a, a * dFit)} = ${lin(c, c * b)}`,
        `${lin(a - c, 0)} = ${c * b - a * dFit}`,
        `x = ${x}`,
      ].join(NL),
      metadata,
    };
  }
};
