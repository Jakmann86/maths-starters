// Mutation test for the modal-class, median-class and stem-and-leaf harness. Each operator
// breaks real generator output; the checker must reject every broken copy.
//
// Equivalent mutants are avoided by aiming each operator where it must
// change the answer: the tallest class is tied with the next, the range's
// largest leaf is raised, every copy of the mode is moved, and a key is
// moved to a leaf the plot lacks. One is skipped by rule: a changed middle
// leaf that leaves the median where it was, because the value repeats.
//
// Run: npx vitest run src/generators/statistics/dataDisplayGenerators.mutation.test.js

import { describe, expect, it } from 'vitest';
import _ from 'lodash';
import { generic, bandMove, mutants } from '../harness.check';
import { checkDataDisplay } from './dataDisplayGenerators.check';

const OPS = {
  ...generic('answer nudged', 'a working number nudged', 'the working stops short', 'metadata changed', 'a working line dropped'),
  'moved to another band': bandMove(),
  'the tallest class tied': (q) => {
    const f = q.visualization;
    if (f.type !== 'table' || q.metadata.difficulty === 'stretch' || q.metadata.topic === 'median-class') return false;
    const fs = f.rows.slice(1).map((r) => Number(r[1]));
    const top = Math.max(...fs);
    const second = Math.max(...fs.filter((v) => v !== top));
    f.rows[fs.indexOf(top) + 1][1] = String(second);
  },
  'a class interval changed': (q) => {
    const f = q.visualization;
    if (f.type !== 'table') return false;
    const r = _.random(1, f.rows.length - 1);
    f.rows[r][0] = f.rows[r][0].replace(/(\d+)/, (d) => String(Number(d) + 1));
  },
  'the answer one class along': (q) => {
    if (!/\\le x </.test(q.answer)) return false;
    const m = /^(\d+) \\le x < (\d+)$/.exec(q.answer);
    const w = Number(m[2]) - Number(m[1]);
    q.answer = `${Number(m[1]) + w} \\le x < ${Number(m[2]) + w}`;
  },
  'a leaf changed': (q) => {
    const f = q.visualization;
    if (f.type !== 'stem-leaf') return false;
    // Aimed at the values the answer depends on, so the answer must move:
    // the largest raised (or the smallest lowered) for a range, every copy
    // of the mode moved, the middle value for a median, any value for a mean.
    const last = f.rows[f.rows.length - 1].leaves;
    const first = f.rows[0].leaves;
    if (q.instruction === 'Find the range') {
      if (last[last.length - 1] < 9) last[last.length - 1] += 1; else first[0] -= 1;
      return undefined;
    }
    if (q.instruction === 'Write down the mode') {
      const stem = Math.floor(Number(q.answer) / 10), leaf = Number(q.answer) % 10;
      const row = f.rows.find((r) => r.stem === stem);
      row.leaves = row.leaves.map((l) => (l === leaf ? (leaf + 5) % 10 : l)).sort((x, y) => x - y);
      return undefined;
    }
    const cells = f.rows.flatMap((r, i) => r.leaves.map((_l, j) => [i, j]));
    const [i, j] = q.instruction === 'Find the median' ? cells[Math.floor(cells.length / 2)] : _.sample(cells);
    const leaves = f.rows[i].leaves;
    leaves[j] = leaves[j] === 9 ? 0 : 9;
    leaves.sort((x, y) => x - y);
    // Equivalent by rule: a change that happens to leave the median where
    // it was (a repeated middle value) is skipped.
    if (q.instruction === 'Find the median') {
      const v = f.rows.flatMap((r) => r.leaves.map((l) => r.stem * 10 + l));
      const n = v.length;
      const m = n % 2 ? v[(n - 1) / 2] : (v[n / 2 - 1] + v[n / 2]) / 2;
      if (String(m) === q.answer) return false;
    }
    return undefined;
  },
  'the key not on the plot': (q) => {
    const f = q.visualization;
    if (f.type !== 'stem-leaf') return false;
    const r = f.rows.find((row) => row.stem === f.keyStem);
    const missing = _.range(10).find((l) => !r.leaves.includes(l));
    if (missing === undefined) return false;
    f.keyLeaf = missing;
  },
  'a stem skipped': (q) => {
    const f = q.visualization;
    if (f.type !== 'stem-leaf') return false;
    f.rows[f.rows.length - 1].stem += 1;
  },
};

describe('Data display mutation test', () => {
  it('rejects every broken copy', () => {
    const tally = mutants({ skills: ['modal-class', 'median-class', 'stem-and-leaf-averages'], check: checkDataDisplay, ops: OPS });
    Object.entries(tally).forEach(([name, r]) => expect(r.survivors.slice(0, 2), name).toEqual([]));
    expect(Object.keys(tally).sort()).toEqual(Object.keys(OPS).sort());
  });
});
