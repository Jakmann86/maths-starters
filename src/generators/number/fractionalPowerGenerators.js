// src/generators/number/fractionalPowerGenerators.js
//
// Fractional indices. Haese Chapter 6 covers indices only as far as zero and
// negative powers (6A-6C), so this sits alongside that rather than inside it,
// and follows the Y9 do-nows, which drill the root-to-power conversion, and
// the annual revision paper, which asks for (125y^6 b^-9)^(2/3).
//
//   foundation  a root written as a single power     \sqrt[5]{x^2} -> x^(2/5)
//   core        evaluate a fractional power          27^(2/3)      -> 9
//   stretch     negative fractional powers, two ways
//                 evaluate  16^(-3/4)                -> 1/8
//                 convert   1/\sqrt[5]{x^3}          -> x^(-3/5)
//
// EVERY question here falls back to KaTeX, and that is by design, not a
// parser bug: SPEC §6 sends "any exponent or subscript other than the bare
// degree suffix" to KaTeX unconditionally, and names index-law working as one
// of the cases it means. The whole Indices topic already behaves this way.
// See the handoff note about Board.jsx's stale comment on this.

import _ from 'lodash';

const NL = '\n';

const gcd = (a, b) => (b ? gcd(b, a % b) : a);

// Letters a student meets as an unknown. 'n' is deliberately absent: it reads
// as the root index everywhere else in this file.
const VARS = ['x', 'y', 'a', 'b', 'p', 't'];

// A square root takes no index, every other root does.
const rootTex = (n, inner) => (n === 2 ? `\\sqrt{${inner}}` : `\\sqrt[${n}]{${inner}}`);
const fracPow = (base, m, n, negative) => `${base}^{${negative ? '-' : ''}\\frac{${m}}{${n}}}`;

/* ------------------------------------------------------------------ pools */

// Index pairs for the conversion bands. m/n must already be in lowest terms,
// or the question has two defensible answers — \sqrt[4]{x^2} is x^(2/4) to a
// student mid-conversion and x^(1/2) once simplified, and a starter cannot
// mark both. m >= 2 keeps every question a genuine power under the root,
// which is the form both the do-nows and the revision paper use.
const INDEX_PAIRS = [];
for (let n = 2; n <= 6; n += 1) {
  for (let m = 2; m <= 7; m += 1) {
    if (gcd(m, n) === 1) INDEX_PAIRS.push([m, n]);
  }
}

// Evaluable fractional powers: a = k^n, so a^(m/n) = k^m exactly and no
// calculator is needed. Both the base and the answer are held under 1000 —
// past that a student stops recognising the number as a power at all.
//
// This pool is small and cannot be made much bigger: there are only so many
// perfect powers under 1000. Measured, the whole universe is 44 questions on
// 22 answers. Raising the caps to 3000 buys 62 questions on 28 answers, which
// is not worth asking a class to recognise 2744 as a cube — the same argument
// CLAUDE.md §8 makes about a cube having one parameter. The root index stops
// at 5 for the same reason: a sixth root is legitimate but reads as a
// curiosity rather than 0607.
const buildEvaluable = (maxBase, maxAnswer) => {
  const out = [];
  for (let k = 2; k <= 10; k += 1) {
    for (let n = 2; n <= 5; n += 1) {
      const base = k ** n;
      if (base > maxBase) continue;
      for (let m = 2; m <= 7; m += 1) {
        if (gcd(m, n) !== 1) continue;
        const answer = k ** m;
        if (answer > maxAnswer) continue;
        out.push({ k, n, m, base, answer });
      }
    }
  }
  return out;
};

const EVALUABLE = buildEvaluable(1000, 1000);
// A negative power turns the answer into 1/k^m, so the denominator is held
// much lower — 1/729 is arithmetically fine and pedagogically useless.
const EVALUABLE_NEG = buildEvaluable(1000, 125);

/* ------------------------------------------------------------- the skill */

export const generateFractionalPowers = (options = {}) => {
  const { difficulty = 'core' } = options;
  if (difficulty === 'core') return coreBand();
  if (difficulty === 'stretch') return stretchBand();
  return foundationBand();
};

/* foundation: notation only. The root becomes the denominator. */
function foundationBand() {
  const [m, n] = _.sample(INDEX_PAIRS);
  const v = _.sample(VARS);
  const q = rootTex(n, `${v}^{${m}}`);

  return {
    instruction: `Write as a single power of ${v}`,
    questionMath: q,
    answer: fracPow(v, m, n),
    workingOut:
      `${q} = \\left(${v}^{${m}}\\right)^{\\frac{1}{${n}}}${NL}` +
      `= ${fracPow(v, m, n)}`,
    metadata: { topic: 'fractional-powers', difficulty: 'foundation' },
  };
}

/* core: take the root first, then the power — the order that keeps the
   numbers small enough to do in your head. */
function coreBand() {
  const { k, n, m, base, answer } = _.sample(EVALUABLE);

  return {
    instruction: 'Evaluate',
    questionMath: fracPow(base, m, n),
    answer: String(answer),
    workingOut:
      `${fracPow(base, m, n)} = \\left(${rootTex(n, base)}\\right)^{${m}}${NL}` +
      `= ${k}^{${m}}${NL}` +
      `= ${answer}`,
    metadata: { topic: 'fractional-powers', difficulty: 'core' },
  };
}

/* stretch: the negative index, reached two different ways. */
function stretchBand() {
  if (_.random(0, 1)) {
    const { k, n, m, base, answer } = _.sample(EVALUABLE_NEG);
    return {
      instruction: 'Evaluate',
      questionMath: fracPow(base, m, n, true),
      answer: `\\frac{1}{${answer}}`,
      workingOut:
        `${fracPow(base, m, n, true)} = \\frac{1}{${fracPow(base, m, n)}}${NL}` +
        `= \\frac{1}{\\left(${rootTex(n, base)}\\right)^{${m}}} = \\frac{1}{${k}^{${m}}}${NL}` +
        `= \\frac{1}{${answer}}`,
      metadata: { topic: 'fractional-powers', difficulty: 'stretch' },
    };
  }

  // The reciprocal of a root: two steps past foundation, since the root has
  // to become a fractional power before the reciprocal can become a sign.
  const [m, n] = _.sample(INDEX_PAIRS);
  const v = _.sample(VARS);
  const q = `\\frac{1}{${rootTex(n, `${v}^{${m}}`)}}`;

  return {
    instruction: `Write as a single power of ${v}`,
    questionMath: q,
    answer: fracPow(v, m, n, true),
    workingOut:
      `${q} = \\frac{1}{${fracPow(v, m, n)}}${NL}` +
      `= ${fracPow(v, m, n, true)}`,
    metadata: { topic: 'fractional-powers', difficulty: 'stretch' },
  };
}
