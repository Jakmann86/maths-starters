// Mutation test for the Pythagoras harness. Each operator breaks real
// generator output; the checker must reject every broken copy. Core and
// Stretch differ only in the answer's form (an exact surd, or 3 s.f.), and a
// moved question is killed on that form.
//
// Run: npx vitest run src/generators/geometry/pythagorasGenerators.mutation.test.js

import { describe, expect, it } from 'vitest';
import { generic, bandMove, figureNudge, mutants } from '../harness.check';
import { checkPythagoras } from './pythagorasGenerators.check';

const OPS = {
  ...generic('answer nudged', 'a working number nudged', 'the working stops short', 'metadata changed', 'a working line dropped', 'units changed'),
  'a figure label nudged': figureNudge(),
  'moved to another band': bandMove(),
  'the other leg made x': (q) => {
    const f = q.visualization;
    if (f.unknown !== 'a' && f.unknown !== 'b') return false;
    const other = f.unknown === 'a' ? 'b' : 'a';
    [f.a, f.b] = other === 'a' ? ['x', f.a] : [f.b, 'x'];
  },
  'the hypotenuse given and a leg asked': (q) => {
    const f = q.visualization;
    if (f.c !== 'x') return false;
    f.c = f.a; f.a = 'x';
  },
  'the answer as a decimal at Core': (q) => {
    const m = /^x = \\sqrt\{(\d+)\}$/.exec(q.answer);
    if (!m) return false;
    q.answer = `x = ${Math.sqrt(Number(m[1])).toPrecision(3)}`;
  },
  'the answer to 2 s.f.': (q) => {
    if (q.metadata.difficulty !== 'stretch') return false;
    q.answer = `x = ${Number(q.answer.slice(4)).toPrecision(2)}`;
  },
  'the base halved twice': (q) => {
    const f = q.visualization;
    if (f.type !== 'isosceles-triangle') return false;
    f.base = `${Number(f.base.split(' ')[0]) / 2} cm`;
  },
};

describe('Pythagoras mutation test', () => {
  it('rejects every broken copy', () => {
    const tally = mutants({ skills: ['pythagoras-hypotenuse', 'pythagoras-missing-side', 'pythagoras-isosceles'], check: checkPythagoras, ops: OPS });
    Object.entries(tally).forEach(([name, r]) => expect(r.survivors.slice(0, 2), name).toEqual([]));
    expect(Object.keys(tally).sort()).toEqual(Object.keys(OPS).sort());
  });
});
