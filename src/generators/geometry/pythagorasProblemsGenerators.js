// Pythagoras beyond a single triangle — Haese 8B and 8E.
//
//   pythagoras-converse  8B   is it right-angled, and where?
//   pythagoras-3d        8E   right triangles inside solids
//
// Haese 8D (circle problems) is already served by the Circle theorems
// topic's chord-perpendicular-bisector and tangent-length skills.
//
// Every given length is a whole number and sits on the figure, so these are
// forward questions with no questionMath, except the coordinate converse at
// Stretch, where the givens are points rather than lengths.

import _ from 'lodash';
import { pythagoreanTriples } from '../shared';

const NL = '\n';
const isSquare = (n) => Number.isInteger(Math.sqrt(n));
const sig3 = (n) => n.toPrecision(3);

// Triples generated, not listed (CLAUDE.md 8), smallest leg first.
const tripleList = (limit) => pythagoreanTriples(limit).map(([a, b, c]) => [Math.min(a, b), Math.max(a, b), c]);
const SMALL = tripleList(30);
const LARGE = tripleList(65).filter(([, , c]) => c > 25);

/* --------------------------------------------------------------- converse */

const VERTEX_SETS = [['A', 'B', 'C'], ['P', 'Q', 'R'], ['X', 'Y', 'Z'], ['K', 'L', 'M']];

/** The angles opposite sides [a, b, c], in degrees, by the cosine rule. */
const anglesOf = ([a, b, c]) => {
  const ang = (x, y, z) => (Math.acos((y * y + z * z - x * x) / (2 * y * z)) * 180) / Math.PI;
  return [ang(a, b, c), ang(b, c, a), ang(c, a, b)];
};

/**
 * Three sides, smallest first, that are a triangle and not right-angled:
 * a triple with one side moved by one or two, so it is close enough that
 * only the arithmetic can tell. The longest side stays within [lo, hi], the
 * band's range.
 */
function nearMiss(pool, lo, hi) {
  for (;;) {
    const t = [..._.sample(pool)];
    const i = _.random(0, 2);
    t[i] += _.sample([-2, -1, 1, 2]);
    const s = [...t].sort((x, y) => x - y);
    if (s[0] < 2 || s[0] + s[1] <= s[2] || new Set(s).size < 3) continue;
    if (s[0] * s[0] + s[1] * s[1] === s[2] * s[2] || s[2] < lo || s[2] > hi) continue;
    return s;
  }
}

/** The test written out: the two shorter sides squared and added, the longest squared. */
const testLines = ([a, b, c]) => {
  const sum = a * a + b * b;
  return [
    `${a}^2 + ${b}^2 = ${a * a} + ${b * b} = ${sum}`,
    `${c}^2 = ${c * c}`,
  ];
};

export const generatePythagorasConverse = (options = {}) => {
  const { difficulty = 'core' } = options;
  const right = Math.random() < 0.5;

  if (difficulty === 'foundation' || difficulty === 'core') {
    // Foundation (Haese 8B Q1): three sides, right-angled or not, small
    // enough to square by hand. Core (8B Q2): larger sides, named vertices,
    // and the right angle to be located, opposite the longest side,
    // wherever that has been put.
    const F = difficulty === 'foundation';
    const pool = F ? SMALL : LARGE;
    const sides = right ? [..._.sample(pool)] : F ? nearMiss(pool, 5, 30) : nearMiss(pool, 26, 65);
    const unit = _.sample(['cm', 'm', 'km']);
    const order = _.shuffle([0, 1, 2]); // sides[order[i]] is side i of the figure
    const figSides = order.map((k) => sides[k]);
    const vertices = _.sample(VERTEX_SETS);
    const at = vertices[order.indexOf(2)]; // opposite the longest side
    const [a, b, c] = sides;
    const verdict = F
      ? (right ? '\\text{Yes}' : '\\text{No}')
      : (right ? `\\text{Right-angled at } ${at}` : '\\text{Not right-angled}');
    const reason = right ? `${a}^2 + ${b}^2 = ${c}^2` : `${a}^2 + ${b}^2 \\ne ${c}^2`;
    return {
      instruction: F ? 'Is the triangle right-angled?' : 'Find the right angle, if there is one',
      answer: `${verdict}: \\; ${reason}`,
      workingOut: [...testLines(sides), verdict].join(NL),
      visualization: {
        type: 'oblique-triangle',
        angles: anglesOf(figSides),
        sides: figSides.map((n) => `${n} ${unit}`),
        ...(F ? {} : { vertices }),
        mirror: _.sample([true, false]),
        big: true,
      },
      metadata: { topic: 'pythagoras-converse', difficulty },
    };
  }

  // Stretch: the vertices as coordinates (Haese 8C Example 10 meets 8B).
  // Each side squared is a run and a rise squared; then the converse.
  for (;;) {
    const B = [_.random(-5, 5), _.random(-5, 5)];
    const u = [_.random(-5, 5), _.random(-5, 5)];
    if (u[0] === 0 && u[1] === 0) continue;
    const m = _.sample([1, 2, -1]);
    const v = [-u[1] * m, u[0] * m];
    if (!right) v[_.random(0, 1)] += _.sample([-1, 1]);
    const P = [[B[0] + u[0], B[1] + u[1]], B, [B[0] + v[0], B[1] + v[1]]];
    if (P.flat().some((n) => Math.abs(n) > 9)) continue;
    const cross = u[0] * v[1] - u[1] * v[0];
    if (cross === 0) continue;
    // Which point is called what is shuffled, so the right angle is not
    // always at the middle letter.
    const names = ['A', 'B', 'C'];
    const perm = _.shuffle([0, 1, 2]); // point perm[i] is called names[i]
    const pt = (i) => P[perm[i]];
    const d2 = (i, j) => (pt(i)[0] - pt(j)[0]) ** 2 + (pt(i)[1] - pt(j)[1]) ** 2;
    const sq = { AB: d2(0, 1), BC: d2(1, 2), AC: d2(0, 2) };
    const isRight = Object.entries(sq).some(([k, val]) => {
      const others = Object.entries(sq).filter(([j]) => j !== k).reduce((s, [, w]) => s + w, 0);
      return others === val;
    });
    if (isRight !== right) continue;
    const longest = _.maxBy(Object.entries(sq), ([, val]) => val)[0];
    if (Object.values(sq).filter((val) => val === sq[longest]).length > 1) continue;
    const at = names.find((n) => !longest.includes(n));
    const rest = Object.keys(sq).filter((k) => k !== longest);
    const sum = sq[rest[0]] + sq[rest[1]];
    const runRise = (k) => {
      const [i, j] = [names.indexOf(k[0]), names.indexOf(k[1])];
      return `${k}^2 = ${Math.abs(pt(i)[0] - pt(j)[0])}^2 + ${Math.abs(pt(i)[1] - pt(j)[1])}^2 = ${sq[k]}`;
    };
    const verdict = right ? `\\text{Right-angled at } ${at}` : '\\text{Not right-angled}';
    return {
      instruction: 'Find the right angle, if there is one',
      questionMath: names.map((n, i) => `${n}(${pt(i)[0]}, ${pt(i)[1]})`).join(', \\; '),
      answer: `${verdict}: \\; ${rest[0]}^2 + ${rest[1]}^2 ${right ? '=' : '\\ne'} ${longest}^2`,
      workingOut: [
        ...['AB', 'BC', 'AC'].map(runRise),
        `${sq[rest[0]]} + ${sq[rest[1]]} = ${sum}${right ? '' : ` \\ne ${sq[longest]}`}`,
        verdict,
      ].join(NL),
      visualization: null,
      metadata: { topic: 'pythagoras-converse', difficulty },
    };
  }
};

/* --------------------------------------------------------------------- 3D */

export const generatePythagoras3d = (options = {}) => {
  const { difficulty = 'core' } = options;

  if (difficulty === 'foundation') {
    // One right triangle inside a solid, from a triple (Haese 8E Q1,
    // Example 17): a cone's height, slant or radius, or the longest rod in a
    // cylinder from its diameter.
    if (Math.random() < 0.6) {
      const [p, q, l] = _.sample(SMALL);
      const [r, h] = _.shuffle([p, q]);
      const unknown = _.sample(['h', 'l', 'r']);
      const known = { r, h, l };
      const lab = (k) => (k === unknown ? 'x' : `${known[k]} cm`);
      const x = known[unknown];
      const name = { h: 'perpendicular height', l: 'slant height', r: 'radius' }[unknown];
      const first = unknown === 'l' ? `x^2 = ${h}^2 + ${r}^2` : `x^2 = ${l}^2 - ${unknown === 'h' ? r : h}^2`;
      return {
        instruction: `Find the ${name} of the cone`,
        answer: `x = ${x}`,
        answerUnits: '\\text{cm}',
        workingOut: [first, `x^2 = ${x * x}`, `x = ${x}`].join(NL),
        visualization: { type: 'cone', r: lab('r'), h: lab('h'), l: lab('l'), unknown, big: true },
        metadata: { topic: 'pythagoras-3d', difficulty },
      };
    }
    const [p, q, l] = _.sample(SMALL);
    const [dia, h] = _.shuffle([p, q]);
    return {
      instruction: 'Find the length of the rod',
      answer: `x = ${l}`,
      answerUnits: '\\text{cm}',
      workingOut: [`x^2 = ${dia}^2 + ${h}^2`, `x^2 = ${l * l}`, `x = ${l}`].join(NL),
      visualization: { type: 'cylinder', diameter: `${dia} cm`, h: `${h} cm`, diagonal: 'x', unknown: 'diagonal', big: true },
      metadata: { topic: 'pythagoras-3d', difficulty },
    };
  }

  if (difficulty === 'core') {
    // Two right triangles, the first one's hypotenuse feeding the second
    // (Haese Examples 17-18, 8E Q5-6): a cuboid's space diagonal with the
    // floor diagonal drawn, or the longest rod in a cylinder from its
    // radius, which must be doubled first. Exact, in surd form (unsimplified,
    // as the other Pythagoras skills) unless it comes out whole.
    if (Math.random() < 0.6) {
      const [l, w, h] = [_.random(2, 12), _.random(2, 12), _.random(2, 12)];
      if (l === w && w === h) return generatePythagoras3d(options);
      const s = l * l + w * w + h * h;
      const x = isSquare(s) ? `${Math.sqrt(s)}` : `\\sqrt{${s}}`;
      return {
        instruction: 'Find the length of the diagonal',
        answer: `x = ${x}`,
        answerUnits: '\\text{cm}',
        workingOut: [
          `y^2 = ${l}^2 + ${w}^2 = ${l * l + w * w}`,
          `x^2 = y^2 + ${h}^2`,
          `x^2 = ${l * l + w * w} + ${h * h} = ${s}`,
          `x = ${x}`,
        ].join(NL),
        visualization: { type: 'cuboid', l: `${l} cm`, d: `${w} cm`, h: `${h} cm`, diagonal: 'x', baseDiagonal: true, unknown: 'diagonal', big: true },
        metadata: { topic: 'pythagoras-3d', difficulty },
      };
    }
    const r = _.random(2, 9);
    const h = _.random(4, 20);
    const s = 4 * r * r + h * h;
    const x = isSquare(s) ? `${Math.sqrt(s)}` : `\\sqrt{${s}}`;
    return {
      instruction: 'Find the length of the rod',
      answer: `x = ${x}`,
      answerUnits: '\\text{cm}',
      workingOut: [`\\text{diameter} = ${2 * r}`, `x^2 = ${2 * r}^2 + ${h}^2`, `x^2 = ${s}`, `x = ${x}`].join(NL),
      visualization: { type: 'cylinder', r: `${r} cm`, h: `${h} cm`, diagonal: 'x', unknown: 'diagonal', big: true },
      metadata: { topic: 'pythagoras-3d', difficulty },
    };
  }

  // Stretch: the diagonal given, an edge wanted (Haese Review 8A Q7, Review
  // 8B Q8): the two steps run backwards. A cube, a cuboid's third edge, or
  // a cylinder's height. To 3 significant figures, never a whole number.
  const kind = _.sample(['cube', 'cuboid', 'cylinder']);
  const done = (x2, lines, viz, instruction = 'Find x, correct to 3 significant figures') => {
    const x = sig3(Math.sqrt(x2));
    return {
      instruction,
      answer: `x = ${x}`,
      answerUnits: '\\text{cm}',
      workingOut: [...lines, `x = ${x} \\text{ (3 s.f.)}`].join(NL),
      visualization: { ...viz, big: true },
      metadata: { topic: 'pythagoras-3d', difficulty },
    };
  };
  for (;;) {
    if (kind === 'cube') {
      const D = _.random(5, 40);
      if (D % 3 === 0 && isSquare((D * D) / 3)) continue;
      return done((D * D) / 3, [`x^2 + x^2 + x^2 = ${D}^2`, `3x^2 = ${D * D}`, `x^2 = ${(D * D) % 3 === 0 ? D * D / 3 : `\\frac{${D * D}}{3}`}`],
        { type: 'cuboid', l: 'x', d: 'x', h: 'x', diagonal: `${D} cm`, unknown: 'l' });
    }
    if (kind === 'cuboid') {
      const [a, b] = [_.random(2, 12), _.random(2, 12)];
      const D = _.random(Math.ceil(Math.sqrt(a * a + b * b)) + 1, Math.ceil(Math.sqrt(a * a + b * b)) + 10);
      const x2 = D * D - a * a - b * b;
      if (x2 <= 0 || isSquare(x2)) continue;
      return done(x2, [`x^2 + ${a}^2 + ${b}^2 = ${D}^2`, `x^2 = ${D * D} - ${a * a} - ${b * b}`, `x^2 = ${x2}`],
        { type: 'cuboid', l: `${a} cm`, d: `${b} cm`, h: 'x', diagonal: `${D} cm`, unknown: 'h' });
    }
    const r = _.random(2, 9);
    const D = _.random(2 * r + 2, 2 * r + 15);
    const x2 = D * D - 4 * r * r;
    if (isSquare(x2)) continue;
    return done(x2, [`\\text{diameter} = ${2 * r}`, `x^2 + ${2 * r}^2 = ${D}^2`, `x^2 = ${x2}`],
      { type: 'cylinder', r: `${r} cm`, h: 'x', diagonal: `${D} cm`, unknown: 'h' });
  }
};
