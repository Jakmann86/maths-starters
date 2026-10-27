// src/generators/number/rationalNumberGenerators.test.js
//
// Substitute-the-answer-back checks for the Rational numbers topic. Every
// question and answer is read back through latexArithmetic.check.js — an
// exact evaluator written for the harness — and required to agree as exact
// rationals. "Is it rational?" is decided from the printed item alone. Every
// distinct line is compiled by KaTeX with strict errors on.
//
// Run: npx vitest run src/generators/number/rationalNumberGenerators.test.js

import { describe, expect, it } from 'vitest';
import {
  generateFdpConversions,
  generateRecurringDecimals,
  generateRationalOrNot,
  generateNegativeFractions,
} from './rationalNumberGenerators';
import { exactOf, asRational, req, compiles } from './latexArithmetic.check';

const BANDS = ['foundation', 'core', 'stretch'];
const SAMPLES = 4000;
const gcd = (a, b) => (b === 0 ? Math.abs(a) : gcd(b, a % b));

const rat = (tex) => {
  const v = asRational(exactOf(tex));
  if (v === null) throw new Error(`not rational: ${tex}`);
  return v;
};

// A fraction answer is in lowest terms with a positive denominator.
const lowestTerms = (ans) => {
  const m = /^(-?)\\frac\{(\d+)\}\{(\d+)\}$/.exec(ans);
  if (m) return gcd(Number(m[2]), Number(m[3])) === 1 && Number(m[3]) > 1;
  return /^-?\d+$/.test(ans);
};

const run = (gen, difficulty, check) => {
  const distinct = new Set();
  for (let i = 0; i < SAMPLES; i++) {
    const q = gen({ difficulty });
    expect(q.metadata.difficulty).toBe(difficulty);
    expect(q.workingOut).not.toMatch(/\\n(?![a-z])/);
    if (!distinct.has(q.questionMath)) { compiles(q.questionMath); compiles(q.answer); compiles(q.workingOut); }
    distinct.add(q.questionMath);
    check(q);
  }
  return distinct.size;
};

describe('fdp-conversions', () => {
  it.each(BANDS)('every answer equals its question at %s', (difficulty) => {
    const n = run(generateFdpConversions, difficulty, (q) => {
      expect(q.metadata.topic).toBe('fdp-conversions');
      const want = rat(q.questionMath);
      if (difficulty === 'core') {
        const [dec, pct] = q.answer.split(' \\text{ and } ');
        expect(/^0\.\d+$/.test(dec), q.answer).toBe(true);
        expect(/^\d+(\.\d+)?\\%$/.test(pct), q.answer).toBe(true);
        expect(req(rat(dec), want), q.answer).toBe(true);
        expect(req(rat(pct), want), q.answer).toBe(true);
        // a denominator that is not a factor of 100
        const d = Number(/\{(\d+)\}$/.exec(q.questionMath)[1]);
        expect(100 % d).not.toBe(0);
      } else {
        expect(lowestTerms(q.answer), q.answer).toBe(true);
        expect(req(rat(q.answer), want), `${q.questionMath} -> ${q.answer}`).toBe(true);
        // "simplest form" always asks for something: the printed fraction
        // over a power of ten would not already be in lowest terms
        expect(q.answer).toMatch(/frac/);
      }
      if (difficulty === 'stretch') expect(q.questionMath).toMatch(/^\d+\.\d\\%$/);
    });
    console.log(`fdp-conversions ${difficulty}: ${n} distinct`);
    expect(n).toBeGreaterThan(difficulty === 'stretch' ? 90 : 80);
  });
});

describe('recurring-decimals', () => {
  it.each(BANDS)('every answer equals its question at %s', (difficulty) => {
    const n = run(generateRecurringDecimals, difficulty, (q) => {
      expect(q.questionMath).toMatch(/\\dot/);
      expect(lowestTerms(q.answer), q.answer).toBe(true);
      expect(req(rat(q.answer), rat(q.questionMath)), `${q.questionMath} -> ${q.answer}`).toBe(true);
      const dots = (q.questionMath.match(/\\dot/g) || []).length;
      if (difficulty === 'foundation') expect(q.questionMath).toMatch(/^0\.\\dot\{\d\}$/);
      if (difficulty === 'core') expect(dots).toBe(2);
      if (difficulty === 'stretch') expect(q.questionMath).toMatch(/^([1-9]\.\\dot\{\d\}|0\.\d\\dot\{\d\})$/);
    });
    console.log(`recurring-decimals ${difficulty}: ${n} distinct`);
    // Foundation's ceiling is 0.1̇ to 0.8̇ — eight questions, by design.
    if (difficulty === 'foundation') expect(n).toBe(8);
    else expect(n).toBeGreaterThan(70);
  });
});

describe('rational-or-irrational', () => {
  it.each(BANDS)('lists exactly the rational items at %s', (difficulty) => {
    const n = run(generateRationalOrNot, difficulty, (q) => {
      const items = q.questionMath.split(',\\quad ');
      expect(items.length).toBe(5);
      expect(new Set(items).size).toBe(5);
      const rational = items.filter((t) => asRational(exactOf(t)) !== null);
      expect(rational.length).toBeGreaterThanOrEqual(2);
      expect(rational.length).toBeLessThanOrEqual(3);
      expect(q.answer, q.questionMath).toBe(rational.join(',\\quad '));
      if (difficulty === 'core') {
        // at least one root that turns out whole
        expect(rational.some((t) => /sqrt/.test(t)), q.questionMath).toBe(true);
      }
      if (difficulty === 'stretch') {
        // every item needs surd arithmetic — no bare integers or decimals
        items.forEach((t) => expect(t, q.questionMath).toMatch(/sqrt/));
      }
    });
    console.log(`rational-or-irrational ${difficulty}: ${n} distinct`);
    expect(n).toBeGreaterThan(SAMPLES * 0.9);
  });
});

describe('negative-fractions', () => {
  it.each(BANDS)('every answer equals its question at %s', (difficulty) => {
    const n = run(generateNegativeFractions, difficulty, (q) => {
      expect(lowestTerms(q.answer), q.answer).toBe(true);
      expect(req(rat(q.answer), rat(q.questionMath)), `${q.questionMath} -> ${q.answer}`).toBe(true);
      expect(q.questionMath).toMatch(/\\left\(-\\frac/);
      if (difficulty !== 'stretch') {
        // "simplify first": the first fraction as printed is not in lowest terms
        const m = /^-?\\frac\{(\d+)\}\{(\d+)\}/.exec(q.questionMath);
        expect(gcd(Number(m[1]), Number(m[2])), q.questionMath).toBeGreaterThan(1);
      }
      if (difficulty === 'foundation') expect(q.questionMath).toMatch(/ [+-] \\left/);
      if (difficulty === 'core') expect(q.questionMath).toMatch(/\\times|\\div/);
      if (difficulty === 'stretch') expect(q.questionMath).toMatch(/\^\{2\}.*\\times/);
    });
    console.log(`negative-fractions ${difficulty}: ${n} distinct`);
    expect(n).toBeGreaterThan(SAMPLES / 2);
  });
});
