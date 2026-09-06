// src/generators/statistics/averagesGenerators.js
//
// Haese Chapter 13 (C-F) and 17A: averages from a list, from a frequency
// table, and the estimated mean of grouped data.

import _ from 'lodash';

const NL = '\n';
const showList = (xs) => xs.join(',\\ ');

// Haese p283: the median is the (n+1)/2 th ordered value, so for an even n it
// is the average of the two middle values.
const median = (sorted) => {
  const n = sorted.length;
  const mid = (n + 1) / 2;
  return n % 2 ? sorted[mid - 1] : (sorted[n / 2 - 1] + sorted[n / 2]) / 2;
};
// One decimal place, from integers, so no float error creeps in.
const dp1 = (tenths) => (tenths % 10 === 0 ? String(tenths / 10) : `${Math.trunc(tenths / 10)}.${Math.abs(tenths % 10)}`);

// A list with exactly one most-common value, so "the mode" is never ambiguous.
// Haese calls a two-mode set bimodal and says not to use the mode at all, so a
// generator that produced one would be asking an unanswerable question.
const uniqueMode = (xs) => {
  const counts = _.countBy(xs);
  const best = Math.max(...Object.values(counts));
  const winners = Object.keys(counts).filter((k) => counts[k] === best);
  return winners.length === 1 && best > 1 ? Number(winners[0]) : null;
};

/* ------------------------------------------------------ averages from a list */

export const generateAveragesFromList = (options = {}) => {
  const { difficulty = 'core' } = options;

  if (difficulty === 'stretch') {
    // The mean is given and one value is missing (Haese Exercise 13C Q7).
    const n = _.random(5, 8);
    const mean = _.random(4, 20);
    const known = _.times(n - 1, () => _.random(1, 30));
    const missing = mean * n - _.sum(known);
    if (missing < 1 || missing > 40) return generateAveragesFromList(options);
    const shown = _.shuffle([...known, 'x']);
    return {
      instruction: `The mean of these values is ${mean}. Find x`,
      questionMath: showList(shown),
      answer: `x = ${missing}`,
      workingOut: `\\text{total} = ${mean} \\times ${n} = ${mean * n}${NL}\\text{known values add to } ${_.sum(known)}${NL}x = ${mean * n} - ${_.sum(known)} = ${missing}`,
      metadata: { topic: 'averages-from-list', difficulty },
    };
  }

  const even = difficulty === 'core';
  const measure = even ? _.sample(['mean', 'median']) : _.sample(['mean', 'median', 'mode', 'range']);

  let xs, sorted, mode;
  do {
    const n = even ? _.sample([6, 8, 10]) : _.sample([5, 7, 9]);
    xs = _.times(n, () => _.random(1, 20));
    sorted = [...xs].sort((a, b) => a - b);
    mode = uniqueMode(xs);
  } while (
    (measure === 'mode' && mode === null) ||
    // Foundation means are whole numbers; core means land on one decimal place.
    (measure === 'mean' && (_.sum(xs) * 10) % xs.length !== 0) ||
    (measure === 'mean' && !even && _.sum(xs) % xs.length !== 0)
  );

  const n = xs.length;
  const total = _.sum(xs);
  if (measure === 'mean') {
    const tenths = (total * 10) / n;
    return {
      instruction: 'Find the mean',
      questionMath: showList(xs),
      answer: dp1(tenths),
      workingOut: `\\text{sum} = ${total}${NL}\\text{mean} = \\frac{${total}}{${n}}${NL}= ${dp1(tenths)}`,
      metadata: { topic: 'averages-from-list', difficulty },
    };
  }
  if (measure === 'median') {
    const m = median(sorted);
    return {
      instruction: 'Find the median',
      questionMath: showList(xs),
      answer: Number.isInteger(m) ? String(m) : dp1(Math.round(m * 10)),
      // For an even n the averaging of the two middle values is shown
      // explicitly — it is invisible when they happen to be equal, and it is
      // the step students skip.
      workingOut: `\\text{ordered: } ${showList(sorted)}${NL}n = ${n},\\ \\frac{n + 1}{2} = ${(n + 1) / 2}${NL}${n % 2 ? '' : `\\text{median} = \\frac{${sorted[n / 2 - 1]} + ${sorted[n / 2]}}{2} = `}${n % 2 ? '\\text{median} = ' : ''}${Number.isInteger(m) ? m : dp1(Math.round(m * 10))}`,
      metadata: { topic: 'averages-from-list', difficulty },
    };
  }
  if (measure === 'mode') {
    return {
      instruction: 'Find the mode',
      questionMath: showList(xs),
      answer: String(mode),
      workingOut: `\\text{ordered: } ${showList(sorted)}${NL}\\text{mode} = ${mode}`,
      metadata: { topic: 'averages-from-list', difficulty },
    };
  }
  return {
    instruction: 'Find the range',
    questionMath: showList(xs),
    answer: String(sorted[n - 1] - sorted[0]),
    workingOut: `\\text{largest} = ${sorted[n - 1]},\\ \\text{smallest} = ${sorted[0]}${NL}\\text{range} = ${sorted[n - 1]} - ${sorted[0]} = ${sorted[n - 1] - sorted[0]}`,
    metadata: { topic: 'averages-from-list', difficulty },
  };
};

/* --------------------------------------------------- averages from a table */

const freqTable = () => {
  const k = _.random(4, 6);
  const start = _.random(0, 4);
  const xs = _.range(start, start + k);
  const fs = xs.map(() => _.random(1, 12));
  return [xs, fs];
};
const tableFig = (xs, fs, xLabel = 'Score') => ({
  type: 'table',
  header: 'column',
  rows: [
    [xLabel, ...xs.map(String)],
    ['Frequency', ...fs.map(String)],
  ],
});

export const generateAveragesFromTable = (options = {}) => {
  const { difficulty = 'core' } = options;

  if (difficulty === 'foundation') {
    // Read the mode or the range straight off the table.
    let xs, fs;
    do { [xs, fs] = freqTable(); } while (fs.filter((f) => f === Math.max(...fs)).length !== 1);
    const wantMode = _.random(0, 1) === 1;
    const mode = xs[fs.indexOf(Math.max(...fs))];
    return {
      instruction: wantMode ? 'Find the mode' : 'Find the range',
      answer: String(wantMode ? mode : xs[xs.length - 1] - xs[0]),
      workingOut: wantMode
        ? `\\text{the largest frequency is } ${Math.max(...fs)}${NL}\\text{mode} = ${mode}`
        : `\\text{largest} = ${xs[xs.length - 1]},\\ \\text{smallest} = ${xs[0]}${NL}\\text{range} = ${xs[xs.length - 1] - xs[0]}`,
      visualization: tableFig(xs, fs),
      metadata: { topic: 'averages-from-table', difficulty },
    };
  }

  if (difficulty === 'core') {
    // Mean from a frequency table: sum(fx) / sum(f), landing on 1 d.p.
    let xs, fs, sumF, sumFX;
    do {
      [xs, fs] = freqTable();
      sumF = _.sum(fs);
      sumFX = _.sum(xs.map((x, i) => x * fs[i]));
    } while ((sumFX * 10) % sumF !== 0);
    return {
      instruction: 'Find the mean',
      answer: dp1((sumFX * 10) / sumF),
      workingOut: `\\sum fx = ${xs.map((x, i) => `${fs[i]} \\times ${x}`).join(' + ')} = ${sumFX}${NL}\\sum f = ${sumF}${NL}\\text{mean} = \\frac{${sumFX}}{${sumF}} = ${dp1((sumFX * 10) / sumF)}`,
      visualization: tableFig(xs, fs),
      metadata: { topic: 'averages-from-table', difficulty },
    };
  }

  // Median from a frequency table, by cumulative counting (Haese p288).
  let xs, fs, sumF;
  do {
    [xs, fs] = freqTable();
    sumF = _.sum(fs);
  } while (sumF < 8 || sumF > 45);
  const expanded = xs.flatMap((x, i) => _.times(fs[i], () => x));
  const m = median(expanded);
  let running = 0;
  const cumulative = fs.map((f) => (running += f));
  return {
    instruction: 'Find the median',
    answer: Number.isInteger(m) ? String(m) : dp1(Math.round(m * 10)),
    workingOut: `n = ${sumF},\\ \\frac{n + 1}{2} = ${dp1(Math.round(((sumF + 1) / 2) * 10))}${NL}\\text{cumulative: } ${cumulative.join(',\\ ')}${NL}\\text{median} = ${Number.isInteger(m) ? m : dp1(Math.round(m * 10))}`,
    visualization: tableFig(xs, fs),
    metadata: { topic: 'averages-from-table', difficulty },
  };
};

/* ------------------------------------------- estimated mean of grouped data */

export const generateEstimatedMean = (options = {}) => {
  const { difficulty = 'core' } = options;
  const width = _.sample([5, 10, 20]);
  const classes = _.random(3, 5);  // 4-6 table rows once the header is added
  const lows = _.times(classes, (i) => i * width);
  const mids = lows.map((lo) => lo + width / 2);

  if (difficulty === 'stretch') {
    // The estimated mean is given and one frequency is missing.
    let fs, sumF, sumFX, target;
    do {
      fs = _.times(classes, () => _.random(2, 15));
      sumF = _.sum(fs);
      sumFX = _.sum(mids.map((m, i) => m * fs[i]));
    } while (sumFX % sumF !== 0);
    target = sumFX / sumF;
    // The hidden class must NOT have the target as its midpoint. If it does,
    // adding any number of values at exactly the mean leaves the mean
    // unchanged, so every x is a valid answer and the question has no unique
    // solution. An answer-only check cannot see this: the stated x really does
    // give the target mean — so does every other one.
    const candidates = mids.map((m, i) => i).filter((i) => mids[i] !== target);
    if (!candidates.length) return generateEstimatedMean(options);
    const hide = _.sample(candidates);
    const knownF = _.sum(fs.filter((_f, i) => i !== hide));
    const knownFX = _.sum(mids.map((m, i) => (i === hide ? 0 : m * fs[i])));
    const rows = [
      ['Value', 'Frequency'],
      ...lows.map((lo, i) => [`${lo} ≤ x < ${lo + width}`, i === hide ? 'x' : String(fs[i])]),
    ];
    return {
      instruction: `The estimated mean is ${target}. Find x`,
      answer: `x = ${fs[hide]}`,
      workingOut: `\\text{midpoints: } ${mids.join(',\\ ')}${NL}\\sum f = ${knownF} + x,\\ \\sum fx = ${knownFX} + ${mids[hide]}x${NL}${knownFX} + ${mids[hide]}x = ${target}(${knownF} + x)${NL}x = ${fs[hide]}`,
      visualization: { type: 'table', header: 'row', rows },
      metadata: { topic: 'estimated-mean', difficulty },
    };
  }

  let fs, sumF, sumFX;
  do {
    fs = _.times(classes, () => _.random(2, 15));
    sumF = _.sum(fs);
    sumFX = _.sum(mids.map((m, i) => m * fs[i]));
  } while ((sumFX * 10) % sumF !== 0 || (difficulty === 'foundation' && sumFX % sumF !== 0));

  return {
    instruction: 'Estimate the mean',
    answer: dp1((sumFX * 10) / sumF),
    workingOut: `\\text{midpoints: } ${mids.join(',\\ ')}${NL}\\sum fx = ${sumFX},\\ \\sum f = ${sumF}${NL}\\text{estimated mean} = \\frac{${sumFX}}{${sumF}} = ${dp1((sumFX * 10) / sumF)}`,
    // Vertical, unlike the plain frequency table: a class interval is ten
    // characters wide and five of them side by side overflow a starter box.
    visualization: {
      type: 'table',
      header: 'row',
      rows: [['Value', 'Frequency'], ...lows.map((lo, i) => [`${lo} ≤ x < ${lo + width}`, String(fs[i])])],
    },
    metadata: { topic: 'estimated-mean', difficulty },
  };
};
