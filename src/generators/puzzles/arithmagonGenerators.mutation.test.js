// Mutation test for the arithmagon and number-wall harness. Each operator
// breaks real generator output; the checker must reject every broken copy.
//
// Equivalent mutants are skipped by rule: two boxes swapped when they hold
// the same number, and x moved to the mirror-image brick of a wall (the
// wall is symmetric, so the top is unchanged).
//
// Run: npx vitest run src/generators/puzzles/arithmagonGenerators.mutation.test.js

import { describe, expect, it } from 'vitest';
import _ from 'lodash';
import { generic, bandMove, bump, mutants } from '../harness.check';
import { checkArithmagon } from './arithmagonGenerators.check';

const OPS = {
  ...generic('answer nudged', 'a working number nudged', 'the working stops short', 'metadata changed', 'a working line dropped'),
  'moved to another band': bandMove(),
  'a box nudged': (q) => {
    const e = q.visualization.edges;
    if (!e) return false;
    const i = _.random(0, 2);
    e[i] = String(Number(e[i]) + 1);
  },
  'two boxes swapped': (q) => {
    const e = q.visualization.edges;
    if (!e) return false;
    const [i, j] = _.sampleSize([0, 1, 2], 2);
    if (e[i] === e[j]) return false;
    [e[i], e[j]] = [e[j], e[i]];
  },
  'sum and product swapped': (q) => {
    const f = q.visualization;
    if (!f.op) return false;
    f.op = f.op === '+' ? '×' : '+';
  },
  'two circles swapped in the answer': (q) => {
    const m = /^a = (-?\d+),\\ b = (-?\d+),\\ c = (-?\d+)$/.exec(q.answer);
    if (!m || m[1] === m[2]) return false;
    q.answer = `a = ${m[2]},\\ b = ${m[1]},\\ c = ${m[3]}`;
  },
  'a brick nudged': (q) => {
    const rows = q.visualization.rows;
    if (!rows) return false;
    const cells = rows.flatMap((r, i) => r.map((c, j) => (/^\d+$/.test(c) ? [i, j] : null)).filter(Boolean));
    const [i, j] = _.sample(cells);
    rows[i][j] = bump(rows[i][j]);
  },
  'x moved to another brick': (q) => {
    const f = q.visualization;
    if (!f.rows) return false;
    const [[r, c]] = f.unknown;
    const row = f.rows[r];
    const k = row.findIndex((v, idx) => idx !== c && idx !== row.length - 1 - c && /^\d+$/.test(v));
    if (k < 0) return false;
    [row[c], row[k]] = [row[k], row[c]];
    f.unknown = [[r, k]];
  },
};

describe('Arithmagon and number wall mutation test', () => {
  it('rejects every broken copy', () => {
    const tally = mutants({ skills: ['arithmagon', 'number-wall'], check: checkArithmagon, ops: OPS });
    Object.entries(tally).forEach(([name, r]) => expect(r.survivors.slice(0, 2), name).toEqual([]));
    expect(Object.keys(tally).sort()).toEqual(Object.keys(OPS).sort());
  });
});
