// src/generators/number/fractionalPowerGenerators.js
//
// Fractional indices. Haese Chapter 6 covers indices only as far as zero and
// negative powers (6A-6C), so this sits alongside that rather than inside it,
// and follows the Y9 do-nows, which drill the root-to-power conversion, and
// the annual revision paper, which asks for (125y^6 b^-9)^(2/3).
//
// Two skills since the skill-ladder review: evaluating (fractional-powers)
// and rewriting roots (roots-as-powers). Bands are listed with the skills.
//
// EVERY question here falls back to KaTeX, and that is by design, not a
// parser bug: SPEC §6 sends "any exponent or subscript other than the bare
// degree suffix" to KaTeX unconditionally, and names index-law working as one
// of the cases it means. The whole Indices topic already behaves this way.
// See the handoff note about Board.jsx's stale comment on this.

import _ from 'lodash';
import { gcd } from '../shared';

const NL = '\n';


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
// Unit fractions, a^(1/n) = k: square roots up to 15^2, other roots under
// 1000. The whole pool is under forty; that is its real size.
const UNIT = [];
for (let k = 2; k <= 15; k += 1) {
  for (let n = 2; n <= 5; n += 1) {
    if (k ** n <= (n === 2 ? 225 : 1000)) UNIT.push({ k, n, base: k ** n });
  }
}

/* ------------------------------------------------------------- the skills */
//
// Skill-ladder review: fractional-powers evaluates in every band, and
// writing a root as a power is a skill of its own (roots-as-powers).
//
//   fractional-powers
//     foundation  a unit fraction          8^(1/3), 25^(1/2)          -> 2, 5
//     core        a numerator, or negative 32^(3/5), 16^(-3/4)        -> 8, 1/8
//     stretch     a coefficient and letters (27x^6/8)^(-2/3)          -> 4/(9x^4)
//   roots-as-powers
//     foundation  a root as a power        \sqrt[5]{x^2}              -> x^(2/5)
//     core        with a coefficient       \sqrt[3]{8x^2}             -> 2x^(2/3)
//     stretch     the reciprocal of a root 2/\sqrt[5]{x^3}            -> 2x^(-3/5)

export const generateFractionalPowers = (options = {}) => {
  const { difficulty = 'core' } = options;
  if (difficulty === 'foundation') return unitBand();
  if (difficulty === 'core') return _.random(0, 2) ? numeratorBand() : negativeBand();
  return lettersBand();
};

const meta = (difficulty, topic = 'fractional-powers') => ({ topic, difficulty });

function unitBand() {
  const { k, n, base } = _.sample(UNIT);
  return {
    instruction: 'Evaluate',
    questionMath: `${base}^{\\frac{1}{${n}}}`,
    answer: String(k),
    workingOut: `${base}^{\\frac{1}{${n}}} = ${rootTex(n, base)}${NL}= ${k}`,
    metadata: meta('foundation'),
  };
}

/* take the root first, then the power — the order that keeps the numbers
   small enough to do in your head. */
function numeratorBand() {
  const { k, n, m, base, answer } = _.sample(EVALUABLE);
  return {
    instruction: 'Evaluate',
    questionMath: fracPow(base, m, n),
    answer: String(answer),
    workingOut:
      `${fracPow(base, m, n)} = \\left(${rootTex(n, base)}\\right)^{${m}}${NL}` +
      `= ${k}^{${m}}${NL}` +
      `= ${answer}`,
    metadata: meta('core'),
  };
}

function negativeBand() {
  // m = 1 sometimes: 16^(-1/2) = 1/4.
  const pool = [...EVALUABLE_NEG, ...UNIT.filter((u) => u.k <= 12).map((u) => ({ ...u, m: 1, answer: u.k }))];
  const { n, m, base, answer } = _.sample(pool);
  const q = m === 1 ? `${base}^{-\\frac{1}{${n}}}` : fracPow(base, m, n, true);
  const pos = m === 1 ? `${base}^{\\frac{1}{${n}}}` : fracPow(base, m, n);
  return {
    instruction: 'Evaluate',
    questionMath: q,
    answer: `\\frac{1}{${answer}}`,
    workingOut:
      `${q} = \\frac{1}{${pos}}${NL}` +
      `= \\frac{1}{${m === 1 ? rootTex(n, base) : `\\left(${rootTex(n, base)}\\right)^{${m}}`}}${NL}` +
      `= \\frac{1}{${answer}}`,
    metadata: meta('core'),
  };
}

// c x^e, coefficient 1 dropped and x^1 written as x.
const mono = (c, v, e) => `${c === 1 ? '' : c}${e === 0 ? '' : e === 1 ? v : `${v}^{${e}}`}` || '1';

/* (a x^(nt) / b)^(±m/n), a = p^n and b = q^n, or no b at all. */
function lettersBand() {
  for (;;) {
    const n = _.sample([2, 3, 3, 4]);
    const m = _.sample([1, 2, 3].filter((x) => gcd(x, n) === 1 && !(n === 2 && x === 1)));
    const negative = _.random(0, 1) === 1;
    const t = _.random(1, 3);
    const v = _.sample(VARS);
    const p = _.random(2, n === 2 ? 9 : n === 3 ? 5 : 3);
    const q = _.random(0, 1) ? _.random(2, n === 2 ? 7 : n === 3 ? 4 : 2) : 1;
    if (q !== 1 && gcd(p, q) !== 1) continue;
    const [a, b] = [p ** n, q ** n];
    const [pm, qm] = [p ** m, q ** m];
    if (pm > 400 || qm > 400) continue;
    const e = n * t;
    const inside = q === 1 ? mono(a, v, e) : `\\frac{${mono(a, v, e)}}{${b}}`;
    const index = `${negative ? '-' : ''}\\frac{${m}}{${n}}`;
    const questionMath = `\\left(${inside}\\right)^{${index}}`;
    // The root of each part, then the power, then the reciprocal.
    const top = mono(pm, v, t * m);
    const answer = negative
      ? `\\frac{${qm}}{${top}}`
      : q === 1 ? top : `\\frac{${top}}{${qm}}`;
    const rooted = q === 1 ? mono(p, v, t) : `\\frac{${mono(p, v, t)}}{${q}}`;
    return {
      instruction: 'Simplify',
      questionMath,
      answer,
      workingOut: [
        `\\left(${rooted}\\right)^{${negative ? '-' : ''}${m}}`,
        answer,
      ].join(NL),
      metadata: meta('stretch'),
    };
  }
}

export const generateRootsAsPowers = (options = {}) => {
  const { difficulty = 'core' } = options;
  const [m, n] = _.sample(INDEX_PAIRS);
  const v = _.sample(VARS);
  const topic = 'roots-as-powers';

  if (difficulty === 'foundation') {
    const q = rootTex(n, `${v}^{${m}}`);
    return {
      instruction: `Write as a single power of ${v}`,
      questionMath: q,
      answer: fracPow(v, m, n),
      workingOut: `${q} = \\left(${v}^{${m}}\\right)^{\\frac{1}{${n}}}${NL}= ${fracPow(v, m, n)}`,
      metadata: meta('foundation', topic),
    };
  }
  if (difficulty === 'core') {
    // A perfect power under the root comes out as the coefficient.
    const k = _.random(2, n === 2 ? 9 : n === 3 ? 5 : n === 4 ? 3 : 2);
    const q = rootTex(n, `${k ** n}${v}^{${m}}`);
    return {
      instruction: `Write as a number times a power of ${v}`,
      questionMath: q,
      answer: `${k}${fracPow(v, m, n)}`,
      workingOut: `${q} = ${rootTex(n, k ** n)} \\times ${rootTex(n, `${v}^{${m}}`)}${NL}= ${k}${fracPow(v, m, n)}`,
      metadata: meta('core', topic),
    };
  }
  // The reciprocal of a root, a number on top sometimes.
  const c = _.sample([1, 1, 2, 3, 4, 5]);
  const q = `\\frac{${c}}{${rootTex(n, `${v}^{${m}}`)}}`;
  const ans = `${c === 1 ? '' : c}${fracPow(v, m, n, true)}`;
  return {
    instruction: `Write as a single power of ${v}${c === 1 ? '' : ', with a number in front'}`,
    questionMath: q,
    answer: ans,
    workingOut: `${q} = \\frac{${c}}{${fracPow(v, m, n)}}${NL}= ${ans}`,
    metadata: meta('stretch', topic),
  };
};
