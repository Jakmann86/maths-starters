// Substitute-the-answer-back harness for Algebraic fractions.
// Every answer is recomputed by algebraicFractionGenerators.check.js
// from the figure and the printed question, never from the generator's
// variables, and every working line is checked. The mutation test beside it
// shows the checker fails when it should.
//
// Simplifying by factorising at Core is (x + p)^2 over c(x + p), or a
// common factor top and bottom, about 900 questions; the rest run to
// thousands.
//
// Run: npx vitest run src/generators/algebra/algebraicFractionGenerators.test.js

import { describe, expect, it } from 'vitest';
import { BANDS, report, sample } from '../harness.check';
import { checkAlgebraicFraction } from './algebraicFractionGenerators.check';

const SAMPLES = 6000;

// The kinds of question each band serves, as the checker names them.
const KINDS = {
  'simplify-algebraic-fractions': { foundation: ['one letter'], core: ['one letter, indices', 'two letters'], stretch: ['bracket squared'] },
  'simplify-fractions-factorising': { foundation: ['linear below', 'linear on top'], core: ['common factor', 'perfect square'], stretch: ['trinomials'] },
  'multiply-algebraic-fractions': { foundation: ['multiply'], core: ['multiply'], stretch: ['difference of squares', 'trinomial'] },
  'divide-algebraic-fractions': { foundation: ['by a number', 'divide'], core: ['by a number', 'divide'], stretch: ['difference of squares', 'trinomial'] },
};

// The fewest distinct questions in 6,000 per band.
const FLOOR = {
  'simplify-algebraic-fractions': { foundation: 1600, core: 5300, stretch: 1900 },
  'simplify-fractions-factorising': { foundation: 1000, core: 800, stretch: 1500 },
  'multiply-algebraic-fractions': { foundation: 5500, core: 5800, stretch: 2200 },
  'divide-algebraic-fractions': { foundation: 5200, core: 5400, stretch: 2200 },
};

describe('Algebraic fractions', () => {
  Object.keys(KINDS).forEach((id) => {
    BANDS.forEach((band) => {
      it(`${id} ${band}: every answer follows from what is printed`, () => {
        const result = sample(id, band, checkAlgebraicFraction, SAMPLES);
        report(id, band, result, SAMPLES);
        expect(Object.keys(result.mix).sort()).toEqual(KINDS[id][band]);
        expect(result.distinct).toBeGreaterThanOrEqual(FLOOR[id][band]);
      });
    });
  });
});
