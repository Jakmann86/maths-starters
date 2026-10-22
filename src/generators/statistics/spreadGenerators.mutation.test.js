// Mutation test for the Spread harness. Each operator breaks real generator
// output; the checker must reject every broken copy. Unchanged objects are
// skipped, and so are equivalent mutants — a changed data value that leaves
// the quartiles where they were is still a correct question — ruled out by
// the small quartile function below, written for this file and not shared
// with the checker.
//
// Run: npx vitest run src/generators/statistics/spreadGenerators.mutation.test.js

import { describe, expect, it } from 'vitest';
import _ from 'lodash';
import { generateQuartilesIqr, generateCompareDistributions } from './spreadGenerators';
import { checkQuartiles, checkCompare } from './spreadGenerators.check';

const PER_BAND = 400;
const BANDS = ['foundation', 'core', 'stretch'];

// Haese's quartiles, for deciding equivalence only.
const iqrOf = (xs) => {
  const s = _.sortBy(xs);
  const k = Math.floor(s.length / 2);
  const m = (a) => (a.length % 2 ? a[(a.length - 1) / 2] : (a[a.length / 2 - 1] + a[a.length / 2]) / 2);
  return m(s.slice(s.length - k)) - m(s.slice(0, k));
};
const listOf = (q) => (q.questionMath ? q.questionMath.split(', ').map(Number) : null);
const tableData = (q) => {
  const [xr, fr] = q.visualization.rows;
  return xr.slice(1).flatMap((x, i) => Array(Number(fr[i + 1])).fill(Number(x)));
};

const QUARTILE_OPS = {
  'answer nudged': (q) => { q.answer = String(Number(q.answer) + 1); return true; },
  'answer halved': (q) => { q.answer = String(Number(q.answer) / 2); return true; },
  // A changed value that moves the IQR. One that leaves it alone is an
  // equivalent mutant.
  'one data value changed': (q) => {
    const xs = listOf(q);
    if (!xs) return false;
    const before = iqrOf(xs);
    const i = _.random(0, xs.length - 1);
    xs[i] += 5;
    if (iqrOf(xs) === before) return false;
    q.questionMath = xs.join(', ');
    return true;
  },
  'foundation list shuffled': (q) => {
    if (q.metadata.difficulty !== 'foundation') return false;
    const xs = listOf(q);
    const sh = _.shuffle(xs);
    if (_.isEqual(sh, xs)) return false;
    q.questionMath = sh.join(', ');
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
    const before = iqrOf(tableData(q));
    const fr = q.visualization.rows[1];
    const i = _.random(1, fr.length - 1);
    fr[i] = String(Number(fr[i]) + 4);
    if (iqrOf(tableData(q)) === before) return false;
    return true;
  },
  'working Q1 changed': (q) => {
    q.workingOut = q.workingOut.replace(/Q_1 = ([\d.]+)/, (m, v) => `Q_1 = ${Number(v) + 1}`);
    return true;
  },
};

const firstName = (q) => q.visualization.rows[0][0];
const secondName = (q) => q.visualization.rows[1][0];

const COMPARE_OPS = {
  'the other name given': (q) => {
    const [a, b] = [firstName(q), secondName(q)];
    q.answer = q.answer.split(a).map((part) => part.split(b).join('\u0000')).join(b).split('\u0000').join(a);
    return true;
  },
  'row labels swapped': (q) => {
    const r = q.visualization.rows;
    [r[0][0], r[1][0]] = [r[1][0], r[0][0]];
    return true;
  },
  'a number in the answer nudged': (q) => {
    const m = /(\d+(?:\.\d+)?)/.exec(q.answer);
    if (!m) return false;
    q.answer = q.answer.replace(m[1], String(Number(m[1]) + 1));
    return true;
  },
  // Equivalent when the band's answer still stands, judged by what that
  // answer rests on: Foundation the ranges; Stretch the ranges and IQRs;
  // Core the order of each printed list and the two comparisons it states
  // (whose median is higher, whose IQR is smaller, each by at least 3).
  'a data value changed': (q) => {
    const d = q.metadata.difficulty;
    const med = (s) => (s.length % 2 ? s[(s.length - 1) / 2] : (s[s.length / 2 - 1] + s[s.length / 2]) / 2);
    const stats = () => {
      const rows = q.visualization.rows.map((r) => r.slice(1).map(Number));
      if (d === 'foundation') return rows.map((xs) => _.max(xs) - _.min(xs));
      if (d === 'stretch') return rows.map((xs) => [_.max(xs) - _.min(xs), iqrOf(xs)]);
      const [x, y] = rows;
      const ordered = rows.every((xs) => _.isEqual(xs, _.sortBy(xs)));
      const dm = med(_.sortBy(x)) - med(_.sortBy(y)), di = iqrOf(x) - iqrOf(y);
      return [ordered, Math.sign(dm), Math.sign(di), Math.abs(dm) >= 3, Math.abs(di) >= 3];
    };
    const before = stats();
    const row = q.visualization.rows[_.random(0, 1)];
    const i = _.random(1, row.length - 1);
    row[i] = String(Number(row[i]) + 7);
    return !_.isEqual(stats(), before);
  },
  'core: one row sorted backwards': (q) => {
    if (q.metadata.difficulty !== 'core') return false;
    const row = q.visualization.rows[0];
    row.splice(1, row.length - 1, ...row.slice(1).reverse());
    return true;
  },
  'stretch: the explanation names another score': (q) => {
    const m = /one score of (\d+) widens/.exec(q.answer);
    if (!m) return false;
    q.answer = q.answer.replace(`one score of ${m[1]}`, `one score of ${Number(m[1]) + 9}`);
    return true;
  },
  'working range wrong': (q) => {
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

describe('spread harness, mutation test', () => {
  it('quartiles-iqr: rejects every mutated question', () => mutate(generateQuartilesIqr, checkQuartiles, QUARTILE_OPS), 120000);
  it('compare-distributions: rejects every mutated question', () => mutate(generateCompareDistributions, checkCompare, COMPARE_OPS), 120000);
});
