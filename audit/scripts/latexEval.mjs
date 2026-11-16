// Tolerant LaTeX -> numeric evaluator for the audit's step-equivalence checks.
// Anything it does not understand throws Unparsed, and the caller counts the
// statement as "eye only" rather than guessing.
export class Unparsed extends Error {}

const UNIT = /^\s*(cm|mm|m|km|g|kg|s|h|min|mins|ml|l|litres?|p|units?|hours?|minutes?|seconds?|km\/h|m\/s|mph|years?|days?|°|degrees)\s*$/;
const NOTE = /^\s*\(.*\)\s*$|s\.f\.|d\.p\.|nearest/;
export const TEXT = '\u0001';

/** Strip presentation, map \text{} to numbers / nothing / a TEXT marker. */
export function prep(src) {
  let s = String(src);
  s = s.replace(/\\(left|right|displaystyle|,|;|!|quad|qquad|:)(?![a-zA-Z])/g, ' ').replace(/\\ /g, ' ');
  s = s.replace(/\\[dt]frac/g, '\\frac');
  s = s.replace(/\\text\{\s*(sin|cos|tan|log|ln)\s*\}/g, '\\$1');
  s = s.replace(/\\text\{([^{}]*)\}(\^\{?-?\d\}?)?/g, (m, body, exp) => {
    const money = body.trim().match(/^[£$€]?(-?[\d,]+(?:\.\d+)?)$/);
    if (money) return ` ${money[1].replace(/,/g, '')} `;
    if (UNIT.test(body) || NOTE.test(body) || body.trim() === '') return ' ';
    if (/^\s*[£$€]\s*$/.test(body)) return ' ';
    return TEXT + (exp ?? '');
  });
  s = s.replace(/\^\{?\\circ\}?/g, ' ').replace(/°/g, ' ');
  s = s.replace(/\\(approx|simeq)(?![a-zA-Z])/g, '≈').replace(/\\(times|cdot)(?![a-zA-Z])/g, '*').replace(/\\div(?![a-zA-Z])/g, '÷');
  s = s.replace(/\\%/g, '%').replace(/\\(ldots|dots|cdots)(?![a-zA-Z])/g, '…').replace(/\.\.\./g, '…');
  s = s.replace(/\\lvert|\\rvert|\\vert/g, '|');
  return s;
}

/** Split at top-level separators (outside any bracket/brace). */
export function splitTop(s, seps) {
  const out = []; let depth = 0; let cur = ''; const ops = [];
  for (let i = 0; i < s.length; i += 1) {
    const ch = s[i];
    if (ch === '\\' && (s[i + 1] === '{' || s[i + 1] === '}')) { cur += ch + s[i + 1]; i += 1; continue; }
    if ('({['.includes(ch)) depth += 1;
    if (')}]'.includes(ch)) depth -= 1;
    if (depth === 0 && seps.includes(ch)) { out.push(cur); ops.push(ch); cur = ''; } else cur += ch;
  }
  out.push(cur);
  return { parts: out, ops };
}

function tokenize(s) {
  const t = []; let i = 0;
  const push = (type, v) => t.push({ type, v });
  while (i < s.length) {
    const ch = s[i];
    if (/\s/.test(ch)) { i += 1; continue; }
    if (/\d/.test(ch) || (ch === '.' && /\d/.test(s[i + 1] ?? ''))) {
      const m = s.slice(i).match(/^\d*\.?\d+/); let v = m[0]; i += v.length;
      let trunc = false; if (s[i] === '…') { trunc = true; i += 1; }
      push('num', { text: v, trunc }); continue;
    }
    if (ch === '\\') {
      const m = s.slice(i).match(/^\\([a-zA-Z]+)/);
      if (!m) throw new Unparsed(`bad escape at ${s.slice(i, i + 4)}`);
      push('cmd', m[1]); i += m[0].length; continue;
    }
    if (/[a-zA-Z]/.test(ch)) {
      let name = ch; i += 1;
      while (s[i] === "'") { name += "'"; i += 1; }
      if (s[i] === '_') {
        const m = s.slice(i).match(/^_(\{[^{}]*\}|[a-zA-Z0-9])/);
        if (!m) throw new Unparsed('bad subscript'); name += m[0]; i += m[0].length;
      }
      push('var', name); continue;
    }
    if ('+-*÷/^(){}[]|%=,'.includes(ch)) { push(ch, ch); i += 1; continue; }
    if (ch === '−') { push('-', '-'); i += 1; continue; }
    throw new Unparsed(`char ${JSON.stringify(ch)}`);
  }
  return t;
}

const deg = Math.PI / 180;
const FUNCS = {
  sin: (x) => Math.sin(x * deg), cos: (x) => Math.cos(x * deg), tan: (x) => Math.tan(x * deg),
  asin: (x) => Math.asin(x) / deg, acos: (x) => Math.acos(x) / deg, atan: (x) => Math.atan(x) / deg,
  log: (x) => Math.log10(x), ln: (x) => Math.log(x),
};

/** Parse to a closure env -> number. Also reports variables and whether the
 *  expression is a bare decimal literal (for rounding tolerance). */
export function parse(src) {
  const toks = tokenize(src); let p = 0; const vars = new Set(); let pct = false;
  const peek = () => toks[p]; const next = () => toks[p++];
  const expect = (type) => { const k = next(); if (!k || k.type !== type) throw new Unparsed(`expected ${type}`); return k; };
  const group = () => { expect('{'); const e = expr(); expect('}'); return e; };
  const startsFactor = (k) => k && (k.type === 'num' || k.type === 'var' || k.type === '(' || k.type === '{' || k.type === '|' && !inAbs
    || (k.type === 'cmd' && ['frac', 'sqrt', 'pi', 'sin', 'cos', 'tan', 'log', 'ln', 'theta', 'alpha', 'beta'].includes(k.v)));
  let inAbs = 0;
  function expr() {
    let f = term();
    while (peek() && (peek().type === '+' || peek().type === '-')) {
      const op = next().type; const g = term(); const a = f;
      f = op === '+' ? (e) => a(e) + g(e) : (e) => a(e) - g(e);
    }
    return f;
  }
  function term() {
    let f = unary();
    for (;;) {
      const k = peek();
      if (k && (k.type === '*' || k.type === '÷' || k.type === '/')) {
        next(); const g = unary(); const a = f;
        f = k.type === '*' ? (e) => a(e) * g(e) : (e) => a(e) / g(e);
      } else if (startsFactor(k)) {
        const g = power(); const a = f; f = (e) => a(e) * g(e);
      } else break;
    }
    return f;
  }
  function unary() {
    if (peek() && peek().type === '-') { next(); const g = unary(); return (e) => -g(e); }
    if (peek() && peek().type === '+') { next(); return unary(); }
    return power();
  }
  function exponent() {
    if (peek() && peek().type === '{') return group();
    if (peek() && peek().type === '-') { next(); const g = atom(); return (e) => -g(e); }
    return atom();
  }
  function power() {
    let base = postfix();
    if (peek() && peek().type === '^') { next(); const ex = exponent(); const b = base; base = (e) => { const x = b(e); const y = ex(e); if (x < 0 && !Number.isInteger(y)) { const r = Math.round(1 / y); if (Math.abs(1 / y - r) < 1e-12 && r % 2) return -Math.pow(-x, y); } return Math.pow(x, y); }; }
    return base;
  }
  function postfix() {
    let f = atom();
    while (peek() && peek().type === '%') { next(); pct = true; const a = f; f = (e) => a(e) / 100; }
    return f;
  }
  function funcArg() {
    // sin(…), sin x, sin 30
    if (peek() && peek().type === '(') { next(); const e = expr(); expect(')'); return e; }
    return power();
  }
  function atom() {
    const k = next();
    if (!k) throw new Unparsed('unexpected end');
    if (k.type === 'num') {
      const v = Number(k.v.text);
      const n = peek(); const n2 = toks[p + 1];
      if (/^\d+$/.test(k.v.text) && n && n.type === 'cmd' && n.v === 'frac' && n2 && n2.type === '{') {
        // integer directly followed by \frac{int}{int}: a mixed number
        const save = p; next(); const a = toks[p + 1]; const b = toks[p + 4];
        if (toks[p]?.type === '{' && a?.type === 'num' && toks[p + 2]?.type === '}' && toks[p + 3]?.type === '{' && b?.type === 'num' && toks[p + 5]?.type === '}') {
          p += 6; const fr = Number(a.v.text) / Number(b.v.text); return () => v + fr;
        }
        p = save;
      }
      return () => v;
    }
    if (k.type === 'var') { vars.add(k.v); return (e) => { if (!(k.v in e)) throw new Unparsed(`unbound ${k.v}`); return e[k.v]; }; }
    if (k.type === '(') { const e = expr(); expect(')'); return e; }
    if (k.type === '[') { const e = expr(); expect(']'); return e; }
    if (k.type === '{') { const e = expr(); expect('}'); return e; }
    if (k.type === '|') { inAbs += 1; const e = expr(); expect('|'); inAbs -= 1; return (x) => Math.abs(e(x)); }
    if (k.type === 'cmd') {
      if (k.v === 'frac') { const a = group(); const b = group(); return (e) => a(e) / b(e); }
      if (k.v === 'sqrt') {
        let n = null; if (peek() && peek().type === '[') { next(); n = expr(); expect(']'); }
        const a = group();
        return (e) => { const x = a(e); const r = n ? n(e) : 2; return x < 0 && r % 2 === 1 ? -Math.pow(-x, 1 / r) : Math.pow(x, 1 / r); };
      }
      if (k.v === 'pi') return () => Math.PI;
      if (['theta', 'alpha', 'beta'].includes(k.v)) { vars.add(k.v); return (e) => { if (!(k.v in e)) throw new Unparsed('unbound'); return e[k.v]; }; }
      if (['sin', 'cos', 'tan'].includes(k.v)) {
        let name = k.v; let pow = null;
        if (peek() && peek().type === '^') {
          next();
          if (peek().type === '{' && toks[p + 1]?.type === '-' && toks[p + 2]?.type === 'num' && toks[p + 2].v.text === '1' && toks[p + 3]?.type === '}') { p += 4; name = `a${name}`; }
          else pow = exponent();
        }
        const a = funcArg(); const fn = FUNCS[name];
        return pow ? (e) => Math.pow(fn(a(e)), pow(e)) : (e) => fn(a(e));
      }
      if (k.v === 'log' || k.v === 'ln') {
        let base = null;
        if (peek() && peek().type === 'var' && false) base = null;
        const a = funcArg(); const fn = FUNCS[k.v];
        return (e) => fn(a(e));
      }
      throw new Unparsed(`\\${k.v}`);
    }
    throw new Unparsed(`token ${k.type}`);
  }
  // \log_{b}: the tokenizer cannot see "_" after a command, so rewrite first.
  const f = expr();
  if (p < toks.length) throw new Unparsed(`trailing ${toks[p].type}`);
  const lit = src.trim().match(/^-?\s*(\d*\.?\d+)(…)?\s*(%)?$/);
  return { f, vars: [...vars], pct, literal: lit ? { text: lit[1], trunc: !!lit[2], dp: (lit[1].split('.')[1] ?? '').length } : null };
}

/** \log_{b} x  ->  (\ln(x) ÷ \ln(b)) so the grammar above can take it. */
export function rewriteLogs(s) {
  let out = s; let guard = 0;
  while (/\\log_/.test(out) && guard < 20) {
    guard += 1;
    const m = out.match(/\\log_(\{[^{}]*\}|[0-9a-zA-Z])\s*/);
    const base = m[1].replace(/^\{|\}$/g, '');
    let rest = out.slice(m.index + m[0].length); let arg; let len;
    if (rest[0] === '(') { let d = 0; let j = 0; for (; j < rest.length; j += 1) { if (rest[j] === '(') d += 1; if (rest[j] === ')') { d -= 1; if (d === 0) break; } } arg = rest.slice(0, j + 1); len = j + 1; }
    else {
      const a = rest.match(/^(\d*\.?\d+|[a-zA-Z])/); if (!a) throw new Unparsed('log arg');
      len = a[0].length;
      if (rest[len] === '^') {
        len += 1;
        if (rest[len] === '{') { let d = 0; for (; len < rest.length; len += 1) { if (rest[len] === '{') d += 1; if (rest[len] === '}') { d -= 1; if (d === 0) { len += 1; break; } } } } else len += 1;
      }
      arg = `(${rest.slice(0, len)})`;
    }
    out = `${out.slice(0, m.index)}(\\ln${arg} ÷ \\ln(${base}))${rest.slice(len)}`;
  }
  return out;
}
