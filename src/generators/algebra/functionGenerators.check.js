// The checker for the Functions skills, shared by the harness
// (functionGenerators.test.js) and the mutation test
// (functionGenerators.mutation.test.js). Test support only.
//
// Everything is read back off the board. The definitions in questionMath
// are parsed by a small LaTeX reader of this file's own and run as real
// functions; every answer is then tested against them by substitution: an
// expression must agree with the composite or substitution it claims to be
// at sample values of x, an inverse must undo the function both ways, a
// range is found by sweeping the domain, and the solutions of an absolute
// value equation by scanning the line for sign changes. Nothing is imported
// from the generator.
//
// Working is checked line by line: each line, or each part of it, must hold
// either for every sample x (an identity) or at the answer (an equation).

import { compiles } from '../number/latexArithmetic.check';

const fail = (msg, q) => { throw new Error(`${msg}\n${JSON.stringify(q)}`); };
const must = (cond, msg, q) => { if (!cond) fail(msg, q); };
const close = (a, b) => Math.abs(a - b) <= 1e-7 * Math.max(1, Math.abs(a), Math.abs(b));

/* ------------------------------------------------------ the reader */

function tokenize(src) {
  const out = [];
  let s = src;
  while (s.length) {
    let m;
    if ((m = /^(\s+|\\,|\\ |\\quad)/.exec(s))) { s = s.slice(m[0].length); continue; }
    if ((m = /^\d+(\.\d+)?/.exec(s))) out.push({ t: 'num', v: Number(m[0]) });
    else if ((m = /^\^\{-1\}/.exec(s))) out.push({ t: 'inv' });
    else if ((m = /^\\(frac|times|lvert|rvert)/.exec(s))) out.push({ t: m[1] });
    else if ((m = /^[a-z]/.exec(s))) out.push({ t: 'id', v: m[0] });
    else if ((m = /^[-+(){}^=<>|]/.exec(s))) out.push({ t: m[0] });
    else throw new Error(`cannot read "${s}"`);
    s = s.slice(m[0].length);
  }
  return out;
}

// Evaluate an expression. env.vars holds letters, env.fns functions by
// name (with 'f^{-1}' for an inverse). A run of function letters before a
// bracket composes them: fg(3) is f(g(3)).
const TOKENS = new Map();
const tokensOf = (src) => {
  if (!TOKENS.has(src)) { if (TOKENS.size > 50000) TOKENS.clear(); TOKENS.set(src, tokenize(src)); }
  return TOKENS.get(src);
};

export function evaluate(src, env) {
  const tk = tokensOf(src);
  let i = 0;
  const peek = (k = 0) => tk[i + k];
  const take = (t) => { if (tk[i]?.t !== t) throw new Error(`expected ${t} in "${src}"`); return tk[i++]; };
  const group = (o, c) => { take(o); const v = expr(); take(c); return v; };
  const fnRun = () => {
    // f( , fg( , f^{-1}(
    let k = 0;
    const names = [];
    while (peek(k)?.t === 'id' && env.fns[peek(k).v]) { names.push(peek(k).v); k += 1; }
    if (!names.length) return null;
    if (peek(k)?.t === 'inv' && names.length === 1 && peek(k + 1)?.t === '(') return { names: [`${names[0]}^{-1}`], len: k + 1 };
    if (peek(k)?.t === '(') return { names, len: k };
    return null;
  };
  const primary = () => {
    const t = peek();
    if (!t) throw new Error(`"${src}" ends early`);
    if (t.t === 'num') { i += 1; return t.v; }
    if (t.t === 'id') {
      const run = fnRun();
      if (run) {
        i += run.len;
        const arg = group('(', ')');
        return run.names.reduceRight((acc, n) => {
          if (!env.fns[n]) throw new Error(`no function ${n}`);
          return env.fns[n](acc);
        }, arg);
      }
      i += 1;
      if (!(t.v in env.vars)) throw new Error(`"${src}" uses ${t.v}, which has no value`);
      return env.vars[t.v];
    }
    if (t.t === '(') return group('(', ')');
    if (t.t === '{') return group('{', '}');
    if (t.t === 'frac') { i += 1; const a = group('{', '}'); return a / group('{', '}'); }
    if (t.t === 'lvert') { i += 1; const v = expr(); take('rvert'); return Math.abs(v); }
    throw new Error(`unexpected ${t.t} in "${src}"`);
  };
  const power = () => {
    let v = primary();
    while (peek()?.t === '^') { i += 1; v **= peek()?.t === '{' ? group('{', '}') : take('num').v; }
    return v;
  };
  const startsFactor = (t) => t && (t.t === 'num' || t.t === 'id' || t.t === '(' || t.t === 'frac' || t.t === 'lvert');
  const term = () => {
    let v = power();
    for (;;) {
      if (peek()?.t === 'times') { i += 1; v *= power(); continue; }
      if (startsFactor(peek()) && peek().t !== 'num') { v *= power(); continue; }   // 3x, 2(x + 1), x(y - 1)
      return v;
    }
  };
  function expr() {
    let sign = 1;
    if (peek()?.t === '-') { i += 1; sign = -1; } else if (peek()?.t === '+') i += 1;
    let v = sign * term();
    while (peek()?.t === '+' || peek()?.t === '-') {
      const op = tk[i++].t;
      v = op === '+' ? v + term() : v - term();
    }
    return v;
  }
  const v = expr();
  if (i !== tk.length) throw new Error(`unread "${tk[i].t}" in "${src}"`);
  return v;
}

// One definition: "f(x) = 3x - 7" or "f : x \mapsto 3x - 7".
const DEF = /^([fgh])(?:\(x\) = | : x \\mapsto )(.+)$/;
export function readDef(line) {
  const m = DEF.exec(line);
  if (!m) return null;
  return { name: m[1], body: m[2], arrow: line.includes('\\mapsto') };
}
const asFn = (body) => (t) => evaluate(body, { vars: { x: t }, fns: {} });

// The coefficients of a polynomial body, by evaluating it: exact for
// degree up to 3 with integer coefficients.
function coeffsOf(fn) {
  const v = [-1, 0, 1, 2].map(fn);
  // Newton's divided differences on x = -1, 0, 1, 2.
  const c3 = (v[3] - 3 * v[2] + 3 * v[1] - v[0]) / 6;
  const c2 = (v[2] - 2 * v[1] + v[0]) / 2;
  const c1 = (v[2] - v[0]) / 2 - c3;
  const c0 = v[1];
  return [c0, c1, c2, c3].map((c) => Math.round(c * 1e9) / 1e9);
}
const degree = (fn) => { const c = coeffsOf(fn); return c[3] ? 3 : c[2] ? 2 : c[1] ? 1 : 0; };
const SAMPLES = [-2.3, -0.7, 0.45, 1.9, 4.1, 7.3];
const sameFn = (f, g) => SAMPLES.every((x) => close(f(x), g(x)));

// Simplest form for a polynomial: terms in descending powers, each power
// once, no brackets, no 1x, no zero terms.
const TERM = /^(\d*)(x(?:\^(\d))?)?$/;
export function simplestPoly(tex) {
  const bits = tex.replace(/^-/, '').split(/ [+-] /);
  let last = Infinity;
  for (const t of bits) {
    const m = TERM.exec(t);
    if (!m || t === '') return false;
    if (m[1] === '1' && m[2]) return false;
    if (/^0/.test(m[1])) return false;
    const pow = m[2] ? Number(m[3] ?? 1) : 0;
    if (pow >= last) return false;
    last = pow;
  }
  return true;
}

/* ----------------------------------------------------- the working */

// Each line, split into parts, must hold as an identity over the sample
// values of x or at one of the answer's values of x. Statements about
// limits and rejections are prose and skipped.
function checkWorking(q, fns, vars = {}, answers = [], ySide = null) {
  must(typeof q.workingOut === 'string' && !q.workingOut.includes('\\n'), 'working uses real newlines', q);
  const holds = (part, env) => {
    if (/\\text\{ (gives|when) \}/.test(part)) {
      const [eq, at] = part.split(/ \\text\{ (?:gives|when) \} /);
      const m = /^x = (-?\d+)$/.exec(at);
      if (!m) return false;
      return chain(eq, { ...env, x: Number(m[1]) });
    }
    return chain(part, env);
  };
  const chain = (part, env) => {
    const sides = part.split(/ = | < | > /);
    if (sides.length < 2) return false;
    const vals = sides.map((sd) => evaluate(sd, { vars: env, fns }));
    return vals.every((v) => close(v, vals[0]));
  };
  q.workingOut.split('\n').forEach((line) => {
    if (/\\to |reject|\\text\{as |:/.test(line)) return;
    const parts = line.split(/ \\text\{ or \} |, \\quad |, \\ (?=[a-z] = )/);
    parts.forEach((part) => {
      const envs = [
        SAMPLES.map((x) => ({ ...vars, x, ...(ySide ? { y: ySide(x) } : {}) })),
        ...answers.map((x) => [{ ...vars, x }]),
      ];
      let ok = false;
      for (const group of envs) {
        try { if (group.every((env) => holds(part, env))) { ok = true; break; } } catch { /* try the next */ }
      }
      must(ok, `working "${part}" does not hold`, q);
    });
  });
}

/* ----------------------------------------------------------- shared */

// The working ends at the answer: its last line is the answer, or ends in
// its final number.
const reaches = (q) => {
  const last = q.workingOut.split('\n').at(-1);
  const final = (q.answer.match(/-?\d+(?!.*\d)/) ?? [])[0];
  let ok;
  if (/^-?\d+$/.test(q.answer)) ok = last.endsWith(`= ${final}`);
  else if (/^[xk] = -?\d+$/.test(q.answer)) ok = last === q.answer || (last.startsWith(q.answer[0]) && last.endsWith(`= ${final}`));
  else if (/^[fgh]\^\{-1\}\(-?\d+\) = -?\d+$/.test(q.answer)) ok = last === `x = ${final}`;
  else ok = last === q.answer;
  must(ok, `the working stops at "${last}", short of ${q.answer}`, q);
};
const wlines = (q) => q.workingOut.split('\n');

// Reads the instruction with its real minus signs as hyphens, after
// checking no hyphen stands in for a minus.
const meta = (q, topic, difficulty) => {
  must(q.metadata?.topic === topic && q.metadata?.difficulty === difficulty, 'metadata', q);
  must(!/-/.test(q.instruction), 'a minus sign in the instruction is a real minus', q);
};
const instr = (q) => q.instruction.replace(/\u2212/g, '-');

// On the board the numbers asked about are the question's last line, big, with
// a plain instruction above them. The checks read that back as one sentence.
export const asked = (q) => {
  const lines = q.questionMath.split('\n');
  if (lines.length < 2 || !['Evaluate', 'Find x'].includes(q.instruction)) return q;
  const last = lines.pop();
  return {
    ...q,
    questionMath: lines.join('\n'),
    instruction: q.instruction === 'Evaluate' ? `Find ${last}` : `Find x when ${last}`,
  };
};
// The same for an absolute value, whose last line gives the values.
export const askedAbsolute = (q) => {
  const lines = q.questionMath.split('\n');
  if (lines.length < 2 || q.instruction !== 'Evaluate') return q;
  const last = lines.pop().replace(',\\ ', ' and ');
  return { ...q, questionMath: lines.join('\n'), instruction: `Find the value when ${last}` };
};
const renders = (q) => {
  [q.questionMath, q.answer].forEach((t) => { try { compiles(t); } catch (e) { fail(`KaTeX: ${e.message}`, q); } });
};
const noExtras = (q) => must(q.visualization === undefined && q.questionText === undefined && q.answerUnits === undefined, 'no figure, no prose question, no units', q);

// The definitions in questionMath, as functions.
function defsOf(q, lines) {
  const out = {};
  lines.forEach((l) => {
    const d = readDef(l);
    must(d, `definition "${l}"`, q);
    must(!out[d.name], `${d.name} defined twice`, q);
    out[d.name] = { ...d, fn: asFn(d.body) };
  });
  return out;
}
const fnsOf = (defs) => Object.fromEntries(Object.entries(defs).map(([k, d]) => [k, d.fn]));
const int = (s) => (/^-?\d+$/.test(s) ? Number(s) : NaN);

/* ------------------------------------------------- function notation */

export function checkFunctionNotation(raw, difficulty) {
  const q = asked(raw);
  meta(raw, 'function-notation', difficulty); noExtras(q); renders(raw);
  let kind;
  const ev = /^Find ([fgh])\((-?\d+)\)$/.exec(instr(q));
  const rev = /^Find x when ([fgh])\(x\) = (-?\d+)$/.exec(instr(q));
  if (ev || rev) {
    const defs = defsOf(q, [q.questionMath]);
    const name = (ev ?? rev)[1];
    must(defs[name], 'asks about the function defined', q);
    const f = defs[name].fn;
    const deg = degree(f);
    if (ev) {
      const n = Number(ev[2]);
      must(q.workingOut.startsWith(`${name}(${n}) = `), `the working evaluates ${name}(${n})`, q);
      must(int(q.answer) === f(n), `answer ${q.answer}, ${name}(${n}) is ${f(n)}`, q);
      kind = deg === 1 ? 'linear value' : deg === 2 ? 'quadratic value' : `degree ${deg}`;
      reaches(q);
      if (kind === 'quadratic value') must(n < 0, 'a quadratic is evaluated at a negative number', q);
      checkWorking(q, fnsOf(defs));
    } else {
      const m = /^x = (-?\d+)$/.exec(q.answer);
      must(m && close(f(Number(m[1])), Number(rev[2])), `answer ${q.answer}`, q);
      must(deg === 1, 'reverse questions are linear', q);
      kind = 'reverse';
      reaches(q);
      checkWorking(q, fnsOf(defs), {}, [Number(m[1])]);
    }
  } else if (q.instruction === 'Find, in simplest form,') {
    const m = /^([fgh])\((.+)\) \\text\{ when \} (.+)$/.exec(q.questionMath);
    must(m, `question "${q.questionMath}"`, q);
    const defs = defsOf(q, [m[3]]);
    must(defs[m[1]] && !defs[m[1]].arrow, 'the function substituted into is the one defined', q);
    const f = defs[m[1]].fn;
    const arg = (x) => evaluate(m[2], { vars: { x }, fns: {} });
    const am = new RegExp(`^${m[1]}\\(${m[2].replace(/[()+^]/g, '\\$&')}\\) = (.+)$`).exec(q.answer);
    must(am, `answer "${q.answer}" names ${m[1]}(${m[2]})`, q);
    must(simplestPoly(am[1]), `answer "${am[1]}" is in simplest form`, q);
    must(sameFn(asFn(am[1]), (x) => f(arg(x))), `answer "${am[1]}" is not ${m[1]}(${m[2]})`, q);
    must(!sameFn(f, (x) => f(arg(x))), 'the substitution changes the function', q);
    kind = 'substitute';
    reaches(q);
    checkWorking(q, fnsOf(defs));
  } else if (q.instruction === 'Find a and b') {
    const lines = q.questionMath.split('\n');
    const d = /^([fgh])\(x\) = ax \+ b$/.exec(lines[0]);
    const v = /^([fgh])\((-?\d+)\) = (-?\d+), \\quad ([fgh])\((-?\d+)\) = (-?\d+)$/.exec(lines[1] ?? '');
    must(lines.length === 2 && d && v && v[1] === d[1] && v[4] === d[1], `question "${q.questionMath}"`, q);
    const am = /^a = (-?\d+), \\ b = (-?\d+)$/.exec(q.answer);
    must(am, `answer "${q.answer}"`, q);
    const [a, b] = [Number(am[1]), Number(am[2])];
    must(a !== 0, 'a is not zero', q);
    must(a * Number(v[2]) + b === Number(v[3]) && a * Number(v[5]) + b === Number(v[6]), 'a and b give both values', q);
    must(Number(v[2]) !== Number(v[5]), 'two different inputs', q);
    kind = 'two values';
    reaches(q);
    checkWorking(q, {}, { a, b });
  } else fail(`instruction "${q.instruction}"`, q);
  const allowed = { foundation: ['linear value'], core: ['quadratic value', 'reverse'], stretch: ['substitute', 'two values'] }[difficulty];
  must(allowed.includes(kind), `${difficulty} does not ask "${kind}"`, q);
  return { kind };
}

/* -------------------------------------------------- domain and range */

const REL = { '\\le': false, '<': true };

export function checkDomainRange(q, difficulty) {
  meta(q, 'domain-range', difficulty); noExtras(q); renders(q);
  must(q.instruction === 'Find the range of the function', 'instruction', q);
  const [defLine, dom] = q.questionMath.split(', \\quad ');
  const defs = defsOf(q, [defLine]);
  const { name, fn: f } = Object.values(defs)[0];
  const deg = degree(f);
  let kind;
  const set = /^x \\in \\\{(-?\d+(?:, -?\d+)*)\\\}$/.exec(dom ?? '');
  const iv = /^(-?\d+) (\\le|<) x (\\le|<) (-?\d+)$/.exec(dom ?? '');
  if (set) {
    const xs = set[1].split(', ').map(Number);
    must(xs.every((x, k) => k === 0 || x > xs[k - 1]), 'the domain is listed in order', q);
    const ys = [...new Set(xs.map(f))].sort((p, r) => p - r);
    must(q.answer === `\\{${ys.join(', ')}\\}`, `answer "${q.answer}", the range is {${ys}}`, q);
    must(q.workingOut === xs.map((x) => `${name}(${x}) = ${f(x)}`).join('\n'), 'the working evaluates every element of the domain', q);
    kind = 'set';
  } else if (iv) {
    const [lo, hi] = [Number(iv[1]), Number(iv[4])];
    must(lo < hi, 'a real interval', q);
    const strict = { lo: REL[iv[2]], hi: REL[iv[3]] };
    // Sweep the domain in sixteenths, which hits every whole number, so a
    // turning point at a whole number is found exactly.
    const N = (hi - lo) * 16;
    let min = Infinity, max = -Infinity, argmin = 0, argmax = 0;
    for (let k = 0; k <= N; k += 1) {
      const x = lo + ((hi - lo) * k) / N;
      const y = f(x);
      if (y < min) { min = y; argmin = x; }
      if (y > max) { max = y; argmax = x; }
    }
    // An extreme is reached only if it is at an included end, or inside.
    const reached = (x) => (x === lo ? !strict.lo : x === hi ? !strict.hi : true);
    const am = new RegExp(`^(-?\\d+) (\\\\le|<) ${name}\\(x\\) (\\\\le|<) (-?\\d+)$`).exec(q.answer);
    must(am, `answer "${q.answer}"`, q);
    must(Math.abs(Number(am[1]) - min) < 1e-6 && Math.abs(Number(am[4]) - max) < 1e-6, `answer ${q.answer}, the range runs ${min} to ${max}`, q);
    must(REL[am[2]] === !reached(argmin) && REL[am[3]] === !reached(argmax), 'the range includes exactly the values reached', q);
    const ends = `${name}(${lo}) = ${f(lo)}`, ende = `${name}(${hi}) = ${f(hi)}`;
    must(wlines(q).some((l) => l.includes(ends)) && wlines(q).some((l) => l.includes(ende)), 'the working evaluates both ends', q);
    if (deg === 1) {
      kind = 'interval';
    } else {
      must(deg === 2 && !strict.lo && !strict.hi, 'a quadratic on a closed interval', q);
      const inside = [argmin, argmax].filter((x) => x > lo && x < hi).length;
      must(inside === 1, 'the turning point is inside the domain and gives one end of the range', q);
      const tp = [argmin, argmax].find((x) => x > lo && x < hi);
      must(wlines(q).includes(`${name}(${tp}) = ${f(tp)}`), 'the working evaluates the turning point', q);
      kind = 'quadratic';
    }
  } else fail(`domain "${dom}"`, q);
  checkWorking(q, fnsOf(defs));
  const allowed = { foundation: 'set', core: 'interval', stretch: 'quadratic' }[difficulty];
  must(kind === allowed, `${difficulty} does not ask "${kind}"`, q);
  return { kind: kind === 'set' ? (deg === 1 ? 'set linear' : 'set quadratic') : kind };
}

/* ------------------------------------------------ composite functions */

const COMP = '([fgh])\\(([fgh])\\(([^)]+)\\)\\)|([fgh])([fgh])\\(([^)]+)\\)';
const readComp = (s) => {
  const m = new RegExp(`^(?:${COMP})$`).exec(s);
  if (!m) return null;
  return m[1] ? { outer: m[1], inner: m[2], arg: m[3], short: false } : { outer: m[4], inner: m[5], arg: m[6], short: true };
};

export function checkComposite(raw, difficulty) {
  const q = asked(raw);
  renders(raw);
  meta(raw, 'composite-functions', difficulty); noExtras(q);
  const lines = q.questionMath.split('\n');
  let kind;
  const ev = /^Find (\S+)$/.exec(instr(q));
  const simp = /^Find (\S+) in simplest form$/.exec(instr(q));
  const solve = /^Find x when (\S+) = (-?\d+)$/.exec(instr(q));
  if (q.instruction === 'Find all the possible values of a and b') {
    const d = /^([fgh])\(x\) = ax \+ b$/.exec(lines[0]);
    const c = readComp(lines[1]?.split(' = ')[0] ?? '');
    must(lines.length === 2 && d && c && c.outer === d[1] && c.inner === d[1] && c.arg === 'x', `question "${q.questionMath}"`, q);
    const target = asFn(lines[1].split(' = ')[1]);
    const pairs = q.answer.split(' \\text{ or } ').map((p) => /^a = (-?\d+), \\ b = (-?\d+)$/.exec(p));
    must(pairs.every(Boolean), `answer "${q.answer}"`, q);
    const sols = pairs.map((p) => [Number(p[1]), Number(p[2])]);
    sols.forEach(([a, b]) => must(sameFn((x) => a * (a * x + b) + b, target), `a = ${a}, b = ${b} does not give ${lines[1]}`, q));
    // Every solution: a^2 is the x coefficient, b follows from a.
    const [c0, c1] = coeffsOf(target);
    const all = [Math.sqrt(c1), -Math.sqrt(c1)].filter((a) => a !== -1).map((a) => [a, c0 / (a + 1)]);
    must(sols.length === all.length && sols.every(([a, b], k) => close(a, all[k][0]) && close(b, all[k][1])), `${sols.length} pairs given, ${all.length} exist`, q);
    must(sols.every(([a], k) => k === 0 || a < sols[k - 1][0]), 'pairs in order', q);
    kind = 'self';
    sols.forEach(([a, b]) => must(wlines(q).some((l) => l.startsWith(`a = ${a}: `) && l.endsWith(`b = ${b}`)), `the working finds a = ${a}, b = ${b}`, q));
    const [a0, b0] = sols[0];
    checkWorking(q, { [d[1]]: (x) => a0 * x + b0 }, { a: a0, b: b0 });
  } else {
    const defs = defsOf(q, lines);
    must(lines.length === 2, 'two functions', q);
    const fns = fnsOf(defs);
    const c = readComp(((simp ?? solve ?? ev) ?? [])[1] ?? '');
    must(c && c.outer !== c.inner && defs[c.outer] && defs[c.inner], `instruction "${q.instruction}"`, q);
    const h = (x) => defs[c.outer].fn(defs[c.inner].fn(x));
    const label = c.short ? `${c.outer}${c.inner}(${c.arg})` : `${c.outer}(${c.inner}(${c.arg}))`;
    const degs = [degree(defs[c.outer].fn), degree(defs[c.inner].fn)];
    if (simp) {
      must(c.arg === 'x', 'the composite of x', q);
      const am = /^(.+?) = (.+)$/.exec(q.answer);
      must(am && am[1] === label, `answer names ${label}`, q);
      must(simplestPoly(am[2]) && sameFn(asFn(am[2]), h), `answer "${am[2]}" is not ${label} in simplest form`, q);
      must(degs.includes(2), 'one of the two is quadratic', q);
      kind = 'expression';
      reaches(q);
      checkWorking(q, fns);
    } else if (solve) {
      must(c.arg === 'x', 'the composite of x', q);
      const am = /^x = (-?\d+)$/.exec(q.answer);
      must(am && close(h(Number(am[1])), Number(solve[2])), `answer ${q.answer}`, q);
      must(degs[0] === 1 && degs[1] === 1, 'both linear, so one solution', q);
      kind = 'solve';
      reaches(q);
      checkWorking(q, fns, {}, [Number(am[1])]);
    } else {
      const n = int(c.arg);
      must(Number.isFinite(n), 'a number in', q);
      must(int(q.answer) === h(n), `answer ${q.answer}, ${label} is ${h(n)}`, q);
      kind = 'value';
      reaches(q);
      const mid = defs[c.inner].fn(n);
      must(wlines(q).length === 2 && wlines(q)[0].startsWith(`${c.inner}(${n}) = `) && wlines(q)[0].endsWith(`= ${mid}`)
        && wlines(q)[1].startsWith(`${c.outer}(${mid}) = `), 'the working does the inner function first, then the outer', q);
      checkWorking(q, fns);
    }
  }
  const allowed = { foundation: ['value'], core: ['expression'], stretch: ['solve', 'self'] }[difficulty];
  must(allowed.includes(kind), `${difficulty} does not ask "${kind}"`, q);
  return { kind };
}

/* -------------------------------------------------- inverse functions */

// The inverse by search: solve f(t) = y by the secant method from a spread
// of starting points, keeping only a t that really does give y.
function numericInverse(f) {
  return (y) => {
    for (const seed of [0.3, 1.7, -1.3, 12, -12, 150, -150]) {
      let t0 = seed, t1 = seed + 0.5;
      let f0 = f(t0) - y, f1 = f(t1) - y;
      for (let k = 0; k < 80 && Number.isFinite(f1) && f1 !== f0; k += 1) {
        const t2 = t1 - (f1 * (t1 - t0)) / (f1 - f0);
        [t0, f0, t1, f1] = [t1, f1, t2, f(t2) - y];
        if (Math.abs(f1) < 1e-12 * Math.max(1, Math.abs(y))) break;
      }
      if (Number.isFinite(t1) && Math.abs(f(t1) - y) < 1e-9 * Math.max(1, Math.abs(y))) return t1;
    }
    // Near a pole the secant can jump across it: fall back to a sign-change
    // scan, skipping the jump at the pole itself.
    const g = (t) => f(t) - y;
    for (let t = -200; t < 200; t += 0.05) {
      const a = g(t), b = g(t + 0.05);
      if (!(Number.isFinite(a) && Number.isFinite(b)) || a * b > 0 || Math.abs(a - b) > 1e3) continue;
      let lo = t, hi = t + 0.05;
      for (let k = 0; k < 100; k += 1) { const mid = (lo + hi) / 2; if (g(lo) * g(mid) <= 0) hi = mid; else lo = mid; }
      const r = (lo + hi) / 2;
      if (Math.abs(g(r)) < 1e-9 * Math.max(1, Math.abs(y))) return r;
    }
    return NaN;
  };
}

// The shape of a definition, for the bands.
function formOf(body) {
  if (/^\\frac\{.*x.*\}\{.*x.*\}$/.test(body)) return 'rational';
  if (/^\d+x [+-] \d+$/.test(body)) return 'ax+b';
  if (/^\\frac\{x [+-] \d+\}\{\d+\}$/.test(body)) return '(x+b)/a';
  if (/^\d+\(x [+-] \d+\)$/.test(body)) return 'a(x+b)';
  if (/^\\frac\{-?\d*x [+-] \d+\}\{\d+\}$/.test(body)) return '(ax+b)/c';
  if (/^\d+ - \d*x$/.test(body)) return 'reversed';
  if (/^-?\d*x( [+-] \d+)?$/.test(body)) return 'linear';
  return 'other';
}

export function checkInverse(q, difficulty) {
  meta(q, 'inverse-functions', difficulty); noExtras(q); renders(q);
  let kind;
  if (q.instruction === 'Find the inverse function') {
    const defs = defsOf(q, [q.questionMath]);
    const { name, fn: f, body } = Object.values(defs)[0];
    const am = new RegExp(`^${name}\\^\\{-1\\}\\(x\\) = (.+)$`).exec(q.answer);
    must(am, `answer "${q.answer}"`, q);
    const g = asFn(am[1]);
    const pts = SAMPLES.filter((x) => Number.isFinite(f(x)) && Number.isFinite(g(x)) && Math.abs(f(x)) < 1e6);
    must(pts.length >= 4, 'enough points to test', q);
    pts.forEach((x) => {
      must(close(g(f(x)), x), `the answer does not undo ${name} at ${x}`, q);
      must(close(f(g(x)), x), `${name} does not undo the answer at ${x}`, q);
    });
    must(!sameFn(f, g), 'not its own inverse', q);
    kind = formOf(body);
    reaches(q);
    const inv = numericInverse(f);
    checkWorking(q, { [name]: f, [`${name}^{-1}`]: inv }, {}, [], f);
  } else if (q.instruction === 'Evaluate') {
    const m = /^([fgh])\^\{-1\}\((-?\d+)\) \\text\{ when \} (.+)$/.exec(q.questionMath);
    must(m, `question "${q.questionMath}"`, q);
    const defs = defsOf(q, [m[3]]);
    must(defs[m[1]], 'the inverse of the function defined', q);
    const f = defs[m[1]].fn;
    const am = new RegExp(`^${m[1]}\\^\\{-1\\}\\(${m[2]}\\) = (-?\\d+)$`).exec(q.answer);
    must(am && close(f(Number(am[1])), Number(m[2])), `answer "${q.answer}"`, q);
    must(degree(f) === 1, 'a linear function', q);
    kind = 'value';
    reaches(q);
    checkWorking(q, fnsOf(defs), {}, [Number(am[1])]);
  } else if (q.instruction === 'Solve') {
    const m = /^([fgh])\(x\) = ([fgh])\^\{-1\}\(x\) \\text\{ when \} (.+)$/.exec(q.questionMath);
    must(m && m[1] === m[2], `question "${q.questionMath}"`, q);
    const defs = defsOf(q, [m[3]]);
    const f = defs[m[1]].fn;
    const [c0, c1] = coeffsOf(f);
    must(degree(f) === 1 && Math.abs(c1) !== 1, 'linear, not of slope 1 or -1, so one solution', q);
    const inv = numericInverse(f);
    const am = /^x = (-?\d+)$/.exec(q.answer);
    must(am, `answer "${q.answer}"`, q);
    const t = Number(am[1]);
    must(close(f(t), inv(t)), `${m[1]}(${t}) is not ${m[1]}^{-1}(${t})`, q);
    must(close(t, c0 / (1 - c1)), 'the only solution', q);
    kind = 'meets inverse';
    reaches(q);
    checkWorking(q, { [m[1]]: f, [`${m[1]}^{-1}`]: inv }, {}, [t]);
  } else fail(`instruction "${q.instruction}"`, q);
  const allowed = {
    foundation: ['ax+b', '(x+b)/a', 'a(x+b)'],
    core: ['(ax+b)/c', 'reversed', 'value'],
    stretch: ['rational', 'meets inverse'],
  }[difficulty];
  must(allowed.includes(kind), `${difficulty} does not ask "${kind}"`, q);
  return { kind };
}

/* ------------------------------------------ the absolute value function */

// Every solution of lhs = rhs, both piecewise linear in x: scan for sign
// changes and exact zeros on a fine grid, then refine.
function rootsOf(g) {
  const out = [];
  // Piecewise linear with kinks far apart, so a quarter is fine enough.
  const step = 1 / 4;
  for (let x = -50; x < 50; x += step) {
    const a = g(x), b = g(x + step);
    if (Math.abs(a) < 1e-12) { out.push(x); continue; }
    if (a * b < 0) {
      let lo = x, hi = x + step;
      for (let k = 0; k < 80; k += 1) { const mid = (lo + hi) / 2; if (g(lo) * g(mid) <= 0) hi = mid; else lo = mid; }
      out.push((lo + hi) / 2);
    }
  }
  return out.filter((r, k) => k === 0 || Math.abs(r - out[k - 1]) > 1e-6);
}

const readOr = (s) => {
  const only = /^x = (-?\d+) \\text\{ only\}$/.exec(s);
  if (only) return { xs: [Number(only[1])], only: true };
  const parts = s.split(' \\text{ or } ').map((p) => /^x = (-?\d+)$/.exec(p));
  return parts.every(Boolean) ? { xs: parts.map((p) => Number(p[1])), only: false } : null;
};

export function checkAbsolute(raw, difficulty) {
  const q = askedAbsolute(raw);
  renders(raw);
  meta(raw, 'absolute-value', difficulty); noExtras(q);
  must(q.questionMath.includes('\\lvert'), 'an absolute value', q);
  let kind;
  const ex = /^Find the value when x = (-?\d+)$/.exec(instr(q));
  const ab = /^Find the value when a = (-?\d+) and b = (-?\d+)$/.exec(instr(q));
  if (ex || ab) {
    const vars = ex ? { x: Number(ex[1]) } : { a: Number(ab[1]), b: Number(ab[2]) };
    const v = evaluate(q.questionMath, { vars, fns: {} });
    must(int(q.answer) === v, `answer ${q.answer}, the value is ${v}`, q);
    if (ex) must(vars.x < 0, 'x is negative', q);
    else must(vars.a < 0 && vars.b > 0, 'a negative, b positive', q);
    kind = ex ? 'value in x' : 'value in a and b';
    reaches(q);
    checkWorking(q, {}, vars);
  } else if (q.instruction === 'Solve') {
    const [lhs, rhs] = q.questionMath.split(' = ');
    must(rhs !== undefined && q.questionMath.split(' = ').length === 2, 'an equation', q);
    const g = (x) => evaluate(lhs, { vars: { x }, fns: {} }) - evaluate(rhs, { vars: { x }, fns: {} });
    const roots = rootsOf(g);
    const got = readOr(q.answer);
    must(got, `answer "${q.answer}"`, q);
    must(got.xs.every((x, k) => k === 0 || x > got.xs[k - 1]), 'answers in order', q);
    must(got.xs.length === roots.length && got.xs.every((x, k) => Math.abs(x - roots[k]) < 1e-6), `answer ${got.xs}, solutions ${roots}`, q);
    const rhsHasX = /x/.test(rhs);
    must(got.only === (rhsHasX && roots.length === 1), '"only" marks a rejected solution', q);
    if (!rhsHasX) {
      must(roots.length === 2, 'two solutions', q);
      reaches(q);
      const ins = /^\\lvert (.+) \\rvert = (\d+)$/.exec(q.questionMath);
      if (ins) must(wlines(q)[0] === `${ins[1]} = ${ins[2]} \\text{ or } ${ins[1]} = -${ins[2]}`, 'the working splits the two cases of the question', q);
    }
    kind = rhsHasX ? (roots.length === 2 ? 'line, both' : 'line, one rejected') : 'two solutions';
    // Every candidate of the working is a solution of one of the two cases.
    const cands = [...q.workingOut.matchAll(/gives \} x = (-?\d+)/g)].map((m) => Number(m[1]));
    if (rhsHasX) {
      must(cands.length === 2, 'two candidates', q);
      const ins = /^\\lvert (.+) \\rvert$/.exec(lhs);
      must(ins && wlines(q)[0] === `${ins[1]} = ${rhs} \\text{ gives } x = ${cands[0]}`
        && wlines(q)[1] === `${ins[1]} = -(${rhs}) \\text{ gives } x = ${cands[1]}`, 'the working takes the two cases of the question', q);
      const rejected = cands.filter((x) => !got.xs.includes(x));
      must(rejected.length === (got.only ? 1 : 0), 'the candidate not in the answer is rejected', q);
      rejected.forEach((x) => must(evaluate(rhs, { vars: { x }, fns: {} }) < 0 && q.workingOut.includes(`x = ${x} \\text{ makes }`), `x = ${x} is rejected because the right side is negative`, q));
    }
    checkWorking(q, {}, {}, [...got.xs, ...cands]);
  } else fail(`instruction "${q.instruction}"`, q);
  const allowed = { foundation: ['value in x', 'value in a and b'], core: ['two solutions'], stretch: ['line, both', 'line, one rejected'] }[difficulty];
  must(allowed.includes(kind), `${difficulty} does not ask "${kind}"`, q);
  return { kind };
}

/* ----------------------------------------------- reciprocal functions */

export function checkReciprocal(q, difficulty) {
  meta(q, 'reciprocal-functions', difficulty); noExtras(q); renders(q);
  let kind;
  if (q.instruction === 'Find the equations of the asymptotes') {
    const m = /^y = (.+)$/.exec(q.questionMath);
    must(m, `question "${q.questionMath}"`, q);
    const f = asFn(m[1]);
    const am = /^x = (-?\d+), \\quad y = (-?\d+)$/.exec(q.answer);
    must(am, `answer "${q.answer}"`, q);
    const [a, b] = [Number(am[1]), Number(am[2])];
    // Vertical: f blows up either side of x = a, in opposite directions.
    const l = f(a - 1e-7), r = f(a + 1e-7);
    must(Math.abs(l) > 1e5 && Math.abs(r) > 1e5 && l * r < 0, `x = ${a} is not a vertical asymptote`, q);
    // Horizontal: f settles to b far out, both ways.
    must(Math.abs(f(1e8) - b) < 1e-5 && Math.abs(f(-1e8) - b) < 1e-5, `y = ${b} is not the horizontal asymptote`, q);
    must(Number.isFinite(f(a + 1)) && Number.isFinite(f(a - 1)), 'one vertical asymptote', q);
    const numeratorX = /^\\frac\{[^}]*x[^}]*\}/.test(m[1]);
    const shifted = /\} [+-] \d+$/.test(m[1]);
    kind = numeratorX ? 'rewrite' : shifted ? 'shifted' : 'plain';
    if (kind === 'plain') must(b === 0, 'a plain k/(x - a) settles to 0', q);
    if (kind !== 'rewrite') {
      must(wlines(q).some((l) => l.endsWith(`\\text{ when } x = ${a}`)) && wlines(q).some((l) => l.endsWith(`y \\to ${b}`)), 'the working finds both asymptotes', q);
    } else must(/^y = -?\d+ [+-] \\frac/.test(q.workingOut), 'the working rewrites the fraction', q);
    checkWorking(q, {}, {}, [a], f);
  } else if (q.instruction === 'Find k') {
    const am = /^k = (-?\d+)$/.exec(q.answer);
    must(am, `answer "${q.answer}"`, q);
    const k = Number(am[1]);
    must(k !== 0, 'k is not zero', q);
    const lines = q.questionMath.split('\n');
    const p1 = /^y = \\frac\{k\}\{x\} \\text\{ passes through \} \((-?\d+), (-?\d+)\)$/.exec(q.questionMath);
    if (p1) {
      must(close(k / Number(p1[1]), Number(p1[2])), `k = ${k} does not put (${p1[1]}, ${p1[2]}) on the curve`, q);
      kind = 'k from a point';
      reaches(q);
      checkWorking(q, {}, { k });
    } else {
      const a1 = /^y = \\frac\{k\}\{x - a\} \+ b \\text\{ has asymptotes \} x = (-?\d+) \\text\{ and \} y = (-?\d+)$/.exec(lines[0]);
      const a2 = /^\\text\{and passes through \} \((-?\d+), (-?\d+)\)$/.exec(lines[1] ?? '');
      must(lines.length === 2 && a1 && a2, `question "${q.questionMath}"`, q);
      const [a, b, px, py] = [a1[1], a1[2], a2[1], a2[2]].map(Number);
      must(px !== a, 'the point is not on the asymptote', q);
      must(close(k / (px - a) + b, py), `k = ${k} does not put (${px}, ${py}) on the curve`, q);
      kind = 'k from asymptotes';
      reaches(q);
      checkWorking(q, {}, { k }, [], (x) => k / (x - a) + b);
    }
  } else fail(`instruction "${q.instruction}"`, q);
  const allowed = { foundation: ['plain', 'k from a point'], core: ['shifted'], stretch: ['rewrite', 'k from asymptotes'] }[difficulty];
  must(allowed.includes(kind), `${difficulty} does not ask "${kind}"`, q);
  return { kind };
}
