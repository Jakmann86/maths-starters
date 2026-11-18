// src/generators/geometry/metricUnitsGenerators.js
//
// Metric units — Haese 9A (length), 9C (area units), 11B (volume units),
// 11C (capacity) and 11D (mass), and syllabus E6.1:
//
//   convert-units        length, mass and capacity: one step, then two
//                        steps, then a problem needing a conversion first
//   convert-area-volume  area units, then volume units and capacity, then
//                        an area or a tank's capacity from sides in
//                        different units
//
// Every amount is made as a whole number of the smallest unit in play and
// divided down, so no conversion is a floating-point accident.

import _ from 'lodash';

const NL = '\n';
const num = (v) => String(Number(v.toFixed(6)));
// v has at most dp decimal places.
const places = (v, dp) => Math.abs(v * 10 ** dp - Math.round(v * 10 ** dp)) < 1e-9;
const u = (unit) => `\\text{ ${unit}}`;
const amount = (v, unit) => `${num(v)}${u(unit)}`;
// "An 8 kg sack", "An 11.5 m plank": said eight, eleven, eighteen.
const an = (v) => (/^(8|11|18)(\.|$)/.test(num(v)) ? 'An' : 'A');

/* -------------------------------------------------------- convert-units */
//
//   foundation  one step: × or ÷ by 10, 100 or 1000
//   core        two steps, through the unit between: m to mm, km to cm,
//               tonnes to g
//   stretch     how many pieces, glasses or bags: convert, then divide

// [small, large, small units in one large]
const ONE_STEP = [
  ['mm', 'cm', 10], ['cm', 'm', 100], ['m', 'km', 1000],
  ['g', 'kg', 1000], ['kg', 'tonnes', 1000], ['ml', 'litres', 1000],
];
// [small, middle, large, small in one middle, middle in one large]
const TWO_STEP = [
  ['mm', 'cm', 'm', 10, 100],
  ['cm', 'm', 'km', 100, 1000],
  ['g', 'kg', 'tonnes', 1000, 1000],
];
const one = (unit) => ({ litres: 'litre', tonnes: 'tonne' }[unit] ?? unit);
const rule = (large, per, small) => `1${u(one(large))} = ${per}${u(small)}`;

export const generateConvertUnits = (options = {}) => {
  const { difficulty = 'core' } = options;
  const metadata = { topic: 'convert-units', difficulty };
  const instruction = 'Convert';
  const down = _.random(0, 1) === 1; // to the smaller unit

  for (;;) {
    if (difficulty === 'foundation') {
      const [small, large, per] = _.sample(ONE_STEP);
      const S = _.random(2, 999) * _.sample([1, 10, 10, 100]);
      const L = S / per;
      if (!places(L, 2) || L < 0.1 || L === 1 || S > 20000) continue;
      const [from, fu, to, tu] = down ? [L, large, S, small] : [S, small, L, large];
      return {
        instruction,
        questionMath: `${amount(from, fu)} \\to \\text{${tu}}`,
        answer: num(to), answerUnits: tu,
        workingOut: [rule(large, per, small), `${num(from)} ${down ? '\\times' : '\\div'} ${per} = ${num(to)}`].join(NL),
        metadata,
      };
    }

    if (difficulty === 'core') {
      const [small, mid, large, p1, p2] = _.sample(TWO_STEP);
      const S = _.random(2, 999) * 10 ** _.random(0, 3);
      const L = S / (p1 * p2);
      if (!places(L, 3) || L < 0.01 || L === 1 || S > 999999) continue;
      const rules = `${rule(large, p2, mid)}, \\ ${rule(mid, p1, small)}`;
      const calc = down
        ? `${num(L)} \\times ${p2} \\times ${p1} = ${num(S)}`
        : `${num(S)} \\div ${p1} \\div ${p2} = ${num(L)}`;
      return {
        instruction,
        questionMath: down ? `${amount(L, large)} \\to \\text{${small}}` : `${amount(S, small)} \\to \\text{${large}}`,
        answer: num(down ? S : L), answerUnits: down ? small : large,
        workingOut: [rules, calc].join(NL),
        metadata,
      };
    }

    // stretch: a whole number of pieces from a total in the larger unit.
    const kind = _.sample(['length', 'capacity', 'mass']);
    if (kind === 'length') {
      const piece = _.random(1, 20) * 5; // cm
      const count = _.random(4, 40);
      const cm = piece * count;
      const m = cm / 100;
      if (!places(m, 1) || m > 15) continue;
      return {
        instruction: 'Find how many',
        questionText: `${an(m)} ${num(m)} m plank of wood is cut into ${piece} cm pieces. How many pieces are there?`,
        answer: String(count), answerUnits: 'pieces',
        workingOut: [`${amount(m, 'm')} = ${amount(cm, 'cm')}`, `${cm} \\div ${piece} = ${count}`].join(NL),
        metadata,
      };
    }
    if (kind === 'capacity') {
      const glass = _.sample([100, 125, 150, 200, 250, 300, 330, 400, 500]); // ml
      const count = _.random(4, 40);
      const ml = glass * count;
      const l = ml / 1000;
      if (!places(l, 2) || l > 10 || l === 1) continue;
      return {
        instruction: 'Find how many',
        questionText: `A jug holds ${num(l)} litres of water. How many ${glass} ml glasses can it fill?`,
        answer: String(count), answerUnits: 'glasses',
        workingOut: [`${amount(l, 'litres')} = ${amount(ml, 'ml')}`, `${ml} \\div ${glass} = ${count}`].join(NL),
        metadata,
      };
    }
    const bag = _.random(2, 10) * 50; // g
    const count = _.random(4, 40);
    const g = bag * count;
    const kg = g / 1000;
    if (!places(kg, 1) || kg > 20 || kg === 1) continue;
    return {
      instruction: 'Find how many',
      questionText: `${an(kg)} ${num(kg)} kg sack of rice is packed into ${bag} g bags. How many bags are there?`,
      answer: String(count), answerUnits: 'bags',
      workingOut: [`${amount(kg, 'kg')} = ${amount(g, 'g')}`, `${g} \\div ${bag} = ${count}`].join(NL),
      metadata,
    };
  }
};

/* -------------------------------------------------- convert-area-volume */
//
//   foundation  area units: the length factor, squared
//   core        volume units (the length factor, cubed), or volume and
//               capacity: 1 litre = 1000 cm³, 1 m³ = 1000 litres
//   stretch     a rectangle's area, or a tank's capacity in litres, from
//               sides given in different units

// [small, large, length factor]
const AREA = [['mm', 'cm', 10], ['cm', 'm', 100], ['m', 'km', 1000]];
const VOLUME = [['mm', 'cm', 10], ['cm', 'm', 100]];
const sq = (unit) => `\\text{${unit}}^2`;
const cu = (unit) => `\\text{${unit}}^3`;

export const generateConvertAreaVolume = (options = {}) => {
  const { difficulty = 'core' } = options;
  const metadata = { topic: 'convert-area-volume', difficulty };
  const down = _.random(0, 1) === 1;
  const pick = _.random(0, 1);

  for (;;) {
    if (difficulty === 'foundation' || (difficulty === 'core' && pick === 0)) {
      const area = difficulty === 'foundation';
      const [small, large, f] = _.sample(area ? AREA : VOLUME);
      const power = area ? 2 : 3;
      const per = f ** power;
      const S = _.random(2, 999) * 10 ** _.random(0, power === 2 ? 4 : 5);
      const L = S / per;
      if (!places(L, 3) || L < 0.01 || L === 1 || S > (area ? 500000 : 5000000)) continue;
      const mark = area ? sq : cu;
      const factors = Array(power).fill(f).join(' \\times ');
      return {
        instruction: 'Convert',
        questionMath: down ? `${num(L)}\\ ${mark(large)} \\to ${mark(small)}` : `${num(S)}\\ ${mark(small)} \\to ${mark(large)}`,
        answer: num(down ? S : L), answerUnits: mark(down ? small : large),
        workingOut: [
          `1\\ ${mark(large)} = ${factors} = ${per}\\ ${mark(small)}`,
          down ? `${num(L)} \\times ${per} = ${num(S)}` : `${num(S)} \\div ${per} = ${num(L)}`,
        ].join(NL),
        metadata,
      };
    }

    if (difficulty === 'core') {
      // Volume and capacity: cm³ and litres, or m³ and litres.
      const metres = _.random(0, 1) === 1;
      const S = _.random(2, 999) * 10 ** _.random(0, 3); // cm³, or litres
      const L = S / 1000; // litres, or m³
      if (!places(L, 3) || L < 0.01 || L === 1 || S > 999999) continue;
      const [small, large] = metres ? ['\\text{litres}', cu('m')] : [cu('cm'), '\\text{litres}'];
      const ruleLine = metres ? `1\\ ${cu('m')} = 1000\\text{ litres}` : `1\\text{ litre} = 1000\\ ${cu('cm')}`;
      return {
        instruction: 'Convert',
        questionMath: down ? `${num(L)}\\ ${large} \\to ${small}` : `${num(S)}\\ ${small} \\to ${large}`,
        answer: num(down ? S : L), answerUnits: down ? small : large,
        workingOut: [ruleLine, down ? `${num(L)} \\times 1000 = ${num(S)}` : `${num(S)} \\div 1000 = ${num(L)}`].join(NL),
        metadata,
      };
    }

    // stretch
    if (pick === 0) {
      // A rectangle, one side in metres and one in centimetres, its area
      // in square centimetres.
      const a = _.random(2, 40) * 5; // cm, given in metres
      const b = _.random(2, 90); // cm
      const m = a / 100;
      if (a === b || !places(m, 2)) continue;
      const area = a * b;
      const [l, w] = _.shuffle([`${num(m)} m`, `${b} cm`]);
      return {
        instruction: 'Find the area of the rectangle, in square centimetres',
        answer: String(area), answerUnits: sq('cm'),
        workingOut: [`${amount(m, 'm')} = ${amount(a, 'cm')}`, `A = ${a} \\times ${b} = ${area}`].join(NL),
        visualization: { type: 'rectangle', l, w },
        metadata,
      };
    }
    // A tank: two edges in centimetres, one in metres; its capacity in
    // litres.
    const inM = _.random(2, 30) * 10; // cm, given in metres
    const [p, q] = [_.random(2, 18) * 5, _.random(2, 18) * 5];
    const cm3 = inM * p * q;
    const litres = cm3 / 1000;
    if (!places(litres, 1)) continue;
    const m = inM / 100;
    const edges = _.shuffle([`${num(m)} m`, `${p} cm`, `${q} cm`]);
    return {
      instruction: 'Find how many litres the tank holds',
      answer: num(litres), answerUnits: 'litres',
      workingOut: [
        `${amount(m, 'm')} = ${amount(inM, 'cm')}`,
        `V = ${inM} \\times ${p} \\times ${q} = ${cm3}\\ ${cu('cm')}`,
        `${cm3} \\div 1000 = ${num(litres)}`,
      ].join(NL),
      visualization: { type: 'cuboid', l: edges[0], d: edges[1], h: edges[2] },
      metadata,
    };
  }
};
