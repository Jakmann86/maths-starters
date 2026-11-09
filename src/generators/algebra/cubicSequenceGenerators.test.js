// Substitute-the-answer-back harness for The difference method and cubic sequences.
// Every answer is recomputed by cubicSequenceGenerators.check.js
// from the figure and the printed question, never from the generator's
// variables, and every working line is checked. The mutation test beside it
// shows the checker fails when it should.
//
// Foundation's an^3 + d rules are about 600 (finding the rule) and 420
// (using it, n^3 + d at a term from 2 to 8); the rest run to thousands.
//
// Run: npx vitest run src/generators/algebra/cubicSequenceGenerators.test.js

import { describe, expect, it } from 'vitest';
import { BANDS, report, sample } from '../harness.check';
import { checkCubicSequence } from './cubicSequenceGenerators.check';

const SAMPLES = 6000;

// The kinds of question each band serves, as the checker names them.
const KINDS = {
  'sequences-difference-method': { foundation: ['linear', 'quadratic'], core: ['cubic', 'linear', 'quadratic'], stretch: ['cubic', 'linear', 'quadratic'] },
  'sequences-cubic-nth-term': { foundation: ['foundation'], core: ['core'], stretch: ['stretch'] },
  'sequences-cubic-use-nth-term': { foundation: ['foundation'], core: ['core'], stretch: ['stretch'] },
};

// The fewest distinct questions in 6,000 per band.
const FLOOR = {
  'sequences-difference-method': { foundation: 2400, core: 3600, stretch: 3600 },
  'sequences-cubic-nth-term': { foundation: 600, core: 3700, stretch: 4900 },
  'sequences-cubic-use-nth-term': { foundation: 420, core: 4800, stretch: 5400 },
};

describe('The difference method and cubic sequences', () => {
  Object.keys(KINDS).forEach((id) => {
    BANDS.forEach((band) => {
      it(`${id} ${band}: every answer follows from what is printed`, () => {
        const result = sample(id, band, checkCubicSequence, SAMPLES);
        report(id, band, result, SAMPLES);
        expect(Object.keys(result.mix).sort()).toEqual(KINDS[id][band]);
        expect(result.distinct).toBeGreaterThanOrEqual(FLOOR[id][band]);
      });
    });
  });
});
