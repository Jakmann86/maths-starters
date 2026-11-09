// Mutation test for the area harness. Each operator breaks real generator
// output; the checker must reject every broken copy.
//
// A sloping side is a distractor, so nudging it by one usually leaves a
// valid question: the figure-nudge operator leaves it alone, and a separate
// operator makes it impossible instead (no longer than the height, or
// leaning past the base).
//
// Run: npx vitest run src/generators/geometry/areaGenerators.mutation.test.js

import { describe, expect, it } from 'vitest';
import { generic, bandMove, figureNudge, mutants } from '../harness.check';
import { checkArea } from './areaGenerators.check';

const num = (label) => Number(label.split(' ')[0]);
const unit = (label) => label.split(' ')[1];

const OPS = {
  ...generic('answer nudged', 'a working number nudged', 'the working stops short', 'metadata changed', 'a working line dropped', 'units changed'),
  'a figure label nudged': figureNudge(['slant']),
  'moved to another band': bandMove(),
  'the sloping side no longer than the height': (q) => {
    const f = q.visualization;
    if (!f.slant) return false;
    f.slant = `${num(f.h)} ${unit(f.slant)}`;
  },
  'the sloping side leaning past the base': (q) => {
    const f = q.visualization;
    if (!f.slant) return false;
    const room = f.type === 'trapezium-area' ? num(f.b) - num(f.a) : num(f.b);
    f.slant = `${Math.ceil(Math.sqrt(num(f.h) ** 2 + room ** 2)) + 1} ${unit(f.slant)}`;
  },
  'a unit changed on one label': (q) => {
    const f = q.visualization;
    const k = Object.keys(f).find((key) => typeof f[key] === 'string' && / (cm|m|mm)/.test(f[key]));
    if (!k) return false;
    f[k] = f[k].replace(/ (cm|mm|m)/, (m, u) => ` ${u === 'cm' ? 'mm' : 'cm'}`);
  },
  'the distractor used': (q) => {
    const f = q.visualization;
    if (!f.slant || !f.b) return false;
    const h = num(f.h);
    const s = num(f.slant);
    q.answer = String((Number(q.answer) / h) * s);
  },
  'the unknown not coloured': (q) => {
    if (!q.visualization.unknown) return false;
    delete q.visualization.unknown;
  },
};

describe('Area mutation test', () => {
  it('rejects every broken copy', () => {
    const tally = mutants({ skills: ['area-rectangle', 'area-triangle', 'area-parallelogram', 'area-trapezium', 'area-kite'], check: checkArea, ops: OPS, perBand: 100 });
    Object.entries(tally).forEach(([name, r]) => expect(r.survivors.slice(0, 2), name).toEqual([]));
    expect(Object.keys(tally).sort()).toEqual(Object.keys(OPS).sort());
  });
});
