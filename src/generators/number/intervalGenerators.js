// src/generators/number/intervalGenerators.js
//
// Interval notation — Haese 2C. Sets of numbers written with symbols only,
// {x | -3 < x ≤ 2}, read as "the set of all x such that ...". Unless the set
// says otherwise x is real; x ∈ Z, N or Z⁺ restricts it. Haese's N includes
// 0 (2B: "N, the natural or counting numbers {0, 1, 2, 3, ...}").
//
//   interval-list-elements   List the elements of the set
//     Foundation  integers between two bounds, x ∈ Z: a short finite list
//     Core        x ∈ N or x ∈ Z⁺, with a lower bound below where the set
//                 starts, or none at all, so the start comes from the set
//                 itself (Haese 2C Q2d, f)
//     Stretch     one bound only, x ∈ Z or N: a list that carries on for
//                 ever, written with "..." (Haese Example 4, 2C Q2b, c, e)
//
//   interval-write           Write in interval notation
//     Foundation  a finite list of consecutive integers (2C Q3a, b)
//     Core        a number line showing a stretch of real numbers, each end
//                 included or not (2C Q4)
//     Stretch     a set that carries on: a list with "..." (2C Q3c, d, f),
//                 or a number line with a ray, or two rays joined by "or"
//                 (Review set 2B Q1d)
//
// The answer to a write question is printed in one form: a list of integers
// with ≤ at both ends, as Haese Example 3 writes it. Other correct forms
// exist ({x | 0 < x < 6, x ∈ Z} for 1 to 5), and the teacher marks them.

import _ from 'lodash';

const NL = '\n';

const SETS = { Z: '\\mathbb{Z}', N: '\\mathbb{N}', 'Z+': '\\mathbb{Z}^+' };
/** The first element of each number set, or -Infinity. */
const START = { Z: -Infinity, N: 0, 'Z+': 1 };

const listTex = (xs, { before = false, after = false } = {}) =>
  `\\{${[...(before ? ['\\ldots'] : []), ...xs, ...(after ? ['\\ldots'] : [])].join(', ')}\\}`;

/**
 * The set-builder form. lo and hi are { v, op } or null; or is [left, right]
 * for "x ≤ a or x > b".
 */
function builderTex({ lo, hi, or, set }) {
  let cond;
  if (or) {
    const [l, r] = or;
    cond = `x ${l.op} ${l.v} \\text{ or } x ${r.op === '<' ? '>' : '\\ge'} ${r.v}`;
  } else if (lo && hi) cond = `${lo.v} ${lo.op} x ${hi.op} ${hi.v}`;
  else if (lo) cond = `x ${lo.op === '<' ? '>' : '\\ge'} ${lo.v}`;
  else cond = `x ${hi.op} ${hi.v}`;
  return `\\{x \\mid ${cond}${set ? `, \\ x \\in ${SETS[set]}` : ''}\\}`;
}

/** The integers from lo to hi, inclusive. */
const range = (a, b) => _.range(a, b + 1);
/** The first integer in the set above a lower bound. */
const firstAbove = ({ v, op }) => (op === '<' ? v + 1 : v);
const lastBelow = ({ v, op }) => (op === '<' ? v - 1 : v);

const pickOp = () => _.sample(['<', '\\le']);

/* ------------------------------------------------------ list the elements */

export const generateIntervalListElements = (options = {}) => {
  const { difficulty = 'core' } = options;
  const topic = 'interval-list-elements';
  const base = { instruction: 'List the elements of the set', metadata: { topic, difficulty } };

  if (difficulty === 'foundation') {
    for (;;) {
      const lo = { v: _.random(-6, 3), op: pickOp() };
      const hi = { v: lo.v + _.random(3, 8), op: pickOp() };
      const xs = range(firstAbove(lo), lastBelow(hi));
      if (xs.length < 3 || xs.length > 7) continue;
      const set = { lo, hi, set: 'Z' };
      return {
        ...base,
        questionMath: builderTex(set),
        answer: listTex(xs),
        workingOut: [
          `${lo.op === '<' ? `${lo.v} \\text{ is not included}` : `${lo.v} \\text{ is included}`}, \\ ${hi.op === '<' ? `${hi.v} \\text{ is not included}` : `${hi.v} \\text{ is included}`}`,
          listTex(xs),
        ].join(NL),
      };
    }
  }

  if (difficulty === 'core') {
    // The set starts the list: N at 0, Z⁺ at 1. The bound below it, if
    // there is one, is a distractor.
    for (;;) {
      const set = _.sample(['N', 'Z+']);
      const hi = { v: _.random(3, 8), op: pickOp() };
      const lo = Math.random() < 0.5 ? null : { v: _.random(-5, START[set] - 1), op: pickOp() };
      // A lower bound that cuts in above the set's start would not be a
      // trap; the generator above keeps it below.
      if (lo && firstAbove(lo) > START[set]) continue;
      const xs = range(START[set], lastBelow(hi));
      if (xs.length < 3 || xs.length > 8) continue;
      return {
        ...base,
        questionMath: builderTex({ lo, hi, set }),
        answer: listTex(xs),
        workingOut: [
          set === 'N' ? `\\mathbb{N} = \\{0, 1, 2, 3, \\ldots\\}` : `\\mathbb{Z}^+ = \\{1, 2, 3, \\ldots\\}`,
          listTex(xs),
        ].join(NL),
      };
    }
  }

  // One bound: the list carries on for ever. Three elements are written,
  // then "...", as Haese Example 4 writes it.
  for (;;) {
    const set = _.sample(['Z', 'Z', 'N']);
    const up = set === 'N' ? true : Math.random() < 0.5;
    const b = { v: up ? _.random(-6, 6) : _.random(-4, 8), op: pickOp() };
    if (up) {
      const first = Math.max(firstAbove(b), START[set]);
      // With N, a bound below 0 changes nothing: kept for Core.
      if (set === 'N' && firstAbove(b) < 0) continue;
      const xs = range(first, first + 2);
      return {
        ...base,
        questionMath: builderTex({ lo: b, hi: null, set }),
        answer: listTex(xs, { after: true }),
        workingOut: [`\\text{the smallest is } ${first}\\text{, and there is no largest}`, listTex(xs, { after: true })].join(NL),
      };
    }
    const last = lastBelow(b);
    const xs = range(last - 2, last);
    return {
      ...base,
      questionMath: builderTex({ lo: null, hi: b, set }),
      answer: listTex(xs, { before: true }),
      workingOut: [`\\text{the largest is } ${last}\\text{, and there is no smallest}`, listTex(xs, { before: true })].join(NL),
    };
  }
};

/* --------------------------------------------------- write in interval form */

// How a number line is drawn around the numbers it shows: a margin of one
// or two either side, eight to eleven units wide, so its numbers never
// crowd.
function lineAround(lo, hi) {
  const min = Math.min(lo, hi) - _.random(1, 2);
  const max = Math.max(lo, hi) + _.random(1, 2);
  if (max - min > 11) return null;
  if (max - min < 8) return { min: min - Math.ceil((8 - (max - min)) / 2), max: max + Math.floor((8 - (max - min)) / 2) };
  return { min, max };
}

/** "filled at 2: included" — what the circle at v says. */
const endText = (v, inc) => `\\text{${inc ? 'filled' : 'open'} at } ${v}\\text{: ${inc ? 'included' : 'not included'}}`;

export const generateIntervalWrite = (options = {}) => {
  const { difficulty = 'core' } = options;
  const topic = 'interval-write';
  const base = { instruction: 'Write in interval notation', metadata: { topic, difficulty } };

  if (difficulty === 'foundation') {
    const a = _.random(-8, 4);
    const xs = range(a, a + _.random(3, 7));
    const answer = builderTex({ lo: { v: xs[0], op: '\\le' }, hi: { v: xs.at(-1), op: '\\le' }, set: 'Z' });
    return {
      ...base,
      questionMath: listTex(xs),
      answer,
      workingOut: [`\\text{integers from } ${xs[0]} \\text{ to } ${xs.at(-1)}`, answer].join(NL),
    };
  }

  if (difficulty === 'core') {
    for (;;) {
      const lo = _.random(-7, 3);
      const hi = lo + _.random(2, 8);
      const box = lineAround(lo, hi);
      if (!box) continue;
      const [fromIn, toIn] = [Math.random() < 0.5, Math.random() < 0.5];
      const answer = builderTex({ lo: { v: lo, op: fromIn ? '\\le' : '<' }, hi: { v: hi, op: toIn ? '\\le' : '<' } });
      return {
        ...base,
        answer,
        workingOut: [`${endText(lo, fromIn)}, \\ ${endText(hi, toIn)}`, answer].join(NL),
        visualization: { type: 'number-line', big: true, ...box, set: { parts: [{ from: lo, to: hi, fromIn, toIn }] } },
      };
    }
  }

  const kind = _.sample(['list', 'ray', 'two rays']);
  if (kind === 'list') {
    const up = Math.random() < 0.5;
    const a = _.random(-6, 8);
    const xs = up ? range(a, a + 3) : range(a - 3, a);
    const answer = builderTex(up ? { lo: { v: a, op: '\\le' }, hi: null, set: 'Z' } : { lo: null, hi: { v: a, op: '\\le' }, set: 'Z' });
    return {
      ...base,
      questionMath: listTex(xs, up ? { after: true } : { before: true }),
      answer,
      workingOut: [`\\text{integers, ${up ? 'from' : 'up to'} } ${a}\\text{, with no ${up ? 'largest' : 'smallest'}}`, answer].join(NL),
    };
  }
  if (kind === 'ray') {
    const up = Math.random() < 0.5;
    const v = _.random(-5, 5);
    const inc = Math.random() < 0.5;
    const box = lineAround(v - 3, v + 3);
    const part = up ? { from: v, to: null, fromIn: inc } : { from: null, to: v, toIn: inc };
    const answer = builderTex(up ? { lo: { v, op: inc ? '\\le' : '<' }, hi: null } : { lo: null, hi: { v, op: inc ? '\\le' : '<' } });
    return {
      ...base,
      answer,
      workingOut: [`${endText(v, inc)}\\text{; the arrow carries on}`, answer].join(NL),
      visualization: { type: 'number-line', big: true, ...box, set: { parts: [part] } },
    };
  }
  for (;;) {
    const a = _.random(-5, 2);
    const b = a + _.random(2, 6);
    const box = lineAround(a, b);
    if (!box) continue;
    const [aIn, bIn] = [Math.random() < 0.5, Math.random() < 0.5];
    const answer = builderTex({ or: [{ v: a, op: aIn ? '\\le' : '<' }, { v: b, op: bIn ? '\\le' : '<' }] });
    return {
      ...base,
      answer,
      workingOut: [`${endText(a, aIn)}, \\ ${endText(b, bIn)}`, answer].join(NL),
      visualization: {
        type: 'number-line', big: true, ...box,
        set: { parts: [{ from: null, to: a, toIn: aIn }, { from: b, to: null, fromIn: bIn }] },
      },
    };
  }
};

