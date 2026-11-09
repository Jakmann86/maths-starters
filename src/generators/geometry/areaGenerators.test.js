// Substitute-the-answer-back harness for Area.
// Every answer is recomputed by areaGenerators.check.js
// from the figure and the printed question, never from the generator's
// variables, and every working line is checked. The mutation test beside it
// shows the checker fails when it should.
//
// The rectangle's Core band takes its diagonal from a Pythagorean triple,
// about 270 questions across the three units; the kite's Stretch band is a
// short diagonal and a fixed difference, 228. The rest run to thousands.
//
// Run: npx vitest run src/generators/geometry/areaGenerators.test.js

import { describe, expect, it } from 'vitest';
import { BANDS, report, sample } from '../harness.check';
import { checkArea } from './areaGenerators.check';

const SAMPLES = 6000;

// The kinds of question each band serves, as the checker names them.
const KINDS = {
  'area-rectangle': { foundation: ['plain'], core: ['with diagonal'], stretch: ['find l', 'find w'] },
  'area-triangle': { foundation: ['plain'], core: ['with sloping side'], stretch: ['find h'] },
  'area-parallelogram': { foundation: ['plain'], core: ['with sloping side'], stretch: ['find h'] },
  'area-trapezium': { foundation: ['plain'], core: ['with sloping side'], stretch: ['find b'] },
  'area-kite': { foundation: ['plain'], core: ['find a diagonal'], stretch: ['quadratic'] },
};

// The fewest distinct questions in 6,000 per band.
const FLOOR = {
  'area-rectangle': { foundation: 1500, core: 270, stretch: 2600 },
  'area-triangle': { foundation: 1100, core: 3100, stretch: 1100 },
  'area-parallelogram': { foundation: 1200, core: 3500, stretch: 1200 },
  'area-trapezium': { foundation: 4000, core: 4700, stretch: 4000 },
  'area-kite': { foundation: 1100, core: 1100, stretch: 228 },
};

describe('Area', () => {
  Object.keys(KINDS).forEach((id) => {
    BANDS.forEach((band) => {
      it(`${id} ${band}: every answer follows from what is printed`, () => {
        const result = sample(id, band, checkArea, SAMPLES);
        report(id, band, result, SAMPLES);
        expect(Object.keys(result.mix).sort()).toEqual(KINDS[id][band]);
        expect(result.distinct).toBeGreaterThanOrEqual(FLOOR[id][band]);
      });
    });
  });
});
