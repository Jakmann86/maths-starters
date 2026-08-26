// src/generators/geometry/pythagorasGenerators.js
//
// Pythagoras — Haese IGCSE Chapter 8. First generator to emit a figure config
// (SPEC §3 `visualization`); the board's Figure component maps type -> shape.
//
// One skill per concept (as with factorising): this is find-the-hypotenuse
// only, so the unknown is always c and matches Figure.jsx's right-triangle
// branch as-is. The structurally different find-a-shorter-side (c^2 - a^2)
// is its own skill, and needs Figure to colour the unknown leg.
//
// The unknown stays the hypotenuse across all three bands; the ladder is a
// genuine exact -> surd -> approximate progression, not just bigger numbers:
//   Foundation  Pythagorean triple      clean integer, no calculator
//   Core        non-triple legs         exact surd  x = √n
//   Stretch     non-triple legs         3 s.f. decimal

import _ from 'lodash';

const NL = '\n';
const TRIPLES = [[3, 4, 5], [6, 8, 10], [5, 12, 13], [9, 12, 15], [8, 15, 17], [12, 16, 20], [7, 24, 25], [10, 24, 26], [20, 21, 29]];
const toSig3 = (n) => n.toPrecision(3); // string, so a significant trailing zero survives (12.0, not 12)
const isSquare = (n) => Number.isInteger(Math.sqrt(n));

export const generatePythagorasHypotenuse = (options = {}) => {
  const { difficulty = 'core' } = options;
  let a, b, answer, steps;

  if (difficulty === 'foundation') {
    const [p, q, h] = _.sample(TRIPLES);
    [a, b] = _.shuffle([p, q]);
    answer = `x = ${h}`;
    steps = [`x^2 = ${a}^2 + ${b}^2`, `x^2 = ${a * a + b * b}`, `x = ${h}`];
  } else {
    do { a = _.random(2, 9); b = _.random(2, 9); } while (isSquare(a * a + b * b));
    const s = a * a + b * b;
    if (difficulty === 'stretch') {
      answer = `x = ${toSig3(Math.sqrt(s))}`;
      steps = [`x^2 = ${a}^2 + ${b}^2`, `x^2 = ${s}`, `x = ${toSig3(Math.sqrt(s))} \\text{ (3 s.f.)}`];
    } else {
      answer = `x = \\sqrt{${s}}`;
      steps = [`x^2 = ${a}^2 + ${b}^2`, `x^2 = ${s}`, `x = \\sqrt{${s}}`];
    }
  }

  return {
    instruction: 'Find the length of the hypotenuse',
    answer,
    answerUnits: 'cm',
    workingOut: steps.join(NL),
    visualization: { type: 'right-triangle', a: `${a} cm`, b: `${b} cm`, c: 'x', big: 1 },
    metadata: { topic: 'pythagoras-hypotenuse', difficulty },
  };
};

// Same TRIPLES/toSig3/isSquare helpers and band ladder as
// generatePythagorasHypotenuse, but here c and one leg are given and the
// *other* leg is the unknown (x^2 = c^2 - known^2). Which leg is hidden — a
// or b — is randomised per call so the figure isn't always coloured on the
// same side:
//   Foundation  Pythagorean triple      clean integer, no calculator
//   Core        non-triple legs         exact surd  x = √n
//   Stretch     non-triple legs         3 s.f. decimal
export const generatePythagorasMissingSide = (options = {}) => {
  const { difficulty = 'core' } = options;
  const unknown = _.sample(['a', 'b']);
  let aVal, bVal, c, answerExpr, steps;

  if (difficulty === 'foundation') {
    const [p, q, h] = _.sample(TRIPLES);
    [aVal, bVal] = _.shuffle([p, q]);
    c = h;
    const knownVal = unknown === 'a' ? bVal : aVal;
    const hiddenVal = unknown === 'a' ? aVal : bVal;
    answerExpr = `${hiddenVal}`;
    steps = [`x^2 = ${c}^2 - ${knownVal}^2`, `x^2 = ${c * c - knownVal * knownVal}`, `x = ${hiddenVal}`];
  } else {
    let knownVal, s;
    do {
      knownVal = _.random(3, 9);
      c = _.random(knownVal + 1, knownVal + 10);
      s = c * c - knownVal * knownVal;
    } while (isSquare(s));
    if (unknown === 'a') { bVal = knownVal; } else { aVal = knownVal; }
    if (difficulty === 'stretch') {
      answerExpr = toSig3(Math.sqrt(s));
      steps = [`x^2 = ${c}^2 - ${knownVal}^2`, `x^2 = ${s}`, `x = ${toSig3(Math.sqrt(s))} \\text{ (3 s.f.)}`];
    } else {
      answerExpr = `\\sqrt{${s}}`;
      steps = [`x^2 = ${c}^2 - ${knownVal}^2`, `x^2 = ${s}`, `x = \\sqrt{${s}}`];
    }
  }

  return {
    instruction: 'Find the length of the missing side',
    answer: `x = ${answerExpr}`,
    answerUnits: 'cm',
    workingOut: steps.join(NL),
    visualization: {
      type: 'right-triangle',
      a: unknown === 'a' ? 'x' : `${aVal} cm`,
      b: unknown === 'b' ? 'x' : `${bVal} cm`,
      c: `${c} cm`,
      unknown,
      big: 1,
    },
    metadata: { topic: 'pythagoras-missing-side', difficulty },
  };
};

// Drop a perpendicular from the apex to the base: it bisects the base and
// splits the isosceles triangle into two right triangles with legs
// half-the-base and the unknown height x, hypotenuse the given equal side.
export const generatePythagorasIsosceles = (options = {}) => {
  const { difficulty = 'core' } = options;
  let half, height, side, base, answer, steps;

  if (difficulty === 'foundation') {
    const [p, q, h] = _.sample(TRIPLES);
    [half, height] = _.shuffle([p, q]);
    side = h;
    base = half * 2;
    answer = `x = ${height}`;
    steps = [`x^2 = ${side}^2 - ${half}^2`, `x^2 = ${side * side - half * half}`, `x = ${height}`];
  } else {
    do { half = _.random(3, 9); side = _.random(half + 1, half + 10); } while (isSquare(side * side - half * half));
    base = half * 2;
    const s = side * side - half * half;
    if (difficulty === 'stretch') {
      answer = `x = ${toSig3(Math.sqrt(s))}`;
      steps = [`x^2 = ${side}^2 - ${half}^2`, `x^2 = ${s}`, `x = ${toSig3(Math.sqrt(s))} \\text{ (3 s.f.)}`];
    } else {
      answer = `x = \\sqrt{${s}}`;
      steps = [`x^2 = ${side}^2 - ${half}^2`, `x^2 = ${s}`, `x = \\sqrt{${s}}`];
    }
  }

  return {
    instruction: 'Find the height of the isosceles triangle',
    answer,
    answerUnits: 'cm',
    workingOut: steps.join(NL),
    visualization: { type: 'isosceles-triangle', base: `${base} cm`, side: `${side} cm`, big: 1 },
    metadata: { topic: 'pythagoras-isosceles', difficulty },
  };
};