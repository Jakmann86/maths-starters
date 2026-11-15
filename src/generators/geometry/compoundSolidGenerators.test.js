// Substitute-the-answer-back harness for compound solids, with its mutation
// test: compound-volume and compound-surface-area. The checker
// (compoundSolidGenerators.check.js) reads every length off the figure and
// works the solid out part by part.
//
// Run: npx vitest run src/generators/geometry/compoundSolidGenerators.test.js

import { describe, expect, it } from 'vitest';
import { BANDS, sample, report, mutants, generic, bandMove } from '../harness.check';
import { checkCompoundVolume, checkCompoundSurfaceArea } from './compoundSolidGenerators.check';
import { skillsInTopic } from '../../curriculum/skills';

const N = 6000;
const CHECKS = { 'compound-volume': checkCompoundVolume, 'compound-surface-area': checkCompoundSurfaceArea };
const check = (q, band) => CHECKS[q.metadata?.topic]?.(q, band) ?? (() => { throw new Error('topic'); })();

const KINDS = {
  'compound-volume': {
    foundation: ['cylinder-cylinder'],
    core: ['cone-hemisphere', 'cylinder-cone', 'cylinder-hemisphere'],
    stretch: ['tube from radii', 'tube from the wall'],
  },
  'compound-surface-area': { foundation: ['3 s.f.', 'exact'], core: ['3 s.f.', 'exact'], stretch: ['3 s.f.', 'exact'] },
};

// Distinct questions in 6,000. A cone's slant height has to be whole, so
// its radius and height come from the Pythagorean triples with legs up to
// 24, a dozen or so pairs: with the cylinder's height, the unit and the
// answer form, a few thousand. A hemisphere's two thirds of r cubed is a
// whole multiple of π only when r is a multiple of 3, which keeps Core
// volume lower still. A hemisphere on a cylinder has two lengths, so its
// surface area, with the unit and the form, has about two thousand.
const FLOOR = {
  'compound-volume': { foundation: 5000, core: 1800, stretch: 4000 },
  'compound-surface-area': { foundation: 2000, core: 1800, stretch: 2000 },
};

describe('compound solids', () => {
  Object.keys(CHECKS).forEach((id) => BANDS.forEach((band) => {
    it(`${id} ${band}: the answer follows from the figure`, () => {
      const r = sample(id, band, check, N);
      report(id, band, r, N);
      expect(Object.keys(r.mix).sort()).toEqual([...KINDS[id][band]].sort());
      expect(r.distinct).toBeGreaterThanOrEqual(FLOOR[id][band]);
    });
  }));

  it('sits in Compound shapes, 2D first then 3D', () => {
    expect(skillsInTopic('Compound shapes')).toEqual([
      'perimeter-compound', 'area-compound', 'compound-volume', 'compound-surface-area',
    ]);
  });

  it('rejects every broken copy', () => {
    const nudge = (s) => s.replace(/^(\d+)/, (d) => String(Number(d) + 1));
    const ops = {
      ...generic('answer nudged', 'a working number nudged', 'the working stops short', 'a working line dropped', 'metadata changed'),
      'a label nudged': (q) => {
        const f = q.visualization;
        const k = ['h', 'r', 'coneH', 'slant', 'h2', 'r2', 'inner', 'thickness', 'diameter'].find((key) => f[key] !== undefined && Math.random() < 0.5)
          ?? ['h', 'r', 'diameter'].find((key) => f[key] !== undefined);
        f[k] = nudge(f[k]);
      },
      'the answer form swapped': (q) => {
        q.instruction = q.instruction.includes('π')
          ? q.instruction.replace('Leave your answer in terms of π', 'Give your answer to 3 significant figures')
          : q.instruction.replace('Give your answer to 3 significant figures', 'Leave your answer in terms of π');
      },
      'the shape changed': (q) => {
        const swap = { 'cylinder-cone': 'cylinder-hemisphere', 'cylinder-hemisphere': 'cylinder-cone', 'cone-hemisphere': 'cylinder-cone', 'cylinder-cylinder': 'tube', tube: 'cylinder-cylinder' };
        q.visualization.shape = swap[q.visualization.shape];
      },
      'the units changed': (q) => { q.answerUnits = q.answerUnits.replace(/\^[23]/, (p) => (p === '^2' ? '^3' : '^2')); },
      'slant swapped for height': (q) => {
        const f = q.visualization;
        if (f.slant === undefined && f.coneH === undefined) return false;
        if (f.slant !== undefined) { f.coneH = f.slant; delete f.slant; } else { f.slant = f.coneH; delete f.coneH; }
      },
      'moved to another band': bandMove({ foundation: 'core', core: 'stretch', stretch: 'foundation' }),
    };
    const tally = mutants({ skills: Object.keys(CHECKS), check, ops, perBand: 200 });
    Object.entries(tally).forEach(([name, r]) => expect(r.survivors.slice(0, 2).map((s) => s.q), name).toEqual([]));
    expect(Object.keys(tally).sort()).toEqual(Object.keys(ops).sort());
  });
});
