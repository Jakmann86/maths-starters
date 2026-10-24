// src/generators/statistics/spreadGenerators.js
//
// Haese 13D (measuring spread), 13E (data in frequency tables) and 13G Q1
// (comparing two players). Two skills in the Spread topic:
//
//   quartiles-iqr
//     foundation  an ordered list whose quartiles are data values (n = 7, 11, 15)
//     core        an unordered list whose quartiles fall between two values,
//                 so they are averaged (n = 8, 9, 10, 12)
//     stretch     a discrete frequency table: find where each quartile falls
//                 by counting through the frequencies
//
//   compare-distributions
//     foundation  who is more consistent? by the range
//     core        two ordered lists: who scored higher on average (the median)
//                 and who was more consistent (the IQR)
//     stretch     the range and the IQR disagree, because one player has a
//                 single extreme score: consistency is judged by the IQR,
//                 which that one score does not move
//
// QUARTILES BY HAESE'S METHOD (Examples 4 and 5). Order the data and find the
// median. If n is odd the median is a data value: leave it out and split the
// rest in two. If n is even, split down the middle. Q1 and Q3 are the medians
// of the two halves. Some calculators and spreadsheets use other rules, so the
// working says which one this is.

import _ from 'lodash';

const NL = '\n';

/* ---------------------------------------------------------- statistics */

export const median = (sorted) => {
  const n = sorted.length;
  return n % 2 ? sorted[(n - 1) / 2] : (sorted[n / 2 - 1] + sorted[n / 2]) / 2;
};

export function quartiles(values) {
  const s = _.sortBy(values);
  const n = s.length;
  const half = Math.floor(n / 2);
  const lower = s.slice(0, half);
  const upper = s.slice(n % 2 ? half + 1 : half);
  return { sorted: s, q1: median(lower), q2: median(s), q3: median(upper), lower, upper };
}

const fmt = (x) => String(Number(x.toFixed(2)));
const list = (xs) => xs.join(', ');

/* ------------------------------------------------------------- contexts */

// What a list of numbers is, as a noun phrase, with a plausible range.
// Whole numbers only.
export const LIST_CONTEXTS = [
  { of: (n) => `the marks of ${n} students in a test out of 40`, lo: 8, hi: 40 },
  { of: (n) => `the goals scored by a team in ${n} matches`, lo: 0, hi: 7 },
  { of: (n) => `the times, in minutes, that ${n} students took to get to school`, lo: 5, hi: 45 },
  { of: (n) => `the ages of ${n} people at a party`, lo: 11, hi: 48 },
  { of: (n) => `the numbers of books read by ${n} students last year`, lo: 1, hi: 24 },
  { of: (n) => `the heights, in cm, of ${n} seedlings`, lo: 4, hi: 30 },
];

const drawList = (ctx, n) => _.times(n, () => _.random(ctx.lo, ctx.hi));

/* ------------------------------------------------------- quartiles-iqr */

export const generateQuartilesIqr = (options = {}) => {
  const { difficulty = 'core' } = options;
  if (difficulty === 'stretch') return quartilesFromTable();
  return quartilesFromList(difficulty);
};

function quartilesFromList(difficulty) {
  for (;;) {
    const ctx = _.sample(LIST_CONTEXTS);
    const n = difficulty === 'foundation' ? _.sample([7, 11, 15]) : _.sample([8, 9, 10, 12]);
    const xs = drawList(ctx, n);
    const { sorted, q1, q2, q3, lower, upper } = quartiles(xs);
    const iqr = q3 - q1;
    if (iqr <= 0) continue;
    if (difficulty === 'core') {
      // At least one quartile between two values, so averaging is needed —
      // otherwise this is Foundation with a shuffle.
      if (Number.isInteger(q1) && Number.isInteger(q3)) continue;
      // Unordered on the page: already-sorted by chance would give away a step.
      if (_.isEqual(xs, sorted)) continue;
    }
    const shown = difficulty === 'foundation' ? sorted : xs;
    const odd = n % 2 === 1;
    return {
      instruction: `Find the interquartile range of ${ctx.of(n)}.`,
      questionMath: list(shown),
      answer: fmt(iqr),
      workingOut: [
        ...(difficulty === 'foundation' ? [] : [`\\text{ordered: } ${list(sorted)}`]),
        `\\text{median} = ${fmt(q2)}${odd ? ' \\text{, left out of both halves}' : ''}`,
        `\\text{lower half: } ${list(lower)} \\text{, so } Q_1 = ${fmt(q1)}`,
        `\\text{upper half: } ${list(upper)} \\text{, so } Q_3 = ${fmt(q3)}`,
        `\\text{IQR} = ${fmt(q3)} - ${fmt(q1)} = ${fmt(iqr)}`,
      ].join(NL),
      metadata: { topic: 'quartiles-iqr', difficulty },
    };
  }
}

// Haese 13E: a discrete frequency table. The data never appears as a list,
// so the quartiles have to be located by counting through the frequencies.
export const TABLE_CONTEXTS = [
  { shows: 'the number of siblings of each student in a class', head: 'Siblings', xs: [0, 1, 2, 3, 4, 5] },
  { shows: 'the number of goals a team scored in each match of a season', head: 'Goals', xs: [0, 1, 2, 3, 4, 5] },
  { shows: 'the number of people in each car passing a school', head: 'People', xs: [1, 2, 3, 4, 5] },
  { shows: 'the score on each throw of a dice', head: 'Score', xs: [1, 2, 3, 4, 5, 6] },
  { shows: 'the number of pets owned by each student in a class', head: 'Pets', xs: [0, 1, 2, 3, 4] },
];

function quartilesFromTable() {
  for (;;) {
    const ctx = _.sample(TABLE_CONTEXTS);
    const fs = ctx.xs.map(() => _.random(1, 9));
    const n = _.sum(fs);
    if (n < 15 || n > 35) continue;
    const data = ctx.xs.flatMap((x, i) => _.times(fs[i], () => x));
    const { q1, q3 } = quartiles(data);
    const iqr = q3 - q1;
    // A zero IQR is a fair answer in principle, but it reads like a mistake
    // on a starter; and Q1 = Q3 hides the method.
    if (iqr <= 0) continue;
    const cfs = fs.reduce((acc, f) => [...acc, (acc.at(-1) ?? 0) + f], []);
    const half = Math.floor(n / 2);
    const place = (k) => `${k}${['th', 'st', 'nd', 'rd'][k % 10 > 3 || [11, 12, 13].includes(k % 100) ? 0 : k % 10]}`;
    const where = (pos) => {
      // pos is 1-based; a half position means two neighbours.
      const at = (p) => ctx.xs[cfs.findIndex((c) => c >= p)];
      return Number.isInteger(pos)
        ? `\\text{the ${place(pos)} value is } ${at(pos)}`
        : `\\text{the ${place(Math.floor(pos))} and ${place(Math.ceil(pos))} values are } ${at(Math.floor(pos))} \\text{ and } ${at(Math.ceil(pos))}`;
    };
    // Positions of Q1 and Q3 in the whole ordered list, by Haese's method.
    const lowerLen = half;
    const q1pos = (lowerLen + 1) / 2;
    const q3pos = (n % 2 ? half + 1 : half) + (lowerLen + 1) / 2;
    return {
      instruction: `The table shows ${ctx.shows}. Find the interquartile range.`,
      answer: fmt(iqr),
      workingOut: [
        `n = ${n} \\text{, cumulative: } ${cfs.join(', ')}`,
        `Q_1 \\text{: } ${where(q1pos)} \\text{, so } Q_1 = ${fmt(q1)}`,
        `Q_3 \\text{: } ${where(q3pos)} \\text{, so } Q_3 = ${fmt(q3)}`,
        `\\text{IQR} = ${fmt(q3)} - ${fmt(q1)} = ${fmt(iqr)}`,
      ].join(NL),
      visualization: {
        type: 'table',
        header: 'column',
        rows: [[ctx.head, ...ctx.xs.map(String)], ['Frequency', ...fs.map(String)]],
        big: true,
      },
      metadata: { topic: 'quartiles-iqr', difficulty: 'stretch' },
    };
  }
}

/* ------------------------------------------------ compare-distributions */

export const PAIR_CONTEXTS = [
  { what: (n) => `The table shows the points scored by two basketball players in ${n} games.`, lo: 4, hi: 34 },
  { what: (n) => `The table shows the marks of two students in ${n} spelling tests out of 30.`, lo: 8, hi: 30 },
  { what: (n) => `The table shows the runs scored by two cricketers in ${n} innings.`, lo: 0, hi: 60 },
  { what: (n) => `The table shows the numbers of customers at two cafés on ${n} days.`, lo: 20, hi: 80 },
];

export const PLAYERS = ['Ana', 'Ben', 'Mei', 'Omar', 'Priya', 'Leo', 'Zara', 'Kofi'];

export const generateCompareDistributions = (options = {}) => {
  const { difficulty = 'core' } = options;
  if (difficulty === 'foundation') return compareByRange();
  if (difficulty === 'stretch') return compareOutlier();
  return compareMedianIqr();
};

// The two data sets go in a table, one row each, so the asks can sit beside
// it as questionParts (the board shows parts in place of questionMath).
const twoRows = (a, b, xs, ys) => ({
  type: 'table',
  header: 'column',
  rows: [[a, ...xs.map(String)], [b, ...ys.map(String)]],
  big: true,
});
const range = (xs) => Math.max(...xs) - Math.min(...xs);
const cafe = (ctx) => ctx.what(1).includes('cafés');
const labels = (ctx) => (cafe(ctx) ? ['Café A', 'Café B'] : _.sampleSize(PLAYERS, 2));

function compareByRange() {
  for (;;) {
    const ctx = _.sample(PAIR_CONTEXTS);
    const n = _.random(6, 8);
    // One tight, one spread out, in either order.
    const width = ctx.hi - ctx.lo;
    const tight = () => {
      // Whole-number bounds: _.random returns a float if either bound is one.
      const mid = _.random(ctx.lo + Math.round(width / 4), ctx.hi - Math.round(width / 4));
      const w = Math.max(3, Math.round(width / 5));
      return _.times(n, () => _.clamp(mid + _.random(-w, w), ctx.lo, ctx.hi));
    };
    const loose = () => _.times(n, () => _.random(ctx.lo, ctx.hi));
    const flip = _.random(0, 1) === 1;
    const xs = flip ? loose() : tight(), ys = flip ? tight() : loose();
    const [rx, ry] = [range(xs), range(ys)];
    if (Math.abs(rx - ry) < 4) continue;
    const [a, b] = labels(ctx);
    const winner = rx < ry ? a : b;
    return {
      instruction: ctx.what(n),
      questionParts: ['Who was more consistent?', 'Use the range.'],
      visualization: twoRows(a, b, xs, ys),
      answer: `\\text{${winner}}${NL}\\text{range ${Math.min(rx, ry)}, against ${Math.max(rx, ry)}}`,
      workingOut:
        `\\text{${a}: } ${Math.max(...xs)} - ${Math.min(...xs)} = ${rx}${NL}` +
        `\\text{${b}: } ${Math.max(...ys)} - ${Math.min(...ys)} = ${ry}`,
      metadata: { topic: 'compare-distributions', difficulty: 'foundation' },
    };
  }
}

function compareMedianIqr() {
  for (;;) {
    const ctx = _.sample(PAIR_CONTEXTS);
    const n = _.sample([7, 11]);
    const xs = _.sortBy(drawList(ctx, n)), ys = _.sortBy(drawList(ctx, n));
    const qx = quartiles(xs), qy = quartiles(ys);
    const ix = qx.q3 - qx.q1, iy = qy.q3 - qy.q1;
    // Clear differences both ways, so neither conclusion is a coin toss.
    if (Math.abs(qx.q2 - qy.q2) < 3 || Math.abs(ix - iy) < 3) continue;
    const [a, b] = labels(ctx);
    const higher = qx.q2 > qy.q2 ? a : b;
    const steadier = ix < iy ? a : b;
    return {
      instruction: ctx.what(n),
      questionParts: ['(a) Who scored higher on average?', '(b) Who was more consistent?'],
      visualization: twoRows(a, b, xs, ys),
      answer: `\\text{(a) ${higher}, by the median}${NL}\\text{(b) ${steadier}, by the IQR}`,
      workingOut: [
        `\\text{${a}: median } ${fmt(qx.q2)} \\text{, IQR } ${fmt(qx.q3)} - ${fmt(qx.q1)} = ${fmt(ix)}`,
        `\\text{${b}: median } ${fmt(qy.q2)} \\text{, IQR } ${fmt(qy.q3)} - ${fmt(qy.q1)} = ${fmt(iy)}`,
      ].join(NL),
      metadata: { topic: 'compare-distributions', difficulty: 'core' },
    };
  }
}

// One player is steady apart from one extreme score, which gives them the
// larger range. The IQR leaves that score out and shows they were the more
// consistent: the range misleads, and the question turns on seeing why.
function compareOutlier() {
  for (;;) {
    const ctx = _.sample(PAIR_CONTEXTS);
    const n = _.sample([8, 9, 10]);
    const width = ctx.hi - ctx.lo;
    const mid = _.random(ctx.lo + Math.round(width / 3), ctx.hi - Math.round(width / 3));
    const w = Math.max(2, Math.round(width / 10));
    const steady = _.times(n - 1, () => mid + _.random(-w, w));
    const extreme = _.random(0, 1) ? _.random(ctx.lo, ctx.lo + 2) : _.random(ctx.hi - 2, ctx.hi);
    const xs = _.shuffle([...steady, extreme]);
    const ys = _.times(n, () => _.random(Math.max(ctx.lo, mid - Math.round(width / 3)), Math.min(ctx.hi, mid + Math.round(width / 3))));
    const qx = quartiles(xs), qy = quartiles(ys);
    const ix = qx.q3 - qx.q1, iy = qy.q3 - qy.q1;
    const [rx, ry] = [range(xs), range(ys)];
    // The trap has to be real: the steady player has the larger range and
    // the clearly smaller IQR.
    if (!(rx > ry + 2 && iy - ix >= 3)) continue;
    // And it is that one score that does it: without it, the steady player's
    // range is no longer the larger. (Rarely, the other player's scores
    // bunch so tightly that it would be larger even then, and "one score
    // widens the range" would not be the whole story.)
    if (range(steady) > ry) continue;
    if (_.isEqual(xs, _.sortBy(xs)) || _.isEqual(ys, _.sortBy(ys))) continue;
    // The steady player (a) goes in either row.
    const [a, b] = labels(ctx);
    const top = _.random(0, 1) === 1;
    const rows = top ? twoRows(a, b, xs, ys) : twoRows(b, a, ys, xs);
    const lines = [
      `\\text{${a}: range } ${rx} \\text{, IQR } ${fmt(qx.q3)} - ${fmt(qx.q1)} = ${fmt(ix)}`,
      `\\text{${b}: range } ${ry} \\text{, IQR } ${fmt(qy.q3)} - ${fmt(qy.q1)} = ${fmt(iy)}`,
    ];
    return {
      instruction: ctx.what(n),
      questionParts: ['Who was more consistent?', 'Explain which measure you used.'],
      answer: `\\text{${a}: IQR ${fmt(ix)}, against ${fmt(iy)}}${NL}\\text{one score of ${extreme} widens the range}`,
      workingOut: (top ? lines : [lines[1], lines[0]]).join(NL),
      visualization: rows,
      metadata: { topic: 'compare-distributions', difficulty: 'stretch' },
    };
  }
}
