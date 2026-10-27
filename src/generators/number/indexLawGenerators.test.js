// src/generators/number/indexLawGenerators.test.js
//
// Substitute-the-answer-back checks for index-laws-coefficients,
// index-laws-missing-power and exponential-equations.
//
//   coefficients    the letter is replaced by 2 and then by 3, and question
//                   and answer must agree exactly at both
//   missing power   n is replaced by the printed answer, and the two sides
//                   must agree: exactly when n is whole, and as logarithms to
//                   the base of the prime when the roots make n a fraction
//   exponential     x is replaced by the printed answer and both sides are
//                   compared as logarithms
//
// Run: npx vitest run src/generators/number/indexLawGenerators.test.js

import { describe, expect, it } from 'vitest';
import {
  generateIndexLawsCoefficients,
  generateIndexMissingPower,
  generateExponentialEquations,
} from './indexLawGenerators';
import { exactOf, floatOf, vequal, subst, compiles } from './latexArithmetic.check';

const BANDS = ['foundation', 'core', 'stretch'];
const SAMPLES = 4000;

const run = (gen, difficulty, check) => {
  const distinct = new Set();
  for (let i = 0; i < SAMPLES; i++) {
    const q = gen({ difficulty });
    expect(q.metadata.difficulty).toBe(difficulty);
    if (!distinct.has(q.questionMath)) { compiles(q.questionMath); compiles(q.answer); compiles(q.workingOut); }
    distinct.add(q.questionMath);
    // never a bare power of 1 printed as ^{1}
    expect(q.questionMath + q.answer, q.questionMath).not.toMatch(/\^\{1\}/);
    check(q);
  }
  return distinct.size;
};

// "a/b" or "-a/b" or an integer, as a number
const valueOf = (tex) => floatOf(tex);

describe('index-laws-coefficients', () => {
  it.each(BANDS)('simplifies correctly at %s', (difficulty) => {
    const n = run(generateIndexLawsCoefficients, difficulty, (q) => {
      expect(q.metadata.topic).toBe('index-laws-coefficients');
      const letters = [...new Set(q.questionMath.replace(/\\[a-z]+/g, '').match(/[a-z]/g))];
      expect(letters.length, q.questionMath).toBe(1);
      const [v] = letters;
      // The answer is a single term c v^e, c a whole number, e positive.
      expect(q.answer, q.answer).toMatch(new RegExp(`^(\\d*)${v}(\\^\\{\\d+\\})?$`));
      for (const val of [2, 3]) {
        const a = exactOf(subst(q.questionMath, { [v]: val }));
        const b = exactOf(subst(q.answer, { [v]: val }));
        expect(vequal(a, b), `${q.questionMath} = ${q.answer} at ${v} = ${val}`).toBe(true);
      }
      if (difficulty === 'foundation') expect(q.questionMath).not.toMatch(/\(/);
      if (difficulty === 'core') expect(q.questionMath).toMatch(/\)\^\{[23]\}/);
      if (difficulty === 'stretch') expect(q.questionMath).toMatch(/\^\{-\d\}|\\frac\{\d\}\{\d\}\}$/);
    });
    console.log(`index-laws-coefficients ${difficulty}: ${n} distinct`);
    expect(n).toBeGreaterThan(difficulty === 'stretch' ? 300 : 1000);
  });
});

describe('index-laws-missing-power', () => {
  it.each(BANDS)('n satisfies the equation at %s', (difficulty) => {
    let fractional = 0;
    const n = run(generateIndexMissingPower, difficulty, (q) => {
      expect(q.metadata.topic).toBe('index-laws-missing-power');
      expect(q.instruction).toBe('Find the value of n');
      const m = /^n = (.+)$/.exec(q.answer);
      expect(m, q.answer).toBeTruthy();
      const nTex = m[1];
      const [lhs, rhs] = q.questionMath.split(' = ');
      expect(lhs + rhs, q.questionMath).toMatch(/\^\{n\}|\{n\}/);
      const letters = [...new Set(q.questionMath.replace(/\\[a-z]+/g, '').match(/[a-z]/g))].filter((c) => c !== 'n');
      // n goes in as a brace group (it always sits in an exponent); any
      // other letter is replaced by 2.
      const plug = (side, nVal) => {
        const withN = side.replace(/(?<!\\[a-zA-Z]*)n/g, `{${nVal}}`);
        return letters.length ? subst(withN, { [letters[0]]: 2 }) : withN;
      };
      if (/frac/.test(nTex)) {
        fractional += 1;
        const p = Number(/^(\d+)\^/.exec(rhs)[1]);
        const L = Math.log(valueOf(plug(lhs, nTex))) / Math.log(p);
        const Rv = Math.log(valueOf(plug(rhs, nTex))) / Math.log(p);
        expect(Math.abs(L - Rv), `${q.questionMath} at ${q.answer}`).toBeLessThan(1e-9);
        expect(Math.abs(L - valueOf(nTex)), `${q.questionMath} at ${q.answer}`).toBeLessThan(1e-9);
      } else {
        expect(/^-?\d+$/.test(nTex), q.answer).toBe(true);
        expect(vequal(exactOf(plug(lhs, nTex)), exactOf(plug(rhs, nTex))), `${q.questionMath} at ${q.answer}`).toBe(true);
        // n ± 1 does not work, so the check is not vacuous
        for (const d of [-1, 1]) {
          const alt = Number(nTex) + d;
          expect(vequal(exactOf(plug(lhs, alt)), exactOf(plug(rhs, alt))), `${q.questionMath} also at n = ${alt}`).toBe(false);
        }
      }
      if (difficulty === 'stretch') {
        expect(q.questionMath).toMatch(/sqrt/);
        // the power on top and the one underneath never cancel outright
        const [, top, bottom] = /\\times (\S+)\}\{(\S+)\}/.exec(q.questionMath);
        expect(Math.abs(floatOf(top) - floatOf(bottom)), q.questionMath).toBeGreaterThan(0.5);
      } else expect(q.questionMath).not.toMatch(/sqrt/);
    });
    if (difficulty === 'stretch') expect(fractional).toBe(SAMPLES);
    console.log(`index-laws-missing-power ${difficulty}: ${n} distinct`);
    expect(n).toBeGreaterThan(difficulty === 'foundation' ? 150 : 200);
  });
});

describe('exponential-equations', () => {
  it.each(BANDS)('x satisfies the equation at %s', (difficulty) => {
    const n = run(generateExponentialEquations, difficulty, (q) => {
      expect(q.metadata.topic).toBe('exponential-equations');
      const m = /^x = (.+)$/.exec(q.answer);
      expect(m, q.answer).toBeTruthy();
      const x = m[1];
      const [lhs, rhs] = q.questionMath.split(' = ');
      const at = (side, val) => floatOf(subst(side, { x: val }));
      const L = Math.log(at(lhs, x)), Rv = Math.log(at(rhs, x));
      expect(Math.abs(L - Rv), `${q.questionMath} at ${q.answer}`).toBeLessThan(1e-9 * Math.max(1, Math.abs(L)));
      // a wrong x fails, so the check is not vacuous
      const off = `${x} + 1`;
      expect(Math.abs(Math.log(at(lhs, `{${off}}`)) - Math.log(at(rhs, `{${off}}`))), q.questionMath).toBeGreaterThan(1e-6);
      if (difficulty !== 'stretch') expect(x, q.answer).toMatch(/^-?\d+$/);
      if (difficulty === 'foundation') expect(rhs).not.toMatch(/x/);
      if (difficulty === 'core') expect(lhs + rhs).not.toMatch(/frac/);
      if (difficulty === 'stretch') expect(q.questionMath).toMatch(/\\frac\{1\}/);
    });
    console.log(`exponential-equations ${difficulty}: ${n} distinct`);
    expect(n).toBeGreaterThan(difficulty === 'foundation' ? 15 : 400);
  });
});
