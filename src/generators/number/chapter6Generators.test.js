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
  generateSurdsExpand,
} from './chapter6Generators';
import { exactOf, vequal, compiles } from './latexArithmetic.check';

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

// Relative, not floored at 1: standard form reaches 10^-30, where an
// absolute 1e-9 tolerance would accept any two numbers at all.
const closeEnough = (a, b) => Math.abs(a - b) <= 1e-9 * Math.max(Math.abs(a), Math.abs(b));

/** "3.04 \\times 10^{-21}" -> [BigInt digits, exponent], held exactly. */
const exactSf = (str) => {
  const m = String(str).match(/^(\d+)(?:\.(\d+))? \\times 10\^\{(-?\d+)\}$/);
  if (!m) return null;
  const frac = m[2] ?? '';
  return [BigInt(m[1] + frac), Number(m[3]) - frac.length];
};
const exactEqual = ([n1, e1], [n2, e2]) => {
  const e = Math.min(e1, e2);
  return n1 * 10n ** BigInt(e1 - e) === n2 * 10n ** BigInt(e2 - e);
};

/** Every question must reduce to the same number as its own answer. */
const checkAnswersItsOwnQuestion = (q) => {
  // Anything to the power 0 uses a letter somewhere in the base sometimes
  // ('x^0', or a bracketed '(3a^2b^3)^0') — the law holds for any nonzero
  // base, so there's no number to substitute back in. Answer is always '1'.
  if (/\^0$/.test(q.questionMath) && q.answer === '1') return;
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
        // Two shapes: a whole bracketed expression to the power 0, or a
        // fractional base to a negative index (the reciprocal-flip case).
        const isZero = /\^0$/.test(q.questionMath);
        if (isZero) {
          expect(q.questionMath).toMatch(/^\(\d+[a-z]\^\d[a-z]\^\d\)\^0$/);
          expect(q.answer).toBe('1');
        } else {
          const m = q.questionMath.match(/^\\left\(\\frac\{(\d+)\}\{(\d+)\}\\right\)\^\{-\d+\}$/);
          expect(m, q.questionMath).toBeTruthy();
          expect(m[1]).not.toBe(m[2]);
          // The reciprocal must actually have flipped: q^n / p^n (not p^n / q^n),
          // occasionally reducing to a whole number when one divides the other.
          expect(q.answer).toMatch(/^\d+$|^\\frac\{\d+\}\{\d+\}$/);
        }
      }

      if (difficulty === 'stretch') {
        // Two shapes, each chaining two index laws rather than applying one:
        // power-of-a-power straight into the negative-index rule (the outer
        // power multiplies the exponent first, which only makes it more
        // negative, then the reciprocal step applies), or the
        // multiplication/division law landing on a negative power. Both give
        // a proper fraction — neither shape resolves to a bare 1, which
        // would read as easier than Core's fraction-reciprocal task rather
        // than harder.
        const isPowerOfPower = /^\(\d+\^\{\d\}\)\^\{-\d\}$/.test(q.questionMath);
        if (isPowerOfPower) {
          expect(q.questionMath).toMatch(/^\(\d+\^\{\d\}\)\^\{-\d\}$/);
          expect(q.answer).toMatch(/^\\frac\{1\}\{\d+\}$/);
        } else {
          expect(q.questionMath).toMatch(/^\d+\^\{\d+\} \\div \d+\^\{\d+\}$/);
          // Landing on a negative power always gives a proper fraction (the
          // numerator is 1, the denominator base^diff >= base >= 2).
          expect(q.answer).toMatch(/^\\frac\{1\}\{\d+\}$/);
        }
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

      // An ordinary number never ends in a redundant zero after the point.
      if (difficulty === 'stretch') expect(q.answer, q.questionMath).not.toMatch(/\.\d*0$|\.$/);

      if (difficulty === 'foundation') expect(evalLatex(q.questionMath)).toBeGreaterThanOrEqual(1);
      if (difficulty === 'core') expect(evalLatex(q.questionMath)).toBeLessThan(1);
    }
    expect(distinct.size).toBeGreaterThan(SAMPLES / 2);
  });
});

describe('standard-form-calculate', () => {
  it.each(BANDS)('is correct at %s', (difficulty) => {
    const distinct = new Set();
    let large = 0, subtract = 0, adjust = 0;
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

      if (difficulty === 'core') {
        // Half of Core divides numbers whose quotient is below 1 (4.2 / 6),
        // so the answer has to be adjusted back into standard form.
        const [d1, d2] = q.questionMath.match(/^\((\d+(?:\.\d+)?) .*\) \\div \((\d+) /).slice(1).map(Number);
        if (d1 < d2) adjust += 1;
      }

      if (difficulty === 'stretch') {
        expect(q.questionMath).toMatch(/\\times 10\^\{-?\d+\}\) [+-] \(/);
        // Exact sum or difference, since floats can't separate values near 10^-30.
        const [, a1, op, a2] = q.questionMath.match(/^\((.*)\) ([+-]) \((.*)\)$/);
        const [t1, t2] = [a1, a2].map(exactSf);
        const e = Math.min(t1[1], t2[1]);
        const [v1, v2] = [t1[0] * 10n ** BigInt(t1[1] - e), t2[0] * 10n ** BigInt(t2[1] - e)];
        if (op === '-') { subtract += 1; expect(v1 > v2, q.questionMath).toBe(true); }
        const sum = [op === '+' ? v1 + v2 : v1 - v2, e];
        expect(exactEqual(sum, exactSf(q.answer)), `${q.questionMath} = ${q.answer}`).toBe(true);
        if (Math.abs(Number(m[2])) >= 12) large += 1;
        // No redundant "X x 10^E = X x 10^E" conversion line when both
        // terms already share a power. Anchored to whole lines, so a genuine
        // subtraction such as 5 - 2.5 = 2.5 is not mistaken for one.
        expect(q.workingOut).not.toMatch(/(^|\n)(\S.*) = \2(?=\n|$)/);
      }
    }
    expect(distinct.size).toBeGreaterThan(SAMPLES / 2);
    // Roughly half of Stretch uses powers too large to write out in full,
    // and roughly half subtracts rather than adds.
    if (difficulty === 'stretch') {
      expect(large / SAMPLES).toBeGreaterThan(0.4);
      expect(subtract / SAMPLES).toBeGreaterThan(0.45);
      expect(subtract / SAMPLES).toBeLessThan(0.55);
    }
    if (difficulty === 'core') {
      expect(adjust / SAMPLES).toBeGreaterThan(0.45);
      expect(adjust / SAMPLES).toBeLessThan(0.55);
    }
  });
});

describe('surds-simplify', () => {
  it.each(BANDS)('is correct at %s', (difficulty) => {
    const distinct = new Set();
    let coefficients = 0;
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
        if (/^\d/.test(q.questionMath) || /\+ \d/.test(q.questionMath)) coefficients += 1;
      }
    }
    expect(distinct.size).toBeGreaterThan(1);
    // Half of Stretch puts a coefficient on the surds (3\sqrt{8} + 2\sqrt{18}).
    if (difficulty === 'stretch') {
      expect(coefficients / SAMPLES).toBeGreaterThan(0.4);
      expect(coefficients / SAMPLES).toBeLessThan(0.55);
    }
  });
});

describe('rationalise-denominator', () => {
  it.each(BANDS)('is correct at %s', (difficulty) => {
    const distinct = new Set();
    let conjugates = 0, negatives = 0, binomial = 0;
    for (let i = 0; i < SAMPLES; i += 1) {
      const q = generateRationaliseDenominator({ difficulty });
      checkNoForbiddenTokens(q);
      checkAnswersItsOwnQuestion(q);
      distinct.add(q.answer);

      // No rationalised answer still has a surd in its denominator.
      const asFrac = q.answer.match(/^-?\\frac\{([^{}]*)\}\{([^{}]*)\}$/);
      if (asFrac) expect(asFrac[2]).not.toMatch(/\\sqrt/);

      // A coefficient of 1 is never written out — `\sqrt{14}`, not
      // `1\sqrt{14}` — whether the surd stands alone or sits in a fraction's
      // numerator.
      expect(q.answer).not.toMatch(/(^|\{)1\\sqrt/);

      const conj = q.questionMath.match(/^\\frac\{(\d+)\}\{(\d+) ([+-]) \\sqrt\{(\d+)\}\}$/);
      if (difficulty === 'stretch' && conj) {
        // b ± sqrt(c) denominator: the answer is already checked equal to the
        // question; also check a fractional answer is fully reduced — no
        // integer divides every numerator coefficient and the denominator.
        conjugates += 1;
        const [b, c] = [Number(conj[2]), Number(conj[4])];
        if (b * b < c) negatives += 1;
        const ints = [...q.answer.replace(/\\sqrt\{\d+\}/g, 's').matchAll(/\d+/g)].map((mm) => Number(mm[0]));
        const sqrtCoeff = /(^|[^\d])\\sqrt/.test(q.answer) ? [1] : [];
        if (asFrac) expect(ints.concat(sqrtCoeff).reduce(gcd), q.answer).toBe(1);
        continue;
      }

      if (difficulty === 'stretch') {
        const d = q.questionMath.match(/\\sqrt\{(\d+)\}\}$/);
        expect(d, q.questionMath).toBeTruthy();
        // The denominator must be simplified before it can be rationalised —
        // so it always starts out with a square factor to extract.
        let m = Number(d[1]);
        let squareFactor = false;
        for (let k = 2; k * k <= m; k++) if (m % (k * k) === 0) squareFactor = true;
        expect(squareFactor, `${d[1]} has no square factor`).toBe(true);
      } else if (difficulty === 'core' && /^\\frac\{\d+ [+-] /.test(q.questionMath)) {
        // Core's two-term numerator, (a ± sqrt b) / sqrt b: the answer is
        // already checked equal; it must also be fully reduced.
        binomial += 1;
        const ints = [...q.answer.replace(/\\sqrt\{\d+\}/g, 's').matchAll(/\d+/g)].map((mm) => Number(mm[0]));
        const sqrtCoeff = /(^|[^\d])\\sqrt/.test(q.answer) ? [1] : [];
        if (asFrac) expect(ints.concat(sqrtCoeff).reduce(gcd), q.answer).toBe(1);
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
    // Stretch splits evenly between a b ± sqrt(c) denominator and one that
    // needs simplifying first; the conjugate kind includes negative b^2 - c.
    if (difficulty === 'stretch') {
      expect(conjugates / SAMPLES).toBeGreaterThan(0.45);
      expect(conjugates / SAMPLES).toBeLessThan(0.55);
      expect(negatives).toBeGreaterThan(conjugates / 10);
      console.log(`rationalise stretch: ${conjugates} conjugate (${negatives} negative), distinct answers ${distinct.size}`);
    } else {
      expect(conjugates).toBe(0);
    }
    if (difficulty === 'core') {
      expect(binomial / SAMPLES).toBeGreaterThan(0.45);
      expect(binomial / SAMPLES).toBeLessThan(0.55);
    } else {
      expect(binomial).toBe(0);
    }
  });
});

// Read back by latexArithmetic.check.js, which multiplies surds exactly, so
// the expanded answer must equal the printed brackets term for term.
describe('surds-expand', () => {
  it.each(BANDS)('is correct at %s', (difficulty) => {
    const distinct = new Set();
    let conjugates = 0;
    for (let i = 0; i < SAMPLES; i += 1) {
      const q = generateSurdsExpand({ difficulty });
      expect(q.metadata.topic).toBe('surds-expand');
      checkNoForbiddenTokens(q);
      if (!distinct.has(q.questionMath)) { compiles(q.questionMath); compiles(q.answer); compiles(q.workingOut); }
      distinct.add(q.questionMath);
      expect(vequal(exactOf(q.questionMath), exactOf(q.answer)), `${q.questionMath} = ${q.answer}`).toBe(true);

      // constant first, then one simplified surd
      expect(q.answer, q.answer).toMatch(/^(-?\d+( [+-] \d*\\sqrt\{\d+\})?|-?\d*\\sqrt\{\d+\})$/);
      expect(q.answer).not.toMatch(/(^|[^\d])1\\sqrt/);
      [...q.answer.matchAll(/\\sqrt\{(\d+)\}/g)].forEach((mm) => expect(isSquareFree(Number(mm[1])), q.answer).toBe(true));
      if (!/sqrt/.test(q.answer)) conjugates += 1;

      const roots = new Set([...q.questionMath.matchAll(/\\sqrt\{(\d+)\}/g)].map((mm) => mm[1]));
      if (difficulty === 'stretch') expect(roots.size, q.questionMath).toBe(2);
      else expect(roots.size, q.questionMath).toBe(1);
      if (difficulty === 'foundation') expect(q.questionMath).not.toMatch(/\d\\sqrt/);
      if (difficulty === 'core') expect(q.questionMath).toMatch(/\d\\sqrt/);
    }
    console.log(`surds-expand ${difficulty}: ${distinct.size} distinct, ${conjugates} with no surd left`);
    expect(distinct.size).toBeGreaterThan(difficulty === 'foundation' ? 300 : 1000);
    // A conjugate pair, whose surds cancel, comes up at Foundation about one time in four.
    if (difficulty === 'foundation') expect(conjugates / SAMPLES).toBeGreaterThan(0.2);
  });
});
