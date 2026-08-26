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
      visualization: { type: 'angle-rays', rays: rayAngles(vs), wrap: true, labels: exprs, big: 1 },
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
    visualization: { type: 'angle-rays', rays: rayAngles(vs), wrap: true, labels, unknownIndex, big: 1 },
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
  const theta = _.random(10, 170);
  const rays = [0, theta, 180, 180 + theta];

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
      visualization: { type: 'angle-rays', rays, wrap: true, labels, big: 1 },
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
    visualization: { type: 'angle-rays', rays, wrap: true, labels, unknownIndex: targetIndex, big: 1 },
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

  return {
    instruction: 'Find the size of angle x',
    answer: `x = ${found}^\\circ`,
    workingOut: [
      `x + ${others[0]}^\\circ + ${others[1]}^\\circ = 180^\\circ \\text{ (angle sum of a triangle)}`,
      `x = 180^\\circ - ${others[0]}^\\circ - ${others[1]}^\\circ`,
      `x = ${found}^\\circ`,
    ].join(NL),
    visualization: { type: 'triangle', labels, unknownIndex, big: 1 },
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
