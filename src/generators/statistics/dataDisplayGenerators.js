// src/generators/statistics/dataDisplayGenerators.js
//
//   modal-class              Haese 17: the modal class of grouped data
//   median-class             Haese 17: the class containing the median
//   stem-and-leaf-averages   Haese 13B: averages read off a stem-and-leaf plot
//
// A new file rather than more of averagesGenerators.js, so the replacement of
// that file and these two additions can be merged independently.
//
// Equal class widths throughout. The unequal-width case — where the largest
// frequency is NOT the modal class because frequency density differs — is a
// real misconception but sits outside 0607, so it is deliberately absent.
//
// Both answer with something that is not a number: a class interval, or a
// value read off a plot. A class interval goes through the renderer, so it
// uses `\le`. The class intervals printed
// INSIDE the table use the literal character instead, because figure labels
// are plain SVG text and never touch the renderer (CLAUDE.md 6).

import _ from 'lodash';
import { dp1, median } from '../shared';

const NL = '\n';



/* ------------------------------------------------- modal and median class
 *
 * Modal class
 *   Foundation  read off a grouped frequency table of four or five classes
 *   Core        six classes, with a close second: the tallest beats the next
 *               by one or two
 *   Stretch     the table gives CUMULATIVE frequencies, so they have to be
 *               differenced before any class can be named
 *
 * Median class
 *   Foundation  a small total, 30 or under, four classes
 *   Core        a larger total, 50 to 100, five classes
 *   Stretch     from a cumulative frequency table
 * ---------------------------------------------------------------------- */

/** k contiguous equal-width classes. */
function classes(k = _.random(4, 5)) {
  const width = _.sample([5, 10, 20]);
  const start = _.sample([0, 0, width, 2 * width]);
  const lows = _.times(k, (i) => start + i * width);
  return [lows, lows.map((lo) => lo + width), width];
}

const interval = (lo, hi) => `${lo} ≤ x < ${hi}`;        // figure: literal glyph
const intervalTex = (lo, hi) => `${lo} \\le x < ${hi}`;  // answer: through the renderer

const freqTable = (lows, highs, fs) => ({
  type: 'table',
  header: 'row',
  big: true,
  rows: [['Value', 'Frequency'], ...lows.map((lo, i) => [interval(lo, highs[i]), String(fs[i])])],
});
// Cumulative frequencies written against upper bounds, the way a cumulative
// table actually is.
const cumulativeTable = (highs, cumulative) => ({
  type: 'table',
  header: 'row',
  big: true,
  rows: [['Value', 'Cumulative frequency'], ...highs.map((hi, i) => [`x < ${hi}`, String(cumulative[i])])],
});
const runningTotals = (fs) => { let r = 0; return fs.map((f) => { r += f; return r; }); };

export const generateModalClass = (options = {}) => {
  const { difficulty = 'core' } = options;

  for (;;) {
    const [lows, highs] = classes(difficulty === 'core' ? 6 : undefined);
    const fs = _.times(lows.length, () => _.random(2, 18));
    const peak = Math.max(...fs);
    // One tallest class only: with two, "the modal class" has no answer, the
    // same reason uniqueMode exists for a list.
    if (fs.filter((f) => f === peak).length !== 1) continue;
    const second = Math.max(...fs.filter((f) => f !== peak));
    if (difficulty === 'core' && peak - second > 2) continue;
    const modeIdx = fs.indexOf(peak);
    const meta = { topic: 'modal-class', difficulty };

    if (difficulty !== 'stretch') {
      return {
        instruction: 'Write down the modal class',
        answer: intervalTex(lows[modeIdx], highs[modeIdx]),
        workingOut: [
          `\\text{the largest frequency is } ${peak}`,
          intervalTex(lows[modeIdx], highs[modeIdx]),
        ].join(NL),
        visualization: freqTable(lows, highs, fs),
        metadata: meta,
      };
    }

    // Only upper bounds are printed, so the first class's lower bound is
    // readable only when it is 0. With classes starting at 20 and the first
    // one tallest, "20 ≤ x < 30" would be an answer nothing on the table says.
    if (modeIdx === 0 && lows[0] > 0) continue;
    return {
      instruction: 'Write down the modal class',
      answer: intervalTex(lows[modeIdx], highs[modeIdx]),
      workingOut: [
        `\\text{frequencies: } ${fs.join(', ')}`,
        `\\text{the largest is } ${peak}`,
        intervalTex(lows[modeIdx], highs[modeIdx]),
      ].join(NL),
      visualization: cumulativeTable(highs, runningTotals(fs)),
      metadata: meta,
    };
  }
};

export const generateMedianClass = (options = {}) => {
  const { difficulty = 'core' } = options;

  for (;;) {
    const core = difficulty === 'core';
    const [lows, highs] = classes(difficulty === 'foundation' ? 4 : 5);
    const fs = _.times(lows.length, () => (core ? _.random(5, 30) : difficulty === 'foundation' ? _.random(2, 9) : _.random(3, 20)));
    const total = _.sum(fs);
    if (difficulty === 'foundation' && total > 30) continue;
    if (core && (total < 50 || total > 100)) continue;
    const cumulative = runningTotals(fs);
    // The class holding the (n+1)/2 th value. If the position lands exactly
    // on a class boundary the class is still well defined, but a question
    // whose answer sits one value inside the class is a fairer read.
    const pos = (total + 1) / 2;
    const medIdx = cumulative.findIndex((c) => c >= pos);
    if (medIdx > 0 && cumulative[medIdx - 1] === Math.floor(pos)) continue;
    // From a cumulative table the first class's lower bound shows only
    // when it is 0.
    if (difficulty === 'stretch' && medIdx === 0 && lows[0] > 0) continue;
    const position = `n = ${total}, \\frac{n + 1}{2} = ${dp1(Math.round(pos * 10))}`;
    return {
      instruction: 'Write down the class containing the median',
      answer: intervalTex(lows[medIdx], highs[medIdx]),
      workingOut: [
        position,
        ...(difficulty === 'stretch' ? [] : [`\\text{cumulative: } ${cumulative.join(', ')}`]),
        intervalTex(lows[medIdx], highs[medIdx]),
      ].join(NL),
      visualization: difficulty === 'stretch' ? cumulativeTable(highs, cumulative) : freqTable(lows, highs, fs),
      metadata: { topic: 'median-class', difficulty },
    };
  }
};

/* ------------------------------------------------- averages from a stem-and-leaf
 *
 * Foundation  the median of a short plot, an odd number of values, so it is
 *             the middle one
 * Core        the median of a plot with an even number of values, so the two
 *             middle ones are averaged
 * Stretch     the mean of a plot of 15 to 20 values, read with the key
 * ---------------------------------------------------------------------- */

/** A sorted plot, plus the values it stands for. */
function plotOf(values) {
  const sorted = [...values].sort((a, b) => a - b);
  const stems = _.uniq(sorted.map((v) => Math.floor(v / 10)));
  const rows = stems.map((stem) => ({
    stem,
    leaves: sorted.filter((v) => Math.floor(v / 10) === stem).map((v) => v % 10),
  }));
  return { sorted, rows };
}

export const generateStemAndLeafAverages = (options = {}) => {
  const { difficulty = 'core' } = options;

  for (;;) {
    const n = { foundation: _.sample([7, 9, 11]), core: _.sample([10, 12, 14, 16]), stretch: _.random(15, 20) }[difficulty];
    const base = _.random(1, 7) * 10;
    const values = _.times(n, () => base + _.random(0, 29));
    const { sorted, rows } = plotOf(values);
    // Three stems, none skipped, and no row of more than nine leaves.
    if (rows.length !== 3 || rows[2].stem !== rows[0].stem + 2) continue;
    if (Math.max(...rows.map((r) => r.leaves.length)) > 9) continue;

    const key = { keyStem: rows[1].stem, keyLeaf: rows[1].leaves[0] };
    const fig = { type: 'stem-leaf', rows, ...key };
    const meta = { topic: 'stem-and-leaf-averages', difficulty };

    if (difficulty !== 'stretch') {
      const m = median(sorted);
      // With the two middle values equal the averaging is invisible.
      if (n % 2 === 0 && sorted[n / 2 - 1] === sorted[n / 2]) continue;
      const shown = Number.isInteger(m) ? String(m) : dp1(Math.round(m * 10));
      const last = n % 2
        ? `\\text{median} = ${shown}`
        : `\\text{median} = \\frac{${sorted[n / 2 - 1]} + ${sorted[n / 2]}}{2} = ${shown}`;
      return {
        instruction: 'Find the median',
        answer: shown,
        workingOut: [
          `n = ${n}, \\frac{n + 1}{2} = ${dp1(Math.round(((n + 1) / 2) * 10))}`,
          last,
        ].join(NL),
        visualization: fig,
        metadata: meta,
      };
    }

    const total = _.sum(sorted);
    if ((total * 10) % n !== 0) continue;
    return {
      instruction: 'Find the mean',
      answer: dp1((total * 10) / n),
      // The values are listed before they are totalled: at this band the plot
      // holds every one of them, and "sum = 210" asserted on its own is not
      // working a student can follow.
      workingOut: [
        `\\text{values: } ${sorted.join(', ')}`,
        `\\text{sum} = ${total}`,
        `\\text{mean} = \\frac{${total}}{${n}} = ${dp1((total * 10) / n)}`,
      ].join(NL),
      visualization: fig,
      metadata: meta,
    };
  }
};
