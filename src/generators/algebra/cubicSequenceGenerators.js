// src/generators/algebra/cubicSequenceGenerators.js
// Cubic sequences and the difference method — Haese 26D, p541.
//
// The general cubic difference table this is built on, for u_n = an^3 + bn^2 + cn + d:
//   6a            = the third difference
//   12a + 2b      = the first second-difference
//   7a + 3b + c   = the first first-difference
//   a + b + c + d = u_1

import _ from 'lodash';

const NL = '\n';
const nonZero = (lo, hi) => { let n = 0; while (n === 0) n = _.random(lo, hi); return n; };

// A polynomial rule written the way a student would see it: n^3 - 5n - 2,
// not 1n^3 + 0n^2 + -5n + -2.
const rule = (a, b, c, d) => {
  const parts = [];
  const term = (k, txt) => {
    if (k === 0) return;
    const sign = k < 0 ? '-' : '+';
    const mag = Math.abs(k);
    const body = txt ? `${mag === 1 ? '' : mag}${txt}` : `${mag}`;
    parts.push(parts.length === 0 ? `${k < 0 ? '-' : ''}${body}` : `${sign} ${body}`);
  };
  term(a, 'n^3'); term(b, 'n^2'); term(c, 'n'); term(d, '');
  return parts.length ? parts.join(' ') : '0';
};
const evalRule = (a, b, c, d, n) => a * n ** 3 + b * n ** 2 + c * n + d;

// The same rule with a number substituted for n. Built from the coefficients
// rather than by editing the printed rule string: a regex substitution turns
// "6n^2" into "612^2" the moment k is two digits. See "The bug worth knowing
// about" in the commit notes.
const ruleAt = (a, b, c, d, k) => {
  const parts = [];
  const push = (coef, power) => {
    if (coef === 0) return;
    const mag = Math.abs(coef);
    const pow = power === 0 ? '' : power === 1 ? `${k}` : `${k}^${power}`;
    const body = power === 0 ? `${mag}` : (mag === 1 ? pow : `${mag} \\times ${pow}`);
    parts.push(parts.length === 0 ? `${coef < 0 ? '-' : ''}${body}` : `${coef < 0 ? '-' : '+'} ${body}`);
  };
  push(a, 3); push(b, 2); push(c, 1); push(d, 0);
  return parts.length ? parts.join(' ') : '0';
};
const listTerms = (a, b, c, d, count) =>
  _.range(1, count + 1).map((n) => evalRule(a, b, c, d, n));
// Plain ", " and "..." here, not "\ " / "\ldots" — the Archivo parser
// (src/lib/archivoMath.jsx) doesn't know either LaTeX spacing command and
// silently falls back to KaTeX for the whole line when it meets one.
const showList = (t) => `${t.join(', ')}, ...`;

// Successive differences, as far as they stay non-empty.
const diffs = (t) => t.slice(1).map((v, i) => v - t[i]);

/* --------------------------------------------- identifying the type of sequence */

export const generateDifferenceMethod = (options = {}) => {
  const { difficulty = 'core' } = options;
  const kinds = difficulty === 'foundation' ? ['linear', 'quadratic'] : ['linear', 'quadratic', 'cubic'];
  const kind = _.sample(kinds);

  let a = 0, b = 0, c = 0, d = 0;
  if (kind === 'linear') { c = nonZero(-9, 9); d = _.random(-12, 12); }
  if (kind === 'quadratic') { b = nonZero(-5, 5); c = _.random(-9, 9); d = _.random(-12, 12); }
  if (kind === 'cubic') { a = nonZero(-3, 3); b = _.random(-4, 4); c = _.random(-9, 9); d = _.random(-12, 12); }

  const terms = listTerms(a, b, c, d, 6);
  const d1 = diffs(terms);
  const d2 = diffs(d1);
  const d3 = diffs(d2);
  const level = kind === 'linear' ? 1 : kind === 'quadratic' ? 2 : 3;
  const constant = [null, d1[0], d2[0], d3[0]][level];
  const lead = kind === 'linear' ? c : kind === 'quadratic' ? b : a;

  const table = `\\Delta_1: ${d1.join(', ')}${level >= 2 ? `${NL}\\Delta_2: ${d2.join(', ')}` : ''}${level >= 3 ? `${NL}\\Delta_3: ${d3.join(', ')}` : ''}`;

  if (difficulty === 'stretch') {
    // The constant difference gives the leading coefficient directly:
    // a for linear, 2a for quadratic, 6a for cubic.
    const divisor = [null, 1, 2, 6][level];
    return {
      instruction: 'Use the difference method to name the type of sequence and find its leading coefficient',
      questionMath: showList(terms),
      answer: `\\text{${kind}}, a = ${lead}`,
      workingOut: `${table}${NL}\\text{the } \\Delta_${level} \\text{ values are constant, so the sequence is ${kind}}${NL}${divisor === 1 ? '' : `${divisor}a = ${constant}, `}a = ${lead}`,
      metadata: { topic: 'sequences-difference-method', difficulty },
    };
  }

  return {
    instruction: 'Use the difference method to name the type of sequence',
    questionMath: showList(terms),
    answer: `\\text{${kind}}`,
    workingOut: `${table}${NL}\\text{the } \\Delta_${level} \\text{ values are constant, so the sequence is ${kind}}`,
    metadata: { topic: 'sequences-difference-method', difficulty },
  };
};

/* ------------------------------------------------ using a cubic nth term rule */

export const generateCubicUseNthTerm = (options = {}) => {
  const { difficulty = 'core' } = options;
  let a = 1, b = 0, c = 0, d = 0, k;

  if (difficulty === 'foundation') {
    d = nonZero(-30, 30);
    k = _.random(2, 8);
  } else if (difficulty === 'core') {
    a = nonZero(-4, 4);
    c = nonZero(-9, 9);
    d = _.random(-12, 12);
    k = _.random(2, 7);
  } else {
    a = nonZero(-4, 4);
    b = nonZero(-6, 6);
    c = nonZero(-9, 9);
    d = _.random(-15, 15);
    k = _.random(5, 12);
  }

  const value = evalRule(a, b, c, d, k);
  const sub = ruleAt(a, b, c, d, k);
  return {
    instruction: `Find the value of the ${k}th term`,
    questionMath: `u_n = ${rule(a, b, c, d)}`,
    answer: `u_{${k}} = ${value}`,
    workingOut: `u_{${k}} = ${sub}${NL}= ${value}`,
    metadata: { topic: 'sequences-cubic-use-nth-term', difficulty },
  };
};

/* ------------------------------------------- finding a cubic nth term rule */

export const generateCubicNthTerm = (options = {}) => {
  const { difficulty = 'core' } = options;
  let a, b, c, d;

  if (difficulty === 'foundation') {
    // u_n = a n^3 + d: the third difference gives a, then u_1 gives d.
    a = nonZero(-6, 6); b = 0; c = 0; d = nonZero(-25, 25);
  } else if (difficulty === 'core') {
    // u_n = a n^3 + cn + d: one more unknown, found from the first
    // difference.
    a = nonZero(-5, 5); b = 0; c = nonZero(-9, 9); d = _.random(-20, 20);
  } else {
    // The full method, Haese Example 9.
    a = nonZero(-3, 3); b = nonZero(-4, 4); c = _.random(-9, 9); d = _.random(-15, 15);
  }

  const terms = listTerms(a, b, c, d, 6);
  const d1 = diffs(terms);
  const d2 = diffs(d1);
  const d3 = diffs(d2);

  // The four relations from Haese's general cubic difference table (p541):
  // 6a = D3, 12a + 2b = first D2, 7a + 3b + c = first D1, a+b+c+d = u1.
  const lines = [
    `\\Delta_1: ${d1.join(', ')}`,
    `\\Delta_2: ${d2.join(', ')}`,
    `\\Delta_3: ${d3.join(', ')}`,
    `6a = ${d3[0]} \\text{ so } a = ${a}`,
  ];
  if (b !== 0 || difficulty === 'stretch') lines.push(`12a + 2b = ${d2[0]} \\text{ so } b = ${b}`);
  if (c !== 0 || difficulty !== 'foundation') lines.push(`7a + 3b + c = ${d1[0]} \\text{ so } c = ${c}`);
  lines.push(`a + b + c + d = ${terms[0]} \\text{ so } d = ${d}`);
  lines.push(`u_n = ${rule(a, b, c, d)}`);

  return {
    instruction: 'Use the difference method to find a formula for the nth term of the sequence',
    questionMath: showList(terms),
    answer: `u_n = ${rule(a, b, c, d)}`,
    workingOut: lines.join(NL),
    metadata: { topic: 'sequences-cubic-nth-term', difficulty },
  };
};
