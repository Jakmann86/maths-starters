// src/generators/geometry/solidsGenerators.test.js
//
// Substitute-the-answer-back checks for the six pi-based solids generators:
// each question is randomly exact or rounded to 3 s.f. (roughly 50/50), and
// the instruction always states which. These tests recompute the expected
// answer independently from the figure's own labels — never from the
// generator's internal variables — using a second, differently-written 3 s.f.
// formatter (toPrecision, not the generator's log10/round sf()) so a shared
// rounding bug cannot hide from both sides of the check.
//
// Run: npx vitest run src/generators/geometry/solidsGenerators.test.js

import { describe, expect, it } from 'vitest';
import {
  generateSurfaceAreaCylinder, generateVolumeCylinder,
  generateSurfaceAreaCone, generateVolumeCone,
  generateSurfaceAreaSphere, generateVolumeSphere,
  sf,
} from './solidsGenerators';

const BANDS = ['foundation', 'core', 'stretch'];
const SAMPLES = 800;

const numFrom = (str) => Number(str.split(' ')[0]);

/** Independent 3 s.f. formatter — deliberately not the generator's own sf(). */
const sf3 = (x) => {
  if (x === 0) return '0';
  const s = x.toPrecision(3);
  if (!s.includes('e')) return s;
  // toPrecision switches to exponential once the integer part needs more
  // digits than the precision allows; convert back to a fixed decimal, which
  // is the house convention (1260, never 1.26e+3).
  const [mantissa, exp] = s.split('e');
  const e = Number(exp);
  return (Number(mantissa) * 10 ** e).toFixed(Math.max(0, 2 - e));
};

const approxEqual = (a, b, tol = 1e-6) => Math.abs(a - b) <= tol * Math.max(1, Math.abs(a), Math.abs(b));

/** Parses "45\pi", "\pi", or "\frac{500}{3}\pi" into a numeric pi-coefficient. */
const parsePi = (str) => {
  const whole = str.match(/^(-?\d+(?:\.\d+)?)?\\pi$/);
  if (whole) return whole[1] === undefined ? 1 : Number(whole[1]);
  const frac = str.match(/^\\frac\{(-?\d+(?:\.\d+)?)\}\{(-?\d+(?:\.\d+)?)\}\\pi$/);
  if (frac) return Number(frac[1]) / Number(frac[2]);
  return null;
};

const asksExact = (q) => /in terms of/.test(q.instruction);

/** Every question must state which form it wants, and its answer must match that form. */
const checkFormAgreement = (q) => {
  expect(/in terms of|3 significant figures/.test(q.instruction)).toBe(true);
  const answerHasPi = /\\pi/.test(q.answer);
  expect(answerHasPi).toBe(asksExact(q));
};

/** No \approx, \tfrac or \ldots should ever reach the renderer (SPEC §6). */
const checkNoForbiddenTokens = (q) => {
  const text = [q.instruction, q.workingOut, q.answer, q.answerUnits, q.questionMath].filter(Boolean).join(' ');
  expect(text).not.toMatch(/\\approx|\\tfrac|\\ldots/);
};

/** A rounded answer string must be a plain decimal, trailing zeros included. */
const checkPlainDecimal = (str) => expect(str).toMatch(/^\d+(\.\d+)?$/);

describe('surface-area-cylinder', () => {
  it.each(BANDS)('is correct at %s', (difficulty) => {
    let exact = 0; let rounded = 0; const distinct = new Set();
    for (let i = 0; i < SAMPLES; i += 1) {
      const q = generateSurfaceAreaCylinder({ difficulty });
      checkNoForbiddenTokens(q);
      checkFormAgreement(q);
      expect(q.answerUnits).toContain('^2');

      const fig = q.visualization;
      let r; let h; let kExpected;
      if (difficulty === 'foundation') {
        r = numFrom(fig.r); h = numFrom(fig.h);
        kExpected = 2 * r * h;
      } else if (difficulty === 'stretch') {
        r = numFrom(fig.diameter) / 2; h = numFrom(fig.h);
        kExpected = r * (2 * h + r);
      } else {
        r = numFrom(fig.r); h = numFrom(fig.h);
        kExpected = 2 * r * (h + r);
      }

      if (asksExact(q)) {
        expect(approxEqual(parsePi(q.answer), kExpected)).toBe(true);
        exact += 1;
      } else {
        checkPlainDecimal(q.answer);
        expect(q.answer).toBe(sf3(kExpected * Math.PI));
        rounded += 1;
      }
      distinct.add(q.instruction + q.answer + JSON.stringify(fig));
    }
    expect(exact).toBeGreaterThan(0);
    expect(rounded).toBeGreaterThan(0);
    expect(distinct.size).toBeGreaterThan(30);
  });
});

describe('volume-cylinder', () => {
  it.each(BANDS)('is correct at %s', (difficulty) => {
    let exact = 0; let rounded = 0; const distinct = new Set();
    for (let i = 0; i < SAMPLES; i += 1) {
      const q = generateVolumeCylinder({ difficulty });
      checkNoForbiddenTokens(q);
      const fig = q.visualization;

      if (q.questionMath) {
        // stretch, reverse question
        const findH = fig.unknown === 'h';
        const qmStr = q.questionMath.match(/V = (.+)\\text/)[1];
        const got = Number(q.answer.replace('x = ', ''));
        if (/\\pi/.test(qmStr)) {
          const k = parsePi(qmStr);
          const known = findH ? numFrom(fig.r) : numFrom(fig.h);
          const expected = findH ? k / (known * known) : Math.sqrt(k / known);
          expect(approxEqual(got, expected)).toBe(true);
          expect(Number.isInteger(got)).toBe(true);
          exact += 1;
        } else {
          const V = Number(qmStr);
          const known = findH ? numFrom(fig.r) : numFrom(fig.h);
          const expected = findH ? V / (Math.PI * known * known) : Math.sqrt(V / (Math.PI * known));
          checkPlainDecimal(q.answer.replace('x = ', ''));
          expect(q.answer).toBe(`x = ${sf3(expected)}`);
          rounded += 1;
        }
        distinct.add(q.questionMath + q.answer + JSON.stringify(fig));
        continue;
      }

      checkFormAgreement(q);
      expect(q.answerUnits).toContain('^3');
      const r = difficulty === 'core' ? numFrom(fig.diameter) / 2 : numFrom(fig.r);
      const h = numFrom(fig.h);
      const kExpected = r * r * h;
      if (asksExact(q)) {
        expect(approxEqual(parsePi(q.answer), kExpected)).toBe(true);
        exact += 1;
      } else {
        checkPlainDecimal(q.answer);
        expect(q.answer).toBe(sf3(kExpected * Math.PI));
        rounded += 1;
      }
      distinct.add(q.instruction + q.answer + JSON.stringify(fig));
    }
    expect(exact).toBeGreaterThan(0);
    expect(rounded).toBeGreaterThan(0);
    expect(distinct.size).toBeGreaterThan(20);
  });

  it('the stretch reverse question splits roughly evenly between finding h and finding r', () => {
    let findH = 0; let findR = 0;
    for (let i = 0; i < SAMPLES; i += 1) {
      const q = generateVolumeCylinder({ difficulty: 'stretch' });
      if (q.visualization.unknown === 'h') findH += 1; else findR += 1;
    }
    expect(findH).toBeGreaterThan(SAMPLES * 0.3);
    expect(findR).toBeGreaterThan(SAMPLES * 0.3);
  });
});

describe('surface-area-cone', () => {
  it.each(BANDS)('is correct at %s', (difficulty) => {
    let exact = 0; let rounded = 0; const distinct = new Set();
    for (let i = 0; i < SAMPLES; i += 1) {
      const q = generateSurfaceAreaCone({ difficulty });
      checkNoForbiddenTokens(q);
      checkFormAgreement(q);
      expect(q.answerUnits).toContain('^2');

      const fig = q.visualization;
      let kExpected;
      if (difficulty === 'stretch') {
        const r = numFrom(fig.r); const h = numFrom(fig.h);
        const l = Math.round(Math.sqrt(r * r + h * h));
        expect(approxEqual(l * l, r * r + h * h)).toBe(true); // confirms a genuine Pythagorean triple
        kExpected = r * (l + r);
      } else {
        const r = numFrom(fig.r); const l = numFrom(fig.l);
        kExpected = r * (l + r) - (difficulty === 'foundation' ? r * r : 0);
      }

      if (asksExact(q)) {
        expect(approxEqual(parsePi(q.answer), kExpected)).toBe(true);
        exact += 1;
      } else {
        checkPlainDecimal(q.answer);
        expect(q.answer).toBe(sf3(kExpected * Math.PI));
        rounded += 1;
      }
      distinct.add(q.instruction + q.answer + JSON.stringify(fig));
    }
    expect(exact).toBeGreaterThan(0);
    expect(rounded).toBeGreaterThan(0);
    if (difficulty !== 'stretch') expect(distinct.size).toBeGreaterThan(30);
  });
});

describe('volume-cone', () => {
  it.each(BANDS)('is correct at %s', (difficulty) => {
    let exact = 0; let rounded = 0; const distinct = new Set();
    for (let i = 0; i < SAMPLES; i += 1) {
      const q = generateVolumeCone({ difficulty });
      checkNoForbiddenTokens(q);
      const fig = q.visualization;

      if (q.questionMath) {
        const r = numFrom(fig.r);
        const qmStr = q.questionMath.match(/V = (.+)\\text/)[1];
        const got = Number(q.answer.replace('x = ', ''));
        if (/\\pi/.test(qmStr)) {
          const k = parsePi(qmStr);
          const expected = (3 * k) / (r * r);
          expect(approxEqual(got, expected)).toBe(true);
          expect(Number.isInteger(got)).toBe(true);
          exact += 1;
        } else {
          const V = Number(qmStr);
          const expected = (3 * V) / (Math.PI * r * r);
          checkPlainDecimal(q.answer.replace('x = ', ''));
          expect(q.answer).toBe(`x = ${sf3(expected)}`);
          rounded += 1;
        }
        distinct.add(q.questionMath + q.answer + JSON.stringify(fig));
        continue;
      }

      checkFormAgreement(q);
      expect(q.answerUnits).toContain('^3');
      const r = difficulty === 'core' ? numFrom(fig.diameter) / 2 : numFrom(fig.r);
      const h = numFrom(fig.h);
      const kExpected = (r * r * h) / 3;
      if (asksExact(q)) {
        expect(approxEqual(parsePi(q.answer), kExpected)).toBe(true);
        exact += 1;
      } else {
        checkPlainDecimal(q.answer);
        expect(q.answer).toBe(sf3(kExpected * Math.PI));
        rounded += 1;
      }
      distinct.add(q.instruction + q.answer + JSON.stringify(fig));
    }
    expect(exact).toBeGreaterThan(0);
    expect(rounded).toBeGreaterThan(0);
  });
});

describe('surface-area-sphere', () => {
  it.each(BANDS)('is correct at %s', (difficulty) => {
    let exact = 0; let rounded = 0;
    for (let i = 0; i < SAMPLES; i += 1) {
      const q = generateSurfaceAreaSphere({ difficulty });
      checkNoForbiddenTokens(q);
      const fig = q.visualization;

      if (q.questionMath) {
        const qmStr = q.questionMath.match(/A = (.+)\\text/)[1];
        const got = Number(q.answer.replace('x = ', ''));
        if (/\\pi/.test(qmStr)) {
          const k = parsePi(qmStr);
          const expected = Math.sqrt(k / 4);
          expect(approxEqual(got, expected)).toBe(true);
          expect(Number.isInteger(got)).toBe(true);
          exact += 1;
        } else {
          const A = Number(qmStr);
          const expected = Math.sqrt(A / (4 * Math.PI));
          checkPlainDecimal(q.answer.replace('x = ', ''));
          expect(q.answer).toBe(`x = ${sf3(expected)}`);
          rounded += 1;
        }
        continue;
      }

      checkFormAgreement(q);
      expect(q.answerUnits).toContain('^2');
      const r = difficulty === 'core' ? numFrom(fig.diameter) / 2 : numFrom(fig.r);
      const kExpected = 4 * r * r;
      if (asksExact(q)) {
        expect(approxEqual(parsePi(q.answer), kExpected)).toBe(true);
        exact += 1;
      } else {
        checkPlainDecimal(q.answer);
        expect(q.answer).toBe(sf3(kExpected * Math.PI));
        rounded += 1;
      }
    }
    expect(exact).toBeGreaterThan(0);
    expect(rounded).toBeGreaterThan(0);
  });
});

describe('volume-sphere', () => {
  it.each(BANDS)('is correct at %s', (difficulty) => {
    let exact = 0; let rounded = 0;
    for (let i = 0; i < SAMPLES; i += 1) {
      const q = generateVolumeSphere({ difficulty });
      checkNoForbiddenTokens(q);
      const fig = q.visualization;

      if (q.questionMath) {
        const qmStr = q.questionMath.match(/V = (.+)\\text/)[1];
        const got = Number(q.answer.replace('x = ', ''));
        if (/\\pi/.test(qmStr)) {
          const fracMatch = qmStr.match(/^\\frac\{(\d+)\}\{3\}\\pi$/);
          const wholeMatch = qmStr.match(/^(\d+)?\\pi$/);
          const num = fracMatch ? Number(fracMatch[1]) : (wholeMatch[1] === undefined ? 3 : Number(wholeMatch[1]) * 3);
          const expected = Math.cbrt(num / 4);
          expect(approxEqual(got, expected)).toBe(true);
          expect(Number.isInteger(got)).toBe(true);
          exact += 1;
        } else {
          const V = Number(qmStr);
          const expected = Math.cbrt((3 * V) / (4 * Math.PI));
          checkPlainDecimal(q.answer.replace('x = ', ''));
          expect(q.answer).toBe(`x = ${sf3(expected)}`);
          rounded += 1;
        }
        continue;
      }

      checkFormAgreement(q);
      expect(q.answerUnits).toContain('^3');
      const r = difficulty === 'core' ? numFrom(fig.diameter) / 2 : numFrom(fig.r);
      const numExpected = 4 * r * r * r;
      if (asksExact(q)) {
        const fracMatch = q.answer.match(/^\\frac\{(\d+)\}\{3\}\\pi$/);
        const wholeMatch = q.answer.match(/^(\d+)?\\pi$/);
        const coeff = fracMatch ? Number(fracMatch[1]) / 3 : (wholeMatch[1] === undefined ? 1 : Number(wholeMatch[1]));
        expect(approxEqual(coeff, numExpected / 3)).toBe(true);
        exact += 1;
      } else {
        checkPlainDecimal(q.answer);
        expect(q.answer).toBe(sf3((numExpected / 3) * Math.PI));
        rounded += 1;
      }
    }
    expect(exact).toBeGreaterThan(0);
    expect(rounded).toBeGreaterThan(0);
  });
});

describe('sf() — 3 significant figure formatting', () => {
  it('keeps trailing zeros that a re-parsed Number would drop', () => {
    expect(sf(1260)).toBe('1260');
    expect(sf(3.1)).toBe('3.10');
    expect(sf(50)).toBe('50.0');
  });

  it('returns a string, not a number', () => {
    expect(typeof sf(1260)).toBe('string');
  });

  it('renormalises when rounding carries the value over a power-of-ten boundary', () => {
    // 9.996 rounds to 10, which needs one fewer decimal place (3 s.f. is
    // "10.0", not "10.00") than the pre-rounding magnitude implied.
    expect(sf(9.996)).toBe('10.0');
    expect(sf(99.96)).toBe('100');
    expect(sf(0.09996)).toBe('0.100');
  });

  it('foundation volume-sphere renders a fraction in exact form', () => {
    let sawFraction = false;
    for (let i = 0; i < 500 && !sawFraction; i += 1) {
      const q = generateVolumeSphere({ difficulty: 'foundation' });
      if (asksExact(q) && q.answer.startsWith('\\frac')) sawFraction = true;
    }
    expect(sawFraction).toBe(true);
  });
});
