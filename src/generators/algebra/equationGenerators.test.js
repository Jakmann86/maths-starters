// src/generators/algebra/equationGenerators.test.js
//
// Substitute-the-answer-back check for solve-fractional-coefficients: the
// printed x goes back into the printed equation, and both sides must agree as
// exact rationals (latexArithmetic.check.js, written for the harness). Since
// every equation is linear, agreeing at one x and not at x + 1 means the
// answer is the solution.
//
// Run: npx vitest run src/generators/algebra/equationGenerators.test.js

import { describe, expect, it } from 'vitest';
import { generateSolveFractionalCoefficients } from './equationGenerators';
import { exactOf, vequal, subst, compiles } from '../number/latexArithmetic.check';

const BANDS = ['foundation', 'core', 'stretch'];
const SAMPLES = 4000;
const gcd = (a, b) => (b === 0 ? Math.abs(a) : gcd(b, a % b));

describe('solve-fractional-coefficients', () => {
  it.each(BANDS)('x satisfies the equation at %s', (difficulty) => {
    const distinct = new Set();
    let fractional = 0;
    for (let i = 0; i < SAMPLES; i++) {
      const q = generateSolveFractionalCoefficients({ difficulty });
      expect(q.metadata).toEqual({ topic: 'solve-fractional-coefficients', difficulty });
      expect(q.instruction).toBe('Solve');
      if (!distinct.has(q.questionMath)) { compiles(q.questionMath); compiles(q.answer); compiles(q.workingOut); }
      distinct.add(q.questionMath);

      const m = /^x = (-?)(?:(\d+)|\\frac\{(\d+)\}\{(\d+)\})$/.exec(q.answer);
      expect(m, q.answer).toBeTruthy();
      if (m[3]) {
        fractional += 1;
        expect(gcd(Number(m[3]), Number(m[4])), q.answer).toBe(1);
      }
      const x = q.answer.slice(4);
      const [lhs, rhs] = q.questionMath.split(' = ');
      const at = (val) => vequal(exactOf(subst(lhs, { x: val })), exactOf(subst(rhs, { x: val })));
      expect(at(x), `${q.questionMath} at ${q.answer}`).toBe(true);
      expect(at(`${x} + 1`), `${q.questionMath} also at x + 1`).toBe(false);

      // a fractional coefficient on x, every band
      expect(q.questionMath).toMatch(/\\frac\{\d+\}\{\d+\}x|\\frac\{x\}\{\d+\}|\\frac\{\d+\}\{\d+\}\(/);
      if (difficulty === 'core') expect((q.questionMath.match(/x/g) || []).length).toBe(2);
      if (difficulty === 'stretch') expect(q.questionMath).toMatch(/\\frac\{\d+\}\{\d+\}\(/);
    }
    console.log(`solve-fractional-coefficients ${difficulty}: ${distinct.size} distinct, ${fractional} fractional answers`);
    if (difficulty !== 'stretch') expect(fractional).toBe(0);
    expect(distinct.size).toBeGreaterThan(difficulty === 'foundation' ? 400 : 1500);
  });
});
