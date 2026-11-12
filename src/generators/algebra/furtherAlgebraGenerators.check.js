// Test support only. Checks the skills in furtherAlgebraGenerators.js from
// what is printed: the answer must equal the question as a function (checked
// at several values with the TeX reader from the Logarithms checker), must be
// in the form the instruction asks for (expanded, fully factorised, one
// fraction in lowest terms, x alone), and every working line must hold.

import { compiles } from '../number/latexArithmetic.check';
import { value } from '../number/logarithmGenerators.check';

const must = (cond, msg) => { if (!cond) throw new Error(msg); };
const close = (a, b) => Number.isFinite(a) && Math.abs(a - b) <= 1e-7 * Math.max(1, Math.abs(a), Math.abs(b));
const gcd = (a, b) => { a = Math.abs(a); b = Math.abs(b); while (b) [a, b] = [b, a % b]; return a; };
const POINTS = [-2.7, -1.3, 0.6, 1.9, 3.4, 4.8];

const letterOf = (tex) => {
  const vs = new Set((tex.replace(/\\[a-z]+/g, '').match(/[a-z]/g) ?? []));
  must(vs.size === 1, `one letter: ${tex}`);
  return [...vs][0];
};
const sameFunction = (a, b, v) => POINTS.forEach((t) => must(close(value(a, { [v]: t }), value(b, { [v]: t })), `${a} is not ${b}`));

// A polynomial written out: descending powers, each power once, no zero or
// unit coefficient shown. Returns coefficients by power.
const POW = (v) => new RegExp(`^(-?)(\\d*)(${v}(?:\\^(\\d))?)?$`);
export const readPoly = (tex, v) => {
  const terms = tex.replace(/ - /g, ' + -').split(' + ');
  const out = {};
  let last = Infinity;
  terms.forEach((t) => {
    const m = POW(v).exec(t);
    must(m && (m[2] || m[3]), `not a polynomial term: ${t}`);
    must(!(m[3] && m[2] === '1'), `a coefficient of 1 shown: ${t}`);
    must(m[2] !== '0', 'a zero term');
    const k = m[3] ? (m[4] ? Number(m[4]) : 1) : 0;
    must(k < last, `powers not in descending order: ${tex}`);
    last = k;
    out[k] = (m[1] ? -1 : 1) * (m[2] ? Number(m[2]) : 1);
  });
  return out;
};
const LIN = (v) => new RegExp(`^\\((-?)(\\d*)${v} ([+-]) (\\d+)\\)$`);
const readLin = (t, v) => {
  const m = LIN(v).exec(t);
  must(m, `not a linear bracket: ${t}`);
  const p = (m[1] ? -1 : 1) * (m[2] ? Number(m[2]) : 1);
  must(m[2] !== '1', `a coefficient of 1 shown: ${t}`);
  return [p, (m[3] === '-' ? -1 : 1) * Number(m[4])];
};
const brackets = (s) => s.match(/\([^()]*\)/g) ?? [];
const workingHolds = (q, v, exprAt) => {
  q.workingOut.split('\n').forEach((line) => {
    const parts = line.split(' = ');
    POINTS.forEach((t) => {
      const vals = parts.map((p) => value(p, { [v]: t, ...(exprAt?.(t) ?? {}) }));
      if (parts.length === 1) must(close(vals[0], value(q.questionMath, { [v]: t })), `working line: ${line}`);
      else vals.forEach((x) => must(close(x, vals[0]), `working line false: ${line}`));
    });
  });
  const last = q.workingOut.split('\n').pop();
  must(last === q.answer, `working ends at ${last}`);
};

/* ----------------------------------------------------- expand-further */

function checkExpand(q, band) {
  must(q.instruction === 'Expand and simplify', 'instruction');
  const v = letterOf(q.questionMath);
  sameFunction(q.questionMath, q.answer, v);
  const poly = readPoly(q.answer, v);
  must(Object.keys(poly).map(Number).includes(3), 'a cubic answer');
  workingHolds(q, v);
  const src = q.questionMath;
  const cube = /^\([^()]+\)\^3$/.test(src);
  const bs = brackets(src);
  const quad = bs.some((b) => b.includes('^2'));
  const coefs = bs.filter((b) => !b.includes('^2')).map((b) => {
    const m = /^\((\d+ [+-] )?(-?\d*)x/.exec(b);
    return m ? m[2] : '';
  });
  const plain = coefs.every((c) => c === '' || c === '-');
  if (band === 'foundation') {
    must(!cube && quad && bs.length === 2 && plain, 'Foundation is a monic linear bracket times a quadratic');
    return { kind: 'linear by quadratic' };
  }
  if (band === 'core') {
    must(plain && !quad, 'Core brackets have no coefficients');
    if (cube) return { kind: 'a cube' };
    must(bs.length + (/^x\(/.test(src) ? 1 : 0) === 3, 'three factors');
    return { kind: 'three brackets' };
  }
  must(!plain || quad, 'Stretch has a coefficient');
  if (cube) { must(!plain, 'Stretch cube has a coefficient'); return { kind: 'a cube' }; }
  if (quad) { must(bs.length === 2, 'linear by quadratic'); return { kind: 'linear by quadratic' }; }
  must(bs.length === 3, 'three brackets');
  return { kind: 'three brackets' };
}

/* -------------------------------------------- factorise-perfect-square */

function checkPerfectSquare(q, band) {
  must(q.instruction === 'Fully factorise', 'instruction');
  const v = letterOf(q.questionMath);
  const e = readPoly(q.questionMath, v);
  must(Object.keys(e).length === 3 && e[2] && e[1] && e[0], 'a three-term quadratic');
  const m = new RegExp(`^(-?\\d*)(\\(.+\\))\\^2$`).exec(q.answer);
  must(m, `answer: ${q.answer}`);
  const k = m[1] === '' ? 1 : m[1] === '-' ? -1 : Number(m[1]);
  must(m[1] !== '1', 'a coefficient of 1 shown');
  const [p, c] = readLin(m[2], v);
  must(p > 0 && gcd(p, c) === 1, 'the bracket has no common factor');
  sameFunction(q.questionMath, q.answer, v);
  workingHolds(q, v);
  // The working writes it as a square plus twice the product: every power is 2
  // (1^3 is 1 too, and would hide a slip).
  must(!/\^[^2]/.test(q.workingOut), 'the working squares');
  if (band === 'foundation') { must(k === 1 && p === 1, 'Foundation is (x + a)^2'); return { kind: c > 0 ? 'plus' : 'minus' }; }
  if (band === 'core') { must(k === 1 && p > 1, 'Core is (px + q)^2'); return { kind: c > 0 ? 'plus' : 'minus' }; }
  must(k !== 1, 'Stretch takes out a common factor first');
  return { kind: k < 0 ? 'a negative factor' : 'a number factor' };
}

/* ---------------------------------------------------- factorise-fully */

function checkFully(q, band) {
  must(q.instruction === 'Fully factorise', 'instruction');
  const e = readPoly(q.questionMath, 'x');
  const m = /^(-?\d*)(x?)((?:\([^()]+\))+)$/.exec(q.answer);
  must(m, `answer: ${q.answer}`);
  must(m[1] !== '1' && m[1] !== '-1', 'a coefficient of 1 shown');
  const k = m[1] === '' ? 1 : m[1] === '-' ? -1 : Number(m[1]);
  const bs = brackets(m[3]).map((b) => readLin(b, 'x'));
  must(bs.length === 2, 'two brackets');
  bs.forEach(([p, c]) => must(p > 0 && gcd(p, c) === 1, 'a bracket with a common factor or a negative x'));
  sameFunction(q.questionMath, q.answer, 'x');
  // The factor taken out is the whole of the common factor.
  const content = Object.values(e).reduce((a, b) => gcd(a, b), 0);
  must(Math.abs(k) === content, `not fully factorised: ${content} is common`);
  const lowest = Math.min(...Object.keys(e).map(Number));
  must((m[2] ? 1 : 0) === lowest, 'the common x taken out');
  workingHolds(q, 'x');
  const monic = bs.every(([p]) => p === 1);
  if (band === 'foundation') {
    must(k > 1 && !m[2] && bs[0][0] === bs[1][0] && bs[0][1] === -bs[1][1], 'Foundation is a number then the difference of two squares');
    return { kind: bs[0][0] === 1 ? 'x squared' : 'a coefficient' };
  }
  if (band === 'core') {
    must(monic && k > 0 && bs[0][1] !== -bs[1][1], 'Core is a number or x then x^2 + bx + c');
    return { kind: m[2] ? 'x first' : 'a number first' };
  }
  if (k < 0) { must(monic, 'negative factor then monic'); return { kind: 'a negative first' }; }
  must(!monic && k > 1, 'Stretch: a number then ax^2 + bx + c');
  return { kind: 'a number, then non-monic' };
}

/* --------------------------------------------------- rearrange-harder */

function checkRearrange(q, band) {
  must(q.instruction === 'Make x the subject', 'instruction');
  const [L, R] = q.questionMath.split(' = ');
  const [ax, rhs] = q.answer.split(' = ');
  must(ax === 'x' && !/x/.test(rhs.replace(/\\[a-z]+/g, '')), 'answer is x = ... with no x on the right');
  // y from x: the question is linear in y.
  const yAt = (x) => {
    const g = (y) => value(L, { x, y }) - value(R, { x, y });
    const g0 = g(0), g1 = g(1);
    return -g0 / (g1 - g0);
  };
  [1.37, 2.61, 4.23].forEach((x) => {
    const y = yAt(x);
    must(close(value(rhs, { y }), x), `wrong: at x = ${x}, the answer gives ${value(rhs, { y })}`);
    q.workingOut.split('\n').forEach((line) => {
      const [a, b] = line.split(' = ');
      must(close(value(a, { x, y }), value(b, { x, y })), `working line false: ${line}`);
    });
  });
  must(q.workingOut.split('\n').pop() === q.answer, 'working ends at the answer');
  const xs = (q.questionMath.replace(/\\[a-z]+/g, '').match(/x/g) ?? []).length;
  if (band === 'foundation') {
    must(xs === 1 && L === 'y' && /\^2|\\sqrt/.test(R), 'Foundation is a square or a root');
    return { kind: R.includes('\\sqrt') ? 'a root' : 'a square' };
  }
  if (band === 'core') {
    must(xs === 1 && L === 'y' && /\\frac\{\d+\}\{x/.test(R), 'Core has x in a denominator');
    return { kind: /\\frac\{\d+\}\{x\}/.test(R) ? 'over x' : 'over a bracket' };
  }
  must(xs === 2, 'Stretch has x twice');
  return { kind: L === 'y' ? 'a fraction' : 'a product' };
}

/* ------------------------------------------- add-algebraic-fractions */

function checkFractions(q, band) {
  must(q.instruction === 'Write as a single fraction', 'instruction');
  const v = letterOf(q.questionMath);
  sameFunction(q.questionMath, q.answer, v);
  workingHolds(q, v);
  const parts = /^\\frac\{(.+?)\}\{(.+?)\} ([+-]) \\frac\{(.+?)\}\{(.+?)\}$/.exec(q.questionMath);
  must(parts, `question: ${q.questionMath}`);
  const kind = parts[3] === '+' ? 'adding' : 'subtracting';
  const numericDen = /^\d+$/.test(parts[2]) && /^\d+$/.test(parts[5]);
  // The answer: one fraction (a sign may go in front), or a single term.
  const a = /^(-?)\\frac\{(.+)\}\{(.+)\}$/.exec(q.answer);
  if (band !== 'stretch') {
    must(numericDen, 'number denominators below Stretch');
    if (!a) { must(band === 'foundation' && readPoly(q.answer.replace(/^-/, ''), v), 'a whole term'); return { kind }; }
    const num = readPoly(a[2], v);
    must(/^\d+$/.test(a[3]), 'a number denominator');
    const content = Object.values(num).reduce((x, y) => gcd(x, y), Number(a[3]));
    must(content === 1, `not in lowest terms: ${q.answer}`);
    const lead = num[Math.max(...Object.keys(num).map(Number))];
    must(lead > 0, 'a negative leading term goes out in front');
    const monomial = (t) => readPoly(t, v) && Object.keys(readPoly(t, v)).join() === '1';
    if (band === 'foundation') must(monomial(parts[1]) && monomial(parts[4]), 'Foundation numerators are single terms');
    else must(!monomial(parts[1]) && !monomial(parts[4]), 'Core numerators are two terms');
    return { kind };
  }
  must(!numericDen && a, 'a letter in a denominator, one fraction');
  const num = readPoly(a[2], v);
  const lead = num[Math.max(...Object.keys(num).map(Number))];
  must(lead > 0, 'a negative leading term goes out in front');
  must(Object.values(num).reduce((x, y) => gcd(x, y), 0) === 1, 'numerator has a common factor');
  // The denominator is the two denominators multiplied, left in factors.
  const den = a[3];
  const d1 = parts[2], d2 = parts[5];
  const asFactor = (d) => (d === v ? v : `(${d})`);
  must(den === `${asFactor(d1)}${asFactor(d2)}`, `denominator ${den}`);
  return { kind };
}

const CHECKS = {
  'expand-further': checkExpand, 'factorise-perfect-square': checkPerfectSquare, 'factorise-fully': checkFully,
  'rearrange-harder': checkRearrange, 'add-algebraic-fractions': checkFractions,
};

export function checkFurtherAlgebra(q, band) {
  const topic = q.metadata?.topic;
  must(CHECKS[topic], `unknown topic ${topic}`);
  must(q.metadata.difficulty === band, 'metadata difficulty');
  must(!q.visualization, 'no figure');
  [q.questionMath, q.answer, q.workingOut].forEach(compiles);
  return CHECKS[topic](q, band);
}
