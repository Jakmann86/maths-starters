// src/generators/algebra/algebraicFractionGenerators.js
//
// Haese chapter 16: algebraic fractions.
//
//   16A.1  generateSimplifyAlgebraicFraction     cancel a monomial fraction
//   16A.2  generateSimplifyFractionsFactorising  factorise first, then cancel
//   16B    generateMultiplyDivideFractions       multiply and divide
//
// All three emit stacked fractions, and every band except 16A.2 Foundation
// carries an exponent, so these route through the KaTeX fallback rather than
// the Archivo parser (SPEC.md 6 names "stacked algebraic fractions (chapter
// 16)" as a deliberate fallback). Board.jsx's warnIfUnparseable comment needs
// a third exception line for this topic or the console fills with noise.
//
// Every line of workingOut is an expression equal to the question, so the
// verification harness can evaluate the question, the answer and every
// working line at the same randomised variable assignment and require them
// all to agree. That catches a wrong intermediate line, which a check on the
// final answer alone does not.

import _ from 'lodash';

const NL = '\n';

/* ------------------------------------------------------------------ *
 * Rendering helpers
 * ------------------------------------------------------------------ */

const gcd = (a, b) => (b ? gcd(b, Math.abs(a % b)) : Math.abs(a));

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

      // c1·x(x + p) over c2(x + p)
      const c1 = _.random(2, 9);
      const c2 = _.random(2, 15);
      const g = gcd(c1, c2);
      if (g < 2) continue;
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
 * 16B — multiplying and dividing
 *
 * Foundation  multiply two monomial fractions   x/4 x 8/y
 * Core        divide, so reciprocate first      6/x / 2/x^2
 * Stretch     factorise, then cancel across     (3x - 9)/6 x 12/(x^2 - 9)
 * ------------------------------------------------------------------ */

export const generateMultiplyDivideFractions = (options = {}) => {
  const { difficulty = 'core' } = options;

  if (difficulty === 'foundation') {
    for (;;) {
      const [v1, v2] = _.sampleSize(VARS, 2);
      const term = () => {
        const powers = {};
        const e1 = _.random(0, 2);
        const e2 = _.random(0, 1);
        if (e1) powers[v1] = e1;
        if (e2) powers[v2] = e2;
        return { c: _.random(1, 8), powers };
      };
      const A = term();
      const B = term();
      const C = term();
      const D = term();

      // Each fraction handed to the student is already in lowest terms, the
      // way a textbook prints it — all the cancelling belongs after the
      // multiplication, not before it.
      const lowest = (x, y) => !reduceMonomials(x.c, x.powers, y.c, y.powers).changed;
      if (!lowest(A, B) || !lowest(C, D)) continue;
      if (monomial(B.c, B.powers) === '1' || monomial(D.c, D.powers) === '1') continue;
      // An algebra topic should not serve a purely numeric fraction.
      const hasVar = [A, B, C, D].some((t) => Object.keys(t.powers).length > 0);
      if (!hasVar) continue;

      const mul = (x, y) => {
        const powers = { ...x.powers };
        Object.keys(y.powers).forEach((k) => { powers[k] = (powers[k] || 0) + y.powers[k]; });
        return { c: x.c * y.c, powers };
      };
      const N = mul(A, C);
      const Dn = mul(B, D);
      const rr = reduceMonomials(N.c, N.powers, Dn.c, Dn.powers);
      const answer = frac(rr.num, rr.den);
      if (answer === '1' || !rr.changed) continue;
      if (N.c > 40 || Dn.c > 40) continue;

      const q = `\\frac{${monomial(A.c, A.powers)}}{${monomial(B.c, B.powers)}}`
        + ` \\times \\frac{${monomial(C.c, C.powers)}}{${monomial(D.c, D.powers)}}`;
      return {
        instruction: 'Simplify',
        questionMath: q,
        answer,
        workingOut: [
          `\\frac{${monomial(A.c, A.powers)} \\times ${monomial(C.c, C.powers)}}`
            + `{${monomial(B.c, B.powers)} \\times ${monomial(D.c, D.powers)}}`,
          frac(monomial(N.c, N.powers), monomial(Dn.c, Dn.powers)),
          answer,
        ].join(NL),
        metadata: { topic: 'multiply-divide-algebraic-fractions', difficulty },
      };
    }
  }

  if (difficulty === 'core') {
    for (;;) {
      const v = _.sample(VARS);
      const byWholeNumber = _.random(0, 3) === 0;   // 8/p / 2, Haese 16B Q2j
      const A = { c: _.random(1, 9), powers: _.random(0, 2) ? { [v]: _.random(1, 2) } : {} };
      const B = { c: _.random(1, 6), powers: _.random(0, 2) ? { [v]: _.random(1, 2) } : {} };
      const C = byWholeNumber
        ? { c: _.random(2, 6), powers: {} }
        : { c: _.random(1, 6), powers: _.random(0, 2) ? { [v]: _.random(1, 3) } : {} };
      const D = byWholeNumber ? { c: 1, powers: {} } : { c: _.random(1, 6), powers: _.random(0, 2) ? { [v]: _.random(1, 3) } : {} };

      // A/B / (C/D)  =  A/B x D/C
      const num = { c: A.c * D.c, powers: {} };
      const den = { c: B.c * C.c, powers: {} };
      [A.powers, D.powers].forEach((ps) => Object.keys(ps).forEach((k) => {
        num.powers[k] = (num.powers[k] || 0) + ps[k];
      }));
      [B.powers, C.powers].forEach((ps) => Object.keys(ps).forEach((k) => {
        den.powers[k] = (den.powers[k] || 0) + ps[k];
      }));

      const rr = reduceMonomials(num.c, num.powers, den.c, den.powers);
      const answer = frac(rr.num, rr.den);
      if (answer === '1' || !rr.changed) continue;
      if (num.c > 40 || den.c > 40) continue;

      // Same rule as Foundation: both given fractions are already in lowest
      // terms. A denominator of 1 is allowed here and collapses via frac(),
      // which is how Haese's `3 \div 1/x` shape appears.
      // An algebra topic should not serve a purely numeric fraction.
      const hasVar = [A, B, C, D].some((t) => Object.keys(t.powers).length > 0);
      if (!hasVar) continue;
      const lowest = (x, y) => !reduceMonomials(x.c, x.powers, y.c, y.powers).changed;
      if (!lowest(A, B) || !lowest(C, D)) continue;

      const left = frac(monomial(A.c, A.powers), monomial(B.c, B.powers));
      const rightQ = byWholeNumber
        ? monomial(C.c, C.powers)
        : frac(monomial(C.c, C.powers), monomial(D.c, D.powers));
      const rightR = frac(monomial(D.c, D.powers), monomial(C.c, C.powers));
      if (left === rightQ) continue;

      return {
        instruction: 'Simplify',
        questionMath: `${left} \\div ${rightQ}`,
        answer,
        workingOut: [
          `${left} \\times ${rightR}`,
          frac(monomial(num.c, num.powers), monomial(den.c, den.powers)),
          answer,
        ].join(NL),
        metadata: { topic: 'multiply-divide-algebraic-fractions', difficulty },
      };
    }
  }

  // stretch — one fraction carries a common factor, the other a difference of
  // two squares, and the shared bracket cancels across the multiplication.
  for (;;) {
    const p = _.random(2, 8);
    const k = _.random(1, 6);          // the answer's coefficient
    const b = _.random(2, 12);
    const product = k * b;
    const divisors = _.range(2, 7).filter((n) => product % n === 0 && product / n <= 24);
    if (!divisors.length) continue;
    const a = _.sample(divisors);
    const c = product / a;
    const cancelPlus = _.random(0, 1) === 1;   // which bracket cancels
    const shared = cancelPlus ? p : -p;        // (x + p) or (x - p)
    const left = cancelPlus ? -p : p;          // the one that survives

    const dots = `x^2 - ${p * p}`;
    const linearNum = expandLinear(a, shared);
    const answer = frac(String(k), `${bare(left)}`);

    const dotsFirst = _.random(0, 1) === 1;
    const fA = `\\frac{${linearNum}}{${b}}`;
    const fB = `\\frac{${c}}{${dots}}`;
    const wA = `\\frac{${a}${bracket(shared)}}{${b}}`;
    const wB = `\\frac{${c}}{${bracket(p)}${bracket(-p)}}`;

    return {
      instruction: 'Simplify',
      questionMath: dotsFirst ? `${fB} \\times ${fA}` : `${fA} \\times ${fB}`,
      answer,
      workingOut: [
        dotsFirst ? `${wB} \\times ${wA}` : `${wA} \\times ${wB}`,
        `\\frac{${a * c}${bracket(shared)}}{${b}${bracket(p)}${bracket(-p)}}`,
        answer,
      ].join(NL),
      metadata: { topic: 'multiply-divide-algebraic-fractions', difficulty },
    };
  }
};
