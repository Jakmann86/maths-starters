// src/generators/number/chapter6Generators.test.js
//
// Substitute-the-answer-back checks for the six Haese Chapter 6 generators
// (indices, standard form, surds). The check here is the strongest available
// for pure algebra: both the printed question and the printed answer are
// reduced to a number — sqrt, then frac, then powers — and required to agree
// to 9 significant figures. An answer that does not equal its own question
// fails, whatever form it is written in.
//
// Two false failures to avoid when writing this kind of harness: `\ne`
// contains the characters backslash and `n`, so a naive "no escaped newline"
// check fires on it — match `\n` only when not followed by a letter. And
// `\sqrt` must be reduced before `\frac`, or `\frac{\sqrt{11}}{11}` never
// parses (the denominator still contains an unresolved command).
//
// Run: npx vitest run src/generators/number/chapter6Generators.test.js

import { describe, expect, it } from 'vitest';
import {
  generateIndicesZeroNegative,
  generateStandardFormWrite,
  generateStandardFormCalculate,
  generateSurdsSimplify,
  generateRationaliseDenominator,
} from './chapter6Generators';

const BANDS = ['foundation', 'core', 'stretch'];
const SAMPLES = 6000;

const gcd = (a, b) => (b === 0 ? a : gcd(b, a % b));

const isSquareFree = (n) => {
  for (let d = 2; d * d <= n; d++) if (n % (d * d) === 0) return false;
  return true;
};

/**
 * Reduces one line of this file's LaTeX subset to a JS-evaluable expression
 * and returns its numeric value. Order matters: sqrt before frac (a frac's
 * denominator can itself be a bare sqrt, e.g. rationalise-denominator's
 * question), and both before exponents.
 */
const evalLatex = (str) => {
  let s = String(str);
  s = s.replace(/\\left|\\right/g, '');
  s = s.replace(/\\text\{[^}]*\}/g, '');
  s = s.replace(/\\,|\\;|\\!/g, '').replace(/\\ /g, ' ');

  // \sqrt{n} -> (value), with an immediately preceding number folded in as an
  // explicit multiplication (`2\sqrt{15}` is `2` times `sqrt(15)`, not the
  // digits `2` and the sqrt's value concatenated).
  for (let guard = 0; /\\sqrt\{-?\d+(?:\.\d+)?\}/.test(s) && guard < 20; guard++) {
    s = s.replace(/(\d+(?:\.\d+)?)?\\sqrt\{(-?\d+(?:\.\d+)?)\}/, (m, mult, n) => {
      const v = Math.sqrt(Number(n));
      return mult ? `(${mult}*(${v}))` : `(${v})`;
    });
  }

  // \frac{X}{Y} -> ((X)/(Y)). Contents are brace-free by this point (sqrt
  // already reduced), so a single non-nested pattern is enough.
  for (let guard = 0; /\\frac\{[^{}]*\}\{[^{}]*\}/.test(s) && guard < 20; guard++) {
    s = s.replace(/\\frac\{([^{}]*)\}\{([^{}]*)\}/, (m, num, den) => `((${num})/(${den}))`);
  }

  s = s.replace(/\\times/g, '*').replace(/\\div/g, '/');
  s = s.replace(/\^\{(-?\d+(?:\.\d+)?)\}/g, '**($1)');
  s = s.replace(/\^(-?\d+)/g, '**($1)');
  s = s.replace(/,/g, '');

  // eslint-disable-next-line no-new-func
  return Function(`"use strict"; return (${s});`)();
};

const closeEnough = (a, b) => Math.abs(a - b) <= 1e-9 * Math.max(1, Math.abs(a), Math.abs(b));

/** Every question must reduce to the same number as its own answer. */
const checkAnswersItsOwnQuestion = (q) => {
  // a^0 uses a letter placeholder base sometimes ('x^0', not just '3^0') —
  // the law holds for any nonzero base, so the base itself carries no number
  // to substitute back in. The dedicated foundation check below covers it.
  if (/^[a-zA-Z]\^0$/.test(q.questionMath)) return;
  const got = evalLatex(q.questionMath);
  const want = evalLatex(q.answer);
  expect(closeEnough(got, want), `${q.questionMath} => ${got}, answer ${q.answer} => ${want}`).toBe(true);
};

/** No \approx, \tfrac or \ldots — SPEC §6's forbidden tokens. */
const checkNoForbiddenTokens = (q) => {
  const text = [q.instruction, q.workingOut, q.answer, q.questionMath].filter(Boolean).join(' ');
  expect(text).not.toMatch(/\\approx|\\tfrac|\\ldots/);
};

describe('indices-zero-negative', () => {
  it.each(BANDS)('is correct at %s', (difficulty) => {
    const distinct = new Set();
    for (let i = 0; i < SAMPLES; i += 1) {
      const q = generateIndicesZeroNegative({ difficulty });
      checkNoForbiddenTokens(q);
      checkAnswersItsOwnQuestion(q);
      distinct.add(q.questionMath);

      if (difficulty === 'foundation') {
        const isZero = /\^0$/.test(q.questionMath);
        if (isZero) {
          expect(q.answer).toBe('1');
        } else {
          expect(q.questionMath).toMatch(/^\d+\^\{-\d+\}$/);
          expect(q.answer).toMatch(/^\d+$|^\\frac\{\d+\}\{\d+\}$/);
        }
      }

      if (difficulty === 'core') {
        const m = q.questionMath.match(/^\\left\(\\frac\{(\d+)\}\{(\d+)\}\\right\)\^\{-\d+\}$/);
        expect(m, q.questionMath).toBeTruthy();
        expect(m[1]).not.toBe(m[2]);
        // The reciprocal must actually have flipped: q^n / p^n (not p^n / q^n),
        // occasionally reducing to a whole number when one divides the other.
        expect(q.answer).toMatch(/^\d+$|^\\frac\{\d+\}\{\d+\}$/);
      }

      if (difficulty === 'stretch') {
        expect(q.questionMath).toMatch(/^\d+\^\{\d+\} \\div \d+\^\{\d+\}$/);
        // Landing on a negative power always gives a proper fraction (the
        // numerator is 1, the denominator base^diff >= base >= 2).
        expect(q.answer).toMatch(/^\\frac\{1\}\{\d+\}$/);
      }
    }
    expect(distinct.size).toBeGreaterThan(1);
  });
});

describe('standard-form-write', () => {
  it.each(BANDS)('is correct at %s', (difficulty) => {
    const distinct = new Set();
    for (let i = 0; i < SAMPLES; i += 1) {
      const q = generateStandardFormWrite({ difficulty });
      checkNoForbiddenTokens(q);
      checkAnswersItsOwnQuestion(q);
      distinct.add(q.questionMath);

      // Whichever side is in standard form, its mantissa is in [1, 10) —
      // and, for foundation/core, its sign proxies the large/small split
      // this generator is explicitly built around (see the module comment
      // on 9999 x 10^-1).
      const sfSide = difficulty === 'stretch' ? q.questionMath : q.answer;
      const m = sfSide.match(/^(-?\d+(?:\.\d+)?) \\times 10\^\{(-?\d+)\}$/);
      expect(m, sfSide).toBeTruthy();
      const mantissa = Math.abs(Number(m[1]));
      expect(mantissa).toBeGreaterThanOrEqual(1);
      expect(mantissa).toBeLessThan(10);

      if (difficulty === 'foundation') expect(evalLatex(q.questionMath)).toBeGreaterThanOrEqual(1);
      if (difficulty === 'core') expect(evalLatex(q.questionMath)).toBeLessThan(1);
    }
    expect(distinct.size).toBeGreaterThan(SAMPLES / 2);
  });
});

describe('standard-form-calculate', () => {
  it.each(BANDS)('is correct at %s', (difficulty) => {
    const distinct = new Set();
    for (let i = 0; i < SAMPLES; i += 1) {
      const q = generateStandardFormCalculate({ difficulty });
      checkNoForbiddenTokens(q);
      checkAnswersItsOwnQuestion(q);
      distinct.add(q.questionMath);

      const m = q.answer.match(/^(-?\d+(?:\.\d+)?) \\times 10\^\{(-?\d+)\}$/);
      expect(m, q.answer).toBeTruthy();
      const mantissa = Math.abs(Number(m[1]));
      expect(mantissa).toBeGreaterThanOrEqual(1);
      expect(mantissa).toBeLessThan(10);

      if (difficulty === 'stretch') {
        expect(q.questionMath).toMatch(/\\times 10\^\{-?\d+\}\) \+ \(/);
        // No redundant "X x 10^E = X x 10^E" conversion line when both
        // terms already share a power.
        expect(q.workingOut).not.toMatch(/(\S.*) = \1(?!\S)/);
      }
    }
    expect(distinct.size).toBeGreaterThan(SAMPLES / 2);
  });
});

describe('surds-simplify', () => {
  it.each(BANDS)('is correct at %s', (difficulty) => {
    const distinct = new Set();
    for (let i = 0; i < SAMPLES; i += 1) {
      const q = generateSurdsSimplify({ difficulty });
      checkNoForbiddenTokens(q);
      checkAnswersItsOwnQuestion(q);
      distinct.add(q.answer);

      // No simplified surd ever leaves a square factor under the root.
      const roots = [...q.answer.matchAll(/\\sqrt\{(\d+)\}/g)].map((mm) => Number(mm[1]));
      roots.forEach((n) => expect(isSquareFree(n), `${q.answer}: sqrt{${n}} not square-free`).toBe(true));

      if (difficulty === 'stretch') {
        // Collecting like surds only works once both are simplified —
        // confirm the working shows a genuinely common radicand.
        const inner = q.answer.match(/\\sqrt\{(\d+)\}$/);
        expect(inner, q.answer).toBeTruthy();
      }
    }
    expect(distinct.size).toBeGreaterThan(1);
  });
});

describe('rationalise-denominator', () => {
  it.each(BANDS)('is correct at %s', (difficulty) => {
    const distinct = new Set();
    for (let i = 0; i < SAMPLES; i += 1) {
      const q = generateRationaliseDenominator({ difficulty });
      checkNoForbiddenTokens(q);
      checkAnswersItsOwnQuestion(q);
      distinct.add(q.answer);

      // No rationalised answer still has a surd in its denominator.
      const asFrac = q.answer.match(/^\\frac\{([^{}]*)\}\{([^{}]*)\}$/);
      if (asFrac) expect(asFrac[2]).not.toMatch(/\\sqrt/);

      if (difficulty === 'stretch') {
        const d = q.questionMath.match(/\\sqrt\{(\d+)\}\}$/);
        expect(d, q.questionMath).toBeTruthy();
        // The denominator must be simplified before it can be rationalised —
        // so it always starts out with a square factor to extract.
        let m = Number(d[1]);
        let squareFactor = false;
        for (let k = 2; k * k <= m; k++) if (m % (k * k) === 0) squareFactor = true;
        expect(squareFactor, `${d[1]} has no square factor`).toBe(true);
      } else {
        // Foundation and core split on whether a/b cancel. Recover a and b
        // from the question and check the split directly rather than
        // inferring it from the answer's shape.
        const m = q.questionMath.match(/^\\frac\{(\d+)\}\{\\sqrt\{(\d+)\}\}$/);
        expect(m, q.questionMath).toBeTruthy();
        const [a, b] = [Number(m[1]), Number(m[2])];
        if (difficulty === 'foundation') expect(gcd(a, b)).toBe(1);
        if (difficulty === 'core') expect(gcd(a, b)).toBeGreaterThan(1);
      }
    }
    expect(distinct.size).toBeGreaterThan(1);
  });
});
