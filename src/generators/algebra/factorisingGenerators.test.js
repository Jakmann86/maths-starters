// src/generators/algebra/factorisingGenerators.test.js
//
// Substitute-the-answer-back for factorise-common-factor, factorise-monic and
// the letter forms of factorise-grouping: the printed answer is expanded by an
// independent reader (polynomial.check.js) and must equal the printed
// question term for term, and every bracket in it must have nothing left to
// take out — otherwise the answer is right but not "fully" factorised.
//
// Run: npx vitest run src/generators/algebra/factorisingGenerators.test.js

import { describe, expect, it } from 'vitest';
import { generateFactoriseCommonFactor, generateFactoriseGrouping, generateFactoriseMonic } from './factorisingGenerators';
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
    let twoLetter = 0; let fourLetter = 0; let regrouped = 0;
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
      if (letters.size === 4) {
        // Stretch only: letters and nothing else, and the working regroups
        // when the printed pairs share nothing.
        fourLetter += 1;
        expect(difficulty).toBe('stretch');
        expect(/\d/.test(q.questionMath), q.questionMath).toBe(false);
        const w = q.workingOut.split('\n');
        expect(w[w.length - 1]).toBe(q.answer);
        w.forEach((ln) => expect(samePoly(ln, q.questionMath), ln).toBe(true));
        const t = q.questionMath.replace(/^-/, '').split(/ [+-] /);
        const share = (a, b) => [...a].some((ch) => b.includes(ch));
        if (!share(t[0], t[1])) { regrouped += 1; expect(w.length).toBe(3); }
      }
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
    console.log(`factorise-grouping ${difficulty}: ${distinct.size} distinct, ${twoLetter} two-letter, ${fourLetter} four-letter (${regrouped} regrouped) of ${SAMPLES}`);
    // A half each below Stretch; a third each of split, two-letter and
    // four-letter at Stretch.
    const share = difficulty === 'stretch' ? 1 / 3 : 1 / 2;
    expect(twoLetter).toBeGreaterThan(SAMPLES * (share - 0.05));
    expect(twoLetter).toBeLessThan(SAMPLES * (share + 0.05));
    if (difficulty === 'stretch') {
      expect(fourLetter).toBeGreaterThan(SAMPLES * 0.28);
      expect(regrouped).toBeGreaterThan(fourLetter * 0.4);
    } else expect(fourLetter).toBe(0);
  });
});

describe('factorise-monic', () => {
  it.each(BANDS)('the answer expands to the question at %s', (difficulty) => {
    const distinct = new Set();
    let negative = 0;
    for (let i = 0; i < SAMPLES; i++) {
      const q = generateFactoriseMonic({ difficulty });
      expect(q.metadata).toEqual({ topic: 'factorise-monic', difficulty });
      if (!distinct.has(q.questionMath)) { compiles(q.questionMath); compiles(q.answer); compiles(q.workingOut); }
      distinct.add(q.questionMath);
      expect(samePoly(q.answer, q.questionMath), `${q.questionMath} vs ${q.answer}`).toBe(true);
      const factors = splitFactors(q.answer);
      const brackets = factors.filter((f) => f.includes('x'));
      expect(brackets.length).toBe(2);
      brackets.forEach((f) => expect(f, q.answer).toMatch(/^x [+-] \d+$/)); // monic brackets
      const coeffs = [...expand(q.questionMath).values()];
      if (difficulty === 'stretch') {
        // A common number factor in front, taken out first.
        const k = q.answer.match(/^(-?\d*)\(/)[1];
        expect(k === '' || k === '1', q.answer).toBe(false);
        if (k.startsWith('-')) negative += 1;
        const w = q.workingOut.split('\n');
        expect(w.length).toBe(3);
        expect(samePoly(w[0], q.questionMath), w[0]).toBe(true);
        expect(w[2]).toBe(q.answer);
      } else {
        expect(q.answer.startsWith('('), q.answer).toBe(true);
        expect(expand(q.questionMath).get('x^2') ?? coeffs[0]).toBe(1);
      }
      if (difficulty === 'foundation') expect(coeffs.every((c) => c > 0)).toBe(true);
      else expect(coeffs.some((c) => c < 0), q.questionMath).toBe(true);
    }
    console.log(`factorise-monic ${difficulty}: ${distinct.size} distinct, ${negative} with a negative factor`);
    // Core is every pair from -9 to 9 with a negative (about 117): its real size.
    expect(distinct.size).toBeGreaterThan({ foundation: 25, core: 100, stretch: 400 }[difficulty]);
    if (difficulty === 'stretch') expect(negative).toBeGreaterThan(SAMPLES * 0.15);
  });
});
