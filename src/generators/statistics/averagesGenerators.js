// src/generators/statistics/averagesGenerators.js
//
// Haese Chapter 13 (C-F) and 17A: averages from a list, from a frequency
// table, the estimated mean of grouped data, and working backwards from a
// given mean to a missing value.

import _ from 'lodash';

const NL = '\n';

// Joined with a plain comma. The old `,\\ ` is not in the Archivo subset
// (SPEC.md 6), so every list question fell back to KaTeX for the sake of a
// thin space — the whole topic rendered in serif and warnIfUnparseable logged
// on all of it.
const showList = (xs) => xs.join(', ');

// Haese p283: the median is the (n+1)/2 th ordered value, so for an even n it
// is the average of the two middle values.
const median = (sorted) => {
  const n = sorted.length;
  const mid = (n + 1) / 2;
  return n % 2 ? sorted[mid - 1] : (sorted[n / 2 - 1] + sorted[n / 2]) / 2;
};

// One decimal place, from integers, so no float error creeps in. The sign is
// taken off the front first: Math.trunc(-5 / 10) is 0, which printed -0.5 as
// "0.5". Unreachable while every data value is positive, and a silent wrong
// answer the moment one is not.
const dp1 = (tenths) => {
  const sign = tenths < 0 ? '-' : '';
  const a = Math.abs(tenths);
  return a % 10 === 0 ? `${sign}${a / 10}` : `${sign}${Math.floor(a / 10)}.${a % 10}`;
};

// A list with exactly one most-common value, so "the mode" is never ambiguous.
// Haese calls a two-mode set bimodal and says not to use the mode at all, so a
// generator that produced one would be asking an unanswerable question.
const uniqueMode = (xs) => {
  const counts = _.countBy(xs);
  const best = Math.max(...Object.values(counts));
  const winners = Object.keys(counts).filter((k) => counts[k] === best);
  return winners.length === 1 && best > 1 ? Number(winners[0]) : null;
};

/* ------------------------------------------------------ averages from a list
 *
 * Foundation  order the list and read a value off it: mode or range
 * Core        calculate: mean or median, odd n, both landing whole
 * Stretch     the same two over an even n, where the mean gains a decimal and
 *             the median has to be averaged from the two middle values
 *
 * Previously Foundation asked all four measures and Core asked only mean and
 * median, so stepping the board up removed mode and range altogether, and the
 * only change to the mean was that its answer grew a decimal.
 * ---------------------------------------------------------------------- */

export const generateAveragesFromList = (options = {}) => {
  const { difficulty = 'core' } = options;
  const even = difficulty === 'stretch';
  const measure = difficulty === 'foundation'
    ? _.sample(['mode', 'range'])
    : _.sample(['mean', 'median']);

  let xs;
  let sorted;
  let mode;
  for (;;) {
    const n = even ? _.sample([6, 8, 10]) : _.sample([5, 7, 9]);
    xs = _.times(n, () => _.random(1, 20));
    sorted = [...xs].sort((a, b) => a - b);
    mode = uniqueMode(xs);
    const total = _.sum(xs);

    if (measure === 'mode' && mode === null) continue;
    if (measure === 'range' && sorted[n - 1] - sorted[0] < 4) continue;
    if (measure === 'mean') {
      if (!even && total % n !== 0) continue;
      // Stretch means must genuinely need the decimal place, or the band is
      // Core with a longer list.
      if (even && ((total * 10) % n !== 0 || total % n === 0)) continue;
    }
    if (measure === 'median' && even && sorted[n / 2 - 1] === sorted[n / 2]) {
      // With the two middle values equal, the averaging step the band exists
      // to test is invisible.
      continue;
    }
    break;
  }

  const n = xs.length;
  const total = _.sum(xs);
  const base = { questionMath: showList(xs), metadata: { topic: 'averages-from-list', difficulty } };

  if (measure === 'mean') {
    const tenths = (total * 10) / n;
    return {
      ...base,
      instruction: 'Find the mean',
      answer: dp1(tenths),
      workingOut: [
        `\\text{sum} = ${total}`,
        `\\text{mean} = \\frac{${total}}{${n}}`,
        `= ${dp1(tenths)}`,
      ].join(NL),
    };
  }
  if (measure === 'median') {
    const m = median(sorted);
    const shown = Number.isInteger(m) ? String(m) : dp1(Math.round(m * 10));
    const last = even
      ? `\\text{median} = \\frac{${sorted[n / 2 - 1]} + ${sorted[n / 2]}}{2} = ${shown}`
      : `\\text{median} = ${shown}`;
    return {
      ...base,
      instruction: 'Find the median',
      answer: shown,
      workingOut: [
        `\\text{ordered: } ${showList(sorted)}`,
        `n = ${n}, \\frac{n + 1}{2} = ${(n + 1) / 2}`,
        last,
      ].join(NL),
    };
  }
  if (measure === 'mode') {
    return {
      ...base,
      instruction: 'Find the mode',
      answer: String(mode),
      workingOut: [`\\text{ordered: } ${showList(sorted)}`, `\\text{mode} = ${mode}`].join(NL),
    };
  }
  return {
    ...base,
    instruction: 'Find the range',
    answer: String(sorted[n - 1] - sorted[0]),
    workingOut: [
      `\\text{largest} = ${sorted[n - 1]}, \\text{smallest} = ${sorted[0]}`,
      `\\text{range} = ${sorted[n - 1]} - ${sorted[0]} = ${sorted[n - 1] - sorted[0]}`,
    ].join(NL),
  };
};

/* --------------------------------------------------- averages from a table */

// Scores step by 1 to 3 rather than running consecutively. With consecutive
// scores the range is always (number of rows - 1), so "find the range" had
// exactly three possible answers — 3, 4 or 5 — and could be answered without
// reading the table at all.
const freqTable = () => {
  const k = _.random(4, 6);
  const xs = [];
  let v = _.random(0, 6);
  for (let i = 0; i < k; i += 1) {
    xs.push(v);
    v += _.random(1, 3);
  }
  return [xs, xs.map(() => _.random(1, 12))];
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
    let xs;
    let fs;
    do { [xs, fs] = freqTable(); } while (fs.filter((f) => f === Math.max(...fs)).length !== 1);
    const wantMode = _.random(0, 1) === 1;
    const mode = xs[fs.indexOf(Math.max(...fs))];
    return {
      instruction: wantMode ? 'Find the mode' : 'Find the range',
      answer: String(wantMode ? mode : xs[xs.length - 1] - xs[0]),
      workingOut: wantMode
        ? [`\\text{the largest frequency is } ${Math.max(...fs)}`, `\\text{mode} = ${mode}`].join(NL)
        : [
          `\\text{largest} = ${xs[xs.length - 1]}, \\text{smallest} = ${xs[0]}`,
          `\\text{range} = ${xs[xs.length - 1]} - ${xs[0]} = ${xs[xs.length - 1] - xs[0]}`,
        ].join(NL),
      visualization: tableFig(xs, fs),
      metadata: { topic: 'averages-from-table', difficulty },
    };
  }

  if (difficulty === 'core') {
    let xs;
    let fs;
    let sumF;
    let sumFX;
    do {
      [xs, fs] = freqTable();
      sumF = _.sum(fs);
      sumFX = _.sum(xs.map((x, i) => x * fs[i]));
    } while ((sumFX * 10) % sumF !== 0);
    return {
      instruction: 'Find the mean',
      answer: dp1((sumFX * 10) / sumF),
      // "sum of fx" rather than \sum fx: \sum is not in the Archivo subset,
      // and \text{} is. Same words the list working already uses.
      workingOut: [
        `\\text{sum of } fx = ${xs.map((x, i) => `${fs[i]} \\times ${x}`).join(' + ')} = ${sumFX}`,
        `\\text{sum of } f = ${sumF}`,
        `\\text{mean} = \\frac{${sumFX}}{${sumF}} = ${dp1((sumFX * 10) / sumF)}`,
      ].join(NL),
      visualization: tableFig(xs, fs),
      metadata: { topic: 'averages-from-table', difficulty },
    };
  }

  // Median from a frequency table, by cumulative counting (Haese p288).
  let xs;
  let fs;
  let sumF;
  do {
    [xs, fs] = freqTable();
    sumF = _.sum(fs);
  } while (sumF < 8 || sumF > 45);
  const expanded = xs.flatMap((x, i) => _.times(fs[i], () => x));
  const m = median(expanded);
  let running = 0;
  const cumulative = fs.map((f) => { running += f; return running; });
  const shown = Number.isInteger(m) ? String(m) : dp1(Math.round(m * 10));
  return {
    instruction: 'Find the median',
    answer: shown,
    workingOut: [
      `n = ${sumF}, \\frac{n + 1}{2} = ${dp1(Math.round(((sumF + 1) / 2) * 10))}`,
      `\\text{cumulative: } ${cumulative.join(', ')}`,
      `\\text{median} = ${shown}`,
    ].join(NL),
    visualization: tableFig(xs, fs),
    metadata: { topic: 'averages-from-table', difficulty },
  };
};

/* ------------------------------------------- estimated mean of grouped data
 *
 * Foundation  the midpoints are given in their own column
 * Core        find the midpoints yourself
 * Stretch     unequal class widths, so the midpoints cannot be read off as a
 *             pattern and each one has to be worked out
 *
 * Previously Foundation and Core were the same question, separated only by
 * whether the answer happened to be whole — the shape CLAUDE.md 4 rules out,
 * and a band the catalogue declared but the generator did not deliver.
 * ---------------------------------------------------------------------- */

const groupedRows = (lows, highs, fs, mids) => ({
  type: 'table',
  header: 'row',
  // Vertical: a class interval is ten characters wide and five of them side by
  // side overflow a starter box.
  rows: mids
    ? [['Value', 'Midpoint', 'Frequency'],
      ...lows.map((lo, i) => [`${lo} ≤ x < ${highs[i]}`, String(mids[i]), String(fs[i])])]
    : [['Value', 'Frequency'],
      ...lows.map((lo, i) => [`${lo} ≤ x < ${highs[i]}`, String(fs[i])])],
});

/** Contiguous class intervals. Widths are even, so every midpoint is whole. */
function classes(difficulty) {
  const k = _.random(3, 5);
  // The old version always started at zero, so it was never 20 <= x < 30.
  let lo = _.sample([0, 0, 5, 10, 20]);
  const lows = [];
  const highs = [];
  const width = _.sample([4, 6, 10, 20]);
  for (let i = 0; i < k; i += 1) {
    const w = difficulty === 'stretch' ? _.sample([4, 6, 10, 20]) : width;
    lows.push(lo);
    highs.push(lo + w);
    lo += w;
  }
  return [lows, highs, lows.map((l, i) => (l + highs[i]) / 2)];
}

export const generateEstimatedMean = (options = {}) => {
  const { difficulty = 'core' } = options;
  for (;;) {
    const [lows, highs, mids] = classes(difficulty);
    // Stretch's whole point is that the widths differ; an accidental run of
    // equal ones is just Core.
    if (difficulty === 'stretch' && new Set(highs.map((h, i) => h - lows[i])).size === 1) continue;
    const fs = _.times(lows.length, () => _.random(2, 15));
    const sumF = _.sum(fs);
    const sumFX = _.sum(mids.map((m, i) => m * fs[i]));
    if ((sumFX * 10) % sumF !== 0) continue;

    return {
      instruction: 'Estimate the mean',
      answer: dp1((sumFX * 10) / sumF),
      workingOut: [
        `\\text{midpoints: } ${mids.join(', ')}`,
        `\\text{sum of } fx = ${sumFX}, \\text{sum of } f = ${sumF}`,
        `\\text{estimated mean} = \\frac{${sumFX}}{${sumF}} = ${dp1((sumFX * 10) / sumF)}`,
      ].join(NL),
      visualization: groupedRows(lows, highs, fs, difficulty === 'foundation' ? mids : null),
      metadata: { topic: 'estimated-mean', difficulty },
    };
  }
};

/* ------------------------------------ working backwards from a given mean
 *
 * Foundation  a list with one value missing
 * Core        a frequency table with one frequency missing
 * Stretch     a grouped table with one frequency missing
 *
 * These three were previously the Stretch band of three different skills.
 * Gathered here they form a ladder of their own — the arithmetic is the same
 * move each time, but what you are solving for changes from a value, to a
 * frequency, to a frequency weighted by a midpoint you first have to find.
 *
 * Core and Stretch both need the same guard: if the hidden row's value equals
 * the target mean, adding any number of items at exactly the mean leaves the
 * mean unchanged, so every x is a valid answer. An answer-only check cannot
 * see it — the stated x really does give the target mean, and so does every
 * other one.
 * ---------------------------------------------------------------------- */

function solveHidden(values, fs, target) {
  const options = values.map((_v, i) => i).filter((i) => values[i] !== target);
  if (!options.length) return null;
  const hide = _.sample(options);
  return { hide, x: fs[hide] };
}

export const generateMeanMissingValue = (options = {}) => {
  const { difficulty = 'core' } = options;

  if (difficulty === 'foundation') {
    for (;;) {
      const n = _.random(5, 8);
      const mean = _.random(4, 20);
      const known = _.times(n - 1, () => _.random(1, 30));
      const missing = mean * n - _.sum(known);
      if (missing < 1 || missing > 40) continue;
      return {
        instruction: `The mean of these values is ${mean}. Find x`,
        questionMath: showList(_.shuffle([...known, 'x'])),
        answer: `x = ${missing}`,
        workingOut: [
          `\\text{total} = ${mean} \\times ${n} = ${mean * n}`,
          `\\text{known values add to } ${_.sum(known)}`,
          `x = ${mean * n} - ${_.sum(known)} = ${missing}`,
        ].join(NL),
        metadata: { topic: 'mean-missing-value', difficulty },
      };
    }
  }

  if (difficulty === 'core') {
    for (;;) {
      const [xs, fs] = freqTable();
      const sumF = _.sum(fs);
      const sumFX = _.sum(xs.map((x, i) => x * fs[i]));
      if (sumFX % sumF !== 0) continue;
      const target = sumFX / sumF;
      const picked = solveHidden(xs, fs, target);
      if (!picked) continue;
      const { hide, x } = picked;
      const knownF = _.sum(fs.filter((_f, i) => i !== hide));
      const knownFX = _.sum(xs.map((v, i) => (i === hide ? 0 : v * fs[i])));
      const shownFs = fs.map((f, i) => (i === hide ? 'x' : String(f)));
      return {
        instruction: `The mean is ${target}. Find x`,
        answer: `x = ${x}`,
        workingOut: [
          `\\text{sum of } f = ${knownF} + x, \\text{sum of } fx = ${knownFX} + ${xs[hide]}x`,
          `${knownFX} + ${xs[hide]}x = ${target}(${knownF} + x)`,
          `x = ${x}`,
        ].join(NL),
        visualization: {
          type: 'table',
          header: 'column',
          rows: [['Score', ...xs.map(String)], ['Frequency', ...shownFs]],
        },
        metadata: { topic: 'mean-missing-value', difficulty },
      };
    }
  }

  for (;;) {
    const [lows, highs, mids] = classes('core');
    const fs = _.times(lows.length, () => _.random(2, 15));
    const sumF = _.sum(fs);
    const sumFX = _.sum(mids.map((m, i) => m * fs[i]));
    if (sumFX % sumF !== 0) continue;
    const target = sumFX / sumF;
    const picked = solveHidden(mids, fs, target);
    if (!picked) continue;
    const { hide, x } = picked;
    const knownF = _.sum(fs.filter((_f, i) => i !== hide));
    const knownFX = _.sum(mids.map((m, i) => (i === hide ? 0 : m * fs[i])));
    const shownFs = fs.map((f, i) => (i === hide ? 'x' : String(f)));
    return {
      instruction: `The estimated mean is ${target}. Find x`,
      answer: `x = ${x}`,
      workingOut: [
        `\\text{midpoints: } ${mids.join(', ')}`,
        `\\text{sum of } f = ${knownF} + x, \\text{sum of } fx = ${knownFX} + ${mids[hide]}x`,
        `${knownFX} + ${mids[hide]}x = ${target}(${knownF} + x)`,
        `x = ${x}`,
      ].join(NL),
      visualization: {
        type: 'table',
        header: 'row',
        rows: [['Value', 'Frequency'],
          ...lows.map((lo, i) => [`${lo} ≤ x < ${highs[i]}`, shownFs[i]])],
      },
      metadata: { topic: 'mean-missing-value', difficulty },
    };
  }
};
