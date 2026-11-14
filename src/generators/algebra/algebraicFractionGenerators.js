// src/generators/algebra/algebraicFractionGenerators.js
//
// Haese chapter 16: algebraic fractions.
//
//   16A.1  generateSimplifyAlgebraicFraction     cancel a monomial fraction
//   16A.2  generateSimplifyFractionsFactorising  factorise first, then cancel
//   16B    generateMultiplyAlgebraicFractions    multiply
//   16B    generateDivideAlgebraicFractions      divide
//
// Every line of workingOut is an expression equal to the question, so the
// verification harness can evaluate the question, the answer and every
// working line at the same randomised variable assignment and require them
// all to agree. That catches a wrong intermediate line, which a check on the
// final answer alone does not.

import _ from 'lodash';
import { gcd } from '../shared';

const NL = '\n';

/* ------------------------------------------------------------------ *
 * Rendering helpers
 * ------------------------------------------------------------------ */


/** `c x^2 y` from a coefficient and a { var: exponent } map. */
function monomial(coef, powers) {
  const parts = [];
  Object.keys(powers).sort().forEach((v) => {
    const e = powers[v];
    if (e === 1) parts.push(v);
    else if (e > 1) parts.push(`${v}^${e}`);
  });
  if (parts.length === 0) return String(coef);
  return coef === 1 ? parts.join('') : `${coef}${parts.join('')}`;
}

/** A fraction, collapsing to the numerator alone when the denominator is 1. */
const frac = (n, d) => (String(d) === '1' ? String(n) : `\\frac{${n}}{${d}}`);

/** `(x + 4)`, `(x - 3)`, or bare `x` when the constant is zero. */
const bracket = (c) => (c === 0 ? 'x' : `(x ${c < 0 ? '-' : '+'} ${Math.abs(c)})`);

/** The same thing without its brackets, for use inside a \frac. */
const bare = (c) => (c === 0 ? 'x' : `x ${c < 0 ? '-' : '+'} ${Math.abs(c)}`);

/** k(x + c) multiplied out. */
function expandLinear(k, c) {
  const kx = k === 1 ? 'x' : `${k}x`;
  if (c === 0) return kx;
  return `${kx} ${c < 0 ? '-' : '+'} ${Math.abs(k * c)}`;
}

/** k·x(x + c) multiplied out. */
function expandXLinear(k, c) {
  const kx2 = k === 1 ? 'x^2' : `${k}x^2`;
  if (c === 0) return kx2;
  const b = Math.abs(k * c);
  return `${kx2} ${c < 0 ? '-' : '+'} ${b === 1 ? '' : b}x`;
}

/** (x + p)(x + q) multiplied out. */
function expandQuadratic(p, q) {
  const b = p + q;
  const c = p * q;
  let s = 'x^2';
  if (b !== 0) s += ` ${b < 0 ? '-' : '+'} ${Math.abs(b) === 1 ? '' : Math.abs(b)}x`;
  if (c !== 0) s += ` ${c < 0 ? '-' : '+'} ${Math.abs(c)}`;
  return s;
}

/**
 * Divide one monomial by another. Returns the reduced numerator and
 * denominator strings plus the raw parts, so a caller can test whether the
 * result is trivial before accepting the question.
 */
function reduceMonomials(c1, p1, c2, p2) {
  const g = gcd(c1, c2);
  const n1 = c1 / g;
  const n2 = c2 / g;
  const numP = {};
  const denP = {};
  new Set([...Object.keys(p1), ...Object.keys(p2)]).forEach((v) => {
    const d = (p1[v] || 0) - (p2[v] || 0);
    if (d > 0) numP[v] = d;
    else if (d < 0) denP[v] = -d;
  });
  return {
    num: monomial(n1, numP),
    den: monomial(n2, denP),
    n1,
    n2,
    numP,
    denP,
    changed: g > 1 || Object.keys(numP).length + Object.keys(denP).length
      < Object.keys(p1).length + Object.keys(p2).length,
  };
}

const VARS = ['a', 'b', 'm', 'n', 'p', 't', 'x', 'y'];

/* ------------------------------------------------------------------ *
 * 16A.1 — simplifying a monomial fraction
 *
 * Foundation  one variable, index 0 or 1        6a/3
 * Core        two variables, indices up to 4    15x^2y^3 / 3xy^4
 * Stretch     a bracketed power to expand       (3a^2)^2 / 18a^3
 * ------------------------------------------------------------------ */

export const generateSimplifyAlgebraicFraction = (options = {}) => {
  const { difficulty = 'core' } = options;

  if (difficulty === 'stretch') {
    // (c v^m)^2 over d v^n. Squaring the coefficient *and* the index is the
    // whole point of the band, so both must be > 1.
    for (;;) {
      const v = _.sample(VARS);
      const c = _.random(2, 5);
      const m = _.random(1, 3);
      const sq = c * c;
      const d = _.sample([2, 3, 4, 6, 8, 9, 12, 16, 18, 25, 27]);
      if (gcd(sq, d) === 1) continue;
      const n = _.random(1, 2 * m + 1);
      const expanded = { num: monomial(sq, { [v]: 2 * m }), den: monomial(d, { [v]: n }) };
      const r = reduceMonomials(sq, { [v]: 2 * m }, d, { [v]: n });
      const answer = frac(r.num, r.den);
      if (answer === '1') continue;               // nothing left to read
      if (r.num === expanded.num) continue;       // nothing actually cancelled

      const inner = m === 1 ? `${c}${v}` : `${c}${v}^${m}`;
      return {
        instruction: 'Simplify',
        questionMath: `\\frac{(${inner})^2}{${monomial(d, { [v]: n })}}`,
        answer,
        workingOut: [
          frac(expanded.num, expanded.den),
          answer,
        ].join(NL),
        metadata: { topic: 'simplify-algebraic-fractions', difficulty },
      };
    }
  }

  if (difficulty === 'foundation') {
    for (;;) {
      const v = _.sample(VARS);
      const [m, n] = _.sample([[1, 0], [0, 1], [1, 1]]);
      const g = _.random(2, 6);
      const n1 = _.random(1, 5);
      const n2 = _.random(1, 5);
      if (gcd(n1, n2) !== 1) continue;
      if (n1 === 1 && n2 === 1 && m === n) continue;   // answer would be 1
      const c1 = g * n1;
      const c2 = g * n2;
      if (c1 > 24 || c2 > 24) continue;

      const p1 = m ? { [v]: m } : {};
      const p2 = n ? { [v]: n } : {};
      const r = reduceMonomials(c1, p1, c2, p2);
      const answer = frac(r.num, r.den);
      if (answer === '1') continue;

      // Haese's own presentation: pull the common factor out on each side
      // before cancelling, so the cancelled thing is visibly a factor.
      const factored = (coef, rest, powers) => {
        const bits = [];
        if (rest !== 1) bits.push(String(rest));
        bits.push(String(coef));
        Object.keys(powers).forEach((k) => {
          bits.push(powers[k] === 1 ? k : `${k}^${powers[k]}`);
        });
        return bits.join(' \\times ');
      };

      return {
        instruction: 'Simplify',
        questionMath: `\\frac{${monomial(c1, p1)}}{${monomial(c2, p2)}}`,
        answer,
        workingOut: [
          `\\frac{${factored(g, n1, p1)}}{${factored(g, n2, p2)}}`,
          answer,
        ].join(NL),
        metadata: { topic: 'simplify-algebraic-fractions', difficulty },
      };
    }
  }

  // core
  for (;;) {
    const [v1, v2] = _.sampleSize(VARS, 2);
    const m1 = _.random(0, 3);
    const n1 = _.random(0, 3);
    const m2 = _.random(0, 3);
    const n2 = _.random(0, 3);
    // A variable present on both sides with the SAME index is dead weight —
    // it vanishes without the student subtracting anything, and it sits in
    // the working line looking like it matters. Reject those outright, so
    // every shared variable is a genuine index subtraction.
    if ((m1 > 0 && m1 === n1) || (m2 > 0 && m2 === n2)) continue;
    const shared = (m1 > 0 && n1 > 0) || (m2 > 0 && n2 > 0);
    const big = Math.max(m1, n1, m2, n2) >= 2;
    if (!shared || !big) continue;
    if (m1 === n1 && m2 === n2) continue;
    if (m1 + m2 === 0 || n1 + n2 === 0) continue;

    const g = _.random(2, 5);
    const a = _.random(1, 5);
    const b = _.random(1, 5);
    if (gcd(a, b) !== 1) continue;
    const c1 = g * a;
    const c2 = g * b;
    if (c1 > 24 || c2 > 24) continue;

    const p1 = {};
    const p2 = {};
    if (m1) p1[v1] = m1;
    if (m2) p1[v2] = m2;
    if (n1) p2[v1] = n1;
    if (n2) p2[v2] = n2;

    const r = reduceMonomials(c1, p1, c2, p2);
    const answer = frac(r.num, r.den);
    if (answer === '1') continue;

    return {
      instruction: 'Simplify',
      questionMath: `\\frac{${monomial(c1, p1)}}{${monomial(c2, p2)}}`,
      answer,
      workingOut: [
        // Coefficients first, then the indices — two readable steps rather
        // than one leap.
        frac(monomial(a, p1), monomial(b, p2)),
        answer,
      ].join(NL),
      metadata: { topic: 'simplify-algebraic-fractions', difficulty },
    };
  }
};

/* ------------------------------------------------------------------ *
 * 16A.2 — factorise, then cancel
 *
 * Foundation  common factor on one side only    (5x + 20) / 10
 * Core        common factor on both sides       (2x^2 - 4x) / (4x - 8)
 * Stretch     a trinomial on both sides         (x^2 - x - 6)/(x^2 - 4x + 3)
 * ------------------------------------------------------------------ */

export const generateSimplifyFractionsFactorising = (options = {}) => {
  const { difficulty = 'core' } = options;

  if (difficulty === 'foundation') {
    for (;;) {
      const linearOnTop = _.random(0, 1) === 1;
      const k = _.random(2, 6);
      const c = _.sample([-8, -6, -5, -4, -3, -2, -1, 1, 2, 3, 4, 5, 6, 8]);
      const d = _.random(2, 20);
      const g = gcd(k, d);
      if (g < 2) continue;
      const k2 = k / g;
      const d2 = d / g;

      if (linearOnTop) {
        // k(x + c) over d
        const answer = d2 === 1
          ? expandLinear(k2, c)
          : `\\frac{${k2 === 1 ? bare(c) : `${k2}${bracket(c)}`}}{${d2}}`;
        return {
          instruction: 'Simplify by factorising',
          questionMath: `\\frac{${expandLinear(k, c)}}{${d}}`,
          answer,
          workingOut: [
            `\\frac{${k}${bracket(c)}}{${d}}`,
            answer,
          ].join(NL),
          metadata: { topic: 'simplify-fractions-factorising', difficulty },
        };
      }

      // d over k(x + c)
      const den = k2 === 1 ? bare(c) : `${k2}${bracket(c)}`;
      const answer = `\\frac{${d2}}{${den}}`;
      return {
        instruction: 'Simplify by factorising',
        questionMath: `\\frac{${d}}{${expandLinear(k, c)}}`,
        answer,
        workingOut: [
          `\\frac{${d}}{${k}${bracket(c)}}`,
          answer,
        ].join(NL),
        metadata: { topic: 'simplify-fractions-factorising', difficulty },
      };
    }
  }

  if (difficulty === 'core') {
    for (;;) {
      const p = _.sample([-9, -8, -7, -6, -5, -4, -3, -2, 2, 3, 4, 5, 6, 7, 8, 9]);
      const squareForm = _.random(0, 1) === 1;

      if (squareForm) {
        // (x + p)^2 over c(x + p)
        const c = _.random(2, 12);
        const answer = `\\frac{${bare(p)}}{${c}}`;
        return {
          instruction: 'Simplify by factorising',
          questionMath: `\\frac{${expandQuadratic(p, p)}}{${expandLinear(c, p)}}`,
          answer,
          workingOut: [
            `\\frac{${bracket(p)}${bracket(p)}}{${c}${bracket(p)}}`,
            answer,
          ].join(NL),
          metadata: { topic: 'simplify-fractions-factorising', difficulty },
        };
      }

      // c1·x(x + p) over c2(x + p). The coefficients are redrawn here, not
      // by going round the outer loop, which would redraw squareForm too
      // and tip the mix towards the perfect square.
      let c1, c2, g;
      do { c1 = _.random(2, 9); c2 = _.random(2, 15); g = gcd(c1, c2); } while (g < 2);
      const a = c1 / g;
      const b = c2 / g;
      const answer = frac(monomial(a, { x: 1 }), String(b));
      return {
        instruction: 'Simplify by factorising',
        questionMath: `\\frac{${expandXLinear(c1, p)}}{${expandLinear(c2, p)}}`,
        answer,
        workingOut: [
          `\\frac{${c1 === 1 ? 'x' : `${c1}x`}${bracket(p)}}{${c2}${bracket(p)}}`,
          answer,
        ].join(NL),
        metadata: { topic: 'simplify-fractions-factorising', difficulty },
      };
    }
  }

  // stretch — (x + p)(x + q) over (x + p)(x + r), one shared factor only.
  // q === -p gives a difference of two squares on top for free.
  for (;;) {
    const roots = _.range(-6, 7);
    const p = _.sample(roots);
    const q = _.sample(roots);
    const r = _.sample(roots);
    if (p === q || p === r || q === r) continue;
    if (q === 0 && r === 0) continue;

    const answer = `\\frac{${bare(q)}}{${bare(r)}}`;
    return {
      instruction: 'Simplify by factorising',
      questionMath: `\\frac{${expandQuadratic(p, q)}}{${expandQuadratic(p, r)}}`,
      answer,
      workingOut: [
        `\\frac{${bracket(p)}${bracket(q)}}{${bracket(p)}${bracket(r)}}`,
        answer,
      ].join(NL),
      metadata: { topic: 'simplify-fractions-factorising', difficulty },
    };
  }
};

/* ------------------------------------------------------------------ *
 * 16B — multiplying, and dividing: two skills (skill-ladder review), each
 * with the same three gears, so a band never swaps the operation.
 *
 * Foundation  single terms, no indices           x/4 x 8/y,  6/x / 2/y
 * Core        indices to add or subtract         x^2/4 x 6/x^3
 * Stretch     factorise, then cancel across      (x^2 - 9)/6 x 4/(x + 3)
 * ------------------------------------------------------------------ */

/** x·y for monomial terms { c, powers }. */
const mulTerms = (x, y) => {
  const powers = { ...x.powers };
  Object.keys(y.powers).forEach((k) => { powers[k] = (powers[k] || 0) + y.powers[k]; });
  return { c: x.c * y.c, powers };
};
const mono = (t) => monomial(t.c, t.powers);

/**
 * A/B (x or ÷) C/D with monomials. Foundation keeps every index at 1; Core
 * needs an index of 2 or more somewhere. Dividing sometimes divides by a
 * whole number (Haese 16B Q2j).
 */
function monomialProduct(op, difficulty) {
  const F = difficulty === 'foundation';
  for (;;) {
    const [v1, v2] = _.sampleSize(VARS, 2);
    const term = (max = 1) => {
      const powers = {};
      const e1 = _.random(0, F ? 1 : max);
      const e2 = _.random(0, 1);
      if (e1) powers[v1] = e1;
      if (e2) powers[v2] = e2;
      return { c: _.random(1, 8), powers };
    };
    const byNumber = op === 'divide' && _.random(0, 3) === 0;
    const A = term(2);
    const B = term(2);
    const C = byNumber ? { c: _.random(2, 6), powers: {} } : term(3);
    const D = byNumber ? { c: 1, powers: {} } : term(3);

    // Each given fraction is in lowest terms, as a textbook prints it.
    const lowest = (x, y) => !reduceMonomials(x.c, x.powers, y.c, y.powers).changed;
    if (!lowest(A, B) || !lowest(C, D)) continue;
    if (mono(B) === '1' || (!byNumber && mono(D) === '1')) continue;
    if (![A, B, C, D].some((t) => Object.keys(t.powers).length > 0)) continue;
    const indices = [A, B, C, D].flatMap((t) => Object.values(t.powers));
    if (!F && !indices.some((e) => e >= 2)) continue;

    const [N, Dn] = op === 'multiply' ? [mulTerms(A, C), mulTerms(B, D)] : [mulTerms(A, D), mulTerms(B, C)];
    const rr = reduceMonomials(N.c, N.powers, Dn.c, Dn.powers);
    const answer = frac(rr.num, rr.den);
    if (answer === '1' || !rr.changed) continue;
    if (N.c > 40 || Dn.c > 40) continue;

    const left = frac(mono(A), mono(B));
    const right = byNumber ? mono(C) : frac(mono(C), mono(D));
    if (op === 'divide' && left === right) continue;
    const first = op === 'multiply'
      ? `\\frac{${mono(A)} \\times ${mono(C)}}{${mono(B)} \\times ${mono(D)}}`
      : `${left} \\times ${frac(mono(D), mono(C))}`;
    return {
      instruction: 'Simplify',
      questionMath: `${left} ${op === 'multiply' ? '\\times' : '\\div'} ${right}`,
      answer,
      workingOut: [first, frac(mono(N), mono(Dn)), answer].join(NL),
      metadata: { topic: `${op}-algebraic-fractions`, difficulty },
    };
  }
}

/** n(x + c), or x + c alone when n is 1: a top that stays factorised. */
const scaled = (n, c) => (n === 1 ? bare(c) : `${n}${bracket(c)}`);

/**
 * Stretch: a quadratic to factorise, then the shared bracket cancels
 * across. The quadratic is a difference of two squares or a trinomial, and
 * sits on top of the first fraction; for multiplying, the linear bracket is
 * below the second, for dividing, above it, so it cancels after the flip.
 * Either way the answer is n(x + r)/d.
 */
function factorisingProduct(op, difficulty) {
  for (;;) {
    const p = _.sample([-1, 1]) * _.random(1, 7);
    const dots = _.random(0, 1) === 1;
    const r = dots ? -p : _.sample([-1, 1]) * _.random(1, 7);
    if (r === p || r === -p && !dots) continue;
    const a = _.random(2, 9);   // the first denominator
    const b = _.random(2, 9);   // the second fraction's number
    const g = gcd(a, b);
    if (g === 1) continue;       // something has to cancel in the numbers too
    const quad = expandQuadratic(p, r);
    const fA = `\\frac{${quad}}{${a}}`;
    const fB = op === 'multiply' ? `\\frac{${b}}{${bare(p)}}` : `\\frac{${bare(p)}}{${b}}`;
    const top = scaled(b / g, r);
    const answer = a / g === 1 ? top : `\\frac{${top}}{${a / g}}`;
    return {
      instruction: 'Simplify',
      questionMath: `${fA} ${op === 'multiply' ? '\\times' : '\\div'} ${fB}`,
      answer,
      workingOut: [
        `\\frac{${bracket(p)}${bracket(r)}}{${a}} \\times \\frac{${b}}{${bare(p)}}`,
        `\\frac{${b}${bracket(p)}${bracket(r)}}{${a}${bracket(p)}}`,
        answer,
      ].join(NL),
      metadata: { topic: `${op}-algebraic-fractions`, difficulty },
    };
  }
}

export const generateMultiplyAlgebraicFractions = (options = {}) => {
  const { difficulty = 'core' } = options;
  return difficulty === 'stretch' ? factorisingProduct('multiply', difficulty) : monomialProduct('multiply', difficulty);
};

export const generateDivideAlgebraicFractions = (options = {}) => {
  const { difficulty = 'core' } = options;
  return difficulty === 'stretch' ? factorisingProduct('divide', difficulty) : monomialProduct('divide', difficulty);
};
