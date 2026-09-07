// src/generators/geometry/circleTheoremGenerators.js
//
// Haese Chapter 27: circle theorems. Four skills — angle in a semi-circle
// (27A Example 1), angle at the centre (27A Example 2a), angles in the same
// segment, and cyclic quadrilaterals (27B Example 3) — plus two tangent
// theorems Haese's ch 27 backlog doesn't list at all (not drift to report;
// this is new content, not a mismatch with an existing entry): tangents from
// an external point, and the alternate segment theorem.
//
// Stretch never asks students to solve an equation built from two algebraic
// angle expressions — that tests algebra, not the theorem. Instead every
// Stretch question chains the topic's theorem into one further fact (angles
// on a line, angle sum of a triangle, angles at a point), so the numbers
// resolve in two theorem-driven steps.
//
// Every configuration is drawn in one of four orientations (`rotate`, added
// to each figure point's angle in Figure.jsx), chosen at random per question
// — see Figure.jsx for why. The fixed geometry each figure draws genuinely
// satisfies the theorem being taught; only the labels vary independently.

import _ from 'lodash';

const NL = '\n';
const deg = (n) => `${n}^\\circ`;
// Algebraic angle labels are written the way Haese writes them, in brackets:
// (x + 10)deg, 3x deg.
const alg = (c, d) => {
  const head = c === 1 ? 'x' : `${c}x`;
  if (d === 0) return `${head}^\\circ`;
  return `(${head} ${d < 0 ? '-' : '+'} ${Math.abs(d)})^\\circ`;
};
// Every configuration is drawn in one of four orientations. This is not
// padding: a student who only ever meets the angle-at-centre theorem with the
// centre angle pointing down stops recognising it when an exam rotates the
// diagram. It also gives these one-parameter theorems a genuine second axis of
// variation, which widening the angle range never could.
const spin = () => _.sample([0, 90, 180, 270]);

/* ------------------------------------------------- the angle in a semi-circle */
// AB is a diameter, C is on the circle, so angle ACB is 90 and the other two
// angles sum to 90. Haese Example 1 and Exercise 27A.1.

export const generateAngleInSemicircle = (options = {}) => {
  const { difficulty = 'core' } = options;

  if (difficulty === 'foundation') {
    const a = _.random(10, 80);
    const atA = _.random(0, 1) === 1;
    return {
      instruction: 'Find the size of angle x',
      answer: `x = ${90 - a}^\\circ`,
      workingOut: `\\text{the angle in a semi-circle is } 90^\\circ${NL}${a} + x + 90 = 180${NL}x = ${90 - a}`,
      visualization: {
        type: 'circle-semicircle',
        angleA: atA ? 'x' : deg(a),
        angleB: atA ? deg(a) : 'x',
        unknown: atA ? 'A' : 'B',
        rotate: spin(),
        big: 1,
      },
      metadata: { topic: 'angle-in-semicircle', difficulty },
    };
  }

  if (difficulty === 'core') {
    // One angle is a multiple of x, the other is a number.
    const c = _.random(2, 5);
    let x, a;
    do {
      x = _.random(5, 40);
      a = 90 - c * x;
    } while (a < 15 || a > 75);
    return {
      instruction: 'Find the value of x',
      answer: `x = ${x}`,
      workingOut: `\\text{the angle in a semi-circle is } 90^\\circ${NL}${c}x + ${a} + 90 = 180${NL}${c}x = ${90 - a}${NL}x = ${x}`,
      visualization: { type: 'circle-semicircle', angleA: deg(a), angleB: alg(c, 0), unknown: 'B', rotate: spin(), big: 1 },
      metadata: { topic: 'angle-in-semicircle', difficulty },
    };
  }

  // AB extended past whichever end is given (Haese doesn't cover this
  // combination directly, but it's the standard exam chain: an exterior
  // angle on the diameter feeds "angles on a straight line", and the
  // semicircle's hidden right angle at C closes the triangle). Two theorems,
  // not an equation with x on both sides.
  const givenAtA = _.random(0, 1) === 1;
  const x = _.random(10, 75);
  const ext = x + 90; // the exterior angle at the given end
  const interior = 180 - ext; // the interior angle there, via angles on a line
  return {
    instruction: 'Find the size of angle x',
    answer: `x = ${x}^\\circ`,
    workingOut: `\\text{angles on a straight line add to } 180^\\circ${NL}\\text{interior angle} = 180 - ${ext} = ${interior}${NL}\\text{the angle in a semi-circle is } 90^\\circ${NL}x = 180 - 90 - ${interior}${NL}x = ${x}`,
    visualization: { type: 'circle-semicircle-exterior', exterior: deg(ext), given: givenAtA ? 'A' : 'B', rotate: spin(), big: 1 },
    metadata: { topic: 'angle-in-semicircle', difficulty },
  };
};

/* ------------------------------------------------------- the angle at the centre */

export const generateAngleAtCentre = (options = {}) => {
  const { difficulty = 'core' } = options;

  if (difficulty === 'foundation') {
    // Centre angle given, halve it.
    const x = _.random(10, 85);
    return {
      instruction: 'Find the size of angle x',
      answer: `x = ${x}^\\circ`,
      workingOut: `\\text{the angle at the centre is twice the angle at the circumference}${NL}2x = ${2 * x}${NL}x = ${x}`,
      visualization: { type: 'circle-angle-centre', centre: deg(2 * x), circumference: 'x', unknown: 'circumference', rotate: spin(), big: 1 },
      metadata: { topic: 'angle-at-centre', difficulty },
    };
  }

  if (difficulty === 'core') {
    // Circumference angle given, double it.
    const a = _.random(10, 85);
    return {
      instruction: 'Find the size of angle x',
      answer: `x = ${2 * a}^\\circ`,
      workingOut: `\\text{the angle at the centre is twice the angle at the circumference}${NL}x = 2 \\times ${a}${NL}x = ${2 * a}`,
      visualization: { type: 'circle-angle-centre', centre: 'x', circumference: deg(a), unknown: 'centre', rotate: spin(), big: 1 },
      metadata: { topic: 'angle-at-centre', difficulty },
    };
  }

  // The REFLEX angle at the centre is given, so the obtuse one has to be found
  // from angles at a point first. Haese Example 2a.
  const x = _.random(10, 85);
  const reflex = 360 - 2 * x;
  return {
    instruction: 'Find the size of angle x',
    answer: `x = ${x}^\\circ`,
    workingOut: `\\text{angles at a point add to } 360^\\circ${NL}\\text{obtuse angle at centre} = 360 - ${reflex} = ${2 * x}${NL}2x = ${2 * x}${NL}x = ${x}`,
    visualization: { type: 'circle-angle-centre', centre: deg(reflex), circumference: 'x', reflex: true, unknown: 'circumference', rotate: spin(), big: 1 },
    metadata: { topic: 'angle-at-centre', difficulty },
  };
};

/* ----------------------------------------------------- cyclic quadrilaterals */
// Vertices in order A, B, C, D around the circle, so A is opposite C and B is
// opposite D. Each opposite pair sums to 180.

export const generateCyclicQuadrilateral = (options = {}) => {
  const { difficulty = 'core' } = options;

  if (difficulty === 'foundation') {
    const a = _.random(40, 140);
    const b = _.random(40, 140);
    const swap = _.random(0, 1) === 1;
    const labels = swap
      ? { a: 'x', b: deg(b), c: deg(180 - a), d: null, unknown: ['a'] }
      : { a: deg(a), b: deg(b), c: 'x', d: null, unknown: ['c'] };
    return {
      instruction: 'Find the size of angle x',
      answer: `x = ${swap ? a : 180 - a}^\\circ`,
      workingOut: `\\text{opposite angles of a cyclic quadrilateral add to } 180^\\circ${NL}x = 180 - ${swap ? 180 - a : a}${NL}x = ${swap ? a : 180 - a}`,
      visualization: { type: 'cyclic-quadrilateral', ...labels, rotate: spin(), big: 1 },
      metadata: { topic: 'cyclic-quadrilateral', difficulty },
    };
  }

  if (difficulty === 'core') {
    // One of an opposite pair is a multiple of x.
    const c = _.random(2, 5);
    let x, opp;
    do {
      x = _.random(10, 45);
      opp = 180 - c * x;
    } while (opp < 30 || opp > 150);
    const b = _.random(40, 140);
    return {
      instruction: 'Find the value of x',
      answer: `x = ${x}`,
      workingOut: `\\text{opposite angles of a cyclic quadrilateral add to } 180^\\circ${NL}${c}x + ${opp} = 180${NL}${c}x = ${c * x}${NL}x = ${x}`,
      visualization: { type: 'cyclic-quadrilateral', a: alg(c, 0), b: deg(b), c: deg(opp), d: null, unknown: ['a'], rotate: spin(), big: 1 },
      metadata: { topic: 'cyclic-quadrilateral', difficulty },
    };
  }

  // Chain the centre-angle theorem into the opposite-angles rule: the given
  // is a centre angle on a diagonal, not a quadrilateral angle, so reaching
  // x needs both theorems in sequence — numeric throughout, no equation with
  // x on both sides.
  const m = 2 * _.random(20, 85); // even, so m / 2 is a whole number
  const askB = _.random(0, 1) === 1;
  const abc = 180 - m / 2; // angle ABC: subtends the arc AC through D, i.e. 360 - m
  const adc = m / 2; // angle ADC: subtends the arc AC through B, i.e. m
  return {
    instruction: 'Find the size of angle x',
    answer: `x = ${askB ? abc : adc}^\\circ`,
    workingOut: askB
      ? `\\text{the angle at the centre is twice the angle at the circumference}${NL}x = \\frac{360 - ${m}}{2}${NL}x = ${abc}`
      : `\\text{the angle at the centre is twice the angle at the circumference}${NL}\\text{angle ABC} = \\frac{360 - ${m}}{2} = ${abc}${NL}\\text{opposite angles of a cyclic quadrilateral add to } 180^\\circ${NL}x = 180 - ${abc}${NL}x = ${adc}`,
    visualization: { type: 'cyclic-quadrilateral-centre', centreAngle: deg(m), unknown: askB ? 'B' : 'D', rotate: spin(), big: 1 },
    metadata: { topic: 'cyclic-quadrilateral', difficulty },
  };
};

/* --------------------------------------------------- angles in the same segment */
// AB is a chord; C and D sit on the same major arc, so angle ACB and angle
// ADB — both subtended by arc AB — are equal. Not in the scheme's 27A skill
// list, but the same lesson (Haese ch 27) covers it alongside the other two.

export const generateAngleSameSegment = (options = {}) => {
  const { difficulty = 'core' } = options;

  if (difficulty === 'foundation') {
    const a = _.random(20, 140);
    const giveC = _.random(0, 1) === 1;
    return {
      instruction: 'Find the size of angle x',
      answer: `x = ${a}^\\circ`,
      workingOut: `\\text{angles subtended by the same arc are equal}${NL}x = ${a}`,
      visualization: {
        type: 'circle-same-segment',
        angleC: giveC ? deg(a) : 'x',
        angleD: giveC ? 'x' : deg(a),
        unknown: giveC ? 'D' : 'C',
        rotate: spin(),
        big: 1,
      },
      metadata: { topic: 'angle-same-segment', difficulty },
    };
  }

  if (difficulty === 'core') {
    const c = _.random(2, 5);
    let x, a;
    do {
      x = _.random(5, 40);
      a = c * x;
    } while (a < 20 || a > 150);
    const giveC = _.random(0, 1) === 1;
    return {
      instruction: 'Find the value of x',
      answer: `x = ${x}`,
      workingOut: `\\text{angles subtended by the same arc are equal}${NL}${c}x = ${a}${NL}x = ${x}`,
      visualization: {
        type: 'circle-same-segment',
        angleC: giveC ? alg(c, 0) : deg(a),
        angleD: giveC ? deg(a) : alg(c, 0),
        unknown: giveC ? 'C' : 'D',
        rotate: spin(),
        big: 1,
      },
      metadata: { topic: 'angle-same-segment', difficulty },
    };
  }

  // Chain the same-segment theorem into a triangle angle sum: the arc angle
  // at one apex (C or D) transfers to the other apex (`target`), which
  // closes a triangle with A and B — one more given angle there, at
  // whichever of A/B isn't asked, and x falls out of the angle sum. Numeric
  // throughout, two theorems, no algebra.
  const source = _.random(0, 1) === 1 ? 'C' : 'D';
  const target = source === 'C' ? 'D' : 'C';
  const askAt = _.random(0, 1) === 1 ? 'A' : 'B';
  const giveAt = askAt === 'A' ? 'B' : 'A';
  let a, b, x;
  do {
    a = _.random(20, 90);
    b = _.random(20, 120);
    x = 180 - a - b;
  } while (x < 10 || x > 140);
  const targetLabel = target === 'D' ? 'ADB' : 'ACB';
  return {
    instruction: 'Find the size of angle x',
    answer: `x = ${x}^\\circ`,
    workingOut: `\\text{angles subtended by the same arc are equal}${NL}\\text{angle ${targetLabel}} = ${a}${NL}\\text{angles in a triangle add to } 180^\\circ${NL}x = 180 - ${a} - ${b}${NL}x = ${x}`,
    visualization: {
      type: 'circle-same-segment',
      [`angle${source}`]: deg(a),
      [`angle${giveAt}`]: deg(b),
      [`angle${askAt}`]: 'x',
      unknown: askAt,
      target,
      rotate: spin(),
      big: 1,
    },
    metadata: { topic: 'angle-same-segment', difficulty },
  };
};

/* ----------------------------------------------- tangents from an external point */
// PA and PB are tangents to the circle from P, touching at A and B; O is the
// centre. A tangent meets a radius at 90°, so quadrilateral OAPB has two
// right angles at A and B — the angle at O and the angle at P are the
// remaining two, and they add to 180°.

export const generateTangentsFromPoint = (options = {}) => {
  const { difficulty = 'core' } = options;

  if (difficulty === 'foundation') {
    const a = _.random(20, 160);
    const giveCentre = _.random(0, 1) === 1;
    const x = 180 - a;
    return {
      instruction: 'Find the size of angle x',
      answer: `x = ${x}^\\circ`,
      workingOut: `\\text{a tangent meets a radius at } 90^\\circ${NL}\\text{the angle at O and the angle at P add to } 180^\\circ${NL}x = 180 - ${a}${NL}x = ${x}`,
      visualization: {
        type: 'circle-tangent-kite',
        centre: giveCentre ? deg(a) : 'x',
        external: giveCentre ? 'x' : deg(a),
        unknown: giveCentre ? 'external' : 'centre',
        rotate: spin(),
        big: 1,
      },
      metadata: { topic: 'tangents-from-point', difficulty },
    };
  }

  if (difficulty === 'core') {
    // One of the two is a multiple of x.
    const c = _.random(2, 5);
    let x, other;
    do {
      x = _.random(5, 60);
      other = 180 - c * x;
    } while (other < 20 || other > 160);
    const algAtCentre = _.random(0, 1) === 1;
    return {
      instruction: 'Find the value of x',
      answer: `x = ${x}`,
      workingOut: `\\text{a tangent meets a radius at } 90^\\circ${NL}\\text{the angle at O and the angle at P add to } 180^\\circ${NL}${c}x + ${other} = 180${NL}${c}x = ${180 - other}${NL}x = ${x}`,
      visualization: {
        type: 'circle-tangent-kite',
        centre: algAtCentre ? alg(c, 0) : deg(other),
        external: algAtCentre ? deg(other) : alg(c, 0),
        unknown: algAtCentre ? 'centre' : 'external',
        rotate: spin(),
        big: 1,
      },
      metadata: { topic: 'tangents-from-point', difficulty },
    };
  }

  // Chain the kite's angle sum into isosceles triangle OAB (OA = OB, both
  // radii): the given is the angle at P, not a base angle of that triangle,
  // so reaching x needs both facts in sequence. m is even so x = m / 2 is a
  // whole number throughout.
  const m = 2 * _.random(10, 80);
  const aob = 180 - m;
  const x = m / 2;
  return {
    instruction: 'Find the size of angle x',
    answer: `x = ${x}^\\circ`,
    workingOut: `\\text{a tangent meets a radius at } 90^\\circ${NL}\\text{the angle at O and the angle at P add to } 180^\\circ${NL}\\text{angle AOB} = 180 - ${m} = ${aob}${NL}\\text{OA and OB are radii, so triangle OAB is isosceles}${NL}x = \\frac{180 - ${aob}}{2}${NL}x = ${x}`,
    visualization: { type: 'circle-tangent-kite', external: deg(m), base: 'x', unknown: 'base', rotate: spin(), big: 1 },
    metadata: { topic: 'tangents-from-point', difficulty },
  };
};

/* -------------------------------------------------- the alternate segment theorem */
// The tangent touches the circle at A; B and C are on the circle. The angle
// between the tangent and chord AB equals angle ACB, the angle in the
// alternate segment.

export const generateAlternateSegment = (options = {}) => {
  const { difficulty = 'core' } = options;

  if (difficulty === 'foundation') {
    const a = _.random(20, 150);
    const giveTangent = _.random(0, 1) === 1;
    return {
      instruction: 'Find the size of angle x',
      answer: `x = ${a}^\\circ`,
      workingOut: `\\text{the angle between a tangent and a chord equals the angle in the alternate segment}${NL}x = ${a}`,
      visualization: {
        type: 'circle-alternate-segment',
        tangentAngle: giveTangent ? deg(a) : 'x',
        angleACB: giveTangent ? 'x' : deg(a),
        unknown: giveTangent ? 'ACB' : 'tangent',
        rotate: spin(),
        big: 1,
      },
      metadata: { topic: 'alternate-segment', difficulty },
    };
  }

  if (difficulty === 'core') {
    const c = _.random(2, 5);
    let x, a;
    do {
      x = _.random(5, 40);
      a = c * x;
    } while (a < 20 || a > 150);
    const giveTangent = _.random(0, 1) === 1;
    return {
      instruction: 'Find the value of x',
      answer: `x = ${x}`,
      workingOut: `\\text{the angle between a tangent and a chord equals the angle in the alternate segment}${NL}${c}x = ${a}${NL}x = ${x}`,
      visualization: {
        type: 'circle-alternate-segment',
        tangentAngle: giveTangent ? deg(a) : alg(c, 0),
        angleACB: giveTangent ? alg(c, 0) : deg(a),
        unknown: giveTangent ? 'ACB' : 'tangent',
        rotate: spin(),
        big: 1,
      },
      metadata: { topic: 'alternate-segment', difficulty },
    };
  }

  // Chain the alternate segment theorem into a triangle angle sum: the
  // tangent-chord angle (p) hands over angle ACB via the theorem, and angle
  // ABC (q) — a plain inscribed angle, not a tangent-chord one — is given
  // directly, so x = angle BAC falls out of the triangle's angle sum.
  // Numeric throughout, two theorems, no algebra.
  let p, q, x;
  do {
    p = _.random(15, 80);
    q = _.random(15, 120);
    x = 180 - p - q;
  } while (x < 10 || x > 140);
  return {
    instruction: 'Find the size of angle x',
    answer: `x = ${x}^\\circ`,
    workingOut: `\\text{the angle between a tangent and a chord equals the angle in the alternate segment}${NL}\\text{angle ACB} = ${p}${NL}\\text{angles in a triangle add to } 180^\\circ${NL}x = 180 - ${p} - ${q}${NL}x = ${x}`,
    visualization: {
      type: 'circle-alternate-segment',
      tangentAngle: deg(p),
      angleABC: deg(q),
      angleBAC: 'x',
      unknown: 'BAC',
      rotate: spin(),
      big: 1,
    },
    metadata: { topic: 'alternate-segment', difficulty },
  };
};
