import _ from 'lodash';

const NL = '\n';
const frac = (n, d) => {
  const g = (a, b) => (b === 0 ? a : g(b, a % b));
  const k = g(Math.abs(n), Math.abs(d));
  const [nn, dd] = [n / k, d / k];
  return dd === 1 ? `${nn}` : `\\frac{${nn}}{${dd}}`;
};

/* ------------------------------------------------- 6C: zero and negative indices */

export const generateIndicesZeroNegative = (options = {}) => {
  const { difficulty = 'core' } = options;

  if (difficulty === 'foundation') {
    // a^0 = 1, or a plain negative index giving a unit fraction.
    if (_.random(0, 2) === 0) {
      const a = _.random(2, 30);
      const v = _.sample(['x', 'y', 'a', 'p', 'm', 't', String(a)]);
      return {
        instruction: 'Evaluate',
        questionMath: `${v}^0`,
        answer: '1',
        workingOut: `a^0 = 1 \\text{ for any } a \\ne 0`,
        metadata: { topic: 'indices-zero-negative', difficulty },
      };
    }
    const base = _.random(2, 12);
    const n = _.random(1, 5);
    if (base ** n > 100000) return generateIndicesZeroNegative(options);
    return {
      instruction: 'Evaluate, giving your answer as a fraction',
      questionMath: `${base}^{-${n}}`,
      answer: frac(1, base ** n),
      workingOut: `a^{-n} = \\frac{1}{a^n}${NL}= \\frac{1}{${base}^${n}} = ${frac(1, base ** n)}`,
      metadata: { topic: 'indices-zero-negative', difficulty },
    };
  }

  if (difficulty === 'core') {
    // A fractional base with a negative index — the reciprocal flips, which is
    // the step students miss (Haese p129).
    const p = _.random(2, 9);
    let q;
    do { q = _.random(2, 11); } while (q === p);
    const n = _.random(2, 4);
    if (q ** n > 4000 || p ** n > 4000) return generateIndicesZeroNegative(options);
    return {
      instruction: 'Evaluate, giving your answer as a fraction',
      questionMath: `\\left(\\frac{${p}}{${q}}\\right)^{-${n}}`,
      answer: frac(q ** n, p ** n),
      workingOut: `\\left(\\frac{${p}}{${q}}\\right)^{-${n}} = \\left(\\frac{${q}}{${p}}\\right)^{${n}}${NL}= ${frac(q ** n, p ** n)}`,
      metadata: { topic: 'indices-zero-negative', difficulty },
    };
  }

  // Index laws that land on a negative power, so the answer is a fraction.
  const base = _.random(2, 10);
  const m = _.random(2, 8);
  const n = _.random(m + 1, m + 5);
  const diff = n - m;
  if (base ** diff > 4000) return generateIndicesZeroNegative(options);
  return {
    instruction: 'Evaluate, giving your answer as a fraction',
    questionMath: `${base}^{${m}} \\div ${base}^{${n}}`,
    answer: frac(1, base ** diff),
    workingOut: `${base}^{${m} - ${n}} = ${base}^{-${diff}}${NL}= ${diff === 1 ? `\\frac{1}{${base}}` : `\\frac{1}{${base}^{${diff}}} = ${frac(1, base ** diff)}`}`,
    metadata: { topic: 'indices-zero-negative', difficulty },
  };
};

/* ------------------------------------------------------------ 6D: standard form */

// A number held exactly as num x 10^exp with num an integer, so nothing is ever
// computed in floating point. Standard form then just moves the decimal point
// after the first digit of num.
const toStandard = (num, exp) => {
  let n = num, e = exp;
  while (n !== 0 && n % 10 === 0) { n /= 10; e += 1; }
  const digits = String(Math.abs(n));
  const mantissa = digits.length === 1 ? digits : `${digits[0]}.${digits.slice(1)}`;
  return { mantissa, exponent: e + digits.length - 1 };
};
const sf = (num, exp) => {
  const { mantissa, exponent } = toStandard(num, exp);
  return `${mantissa} \\times 10^{${exponent}}`;
};
// The same number written out in full, again without floats.
const plain = (num, exp) => {
  if (exp >= 0) return String(num) + '0'.repeat(exp);
  const s = String(num);
  const k = -exp;
  return s.length > k ? `${s.slice(0, s.length - k)}.${s.slice(s.length - k)}`
                      : `0.${'0'.repeat(k - s.length)}${s}`;
};

export const generateStandardFormWrite = (options = {}) => {
  const { difficulty = 'core' } = options;
  const num = _.random(11, 9999);
  // The band is about the SIGN of the standard-form exponent, not the raw
  // shift: 9999 x 10^-1 is 999.9, which is not a small number. The exponent
  // works out as exp + (digits - 1), so a small number needs exp <= -digits.
  const digits = String(num).length;
  const exp = difficulty === 'foundation'
    ? _.random(1, 7)
    : _.random(-8, -digits);

  if (difficulty === 'stretch') {
    // Backwards: given standard form, write it out in full.
    const e2 = _.random(-5, 5);
    return {
      instruction: 'Write as an ordinary number',
      questionMath: sf(num, e2),
      answer: plain(num, e2),
      workingOut: `\\text{move the decimal point } ${Math.abs(toStandard(num, e2).exponent)} \\text{ place${Math.abs(toStandard(num, e2).exponent) === 1 ? '' : 's'} to the ${toStandard(num, e2).exponent < 0 ? 'left' : 'right'}}${NL}= ${plain(num, e2)}`,
      metadata: { topic: 'standard-form-write', difficulty },
    };
  }

  return {
    instruction: 'Write in standard form',
    questionMath: plain(num, exp),
    answer: sf(num, exp),
    workingOut: `\\text{a number between 1 and 10, times a power of 10}${NL}= ${sf(num, exp)}`,
    metadata: { topic: 'standard-form-write', difficulty },
  };
};

export const generateStandardFormCalculate = (options = {}) => {
  const { difficulty = 'core' } = options;

  if (difficulty === 'foundation') {
    const [a, b] = [_.random(2, 9), _.random(2, 9)];
    const [e1, e2] = [_.random(-6, 8), _.random(-6, 8)];
    return {
      instruction: 'Work out, giving your answer in standard form',
      questionMath: `(${a} \\times 10^{${e1}}) \\times (${b} \\times 10^{${e2}})`,
      answer: sf(a * b, e1 + e2),
      workingOut: `${a} \\times ${b} = ${a * b},\\ 10^{${e1}} \\times 10^{${e2}} = 10^{${e1 + e2}}${NL}${a * b} \\times 10^{${e1 + e2}} = ${sf(a * b, e1 + e2)}`,
      metadata: { topic: 'standard-form-calculate', difficulty },
    };
  }

  if (difficulty === 'core') {
    const b = _.random(2, 9);
    const q = _.random(2, 9);
    const a = b * q;                       // exact division by construction
    const [e1, e2] = [_.random(-4, 9), _.random(-6, 5)];
    return {
      instruction: 'Work out, giving your answer in standard form',
      questionMath: `(${a} \\times 10^{${e1}}) \\div (${b} \\times 10^{${e2}})`,
      answer: sf(q, e1 - e2),
      workingOut: `${a} \\div ${b} = ${q},\\ 10^{${e1}} \\div 10^{${e2}} = 10^{${e1 - e2}}${NL}= ${sf(q, e1 - e2)}`,
      metadata: { topic: 'standard-form-calculate', difficulty },
    };
  }

  // Adding: the powers have to be matched first, which multiplying never
  // requires. This is the band that catches people.
  const e = _.random(-5, 7);
  const gap = _.random(1, 3);
  const n1 = _.random(11, 89);             // n1 x 10^e
  const n2 = _.random(2, 9);               // n2 x 10^(e+gap)
  const total = n1 + n2 * 10 ** gap;
  const E2 = toStandard(n2, e + gap).exponent;   // the larger power of ten
  const shifted = plain(n1, e - E2);             // the smaller term rewritten to that power
  return {
    instruction: 'Work out, giving your answer in standard form',
    questionMath: `(${sf(n1, e)}) + (${sf(n2, e + gap)})`,
    answer: sf(total, e),
    workingOut: `${toStandard(n1, e).exponent === E2 ? '' : `${sf(n1, e)} = ${shifted} \\times 10^{${E2}}${NL}`}${shifted} + ${n2} = ${plain(total, e - E2)}${NL}= ${sf(total, e)}`,
    metadata: { topic: 'standard-form-calculate', difficulty },
  };
};

/* --------------------------------------------------------------- 6E-6H: surds */

// The largest square factor of n, so sqrt(n) = k sqrt(m) with m square-free.
const simplifySurd = (n) => {
  let k = 1, m = n;
  for (let d = 2; d * d <= m; d++) {
    while (m % (d * d) === 0) { m /= d * d; k *= d; }
  }
  return [k, m];
};
const surd = (k, m) => {
  if (m === 1) return String(k);
  return k === 1 ? `\\sqrt{${m}}` : `${k}\\sqrt{${m}}`;
};
// Values whose square root actually simplifies, so the question has a point.
// Square-free values, so sqrt(b) is already in simplest form and the only
// step left is the rationalising itself.
const SQUAREFREE = _.range(2, 61).filter((n) => {
  for (let d = 2; d * d <= n; d++) if (n % (d * d) === 0) return false;
  return Math.sqrt(n) % 1 !== 0;
});
const gcd = (a, b) => (b === 0 ? a : gcd(b, a % b));

const SIMPLIFIABLE = _.range(8, 601).filter((n) => {
  const [k, m] = simplifySurd(n);
  return k > 1 && m > 1;
});

export const generateSurdsSimplify = (options = {}) => {
  const { difficulty = 'core' } = options;

  if (difficulty === 'foundation') {
    const n = _.sample(SIMPLIFIABLE.filter((v) => v <= 400));
    const [k, m] = simplifySurd(n);
    return {
      instruction: 'Write in simplest surd form',
      questionMath: `\\sqrt{${n}}`,
      answer: surd(k, m),
      workingOut: `${n} = ${k * k} \\times ${m}${NL}\\sqrt{${n}} = \\sqrt{${k * k}} \\times \\sqrt{${m}} = ${surd(k, m)}`,
      metadata: { topic: 'surds-simplify', difficulty },
    };
  }

  if (difficulty === 'core') {
    // Multiply first, then simplify (Haese Exercise 6F).
    let a, b, prod, k, m;
    do {
      a = _.random(2, 30); b = _.random(2, 30);
      prod = a * b;
      [k, m] = simplifySurd(prod);
    } while (k === 1 || m === 1 || prod > 600);
    return {
      instruction: 'Write in simplest surd form',
      questionMath: `\\sqrt{${a}} \\times \\sqrt{${b}}`,
      answer: surd(k, m),
      workingOut: `\\sqrt{${a}} \\times \\sqrt{${b}} = \\sqrt{${prod}}${NL}${prod} = ${k * k} \\times ${m}${NL}= ${surd(k, m)}`,
      metadata: { topic: 'surds-simplify', difficulty },
    };
  }

  // Collect like surds, which only works once each is simplified.
  let n1, n2, k1, m1, k2, m2;
  do {
    n1 = _.sample(SIMPLIFIABLE); n2 = _.sample(SIMPLIFIABLE);
    [k1, m1] = simplifySurd(n1);
    [k2, m2] = simplifySurd(n2);
  } while (m1 !== m2 || n1 === n2 || k1 + k2 > 40);
  return {
    instruction: 'Write in simplest surd form',
    questionMath: `\\sqrt{${n1}} + \\sqrt{${n2}}`,
    answer: surd(k1 + k2, m1),
    workingOut: `\\sqrt{${n1}} = ${surd(k1, m1)},\\ \\sqrt{${n2}} = ${surd(k2, m2)}${NL}${surd(k1, m1)} + ${surd(k2, m2)} = ${surd(k1 + k2, m1)}`,
    metadata: { topic: 'surds-simplify', difficulty },
  };
};

export const generateRationaliseDenominator = (options = {}) => {
  const { difficulty = 'core' } = options;

  if (difficulty === 'stretch') {
    // The denominator has to be simplified before it can be rationalised.
    let d, k, m;
    do {
      d = _.sample(SIMPLIFIABLE.filter((v) => v <= 300));
      [k, m] = simplifySurd(d);
    } while (k === 1 || m === 1);
    const a = _.random(2, 15);
    const den = k * m;
    const g = gcd(a, den);
    const answer = den / g === 1 ? `${a / g}\\sqrt{${m}}` : `\\frac{${a / g}\\sqrt{${m}}}{${den / g}}`;
    return {
      instruction: 'Write with a rational denominator',
      questionMath: `\\frac{${a}}{\\sqrt{${d}}}`,
      answer,
      workingOut: `\\sqrt{${d}} = ${surd(k, m)}${NL}\\frac{${a}}{${surd(k, m)}} = \\frac{${a}\\sqrt{${m}}}{${den}}${NL}= ${answer}`,
      metadata: { topic: 'rationalise-denominator', difficulty },
    };
  }

  // Foundation and core differ by whether the result cancels. Multiplying top
  // and bottom by sqrt(b) is the same move either way; spotting that 6/sqrt(3)
  // finishes as 2 sqrt(3) rather than 6 sqrt(3) / 3 is the extra step.
  const wantCancel = difficulty === 'core';
  let a, b;
  do {
    b = _.sample(SQUAREFREE);
    a = _.random(2, 15);
  } while ((gcd(a, b) > 1) !== wantCancel);

  const g = gcd(a, b);
  const answer = b / g === 1 ? `${a / g}\\sqrt{${b}}` : `\\frac{${a / g}\\sqrt{${b}}}{${b / g}}`;
  return {
    instruction: 'Write with a rational denominator',
    questionMath: `\\frac{${a}}{\\sqrt{${b}}}`,
    answer,
    workingOut: `\\text{multiply top and bottom by } \\sqrt{${b}}${NL}= \\frac{${a}\\sqrt{${b}}}{${b}}${g === 1 ? '' : `${NL}= ${answer}`}`,
    metadata: { topic: 'rationalise-denominator', difficulty },
  };
};
