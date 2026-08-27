// src/generators/algebra/sequencesGenerators.js
// Geometric sequences — Haese Ch26C convention: a_n = a × r^(n-1)

import _ from 'lodash';

const NL = '\n';

// Foundation/Core: positive integer ratio (growth reads as "times by").
// Stretch: negative integer ratio — forces tracking sign alternation as
// well as magnitude, same escalation pattern as the negative-d Stretch
// case in the arithmetic batch.
const RATIO_BANDS = {
  foundation: [2, 3],
  core: [2, 3, 4],
  stretch: [-2, -3],
};

const formatRuleLatex = (a, r) => {
  const base = r < 0 ? `(${r})` : `${r}`;
  // a === 1 reads oddly as "1 × 2^(n-1)" — special-cased so it prints
  // as a_n = 2^{n-1} instead. Only matters for the pattern skill below,
  // which fixes a = 1, but kept general in case that changes later.
  const coeff = a === 1 ? '' : `${a} \\times `;
  return `a_n = ${coeff}${base}^{n-1}`;
};

const nthTerm = (a, r, n) => a * Math.pow(r, n - 1);

// generateSequenceFindNthTermGeometric --------------------------------------
// Given the first 4 terms, find a and r, state a_n = a × r^(n-1).
export const generateSequenceFindNthTermGeometric = (options = {}) => {
  const { difficulty = 'core' } = options;
  const ratios = RATIO_BANDS[difficulty] || RATIO_BANDS.core;
  const r = _.sample(ratios);
  const a = difficulty === 'core' ? _.random(2, 12) : _.random(2, 9);

  const terms = [1, 2, 3, 4].map((k) => nthTerm(a, r, k));
  // Plain ", " and "..." here, not "\ " / "\ldots" — the Archivo parser
  // (src/lib/archivoMath.jsx) doesn't know either LaTeX spacing command and
  // silently falls back to KaTeX for the whole line when it meets one,
  // which is a visual style mismatch against the rest of the board, not
  // just a missed optimisation.
  const termsStr = terms.join(', ');

  return {
    instruction: 'Find a formula for the nth term of the sequence',
    questionMath: `${termsStr}, ...`,
    answer: formatRuleLatex(a, r),
    workingOut:
      `\\text{ratio } r = ${terms[1]} \\div ${terms[0]} = ${r}` + NL +
      `\\text{first term } a = ${a}` + NL +
      formatRuleLatex(a, r),
    metadata: { topic: 'sequences-geometric-nth-term', difficulty },
  };
};

// generateSequenceUseNthTermGeometric ----------------------------------------
// Given a_n = a × r^(n-1), find the first 5 terms and one further term.
// a and target index kept modest by design — values grow fast, that's the
// point, but a wall of digits stops being legible on a board.
export const generateSequenceUseNthTermGeometric = (options = {}) => {
  const { difficulty = 'core' } = options;
  const ratios = RATIO_BANDS[difficulty] || RATIO_BANDS.core;
  const r = _.sample(ratios);
  const a = _.random(2, 9);
  const targetN = { foundation: _.random(5, 6), core: _.random(5, 7), stretch: _.random(6, 8) }[difficulty] || _.random(5, 7);

  const firstFive = [1, 2, 3, 4, 5].map((k) => nthTerm(a, r, k));
  const targetValue = nthTerm(a, r, targetN);

  return {
    instruction: `Find the first 5 terms, then find the ${targetN}th term`,
    questionMath: formatRuleLatex(a, r),
    // Two lines, not one joined with "\quad" — same unsupported-command
    // fallback as the ellipsis above, and a clean line break reads better
    // here anyway (matches how every multi-step workingOut in this file
    // already separates lines with NL).
    answer: `${firstFive.join(', ')}` + NL + `a_{${targetN}} = ${targetValue}`,
    workingOut:
      firstFive.map((t, i) => `a_{${i + 1}} = ${t}`).join(NL) + NL +
      `a_{${targetN}} = ${a} \\times ${r}^{${targetN - 1}} = ${targetValue}`,
    metadata: { topic: 'sequences-geometric-use-nth-term', difficulty },
  };
};

// generateSequenceIsInSequenceGeometric --------------------------------------
// Is a target value a term of a_n = a × r^(n-1)? Checked by repeated
// multiplication (matches how you teach it), not logs. "Yes" and "no"
// outcomes are both constructed deliberately, never left to chance:
// "yes" plants the target as a real term; "no" places it strictly between
// two consecutive real terms so it's genuinely unreachable — true
// regardless of sign, since |terms| is strictly increasing once |r| ≥ 2,
// so no other term (earlier or later, whatever its sign) can land inside
// that gap.
const MAX_CHECK_TERMS = 8;

export const generateSequenceIsInSequenceGeometric = (options = {}) => {
  const { difficulty = 'core' } = options;
  const ratios = RATIO_BANDS[difficulty] || RATIO_BANDS.core;
  const r = _.sample(ratios);
  const a = _.random(2, 9);

  const terms = [];
  for (let k = 1; k <= MAX_CHECK_TERMS; k++) terms.push(nthTerm(a, r, k));

  // Stretch only ever asks a "no" case — verifying "yes" with a negative
  // ratio needs no extra care here (the target is just planted on a real
  // term either way), but keeping stretch to "no" matches how this file's
  // other Stretch bands escalate by adding a genuinely new demand (tracking
  // sign alternation into unreachability) rather than by combining two.
  const wantYes = difficulty === 'foundation' ? true
    : difficulty === 'stretch' ? false
    : Math.random() < 0.5;

  let target, isIn, matchedN, stopAt;

  if (wantYes) {
    matchedN = _.random(3, 6);
    target = terms[matchedN - 1];
    isIn = true;
    stopAt = matchedN;
  } else {
    // With a negative ratio the gap between consecutive terms straddles
    // zero and can be wide — wide enough that an offset placed "strictly
    // between term n and term n+1" can still coincidentally land exactly
    // on an *earlier* term's value (e.g. a=2, r=-2: a_5=32, a_6=-64, and an
    // offset in that gap can land on 8 — which is a_3). Checking only the
    // immediate neighbours isn't enough, so retry until target matches
    // none of the terms actually being checked against.
    let n, lower, upper;
    do {
      n = _.random(2, 5);
      lower = terms[n - 1];
      upper = terms[n];
      const gap = Math.abs(upper - lower);
      // offset strictly inside (0, gap) so target can't land on either
      // neighbouring term — 0.2–0.6 of the gap keeps it clearly "between".
      const offset = Math.max(1, Math.round(gap * (0.2 + Math.random() * 0.4)));
      target = lower + (upper > lower ? offset : -offset);
    } while (terms.includes(target));
    isIn = false;
    matchedN = null;
    stopAt = Math.min(MAX_CHECK_TERMS, n + 1); // show just enough to bracket it, not all 8
  }

  const workingLines = [];
  for (let k = 1; k <= stopAt; k++) workingLines.push(`a_{${k}} = ${terms[k - 1]}`);

  return {
    instruction: 'Is this a term of the sequence?',
    questionMath: `${formatRuleLatex(a, r)},\\quad \\text{is } ${target} \\text{ a term?}`,
    answer: isIn ? `\\text{Yes} - a_{${matchedN}} = ${target}` : `\\text{No}`,
    workingOut: workingLines.join(NL) + NL +
      (isIn
        ? `\\text{keep multiplying by } ${r} \\text{ until we reach } ${target}`
        : `\\text{${target} lies strictly between } a_{${stopAt - 1}} \\text{ and } a_{${stopAt}} \\text{ above, so it's never reached}`),
    visualization: null,
    metadata: { topic: 'sequences-geometric-is-term', difficulty },
  };
};

// generateSequencePatternGeometric -------------------------------------------
// "Continue the pattern" for geometric growth — shown as branching, not
// dots. Literal counts explode too fast to draw honestly (ratio 3 from a
// start of 2 is 18 by term 3), so each node at generation k grows r
// children at generation k+1. a is fixed at 1 (one root) and only 3
// generations are shown, keeping term 3 to 4 or 9 nodes — still countable.
// Figure.jsx's 'branching-pattern' case lays the tree out from the counts.
const BRANCH_RATIOS = { foundation: [2], core: [2, 3], stretch: [2, 3] };

export const generateSequencePatternGeometric = (options = {}) => {
  const { difficulty = 'core' } = options;
  const r = _.sample(BRANCH_RATIOS[difficulty] || [2, 3]);
  const a = 1;
  const generationCounts = [1, 2, 3].map((k) => nthTerm(a, r, k));

  let instruction, answer;
  if (difficulty === 'foundation') {
    const askN = 4;
    instruction = `How many nodes are in generation ${askN}?`;
    answer = `${nthTerm(a, r, askN)}`;
  } else if (difficulty === 'core') {
    const askN = _.random(4, 5);
    instruction = `Which generation has ${nthTerm(a, r, askN)} nodes?`;
    answer = `\\text{Generation } ${askN}`;
  } else {
    const askN = _.random(6, 8);
    instruction = `Write the general rule for the nth term, then find term number ${askN}`;
    answer = `${formatRuleLatex(a, r)}` + NL + `a_{${askN}} = ${nthTerm(a, r, askN)}`;
  }

  return {
    instruction: 'Study the pattern, then answer:',
    questionMath: `\\text{${instruction}}`,
    answer,
    workingOut: `\\text{generations shown: } ${generationCounts.join(', ')}` + NL +
      `\\text{each node branches into } ${r} \\text{ more}`,
    visualization: { type: 'branching-pattern', ratio: r, generations: 3, counts: generationCounts, big: 1 },
    metadata: { topic: 'sequences-geometric-pattern', difficulty },
  };
};

// ===========================================================================
// Arithmetic sequences — Haese Ch26B convention: a_n = dn + c
// ===========================================================================

const formatArithmeticRule = (d, c) => {
  const dPart = d === 1 ? 'n' : d === -1 ? '-n' : `${d}n`;
  if (c === 0) return `a_n = ${dPart}`;
  const cPart = c > 0 ? `+ ${c}` : `- ${Math.abs(c)}`;
  return `a_n = ${dPart} ${cPart}`;
};

const randomFirstTerm = (allowNegative) => {
  const v = allowNegative ? _.random(-12, 12) : _.random(1, 12);
  return v === 0 ? 1 : v; // 0 is a valid term but reads like a mistake on a board
};

// generateSequenceFindNthTermArithmetic --------------------------------------
// Sequence -> a_n = dn + c. Presentation is randomised each call: either
// the first 4 terms, or a_1 and d stated directly (the slides' Type 1 vs
// Type 4) - same skill, different starting information.
export const generateSequenceFindNthTermArithmetic = (options = {}) => {
  const { difficulty = 'core' } = options;

  const d = difficulty === 'stretch'
    ? _.sample([-9, -8, -7, -6, -5, -4, -3, -2, 2, 3, 4, 5, 6, 7, 8, 9])
    : _.random(2, 9);
  const firstTerm = randomFirstTerm(difficulty !== 'foundation');
  const c = firstTerm - d; // a_1 = d(1) + c  =>  c = a_1 - d

  const terms = [1, 2, 3, 4].map((n) => d * n + c);
  const givenAsTerms = Math.random() < 0.5;

  return {
    instruction: givenAsTerms
      ? 'Find a formula for the nth term of the sequence'
      : 'Find a formula for the nth term, given the first term and the common difference',
    questionMath: givenAsTerms
      ? `${terms.join(', ')}, ...`
      : `a_1 = ${firstTerm}, d = ${d}`,
    answer: formatArithmeticRule(d, c),
    workingOut:
      (givenAsTerms
        ? `\\text{common difference } d = ${terms[1]} - ${terms[0]} = ${d}`
        : `\\text{common difference } d = ${d}`) + NL +
      `\\text{first term } a_1 = ${firstTerm}` + NL +
      formatArithmeticRule(d, c),
    metadata: { topic: 'sequences-arithmetic-nth-term', difficulty },
  };
};

// generateSequenceUseNthTermArithmetic ----------------------------------------
// Given a_n = dn + c, find the first 5 terms and one far term. Target
// ranges step up cleanly across bands (6-20 / 21-50 / 51-100) so they
// never overlap at the edges.
export const generateSequenceUseNthTermArithmetic = (options = {}) => {
  const { difficulty = 'core' } = options;

  const d = difficulty === 'stretch'
    ? _.sample([-9, -7, -5, -4, -3, -2, 2, 3, 4, 5, 6, 7, 8, 9])
    : _.random(2, 9);
  const c = difficulty === 'foundation' ? _.random(1, 10) : _.random(-15, 15);
  const targetN = { foundation: _.random(6, 20), core: _.random(21, 50), stretch: _.random(51, 100) }[difficulty] || _.random(21, 50);

  const firstFive = [1, 2, 3, 4, 5].map((n) => d * n + c);
  const targetValue = d * targetN + c;

  return {
    instruction: `Find the first 5 terms, then find the ${targetN}th term`,
    questionMath: formatArithmeticRule(d, c),
    answer: `${firstFive.join(', ')}` + NL + `a_{${targetN}} = ${targetValue}`,
    workingOut:
      firstFive.map((t, i) => `a_{${i + 1}} = ${t}`).join(NL) + NL +
      `a_{${targetN}} = ${d}(${targetN}) ${c >= 0 ? '+' : '-'} ${Math.abs(c)} = ${targetValue}`,
    metadata: { topic: 'sequences-arithmetic-use-nth-term', difficulty },
  };
};

// generateSequenceIsInSequenceArithmetic --------------------------------------
// Is a target value a term of a_n = dn + c? "Yes" and "no" outcomes are
// both constructed deliberately (never left to chance): "yes" plants the
// target as a real term; "no" offsets from a real term by an amount less
// than |d|, so n is guaranteed non-integer — and, unlike the geometric
// version of this skill, that's the whole story: the step size here is
// constant, so any offset strictly inside (0, |d|) rules out every term,
// not just the two immediate neighbours. Stretch nudges the offset off the
// exact half so it doesn't land on the too-obvious "16.5" case, except
// when |d| = 2, where 1 is the *only* valid offset and there's nothing to
// nudge to — forcing it there would overshoot to |d| itself and land back
// on a genuine term (found by the verification pass: |d|=2 in Stretch was
// answering "No" to a target that was actually in the sequence).
export const generateSequenceIsInSequenceArithmetic = (options = {}) => {
  const { difficulty = 'core' } = options;

  const d = difficulty === 'stretch'
    ? _.sample([-9, -7, -5, -4, -3, 2, 3, 4, 5, 6, 7])
    : _.random(2, 9);
  const c = _.random(-10, 10);

  const wantYes = difficulty === 'foundation' ? true
    : difficulty === 'stretch' ? false
    : Math.random() < 0.5;

  let target, isIn, matchedN;

  if (wantYes) {
    matchedN = _.random(8, 20);
    target = d * matchedN + c;
    isIn = true;
  } else {
    const n = _.random(8, 20);
    const termAtN = d * n + c;
    let offset = _.random(1, Math.abs(d) - 1) || 1;
    if (difficulty === 'stretch' && Math.abs(d) > 2 && Math.abs(d) % 2 === 0 && offset === Math.abs(d) / 2) {
      offset = offset === 1 ? offset + 1 : offset - 1; // avoid the exact-half decimal
    }
    target = termAtN + (d > 0 ? offset : -offset);
    isIn = false;
    matchedN = Number(((target - c) / d).toFixed(2));
  }

  return {
    instruction: 'Is this a term of the sequence?',
    questionMath: `${formatArithmeticRule(d, c)},\\quad \\text{is } ${target} \\text{ a term?}`,
    answer: isIn ? `\\text{Yes} - a_{${matchedN}} = ${target}` : '\\text{No}',
    workingOut:
      `${target} = ${d}n ${c >= 0 ? '+' : '-'} ${Math.abs(c)}` + NL +
      `n = ${matchedN}` + NL +
      (isIn ? '\\text{whole number, so yes}' : '\\text{not a whole number, so no}'),
    visualization: null,
    metadata: { topic: 'sequences-arithmetic-is-term', difficulty },
  };
};

// generateSequencePatternArithmetic -------------------------------------------
// "Continue the pattern" for arithmetic growth. Figure.jsx's
// 'growing-pattern' case draws terms 1-3 for whichever motif is picked.
const PATTERN_MOTIFS = ['matchstick-squares', 'dot-row', 'tile-squares'];

export const generateSequencePatternArithmetic = (options = {}) => {
  const { difficulty = 'core' } = options;

  const step = difficulty === 'foundation' ? _.random(2, 5) : _.random(4, 9);
  const startCount = _.random(3, 8);
  const motif = _.sample(PATTERN_MOTIFS);
  const countAt = (n) => startCount + step * (n - 1);
  const shownCounts = [1, 2, 3].map(countAt);
  const unit = motif === 'matchstick-squares' ? 'matches' : 'units';

  let instruction, answer;
  if (difficulty === 'foundation') {
    const askN = _.random(4, 5);
    instruction = `How many ${unit} are in term ${askN}?`;
    answer = `${countAt(askN)}`;
  } else if (difficulty === 'core') {
    const askN = _.random(8, 15);
    instruction = `Which term number uses ${countAt(askN)} ${unit}?`;
    answer = `\\text{Term } ${askN}`;
  } else {
    const askN = _.random(15, 25);
    const c = startCount - step;
    instruction = `Write a rule for the nth term, then find term number ${askN}`;
    answer = `${formatArithmeticRule(step, c)}` + NL + `a_{${askN}} = ${countAt(askN)}`;
  }

  return {
    instruction: 'Study the pattern, then answer:',
    questionMath: `\\text{${instruction}}`,
    answer,
    workingOut: `\\text{terms shown: } ${shownCounts.join(', ')}`,
    visualization: { type: 'growing-pattern', motif, step, startCount, counts: shownCounts, big: 1 },
    metadata: { topic: 'sequences-arithmetic-pattern', difficulty },
  };
};

// ===========================================================================
// Quadratic sequences — Haese Ch26D convention: a_n = a·n² + c (no linear
// term — the "compare to n²" method, not the full difference method)
// ===========================================================================

const formatQuadraticRule = (a, b, c) => {
  const aPart = a === 1 ? 'n^2' : `${a}n^2`;
  const bPart = b === 0 ? '' : b === 1 ? ' + n' : b === -1 ? ' - n'
    : b > 0 ? ` + ${b}n` : ` - ${Math.abs(b)}n`;
  const cPart = c === 0 ? '' : c > 0 ? ` + ${c}` : ` - ${Math.abs(c)}`;
  return `a_n = ${aPart}${bPart}${cPart}`;
};

const nthTermQuadratic = (a, b, c, n) => a * n * n + b * n + c;

const randomLinearCoeff = () => _.sample([-3, -2, -1, 1, 2, 3]); // stretch only, never 0

// generateSequenceFindNthTermQuadratic ----------------------------------------
// Foundation fixes a = 1 and shows the n² reference row so it's a direct
// comparison; Core drops the scaffold and varies a; Stretch adds a genuine
// bn term on top, found by subtracting an² from each term to leave an
// arithmetic sequence (their existing skill), rather than the full
// difference method.
export const generateSequenceFindNthTermQuadratic = (options = {}) => {
  const { difficulty = 'core' } = options;

  const a = difficulty === 'foundation' ? 1 : difficulty === 'core' ? _.sample([1, 2, 3]) : _.sample([2, 3, 4, 5]);
  const b = difficulty === 'stretch' ? randomLinearCoeff() : 0;
  const c = difficulty === 'foundation' ? _.random(1, 10) : difficulty === 'core' ? _.random(-10, 10) : _.random(-20, 20);
  const terms = [1, 2, 3, 4, 5].map((n) => nthTermQuadratic(a, b, c, n));
  const showReference = difficulty === 'foundation';

  const workingOut = b === 0
    ? (showReference
        ? `\\text{each term is } ${a === 1 ? '' : `${a} \\times `}n^2 ${c >= 0 ? '+' : '-'} ${Math.abs(c)}`
        : `\\text{2nd difference} = ${2 * a}, \\text{ so } a = ${a}`) + NL +
      `\\text{check } n=1: ${a}(1) ${c >= 0 ? '+' : '-'} ${Math.abs(c)} = ${terms[0]}` + NL +
      formatQuadraticRule(a, b, c)
    : (() => {
        const residuals = [1, 2, 3, 4, 5].map((n) => terms[n - 1] - a * n * n);
        return `\\text{2nd difference} = ${2 * a}, \\text{ so } a = ${a}` + NL +
          `\\text{subtract } ${a}n^2 \\text{ from each term: } ${residuals.join(',\\ ')}` + NL +
          `\\text{that's arithmetic: } b = ${residuals[1]} - ${residuals[0]} = ${b}, \\quad c = ${residuals[0]} - ${b} = ${c}` + NL +
          formatQuadraticRule(a, b, c);
      })();

  return {
    instruction: showReference
      ? 'Compare to n²: 1, 4, 9, 16, 25 — then find a formula for a_n'
      : 'Find a formula for the nth term of the sequence',
    questionMath: `${terms.join(',\\ ')},\\ \\ldots`,
    answer: formatQuadraticRule(a, b, c),
    workingOut,
    visualization: null,
    metadata: { topic: 'sequences-quadratic-nth-term', difficulty },
  };
};

// generateSequenceUseNthTermQuadratic ------------------------------------------
// Given a_n = a·n² + c, find the first 5 terms and one further term.
// Target ranges step cleanly across bands - 6-9 / 10-15 / 16-20.
export const generateSequenceUseNthTermQuadratic = (options = {}) => {
  const { difficulty = 'core' } = options;

  const a = difficulty === 'foundation' ? 1
    : difficulty === 'core' ? _.sample([1, 2, 3])
    : _.sample([2, 3, 4, 5]);
  const b = difficulty === 'stretch' ? randomLinearCoeff() : 0;
  const c = difficulty === 'foundation' ? _.random(1, 10)
    : difficulty === 'core' ? _.random(-10, 10)
    : _.random(-20, 20);
  const targetN = { foundation: _.random(6, 9), core: _.random(10, 15), stretch: _.random(16, 20) }[difficulty] || _.random(10, 15);

  const firstFive = [1, 2, 3, 4, 5].map((n) => nthTermQuadratic(a, b, c, n));
  const targetValue = nthTermQuadratic(a, b, c, targetN);

  return {
    instruction: `Find the first 5 terms, then find the ${targetN}th term`,
    questionMath: formatQuadraticRule(a, b, c),
    answer: `${firstFive.join(', ')}` + NL + `a_{${targetN}} = ${targetValue}`,
    workingOut:
      firstFive.map((t, i) => `a_{${i + 1}} = ${t}`).join(NL) + NL +
      `a_{${targetN}} = ${a}(${targetN})^2 ${b >= 0 ? '+' : '-'} ${Math.abs(b)}(${targetN}) ${c >= 0 ? '+' : '-'} ${Math.abs(c)} = ${targetValue}`,
    metadata: { topic: 'sequences-quadratic-use-nth-term', difficulty },
  };
};

// generateSequenceIsInSequenceQuadratic -----------------------------------------
// Is a target value a term of a_n = a·n² + c? Same deliberate yes/no
// construction as the arithmetic version, and the same reasoning for why
// "no" only needs to dodge its two immediate neighbours: a·n² + c (a > 0)
// is strictly increasing in n, so unlike the geometric version's
// sign-alternating sequence, no other term can ever fall inside the gap
// between two consecutive ones. The gap between quadratic terms also grows
// with n, so a proportional offset (25-65% of the gap) comfortably avoids
// landing on either neighbour by accident.
export const generateSequenceIsInSequenceQuadratic = (options = {}) => {
  const { difficulty = 'core' } = options;

  const a = difficulty === 'foundation' ? 1
    : difficulty === 'core' ? _.sample([1, 2, 3])
    : _.sample([2, 3, 4, 5]);
  // wantYes is always false at stretch (below), so a nonzero b — stretch
  // only — never reaches the "yes" branch's b=0-only algebra.
  const b = difficulty === 'stretch' ? randomLinearCoeff() : 0;
  const c = _.random(-10, 10);

  const wantYes = difficulty === 'foundation' ? true
    : difficulty === 'stretch' ? false
    : Math.random() < 0.5;

  let target, isIn, matchedN, workingLines;

  if (wantYes) {
    matchedN = _.random(4, 10);
    target = nthTermQuadratic(a, b, c, matchedN);
    isIn = true;
    workingLines = [
      `n^2 = (${target} ${c >= 0 ? '-' : '+'} ${Math.abs(c)}) \\div ${a} = ${matchedN * matchedN}`,
      `n = \\sqrt{${matchedN * matchedN}} = ${matchedN}`,
      '\\text{whole number, so yes}',
    ];
  } else {
    const n = _.random(4, 9);
    const lower = nthTermQuadratic(a, b, c, n);
    const upper = nthTermQuadratic(a, b, c, n + 1);
    const gap = upper - lower;
    const offset = Math.max(1, Math.round(gap * (0.25 + Math.random() * 0.4)));
    target = lower + offset;
    isIn = false;

    if (b === 0) {
      const nSquared = (target - c) / a;
      workingLines = [
        `n^2 = (${target} ${c >= 0 ? '-' : '+'} ${Math.abs(c)}) \\div ${a} = ${nSquared.toFixed(2)}`,
        // "≈" is a literal character here, not "\approx" — the Archivo parser
        // (src/lib/archivoMath.jsx) doesn't know that command either, same
        // silent-KaTeX-fallback issue as "\ "/"\ldots"/"\quad" elsewhere in
        // this file.
        `n = \\sqrt{${nSquared.toFixed(2)}} ≈ ${Math.sqrt(nSquared).toFixed(2)}`,
        '\\text{not a whole number, so no}',
      ];
    } else {
      // b ≠ 0 only happens here (Stretch, "no" only) — the compare-to-n²
      // shortcut above needs b = 0, so this case solves via the quadratic
      // formula instead.
      const D = b * b - 4 * a * (c - target);
      const nValue = (-b + Math.sqrt(D)) / (2 * a);
      workingLines = [
        `${a}n^2 ${b >= 0 ? '+' : '-'} ${Math.abs(b)}n ${c >= 0 ? '+' : '-'} ${Math.abs(c)} = ${target}`,
        `n ≈ ${nValue.toFixed(2)} \\text{ using the quadratic formula}`,
        '\\text{not a whole number, so no}',
      ];
    }
  }

  return {
    instruction: 'Is this a term of the sequence?',
    questionMath: `${formatQuadraticRule(a, b, c)},\\quad \\text{is } ${target} \\text{ a term?}`,
    answer: isIn ? `\\text{Yes} - a_{${matchedN}} = ${target}` : '\\text{No}',
    workingOut: workingLines.join(NL),
    visualization: null,
    metadata: { topic: 'sequences-quadratic-is-term', difficulty },
  };
};

// generateSequencePatternQuadratic -----------------------------------------------
// "Continue the pattern" for quadratic growth - an n×n dot grid plus c
// extra dots in a distinct spot. a fixed at 1 for the figure specifically
// (scaling the grid to 'a copies' isn't worth the visual complexity yet),
// even though a varies in the three skills above. Figure.jsx's
// 'dot-grid-pattern' case draws the grid and the extra-dot row.
export const generateSequencePatternQuadratic = (options = {}) => {
  const { difficulty = 'core' } = options;

  const a = 1;
  const b = 0;
  const c = difficulty === 'foundation' ? _.random(0, 4) : _.random(0, 8);
  const countAt = (n) => nthTermQuadratic(a, b, c, n);
  const shownCounts = [1, 2, 3].map(countAt);

  let instruction, answer;
  if (difficulty === 'foundation') {
    const askN = _.random(4, 5);
    instruction = `How many dots are in term ${askN}?`;
    answer = `${countAt(askN)}`;
  } else if (difficulty === 'core') {
    const askN = _.random(6, 9);
    instruction = `Which term number has ${countAt(askN)} dots?`;
    answer = `\\text{Term } ${askN}`;
  } else {
    const askN = _.random(10, 15);
    instruction = `Write a rule for the nth term, then find term number ${askN}`;
    answer = `${formatQuadraticRule(a, b, c)}` + NL + `a_{${askN}} = ${countAt(askN)}`;
  }

  return {
    instruction: 'Study the pattern, then answer:',
    questionMath: `\\text{${instruction}}`,
    answer,
    workingOut: `\\text{terms shown: } ${shownCounts.join(', ')}`,
    visualization: { type: 'dot-grid-pattern', extraDots: c, counts: shownCounts, big: 1 },
    metadata: { topic: 'sequences-quadratic-pattern', difficulty },
  };
};
