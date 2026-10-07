// Substitute-the-answer-back checks for the four-part averages question, the
// frequency-table reading skill and bar charts. Every answer is recomputed
// from the figure config and the printed text — never from the generator's
// own variables.
//
// Run: npx vitest run src/generators/statistics/statisticsTweaks.test.js

import { describe, expect, it } from 'vitest';
import _ from 'lodash';
import { generateAveragesFromList } from './averagesGenerators';
import { generateFrequencyTableReading } from './frequencyTableGenerators';
import { generateBarCharts } from './barChartGenerators';
import { CONTEXTS } from './pieChartGenerators';
import { parseArchivoLine } from '../../lib/archivoMath.jsx';

const SAMPLES = 4000;
const BANDS = ['foundation', 'core', 'stretch'];

const parses = (q) => {
  const a = q.answerUnits ? `${q.answer}\\text{ }${q.answerUnits}` : q.answer;
  [a, q.workingOut, q.questionMath].filter(Boolean).join('\n').split('\n')
    .forEach((line) => expect(parseArchivoLine(line, 'k'), line).not.toBeNull());
  expect([q.instruction, q.answer, q.workingOut].join(' ')).not.toMatch(/\\n|undefined|NaN/);
};

const numMedian = (s) => {
  const n = s.length;
  return n % 2 ? s[(n - 1) / 2] : (s[n / 2 - 1] + s[n / 2]) / 2;
};

describe('averages-from-list core: four parts from one list', () => {
  it('every part agrees with the printed list', () => {
    const distinct = new Set();
    for (let t = 0; t < SAMPLES; t += 1) {
      const q = generateAveragesFromList({ difficulty: 'core' });
      parses(q);
      distinct.add(q.questionMath);
      const xs = q.questionMath.split(', ').map(Number);
      expect(xs.every(Number.isInteger)).toBe(true);
      expect(xs.length % 2).toBe(1);
      const s = [...xs].sort((a, b) => a - b);
      const counts = _.countBy(xs);
      const top = Math.max(...Object.values(counts));
      const modes = Object.keys(counts).filter((k) => counts[k] === top);
      expect(modes).toHaveLength(1);
      const want = {
        mean: _.sum(xs) / xs.length,
        mode: Number(modes[0]),
        median: numMedian(s),
        range: s[s.length - 1] - s[0],
      };
      const got = Object.fromEntries(
        [...q.answer.matchAll(/\\text\{\([a-d]\) (\w+)\} = (-?[\d.]+)/g)].map((m) => [m[1], Number(m[2])]),
      );
      expect(got).toEqual(want);
      expect(new Set(Object.values(got)).size).toBe(4);
      expect(q.instruction).toMatch(/\(a\) the mean \(b\) the mode \(c\) the median \(d\) the range/);
    }
    expect(distinct.size).toBeGreaterThan(SAMPLES * 0.9);
  });

  it('leaves Foundation and Stretch as single-measure questions', () => {
    for (let t = 0; t < 200; t += 1) {
      expect(generateAveragesFromList({ difficulty: 'foundation' }).instruction).toMatch(/^Find the (mode|range)$/);
      expect(generateAveragesFromList({ difficulty: 'stretch' }).instruction).toMatch(/^Find the (mean|median)$/);
    }
  });
});

/* ---------------------------------------------------------------- tables */

const readTable = (fig) => {
  expect(fig.type).toBe('table');
  const [head, ...body] = fig.rows;
  expect(head[1]).toBe('Frequency');
  const xs = body.map((r) => Number(r[0]));
  const fs = body.map((r) => (r[1] === '?' ? null : Number(r[1])));
  xs.forEach((x, i) => { if (i) expect(x).toBe(xs[i - 1] + 1); });
  return { xs, fs };
};

describe('frequency-table-reading', () => {
  it('foundation: a count of rows, all or by condition', () => {
    const kinds = { all: 0, cond: 0 };
    const distinct = new Set();
    for (let t = 0; t < SAMPLES; t += 1) {
      const q = generateFrequencyTableReading({ difficulty: 'foundation' });
      parses(q);
      distinct.add(q.instruction + JSON.stringify(q.visualization.rows));
      const { xs, fs } = readTable(q.visualization);
      const m = q.instruction.match(/(more than|fewer than|at least) (\d+)/);
      let want;
      if (m) {
        kinds.cond += 1;
        const k = Number(m[2]);
        const test = { 'more than': (x) => x > k, 'fewer than': (x) => x < k, 'at least': (x) => x >= k }[m[1]];
        const hits = xs.map(test);
        expect(hits.filter(Boolean).length).toBeGreaterThanOrEqual(2);
        expect(hits.every(Boolean)).toBe(false);
        want = _.sum(fs.filter((_f, i) => hits[i]));
      } else {
        kinds.all += 1;
        want = _.sum(fs);
      }
      expect(Number(q.answer)).toBe(want);
    }
    expect(kinds.all / SAMPLES).toBeGreaterThan(0.4);
    expect(kinds.cond / SAMPLES).toBeGreaterThan(0.4);
    expect(distinct.size).toBeGreaterThan(SAMPLES * 0.9);
  });

  it('core: total of value x frequency', () => {
    for (let t = 0; t < SAMPLES; t += 1) {
      const q = generateFrequencyTableReading({ difficulty: 'core' });
      parses(q);
      const { xs, fs } = readTable(q.visualization);
      expect(fs.includes(null)).toBe(false);
      expect(Number(q.answer)).toBe(_.sum(xs.map((x, i) => x * fs[i])));
      expect(q.instruction).toMatch(/in total|altogether/);
    }
  });

  it('stretch: recover the withheld frequency from the stated count, then total', () => {
    for (let t = 0; t < SAMPLES; t += 1) {
      const q = generateFrequencyTableReading({ difficulty: 'stretch' });
      parses(q);
      const { xs, fs } = readTable(q.visualization);
      const hidden = fs.indexOf(null);
      expect(fs.filter((f) => f === null)).toHaveLength(1);
      expect(xs[hidden]).not.toBe(0);
      const n = Number(q.instruction.match(/(\d+) (?:students|matches|houses|cars|nests)/)[1]);
      const missing = n - _.sum(fs.filter((f) => f !== null));
      expect(missing).toBeGreaterThanOrEqual(1);
      const full = fs.map((f) => (f === null ? missing : f));
      expect(Number(q.answer)).toBe(_.sum(xs.map((x, i) => x * full[i])));
    }
  });
});

/* ------------------------------------------------------------ bar charts */

const catOf = (context, name) => context.cats.find((c) => c.name === name);
const contextFor = (fig) => {
  const hits = CONTEXTS.filter((c) => c.col === fig.xTitle && fig.bars.every((b) => catOf(c, b.name)));
  expect(hits).toHaveLength(1);
  return hits[0];
};

const checkBars = (fig) => {
  expect(fig.type).toBe('bar-chart');
  fig.bars.forEach((b) => {
    expect(Number.isInteger(b.value)).toBe(true);
    expect(b.value).toBeGreaterThanOrEqual(1);
    expect(b.value).toBeLessThanOrEqual(12);
  });
};

describe('bar-charts', () => {
  it('foundation: how many more, read off the two named bars', () => {
    for (let t = 0; t < SAMPLES; t += 1) {
      const q = generateBarCharts({ difficulty: 'foundation' });
      parses(q);
      checkBars(q.visualization);
      const ctx = contextFor(q.visualization);
      expect(new Set(q.visualization.bars.map((b) => b.value)).size).toBe(q.visualization.bars.length);
      // The two categories, in the order the sentence names them.
      const named = q.visualization.bars
        .map((b) => ({ b, at: q.instruction.indexOf(` ${catOf(ctx, b.name).clause}`) }))
        .filter((h) => h.at >= 0)
        .sort((p, r) => p.at - r.at);
      expect(named).toHaveLength(2);
      const diff = named[0].b.value - named[1].b.value;
      expect(diff).toBeGreaterThan(0);
      expect(Number(q.answer)).toBe(diff);
    }
  });

  it('core: fraction of the total, in its lowest terms', () => {
    const gcd = (a, b) => (b ? gcd(b, a % b) : a);
    for (let t = 0; t < SAMPLES; t += 1) {
      const q = generateBarCharts({ difficulty: 'core' });
      parses(q);
      checkBars(q.visualization);
      const ctx = contextFor(q.visualization);
      const named = q.visualization.bars.filter((b) => q.instruction.endsWith(` ${catOf(ctx, b.name).clause}?`));
      expect(named).toHaveLength(1);
      const total = _.sum(q.visualization.bars.map((b) => b.value));
      const [, num, den] = q.answer.match(/^\\frac\{(\d+)\}\{(\d+)\}$/).map(Number);
      expect(gcd(num, den)).toBe(1);
      expect(num * total).toBe(named[0].value * den);
    }
  });

  it('stretch: mean of the numeric chart, exact to one decimal place', () => {
    const distinct = new Set();
    for (let t = 0; t < SAMPLES; t += 1) {
      const q = generateBarCharts({ difficulty: 'stretch' });
      parses(q);
      checkBars(q.visualization);
      distinct.add(JSON.stringify(q.visualization.bars));
      const xs = q.visualization.bars.map((b) => Number(b.name));
      const fs = q.visualization.bars.map((b) => b.value);
      const mean = _.sum(xs.map((x, i) => x * fs[i])) / _.sum(fs);
      expect(Math.round(mean * 10)).toBeCloseTo(mean * 10, 9);
      expect(Number(q.answer)).toBeCloseTo(mean, 9);
      expect(q.instruction).toMatch(/mean number of/);
    }
    expect(distinct.size).toBeGreaterThan(SAMPLES * 0.9);
  });

  it('declares only bands that differ in shape', () => {
    const shapes = BANDS.map((b) => generateBarCharts({ difficulty: b }).instruction.split('. ')[1].split(' ').slice(0, 3).join(' '));
    expect(new Set(shapes).size).toBe(3);
  });
});
