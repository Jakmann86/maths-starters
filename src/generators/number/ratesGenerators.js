// src/generators/number/ratesGenerators.js
//
// Money and rates — syllabus E1.11 (rates) and E1.15 (money), Rayner 2
// (foreign exchange):
//
//   exchange-rates  pounds into another currency, then back, then where
//                   something is cheaper and by how much
//   rates           pay or flow at a rate, then the time to fill or the fuel
//                   for a journey, then overtime pay or the cost of the fuel
//
// Money is held in whole pence (or cents, or yen), so every amount printed
// is exact.

import _ from 'lodash';
import { pounds } from './moneyGenerators';

const NL = '\n';
const num = (v) => String(Number(v.toFixed(6)));
// A sum of money in a working line: 12.40, or 434 when whole.
const sum = (minor, decimals = 2) => (decimals === 0 || minor % 100 === 0 ? String(decimals === 0 ? minor : minor / 100) : (minor / 100).toFixed(2));

// [symbol, name, rate range in hundredths (or whole yen), places, decimals]
const CURRENCIES = [
  { sym: '€', name: 'euros', rate: [108, 125], places: ['Paris', 'Madrid', 'Rome', 'Berlin'], dp: 2 },
  { sym: '$', name: 'US dollars', rate: [120, 135], places: ['New York', 'Chicago', 'Miami'], dp: 2 },
  { sym: '¥', name: 'yen', rate: [150, 200], places: ['Tokyo', 'Osaka'], dp: 0 },
];
// Money in a currency: €290, €290.50, ¥4,560.
const cash = (c, minor) => {
  const whole = c.dp === 0 ? minor : Math.floor(minor / 100);
  const part = c.dp === 0 || minor % 100 === 0 ? '' : `.${String(minor % 100).padStart(2, '0')}`;
  return `${c.sym}${String(whole).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}${part}`;
};
const rateText = (c, r) => (c.dp === 0 ? String(r) : (r / 100).toFixed(2));
// A dollar sign inside \text must be escaped, or KaTeX reads it as maths.
const tx = (s) => `\\text{${s.replace(/\$/g, '\\$')}}`;

/* ------------------------------------------------------- exchange-rates */
//
//   foundation  pounds into the other currency: multiply
//   core        the other currency into pounds: divide
//   stretch     a price in London and one abroad: where is it cheaper,
//               and by how much in pounds

export const generateExchangeRates = (options = {}) => {
  const { difficulty = 'core' } = options;
  const metadata = { topic: 'exchange-rates', difficulty };

  for (;;) {
    const c = _.sample(CURRENCIES);
    const r = _.random(...c.rate); // hundredths, or whole yen
    // Foreign minor units for p pence: cents p × r / 100, or yen p × r / 100.
    const abroad = (p) => p * r / 100;
    const ex = `£1 = ${c.sym}${rateText(c, r)}`;

    if (difficulty === 'foundation' || difficulty === 'core') {
      const p = _.random(2, 90) * _.sample([500, 1000, 1000, 100]); // pence
      const f = abroad(p);
      if (!Number.isInteger(f) || p > 90000) continue;
      if (difficulty === 'foundation') {
        return {
          instruction: `Change the pounds into ${c.name}`,
          questionText: `The exchange rate is ${ex}. Change ${pounds(p)} into ${c.name}.`,
          // KaTeX has no euro sign, so the currency is the answer's unit,
          // as any other unit is: 610.20 euros.
          answer: sum(f, c.dp), answerUnits: c.name,
          workingOut: `${sum(p)} \\times ${rateText(c, r)} = ${sum(f, c.dp)}`,
          metadata,
        };
      }
      return {
        instruction: `Change the ${c.name} into pounds`,
        questionText: `The exchange rate is ${ex}. Change ${cash(c, f)} into pounds.`,
        answer: tx(pounds(p)),
        workingOut: [`${sum(f, c.dp)} \\div ${rateText(c, r)} = ${sum(p)}`, tx(pounds(p))].join(NL),
        metadata,
      };
    }

    // stretch: the same thing priced in both places, within 15%.
    const [item, where] = _.sample([['A pair of trainers', 'Where are they'], ['A watch', 'Where is it'], ['A jacket', 'Where is it'], ['A pair of headphones', 'Where are they'], ['A guitar', 'Where is it']]);
    const home = _.random(30, 300) * 100 + _.sample([0, 0, 50, 99]);
    const equal = home + _.sample([-1, 1]) * _.random(Math.ceil(home * 0.01), Math.floor(home * 0.15));
    const f = abroad(equal);
    if (!Number.isInteger(f) || equal <= 0) continue;
    const place = _.sample(c.places);
    const cheaper = equal < home ? place : 'London';
    const by = Math.abs(home - equal);
    const answer = tx(`${cheaper}, by ${pounds(by)}`);
    return {
      instruction: 'Find where it is cheaper',
      questionText: `${item} costs ${pounds(home)} in London and ${cash(c, f)} in ${place}. The exchange rate is ${ex}. ${where} cheaper, and by how much in pounds?`,
      answer,
      workingOut: [
        `${sum(f, c.dp)} \\div ${rateText(c, r)} = ${sum(equal)}`,
        `${sum(Math.max(home, equal))} - ${sum(Math.min(home, equal))} = ${sum(by)}`,
        answer,
      ].join(NL),
      metadata,
    };
  }
};

/* ---------------------------------------------------------------- rates */
//
//   foundation  pay for so many hours, or water in so many minutes
//   core        the time to fill a tank, or the fuel for a journey at so
//               many litres per 100 km
//   stretch     a week's pay with overtime at time and a half, or the cost
//               of the fuel for a journey

const NAMES = ['Ana', 'Ben', 'Sam', 'Priya', 'Leo', 'Mia', 'Kofi', 'Zara'];
const pronoun = { Ana: 'she', Priya: 'she', Mia: 'she', Zara: 'she', Ben: 'he', Sam: 'he', Leo: 'he', Kofi: 'he' };

export const generateRates = (options = {}) => {
  const { difficulty = 'core' } = options;
  const metadata = { topic: 'rates', difficulty };
  const pick = _.random(0, 1);

  for (;;) {
    if (difficulty === 'foundation') {
      if (pick === 0) {
        const who = _.sample(NAMES);
        const rate = _.random(85, 250) * 10; // pence an hour
        const h = _.random(6, 40);
        return {
          instruction: 'Find the pay',
          questionText: `${who} earns ${pounds(rate)} an hour. How much does ${pronoun[who]} earn for ${h} hours?`,
          answer: tx(pounds(rate * h)),
          workingOut: [`${sum(rate)} \\times ${h} = ${sum(rate * h)}`, tx(pounds(rate * h))].join(NL),
          metadata,
        };
      }
      const rate = _.random(4, 40);
      const t = _.random(5, 45);
      return {
        instruction: 'Find how much water',
        questionText: `Water flows into a tank at ${rate} litres per minute. How much flows in during ${t} minutes?`,
        answer: String(rate * t), answerUnits: 'litres',
        workingOut: `${rate} \\times ${t} = ${rate * t}`,
        metadata,
      };
    }

    if (difficulty === 'core') {
      if (pick === 0) {
        const rate = _.random(4, 40);
        const t = _.random(8, 90);
        return {
          instruction: 'Find how long it takes',
          questionText: `A tank holds ${rate * t} litres. Water flows in at ${rate} litres per minute. How long does the empty tank take to fill?`,
          answer: String(t), answerUnits: 'minutes',
          workingOut: `${rate * t} \\div ${rate} = ${t}`,
          metadata,
        };
      }
      const per100 = _.random(40, 120) / 10; // litres per 100 km
      const km = _.random(6, 90) * 10;
      const litres = per100 * km / 100;
      if (Math.abs(litres * 100 - Math.round(litres * 100)) > 1e-9 || km % 100 === 0) continue;
      return {
        instruction: 'Find how much fuel',
        questionText: `A car uses ${num(per100)} litres of fuel per 100 km. How much fuel does it use on a ${km} km journey?`,
        answer: num(litres), answerUnits: 'litres',
        workingOut: [`${km} \\div 100 = ${num(km / 100)}`, `${num(km / 100)} \\times ${num(per100)} = ${num(litres)}`].join(NL),
        metadata,
      };
    }

    // stretch
    if (pick === 0) {
      const who = _.sample(NAMES);
      const rate = _.random(45, 125) * 20; // pence an hour, even, so 1.5 × it is whole
      const base = _.sample([35, 36, 37, 38, 40]);
      const extra = _.random(2, 10);
      const over = rate * 3 / 2;
      const total = rate * base + over * extra;
      return {
        instruction: 'Find the pay for the week',
        questionText: `${who} is paid ${pounds(rate)} an hour for the first ${base} hours each week, and time and a half after that. One week ${pronoun[who]} works ${base + extra} hours. How much is ${pronoun[who]} paid?`,
        answer: tx(pounds(total)),
        workingOut: [
          `${base} \\times ${sum(rate)} = ${sum(rate * base)}`,
          `${sum(rate)} \\times 1.5 = ${sum(over)}`,
          `${extra} \\times ${sum(over)} = ${sum(over * extra)}`,
          `${sum(rate * base)} + ${sum(over * extra)} = ${sum(total)}`,
          tx(pounds(total)),
        ].join(NL),
        metadata,
      };
    }
    const per100 = _.random(40, 100) / 10;
    const km = _.random(6, 60) * 20;
    const litres = per100 * km / 100;
    const price = _.random(120, 199); // pence a litre
    const cost = litres * price;
    if (Math.abs(litres * 10 - Math.round(litres * 10)) > 1e-9 || Math.abs(cost - Math.round(cost)) > 1e-9) continue;
    const pence = Math.round(cost);
    return {
      instruction: 'Find the cost of the fuel',
      questionText: `A car uses ${num(per100)} litres of fuel per 100 km. Fuel costs ${pounds(price)} a litre. How much does the fuel for a ${km} km journey cost?`,
      answer: tx(pounds(pence)),
      workingOut: [
        `${num(km / 100)} \\times ${num(per100)} = ${num(litres)}\\text{ litres}`,
        `${num(litres)} \\times ${sum(price)} = ${sum(pence)}`,
        tx(pounds(pence)),
      ].join(NL),
      metadata,
    };
  }
};
