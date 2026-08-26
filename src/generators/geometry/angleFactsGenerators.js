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

// generateAnglesOnALine -------------------------------------------------
//   Foundation  one angle given, a multiple of 5 in 20-160     find the other by subtraction
//   Core        one angle given, any integer 1-179             find the other by subtraction
//   Stretch     two expressions in x summing to 180             solve for x
export const generateAnglesOnALine = (options = {}) => {
  const { difficulty = 'core' } = options;
  let a1, a2, labels, unknownIndex, answer, steps;

  if (difficulty === 'stretch') {
    const x = _.random(4, 20);
    a1 = _.random(30, 150);
    a2 = 180 - a1;
    const m1 = _.random(1, 4);
    const m2 = _.random(1, 4);
    const c1 = a1 - m1 * x;
    const c2 = a2 - m2 * x;
    const expr1 = formatLinear(m1, c1);
    const expr2 = formatLinear(m2, c2);
    labels = [expr1, expr2];
    unknownIndex = undefined;
    answer = `x = ${x}`;
    const cSum = c1 + c2;
    steps = [
      `${expr1} + ${expr2} = 180 \\text{ (angles on a line)}`,
      `${m1 + m2}x ${cSum >= 0 ? '+' : '-'} ${Math.abs(cSum)} = 180`,
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
    const ms = Array.from({ length: n }, () => _.random(1, 4));
    let vs;
    do {
      const given = Array.from({ length: n - 1 }, () => _.random(20, 130));
      const last = 360 - given.reduce((s, v) => s + v, 0);
      vs = [...given, last];
    } while (vs[n - 1] < 15 || vs[n - 1] > 300);
    const cs = vs.map((v, i) => v - ms[i] * x);
    const exprs = vs.map((v, i) => formatLinear(ms[i], cs[i]));
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
