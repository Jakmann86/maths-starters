// Substitute-the-answer-back harness for Modal class and stem-and-leaf averages.
// Every answer is recomputed by dataDisplayGenerators.check.js
// from the figure and the printed question, never from the generator's
// variables, and every working line is checked. The mutation test beside it
// shows the checker fails when it should.
//
// Every band runs to thousands of distinct questions.
//
// Run: npx vitest run src/generators/statistics/dataDisplayGenerators.test.js

import { describe, expect, it } from 'vitest';
import { BANDS, report, sample } from '../harness.check';
import { checkDataDisplay } from './dataDisplayGenerators.check';

const SAMPLES = 6000;

// The kinds of question each band serves, as the checker names them.
const KINDS = {
  'modal-class': { foundation: ['modal class'], core: ['median class'], stretch: ['from cumulative'] },
  'stem-and-leaf-averages': { foundation: ['mode', 'range'], core: ['even n', 'odd n'], stretch: ['1 d.p. mean', 'whole mean'] },
};

// The fewest distinct questions in 6,000 per band.
const FLOOR = {
  'modal-class': { foundation: 5500, core: 5500, stretch: 5500 },
  'stem-and-leaf-averages': { foundation: 5500, core: 5500, stretch: 5500 },
};

describe('Modal class and stem-and-leaf averages', () => {
  Object.keys(KINDS).forEach((id) => {
    BANDS.forEach((band) => {
      it(`${id} ${band}: every answer follows from what is printed`, () => {
        const result = sample(id, band, checkDataDisplay, SAMPLES);
        report(id, band, result, SAMPLES);
        expect(Object.keys(result.mix).sort()).toEqual(KINDS[id][band]);
        expect(result.distinct).toBeGreaterThanOrEqual(FLOOR[id][band]);
      });
    });
  });
});
