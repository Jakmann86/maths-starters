// src/generators/algebra/inequalityGenerators.js
//
// Linear inequalities — Haese 3F (interpreting) and 3G (solving), drawn up
// against the Y9 Unit 2 do-nows ("from the list, write all the numbers that
// satisfy x > -1"). Text only: a number-line figure would be a new figure
// type, and those land on their own first.
//
// Every question is built from its answer: the boundary, or the set of
// integers, is chosen first and the inequality written around it.

import _ from 'lodash';
import { gcd } from '../shared';

const NL = '\n';

const randNonZero = (min, max) => {
  let n = 0;
  while (n === 0) n = _.random(min, max);
  return n;
};

const FLIP = { '>': '<', '<': '>', '\\ge': '\\le', '\\le': '\\ge' };
const holds = (v, op, k) => (op === '>' ? v > k : op === '<' ? v < k : op === '\\ge' ? v >= k : v <= k);

/** 3x, x, -x */
const xTerm = (a) => (a === 1 ? 'x' : a === -1 ? '-x' : `${a}x`);
/** " + 4", " - 4", or nothing */
const signed = (c) => (c === 0 ? '' : ` ${c < 0 ? '-' : '+'} ${Math.abs(c)}`);
/** n/d in lowest terms, or a whole number */
const frac = (n, d) => {
  const g = gcd(n, d);
  const [p, q] = [n / g, d / g];
  if (q === 1) return String(p);
  return p < 0 ? `-\\frac{${-p}}{${q}}` : `\\frac{${p}}{${q}}`;
};
const list = (vs) => vs.join(',\\ ');

// ===========================================================================
// inequality-list-values   (Haese 3F)
//   foundation  which numbers in a list satisfy x > k     the do-now card
//   core        the integers in lo < x <= hi
//   stretch     the integers in lo < ax + b <= hi         solve, then list
// ===========================================================================

const ilFoundation = () => {
  const op = _.sample(['>', '<', '\\ge', '\\le']);
  const k = _.random(-4, 4);
  for (;;) {
    // The boundary itself is in the list half the time: whether it counts
    // is the whole point of > against >=.
    const pool = _.range(-7, 9).concat([-2.5, -1.5, -0.5, 0.5, 1.5, 2.5, 3.5]);
    const vals = _.sampleSize(pool.filter((v) => v !== k), _.random(0, 1) ? 5 : 6);
    if (vals.length === 5) vals.push(k);
    const shown = _.shuffle(vals);
    const yes = shown.filter((v) => holds(v, op, k));
    if (yes.length < 2 || yes.length > 4) continue;
    return {
      instruction: 'Which of these numbers satisfy the inequality?',
      questionMath: `x ${op} ${k}${NL}${list(shown)}`,
      answer: list(yes),
      workingOut: `x ${op} ${k}${NL}${list(yes)}`,
    };
  }
};

// Core has a real ceiling: 8 lower bounds, 4 widths and 4 pairs of symbols
// make 128 questions. Wider bounds would only add integers to list, not a
// different question.
const ilCore = () => {
  const lo = _.random(-5, 2);
  const hi = lo + _.random(3, 6);
  const [o1, o2] = [_.sample(['<', '\\le']), _.sample(['<', '\\le'])];
  const ints = _.range(lo, hi + 1).filter((n) => holds(n, FLIP[o1], lo) && holds(n, o2, hi));
  return {
    instruction: 'List the integers that satisfy',
    questionMath: `${lo} ${o1} x ${o2} ${hi}`,
    answer: list(ints),
    workingOut: `${o1 === '<' ? `${lo} \\text{ is not included}` : `${lo} \\text{ is included}`}, \\ ${o2 === '<' ? `${hi} \\text{ is not included}` : `${hi} \\text{ is included}`}${NL}${list(ints)}`,
  };
};

const ilStretch = () => {
  for (;;) {
    const a = _.random(2, 4);
    const b = randNonZero(-6, 6);
    const lo = _.random(-12, 2);
    const hi = lo + _.random(5, 16);
    const [o1, o2] = [_.sample(['<', '\\le']), _.sample(['<', '\\le'])];
    // lo o1 ax + b o2 hi  <=>  (lo - b)/a o1 x o2 (hi - b)/a
    const ints = _.range(Math.floor((lo - b) / a) - 1, Math.ceil((hi - b) / a) + 2)
      .filter((n) => holds(a * n + b, FLIP[o1], lo) && holds(a * n + b, o2, hi));
    if (ints.length < 2 || ints.length > 6) continue;
    const middle = `${xTerm(a)}${signed(b)}`;
    return {
      instruction: 'List the integers that satisfy',
      questionMath: `${lo} ${o1} ${middle} ${o2} ${hi}`,
      answer: list(ints),
      workingOut: [
        `${lo - b} ${o1} ${a}x ${o2} ${hi - b}`,
        `${frac(lo - b, a)} ${o1} x ${o2} ${frac(hi - b, a)}`,
        list(ints),
      ].join(NL),
    };
  }
};

export const generateInequalityListValues = (options = {}) => {
  const { difficulty = 'core' } = options;
  const build = difficulty === 'foundation' ? ilFoundation : difficulty === 'stretch' ? ilStretch : ilCore;
  return { ...build(), metadata: { topic: 'inequality-list-values', difficulty } };
};

// ===========================================================================
// solve-linear-inequalities   (Haese 3G)
//   foundation  ax + b > c                              two steps, a > 0
//   core        unknown on both sides, or a bracket     x still ends positive
//   stretch     the x-term ends negative                 the sign flips
// The boundary is a whole number in every band; the flip is the difficulty,
// not the arithmetic.
// ===========================================================================

const OPS = ['>', '<', '\\ge', '\\le'];

const slFoundation = () => {
  const op = _.sample(OPS);
  const a = _.random(2, 6);
  const b = randNonZero(-9, 9);
  const t = _.random(-5, 9);
  const c = a * t + b;
  return {
    questionMath: `${xTerm(a)}${signed(b)} ${op} ${c}`,
    answer: `x ${op} ${t}`,
    steps: [`${a}x ${op} ${c - b}`, `x ${op} ${t}`],
  };
};

const slCore = () => {
  const op = _.sample(OPS);
  const t = _.random(-6, 9);
  if (_.random(0, 1)) {
    // a(x + b) op c
    const a = _.random(2, 5);
    const b = randNonZero(-6, 6);
    const c = a * (t + b);
    return {
      questionMath: `${a}(x${signed(b)}) ${op} ${c}`,
      answer: `x ${op} ${t}`,
      steps: [`${a}x${signed(a * b)} ${op} ${c}`, `${a}x ${op} ${c - a * b}`, `x ${op} ${t}`],
    };
  }
  // ax + b op cx + d, a > c > 0
  const c = _.random(1, 5);
  const a = c + _.random(1, 4);
  const b = randNonZero(-9, 9);
  const d = (a - c) * t + b;
  return {
    questionMath: `${xTerm(a)}${signed(b)} ${op} ${xTerm(c)}${signed(d)}`,
    answer: `x ${op} ${t}`,
    steps: [`${xTerm(a - c)}${signed(b)} ${op} ${d}`, `${xTerm(a - c)} ${op} ${d - b}`, `x ${op} ${t}`],
  };
};

const slStretch = () => {
  const op = _.sample(OPS);
  const t = _.random(-6, 6);
  const flipped = FLIP[op];
  if (_.random(0, 1)) {
    // b - ax op c
    const a = _.random(2, 5);
    const b = _.random(1, 12);
    const c = b - a * t;
    return {
      questionMath: `${b} - ${xTerm(a)} ${op} ${c}`,
      answer: `x ${flipped} ${t}`,
      steps: [`-${a}x ${op} ${c - b}`, `\\text{divide by } -${a}\\text{, so the sign turns round}`, `x ${flipped} ${t}`],
    };
  }
  // ax + b op cx + d, c > a > 0: collecting on the left leaves a negative x-term
  const a = _.random(1, 4);
  const c = a + _.random(1, 4);
  const b = randNonZero(-9, 9);
  const d = (a - c) * t + b;
  return {
    questionMath: `${xTerm(a)}${signed(b)} ${op} ${xTerm(c)}${signed(d)}`,
    answer: `x ${flipped} ${t}`,
    steps: [`${xTerm(a - c)} ${op} ${d - b}`, `\\text{divide by } ${a - c}\\text{, so the sign turns round}`, `x ${flipped} ${t}`],
  };
};

export const generateSolveLinearInequalities = (options = {}) => {
  const { difficulty = 'core' } = options;
  const build = difficulty === 'foundation' ? slFoundation : difficulty === 'stretch' ? slStretch : slCore;
  const { questionMath, answer, steps } = build();
  return {
    instruction: 'Solve',
    questionMath,
    answer,
    workingOut: steps.join(NL),
    metadata: { topic: 'solve-linear-inequalities', difficulty },
  };
};
