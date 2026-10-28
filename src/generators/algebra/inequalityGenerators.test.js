// src/generators/algebra/inequalityGenerators.test.js
//
// Substitute-the-answer-back for the Inequalities topic. Every question is
// re-read from its printed text: the expression is evaluated exactly
// (latexArithmetic.check.js) at each candidate x, and the printed answer
// must agree with the printed inequality at every one — whole numbers either
// side of the boundary and the halves between them, so a sign that should
// have turned round, or a < printed for a <=, cannot slip through.
//
// Run: npx vitest run src/generators/algebra/inequalityGenerators.test.js

import { describe, expect, it } from 'vitest';
import { generateInequalityListValues, generateSolveLinearInequalities } from './inequalityGenerators';
import { exactOf, asRational, subst, compiles } from '../number/latexArithmetic.check';

const BANDS = ['foundation', 'core', 'stretch'];
const SAMPLES = 4000;
const OP = /\s(<|>|\\le|\\ge)\s/;

const valueOf = (tex, x) => {
  const [n, d] = asRational(exactOf(x === undefined ? tex : subst(tex, { x })));
  return n / d;
};
const test = (a, op, b) => ({ '<': a < b, '>': a > b, '\\le': a <= b, '\\ge': a >= b }[op]);

/** Split "lo < 2x + 1 \le hi" into [parts, ops]. */
const pieces = (tex) => {
  const parts = tex.split(OP);
  return { exprs: parts.filter((_, i) => i % 2 === 0), ops: parts.filter((_, i) => i % 2 === 1) };
};
const satisfies = (tex, x) => {
  const { exprs, ops } = pieces(tex);
  return ops.every((op, i) => test(valueOf(exprs[i], x), op, valueOf(exprs[i + 1], x)));
};
const answerList = (ans) => ans.split(',\\ ').map(Number);

describe('inequality-list-values', () => {
  it.each(BANDS)('the listed values are exactly those that satisfy it, at %s', (difficulty) => {
    const distinct = new Set();
    let boundaryShown = 0; let strict = 0;
    for (let i = 0; i < SAMPLES; i++) {
      const q = generateInequalityListValues({ difficulty });
      expect(q.metadata).toEqual({ topic: 'inequality-list-values', difficulty });
      if (!distinct.has(q.questionMath)) { compiles(q.questionMath); compiles(q.answer); compiles(q.workingOut); }
      distinct.add(q.questionMath);
      const got = answerList(q.answer);

      if (difficulty === 'foundation') {
        const [ineq, shown] = q.questionMath.split('\n');
        const candidates = answerList(shown);
        expect(new Set(candidates).size).toBe(6);
        const want = candidates.filter((v) => satisfies(ineq, String(v)));
        expect(got, q.questionMath).toEqual(want);
        expect(want.length).toBeGreaterThanOrEqual(2);
        expect(want.length).toBeLessThan(6);
        const { exprs, ops } = pieces(ineq);
        if (candidates.includes(Number(exprs[1]))) boundaryShown += 1;
        if (ops[0] === '<' || ops[0] === '>') strict += 1;
      } else {
        expect(q.instruction).toBe('List the integers that satisfy');
        const want = [];
        for (let n = -40; n <= 40; n++) if (satisfies(q.questionMath, String(n))) want.push(n);
        expect(got, q.questionMath).toEqual(want);
        expect(want.length).toBeGreaterThanOrEqual(2);
        if (difficulty === 'stretch') expect(q.questionMath).toMatch(/\dx/);
        else expect(q.questionMath).toMatch(/ x /);
      }
    }
    console.log(`inequality-list-values ${difficulty}: ${distinct.size} distinct, boundary in list ${boundaryShown}, strict ${strict}`);
    if (difficulty === 'foundation') {
      expect(boundaryShown).toBeGreaterThan(SAMPLES * 0.4);
      expect(boundaryShown).toBeLessThan(SAMPLES * 0.6);
    }
    expect(distinct.size).toBeGreaterThan(difficulty === 'core' ? 120 : 1000); // core: 128 exactly, see the generator
  });
});

describe('solve-linear-inequalities', () => {
  it.each(BANDS)('the answer agrees with the question either side of the boundary, at %s', (difficulty) => {
    const distinct = new Set();
    let flipped = 0;
    for (let i = 0; i < SAMPLES; i++) {
      const q = generateSolveLinearInequalities({ difficulty });
      expect(q.metadata).toEqual({ topic: 'solve-linear-inequalities', difficulty });
      if (!distinct.has(q.questionMath)) { compiles(q.questionMath); compiles(q.answer); compiles(q.workingOut); }
      distinct.add(q.questionMath);

      const m = /^x (<|>|\\le|\\ge) (-?\d+)$/.exec(q.answer);
      expect(m, q.answer).toBeTruthy();
      const t = Number(m[2]);
      for (const v of [t - 2, t - 1, t - 0.5, t, t + 0.5, t + 1, t + 2]) {
        expect(satisfies(q.questionMath, String(v)), `${q.questionMath} at ${v}, answer ${q.answer}`)
          .toBe(test(v, m[1], t));
      }
      const qOp = pieces(q.questionMath).ops[0];
      if (qOp !== m[1]) flipped += 1;
    }
    console.log(`solve-linear-inequalities ${difficulty}: ${distinct.size} distinct, ${flipped} flipped`);
    // The flip is what Stretch is for, and only Stretch.
    expect(flipped).toBe(difficulty === 'stretch' ? SAMPLES : 0);
    expect(distinct.size).toBeGreaterThan(1000);
  });
});
