// Test support only. Checks formula-substitution, formula-rearrangement and
// the two simultaneous-equations skills from what is printed. Each formula is
// recognised by its text and solved here by bisection, not by the
// generator's rearrangement; every rearranged answer is substituted back
// into the question's equation; every simultaneous pair is solved from its
// own coefficients. Nothing is imported from the generator.

import { compiles } from '../number/latexArithmetic.check';
import { value, sf3 } from '../number/logarithmGenerators.check';

const must = (cond, msg) => { if (!cond) throw new Error(msg); };
const close = (a, b, tol = 1e-8) => Number.isFinite(a) && Number.isFinite(b) && Math.abs(a - b) <= tol * Math.max(1, Math.abs(a), Math.abs(b));
const lines = (s) => String(s ?? '').split('\n');
const PI = '(3.141592653589793)';
const val = (tex, vars) => value(tex.replace(/\\pi/g, PI), vars);
const gcd = (a, b) => { a = Math.abs(a); b = Math.abs(b); while (b) [a, b] = [b, a % b]; return a; };

/* ------------------------------------------------------------ substitution */

// Each formula as LHS - RHS, independently of the generator.
const RESIDUAL = {
  'v = u + at': ({ v, u, a, t }) => v - (u + a * t),
  'A = \\frac{1}{2}bh': ({ A, b, h }) => A - (b * h) / 2,
  'P = 2(l + w)': ({ P, l, w }) => P - 2 * (l + w),
  'A = \\frac{1}{2}(a + b)h': ({ A, a, b, h }) => A - ((a + b) * h) / 2,
  'V = lwh': ({ V, l, w, h }) => V - l * w * h,
  'F = ma': ({ F, m, a }) => F - m * a,
  'd = st': ({ d, s, t }) => d - s * t,
  'F = \\frac{9}{5}C + 32': ({ F, C }) => F - ((9 * C) / 5 + 32),
  'C = 2\\pi r': ({ C, r }) => C - 2 * Math.PI * r,
  'V = \\pi r^2 h': ({ V, r, h }) => V - Math.PI * r * r * h,
  'A = \\pi r^2': ({ A, r }) => A - Math.PI * r * r,
  'A = 4\\pi r^2': ({ A, r }) => A - 4 * Math.PI * r * r,
  'E = \\frac{1}{2}mv^2': ({ E, m, v }) => E - (m * v * v) / 2,
  'v^2 = u^2 + 2as': ({ v, u, a, s }) => v * v - (u * u + 2 * a * s),
  'c = \\sqrt{a^2 + b^2}': ({ c, a, b }) => c - Math.sqrt(a * a + b * b),
  'T = 2\\pi\\sqrt{\\frac{l}{g}}': ({ T, l, g }) => T - 2 * Math.PI * Math.sqrt(l / g),
};
// Letters squared or under a root, for Stretch.
const POWERED = { 'V = \\pi r^2 h': ['r'], 'A = \\pi r^2': ['r'], 'A = 4\\pi r^2': ['r'], 'E = \\frac{1}{2}mv^2': ['v'], 'v^2 = u^2 + 2as': ['u', 'v'], 'c = \\sqrt{a^2 + b^2}': ['a', 'b', 'c'], 'T = 2\\pi\\sqrt{\\frac{l}{g}}': ['l', 'g'] };
const FIGURE = { 'C = 2\\pi r': 'circle', 'A = \\pi r^2': 'circle', 'A = 4\\pi r^2': 'sphere', 'V = \\pi r^2 h': 'cylinder' };

/**
 * The unknown, found by bisection. A formula without a square or a root is
 * linear in each letter, so monotonic everywhere; one with is monotonic for
 * positive values, which are the only ones it is given.
 */
function solveFor(f, given, want) {
  const g = (x) => RESIDUAL[f]({ ...given, [want]: x });
  let [lo, hi] = POWERED[f] ? [1e-9, 1e6] : [-1e4, 1e6];
  must(Math.sign(g(lo)) !== Math.sign(g(hi)), `no root for ${want} in ${f}`);
  for (let i = 0; i < 200; i += 1) {
    const mid = (lo + hi) / 2;
    if (Math.sign(g(mid)) === Math.sign(g(lo))) lo = mid; else hi = mid;
  }
  return (lo + hi) / 2;
}

const readGiven = (line) => Object.fromEntries(line.split(', \\; ').map((part) => {
  const m = /^([A-Za-z]) = (-?\d+(?:\.\d+)?)$/.exec(part);
  must(m, `a given value: ${part}`);
  return [m[1], Number(m[2])];
}));

function checkSubstitution(q, band) {
  const [f, l2] = lines(q.questionMath);
  must(RESIDUAL[f], `a known formula: ${f}`);
  const given = readGiven(l2 ?? '');
  const letters = Object.keys(RESIDUAL[f].toString().match(/\{([^}]*)\}/)[1].split(',').reduce((o, k) => ({ ...o, [k.trim()]: 1 }), {}));
  const missing = letters.filter((k) => !(k in given));
  must(missing.length === 1, `one letter to find: ${missing}`);
  const want = missing[0];
  const subject = f.match(/^([A-Za-z])/)[1];
  const root = solveFor(f, given, want);
  const w = lines(q.workingOut);
  must(w[w.length - 1] === q.answer, 'working ends at the answer');
  const fig = FIGURE[f];
  must(fig ? q.visualization?.type === fig : q.visualization === null, `figure for ${f}`);
  if (band === 'stretch') {
    must((POWERED[f] ?? []).includes(want), `Stretch: the letter wanted is squared or rooted: ${want} in ${f}`);
    must(q.instruction === `Make ${want} the subject, then find ${want} correct to 3 significant figures`, 'instruction');
    must(!close(root, Math.round(root), 1e-12), 'a rounded answer');
    must(q.answer === `${want} = ${sf3(root)}`, `answer ${q.answer}, expected ${sf3(root)}`);
    must(w.length === 3, 'rearrange, substitute, answer');
    // The rearranged formula, then the substituted one, both give the root.
    must(w[0].startsWith(`${want} = `) && !/\d{2,}/.test(w[0]) && close(val(w[0].slice(4), given), root), `rearranged: ${w[0]}`);
    must(w[1].startsWith(`${want} = `) && close(val(w[1].slice(4), {}), root), `substituted: ${w[1]}`);
    return { kind: 'rearrange first' };
  }
  const pi = /\\pi/.test(f);
  if (band === 'foundation') {
    must(want === subject, 'Foundation finds the subject');
    must(q.instruction === `Use the formula to find ${want}${pi ? ', correct to 3 significant figures' : ''}`, 'instruction');
    must(q.answer === `${want} = ${pi ? sf3(root) : Math.round(root)}`, `answer ${q.answer}`);
    if (!pi) must(close(root, Math.round(root)), 'a whole answer');
    must(w.length === 2 && w[0].startsWith(`${want} = `) && close(val(w[0].slice(4), {}), root), `working: ${w[0]}`);
    return { kind: pi ? 'with pi' : 'whole' };
  }
  must(want !== subject && !pi, 'Core: the subject given, another letter found');
  must(q.instruction === `Use the formula to find ${want}`, 'instruction');
  must(close(root, Math.round(root)), 'a whole answer');
  const ans = Math.round(root);
  must(q.answer === `${want} = ${ans}`, `answer ${q.answer}, expected ${ans}`);
  must(w.length === 3, 'substitute, rearrange, answer');
  const [L, R] = w[0].split(' = ');
  must(Number(L) === given[subject] && close(val(R, { [want]: ans }), given[subject]), `substituted: ${w[0]}`);
  must(w[1].startsWith(`${want} = `) && close(val(w[1].slice(4), { ...given }), ans), `rearranged: ${w[1]}`);
  return { kind: 'solve' };
}

/* ----------------------------------------------------------- rearrangement */

const SAMPLE = [2.3, 3.7, 5.1, 7.9];

function checkRearrangement(q, band) {
  const [L, R] = q.questionMath.split(' = ');
  const m = /^([a-zA-Z]) = (.+)$/.exec(q.answer);
  must(m, `an answer x = ...: ${q.answer}`);
  const subj = m[1];
  must(q.instruction === `Make ${subj} the subject`, 'instruction');
  const other = band === 'stretch' ? (q.questionMath.startsWith('T') ? 'T' : 'y') : 'x';
  must(!new RegExp(`[${subj}]`).test(m[2].replace(/\\[a-z]+/g, '')), 'the subject is not on the right');
  // The answer, substituted into the question and every working line, holds.
  SAMPLE.forEach((t) => {
    const vars = { [other]: t };
    vars[subj] = val(m[2], vars);
    must(close(val(L, vars), val(R, vars)), `the answer does not satisfy ${q.questionMath} at ${other} = ${t}`);
    lines(q.workingOut).forEach((ln) => {
      const [a, b] = ln.split(' = ');
      must(close(val(a, vars), val(b, vars)), `working line false: ${ln}`);
    });
  });
  must(lines(q.workingOut).pop() === q.answer, 'working ends at the answer');
  if (band === 'stretch') {
    const kind = /\\frac\{\d+\}\{x - \d+\}/.test(q.questionMath) ? 'denominator' : /\\sqrt\{x\}/.test(q.questionMath) ? 'root' : 'root of an expression';
    must(/\\frac|\\sqrt/.test(q.questionMath), 'Stretch: a denominator or a root');
    return { kind };
  }
  const e = /^(-?\d*)x ([+-]) (\d+)y = (\d+)$/.exec(q.questionMath);
  must(e, `ax + by = c: ${q.questionMath}`);
  const a = Number(e[1] === '-' ? -1 : e[1] || 1); const b = Number(e[3]) * (e[2] === '-' ? -1 : 1); const c = Number(e[4]);
  must(gcd(gcd(a, b), c) === 1, 'nothing common to all three');
  must(!/\}\{-/.test(q.answer), 'no negative denominator');
  if (band === 'foundation') {
    must(a > 0 && b > 0, 'Foundation: positive coefficients');
    must(q.answer === `y = \\frac{${c} - ${a}x}{${b}}`, `answer ${q.answer}`);
    return { kind: 'positive' };
  }
  must(b < 0, 'Core: a negative y coefficient');
  const want = a > 0 ? `y = \\frac{${a === 1 ? '' : a}x - ${c}}{${-b}}` : `y = -\\frac{${-a === 1 ? '' : -a}x + ${c}}{${-b}}`;
  must(q.answer === want, `answer ${q.answer}, tidied would be ${want}`);
  return { kind: a > 0 ? 'tidied' : 'minus outside' };
}

/* ------------------------------------------------------------ simultaneous */

/** a, b, k of a linear equation in x and y, read by evaluation. */
function linear(eq) {
  const [L, R] = eq.split(' = ');
  const f = (x, y) => val(L, { x, y }) - val(R, { x, y });
  const k = -f(0, 0);
  const a = f(1, 0) + k; const b = f(0, 1) + k;
  must(close(f(2, 3), 2 * a + 3 * b - k), `not linear: ${eq}`);
  return [a, b, k];
}
const EQN = /^(-?\d*)x ([+-]) (\d*)y = (-?\d+)$/;

function checkSimultaneous(q, band, method) {
  const [e1, e2] = lines(q.questionMath);
  must(lines(q.questionMath).length === 2, 'two equations');
  must(q.instruction === `Solve simultaneously, by ${method}`, 'instruction');
  const [p1, p2] = [linear(e1), linear(e2)];
  const det = p1[0] * p2[1] - p2[0] * p1[1];
  must(det !== 0, 'one solution');
  const x = (p1[2] * p2[1] - p2[2] * p1[1]) / det;
  const y = (p1[0] * p2[2] - p2[0] * p1[2]) / det;
  must(Number.isInteger(x) && Number.isInteger(y), 'a whole-number solution');
  must(q.answer === `x = ${x}, \\ y = ${y}`, `answer ${q.answer}, expected x = ${x}, y = ${y}`);
  const w = lines(q.workingOut);
  // Every working line holds at the solution, (× m) and add/subtract read off.
  w.forEach((ln) => {
    const clean = ln.replace(/ \\quad \(\\times \d+\)$/, '').replace(/^\\text\{(add|subtract): \} /, '');
    const [a, b] = clean.split(' = ');
    must(b !== undefined && close(val(a, { x, y }), val(b, { x, y })), `working line false: ${ln}`);
  });
  const yForm = (e) => e.startsWith('y = ');
  if (method === 'substitution') {
    must(w.slice(-2).sort().join('|') === [`x = ${x}`, `y = ${y}`].sort().join('|'), 'working ends at x and y');
    if (band === 'foundation') {
      must(yForm(e1) && (yForm(e2) || /^x \+ y = -?\d+$/.test(e2)), `Foundation: y = mx + c with a simple equation: ${q.questionMath}`);
      return { kind: yForm(e2) ? 'equating y' : 'x + y' };
    }
    if (band === 'core') {
      must(yForm(e1) && EQN.test(e2), 'Core: y = mx + c into ax + by = k');
      must(Math.abs(p2[0]) >= 2 && Math.abs(p2[1]) >= 2, 'Core: coefficients');
      return { kind: 'into ax + by' };
    }
    must(!yForm(e1) && !yForm(e2) && EQN.test(e1) && EQN.test(e2), 'Stretch: neither in y = form');
    must(Math.abs(p1[0]) === 1 && Math.abs(p2[0]) >= 2, 'Stretch: one x to make the subject');
    must(w[0] === `x = ${e1.split(' = ')[1]} ${e1.match(/ ([+-]) /)[1] === '+' ? '-' : '+'} ${e1.match(/ [+-] (\d*y)/)[1]}`, `rearranged first: ${w[0]}`);
    return { kind: 'rearranged first' };
  }
  must(EQN.test(e1) && EQN.test(e2), 'both in ax + by = k form');
  must(w.slice(-2).join('|') === `x = ${x}|y = ${y}`, 'working ends at x and y');
  [p1, p2].forEach((p) => must(gcd(gcd(p[0], p[1]), p[2]) === 1, `an equation that divides down: ${q.questionMath}`));
  const [b1, b2] = [Math.abs(p1[1]), Math.abs(p2[1])];
  const [a1, a2] = [Math.abs(p1[0]), Math.abs(p2[0])];
  const scaled = w.filter((ln) => /\\times \d+\)$/.test(ln));
  const combine = w.find((ln) => /^\\text\{(add|subtract)/.test(ln));
  // A scaled line is one of the equations times its stated multiplier.
  scaled.forEach((ln) => {
    const m = Number(/\\times (\d+)\)$/.exec(ln)[1]);
    const c = linear(ln.replace(/ \\quad \(\\times \d+\)$/, ''));
    must([p1, p2].some((p) => p.every((v, i) => close(v * m, c[i]))), `not an equation times ${m}: ${ln}`);
  });
  must(combine, 'an add or subtract line');
  if (band === 'foundation') {
    must(b1 === b2 && scaled.length === 0, 'Foundation: the y coefficients already match');
    return { kind: combine.includes('add') ? 'add' : 'subtract' };
  }
  if (band === 'core') {
    must(b2 % b1 === 0 && b2 / b1 >= 2 && a2 % a1 !== 0 && scaled.length === 1, 'Core: one equation multiplied');
    must(scaled[0].endsWith(`(\\times ${b2 / b1})`), 'Core: times the matching factor');
    return { kind: 'multiply one' };
  }
  const divides = (u, v) => u % v === 0 || v % u === 0;
  must(!divides(b1, b2) && !divides(a1, a2) && scaled.length === 2, 'Stretch: both multiplied');
  return { kind: 'multiply both' };
}

/* ------------------------------------------------------------------- all */

export function checkFormula(q, band) {
  must(q.metadata?.difficulty === band, 'metadata band');
  must(!/\d/.test(q.instruction.replace('3 significant figures', '')), `a digit in the instruction: ${q.instruction}`);
  [q.questionMath, q.answer, q.workingOut].forEach((s) => compiles(s));
  const topic = q.metadata.topic;
  if (topic === 'formula-substitution') return checkSubstitution(q, band);
  if (topic === 'formula-rearrangement') return checkRearrangement(q, band);
  if (topic === 'simultaneous-substitution') return checkSimultaneous(q, band, 'substitution');
  if (topic === 'simultaneous-elimination') return checkSimultaneous(q, band, 'elimination');
  throw new Error(`unknown topic ${topic}`);
}
