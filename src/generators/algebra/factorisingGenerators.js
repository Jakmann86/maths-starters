// src/generators/algebra/factorisingGenerators.js
//
// Factorising family — Haese IGCSE Chapter 1.
//
// Pure generators: each takes an options object and returns the question
// shape from SPEC §3. No React, no JSX, no state, no curated answer lists —
// every question is built by choosing the factors and expanding, so it is
// correct by construction and each difficulty band genuinely varies its
// output (MIGRATION known-issue #5).
//
// Skills exported here:
//   generateFactoriseMonic            Haese 1K   x^2 + bx + c
//   generateFactoriseSplittingMiddle  Haese 1L   ax^2 + bx + c, a != 1
//   generateDifferenceOfTwoSquares    Haese 1H   a^2 x^2 - b^2  (factorising)
//   generateFactoriseGrouping         Haese 1J   four terms, group in pairs

import _ from 'lodash';

// ---------------------------------------------------------------------------
// formatting helpers  (LaTeX subset the Archivo parser handles; see DESIGN.md)
// ---------------------------------------------------------------------------

// The leading term of an expression, e.g. "x^2", "2x^2", "-x^2".
const leadTerm = (coeff, suffix = '') => {
  if (coeff === 0) return '';
  const mag = Math.abs(coeff);
  const shown = suffix && mag === 1 ? '' : `${mag}`;
  return `${coeff < 0 ? '-' : ''}${shown}${suffix}`;
};

// A signed term for any position after the first, e.g. "+ 3x", "- x", "+ 12".
const laterTerm = (coeff, suffix = '') => {
  if (coeff === 0) return '';
  const sign = coeff > 0 ? '+' : '-';
  const mag = Math.abs(coeff);
  const shown = suffix && mag === 1 ? '' : `${mag}`;
  return `${sign} ${shown}${suffix}`;
};

// Join a leading term with any number of later terms, dropping empties.
const joinTerms = (lead, ...rest) =>
  [lead, ...rest.filter(Boolean)].join(' ').trim();

// A single factor bracket, e.g. "(x + 3)", "(2x - 1)".
const bracket = (coeff, constant) => {
  const lead = coeff === 1 ? 'x' : coeff === -1 ? '-x' : `${coeff}x`;
  return `(${joinTerms(lead, laterTerm(constant))})`;
};

const gcd = (a, b) => {
  a = Math.abs(a);
  b = Math.abs(b);
  while (b) [a, b] = [b, a % b];
  return a;
};

const randNonZero = (min, max) => {
  let n = 0;
  while (n === 0) n = _.random(min, max);
  return n;
};

// ---------------------------------------------------------------------------
// 1K  —  x^2 + bx + c        (x + p)(x + q) = x^2 + (p+q)x + pq
// ---------------------------------------------------------------------------

const pickMonicRoots = (difficulty) => {
  if (difficulty === 'foundation') {
    // both positive, small — mental factorisation (Haese 1K Q1–3)
    return { p: _.random(1, 7), q: _.random(1, 7) };
  }
  if (difficulty === 'stretch') {
    // larger magnitudes, less obvious pairs (Haese 1K Q4–5, harder rows)
    return {
      p: _.sample([-1, 1]) * _.random(4, 12),
      q: _.sample([-1, 1]) * _.random(4, 12),
    };
  }
  // core: modest magnitude, at least one negative (Haese 1K Q4–5)
  return { p: randNonZero(-9, 9), q: randNonZero(-9, 9) };
};

export const generateFactoriseMonic = (options = {}) => {
  const { difficulty = 'core' } = options;

  let p, q;
  do {
    ({ p, q } = pickMonicRoots(difficulty));
  } while (
    p + q === 0 || // avoid a vanishing middle term (that is difference of squares)
    (difficulty !== 'foundation' && p > 0 && q > 0) // keep core/stretch off the foundation case
  );

  const b = p + q;
  const c = p * q;

  const questionMath = joinTerms(leadTerm(1, 'x^2'), laterTerm(b, 'x'), laterTerm(c));
  const answer = `${bracket(1, p)}${bracket(1, q)}`;

  return {
    instruction: 'Factorise',
    questionMath,
    answer,
    workingOut: `\\text{two numbers with sum } ${b} \\text{ and product } ${c}`,
    metadata: { topic: 'factorise-monic', difficulty },
  };
};

// ---------------------------------------------------------------------------
// 1L  —  ax^2 + bx + c, a != 1
//        (mx + n)(rx + s) = mr x^2 + (ms + rn) x + ns
// ---------------------------------------------------------------------------

const pickSplittingFactors = (difficulty) => {
  if (difficulty === 'foundation') {
    // a = 2, all positive (Haese 1L Q1, easy rows)
    const [m, r] = _.sample([[2, 1], [1, 2]]);
    return { m, r, n: _.random(1, 4), s: _.random(1, 4) };
  }
  if (difficulty === 'stretch') {
    // a up to 9, mixed signs (Haese 1L Q2–3)
    const [m, r] = _.sample([[2, 3], [3, 2], [2, 2], [3, 3]]);
    return { m, r, n: randNonZero(-5, 5), s: randNonZero(-5, 5) };
  }
  // core: a in {2, 3}, mixed signs (Haese 1L Q1–2)
  const [m, r] = _.sample([[2, 1], [1, 2], [3, 1], [1, 3]]);
  return { m, r, n: randNonZero(-4, 4), s: randNonZero(-4, 4) };
};

export const generateFactoriseSplittingMiddle = (options = {}) => {
  const { difficulty = 'core' } = options;

  let m, r, n, s;
  do {
    ({ m, r, n, s } = pickSplittingFactors(difficulty));
  } while (
    gcd(m, n) !== 1 || // no common factor lurking inside a bracket
    gcd(r, s) !== 1 ||
    m * s + r * n === 0 // avoid a vanishing middle term
  );

  const a = m * r;
  const b = m * s + r * n;
  const c = n * s;

  const questionMath = joinTerms(leadTerm(a, 'x^2'), laterTerm(b, 'x'), laterTerm(c));
  const answer = `${bracket(m, n)}${bracket(r, s)}`;

  return {
    instruction: 'Factorise',
    questionMath,
    answer,
    workingOut: `\\text{split the middle term: } ac = ${a * c}`,
    metadata: { topic: 'factorise-splitting-middle', difficulty },
  };
};

// ---------------------------------------------------------------------------
// 1H  —  a^2 x^2 - b^2 = (ax + b)(ax - b)   (optionally k times, common factor)
// ---------------------------------------------------------------------------

const pickDotsFactors = (difficulty) => {
  if (difficulty === 'foundation') {
    return { k: 1, a: 1, b: _.random(2, 9) }; // x^2 - b^2
  }
  if (difficulty === 'stretch') {
    return { k: _.sample([2, 3, 5]), a: _.sample([1, 2, 3]), b: _.random(2, 6) }; // remove a common factor first
  }
  return { k: 1, a: _.sample([2, 3, 4]), b: _.random(2, 6) }; // a^2 x^2 - b^2
};

export const generateDifferenceOfTwoSquares = (options = {}) => {
  const { difficulty = 'core' } = options;

  let k, a, b;
  do {
    ({ k, a, b } = pickDotsFactors(difficulty));
  } while (gcd(a, b) !== 1); // otherwise each bracket hides a further common factor

  const leadCoeff = k * a * a;
  const constCoeff = -k * b * b;

  const questionMath = joinTerms(leadTerm(leadCoeff, 'x^2'), laterTerm(constCoeff));
  const factored = `${bracket(a, b)}${bracket(a, -b)}`;
  const answer = k === 1 ? factored : `${k}${factored}`;
  const workingOut = k === 1
    ? 'a^2 - b^2 = (a + b)(a - b)'
    : `\\text{take out } ${k}\\text{, then } a^2 - b^2 = (a + b)(a - b)`;

  return {
    instruction: 'Factorise',
    questionMath,
    answer,
    workingOut,
    metadata: { topic: 'factorise-difference-of-two-squares', difficulty },
  };
};

// ---------------------------------------------------------------------------
// 1J  —  four terms, group in pairs
//        present the pre-split form of (mx + n)(rx + s):
//        mr x^2 + (ms) x + (rn) x + ns   (middle deliberately left uncombined)
// ---------------------------------------------------------------------------

const pickGroupingFactors = (difficulty) => {
  if (difficulty === 'foundation') {
    // monic, all positive (Haese 1J Q1)
    return { m: 1, r: 1, n: _.random(2, 8), s: _.random(2, 8) };
  }
  if (difficulty === 'stretch') {
    // non-monic, mixed signs (Haese 1J Q2 harder rows)
    const [m, r] = _.sample([[2, 1], [1, 2], [3, 1], [1, 3], [2, 3], [3, 2]]);
    return { m, r, n: randNonZero(-5, 5), s: randNonZero(-5, 5) };
  }
  // core: monic, mixed signs (Haese 1J Q2)
  return { m: 1, r: 1, n: randNonZero(-9, 9), s: randNonZero(-9, 9) };
};

export const generateFactoriseGrouping = (options = {}) => {
  const { difficulty = 'core' } = options;

  let m, r, n, s;
  do {
    ({ m, r, n, s } = pickGroupingFactors(difficulty));
  } while (
    gcd(m, n) !== 1 ||
    gcd(r, s) !== 1 ||
    m * s === r * n // keep the two middle terms distinct so grouping is non-trivial
  );

  const questionMath = joinTerms(
    leadTerm(m * r, 'x^2'),
    laterTerm(m * s, 'x'),
    laterTerm(r * n, 'x'),
    laterTerm(n * s),
  );
  const answer = `${bracket(m, n)}${bracket(r, s)}`;

  return {
    instruction: 'Factorise',
    questionMath,
    answer,
    workingOut: '\\text{group in pairs, then take out the common bracket}',
    metadata: { topic: 'factorise-grouping', difficulty },
  };
};