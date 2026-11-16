// Regression tests from the working-out audit (audit/defects.md). Each block
// names the defect it pins. They sample rather than seed: the generators draw
// from lodash's captured Math.random, and the audit's seeded runs live in
// audit/scripts.

import { describe, it, expect } from 'vitest';
import { generateForSkill } from '../curriculum/skills';

const N = 400;
const draws = (id, band, n = N) => Array.from({ length: n }, () => generateForSkill(id, band));
const lines = (q) => q.workingOut.split('\n');

describe('audit regressions: working out', () => {
  it('D001 solve-quadratic-roots: no repeated line when the coefficient of x^2 is 1', () => {
    draws('solve-quadratic-roots', 'foundation').forEach((q) => {
      const ls = lines(q);
      ls.forEach((l, i) => { if (i) expect(l).not.toBe(ls[i - 1]); });
    });
  });

  it('D002 solve-quadratic-factorising: the question never prints a coefficient of 1', () => {
    draws('solve-quadratic-factorising', 'core', 1500).forEach((q) => expect(q.questionMath).not.toMatch(/(^|[^\d])1x/));
  });
});
