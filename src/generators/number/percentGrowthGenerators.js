// src/generators/number/percentGrowthGenerators.js
//
// Two percentage skills from the 0607 coverage review:
//
//   percentage-of-another  (Percentages, Haese 10A, syllabus E1.12b) one
//                          quantity as a percentage of another: then in
//                          different units, then from a two-step problem
//   growth-decay           (Profit and interest, Haese 10F and 28E,
//                          syllabus E1.16) a population after n years of
//                          growth or decay, then the starting number from
//                          the end, then the first whole year it passes a
//                          level
//
// Percentages here come out exact, to at most one decimal place, so the
// answer never depends on how it was rounded.

import _ from 'lodash';

const NL = '\n';
const num = (v) => String(Number(v.toFixed(6)));
const pct = (v) => `${num(v)}\\%`;
// k as a percentage of n, if it is exact to one decimal place.
const exactPct = (k, n) => (Number.isInteger(k * 1000 / n) ? k * 100 / n : null);
const comma = (n) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ',');

/* ------------------------------------------------- percentage-of-another */
//
//   foundation  k out of n, a whole-number percentage
//   core        two quantities in different units: the same unit first
//   stretch     the rest of a group as a percentage, or marks from two
//               tests out of their combined total

const UNITS = [
  ['cm', 'm', 100, 'm'],
  ['g', 'kg', 1000, 'kg'],
  ['ml', 'litres', 1000, 'litre'],
  ['minutes', 'hours', 60, 'hour'],
  ['m', 'km', 1000, 'km'],
];
const qty = (v, unit, one) => `${num(v)}\\text{ ${v === 1 && one ? one : unit}}`;

export const generatePercentageOfAnother = (options = {}) => {
  const { difficulty = 'core' } = options;
  const metadata = { topic: 'percentage-of-another', difficulty };

  for (;;) {
    if (difficulty === 'foundation') {
      const n = _.sample([10, 20, 25, 40, 50, 60, 75, 80, 120, 200, 250, 300, 400, 500]);
      const k = _.random(1, n - 1);
      const p = k * 100 / n;
      if (!Number.isInteger(p)) continue;
      return {
        instruction: 'Write as a percentage',
        questionMath: `${k} \\text{ out of } ${n}`,
        answer: pct(p),
        workingOut: `\\frac{${k}}{${n}} \\times 100 = ${pct(p)}`,
        metadata,
      };
    }

    if (difficulty === 'core') {
      const [small, large, per, one] = _.sample(UNITS);
      const big = _.random(1, 10) / (large === 'hours' ? 2 : _.sample([1, 2, 1])); // in the large unit
      const whole = big * per;
      const k = _.random(1, Math.min(whole - 1, 999));
      const p = exactPct(k, whole);
      if (!Number.isInteger(whole) || p === null || p >= 100 || big === 1) continue;
      return {
        instruction: 'Write the first as a percentage of the second',
        questionMath: `${qty(k, small)} \\text{ of } ${qty(big, large, one)}`,
        answer: pct(p),
        workingOut: [`${qty(big, large, one)} = ${qty(whole, small)}`, `\\frac{${k}}{${num(whole)}} \\times 100 = ${pct(p)}`].join(NL),
        metadata,
      };
    }

    // stretch
    if (_.random(0, 1) === 0) {
      const n = _.sample([20, 25, 30, 32, 40, 50, 60, 80]);
      const a = _.random(2, n / 2), b = _.random(2, n / 2);
      const rest = n - a - b;
      const p = exactPct(rest, n);
      if (rest < 2 || p === null) continue;
      const [first, second, third] = _.sample([['walk to school', 'come by bus', 'come by car'], ['have a dog', 'have a cat', 'have no pet'], ['chose football', 'chose tennis', 'chose swimming']]);
      return {
        instruction: 'Find the percentage',
        questionText: `In a group of ${n} students, ${a} ${first} and ${b} ${second}. The rest ${third}. What percentage ${third}?`,
        answer: pct(p),
        workingOut: [`${n} - ${a} - ${b} = ${rest}`, `\\frac{${rest}}{${n}} \\times 100 = ${pct(p)}`].join(NL),
        metadata,
      };
    }
    const [n1, n2] = _.sampleSize([10, 20, 25, 30, 40, 50, 60], 2);
    const k1 = _.random(Math.ceil(n1 / 3), n1), k2 = _.random(Math.ceil(n2 / 3), n2);
    const p = exactPct(k1 + k2, n1 + n2);
    if (p === null || p === 100) continue;
    const who = _.sample(['Ana', 'Ben', 'Priya', 'Leo', 'Mia', 'Kofi']);
    return {
      instruction: 'Find the percentage',
      questionText: `${who} scores ${k1} out of ${n1} on one test and ${k2} out of ${n2} on another. What percentage of the marks did ${who} get altogether?`,
      answer: pct(p),
      workingOut: [`${k1} + ${k2} = ${k1 + k2}, \\ ${n1} + ${n2} = ${n1 + n2}`, `\\frac{${k1 + k2}}{${n1 + n2}} \\times 100 = ${pct(p)}`].join(NL),
      metadata,
    };
  }
};

/* --------------------------------------------------------- growth-decay */
//
//   foundation  the number after n years of growth or decay at r% a year
//   core        the starting number, from the number after n years
//   stretch     the first whole year the number passes a level
//
// Numbers are counts — people, birds, fish — rounded to the nearest whole
// one, and never within a hair of a half, so the rounding is never in
// doubt.

const THINGS = {
  growth: [['A town has', 'people', 'Its population grows'], ['A colony has', 'ants', 'It grows'], ['A city has', 'people', 'Its population grows']],
  decay: [['A lake has', 'fish', 'The number falls'], ['A forest has', 'trees', 'The number falls'], ['An island has', 'birds', 'The number falls']],
};
const mult = (up, r) => num(1 + (up ? r : -r) / 100);
const power = (n) => `(${n})`;

export const generateGrowthDecay = (options = {}) => {
  const { difficulty = 'core' } = options;
  const metadata = { topic: 'growth-decay', difficulty };
  const up = _.random(0, 1) === 1;

  for (;;) {
    const kind = up ? 'growth' : 'decay';
    const [has, things, change] = _.sample(THINGS[kind]);
    const r = _.random(2, up ? 12 : 15);
    const m = mult(up, r);
    const start = _.random(4, 90) * _.sample([100, 500, 1000]);
    const n = _.random(2, 6);
    const end = start * Number(m) ** n;

    if (difficulty === 'foundation') {
      const frac = end - Math.floor(end);
      if (Math.abs(frac - 0.5) < 0.02) continue;
      const v = Math.round(end);
      return {
        instruction: 'Find the number, to the nearest whole number',
        questionText: `${has} ${comma(start)} ${things}. ${change} by ${r}% each year. How many ${things} will there be after ${n} years?`,
        answer: String(v), answerUnits: things,
        workingOut: [`\\text{multiplier} = ${m}`, `${start} \\times ${power(m)}^{${n}} \\approx ${v}`].join(NL),
        metadata,
      };
    }

    if (difficulty === 'core') {
      // The number now, rounded; the start comes back from it exactly
      // enough to round to the same whole number.
      const now = Math.round(end);
      const back = now / Number(m) ** n;
      if (Math.round(back) !== start || Math.abs(back - Math.round(back)) > 0.4) continue;
      return {
        instruction: 'Find the starting number, to the nearest whole number',
        questionText: `${has} ${comma(now)} ${things}. Over the last ${n} years the number ${up ? 'grew' : 'fell'} by ${r}% each year. How many ${things} were there ${n} years ago?`,
        answer: String(start), answerUnits: things,
        workingOut: [`\\text{multiplier} = ${m}`, `${now} \\div ${power(m)}^{${n}} \\approx ${start}`].join(NL),
        metadata,
      };
    }

    // stretch: the first whole year past a level, a round number.
    const level = up ? start * _.sample([1.5, 2, 3]) : start * _.sample([0.5, 0.4, 0.25]);
    const after = (k) => start * Number(m) ** k;
    let k = 1;
    while (k < 40 && (up ? after(k) <= level : after(k) >= level)) k += 1;
    if (k < 3 || k > 15) continue;
    const before = after(k - 1), past = after(k);
    // Clear of the level both sides, so a rounded value never ties it.
    if (Math.abs(before - level) < level * 0.005 || Math.abs(past - level) < level * 0.005) continue;
    // And neither shown value a hair from a half, so its rounding is sure.
    if ([before, past].some((v) => Math.abs(v - Math.floor(v) - 0.5) < 0.02)) continue;
    return {
      instruction: 'Find how many whole years',
      questionText: `${has} ${comma(start)} ${things}. ${change} by ${r}% each year. After how many whole years will there first be ${up ? 'more' : 'fewer'} than ${comma(level)} ${things}?`,
      answer: String(k), answerUnits: 'years',
      workingOut: [
        `${start} \\times ${power(m)}^{${k - 1}} \\approx ${Math.round(before)}`,
        `${start} \\times ${power(m)}^{${k}} \\approx ${Math.round(past)}`,
        `n = ${k}`,
      ].join(NL),
      metadata,
    };
  }
};
