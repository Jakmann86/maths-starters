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
    instruction: `Is ${target} a term of this sequence?`,
    questionMath: formatRuleLatex(a, r),
    answer: isIn ? `\\text{Yes} - a_{${matchedN}} = ${target}` : `\\text{No}`,
    workingOut: workingLines.join(NL) + NL +
      (isIn
        ? `\\text{keep multiplying by } ${r} \\text{ until we reach } ${target}`
        : `\\text{${target} lies strictly between } a_{${stopAt - 1}} \\text{ and } a_{${stopAt}} \\text{ above, so it's never reached}`),
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
    instruction,
    answer,
    workingOut: `\\text{generations shown: } ${generationCounts.join(', ')}` + NL +
      `\\text{each node branches into } ${r} \\text{ more}`,
    visualization: { type: 'branching-pattern', ratio: r, generations: 3, counts: generationCounts, big: 1 },
    metadata: { topic: 'sequences-geometric-pattern', difficulty },
  };
};
