// src/generators/geometry/compoundSolidGenerators.js
//
// Compound solids — Haese 11E: two solids joined, or one taken out of
// another, found part by part (Example 14: a cone on a cylinder, its surface
// area and its volume; Example 15: a tank whose walls are a hollow
// cylinder). All drawn on Figure.jsx's 'compound-solid'.
//
//   compound-volume
//     Foundation  a narrow cylinder on a wide one: one formula, used twice
//     Core        two different formulas: a cone or a hemisphere on a
//                 cylinder, or a hemisphere on a cone (an ice cream)
//     Stretch     a part taken away: a hollow cylinder, from its two radii,
//                 or from its outer diameter and the thickness of its wall
//                 (Haese Example 15)
//
//   compound-surface-area (the whole outside of a solid object, base
//   included; the face where the two parts meet is inside, so not counted)
//     Foundation  a cone on a cylinder, the slant height given
//     Core        a hemisphere on a cylinder (Haese 11E Q1, the observatory):
//                 the dome is half a sphere, 2πr²
//     Stretch     a cone on a cylinder, the perpendicular height given, so
//                 the slant height comes first by Pythagoras (Example 14)
//
// Every band mixes the two answer forms at random, exact in π or to 3
// significant figures, and says which. An exact answer is a whole multiple
// of π: where a third (cone) or two thirds (hemisphere) would leave a
// fraction, the lengths are chosen so it does not.

import _ from 'lodash';
import { pythagoreanTriples } from '../shared';
import { mode, ask, closing, val } from './solidsGenerators';

const NL = '\n';
const UNITS = ['cm', 'm', 'mm'];
const lbl = (n, u) => `${n} ${u}`;
const piTerm = (n) => (n === 1 ? '\\pi' : `${n}\\pi`);

// Slant heights from Euclid's formula, never listed: the legs are the
// radius and the cone's height, in either order.
const TRIPLES = pythagoreanTriples(30).filter(([a, b]) => a <= 24 && b <= 24);

/** A whole number in [lo, hi] satisfying ok. */
const pickWhere = (lo, hi, ok) => { for (;;) { const n = _.random(lo, hi); if (ok(n)) return n; } };

/* ------------------------------------------------------------------ volume */

export const generateCompoundVolume = (options = {}) => {
  const { difficulty = 'core' } = options;
  const u = _.sample(UNITS);
  const m = mode();
  const meta = { topic: 'compound-volume', difficulty };
  const units = `\\text{${u}}^3`;

  if (difficulty === 'foundation') {
    const r = _.random(4, 12);
    const r2 = _.random(2, r - 2);
    const h = _.random(3, 15), h2 = _.random(3, 15);
    const [a, b] = [r * r * h, r2 * r2 * h2];
    return {
      instruction: ask('Find the volume of the solid', m),
      answer: val(a + b, m),
      answerUnits: units,
      workingOut: [
        'V = \\text{large cylinder} + \\text{small cylinder}',
        `V = \\pi \\times ${r}^2 \\times ${h} + \\pi \\times ${r2}^2 \\times ${h2}`,
        `V = ${piTerm(a)} + ${piTerm(b)}`,
        `V = ${piTerm(a + b)}${closing(a + b, m, 'V')}`,
      ].join(NL),
      visualization: { type: 'compound-solid', big: true, shape: 'cylinder-cylinder', r: lbl(r, u), h: lbl(h, u), r2: lbl(r2, u), h2: lbl(h2, u), unknown: null },
      metadata: meta,
    };
  }

  if (difficulty === 'core') {
    const shape = _.sample(['cylinder-cone', 'cylinder-hemisphere', 'cone-hemisphere']);
    // A hemisphere is (2/3)πr³: a whole multiple of π needs r a multiple of
    // 3. A cone is (1/3)πr²H: r²H a multiple of 3. Kept in both answer
    // forms, so every part is a whole multiple of π in the working too.
    const hemi = shape !== 'cylinder-cone';
    const r = pickWhere(2, 12, (n) => !hemi || n % 3 === 0);
    const hasCone = shape !== 'cylinder-hemisphere';
    const H = hasCone ? pickWhere(4, 18, (n) => (r * r * n) % 3 === 0) : null;
    const h = shape === 'cone-hemisphere' ? null : _.random(4, 18);
    const parts = [];
    if (h) parts.push({ name: 'cylinder', tex: `\\pi \\times ${r}^2 \\times ${h}`, k: r * r * h });
    if (hasCone) parts.push({ name: 'cone', tex: `\\frac{1}{3} \\times \\pi \\times ${r}^2 \\times ${H}`, k: (r * r * H) / 3 });
    if (hemi) parts.push({ name: 'hemisphere', tex: `\\frac{2}{3} \\times \\pi \\times ${r}^3`, k: (2 * r ** 3) / 3 });
    const k = _.sum(parts.map((p) => p.k));
    return {
      instruction: ask('Find the volume of the solid', m),
      answer: val(k, m),
      answerUnits: units,
      workingOut: [
        `V = ${parts.map((p) => `\\text{${p.name}}`).join(' + ')}`,
        `V = ${parts.map((p) => p.tex).join(' + ')}`,
        `V = ${parts.map((p) => piTerm(p.k)).join(' + ')}`,
        `V = ${piTerm(k)}${closing(k, m, 'V')}`,
      ].join(NL),
      visualization: {
        type: 'compound-solid', big: true, shape, r: lbl(r, u),
        ...(h ? { h: lbl(h, u) } : {}), ...(hasCone ? { coneH: lbl(H, u) } : {}), unknown: null,
      },
      metadata: meta,
    };
  }

  // Stretch: a hollow cylinder, the hole's volume taken away. Either both
  // radii are given, or the outer diameter and the wall's thickness, so the
  // inner radius has to be worked out first.
  const R = _.random(5, 16);
  const r = _.random(2, R - 2);
  const h = _.random(5, 30);
  const k = (R * R - r * r) * h;
  const fromWall = Math.random() < 0.5;
  const lead = fromWall ? [`R = ${2 * R} \\div 2 = ${R}, \\ r = ${R} - ${R - r} = ${r}`] : [];
  return {
    instruction: ask('Find the volume of the hollow cylinder', m),
    answer: val(k, m),
    answerUnits: units,
    workingOut: [
      ...lead,
      'V = \\text{outer cylinder} - \\text{hole}',
      `V = \\pi \\times ${R}^2 \\times ${h} - \\pi \\times ${r}^2 \\times ${h}`,
      `V = ${piTerm(R * R * h)} - ${piTerm(r * r * h)}`,
      `V = ${piTerm(k)}${closing(k, m, 'V')}`,
    ].join(NL),
    visualization: {
      type: 'compound-solid', big: true, shape: 'tube', h: lbl(h, u), unknown: null,
      ...(fromWall ? { diameter: lbl(2 * R, u), thickness: lbl(R - r, u) } : { r: lbl(R, u), inner: lbl(r, u) }),
    },
    metadata: meta,
  };
};

/* ------------------------------------------------------------ surface area */

export const generateCompoundSurfaceArea = (options = {}) => {
  const { difficulty = 'core' } = options;
  const u = _.sample(UNITS);
  const m = mode();
  const meta = { topic: 'compound-surface-area', difficulty };
  const units = `\\text{${u}}^2`;

  if (difficulty === 'core') {
    const r = _.random(2, 18);
    const h = _.random(3, 25);
    const [dome, side, base] = [2 * r * r, 2 * r * h, r * r];
    const k = dome + side + base;
    return {
      instruction: ask('Find the total surface area of the solid', m),
      answer: val(k, m),
      answerUnits: units,
      workingOut: [
        'A = \\text{hemisphere} + \\text{curved side} + \\text{base}',
        `A = 2 \\times \\pi \\times ${r}^2 + 2 \\times \\pi \\times ${r} \\times ${h} + \\pi \\times ${r}^2`,
        `A = ${piTerm(dome)} + ${piTerm(side)} + ${piTerm(base)}`,
        `A = ${piTerm(k)}${closing(k, m, 'A')}`,
      ].join(NL),
      visualization: { type: 'compound-solid', big: true, shape: 'cylinder-hemisphere', r: lbl(r, u), h: lbl(h, u), unknown: null },
      metadata: meta,
    };
  }

  // A cone on a cylinder. Foundation gives the slant height; Stretch gives
  // the perpendicular height, and the slant comes from Pythagoras.
  const [a, b, l] = _.sample(TRIPLES);
  const [r, H] = Math.random() < 0.5 ? [a, b] : [b, a];
  const h = _.random(3, 20);
  const [cone, side, base] = [r * l, 2 * r * h, r * r];
  const k = cone + side + base;
  const stretch = difficulty === 'stretch';
  return {
    instruction: ask('Find the total surface area of the solid', m),
    answer: val(k, m),
    answerUnits: units,
    workingOut: [
      ...(stretch ? [`l^2 = ${r}^2 + ${H}^2 = ${l * l}, \\ l = ${l}`] : []),
      'A = \\text{cone} + \\text{curved side} + \\text{base}',
      `A = \\pi \\times ${r} \\times ${l} + 2 \\times \\pi \\times ${r} \\times ${h} + \\pi \\times ${r}^2`,
      `A = ${piTerm(cone)} + ${piTerm(side)} + ${piTerm(base)}`,
      `A = ${piTerm(k)}${closing(k, m, 'A')}`,
    ].join(NL),
    visualization: {
      type: 'compound-solid', big: true, shape: 'cylinder-cone', r: lbl(r, u), h: lbl(h, u), unknown: null,
      ...(stretch ? { coneH: lbl(H, u) } : { slant: lbl(l, u) }),
    },
    metadata: meta,
  };
};
