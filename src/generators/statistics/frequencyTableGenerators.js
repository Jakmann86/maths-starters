// src/generators/statistics/frequencyTableGenerators.js
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
