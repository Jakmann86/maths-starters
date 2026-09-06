// src/generators/puzzles/arithmagonGenerators.js
//
// Two more retrieval-pool puzzles: arithmagons and number walls. Both
// single-answer, both generated fresh every time, neither needing any
// curriculum knowledge — same convention as magic squares and symbol puzzles.

import _ from 'lodash';

const NL = '\n';
const triple = (a, b, c) => `a = ${a},\\ b = ${b},\\ c = ${c}`;

/* --------------------------------------------------------------- arithmagon */
// Three circles at the corners, a box on each edge. Each box is the sum (or,
// at stretch, the product) of the two circles either side of it. Given the
// boxes, find the circles.
//
// The trick is that adding all three boxes double-counts every circle, so
// a = (ab + ca - bc) / 2. Students who have not met it try trial and error and
// get nowhere; students who have met it get it in ten seconds. That gap is why
// it is a good starter.

export const generateArithmagon = (options = {}) => {
  const { difficulty = 'core' } = options;

  if (difficulty === 'stretch') {
    // Multiplicative. Now a^2 = (ab x ca) / bc, so the same double-counting
    // idea reappears as a square root. Always a perfect square by
    // construction, since (ab)(ca)/(bc) = a^2 exactly.
    let a, b, c;
    do {
      a = _.random(2, 12); b = _.random(2, 12); c = _.random(2, 12);
    } while (a === b && b === c);
    const [ab, bc, ca] = [a * b, b * c, c * a];
    return {
      instruction: 'Each box is the product of the two circles beside it. Find a, b and c',
      answer: triple(a, b, c),
      workingOut: `ab \\times ca \\div bc = a^2${NL}${ab} \\times ${ca} \\div ${bc} = ${a * a}${NL}a = ${a},\\ \\text{then } b = ${ab} \\div ${a} = ${b},\\ c = ${ca} \\div ${a} = ${c}`,
      visualization: { type: 'arithmagon', op: '×', vertices: ['a', 'b', 'c'], edges: [String(ab), String(bc), String(ca)] },
      metadata: { topic: 'arithmagon', difficulty },
    };
  }

  // Additive. At core one circle is negative, which is the case students rule
  // out without checking — every box is still positive, so nothing on the
  // figure hints at it.
  let a, b, c;
  do {
    if (difficulty === 'foundation') {
      a = _.random(1, 20); b = _.random(1, 20); c = _.random(1, 20);
    } else {
      a = _.random(-12, -1); b = _.random(6, 25); c = _.random(6, 25);
      [a, b, c] = _.shuffle([a, b, c]);
    }
  } while (a + b <= 0 || b + c <= 0 || c + a <= 0);

  const [ab, bc, ca] = [a + b, b + c, c + a];
  return {
    instruction: 'Each box is the sum of the two circles beside it. Find a, b and c',
    answer: triple(a, b, c),
    workingOut: `ab + bc + ca = ${ab + bc + ca} = 2(a + b + c)${NL}a + b + c = ${(ab + bc + ca) / 2}${NL}a = ${(ab + bc + ca) / 2} - ${bc} = ${a},\\ b = ${b},\\ c = ${c}`,
    visualization: { type: 'arithmagon', op: '+', vertices: ['a', 'b', 'c'], edges: [String(ab), String(bc), String(ca)] },
    metadata: { topic: 'arithmagon', difficulty },
  };
};

/* -------------------------------------------------------------- number wall */
// Each brick is the sum of the two directly below it. Rows are stored bottom
// first, so rows[0] is the widest.

const buildWall = (bottom) => {
  const rows = [bottom];
  while (rows[rows.length - 1].length > 1) {
    const prev = rows[rows.length - 1];
    rows.push(prev.slice(1).map((v, i) => prev[i] + v));
  }
  return rows;
};

export const generateNumberWall = (options = {}) => {
  const { difficulty = 'core' } = options;

  if (difficulty === 'foundation') {
    // Build upwards: the whole bottom row is given.
    const bottom = _.times(3, () => _.random(1, 20));
    const rows = buildWall(bottom);
    return {
      instruction: 'Each brick is the sum of the two below it. Find the top brick',
      answer: `x = ${rows[2][0]}`,
      workingOut: `${bottom[0]} + ${bottom[1]} = ${rows[1][0]},\\ ${bottom[1]} + ${bottom[2]} = ${rows[1][1]}${NL}${rows[1][0]} + ${rows[1][1]} = ${rows[2][0]}`,
      visualization: {
        type: 'number-wall',
        rows: [bottom.map(String), ['', ''], ['x']],
        unknown: [[2, 0]],
      },
      metadata: { topic: 'number-wall', difficulty },
    };
  }

  if (difficulty === 'core') {
    // Work backwards. The top is a + 2b + c, so recovering the middle brick
    // needs a halving that the upward direction never asks for.
    const bottom = _.times(3, () => _.random(1, 20));
    const rows = buildWall(bottom);
    const hide = _.random(0, 2);
    const top = rows[2][0];
    const shown = bottom.map((v, i) => (i === hide ? 'x' : String(v)));
    // The middle brick of the bottom row is counted twice on the way up, so
    // hiding it makes the question a halving rather than a subtraction. Both
    // cases appear.
    const coef = hide === 1 ? 2 : 1;
    const rest = top - bottom[hide] * coef;
    return {
      instruction: 'Each brick is the sum of the two below it. Find x',
      answer: `x = ${bottom[hide]}`,
      workingOut: `\\text{top} = a + 2b + c = ${top}${NL}${coef === 2 ? '2x' : 'x'} + ${rest} = ${top}${NL}x = ${bottom[hide]}`,
      visualization: {
        type: 'number-wall',
        rows: [shown, ['', ''], [String(top)]],
        unknown: [[0, hide]],
      },
      metadata: { topic: 'number-wall', difficulty },
    };
  }

  // A four-wide wall. The top is a + 3b + 3c + d, so a hidden inner brick
  // needs a division by three.
  const bottom = _.times(4, () => _.random(1, 15));
  const rows = buildWall(bottom);
  const hide = _.sample([1, 2]);
  const top = rows[3][0];
  const coef = 3;
  const rest = top - bottom[hide] * coef;
  return {
    instruction: 'Each brick is the sum of the two below it. Find x',
    answer: `x = ${bottom[hide]}`,
    workingOut: `\\text{top} = a + 3b + 3c + d = ${top}${NL}3x + ${rest} = ${top}${NL}x = ${bottom[hide]}`,
    visualization: {
      type: 'number-wall',
      rows: [bottom.map((v, i) => (i === hide ? 'x' : String(v))), ['', '', ''], ['', ''], [String(top)]],
      unknown: [[0, hide]],
    },
    metadata: { topic: 'number-wall', difficulty },
  };
};
