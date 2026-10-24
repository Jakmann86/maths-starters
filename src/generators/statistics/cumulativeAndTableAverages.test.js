// Substitute-the-answer-back checks for cumulative-frequency-table and
// table-averages. Every answer is recomputed from the table's printed cells
// and the instruction text — never from the generator's own variables.
//
// Run: npx vitest run src/generators/statistics/cumulativeAndTableAverages.test.js

import { describe, expect, it } from 'vitest';
import _ from 'lodash';
import { generateCumulativeFrequencyTable, generateTableAverages } from './frequencyTableGenerators';
import katex from 'katex';

const rendersInKatex = (line) => {
  expect(() => katex.renderToString(line, { throwOnError: true }), line).not.toThrow();
};

const SAMPLES = 4000;

const parses = (q) => {
  [q.answer, q.workingOut, q.questionMath].filter(Boolean).join('\n').split('\n')
    .forEach(rendersInKatex);
  expect([q.instruction, q.answer, q.workingOut].join(' ')).not.toMatch(/\\n|undefined|NaN|null/);
};

/** A grouped row label "10 ≤ t < 20" as [lo, hi, letter]. */
const readClass = (cell) => {
  const m = cell.match(/^(\d+) ≤ ([a-z]) < (\d+)$/);
  expect(m, cell).not.toBeNull();
  return { lo: Number(m[1]), v: m[2], hi: Number(m[3]) };
};

const num = (s) => (s === '' || s === '?' ? null : Number(s));

/* ------------------------------------------------------ cumulative tables */

describe('cumulative-frequency-table', () => {
  const check = (band) => {
    const distinct = new Set();
    const hidden = { f: 0, cf: 0 };
    for (let t = 0; t < SAMPLES; t += 1) {
      const q = generateCumulativeFrequencyTable({ difficulty: band });
      parses(q);
      const fig = q.visualization;
      distinct.add(JSON.stringify(fig.rows));
      expect(fig.rows[0].slice(1)).toEqual(['Frequency', 'Cumulative frequency']);
      const body = fig.rows.slice(1);
      const sol = fig.solution.slice(1);
      expect(sol).toHaveLength(body.length);

      // Rebuild both columns from the printed cells alone, by propagating
      // the two relations cf[i] = cf[i-1] + f[i] up and down until nothing
      // changes. Every cell must be reached.
      const fs = body.map((r) => num(r[1]));
      const cfs = body.map((r) => num(r[2]));
      const cfAt = (i) => (i < 0 ? 0 : cfs[i]);
      for (let changed = true; changed;) {
        changed = false;
        body.forEach((_r, i) => {
          if (fs[i] === null && cfs[i] !== null && cfAt(i - 1) !== null) { fs[i] = cfs[i] - cfAt(i - 1); changed = true; }
          if (cfs[i] === null && fs[i] !== null && cfAt(i - 1) !== null) { cfs[i] = cfAt(i - 1) + fs[i]; changed = true; }
          if (i > 0 && cfs[i - 1] === null && fs[i] !== null && cfs[i] !== null) { cfs[i - 1] = cfs[i] - fs[i]; changed = true; }
        });
      }
      body.forEach((r, i) => {
        expect(fs[i], JSON.stringify(body)).not.toBeNull();
        expect(cfs[i], JSON.stringify(body)).not.toBeNull();
        if (r[1] === '') hidden.f += 1;
        if (r[2] === '') hidden.cf += 1;
        // A blank is filled on reveal; a printed cell is not.
        expect(sol[i][1]).toBe(r[1] === '' ? String(fs[i]) : '');
        expect(sol[i][2]).toBe(r[2] === '' ? String(cfs[i]) : '');
      });
      fs.forEach((f) => expect(f).toBeGreaterThanOrEqual(1));
      cfs.forEach((c, i) => expect(c).toBe(_.sum(fs.slice(0, i + 1))));
      expect(q.answer.split('\n').pop()).toBe(`\\text{cumulative: } ${cfs.join(', ')}`);

      if (band === 'foundation') {
        const xs = body.map((r) => Number(r[0]));
        xs.forEach((x, i) => { if (i) expect(x).toBe(xs[i - 1] + 1); });
      } else {
        const cls = body.map((r) => readClass(r[0]));
        cls.forEach((c, i) => { if (i) expect(c.lo).toBe(cls[i - 1].hi); });
        expect(new Set(cls.map((c) => c.hi - c.lo)).size).toBe(1);
      }
      if (band === 'foundation') {
        expect(body.every((r) => r[1] !== '' && r[2] === '')).toBe(true);
      } else {
        const fGaps = body.map((r, i) => (r[1] === '' ? i : -1)).filter((i) => i >= 0);
        expect(fGaps.some((i) => i > 0)).toBe(true);
        expect(body.some((r) => r[2] === '')).toBe(true);
        const empty = body.filter((r) => r[1] === '' && r[2] === '');
        const full = body.filter((r) => r[1] !== '' && r[2] !== '');
        expect(full).toHaveLength(1);
        expect(empty).toHaveLength(band === 'stretch' ? 1 : 0);
        // Stretch's empty row cannot be reached working downwards alone.
        if (band === 'stretch') {
          const e = body.indexOf(empty[0]);
          expect(body[e + 1]).toBe(full[0]);
        }
      }
    }
    return { distinct: distinct.size, hidden };
  };

  it('foundation: running totals down a discrete table', () => {
    const { distinct } = check('foundation');
    expect(distinct).toBeGreaterThan(SAMPLES * 0.9);
  }, 60000);
  it('core: gaps in both columns, always solvable top to bottom', () => {
    const { distinct, hidden } = check('core');
    expect(distinct).toBeGreaterThan(SAMPLES * 0.9);
    // Both kinds of gap turn up in quantity, neither one swamping the other.
    expect(hidden.f / (hidden.f + hidden.cf)).toBeGreaterThan(0.35);
    expect(hidden.f / (hidden.f + hidden.cf)).toBeLessThan(0.65);
  }, 60000);
  it('stretch: one row empty, recovered from the whole row below', () => {
    const { distinct, hidden } = check('stretch');
    expect(distinct).toBeGreaterThan(SAMPLES * 0.9);
    // Both kinds of gap turn up in quantity, neither one swamping the other.
    expect(hidden.f / (hidden.f + hidden.cf)).toBeGreaterThan(0.35);
    expect(hidden.f / (hidden.f + hidden.cf)).toBeLessThan(0.65);
  }, 60000);
});

/* -------------------------------------------- mean, mode, median: 3 parts */

const parts = (answer) => answer.split('\n');

describe('table-averages', () => {
  // Foundation's rejection loop (whole mean, one mode, three distinct
  // answers) runs a few ms a question, so 4000 of them need longer.
  it('foundation: mean, mode and median of a discrete table', () => {
    const distinct = new Set();
    for (let t = 0; t < SAMPLES; t += 1) {
      const q = generateTableAverages({ difficulty: 'foundation' });
      parses(q);
      distinct.add(JSON.stringify(q.visualization.rows));
      expect(q.instruction).toMatch(/Find:$/);
      expect(q.questionParts).toEqual(['(a) the mean', '(b) the mode', '(c) the median']);
      const body = q.visualization.rows.slice(1);
      const xs = body.map((r) => Number(r[0]));
      const fs = body.map((r) => Number(r[1]));
      const values = xs.flatMap((x, i) => _.times(fs[i], () => x));
      const n = values.length;
      const mean = _.sum(values) / n;
      const top = Math.max(...fs);
      expect(fs.filter((f) => f === top)).toHaveLength(1);
      const med = (values[Math.floor((n - 1) / 2)] + values[Math.ceil((n - 1) / 2)]) / 2;
      expect(Number.isInteger(mean)).toBe(true);
      expect(Number.isInteger(med)).toBe(true);
      expect(parts(q.answer)).toEqual([
        `\\text{(a) mean} = ${mean}`,
        `\\text{(b) mode} = ${xs[fs.indexOf(top)]}`,
        `\\text{(c) median} = ${med}`,
      ]);
      expect(new Set([mean, xs[fs.indexOf(top)], med]).size).toBe(3);
    }
    expect(distinct.size).toBeGreaterThan(SAMPLES * 0.8);
  }, 60000);

  const grouped = (band) => {
    const distinct = new Set();
    for (let t = 0; t < SAMPLES; t += 1) {
      const q = generateTableAverages({ difficulty: band });
      parses(q);
      distinct.add(q.instruction + JSON.stringify(q.visualization.rows));
      expect(q.instruction).toMatch(/Find:$/);
      expect(q.questionParts).toEqual(['(a) an estimate of the mean', '(b) the modal class', '(c) the median class']);
      const body = q.visualization.rows.slice(1);
      const cls = body.map((r) => readClass(r[0]));
      cls.forEach((c, i) => { if (i) expect(c.lo).toBe(cls[i - 1].hi); });
      let fs = body.map((r) => num(r[1]));
      const gaps = fs.filter((f) => f === null).length;
      if (band === 'stretch') {
        expect(gaps).toBe(1);
        const n = Number(q.instruction.match(/of (\d+) |the time (\d+) |how far (\d+) /).slice(1).find(Boolean));
        const missing = n - _.sum(fs.filter((f) => f !== null));
        expect(missing).toBeGreaterThanOrEqual(2);
        fs = fs.map((f) => f ?? missing);
      } else {
        expect(gaps).toBe(0);
        expect(q.instruction).not.toMatch(/\d/);
      }
      const n = _.sum(fs);
      const mids = cls.map((c) => (c.lo + c.hi) / 2);
      const mean = _.sum(mids.map((m, i) => m * fs[i])) / n;
      expect(Math.round(mean * 10)).toBeCloseTo(mean * 10, 9);
      const top = Math.max(...fs);
      expect(fs.filter((f) => f === top)).toHaveLength(1);
      const mc = cls[fs.indexOf(top)];
      // The class holding both middle values (they must share one).
      const where = (k) => { let run = 0; return fs.findIndex((f) => (run += f) >= k); };
      const a = where(Math.floor((n + 1) / 2));
      expect(where(Math.ceil((n + 1) / 2))).toBe(a);
      const md = cls[a];
      expect(md).not.toEqual(mc);
      const [ans1, ans2, ans3] = parts(q.answer);
      expect(Number(ans1.match(/= ([\d.]+)$/)[1])).toBeCloseTo(mean, 9);
      expect(ans2).toBe(`\\text{(b) modal class: } ${mc.lo} \\le ${mc.v} < ${mc.hi}`);
      expect(ans3).toBe(`\\text{(c) median class: } ${md.lo} \\le ${md.v} < ${md.hi}`);
    }
    return distinct.size;
  };

  it('core: estimated mean, modal class, median class', () => {
    expect(grouped('core')).toBeGreaterThan(SAMPLES * 0.9);
  });
  it('stretch: the same after recovering a withheld frequency', () => {
    expect(grouped('stretch')).toBeGreaterThan(SAMPLES * 0.9);
  });
});
