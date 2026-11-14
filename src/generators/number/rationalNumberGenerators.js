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
// Split by direction in the skill-ladder review, so a band never turns the
// conversion round.
//
//   decimal-percent-to-fraction
//     foundation  a decimal or a whole percentage      0.35 -> 7/20,  6% -> 3/50
//     core        three decimal places, or an eighth   0.375 -> 3/8,  12.5% -> 1/8
//     stretch     any half percentage                  88.5% -> 177/200, 2.5% -> 1/40
//   fraction-to-decimal-percent
//     foundation  halves to eighths, fifths, tenths    3/8 -> 0.375 and 37.5%
//     core        sixteenths, fortieths, 125ths        7/40 -> 0.175 and 17.5%
//     stretch     a mixed number                       2 3/8 -> 2.375 and 237.5%
//
// "Simplest form" always has something to do: the numerator shares a factor
// with the power of ten.

const toFraction = (difficulty, questionMath, k, P, viaPercent) => ({
  instruction: 'Write as a fraction in its simplest form',
  questionMath,
  answer: fracTex(k, P),
  workingOut: `${questionMath} = ${viaPercent ? `\\frac{${viaPercent}}{100} = ` : ''}${k < 0 ? '-' : ''}\\frac{${Math.abs(k)}}{${P}}${NL}= ${fracTex(k, P)}`,
  metadata: { topic: 'decimal-percent-to-fraction', difficulty },
});

export const generateDecimalPercentToFraction = (options = {}) => {
  const { difficulty = 'core' } = options;

  if (difficulty === 'foundation') {
    if (_.random(0, 1)) {
      const places = _.sample([1, 2, 2]);
      const P = 10 ** places;
      let k;
      do { k = _.random(1, P - 1); } while (gcd(k, P) === 1 || (places === 2 && k % 10 === 0));
      const sgn = _.random(0, 3) === 0 ? -1 : 1;
      return toFraction(difficulty, decStr(sgn * k, places), sgn * k, P);
    }
    let p;
    do { p = _.random(2, 98); } while (gcd(p, 100) === 1 || p === 50);
    return toFraction(difficulty, `${p}\\%`, p, 100, null);
  }

  if (difficulty === 'core') {
    if (_.random(0, 2)) {
      // Three places, not a multiple of 10 (that would be two places).
      let k;
      do { k = _.random(1, 999); } while (gcd(k, 1000) === 1 || k % 10 === 0);
      return toFraction(difficulty, decStr(k, 3), k, 1000);
    }
    const k = _.sample([125, 375, 625, 875]); // 12.5% and its family, in tenths
    const pct = decStr(k, 1);
    return {
      ...toFraction(difficulty, `${pct}\\%`, k, 1000),
      workingOut: `${pct}\\% = \\frac{${pct}}{100} = \\frac{${k}}{1000}${NL}= ${fracTex(k, 1000)}`,
    };
  }

  // Any half percentage that is not an eighth: the denominator is 200, or
  // 40 when it cancels further. 200 such questions is the real ceiling.
  let k;
  do { k = 5 * _.random(1, 199); } while (k % 10 === 0 || [125, 375, 625, 875].includes(k));
  const pct = decStr(k, 1);
  return {
    ...toFraction(difficulty, `${pct}\\%`, k, 1000),
    workingOut: `${pct}\\% = \\frac{${pct}}{100} = \\frac{${k}}{1000}${NL}= ${fracTex(k, 1000)}`,
  };
};

export const generateFractionToDecimalPercent = (options = {}) => {
  const { difficulty = 'core' } = options;
  const dens = { foundation: [2, 4, 5, 8, 10, 20, 25], core: [16, 40, 80, 125, 200], stretch: [4, 5, 8, 16, 20, 25, 40] }[difficulty];
  const d = _.sample(dens);
  let n;
  do { n = _.random(1, d - 1); } while (gcd(n, d) !== 1);
  const whole = difficulty === 'stretch' ? _.random(1, 4) : 0;
  const num = whole * d + n;
  let m = 0;
  while ((10 ** m) % d !== 0) m += 1;
  const k = (num * 10 ** m) / d; // the decimal is k / 10^m exactly
  const questionMath = whole ? `${whole}\\frac{${n}}{${d}}` : `\\frac{${n}}{${d}}`;
  return {
    instruction: 'Write as a decimal and as a percentage',
    questionMath,
    answer: `${decStr(k, m)} \\text{ and } ${decStr(k, m - 2)}\\%`,
    workingOut: `${whole ? `${whole} + ` : ''}${n} \\div ${d} = ${decStr(k, m)}${NL}${decStr(k, m)} \\times 100 = ${decStr(k, m - 2)}\\%`,
    metadata: { topic: 'fraction-to-decimal-percent', difficulty },
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
// Split by operation in the skill-ladder review.
//
//   negative-fractions-add
//     foundation  one denominator divides the other, the first unsimplified
//                 6/24 + (-5/4)
//     core        different denominators, both in lowest terms
//                 2/3 - (-5/4)
//     stretch     three terms                3/4 + (-5/6) - (-2/3)
//   negative-fractions-multiply
//     foundation  one product with a negative        (-3/4) × 2/5
//     core        a division, simplifying first      4/12 ÷ (-28/20)
//     stretch     a square in the product            (-2/3)² × (-9/8)

const FRAC = (n, d, neg = false) => `${neg ? '-' : ''}\\frac{${n}}{${d}}`;
const bracketNeg = (n, d) => `\\left(-\\frac{${n}}{${d}}\\right)`;
const reduced = (maxDen, maxNum = maxDen) => {
  let p, q;
  do { q = _.random(2, maxDen); p = _.random(1, maxNum); } while (gcd(p, q) !== 1);
  return [p, q];
};
const lcm = (a, b) => (a * b) / gcd(a, b);
// ±p/q as a term after the first: "+ 2/3", "- (-5/4)", "+ (-5/4)".
const term = (op, n, d) => `${op} ${n < 0 ? bracketNeg(-n, d) : FRAC(n, d)}`;

export const generateNegativeFractionsAdd = (options = {}) => {
  const { difficulty = 'core' } = options;
  const meta = { topic: 'negative-fractions-add', difficulty };

  if (difficulty === 'foundation') {
    let p, q, k, c, d;
    do {
      [p, q] = reduced(8);
      k = _.random(2, 6);
      d = q * _.sample([1, 1, 2]);
      c = _.random(1, 2 * d);
    } while (gcd(c, d) !== 1 || k * q > 60 || (c === p && d === q));
    const add = _.random(0, 1) === 1;
    const num = (p * d) / q + (add ? -c : c);
    return {
      instruction: 'Simplify first, then calculate',
      questionMath: `${FRAC(k * p, k * q)} ${add ? '+' : '-'} ${bracketNeg(c, d)}`,
      answer: fracTex(num, d),
      workingOut: `${FRAC(k * p, k * q)} = ${FRAC(p, q)}${NL}${FRAC(p, q)} ${add ? '-' : '+'} ${FRAC(c, d)} = ${fracTex(num, d)}`,
      metadata: meta,
    };
  }

  if (difficulty === 'core') {
    for (;;) {
      const [p, q] = reduced(9);
      const [c, d] = reduced(9);
      if (q % d === 0 || d % q === 0) continue; // one dividing the other is Foundation's
      const L = lcm(q, d);
      if (L > 72) continue;
      const add = _.random(0, 1) === 1;
      const firstNeg = _.random(0, 2) === 0;
      const a = (firstNeg ? -p : p) * (L / q);
      const b = c * (L / d);
      const num = add ? a - b : a + b;
      if (num === 0) continue;
      return {
        instruction: 'Calculate',
        questionMath: `${FRAC(p, q, firstNeg)} ${add ? '+' : '-'} ${bracketNeg(c, d)}`,
        answer: fracTex(num, L),
        workingOut: `${a < 0 ? '-' : ''}\\frac{${Math.abs(a)}}{${L}} ${add ? '-' : '+'} \\frac{${b}}{${L}}${NL}= ${fracTex(num, L)}`,
        metadata: meta,
      };
    }
  }

  // Three terms, at least one of them negative after the first.
  for (;;) {
    const fr = [reduced(6), reduced(6), reduced(6)];
    const L = fr.reduce((acc, [, q]) => lcm(acc, q), 1);
    if (L > 60 || new Set(fr.map(([, q]) => q)).size < 2) continue;
    const signs = [1, _.sample([1, -1]), _.sample([1, -1])];
    const ops = ['', _.sample(['+', '-']), _.sample(['+', '-'])];
    if (signs[1] > 0 && signs[2] > 0) continue;
    const vals = fr.map(([p, q], i) => signs[i] * p * (L / q));
    const num = vals[0] + (ops[1] === '+' ? vals[1] : -vals[1]) + (ops[2] === '+' ? vals[2] : -vals[2]);
    if (num === 0) continue;
    const q = `${FRAC(...fr[0])} ${term(ops[1], signs[1] * fr[1][0], fr[1][1])} ${term(ops[2], signs[2] * fr[2][0], fr[2][1])}`;
    const over = vals.map((v, i) => (i === 0 ? `\\frac{${v}}{${L}}` : `${(ops[i] === '+') === (v >= 0) ? '+' : '-'} \\frac{${Math.abs(v)}}{${L}}`)).join(' ');
    return {
      instruction: 'Calculate',
      questionMath: q,
      answer: fracTex(num, L),
      workingOut: `${over}${NL}= ${fracTex(num, L)}`,
      metadata: meta,
    };
  }
};

export const generateNegativeFractionsMultiply = (options = {}) => {
  const { difficulty = 'core' } = options;
  const meta = { topic: 'negative-fractions-multiply', difficulty };

  if (difficulty === 'foundation') {
    // One product, one fraction negative, something to cancel.
    for (;;) {
      const [p1, q1] = reduced(9);
      const [p2, q2] = reduced(9);
      if (gcd(p1 * p2, q1 * q2) === 1) continue;
      const negFirst = _.random(0, 1) === 1;
      const first = negFirst ? bracketNeg(p1, q1) : FRAC(p1, q1);
      const second = negFirst ? FRAC(p2, q2) : bracketNeg(p2, q2);
      return {
        instruction: 'Calculate',
        questionMath: `${first} \\times ${second}`,
        answer: fracTex(-p1 * p2, q1 * q2),
        workingOut: `-\\frac{${p1} \\times ${p2}}{${q1} \\times ${q2}}${NL}= ${fracTex(-p1 * p2, q1 * q2)}`,
        metadata: meta,
      };
    }
  }

  if (difficulty === 'core') {
    const [p1, q1] = reduced(9);
    const [p2, q2] = reduced(9);
    const [k1, k2] = [_.random(2, 5), _.random(2, 5)];
    const bothNeg = _.random(0, 2) === 0;
    const num = (bothNeg ? 1 : -1) * p1 * q2;
    const den = q1 * p2;
    return {
      instruction: 'Simplify first, then calculate',
      questionMath: `${FRAC(k1 * p1, k1 * q1, bothNeg)} \\div ${bracketNeg(k2 * p2, k2 * q2)}`,
      answer: fracTex(num, den),
      workingOut: `${FRAC(p1, q1, bothNeg)} \\div \\left(-${FRAC(p2, q2)}\\right)${NL}${FRAC(p1, q1, bothNeg)} \\times \\left(-${FRAC(q2, p2)}\\right)${NL}= ${fracTex(num, den)}`,
      metadata: meta,
    };
  }

  // A square times (or divided by) a negative fraction. The square is never
  // negative, whatever sign is inside it.
  for (;;) {
    const [p, q] = reduced(5, 6);
    const [a, b] = reduced(9);
    const divide = _.random(0, 2) === 0;
    const negSquare = _.random(0, 1) === 1;
    const num = -(p * p) * (divide ? b : a);
    const den = q * q * (divide ? a : b);
    const g = gcd(num, den);
    if (den / g > 72 || g === 1) continue;
    const sq = `\\left(${negSquare ? '-' : ''}\\frac{${p}}{${q}}\\right)^{2}`;
    return {
      instruction: 'Calculate',
      questionMath: `${sq} ${divide ? '\\div' : '\\times'} ${bracketNeg(a, b)}`,
      answer: fracTex(num, den),
      workingOut: `${sq} = ${FRAC(p * p, q * q)}${NL}${FRAC(p * p, q * q)} ${divide ? '\\div' : '\\times'} ${bracketNeg(a, b)} = ${fracTex(num, den)}`,
      metadata: meta,
    };
  }
};
