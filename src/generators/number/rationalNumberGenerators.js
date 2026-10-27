// src/generators/number/rationalNumberGenerators.js
//
// Rational numbers — the opening block of the Y9 Unit 1 do-nows: converting
// between fractions, decimals and percentages, recurring decimals, deciding
// what is rational, and calculating with negative fractions.
//
// Every value is held as an integer numerator and denominator, so nothing is
// computed in floating point. Decimals are printed from a whole number of
// tenths / hundredths / thousandths, never from a float.

import _ from 'lodash';
import { gcd } from '../shared';

const NL = '\n';

// n/d reduced, sign out front, an integer when d divides n.
const fracTex = (n, d) => {
  if (d < 0) { n = -n; d = -d; }
  const g = gcd(n, d) || 1;
  n /= g; d /= g;
  if (d === 1) return `${n}`;
  return n < 0 ? `-\\frac{${-n}}{${d}}` : `\\frac{${n}}{${d}}`;
};

// k / 10^places as a decimal string, trailing zeros dropped.
const decStr = (k, places) => {
  const sign = k < 0 ? '-' : '';
  const s = String(Math.abs(k)).padStart(places + 1, '0');
  if (places <= 0) return sign + s + '0'.repeat(-places);
  const out = `${s.slice(0, s.length - places)}.${s.slice(s.length - places)}`;
  return sign + out.replace(/\.?0+$/, '');
};

/* ------------------------------------------- fractions, decimals, percentages */
//
//   foundation  a decimal or a whole percentage to a fraction    0.35 -> 7/20
//   core        a fraction to a decimal AND a percentage         7/40 -> 0.175, 17.5%
//   stretch     a decimal percentage to a fraction               17.5% -> 7/40
//
// Foundation always simplifies (the numerator shares a factor with the power
// of ten), or "simplest form" asks for nothing.

export const generateFdpConversions = (options = {}) => {
  const { difficulty = 'core' } = options;

  if (difficulty === 'foundation') {
    if (_.random(0, 1)) {
      const places = _.sample([1, 2, 2]);
      const P = 10 ** places;
      let k;
      do { k = _.random(1, P - 1); } while (gcd(k, P) === 1 || (places === 2 && k % 10 === 0));
      const s = _.random(0, 3) === 0 ? -1 : 1;
      return {
        instruction: 'Write as a fraction in its simplest form',
        questionMath: decStr(s * k, places),
        answer: fracTex(s * k, P),
        workingOut: `${decStr(s * k, places)} = ${s < 0 ? '-' : ''}\\frac{${k}}{${P}}${NL}= ${fracTex(s * k, P)}`,
        metadata: { topic: 'fdp-conversions', difficulty },
      };
    }
    let p;
    do { p = _.random(2, 98); } while (gcd(p, 100) === 1 || p === 50);
    return {
      instruction: 'Write as a fraction in its simplest form',
      questionMath: `${p}\\%`,
      answer: fracTex(p, 100),
      workingOut: `${p}\\% = \\frac{${p}}{100}${NL}= ${fracTex(p, 100)}`,
      metadata: { topic: 'fdp-conversions', difficulty },
    };
  }

  if (difficulty === 'core') {
    // Denominators that are not factors of 100, so the decimal is not just
    // read off as hundredths — the division has to happen.
    const d = _.sample([8, 16, 40, 80, 125, 200]);
    let n;
    do { n = _.random(1, d - 1); } while (gcd(n, d) !== 1);
    let m = 0;
    while ((10 ** m) % d !== 0) m += 1;
    const k = (n * 10 ** m) / d;          // the decimal is k / 10^m exactly
    return {
      instruction: 'Write as a decimal and as a percentage',
      questionMath: `\\frac{${n}}{${d}}`,
      answer: `${decStr(k, m)} \\text{ and } ${decStr(k, m - 2)}\\%`,
      workingOut: `${n} \\div ${d} = ${decStr(k, m)}${NL}${decStr(k, m)} \\times 100 = ${decStr(k, m - 2)}\\%`,
      metadata: { topic: 'fdp-conversions', difficulty },
    };
  }

  // A percentage with a decimal part: clear the decimal, then divide by 100.
  // k is a multiple of 5 but not 10, which keeps every answer's denominator
  // at most 200 — 100 distinct questions, and a real ceiling, since a
  // denominator of 1000 is not a fraction anyone simplifies to.
  let k;
  do { k = 5 * _.random(1, 199); } while (k % 10 === 0);
  const pct = decStr(k, 1);
  return {
    instruction: 'Write as a fraction in its simplest form',
    questionMath: `${pct}\\%`,
    answer: fracTex(k, 1000),
    workingOut: `${pct}\\% = \\frac{${pct}}{100} = \\frac{${k}}{1000}${NL}= ${fracTex(k, 1000)}`,
    metadata: { topic: 'fdp-conversions', difficulty },
  };
};

/* --------------------------------------------------------- recurring decimals */
//
//   foundation  one digit recurs                 0.4̇    -> 4/9
//   core        a two-digit block recurs         0.3̇6̇   -> 4/11
//   stretch     something sits before the block  1.6̇ -> 5/3,  0.16̇ -> 1/6
//
// Dot notation throughout: the dots mark the first and last digit of the block.
// Foundation has a real ceiling of 8 questions (0.1̇ to 0.8̇) — 0.9̇ is 1, which
// is a discussion, not a starter.

const dot = (digits) => (digits.length === 1 ? `\\dot{${digits}}` : `\\dot{${digits[0]}}\\dot{${digits[1]}}`);

export const generateRecurringDecimals = (options = {}) => {
  const { difficulty = 'core' } = options;

  if (difficulty === 'foundation') {
    const a = _.random(1, 8);
    return {
      instruction: 'Write as a fraction in its simplest form',
      questionMath: `0.${dot(String(a))}`,
      answer: fracTex(a, 9),
      workingOut: `x = 0.${a}${a}${a}\\dots${NL}10x = ${a}.${a}${a}${a}\\dots${NL}9x = ${a}${NL}x = ${fracTex(a, 9)}`,
      metadata: { topic: 'recurring-decimals', difficulty },
    };
  }

  if (difficulty === 'core') {
    let ab;
    do { ab = _.random(1, 98); } while (ab % 11 === 0);   // 0.2̇2̇ is just 0.2̇
    const s = String(ab).padStart(2, '0');
    return {
      instruction: 'Write as a fraction in its simplest form',
      questionMath: `0.${dot(s)}`,
      answer: fracTex(ab, 99),
      workingOut: `x = 0.${s}${s}\\dots${NL}100x = ${ab}.${s}${s}\\dots${NL}99x = ${ab}${NL}x = \\frac{${ab}}{99} = ${fracTex(ab, 99)}`,
      metadata: { topic: 'recurring-decimals', difficulty },
    };
  }

  if (_.random(0, 1)) {
    // A whole-number part in front: n.ȧ = (9n + a)/9, left improper.
    const n = _.random(1, 4);
    const a = _.random(1, 8);
    return {
      instruction: 'Write as a fraction in its simplest form',
      questionMath: `${n}.${dot(String(a))}`,
      answer: fracTex(9 * n + a, 9),
      workingOut: `x = ${n}.${a}${a}\\dots${NL}10x = ${10 * n + a}.${a}${a}\\dots${NL}9x = ${9 * n + a}${NL}x = ${fracTex(9 * n + a, 9)}`,
      metadata: { topic: 'recurring-decimals', difficulty },
    };
  }

  // One digit before the recurring one: 0.aḃ = (10a + b - a)/90.
  const a = _.random(0, 9);
  let b;
  do { b = _.random(1, 9); } while (b === a);
  return {
    instruction: 'Write as a fraction in its simplest form',
    questionMath: `0.${a}${dot(String(b))}`,
    answer: fracTex(9 * a + b, 90),
    workingOut: `x = 0.${a}${b}${b}\\dots${NL}100x = ${10 * a + b}.${b}${b}\\dots,\\ 10x = ${a}.${b}${b}\\dots${NL}90x = ${9 * a + b}${NL}x = ${fracTex(9 * a + b, 90)}`,
    metadata: { topic: 'recurring-decimals', difficulty },
  };
};

/* ------------------------------------------------------- rational or irrational */
//
// "Which of these numbers are rational?" over a list of five.
//
//   foundation  the plain forms: integers, fractions, decimals against π and √n
//   core        disguises: √(square), ∛(cube) and recurring decimals are
//               rational; ∛(non-cube) and multiples of π are not. At least one
//               disguised rational every time — that is the point of the band
//   stretch     surd arithmetic decides it: √2 × √8 and (√5)² are rational,
//               √2 × √6 and √3 + 1 are not
//
// Every item knows whether it is rational from how it was built; the harness
// re-derives that from the printed LaTeX.

const isSquare = (n) => Number.isInteger(Math.sqrt(n));
const isCube = (n) => Math.round(Math.cbrt(n)) ** 3 === n;
const NON_SQUARES = _.range(2, 51).filter((n) => !isSquare(n));
const SQUAREFREE = _.range(2, 31).filter((n) => {
  for (let d = 2; d * d <= n; d++) if (n % (d * d) === 0) return false;
  return true;
});

const simpleFraction = () => {
  const q = _.random(2, 9);
  let p;
  do { p = _.random(1, 2 * q); } while (gcd(p, q) !== 1);
  return `${_.random(0, 2) === 0 ? '-' : ''}\\frac{${p}}{${q}}`;
};

const POOLS = {
  foundation: {
    rational: [
      () => String(_.random(-9, 20) || 7),
      simpleFraction,
      () => {
        let k;
        do { k = _.random(-399, 399); } while (k % 10 === 0 || k === 0);
        return decStr(k, 2);
      },
    ],
    irrational: [
      () => '\\pi',
      () => `\\sqrt{${_.sample(NON_SQUARES)}}`,
      () => `-\\sqrt{${_.sample(NON_SQUARES)}}`,
    ],
  },
  core: {
    rational: [
      () => `\\sqrt{${_.random(2, 12) ** 2}}`,
      () => `\\sqrt[3]{${_.random(2, 5) ** 3}}`,
      () => `0.${dot(String(_.random(1, 8)))}`,
      () => {
        let ab;
        do { ab = _.random(1, 98); } while (ab % 11 === 0);
        return `0.${dot(String(ab).padStart(2, '0'))}`;
      },
      simpleFraction,
    ],
    irrational: [
      () => `\\sqrt{${_.sample(NON_SQUARES)}}`,
      () => {
        let n;
        do { n = _.random(2, 60); } while (isCube(n));
        return `\\sqrt[3]{${n}}`;
      },
      () => `${_.random(2, 5)}\\pi`,
      () => `\\frac{\\pi}{${_.random(2, 4)}}`,
    ],
  },
  stretch: {
    rational: [
      () => {
        // √a × √(a k²) = a k
        const a = _.sample(SQUAREFREE.filter((v) => v <= 7));
        const k = _.random(2, 3);
        return `\\sqrt{${a}} \\times \\sqrt{${a * k * k}}`;
      },
      () => `(\\sqrt{${_.sample(NON_SQUARES)}})^2`,
      () => {
        const b = _.sample(SQUAREFREE.filter((v) => v <= 7));
        const k = _.random(2, 4);
        return `\\frac{\\sqrt{${b * k * k}}}{\\sqrt{${b}}}`;
      },
      () => {
        const q = _.random(2, 7);
        let p;
        do { p = _.random(1, q + 3); } while (gcd(p, q) !== 1);
        return `\\sqrt{\\frac{${p * p}}{${q * q}}}`;
      },
    ],
    irrational: [
      () => {
        let a, b;
        do { a = _.random(2, 7); b = _.random(2, 12); } while (a === b || isSquare(a * b));
        return `\\sqrt{${a}} \\times \\sqrt{${b}}`;
      },
      () => `\\sqrt{${_.sample(NON_SQUARES.filter((v) => v <= 20))}} ${_.random(0, 1) ? '+' : '-'} ${_.random(1, 5)}`,
      () => `\\frac{\\sqrt{${_.sample(NON_SQUARES.filter((v) => v <= 20))}}}{${_.random(2, 5)}}`,
      () => `(\\sqrt{${_.sample([2, 3, 5, 6, 7])}})^3`,
    ],
  },
};

export const generateRationalOrNot = (options = {}) => {
  const { difficulty = 'core' } = options;
  const pool = POOLS[difficulty] ?? POOLS.core;
  const nRational = _.random(2, 3);

  const pick = (makers, count, first = []) => {
    const out = [...first];
    for (let guard = 0; out.length < count && guard < 200; guard++) {
      const tex = _.sample(makers)();
      if (!out.includes(tex)) out.push(tex);
    }
    return out;
  };
  // Core always shows at least one disguised rational (a root or a recurring
  // decimal), and Stretch draws all its rationals from surd arithmetic.
  const seed = difficulty === 'core' ? [_.sample(pool.rational.slice(0, 2))()] : [];
  const rational = pick(pool.rational, nRational, seed);
  const irrational = pick(pool.irrational, 5 - nRational);
  const items = _.shuffle([
    ...rational.map((tex) => ({ tex, rational: true })),
    ...irrational.map((tex) => ({ tex, rational: false })),
  ]);
  const yes = items.filter((i) => i.rational).map((i) => i.tex);

  return {
    instruction: 'Which of these numbers are rational?',
    questionMath: items.map((i) => i.tex).join(',\\quad '),
    answer: yes.join(',\\quad '),
    workingOut: items.map((i) => `${i.tex} \\text{ is ${i.rational ? 'rational' : 'irrational'}}`).join(NL),
    metadata: { topic: 'rational-or-irrational', difficulty },
  };
};

/* ----------------------------------------------------- negative fractions */
//
//   foundation  add or subtract a negative fraction, the first unsimplified
//               6/24 + (-5/4)
//   core        multiply or divide, both unsimplified, with a negative
//               4/12 × (-28/20)
//   stretch     order of operations across fractions: a square and a product
//               (2/3)² + (-7/9) × 15/2
//
// "Simplify first" is the habit the do-nows drill: cancelling before
// combining keeps the numbers small.

const FRAC = (n, d, neg = false) => `${neg ? '-' : ''}\\frac{${n}}{${d}}`;
const bracketNeg = (n, d) => `\\left(-\\frac{${n}}{${d}}\\right)`;
const reduced = (maxDen, maxNum = maxDen) => {
  let p, q;
  do { q = _.random(2, maxDen); p = _.random(1, maxNum); } while (gcd(p, q) !== 1);
  return [p, q];
};

export const generateNegativeFractions = (options = {}) => {
  const { difficulty = 'core' } = options;

  if (difficulty === 'foundation') {
    let p, q, k, c, d;
    do {
      [p, q] = reduced(8);
      k = _.random(2, 6);
      d = q * _.sample([1, 1, 2]);
      c = _.random(1, 2 * d);
    } while (gcd(c, d) !== 1 || k * q > 60 || (c === p && d === q));
    const add = _.random(0, 1) === 1;
    // p/q + (-c/d) or p/q - (-c/d), over the common denominator d.
    const num = (p * d) / q + (add ? -c : c);
    return {
      instruction: 'Simplify first, then calculate',
      questionMath: `${FRAC(k * p, k * q)} ${add ? '+' : '-'} ${bracketNeg(c, d)}`,
      answer: fracTex(num, d),
      workingOut: `${FRAC(k * p, k * q)} = ${FRAC(p, q)}${NL}${FRAC(p, q)} ${add ? '-' : '+'} ${FRAC(c, d)} = ${fracTex(num, d)}`,
      metadata: { topic: 'negative-fractions', difficulty },
    };
  }

  if (difficulty === 'core') {
    const [p1, q1] = reduced(9);
    const [p2, q2] = reduced(9);
    const k1 = _.random(2, 5);
    const k2 = _.random(2, 5);
    const divide = _.random(0, 1) === 1;
    const bothNeg = _.random(0, 2) === 0;
    // (±p1/q1) × or ÷ (-p2/q2)
    const num = (bothNeg ? 1 : -1) * p1 * (divide ? q2 : p2);
    const den = q1 * (divide ? p2 : q2);
    const first = FRAC(k1 * p1, k1 * q1, bothNeg);
    return {
      instruction: 'Simplify first, then calculate',
      questionMath: `${first} ${divide ? '\\div' : '\\times'} ${bracketNeg(k2 * p2, k2 * q2)}`,
      answer: fracTex(num, den),
      workingOut: `${FRAC(p1, q1, bothNeg)} ${divide ? '\\div' : '\\times'} \\left(-${FRAC(p2, q2)}\\right)${NL}= ${fracTex(num, den)}`,
      metadata: { topic: 'negative-fractions', difficulty },
    };
  }

  // (±p/q)² ± (-a/b) × c/d. The square is never negative; the product is.
  let p, q, a, b, c, d, num, den;
  do {
    [p, q] = reduced(5, 6);
    [a, b] = reduced(9);
    [c, d] = reduced(6, 15);
    // p²/q² + sign × (-ac/bd), over q² b d
    den = q * q * b * d;
  } while (den > 2000);
  const plus = _.random(0, 1) === 1;
  const negSquare = _.random(0, 2) === 0;
  num = p * p * b * d + (plus ? -1 : 1) * a * c * q * q;
  const squareTex = `\\left(${negSquare ? '-' : ''}\\frac{${p}}{${q}}\\right)^{2}`;
  const answer = fracTex(num, den);
  const g = gcd(num, den) || 1;
  if (den / g > 72) return generateNegativeFractions(options);
  return {
    instruction: 'Calculate',
    questionMath: `${squareTex} ${plus ? '+' : '-'} ${bracketNeg(a, b)} \\times ${FRAC(c, d)}`,
    answer,
    workingOut: `${squareTex} = ${FRAC(p * p, q * q)}${NL}${bracketNeg(a, b)} \\times ${FRAC(c, d)} = ${fracTex(-a * c, b * d)}${NL}${FRAC(p * p, q * q)} ${plus ? '+' : '-'} \\left(${fracTex(-a * c, b * d)}\\right) = ${answer}`,
    metadata: { topic: 'negative-fractions', difficulty },
  };
};
