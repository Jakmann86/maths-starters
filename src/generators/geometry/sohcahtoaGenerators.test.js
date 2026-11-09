// Substitute-the-answer-back harness for SOHCAHTOA.
// Every answer is recomputed by sohcahtoaGenerators.check.js
// from the figure and the printed question, never from the generator's
// variables, and every working line is checked. The mutation test beside it
// shows the checker fails when it should.
//
// Find an angle at Foundation is tan from two whole-number legs up to 14,
// about 340 questions; the rest run to thousands.
//
// Run: npx vitest run src/generators/geometry/sohcahtoaGenerators.test.js

import { describe, expect, it } from 'vitest';
import { BANDS, report, sample } from '../harness.check';
import { checkSohcahtoa } from './sohcahtoaGenerators.check';

const SAMPLES = 6000;

// The kinds of question each band serves, as the checker names them.
const KINDS = {
  'sohcahtoa-find-side': { foundation: ['cos x on top', 'sin x on top'], core: ['cos x below', 'cos x on top', 'sin x below', 'sin x on top', 'tan x below', 'tan x on top'], stretch: ['cos x below', 'cos x below 1 d.p.', 'cos x on top', 'cos x on top 1 d.p.', 'sin x below', 'sin x below 1 d.p.', 'sin x on top', 'sin x on top 1 d.p.', 'tan x below', 'tan x below 1 d.p.', 'tan x on top', 'tan x on top 1 d.p.'] },
  'sohcahtoa-find-angle': { foundation: ['tan'], core: ['cos', 'sin', 'tan'], stretch: ['cos 1 d.p.', 'sin 1 d.p.', 'tan 1 d.p.'] },
};

// The fewest distinct questions in 6,000 per band.
const FLOOR = {
  'sohcahtoa-find-side': { foundation: 3200, core: 4800, stretch: 5400 },
  'sohcahtoa-find-angle': { foundation: 338, core: 2300, stretch: 5100 },
};

describe('SOHCAHTOA', () => {
  Object.keys(KINDS).forEach((id) => {
    BANDS.forEach((band) => {
      it(`${id} ${band}: every answer follows from what is printed`, () => {
        const result = sample(id, band, checkSohcahtoa, SAMPLES);
        report(id, band, result, SAMPLES);
        expect(Object.keys(result.mix).sort()).toEqual(KINDS[id][band]);
        expect(result.distinct).toBeGreaterThanOrEqual(FLOOR[id][band]);
      });
    });
  });
});
