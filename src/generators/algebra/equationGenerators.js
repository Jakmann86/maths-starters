// src/generators/algebra/equationGenerators.js
//
// Equations — Haese IGCSE Chapter 3 (§A solving, §B fractions, §C–D forming,
// §E power), calibrated against Rayner Chapter 3 (§3.5, 3.14, 3.16, 3.18).
// Inequalities (§F–G) are a separate generator, not here.
//
// Pure generators (SPEC §3): options in, plain data out. No React, no JSX and
// no section-awareness — the old maths-teaching-app version branched on
// sectionType and returned three different shapes; all of that is dropped.
//
// Each question is built backwards from chosen values, so it is correct by
// construction. Bands change the *shape*, not just the numbers. Only Foundation
// is held to clean positive integers — Haese and Rayner both carry negative and
// fractional answers from Core upward.

import _ from 'lodash';

// Line-break token for multi-line workingOut. The renderer (MathText / the
// design export's mathBlock) splits on a real newline character, so this is an
// actual '\n', not the literal two-character token. Centralised here so the
// choice is one line if the renderer ever changes.
const NL = '\n';

// ---------------------------------------------------------------------------
// helpers
// ---------------------------------------------------------------------------

const gcd = (a, b) => {
  a = Math.abs(a);
  b = Math.abs(b);
  while (b) [a, b] = [b, a % b];
  return a || 1;
};

const lcm = (a, b) => (a * b) / gcd(a, b);

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

const constTerm = (b) => (b >= 0 ? `+ ${b}` : `- ${-b}`);       // "+ 5" / "- 5"
const xTerm = (c) => (c === 1 ? 'x' : c === -1 ? '-x' : `${c}x`); // hides ±1
const coefStr = (c) => (c === 1 ? '' : `${c}`);                   // "" for 1, else n

const toSig3 = (n) => `${Number(n.toPrecision(3))}`;

const pickNonSquare = (min, max) => {
  let k;
  do { k = _.random(min, max); } while (Number.isInteger(Math.sqrt(k)));
  return k;
};

const pickNonCube = (min, max) => {
  let k;
  do { k = _.random(min, max); } while (Math.round(Math.cbrt(k)) ** 3 === k);
  return k;
};

// Join working lines, dropping a line identical to the one before it (happens
// when the collected coefficient is 1, so "x = n" would print twice).
const joinSteps = (steps) => steps.filter((s, i) => i === 0 || s !== steps[i - 1]).join(NL);

const compose = (questionMath, answer, steps, topic, difficulty, extra = {}) => ({
  instruction: 'Solve',
  questionMath,
  answer,
  workingOut: joinSteps(steps),
  metadata: { topic, difficulty },
  ...extra,
});

// ===========================================================================
// §A  solve-linear-equations   (Haese Ex 1 / 2 / 4; Rayner 3.13)
//   Foundation  ax + b = c        two-step, positive integer
//   Core        b - ax = c        negative coefficient to rearrange
//   Stretch     (ax + b)/c = d     expression over a denominator
// ===========================================================================

const linFoundation = () => {
  const a = _.random(2, 5);
  const x = _.random(2, 12);
  const b = _.random(1, 15);
  const c = a * x + b;
  return { questionMath: `${a}x ${constTerm(b)} = ${c}`, answer: `x = ${x}`, steps: [`${a}x = ${c - b}`, `x = ${x}`] };
};

const linCore = () => {
  const den = _.sample([1, 1, 2]);
  const a = den === 2 ? _.sample([2, 4]) : _.random(2, 5);
  const p = randNonZero(-6, 6);
  const b = _.random(1, 15);
  const c = b - (a * p) / den;
  return {
    questionMath: `${b} - ${a}x = ${c}`,
    answer: formatSolution(b - c, a),
    steps: [`${a}x = ${b} - ${c}`, `${a}x = ${b - c}`, formatSolution(b - c, a)],
  };
};

const linStretch = () => {
  const a = _.random(2, 5);
  const c = _.random(2, 5);
  const d = _.random(-4, 6);
  const b = randNonZero(-6, 12);
  return {
    questionMath: `\\frac{${a}x ${constTerm(b)}}{${c}} = ${d}`,
    answer: formatSolution(c * d - b, a),
    steps: [`${a}x ${constTerm(b)} = ${c * d}`, `${a}x = ${c * d - b}`, formatSolution(c * d - b, a)],
  };
};

export const generateSolveLinear = (options = {}) => {
  const { difficulty = 'core' } = options;
  const build = difficulty === 'foundation' ? linFoundation : difficulty === 'stretch' ? linStretch : linCore;
  const { questionMath, answer, steps } = build();
  return compose(questionMath, answer, steps, 'solve-linear-equations', difficulty);
};

// ===========================================================================
// §A.2  solve-linear-both-sides   (Haese 3A.2; Rayner 3.14)
//   Foundation  ax + b = cx + d          unknown both sides, no brackets
//   Core        a(x + p) = cx + d        brackets one side
//   Stretch     a(x + p) = b(x + q)      brackets both sides
// ===========================================================================

const bothFoundation = () => {
  const s = _.random(2, 12);
  const A = _.random(3, 7);
  const C = _.random(2, A - 1);
  const B = _.random(1, 10);
  const D = (A - C) * s + B;
  return {
    questionMath: `${A}x ${constTerm(B)} = ${C}x ${constTerm(D)}`,
    answer: `x = ${s}`,
    steps: [`${A}x - ${C}x = ${D} - ${B}`, `${xTerm(A - C)} = ${D - B}`, `x = ${s}`],
  };
};

const bothCore = () => {
  const a = _.random(2, 4);
  const c = _.random(1, a - 1);
  const p = randNonZero(-5, 5);
  const d = _.random(-8, 12);
  const num = d - a * p;
  return {
    questionMath: `${a}(x ${constTerm(p)}) = ${xTerm(c)} ${constTerm(d)}`,
    answer: formatSolution(num, a - c),
    steps: [`${a}x ${constTerm(a * p)} = ${xTerm(c)} ${constTerm(d)}`, `${xTerm(a - c)} = ${num}`, formatSolution(num, a - c)],
  };
};

const bothStretch = () => {
  const a = _.random(3, 5);
  const b = _.random(2, a - 1);
  const p = randNonZero(-5, 5);
  const q = randNonZero(-5, 5);
  const num = b * q - a * p;
  return {
    questionMath: `${a}(x ${constTerm(p)}) = ${b}(x ${constTerm(q)})`,
    answer: formatSolution(num, a - b),
    steps: [`${a}x ${constTerm(a * p)} = ${b}x ${constTerm(b * q)}`, `${xTerm(a - b)} = ${num}`, formatSolution(num, a - b)],
  };
};

export const generateSolveBothSides = (options = {}) => {
  const { difficulty = 'core' } = options;
  const build = difficulty === 'foundation' ? bothFoundation : difficulty === 'stretch' ? bothStretch : bothCore;
  const { questionMath, answer, steps } = build();
  return compose(questionMath, answer, steps, 'solve-linear-both-sides', difficulty);
};

// ===========================================================================
// §B  solve-equations-fractions   (Haese 3B; Rayner 3.16)
//   Foundation  k/x = m                       unknown in the denominator
//   Core        (x + p)/c = (x + q)/d         cross-multiply
//   Stretch     x/a - x/b = k                 clear the LCD
// NOTE: Core and Stretch show two fractions side by side — the likeliest place
// in the whole chapter to trip the KaTeX fallback. Watch these when rendering.
// ===========================================================================

const fracFoundation = () => {
  const x = _.random(2, 12);
  const m = _.random(2, 9);
  const k = m * x;
  return { questionMath: `\\frac{${k}}{x} = ${m}`, answer: `x = ${x}`, steps: [`${k} = ${m}x`, `x = ${x}`] };
};

const fracCore = () => {
  const c = _.random(2, 4);
  const d = _.random(c + 1, 5);
  const p = randNonZero(-6, 6);
  const q = randNonZero(-6, 6);
  const num = c * q - d * p;
  return {
    questionMath: `\\frac{x ${constTerm(p)}}{${c}} = \\frac{x ${constTerm(q)}}{${d}}`,
    answer: formatSolution(num, d - c),
    steps: [`${d}(x ${constTerm(p)}) = ${c}(x ${constTerm(q)})`, `${xTerm(d - c)} = ${num}`, formatSolution(num, d - c)],
  };
};

const fracStretch = () => {
  const a = _.random(2, 5);
  const b = _.random(a + 1, 6);
  const k = _.random(1, 8);
  const L = lcm(a, b);
  const coeff = L / a - L / b;
  return {
    questionMath: `\\frac{x}{${a}} - \\frac{x}{${b}} = ${k}`,
    answer: formatSolution(k * L, coeff),
    steps: [`${coefStr(L / a)}x - ${coefStr(L / b)}x = ${k * L}`, `${xTerm(coeff)} = ${k * L}`, formatSolution(k * L, coeff)],
  };
};

export const generateSolveFractions = (options = {}) => {
  const { difficulty = 'core' } = options;
  const build = difficulty === 'foundation' ? fracFoundation : difficulty === 'stretch' ? fracStretch : fracCore;
  const { questionMath, answer, steps } = build();
  return compose(questionMath, answer, steps, 'solve-equations-fractions', difficulty);
};

// ===========================================================================
// §E  solve-power-equations   (Haese 3E)
//   Foundation  x^2 = k   perfect square, exact          x = ±r
//   Core        x^2 = k   non-square, surd + 3 s.f.       x = ±√k
//   Stretch     x^3 = k   non-cube, cube root + 3 s.f.    x = ∛k
// NOTE: Stretch uses \sqrt[3]{} (indexed radical) — a deliberate KaTeX fallback,
// per DESIGN.md §6. Good coverage for the fallback path.
// ===========================================================================

const powFoundation = () => {
  const r = _.random(2, 12);
  const k = r * r;
  return { questionMath: `x^2 = ${k}`, answer: `x = \\pm ${r}`, steps: [`x = \\pm\\sqrt{${k}}`, `x = \\pm ${r}`] };
};

const powCore = () => {
  const k = pickNonSquare(5, 90);
  return {
    questionMath: `x^2 = ${k}`,
    answer: `x = \\pm\\sqrt{${k}}`,
    steps: [`x = \\pm\\sqrt{${k}}`, `x = \\pm ${toSig3(Math.sqrt(k))} \\text{ (3 s.f.)}`],
  };
};

const powStretch = () => {
  const k = pickNonCube(10, 200);
  return {
    questionMath: `x^3 = ${k}`,
    answer: `x = \\sqrt[3]{${k}}`,
    steps: [`x = \\sqrt[3]{${k}}`, `x = ${toSig3(Math.cbrt(k))} \\text{ (3 s.f.)}`],
  };
};

export const generateSolvePower = (options = {}) => {
  const { difficulty = 'core' } = options;
  const build = difficulty === 'foundation' ? powFoundation : difficulty === 'stretch' ? powStretch : powCore;
  const { questionMath, answer, steps } = build();
  return compose(questionMath, answer, steps, 'solve-power-equations', difficulty);
};

// ===========================================================================
// §C–D  forming-equations   (Haese §C–D; Rayner 3.18)
// Prose questions: these return `questionText`, not `questionMath`, exercising
// the board's text path. Working is still LaTeX with `\n` line breaks.
//   Foundation  think of a number
//   Core        consecutive integers
//   Stretch     two-item cost problem
// ===========================================================================

const formFoundation = () => {
  const x = _.random(2, 12);
  const a = _.random(2, 5);
  const b = _.random(1, 20);
  const c = a * x + b;
  return {
    questionText: `I think of a number, multiply it by ${a}, then add ${b}. The result is ${c}. What was my number?`,
    answer: `x = ${x}`,
    steps: [`${a}x + ${b} = ${c}`, `${a}x = ${c - b}`, `x = ${x}`],
  };
};

const formCore = () => {
  const x = _.random(5, 40);
  const S = 3 * x + 3;
  return {
    questionText: `The sum of three consecutive integers is ${S}. What is the smallest of the three?`,
    answer: `x = ${x}`,
    steps: [`x + (x + 1) + (x + 2) = ${S}`, `3x + 3 = ${S}`, `x = ${x}`],
  };
};

const formStretch = () => {
  const x = _.random(3, 10);            // number of erasers
  const n = _.random(1, 5);             // more pencils than erasers
  const a = _.sample([30, 40, 45]);     // pencil price, pence
  const b = _.sample([20, 25, 35]);     // eraser price, pence
  const total = a * (x + n) + b * x;    // pence
  const pounds = (total / 100).toFixed(2);
  return {
    questionText: `Pencils cost ${a}p each and erasers cost ${b}p each. I buy ${n} more pencils than erasers. If the total cost is £${pounds}, how many erasers did I buy?`,
    answer: `x = ${x}`,
    steps: [`${a}(x + ${n}) + ${b}x = ${total}`, `${a + b}x ${constTerm(a * n)} = ${total}`, `${a + b}x = ${total - a * n}`, `x = ${x}`],
  };
};

export const generateFormingEquation = (options = {}) => {
  const { difficulty = 'core' } = options;
  const build = difficulty === 'foundation' ? formFoundation : difficulty === 'stretch' ? formStretch : formCore;
  const { questionText, answer, steps } = build();
  return {
    instruction: 'Form an equation and solve',
    questionText,
    answer,
    workingOut: joinSteps(steps),
    metadata: { topic: 'forming-equations', difficulty },
  };
};