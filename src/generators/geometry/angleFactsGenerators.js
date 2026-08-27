// src/generators/geometry/angleFactsGenerators.js
//
// Haese 4A — angle facts at a point: angles on a line (sum 180), angles at a
// point (sum 360), and vertically opposite angles from two crossing lines.
// All three share Figure.jsx's 'angle-rays' type — rays fanning out from one
// shared point, with an optional arc + label on each gap between adjacent
// rays.
//
// Stretch bands are always built forward from a chosen x, then the
// expressions' coefficients/constants are derived backward to fit exactly —
// never a hardcoded bank of algebra combos to _.sample from (that's the
// anti-pattern being deliberately avoided from the old app's
// angleFactsGenerator.js).
//
// Haese states a reason alongside every line of working in this chapter
// (e.g. "angles on a line"), so workingOut carries that through here too.

import _ from 'lodash';

const NL = '\n';

const formatLinear = (m, c) => {
  const coeff = m === 1 ? 'x' : `${m}x`;
  if (c === 0) return coeff;
  return c > 0 ? `${coeff} + ${c}` : `${coeff} - ${Math.abs(c)}`;
};

// Picks n coefficients and constants for expressions that sum to `total`,
// working backward from randomly chosen actual angle values so every call
// produces a different equation rather than a hardcoded combo — shared by
// every Stretch band below (angles on a line, at a point, triangle sum).
function algebraSummingTo(n, total, x, partMin, partMax) {
  const ms = Array.from({ length: n }, () => _.random(1, 4));
  let vs;
  do {
    const given = Array.from({ length: n - 1 }, () => _.random(partMin, partMax));
    const last = total - given.reduce((s, v) => s + v, 0);
    vs = [...given, last];
  } while (vs[n - 1] < partMin || vs[n - 1] > partMax);
  const cs = vs.map((v, i) => v - ms[i] * x);
  const exprs = vs.map((v, i) => formatLinear(ms[i], cs[i]));
  return { ms, vs, cs, exprs };
}

// generateAnglesOnALine -------------------------------------------------
//   Foundation  one angle given, a multiple of 5 in 20-160     find the other by subtraction
//   Core        one angle given, any integer 1-179             find the other by subtraction
//   Stretch     two expressions in x summing to 180             solve for x
export const generateAnglesOnALine = (options = {}) => {
  const { difficulty = 'core' } = options;
  let a1, a2, labels, unknownIndex, answer, steps;

  if (difficulty === 'stretch') {
    const x = _.random(4, 20);
    const { ms, vs, cs, exprs } = algebraSummingTo(2, 180, x, 30, 150);
    a2 = vs[1];
    labels = exprs;
    unknownIndex = undefined;
    answer = `x = ${x}`;
    const totalM = ms[0] + ms[1];
    const totalC = cs[0] + cs[1];
    steps = [
      `${exprs[0]} + ${exprs[1]} = 180 \\text{ (angles on a line)}`,
      `${totalM}x ${totalC >= 0 ? '+' : '-'} ${Math.abs(totalC)} = 180`,
      `x = ${x}`,
    ];
  } else {
    a1 = difficulty === 'foundation' ? _.random(4, 32) * 5 : _.random(1, 179);
    a2 = 180 - a1;
    unknownIndex = _.sample([0, 1]);
    const values = [a1, a2];
    labels = values.map((v, i) => (i === unknownIndex ? 'x' : `${v}^\\circ`));
    const given = values[1 - unknownIndex];
    const found = values[unknownIndex];
    answer = `x = ${found}^\\circ`;
    steps = [`x + ${given}^\\circ = 180^\\circ \\text{ (angles on a line)}`, `x = 180^\\circ - ${given}^\\circ`, `x = ${found}^\\circ`];
  }

  return {
    instruction: difficulty === 'stretch' ? 'Find the value of x' : 'Find the size of angle x',
    answer,
    workingOut: steps.join(NL),
    visualization: {
      type: 'angle-rays',
      rays: [180, a2, 0],
      gapDegrees: [180 - a2, a2],
      wrap: false,
      labels,
      unknownIndex,
      big: 1,
    },
    metadata: { topic: 'angles-on-a-line', difficulty },
  };
};

// generateAnglesAtAPoint --------------------------------------------------
//   Foundation  3 or 4 angles, given ones are multiples of 5     find the missing one
//   Core        3 or 4 angles, given ones any integer            find the missing one
//   Stretch     3 or 4 expressions in x summing to 360           solve for x
export const generateAnglesAtAPoint = (options = {}) => {
  const { difficulty = 'core' } = options;
  const n = _.sample([3, 4]);

  if (difficulty === 'stretch') {
    const x = _.random(4, 15);
    const { ms, vs, cs, exprs } = algebraSummingTo(n, 360, x, 20, 130);
    const totalM = ms.reduce((s, m) => s + m, 0);
    const totalC = cs.reduce((s, c) => s + c, 0);

    return {
      instruction: 'Find the value of x',
      answer: `x = ${x}`,
      workingOut: [
        `${exprs.join(' + ')} = 360 \\text{ (angles at a point)}`,
        `${totalM}x ${totalC >= 0 ? '+' : '-'} ${Math.abs(totalC)} = 360`,
        `x = ${x}`,
      ].join(NL),
      visualization: { type: 'angle-rays', rays: rayAngles(vs), gapDegrees: vs, wrap: true, labels: exprs, big: 1 },
      metadata: { topic: 'angles-at-a-point', difficulty },
    };
  }

  let raw;
  do {
    const genOne = () => (difficulty === 'foundation' ? _.random(2, 20) * 5 : _.random(5, 170));
    const given = Array.from({ length: n - 1 }, genOne);
    const last = 360 - given.reduce((s, v) => s + v, 0);
    raw = [...given, last];
  } while (raw[n - 1] < 10 || raw[n - 1] > 300);
  const vs = _.shuffle(raw);
  const unknownIndex = _.random(0, n - 1);
  const labels = vs.map((v, i) => (i === unknownIndex ? 'x' : `${v}^\\circ`));
  const others = vs.filter((_v, i) => i !== unknownIndex);
  const sumOthers = others.reduce((s, v) => s + v, 0);
  const found = vs[unknownIndex];

  return {
    instruction: 'Find the size of angle x',
    answer: `x = ${found}^\\circ`,
    workingOut: [
      `x + ${others.map((v) => `${v}^\\circ`).join(' + ')} = 360^\\circ \\text{ (angles at a point)}`,
      `x = 360^\\circ - ${sumOthers}^\\circ`,
      `x = ${found}^\\circ`,
    ].join(NL),
    visualization: { type: 'angle-rays', rays: rayAngles(vs), gapDegrees: vs, wrap: true, labels, unknownIndex, big: 1 },
    metadata: { topic: 'angles-at-a-point', difficulty },
  };
};

// Lays n gap sizes (summing to 360) out as n ray directions (degrees),
// starting straight up, so the drawn wedges are proportional to the data.
function rayAngles(gapSizes) {
  let cum = -90;
  const rays = [cum];
  for (let i = 0; i < gapSizes.length - 1; i++) {
    cum += gapSizes[i];
    rays.push(cum);
  }
  return rays;
}

// generateVerticallyOpposite ----------------------------------------------
//   Foundation  one angle given, find the (equal) vertically opposite one
//   Core        as Foundation, but the asked-for angle may instead be one
//               of the two supplementary (adjacent) angles, 180 - given
//   Stretch     the given and its vertically-opposite partner are both
//               expressions in x, set equal, solve for x
export const generateVerticallyOpposite = (options = {}) => {
  const { difficulty = 'core' } = options;
  // Kept away from the extremes (theta and its supplement 180-theta both
  // stay >= 30) — near 0 or 180 the two crossing lines sit almost on top
  // of each other and the "X" reads as two overlapping lines rather than
  // two clear pairs of vertically opposite angles.
  const theta = _.random(30, 150);
  const rays = [0, theta, 180, 180 + theta];
  const gapDegrees = [theta, 180 - theta, theta, 180 - theta];

  if (difficulty === 'stretch') {
    const x = _.random(4, 20);
    const v = _.random(20, 160);
    const m1 = _.random(1, 4);
    const m2 = _.sample([1, 2, 3, 4].filter((m) => m !== m1));
    const c1 = v - m1 * x;
    const c2 = v - m2 * x;
    const expr1 = formatLinear(m1, c1);
    const expr2 = formatLinear(m2, c2);
    const labels = [expr1, '', expr2, ''];
    return {
      instruction: 'Find the value of x',
      answer: `x = ${x}`,
      workingOut: [
        `${expr1} = ${expr2} \\text{ (vertically opposite angles are equal)}`,
        `${m1 - m2}x = ${c2 - c1}`,
        `x = ${x}`,
      ].join(NL),
      visualization: { type: 'angle-rays', rays, gapDegrees, wrap: true, labels, big: 1 },
      metadata: { topic: 'vertically-opposite', difficulty },
    };
  }

  const targetIndex = difficulty === 'foundation' ? 2 : _.sample([1, 2, 3]);
  const isOpposite = targetIndex === 2;
  const found = isOpposite ? theta : 180 - theta;
  const labels = ['', '', '', ''];
  labels[0] = `${theta}^\\circ`;
  labels[targetIndex] = 'x';
  const steps = isOpposite
    ? [`x = ${theta}^\\circ \\text{ (vertically opposite angles are equal)}`]
    : [`x + ${theta}^\\circ = 180^\\circ \\text{ (angles on a line)}`, `x = ${found}^\\circ`];

  return {
    instruction: 'Find the size of angle x',
    answer: `x = ${found}^\\circ`,
    workingOut: steps.join(NL),
    visualization: { type: 'angle-rays', rays, gapDegrees, wrap: true, labels, unknownIndex: targetIndex, big: 1 },
    metadata: { topic: 'vertically-opposite', difficulty },
  };
};

// generateTriangleAngleSum -------------------------------------------------
// Haese 4B. Shares Figure.jsx's 'triangle' type (a plain scalene outline,
// distinct from right-triangle/isosceles-triangle) with generateTriangleExteriorAngle below.
//   Foundation  two nice angles given (multiples of 5)     find the third
//   Core        any valid pair                              find the third
//   Stretch     three expressions in x summing to 180       solve for x
export const generateTriangleAngleSum = (options = {}) => {
  const { difficulty = 'core' } = options;
  const unknownIndex = _.random(0, 2);

  if (difficulty === 'stretch') {
    const x = _.random(4, 20);
    const { ms, cs, exprs } = algebraSummingTo(3, 180, x, 20, 120);
    const totalM = ms.reduce((s, m) => s + m, 0);
    const totalC = cs.reduce((s, c) => s + c, 0);
    return {
      instruction: 'Find the value of x',
      answer: `x = ${x}`,
      workingOut: [
        `${exprs.join(' + ')} = 180 \\text{ (angle sum of a triangle)}`,
        `${totalM}x ${totalC >= 0 ? '+' : '-'} ${Math.abs(totalC)} = 180`,
        `x = ${x}`,
      ].join(NL),
      visualization: { type: 'triangle', labels: exprs, big: 1 },
      metadata: { topic: 'triangle-angle-sum', difficulty },
    };
  }

  let raw;
  do {
    const genOne = () => (difficulty === 'foundation' ? _.random(4, 28) * 5 : _.random(5, 170));
    const given = [genOne(), genOne()];
    const last = 180 - given[0] - given[1];
    raw = [...given, last];
  } while (raw[2] < 5 || raw[2] > 170);
  const vs = _.shuffle(raw);
  const others = vs.filter((_v, i) => i !== unknownIndex);
  const found = vs[unknownIndex];
  const labels = vs.map((v, i) => (i === unknownIndex ? 'x' : `${v}^\\circ`));
  // Numeric bands know the real angle sizes, so the drawn triangle can
  // actually have an obtuse corner when one of vs genuinely is obtuse,
  // rather than always looking like the same acute/isosceles-ish shape.
  const obtuseIdx = vs.findIndex((v) => v > 90);

  return {
    instruction: 'Find the size of angle x',
    answer: `x = ${found}^\\circ`,
    workingOut: [
      `x + ${others[0]}^\\circ + ${others[1]}^\\circ = 180^\\circ \\text{ (angle sum of a triangle)}`,
      `x = 180^\\circ - ${others[0]}^\\circ - ${others[1]}^\\circ`,
      `x = ${found}^\\circ`,
    ].join(NL),
    visualization: { type: 'triangle', labels, unknownIndex, obtuseIndex: obtuseIdx >= 0 ? obtuseIdx : undefined, big: 1 },
    metadata: { topic: 'triangle-angle-sum', difficulty },
  };
};

// generateTriangleExteriorAngle --------------------------------------------
//   Foundation  both interior-opposite angles given     find the exterior angle
//   Core        exterior + one interior given            find the other interior
//   Stretch     algebraic: exterior expr = sum of two interior-opposite exprs, solve for x
export const generateTriangleExteriorAngle = (options = {}) => {
  const { difficulty = 'core' } = options;

  if (difficulty === 'stretch') {
    const x = _.random(4, 20);
    const m1 = _.random(1, 4);
    const m2 = _.random(1, 4);
    const v1 = _.random(20, 100);
    const v2 = _.random(20, 100);
    const c1 = v1 - m1 * x;
    const c2 = v2 - m2 * x;
    const expr1 = formatLinear(m1, c1);
    const expr2 = formatLinear(m2, c2);
    const m3 = _.random(1, 4);
    const c3 = v1 + v2 - m3 * x;
    const expr3 = formatLinear(m3, c3);
    const cSum = c1 + c2;
    return {
      instruction: 'Find the value of x',
      answer: `x = ${x}`,
      workingOut: [
        `${expr3} = ${expr1} + ${expr2} \\text{ (exterior angle = sum of interior opposite angles)}`,
        `${m3}x ${c3 >= 0 ? '+' : '-'} ${Math.abs(c3)} = ${m1 + m2}x ${cSum >= 0 ? '+' : '-'} ${Math.abs(cSum)}`,
        `x = ${x}`,
      ].join(NL),
      visualization: { type: 'triangle', labels: [expr1, '', expr2], exteriorLabel: expr3, big: 1 },
      metadata: { topic: 'triangle-exterior-angle', difficulty },
    };
  }

  let a, c;
  do {
    a = difficulty === 'foundation' ? _.random(4, 16) * 5 : _.random(10, 90);
    c = difficulty === 'foundation' ? _.random(4, 16) * 5 : _.random(10, 90);
  } while (a + c >= 175 || a + c <= 10);
  const ext = a + c;

  if (difficulty === 'foundation') {
    return {
      instruction: 'Find the exterior angle x',
      answer: `x = ${ext}^\\circ`,
      workingOut: [
        `x = ${a}^\\circ + ${c}^\\circ \\text{ (exterior angle = sum of interior opposite angles)}`,
        `x = ${ext}^\\circ`,
      ].join(NL),
      visualization: { type: 'triangle', labels: [`${a}^\\circ`, '', `${c}^\\circ`], exteriorLabel: 'x', exteriorUnknown: true, big: 1 },
      metadata: { topic: 'triangle-exterior-angle', difficulty },
    };
  }

  const hideA = _.sample([true, false]);
  const given = hideA ? c : a;
  const found = hideA ? a : c;
  const labels = hideA ? ['x', '', `${c}^\\circ`] : [`${a}^\\circ`, '', 'x'];
  return {
    instruction: 'Find the size of angle x',
    answer: `x = ${found}^\\circ`,
    workingOut: [
      `${ext}^\\circ = x + ${given}^\\circ \\text{ (exterior angle = sum of interior opposite angles)}`,
      `x = ${ext}^\\circ - ${given}^\\circ`,
      `x = ${found}^\\circ`,
    ].join(NL),
    visualization: { type: 'triangle', labels, exteriorLabel: `${ext}^\\circ`, unknownIndex: hideA ? 0 : 2, big: 1 },
    metadata: { topic: 'triangle-exterior-angle', difficulty },
  };
};

// generateIsoscelesBaseAngles -----------------------------------------------
// Haese 4C. A DIFFERENT skill from pythagoras-isosceles (which finds a side
// length via Pythagoras) — this one uses the isosceles triangle theorem
// (base angles equal) to find an angle, and shares Figure.jsx's sibling
// 'isosceles-angles' type rather than pythagoras-isosceles's hidden-height
// figure.
//   Foundation  apex given (chosen to divide evenly)     find each base angle: (180 - apex) / 2
//   Core        one base angle given                     find the apex: 180 - 2*base
//   Stretch     base angle given as an expression in x    solve for x
export const generateIsoscelesBaseAngles = (options = {}) => {
  const { difficulty = 'core' } = options;

  if (difficulty === 'stretch') {
    const x = _.random(4, 20);
    const apex = _.random(5, 80) * 2; // even, so (180 - apex) / 2 is a clean integer
    const base = (180 - apex) / 2;
    const m = _.random(1, 4);
    const c = base - m * x;
    const baseExpr = formatLinear(m, c);
    return {
      instruction: 'Find the value of x',
      answer: `x = ${x}`,
      workingOut: [
        `${baseExpr} = \\frac{180 - ${apex}}{2} \\text{ (base angles of an isosceles triangle are equal)}`,
        `${baseExpr} = ${base}`,
        `x = ${x}`,
      ].join(NL),
      visualization: { type: 'isosceles-angles', apexLabel: `${apex}^\\circ`, baseLabel: baseExpr, big: 1 },
      metadata: { topic: 'isosceles-base-angles', difficulty },
    };
  }

  if (difficulty === 'core') {
    const base = _.random(10, 80);
    const apex = 180 - 2 * base;
    return {
      instruction: 'Find the apex angle x',
      answer: `x = ${apex}^\\circ`,
      workingOut: [
        `x = 180^\\circ - 2 \\times ${base}^\\circ \\text{ (base angles of an isosceles triangle are equal)}`,
        `x = ${apex}^\\circ`,
      ].join(NL),
      visualization: { type: 'isosceles-angles', apexLabel: 'x', baseLabel: `${base}^\\circ`, unknownIsApex: true, big: 1 },
      metadata: { topic: 'isosceles-base-angles', difficulty },
    };
  }

  const apex = _.random(5, 80) * 2; // even, so this divides evenly
  const base = (180 - apex) / 2;
  return {
    instruction: 'Find each base angle x',
    answer: `x = ${base}^\\circ`,
    workingOut: [
      `x = \\frac{180^\\circ - ${apex}^\\circ}{2} \\text{ (base angles of an isosceles triangle are equal)}`,
      `x = ${base}^\\circ`,
    ].join(NL),
    visualization: { type: 'isosceles-angles', apexLabel: `${apex}^\\circ`, baseLabel: 'x', unknownIsApex: false, big: 1 },
    metadata: { topic: 'isosceles-base-angles', difficulty },
  };
};

// generateAnglesProblemSolving ----------------------------------------------
// Haese's "give a reason for each step" habit, extended to a genuine
// two-theorem chain rather than one fact. Each call randomly picks one of
// two chain structures and generates fresh random values for it — never a
// fixed bank of pre-written scenarios. Both reuse the 'triangle' figure
// from generateTriangleExteriorAngle above, so no new figure work is needed.
//   isosceles-exterior  apex given -> base angles equal (180-apex)/2 ->
//                       exterior angle = apex + that base angle
//                       (mirrors Haese's own Example 4b: exterior = 2 x base angle)
//   line-triangle-sum   an angle on a line adjacent to the triangle gives
//                       one interior angle by subtraction -> triangle angle
//                       sum (with a second given interior) finds the third
//
//   Foundation/Core  as above, with nice (Foundation) or arbitrary (Core)
//                    numeric angles throughout — find the final angle by
//                    subtraction, same as this file's other Core bands.
//   Stretch          the first theorem's numeric fact stays as given (that
//                    single clean fact is what starts the chain), but the
//                    second theorem's equation is algebraic — one expression
//                    in x (isosceles-exterior) or two expressions in x
//                    (line-triangle-sum, via the shared algebraSummingTo
//                    helper) — so Stretch genuinely differs from Core rather
//                    than reusing its logic under a different label.
export const generateAnglesProblemSolving = (options = {}) => {
  const { difficulty = 'core' } = options;
  const nice = difficulty === 'foundation';
  const chain = _.sample(['isosceles-exterior', 'line-triangle-sum']);

  if (difficulty === 'stretch') {
    const x = _.random(4, 20);

    if (chain === 'isosceles-exterior') {
      const apex = _.random(5, 80) * 2; // even, so (180 - apex) / 2 is a clean integer
      const base = (180 - apex) / 2;
      const total = apex + base;
      const m = _.random(1, 4);
      const c = total - m * x;
      const expr = formatLinear(m, c);
      return {
        instruction: 'Find the value of x',
        answer: `x = ${x}`,
        workingOut: [
          `y = \\frac{180^\\circ - ${apex}^\\circ}{2} \\text{ (base angles of an isosceles triangle are equal)}`,
          `y = ${base}^\\circ`,
          `${expr} = ${apex}^\\circ + ${base}^\\circ \\text{ (exterior angle = sum of interior opposite angles)}`,
          `${expr} = ${total}^\\circ`,
          `x = ${x}`,
        ].join(NL),
        visualization: { type: 'triangle', labels: ['', '', `${apex}^\\circ`], exteriorLabel: expr, exteriorUnknown: true, isosceles: true, big: 1 },
        metadata: { topic: 'angles-problem-solving', difficulty },
      };
    }

    const p = _.random(30, 150);
    const y = 180 - p;
    const { ms, cs, exprs } = algebraSummingTo(2, p, x, 10, p - 10);
    const totalM = ms[0] + ms[1];
    const totalC = cs[0] + cs[1];
    return {
      instruction: 'Find the value of x',
      answer: `x = ${x}`,
      workingOut: [
        `y = 180^\\circ - ${p}^\\circ \\text{ (angles on a line)}`,
        `y = ${y}^\\circ`,
        `${exprs[0]} + ${exprs[1]} = 180^\\circ - ${y}^\\circ \\text{ (angle sum of a triangle)}`,
        `${totalM}x ${totalC >= 0 ? '+' : '-'} ${Math.abs(totalC)} = ${p}`,
        `x = ${x}`,
      ].join(NL),
      visualization: { type: 'triangle', labels: [exprs[0], '', exprs[1]], exteriorLabel: `${p}^\\circ`, big: 1 },
      metadata: { topic: 'angles-problem-solving', difficulty },
    };
  }

  if (chain === 'isosceles-exterior') {
    const apex = nice ? _.random(1, 17) * 10 : _.random(5, 80) * 2; // always even, so (180 - apex) / 2 is a clean integer
    const base = (180 - apex) / 2;
    const exterior = apex + base;
    return {
      instruction: 'Find the exterior angle x',
      answer: `x = ${exterior}^\\circ`,
      workingOut: [
        `y = \\frac{180^\\circ - ${apex}^\\circ}{2} \\text{ (base angles of an isosceles triangle are equal)}`,
        `y = ${base}^\\circ`,
        `x = ${apex}^\\circ + ${base}^\\circ \\text{ (exterior angle = sum of interior opposite angles)}`,
        `x = ${exterior}^\\circ`,
      ].join(NL),
      visualization: { type: 'triangle', labels: ['', '', `${apex}^\\circ`], exteriorLabel: 'x', exteriorUnknown: true, isosceles: true, big: 1 },
      metadata: { topic: 'angles-problem-solving', difficulty },
    };
  }

  const ib = nice ? _.random(2, 16) * 5 : _.random(10, 80);
  const p = 180 - ib;
  let q, thirdInterior;
  do {
    q = nice ? _.random(2, 20) * 5 : _.random(10, 100);
    thirdInterior = 180 - ib - q;
  } while (thirdInterior < 5 || thirdInterior > 170);

  return {
    instruction: 'Find the size of angle x',
    answer: `x = ${thirdInterior}^\\circ`,
    workingOut: [
      `y = 180^\\circ - ${p}^\\circ \\text{ (angles on a line)}`,
      `y = ${ib}^\\circ`,
      `x = 180^\\circ - ${ib}^\\circ - ${q}^\\circ \\text{ (angle sum of a triangle)}`,
      `x = ${thirdInterior}^\\circ`,
    ].join(NL),
    visualization: { type: 'triangle', labels: [`${q}^\\circ`, '', 'x'], unknownIndex: 2, exteriorLabel: `${p}^\\circ`, big: 1 },
    metadata: { topic: 'angles-problem-solving', difficulty },
  };
};

// generateCorrespondingAngles / generateAlternateAngles / generateCoInteriorAngles ------------
// Haese: angle facts from two parallel lines cut by a transversal. All three
// share Figure.jsx's 'parallel-transversal' type (fixed geometry, eight
// possible labelled positions — see POSITION_PAIRS) and this one builder,
// since they differ only in which pair of positions gets used and whether
// that pair is equal or supplementary.
//   Foundation  one angle given, a multiple of 5     find the other by the relationship
//   Core        one angle given, any integer          find the other by the relationship
//   Stretch     the given is numeric, the unknown is an expression in x     solve for x
const RELATIONSHIP_INFO = {
  corresponding: { label: 'corresponding angles', equal: true, topic: 'corresponding-angles' },
  alternate: { label: 'alternate angles', equal: true, topic: 'alternate-angles' },
  coInterior: { label: 'co-interior angles', equal: false, topic: 'co-interior-angles' },
};
const POSITION_PAIRS = {
  corresponding: [['TL1', 'TL2'], ['TR1', 'TR2'], ['BL1', 'BL2'], ['BR1', 'BR2']],
  alternate: [['BR1', 'TL2'], ['BL1', 'TR2']],
  coInterior: [['BR1', 'TR2'], ['BL1', 'TL2']],
};

const buildParallelAngle = (relationship, options = {}) => {
  const { difficulty = 'core' } = options;
  const { label: factLabel, equal, topic } = RELATIONSHIP_INFO[relationship];
  const [posA, posB] = _.sample(POSITION_PAIRS[relationship]);
  const [givenPos, unknownPos] = _.sample([true, false]) ? [posA, posB] : [posB, posA];

  const givenValue = difficulty === 'foundation' ? _.random(6, 30) * 5 : _.random(10, 170);
  const trueUnknownValue = equal ? givenValue : 180 - givenValue;

  let unknownLabel, answer, workingOut;
  if (difficulty === 'stretch') {
    const x = _.random(4, 15);
    const coeff = _.random(2, 6);
    const constant = trueUnknownValue - coeff * x;
    unknownLabel = `${coeff}x${constant >= 0 ? ` + ${constant}` : ` - ${Math.abs(constant)}`}`;
    answer = `x = ${x}`;
    workingOut =
      `\\text{${factLabel} are ${equal ? 'equal' : 'supplementary'}, so:}` + NL +
      `${coeff}x ${constant >= 0 ? '+' : '-'} ${Math.abs(constant)} = ${trueUnknownValue}` + NL +
      `x = ${x}`;
  } else {
    unknownLabel = 'x';
    answer = `${trueUnknownValue}^\\circ`;
    workingOut = equal
      ? `\\text{${factLabel} are equal}` + NL + `${trueUnknownValue}^\\circ`
      : `\\text{${factLabel} are supplementary}` + NL + `180 - ${givenValue} = ${trueUnknownValue}^\\circ`;
  }

  return {
    instruction: `Find ${difficulty === 'stretch' ? 'x' : 'the marked angle'} — the lines are parallel`,
    // No separate questionMath line — the given angle is already labelled
    // directly on the diagram, restating it in text above the figure too
    // is redundant.
    questionMath: null,
    answer,
    workingOut,
    visualization: {
      type: 'parallel-transversal',
      given: { position: givenPos, label: `${givenValue}^\\circ` },
      unknown: { position: unknownPos, label: unknownLabel },
      big: 1,
    },
    metadata: { topic, difficulty, tags: ['angles', relationship] },
  };
};

export const generateCorrespondingAngles = (options = {}) => buildParallelAngle('corresponding', options);
export const generateAlternateAngles = (options = {}) => buildParallelAngle('alternate', options);
export const generateCoInteriorAngles = (options = {}) => buildParallelAngle('coInterior', options);

// generatePolygonInteriorAngles / generatePolygonExteriorAngles ----------------------------------
// Haese: regular-polygon angle facts. Both share Figure.jsx's 'polygon' type
// (n-sided outline, either an interior corner mark or an exterior
// extension + arc depending on `exterior`).
//   Foundation  small n (<= 8, interior) / <= 10 (exterior)     read off the fact
//   Core        any n from the nice-n pool                       read off the fact
//   Stretch     interior: given the angle, find n. exterior: given all-but-one
//               exterior angle (sum to 360, any polygon), find the missing one
const NICE_POLYGON_N = [4, 5, 6, 8, 9, 10, 12, 15, 18, 20];
const interiorAngleOf = (n) => (180 * (n - 2)) / n;
// Per-vertex radius multipliers for the 'polygon-irregular' figure — kept
// close to 1 (0.72-1.00) so the shape stays convex and legible while still
// reading as genuinely irregular rather than a regular n-gon with
// mismatched angle labels.
const randomRadiusFactors = (n) => Array.from({ length: n }, () => _.random(72, 100) / 100);

export const generatePolygonInteriorAngles = (options = {}) => {
  const { difficulty = 'core' } = options;

  if (difficulty === 'stretch') {
    // Half the time: the regular-polygon reverse lookup (given the interior
    // angle, find n). The other half: an irregular polygon with all but one
    // interior angle given, find the missing one via 180(n-2) — genuinely
    // different reasoning (the general angle-sum fact, not the regular-n
    // formula), so Stretch isn't just the same trick with bigger numbers.
    if (_.sample([true, false])) {
      const n = _.sample(NICE_POLYGON_N.filter((v) => v >= 6));
      const angle = interiorAngleOf(n);
      return {
        instruction: 'Each interior angle of a regular polygon is given. How many sides does it have?',
        questionMath: `${angle}^\\circ`,
        answer: `n = ${n}`,
        workingOut: `\\frac{180(n-2)}{n} = ${angle}` + NL + `n = ${n}`,
        visualization: { type: 'polygon', n, angleLabel: `${angle}^\\circ`, big: 1 },
        metadata: { topic: 'polygon-interior-angles', difficulty, tags: ['angles', 'polygon', 'interior'] },
      };
    }

    // Rejection-sample so the missing angle always lands somewhere sensible
    // (30-170) rather than risking a near-zero or implausibly large corner.
    let n, knownAngles, missing;
    do {
      n = _.random(4, 7);
      knownAngles = Array.from({ length: n - 1 }, () => _.random(60, 150));
      missing = 180 * (n - 2) - knownAngles.reduce((a, b) => a + b, 0);
    } while (missing < 30 || missing > 170);

    const unknownIndex = _.random(0, n - 1);
    const angles = [];
    let k = 0;
    for (let i = 0; i < n; i++) angles.push(i === unknownIndex ? 'x' : `${knownAngles[k++]}^\\circ`);

    return {
      instruction: `This is an irregular ${n}-sided polygon. Find the missing angle x.`,
      questionMath: `${knownAngles.map((a) => `${a}^\\circ`).join(',\\ ')},\\ x`,
      answer: `x = ${missing}^\\circ`,
      workingOut:
        `\\text{sum of interior angles} = 180(${n} - 2) = ${180 * (n - 2)}^\\circ` + NL +
        `x = ${180 * (n - 2)} - (${knownAngles.join(' + ')}) = ${missing}^\\circ`,
      visualization: { type: 'polygon-irregular', n, angles, unknownIndex, radiusFactors: randomRadiusFactors(n) },
      metadata: { topic: 'polygon-interior-angles', difficulty, tags: ['angles', 'polygon', 'interior', 'irregular'] },
    };
  }

  const pool = difficulty === 'foundation' ? NICE_POLYGON_N.filter((v) => v <= 8) : NICE_POLYGON_N;
  const n = _.sample(pool);
  const angle = interiorAngleOf(n);
  return {
    instruction: `Find the interior angle of a regular ${n}-sided polygon`,
    questionMath: null,
    answer: `${angle}^\\circ`,
    workingOut: `\\frac{180(${n}-2)}{${n}} = \\frac{${180 * (n - 2)}}{${n}} = ${angle}^\\circ`,
    visualization: { type: 'polygon', n, angleLabel: 'x', big: 1 },
    metadata: { topic: 'polygon-interior-angles', difficulty, tags: ['angles', 'polygon', 'interior'] },
  };
};

const NICE_EXTERIOR_N = [4, 5, 6, 8, 9, 10, 12, 15, 18, 20, 24, 36];
const exteriorAngleOf = (n) => 360 / n;

export const generatePolygonExteriorAngles = (options = {}) => {
  const { difficulty = 'core' } = options;

  if (difficulty === 'stretch') {
    // Exterior angles of ANY polygon sum to 360 - doesn't need regularity.
    // Rejection-sample so the missing angle always lands somewhere
    // sensible (15-150) rather than risking a negative or tiny result.
    let n, knownAngles, missing;
    do {
      n = _.random(5, 7);
      knownAngles = Array.from({ length: n - 1 }, () => _.random(25, 75));
      missing = 360 - knownAngles.reduce((a, b) => a + b, 0);
    } while (missing < 15 || missing > 150);

    return {
      instruction: `The exterior angles of a ${n}-sided polygon are shown. Find the missing one.`,
      questionMath: `${knownAngles.map((a) => `${a}^\\circ`).join(',\\ ')},\\ x`,
      answer: `x = ${missing}^\\circ`,
      workingOut:
        `\\text{exterior angles of any polygon sum to } 360^\\circ` + NL +
        `x = 360 - (${knownAngles.join(' + ')}) = ${missing}^\\circ`,
      visualization: { type: 'polygon', n, exterior: true, angleLabel: 'x', big: 1 },
      metadata: { topic: 'polygon-exterior-angles', difficulty, tags: ['angles', 'polygon', 'exterior'] },
    };
  }

  const pool = difficulty === 'foundation' ? NICE_EXTERIOR_N.filter((v) => v <= 10) : NICE_EXTERIOR_N;
  const n = _.sample(pool);
  const angle = exteriorAngleOf(n);
  return {
    instruction: `Find the exterior angle of a regular ${n}-sided polygon`,
    questionMath: null,
    answer: `${angle}^\\circ`,
    workingOut: `360 \\div ${n} = ${angle}^\\circ`,
    visualization: { type: 'polygon', n, exterior: true, angleLabel: 'x', big: 1 },
    metadata: { topic: 'polygon-exterior-angles', difficulty, tags: ['angles', 'polygon', 'exterior'] },
  };
};
