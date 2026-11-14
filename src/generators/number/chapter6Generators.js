import _ from 'lodash';
import { gcd } from '../shared';

import { generateRationalOrNot } from './rationalNumberGenerators';

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
    // A whole bracketed expression to the power 0 — Foundation's bare-variable
    // ^0 doesn't test that the rule holds no matter how cluttered the base
    // looks, only that it holds for a single letter.
    if (_.random(0, 2) === 0) {
      const v1 = _.sample(['a', 'b', 'm', 'n', 'p', 'x', 'y']);
      let v2;
      do { v2 = _.sample(['a', 'b', 'm', 'n', 'p', 'x', 'y']); } while (v2 === v1);
      const c = _.random(2, 9);
      const e1 = _.random(2, 4);
      const e2 = _.random(2, 3);
      return {
        instruction: 'Evaluate',
        questionMath: `(${c}${v1}^${e1}${v2}^${e2})^0`,
        answer: '1',
        workingOut: `a^0 = 1 \\text{ for any } a \\ne 0`,
        metadata: { topic: 'indices-zero-negative', difficulty },
      };
    }
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

  // Stretch. One branch in three chains the power-of-a-power law straight
  // into the negative-index law: the outer power multiplies the inner
  // exponent first (which only makes the index more negative, never zero),
  // and only then does the reciprocal step apply. Two laws in sequence, not
  // one — this is what actually sits above Core's single-step fraction
  // reciprocal. An earlier draft used a^n * a^-n = a^0 = 1 here, but that
  // resolves in one glance (the exponents visibly cancel) and reads easier
  // than Core, not harder — the failure this replaces.
  if (_.random(0, 2) === 0) {
    const m = _.random(2, 3);
    const n = _.random(2, 3);
    const mn = m * n;
    // base is bounded from mn rather than rejection-sampled against it, so
    // every (m, n) pair is usable — mn = 9 (m = n = 3) only leaves base = 2,
    // but that is still a real question, not a skipped draw.
    const base = _.random(2, Math.max(2, Math.floor(4000 ** (1 / mn))));
    return {
      instruction: 'Evaluate, giving your answer as a fraction',
      questionMath: `(${base}^{${m}})^{-${n}}`,
      answer: frac(1, base ** mn),
      workingOut: `(a^m)^{-n} = a^{-mn}${NL}(${base}^{${m}})^{-${n}} = ${base}^{-${mn}}${NL}= \\frac{1}{${base}^{${mn}}} = ${frac(1, base ** mn)}`,
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
  const out = s.length > k ? `${s.slice(0, s.length - k)}.${s.slice(s.length - k)}`
                           : `0.${'0'.repeat(k - s.length)}${s}`;
  // 4540 x 10^-1 is 454, not 454.0.
  return out.replace(/\.?0+$/, '');
};

// Skill-ladder review: four skills, each holding one direction or one
// operation across its bands.
//
//   standard-form-write             F large     C small        S awkward: 45 × 10^3, 0.0004 × 10^5
//   standard-form-ordinary          F 10^+      C 10^-         S large powers, many zeros
//   standard-form-multiply-divide   F ×, no carry  C × with a carry, or ÷ exactly  S ÷ needing adjustment
//   standard-form-add-subtract      F same power   C powers one apart              S two or three apart

const sfMeta = (topic, difficulty) => ({ topic, difficulty });

export const generateStandardFormWrite = (options = {}) => {
  const { difficulty = 'core' } = options;
  const meta = sfMeta('standard-form-write', difficulty);
  const num = _.random(11, 9999);
  const digits = String(num).length;

  if (difficulty === 'stretch') {
    // Already "a × 10^n", but a is not between 1 and 10: too big or too small.
    const e = _.random(-6, 8);
    const big = _.random(0, 1) === 1;
    // a = num × 10^shift, with a >= 10 (big) or a < 1 (small).
    const shift = big ? _.random(-(digits - 2), 0) : -(digits + _.random(0, 2));
    const a = plain(num, shift);
    return {
      instruction: 'Write in standard form',
      questionMath: `${a} \\times 10^{${e}}`,
      answer: sf(num, shift + e),
      workingOut: `${a} = ${sf(num, shift)}${NL}${sf(num, shift)} \\times 10^{${e}} = ${sf(num, shift + e)}`,
      metadata: meta,
    };
  }

  // The band is about the SIGN of the standard-form exponent, not the raw
  // shift: 9999 x 10^-1 is 999.9, which is not a small number.
  const exp = difficulty === 'foundation' ? _.random(1, 7) : _.random(-8, -digits);
  return {
    instruction: 'Write in standard form',
    questionMath: plain(num, exp),
    answer: sf(num, exp),
    workingOut: `\\text{a number between 1 and 10, times a power of 10}${NL}= ${sf(num, exp)}`,
    metadata: meta,
  };
};

export const generateStandardFormOrdinary = (options = {}) => {
  const { difficulty = 'core' } = options;
  const meta = sfMeta('standard-form-ordinary', difficulty);
  const num = _.random(11, 999);
  const digits = String(num).length;
  // The standard-form exponent wanted, then the raw one that gives it.
  const target = {
    foundation: _.random(1, 6),
    core: -_.random(1, 6),
    stretch: _.sample([1, -1]) * _.random(8, 12),
  }[difficulty];
  const e = target - (digits - 1);
  const { exponent } = toStandard(num, e);
  return {
    instruction: 'Write as an ordinary number',
    questionMath: sf(num, e),
    answer: plain(num, e),
    workingOut: `\\text{move the decimal point } ${Math.abs(exponent)} \\text{ place${Math.abs(exponent) === 1 ? '' : 's'} to the ${exponent < 0 ? 'left' : 'right'}}${NL}= ${plain(num, e)}`,
    metadata: meta,
  };
};

export const generateStandardFormMultiplyDivide = (options = {}) => {
  const { difficulty = 'core' } = options;
  const meta = sfMeta('standard-form-multiply-divide', difficulty);
  const instruction = 'Work out, giving your answer in standard form';
  const [e1, e2] = [_.random(-6, 8), _.random(-6, 8)];

  if (difficulty === 'foundation' || (difficulty === 'core' && _.random(0, 1))) {
    // Foundation: the digits multiply to under 10. Core: 10 or more, so the
    // answer is adjusted back into standard form.
    let a; let b;
    do { [a, b] = [_.random(2, 9), _.random(2, 9)]; } while (difficulty === 'foundation' ? a * b >= 10 : a * b < 10);
    const adjust = a * b >= 10 ? `${NL}${a * b} \\times 10^{${e1 + e2}} = ${sf(a * b, e1 + e2)}` : '';
    return {
      instruction,
      questionMath: `(${a} \\times 10^{${e1}}) \\times (${b} \\times 10^{${e2}})`,
      answer: sf(a * b, e1 + e2),
      workingOut: `${a} \\times ${b} = ${a * b},\\ 10^{${e1}} \\times 10^{${e2}} = 10^{${e1 + e2}}${adjust || `${NL}= ${sf(a * b, e1 + e2)}`}`,
      metadata: meta,
    };
  }

  if (difficulty === 'core') {
    // Divides exactly, and stays between 1 and 10.
    let b; let q;
    do { [b, q] = [_.random(2, 4), _.random(2, 9)]; } while (b * q >= 10);
    return {
      instruction,
      questionMath: `(${b * q} \\times 10^{${e1}}) \\div (${b} \\times 10^{${e2}})`,
      answer: sf(q, e1 - e2),
      workingOut: `${b * q} \\div ${b} = ${q},\\ 10^{${e1}} \\div 10^{${e2}} = 10^{${e1 - e2}}${NL}= ${sf(q, e1 - e2)}`,
      metadata: meta,
    };
  }

  // Stretch: the quotient of the numbers is below 1 (4.2 / 6 = 0.7), so the
  // answer has to be adjusted back into standard form.
  let b; let q;
  do { b = _.random(2, 9); q = _.random(1, 9); } while (b * q < 10);
  const dividend = sf(b * q, e1 - 1);
  return {
    instruction,
    questionMath: `(${dividend}) \\div (${b} \\times 10^{${e2}})`,
    answer: sf(q, e1 - e2 - 1),
    workingOut: `${toStandard(b * q, -1).mantissa} \\div ${b} = 0.${q},\\ 10^{${e1}} \\div 10^{${e2}} = 10^{${e1 - e2}}${NL}0.${q} \\times 10^{${e1 - e2}} = ${sf(q, e1 - e2 - 1)}`,
    metadata: meta,
  };
};

export const generateStandardFormAddSubtract = (options = {}) => {
  const { difficulty = 'core' } = options;
  const meta = sfMeta('standard-form-add-subtract', difficulty);
  const instruction = 'Work out, giving your answer in standard form';

  if (difficulty === 'foundation') {
    // The same power: add or subtract the numbers, adjusting if the sum
    // reaches 10.
    const e = _.random(-8, 9);
    const n1 = _.random(11, 89);
    const n2 = _.random(11, 89);
    const sub = _.random(0, 1) === 1 && n1 !== n2;
    const [big, small] = sub ? [Math.max(n1, n2), Math.min(n1, n2)] : [n1, n2];
    const res = sub ? big - small : big + small;
    return {
      instruction,
      questionMath: `(${sf(big, e - 1)}) ${sub ? '-' : '+'} (${sf(small, e - 1)})`,
      answer: sf(res, e - 1),
      workingOut: `${plain(big, -1)} ${sub ? '-' : '+'} ${plain(small, -1)} = ${plain(res, -1)}${NL}${
        res >= 10 && res < 100 ? `= ${sf(res, e - 1)}` : `${plain(res, -1)} \\times 10^{${e}} = ${sf(res, e - 1)}`}`,
      metadata: meta,
    };
  }

  // Core: powers one apart. Stretch: two to four apart, and half the time
  // the powers are large, so writing both out in full is no way round it.
  const e = difficulty === 'core' || _.random(0, 1) ? _.random(-5, 7) : _.sample([_.random(12, 30), _.random(-30, -12)]);
  // n1 is two digits, so its standard-form power is e + 1: the raw gap is
  // one more than the gap between the two standard-form powers.
  const gap = (difficulty === 'core' ? 1 : _.random(2, 3)) + 1;
  const n1 = _.random(11, 89);                       // n1 x 10^e, the smaller
  const E2 = toStandard(1, e + gap).exponent;        // the larger power of ten
  const shifted = plain(n1, e - E2);
  const convert = toStandard(n1, e).exponent === E2 ? '' : `${sf(n1, e)} = ${shifted} \\times 10^{${E2}}${NL}`;

  if (_.random(0, 1)) {
    let n2;
    do { n2 = _.random(2, 9); } while (n2 * 10 ** gap <= n1);
    const diff = n2 * 10 ** gap - n1;
    return {
      instruction,
      questionMath: `(${sf(n2, e + gap)}) - (${sf(n1, e)})`,
      answer: sf(diff, e),
      workingOut: `${convert}${n2} - ${shifted} = ${plain(diff, e - E2)}${NL}= ${sf(diff, e)}`,
      metadata: meta,
    };
  }
  const n2 = _.random(2, 9);
  const total = n1 + n2 * 10 ** gap;
  return {
    instruction,
    questionMath: `(${sf(n1, e)}) + (${sf(n2, e + gap)})`,
    answer: sf(total, e),
    workingOut: `${convert}${shifted} + ${n2} = ${plain(total, e - E2)}${NL}= ${sf(total, e)}`,
    metadata: meta,
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

const SIMPLIFIABLE = _.range(8, 601).filter((n) => {
  const [k, m] = simplifySurd(n);
  return k > 1 && m > 1;
});

// Every surd skill asks the same kind of question at every band, so a
// teacher on Mixed (or printing a sheet that ramps) can put any surd
// subtopic in any box. The band changes how much work the question takes,
// never what it practises:
//
//   surds-simplify   √12            →  √72 (largest square factor is not
//                                       the first one spotted)  →  3√20
//   surds-add        √5 + √5        →  √12 + √3  →  three terms, coefficients
//   surds-multiply   √3 × √5        →  √6 × √8 = 4√3  →  2√6 × 3√10, (2√3)²
//   surds-expand     √3(2 + √3)     →  (√3 + 2)(√5 - 1)  →  coefficients,
//                                       two surds per bracket, squares
//   rationalise-denominator  (below)
//
// Answers are collected and written constant first, then each surd in
// increasing order of radicand, every root in simplest form.

// A surd expression as terms [c, r], meaning c√r (r = 1 for a constant).
// collect() simplifies every root and adds like terms; zero terms go.
const collect = (terms) => {
  const by = new Map();
  terms.forEach(([c, r]) => {
    const [k, m] = simplifySurd(r);
    by.set(m, (by.get(m) || 0) + c * k);
  });
  return [...by].filter(([, c]) => c !== 0).sort((x, y) => x[0] - y[0]).map(([m, c]) => [c, m]);
};
// one term, signed after the first; a coefficient of 1 on a root is dropped
const termTex = ([c, r], first) => {
  const body = surd(Math.abs(c), r);
  if (first) return c < 0 ? `-${body}` : body;
  return `${c < 0 ? '-' : '+'} ${body}`;
};
// terms as written, uncollected — for the question's own brackets
const written = (terms) => terms.map((t, i) => termTex(t, i === 0)).join(' ');
const simplest = (terms) => written(collect(terms)) || '0';
const times = (A, B) => A.flatMap(([c1, r1]) => B.map(([c2, r2]) => [c1 * c2, r1 * r2]));
const isPrime = (n) => n > 1 && _.range(2, n).every((d) => n % d !== 0);
const NONSQUARE = (max) => _.range(2, max + 1).filter((n) => Math.sqrt(n) % 1 !== 0);
const signed = (max) => _.sample([..._.range(-max, 0), ..._.range(1, max + 1)]);

/* -------------------------------------------------------- simplifying surds */
//
//   foundation  one prime square factor:          √12, √50, √98
//   core        a composite square factor, so the first factor found is
//               not the largest:                  √72 = 6√2, not 2√18
//   stretch     a coefficient outside as well:    3√20 = 6√5, 2√72 = 12√2

export const generateSurdsSimplify = (options = {}) => {
  const { difficulty = 'core' } = options;
  // Skill-ladder review: "rational or irrational?" no longer has a box of
  // its own; it is one Foundation question in three here.
  if (difficulty === 'foundation' && _.random(0, 2) === 0) {
    return { ...generateRationalOrNot({ difficulty: 'foundation' }), metadata: { topic: 'surds-simplify', difficulty } };
  }
  const pool = {
    foundation: SIMPLIFIABLE.filter((n) => n <= 200 && isPrime(simplifySurd(n)[0])),
    core: SIMPLIFIABLE.filter((n) => !isPrime(simplifySurd(n)[0])),
    stretch: SIMPLIFIABLE.filter((n) => n <= 300 && simplifySurd(n)[1] <= 15),
  }[difficulty];
  const n = _.sample(pool);
  const [k, m] = simplifySurd(n);
  const c = difficulty === 'stretch' ? _.random(2, 5) : 1;
  const lead = c === 1 ? '' : c;
  return {
    instruction: 'Write in simplest surd form',
    questionMath: `${lead}\\sqrt{${n}}`,
    answer: surd(c * k, m),
    workingOut: `${n} = ${k * k} \\times ${m}${NL}${lead}\\sqrt{${n}} = ${lead}${c === 1 ? '' : ' \\times '}\\sqrt{${k * k}} \\times \\sqrt{${m}} = ${surd(c * k, m)}`,
    metadata: { topic: 'surds-simplify', difficulty },
  };
};

/* ----------------------------------------------- adding and subtracting surds */
//
//   foundation  like surds as given:   √5 + √5,  5√3 - 2√3,  2√7 + √7 - 4√7
//   core        two roots, at least one to simplify before they are like:
//               √12 + √3,  √50 - √8
//   stretch     three terms with coefficients and a subtraction, all to
//               simplify; one time in three two different surds remain:
//               2√12 - √27 + √75,  √8 + √12 + √18

export const generateSurdsAdd = (options = {}) => {
  const { difficulty = 'core' } = options;
  let terms, answerTerms;

  if (difficulty === 'foundation') {
    const m = _.sample(SQUAREFREE.filter((v) => v <= 15));
    const count = _.random(0, 2) === 0 ? 3 : 2;
    do {
      terms = _.range(count).map((i) => [(i === 0 ? 1 : _.sample([1, -1])) * _.sample([1, 1, 2, 3, 4, 5, 6, 7, 8, 9]), m]);
      answerTerms = collect(terms);
    } while (answerTerms.length !== 1 || answerTerms[0][0] < 1);
  } else if (difficulty === 'core') {
    const m = _.sample([2, 3, 5, 6, 7]);
    let k1, k2, minus;
    do {
      [k1, k2] = [_.random(1, 6), _.random(1, 6)];
      minus = _.random(0, 2) === 0;
    } while (k1 === k2 || (k1 === 1 && k2 === 1) || k1 * k1 * m > 200 || k2 * k2 * m > 200 || (minus && k1 <= k2));
    // coefficient 1 on the roots as written; the simplifying makes it like
    terms = [[1, k1 * k1 * m], [minus ? -1 : 1, k2 * k2 * m]];
    answerTerms = collect(terms);
  } else {
    const two = _.random(0, 2) === 0;
    const bases = two ? _.sortBy(_.sampleSize([2, 3, 5], 2)) : [_.sample([2, 3, 5, 6, 7])];
    do {
      const ms = two ? _.shuffle([...bases, _.sample(bases)]) : [bases[0], bases[0], bases[0]];
      terms = ms.map((m, i) => {
        let k;
        do { k = _.random(1, 5); } while (k * k * m > 200);
        const c = two ? 1 : _.random(1, 4);
        return [(i === 0 ? 1 : _.sample([1, -1])) * c, k * k * m];
      });
      answerTerms = collect(terms);
    } while (
      terms.filter(([, r]) => simplifySurd(r)[0] > 1).length < 2
      || new Set(terms.map(([, r]) => r)).size < 3
      || answerTerms.length !== bases.length
      || answerTerms.some(([c]) => c < 1)
      || (!two && terms.every(([c]) => c > 0))
    );
  }

  const answer = simplest(terms);
  const each = terms.filter(([, r]) => simplifySurd(r)[0] > 1)
    .map(([c, r]) => `${surd(Math.abs(c), r)} = ${surd(Math.abs(c) * simplifySurd(r)[0], simplifySurd(r)[1])}`);
  const step = written(terms.map(([c, r]) => { const [k, m] = simplifySurd(r); return [c * k, m]; }));
  return {
    instruction: 'Write in simplest surd form',
    questionMath: written(terms),
    answer,
    workingOut: `${each.length ? `${each.join(',\\ ')}${NL}` : ''}${step} = ${answer}`,
    metadata: { topic: 'surds-add', difficulty },
  };
};

/* ---------------------------------------------- multiplying and dividing surds */
//
//   foundation  nothing to simplify after:  √3 × √5,  √7 × √7,  √15 ÷ √3
//   core        simplify after:             √6 × √8 = 4√3,  √96 ÷ √2 = 4√3
//   stretch     coefficients as well:       2√6 × 3√10 = 12√15,  (2√3)²,
//               12√30 over 4√6 = 3√5

export const generateSurdsMultiply = (options = {}) => {
  const { difficulty = 'core' } = options;
  const roll = _.random(0, 3);
  let questionMath, answer, workingOut;

  if (difficulty === 'foundation') {
    const primes = [2, 3, 5, 7, 11, 13];
    if (roll === 0) {
      const a = _.sample(SQUAREFREE.filter((v) => v <= 15));
      questionMath = `\\sqrt{${a}} \\times \\sqrt{${a}}`;
      answer = String(a);
      workingOut = `\\sqrt{${a}} \\times \\sqrt{${a}} = \\sqrt{${a * a}} = ${a}`;
    } else {
      let a, b;
      do { [a, b] = _.sampleSize(primes, 2); } while (a * b > 70);
      if (roll === 1) {
        questionMath = `\\sqrt{${a * b}} \\div \\sqrt{${b}}`;
        answer = `\\sqrt{${a}}`;
        workingOut = `\\sqrt{${a * b}} \\div \\sqrt{${b}} = \\sqrt{${a * b} \\div ${b}} = \\sqrt{${a}}`;
      } else {
        questionMath = `\\sqrt{${a}} \\times \\sqrt{${b}}`;
        answer = `\\sqrt{${a * b}}`;
        workingOut = `\\sqrt{${a}} \\times \\sqrt{${b}} = \\sqrt{${a} \\times ${b}} = \\sqrt{${a * b}}`;
      }
    }
  } else if (difficulty === 'core') {
    if (roll === 0) {
      // √(bq) ÷ √b = √q, and √q simplifies
      let b, q;
      do {
        b = _.sample([2, 3, 5, 6, 7]);
        q = _.sample(SIMPLIFIABLE.filter((v) => v <= 100));
      } while (b * q > 300);
      const [k, m] = simplifySurd(q);
      questionMath = `\\sqrt{${b * q}} \\div \\sqrt{${b}}`;
      answer = surd(k, m);
      workingOut = `\\sqrt{${b * q}} \\div \\sqrt{${b}} = \\sqrt{${q}}${NL}= ${answer}`;
    } else {
      let a, b, k, m;
      do {
        [a, b] = [_.sample(NONSQUARE(30)), _.sample(NONSQUARE(30))];
        [k, m] = simplifySurd(a * b);
      } while (k === 1 || m === 1 || a * b > 600);
      questionMath = `\\sqrt{${a}} \\times \\sqrt{${b}}`;
      answer = surd(k, m);
      workingOut = `\\sqrt{${a}} \\times \\sqrt{${b}} = \\sqrt{${a * b}}${NL}${a * b} = ${k * k} \\times ${m}${NL}= ${answer}`;
    }
  } else if (roll === 0) {
    const p = _.random(2, 6);
    const a = _.sample(SQUAREFREE.filter((v) => v <= 15));
    questionMath = `(${p}\\sqrt{${a}})^2`;
    answer = String(p * p * a);
    workingOut = `(${p}\\sqrt{${a}})^2 = ${p}^2 \\times (\\sqrt{${a}})^2 = ${p * p} \\times ${a} = ${answer}`;
  } else if (roll === 1) {
    // (pq√(bt)) over (q√b) = p√t, with √t sometimes simplifying
    let b, t, p, q;
    do {
      b = _.sample([2, 3, 5, 6, 7]);
      t = _.sample(NONSQUARE(30));
      [p, q] = [_.random(2, 5), _.random(2, 5)];
    } while (b * t > 200);
    const [k, m] = simplifySurd(t);
    questionMath = `\\frac{${p * q}\\sqrt{${b * t}}}{${q}\\sqrt{${b}}}`;
    answer = surd(p * k, m);
    workingOut = `${p * q} \\div ${q} = ${p},\\ \\sqrt{${b * t}} \\div \\sqrt{${b}} = \\sqrt{${t}}${NL}= ${p}\\sqrt{${t}}${k === 1 ? '' : ` = ${answer}`}`;
  } else {
    let a, b, p, q, k, m;
    do {
      [a, b] = [_.sample(NONSQUARE(20)), _.sample(NONSQUARE(20))];
      [p, q] = [_.random(2, 5), _.random(2, 5)];
      [k, m] = simplifySurd(a * b);
    } while (a === b || k === 1 || m === 1 || a * b > 300);
    questionMath = `${p}\\sqrt{${a}} \\times ${q}\\sqrt{${b}}`;
    answer = surd(p * q * k, m);
    workingOut = `${p} \\times ${q} = ${p * q},\\ \\sqrt{${a}} \\times \\sqrt{${b}} = \\sqrt{${a * b}}${NL}= ${p * q}\\sqrt{${a * b}}${k === 1 ? '' : ` = ${answer}`}`;
  }

  return {
    instruction: 'Write in simplest surd form',
    questionMath,
    answer,
    workingOut,
    metadata: { topic: 'surds-multiply', difficulty },
  };
};

/* ------------------------------------------------- expanding brackets with surds */
//
//   foundation  a single bracket, the same surd or a different one inside:
//               √3(2 + √3),  √2(√5 - 3)
//   core        double brackets, the same surd in both or two different
//               ones, sometimes a conjugate pair whose surds cancel:
//               (√3 + 2)(√3 - 5),  (√2 + 1)(√5 - 3),  (√7 + 2)(√7 - 2)
//   stretch     coefficients on the surds, a surd in both terms of each
//               bracket, or a bracket squared; a product of roots may need
//               simplifying: (2√3 + 1)(√6 - 2),  (√5 + √3)(√5 - 2√3),
//               (3√2 - 1)²

// a bracket of two terms, the order shuffled so the surd is not always first
const pair = (s, k) => (_.random(0, 2) === 0 ? [k, s] : [s, k]);

export const generateSurdsExpand = (options = {}) => {
  const { difficulty = 'core' } = options;
  const primes = [2, 3, 5, 7];
  let left, right, questionMath;

  if (difficulty === 'foundation') {
    const a = _.sample(primes);
    const b = _.random(0, 1) ? a : _.sample(primes.filter((v) => v !== a));
    left = [[1, a]];
    right = pair([1, b], [signed(9), 1]);
    if (right[0][0] < 0) right[0][0] = -right[0][0];
    questionMath = `\\sqrt{${a}}(${written(right)})`;
  } else if (difficulty === 'core') {
    const [a, b] = _.random(0, 1) ? [_.sample(primes), null] : _.sampleSize(primes, 2);
    const p = signed(6);
    const q = b === null && _.random(0, 2) === 0 ? -p : signed(6);
    left = [[1, a], [p, 1]];
    right = [[1, b ?? a], [q, 1]];
    questionMath = `(${written(left)})(${written(right)})`;
  } else {
    const roots = [2, 3, 5, 6, 7, 10];
    const roll = _.random(0, 2);
    let square = false;
    do {
      const [a, b] = _.sampleSize(roots, 2);
      if (roll === 0) {
        // (m√a + p)(n√b + q), same or different surds, a coefficient > 1
        const bb = _.random(0, 1) ? a : b;
        left = [[_.random(1, 3), a], [signed(5), 1]];
        right = [[_.random(1, 3), bb], [signed(5), 1]];
        if (left[0][0] === 1 && right[0][0] === 1) left[0][0] = 2;
      } else if (roll === 1) {
        // (m√a + n√b)(r√a + s√b)
        left = [[_.random(1, 3), a], [signed(3), b]];
        right = [[_.random(1, 3), a], [signed(3), b]];
      } else {
        // a square: (m√a ± p)² or (√a ± √b)²
        square = true;
        left = _.random(0, 1) ? [[_.random(1, 3), a], [signed(5), 1]] : [[1, a], [signed(2), b]];
        right = left;
      }
    } while (collect(times(left, right)).length === 0 || Math.max(...collect(times(left, right)).map(([c]) => Math.abs(c))) > 99);
    questionMath = square ? `(${written(left)})^2` : `(${written(left)})(${written(right)})`;
  }

  const raw = times(left, right);
  const answer = simplest(raw);
  const expanded = written(raw.map(([c, r]) => {
    const [k, m] = simplifySurd(r);
    return [c * k, m];
  }));
  return {
    instruction: 'Expand and simplify',
    questionMath,
    answer,
    workingOut: `${expanded}${NL}= ${answer}`,
    metadata: { topic: 'surds-expand', difficulty },
  };
};

// A binomial denominator, b ± sqrt(c): multiply top and bottom by the
// conjugate so the difference of two squares clears the root. The
// denominator b^2 - c goes negative whenever c > b^2 (5 / (1 - sqrt 3)), and
// that sign is part of what is being tested, so it is kept rather than
// avoided.
const rationaliseConjugate = (difficulty) => {
  let a, b, c, D;
  do {
    a = _.random(1, 12);
    b = _.random(1, 7);
    c = _.sample(SQUAREFREE.filter((v) => v <= 15));
    D = b * b - c;
  } while (Math.abs(D) > 40);
  const minus = _.random(0, 1) === 1;           // denominator b - sqrt(c)?
  const conj = `${b} ${minus ? '+' : '-'} \\sqrt{${c}}`;

  // a(b ∓ sqrt c) / D, reduced by the factor common to all three numbers.
  const g = gcd(a, Math.abs(D));
  let p = (a * b) / g, q = (minus ? a : -a) / g, r = D / g;
  if (r < 0) { p = -p; q = -q; r = -r; }
  const qs = (k) => surd(k, c);                  // k sqrt c, k > 0, 1 dropped
  let num, lead = '';
  if (p < 0 && q < 0) { lead = '-'; num = `${-p} + ${qs(-q)}`; }
  else if (p < 0) num = `${qs(q)} - ${-p}`;
  else num = `${p} ${q < 0 ? '-' : '+'} ${qs(Math.abs(q))}`;
  const answer = r === 1 ? (lead ? `-${-p} - ${qs(-q)}` : num) : `${lead}\\frac{${num}}{${r}}`;

  return {
    instruction: 'Write with a rational denominator',
    questionMath: `\\frac{${a}}{${b} ${minus ? '-' : '+'} \\sqrt{${c}}}`,
    answer,
    workingOut: `\\text{multiply top and bottom by } ${conj}${NL}= \\frac{${a === 1 ? '' : a}(${conj})}{${b}^2 - ${c}} = \\frac{${a === 1 ? '' : a}(${conj})}{${D}}${NL}= ${answer}`,
    metadata: { topic: 'rationalise-denominator', difficulty },
  };
};

export const generateRationaliseDenominator = (options = {}) => {
  const { difficulty = 'core' } = options;

  if (difficulty === 'stretch' && _.random(0, 1)) return rationaliseConjugate(difficulty);

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
    // surd() (defined above for surds-simplify) drops a coefficient of 1 —
    // `\sqrt{14}` rather than `1\sqrt{14}` — which the inline template this
    // replaced didn't: a/g reduces to 1 whenever the original numerator a
    // was itself a multiple of den, and did on a real board.
    const answer = den / g === 1 ? surd(a / g, m) : `\\frac{${surd(a / g, m)}}{${den / g}}`;
    return {
      instruction: 'Write with a rational denominator',
      questionMath: `\\frac{${a}}{\\sqrt{${d}}}`,
      answer,
      workingOut: `\\sqrt{${d}} = ${surd(k, m)}${NL}\\frac{${a}}{${surd(k, m)}} = \\frac{${a}\\sqrt{${m}}}{${den}}${NL}= ${answer}`,
      metadata: { topic: 'rationalise-denominator', difficulty },
    };
  }

  // Core, half the time: a two-term numerator, (a ± sqrt(b)) / sqrt(b). The
  // multiply is the same; expanding the top is the extra step. Reduced by any
  // factor a shares with b, so (6 + sqrt(3)) / sqrt(3) ends as 2 sqrt(3) + 1.
  if (difficulty === 'core' && _.random(0, 1)) {
    const b = _.sample(SQUAREFREE.filter((v) => v <= 15));
    const a = _.random(1, 9);
    const minus = _.random(0, 1) === 1;
    const g = gcd(a, b);
    const top = `${surd(a / g, b)} ${minus ? '-' : '+'} ${b / g}`;
    const answer = b / g === 1 ? top : `\\frac{${top}}{${b / g}}`;
    return {
      instruction: 'Write with a rational denominator',
      questionMath: `\\frac{${a} ${minus ? '-' : '+'} \\sqrt{${b}}}{\\sqrt{${b}}}`,
      answer,
      workingOut: `\\text{multiply top and bottom by } \\sqrt{${b}}${NL}= \\frac{${surd(a, b)} ${minus ? '-' : '+'} ${b}}{${b}}${g === 1 ? '' : `${NL}= ${answer}`}`,
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
  const answer = b / g === 1 ? surd(a / g, b) : `\\frac{${surd(a / g, b)}}{${b / g}}`;
  return {
    instruction: 'Write with a rational denominator',
    questionMath: `\\frac{${a}}{\\sqrt{${b}}}`,
    answer,
    workingOut: `\\text{multiply top and bottom by } \\sqrt{${b}}${NL}= \\frac{${a}\\sqrt{${b}}}{${b}}${g === 1 ? '' : `${NL}= ${answer}`}`,
    metadata: { topic: 'rationalise-denominator', difficulty },
  };
};
