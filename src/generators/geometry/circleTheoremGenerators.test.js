// src/generators/geometry/circleTheoremGenerators.test.js
//
// Substitute-the-answer-back checks for the six circle-theorem generators.
// Every figure label (numeric or algebraic, e.g. "(3x - 25)^\circ") is
// evaluated back to a number at the answer's own x, independently of the
// generator's internal variables, and the theorem itself is re-checked from
// those numbers: the two non-right angles of the semi-circle sum to 90 (or,
// at Stretch, the exterior-angle chain resolves to the same x), the centre
// angle is exactly twice the circumference angle (taking 360 - label when
// `reflex` is set), each opposite pair of the cyclic quadrilateral sums to
// 180, angles subtended by the same arc are equal (or, at Stretch, chain
// into a triangle angle sum), the angle at the centre and the angle between
// two tangents from a point sum to 180 (or, at Stretch, chain into isosceles
// triangle OAB), and a tangent-chord angle equals the angle in the alternate
// segment (or, at Stretch, chain into a triangle angle sum). Also checks: no
// impossible angle ever appears, a `reflex: true` centre label really is
// over 180 degrees and a non-reflex one is not, the coloured (unknown)
// vertices are exactly the ones the label evaluation depends on, and all
// four rotations appear.
//
// Run: npx vitest run src/generators/geometry/circleTheoremGenerators.test.js

import { describe, expect, it } from 'vitest';
import {
  generateAngleInSemicircle,
  generateAngleAtCentre,
  generateCyclicQuadrilateral,
  generateAngleSameSegment,
  generateTangentsFromPoint,
  generateAlternateSegment,
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
  it.each(['foundation', 'core'])('is correct at %s', (difficulty) => {
    const rotationsSeen = new Set();
    const distinct = new Set();
    for (let i = 0; i < SAMPLES; i += 1) {
      const q = generateAngleInSemicircle({ difficulty });
      const fig = q.visualization;
      expect(fig.type).toBe('circle-semicircle');
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

  it('is correct at stretch (exterior-angle chain)', () => {
    const rotationsSeen = new Set();
    const givenSeen = new Set();
    const distinct = new Set();
    for (let i = 0; i < SAMPLES; i += 1) {
      const q = generateAngleInSemicircle({ difficulty: 'stretch' });
      const fig = q.visualization;
      expect(fig.type).toBe('circle-semicircle-exterior');
      const x = answerX(q.answer);
      const ext = evalAngle(fig.exterior, x);

      // angles on a straight line, then the hidden right angle in the
      // semi-circle: x = ext - 90
      expect(x).toBeCloseTo(ext - 90, 9);
      const interior = 180 - ext;
      expect(interior).toBeGreaterThan(0);
      expect(interior).toBeLessThan(90);
      expect(x).toBeGreaterThan(0);
      expect(x).toBeLessThan(90);

      expect(['A', 'B']).toContain(fig.given);
      givenSeen.add(fig.given);
      expect([0, 90, 180, 270]).toContain(fig.rotate);
      rotationsSeen.add(fig.rotate);
      distinct.add(q.answer + JSON.stringify(fig));
    }
    expect(rotationsSeen.size).toBe(4);
    expect(givenSeen.size).toBe(2);
    // eslint-disable-next-line no-console
    console.log(`angle-in-semicircle/stretch: ${distinct.size} distinct`);
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
  it.each(['foundation', 'core'])('is correct at %s', (difficulty) => {
    const rotationsSeen = new Set();
    const distinct = new Set();
    for (let i = 0; i < SAMPLES; i += 1) {
      const q = generateCyclicQuadrilateral({ difficulty });
      const fig = q.visualization;
      expect(fig.type).toBe('cyclic-quadrilateral');
      const x = answerX(q.answer);

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
    // eslint-disable-next-line no-console
    console.log(`cyclic-quadrilateral/${difficulty}: ${distinct.size} distinct`);
  });

  it('is correct at stretch (centre-angle chain)', () => {
    const rotationsSeen = new Set();
    const askSeen = new Set();
    const composite = new Set();
    for (let i = 0; i < SAMPLES; i += 1) {
      const q = generateCyclicQuadrilateral({ difficulty: 'stretch' });
      const fig = q.visualization;
      expect(fig.type).toBe('cyclic-quadrilateral-centre');
      const x = answerX(q.answer);

      const m = evalAngle(fig.centreAngle, x);
      const abc = 180 - m / 2; // subtends the arc through D
      const adc = m / 2; // subtends the arc through B
      expect(['B', 'D']).toContain(fig.unknown);
      expect(x).toBeCloseTo(fig.unknown === 'B' ? abc : adc, 9);
      expect(m).toBeGreaterThan(0);
      expect(m).toBeLessThan(180);
      expect(x).toBeGreaterThan(0);
      expect(x).toBeLessThan(180);

      askSeen.add(fig.unknown);
      expect([0, 90, 180, 270]).toContain(fig.rotate);
      rotationsSeen.add(fig.rotate);
      composite.add(q.answer + JSON.stringify(fig));
    }
    expect(rotationsSeen.size).toBe(4);
    expect(askSeen.size).toBe(2);
    // eslint-disable-next-line no-console
    console.log(`cyclic-quadrilateral/stretch: ${composite.size} distinct`);
  });
});

describe('angle-same-segment', () => {
  it.each(['foundation', 'core'])('is correct at %s', (difficulty) => {
    const rotationsSeen = new Set();
    const distinct = new Set();
    for (let i = 0; i < SAMPLES; i += 1) {
      const q = generateAngleSameSegment({ difficulty });
      const fig = q.visualization;
      expect(fig.type).toBe('circle-same-segment');
      const x = answerX(q.answer);
      const c = evalAngle(fig.angleC, x);
      const d = evalAngle(fig.angleD, x);

      // angles subtended by the same arc are equal
      expect(c).toBeCloseTo(d, 9);
      expect(c).toBeGreaterThan(0);
      expect(c).toBeLessThan(180);

      const isC = fig.angleC === 'x' || /x/.test(fig.angleC);
      const isD = fig.angleD === 'x' || /x/.test(fig.angleD);
      expect(isC).toBe(fig.unknown === 'C');
      expect(isD).toBe(fig.unknown === 'D');
      expect(fig.angleA).toBeUndefined();
      expect(fig.angleB).toBeUndefined();

      expect([0, 90, 180, 270]).toContain(fig.rotate);
      rotationsSeen.add(fig.rotate);
      distinct.add(q.answer + JSON.stringify(fig));
    }
    expect(rotationsSeen.size).toBe(4);
    // eslint-disable-next-line no-console
    console.log(`angle-same-segment/${difficulty}: ${distinct.size} distinct`);
  });

  it('is correct at stretch (triangle angle-sum chain)', () => {
    const rotationsSeen = new Set();
    const sourceSeen = new Set();
    const askSeen = new Set();
    const distinct = new Set();
    for (let i = 0; i < SAMPLES; i += 1) {
      const q = generateAngleSameSegment({ difficulty: 'stretch' });
      const fig = q.visualization;
      expect(fig.type).toBe('circle-same-segment');
      const x = answerX(q.answer);

      expect(['A', 'B']).toContain(fig.unknown);
      expect(['C', 'D']).toContain(fig.target);
      // the source apex (whichever of C/D is labelled) transfers its value
      // to `target` via the same-segment theorem; only one of C/D is shown
      const source = fig.angleC ? 'C' : 'D';
      expect(source).not.toBe(fig.target);
      const a = evalAngle(fig[`angle${source}`], x);

      // whichever of A/B isn't the unknown carries the second given angle;
      // the unknown itself is still marked 'x' on the figure
      const giveAt = fig.unknown === 'A' ? 'B' : 'A';
      const b = evalAngle(fig[`angle${giveAt}`], x);
      expect(fig[`angle${fig.unknown}`]).toBe('x');

      // angles in a triangle add to 180: a (transferred) + b + x = 180
      expect(a + b + x).toBeCloseTo(180, 9);
      expect(a).toBeGreaterThan(0);
      expect(a).toBeLessThan(180);
      expect(b).toBeGreaterThan(0);
      expect(b).toBeLessThan(180);
      expect(x).toBeGreaterThan(0);
      expect(x).toBeLessThan(180);

      sourceSeen.add(source);
      askSeen.add(fig.unknown);
      expect([0, 90, 180, 270]).toContain(fig.rotate);
      rotationsSeen.add(fig.rotate);
      distinct.add(q.answer + JSON.stringify(fig));
    }
    expect(rotationsSeen.size).toBe(4);
    expect(sourceSeen.size).toBe(2);
    expect(askSeen.size).toBe(2);
    // eslint-disable-next-line no-console
    console.log(`angle-same-segment/stretch: ${distinct.size} distinct`);
  });
});

describe('tangents-from-point', () => {
  it.each(['foundation', 'core'])('is correct at %s', (difficulty) => {
    const rotationsSeen = new Set();
    const distinct = new Set();
    for (let i = 0; i < SAMPLES; i += 1) {
      const q = generateTangentsFromPoint({ difficulty });
      const fig = q.visualization;
      expect(fig.type).toBe('circle-tangent-kite');
      const x = answerX(q.answer);
      const centre = evalAngle(fig.centre, x);
      const external = evalAngle(fig.external, x);

      // the angle at O and the angle at P (kite OAPB) add to 180
      expect(centre + external).toBeCloseTo(180, 9);
      expect(centre).toBeGreaterThan(0);
      expect(centre).toBeLessThan(180);
      expect(external).toBeGreaterThan(0);
      expect(external).toBeLessThan(180);
      expect(fig.base).toBeUndefined();

      const isCentreUnknown = fig.centre === 'x' || /x/.test(fig.centre);
      const isExternalUnknown = fig.external === 'x' || /x/.test(fig.external);
      expect(isCentreUnknown).toBe(fig.unknown === 'centre');
      expect(isExternalUnknown).toBe(fig.unknown === 'external');

      expect([0, 90, 180, 270]).toContain(fig.rotate);
      rotationsSeen.add(fig.rotate);
      distinct.add(q.answer + JSON.stringify(fig));
    }
    expect(rotationsSeen.size).toBe(4);
    // eslint-disable-next-line no-console
    console.log(`tangents-from-point/${difficulty}: ${distinct.size} distinct`);
  });

  it('is correct at stretch (isosceles-triangle chain)', () => {
    const rotationsSeen = new Set();
    const distinct = new Set();
    for (let i = 0; i < SAMPLES; i += 1) {
      const q = generateTangentsFromPoint({ difficulty: 'stretch' });
      const fig = q.visualization;
      expect(fig.type).toBe('circle-tangent-kite');
      const x = answerX(q.answer);

      const m = evalAngle(fig.external, x);
      const aob = 180 - m; // kite OAPB: angle O + angle P = 180
      // OA = OB (radii), so triangle OAB is isosceles: base angles = x
      expect(x).toBeCloseTo((180 - aob) / 2, 9);
      expect(fig.base).toBe('x');
      expect(fig.unknown).toBe('base');
      expect(fig.centre).toBeUndefined();
      expect(m).toBeGreaterThan(0);
      expect(m).toBeLessThan(180);
      expect(x).toBeGreaterThan(0);
      expect(x).toBeLessThan(90);

      expect([0, 90, 180, 270]).toContain(fig.rotate);
      rotationsSeen.add(fig.rotate);
      distinct.add(q.answer + JSON.stringify(fig));
    }
    expect(rotationsSeen.size).toBe(4);
    // eslint-disable-next-line no-console
    console.log(`tangents-from-point/stretch: ${distinct.size} distinct`);
  });
});

describe('alternate-segment', () => {
  it.each(['foundation', 'core'])('is correct at %s', (difficulty) => {
    const rotationsSeen = new Set();
    const distinct = new Set();
    for (let i = 0; i < SAMPLES; i += 1) {
      const q = generateAlternateSegment({ difficulty });
      const fig = q.visualization;
      expect(fig.type).toBe('circle-alternate-segment');
      const x = answerX(q.answer);
      const tangentAngle = evalAngle(fig.tangentAngle, x);
      const angleACB = evalAngle(fig.angleACB, x);

      // the tangent-chord angle equals the angle in the alternate segment
      expect(tangentAngle).toBeCloseTo(angleACB, 9);
      expect(tangentAngle).toBeGreaterThan(0);
      expect(tangentAngle).toBeLessThan(180);
      expect(fig.angleABC).toBeUndefined();
      expect(fig.angleBAC).toBeUndefined();

      const isTangentUnknown = fig.tangentAngle === 'x' || /x/.test(fig.tangentAngle);
      const isACBUnknown = fig.angleACB === 'x' || /x/.test(fig.angleACB);
      expect(isTangentUnknown).toBe(fig.unknown === 'tangent');
      expect(isACBUnknown).toBe(fig.unknown === 'ACB');

      expect([0, 90, 180, 270]).toContain(fig.rotate);
      rotationsSeen.add(fig.rotate);
      distinct.add(q.answer + JSON.stringify(fig));
    }
    expect(rotationsSeen.size).toBe(4);
    // eslint-disable-next-line no-console
    console.log(`alternate-segment/${difficulty}: ${distinct.size} distinct`);
  });

  it('is correct at stretch (triangle angle-sum chain)', () => {
    const rotationsSeen = new Set();
    const distinct = new Set();
    for (let i = 0; i < SAMPLES; i += 1) {
      const q = generateAlternateSegment({ difficulty: 'stretch' });
      const fig = q.visualization;
      expect(fig.type).toBe('circle-alternate-segment');
      const x = answerX(q.answer);

      const p = evalAngle(fig.tangentAngle, x); // = angle ACB, by the theorem
      const q2 = evalAngle(fig.angleABC, x);
      expect(fig.angleBAC).toBe('x');
      expect(fig.unknown).toBe('BAC');
      expect(fig.angleACB).toBeUndefined();

      // angles in a triangle add to 180: angle ACB (= p) + angle ABC (= q2) + x = 180
      expect(p + q2 + x).toBeCloseTo(180, 9);
      expect(p).toBeGreaterThan(0);
      expect(p).toBeLessThan(180);
      expect(q2).toBeGreaterThan(0);
      expect(q2).toBeLessThan(180);
      expect(x).toBeGreaterThan(0);
      expect(x).toBeLessThan(180);

      expect([0, 90, 180, 270]).toContain(fig.rotate);
      rotationsSeen.add(fig.rotate);
      distinct.add(q.answer + JSON.stringify(fig));
    }
    expect(rotationsSeen.size).toBe(4);
    // eslint-disable-next-line no-console
    console.log(`alternate-segment/stretch: ${distinct.size} distinct`);
  });
});
