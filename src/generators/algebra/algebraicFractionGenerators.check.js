// The checker for the algebraic-fraction skills (Haese 16A-B), shared by
// the harness (algebraicFractionGenerators.test.js) and its mutation test.
// Test support only. Nothing is imported from the generator.
//
// The question, every working line and the answer are evaluated exactly at
// several random values of their letters and must all agree, so a wrong
// intermediate line is caught as well as a wrong answer. The answer must
// also be fully simplified: nothing left to cancel between its top and its
// bottom, in numbers or in letters or brackets.

import _ from 'lodash';
import { compiles, exactOf, subst, vequal } from '../number/latexArithmetic.check';
import { expand } from './polynomial.check';

const fail = (msg, q) => { throw new Error(`${msg}\n${JSON.stringify(q)}`); };
const must = (cond, msg, q) => { if (!cond) fail(msg, q); };
const gcd = (a, b) => { a = Math.abs(a); b = Math.abs(b); while (b) [a, b] = [b, a % b]; return a; };

// Values well clear of every root the generators use (they keep brackets'
// constants within ±9), so no denominator is zero.
const VALUES = [11, 13, 17, 19, 23, 29, 31];
const lettersIn = (tex) => _.uniq((tex.replace(/\\[a-zA-Z]+/g, '').match(/[a-z]/g) || []));

// Every expression takes the same value at three random assignments.
function sameValue(exprs, q) {
  const letters = _.uniq(exprs.flatMap(lettersIn));
  for (let t = 0; t < 3; t += 1) {
    const vars = Object.fromEntries(_.zip(letters, _.sampleSize(VALUES, letters.length)));
    // "9y^2 \div 3y^3" divides by the whole monomial 3y^3, as printed
    // algebra is read; the evaluator would otherwise divide by 3 alone.
    const read = (e) => exactOf(subst(e.replace(/\\div ([0-9a-z^]+)/g, '\\div ($1)'), vars));
    const [first, ...rest] = exprs.map(read);
    rest.forEach((v, i) => must(vequal(first, v), `"${exprs[i + 1]}" does not equal "${exprs[0]}" at ${JSON.stringify(vars)}`, q));
  }
}

// Top and bottom of a printed answer: \frac{N}{D}, or a whole expression.
function topAndBottom(ans, q) {
  const m = /^\\frac\{(.+)\}\{([^{}]+)\}$/.exec(ans);
  if (!m) return [ans, '1'];
  // The split must be the outermost one: N's braces balance.
  let depth = 0;
  for (const ch of m[1]) { if (ch === '{') depth += 1; if (ch === '}') depth -= 1; must(depth >= 0, `one fraction: ${ans}`, q); }
  must(depth === 0, `one fraction: ${ans}`, q);
  return [m[1], m[2]];
}

// Polynomial in one letter, as coefficients by power, from polynomial.check.
const coeffs = (tex) => {
  const p = expand(tex);
  const out = [];
  for (const [k, v] of p) {
    const pw = (k.match(/[a-z](\d+)/g) || []).map((t) => Number(t.slice(1)));
    if (pw.length > 1) return null;                 // more than one letter
    out[pw[0] ?? 0] = v;
  }
  return Array.from(out, (v) => v ?? 0);
};
const degree = (c) => { let d = c.length - 1; while (d > 0 && !c[d]) d -= 1; return d; };
// Remainder of dividing a by b, in floating point (the coefficients are
// small integers, so a remainder that should vanish comes out within 1e-9).
function polyRem(a, b) {
  const r = a.slice();
  const db = degree(b);
  for (let d = degree(r); d >= db && r.some((v) => Math.abs(v) > 1e-9); d -= 1) {
    const f = r[d] / b[db];
    for (let i = 0; i <= db; i += 1) r[d - db + i] -= f * b[i];
    r[d] = 0;
  }
  return r.map((v) => (Math.abs(v) < 1e-9 ? 0 : v));
}
function polyGcdDegree(a, b) {
  let [x, y] = degree(a) >= degree(b) ? [a, b] : [b, a];
  while (y.some((v) => v !== 0)) { const r = polyRem(x, y); [x, y] = [y, r]; }
  return degree(x);
}

// Nothing cancels between top and bottom: no common whole-number factor
// across every coefficient of both, and no common letter or bracket.
function simplified(top, bottom, q) {
  const T = expand(top), B = expand(bottom);
  const g = [...T.values(), ...B.values()].reduce(gcd, 0);
  must(g === 1, `${top} over ${bottom} still shares a factor of ${g}`, q);
  const letters = _.uniq([...lettersIn(top), ...lettersIn(bottom)]);
  if (letters.length === 1) {
    const [ct, cb] = [coeffs(top), coeffs(bottom)];
    must(polyGcdDegree(ct, cb) === 0, `${top} over ${bottom} still shares a bracket or a letter`, q);
  } else {
    // Monomials in several letters: no letter top and bottom.
    must(T.size === 1 && B.size === 1, `monomials top and bottom: ${top} over ${bottom}`, q);
    const [kt] = [...T.keys()]; const [kb] = [...B.keys()];
    const lt = new Set(kt.match(/[a-z]/g) || []);
    must(!(kb.match(/[a-z]/g) || []).some((v) => lt.has(v)), `${top} over ${bottom} still shares a letter`, q);
  }
}

/* ---------------------------------------------------------------- bands */

const isMonomial = (tex) => /^\d*([a-z](\^\d+)?)*$/.test(tex) && tex !== '';
// \frac{A}{B} with A and B monomials.
const monoFrac = (tex) => { const m = /^\\frac\{([^{}]+)\}\{([^{}]+)\}$/.exec(tex); return m && isMonomial(m[1]) && isMonomial(m[2]) ? [m[1], m[2]] : null; };
const maxIndex = (tex) => Math.max(1, ...(tex.match(/\^(\d+)/g) || []).map((t) => Number(t.slice(1))));

function band(q, b) {
  const Q = q.questionMath;
  const topic = q.metadata.topic;
  if (topic === 'simplify-algebraic-fractions') {
    must(q.instruction === 'Simplify', 'instruction', q);
    if (b === 'stretch') {
      must(/^\\frac\{\(\d+[a-z](\^\d)?\)\^2\}\{\d+[a-z](\^\d)?\}$/.test(Q), `Stretch squares a bracket: ${Q}`, q);
      return 'bracket squared';
    }
    const f = monoFrac(Q);
    must(f, `a monomial over a monomial: ${Q}`, q);
    const letters = lettersIn(Q);
    if (b === 'foundation') {
      must(letters.length === 1 && maxIndex(Q) === 1 && !/\^/.test(Q), `Foundation: one letter, no indices: ${Q}`, q);
      return 'one letter';
    }
    must(/\^[2-9]/.test(Q), `Core: an index to subtract: ${Q}`, q);
    return letters.length === 2 ? 'two letters' : 'one letter, indices';
  }
  if (topic === 'simplify-fractions-factorising') {
    must(q.instruction === 'Simplify by factorising', 'instruction', q);
    const [top, bottom] = topAndBottom(Q, q);
    must(bottom !== '1', 'a fraction', q);
    const [dt, db] = [degree(coeffs(top)), degree(coeffs(bottom))];
    if (b === 'foundation') {
      must((dt === 1 && db === 0) || (dt === 0 && db === 1), `Foundation: a linear expression over a number, or the reverse: ${Q}`, q);
      return dt === 1 ? 'linear on top' : 'linear below';
    }
    if (b === 'core') {
      must(dt === 2 && db === 1, `Core: a quadratic over a linear expression: ${Q}`, q);
      return /\^2 [+-] \d+x [+-] \d+/.test(top) || /\^2 [+-] x [+-] \d+/.test(top) ? 'perfect square' : 'common factor';
    }
    must(dt === 2 && db === 2, `Stretch: a quadratic over a quadratic: ${Q}`, q);
    return 'trinomials';
  }
  if (topic === 'multiply-divide-algebraic-fractions') {
    must(q.instruction === 'Simplify', 'instruction', q);
    if (b === 'foundation') {
      const parts = Q.split(' \\times ');
      must(parts.length === 2 && parts.every(monoFrac), `Foundation multiplies two monomial fractions: ${Q}`, q);
      return 'multiply';
    }
    if (b === 'core') {
      must(Q.includes(' \\div ') && !Q.includes('\\times'), `Core divides: ${Q}`, q);
      return /\\div \d+$/.test(Q) ? 'divide by a number' : 'divide';
    }
    must(Q.includes(' \\times ') && /x\^2 - \d+/.test(Q), `Stretch multiplies across a difference of two squares: ${Q}`, q);
    return 'difference of squares';
  }
  return fail(`topic ${topic}`, q);
}

export function checkAlgebraicFraction(q, b) {
  must(q.metadata?.difficulty === b, 'metadata', q);
  must(typeof q.questionMath === 'string' && q.visualization === undefined && q.answerUnits === undefined, 'a question line, no figure, no units', q);
  must(typeof q.workingOut === 'string' && !q.workingOut.includes('\\n'), 'working uses real newlines', q);
  [q.questionMath, q.answer, q.workingOut].forEach((s) => compiles(s));
  const kind = band(q, b);

  const lines = q.workingOut.split('\n');
  must(lines.length >= 2, 'at least two working lines', q);
  must(lines[lines.length - 1] === q.answer, 'the working ends on the answer', q);
  sameValue([q.questionMath, ...lines, q.answer], q);

  const [top, bottom] = topAndBottom(q.answer, q);
  simplified(top, bottom, q);
  must(q.answer !== '1' && q.answer !== q.questionMath, 'something is left, and something cancelled', q);
  return { kind };
}
