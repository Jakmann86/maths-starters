// src/generators/number/indexLawGenerators.js
//
// Index laws — Haese 6B and the Y9 Unit 1 do-nows.
//
//   index-laws-multiply-divide multiplying and dividing powers of one base
//   index-laws-power           a power of a power
//   index-laws-coefficients    the number in front has to be dealt with too
//   index-laws-missing-power   the laws run backwards: find n
//   exponential-equations      the unknown is the power: change the base
//
// Every question is built from its answer, so it is correct by construction.

import _ from 'lodash';
import { gcd } from '../shared';

const NL = '\n';
const VARS = ['x', 'y', 'a', 'b', 'm', 'p', 'k', 't'];

// c v^e with a coefficient of 1 dropped, and v^1 written as v.
const term = (c, v, e) => `${c === 1 ? '' : c}${v}${e === 1 ? '' : `^{${e}}`}`;
// a/b as an index or an answer: integer, or a signed fraction.
const fracTex = (n, d) => {
  if (d < 0) { n = -n; d = -d; }
  const g = gcd(n, d) || 1;
  n /= g; d /= g;
  if (d === 1) return `${n}`;
  return n < 0 ? `-\\frac{${-n}}{${d}}` : `\\frac{${n}}{${d}}`;
};

/* ---------------------------------------------- multiplying and dividing powers */
//
// The skill-ladder review split Haese 6B's index laws by law, so a band
// never changes which law it is asking about.
//
//   foundation  a number base, evaluated        2^5 × 2^3,  10^7 ÷ 10^4
//   core        a letter, one law               x^5 × x^3,  y^9 / y^4
//   stretch     three or four terms, both laws  x^7 × x^4 / x^5,  a^5 a^3 / a^2 a^4
const fracOrDiv = (a, b) => (_.random(0, 1) ? `\\frac{${a}}{${b}}` : `${a} \\div ${b}`);

export const generateIndexLawsMultiplyDivide = (options = {}) => {
  const { difficulty = 'core' } = options;
  const meta = { topic: 'index-laws-multiply-divide', difficulty };

  if (difficulty === 'foundation') {
    // The cap is what limits variety: 10^6 is fine, 7^9 is not a starter.
    const base = _.sample([2, 3, 4, 5, 6, 7, 10]);
    const multiply = _.random(0, 1) === 1;
    let m; let n; let res;
    do {
      if (multiply) { m = _.random(2, 9); n = _.random(2, 9); res = m + n; }
      else { m = _.random(4, 14); n = _.random(2, m - 1); res = m - n; }
    } while (base ** res > 100000 || res < 1);
    const [A, B] = [`${base}^{${m}}`, `${base}^{${n}}`];
    return {
      instruction: 'Simplify, giving your answer as a whole number',
      questionMath: multiply ? `${A} \\times ${B}` : fracOrDiv(A, B),
      answer: String(base ** res),
      workingOut: `${base}^{${m} ${multiply ? '+' : '-'} ${n}} = ${base}^{${res}}${NL}= ${base ** res}`,
      metadata: meta,
    };
  }

  const v = _.sample(VARS);
  const pow = (e) => (e === 1 ? v : `${v}^{${e}}`);

  if (difficulty === 'core') {
    const multiply = _.random(0, 1) === 1;
    let m; let n; let res;
    do {
      m = _.random(2, 12);
      n = _.random(2, 9);
      res = multiply ? m + n : m - n;
    } while (res < 2 || res > 18);
    return {
      instruction: 'Simplify',
      questionMath: multiply ? `${pow(m)} \\times ${pow(n)}` : fracOrDiv(pow(m), pow(n)),
      answer: pow(res),
      workingOut: `${v}^{${m} ${multiply ? '+' : '-'} ${n}}${NL}= ${pow(res)}`,
      metadata: meta,
    };
  }

  // Stretch: three terms (x^p × x^q ÷ x^r, either order), or four over a
  // fraction line (x^p × x^q over x^r × x^s).
  for (;;) {
    const [p, q, r, t] = [_.random(2, 9), _.random(2, 9), _.random(2, 9), _.random(1, 6)];
    const four = _.random(0, 1) === 1;
    const res = four ? p + q - r - t : p + q - r;
    if (res < 1 || res > 16) continue;
    if (four) {
      return {
        instruction: 'Simplify',
        questionMath: `\\frac{${pow(p)} \\times ${pow(q)}}{${pow(r)} \\times ${pow(t)}}`,
        answer: pow(res),
        workingOut: `\\frac{${v}^{${p + q}}}{${v}^{${r + t}}}${NL}= ${pow(res)}`,
        metadata: meta,
      };
    }
    const divideFirst = _.random(0, 1) === 1;
    return {
      instruction: 'Simplify',
      questionMath: divideFirst ? `\\frac{${pow(p)}}{${pow(r)}} \\times ${pow(q)}` : `${pow(p)} \\times ${pow(q)} \\div ${pow(r)}`,
      answer: pow(res),
      workingOut: `${v}^{${divideFirst ? `${p} - ${r} + ${q}` : `${p} + ${q} - ${r}`}}${NL}= ${pow(res)}`,
      metadata: meta,
    };
  }
};

/* ---------------------------------------------------------- a power of a power */
//
//   foundation  one letter                       (t^8)^2          -> t^16
//   core        a coefficient raised too         (4a^3)^2         -> 16a^6
//   stretch     two letters, or a fraction       (3a^2 b)^3,  (2a^3/b^2)^3
export const generateIndexLawsPower = (options = {}) => {
  const { difficulty = 'core' } = options;
  const meta = { topic: 'index-laws-power', difficulty };
  const [v, w] = _.sampleSize(VARS, 2).sort();
  const instruction = 'Remove the brackets and simplify';

  if (difficulty === 'foundation') {
    const [inner, outer] = [_.random(2, 9), _.random(2, 6)];
    return {
      instruction,
      questionMath: `(${v}^{${inner}})^{${outer}}`,
      answer: `${v}^{${inner * outer}}`,
      workingOut: `${v}^{${inner} \\times ${outer}}${NL}= ${v}^{${inner * outer}}`,
      metadata: meta,
    };
  }
  if (difficulty === 'core') {
    // Forgetting to raise the coefficient is the error worth catching.
    for (;;) {
      const k = _.sample([2, 3, 4, 5, 6, 7, 10]);
      const [inner, outer] = [_.random(2, 6), _.random(2, 4)];
      if (k ** outer > 2500) continue;
      return {
        instruction,
        questionMath: `(${k}${v}^{${inner}})^{${outer}}`,
        answer: `${k ** outer}${v}^{${inner * outer}}`,
        workingOut: `${k}^{${outer}} \\times ${v}^{${inner} \\times ${outer}}${NL}= ${k ** outer}${v}^{${inner * outer}}`,
        metadata: meta,
      };
    }
  }
  for (;;) {
    const k = _.sample([2, 3, 4, 5]);
    const outer = _.random(2, 4);
    if (k ** outer > 1000) continue;
    const [e1, e2] = [_.random(1, 5), _.random(1, 4)];
    const p = (x, e) => (e === 1 ? x : `${x}^{${e}}`);
    if (_.random(0, 1)) {
      // (k v^e1 w^e2)^outer
      return {
        instruction,
        questionMath: `(${k}${p(v, e1)}${p(w, e2)})^{${outer}}`,
        answer: `${k ** outer}${p(v, e1 * outer)}${p(w, e2 * outer)}`,
        workingOut: `${k}^{${outer}} \\times ${v}^{${e1} \\times ${outer}} \\times ${w}^{${e2} \\times ${outer}}${NL}= ${k ** outer}${p(v, e1 * outer)}${p(w, e2 * outer)}`,
        metadata: meta,
      };
    }
    // (k v^e1 / w^e2)^outer
    return {
      instruction,
      questionMath: `\\left(\\frac{${k}${p(v, e1)}}{${p(w, e2)}}\\right)^{${outer}}`,
      answer: `\\frac{${k ** outer}${p(v, e1 * outer)}}{${p(w, e2 * outer)}}`,
      workingOut: `\\frac{${k}^{${outer}} \\times ${v}^{${e1} \\times ${outer}}}{${w}^{${e2} \\times ${outer}}}${NL}= \\frac{${k ** outer}${p(v, e1 * outer)}}{${p(w, e2 * outer)}}`,
      metadata: meta,
    };
  }
};

/* ------------------------------------------------- index laws with coefficients */
//
//   foundation  multiply or divide two terms               4a³ × 5a²,  20a⁷ / 4a³
//   core        a bracket raised to a power, then × or ÷    (2y³)³ / 4y⁵
//   stretch     a negative or a fractional index            (3m⁴)² / 9m⁻²,  (27x⁶)^(2/3)
//
// A bare (3x⁴)² is not here: index-laws-power asks that at Core. Core
// chains it into a second law instead.

export const generateIndexLawsCoefficients = (options = {}) => {
  const { difficulty = 'core' } = options;
  const v = _.sample(VARS);

  if (difficulty === 'foundation') {
    if (_.random(0, 1)) {
      const [c1, c2] = [_.random(2, 9), _.random(2, 9)];
      const [e1, e2] = [_.random(2, 9), _.random(2, 9)];
      return {
        instruction: 'Simplify fully',
        questionMath: `${term(c1, v, e1)} \\times ${term(c2, v, e2)}`,
        answer: term(c1 * c2, v, e1 + e2),
        workingOut: `${c1} \\times ${c2} = ${c1 * c2}${NL}${v}^{${e1}} \\times ${v}^{${e2}} = ${v}^{${e1 + e2}}${NL}= ${term(c1 * c2, v, e1 + e2)}`,
        metadata: { topic: 'index-laws-coefficients', difficulty },
      };
    }
    const q = _.random(2, 9);
    const c2 = _.random(2, 9);
    const e2 = _.random(1, 6);
    const e1 = e2 + _.random(1, 7);
    const top = term(q * c2, v, e1);
    const bottom = term(c2, v, e2);
    return {
      instruction: 'Simplify fully',
      // Always over a fraction bar: 14m^5 ÷ 7m^3 read strictly left to right
      // is 14m^5 ÷ 7 × m^3, and a starter should not hinge on that.
      questionMath: `\\frac{${top}}{${bottom}}`,
      answer: term(q, v, e1 - e2),
      workingOut: `${q * c2} \\div ${c2} = ${q}${NL}${v}^{${e1}} \\div ${v}^{${e2}} = ${v}^{${e1 - e2}}${NL}= ${term(q, v, e1 - e2)}`,
      metadata: { topic: 'index-laws-coefficients', difficulty },
    };
  }

  if (difficulty === 'core') {
    for (;;) {
      const k = _.random(2, 5);
      const o = _.random(2, 3);
      const i = _.random(2, 5);
      const K = k ** o;
      if (K > 125) continue;
      const expanded = term(K, v, i * o);
      const bracket = `(${term(k, v, i)})^{${o}}`;
      if (_.random(0, 1)) {
        // ÷ a term whose coefficient divides k^o
        const c = _.sample(_.range(2, K + 1).filter((d) => K % d === 0));
        const e = _.random(1, i * o - 1);
        return {
          instruction: 'Simplify fully',
          questionMath: `\\frac{${bracket}}{${term(c, v, e)}}`,
          answer: term(K / c, v, i * o - e),
          workingOut: `${bracket} = ${expanded}${NL}\\frac{${expanded}}{${term(c, v, e)}} = ${term(K / c, v, i * o - e)}`,
          metadata: { topic: 'index-laws-coefficients', difficulty },
        };
      }
      const c = _.random(2, 6);
      const e = _.random(1, 5);
      return {
        instruction: 'Simplify fully',
        questionMath: `${bracket} \\times ${term(c, v, e)}`,
        answer: term(K * c, v, i * o + e),
        workingOut: `${bracket} = ${expanded}${NL}${expanded} \\times ${term(c, v, e)} = ${term(K * c, v, i * o + e)}`,
        metadata: { topic: 'index-laws-coefficients', difficulty },
      };
    }
  }

  if (_.random(0, 1)) {
    // (k v^i)^o / (c v^-e): dividing by a negative power adds it.
    for (;;) {
      const k = _.random(2, 5);
      const o = _.random(2, 3);
      const K = k ** o;
      if (K > 125) continue;
      const i = _.random(2, 5);
      const e = _.random(1, 4);
      const c = _.sample(_.range(2, K + 1).filter((d) => K % d === 0));
      const bracket = `(${term(k, v, i)})^{${o}}`;
      return {
        instruction: 'Simplify fully',
        questionMath: `\\frac{${bracket}}{${c}${v}^{-${e}}}`,
        answer: term(K / c, v, i * o + e),
        workingOut: `${bracket} = ${term(K, v, i * o)}${NL}${v}^{${i * o} - (-${e})} = ${v}^{${i * o + e}}${NL}= ${term(K / c, v, i * o + e)}`,
        metadata: { topic: 'index-laws-coefficients', difficulty },
      };
    }
  }

  // (r^n v^(n j))^(m/n) = r^m v^(m j): the root comes first, then the power.
  for (;;) {
    const n = _.random(2, 4);
    const m = _.sample(_.range(1, n + 2).filter((x) => gcd(x, n) === 1 && x !== n));
    const r = _.random(2, 5);
    const j = _.random(1, 3);
    if (r ** n > 625 || r ** m > 125 || m === 1 && n === 2 && _.random(0, 1)) continue;
    return {
      instruction: 'Simplify fully',
      questionMath: `\\left(${term(r ** n, v, n * j)}\\right)^{\\frac{${m}}{${n}}}`,
      answer: term(r ** m, v, m * j),
      workingOut: `${r ** n}^{\\frac{${m}}{${n}}} = (${n === 2 ? `\\sqrt{${r ** n}}` : `\\sqrt[${n}]{${r ** n}}`})^{${m}} = ${r ** m}${NL}(${v}^{${n * j}})^{\\frac{${m}}{${n}}} = ${v}^{${m * j}}${NL}= ${term(r ** m, v, m * j)}`,
      metadata: { topic: 'index-laws-coefficients', difficulty },
    };
  }
};

/* ------------------------------------------------------- find the missing power */
//
//   foundation  one law, or a number written as a power     p^n × p⁴ = p¹¹,  64 = 2^n
//   core        two laws, or a change of base               x^n × x³ / x⁴ = x⁶,  4³ × 8 = 2^n
//   stretch     roots become fractional powers, so n is a fraction
//               √32 × 4³ / 16² = 2^n
//
// n is always the letter asked for, so it never doubles as the base.

const LETTERS = ['x', 'y', 'a', 'p', 'm', 'k', 't'];
const ask = 'Find the value of n';

export const generateIndexMissingPower = (options = {}) => {
  const { difficulty = 'core' } = options;
  const v = _.sample(LETTERS);
  const out = (questionMath, n, working) => ({
    instruction: ask,
    questionMath,
    answer: `n = ${n}`,
    workingOut: working.join(NL),
    metadata: { topic: 'index-laws-missing-power', difficulty },
  });

  if (difficulty === 'foundation') {
    const kind = _.sample(['product', 'quotient', 'power', 'number']);
    if (kind === 'product') {
      const n = _.random(2, 9), a = _.random(2, 9);
      const lhs = _.random(0, 1) ? `${v}^{n} \\times ${v}^{${a}}` : `${v}^{${a}} \\times ${v}^{n}`;
      return out(`${lhs} = ${v}^{${n + a}}`, n, [`n + ${a} = ${n + a}`, `n = ${n}`]);
    }
    if (kind === 'quotient') {
      if (_.random(0, 1)) {
        const n = _.random(4, 14), a = _.random(2, n - 2);
        return out(`\\frac{${v}^{n}}{${v}^{${a}}} = ${v}^{${n - a}}`, n, [`n - ${a} = ${n - a}`, `n = ${n}`]);
      }
      const n = _.random(2, 8), a = n + _.random(2, 7);
      return out(`\\frac{${v}^{${a}}}{${v}^{n}} = ${v}^{${a - n}}`, n, [`${a} - n = ${a - n}`, `n = ${n}`]);
    }
    if (kind === 'power') {
      const n = _.random(2, 6), a = _.random(2, 5);
      return out(`(${v}^{n})^{${a}} = ${v}^{${n * a}}`, n, [`n \\times ${a} = ${n * a}`, `n = ${n}`]);
    }
    for (;;) {
      const b = _.sample([2, 3, 4, 5, 10]);
      const n = _.random(3, 9);
      if (b ** n > (b === 10 ? 10 ** 6 : 1000)) continue;
      return out(`${b ** n} = ${b}^{n}`, n, [`${b ** n} = ${Array(n).fill(b).join(' \\times ')}`, `n = ${n}`]);
    }
  }

  if (difficulty === 'core') {
    const kind = _.sample(['two-laws', 'two-laws', 'base']);
    if (kind === 'two-laws') {
      if (_.random(0, 1)) {
        // v^n × v^a / v^b = v^c
        let n, a, b, c;
        do { n = _.random(2, 9); a = _.random(2, 8); b = _.random(2, 9); c = n + a - b; } while (c < 2);
        return out(`\\frac{${v}^{n} \\times ${v}^{${a}}}{${v}^{${b}}} = ${v}^{${c}}`, n, [`n + ${a} - ${b} = ${c}`, `n = ${n}`]);
      }
      // (v^n)^a ÷ v^b = v^c
      let n, a, b, c;
      do { n = _.random(2, 6); a = _.random(2, 4); b = _.random(2, 9); c = n * a - b; } while (c < 2);
      return out(`(${v}^{n})^{${a}} \\div ${v}^{${b}} = ${v}^{${c}}`, n, [`${a}n - ${b} = ${c}`, `${a}n = ${c + b}`, `n = ${n}`]);
    }
    // P^a × Q = p^n, with P and Q powers of the prime p.
    for (;;) {
      const p = _.sample([2, 3, 5]);
      const i = _.random(2, 4), a = _.random(2, 4), j = _.random(1, 3);
      if (p ** i > 81 || p ** j > 27) continue;
      const n = i * a + j;
      return out(`${p ** i}^{${a}} \\times ${p ** j} = ${p}^{n}`, n,
        [`${p ** i}^{${a}} = (${p}^{${i}})^{${a}} = ${p}^{${i * a}}`, `${p ** j} = ${p}^{${j}}`, `n = ${i * a} + ${j} = ${n}`]);
    }
  }

  // Stretch: a root over the prime, a power of a power of it, divided by a
  // third power of it. Kept only when the root genuinely makes n a fraction.
  for (;;) {
    const p = _.sample([2, 3, 5]);
    const rootIdx = _.sample([2, 2, 3]);
    const rk = _.random(2, 7);
    if (p ** rk > 250 || rk % rootIdx === 0) continue;
    const rootTex = rootIdx === 2 ? `\\sqrt{${p ** rk}}` : `\\sqrt[3]{${p ** rk}}`;
    const i = _.random(1, 3), a = _.random(1, 3);
    const di = _.random(1, 4), da = _.random(1, 2);
    if (p ** i > 125 || p ** di > 125 || (i === 1 && a === 1) || (di === 1 && da === 1 && _.random(0, 1))) continue;
    // 4^2 over 4^2 cancels at sight and leaves only the root to think about
    if (i * a === di * da) continue;
    const pw = (base, e) => (e === 1 ? `${base}` : `${base}^{${e}}`);
    // n = rk/rootIdx + i a - di da
    const nNum = rk + rootIdx * (i * a - di * da);
    if (Math.abs(nNum / rootIdx) > 6 || nNum === 0) continue;
    const n = fracTex(nNum, rootIdx);
    return out(
      `\\frac{${rootTex} \\times ${pw(p ** i, a)}}{${pw(p ** di, da)}} = ${p}^{n}`,
      n,
      [
        `${rootTex} = ${p}^{${fracTex(rk, rootIdx)}}`,
        `${pw(p ** i, a)} = ${p}^{${i * a}},\\ ${pw(p ** di, da)} = ${p}^{${di * da}}`,
        `n = ${fracTex(rk, rootIdx)} + ${i * a} - ${di * da} = ${n}`,
      ],
    );
  }
};

/* ------------------------------------------------------- exponential equations */
//
//   foundation  a number on the right            4^x = 8²           x = 3
//   core        x on both sides                  9^(x+1) = 27^x      x = 2
//   stretch     a reciprocal flips a sign        25^(x+1) = 1/125^x  x = -2/5
//
// Foundation and Core always land on an integer; Stretch is allowed a
// fraction, as the do-nows' answers are. Foundation has a real ceiling of 38 questions:
// there are only so many powers of 2, 3 and 5 a class recognises on sight,
// and 4^x = 8^2 needs two of them to share a prime.

// Powers of each prime small enough to recognise on sight.
const POWERS = { 2: [1, 2, 3, 4, 5], 3: [1, 2, 3, 4], 5: [1, 2, 3] };

// m x + c as an index.
const linTex = (m, c) => {
  const x = m === 1 ? 'x' : `${m}x`;
  if (c === 0) return x;
  return `${x} ${c < 0 ? '-' : '+'} ${Math.abs(c)}`;
};
// p^e(mx + c): the equation for the indices after changing the base.
const indexSide = (e, m, c) => (e === 1 ? linTex(m, c) : `${e}(${linTex(m, c)})`);

const formatX = (num, den) => `x = ${fracTex(num, den)}`;

export const generateExponentialEquations = (options = {}) => {
  const { difficulty = 'core' } = options;
  const p = _.sample([2, 2, 3, 5]);
  const P = POWERS[p];

  if (difficulty === 'foundation') {
    for (;;) {
      const a = _.sample(P.filter((e) => e >= 2));
      const b = _.sample(P);
      const k = _.random(2, 4);
      if (a === b || (b * k) % a !== 0) continue;
      const x = (b * k) / a;
      return {
        instruction: 'Solve',
        questionMath: `${p ** a}^{x} = ${p ** b}^{${k}}`,
        answer: `x = ${x}`,
        workingOut: `${p}^{${a}x} = ${p}^{${b * k}}${NL}${a}x = ${b * k}${NL}x = ${x}`,
        metadata: { topic: 'exponential-equations', difficulty },
      };
    }
  }

  // Core: (p^a)^(m1 x + c1) = (p^b)^(m2 x + c2), integer x.
  // Stretch: one side is a reciprocal, so its index changes sign.
  const stretch = difficulty === 'stretch';
  for (;;) {
    const a = _.sample(P), b = _.sample(P);
    if (a === b || (a === 1 && b === 1)) continue;
    const m1 = _.sample([1, 1, 2, 3]), m2 = _.sample([1, 1, 2]);
    const c1 = _.random(-4, 5), c2 = _.random(-4, 5);
    if (c1 === 0 && c2 === 0) continue;
    const s = stretch ? -1 : 1;
    // a(m1 x + c1) = s b(m2 x + c2)
    const den = a * m1 - s * b * m2;
    const numr = s * b * c2 - a * c1;
    if (den === 0 || numr === 0) continue;
    if (!stretch && numr % den !== 0) continue;
    if (stretch && Math.abs(numr / den) > 8) continue;
    const lhs = `${p ** a}^{${linTex(m1, c1)}}`;
    let rhs;
    if (!stretch) rhs = `${p ** b}^{${linTex(m2, c2)}}`;
    else rhs = _.random(0, 1)
      ? `\\frac{1}{${p ** b}^{${linTex(m2, c2)}}}`
      : `\\left(\\frac{1}{${p ** b}}\\right)^{${linTex(m2, c2)}}`;
    // Show the reciprocal on either side.
    const flip = stretch && _.random(0, 1);
    const working = [
      `${p}^{${indexSide(a, m1, c1)}} = ${p}^{${s < 0 ? '-' : ''}${b === 1 && s > 0 ? linTex(m2, c2) : `${b}(${linTex(m2, c2)})`}}`,
      `${den}x = ${numr}`,
      formatX(numr, den),
    ];
    return {
      instruction: 'Solve',
      questionMath: flip ? `${rhs} = ${lhs}` : `${lhs} = ${rhs}`,
      answer: formatX(numr, den),
      workingOut: working.join(NL),
      metadata: { topic: 'exponential-equations', difficulty },
    };
  }
};
