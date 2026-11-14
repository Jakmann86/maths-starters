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

// A percentage in tenths, so 7.2% is 72. Whole percentages are far more
// common in a starter, so they are weighted accordingly.
const pctTenths = (lo, hi) => (_.random(0, 3) ? 10 * _.random(Math.ceil(lo / 10), Math.floor(hi / 10)) : _.random(lo, hi));
const pctStr = (t) => dec(t, 1);

const FRIENDLY = [5, 10, 15, 20, 25, 30, 40, 50, 60, 70, 75, 80, 90];

// Thousands separator for money and population figures — a bare "9000" reads
// slower off a whiteboard than "9,000".
const comma = (n) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ',');

// Vocabulary for the story-based percentage-change questions below. These are
// phrasing dressing, not a question bank — every number is still generated,
// only the noun varies.
const MONEY_ITEMS = ['a used car', 'a laptop', 'a painting', 'a rare guitar', 'a classic motorbike', 'a plot of land', 'a small business'];
const POPULATION_PLACES = ['a small town', 'a coastal village', 'a wildlife park', 'a nature reserve', 'a school', 'an island'];

/* ------------------------------------------------------- percentage of an amount */

export const generatePercentageOfAmount = (options = {}) => {
  const { difficulty = 'core' } = options;

  if (difficulty === 'foundation') {
    // Friendly percentage of a round amount, whole-number answer — the sort
    // of thing that should be done by splitting into 10% and 5%.
    let p, n, ans;
    do {
      p = _.sample(FRIENDLY);
      n = 20 * _.random(2, 60);
      ans = (p * n) / 100;
    } while (!Number.isInteger(ans));
    return {
      instruction: 'Work out',
      questionMath: `${p}\\% \\text{ of } ${n}`,
      answer: String(ans),
      workingOut: `\\frac{${p}}{100} \\times ${n}${NL}= ${ans}`,
      metadata: { topic: 'percentage-of-amount', difficulty },
    };
  }

  if (difficulty === 'core') {
    // Any percentage, including over 100 (Haese Exercise 10A Q6c is 105% of
    // 80 kg) — a percentage above 100 is the case students refuse to believe.
    const p = _.random(0, 3) ? _.random(2, 99) : _.random(101, 175);
    const n = _.random(20, 900);
    const scaled = p * n; // = answer x 100
    return {
      instruction: 'Work out',
      questionMath: `${p}\\% \\text{ of } ${n}`,
      answer: dec(scaled, 2),
      workingOut: `\\frac{${p}}{100} \\times ${n}${NL}= ${dec(scaled, 2)}`,
      metadata: { topic: 'percentage-of-amount', difficulty },
    };
  }

  // Reverse: the part and the percentage are given, the whole is wanted
  // (Haese Exercise 10D). The word "original" is doing real work here — it
  // is the one signal, in the abstract phrasing, that this isn't the same
  // "work out p% of n" task Foundation and Core just asked, and a student
  // skimming past it read the two as the same question. The money/population
  // stories go further and name the payoff directly ("what was the full
  // price"), the same fix percentage-change already uses for its own
  // story-based questions below.
  let p, n, part;
  do {
    p = _.sample(FRIENDLY.concat([12, 16, 22, 35, 45, 55, 65, 85]));
    n = _.random(2, 200) * 10;
    part = (p * n) / 100;
  } while (!Number.isInteger(part));
  const workingOut = `1\\% = ${part} \\div ${p} = ${dec(n, 2)}${NL}\\text{amount} = ${dec(n, 2)} \\times 100${NL}= ${n}`;
  const style = changeStyle();

  if (style === 'money') {
    const item = _.sample(MONEY_ITEMS);
    return {
      instruction: 'Find the original price',
      questionText: `${p}% of the price of ${item} is £${comma(part)}. What was the original price?`,
      answer: `\\text{£${comma(n)}}`,
      workingOut,
      metadata: { topic: 'percentage-of-amount', difficulty },
    };
  }
  if (style === 'population') {
    const place = _.sample(POPULATION_PLACES);
    return {
      instruction: 'Find the original population',
      questionText: `${p}% of the population of ${place} is ${comma(part)}. What was the original population?`,
      answer: `\\text{${comma(n)}}`,
      workingOut,
      metadata: { topic: 'percentage-of-amount', difficulty },
    };
  }
  return {
    instruction: 'Find the original amount',
    questionMath: `${p}\\% \\text{ of the original amount is } ${part}`,
    answer: String(n),
    workingOut,
    metadata: { topic: 'percentage-of-amount', difficulty },
  };
};

/* ------------------------------------------------------------ the multiplier idea */

export const generatePercentageMultiplier = (options = {}) => {
  const { difficulty = 'core' } = options;

  if (difficulty === 'foundation') {
    // Haese Example 13 exactly: state the multiplier for a given change.
    const up = _.random(0, 1) === 1;
    const t = pctTenths(10, 750);
    const m = up ? 1000 + t : 1000 - t;
    return {
      instruction: 'Write down the multiplier for',
      questionMath: `\\text{a } ${pctStr(t)}\\% \\text{ ${up ? 'increase' : 'decrease'}}`,
      answer: dec(m, 3),
      workingOut: `100\\% ${up ? '+' : '-'} ${pctStr(t)}\\% = ${dec(m, 1)}\\%${NL}\\text{multiplier} = ${dec(m, 3)}`,
      metadata: { topic: 'percentage-multiplier', difficulty },
    };
  }

  if (difficulty === 'core') {
    // Backwards: given the multiplier, name the change.
    const up = _.random(0, 1) === 1;
    const t = pctTenths(10, 600);
    const m = up ? 1000 + t : 1000 - t;
    return {
      instruction: 'What percentage change does this multiplier represent?',
      questionMath: `\\times ${dec(m, 3)}`,
      answer: `\\text{a } ${pctStr(t)}\\% \\text{ ${up ? 'increase' : 'decrease'}}`,
      workingOut: up
        ? `${dec(m, 3)} = ${dec(m, 1)}\\%${NL}${dec(m, 1)}\\% - 100\\% = ${pctStr(t)}\\%${NL}\\text{an increase of } ${pctStr(t)}\\%`
        : `${dec(m, 3)} = ${dec(m, 1)}\\%${NL}100\\% - ${dec(m, 1)}\\% = ${pctStr(t)}\\%${NL}\\text{a decrease of } ${pctStr(t)}\\%`,
      metadata: { topic: 'percentage-multiplier', difficulty },
    };
  }

  // Two successive changes as one multiplier — the step that makes compound
  // growth work (Haese Example 15).
  const up1 = _.random(0, 1) === 1;
  const up2 = _.random(0, 1) === 1;
  const a = 10 * _.random(1, 40);
  const b = 10 * _.random(1, 40);
  const m1 = up1 ? 1000 + a : 1000 - a;
  const m2 = up2 ? 1000 + b : 1000 - b;
  return {
    instruction: 'Write down the single multiplier for',
    questionMath: `\\text{a } ${pctStr(a)}\\% \\text{ ${up1 ? 'increase' : 'decrease'} followed by a } ${pctStr(b)}\\% \\text{ ${up2 ? 'increase' : 'decrease'}}`,
    answer: dec(m1 * m2, 6),
    workingOut: `\\text{multipliers are } ${dec(m1, 3)} \\text{ and } ${dec(m2, 3)}${NL}${dec(m1, 3)} \\times ${dec(m2, 3)} = ${dec(m1 * m2, 6)}`,
    metadata: { topic: 'percentage-multiplier', difficulty },
  };
};

/* -------------------------------------------------------- increase and decrease */

// Every band can render either the bare numeric form or a story wrapped
// around the identical arithmetic. Weighted so a story appears roughly two
// times in three — "abstract" is one branch out of three, picked no more
// often than either story context.
const changeStyle = () => _.sample(['abstract', 'money', 'population']);

export const generatePercentageChange = (options = {}) => {
  const { difficulty = 'core' } = options;
  const style = changeStyle();

  if (difficulty === 'foundation') {
    // One step, using a multiplier (Haese Exercise 10E.1 Q2).
    const up = _.random(0, 1) === 1;
    let p, n, out;
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
        metadata: { topic: 'percentage-change', difficulty },
      };
    }
    if (style === 'population') {
      const place = _.sample(POPULATION_PLACES);
      return {
        instruction: 'Work out the new population',
        questionText: `The population of ${place} was ${comma(n)}. It ${up ? 'grows' : 'falls'} by ${p}%. What is the population now?`,
        answer: `\\text{${comma(out)}}`,
        workingOut,
        metadata: { topic: 'percentage-change', difficulty },
      };
    }
    return {
      instruction: 'Work out',
      questionMath: `${up ? '\\text{increase }' : '\\text{decrease }'} ${n} \\text{ by } ${p}\\%`,
      answer: String(out),
      workingOut,
      metadata: { topic: 'percentage-change', difficulty },
    };
  }

  if (difficulty === 'core') {
    // A chain of two changes (Haese Example 15).
    const up1 = _.random(0, 1) === 1;
    const up2 = _.random(0, 1) === 1;
    const a = 10 * _.random(1, 30);
    const b = 10 * _.random(1, 30);
    const m1 = up1 ? 1000 + a : 1000 - a;
    const m2 = up2 ? 1000 + b : 1000 - b;
    const n = 100 * _.random(1, 90);
    const scaled = n * m1 * m2; // exact final value x 1e6
    const exact = dec(scaled, 6);
    const stepsMath = `${n} \\times ${dec(m1, 3)} \\times ${dec(m2, 3)}${NL}= ${exact}`;

    if (style === 'money') {
      // A compounded pair of percentages rarely lands on a whole penny, so
      // the story rounds — same convention a textbook uses here.
      const pence = Math.round(scaled / 10000);
      const item = _.sample(MONEY_ITEMS);
      return {
        instruction: 'Work out the final value, to the nearest penny',
        questionText: `The value of ${item} was £${comma(n)}. In the first year it ${up1 ? 'increases' : 'decreases'} by ${pctStr(a)}%. In the second year it ${up2 ? 'increases' : 'decreases'} by ${pctStr(b)}%. What is its value now?`,
        answer: `\\text{£${comma(dec(pence, 2))}}`,
        workingOut: `${stepsMath}${NL}\\approx ${dec(pence, 2)} \\text{ (nearest penny)}`,
        metadata: { topic: 'percentage-change', difficulty },
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
        metadata: { topic: 'percentage-change', difficulty },
      };
    }
    return {
      instruction: 'Work out the final amount',
      questionMath: `${up1 ? '\\text{Increase }' : '\\text{Decrease }'} ${n} \\text{ by } ${pctStr(a)}\\%,${NL}\\text{then ${up2 ? 'increase' : 'decrease'} the result by } ${pctStr(b)}\\%`,
      answer: exact,
      workingOut: stepsMath,
      metadata: { topic: 'percentage-change', difficulty },
    };
  }

  // Given the before and after, find the percentage change (Haese Example 14).
  const up = _.random(0, 1) === 1;
  let p, oldV, newV;
  do {
    p = _.sample([4, 5, 8, 10, 12, 15, 16, 20, 24, 25, 30, 35, 40, 45, 50, 60, 75]);
    oldV = 20 * _.random(2, 250);
    newV = (oldV * (up ? 100 + p : 100 - p)) / 100;
  } while (!Number.isInteger(newV));
  const answer = `\\text{a } ${p}\\% \\text{ ${up ? 'increase' : 'decrease'}}`;
  const workingOut = `\\text{multiplier} = \\frac{${newV}}{${oldV}} = ${dec((newV * 100) / oldV, 2)}${NL}= ${dec((newV * 10000) / oldV, 2)}\\%${NL}\\text{a } ${p}\\% \\text{ ${up ? 'increase' : 'decrease'}}`;

  if (style === 'money') {
    const item = _.sample(MONEY_ITEMS);
    return {
      instruction: 'Find the percentage change',
      questionText: `The value of ${item} was £${comma(oldV)}. It is now £${comma(newV)}. What percentage change is this?`,
      answer,
      workingOut,
      metadata: { topic: 'percentage-change', difficulty },
    };
  }
  if (style === 'population') {
    const place = _.sample(POPULATION_PLACES);
    return {
      instruction: 'Find the percentage change',
      questionText: `The population of ${place} was ${comma(oldV)}. It is now ${comma(newV)}. What percentage change is this?`,
      answer,
      workingOut,
      metadata: { topic: 'percentage-change', difficulty },
    };
  }
  return {
    instruction: 'Find the percentage change',
    questionMath: `${oldV} \\text{ changes to } ${newV}`,
    answer,
    workingOut,
    metadata: { topic: 'percentage-change', difficulty },
  };
};
