// Mutation test for the SOHCAHTOA harness. Each operator breaks real
// generator output; the checker must reject every broken copy.
//
// Equivalent mutants are skipped by rule:
// - Find a side's bands nest (a Foundation question is a valid Core or
//   Stretch one, and Stretch may give a whole-number side), so it moves
//   only down to Foundation, and only a question Foundation cannot ask
//   (tan, or a leg given, or a side to 1 d.p.).
// - Find an angle's Foundation (tan, small whole numbers) is a valid Core
//   question, so Foundation moves to Stretch.
// - Moving the angle to the other corner of a triangle whose legs are equal
//   changes nothing.
//
// Run: npx vitest run src/generators/geometry/sohcahtoaGenerators.mutation.test.js

import { describe, expect, it } from 'vitest';
import { generic, bandMove, figureNudge, mutants } from '../harness.check';
import { checkSohcahtoa } from './sohcahtoaGenerators.check';

const swapRatio = { sin: 'cos', cos: 'tan', tan: 'sin' };

const OPS = {
  ...generic('answer nudged', 'a working number nudged', 'the working stops short', 'metadata changed', 'a working line dropped', 'units changed'),
  'a figure label nudged': figureNudge(),
  'moved to another band': (q) => {
    if (q.metadata.topic === 'sohcahtoa-find-angle') return bandMove({ foundation: 'stretch', core: 'stretch', stretch: 'core' })(q);
    if (q.metadata.difficulty === 'foundation') return false;
    const f = q.visualization;
    const foundationShaped = !/tan/.test(q.workingOut) && f.c !== undefined && f.c !== 'x' && !/\./.test(f.c);
    if (foundationShaped) return false;
    return bandMove({ core: 'foundation', stretch: 'foundation' })(q);
  },
  'the angle moved to the other corner': (q) => {
    const f = q.visualization;
    if (f.a !== undefined && f.a === f.b) return false;
    f.angleAt = f.angleAt === 'top' ? 'bottomRight' : 'top';
  },
  'the wrong ratio in the working': (q) => {
    q.workingOut = q.workingOut.replace(/\\text\{(sin|cos|tan)\}/g, (m, r) => `\\text{${swapRatio[r]}}`);
  },
  'the given side moved': (q) => {
    const f = q.visualization;
    const given = ['a', 'b', 'c'].filter((k) => f[k] !== undefined && f[k] !== 'x');
    const free = ['a', 'b', 'c'].filter((k) => f[k] === undefined);
    if (given.length !== 1 || free.length !== 1) return false;
    f[free[0]] = f[given[0]];
    delete f[given[0]];
  },
  'the angle answer rounded to a whole degree': (q) => {
    const m = /^x = (\d+\.\d)\^\\circ$/.exec(q.answer);
    if (!m) return false;
    q.answer = `x = ${Math.round(Number(m[1]))}^\\circ`;
  },
  'the side answer to 2 s.f.': (q) => {
    if (q.metadata.topic !== 'sohcahtoa-find-side') return false;
    q.answer = `x = ${Number(q.answer.slice(4)).toPrecision(2)}`;
  },
  'the answer in radians': (q) => {
    const m = /^x = (\d+\.\d)\^\\circ$/.exec(q.answer);
    if (!m) return false;
    q.answer = `x = ${(Number(m[1]) * Math.PI / 180).toFixed(1)}^\\circ`;
  },
};

describe('SOHCAHTOA mutation test', () => {
  it('rejects every broken copy', () => {
    const tally = mutants({ skills: ['sohcahtoa-find-side', 'sohcahtoa-find-angle'], check: checkSohcahtoa, ops: OPS });
    Object.entries(tally).forEach(([name, r]) => expect(r.survivors.slice(0, 2), name).toEqual([]));
    expect(Object.keys(tally).sort()).toEqual(Object.keys(OPS).sort());
  });
});
