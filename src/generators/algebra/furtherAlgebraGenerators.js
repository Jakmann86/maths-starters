// src/generators/algebra/furtherAlgebraGenerators.js
//
// The harder ends of Haese chapters 1, 7 and 16:
//
//   expand-further           1E   (x + 3)(x^2 + 2x + 4), x(x + 1)(x + 3), (x + 2)^3
//   factorise-perfect-square 1I   x^2 + 10x + 25, 9x^2 - 6x + 1, -2x^2 - 8x - 8
//   factorise-fully          1M   a common factor first, then two brackets
//   rearrange-harder         7D   squares and roots, the subject in a
//                                 denominator, the subject twice
//   add-algebraic-fractions  16C-D  one fraction from two: number, then
//                                   binomial, then algebraic denominators
//
// Every question is built from its answer: the factors are chosen and
// multiplied out, the fractions' sum is worked out from the parts. Powers are
// written x^2, as the rest of the algebra files write them.

import _ from 'lodash';
import { gcd } from '../shared';

const NL = '\n';
const nz = (lo, hi) => { let n = 0; while (n === 0) n = _.random(lo, hi); return n; };

/* ------------------------------------------------------- polynomials */
// A polynomial is an array of integer coefficients, index = power.

const mul = (p, q) => {
  const out = Array(p.length + q.length - 1).fill(0);
  p.forEach((a, i) => q.forEach((b, j) => { out[i + j] += a * b; }));
  return out;
};
const lin = (a, b) => [b, a]; // a x + b

// A polynomial as TeX in descending powers: 2x^3 - x^2 + 5.
export const polyTex = (p, v = 'x') => {
  const terms = [];
  for (let k = p.length - 1; k >= 0; k -= 1) {
    const c = p[k];
    if (!c) continue;
    const mag = Math.abs(c);
    const body = k === 0 ? `${mag}` : `${mag === 1 ? '' : mag}${v}${k > 1 ? `^${k}` : ''}`;
    terms.push(terms.length ? `${c < 0 ? '-' : '+'} ${body}` : `${c < 0 ? '-' : ''}${body}`);
  }
  return terms.length ? terms.join(' ') : '0';
};
const br = (p, v = 'x') => `(${polyTex(p, v)})`;
// A linear bracket with the constant first, as Haese sometimes writes it: (3 - x).
const brRev = ([b, a], v = 'x') => `(${b} ${a < 0 ? '-' : '+'} ${Math.abs(a) === 1 ? '' : Math.abs(a)}${v})`;

/* ----------------------------------------------------- expand-further */
//
//   foundation  a linear bracket times a quadratic   (x + 3)(x^2 + 2x - 4)
//   core        three linear brackets, or a cube     x(x - 3)(x + 2), (x + 1)(x - 3)(x + 2), (x - 4)^3
//   stretch     the same with coefficients           (2x - 3)(x + 3)(x - 1), (3x + 1)^3, (2x - 5)(x^2 - 2x - 3)

export const generateExpandFurther = (options = {}) => {
  const { difficulty = 'core' } = options;
  const meta = { topic: 'expand-further', difficulty };
  const kind = _.random(0, 1);
  const out = (q, steps, ans) => ({
    instruction: 'Expand and simplify',
    questionMath: q,
    answer: polyTex(ans),
    workingOut: [...steps, polyTex(ans)].join(NL),
    metadata: meta,
  });

  if (difficulty === 'foundation') {
    const L = lin(1, nz(-6, 6));
    const Q = [nz(-9, 9), nz(-5, 5), 1];
    const ans = mul(L, Q);
    return out(`${br(L)}${br(Q)}`, [`x${br(Q)} ${L[0] < 0 ? '-' : '+'} ${Math.abs(L[0])}${br(Q)}`], ans);
  }

  if (difficulty === 'core') {
    if (kind) {
      const a = nz(-6, 6);
      const cube = mul(mul(lin(1, a), lin(1, a)), lin(1, a));
      const sq = mul(lin(1, a), lin(1, a));
      return out(`${br(lin(1, a))}^3`, [`${br(lin(1, a))}${br(sq)}`], cube);
    }
    const lead = _.random(0, 1) ? [0, 1] : lin(1, nz(-6, 6));
    const [b, c] = [nz(-6, 6), nz(-6, 6)];
    const B = lin(1, b), C = lin(1, c);
    const first = mul(lead, B);
    const q = lead[0] === 0 ? `x${br(B)}${br(C)}` : `${br(lead)}${br(B)}${br(C)}`;
    return out(q, [`${br(first)}${br(C)}`], mul(first, C));
  }

  // Stretch: coefficients.
  if (kind) {
    const p = _.random(2, 3), a = nz(-5, 5);
    const L = lin(p, a);
    const sq = mul(L, L);
    if (gcd(p, a) !== 1) return generateExpandFurther(options);
    return out(`${br(L)}^3`, [`${br(L)}${br(sq)}`], mul(sq, L));
  }
  if (_.random(0, 1)) {
    const L = lin(_.random(2, 4) * _.sample([1, 1, -1]), nz(-5, 5));
    const Q = [nz(-6, 6), nz(-5, 5), _.random(1, 3)];
    if (gcd(L[1], L[0]) !== 1) return generateExpandFurther(options);
    return out(`${br(L)}${br(Q)}`, [`${L[1] === 1 ? '' : L[1] === -1 ? '-' : L[1]}x${br(Q)} ${L[0] < 0 ? '-' : '+'} ${Math.abs(L[0])}${br(Q)}`], mul(L, Q));
  }
  const A = lin(_.random(2, 4), nz(-5, 5));
  if (gcd(A[1], A[0]) !== 1) return generateExpandFurther(options);
  const B = lin(1, nz(-5, 5)), C = lin(_.sample([1, 1, -1]), nz(-6, 6));
  const cTex = C[1] === -1 ? brRev(C) : br(C);
  const first = mul(A, B);
  return out(`${br(A)}${br(B)}${cTex}`, [`${br(first)}${cTex}`], mul(first, C));
};

/* -------------------------------------------- factorise-perfect-square */
//
//   foundation  x^2 + 2ax + a^2                  -> (x + a)^2
//   core        p^2x^2 + 2pqx + q^2, p > 1        -> (px + q)^2
//   stretch     a common factor first, which may be negative
//                                                -> -2(2x + 3)^2, 3(x - 4)^2

const LETTERS = ['x', 'x', 'x', 'y', 'm', 't', 'a'];

export const generateFactorisePerfectSquare = (options = {}) => {
  const { difficulty = 'core' } = options;
  const meta = { topic: 'factorise-perfect-square', difficulty };
  const v = _.sample(LETTERS);
  let p = 1, q, k = 1;
  if (difficulty === 'foundation') q = nz(-10, 10);
  else if (difficulty === 'core') {
    p = _.random(2, 5); q = nz(-7, 7);
    if (gcd(p, Math.abs(q)) !== 1) return generateFactorisePerfectSquare(options);
  } else {
    p = _.random(1, 3); q = nz(-6, 6);
    if (gcd(p, Math.abs(q)) !== 1) return generateFactorisePerfectSquare(options);
    k = _.sample([2, 3, 4, 5, -1, -2, -3]);
  }
  const L = lin(p, q);
  const e = mul(L, L).map((c) => c * k);
  const kTex = k === 1 ? '' : k === -1 ? '-' : `${k}`;
  const inner = mul(L, L);
  const steps = [];
  if (k !== 1) steps.push(`${kTex}${br(inner, v)}`);
  const pTex = p === 1 ? v : `${p}${v}`;
  steps.push(`${kTex}${k === 1 ? '' : '('}${p === 1 ? `${v}^2` : `(${pTex})^2`} ${q < 0 ? '-' : '+'} 2 \\times ${pTex} \\times ${Math.abs(q)} + ${Math.abs(q)}^2${k === 1 ? '' : ')'}`);
  const ans = `${kTex}${br(L, v)}^2`;
  return {
    instruction: 'Fully factorise',
    questionMath: polyTex(e, v),
    answer: ans,
    workingOut: [...steps, ans].join(NL),
    metadata: meta,
  };
};

/* ---------------------------------------------------- factorise-fully */
//
//   foundation  a number, then the difference of two squares   3x^2 - 27 -> 3(x - 3)(x + 3)
//   core        a number or x, then x^2 + bx + c               2x^2 + 10x + 8 -> 2(x + 1)(x + 4)
//                                                              x^3 - 7x^2 - 8x -> x(x - 8)(x + 1)
//   stretch     a negative x^2, or a number then ax^2 + bx + c  -x^2 - 3x + 54 -> -(x + 9)(x - 6)
//                                                              24x^2 + 28x - 12 -> 4(2x + 3)(3x - 1)

// The factors of a product, written in a steady order: number, x, then the
// brackets by their constant.
const factorTex = (k, xPow, brackets) => {
  const head = `${k === 1 ? '' : k === -1 ? '-' : k}${xPow ? `x${xPow > 1 ? `^${xPow}` : ''}` : ''}`;
  return `${head}${brackets.map((b) => br(b)).join('')}`;
};

export const generateFactoriseFully = (options = {}) => {
  const { difficulty = 'core' } = options;
  const meta = { topic: 'factorise-fully', difficulty };
  const kind = _.random(0, 1);
  const out = (e, k, xPow, brackets, mid) => ({
    instruction: 'Fully factorise',
    questionMath: polyTex(e),
    answer: factorTex(k, xPow, brackets),
    workingOut: [mid, factorTex(k, xPow, brackets)].join(NL),
    metadata: meta,
  });

  if (difficulty === 'foundation') {
    // k(p^2x^2 - q^2), the bracket the difference of two squares.
    const k = _.random(2, 10), p = kind ? 1 : _.random(2, 3), q = _.random(1, kind ? 10 : 5);
    if (gcd(p, q) !== 1) return generateFactoriseFully(options);
    const inner = [-q * q, 0, p * p];
    return out(inner.map((c) => c * k), k, 0, [lin(p, -q), lin(p, q)], `${k}${br(inner)}`);
  }

  if (difficulty === 'core') {
    const [a, b] = [nz(-8, 8), nz(-8, 8)];
    if (a === -b) return generateFactoriseFully(options); // that is the Foundation shape
    const inner = mul(lin(1, a), lin(1, b));
    const brs = _.sortBy([lin(1, a), lin(1, b)], (x) => x[0]);
    if (kind) {
      const k = _.random(2, 6);
      return out(inner.map((c) => c * k), k, 0, brs, `${k}${br(inner)}`);
    }
    const e = [0, ...inner];
    return out(e, 1, 1, brs, `x${br(inner)}`);
  }

  // Stretch
  if (kind) {
    // -(x + a)(x + b): take out -1 first.
    const [a, b] = [nz(-9, 9), nz(-9, 9)];
    if (a === -b) return generateFactoriseFully(options);
    const inner = mul(lin(1, a), lin(1, b));
    const k = _.sample([-1, -1, -2, -3]);
    const brs = _.sortBy([lin(1, a), lin(1, b)], (x) => x[0]);
    return out(inner.map((c) => c * k), k, 0, brs, `${k === -1 ? '-' : k}${br(inner)}`);
  }
  for (;;) {
    const [m, r] = [_.random(2, 4), _.random(1, 3)];
    const [n, s] = [nz(-5, 5), nz(-5, 5)];
    if (gcd(m, Math.abs(n)) !== 1 || gcd(r, Math.abs(s)) !== 1 || (m === r && n === s)) continue;
    const inner = mul(lin(m, n), lin(r, s));
    if (inner[1] === 0) continue;
    const k = _.random(2, 5);
    return out(inner.map((c) => c * k), k, 0, _.sortBy([lin(m, n), lin(r, s)], (x) => -x[1]), `${k}${br(inner)}`);
  }
};

/* --------------------------------------------------- rearrange-harder */
//
//   foundation  a square or a root          y = 3x^2 - 5 -> x = sqrt((y + 5)/3)
//   core        the subject in a denominator  y = 6/(x + 2) -> x = 6/y - 2
//   stretch     the subject twice, so factorise it out
//                                          y = (x + 3)/(x - 2) -> x = (2y + 3)/(y - 1)

const sign = (c) => (c < 0 ? `- ${-c}` : `+ ${c}`);

export const generateRearrangeHarder = (options = {}) => {
  const { difficulty = 'core' } = options;
  const meta = { topic: 'rearrange-harder', difficulty };
  const kind = _.random(0, 1);
  const out = (q, steps, ans) => ({
    instruction: 'Make x the subject',
    questionMath: q,
    answer: `x = ${ans}`,
    workingOut: [...steps, `x = ${ans}`].join(NL),
    metadata: meta,
  });

  if (difficulty === 'foundation') {
    const a = _.random(2, 9), b = nz(-9, 9);
    if (kind) {
      // y = a x^2 + b
      return out(`y = ${a}x^2 ${sign(b)}`, [`${a}x^2 = y ${sign(-b)}`, `x^2 = \\frac{y ${sign(-b)}}{${a}}`], `\\sqrt{\\frac{y ${sign(-b)}}{${a}}}`);
    }
    // y = sqrt(x / a) + b, or y = a sqrt(x)
    if (_.random(0, 1)) return out(`y = ${a}\\sqrt{x}`, [`\\sqrt{x} = \\frac{y}{${a}}`], `\\frac{y^2}{${a * a}}`);
    return out(`y = \\sqrt{\\frac{x}{${a}}}`, [`y^2 = \\frac{x}{${a}}`], `${a}y^2`);
  }

  if (difficulty === 'core') {
    const a = _.random(2, 12), b = nz(-9, 9);
    if (kind) {
      // y = a/(x + b)
      return out(`y = \\frac{${a}}{x ${sign(b)}}`, [`y(x ${sign(b)}) = ${a}`, `x ${sign(b)} = \\frac{${a}}{y}`], `\\frac{${a}}{y} ${sign(-b)}`);
    }
    // y = a/x + b
    return out(`y = \\frac{${a}}{x} ${sign(b)}`, [`y ${sign(-b)} = \\frac{${a}}{x}`, `x(y ${sign(-b)}) = ${a}`], `\\frac{${a}}{y ${sign(-b)}}`);
  }

  // Stretch: the subject twice.
  if (kind) {
    // y = (x + a)/(x - b)  ->  yx - by = x + a  ->  x(y - 1) = a + by
    const a = nz(-9, 9), b = nz(-9, 9);
    if (a === -b) return generateRearrangeHarder(options);
    return out(
      `y = \\frac{x ${sign(a)}}{x ${sign(-b)}}`,
      [`y(x ${sign(-b)}) = x ${sign(a)}`, `xy - x = ${b === 1 ? '' : b === -1 ? '-' : b}y ${sign(a)}`, `x(y - 1) = ${b === 1 ? '' : b === -1 ? '-' : b}y ${sign(a)}`],
      b > 0
        ? `\\frac{${b === 1 ? '' : b}y ${sign(a)}}{y - 1}`
        : `-\\frac{${b === -1 ? '' : -b}y ${sign(-a)}}{y - 1}`,
    );
  }
  // a x + b = c x y  ->  x(cy - a) = b
  const a = _.random(2, 9), b = _.random(2, 12), c = _.random(2, 9);
  return out(`${a}x + ${b} = ${c}xy`, [`${b} = ${c}xy - ${a}x`, `${b} = x(${c}y - ${a})`], `\\frac{${b}}{${c}y - ${a}}`);
};

/* ------------------------------------------- add-algebraic-fractions */
//
//   foundation  number denominators, one-term numerators   x/3 + 5x/6 -> 7x/6
//   core        number denominators, two-term numerators   (x - 1)/3 - (x + 2)/7 -> (4x - 13)/21
//   stretch     a letter in a denominator                  2/x + 3/(x + 1) -> (5x + 2)/(x(x + 1))
//
// The answer is one fraction in lowest terms; a numerator is expanded and a
// denominator left in factors.

const lcm = (a, b) => (a * b) / gcd(a, b);
// n/d with the sign out in front when the numerator leads with a minus:
// -\frac{4x + 1}{6}, not \frac{-4x - 1}{6}.
const signedFrac = (num, denTex, v) => {
  const lead = num[num.length - 1] || num[0];
  return lead < 0 ? `-\\frac{${polyTex(num.map((c) => -c), v)}}{${denTex}}` : `\\frac{${polyTex(num, v)}}{${denTex}}`;
};
const times = (c, t) => (c === 1 ? t : `${c}${t}`);
const monoTex = (c, v) => `${c === 1 ? '' : c === -1 ? '-' : c}${v}`;

export const generateAddAlgebraicFractions = (options = {}) => {
  const { difficulty = 'core' } = options;
  const meta = { topic: 'add-algebraic-fractions', difficulty };
  const op = _.random(0, 1) ? 1 : -1;
  const opTex = op > 0 ? '+' : '-';
  const v = _.sample(['x', 'x', 'a', 'b', 'y', 'n']);

  for (;;) {
    if (difficulty === 'foundation') {
      // p v / d1 ± q v / d2
      const [d1, d2] = [_.random(2, 9), _.random(2, 9)];
      if (d1 === d2) continue;
      const [p, q] = [_.random(1, 5), _.random(1, 5)];
      if (gcd(p, d1) !== 1 || gcd(q, d2) !== 1) continue;
      const L = lcm(d1, d2);
      const num = p * (L / d1) + op * q * (L / d2);
      if (num === 0) continue;
      const g = gcd(Math.abs(num), L);
      const [nn, dd] = [num / g, L / g];
      const ans = dd === 1 ? monoTex(nn, v) : `${nn < 0 ? '-' : ''}\\frac{${monoTex(Math.abs(nn), v)}}{${dd}}`;
      return {
        instruction: 'Write as a single fraction',
        questionMath: `\\frac{${monoTex(p, v)}}{${d1}} ${opTex} \\frac{${monoTex(q, v)}}{${d2}}`,
        answer: ans,
        workingOut: [`\\frac{${monoTex(p * (L / d1), v)}}{${L}} ${opTex} \\frac{${monoTex(q * (L / d2), v)}}{${L}}`, `\\frac{${monoTex(num, v)}}{${L}}`, ...(g > 1 || num < 0 ? [ans] : [])].join(NL),
        metadata: meta,
      };
    }

    if (difficulty === 'core') {
      // (a1 v + b1)/d1 ± (a2 v + b2)/d2
      const [d1, d2] = [_.random(2, 9), _.random(2, 9)];
      if (d1 === d2) continue;
      const A = [nz(-7, 7), _.random(1, 3)], B = [nz(-7, 7), _.random(1, 3)];
      const L = lcm(d1, d2);
      const m1 = L / d1, m2 = L / d2;
      const num = [m1 * A[0] + op * m2 * B[0], m1 * A[1] + op * m2 * B[1]];
      if (num[1] === 0 || num[0] === 0) continue;
      const g = gcd(gcd(Math.abs(num[0]), Math.abs(num[1])), L);
      if (g > 1) continue; // keep the answer a fraction that cannot cancel
      return {
        instruction: 'Write as a single fraction',
        questionMath: `\\frac{${polyTex(A, v)}}{${d1}} ${opTex} \\frac{${polyTex(B, v)}}{${d2}}`,
        answer: signedFrac(num, L, v),
        workingOut: [
          `\\frac{${m1 === 1 ? polyTex(A, v) : `${m1}(${polyTex(A, v)})`} ${opTex} ${m2 === 1 ? (op < 0 ? `(${polyTex(B, v)})` : polyTex(B, v)) : `${m2}(${polyTex(B, v)})`}}{${L}}`,
          `\\frac{${polyTex(num, v)}}{${L}}`,
          ...(num[1] < 0 ? [signedFrac(num, L, v)] : []),
        ].join(NL),
        metadata: meta,
      };
    }

    // Stretch: p/(v + a) ± q/(v + b), or p/v ± q/(v + b).
    const [p, q] = [_.random(1, 6), _.random(1, 6)];
    const a = _.random(0, 2) === 0 ? 0 : nz(-6, 6);
    const b = nz(-6, 6);
    if (a === b) continue;
    const D1 = lin(1, a), D2 = lin(1, b);
    // p(v + b) ± q(v + a)
    const num = [p * b + op * q * a, p + op * q];
    if (num[1] === 0 && num[0] === 0) continue;
    const ng = gcd(Math.abs(num[0]), Math.abs(num[1]));
    if (ng > 1) continue; // nothing to cancel with the brackets anyway; keep it clean
    const d1Tex = a === 0 ? v : `${polyTex(D1, v)}`;
    const denTex = a === 0 ? `${v}(${polyTex(D2, v)})` : `(${polyTex(D1, v)})(${polyTex(D2, v)})`;
    return {
      instruction: 'Write as a single fraction',
      questionMath: `\\frac{${p}}{${d1Tex}} ${opTex} \\frac{${q}}{${polyTex(D2, v)}}`,
      answer: signedFrac(num, denTex, v),
      workingOut: [
        `\\frac{${times(p, `(${polyTex(D2, v)})`)} ${opTex} ${a === 0 ? times(q, v) : times(q, `(${polyTex(D1, v)})`)}}{${denTex}}`,
        `\\frac{${polyTex(num, v)}}{${denTex}}`,
        ...((num[1] || num[0]) < 0 ? [signedFrac(num, denTex, v)] : []),
      ].join(NL),
      metadata: meta,
    };
  }
};
