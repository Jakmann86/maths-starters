// src/generators/algebra/equationGenerators.js
//
// Linear equations — Haese IGCSE Chapter 3 §A, calibrated against Rayner
// Chapter 3 §3.5. Rayner and Haese both carry negative and fractional answers
// at this level, so only Foundation is held to clean positive integers.
//
// Pure generators (SPEC §3): options in, plain data out. No React, no JSX and
// no section-awareness — the old maths-teaching-app version branched on
// sectionType and returned three different shapes; all of that is dropped.
//
// Each question is built backwards from a chosen solution, so it is correct by
// construction. The three bands change the *shape* of the equation, not just
// the numbers (calibration principle):
//   Foundation  ax + b = c            two-step, positive integer solution   (Haese Ex 1)
//   Core        b - ax = c            negative coefficient to rearrange     (Haese Ex 2)
//   Stretch     (ax + b)/c = d        expression over a denominator         (Haese Ex 4)

import _ from 'lodash';

// Line-break token for multi-line workingOut. The Archivo parser splits on
// `\n` (DESIGN.md; CLAUDE.md's generator example uses the same token). If the
// parser is ever switched to LaTeX `\\`, change this one constant to '\\\\'.
const NL = '\\n';

// ---------------------------------------------------------------------------
// helpers
// ---------------------------------------------------------------------------

const gcd = (a, b) => {
  a = Math.abs(a);
  b = Math.abs(b);
  while (b) [a, b] = [b, a % b];
  return a || 1;
};

const randNonZero = (min, max) => {
  let n = 0;
  while (n === 0) n = _.random(min, max);
  return n;
};

// A solution as LaTeX: integer, or a reduced one-level (signed) fraction.
const formatSolution = (num, den) => {
  if (den < 0) { num = -num; den = -den; }
  const g = gcd(num, den);
  num /= g;
  den /= g;
  if (den === 1) return `x = ${num}`;
  return num < 0
    ? `x = -\\frac{${-num}}{${den}}`
    : `x = \\frac{${num}}{${den}}`;
};

// A trailing constant term: "+ 5" or "- 5".
const constTerm = (b) => (b >= 0 ? `+ ${b}` : `- ${-b}`);

// ---------------------------------------------------------------------------
// Foundation — ax + b = c   (Haese Ex 1; Rayner 3.13 Q1–4)
// ---------------------------------------------------------------------------

const buildFoundation = () => {
  const a = _.random(2, 5);
  const x = _.random(2, 12);
  const b = _.random(1, 15);
  const c = a * x + b;

  return {
    questionMath: `${a}x ${constTerm(b)} = ${c}`,
    answer: `x = ${x}`,
    steps: [`${a}x = ${c - b}`, `x = ${x}`],
  };
};

// ---------------------------------------------------------------------------
// Core — b - ax = c   (Haese Ex 2; negative coefficient, negative/half answers)
// ---------------------------------------------------------------------------

const buildCore = () => {
  const den = _.sample([1, 1, 2]); // bias towards integer solutions
  const a = den === 2 ? _.sample([2, 4]) : _.random(2, 5);
  const p = randNonZero(-6, 6); // numerator of the solution p/den
  const b = _.random(1, 15);
  const c = b - (a * p) / den; // integer, since a is a multiple of den

  return {
    questionMath: `${b} - ${a}x = ${c}`,
    answer: formatSolution(b - c, a),
    steps: [`${a}x = ${b} - ${c}`, `${a}x = ${b - c}`, formatSolution(b - c, a)],
  };
};

// ---------------------------------------------------------------------------
// Stretch — (ax + b)/c = d   (Haese Ex 4; answers commonly fractional)
// ---------------------------------------------------------------------------

const buildStretch = () => {
  const a = _.random(2, 5);
  const c = _.random(2, 5);
  const d = _.random(-4, 6);
  const b = randNonZero(-6, 12);

  return {
    questionMath: `\\frac{${a}x ${constTerm(b)}}{${c}} = ${d}`,
    answer: formatSolution(c * d - b, a),
    steps: [
      `${a}x ${constTerm(b)} = ${c * d}`,
      `${a}x = ${c * d - b}`,
      formatSolution(c * d - b, a),
    ],
  };
};

// ---------------------------------------------------------------------------
// public generator
// ---------------------------------------------------------------------------

export const generateSolveLinear = (options = {}) => {
  const { difficulty = 'core' } = options;

  const build =
    difficulty === 'foundation' ? buildFoundation
      : difficulty === 'stretch' ? buildStretch
        : buildCore;

  const { questionMath, answer, steps } = build();

  return {
    instruction: 'Solve',
    questionMath,
    answer,
    workingOut: steps.join(` ${NL} `),
    metadata: { topic: 'solve-linear-equations', difficulty },
  };
};