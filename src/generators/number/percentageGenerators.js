import _ from 'lodash';

const NL = '\n';

// All money-ish arithmetic is done on integers and only turned into a decimal
// string at the end. Doing it in floats gives 0.30000000000000004 answers.
const dec = (scaled, places) => {
  const neg = scaled < 0;
  const s = String(Math.abs(scaled)).padStart(places + 1, '0');
  let whole = s.slice(0, s.length - places);
  let frac = places ? s.slice(s.length - places).replace(/0+$/, '') : '';
  return `${neg ? '-' : ''}${whole}${frac ? `.${frac}` : ''}`;
};

// A percentage held in tenths, so 7.2% is 72.
const pctStr = (t) => dec(t, 1);

const FRIENDLY = [5, 10, 15, 20, 25, 30, 40, 50, 60, 70, 75, 80, 90];

// Thousands separator for money and population figures — a bare "9000" reads
// slower off a whiteboard than "9,000".
const comma = (n) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
// Pounds from a whole number of pence, always with two places: 4,700.80.
const pounds = (pence) => {
  const p = BigInt(pence);
  return `${comma(p / 100n)}.${String(p % 100n).padStart(2, '0')}`;
};

// Vocabulary for the story-based percentage-change questions below. These are
// phrasing dressing, not a question bank — every number is still generated,
// only the noun varies.
const MONEY_ITEMS = ['a used car', 'a laptop', 'a painting', 'a rare guitar', 'a classic motorbike', 'a plot of land', 'a small business'];
const POPULATION_PLACES = ['a small town', 'a coastal village', 'a wildlife park', 'a nature reserve', 'a school', 'an island'];

// Every band can render either the bare numeric form or a story wrapped
// around the identical arithmetic: a story two times in three.
const changeStyle = () => _.sample(['abstract', 'money', 'population']);

/* Skill-ladder review: the percentages topic is six skills, each holding one
 * task across its three bands.
 *
 *   percentage-of-amount     F 25%, 10%       C any whole %, over 100%   S 12.5%, 7.5%
 *   reverse-percentages      F 50% or 10%     C any friendly %           S after a change
 *   percentage-multiplier    F a whole %      C an awkward %             S two changes
 *   multiplier-to-percentage F × 1.15         C × 1.075, × 0.925         S two multipliers
 *   percentage-change        F one step       C two steps                S compound, n years
 *   percentage-change-find   F a whole %      C an awkward %             S profit or loss, reversed
 */

/* ------------------------------------------------------- percentage of an amount */

const EASY = [10, 20, 25, 50, 75, 5];

export const generatePercentageOfAmount = (options = {}) => {
  const { difficulty = 'core' } = options;
  const meta = { topic: 'percentage-of-amount', difficulty };

  if (difficulty === 'foundation') {
    // Done by halving and tenths: 25%, 10% and their friends.
    let p; let n; let ans;
    do {
      p = _.sample(EASY);
      n = 20 * _.random(2, 60);
      ans = (p * n) / 100;
    } while (!Number.isInteger(ans));
    return {
      instruction: 'Work out',
      questionMath: `${p}\\% \\text{ of } ${n}`,
      answer: String(ans),
      workingOut: `\\frac{${p}}{100} \\times ${n}${NL}= ${ans}`,
      metadata: meta,
    };
  }

  if (difficulty === 'core') {
    // Any whole percentage, over 100 a quarter of the time (Haese 10A Q6c).
    // Never one of Foundation's friendly percentages.
    let p;
    do { p = _.random(0, 3) ? _.random(2, 99) : _.random(101, 175); } while (EASY.includes(p));
    const n = _.random(20, 900);
    return {
      instruction: 'Work out',
      questionMath: `${p}\\% \\text{ of } ${n}`,
      answer: dec(p * n, 2),
      workingOut: `\\frac{${p}}{100} \\times ${n}${NL}= ${dec(p * n, 2)}`,
      metadata: meta,
    };
  }

  // A half percent: 12.5% is an eighth, 7.5% is 10% less a quarter of it.
  const t = _.sample([25, 75, 125, 175, 225, 275, 325, 375, 625, 875]); // tenths
  const n = 8 * _.random(3, 120);
  const scaled = t * n; // answer x 1000
  return {
    instruction: 'Work out',
    questionMath: `${pctStr(t)}\\% \\text{ of } ${n}`,
    answer: dec(scaled, 3),
    workingOut: `\\frac{${pctStr(t)}}{100} \\times ${n}${NL}= ${dec(scaled, 3)}`,
    metadata: meta,
  };
};

/* ---------------------------------------------------------- reverse percentages */

export const generateReversePercentages = (options = {}) => {
  const { difficulty = 'core' } = options;
  const meta = { topic: 'reverse-percentages', difficulty };
  const style = changeStyle();

  if (difficulty === 'stretch') {
    // The amount after an increase or decrease (Haese 10D): divide by the
    // multiplier, never take the percentage off the new amount.
    for (;;) {
      const up = _.random(0, 1) === 1;
      const p = _.sample([5, 10, 12, 15, 20, 25, 30, 35, 40, 60]);
      const n = 20 * _.random(2, 150);
      const after = (n * (up ? 100 + p : 100 - p)) / 100;
      if (!Number.isInteger(after)) continue;
      const m = dec(up ? 100 + p : 100 - p, 2);
      const workingOut = `\\text{multiplier} = ${m}${NL}${after} \\div ${m} = ${n}`;
      if (style === 'money') {
        const item = _.sample(MONEY_ITEMS);
        return {
          instruction: 'Find the original price',
          questionText: `After a ${p}% ${up ? 'increase' : 'decrease'}, the price of ${item} is £${comma(after)}. What was the price before?`,
          answer: `\\text{£${comma(n)}}`,
          workingOut,
          metadata: meta,
        };
      }
      return {
        instruction: 'Find the original amount',
        questionMath: `\\text{after a } ${p}\\% \\text{ ${up ? 'increase' : 'decrease'}, the amount is } ${after}`,
        answer: String(n),
        workingOut,
        metadata: meta,
      };
    }
  }

  // Foundation: 50% or 10% of it is known. Core: any friendly percentage,
  // so 1% is found first.
  for (;;) {
    const p = difficulty === 'foundation' ? _.sample([50, 10]) : _.sample([15, 20, 25, 30, 35, 40, 45, 60, 65, 70, 75, 80, 85, 90]);
    const n = _.random(2, 200) * 10;
    const part = (p * n) / 100;
    if (!Number.isInteger(part)) continue;
    const workingOut = difficulty === 'foundation'
      ? `${part} \\times ${100 / p} = ${n}`
      : `1\\% = ${part} \\div ${p} = ${dec(n, 2)}${NL}100\\% = ${n}`;
    if (style === 'money') {
      const item = _.sample(MONEY_ITEMS);
      return {
        instruction: 'Find the original price',
        questionText: `${p}% of the price of ${item} is £${comma(part)}. What was the original price?`,
        answer: `\\text{£${comma(n)}}`,
        workingOut,
        metadata: meta,
      };
    }
    if (style === 'population') {
      const place = _.sample(POPULATION_PLACES);
      return {
        instruction: 'Find the original population',
        questionText: `${p}% of the population of ${place} is ${comma(part)}. What was the original population?`,
        answer: `\\text{${comma(n)}}`,
        workingOut,
        metadata: meta,
      };
    }
    return {
      instruction: 'Find the original amount',
      questionMath: `${p}\\% \\text{ of the original amount is } ${part}`,
      answer: String(n),
      workingOut,
      metadata: meta,
    };
  }
};

/* ------------------------------------------------------- finding the multiplier */

const changeWords = (t, up) => `\\text{a } ${pctStr(t)}\\% \\text{ ${up ? 'increase' : 'decrease'}}`;

export const generatePercentageMultiplier = (options = {}) => {
  const { difficulty = 'core' } = options;
  const meta = { topic: 'percentage-multiplier', difficulty };

  if (difficulty !== 'stretch') {
    // Foundation a whole percentage (Haese Example 13); Core an awkward one,
    // a decimal percentage or a change past 100%.
    const up = _.random(0, 1) === 1;
    let t;
    if (difficulty === 'foundation') t = 10 * _.random(1, 90);
    else {
      do { t = up ? _.random(5, 1500) : _.random(5, 950); } while (t % 10 === 0 && t < 1000);
    }
    const m = up ? 1000 + t : 1000 - t;
    return {
      instruction: 'Write down the multiplier for',
      questionMath: changeWords(t, up),
      answer: dec(m, 3),
      workingOut: `100\\% ${up ? '+' : '-'} ${pctStr(t)}\\% = ${dec(m, 1)}\\%${NL}\\text{multiplier} = ${dec(m, 3)}`,
      metadata: meta,
    };
  }

  // Two successive changes as one multiplier (Haese Example 15).
  const [up1, up2] = [_.random(0, 1) === 1, _.random(0, 1) === 1];
  const [a, b] = [10 * _.random(1, 40), 10 * _.random(1, 40)];
  const [m1, m2] = [up1 ? 1000 + a : 1000 - a, up2 ? 1000 + b : 1000 - b];
  return {
    instruction: 'Write down the single multiplier for',
    questionMath: `${changeWords(a, up1)} \\text{ followed by } ${changeWords(b, up2)}`,
    answer: dec(m1 * m2, 6),
    workingOut: `\\text{multipliers are } ${dec(m1, 3)} \\text{ and } ${dec(m2, 3)}${NL}${dec(m1, 3)} \\times ${dec(m2, 3)} = ${dec(m1 * m2, 6)}`,
    metadata: meta,
  };
};

/* --------------------------------------------- reading a multiplier as a change */

export const generateMultiplierToPercentage = (options = {}) => {
  const { difficulty = 'core' } = options;
  const meta = { topic: 'multiplier-to-percentage', difficulty };
  const instruction = 'What percentage change does this represent?';

  if (difficulty !== 'stretch') {
    const up = _.random(0, 1) === 1;
    let t;
    if (difficulty === 'foundation') t = 10 * _.random(1, 90);
    else {
      do { t = up ? _.random(5, 1500) : _.random(5, 950); } while (t % 10 === 0 && t < 1000);
    }
    const m = up ? 1000 + t : 1000 - t;
    return {
      instruction,
      questionMath: `\\times ${dec(m, 3)}`,
      answer: changeWords(t, up),
      workingOut: `${dec(m, 3)} = ${dec(m, 1)}\\%${NL}${up ? `${dec(m, 1)}\\% - 100\\%` : `100\\% - ${dec(m, 1)}\\%`} = ${pctStr(t)}\\%`,
      metadata: meta,
    };
  }

  // Two multipliers in turn: one overall change (×1.2 then ×0.85 is a 2%
  // increase). Built so the overall percentage has at most one decimal place.
  for (;;) {
    const [a, b] = [10 * _.random(1, 40), 10 * _.random(1, 40)];
    const [up1, up2] = [_.random(0, 1) === 1, _.random(0, 1) === 1];
    const [m1, m2] = [up1 ? 1000 + a : 1000 - a, up2 ? 1000 + b : 1000 - b];
    const prod = m1 * m2; // x 1e6
    if (prod % 1000 !== 0 || prod === 1000000) continue;
    const overall = prod / 1000; // x 1e3
    const up = overall > 1000;
    const t = Math.abs(overall - 1000);
    return {
      instruction,
      questionMath: `\\times ${dec(m1, 3)} \\text{ then } \\times ${dec(m2, 3)}`,
      answer: changeWords(t, up),
      workingOut: `${dec(m1, 3)} \\times ${dec(m2, 3)} = ${dec(overall, 3)}${NL}${dec(overall, 3)} = ${dec(overall, 1)}\\%${NL}${up ? `${dec(overall, 1)}\\% - 100\\%` : `100\\% - ${dec(overall, 1)}\\%`} = ${pctStr(t)}\\%`,
      metadata: meta,
    };
  }
};

/* -------------------------------------------- increasing or decreasing an amount */

export const generatePercentageChange = (options = {}) => {
  const { difficulty = 'core' } = options;
  const style = changeStyle();
  const meta = { topic: 'percentage-change', difficulty };

  if (difficulty === 'foundation') {
    // One step, using a multiplier (Haese Exercise 10E.1 Q2).
    const up = _.random(0, 1) === 1;
    let p; let n; let out;
    do {
      p = _.sample(FRIENDLY.concat([4, 6, 8, 12, 16, 24, 35, 45]));
      n = 4 * _.random(5, 250);
      out = (n * (up ? 100 + p : 100 - p)) / 100;
    } while (!Number.isInteger(out));
    const multiplier = dec(up ? 100 + p : 100 - p, 2);
    const workingOut = `\\text{multiplier} = ${multiplier}${NL}${n} \\times ${multiplier} = ${out}`;
    if (style === 'money') {
      const item = _.sample(MONEY_ITEMS);
      return {
        instruction: 'Work out the new value',
        questionText: `The value of ${item} was £${comma(n)}. It ${up ? 'increases' : 'decreases'} by ${p}%. What is its value now?`,
        answer: `\\text{£${comma(out)}}`,
        workingOut,
        metadata: meta,
      };
    }
    if (style === 'population') {
      const place = _.sample(POPULATION_PLACES);
      return {
        instruction: 'Work out the new population',
        questionText: `The population of ${place} was ${comma(n)}. It ${up ? 'grows' : 'falls'} by ${p}%. What is the population now?`,
        answer: `\\text{${comma(out)}}`,
        workingOut,
        metadata: meta,
      };
    }
    return {
      instruction: 'Work out',
      questionMath: `${up ? '\\text{increase }' : '\\text{decrease }'} ${n} \\text{ by } ${p}\\%`,
      answer: String(out),
      workingOut,
      metadata: meta,
    };
  }

  if (difficulty === 'core') {
    // A chain of two changes (Haese Example 15).
    const [up1, up2] = [_.random(0, 1) === 1, _.random(0, 1) === 1];
    const [a, b] = [10 * _.random(1, 30), 10 * _.random(1, 30)];
    const [m1, m2] = [up1 ? 1000 + a : 1000 - a, up2 ? 1000 + b : 1000 - b];
    const n = 100 * _.random(1, 90);
    const scaled = n * m1 * m2; // final value x 1e6
    const exact = dec(scaled, 6);
    const stepsMath = `${n} \\times ${dec(m1, 3)} \\times ${dec(m2, 3)}${NL}= ${exact}`;
    if (style === 'money') {
      const pence = Math.round(scaled / 10000);
      const item = _.sample(MONEY_ITEMS);
      return {
        instruction: 'Work out the final value, to the nearest penny',
        questionText: `The value of ${item} was £${comma(n)}. In the first year it ${up1 ? 'increases' : 'decreases'} by ${pctStr(a)}%. In the second year it ${up2 ? 'increases' : 'decreases'} by ${pctStr(b)}%. What is its value now?`,
        answer: `\\text{£${pounds(pence)}}`,
        workingOut: `${stepsMath}${NL}\\approx ${pounds(pence).replace(/,/g, '')} \\text{ (nearest penny)}`,
        metadata: meta,
      };
    }
    if (style === 'population') {
      const whole = Math.round(scaled / 1000000);
      const place = _.sample(POPULATION_PLACES);
      return {
        instruction: 'Work out the final population, to the nearest whole number',
        questionText: `The population of ${place} was ${comma(n)}. Over one year it ${up1 ? 'grows' : 'falls'} by ${pctStr(a)}%. Over the next year it ${up2 ? 'grows' : 'falls'} by ${pctStr(b)}%. What is the population now?`,
        answer: `\\text{${comma(whole)}}`,
        workingOut: `${stepsMath}${NL}\\approx ${whole} \\text{ (nearest whole number)}`,
        metadata: meta,
      };
    }
    return {
      instruction: 'Work out the final amount',
      questionMath: `${up1 ? '\\text{Increase }' : '\\text{Decrease }'} ${n} \\text{ by } ${pctStr(a)}\\%,${NL}\\text{then ${up2 ? 'increase' : 'decrease'} the result by } ${pctStr(b)}\\%`,
      answer: exact,
      workingOut: stepsMath,
      metadata: meta,
    };
  }

  // Stretch: the same change n years running, compounded (Haese 10F's
  // method on a value rather than an account), to the nearest penny or
  // whole number. Exact in BigInt: n × (100 ± p)^k / 100^k.
  const up = _.random(0, 1) === 1;
  const p = _.sample([2, 3, 4, 5, 6, 8, 10, 12, 15, 20]);
  const years = _.random(3, 8);
  const n = 100 * _.random(5, 200);
  const m = up ? 100 + p : 100 - p;
  const num = BigInt(n) * BigInt(m) ** BigInt(years);
  const den = 100n ** BigInt(years);
  const roundDiv = (a, b) => (2n * a + b) / (2n * b); // a, b > 0
  const mult = dec(m, 2);
  if (style === 'population') {
    const whole = roundDiv(num, den);
    const place = _.sample(POPULATION_PLACES);
    return {
      instruction: 'Work out the population, to the nearest whole number',
      questionText: `The population of ${place} is ${comma(n)}. It ${up ? 'grows' : 'falls'} by ${p}% every year. What will it be after ${years} years?`,
      answer: `\\text{${comma(whole)}}`,
      workingOut: `${n} \\times ${mult}^{${years}}${NL}\\approx ${whole}`,
      metadata: meta,
    };
  }
  const pence = roundDiv(num * 100n, den);
  const item = _.sample(MONEY_ITEMS);
  return {
    instruction: 'Work out the value, to the nearest penny',
    questionText: `The value of ${item} is £${comma(n)}. It ${up ? 'increases' : 'decreases'} by ${p}% every year. What will it be worth after ${years} years?`,
    answer: `\\text{£${pounds(pence)}}`,
    workingOut: `${n} \\times ${mult}^{${years}}${NL}\\approx ${pounds(pence).replace(/,/g, '')}`,
    metadata: meta,
  };
};

/* ----------------------------------------- finding a change, profit and loss */

export const generatePercentageChangeFind = (options = {}) => {
  const { difficulty = 'core' } = options;
  const meta = { topic: 'percentage-change-find', difficulty };
  const style = changeStyle();
  const up = _.random(0, 1) === 1;

  if (difficulty === 'stretch') {
    // Profit or loss, reversed: the selling price and the percentage are
    // given, the cost price is wanted.
    for (;;) {
      const p = _.sample([5, 8, 10, 12, 15, 20, 25, 30, 35, 40]);
      const cost = 4 * _.random(5, 400);
      const sell = (cost * (up ? 100 + p : 100 - p)) / 100;
      if (!Number.isInteger(sell)) continue;
      const m = dec(up ? 100 + p : 100 - p, 2);
      const item = _.sample(['a bike', 'a sofa', 'a guitar', 'a laptop', 'a painting', 'a car']);
      return {
        instruction: 'Find the cost price',
        questionText: `A shop sells ${item} for £${comma(sell)}, making a ${p}% ${up ? 'profit' : 'loss'}. What did the shop pay for it?`,
        answer: `\\text{£${comma(cost)}}`,
        workingOut: `\\text{multiplier} = ${m}${NL}${sell} \\div ${m} = ${cost}`,
        metadata: meta,
      };
    }
  }

  // Foundation: a whole-number change (Haese Example 14). Core: awkward, to
  // one decimal place, from values that do not divide neatly.
  for (;;) {
    let oldV; let newV; let t;
    if (difficulty === 'foundation') {
      const p = _.sample([4, 5, 8, 10, 12, 15, 16, 20, 24, 25, 30, 35, 40, 45, 50, 60, 75]);
      oldV = 20 * _.random(2, 250);
      newV = (oldV * (up ? 100 + p : 100 - p)) / 100;
      if (!Number.isInteger(newV)) continue;
      t = 10 * p;
    } else {
      oldV = _.random(40, 900);
      const delta = _.random(3, Math.floor(oldV * 0.6));
      newV = up ? oldV + delta : oldV - delta;
      // tenths of a percent, rounded half up from an exact fraction
      t = Math.floor((2000 * delta + oldV) / (2 * oldV));
      if ((1000 * delta) % oldV === 0) continue; // exact: that is Foundation's question
    }
    const diff = Math.abs(newV - oldV);
    // Core keeps its one decimal place even when it is 0: 6.0%, not 6%.
    const shown = difficulty === 'core' ? (t / 10).toFixed(1) : pctStr(t);
    const answer = difficulty === 'core'
      ? `\\text{a } ${shown}\\% \\text{ ${up ? 'increase' : 'decrease'}}`
      : changeWords(t, up);
    const workingOut = `\\text{change} = ${diff}${NL}\\frac{${diff}}{${oldV}} \\times 100 ${difficulty === 'core' ? '\\approx' : '='} ${shown}\\%`;
    const instruction = difficulty === 'core' ? 'Find the percentage change, to one decimal place' : 'Find the percentage change';
    if (style === 'money') {
      const item = _.sample(MONEY_ITEMS);
      return {
        instruction,
        questionText: `The value of ${item} was £${comma(oldV)}. It is now £${comma(newV)}. What percentage change is this?`,
        answer,
        workingOut,
        metadata: meta,
      };
    }
    if (style === 'population') {
      const place = _.sample(POPULATION_PLACES);
      return {
        instruction,
        questionText: `The population of ${place} was ${comma(oldV)}. It is now ${comma(newV)}. What percentage change is this?`,
        answer,
        workingOut,
        metadata: meta,
      };
    }
    return {
      instruction,
      questionMath: `${oldV} \\text{ changes to } ${newV}`,
      answer,
      workingOut,
      metadata: meta,
    };
  }
};
