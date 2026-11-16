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

  it('D003 quadratic-symmetry: a negative intercept being added is bracketed', () => {
    draws('quadratic-symmetry', 'foundation').forEach((q) => expect(q.workingOut).not.toMatch(/\+ -/));
  });

  it('D004 quadratic-find-function: no "1a" and no doubled brackets in the substitution', () => {
    ['core', 'stretch'].forEach((band) => draws('quadratic-find-function', band).forEach((q) => {
      expect(q.workingOut).not.toMatch(/(^|[^\d])1a/);
      expect(q.workingOut).not.toMatch(/\(\(/);
    }));
  });

  it('D011 solve-linear-equations: no "- -" and no "- 0" in the working', () => {
    draws('solve-linear-equations', 'core', 1000).forEach((q) => {
      expect(q.workingOut).not.toMatch(/- -/);
      expect(q.workingOut).not.toMatch(/- 0(\n|$)/);
    });
  });
});
