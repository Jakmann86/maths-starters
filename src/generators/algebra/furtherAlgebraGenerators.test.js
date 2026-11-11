// Substitute-the-answer-back harness for furtherAlgebraGenerators.js: every
// answer must equal its question as a function, in the form asked for, with
// every working line true (furtherAlgebraGenerators.check.js). The mutation
// test beside it shows the checker fails when it should.
//
// Run: npx vitest run src/generators/algebra/furtherAlgebraGenerators.test.js

import { describe, expect, it } from 'vitest';
import { BANDS, report, sample } from '../harness.check';
import { checkFurtherAlgebra } from './furtherAlgebraGenerators.check';
import { skillsInTopic } from '../../curriculum/skills';

const SAMPLES = 6000;

export const KINDS = {
  'expand-further': { foundation: ['linear by quadratic'], core: ['a cube', 'three brackets'], stretch: ['a cube', 'linear by quadratic', 'three brackets'] },
  'factorise-perfect-square': { foundation: ['minus', 'plus'], core: ['minus', 'plus'], stretch: ['a negative factor', 'a number factor'] },
  'factorise-fully': { foundation: ['a coefficient', 'x squared'], core: ['a number first', 'x first'], stretch: ['a negative first', 'a number, then non-monic'] },
  'rearrange-harder': { foundation: ['a root', 'a square'], core: ['over a bracket', 'over x'], stretch: ['a fraction', 'a product'] },
  'add-algebraic-fractions': { foundation: ['adding', 'subtracting'], core: ['adding', 'subtracting'], stretch: ['adding', 'subtracting'] },
};

// The fewest distinct questions in 6,000 per band. Small ones are honest:
// a Foundation perfect square is x^2 ± 2ax + a^2 for a up to 10 in one of five
// letters (100); Foundation factorising-fully is a number times a difference
// of two squares (about 150); Foundation rearranging is y = ax^2 + b or a
// root of x over a number (about 160).
const FLOOR = {
  'expand-further': { foundation: 1800, core: 1000, stretch: 2350 },
  'factorise-perfect-square': { foundation: 100, core: 180, stretch: 820 },
  'factorise-fully': { foundation: 140, core: 690, stretch: 1550 },
  'rearrange-harder': { foundation: 150, core: 360, stretch: 900 },
  'add-algebraic-fractions': { foundation: 3500, core: 5400, stretch: 4400 },
};

describe('Further algebra', () => {
  Object.keys(KINDS).forEach((id) => {
    BANDS.forEach((band) => {
      it(`${id} ${band}: every answer follows from what is printed`, () => {
        const result = sample(id, band, checkFurtherAlgebra, SAMPLES);
        report(id, band, result, SAMPLES);
        expect(Object.keys(result.mix).sort()).toEqual(KINDS[id][band]);
        expect(result.distinct).toBeGreaterThanOrEqual(FLOOR[id][band]);
      });
    });
  });

  it('sits in its topics in Haese order', () => {
    expect(skillsInTopic('Expanding brackets').slice(-1)).toEqual(['expand-further']);
    expect(skillsInTopic('Factorising')).toEqual(['factorise-common-factor', 'factorise-difference-of-two-squares', 'factorise-perfect-square', 'factorise-grouping', 'factorise-monic', 'factorise-splitting-middle', 'factorise-fully']);
    expect(skillsInTopic('Formulae')).toEqual(['formula-substitution', 'formula-rearrangement', 'rearrange-harder', 'formula-derivation']);
    expect(skillsInTopic('Algebraic fractions').slice(-1)).toEqual(['add-algebraic-fractions']);
  });
});
