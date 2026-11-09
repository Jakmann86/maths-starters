// Substitute-the-answer-back harness for Pythagoras.
// Every answer is recomputed by pythagorasGenerators.check.js
// from the figure and the printed question, never from the generator's
// variables, and every working line is checked. The mutation test beside it
// shows the checker fails when it should.
//
// Distinct questions are few by design, and that is the real ceiling, not a
// sampling gap: Foundation draws from the 11 Pythagorean triples with a
// hypotenuse up to 30 (22 questions, either leg first); Core and Stretch
// take legs from 2 to 9 whose squares do not sum to a square (60 for the
// hypotenuse, 126 for a missing side, 63 for the isosceles height).
//
// Run: npx vitest run src/generators/geometry/pythagorasGenerators.test.js

import { describe, expect, it } from 'vitest';
import { BANDS, report, sample } from '../harness.check';
import { checkPythagoras } from './pythagorasGenerators.check';

const SAMPLES = 6000;

// The kinds of question each band serves, as the checker names them.
const KINDS = {
  'pythagoras-hypotenuse': { foundation: ['foundation'], core: ['core'], stretch: ['stretch'] },
  'pythagoras-missing-side': { foundation: ['foundation leg a', 'foundation leg b'], core: ['core leg a', 'core leg b'], stretch: ['stretch leg a', 'stretch leg b'] },
  'pythagoras-isosceles': { foundation: ['foundation'], core: ['core'], stretch: ['stretch'] },
};

// The fewest distinct questions in 6,000 per band.
const FLOOR = {
  'pythagoras-hypotenuse': { foundation: 22, core: 60, stretch: 60 },
  'pythagoras-missing-side': { foundation: 44, core: 126, stretch: 126 },
  'pythagoras-isosceles': { foundation: 22, core: 63, stretch: 63 },
};

describe('Pythagoras', () => {
  Object.keys(KINDS).forEach((id) => {
    BANDS.forEach((band) => {
      it(`${id} ${band}: every answer follows from what is printed`, () => {
        const result = sample(id, band, checkPythagoras, SAMPLES);
        report(id, band, result, SAMPLES);
        expect(Object.keys(result.mix).sort()).toEqual(KINDS[id][band]);
        expect(result.distinct).toBeGreaterThanOrEqual(FLOOR[id][band]);
      });
    });
  });
});
