// src/generators/algebra/variationGenerators.js
//
// Haese chapter 30, sections A and B.
//
//   direct-variation    y = kx^n     (n = 1, 2, 3 or 1/2)
//   inverse-variation   y = k / x^n  (n = 1, 2 or 1/2)
//
// 30C (variation modelling) and 30D (power modelling) are not here. 30D is a
// skip rather than a todo: it is power regression on a graphics calculator
// against messy real data, and there is no version of it that fits a starter.
//
// Question shape. These are worded questions, but a prose sentence cannot go
// through the maths renderer — hyphens become minus signs and the spacing
// goes. So the sentence is split: `instruction` states the proportionality and
// names the task, `questionMath` carries only the given pair, and
// questionMathCompact marks it as a given rather than an answer (SPEC.md 3).
//
// `instruction` is plain text and never reaches the renderer, so it uses
// Haese's word forms — "the square of t", "the square root of l" — rather than
// an exponent it has no way to set.
//
// Every value is constructed from the answer outwards, so every answer is an
// exact integer in all three bands. The allowance for a decimal at Stretch
// turned out not to be needed: reversing y = kx^2 is only awkward if you pick
// the given first and hope the root comes out whole.

import _ from 'lodash';

const NL = '\n';

const gcd = (a, b) => (b ? gcd(b, a % b) : Math.abs(a));
const lcm = (a, b) => (a * b) / gcd(a, b);

// Dependent and independent letters, in pairs that read like the textbook's.
// Deliberately never 'k', which is the proportionality constant throughout.
const PAIRS = [
  ['y', 'x'], ['T', 'l'], ['M', 't'], ['P', 'a'],
  ['D', 'r'], ['V', 'h'], ['C', 'n'], ['W', 'd'],
];

/** How the instruction names the power, and how the working writes it. */
const POWERS = {
  1: { phrase: (v) => v, tex: (v) => v },
  2: { phrase: (v) => `the square of ${v}`, tex: (v) => `${v}^2` },
  3: { phrase: (v) => `the cube of ${v}`, tex: (v) => `${v}^3` },
  0.5: { phrase: (v) => `the square root of ${v}`, tex: (v) => `\\sqrt{${v}}` },
};

const applyPower = (x, n) => (n === 0.5 ? Math.sqrt(x) : x ** n);

/** The numeric form of x^n as it appears in a working line. */
const texValue = (x, n) => (n === 0.5 ? `\\sqrt{${x}}` : (n === 1 ? `${x}` : `${x}^${n}`));

/** Perfect squares usable where the model takes a square root. */
const SQUARES = [4, 9, 16, 25, 36, 49, 64, 81, 100, 121, 144];

/* ------------------------------------------------------------------ *
 * Direct variation — y = k x^n
 *
 * Foundation  n = 1, forward       find y for a new x
 * Core        n = 2, 3 or 1/2      the power is the new thing
 * Stretch     same powers, reversed: given y, find x — the power has to be
 *             undone, which is a different move, not a bigger number
 * ------------------------------------------------------------------ */

export const generateDirectVariation = (options = {}) => {
  const { difficulty = 'core' } = options;
  const [D, I] = _.sample(PAIRS);
  const reverse = difficulty === 'stretch';

  let n;
  let k;
  let x1;
  let x2;
  if (difficulty === 'foundation') {
    n = 1;
    k = _.random(2, 12);
    x1 = _.random(2, 9);
    do { x2 = _.random(2, 15); } while (x2 === x1);
  } else {
    n = _.sample([2, 3, 0.5]);
    if (n === 0.5) {
      k = _.random(2, 10);
      [x1, x2] = _.sampleSize(SQUARES, 2);
    } else if (n === 2) {
      k = _.random(2, 10);
      x1 = _.random(2, 7);
      do { x2 = _.random(2, 9); } while (x2 === x1);
    } else {
      k = _.random(2, 6);
      x1 = _.random(2, 5);
      do { x2 = _.random(2, 6); } while (x2 === x1);
    }
  }

  const y1 = k * applyPower(x1, n);
  const y2 = k * applyPower(x2, n);
  const p = POWERS[n];

  // The general form is written the way a textbook writes it — ka^2, not
  // k \times a^2. The \times stays on the substitution lines, where it
  // genuinely multiplies two numbers.
  const setUp = [
    `${D} = k${p.tex(I)}`,
    `${y1} = k \\times ${texValue(x1, n)}`,
    `k = ${k}`,
  ];

  if (!reverse) {
    return {
      instruction: `${D} is directly proportional to ${p.phrase(I)}. Find ${D} when ${I} = ${x2}`,
      questionMath: `${D} = ${y1} \\text{ when } ${I} = ${x1}`,
      questionMathCompact: true,
      answer: String(y2),
      workingOut: [...setUp, `${D} = ${k} \\times ${texValue(x2, n)} = ${y2}`].join(NL),
      metadata: { topic: 'direct-variation', difficulty },
    };
  }

  // Reversed: the last two lines undo the power rather than apply it.
  const undo = n === 0.5
    ? [`\\sqrt{${I}} = ${y2 / k}`, `${I} = ${x2}`]
    : [`${p.tex(I)} = ${y2 / k}`, `${I} = ${x2}`];

  return {
    instruction: `${D} is directly proportional to ${p.phrase(I)}. Find ${I} when ${D} = ${y2}`,
    questionMath: `${D} = ${y1} \\text{ when } ${I} = ${x1}`,
    questionMathCompact: true,
    answer: String(x2),
    workingOut: [...setUp, `${y2} = ${k}${p.tex(I)}`, ...undo].join(NL),
    metadata: { topic: 'direct-variation', difficulty },
  };
};

/* ------------------------------------------------------------------ *
 * Inverse variation — y = k / x^n
 *
 * Foundation  n = 1, forward
 * Core        n = 2 or 1/2, forward
 * Stretch     same powers, reversed
 *
 * k is built as a multiple of the lowest common multiple of the two powers,
 * which is what makes both y values come out whole. Choosing k first and
 * hoping is what produces M = 1.6.
 * ------------------------------------------------------------------ */

export const generateInverseVariation = (options = {}) => {
  const { difficulty = 'core' } = options;
  const [D, I] = _.sample(PAIRS);
  const reverse = difficulty === 'stretch';

  // k is a multiple of the lowest common multiple of the two powers, which is
  // what makes both y values whole. That can run away — lcm(64, 81) is 5184 —
  // so an oversized k is rejected and redrawn rather than printed on a board.
  let n;
  let x1;
  let x2;
  let k;
  for (;;) {
    if (difficulty === 'foundation') {
      n = 1;
      x1 = _.random(2, 15);
      do { x2 = _.random(2, 15); } while (x2 === x1);
    } else {
      n = _.sample([2, 0.5]);
      if (n === 0.5) {
        [x1, x2] = _.sampleSize(SQUARES, 2);
      } else {
        x1 = _.random(2, 9);
        do { x2 = _.random(2, 9); } while (x2 === x1);
      }
    }
    k = _.random(1, 4) * lcm(applyPower(x1, n), applyPower(x2, n));
    if (k <= (difficulty === 'foundation' ? 300 : 1200)) break;
  }

  const p1 = applyPower(x1, n);
  const p2 = applyPower(x2, n);
  const y1 = k / p1;
  const y2 = k / p2;
  if (y1 === y2) return generateInverseVariation(options);

  const p = POWERS[n];
  const setUp = [
    `${D} = \\frac{k}{${p.tex(I)}}`,
    `${y1} = \\frac{k}{${texValue(x1, n)}}`,
    `k = ${k}`,
  ];

  if (!reverse) {
    return {
      instruction: `${D} is inversely proportional to ${p.phrase(I)}. Find ${D} when ${I} = ${x2}`,
      questionMath: `${D} = ${y1} \\text{ when } ${I} = ${x1}`,
      questionMathCompact: true,
      answer: String(y2),
      workingOut: [...setUp, `${D} = \\frac{${k}}{${texValue(x2, n)}} = ${y2}`].join(NL),
      metadata: { topic: 'inverse-variation', difficulty },
    };
  }

  const undo = n === 0.5
    ? [`\\sqrt{${I}} = ${k / y2}`, `${I} = ${x2}`]
    : [`${p.tex(I)} = ${k / y2}`, `${I} = ${x2}`];

  return {
    instruction: `${D} is inversely proportional to ${p.phrase(I)}. Find ${I} when ${D} = ${y2}`,
    questionMath: `${D} = ${y1} \\text{ when } ${I} = ${x1}`,
    questionMathCompact: true,
    answer: String(x2),
    workingOut: [...setUp, `${y2} = \\frac{${k}}{${p.tex(I)}}`, ...undo].join(NL),
    metadata: { topic: 'inverse-variation', difficulty },
  };
};
