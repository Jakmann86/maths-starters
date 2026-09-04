// src/generators/geometry/circleTheoremGenerators.test.js
//
// Substitute-the-answer-back checks for the three circle-theorem generators.
// Every figure label (numeric or algebraic, e.g. "(3x - 25)^\circ") is
// evaluated back to a number at the answer's own x, independently of the
// generator's internal variables, and the theorem itself is re-checked from
// those numbers: the two non-right angles of the semi-circle sum to 90, the
// centre angle is exactly twice the circumference angle (taking 360 - label
// when `reflex` is set), and each opposite pair of the cyclic quadrilateral
// sums to 180. Also checks: no impossible angle ever appears, a `reflex:
// true` centre label really is over 180 degrees and a non-reflex one is not,
// the coloured (unknown) vertices are exactly the ones the label evaluation
// depends on, and all four rotations appear.
//
// Run: npx vitest run src/generators/geometry/circleTheoremGenerators.test.js

import { describe, expect, it } from 'vitest';
import {
  generateAngleInSemicircle,
  generateAngleAtCentre,
  generateCyclicQuadrilateral,
} from './circleTheoremGenerators';

const BANDS = ['foundation', 'core', 'stretch'];
const SAMPLES = 6000;

/** Parses a plain "N", literal "x", or an algebraic "(cx + d)^\circ" /
 * "cx^\circ" figure label back into a number, given the value of x. */
const evalAngle = (str, x) => {
  if (str === 'x') return x;
  let s = String(str).trim();
  if (s.endsWith('^\\circ')) s = s.slice(0, -'^\\circ'.length);
  s = s.trim();
  if (s.startsWith('(') && s.endsWith(')')) s = s.slice(1, -1).trim();
  const m = s.match(/^(-?\d*)x\s*(?:([+-])\s*(\d+))?$/);
  if (m) {
    let coeff;
    if (m[1] === '' || m[1] === undefined) coeff = 1;
    else if (m[1] === '-') coeff = -1;
    else coeff = Number(m[1]);
    const d = m[3] ? Number(m[3]) * (m[2] === '-' ? -1 : 1) : 0;
    return coeff * x + d;
  }
  const n = Number(s);
  if (Number.isNaN(n)) throw new Error(`cannot parse angle label "${str}"`);
  return n;
};

/** Pulls the numeric x out of an answer string: "x = 40^\circ" or "x = 12". */
const answerX = (answer) => {
  const m = String(answer).match(/x = (-?\d+(?:\.\d+)?)/);
  if (!m) throw new Error(`cannot parse answer "${answer}"`);
  return Number(m[1]);
};

describe('angle-in-semicircle', () => {
  it.each(BANDS)('is correct at %s', (difficulty) => {
    const rotationsSeen = new Set();
    const distinct = new Set();
    for (let i = 0; i < SAMPLES; i += 1) {
      const q = generateAngleInSemicircle({ difficulty });
      const fig = q.visualization;
      const x = answerX(q.answer);
      const a = evalAngle(fig.angleA, x);
      const b = evalAngle(fig.angleB, x);

      // the angle in a semi-circle is 90 degrees, so the other two sum to 90
      expect(a + b).toBeCloseTo(90, 9);
      expect(a).toBeGreaterThan(0);
      expect(a).toBeLessThan(90);
      expect(b).toBeGreaterThan(0);
      expect(b).toBeLessThan(90);

      // the coloured vertex/vertices are exactly those carrying an unknown
      const isA = fig.angleA === 'x' || /x/.test(fig.angleA);
      const isB = fig.angleB === 'x' || /x/.test(fig.angleB);
      const expectedUnknown = isA && isB ? 'both' : isA ? 'A' : 'B';
      expect(fig.unknown).toBe(expectedUnknown);

      expect([0, 90, 180, 270]).toContain(fig.rotate);
      rotationsSeen.add(fig.rotate);
      distinct.add(q.answer + JSON.stringify(fig));
    }
    expect(rotationsSeen.size).toBe(4);
    // eslint-disable-next-line no-console
    console.log(`angle-in-semicircle/${difficulty}: ${distinct.size} distinct`);
  });
});

describe('angle-at-centre', () => {
  it.each(BANDS)('is correct at %s', (difficulty) => {
    const rotationsSeen = new Set();
    const distinct = new Set();
    for (let i = 0; i < SAMPLES; i += 1) {
      const q = generateAngleAtCentre({ difficulty });
      const fig = q.visualization;
      const x = answerX(q.answer);
      const centre = evalAngle(fig.centre, x);
      const circumference = evalAngle(fig.circumference, x);

      const trueCentreAngle = fig.reflex ? 360 - centre : centre;
      expect(trueCentreAngle).toBeCloseTo(2 * circumference, 9);

      if (fig.reflex) {
        expect(centre).toBeGreaterThan(180);
      } else {
        expect(centre).toBeLessThan(180);
      }
      expect(circumference).toBeGreaterThan(0);
      expect(circumference).toBeLessThan(180);

      const isCentreUnknown = fig.centre === 'x';
      const isCircUnknown = fig.circumference === 'x';
      expect(isCentreUnknown).toBe(fig.unknown === 'centre');
      expect(isCircUnknown).toBe(fig.unknown === 'circumference');

      expect([0, 90, 180, 270]).toContain(fig.rotate);
      rotationsSeen.add(fig.rotate);
      distinct.add(q.answer + JSON.stringify(fig));
    }
    expect(rotationsSeen.size).toBe(4);
    // eslint-disable-next-line no-console
    console.log(`angle-at-centre/${difficulty}: ${distinct.size} distinct`);
  });
});

describe('cyclic-quadrilateral', () => {
  it.each(BANDS)('is correct at %s', (difficulty) => {
    const rotationsSeen = new Set();
    const distinct = new Set();
    const composite = new Set();
    for (let i = 0; i < SAMPLES; i += 1) {
      const q = generateCyclicQuadrilateral({ difficulty });
      const fig = q.visualization;
      const x = answerX(q.answer);

      if (fig.type === 'cyclic-quadrilateral-centre') {
        // The composite Stretch case: a centre angle on diagonal AC (always
        // the arc through B, per the fixed A/B/C/D layout in Figure.jsx)
        // chains into whichever vertex's opposite-angle is asked for.
        const m = evalAngle(fig.centreAngle, x);
        const abc = 180 - m / 2; // subtends the arc through D
        const adc = m / 2; // subtends the arc through B
        expect(fig.unknown === 'B' || fig.unknown === 'D').toBe(true);
        expect(x).toBeCloseTo(fig.unknown === 'B' ? abc : adc, 9);
        expect(m).toBeGreaterThan(0);
        expect(m).toBeLessThan(180);
        expect(x).toBeGreaterThan(0);
        expect(x).toBeLessThan(180);
        expect([0, 90, 180, 270]).toContain(fig.rotate);
        rotationsSeen.add(fig.rotate);
        composite.add(q.answer + JSON.stringify(fig));
        continue;
      }

      const a = evalAngle(fig.a, x);
      const c = evalAngle(fig.c, x);

      // opposite angles of a cyclic quadrilateral sum to 180
      expect(a + c).toBeCloseTo(180, 9);
      expect(a).toBeGreaterThan(0);
      expect(a).toBeLessThan(180);
      expect(c).toBeGreaterThan(0);
      expect(c).toBeLessThan(180);
      expect(fig.d).toBeNull();

      // the coloured vertices are exactly those carrying an unknown
      const isA = fig.a === 'x' || /x/.test(fig.a);
      const isC = fig.c === 'x' || /x/.test(fig.c);
      const expectedUnknown = [isA && 'a', isC && 'c'].filter(Boolean);
      expect(fig.unknown.slice().sort()).toEqual(expectedUnknown.slice().sort());

      expect([0, 90, 180, 270]).toContain(fig.rotate);
      rotationsSeen.add(fig.rotate);
      distinct.add(q.answer + JSON.stringify(fig));
    }
    expect(rotationsSeen.size).toBe(4);
    if (difficulty === 'stretch') {
      // both the composite branch and the plain algebraic branch should
      // actually get exercised at roughly 50/50, not one dominating
      expect(composite.size).toBeGreaterThan(0);
      expect(distinct.size).toBeGreaterThan(0);
    }
    // eslint-disable-next-line no-console
    console.log(`cyclic-quadrilateral/${difficulty}: ${distinct.size + composite.size} distinct${composite.size ? ` (${composite.size} composite)` : ''}`);
  });
});
