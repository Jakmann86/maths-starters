// src/generators/geometry/circleLengthGenerators.js
//
// Haese chapter 27A, the two circle theorems that produce a length rather
// than an angle:
//
//   chord-perpendicular-bisector  the perpendicular from the centre of a
//                                 circle to a chord bisects the chord
//   tangent-length                the tangent is perpendicular to the radius
//                                 at the point of contact
//
// Both lean on Pythagoras, so both fall back to KaTeX (SPEC.md §6 sends every
// exponent that way). Neither returns questionMath: every given is a length
// and sits on the figure as a dimension label, which is the forward-question
// split in CLAUDE.md §2.
//
// Triples are generated with Euclid's formula and filtered, never listed.

import _ from 'lodash';

const NL = '\n';

const gcd = (a, b) => (b ? gcd(b, a % b) : Math.abs(a));

/**
 * Every Pythagorean triple with hypotenuse at most `limit`, grouped by
 * hypotenuse. Each entry is [shorterLeg, longerLeg]. Built once.
 */
function buildTriples(limit) {
  const byHyp = new Map();
  for (let m = 2; m * m <= limit; m += 1) {
    for (let n = 1; n < m; n += 1) {
      if ((m - n) % 2 === 0) continue;
      if (gcd(m, n) !== 1) continue;
      const a = m * m - n * n;
      const b = 2 * m * n;
      const c = m * m + n * n;
      for (let k = 1; k * c <= limit; k += 1) {
        const hyp = k * c;
        const legs = [Math.min(k * a, k * b), Math.max(k * a, k * b)];
        if (!byHyp.has(hyp)) byHyp.set(hyp, []);
        const list = byHyp.get(hyp);
        if (!list.some((p) => p[0] === legs[0] && p[1] === legs[1])) list.push(legs);
      }
    }
  }
  return byHyp;
}

const TRIPLES = buildTriples(160);

/** Hypotenuses with at least one triple, within a sensible classroom range. */
const HYPS = [...TRIPLES.keys()].filter((c) => c >= 5 && c <= 100).sort((x, y) => x - y);

/** Hypotenuses carrying two or more distinct leg pairs, for the Stretch band. */
const HYPS_MULTI = HYPS.filter((c) => TRIPLES.get(c).length >= 2);

/* ------------------------------------------------------------------ *
 * The perpendicular from the centre bisects the chord
 *
 * Foundation  r and the distance given      find the chord   (doubling out)
 * Core        the chord and r given         find the distance (halving in)
 * Stretch     two parallel chords and r     find the gap between them
 * ------------------------------------------------------------------ */

export const generateChordBisector = (options = {}) => {
  const { difficulty = 'core' } = options;

  if (difficulty === 'stretch') {
    for (;;) {
      const r = _.sample(HYPS_MULTI);
      const pairs = TRIPLES.get(r);
      // Each leg pair gives two usable chords — half-chord h with distance d,
      // or the other way round — so even a single triple offers a choice.
      const options2 = _.flatMap(pairs, ([a, b]) => [[a, b], [b, a]]);
      const [[h1, d1], [h2, d2]] = _.sampleSize(options2, 2);
      if (h1 === h2) continue;                    // two identical chords
      const sameSide = _.random(0, 1) === 1;
      const gap = sameSide ? Math.abs(d1 - d2) : d1 + d2;
      if (gap === 0) continue;

      // The longer chord is nearer the centre, so it is the lower of the two
      // when they sit on the same side of it.
      const [topH, topD, botH, botD] = h1 < h2
        ? [h1, d1, h2, d2] : [h2, d2, h1, d1];

      return {
        instruction: sameSide
          ? 'The parallel chords are on the same side of the centre. Find the distance between them'
          : 'The parallel chords are on opposite sides of the centre. Find the distance between them',
        answer: String(gap),
        answerUnits: 'cm',
        workingOut: [
          // The halving is written into the line rather than assumed: the
          // figure carries the whole chord, so a working line that opens with
          // the half-chord has silently done a step.
          `d_1^2 = ${r}^2 - (${2 * topH} \\div 2)^2 = ${r * r - topH * topH}`,
          `d_1 = ${topD}`,
          `d_2^2 = ${r}^2 - (${2 * botH} \\div 2)^2 = ${r * r - botH * botH}`,
          `d_2 = ${botD}`,
          sameSide
            ? `x = ${Math.max(topD, botD)} - ${Math.min(topD, botD)} = ${gap}`
            : `x = ${topD} + ${botD} = ${gap}`,
        ].join(NL),
        visualization: {
          type: 'circle-parallel-chords',
          r: `${r} cm`,
          chord1: `${2 * topH} cm`,
          chord2: `${2 * botH} cm`,
          gap: 'x',
          unknown: 'gap',
          sameSide,
        },
        metadata: { topic: 'chord-perpendicular-bisector', difficulty },
      };
    }
  }

  const r = _.sample(HYPS);
  const [p, q] = _.sample(TRIPLES.get(r));
  // Either leg can play the half-chord; the other is the distance.
  const [h, d] = _.random(0, 1) ? [p, q] : [q, p];
  const chord = 2 * h;

  if (difficulty === 'foundation') {
    return {
      instruction: 'Find the length of the chord AB',
      answer: String(chord),
      answerUnits: 'cm',
      workingOut: [
        `AM^2 = ${r}^2 - ${d}^2 = ${r * r - d * d}`,
        `AM = ${h}`,
        `AB = 2 \\times ${h} = ${chord}`,
      ].join(NL),
      visualization: {
        type: 'circle-chord',
        r: `${r} cm`,
        d: `${d} cm`,
        chord: 'x',
        unknown: 'chord',
      },
      metadata: { topic: 'chord-perpendicular-bisector', difficulty },
    };
  }

  // core
  return {
    instruction: 'Find the distance from the centre to the chord AB',
    answer: String(d),
    answerUnits: 'cm',
    workingOut: [
      `AM = ${chord} \\div 2 = ${h}`,
      `OM^2 = ${r}^2 - ${h}^2 = ${r * r - h * h}`,
      `OM = ${d}`,
    ].join(NL),
    visualization: {
      type: 'circle-chord',
      r: `${r} cm`,
      chord: `${chord} cm`,
      d: 'x',
      unknown: 'd',
    },
    metadata: { topic: 'chord-perpendicular-bisector', difficulty },
  };
};

/* ------------------------------------------------------------------ *
 * The tangent is perpendicular to the radius at the point of contact
 *
 * Foundation  r and OP given      find the tangent PA   (subtract)
 * Core        r and PA given      find OP               (add)
 * Stretch     OP and PA given     find the circumference, exact in π
 *
 * The right angle at A is never marked: recalling it from "PA is a tangent"
 * is the theorem being tested, the same convention circle-semicircle uses.
 * ------------------------------------------------------------------ */

export const generateTangentLength = (options = {}) => {
  const { difficulty = 'core' } = options;

  const op = _.sample(HYPS);
  const [p, q] = _.sample(TRIPLES.get(op));
  const [r, tangent] = _.random(0, 1) ? [p, q] : [q, p];
  const rotate = _.sample([0, 90, 180, 270]);

  const base = {
    type: 'circle-tangent-kite',
    lengths: true,
    single: true,
    op: true,
    rotate,
  };

  if (difficulty === 'foundation') {
    return {
      instruction: 'PA is a tangent to the circle, centre O. Find the length of PA',
      answer: String(tangent),
      answerUnits: 'cm',
      workingOut: [
        `PA^2 = ${op}^2 - ${r}^2 = ${op * op - r * r}`,
        `PA = ${tangent}`,
      ].join(NL),
      visualization: {
        ...base, radius: `${r} cm`, opLabel: `${op} cm`, tangent: 'x', unknown: 'tangent',
      },
      metadata: { topic: 'tangent-length', difficulty },
    };
  }

  if (difficulty === 'core') {
    return {
      instruction: 'PA is a tangent to the circle, centre O. Find the length of OP',
      answer: String(op),
      answerUnits: 'cm',
      workingOut: [
        `OP^2 = ${r}^2 + ${tangent}^2 = ${r * r + tangent * tangent}`,
        `OP = ${op}`,
      ].join(NL),
      visualization: {
        ...base, radius: `${r} cm`, tangent: `${tangent} cm`, opLabel: 'x', unknown: 'opLabel',
      },
      metadata: { topic: 'tangent-length', difficulty },
    };
  }

  // stretch — the radius is withheld, so Pythagoras only gets you started.
  // The answer stays exact in π, which keeps the band calculator-free
  // (CLAUDE.md §4).
  return {
    instruction: 'PA is a tangent to the circle, centre O. Find the circumference of the circle. Leave your answer in terms of π',
    answer: `${2 * r}\\pi`,
    answerUnits: 'cm',
    workingOut: [
      `r^2 = ${op}^2 - ${tangent}^2 = ${op * op - tangent * tangent}`,
      `r = ${r}`,
      `C = 2 \\times \\pi \\times ${r} = ${2 * r}\\pi`,
    ].join(NL),
    visualization: {
      ...base, opLabel: `${op} cm`, tangent: `${tangent} cm`, unknown: null,
    },
    metadata: { topic: 'tangent-length', difficulty },
  };
};
