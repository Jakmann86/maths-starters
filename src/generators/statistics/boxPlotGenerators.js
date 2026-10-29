// src/generators/statistics/boxPlotGenerators.js
//
// Box plots, in the Spread topic beside quartiles-iqr and
// compare-distributions. Two skills:
//
//   five-number-summary
//     foundation  an ordered list whose quartiles are data values (n = 7, 11, 15)
//     core        an unordered list (n = 8, 9, 10, 12)
//     stretch     a discrete frequency table: find where each value falls
//                 by counting through the frequencies
//     At Foundation and Core the box plot is drawn on reveal, as the answer.
//     At Stretch the table holds the figure slot, so that band asks for the
//     summary only.
//
//   box-plot-reading
//     foundation  read the median, the range or the IQR off one box plot
//     core        use the quartiles as proportions: of 80 students, about
//                 how many scored more than Q3?
//     stretch     two box plots on one scale: who did better on average, and
//                 who was more consistent. The plot with the smaller IQR
//                 always has the larger range, so the range is a trap.
//
// Quartiles by Haese's method, shared with spreadGenerators. The reading
// skill draws its five values straight onto gridlines, so every value can be
// read exactly; there is no data list behind them to disagree with.

import _ from 'lodash';
import { quartiles, TABLE_CONTEXTS, PLAYERS } from './spreadGenerators';

const NL = '\n';

const fmt = (x) => String(Number(x.toFixed(2)));
const list = (xs) => xs.join(', ');
const summaryOf = (xs) => {
  const { sorted, q1, q2, q3 } = quartiles(xs);
  return { min: sorted[0], q1, q2, q3, max: sorted.at(-1) };
};
const FIVE = ['min', 'q1', 'q2', 'q3', 'max'];
const distinct = (p) => new Set(FIVE.map((k) => p[k])).size === 5;

const summaryAnswer = (p) =>
  `\\text{min} = ${fmt(p.min)},\\ \\text{max} = ${fmt(p.max)}${NL}` +
  `Q_1 = ${fmt(p.q1)},\\ Q_2 = ${fmt(p.q2)},\\ Q_3 = ${fmt(p.q3)}`;

/* ------------------------------------------------- five-number-summary */

// A list of whole numbers, what it is, and the scale its box plot is drawn
// on. Every value from lo to hi fits the scale.
export const SUMMARY_CONTEXTS = [
  { of: (n) => `the marks of ${n} students in a test out of 40`, lo: 8, hi: 40, axis: { min: 0, max: 40, step: 1, every: 5, title: 'Mark' } },
  { of: (n) => `the times, in minutes, that ${n} students took to get to school`, lo: 5, hi: 45, axis: { min: 0, max: 50, step: 2, every: 5, title: 'Time (minutes)' } },
  { of: (n) => `the ages of ${n} people at a party`, lo: 11, hi: 48, axis: { min: 10, max: 50, step: 2, every: 5, title: 'Age (years)' } },
  { of: (n) => `the numbers of books read by ${n} students last year`, lo: 1, hi: 24, axis: { min: 0, max: 25, step: 1, every: 5, title: 'Books' } },
  { of: (n) => `the heights, in cm, of ${n} seedlings`, lo: 4, hi: 30, axis: { min: 0, max: 30, step: 1, every: 5, title: 'Height (cm)' } },
];

export const generateFiveNumberSummary = (options = {}) => {
  const { difficulty = 'core' } = options;
  if (difficulty === 'stretch') return summaryFromTable();
  return summaryFromList(difficulty);
};

function summaryFromList(difficulty) {
  for (;;) {
    const ctx = _.sample(SUMMARY_CONTEXTS);
    const n = difficulty === 'foundation' ? _.sample([7, 11, 15]) : _.sample([8, 9, 10, 12]);
    const xs = _.times(n, () => _.random(ctx.lo, ctx.hi));
    const { sorted, q2, lower, upper } = quartiles(xs);
    const p = summaryOf(xs);
    // Five different values, so the plot has a box, a median inside it and
    // two whiskers: a collapsed part reads as a drawing mistake.
    if (!distinct(p)) continue;
    // Unordered on the page: already-sorted by chance would give away a step.
    if (difficulty === 'core' && _.isEqual(xs, sorted)) continue;
    const odd = n % 2 === 1;
    return {
      instruction: `Find the five-number summary of ${ctx.of(n)}. Draw a box plot.`,
      questionMath: list(difficulty === 'foundation' ? sorted : xs),
      answer: summaryAnswer(p),
      workingOut: [
        ...(difficulty === 'foundation' ? [] : [`\\text{ordered: } ${list(sorted)}`]),
        `\\text{min} = ${p.min},\\ \\text{max} = ${p.max}`,
        `\\text{median} = ${fmt(q2)}${odd ? ' \\text{, left out of both halves}' : ''}`,
        `\\text{lower half: } ${list(lower)} \\text{, so } Q_1 = ${fmt(p.q1)}`,
        `\\text{upper half: } ${list(upper)} \\text{, so } Q_3 = ${fmt(p.q3)}`,
      ].join(NL),
      visualization: { type: 'box-plot', axis: ctx.axis, plots: [p], reveal: true },
      metadata: { topic: 'five-number-summary', difficulty },
    };
  }
}

// Haese 13E: the data are a frequency table, so each value is located by
// counting through the frequencies. The scale runs one past the last value.
function summaryFromTable() {
  for (;;) {
    const ctx = _.sample(TABLE_CONTEXTS);
    const fs = ctx.xs.map(() => _.random(1, 9));
    const n = _.sum(fs);
    if (n < 15 || n > 35) continue;
    const data = ctx.xs.flatMap((x, i) => _.times(fs[i], () => x));
    const p = summaryOf(data);
    // Every value appears, so min and max are the ends of the table; the
    // three quartiles still have to differ for a box with a median inside.
    if (!(p.q1 < p.q2 && p.q2 < p.q3)) continue;
    const cfs = fs.reduce((acc, f) => [...acc, (acc.at(-1) ?? 0) + f], []);
    const half = Math.floor(n / 2);
    const q1pos = (half + 1) / 2;
    const q2pos = (n + 1) / 2;
    const q3pos = (n % 2 ? half + 1 : half) + (half + 1) / 2;
    const place = (k) => `${k}${['th', 'st', 'nd', 'rd'][k % 10 > 3 || [11, 12, 13].includes(k % 100) ? 0 : k % 10]}`;
    const at = (x) => (Number.isInteger(x)
      ? `\\text{the ${place(x)} value}`
      : `\\text{the ${place(Math.floor(x))} and ${place(Math.ceil(x))} values}`);
    return {
      instruction: `The table shows ${ctx.shows}. Find the five-number summary.`,
      answer: summaryAnswer(p),
      workingOut: [
        `n = ${n} \\text{, cumulative: } ${cfs.join(', ')}`,
        `Q_1 \\text{: } ${at(q1pos)} \\text{, so } Q_1 = ${fmt(p.q1)}`,
        `Q_2 \\text{: } ${at(q2pos)} \\text{, so } Q_2 = ${fmt(p.q2)}`,
        `Q_3 \\text{: } ${at(q3pos)} \\text{, so } Q_3 = ${fmt(p.q3)}`,
      ].join(NL),
      visualization: {
        type: 'table',
        header: 'column',
        rows: [[ctx.head, ...ctx.xs.map(String)], ['Frequency', ...fs.map(String)]],
        big: true,
      },
      metadata: { topic: 'five-number-summary', difficulty: 'stretch' },
    };
  }
}

/* ---------------------------------------------------- box-plot-reading */

// One box plot of a whole group. `what(N)` names the group; `count` is its
// noun; `more`/`less` finish "about how many ... ?". The scale's step is the
// grid every value sits on.
export const READING_CONTEXTS = [
  {
    what: (N) => `the marks of ${N ?? 'some'} students in a test`, count: 'students',
    more: (v) => `scored more than ${v} marks`, less: (v) => `scored fewer than ${v} marks`,
    axis: { min: 0, max: 60, step: 2, every: 5, title: 'Mark' },
  },
  {
    what: (N) => `the times, in minutes, that ${N ?? 'some'} runners took to finish a race`, count: 'runners',
    more: (v) => `took longer than ${v} minutes`, less: (v) => `took less than ${v} minutes`,
    axis: { min: 20, max: 60, step: 1, every: 5, title: 'Time (minutes)' },
  },
  {
    what: (N) => `the heights, in cm, of ${N ?? 'some'} sunflower seedlings`, count: 'seedlings',
    more: (v) => `were taller than ${v} cm`, less: (v) => `were shorter than ${v} cm`,
    axis: { min: 0, max: 30, step: 1, every: 5, title: 'Height (cm)' },
  },
  {
    what: (N) => `the ages of ${N ?? 'the'} people at a concert`, count: 'people',
    more: (v) => `were older than ${v}`, less: (v) => `were younger than ${v}`,
    axis: { min: 10, max: 70, step: 2, every: 5, title: 'Age (years)' },
  },
];

// Five gridline values in order, each part at least two steps long and not
// all four parts the same length.
function drawPlot(axis, lo = axis.min, hi = axis.max) {
  for (;;) {
    const a = Math.round((lo - axis.min) / axis.step);
    const b = Math.round((hi - axis.min) / axis.step);
    const idx = _.sortBy(_.sampleSize(_.range(a, b + 1), 5));
    const gaps = idx.slice(1).map((v, i) => v - idx[i]);
    if (gaps.some((g) => g < 2) || new Set(gaps).size === 1) continue;
    const [min, q1, q2, q3, max] = idx.map((i) => axis.min + i * axis.step);
    return { min, q1, q2, q3, max };
  }
}

export const generateBoxPlotReading = (options = {}) => {
  const { difficulty = 'core' } = options;
  if (difficulty === 'foundation') return readOne();
  if (difficulty === 'stretch') return readTwo();
  return readProportion();
};

const plotFig = (axis, plots, marks) => ({ type: 'box-plot', axis, plots, marks, big: true });

function readOne() {
  const ctx = _.sample(READING_CONTEXTS);
  const p = drawPlot(ctx.axis);
  const ask = _.sample(['median', 'range', 'iqr']);
  const instruction = `The box plot shows ${ctx.what()}.`;
  if (ask === 'median') {
    return {
      instruction: `${instruction} Find the median.`,
      answer: fmt(p.q2),
      workingOut: `\\text{the line inside the box: median} = ${fmt(p.q2)}`,
      visualization: plotFig(ctx.axis, [p], [{ plot: 0, value: p.q2 }]),
      metadata: { topic: 'box-plot-reading', difficulty: 'foundation' },
    };
  }
  if (ask === 'range') {
    return {
      instruction: `${instruction} Find the range.`,
      answer: fmt(p.max - p.min),
      workingOut: `\\text{the ends of the whiskers: } ${fmt(p.max)} - ${fmt(p.min)} = ${fmt(p.max - p.min)}`,
      visualization: plotFig(ctx.axis, [p], [{ plot: 0, value: p.min }, { plot: 0, value: p.max }]),
      metadata: { topic: 'box-plot-reading', difficulty: 'foundation' },
    };
  }
  return {
    instruction: `${instruction} Find the interquartile range.`,
    answer: fmt(p.q3 - p.q1),
    workingOut: `\\text{the ends of the box: } ${fmt(p.q3)} - ${fmt(p.q1)} = ${fmt(p.q3 - p.q1)}`,
    visualization: plotFig(ctx.axis, [p], [{ plot: 0, value: p.q1 }, { plot: 0, value: p.q3 }]),
    metadata: { topic: 'box-plot-reading', difficulty: 'foundation' },
  };
}

// Each quartile cuts off a quarter of the group. `share` is the fraction on
// the asked side, in quarters.
function readProportion() {
  const ctx = _.sample(READING_CONTEXTS);
  const p = drawPlot(ctx.axis);
  const N = _.sample([40, 60, 80, 120, 200]);
  const [key, side] = _.sample([['q1', 'more'], ['q1', 'less'], ['q2', 'more'], ['q2', 'less'], ['q3', 'more'], ['q3', 'less']]);
  const below = { q1: 1, q2: 2, q3: 3 }[key];
  const quarters = side === 'less' ? below : 4 - below;
  const v = p[key];
  const name = { q1: 'Q_1', q2: '\\text{the median}', q3: 'Q_3' }[key];
  const frac = quarters === 2 ? '\\tfrac{1}{2}' : `\\tfrac{${quarters}}{4}`;
  return {
    instruction: `The box plot shows ${ctx.what(N)}. About how many ${ctx.count} ${ctx[side](fmt(v))}?`,
    answer: String((N * quarters) / 4),
    workingOut: [
      `${fmt(v)} \\text{ is } ${name} \\text{, so } ${frac} \\text{ of the ${ctx.count} ${side === 'more' ? 'are above' : 'are below'} it}`,
      `${frac} \\times ${N} = ${(N * quarters) / 4}`,
    ].join(NL),
    visualization: plotFig(ctx.axis, [p], [{ plot: 0, value: v }]),
    metadata: { topic: 'box-plot-reading', difficulty: 'core' },
  };
}

// Two named groups on one scale. `better` is which way a better average
// lies: more points, or a lower time.
export const PAIR_PLOT_CONTEXTS = [
  {
    what: 'the points scored by two basketball players in each game of a season',
    names: () => _.sampleSize(PLAYERS, 2), who: 'Who', ask: 'scored more points on average', better: 'higher',
    axis: { min: 0, max: 40, step: 1, every: 5, title: 'Points' },
  },
  {
    what: 'the marks of two classes in the same test',
    names: () => ['Class A', 'Class B'], who: 'Which class', ask: 'did better on average', better: 'higher',
    axis: { min: 0, max: 60, step: 2, every: 5, title: 'Mark' },
  },
  {
    what: 'the times, in minutes, two runners took in each race of a season',
    names: () => _.sampleSize(PLAYERS, 2), who: 'Who', ask: 'was faster on average', better: 'lower',
    axis: { min: 20, max: 50, step: 1, every: 5, title: 'Time (minutes)' },
  },
];

function readTwo() {
  for (;;) {
    const ctx = _.sample(PAIR_PLOT_CONTEXTS);
    const pa = drawPlot(ctx.axis), pb = drawPlot(ctx.axis);
    const st = ctx.axis.step;
    const iqr = (p) => p.q3 - p.q1;
    const rng = (p) => p.max - p.min;
    // Clear differences, so neither conclusion is a coin toss: the medians
    // three steps apart, the IQRs too. And the trap: the steadier plot by
    // the IQR has the larger range.
    if (Math.abs(pa.q2 - pb.q2) < 3 * st || Math.abs(iqr(pa) - iqr(pb)) < 3 * st) continue;
    const [steady, loose] = iqr(pa) < iqr(pb) ? [pa, pb] : [pb, pa];
    if (rng(steady) < rng(loose) + 2 * st) continue;
    const [a, b] = ctx.names();
    const by = { [a]: pa, [b]: pb };
    const best = (ctx.better === 'higher') === (pa.q2 > pb.q2) ? a : b;
    const steadier = steady === pa ? a : b;
    const other = (x) => (x === a ? b : a);
    return {
      instruction: `The box plots show ${ctx.what}.`,
      questionParts: [`(a) ${ctx.who} ${ctx.ask}?`, `(b) ${ctx.who} was more consistent?`],
      answer:
        `\\text{(a) ${best}: median ${fmt(by[best].q2)}, against ${fmt(by[other(best)].q2)}}${NL}` +
        `\\text{(b) ${steadier}: IQR ${fmt(iqr(by[steadier]))}, against ${fmt(iqr(by[other(steadier)]))}}`,
      workingOut: [a, b].map((x) => {
        const p = by[x];
        return `\\text{${x}: median } ${fmt(p.q2)} \\text{, IQR } ${fmt(p.q3)} - ${fmt(p.q1)} = ${fmt(iqr(p))} \\text{, range } ${fmt(rng(p))}`;
      }).join(NL),
      // No reading lines: one from the top plot would cut through the other.
      visualization: plotFig(ctx.axis, [{ name: a, ...pa }, { name: b, ...pb }]),
      metadata: { topic: 'box-plot-reading', difficulty: 'stretch' },
    };
  }
}
