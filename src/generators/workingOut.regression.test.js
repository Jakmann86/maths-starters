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

  it('D012 solve-linear-both-sides: a zero constant is not printed as "+ 0"', () => {
    draws('solve-linear-both-sides', 'core', 1500).forEach((q) => {
      expect(q.questionMath).not.toMatch(/\+ 0(?![\d.])/);
      expect(q.workingOut).not.toMatch(/\+ 0(?![\d.])/);
    });
  });

  it('D013 solve-equations-fractions: Core shows the expanded line after cross-multiplying', () => {
    draws('solve-equations-fractions', 'core').forEach((q) => {
      const ls = lines(q);
      expect(ls[0]).toMatch(/^\d\(x [+-] \d+\) = \d\(x [+-] \d+\)$/);
      expect(ls[1]).toMatch(/^\dx [+-] \d+ = \dx [+-] \d+$/);
    });
  });

  it('D015 solve-fractional-coefficients: no fraction over 1, no q/q coefficient, no "+ 0"', () => {
    ['foundation', 'core', 'stretch'].forEach((band) => draws('solve-fractional-coefficients', band, 1000).forEach((q) => {
      expect(q.workingOut).not.toMatch(/\\frac\{\d+\}\{1\}/);
      expect(q.workingOut).not.toMatch(/\\frac\{(\d+)\}\{\1\}x/);
      expect(`${q.questionMath}\n${q.workingOut}`).not.toMatch(/\+ 0(?![\d.])/);
    }));
  });

  it('D016 solve-power-equations: a value quoted to 3 s.f. shows three figures', () => {
    ['core', 'stretch'].forEach((band) => draws('solve-power-equations', band, 600).forEach((q) => {
      const m = /(\d\.\d+) \\text\{ \(3 s\.f\.\)\}/.exec(q.workingOut);
      expect(m && m[1].length).toBe(4);
    }));
  });

  it('D018 solve-linear-inequalities: no repeated working line', () => {
    draws('solve-linear-inequalities', 'core', 800).forEach((q) => {
      const ls = lines(q);
      ls.forEach((l, i) => { if (i) expect(l).not.toBe(ls[i - 1]); });
    });
  });

  it('D019 exponential-graphs: no repeated working line', () => {
    ['foundation', 'core'].forEach((band) => draws('exponential-graphs', band, 800).forEach((q) => {
      const ls = lines(q);
      ls.forEach((l, i) => { if (i) expect(l).not.toBe(ls[i - 1]); });
    }));
  });
});
