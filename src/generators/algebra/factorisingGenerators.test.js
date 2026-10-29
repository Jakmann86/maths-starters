// src/generators/algebra/factorisingGenerators.test.js
//
// Substitute-the-answer-back for factorise-common-factor and the two-letter
// form of factorise-grouping: the printed answer is expanded by an
// independent reader (polynomial.check.js) and must equal the printed
// question term for term, and every bracket in it must have nothing left to
// take out — otherwise the answer is right but not "fully" factorised.
//
// Run: npx vitest run src/generators/algebra/factorisingGenerators.test.js

import { describe, expect, it } from 'vitest';
import { generateFactoriseCommonFactor, generateFactoriseGrouping } from './factorisingGenerators';
import { samePoly, splitFactors, noCommonFactor, expand } from './polynomial.check';
import { compiles } from '../number/latexArithmetic.check';

const BANDS = ['foundation', 'core', 'stretch'];
const SAMPLES = 4000;

describe('factorise-common-factor', () => {
  it.each(BANDS)('the answer expands to the question at %s', (difficulty) => {
    const distinct = new Set();
    let twoLetter = 0; let threeTerm = 0;
    for (let i = 0; i < SAMPLES; i++) {
      const q = generateFactoriseCommonFactor({ difficulty });
      expect(q.metadata).toEqual({ topic: 'factorise-common-factor', difficulty });
      if (!distinct.has(q.questionMath)) { compiles(q.questionMath); compiles(q.answer); compiles(q.workingOut); }
      distinct.add(q.questionMath);

      expect(samePoly(q.answer, q.questionMath), `${q.questionMath} vs ${q.answer}`).toBe(true);
      const [hcf, inner, ...rest] = splitFactors(q.answer);
      expect(rest).toEqual([]);
      expect(noCommonFactor(inner), q.answer).toBe(true);

      const terms = expand(q.questionMath);
      const letters = new Set([...terms.keys()].join('').match(/[a-z]/g));
      if (difficulty === 'foundation') {
        expect(letters.size).toBe(1);
        expect(hcf).toMatch(/^\d+$/); // a number only
      }
      if (difficulty === 'core') {
        expect([...letters]).toEqual(['x']);
        expect(hcf).toMatch(/x/); // a power of x always comes out
      }
      if (difficulty === 'stretch') {
        if (letters.size === 2) twoLetter += 1;
        if (terms.size === 3) threeTerm += 1;
        expect(letters.size === 2 || terms.size === 3, q.questionMath).toBe(true);
      }
    }
    console.log(`factorise-common-factor ${difficulty}: ${distinct.size} distinct; stretch split ${twoLetter}/${threeTerm}`);
    if (difficulty === 'stretch') {
      expect(twoLetter).toBeGreaterThan(SAMPLES * 0.4);
      expect(threeTerm).toBeGreaterThan(SAMPLES * 0.4);
    }
    expect(distinct.size).toBeGreaterThan(300);
  });
});

describe('factorise-grouping', () => {
  it.each(BANDS)('the answer expands to the question at %s, both forms', (difficulty) => {
    const distinct = new Set();
    let twoLetter = 0;
    for (let i = 0; i < SAMPLES; i++) {
      const q = generateFactoriseGrouping({ difficulty });
      if (!distinct.has(q.questionMath)) { compiles(q.questionMath); compiles(q.answer); compiles(q.workingOut); }
      distinct.add(q.questionMath);

      // A split quadratic keeps its two x-terms apart, which an expansion
      // merges, so compare the sums rather than the printed terms.
      expect(samePoly(q.answer, q.questionMath), `${q.questionMath} vs ${q.answer}`).toBe(true);
      const factors = splitFactors(q.answer);
      expect(q.answer.startsWith('('), q.answer).toBe(true); // no number in front
      factors.forEach((f) => expect(noCommonFactor(f), q.answer).toBe(true));
      expect(q.questionMath.split(/ [+-] /).length).toBe(4); // four terms as printed

      const letters = new Set(q.questionMath.match(/[a-z]/g));
      if (letters.size === 2) {
        twoLetter += 1;
        // the working's second line is the answer; its first expands to it too
        const [pulled, last] = q.workingOut.split('\n');
        expect(last).toBe(q.answer);
        expect(samePoly(pulled, q.questionMath), pulled).toBe(true);
        const coeffs = [...expand(q.questionMath).values()];
        if (difficulty === 'foundation') expect(coeffs.every((c) => c > 0)).toBe(true);
        else expect(coeffs.some((c) => c < 0), q.questionMath).toBe(true);
        if (difficulty === 'stretch') factors.forEach((f) => expect(f, q.answer).toMatch(/^\d/));
      }
    }
    console.log(`factorise-grouping ${difficulty}: ${distinct.size} distinct, ${twoLetter}/${SAMPLES} two-letter`);
    expect(twoLetter).toBeGreaterThan(SAMPLES * 0.45);
    expect(twoLetter).toBeLessThan(SAMPLES * 0.55);
  });
});
