// src/generators/geometry/sectorGenerators.js
//
// Arcs and sectors — Haese 9D, Rayner 4.3, syllabus E6.3b:
//
//   arc-length   (Perimeter) the arc, then the perimeter of the sector,
//                then the angle or the radius from a given arc
//   sector-area  (Area) the sector, then the major sector left when the
//                minor angle is given, then the angle or the radius from a
//                given area
//
// Every band mixes the two answer forms at random, exact in π or to 3
// significant figures (CLAUDE.md §4). Angles and radii are chosen so the
// multiple of π is whole. Foundation angles are factors of 360, the Core
// syllabus's limit; the figure draws every angle true.

import _ from 'lodash';
import { EXACT, mode, ask, closing, val, sf } from './solidsGenerators';

const NL = '\n';
const UNITS = ['cm', 'm', 'mm'];
const piTerm = (n) => (n === 1 ? '\\pi' : `${n}\\pi`);
const deg = (t) => `${t}^\\circ`;
// Factors of 360 the figure can draw true.
const FACTORS = [30, 36, 40, 45, 60, 72, 90, 120];
// Any multiple of 5 the figure can draw true.
const FIVES = _.range(25, 161, 5);
const fig = (angle, extra) => ({ type: 'sector', angle, angleLabel: deg(angle), big: true, ...extra });

/* ------------------------------------------------------------ arc-length */

export const generateArcLength = (options = {}) => {
  const { difficulty = 'core' } = options;
  const metadata = { topic: 'arc-length', difficulty };
  const u = _.sample(UNITS);
  const m = mode();

  for (;;) {
    const t = _.sample(difficulty === 'foundation' ? FACTORS : FIVES);
    const r = _.random(2, 30);
    // l = t/360 × 2πr = (t r / 180) π: whole only when 180 divides t r.
    if ((t * r) % 180 !== 0) continue;
    const k = (t * r) / 180;
    const arc = [`l = \\frac{${t}}{360} \\times 2\\pi \\times ${r}`, `l = ${piTerm(k)}`];

    if (difficulty === 'foundation') {
      return {
        instruction: ask('Find the length of the arc', m),
        answer: val(k, m), answerUnits: `\\text{${u}}`,
        workingOut: [`l = \\frac{\\theta}{360} \\times 2\\pi r`, ...arc].join(NL) + closing(k, m, 'l'),
        visualization: fig(t, { r: `${r} ${u}`, unknown: 'arc' }),
        metadata,
      };
    }

    if (difficulty === 'core') {
      // The perimeter: the arc and both radii.
      const exact = `${piTerm(k)} + ${2 * r}`;
      return {
        instruction: ask('Find the perimeter of the sector', m),
        answer: m === EXACT ? exact : sf(k * Math.PI + 2 * r), answerUnits: `\\text{${u}}`,
        workingOut: [
          ...arc,
          `P = ${piTerm(k)} + 2 \\times ${r}`,
          `P = ${exact}`,
          ...(m === EXACT ? [] : [`P = ${sf(k * Math.PI + 2 * r)} \\text{ (3 s.f.)}`]),
        ].join(NL),
        visualization: fig(t, { r: `${r} ${u}`, unknown: null }),
        metadata,
      };
    }

    // stretch: the arc given, exactly, so the angle or the radius comes out
    // whole. A reverse question: the arc is not a length on the figure.
    const questionMath = `l = ${piTerm(k)}\\text{ ${u}}`;
    if (_.random(0, 1) === 0) {
      return {
        instruction: 'Find the angle θ',
        questionMath,
        answer: `\\theta = ${deg(t)}`,
        workingOut: [
          `\\frac{\\theta}{360} \\times 2\\pi \\times ${r} = ${piTerm(k)}`,
          `\\theta = \\frac{${k} \\times 360}{${2 * r}}`,
          `\\theta = ${deg(t)}`,
        ].join(NL),
        visualization: { ...fig(t, { r: `${r} ${u}`, unknown: 'angle', hug: true }), angleLabel: 'θ' },
        metadata,
      };
    }
    return {
      instruction: 'Find the radius r',
      questionMath,
      answer: `r = ${r}`, answerUnits: `\\text{${u}}`,
      workingOut: [
        `\\frac{${t}}{360} \\times 2\\pi r = ${piTerm(k)}`,
        `r = \\frac{${k} \\times 360}{2 \\times ${t}}`,
        `r = ${r}`,
      ].join(NL),
      visualization: fig(t, { r: 'r', unknown: 'r', hug: true }),
      metadata,
    };
  }
};

/* ----------------------------------------------------------- sector-area */

export const generateSectorArea = (options = {}) => {
  const { difficulty = 'core' } = options;
  const metadata = { topic: 'sector-area', difficulty };
  const u = _.sample(UNITS);
  const m = mode();

  for (;;) {
    const t = _.sample(difficulty === 'foundation' ? FACTORS : FIVES);
    const r = _.random(2, 20);
    // The angle the area is taken over: the major one in Core.
    const over = difficulty === 'core' ? 360 - t : t;
    // A = over/360 × πr²: whole only when 360 divides over × r².
    if ((over * r * r) % 360 !== 0) continue;
    const k = (over * r * r) / 360;

    if (difficulty === 'foundation') {
      return {
        instruction: ask('Find the area of the sector', m),
        answer: val(k, m), answerUnits: `\\text{${u}}^2`,
        workingOut: [
          `A = \\frac{\\theta}{360} \\times \\pi r^2`,
          `A = \\frac{${t}}{360} \\times \\pi \\times ${r}^2`,
          `A = ${piTerm(k)}`,
        ].join(NL) + closing(k, m, 'A'),
        visualization: fig(t, { r: `${r} ${u}`, unknown: 'area' }),
        metadata,
      };
    }

    if (difficulty === 'core') {
      return {
        instruction: ask('Find the area of the shaded sector', m),
        answer: val(k, m), answerUnits: `\\text{${u}}^2`,
        workingOut: [
          `360 - ${t} = ${over}`,
          `A = \\frac{${over}}{360} \\times \\pi \\times ${r}^2`,
          `A = ${piTerm(k)}`,
        ].join(NL) + closing(k, m, 'A'),
        visualization: fig(t, { r: `${r} ${u}`, major: true }),
        metadata,
      };
    }

    // stretch: the area given exactly; the angle or the radius from it.
    const questionMath = `A = ${piTerm(k)}\\text{ ${u}}^2`;
    if (_.random(0, 1) === 0) {
      return {
        instruction: 'Find the angle θ',
        questionMath,
        answer: `\\theta = ${deg(t)}`,
        workingOut: [
          `\\frac{\\theta}{360} \\times \\pi \\times ${r}^2 = ${piTerm(k)}`,
          `\\theta = \\frac{${k} \\times 360}{${r * r}}`,
          `\\theta = ${deg(t)}`,
        ].join(NL),
        visualization: { ...fig(t, { r: `${r} ${u}`, unknown: 'angle', hug: true }), angleLabel: 'θ' },
        metadata,
      };
    }
    return {
      instruction: 'Find the radius r',
      questionMath,
      answer: `r = ${r}`, answerUnits: `\\text{${u}}`,
      workingOut: [
        `\\frac{${t}}{360} \\times \\pi r^2 = ${piTerm(k)}`,
        `r^2 = \\frac{${k} \\times 360}{${t}} = ${r * r}`,
        `r = ${r}`,
      ].join(NL),
      visualization: fig(t, { r: 'r', unknown: 'r', hug: true }),
      metadata,
    };
  }
};
