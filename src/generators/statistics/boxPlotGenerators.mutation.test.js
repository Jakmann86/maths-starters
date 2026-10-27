// Mutation test for the box plot harness. Each operator breaks real
// generator output; the checker must reject every broken copy. Unchanged
// objects are skipped, and so are equivalent mutants — a changed data value
// that leaves the five-number summary where it was is still a correct
// question — ruled out by the small summary function below, written for this
// file and not shared with the checker.
//
// Run: npx vitest run src/generators/statistics/boxPlotGenerators.mutation.test.js

import { describe, expect, it } from 'vitest';
import _ from 'lodash';
import { generateFiveNumberSummary, generateBoxPlotReading } from './boxPlotGenerators';
import { checkSummary, checkReading } from './boxPlotGenerators.check';

const PER_BAND = 400;
const BANDS = ['foundation', 'core', 'stretch'];

// Haese's five-number summary, for deciding equivalence only.
const summaryOf = (xs) => {
  const s = _.sortBy(xs);
  const k = Math.floor(s.length / 2);
  const m = (a) => (a.length % 2 ? a[(a.length - 1) / 2] : (a[a.length / 2 - 1] + a[a.length / 2]) / 2);
  return [s[0], m(s.slice(0, k)), m(s), m(s.slice(s.length - k)), s.at(-1)];
};
const listOf = (q) => (q.questionMath ? q.questionMath.split(', ').map(Number) : null);
const tableData = (q) => {
  const [xr, fr] = q.visualization.rows;
  return xr.slice(1).flatMap((x, i) => Array(Number(fr[i + 1])).fill(Number(x)));
};

const SUMMARY_OPS = {
  'answer Q1 nudged': (q) => { q.answer = q.answer.replace(/Q_1 = ([\d.]+)/, (m, v) => `Q_1 = ${Number(v) + 1}`); return true; },
  'answer min and max swapped': (q) => {
    q.answer = q.answer.replace(/min\} = ([\d.]+),\\ \\text\{max\} = ([\d.]+)/, (m, a, b) => `min} = ${b},\\ \\text{max} = ${a}`);
    return true;
  },
  'one data value changed': (q) => {
    const xs = listOf(q);
    if (!xs) return false;
    const before = summaryOf(xs);
    xs[_.random(0, xs.length - 1)] += 3;
    if (_.isEqual(summaryOf(xs), before)) return false;
    q.questionMath = xs.join(', ');
    return true;
  },
  'foundation list shuffled': (q) => {
    if (q.metadata.difficulty !== 'foundation') return false;
    q.questionMath = _.shuffle(listOf(q)).join(', ');
    return true;
  },
  'core list sorted': (q) => {
    if (q.metadata.difficulty !== 'core') return false;
    q.questionMath = _.sortBy(listOf(q)).join(', ');
    return true;
  },
  'count in the sentence changed': (q) => {
    if (!q.questionMath) return false;
    q.instruction = q.instruction.replace(/ (\d+) /, (m, n) => ` ${Number(n) + 1} `);
    return true;
  },
  'a frequency changed': (q) => {
    if (q.visualization?.type !== 'table') return false;
    const before = summaryOf(tableData(q));
    const fr = q.visualization.rows[1];
    const i = _.random(1, fr.length - 1);
    fr[i] = String(Number(fr[i]) + 4);
    return !_.isEqual(summaryOf(tableData(q)), before);
  },
  'drawn plot disagrees': (q) => {
    if (q.visualization?.type !== 'box-plot') return false;
    q.visualization.plots[0].q3 += 1;
    return true;
  },
  'plot shown before reveal': (q) => {
    if (q.visualization?.type !== 'box-plot') return false;
    delete q.visualization.reveal;
    return true;
  },
  'working Q3 changed': (q) => {
    q.workingOut = q.workingOut.replace(/Q_3 = ([\d.]+)/, (m, v) => `Q_3 = ${Number(v) + 1}`);
    return true;
  },
};

// The value a reading answer rests on: the median, the top whisker, the top
// of the box, the threshold quartile, or the first plot's median.
const restsOn = (q) => {
  const d = q.metadata.difficulty;
  if (d === 'stretch') return 'q2';
  if (d === 'core') {
    const v = Number(/than (\d+)/.exec(q.instruction)[1]);
    return ['q1', 'q2', 'q3'].find((k) => q.visualization.plots[0][k] === v);
  }
  if (q.instruction.endsWith('median.')) return 'q2';
  return q.instruction.endsWith(' range.') && !q.instruction.includes('interquartile') ? 'max' : 'q3';
};

const READING_OPS = {
  'answer nudged': (q) => {
    const m = /(\d+)/.exec(q.answer);
    q.answer = q.answer.replace(m[1], String(Number(m[1]) + 1));
    return true;
  },
  'the value the answer rests on moved': (q) => {
    const f = q.visualization;
    f.plots[0][restsOn(q)] += f.axis.step;
    return true;
  },
  'a value moved off the grid': (q) => {
    const p = q.visualization.plots[0];
    const k = _.sample(['min', 'q1', 'q2', 'q3', 'max']);
    p[k] += q.visualization.axis.step / 2;
    return true;
  },
  'reading lines dropped': (q) => {
    if (!q.visualization.marks) return false;
    delete q.visualization.marks;
    return true;
  },
  'core: group size changed': (q) => {
    if (q.metadata.difficulty !== 'core') return false;
    q.instruction = q.instruction.replace(/ of (\d+) /, (m, n) => ` of ${Number(n) + 4} `);
    return true;
  },
  'core: side flipped': (q) => {
    if (q.metadata.difficulty !== 'core') return false;
    const flip = { more: 'fewer', fewer: 'more', longer: 'less', less: 'longer', taller: 'shorter', shorter: 'taller', older: 'younger', younger: 'older' };
    q.instruction = q.instruction.replace(/\b(more|fewer|longer|less|taller|shorter|older|younger) than/, (m, w) => `${flip[w]} than`);
    return true;
  },
  'stretch: names swapped': (q) => {
    if (q.metadata.difficulty !== 'stretch') return false;
    const [a, b] = q.visualization.plots;
    [a.name, b.name] = [b.name, a.name];
    return true;
  },
  'stretch: the trap removed': (q) => {
    if (q.metadata.difficulty !== 'stretch') return false;
    const [a, b] = q.visualization.plots;
    const steady = a.q3 - a.q1 < b.q3 - b.q1 ? a : b;
    steady.min = steady.q1 - q.visualization.axis.step;
    steady.max = steady.q3 + q.visualization.axis.step;
    return true;
  },
  'working changed': (q) => {
    q.workingOut = q.workingOut.replace(/= (\d+)/, (m, v) => `= ${Number(v) + 1}`);
    return true;
  },
};

const mutate = (gen, check, ops) => {
  const tally = {};
  const why = {};
  const survivors = [];
  BANDS.forEach((difficulty) => {
    for (let t = 0; t < PER_BAND; t += 1) {
      const original = gen({ difficulty });
      check(original, difficulty);
      Object.entries(ops).forEach(([name, op]) => {
        const q = _.cloneDeep(original);
        if (!op(q) || _.isEqual(q, original)) return;
        tally[name] ??= { tried: 0, killed: 0 };
        tally[name].tried += 1;
        try {
          check(q, difficulty);
          survivors.push({ name, difficulty, q });
        } catch (e) {
          tally[name].killed += 1;
          (why[name] ??= new Set()).add(e.message.split('\n')[0].replace(/[\d.]+/g, '#').slice(0, 60));
        }
      });
    }
  });
  Object.entries(tally).forEach(([name, { tried, killed }]) => {
    process.stdout.write(`${name.padEnd(44)} ${killed}/${tried} killed   [${[...why[name] ?? []].slice(0, 2).join(' | ')}]\n`);
  });
  survivors.slice(0, 3).forEach((s) => process.stdout.write(`SURVIVOR ${s.name} (${s.difficulty}): ${JSON.stringify(s.q).slice(0, 500)}\n`));
  expect(Object.keys(tally).sort()).toEqual(Object.keys(ops).sort());
  expect(survivors).toHaveLength(0);
};

describe('box plot harness, mutation test', () => {
  it('five-number-summary: rejects every mutated question', () => mutate(generateFiveNumberSummary, checkSummary, SUMMARY_OPS), 120000);
  it('box-plot-reading: rejects every mutated question', () => mutate(generateBoxPlotReading, checkReading, READING_OPS), 120000);
});
