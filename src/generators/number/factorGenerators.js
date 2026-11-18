// src/generators/number/factorGenerators.js
//
// Factors and multiples — Haese Assumed Knowledge (Number) B–C, syllabus
// E1.1:
//
//   prime-factors  a number as a product of primes, then in index form,
//                  then whether a number is a factor of one given by its
//                  prime factors
//   hcf-lcm        the HCF or LCM of two numbers by listing, then both from
//                  prime factorisations, then a problem that needs one
//
// Every number is built from its prime factors, so its factorisation is
// known before it is printed.

import _ from 'lodash';
import { gcd, lcm } from '../shared';

const NL = '\n';
const PRIMES = [2, 3, 5, 7, 11, 13];

/** Prime factors of n, smallest first, with repeats. */
export function primeFactors(n) {
  const out = [];
  let m = n;
  for (let p = 2; p * p <= m; p += 1) while (m % p === 0) { out.push(p); m /= p; }
  if (m > 1) out.push(m);
  return out;
}
const times = (xs) => xs.join(' \\times ');
/** 2^3 × 3 × 5: index form, smallest prime first. */
export function indexForm(n) {
  const counts = _.countBy(primeFactors(n));
  return times(Object.keys(counts).map(Number).sort((a, b) => a - b).map((p) => (counts[p] > 1 ? `${p}^${counts[p]}` : String(p))));
}
/** n divided by its primes in turn, one line each. */
const ladder = (n) => {
  const out = [];
  let m = n;
  primeFactors(n).slice(0, -1).forEach((p) => { out.push(`${m} \\div ${p} = ${m / p}`); m /= p; });
  return out;
};
// "HCF = 2^2 × 3 = 12", or "HCF = 7" when the index form is the number.
const valued = (name, n) => (indexForm(n) === String(n) ? `\\text{${name}} = ${n}` : `\\text{${name}} = ${indexForm(n)} = ${n}`);
const build = (exps) => Object.entries(exps).reduce((v, [p, e]) => v * Number(p) ** e, 1);

/* -------------------------------------------------------- prime-factors */
//
//   foundation  up to 200, as a product of primes
//   core        up to 2000, in index form, with a repeated prime
//   stretch     N given in index form: is d a factor of N? Yes when each
//               of d's prime powers is in N; no for a power too many, or a
//               prime N does not have

export const generatePrimeFactors = (options = {}) => {
  const { difficulty = 'core' } = options;
  const metadata = { topic: 'prime-factors', difficulty };

  for (;;) {
    if (difficulty === 'foundation') {
      const n = _.random(12, 200);
      const fs = primeFactors(n);
      if (fs.length < 3 || fs.at(-1) > 13) continue;
      return {
        instruction: 'Write as a product of prime factors',
        questionMath: String(n),
        answer: times(fs),
        workingOut: [...ladder(n), times(fs)].join(NL),
        metadata,
      };
    }

    if (difficulty === 'core') {
      const n = _.random(100, 2000);
      const fs = primeFactors(n);
      const counts = Object.values(_.countBy(fs));
      // At least three primes, one of them repeated, none above 13.
      if (fs.length < 4 || fs.at(-1) > 13 || Math.max(...counts) < 2 || new Set(fs).size < 2) continue;
      return {
        instruction: 'Write as a product of prime factors, in index form',
        questionMath: String(n),
        answer: indexForm(n),
        workingOut: [...ladder(n), `= ${times(fs)}`, `= ${indexForm(n)}`].join(NL),
        metadata,
      };
    }

    // stretch: is d a factor of N? Read from N's prime factorisation,
    // never by dividing it out.
    const primes = _.sampleSize([2, 3, 5, 7], _.random(2, 3)).sort((a, b) => a - b);
    const exps = Object.fromEntries(primes.map((p) => [p, _.random(1, 4)]));
    const dExps = Object.fromEntries(primes.map((p) => [p, _.random(0, exps[p])]));
    const yes = _.random(0, 1) === 1;
    let reason = '';
    if (!yes) {
      // One reason only: a power one too many, or a prime N does not have.
      const missing = [2, 3, 5, 7, 11].filter((p) => !primes.includes(p));
      if (_.random(0, 1) === 1) {
        const q = _.sample(missing.slice(0, 2));
        dExps[q] = 1;
        reason = `\\text{, but } N \\text{ has no } ${q}`;
      } else {
        const p = _.sample(primes);
        dExps[p] = exps[p] + 1;
        reason = `\\text{, but } N \\text{ has only } ${exps[p] > 1 ? `${p}^${exps[p]}` : p}`;
      }
    }
    const d = build(dExps);
    const n = build(exps);
    // A divisor worth testing: two different primes at least, from 12 to 300.
    if (d < 12 || d > 300 || d === n || Object.values(dExps).filter((e) => e > 0).length < 2) continue;
    const answer = yes ? `\\text{Yes: } ${d} = ${indexForm(d)}` : `\\text{No: } ${d} = ${indexForm(d)}${reason}`;
    return {
      instruction: 'Use the prime factors to decide',
      questionMath: [`N = ${times(primes.map((p) => (exps[p] > 1 ? `${p}^${exps[p]}` : String(p))))}`, `\\text{Is } ${d} \\text{ a factor of } N?`].join(NL),
      answer,
      workingOut: [`${d} = ${indexForm(d)}`, answer].join(NL),
      metadata,
    };
  }
};

/* -------------------------------------------------------------- hcf-lcm */
//
//   foundation  the HCF or the LCM of two numbers up to 48, by listing
//   core        both, from the two numbers' prime factorisations
//   stretch     a problem: buses or bells together again (LCM), or the
//               longest equal pieces two lengths cut into (HCF)

const factorsOf = (n) => _.range(1, n + 1).filter((d) => n % d === 0);
const multiplesTo = (n, top) => _.range(n, top + 1, n);

export const generateHcfLcm = (options = {}) => {
  const { difficulty = 'core' } = options;
  const metadata = { topic: 'hcf-lcm', difficulty };
  const findL = _.random(0, 1) === 1;

  for (;;) {
    if (difficulty === 'foundation') {
      const [a, b] = _.sampleSize(_.range(4, 49), 2).sort((x, y) => x - y);
      const h = gcd(a, b), l = lcm(a, b);
      // A common factor beyond 1, neither a multiple of the other, and a
      // list short enough to write.
      if (h === 1 || b % a === 0) continue;
      if (findL) {
        if (l > 120 || l / a > 10) continue;
        return {
          instruction: 'Find the lowest common multiple',
          questionMath: `${a} \\text{ and } ${b}`,
          answer: String(l),
          workingOut: [`${a}: ${multiplesTo(a, l).join(', ')}`, `${b}: ${multiplesTo(b, l).join(', ')}`, `\\text{LCM} = ${l}`].join(NL),
          metadata,
        };
      }
      if (b > 40) continue;
      return {
        instruction: 'Find the highest common factor',
        questionMath: `${a} \\text{ and } ${b}`,
        answer: String(h),
        workingOut: [`${a}: ${factorsOf(a).join(', ')}`, `${b}: ${factorsOf(b).join(', ')}`, `\\text{HCF} = ${h}`].join(NL),
        metadata,
      };
    }

    if (difficulty === 'core') {
      const pool = _.sampleSize([2, 3, 5, 7], 3);
      const ea = Object.fromEntries(pool.map((p) => [p, _.random(0, 3)]));
      const eb = Object.fromEntries(pool.map((p) => [p, _.random(0, 3)]));
      const a = build(ea), b = build(eb);
      const h = gcd(a, b), l = lcm(a, b);
      if (a === b || h === 1 || a % b === 0 || b % a === 0 || l > 20000 || a < 20 || b < 20) continue;
      if (primeFactors(a).length < 3 || primeFactors(b).length < 3) continue;
      return {
        instruction: 'Find the HCF and the LCM',
        questionMath: `${a} = ${indexForm(a)}, \\ ${b} = ${indexForm(b)}`,
        answer: `\\text{HCF} = ${h}, \\ \\text{LCM} = ${l}`,
        workingOut: [
          valued('HCF', h),
          valued('LCM', l),
          `\\text{HCF} = ${h}, \\ \\text{LCM} = ${l}`,
        ].join(NL),
        metadata,
      };
    }

    // stretch
    if (findL) {
      const [a, b] = _.sampleSize(_.range(6, 31), 2).sort((x, y) => x - y);
      const l = lcm(a, b);
      if (gcd(a, b) === 1 || b % a === 0 || l > 180) continue;
      const buses = _.random(0, 1) === 1;
      const text = buses
        ? `Two buses leave a bus station together. One leaves every ${a} minutes and the other every ${b} minutes. After how many minutes do they next leave together?`
        : `Two lights flash together. One flashes every ${a} seconds and the other every ${b} seconds. After how many seconds do they next flash together?`;
      return {
        instruction: 'Find when they are next together',
        questionText: text,
        answer: String(l), answerUnits: buses ? 'minutes' : 'seconds',
        workingOut: [`${a} = ${indexForm(a)}, \\ ${b} = ${indexForm(b)}`, valued('LCM', l)].join(NL),
        metadata,
      };
    }
    const [a, b] = _.sampleSize(_.range(24, 241), 2).sort((x, y) => x - y);
    const h = gcd(a, b);
    if (h < 4 || b % a === 0 || a / h > 12 || b / h > 15) continue;
    return {
      instruction: 'Find the longest equal pieces',
      questionText: `Two ribbons are ${a} cm and ${b} cm long. Both are cut into pieces of the same length, as long as possible, with nothing left over. How long is each piece?`,
      answer: String(h), answerUnits: 'cm',
      workingOut: [`${a} = ${indexForm(a)}, \\ ${b} = ${indexForm(b)}`, valued('HCF', h)].join(NL),
      metadata,
    };
  }
};
