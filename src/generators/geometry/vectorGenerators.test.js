// Substitute-the-answer-back harness for Vectors. Every answer is
// recomputed by vectorGenerators.check.js from what is printed (the grid's
// arrows, the diagram's corners and points, the vectors and points in the
// question) with its own vector parser, never from the generator's
// variables, and every working line is checked. The mutation test beside it
// shows the checker fails when it should.
//
// Distinct questions are honest ceilings where they are small:
// - Magnitude at Foundation draws its vector from the Pythagorean pairs with
//   legs up to 24, in either order and any signs: 432.
// - Parallel vectors at Foundation is k (seven values) times a vector with
//   components up to 5: 700 (the floor sits a little under: 6,000 draws
//   can miss one).
// - Vectors in geometry at Foundation is a vector between two corners of a
//   triangle or a parallelogram, over three sets of corner letters and
//   three pairs of vector names: 126.
//
// Run: npx vitest run src/generators/geometry/vectorGenerators.test.js

import { describe, expect, it } from 'vitest';
import { BANDS, report, sample } from '../harness.check';
import { checkVector } from './vectorGenerators.check';
import { getSkill, skillsInTopic, strandOf, topicGroups } from '../../curriculum/skills';

const SAMPLES = 6000;

const KINDS = {
  'column-vectors': { foundation: ['diagonal arrow', 'straight arrow'], core: ['backwards', 'forwards'], stretch: ['find the end', 'find the start'] },
  'vector-arithmetic': { foundation: ['difference', 'sum'], core: ['scalar multiples'], stretch: ['kx + v = u', 'kx - v = u', 'u - kx = v'] },
  'vector-magnitude': { foundation: ['whole number'], core: ['surd', 'surd simplified'], stretch: ['between points', 'of a combination'] },
  'parallel-vectors': { foundation: ['negative k', 'positive k'], core: ['k below', 'k on top'], stretch: ['k is x', 'k is y'] },
  'vector-geometry': { foundation: ['corner to corner'], core: ['midpoint, parallelogram', 'midpoint, triangle'], stretch: ['ratio, parallelogram', 'ratio, triangle'] },
};

// The fewest distinct questions in 6,000 per band.
const FLOOR = {
  'column-vectors': { foundation: 3900, core: 5500, stretch: 5500 },
  'vector-arithmetic': { foundation: 5500, core: 5500, stretch: 5500 },
  'vector-magnitude': { foundation: 432, core: 1600, stretch: 5500 },
  'parallel-vectors': { foundation: 680, core: 1400, stretch: 5300 },
  'vector-geometry': { foundation: 126, core: 950, stretch: 3700 },
};

describe('Vectors', () => {
  Object.keys(KINDS).forEach((id) => {
    BANDS.forEach((band) => {
      it(`${id} ${band}: every answer follows from what is printed`, () => {
        const result = sample(id, band, checkVector, SAMPLES);
        report(id, band, result, SAMPLES);
        expect(Object.keys(result.mix).sort()).toEqual(KINDS[id][band]);
        expect(result.distinct).toBeGreaterThanOrEqual(FLOOR[id][band]);
      });
    });
  });

  it('is its own Geometry topic, after Transformations, in teaching order', () => {
    Object.keys(KINDS).forEach((id) => expect(getSkill(id).topic).toBe('Vectors'));
    expect(skillsInTopic('Vectors')).toEqual(Object.keys(KINDS));
    expect(strandOf('Vectors')).toBe('Geometry');
    const geo = topicGroups().find((g) => g.name === 'Geometry').topics;
    expect(geo).toContain('Vectors');
  });
});
