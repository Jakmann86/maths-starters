// src/generators/geometry/perimeterGenerators.test.js
//
// Substitute-the-answer-back checks for the two pi-based circle generators.
// See solidsGenerators.test.js for the same pattern applied to the six solid
// generators — this file only covers circumference-circle and area-circle,
// the two touched here. perimeter-compound, area-compound and
// perimeter-rectangle are whole-number throughout and untouched.
//
// Run: npx vitest run src/generators/geometry/perimeterGenerators.test.js

import { describe, expect, it } from 'vitest';
import { generateCircumferenceCircle, generateAreaCircle } from './perimeterGenerators';

const BANDS = ['foundation', 'core', 'stretch'];
const SAMPLES = 800;

const numFrom = (str) => Number(str.split(' ')[0]);

/** Independent 3 s.f. formatter — deliberately not the generator's own sf(). */
const sf3 = (x) => {
  if (x === 0) return '0';
  const s = x.toPrecision(3);
  if (!s.includes('e')) return s;
  const [mantissa, exp] = s.split('e');
  const e = Number(exp);
  return (Number(mantissa) * 10 ** e).toFixed(Math.max(0, 2 - e));
};

const approxEqual = (a, b, tol = 1e-6) => Math.abs(a - b) <= tol * Math.max(1, Math.abs(a), Math.abs(b));

const parsePi = (str) => {
  const whole = str.match(/^(-?\d+(?:\.\d+)?)?\\pi$/);
  return whole ? (whole[1] === undefined ? 1 : Number(whole[1])) : null;
};

const asksExact = (q) => /in terms of/.test(q.instruction);

const checkFormAgreement = (q) => {
  expect(/in terms of|3 significant figures/.test(q.instruction)).toBe(true);
  expect(/\\pi/.test(q.answer)).toBe(asksExact(q));
};

const checkNoForbiddenTokens = (q) => {
  const text = [q.instruction, q.workingOut, q.answer, q.answerUnits].filter(Boolean).join(' ');
  expect(text).not.toMatch(/\\approx|\\tfrac|\\ldots/);
};

const checkPlainDecimal = (str) => expect(str).toMatch(/^\d+(\.\d+)?$/);

describe('circumference-circle', () => {
  it.each(BANDS)('is correct at %s', (difficulty) => {
    let exact = 0; let rounded = 0; const distinct = new Set();
    for (let i = 0; i < SAMPLES; i += 1) {
      const q = generateCircumferenceCircle({ difficulty });
      checkNoForbiddenTokens(q);
      const fig = q.visualization;

      if (difficulty === 'stretch') {
        const givenStr = fig.given.match(/C = (.+) (cm|m|mm)$/)[1];
        const got = Number(q.answer.replace('x = ', ''));
        if (givenStr.includes('π')) {
          const coeff = Number(givenStr.replace('π', ''));
          expect(approxEqual(got, coeff / 2)).toBe(true);
          expect(Number.isInteger(got)).toBe(true);
          exact += 1;
        } else {
          const C = Number(givenStr);
          const expected = C / (2 * Math.PI);
          checkPlainDecimal(q.answer.replace('x = ', ''));
          expect(q.answer).toBe(`x = ${sf3(expected)}`);
          rounded += 1;
        }
        distinct.add(fig.given + q.answer);
        continue;
      }

      checkFormAgreement(q);
      const r = difficulty === 'core' ? numFrom(fig.diameter) / 2 : numFrom(fig.r);
      const kExpected = 2 * r;
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
});

describe('area-circle', () => {
  it.each(BANDS)('is correct at %s', (difficulty) => {
    let exact = 0; let rounded = 0; const distinct = new Set();
    for (let i = 0; i < SAMPLES; i += 1) {
      const q = generateAreaCircle({ difficulty });
      checkNoForbiddenTokens(q);
      const fig = q.visualization;

      if (difficulty === 'stretch') {
        const givenStr = fig.given.match(/A = (.+) (cm|m|mm)²$/)[1];
        const got = Number(q.answer.replace('x = ', ''));
        if (givenStr.includes('π')) {
          const coeff = Number(givenStr.replace('π', ''));
          expect(approxEqual(got, Math.sqrt(coeff))).toBe(true);
          expect(Number.isInteger(got)).toBe(true);
          exact += 1;
        } else {
          const A = Number(givenStr);
          const expected = Math.sqrt(A / Math.PI);
          checkPlainDecimal(q.answer.replace('x = ', ''));
          expect(q.answer).toBe(`x = ${sf3(expected)}`);
          rounded += 1;
        }
        distinct.add(fig.given + q.answer);
        continue;
      }

      checkFormAgreement(q);
      expect(q.answerUnits).toContain('^2');
      const r = difficulty === 'core' ? numFrom(fig.diameter) / 2 : numFrom(fig.r);
      const kExpected = r * r;
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
});
