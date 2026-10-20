// src/generators/statistics/frequencyTableGenerators.js
//
// Three skills built on frequency tables:
//   frequency-table-reading     Haese 13B (below)
//   cumulative-frequency-table  Haese 17C, the table without the graph
//   table-averages              mean, mode and median as three parts
//
// Haese 13B: reading a discrete frequency table that has a story behind it —
// goals in a season, siblings in a class. The step every band turns on is
// telling the value column from the frequency column.
//
//   foundation  read and add frequencies: how many were asked, or how many
//               meet a condition ("more than 2 siblings")
//   core        the total of the variable itself: sum of value x frequency
//               ("how many goals in total"), where the 0 row counts nothing
//   stretch     the same total, but one frequency is withheld and the number
//               asked is given in words, so it has to be recovered first

import _ from 'lodash';
import { dp1 } from '../shared';

const NL = '\n';

/* ---------------------------------------------------------------- contexts
 *
 * `lo`/`hi` bound the values the variable can take; a table is a run of
 * consecutive values inside that. The question builders are per context
 * because the English is: "In how many matches did the team score more than
 * 2 goals?" and "How many students have more than 2 siblings?" share nothing
 * but the number. `cond` phrases always take a k of 2 or more, so the noun
 * after them is plural.
 */
export const DISCRETE = [
  {
    col: 'Number of siblings',
    shows: 'how many siblings each student in a class has',
    lo: 0, hi: 5, who: 'students', what: 'siblings',
    count: (n) => `There are ${n} students in the class`,
    countQ: 'How many students are in the class?',
    condQ: (p) => `How many students have ${p} siblings?`,
    totalQ: 'How many siblings do the students have in total?',
    meanQ: 'Work out the mean number of siblings per student',
  },
  {
    col: 'Goals scored',
    shows: 'the number of goals a team scored in each match of a season',
    lo: 0, hi: 5, who: 'matches', what: 'goals',
    count: (n) => `The team played ${n} matches`,
    countQ: 'How many matches did the team play?',
    condQ: (p) => `In how many matches did the team score ${p} goals?`,
    totalQ: 'How many goals did the team score in total?',
    meanQ: 'Work out the mean number of goals per match',
  },
  {
    col: 'Number of pets',
    shows: 'the number of pets in each house on a street',
    lo: 0, hi: 4, who: 'houses', what: 'pets',
    count: (n) => `There are ${n} houses on the street`,
    countQ: 'How many houses are on the street?',
    condQ: (p) => `How many houses have ${p} pets?`,
    totalQ: 'How many pets are there on the street altogether?',
    meanQ: 'Work out the mean number of pets per house',
  },
  {
    col: 'People in car',
    shows: 'the number of people in each car that passed a school',
    lo: 1, hi: 5, who: 'cars', what: 'people',
    count: (n) => `${n} cars passed the school`,
    countQ: 'How many cars passed the school?',
    condQ: (p) => `How many cars had ${p} people in them?`,
    totalQ: 'How many people were in the cars altogether?',
    meanQ: 'Work out the mean number of people per car',
  },
  {
    col: 'Books read',
    shows: 'the number of books each student read over the summer',
    lo: 0, hi: 6, who: 'students', what: 'books',
    count: (n) => `${n} students were asked`,
    countQ: 'How many students were asked?',
    condQ: (p) => `How many students read ${p} books?`,
    totalQ: 'How many books did the students read altogether?',
    meanQ: 'Work out the mean number of books read per student',
  },
  {
    col: 'Days absent',
    shows: 'the number of days each student was absent last term',
    lo: 0, hi: 5, who: 'students', what: 'days',
    count: (n) => `There are ${n} students in the class`,
    countQ: 'How many students are in the class?',
    condQ: (p) => `How many students were absent for ${p} days?`,
    totalQ: 'How many days of school were missed in total?',
    meanQ: 'Work out the mean number of days absent per student',
  },
  {
    col: 'Eggs in nest',
    shows: 'the number of eggs in each nest a bird watcher found',
    lo: 1, hi: 6, who: 'nests', what: 'eggs',
    count: (n) => `The bird watcher found ${n} nests`,
    countQ: 'How many nests did the bird watcher find?',
    condQ: (p) => `How many nests had ${p} eggs?`,
    totalQ: 'How many eggs were there altogether?',
    meanQ: 'Work out the mean number of eggs per nest',
  },
  {
    col: 'School lunches',
    shows: 'the number of school lunches each student had last week',
    lo: 0, hi: 5, who: 'students', what: 'lunches',
    count: (n) => `${n} students were asked`,
    countQ: 'How many students were asked?',
    condQ: (p) => `How many students had ${p} school lunches?`,
    totalQ: 'How many school lunches were eaten in total?',
    meanQ: 'Work out the mean number of school lunches per student',
  },
];

/** A context and a run of 4-6 consecutive values inside its range, each with
 *  a frequency of 1-12. No zero frequencies: an empty row is a reading trap
 *  this skill is not testing. */
export const discreteData = (context = _.sample(DISCRETE), maxF = 12) => {
  const span = context.hi - context.lo + 1;
  const k = _.random(Math.min(4, span), Math.min(6, span));
  const start = _.random(context.lo, context.hi - k + 1);
  const xs = _.times(k, (i) => start + i);
  const fs = xs.map(() => _.random(1, maxF));
  return { context, xs, fs };
};

const tableFig = (context, xs, shownFs) => ({
  type: 'table',
  // Vertical, as textbooks set it: "Number of siblings" is too wide a
  // header to sit at the start of a horizontal row of values.
  header: 'row',
  rows: [[context.col, 'Frequency'], ...xs.map((x, i) => [String(x), shownFs[i]])],
  big: true,
});

const unitsOf = (word) => `\\text{${word}}`;

/* --------------------------------------------------------------- the skill */

export const generateFrequencyTableReading = (options = {}) => {
  const { difficulty = 'core' } = options;
  if (difficulty === 'foundation') return foundationBand();
  if (difficulty === 'stretch') return stretchBand();
  return coreBand();
};

const CONDITIONS = [
  { phrase: (k) => `more than ${k}`, test: (x, k) => x > k },
  { phrase: (k) => `fewer than ${k}`, test: (x, k) => x < k },
  { phrase: (k) => `at least ${k}`, test: (x, k) => x >= k },
];

function foundationBand() {
  const { context, xs, fs } = discreteData();
  const total = _.sum(fs);

  if (_.random(0, 1) === 0) {
    return {
      instruction: `The table shows ${context.shows}. ${context.countQ}`,
      answer: String(total),
      answerUnits: unitsOf(context.who),
      workingOut: `${fs.join(' + ')} = ${total}`,
      visualization: tableFig(context, xs, fs.map(String)),
      metadata: { topic: 'frequency-table-reading', difficulty: 'foundation' },
    };
  }

  // A condition picking out at least two rows but not all of them: one row is
  // a plain look-up, every row is the question above.
  for (;;) {
    const cond = _.sample(CONDITIONS);
    const k = _.random(Math.max(2, xs[0]), xs[xs.length - 1]);
    const hit = xs.map((x) => cond.test(x, k));
    const m = hit.filter(Boolean).length;
    if (m < 2 || m === xs.length) continue;
    const picked = fs.filter((_f, i) => hit[i]);
    const sum = _.sum(picked);
    return {
      instruction: `The table shows ${context.shows}. ${context.condQ(cond.phrase(k))}`,
      answer: String(sum),
      answerUnits: unitsOf(context.who),
      workingOut: `${picked.join(' + ')} = ${sum}`,
      visualization: tableFig(context, xs, fs.map(String)),
      metadata: { topic: 'frequency-table-reading', difficulty: 'foundation' },
    };
  }
}

const fxLine = (xs, fs) => xs.map((x, i) => `${x} \\times ${fs[i]}`).join(' + ');

function coreBand() {
  const { context, xs, fs } = discreteData();
  const total = _.sum(xs.map((x, i) => x * fs[i]));
  return {
    instruction: `The table shows ${context.shows}. ${context.totalQ}`,
    answer: String(total),
    answerUnits: unitsOf(context.what),
    workingOut: `${fxLine(xs, fs)}${NL}= ${total}`,
    visualization: tableFig(context, xs, fs.map(String)),
    metadata: { topic: 'frequency-table-reading', difficulty: 'core' },
  };
}

function stretchBand() {
  const { context, xs, fs } = discreteData();
  const n = _.sum(fs);
  // Never the 0 row: its frequency adds nothing to the total, so withholding
  // it would make the first step pointless.
  const hide = _.sample(xs.map((_x, i) => i).filter((i) => xs[i] !== 0));
  const shown = fs.map((f, i) => (i === hide ? '?' : String(f)));
  const known = fs.filter((_f, i) => i !== hide);
  const total = _.sum(xs.map((x, i) => x * fs[i]));
  return {
    instruction: `The table shows ${context.shows}. ${context.count(n)}. ${context.totalQ}`,
    answer: String(total),
    answerUnits: unitsOf(context.what),
    workingOut: [
      `? = ${n} - (${known.join(' + ')}) = ${fs[hide]}`,
      fxLine(xs, fs),
      `= ${total}`,
    ].join(NL),
    visualization: tableFig(context, xs, shown),
    metadata: { topic: 'frequency-table-reading', difficulty: 'stretch' },
  };
}

/* ------------------------------------------------------- continuous data
 *
 * Grouped tables with a measured variable behind them, for the two skills
 * below. Each context names its variable's letter, so a class reads
 * "10 ≤ t < 20" rather than an anonymous x. Widths are even, so every
 * midpoint is whole. A class list starts at the first multiple of its width
 * at or above one of the context's `starts`, so 6-wide classes run 12, 18,
 * 24 and never 20, 26, 32.
 * `shows(n)` takes the number surveyed, or nothing when the table gives it.
 */
const CONTINUOUS = [
  {
    col: 'Time (t min)', v: 't', widths: [4, 6, 10], starts: [0, 10, 20],
    shows: (n) => `the time ${n ? `${n} ` : ''}students took to finish a puzzle`,
  },
  {
    col: 'Distance (d m)', v: 'd', widths: [4, 6, 10], starts: [0, 10, 20],
    shows: (n) => `how far ${n ? `${n} ` : ''}students threw a ball`,
  },
  {
    col: 'Mass (m kg)', v: 'm', widths: [2, 4], starts: [0, 4, 8],
    shows: (n) => `the masses of ${n ? `${n} ` : ''}parcels at a post office`,
  },
  {
    col: 'Speed (v km/h)', v: 'v', widths: [10], starts: [10, 20],
    shows: (n) => `the speeds of ${n ? `${n} ` : ''}cars passing a school`,
  },
  {
    col: 'Height (h cm)', v: 'h', widths: [4, 6, 10], starts: [0, 10, 20],
    shows: (n) => `the heights of ${n ? `${n} ` : ''}seedlings in a greenhouse`,
  },
];

/** A context and 4-5 contiguous equal-width classes, each with a frequency
 *  of 2-15. */
const continuousData = (context = _.sample(CONTINUOUS)) => {
  const k = _.random(4, 5);
  const width = _.sample(context.widths);
  const start = Math.ceil(_.sample(context.starts) / width) * width;
  const lows = _.times(k, (i) => start + i * width);
  const highs = lows.map((lo) => lo + width);
  const fs = _.times(k, () => _.random(2, 15));
  return { context, lows, highs, mids: lows.map((lo) => lo + width / 2), fs };
};

const classOf = (v, lo, hi) => `${lo} ≤ ${v} < ${hi}`;           // figure: literal glyph
const classTex = (v, lo, hi) => `${lo} \\le ${v} < ${hi}`;       // answer: through the renderer

const runningTotals = (fs) => {
  let running = 0;
  return fs.map((f) => { running += f; return running; });
};


/* ---------------------------------------------- cumulative frequency tables
 *
 * Haese 17C, the table only — no graph. The cumulative column is left blank
 * and fills in on reveal, as the data-types table does.
 *
 *   foundation  a discrete table: keep a running total of the frequencies
 *   core        a grouped continuous table: the same running total, read
 *               against class intervals
 *   stretch     both columns have gaps. Each row hides one cell or none, so
 *               working down the table always closes: a missing cumulative
 *               frequency is added on, a missing frequency is differenced
 *               back from two cumulative ones
 * ---------------------------------------------------------------------- */

const CF = 'Cumulative frequency';

export const generateCumulativeFrequencyTable = (options = {}) => {
  const { difficulty = 'core' } = options;
  if (difficulty === 'foundation') return cumulativeDiscrete();
  if (difficulty === 'stretch') return cumulativeGaps();
  return cumulativeGrouped();
};

const cumulativeWorking = (fs, cfs) => cfs
  .map((c, i) => (i === 0 ? `${c}` : `${cfs[i - 1]} + ${fs[i]} = ${c}`))
  .join(NL);

function cumulativeDiscrete() {
  const { context, xs, fs } = discreteData();
  const cfs = runningTotals(fs);
  return {
    instruction: `The table shows ${context.shows}. Complete the cumulative frequency column`,
    answer: `\\text{cumulative: } ${cfs.join(', ')}`,
    workingOut: cumulativeWorking(fs, cfs),
    visualization: {
      type: 'table',
      header: 'row',
      big: true,
      rows: [[context.col, 'Frequency', CF], ...xs.map((x, i) => [String(x), String(fs[i]), ''])],
      solution: [['', '', ''], ...cfs.map((c) => ['', '', String(c)])],
    },
    metadata: { topic: 'cumulative-frequency-table', difficulty: 'foundation' },
  };
}

function cumulativeGrouped() {
  const { context, lows, highs, fs } = continuousData();
  const cfs = runningTotals(fs);
  return {
    instruction: `The table shows ${context.shows()}. Complete the cumulative frequency column`,
    answer: `\\text{cumulative: } ${cfs.join(', ')}`,
    workingOut: cumulativeWorking(fs, cfs),
    visualization: {
      type: 'table',
      header: 'row',
      big: true,
      rows: [[context.col, 'Frequency', CF],
        ...lows.map((lo, i) => [classOf(context.v, lo, highs[i]), String(fs[i]), ''])],
      solution: [['', '', ''], ...cfs.map((c) => ['', '', String(c)])],
    },
    metadata: { topic: 'cumulative-frequency-table', difficulty: 'core' },
  };
}

function cumulativeGaps() {
  for (;;) {
    const { context, lows, highs, fs } = continuousData();
    const k = fs.length;
    const cfs = runningTotals(fs);
    // k - 1 rows lose one cell each; one row is left whole.
    const whole = _.random(0, k - 1);
    const hide = _.times(k, (i) => (i === whole ? null : _.sample(['f', 'cf'])));
    // At least one frequency differenced back from two cumulative ones — a
    // gap in the first row is only a copy — and at least one running total.
    if (!hide.some((h, i) => h === 'f' && i > 0) || !hide.includes('cf')) continue;

    const working = hide.map((h, i) => {
      const prev = i === 0 ? null : cfs[i - 1];
      if (h === 'f') {
        return i === 0
          ? `\\text{frequency} = ${fs[0]}`
          : `\\text{frequency} = ${cfs[i]} - ${prev} = ${fs[i]}`;
      }
      if (h === 'cf') {
        return i === 0
          ? `\\text{cumulative} = ${cfs[0]}`
          : `\\text{cumulative} = ${prev} + ${fs[i]} = ${cfs[i]}`;
      }
      return null;
    }).filter(Boolean);

    return {
      instruction: `The table shows ${context.shows()}. Complete the table`,
      answer: `\\text{frequencies: } ${fs.join(', ')}${NL}\\text{cumulative: } ${cfs.join(', ')}`,
      workingOut: working.join(NL),
      visualization: {
        type: 'table',
        header: 'row',
        big: true,
        rows: [[context.col, 'Frequency', CF], ...lows.map((lo, i) => [
          classOf(context.v, lo, highs[i]),
          hide[i] === 'f' ? '' : String(fs[i]),
          hide[i] === 'cf' ? '' : String(cfs[i]),
        ])],
        solution: [['', '', ''], ...fs.map((f, i) => [
          '',
          hide[i] === 'f' ? String(f) : '',
          hide[i] === 'cf' ? String(cfs[i]) : '',
        ])],
      },
      metadata: { topic: 'cumulative-frequency-table', difficulty: 'stretch' },
    };
  }
}

/* --------------------------------------- mean, mode and median from a table
 *
 * Three parts from one table, as averages-from-list's Core asks four from a
 * list. The three answers are kept distinct, so one written down for another
 * is visibly wrong.
 *
 *   foundation  a discrete table: the mean (whole), the mode, the median
 *   core        a grouped continuous table: an estimate of the mean, the
 *               modal class, the class containing the median
 *   stretch     the same, with one frequency withheld and the number
 *               surveyed given in words, so it is recovered first
 *
 * Unequal class widths are deliberately not the Stretch step: with them the
 * tallest frequency need not be the modal class (frequency density), which
 * is the misconception modal-class leaves out too.
 * ---------------------------------------------------------------------- */

const THREE = 'Find (a) the mean (b) the mode (c) the median';
const THREE_GROUPED = 'Find (a) an estimate of the mean (b) the modal class (c) the class containing the median';

export const generateTableAverages = (options = {}) => {
  const { difficulty = 'core' } = options;
  if (difficulty === 'foundation') return threeFromDiscrete();
  return threeFromGrouped(difficulty);
};

function threeFromDiscrete() {
  for (;;) {
    const { context, xs, fs } = discreteData();
    const n = _.sum(fs);
    const sumFX = _.sum(xs.map((x, i) => x * fs[i]));
    if (sumFX % n !== 0) continue;
    const peak = Math.max(...fs);
    if (fs.filter((f) => f === peak).length !== 1) continue;
    const mode = xs[fs.indexOf(peak)];
    const cfs = runningTotals(fs);
    // The (n+1)/2 th value. For an even n the two middle values must share a
    // row, or the median is a half and the band becomes Core's.
    const lo = cfs.findIndex((c) => c >= Math.floor((n + 1) / 2));
    const hi = cfs.findIndex((c) => c >= Math.ceil((n + 1) / 2));
    if (lo !== hi) continue;
    const med = xs[lo];
    const mean = sumFX / n;
    if (new Set([mean, mode, med]).size !== 3) continue;

    return {
      instruction: `The table shows ${context.shows}. ${THREE}`,
      answer: [
        `\\text{(a) mean} = ${mean}`,
        `\\text{(b) mode} = ${mode}`,
        `\\text{(c) median} = ${med}`,
      ].join(NL),
      workingOut: [
        `\\text{sum of } fx = ${fxLine(xs, fs)} = ${sumFX}`,
        `\\text{(a) mean} = \\frac{${sumFX}}{${n}} = ${mean}`,
        `\\text{(b) the largest frequency is } ${peak}, \\text{ so mode} = ${mode}`,
        `\\text{(c) } \\frac{n + 1}{2} = ${dp1((n + 1) * 5)}, \\text{ cumulative: } ${cfs.join(', ')}`,
        `\\text{median} = ${med}`,
      ].join(NL),
      visualization: tableFig(context, xs, fs.map(String)),
      metadata: { topic: 'table-averages', difficulty: 'foundation' },
    };
  }
}

function threeFromGrouped(difficulty) {
  for (;;) {
    const { context, lows, highs, mids, fs } = continuousData();
    const n = _.sum(fs);
    const sumFX = _.sum(mids.map((m, i) => m * fs[i]));
    // The estimate is exact to one decimal place.
    if ((sumFX * 10) % n !== 0) continue;
    const peak = Math.max(...fs);
    if (fs.filter((f) => f === peak).length !== 1) continue;
    const modeIdx = fs.indexOf(peak);
    const cfs = runningTotals(fs);
    // The class holding the (n+1)/2 th value, kept a value clear of a class
    // boundary as modal-class's Core does.
    const pos = (n + 1) / 2;
    const medIdx = cfs.findIndex((c) => c >= pos);
    if (medIdx > 0 && cfs[medIdx - 1] === Math.floor(pos)) continue;
    if (medIdx === modeIdx) continue;

    const v = context.v;
    const mean = dp1((sumFX * 10) / n);
    const stretch = difficulty === 'stretch';
    // Stretch withholds any frequency: every row's frequency feeds all three
    // parts, so recovering it is never a wasted step.
    const hide = stretch ? _.random(0, fs.length - 1) : null;
    const shownFs = fs.map((f, i) => (i === hide ? '?' : String(f)));
    const known = fs.filter((_f, i) => i !== hide);

    return {
      instruction: `The table shows ${context.shows(stretch ? n : null)}. ${THREE_GROUPED}`,
      answer: [
        `\\text{(a) estimated mean} = ${mean}`,
        `\\text{(b) modal class: } ${classTex(v, lows[modeIdx], highs[modeIdx])}`,
        `\\text{(c) median class: } ${classTex(v, lows[medIdx], highs[medIdx])}`,
      ].join(NL),
      workingOut: [
        ...(stretch ? [`? = ${n} - (${known.join(' + ')}) = ${fs[hide]}`] : []),
        `\\text{midpoints: } ${mids.join(', ')}`,
        `\\text{(a) sum of } fx = ${sumFX}, \\text{ mean} = \\frac{${sumFX}}{${n}} = ${mean}`,
        `\\text{(b) the largest frequency is } ${peak}`,
        `\\text{(c) } \\frac{n + 1}{2} = ${dp1((n + 1) * 5)}, \\text{ cumulative: } ${cfs.join(', ')}`,
      ].join(NL),
      visualization: {
        type: 'table',
        header: 'row',
        big: true,
        rows: [[context.col, 'Frequency'],
          ...lows.map((lo, i) => [classOf(v, lo, highs[i]), shownFs[i]])],
      },
      metadata: { topic: 'table-averages', difficulty },
    };
  }
}
