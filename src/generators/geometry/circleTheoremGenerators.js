// src/generators/geometry/circleTheoremGenerators.js
//
// Haese Chapter 27: circle theorems. Three skills — angle in a semi-circle
// (27A Example 1), angle at the centre (27A Example 2a), and cyclic
// quadrilaterals (27B Example 3).
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
const nonZero = (lo, hi) => { let n = 0; while (n === 0) n = _.random(lo, hi); return n; };
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

  // Both angles algebraic — Haese Example 1 exactly.
  let x, c1, d1, c2, d2, A, B;
  do {
    x = _.random(5, 30);
    c1 = _.random(1, 4);
    d1 = nonZero(-20, 25);
    c2 = _.random(1, 4);
    d2 = 90 - c1 * x - d1 - c2 * x;
    A = c1 * x + d1;
    B = c2 * x + d2;
  } while (A < 15 || A > 75 || B < 15 || B > 75 || Math.abs(d2) > 40);
  const sumC = c1 + c2;
  const sumD = d1 + d2;
  return {
    instruction: 'Form an equation and solve it to find x',
    answer: `x = ${x}`,
    workingOut: `\\text{the angle in a semi-circle is } 90^\\circ${NL}${sumC}x ${sumD < 0 ? '-' : '+'} ${Math.abs(sumD)} + 90 = 180${NL}${sumC}x = ${90 - sumD}${NL}x = ${x}`,
    visualization: { type: 'circle-semicircle', angleA: alg(c1, d1), angleB: alg(c2, d2), unknown: 'both', rotate: spin(), big: 1 },
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

  // Half the time, chain the centre-angle theorem into the opposite-angles
  // rule instead: the given is a centre angle on a diagonal, not a
  // quadrilateral angle, so reaching x needs both theorems in sequence
  // rather than the opposite-angles rule alone.
  if (_.random(0, 1) === 1) {
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
  }

  // Both of an opposite pair algebraic — Haese Example 3, which is
  // (x + 15) and (x - 21) giving x = 93.
  let x, c1, d1, c2, d2, A, C;
  do {
    x = _.random(20, 120);
    c1 = _.random(1, 2);
    d1 = nonZero(-30, 30);
    c2 = _.random(1, 2);
    d2 = 180 - c1 * x - d1 - c2 * x;
    A = c1 * x + d1;
    C = c2 * x + d2;
  } while (A < 30 || A > 150 || C < 30 || C > 150 || Math.abs(d2) > 40);
  const b = _.random(40, 140);
  const sumC = c1 + c2;
  const sumD = d1 + d2;
  return {
    instruction: 'Form an equation and solve it to find x',
    answer: `x = ${x}`,
    workingOut: `\\text{opposite angles of a cyclic quadrilateral add to } 180^\\circ${NL}${sumC}x ${sumD < 0 ? '-' : '+'} ${Math.abs(sumD)} = 180${NL}${sumC}x = ${180 - sumD}${NL}x = ${x}`,
    visualization: { type: 'cyclic-quadrilateral', a: alg(c1, d1), b: deg(b), c: alg(c2, d2), d: null, unknown: ['a', 'c'], rotate: spin(), big: 1 },
    metadata: { topic: 'cyclic-quadrilateral', difficulty },
  };
};
