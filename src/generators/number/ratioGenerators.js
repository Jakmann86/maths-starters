// src/generators/number/ratioGenerators.js
//
// Ratio and proportion — Haese Assumed Knowledge (Number) F, and syllabus
// E1.10. With direct and inverse variation (Haese 30A-B) these make the
// topic Ratio and proportion:
//
//   ratio-simplify    a ratio in its simplest form: whole numbers, then
//                     quantities in different units, then decimals and
//                     fractions
//   ratio-proportion  a recipe scaled by a whole number, then by the
//                     unitary method, then which of two packs is better value
//   ratio-share       a total shared in a ratio, then from one share, then
//                     from the difference between two shares
//   map-scale         a map distance to a real one, a real one to the map,
//                     then the scale itself from the two
//
// Names, items and contexts are phrasing, not a question bank: every number
// is generated. Money is in whole pence, so no price is a floating-point
// accident.

import _ from 'lodash';
import { gcd, lcm } from '../shared';
import { pounds } from './moneyGenerators';

const NL = '\n';
const num = (v) => String(Number(v.toFixed(6)));
const NAMES = ['Ana', 'Ben', 'Sam', 'Priya', 'Leo', 'Mia', 'Kofi', 'Tom', 'Zara', 'Omar'];
const money = (pence) => `\\text{${pounds(pence)}}`;
const listed = (xs) => (xs.length === 2 ? `${xs[0]} \\text{ and } ${xs[1]}` : `${xs.slice(0, -1).join(', ')} \\text{ and } ${xs.at(-1)}`);
const ratio = (xs) => xs.join(' : ');
const coprimeTo = (ns) => ns.reduce((g, n) => gcd(g, n));

/** A ratio in simplest form: parts from 1 to max, not all equal. */
function simplest(parts, max) {
  for (;;) {
    const xs = Array.from({ length: parts }, () => _.random(1, max));
    if (coprimeTo(xs) === 1 && new Set(xs).size === parts) return xs;
  }
}

/* ------------------------------------------------------- ratio-simplify */
//
//   foundation  whole numbers with a common factor, two or three parts
//   core        two quantities in different units: the same units first
//   stretch     decimals (multiply by 10 first) or fractions (multiply by
//               the lowest common denominator first)

// [small unit, large unit, how many small in one large, large unit when 1]
const UNIT_PAIRS = [
  ['cm', 'm', 100, 'm'],
  ['mm', 'cm', 10, 'cm'],
  ['m', 'km', 1000, 'km'],
  ['g', 'kg', 1000, 'kg'],
  ['ml', 'litres', 1000, 'litre'],
  ['minutes', 'hours', 60, 'hour'],
];
const qty = (v, unit, one) => `${num(v)}\\text{ ${v === 1 && one ? one : unit}}`;

export const generateRatioSimplify = (options = {}) => {
  const { difficulty = 'core' } = options;
  const metadata = { topic: 'ratio-simplify', difficulty };
  const instruction = 'Write the ratio in its simplest form';
  const pick = _.random(0, 1);

  for (;;) {
    if (difficulty === 'foundation') {
      const parts = pick ? 3 : 2;
      const xs = simplest(parts, parts === 2 ? 12 : 9);
      const k = _.random(2, parts === 2 ? 12 : 8);
      const given = xs.map((x) => x * k);
      if (Math.max(...given) > 120) continue;
      return {
        instruction,
        questionMath: ratio(given),
        answer: ratio(xs),
        workingOut: [`\\text{divide each part by } ${k}`, `= ${ratio(xs)}`].join(NL),
        metadata,
      };
    }

    if (difficulty === 'core') {
      const [small, large, per, one] = _.sample(UNIT_PAIRS);
      const xs = simplest(2, 10);
      const k = _.random(2, 60);
      // One quantity in each unit; which comes first is drawn.
      const [a, b] = xs.map((x) => x * k);
      const bigFirst = _.random(0, 1) === 1;
      const inLarge = (bigFirst ? a : b) / per;
      // The large-unit quantity as a whole number or one decimal place,
      // and never smaller than a tenth of its unit.
      if (Math.abs(inLarge * 10 - Math.round(inLarge * 10)) > 1e-9 || inLarge < 0.5) continue;
      // Hours whole or a half: 4.2 hours is not a time anyone gives.
      if (large === 'hours' && !Number.isInteger(inLarge * 2)) continue;
      if (Math.max(a, b) > 3000) continue;
      const shown = bigFirst
        ? [qty(inLarge, large, one), qty(b, small)]
        : [qty(a, small), qty(inLarge, large, one)];
      const g = gcd(a, b);
      return {
        instruction,
        questionMath: shown.join(' : '),
        answer: ratio(xs),
        workingOut: [
          `${qty(inLarge, large, one)} = ${qty(inLarge * per, small)}`,
          `= ${a} : ${b}`,
          `\\text{divide each part by } ${g}`,
          `= ${ratio(xs)}`,
        ].join(NL),
        metadata,
      };
    }

    // stretch
    if (pick === 0) {
      // Decimals: at least one part with one decimal place.
      const xs = simplest(2, 12);
      const k = _.sample([1, 1, 2, 3, 5]);
      const tens = xs.map((x) => x * k);
      if (tens.every((t) => t % 10 === 0) || Math.max(...tens) > 120) continue;
      const given = tens.map((t) => num(t / 10));
      const work = [`\\text{multiply each part by } 10`, `= ${ratio(tens)}`];
      if (k > 1) work.push(`\\text{divide each part by } ${k}`, `= ${ratio(xs)}`);
      return { instruction, questionMath: ratio(given), answer: ratio(xs), workingOut: work.join(NL), metadata };
    }
    // Fractions: two in lowest terms, with different denominators.
    const [d1, d2] = _.sampleSize([2, 3, 4, 5, 6, 8, 10], 2);
    const n1 = _.random(1, d1 - 1), n2 = _.random(1, d2 - 1);
    if (gcd(n1, d1) !== 1 || gcd(n2, d2) !== 1) continue;
    const L = lcm(d1, d2);
    const whole = [n1 * L / d1, n2 * L / d2];
    const g = gcd(...whole);
    const xs = whole.map((w) => w / g);
    if (xs[0] === xs[1]) continue;
    const work = [`\\text{multiply each part by } ${L}`, `= ${ratio(whole)}`];
    if (g > 1) work.push(`\\text{divide each part by } ${g}`, `= ${ratio(xs)}`);
    return {
      instruction,
      questionMath: `\\frac{${n1}}{${d1}} : \\frac{${n2}}{${d2}}`,
      answer: ratio(xs),
      workingOut: work.join(NL),
      metadata,
    };
  }
};

/* ----------------------------------------------------- ratio-proportion */
//
//   foundation  a recipe for n people, scaled up or down by a whole number
//   core        the unitary method: a recipe or a price, through one
//   stretch     which of two packs is the better value, per 100 g or ml

const INGREDIENTS = [['flour', 'g'], ['sugar', 'g'], ['butter', 'g'], ['rice', 'g'], ['milk', 'ml'], ['stock', 'ml']];
const people = (n) => `${n} ${n === 1 ? 'person' : 'people'}`;
const ITEMS = [['pens', 'pen'], ['notebooks', 'notebook'], ['bus tickets', 'bus ticket'], ['apples', 'apple'], ['batteries', 'battery']];
// "An 800 g bag", "A 750 g bag".
const an = (v) => (String(v).startsWith('8') ? 'An' : 'A');
const PACKS = [['cereal', 'box', 'g'], ['rice', 'bag', 'g'], ['coffee', 'jar', 'g'], ['juice', 'carton', 'ml'], ['shampoo', 'bottle', 'ml'], ['washing-up liquid', 'bottle', 'ml']];

export const generateRatioProportion = (options = {}) => {
  const { difficulty = 'core' } = options;
  const metadata = { topic: 'ratio-proportion', difficulty };
  const pick = _.random(0, 1);

  for (;;) {
    if (difficulty === 'foundation') {
      const [food, unit] = _.sample(INGREDIENTS);
      const n = _.random(2, 6);
      const f = _.random(2, 4);
      const up = pick === 0;
      const [from, to] = up ? [n, n * f] : [n * f, n];
      const amount = _.random(2, 40) * (up ? 10 : 10 * f);
      const result = up ? amount * f : amount / f;
      if (result > 2000) continue;
      return {
        instruction: 'Find the amount needed',
        questionText: `A recipe for ${people(from)} uses ${amount} ${unit} of ${food}. How much ${food} is needed for ${people(to)}?`,
        answer: String(result), answerUnits: unit,
        workingOut: [
          `${Math.max(from, to)} \\div ${Math.min(from, to)} = ${f}`,
          `${amount} ${up ? '\\times' : '\\div'} ${f} = ${result}`,
        ].join(NL),
        metadata,
      };
    }

    if (difficulty === 'core') {
      const n = _.random(2, 9), m = _.random(2, 12);
      // Neither a whole multiple of the other: that is Foundation.
      if (n === m || m % n === 0 || n % m === 0) continue;
      if (pick === 0) {
        const [food, unit] = _.sample(INGREDIENTS);
        const each = _.random(1, 30) * 5;
        return {
          instruction: 'Find the amount needed',
          questionText: `A recipe for ${people(n)} uses ${each * n} ${unit} of ${food}. How much ${food} is needed for ${people(m)}?`,
          answer: String(each * m), answerUnits: unit,
          workingOut: [`${each * n} \\div ${n} = ${each}`, `${each} \\times ${m} = ${each * m}`].join(NL),
          metadata,
        };
      }
      const [plural] = _.sample(ITEMS);
      const each = _.random(4, 120) * 5; // pence
      return {
        instruction: 'Find the cost',
        questionText: `${n} ${plural} cost ${pounds(each * n)}. Find the cost of ${m} ${plural}.`,
        answer: money(each * m),
        workingOut: [`${each * n} \\div ${n} = ${each}\\text{p}`, `${each} \\times ${m} = ${each * m}\\text{p}`, `= ${money(each * m)}`].join(NL),
        metadata,
      };
    }

    // stretch: price per 100 g (or ml) for each pack, in whole pence.
    const [item, pack, unit] = _.sample(PACKS);
    const [s1, s2] = _.sampleSize([200, 250, 300, 400, 500, 600, 750, 800, 1000], 2).sort((a, b) => a - b);
    const r1 = _.random(10, 90) * 2, r2 = _.random(10, 90) * 2;
    // Close enough that it takes the working to tell: within a quarter.
    if (Math.abs(r1 - r2) < 4 || Math.abs(r1 - r2) > Math.min(r1, r2) / 4) continue;
    // The bigger pack is the better value as often as not.
    if ((r2 < r1) !== (pick === 0)) continue;
    const p1 = r1 * s1 / 100, p2 = r2 * s2 / 100;
    const better = r1 < r2 ? s1 : s2;
    const line = (s, p, r) => `${p} \\div ${num(s / 100)} = ${r}\\text{p per 100 ${unit}}`;
    return {
      instruction: 'Find the better value',
      questionText: `${an(s1)} ${s1} ${unit} ${pack} of ${item} costs ${pounds(p1)}. ${an(s2)} ${s2} ${unit} ${pack} costs ${pounds(p2)}. Which is the better value?`,
      answer: `\\text{the ${better} ${unit} ${pack}}`,
      workingOut: [line(s1, p1, r1), line(s2, p2, r2), `\\text{the ${better} ${unit} ${pack}}`].join(NL),
      metadata,
    };
  }
};

/* ---------------------------------------------------------- ratio-share */
//
//   foundation  share a total in a ratio of two or three parts
//   core        one share given: find the other, or the total
//   stretch     the difference between two shares given: find a share, or
//               the total

const MATERIALS = [['sand', 'kg'], ['paint', 'litres'], ['string', 'cm'], ['flour', 'g']];

export const generateRatioShare = (options = {}) => {
  const { difficulty = 'core' } = options;
  const metadata = { topic: 'ratio-share', difficulty };
  const pick = _.random(0, 1);

  for (;;) {
    if (difficulty === 'foundation') {
      const parts = pick ? 3 : 2;
      const xs = simplest(parts, parts === 2 ? 9 : 6);
      const sum = _.sum(xs);
      const unit = _.random(2, 30) * _.sample([1, 1, 5, 10]);
      const total = sum * unit;
      if (total > 1500) continue;
      const shares = xs.map((x) => x * unit);
      const asMoney = _.random(0, 1) === 1;
      const work = [
        `${xs.join(' + ')} = ${sum}\\text{ parts}`,
        `${total} \\div ${sum} = ${unit}`,
        ...xs.map((x, i) => `${x} \\times ${unit} = ${shares[i]}`),
      ];
      if (asMoney) {
        const answer = listed(shares.map((s) => money(s * 100)));
        return {
          instruction: 'Share in the ratio',
          questionText: `Share ${pounds(total * 100)} in the ratio ${ratio(xs)}.`,
          answer, workingOut: [...work, answer].join(NL), metadata,
        };
      }
      const [stuff, u] = _.sample(MATERIALS);
      const answer = listed(shares.map(String));
      return {
        instruction: 'Share in the ratio',
        questionText: `Share ${total} ${u} of ${stuff} in the ratio ${ratio(xs)}.`,
        answer, answerUnits: u, workingOut: [...work, answer].join(NL), metadata,
      };
    }

    const [A, B] = _.sampleSize(NAMES, 2);
    const findTotal = pick === 1;

    if (difficulty === 'core') {
      const xs = simplest(2, 9);
      const unit = _.random(2, 40);
      const [a, b] = xs.map((x) => x * unit);
      const told = `${A} and ${B} share some money in the ratio ${ratio(xs)}. ${A} gets ${pounds(a * 100)}.`;
      const one = `${a} \\div ${xs[0]} = ${unit}`;
      if (findTotal) {
        const t = (xs[0] + xs[1]) * unit;
        return {
          instruction: 'Find the total',
          questionText: `${told} How much did they share?`,
          answer: money(t * 100),
          workingOut: [one, `${xs[0] + xs[1]} \\times ${unit} = ${t}`, money(t * 100)].join(NL),
          metadata,
        };
      }
      return {
        instruction: `Find ${B}'s share`,
        questionText: `${told} How much does ${B} get?`,
        answer: money(b * 100),
        workingOut: [one, `${xs[1]} \\times ${unit} = ${b}`, money(b * 100)].join(NL),
        metadata,
      };
    }

    // stretch: the first share is the bigger, by a known amount.
    const xs = simplest(2, 9);
    if (xs[0] <= xs[1]) continue;
    const unit = _.random(2, 40);
    const diff = (xs[0] - xs[1]) * unit;
    const told = `${A} and ${B} share some money in the ratio ${ratio(xs)}. ${A} gets ${pounds(diff * 100)} more than ${B}.`;
    const one = [`${xs[0]} - ${xs[1]} = ${xs[0] - xs[1]}\\text{ part${xs[0] - xs[1] === 1 ? '' : 's'}}`, `${diff} \\div ${xs[0] - xs[1]} = ${unit}`];
    if (findTotal) {
      const t = (xs[0] + xs[1]) * unit;
      return {
        instruction: 'Find the total',
        questionText: `${told} How much did they share?`,
        answer: money(t * 100),
        workingOut: [...one, `${xs[0] + xs[1]} \\times ${unit} = ${t}`, money(t * 100)].join(NL),
        metadata,
      };
    }
    const b = xs[1] * unit;
    return {
      instruction: `Find ${B}'s share`,
      questionText: `${told} How much does ${B} get?`,
      answer: money(b * 100),
      workingOut: [...one, `${xs[1]} \\times ${unit} = ${b}`, money(b * 100)].join(NL),
      metadata,
    };
  }
};

/* ------------------------------------------------------------ map-scale */
//
//   foundation  a distance on the map to the real distance
//   core        a real distance to the distance on the map
//   stretch     the scale, as 1 : n, from a map distance and a real one
//
// Scales of 1 : 25000 and larger give real distances in metres; smaller
// ones in kilometres.

const SCALES = [2500, 5000, 10000, 20000, 25000, 40000, 50000, 100000, 200000, 250000, 500000, 1000000];
const realUnit = (n) => (n <= 25000 ? ['m', 100] : ['km', 100000]);

export const generateMapScale = (options = {}) => {
  const { difficulty = 'core' } = options;
  const metadata = { topic: 'map-scale', difficulty };

  for (;;) {
    const n = _.sample(SCALES);
    const [u, per] = realUnit(n);
    const map = _.random(2, 30) / 2; // cm, whole or half
    const cm = map * n;
    const real = cm / per;
    // Real distances to at most two decimal places.
    if (Math.abs(real * 100 - Math.round(real * 100)) > 1e-9) continue;
    const toReal = [`${num(map)} \\times ${n} = ${num(cm)}\\text{ cm}`, `${num(cm)} \\div ${per} = ${num(real)}`];

    if (difficulty === 'foundation') {
      return {
        instruction: 'Find the real distance',
        questionText: `A map has a scale of 1 : ${n}. Two villages are ${num(map)} cm apart on the map. How far apart are they in real life?`,
        answer: num(real), answerUnits: u,
        workingOut: toReal.join(NL),
        metadata,
      };
    }
    if (difficulty === 'core') {
      return {
        instruction: 'Find the distance on the map',
        questionText: `A map has a scale of 1 : ${n}. Two villages are ${num(real)} ${u} apart. How far apart are they on the map?`,
        answer: num(map), answerUnits: 'cm',
        workingOut: [`${num(real)} \\times ${per} = ${num(cm)}\\text{ cm}`, `${num(cm)} \\div ${n} = ${num(map)}`].join(NL),
        metadata,
      };
    }
    // stretch: a whole-centimetre map distance keeps the division clean.
    if (!Number.isInteger(map) || map === 1) continue;
    return {
      instruction: 'Find the scale of the map',
      questionText: `On a map, ${num(map)} cm represents ${num(real)} ${u}. Write the scale in the form 1 : n.`,
      answer: `1 : ${n}`,
      workingOut: [`${num(real)} \\times ${per} = ${num(cm)}\\text{ cm}`, `${num(cm)} \\div ${num(map)} = ${n}`].join(NL),
      metadata,
    };
  }
};
