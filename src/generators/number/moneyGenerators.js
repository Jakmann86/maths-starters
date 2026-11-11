// src/generators/number/moneyGenerators.js
//
// Profit and interest — Haese 10B, 10C and 10F:
//
//   profit-loss        selling price from a mark-up, percentage profit or
//                      loss, and the cost price back from the selling price
//   simple-interest    I = Prn forwards, the total over months, then the
//                      rate, the time or the principal back
//   compound-interest  value after n years, interest earned or depreciation,
//                      then the principal or the rate back
//
// All money is done in whole pence, and compound growth in BigInt, so an
// answer to the nearest penny is never a floating-point accident. The
// items and names are phrasing, not a question bank: every number is
// generated.

import _ from 'lodash';

const NL = '\n';

// Pence as money: £1,450 when whole pounds, £1,450.25 otherwise.
const comma = (n) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
export const pounds = (pence) => {
  const p = Math.round(pence);
  const whole = Math.floor(p / 100), rest = p % 100;
  return `£${comma(whole)}${rest ? `.${String(rest).padStart(2, '0')}` : ''}`;
};
// Always with pence, for an answer to the nearest penny.
const pennies = (pence) => {
  const p = Math.round(pence);
  return `£${comma(Math.floor(p / 100))}.${String(p % 100).padStart(2, '0')}`;
};
const moneyTex = (s) => `\\text{${s}}`;
// Pence as a plain number for the working: 1087.50, 272.
const mon = (pence) => (pence % 100 ? (pence / 100).toFixed(2) : String(pence / 100));
// A percentage held in tenths (72 is 7.2%), written without trailing zeros.
const pct = (tenths) => String(tenths / 10);
const multTex = (tenths, up) => String((1000 + (up ? tenths : -tenths)) / 1000);

const ITEMS = [
  ['a bike', 80, 600, 10], ['a jacket', 20, 150, 5], ['a sofa', 300, 2000, 50],
  ['a laptop', 200, 1200, 50], ['a painting', 100, 3000, 50], ['a used car', 1500, 15000, 500],
  ['a guitar', 60, 900, 10], ['a phone', 100, 900, 10],
];
const priceOf = ([, lo, hi, step]) => step * _.random(Math.ceil(lo / step), Math.floor(hi / step));
const cap = (s) => s[0].toUpperCase() + s.slice(1);

/* --------------------------------------------------------- profit-loss */
//
//   foundation  bought for £C and marked up or down by p%: the selling price
//   core        bought for £C, sold for £S: the percentage profit or loss
//   stretch     sold for £S at a p% profit or loss: the cost price

const FRIENDLY = [5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 60, 75, 80];

export const generateProfitLoss = (options = {}) => {
  const { difficulty = 'core' } = options;
  const meta = { topic: 'profit-loss', difficulty };

  for (;;) {
    const item = _.sample(ITEMS);
    const C = priceOf(item);
    const up = _.random(0, 1) === 1;

    if (difficulty === 'foundation') {
      const p = _.sample(up ? FRIENDLY : FRIENDLY.filter((x) => x <= 60));
      const S = C * (100 + (up ? p : -p)); // pence
      const story = up
        ? _.sample([`sells it at a ${p}% profit`, `marks it up by ${p}%`])
        : _.sample([`sells it at a ${p}% loss`, `marks it down by ${p}% in a sale`]);
      const m = multTex(p * 10, up);
      return {
        instruction: 'Find the selling price',
        questionText: `A shop buys ${item[0]} for ${pounds(C * 100)} and ${story}.`,
        answer: moneyTex(pounds(S)),
        workingOut: [`\\text{multiplier} = ${m}`, `${C} \\times ${m} = ${mon(S)}`].join(NL),
        metadata: meta,
      };
    }

    if (difficulty === 'core') {
      const p = _.random(0, 4) ? _.random(2, up ? 80 : 60) : _.random(4, up ? 160 : 120) / 2;
      const S = (C * (100 + (up ? p : -p))) / 100;
      if (!Number.isInteger(S) || S === C) continue;
      const D = Math.abs(S - C);
      const word = up ? 'profit' : 'loss';
      return {
        instruction: 'Find the percentage profit or loss',
        questionText: `A trader buys ${item[0]} for ${pounds(C * 100)} and sells it for ${pounds(S * 100)}.`,
        answer: `${p}\\% \\text{ ${word}}`,
        workingOut: [
          `\\text{${word}} = ${up ? `${S} - ${C}` : `${C} - ${S}`} = ${D}`,
          `\\frac{${D}}{${C}} \\times 100 = ${p}\\%`,
        ].join(NL),
        metadata: meta,
      };
    }

    // Stretch: back to the cost price.
    const p = _.random(0, 2) ? _.sample(FRIENDLY.filter((x) => x <= 60)) : _.random(2, 40);
    const S = (C * (100 + (up ? p : -p))) / 100;
    if (!Number.isInteger(S)) continue;
    const m = multTex(p * 10, up);
    return {
      instruction: 'Find the cost price',
      questionText: `${cap(item[0])} is sold for ${pounds(S * 100)} at a ${p}% ${up ? 'profit' : 'loss'}.`,
      answer: moneyTex(pounds(C * 100)),
      workingOut: [`\\text{multiplier} = ${m}`, `${S} \\div ${m} = ${C}`].join(NL),
      metadata: meta,
    };
  }
};

/* ----------------------------------------------------- simple-interest */
//
//   foundation  the interest on £P at r% for n whole years
//   core        the total to repay or the value of the investment, with the
//               time in months or years
//   stretch     the rate, the time or the principal, back from the interest

// A rate in tenths of a percent: whole percentages mostly, sometimes a half.
const rateTenths = (lo = 1, hi = 9) => (_.random(0, 3) ? 10 * _.random(lo, hi) : 10 * _.random(lo, hi - 1) + 5);
const principal = () => (_.random(0, 1) ? 100 * _.random(2, 100) : 50 * _.random(4, 60));

export const generateSimpleInterest = (options = {}) => {
  const { difficulty = 'core' } = options;
  const meta = { topic: 'simple-interest', difficulty };

  for (;;) {
    const P = principal();
    const t = rateTenths();
    const invest = _.random(0, 1) === 1;
    const verb = invest ? 'invested' : 'borrowed';

    if (difficulty === 'foundation') {
      const n = _.random(2, 10);
      const I = (P * t * n) / 10; // pence
      if (!Number.isInteger(I)) continue;
      return {
        instruction: invest ? 'Find the interest earned' : 'Find the interest charged',
        questionText: `${pounds(P * 100)} is ${verb} at ${pct(t)}% per year simple interest for ${n} years.`,
        answer: moneyTex(pounds(I)),
        workingOut: [`I = Prn`, `I = ${P} \\times ${t / 1000} \\times ${n} = ${mon(I)}`].join(NL),
        metadata: meta,
      };
    }

    if (difficulty === 'core') {
      const months = _.random(0, 1) ? _.sample([6, 9, 15, 18, 20, 21, 27, 30, 40, 42, 45]) : 12 * _.random(2, 8);
      const I = (P * t * months) / 120; // pence
      if (!Number.isInteger(I)) continue;
      const time = months % 12 === 0 ? `${months / 12} years` : `${months} months`;
      const nTex = months % 12 === 0 ? `${months / 12}` : `\\frac{${months}}{12}`;
      return {
        instruction: invest ? 'Find the value of the investment at the end' : 'Find the total amount to repay',
        questionText: `${pounds(P * 100)} is ${verb} at ${pct(t)}% per year simple interest for ${time}.`,
        answer: moneyTex(pounds(P * 100 + I)),
        workingOut: [`I = ${P} \\times ${t / 1000} \\times ${nTex} = ${mon(I)}`, `${P} + ${mon(I)} = ${mon(P * 100 + I)}`].join(NL),
        metadata: meta,
      };
    }

    // Stretch
    const n = _.random(2, 10);
    const I = (P * t * n) / 10; // pence
    if (!Number.isInteger(I)) continue;
    const kind = _.sample(['rate', 'time', 'principal']);
    if (kind === 'rate') {
      return {
        instruction: 'Find the rate of simple interest per year',
        questionText: `${pounds(P * 100)} ${invest ? 'earns' : 'is charged'} ${pounds(I)} simple interest in ${n} years.`,
        answer: `${pct(t)}\\%`,
        workingOut: [`${mon(I)} = ${P} \\times r \\times ${n}`, `r = ${t / 1000}`].join(NL),
        metadata: meta,
      };
    }
    if (kind === 'time') {
      return {
        instruction: 'Find how many years it takes',
        questionText: `${pounds(P * 100)} is ${verb} at ${pct(t)}% per year simple interest. The interest comes to ${pounds(I)}.`,
        answer: `${n}`,
        answerUnits: 'years',
        workingOut: [`${mon(I)} = ${P} \\times ${t / 1000} \\times n`, `n = ${n}`].join(NL),
        metadata: meta,
      };
    }
    return {
      instruction: invest ? 'Find the amount invested' : 'Find the amount borrowed',
      questionText: `At ${pct(t)}% per year simple interest, the interest over ${n} years is ${pounds(I)}.`,
      answer: moneyTex(pounds(P * 100)),
      workingOut: [`${mon(I)} = P \\times ${t / 1000} \\times ${n}`, `P = ${P}`].join(NL),
      metadata: meta,
    };
  }
};

/* --------------------------------------------------- compound-interest */
//
//   foundation  the value of £P after n years at r% compound interest
//   core        the interest earned, or the value after depreciation
//   stretch     the principal needed for a target, or the annual rate from
//               the start and end values

// P × (1 ± t/1000)^n in pence, rounded half up, exactly.
export const compoundPence = (P, t, n, up = true) => {
  const num = BigInt(P) * 100n * BigInt(1000 + (up ? t : -t)) ** BigInt(n);
  const den = 1000n ** BigInt(n);
  return Number((2n * num + den) / (2n * den));
};
// A / (1 + t/1000)^n in pence, rounded half up, exactly.
const presentPence = (A, t, n) => {
  const num = BigInt(A) * 100n * 1000n ** BigInt(n);
  const den = BigInt(1000 + t) ** BigInt(n);
  return Number((2n * num + den) / (2n * den));
};

const ASSETS = [['A car', 8000, 30000, 500], ['A van', 10000, 35000, 500], ['A motorbike', 3000, 12000, 250], ['A laptop', 600, 2400, 50], ['A tractor', 20000, 60000, 1000]];

export const generateCompoundInterest = (options = {}) => {
  const { difficulty = 'core' } = options;
  const meta = { topic: 'compound-interest', difficulty };
  const P = principal();
  const t = rateTenths(1, 8);
  const n = _.random(2, 6);

  if (difficulty === 'foundation') {
    const V = compoundPence(P, t, n);
    const m = multTex(t, true);
    return {
      instruction: 'Find the value of the investment, to the nearest penny',
      questionText: `${pounds(P * 100)} is invested for ${n} years at ${pct(t)}% per year compound interest.`,
      answer: moneyTex(pennies(V)),
      workingOut: [`\\text{multiplier} = ${m}`, `${P} \\times (${m})^{${n}} = ${(V / 100).toFixed(2)}`].join(NL),
      metadata: meta,
    };
  }

  if (difficulty === 'core') {
    if (_.random(0, 1)) {
      const V = compoundPence(P, t, n);
      const m = multTex(t, true);
      return {
        instruction: 'Find the interest earned, to the nearest penny',
        questionText: `${pounds(P * 100)} is invested for ${n} years at ${pct(t)}% per year compound interest.`,
        answer: moneyTex(pennies(V - P * 100)),
        workingOut: [`${P} \\times (${m})^{${n}} = ${(V / 100).toFixed(2)}`, `${(V / 100).toFixed(2)} - ${P} = ${((V - P * 100) / 100).toFixed(2)}`].join(NL),
        metadata: meta,
      };
    }
    const asset = _.sample(ASSETS);
    const A = priceOf(asset);
    const d = 10 * _.random(5, 25);
    const V = compoundPence(A, d, n, false);
    const m = multTex(d, false);
    return {
      instruction: 'Find its value, to the nearest penny',
      questionText: `${asset[0]} is bought for ${pounds(A * 100)}. It loses ${pct(d)}% of its value each year. What is it worth after ${n} years?`,
      answer: moneyTex(pennies(V)),
      workingOut: [`\\text{multiplier} = ${m}`, `${A} \\times (${m})^{${n}} = ${(V / 100).toFixed(2)}`].join(NL),
      metadata: meta,
    };
  }

  // Stretch
  if (_.random(0, 1)) {
    const A = 1000 * _.random(2, 40);
    const N = _.random(3, 12);
    const X = presentPence(A, t, N);
    const m = multTex(t, true);
    return {
      instruction: 'Find the amount to invest now, to the nearest penny',
      questionText: `How much must be invested now at ${pct(t)}% per year compound interest to be worth ${pounds(A * 100)} in ${N} years?`,
      answer: moneyTex(pennies(X)),
      workingOut: [`x \\times (${m})^{${N}} = ${A}`, `x = ${A} \\div (${m})^{${N}} = ${(X / 100).toFixed(2)}`].join(NL),
      metadata: meta,
    };
  }
  for (;;) {
    const r = 10 * _.random(2, 12) + _.sample([0, 0, 5]);
    const N = _.random(3, 10);
    const S = 500 * _.random(2, 40);
    const E = Math.round(compoundPence(S, r, N) / 100); // the end value, to the pound
    // The rate read back from rounded values must still round to r.
    const back = ((E / S) ** (1 / N) - 1) * 1000;
    if (Math.abs(back - r) > 0.3) continue;
    return {
      instruction: 'Find the annual rate of interest, to 1 decimal place',
      questionText: `${pounds(S * 100)} grows to ${pounds(E * 100)} in ${N} years with compound interest.`,
      answer: `${(r / 10).toFixed(1)}\\%`,
      workingOut: [`${S} \\times x^{${N}} = ${E}`, `x = \\sqrt[${N}]{\\frac{${E}}{${S}}} = ${(1 + back / 1000).toFixed(4)}`, `r = ${(r / 10).toFixed(1)}\\%`].join(NL),
      metadata: meta,
    };
  }
};
