// src/generators/statistics/dataDisplayGenerators.js
//
//   modal-class              Haese 17: the modal class of grouped data
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
// uses `\le`, which is in the Archivo subset. The class intervals printed
// INSIDE the table use the literal character instead, because figure labels
// are plain SVG text and never touch the renderer (CLAUDE.md 6).

import _ from 'lodash';

const NL = '\n';

const dp1 = (tenths) => {
  const sign = tenths < 0 ? '-' : '';
  const a = Math.abs(tenths);
  return a % 10 === 0 ? `${sign}${a / 10}` : `${sign}${Math.floor(a / 10)}.${a % 10}`;
};

/** The median of an ascending list, averaging the middle pair when n is even. */
const median = (sorted) => {
  const n = sorted.length;
  return n % 2 ? sorted[(n - 1) / 2] : (sorted[n / 2 - 1] + sorted[n / 2]) / 2;
};

/* ------------------------------------------------------------- modal class
 *
 * Foundation  read the modal class off a grouped frequency table
 * Core        name the class containing the median, by cumulative counting
 * Stretch     the table gives CUMULATIVE frequencies, so they have to be
 *             differenced before any class can be named
 * ---------------------------------------------------------------------- */

/** Contiguous equal-width classes. */
function classes() {
  const k = _.random(4, 5);
  const width = _.sample([5, 10, 20]);
  const start = _.sample([0, 0, width, 2 * width]);
  const lows = _.times(k, (i) => start + i * width);
  return [lows, lows.map((lo) => lo + width), width];
}

const interval = (lo, hi) => `${lo} ≤ x < ${hi}`;        // figure: literal glyph
const intervalTex = (lo, hi) => `${lo} \\le x < ${hi}`;  // answer: through the renderer

export const generateModalClass = (options = {}) => {
  const { difficulty = 'core' } = options;

  for (;;) {
    const [lows, highs] = classes();
    const fs = _.times(lows.length, () => _.random(2, 18));
    const peak = Math.max(...fs);
    // One tallest class only: with two, "the modal class" has no answer, the
    // same reason uniqueMode exists for a list.
    if (fs.filter((f) => f === peak).length !== 1) continue;
    const modeIdx = fs.indexOf(peak);
    const total = _.sum(fs);

    if (difficulty === 'foundation') {
      return {
        instruction: 'Write down the modal class',
        answer: intervalTex(lows[modeIdx], highs[modeIdx]),
        workingOut: [
          `\\text{the largest frequency is } ${peak}`,
          intervalTex(lows[modeIdx], highs[modeIdx]),
        ].join(NL),
        visualization: {
          type: 'table',
          header: 'row',
          rows: [['Value', 'Frequency'],
            ...lows.map((lo, i) => [interval(lo, highs[i]), String(fs[i])])],
        },
        metadata: { topic: 'modal-class', difficulty },
      };
    }

    let running = 0;
    const cumulative = fs.map((f) => { running += f; return running; });

    if (difficulty === 'core') {
      // The class holding the (n+1)/2 th value.
      const pos = (total + 1) / 2;
      const medIdx = cumulative.findIndex((c) => c >= pos);
      // If the median position lands exactly on a class boundary the class is
      // still well defined, but a question whose answer sits one value inside
      // the class is a fairer read.
      if (medIdx > 0 && cumulative[medIdx - 1] === Math.floor(pos)) continue;
      return {
        instruction: 'Write down the class containing the median',
        answer: intervalTex(lows[medIdx], highs[medIdx]),
        workingOut: [
          `n = ${total}, \\frac{n + 1}{2} = ${dp1(Math.round(((total + 1) / 2) * 10))}`,
          `\\text{cumulative: } ${cumulative.join(', ')}`,
          intervalTex(lows[medIdx], highs[medIdx]),
        ].join(NL),
        visualization: {
          type: 'table',
          header: 'row',
          rows: [['Value', 'Frequency'],
            ...lows.map((lo, i) => [interval(lo, highs[i]), String(fs[i])])],
        },
        metadata: { topic: 'modal-class', difficulty },
      };
    }

    // Stretch: cumulative frequencies, written against upper bounds the way a
    // cumulative table actually is. The frequencies have to be recovered by
    // differencing before the tallest class can be named.
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
      visualization: {
        type: 'table',
        header: 'row',
        rows: [['Value', 'Cumulative frequency'],
          ...highs.map((hi, i) => [`x < ${hi}`, String(cumulative[i])])],
      },
      metadata: { topic: 'modal-class', difficulty },
    };
  }
};

/* ------------------------------------------------- averages from a stem-and-leaf
 *
 * Foundation  the range, or the mode — both read off the ends or the repeats
 * Core        the median, by counting in from one end
 * Stretch     the mean, which is the only one that needs every value
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
    const n = difficulty === 'stretch' ? _.random(10, 14) : _.random(9, 15);
    const base = _.random(1, 7) * 10;
    const values = _.times(n, () => base + _.random(0, 29));
    const { sorted, rows } = plotOf(values);
    // Three to six stems: fewer and the plot is a list, more and it is a
    // column of near-empty rows.
    if (rows.length < 3 || rows.length > 6) continue;
    if (Math.max(...rows.map((r) => r.leaves.length)) > 9) continue;

    const key = { keyStem: rows[1].stem, keyLeaf: rows[1].leaves[0] };
    const fig = { type: 'stem-leaf', rows, ...key };
    const meta = { topic: 'stem-and-leaf-averages', difficulty };

    if (difficulty === 'foundation') {
      const counts = _.countBy(sorted);
      const best = Math.max(...Object.values(counts));
      const winners = Object.keys(counts).filter((k) => counts[k] === best);
      const wantMode = best > 1 && winners.length === 1 && _.random(0, 1) === 1;
      if (wantMode) {
        return {
          instruction: 'Write down the mode',
          answer: String(winners[0]),
          workingOut: [
            `\\text{${winners[0]} appears ${best} times}`,
            `\\text{mode} = ${winners[0]}`,
          ].join(NL),
          visualization: fig,
          metadata: meta,
        };
      }
      const lo = sorted[0];
      const hi = sorted[sorted.length - 1];
      if (hi - lo < 10) continue;
      return {
        instruction: 'Find the range',
        answer: String(hi - lo),
        workingOut: [
          `\\text{largest} = ${hi}, \\text{smallest} = ${lo}`,
          `\\text{range} = ${hi} - ${lo} = ${hi - lo}`,
        ].join(NL),
        visualization: fig,
        metadata: meta,
      };
    }

    if (difficulty === 'core') {
      const m = median(sorted);
      const shown = Number.isInteger(m) ? String(m) : dp1(Math.round(m * 10));
      const last = n % 2
        ? `\\text{median} = ${shown}`
        : `\\text{median} = \\frac{${sorted[n / 2 - 1]} + ${sorted[n / 2]}}{2} = ${shown}`;
      // With the two middle values equal the averaging is invisible, and the
      // question is a Foundation read instead.
      if (n % 2 === 0 && sorted[n / 2 - 1] === sorted[n / 2]) continue;
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
