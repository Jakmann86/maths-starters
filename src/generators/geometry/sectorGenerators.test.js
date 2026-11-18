// Substitute-the-answer-back harness for arc-length and sector-area, with
// their mutation test. The checker (sectorGenerators.check.js) reads the
// angle and radius off the sector figure and works the answer out as a
// multiple of π, rounding to 3 s.f. itself.
//
// Run: npx vitest run src/generators/geometry/sectorGenerators.test.js

import { describe, expect, it } from 'vitest';
import { BANDS, sample, report, mutants, generic, bandMove } from '../harness.check';
import { checkArcLength, checkSectorArea } from './sectorGenerators.check';
import { skillsInTopic } from '../../curriculum/skills';

const N = 6000;
const CHECKS = { 'arc-length': checkArcLength, 'sector-area': checkSectorArea };
const check = (q, band) => CHECKS[q.metadata?.topic]?.(q, band) ?? (() => { throw new Error('topic'); })();

const both = ['3 s.f.', 'exact'];
const KINDS = {
  'arc-length': { foundation: both, core: both, stretch: ['find the angle', 'find the radius'] },
  'sector-area': { foundation: both, core: both, stretch: ['find the angle', 'find the radius'] },
};

// Distinct questions in 6,000, floors just under the real pools, all of
// which are seen. They are small by nature: the angle and the radius must
// make a whole multiple of π, and Foundation's angle a factor of 360. Arc
// length: 372 at Foundation, 492 above. Sector area: 234 at Foundation,
// 498 above. Each counts the exact and the 3 s.f. form separately.
const FLOOR = {
  'arc-length': { foundation: 355, core: 470, stretch: 470 },
  'sector-area': { foundation: 222, core: 475, stretch: 475 },
};

describe('arcs and sectors', () => {
  Object.keys(CHECKS).forEach((id) => BANDS.forEach((band) => {
    it(`${id} ${band}: the answer follows from what is printed`, () => {
      const r = sample(id, band, check, N);
      report(id, band, r, N);
      expect(Object.keys(r.mix).sort()).toEqual([...KINDS[id][band]].sort());
      expect(r.distinct).toBeGreaterThanOrEqual(FLOOR[id][band]);
    });
  }));

  it('follows the circle in Perimeter and in Area', () => {
    const per = skillsInTopic('Perimeter'), area = skillsInTopic('Area');
    expect(per[per.indexOf('circumference-circle') + 1]).toBe('arc-length');
    expect(area[area.indexOf('area-circle') + 1]).toBe('sector-area');
  });

  it('rejects every broken copy', () => {
    const ops = {
      ...generic('answer nudged', 'question line nudged', 'a working number nudged', 'metadata changed'),
      'the angle relabelled': (q) => {
        const f = q.visualization;
        if (!/\^\\circ$/.test(f.angleLabel)) return false;
        f.angleLabel = `${Number.parseInt(f.angleLabel, 10) + 5}^\\circ`;
        f.angle += 5;
      },
      'the radius relabelled': (q) => {
        const m = /^(\d+) /.exec(q.visualization.r);
        if (!m) return false;
        q.visualization.r = q.visualization.r.replace(m[1], String(Number(m[1]) + 1));
      },
      'the major sector shaded the other way': (q) => {
        if (q.metadata.difficulty !== 'core' || q.metadata.topic !== 'sector-area') return false;
        q.visualization.major = false;
      },
      'exact and rounded swapped': (q) => {
        if (/π$/.test(q.instruction)) q.instruction = q.instruction.replace('Leave your answer in terms of π', 'Give your answer to 3 significant figures');
        else if (/figures$/.test(q.instruction)) q.instruction = q.instruction.replace('Give your answer to 3 significant figures', 'Leave your answer in terms of π');
        else return false;
      },
      'moved to another band': bandMove({ foundation: 'core', core: 'stretch', stretch: 'foundation' }),
    };
    const tally = mutants({ skills: Object.keys(CHECKS), check, ops, perBand: 200 });
    Object.entries(tally).forEach(([name, r]) => expect(r.survivors.slice(0, 2).map((s) => s.q), name).toEqual([]));
    expect(Object.keys(tally).sort()).toEqual(Object.keys(ops).sort());
  });
});
