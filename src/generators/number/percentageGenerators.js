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
  // (Haese Exercise 10D).
  let p, n, part;
  do {
    p = _.sample(FRIENDLY.concat([12, 16, 22, 35, 45, 55, 65, 85]));
    n = _.random(2, 200) * 10;
    part = (p * n) / 100;
  } while (!Number.isInteger(part));
  return {
    instruction: 'Find the original amount',
    questionMath: `${p}\\% \\text{ of an amount is } ${part}`,
    answer: String(n),
    workingOut: `1\\% = ${part} \\div ${p} = ${dec(n, 2)}${NL}\\text{amount} = ${dec(n, 2)} \\times 100${NL}= ${n}`,
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
        answer: `£${comma(out)}`,
        workingOut,
        metadata: { topic: 'percentage-change', difficulty },
      };
    }
    if (style === 'population') {
      const place = _.sample(POPULATION_PLACES);
      return {
        instruction: 'Work out the new population',
        questionText: `The population of ${place} was ${comma(n)}. It ${up ? 'grows' : 'falls'} by ${p}%. What is the population now?`,
        answer: comma(out),
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
        answer: `£${comma(dec(pence, 2))}`,
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
        answer: comma(whole),
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

/* ------------------------------------------------------------------ index laws */

export const generateIndexLaws = (options = {}) => {
  const { difficulty = 'core' } = options;

  if (difficulty === 'foundation') {
    // Numeric base, one law, and the answer is evaluated — which is the form
    // needed for powers of a multiplier (Haese Examples 5a and 6a).
    // The cap is what actually limits variety here, so the base set is wide
    // and the indices are only bounded by keeping the answer readable on a
    // board. 10^6 is fine; 7^9 is not a starter question.
    const base = _.sample([2, 3, 4, 5, 6, 7, 10]);
    const multiply = _.random(0, 1) === 1;
    let m, n, res;
    do {
      if (multiply) { m = _.random(2, 9); n = _.random(2, 9); res = m + n; }
      else { m = _.random(4, 14); n = _.random(1, m - 1); res = m - n; }
    } while (base ** res > 100000 || res < 1);
    return {
      instruction: 'Simplify, giving your answer as a whole number',
      questionMath: multiply ? `${base}^{${m}} \\times ${base}^{${n}}` : `${base}^{${m}} \\div ${base}^{${n}}`,
      answer: String(base ** res),
      workingOut: `${base}^{${m} ${multiply ? '+' : '-'} ${n}} = ${base}^{${res}}${NL}= ${base ** res}`,
      metadata: { topic: 'index-laws', difficulty },
    };
  }

  if (difficulty === 'core') {
    // Algebraic base, and both laws needed in the same question — a bare
    // "apply one law" question undersells what "the index laws" (plural)
    // means, so Core chains a multiply into a divide, in either order.
    const v = _.sample(['x', 'y', 'a', 'p', 'm', 'b', 't']);
    const divideFirst = _.random(0, 1) === 1;
    let p, q, r, res;
    do {
      p = _.random(2, 9);
      q = _.random(2, 9);
      r = _.random(2, 9);
      res = divideFirst ? p - q + r : p + q - r;
    } while (res < 1 || res > 14);
    const questionMath = divideFirst
      ? `\\frac{${v}^{${p}}}{${v}^{${q}}} \\times ${v}^{${r}}`
      : `${v}^{${p}} \\times ${v}^{${q}} \\div ${v}^{${r}}`;
    const workingOut = divideFirst
      ? `${v}^{${p} - ${q} + ${r}}${NL}= ${v}^{${res}}`
      : `${v}^{${p} + ${q} - ${r}}${NL}= ${v}^{${res}}`;
    return {
      instruction: 'Simplify',
      questionMath,
      answer: `${v}^{${res}}`,
      workingOut,
      metadata: { topic: 'index-laws', difficulty },
    };
  }

  // Stretch mixes power-of-a-power in with the other two laws, rather than
  // testing power-of-a-power alone (Haese Examples 7 and 8, extended with a
  // quotient inside the brackets so the division law feeds into it).
  const v = _.sample(['x', 'y', 'a', 'p', 'm', 'b', 't']);
  const kind = _.sample(['bare', 'coefficient', 'quotient']);

  if (kind === 'bare') {
    // Example 7: a bare power of a power.
    const inner = _.random(2, 9);
    const outer = _.random(2, 6);
    return {
      instruction: 'Remove the brackets and simplify',
      questionMath: `(${v}^{${inner}})^{${outer}}`,
      answer: `${v}^{${inner * outer}}`,
      workingOut: `${v}^{${inner} \\times ${outer}}${NL}= ${v}^{${inner * outer}}`,
      metadata: { topic: 'index-laws', difficulty },
    };
  }

  if (kind === 'coefficient') {
    // Example 8: a coefficient has to be raised as well — forgetting that is
    // the error worth catching.
    const k = _.sample([2, 3, 4, 5, 6, 7, 10]);
    const inner = _.random(2, 6);
    const outer = _.random(2, 4);
    const coeff = k ** outer;
    if (coeff > 2500) return generateIndexLaws(options);
    return {
      instruction: 'Remove the brackets and simplify',
      questionMath: `(${k}${v}^{${inner}})^{${outer}}`,
      answer: `${coeff}${v}^{${inner * outer}}`,
      workingOut: `${k}^{${outer}} \\times ${v}^{${inner} \\times ${outer}}${NL}= ${coeff}${v}^{${inner * outer}}`,
      metadata: { topic: 'index-laws', difficulty },
    };
  }

  // A quotient inside the brackets: the division law simplifies it first,
  // then the power-of-a-power law raises what's left. \left( \right) isn't
  // one the Archivo parser takes, so this falls back to KaTeX deliberately —
  // plain parentheses around a \frac render undersized against its height.
  let inner, inner2, outer, res;
  do {
    inner = _.random(3, 10);
    inner2 = _.random(1, inner - 1);
    outer = _.random(2, 4);
    res = (inner - inner2) * outer;
  } while (res > 16);
  return {
    instruction: 'Remove the brackets and simplify',
    questionMath: `\\left( \\frac{${v}^{${inner}}}{${v}^{${inner2}}} \\right)^{${outer}}`,
    answer: `${v}^{${res}}`,
    workingOut: `(${v}^{${inner} - ${inner2}})^{${outer}}${NL}= (${v}^{${inner - inner2}})^{${outer}}${NL}= ${v}^{${res}}`,
    metadata: { topic: 'index-laws', difficulty },
  };
};
