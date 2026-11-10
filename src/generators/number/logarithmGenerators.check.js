// Test support only. Recomputes every Logarithms answer from what is
// printed, with its own reader for the TeX (logs, roots, fractions, powers,
// letters), never from the generator's variables. Every working line is
// checked too.
//
// Reading rules, which the generators keep to:
// - \log with no base is base 10.
// - A log's argument is the next number, letter, bracket, fraction or root,
//   with its power: \log_2 3^4 is log_2(81). So \log_2 3x would read as
//   (log_2 3)x, which is why the generators bracket it, and a question that
//   didn't would fail here.
// - A number, letter or bracket directly before another multiplies it.

import { compiles } from './latexArithmetic.check';

/* -------------------------------------------------------------- reader */

const tokenize = (src) => {
  const s = src.replace(/\\left|\\right/g, '').replace(/\\quad|\\,|\\;/g, ' ');
  const out = [];
  let i = 0;
  while (i < s.length) {
    const c = s[i];
    if (/\s/.test(c)) { i += 1; continue; }
    const n = /^\d+(?:\.\d+)?/.exec(s.slice(i));
    if (n) { out.push({ t: 'num', v: Number(n[0]), raw: n[0] }); i += n[0].length; continue; }
    const cmd = /^\\[a-zA-Z]+/.exec(s.slice(i));
    if (cmd) { out.push({ t: cmd[0] }); i += cmd[0].length; continue; }
    if (/[a-zA-Z]/.test(c)) { out.push({ t: 'var', v: c }); i += 1; continue; }
    out.push({ t: c }); i += 1;
  }
  return out;
};

export const parse = (src) => {
  const toks = tokenize(src);
  let i = 0;
  const peek = () => toks[i]?.t;
  const eat = (t) => { if (peek() !== t) throw new Error(`expected ${t}, got ${peek()} in ${src}`); i += 1; };
  const group = () => {
    if (peek() === '{') { eat('{'); const e = expr(); eat('}'); return e; }
    const tk = toks[i++];
    if (tk?.t === 'num') return { k: 'num', v: tk.v };
    if (tk?.t === 'var') return { k: 'var', v: tk.v };
    throw new Error(`bad group in ${src}`);
  };
  const atom = () => {
    const t = peek();
    if (t === 'num') return { k: 'num', v: toks[i++].v };
    if (t === 'var') return { k: 'var', v: toks[i++].v };
    if (t === '(') { eat('('); const e = expr(); eat(')'); return e; }
    if (t === '{') { eat('{'); const e = expr(); eat('}'); return e; }
    if (t === '\\frac') { i += 1; const a = group(); const b = group(); return { k: 'div', a, b }; }
    if (t === '\\sqrt') {
      i += 1;
      let n = 2;
      if (peek() === '[') { eat('['); n = toks[i++].v; eat(']'); }
      return { k: 'root', n, a: group() };
    }
    if (t === '\\log') {
      i += 1;
      let base = { k: 'num', v: 10 };
      if (peek() === '_') { eat('_'); base = group(); }
      return { k: 'log', base, a: power() };
    }
    throw new Error(`unexpected ${t} in ${src}`);
  };
  function power() {
    let a = atom();
    while (peek() === '^') { eat('^'); a = { k: 'pow', a, b: group() }; }
    return a;
  }
  const unary = () => {
    if (peek() === '-') { eat('-'); return { k: 'neg', a: unary() }; }
    return power();
  };
  const startsAtom = () => ['num', 'var', '(', '\\frac', '\\sqrt', '\\log'].includes(peek());
  const term = () => {
    let a = unary();
    for (;;) {
      if (peek() === '\\times' || peek() === '\\cdot') { i += 1; a = { k: 'mul', a, b: unary() }; }
      else if (peek() === '\\div') { i += 1; a = { k: 'div', a, b: unary() }; }
      else if (startsAtom()) a = { k: 'mul', a, b: power() };
      else return a;
    }
  };
  function expr() {
    let a = term();
    for (;;) {
      if (peek() === '+') { eat('+'); a = { k: 'add', a, b: term() }; }
      else if (peek() === '-') { eat('-'); a = { k: 'add', a, b: { k: 'neg', a: term() } }; }
      else return a;
    }
  }
  const tree = expr();
  if (i !== toks.length) throw new Error(`trailing ${peek()} in ${src}`);
  return tree;
};

const ev = (t, vars) => {
  switch (t.k) {
    case 'num': return t.v;
    case 'var': {
      if (!(t.v in vars)) throw new Error(`no value for ${t.v}`);
      return vars[t.v];
    }
    case 'neg': return -ev(t.a, vars);
    case 'add': return ev(t.a, vars) + ev(t.b, vars);
    case 'mul': return ev(t.a, vars) * ev(t.b, vars);
    case 'div': return ev(t.a, vars) / ev(t.b, vars);
    case 'root': { const v = ev(t.a, vars); return t.n === 3 ? Math.cbrt(v) : v ** (1 / t.n); }
    case 'pow': return ev(t.a, vars) ** ev(t.b, vars);
    case 'log': {
      const b = ev(t.base, vars), a = ev(t.a, vars);
      if (!(a > 0)) throw new Error('log of a number that is not positive');
      if (!(b > 0) || Math.abs(b - 1) < 1e-12) throw new Error('log in a base that is not positive, or 1');
      return Math.log(a) / Math.log(b);
    }
    default: throw new Error(t.k);
  }
};

export const value = (tex, vars = {}) => ev(parse(tex), vars);
const lettersIn = (tex) => new Set(tokenize(tex).filter((k) => k.t === 'var').map((k) => k.v));
const close = (a, b, tol = 1e-9) => Number.isFinite(a) && Number.isFinite(b) && Math.abs(a - b) <= tol * Math.max(1, Math.abs(a), Math.abs(b));
const must = (cond, msg) => { if (!cond) throw new Error(msg); };
const gcd = (a, b) => { a = Math.abs(a); b = Math.abs(b); while (b) [a, b] = [b, a % b]; return a; };

const sides = (line) => {
  const parts = line.split(' = ');
  must(parts.length === 2, `not one equation: ${line}`);
  return parts;
};
// A working line "L = R" holds for these values.
const holds = (line, vars) => {
  const [l, r] = sides(line);
  must(close(value(l, vars), value(r, vars), 1e-8), `working line false: ${line}`);
};

// An answer in simplest form: an integer, or a fraction in lowest terms.
const rational = (tex) => {
  let m = /^(-?)(\d+)$/.exec(tex);
  if (m) return Number(m[2]) * (m[1] ? -1 : 1);
  m = /^(-?)\\frac\{(\d+)\}\{(\d+)\}$/.exec(tex);
  must(m, `not an integer or a fraction: ${tex}`);
  const [n, d] = [Number(m[2]), Number(m[3])];
  must(d > 1 && gcd(n, d) === 1, `fraction not in lowest terms: ${tex}`);
  return (n / d) * (m[1] ? -1 : 1);
};

// b^n for a whole n, either sign?
const isPower = (v, b) => {
  if (!(v > 0)) return false;
  const n = Math.log(v) / Math.log(b);
  return Math.abs(n - Math.round(n)) < 1e-9;
};

// 3 significant figures, as text with its trailing zeros.
export const sf3 = (x) => {
  const r = Number(x.toPrecision(3));
  if (r === 0) return '0';
  const mag = Math.floor(Math.log10(Math.abs(r)) + 1e-12);
  return r.toFixed(Math.max(0, 2 - mag));
};
const boundaryRisk = (x) => {
  const mag = Math.floor(Math.log10(Math.abs(x)));
  const scaled = Math.abs(x) * 10 ** (2 - mag);
  return Math.abs(scaled - Math.floor(scaled) - 0.5) < 1e-7;
};

const lastIsAnswer = (q) => {
  const lines = q.workingOut.split('\n');
  const last = lines[lines.length - 1];
  must(last === q.answer || last.endsWith(`= ${q.answer}`), `working does not end at the answer: ${last}`);
  return lines;
};

/* ---------------------------------------------------- log-index-form */

const INDEX = /^(\d+)\^\{(.+)\} = (.+)$/;
const LOGFORM = /^\\log(?:_\{(\d+)\})?(?: (\d+)|\\left\((.+)\\right\)|\((.+)\)) = (.+)$/;
const readIndex = (s) => { const m = INDEX.exec(s); must(m, `not index form: ${s}`); return { base: m[1], power: m[2], val: m[3] }; };
const readLog = (s) => { const m = LOGFORM.exec(s); must(m, `not logarithmic form: ${s}`); return { base: m[1] ?? '10', val: m[2] ?? m[3] ?? m[4], power: m[5] }; };

function checkIndexForm(q, band) {
  if (band === 'stretch') {
    must(q.instruction === 'Make x the subject', 'instruction');
    const [L, rhs] = sides(q.questionMath);
    must(/^[a-zA-Z]$/.test(L) && L !== 'x', `left side is not one letter: ${L}`);
    const [ax, arhs] = sides(q.answer);
    must(ax === 'x', 'answer is not x = ...');
    must(!lettersIn(arhs).has('x') && lettersIn(arhs).has(L), 'answer is not in terms of the other letter');
    must([...lettersIn(rhs)].every((v) => v === 'x'), 'question has a stray letter');
    const lines = lastIsAnswer(q);
    [5.3, 7.7].forEach((x) => {
      const l = value(rhs, { x });
      must(close(value(arhs, { [L]: l }), x, 1e-7), `answer gives the wrong x: ${q.answer}`);
      lines.forEach((line) => holds(line, { x, [L]: l }));
    });
    return { kind: rhs.includes('\\log') ? 'log to index' : 'index to log' };
  }
  const toLog = q.instruction === 'Write in logarithmic form';
  must(toLog || q.instruction === 'Write in index form', 'instruction');
  const I = readIndex(toLog ? q.questionMath : q.answer);
  const G = readLog(toLog ? q.answer : q.questionMath);
  must(I.base === G.base && I.power === G.power && I.val === G.val, 'the two forms do not carry the same numbers');
  must(close(value(I.base) ** value(I.power), value(I.val)), `the statement is false: ${q.questionMath}`);
  must(q.workingOut === `${toLog ? q.questionMath : q.answer} \\iff ${toLog ? q.answer : q.questionMath}`, 'working');
  const dir = toLog ? 'to log form' : 'to index form';
  if (band === 'foundation') {
    must(/^\d+$/.test(I.power) && Number(I.power) >= 2, 'Foundation power is not a whole number');
    must(Number(I.val) <= 10000, 'Foundation value too big');
    return { kind: dir };
  }
  if (/^-\d+$/.test(I.power)) return { kind: `negative power, ${dir}` };
  must(/\\frac/.test(I.power), `Core power is neither negative nor fractional: ${I.power}`);
  return { kind: `fractional power, ${dir}` };
}

/* ------------------------------------------------------ evaluate-logs */

const BASEARG = /^\\log(?:_\{(\d+|\\sqrt\{\d+\})\})?(.+)$/;

function checkEvaluate(q, band) {
  must(q.instruction === 'Evaluate', 'instruction');
  const m = BASEARG.exec(q.questionMath);
  must(m, `not one log: ${q.questionMath}`);
  const base = m[1] ?? '10', argTex = m[2];
  const v = value(q.questionMath);
  const ans = rational(q.answer);
  must(close(v, ans), `wrong value: ${q.questionMath} is not ${q.answer}`);
  const lines = lastIsAnswer(q);
  must(lines[0].startsWith(`${q.questionMath} = `), 'working starts from the question');
  lines.forEach((line, k) => {
    if (line.startsWith('= ')) must(close(value(line.slice(2)), v), `working line has the wrong value: ${line}`);
    else if (k === 0 && line !== `${q.questionMath} = x`) must(close(value(line.slice(q.questionMath.length + 3)), v), `working: ${line}`);
    else holds(line, { x: ans });
  });
  if (band === 'foundation') {
    must(Number.isInteger(ans) && ans >= 0 && /^ \d+$/.test(argTex) && /^\d+$/.test(base), 'Foundation is a whole-number answer');
    must(Number(argTex) <= 10000, 'Foundation number too big');
    return { kind: ans === 0 ? 'log of 1' : ans === 1 ? 'log of the base' : 'a power' };
  }
  if (band === 'core') {
    must(Number.isInteger(ans) && ans < 0 && /^\d+$/.test(base), 'Core is a negative whole-number answer');
    if (argTex.includes('\\frac')) return { kind: 'fraction' };
    must(argTex.includes('.'), 'Core argument is neither a fraction nor a decimal');
    return { kind: 'decimal' };
  }
  if (base.includes('\\sqrt')) return { kind: 'root base' };
  must(!Number.isInteger(ans), 'Stretch answer should be a fraction');
  return { kind: argTex.includes('\\sqrt') ? 'root argument' : 'power base' };
}

/* --------------------------------------------------------- log-single */

const LOGS = /\\log(?:_\{(\d+)\})?/g;
const baseOf = (tex) => {
  const bases = new Set([...tex.matchAll(LOGS)].map((m) => m[1] ?? '10'));
  must(bases.size === 1, `more than one base: ${tex}`);
  return Number([...bases][0]);
};
const terms = (tex) => tex.split(/ [+-] /).map((t) => t.replace(/^-/, ''));

function checkSingle(q, band) {
  must(q.instruction === 'Write as a single logarithm', 'instruction');
  const b = baseOf(q.questionMath);
  const v = value(q.questionMath);
  const m = /^\\log(?:_\{(\d+)\})?(?: (\d+)|\\left\(\\frac\{(\d+)\}\{(\d+)\}\\right\))$/.exec(q.answer);
  must(m, `answer is not one log of a number: ${q.answer}`);
  must(Number(m[1] ?? 10) === b, 'answer is in another base');
  const [p, d] = m[2] ? [Number(m[2]), 1] : [Number(m[3]), Number(m[4])];
  must(gcd(p, d) === 1 && (d > 1 || !m[3]), 'answer fraction not in lowest terms');
  must(!isPower(p / d, b), `answer simplifies further: ${q.answer}`);
  must(close(value(q.answer), v), `wrong single log: ${q.questionMath} is not ${q.answer}`);
  const lines = lastIsAnswer(q);
  lines.forEach((line) => {
    must(line.startsWith('= '), `working line: ${line}`);
    must(close(value(line.slice(2)), v), `working line has the wrong value: ${line}`);
  });
  const ts = terms(q.questionMath);
  must(!q.questionMath.startsWith('-'), 'leads with a minus');
  const constants = ts.filter((t) => /^\d+$/.test(t));
  const fractions = ts.filter((t) => /^\\frac/.test(t));
  const coefs = ts.map((t) => /^(\d+)\\log/.exec(t)?.[1]).filter(Boolean).map(Number);
  if (band === 'foundation') {
    must(ts.length === 2 && !constants.length && !fractions.length && !coefs.length, 'Foundation is two bare logs');
    return { kind: q.questionMath.includes(' - ') ? 'difference' : 'sum' };
  }
  if (band === 'core') {
    must(!constants.length && !fractions.length, 'Core has no whole numbers or fractions');
    if (ts.length === 3) return { kind: 'three terms' };
    must(ts.length === 2 && coefs.some((c) => c >= 2), 'Core two-term question needs a coefficient');
    return { kind: 'two terms' };
  }
  must(ts.length === 2, 'Stretch has two terms');
  if (constants.length) { must(!fractions.length, 'both'); return { kind: 'whole number' }; }
  must(fractions.length === 1, 'Stretch needs a whole number or a fraction in front');
  return { kind: 'a fraction in front' };
}

/* ------------------------------------------------------- log-in-terms */

const GIVEN = /^\\log(?:_\{(\d+)\})? (\d+) = ([pq])$/;

function checkInTerms(q, band) {
  must(q.instruction === 'Write in terms of p and q', 'instruction');
  const [givens, target, ...rest] = q.questionMath.split('\n');
  must(!rest.length, 'too many lines');
  const g = givens.split(', \\quad ').map((s) => GIVEN.exec(s));
  must(g.length === 2 && g.every(Boolean), `givens: ${givens}`);
  must(g[0][3] === 'p' && g[1][3] === 'q', 'givens name p then q');
  const b = Number(g[0][1] ?? 10);
  must(Number(g[1][1] ?? 10) === b && baseOf(target) === b, 'one base throughout');
  const [m, n] = [Number(g[0][2]), Number(g[1][2])];
  must(m !== n && !isPower(m, b) && !isPower(n, b), 'given numbers');
  // The givens are primes not dividing the base, so p, q and 1 are
  // independent and the answer is the only one (an unused given still has
  // to be a fair one).
  const prime = (k) => k > 1 && [...Array(k).keys()].slice(2).every((f) => k % f !== 0);
  must(prime(m) && prime(n) && b % m !== 0 && b % n !== 0, 'a given number is not a prime apart from the base');
  const vars = { p: Math.log(m) / Math.log(b), q: Math.log(n) / Math.log(b) };
  const T = value(target);
  must(!q.answer.includes('\\log') && [...lettersIn(q.answer)].every((v) => v === 'p' || v === 'q'), `answer: ${q.answer}`);
  must(close(value(q.answer, vars), T), `wrong: ${target} is not ${q.answer}`);
  const at = (p, qq) => value(q.answer, { p, q: qq });
  const raw = [at(0, 0), at(1, 0) - at(0, 0), at(0, 1) - at(0, 0)];
  raw.forEach((c) => must(Math.abs(c - Math.round(c)) < 1e-9, 'coefficients not whole'));
  const [c0, cp, cq] = raw.map(Math.round);
  const lines = lastIsAnswer(q);
  must(lines[0].startsWith(`${target} = `), 'working starts from the target');
  holds(lines[0], vars);
  lines.slice(1).forEach((line) => {
    must(line.startsWith('= '), `working line: ${line}`);
    must(close(value(line.slice(2), vars), T), `working line has the wrong value: ${line}`);
  });
  if (band === 'foundation') {
    must(c0 === 0, 'Foundation has no constant');
    if (cp === 1 && cq === 1) return { kind: 'product' };
    if (cp * cq === -1) return { kind: 'quotient' };
    must(cp * cq === 0 && [2, 3].includes(Math.abs(cp + cq)), 'Foundation is one law');
    return { kind: 'power' };
  }
  if (band === 'core') {
    must(c0 === 0 && cp !== 0 && cq !== 0 && Math.max(Math.abs(cp), Math.abs(cq)) >= 2, 'Core is powers of both');
    return { kind: cp * cq > 0 ? 'product of powers' : 'quotient of powers' };
  }
  must(c0 !== 0, 'Stretch folds in a power of the base');
  return { kind: /^\\log(_\{\d+\})? \d+$/.test(target) ? 'whole number' : 'fraction or decimal' };
}

/* --------------------------------------------------------- log-remove */

function checkRemove(q, band) {
  must(q.instruction === 'Write without logarithms', 'instruction');
  const [lhs, rhs] = sides(q.questionMath);
  const m = /^\\log(?:_\{(\d+)\})? ([A-Za-z])$/.exec(lhs);
  must(m, `left side: ${lhs}`);
  const b = Number(m[1] ?? 10), Y = m[2];
  const [ay, ans] = sides(q.answer);
  must(ay === Y && !ans.includes('\\log'), `answer: ${q.answer}`);
  const letters = [...lettersIn(rhs)];
  must(!letters.includes(Y), 'subject on both sides');
  must([...lettersIn(ans)].every((v) => letters.includes(v)), 'answer brings in a new letter');
  const lines = lastIsAnswer(q);
  [[1.37, 2.91], [3.83, 1.69]].forEach((vals) => {
    const vars = Object.fromEntries(letters.map((v, k) => [v, vals[k % 2] + k * 0.11]));
    const y = b ** value(rhs, vars);
    must(close(value(ans, vars), y, 1e-8), `wrong: ${q.answer}`);
    lines.forEach((line) => holds(line, { ...vars, [Y]: y }));
  });
  const ts = terms(rhs);
  const logTerms = ts.filter((t) => t.includes('\\log'));
  const constants = ts.filter((t) => /^\d+$/.test(t));
  const fractions = ts.filter((t) => /^\\frac/.test(t));
  const coefs = ts.map((t) => /^(\d+)\\log/.exec(t)?.[1]).filter(Boolean).map(Number);
  if (band === 'foundation') {
    if (!logTerms.length) {
      must(letters.length === 1 && letters[0] === 'x', 'definition question is linear in x');
      return { kind: 'from the definition' };
    }
    must(!constants.length && !fractions.length && !rhs.startsWith('-'), 'Foundation is one law');
    must((logTerms.length === 1 && coefs.length === 1) || (logTerms.length === 2 && !coefs.length), 'Foundation is one law');
    return { kind: 'one law' };
  }
  must(logTerms.length === ts.length - constants.length, 'a term that is not a log or a number');
  if (band === 'core') {
    must(!constants.length && !fractions.length, 'Core has no constants or fractions');
    if (logTerms.length === 1) { must(rhs.startsWith('-'), 'Core single term is negative'); return { kind: 'powers divided' }; }
    must(logTerms.length === 2 && coefs.some((c) => c >= 2), 'Core needs a coefficient');
    return { kind: rhs.includes(' - ') ? 'powers divided' : 'powers multiplied' };
  }
  if (fractions.length) return { kind: 'a fraction in front' };
  must(constants.length === 1, 'Stretch needs a constant or a fraction in front');
  return { kind: 'a constant' };
}

/* ---------------------------------------------- log-solve-exponential */

const SF3 = 'Give your answer to 3 significant figures';
// The one root of f, increasing or decreasing, between lo and hi.
const bisect = (f, lo = -300, hi = 600) => {
  let flo = f(lo);
  const fhi = f(hi);
  must(Math.sign(flo) !== Math.sign(fhi), 'no root in range');
  for (let k = 0; k < 200; k += 1) {
    const mid = (lo + hi) / 2;
    const fm = f(mid);
    if (Math.sign(fm) === Math.sign(flo)) { lo = mid; flo = fm; } else hi = mid;
  }
  return (lo + hi) / 2;
};

function checkSolveExponential(q, band) {
  must(q.instruction.endsWith(SF3), 'instruction asks for 3 significant figures');
  const lines = q.questionMath.split('\n');
  let letter, lhs, target, kind;
  if (lines.length === 2) {
    must(band === 'stretch', 'a model below Stretch');
    const [S, rhs] = sides(lines[0]);
    const m = /^\\text\{Find \} ([tn]) \\text\{ when \} ([A-Z]) = (\d+(?:\.\d+)?)$/.exec(lines[1]);
    must(m && m[2] === S, `model question: ${lines[1]}`);
    letter = m[1]; lhs = rhs; target = Number(m[3]);
    must([...lettersIn(rhs)].join('') === letter, 'model in its own letter');
    must(['days', 'hours', 'years'].includes(q.answerUnits), 'model units');
    const start = value(rhs, { [letter]: 0 });
    kind = value(rhs, { [letter]: 1 }) > start ? 'growth model' : 'decay model';
    must((kind === 'growth model') === (target > start), 'target on the wrong side of the start');
  } else {
    must(lines.length === 1 && !q.answerUnits, 'one equation, no units');
    const [l, r] = sides(lines[0]);
    lhs = l; letter = 'x'; target = value(r);
    must(/^\d+(\.\d+)?$/.test(r), 'right side is a number');
    const m = /^(?:(\d) \\times )?(\d+|\(\d\.\d+\))\^\{(.+)\}$/.exec(l);
    must(m, `left side: ${l}`);
    const [, k, base, e] = m;
    if (band === 'foundation') must(!k && base === '10' && e === 'x', 'Foundation is 10^x');
    else if (band === 'core') must(!k && base !== '10' && e === 'x', 'Core is a^x');
    else must(Boolean(k) !== (e !== 'x'), 'Stretch has a coefficient or a linear index');
    if (band === 'stretch') kind = k ? 'coefficient' : 'linear index';
  }
  const root = bisect((x) => Math.log(value(lhs, { [letter]: x })) - Math.log(target));
  must(!boundaryRisk(root), 'answer sits on a rounding boundary');
  must(q.answer === `${letter} = ${sf3(root)}`, `wrong: ${q.answer}, should be ${letter} = ${sf3(root)}`);
  const working = q.workingOut.split('\n');
  must(working[working.length - 1] === q.answer, 'working ends at the answer');
  working.slice(0, -1).forEach((line) => holds(line, { [letter]: root }));
  if (band !== 'stretch') return { kind: root > 0 ? 'positive answer' : 'negative answer' };
  if (kind.endsWith('model')) must(root > 0, 'a model answer is in the future');
  return { kind };
}

/* ------------------------------------------------------ log-equations */

function checkLogEquations(q, band) {
  must(q.instruction === 'Solve', 'instruction');
  const [lhs, rhs] = sides(q.questionMath);
  const [ax, at] = sides(q.answer);
  must(ax === 'x', 'answer is x = ...');
  must([...lettersIn(q.questionMath)].every((v) => v === 'x'), 'one unknown');
  let x;
  if (/^0\.\d+$/.test(at)) {
    must(!/_\{/.test(q.questionMath), 'decimal answers only in base 10');
    x = Number(at);
  } else x = rational(at);
  must(close(value(lhs, { x }), value(rhs, { x })), `x = ${at} does not solve ${q.questionMath}`);
  const lines = lastIsAnswer(q);
  lines.forEach((line) => holds(line, { x }));
  const logCount = (lhs.match(/\\log/g) ?? []).length;
  if (band === 'foundation') {
    must(logCount === 1 && /^\d+$/.test(rhs), 'Foundation is one log equal to a whole number');
    if (/^\\log_\{x\}/.test(lhs)) return { kind: 'find the base' };
    must(/^\\log(_\{\d+\})? x$/.test(lhs), 'Foundation log of x');
    return { kind: 'find the number' };
  }
  if (band === 'core') {
    must(logCount === 1 && !/\\log_\{x\}/.test(lhs), 'Core is one log');
    if (/^\\log(_\{\d+\})? x$/.test(lhs)) {
      must(/^-\d+$|\\frac/.test(rhs), 'Core power is negative or fractional');
      return { kind: 'negative or fractional' };
    }
    must(/^\\log(_\{\d+\})?\(.*x.*\)$/.test(lhs), 'Core linear inside a bracket');
    return { kind: 'linear inside' };
  }
  must(logCount === 2 && baseOf(lhs) > 1, 'Stretch has two logs in one base');
  must(Math.abs(x) > 0, 'zero answer');
  if ((lhs.match(/x/g) ?? []).length === 2) {
    must(Number.isInteger(x) && x > 0, 'two logs of x has a positive whole answer');
    // The working is the one route through, rebuilt from the question.
    const m = /^(\\log(?:_\{\d+\})?) x \+ \\log(?:_\{\d+\})?\(x \+ (\d+)\)$/.exec(lhs);
    must(m, `two logs of x: ${lhs}`);
    const d = Number(m[2]), V = baseOf(lhs) ** Number(rhs);
    must(x * (x + d) === V, 'the answer is not the positive root');
    must(q.workingOut === [
      `${m[1]}(x(x + ${d})) = ${rhs}`,
      `x^{2} + ${d === 1 ? '' : d}x = ${V}`,
      `(x - ${x})(x + ${x + d}) = 0`,
      `x = ${x}`,
    ].join('\n'), `working: ${q.workingOut}`);
    return { kind: 'two logs of x' };
  }
  return { kind: 'combine with a number' };
}

/* -------------------------------------------------------------- entry */

const CHECKS = {
  'log-index-form': checkIndexForm,
  'evaluate-logs': checkEvaluate,
  'log-single': checkSingle,
  'log-in-terms': checkInTerms,
  'log-remove': checkRemove,
  'log-solve-exponential': checkSolveExponential,
  'log-equations': checkLogEquations,
};

export function checkLog(q, band) {
  const topic = q.metadata?.topic;
  must(CHECKS[topic], `unknown topic ${topic}`);
  must(q.metadata.difficulty === band, 'metadata difficulty');
  must(!q.visualization, 'no figure');
  must(![q.questionMath, q.answer, q.workingOut].some((t) => t.includes('\\log_{10}')), 'base 10 is written plain');
  must(!/\d/.test(q.instruction.replace(/\d+ significant figures/, '')), 'a number in the instruction');
  [q.questionMath, q.answer, q.workingOut].forEach(compiles);
  return CHECKS[topic](q, band);
}
