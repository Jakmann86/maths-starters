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
  generateDecimalPercentToFraction,
  generateFractionToDecimalPercent,
  generateRecurringDecimals,
  generateRationalOrNot,
  generateNegativeFractionsAdd,
  generateNegativeFractionsMultiply,
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

// "0.375" or "12.5\%" or "-0.4" as an exact rational.
const decOrPct = (tex) => {
  const m = /^(-?\d+(?:\.\d+)?)(\\%)?$/.exec(tex);
  expect(m, tex).toBeTruthy();
  const [whole, frac = ''] = m[1].replace('-', '').split('.');
  let [n, d] = [Number(whole + frac), 10 ** frac.length];
  if (m[2]) d *= 100;
  if (m[1].startsWith('-')) n = -n;
  const g = gcd(n, d);
  return [n / g, d / g];
};

describe('decimal-percent-to-fraction', () => {
  it.each(BANDS)('every answer equals its question at %s', (difficulty) => {
    const n = run(generateDecimalPercentToFraction, difficulty, (q) => {
      expect(q.metadata.topic).toBe('decimal-percent-to-fraction');
      expect(q.instruction).toBe('Write as a fraction in its simplest form');
      expect(lowestTerms(q.answer), q.answer).toBe(true);
      expect(req(rat(q.answer), decOrPct(q.questionMath)), `${q.questionMath} -> ${q.answer}`).toBe(true);
      const pct = q.questionMath.endsWith('\\%');
      const places = (q.questionMath.match(/\.(\d+)/)?.[1] ?? '').length;
      // Something to simplify: the answer's denominator is below the power
      // of ten the question is written over.
      expect(rat(q.answer)[1], q.questionMath).toBeLessThan(10 ** places * (pct ? 100 : 1));
      if (difficulty === 'foundation') expect(pct ? places === 0 : places <= 2, q.questionMath).toBe(true);
      if (difficulty === 'core') {
        if (pct) expect(['12.5\\%', '37.5\\%', '62.5\\%', '87.5\\%']).toContain(q.questionMath);
        else expect(places).toBe(3);
      }
      if (difficulty === 'stretch') { expect(pct && places === 1, q.questionMath).toBe(true); expect(q.questionMath).toMatch(/\.5\\%$/); }
    });
    // Real sizes: Foundation is the one- and two-place decimals and whole
    // percentages that simplify (about 170); Stretch every half percentage
    // below 100 that is not an eighth (96).
    expect(n).toBeGreaterThan({ foundation: 150, core: 300, stretch: 90 }[difficulty]);
  });
});

describe('fraction-to-decimal-percent', () => {
  it.each(BANDS)('every answer equals its question at %s', (difficulty) => {
    const n = run(generateFractionToDecimalPercent, difficulty, (q) => {
      expect(q.metadata.topic).toBe('fraction-to-decimal-percent');
      const [dec, pct] = q.answer.split(' \\text{ and } ');
      const m = /^(?:(\d+))?\\frac\{(\d+)\}\{(\d+)\}$/.exec(q.questionMath);
      expect(m, q.questionMath).toBeTruthy();
      const [w, a, b] = [Number(m[1] ?? 0), Number(m[2]), Number(m[3])];
      expect(gcd(a, b)).toBe(1);
      const value = [w * b + a, b];
      expect(req(decOrPct(dec), value), `${q.questionMath} -> ${dec}`).toBe(true);
      expect(req(decOrPct(pct), value), `${q.questionMath} -> ${pct}`).toBe(true);
      if (difficulty === 'foundation') expect([2, 4, 5, 8, 10, 20, 25]).toContain(b);
      if (difficulty === 'core') expect([16, 40, 80, 125, 200]).toContain(b);
      expect(m[1] !== undefined).toBe(difficulty === 'stretch');
    });
    // Foundation: halves to twenty-fifths (about 40): its real size.
    expect(n).toBeGreaterThan(difficulty === 'foundation' ? 35 : 150);
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

const negRun = (gen, topic, check) => (difficulty) => {
  const n = run(gen, difficulty, (q) => {
    expect(q.metadata.topic).toBe(topic);
    expect(lowestTerms(q.answer), q.answer).toBe(true);
    expect(req(rat(q.answer), rat(q.questionMath)), `${q.questionMath} -> ${q.answer}`).toBe(true);
    expect(q.questionMath).toMatch(/\\left\(-\\frac/);
    const lines = q.workingOut.split('\n');
    expect(lines[lines.length - 1].replace(/^(.* )?= /, '')).toBe(q.answer);
    check(q, difficulty);
  });
  expect(n).toBeGreaterThan(SAMPLES / 4);
};

describe('negative-fractions-add', () => {
  it.each(BANDS)('every answer equals its question at %s', negRun(generateNegativeFractionsAdd, 'negative-fractions-add', (q, difficulty) => {
    expect(q.questionMath).not.toMatch(/\\times|\\div|\^/);
    const dens = [...q.questionMath.matchAll(/\\frac\{\d+\}\{(\d+)\}/g)].map((m) => Number(m[1]));
    if (difficulty === 'foundation') {
      // "simplify first": the first fraction as printed is not in lowest terms
      const m = /^\\frac\{(\d+)\}\{(\d+)\}/.exec(q.questionMath);
      expect(gcd(Number(m[1]), Number(m[2])), q.questionMath).toBeGreaterThan(1);
      expect(dens.length).toBe(2);
    }
    if (difficulty === 'core') {
      expect(dens.length).toBe(2);
      expect(dens[0] % dens[1] !== 0 && dens[1] % dens[0] !== 0, q.questionMath).toBe(true);
    }
    if (difficulty === 'stretch') expect(dens.length).toBe(3);
  }));
});

describe('negative-fractions-multiply', () => {
  it.each(BANDS)('every answer equals its question at %s', negRun(generateNegativeFractionsMultiply, 'negative-fractions-multiply', (q, difficulty) => {
    expect(q.questionMath).not.toMatch(/ [+-] /);
    if (difficulty === 'foundation') { expect(q.questionMath).toMatch(/\\times/); expect(q.questionMath).not.toMatch(/\^/); }
    if (difficulty === 'core') expect(q.questionMath).toMatch(/\\div/);
    if (difficulty === 'stretch') expect(q.questionMath).toMatch(/\^\{2\} \\(times|div)/);
  }));
});
