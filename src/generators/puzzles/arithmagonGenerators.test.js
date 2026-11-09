// Substitute-the-answer-back harness for Arithmagons and number walls.
// Every answer is recomputed by arithmagonGenerators.check.js
// from the figure and the printed question, never from the generator's
// variables, and every working line is checked. The mutation test beside it
// shows the checker fails when it should.
//
// A product arithmagon at Stretch has circles 2 to 12, about 1,300
// questions; the rest run to thousands.
//
// Run: npx vitest run src/generators/puzzles/arithmagonGenerators.test.js

import { describe, expect, it } from 'vitest';
import { BANDS, report, sample } from '../harness.check';
import { checkArithmagon } from './arithmagonGenerators.check';

const SAMPLES = 6000;

// The kinds of question each band serves, as the checker names them.
const KINDS = {
  'arithmagon': { foundation: ['foundation'], core: ['negative a', 'negative b', 'negative c'], stretch: ['stretch'] },
  'number-wall': { foundation: ['top'], core: ['x at 0', 'x at 1', 'x at 2'], stretch: ['x at 1', 'x at 2'] },
};

// The fewest distinct questions in 6,000 per band.
const FLOOR = {
  'arithmagon': { foundation: 3800, core: 4200, stretch: 1200 },
  'number-wall': { foundation: 3800, core: 4800, stretch: 5300 },
};

describe('Arithmagons and number walls', () => {
  Object.keys(KINDS).forEach((id) => {
    BANDS.forEach((band) => {
      it(`${id} ${band}: every answer follows from what is printed`, () => {
        const result = sample(id, band, checkArithmagon, SAMPLES);
        report(id, band, result, SAMPLES);
        expect(Object.keys(result.mix).sort()).toEqual(KINDS[id][band]);
        expect(result.distinct).toBeGreaterThanOrEqual(FLOOR[id][band]);
      });
    });
  });
});
