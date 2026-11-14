// Substitute-the-answer-back harness for pythagorasProblemsGenerators.js:
// the lengths are read off the figure (or the points off the question), the
// converse or the two-step Pythagoras is redone, and the answer and working
// must agree (pythagorasProblemsGenerators.check.js). The mutation test
// beside it shows the checker fails when it should.
//
// Run: npx vitest run src/generators/geometry/pythagorasProblemsGenerators.test.js

import { describe, expect, it } from 'vitest';
import { BANDS, report, sample } from '../harness.check';
import { checkPythagorasProblems } from './pythagorasProblemsGenerators.check';
import { skillsInTopic } from '../../curriculum/skills';

const SAMPLES = 6000;

const KINDS = {
  'pythagoras-converse': { foundation: ['not right', 'right'], core: ['not right', 'right'], stretch: ['not right', 'right'] },
  'pythagoras-3d': { foundation: ['cone', 'cylinder'], core: ['cuboid', 'cylinder'], stretch: ['cube', 'cuboid', 'cylinder'] },
};

// The fewest distinct questions in 6,000 per band. Foundation 3D draws from
// the 11 triples with a hypotenuse up to 30 (the existing Pythagoras skills'
// limit for squaring by hand): on a cone, either way round with any of the
// three unknown (66), or in a cylinder (22). 88 is its real size.
const FLOOR = {
  'pythagoras-converse': { foundation: 2300, core: 4500, stretch: 5600 },
  'pythagoras-3d': { foundation: 88, core: 1250, stretch: 1000 },
};

describe('Pythagoras: converse and three dimensions', () => {
  Object.keys(KINDS).forEach((id) => {
    BANDS.forEach((band) => {
      it(`${id} ${band}: every answer follows from what is printed`, () => {
        const result = sample(id, band, checkPythagorasProblems, SAMPLES);
        report(id, band, result, SAMPLES);
        expect(Object.keys(result.mix).sort()).toEqual(KINDS[id][band]);
        expect(result.distinct).toBeGreaterThanOrEqual(FLOOR[id][band]);
      });
    });
  });

  it('sits in Haese order within Pythagoras and trigonometry', () => {
    const ids = skillsInTopic('Pythagoras and trigonometry');
    expect(ids.slice(0, 5)).toEqual(['pythagoras-hypotenuse', 'pythagoras-missing-side', 'pythagoras-converse', 'pythagoras-isosceles', 'pythagoras-3d']);
  });
});
