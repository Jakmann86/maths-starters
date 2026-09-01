// src/generators/algebra/quadraticEquationGenerators.test.js
//
// The important check here is `checkRoots`: it parses the printed
// questionMath back into coefficients (a, b, c) with a regex, and the printed
// answer back into root values, then substitutes each root into a*x^2+bx+c
// and requires the result to be ~0. So a generator that printed one equation
// and solved a different one — the exact class of bug that matters here —
// fails immediately. This is independent of every internal variable the
// generator held; it only trusts what a student would actually see.
//
// Run: npx vitest run src/generators/algebra/quadraticEquationGenerators.test.js

import { describe, expect, it } from 'vitest';
import {
  generateSolveQuadraticRoots,
  generateSolveQuadraticFactorising,
  generateSolveQuadraticFormula,
} from './quadraticEquationGenerators';

const BANDS = ['foundation', 'core', 'stretch'];
const SAMPLES = 2000;

/** "3x^2 - 5x + 6" (or with an implicit "x^2" / missing terms) -> [a, b, c]. */
const parseQuadratic = (lhs) => {
  const s = lhs.replace(/\s+/g, '');
  const aMatch = s.match(/^(-?\d*)x\^2/);
  if (!aMatch) throw new Error(`could not find x^2 term in "${lhs}"`);
  const a = aMatch[1] === '' ? 1 : aMatch[1] === '-' ? -1 : Number(aMatch[1]);
  const rest = s.slice(aMatch[0].length);
  // rest is a run of (+|-)(coeff?)x and (+|-)(number) terms, in any order.
  let b = 0;
  let c = 0;
  const termRe = /([+-])(\d*)(x)?/g;
  let m;
  // eslint-disable-next-line no-cond-assign
  while ((m = termRe.exec(rest)) !== null) {
    if (m[0] === '') break;
    const sign = m[1] === '-' ? -1 : 1;
    const value = m[2] === '' ? 1 : Number(m[2]);
    if (m[3] === 'x') b += sign * value; else c += sign * value;
  }
  return [a, b, c];
};

/** "x^2 - 5x = -6" -> [a, b, c] of the equivalent a x^2 + bx + c = 0 form. */
const parseEquation = (equation) => {
  const [lhs, rhsStr] = equation.split('=').map((t) => t.trim());
  const rhs = Number(rhsStr);
  const [a, b, c] = parseQuadratic(lhs);
  return [a, b, c - rhs];
};

/** "x^2 = 5x" style: an x-term on the right, moved across to give a x^2+bx+c=0. */
const parseCommonFactorEquation = (equation) => {
  const [lhs, rhs] = equation.replace(/\s+/g, '').split('=');
  const [a] = parseQuadratic(lhs);
  const m = rhs.match(/^(-?\d*)x$/);
  expect(m, `could not parse common-factor RHS "${rhs}"`).toBeTruthy();
  const coeff = m[1] === '' ? 1 : m[1] === '-' ? -1 : Number(m[1]);
  return [a, -coeff, 0];
};

/** Root strings: "x = 5", "x = -3 \text{ or } 4", "x = 2 \pm \sqrt{7}", fractions. */
const parseRoots = (answer) => {
  const body = answer.replace(/^x\s*=\s*/, '');
  if (body.includes('\\pm')) {
    const m = body.match(/^(-?\d+)\s*\\pm\s*\\sqrt\{(\d+)\}$/);
    expect(m, `could not parse surd answer "${answer}"`).toBeTruthy();
    const centre = Number(m[1]);
    const rad = Math.sqrt(Number(m[2]));
    return [centre + rad, centre - rad];
  }
  const parts = body.split('\\text{ or }').map((t) => t.trim());
  const parseOne = (t) => {
    const fracMatch = t.match(/^(-)?\\frac\{(\d+)\}\{(\d+)\}$/);
    if (fracMatch) {
      const sign = fracMatch[1] ? -1 : 1;
      return (sign * Number(fracMatch[2])) / Number(fracMatch[3]);
    }
    return Number(t);
  };
  return parts.map(parseOne);
};

const approxZero = (x, tol = 1e-6) => Math.abs(x) < tol;

/** Substitutes each printed root into a*x^2+bx+c (from the printed equation) and requires ~0. */
const checkRoots = (q, { commonFactor = false } = {}) => {
  const [a, b, c] = commonFactor ? parseCommonFactorEquation(q.questionMath) : parseEquation(q.questionMath);
  const rs = parseRoots(q.answer);
  rs.forEach((x) => {
    const value = a * x * x + b * x + c;
    expect(approxZero(value, Math.max(1e-4, Math.abs(a * x * x) * 1e-9))).toBe(true);
  });
  return { a, b, c, roots: rs };
};

const checkNoForbiddenTokens = (q) => {
  const text = [q.instruction, q.workingOut, q.answer, q.questionMath].filter(Boolean).join(' ');
  expect(text).not.toMatch(/\\approx|\\tfrac/);
};

const checkNoFigureNoUnits = (q) => {
  expect(q.visualization).toBeUndefined();
  expect(q.answer).not.toMatch(/\\text\{(cm|m|mm)\}/);
};

/** "x = \pm 10" or "x = 3 \pm \sqrt{7}" -> the two root values. */
const parsePlusMinusRoots = (answer) => {
  const body = answer.replace(/^x\s*=\s*/, '');
  const m = body.match(/^(-?\d+\s*)?\\pm\s*(\d+|\\sqrt\{\d+\})$/);
  expect(m, `could not parse plus-minus answer "${answer}"`).toBeTruthy();
  const centre = m[1] === undefined ? 0 : Number(m[1].trim());
  const sqrtMatch = m[2].match(/^\\sqrt\{(\d+)\}$/);
  const spread = sqrtMatch ? Math.sqrt(Number(sqrtMatch[1])) : Number(m[2]);
  return [centre + spread, centre - spread];
};

/** "5x^2 - 3 = 22" -> [a, d, e] of a x^2 + d = e. */
const parseLinearInXSquared = (equation) => {
  const [lhs, rhsStr] = equation.replace(/\s+/g, '').split('=');
  const e = Number(rhsStr);
  const m = lhs.match(/^(-?\d*)x\^2([+-]\d+)?$/);
  expect(m, `could not parse "${lhs}"`).toBeTruthy();
  const a = m[1] === '' ? 1 : m[1] === '-' ? -1 : Number(m[1]);
  const d = m[2] === undefined ? 0 : Number(m[2]);
  return [a, d, e];
};

/** "(x - 5)^2" or "(x + 5)^2" -> the value a such that the bracket is (x - a). */
const parseBracketShift = (lhs) => {
  const m = lhs.replace(/\s+/g, '').match(/^\(x([+-]\d+)\)\^2$/);
  expect(m, `could not parse bracket "${lhs}"`).toBeTruthy();
  return -Number(m[1]);
};

describe('solve-quadratic-roots', () => {
  it.each(BANDS)('has two distinct real roots that satisfy the printed equation, at %s', (difficulty) => {
    const distinct = new Set();
    for (let i = 0; i < SAMPLES; i += 1) {
      const q = generateSolveQuadraticRoots({ difficulty });
      checkNoForbiddenTokens(q);
      checkNoFigureNoUnits(q);

      let rs;
      if (difficulty === 'foundation') {
        const [lhs, rhsStr] = q.questionMath.split('=');
        const [a, d, e] = parseLinearInXSquared(`${lhs}=${rhsStr}`);
        rs = parsePlusMinusRoots(q.answer);
        rs.forEach((x) => expect(approxZero(a * x * x + d - e)).toBe(true));
      } else {
        const [lhs, rhsStr] = q.questionMath.split('=');
        const shift = parseBracketShift(lhs.trim());
        const k = Number(rhsStr.trim());
        if (difficulty === 'core') {
          const [p, qq] = q.answer.replace(/^x\s*=\s*/, '').split('\\text{ or }').map((t) => Number(t.trim()));
          rs = qq === undefined ? [p, p] : [p, qq];
        } else {
          rs = parsePlusMinusRoots(q.answer);
        }
        rs.forEach((x) => expect(approxZero((x - shift) * (x - shift) - k)).toBe(true));
      }

      expect(rs.length).toBe(2);
      expect(Math.abs(rs[0] - rs[1])).toBeGreaterThan(1e-9);
      distinct.add(q.questionMath);
    }
    expect(distinct.size).toBeGreaterThan(30);
  });

  it('gives a squarefree surd at stretch', () => {
    for (let i = 0; i < 500; i += 1) {
      const q = generateSolveQuadraticRoots({ difficulty: 'stretch' });
      const m = q.answer.match(/\\sqrt\{(\d+)\}/);
      expect(m).toBeTruthy();
      const k = Number(m[1]);
      for (let d = 2; d * d <= k; d += 1) expect(k % (d * d)).not.toBe(0);
    }
  });
});

describe('solve-quadratic-factorising', () => {
  it.each(BANDS)('has two distinct real roots that satisfy the printed equation, at %s', (difficulty) => {
    const distinct = new Set();
    for (let i = 0; i < SAMPLES; i += 1) {
      const q = generateSolveQuadraticFactorising({ difficulty });
      checkNoForbiddenTokens(q);
      checkNoFigureNoUnits(q);
      const isCommonFactor = difficulty === 'core' && /^x\^2 = -?\d*x$/.test(q.questionMath.replace(/\s+/g, ' ').trim());
      const { a, b, c, roots: rs } = checkRoots(q, { commonFactor: isCommonFactor });
      expect(rs.length).toBe(2);
      expect(Math.abs(rs[0] - rs[1])).toBeGreaterThan(1e-9);
      // Every band here must be solvable by factorising: the discriminant is
      // always a perfect square.
      const D = b * b - 4 * a * c;
      expect(D).toBeGreaterThan(0);
      expect(Number.isInteger(Math.sqrt(D))).toBe(true);
      distinct.add(q.questionMath);
    }
    expect(distinct.size).toBeGreaterThan(30);
  });

  it('is already equal to zero at foundation, and is not at core', () => {
    for (let i = 0; i < 300; i += 1) {
      const foundation = generateSolveQuadraticFactorising({ difficulty: 'foundation' });
      expect(foundation.questionMath.trim().endsWith('= 0')).toBe(true);
    }
    let sawNonZeroRhs = false;
    for (let i = 0; i < 300; i += 1) {
      const core = generateSolveQuadraticFactorising({ difficulty: 'core' });
      if (!core.questionMath.trim().endsWith('= 0')) sawNonZeroRhs = true;
    }
    expect(sawNonZeroRhs).toBe(true);
  });

  it('produces the common-factor form (x^2 = mx) at core, regularly', () => {
    let count = 0;
    for (let i = 0; i < 500; i += 1) {
      const q = generateSolveQuadraticFactorising({ difficulty: 'core' });
      if (/^x\^2 = -?\d*x$/.test(q.questionMath.replace(/\s+/g, ' ').trim())) count += 1;
    }
    expect(count).toBeGreaterThan(500 * 0.3);
  });

  it('never leaves a common numeric factor across all three coefficients at stretch', () => {
    for (let i = 0; i < 500; i += 1) {
      const q = generateSolveQuadraticFactorising({ difficulty: 'stretch' });
      const [a, b, c] = parseEquation(q.questionMath);
      const g = [a, b, c].filter((n) => n !== 0).reduce((acc, n) => {
        let x = Math.abs(acc); let y = Math.abs(n);
        while (y) { [x, y] = [y, x % y]; }
        return x;
      });
      expect(g).toBe(1);
      expect(a).not.toBe(1);
    }
  });
});

describe('solve-quadratic-formula', () => {
  it.each(BANDS)('has two distinct real roots that satisfy the printed equation, at %s', (difficulty) => {
    const distinct = new Set();
    for (let i = 0; i < SAMPLES; i += 1) {
      const q = generateSolveQuadraticFormula({ difficulty });
      checkNoForbiddenTokens(q);
      checkNoFigureNoUnits(q);
      let rs;
      if (difficulty === 'stretch') {
        // 2 d.p. answers: re-derive from the printed equation directly
        // rather than parsing rounded strings back into exact roots.
        const [a, b, c] = parseEquation(q.questionMath);
        const D = b * b - 4 * a * c;
        expect(D).toBeGreaterThan(0);
        expect(Number.isInteger(Math.sqrt(D))).toBe(false);
        const r1 = (-b + Math.sqrt(D)) / (2 * a);
        const r2 = (-b - Math.sqrt(D)) / (2 * a);
        expect(q.answer).toBe(`x = ${r1.toFixed(2)} \\text{ or } ${r2.toFixed(2)}`);
        rs = [r1, r2];
      } else {
        const { a, b, c, roots: parsed } = checkRoots(q);
        rs = parsed;
        const D = b * b - 4 * a * c;
        expect(D).toBeGreaterThan(0);
        if (difficulty === 'foundation') {
          expect(Number.isInteger(Math.sqrt(D))).toBe(true);
        } else {
          expect(Number.isInteger(Math.sqrt(D))).toBe(false);
        }
      }
      expect(rs.length).toBe(2);
      expect(Math.abs(rs[0] - rs[1])).toBeGreaterThan(1e-9);
      distinct.add(q.questionMath);
    }
    expect(distinct.size).toBeGreaterThan(30);
  });

  it('rounds the stretch answer to exactly 2 decimal places, not 3 s.f.', () => {
    for (let i = 0; i < 500; i += 1) {
      const q = generateSolveQuadraticFormula({ difficulty: 'stretch' });
      const nums = q.answer.match(/-?\d+\.\d+/g);
      expect(nums).toBeTruthy();
      nums.forEach((n) => expect(n.split('.')[1].length).toBe(2));
    }
  });
});
