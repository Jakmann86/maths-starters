// Test support only. A small, independent reader for the LaTeX the Number
// generators print, so a harness can recompute an answer from the question
// text alone. Nothing here is imported from a generator.
//
// parse(tex) builds a tree; two interpreters walk it:
//
//   exact(tree)  a sum of terms q·√s, q rational and s square-free, which is
//                closed under + − × ÷ (by a single term) and integer powers.
//                A cube root that is not a whole number, or π, makes the
//                value IRRATIONAL — enough to decide "is it rational?".
//   float(tree)  plain floating point, for the few checks (fractional powers
//                of a prime) the exact form cannot hold.
//
// Letters are substituted before parsing (`subst`), so 4a^{3} at a = 2 reads
// as 4(2)^{3}. A number, bracket or letter-substitute directly before a
// bracket, root, fraction or π multiplies it.

import katex from 'katex';

/** Every line compiles in KaTeX, with unknown characters an error. */
export const compiles = (tex) => String(tex).split('\n').forEach((line) => {
  katex.renderToString(line, { throwOnError: true, strict: 'error', displayMode: true });
});

/* ---------------------------------------------------------- rationals */

const gcd = (a, b) => { a = Math.abs(a); b = Math.abs(b); while (b) [a, b] = [b, a % b]; return a; };
const R = (n, d = 1) => {
  if (d === 0) throw new Error('division by zero');
  if (d < 0) { n = -n; d = -d; }
  const g = gcd(n, d) || 1;
  const out = [n / g, d / g];
  if (!Number.isSafeInteger(out[0]) || !Number.isSafeInteger(out[1])) throw new Error('overflow');
  return out;
};
const radd = (a, b) => R(a[0] * b[1] + b[0] * a[1], a[1] * b[1]);
const rmul = (a, b) => R(a[0] * b[0], a[1] * b[1]);
const rinv = (a) => R(a[1], a[0]);
export const req = (a, b) => a[0] === b[0] && a[1] === b[1];

// k² m with m square-free
const squareFree = (n) => {
  let k = 1, m = n;
  for (let d = 2; d * d <= m; d++) while (m % (d * d) === 0) { m /= d * d; k *= d; }
  return [k, m];
};
const intRoot = (n, k) => {
  if (n < 0) { if (k % 2 === 0) return null; const r = intRoot(-n, k); return r === null ? null : -r; }
  const r = Math.round(n ** (1 / k));
  for (const c of [r - 1, r, r + 1]) if (c >= 0 && c ** k === n) return c;
  return null;
};

/* ------------------------------------------------------------ parser */

const tokenize = (src) => {
  const s = src.replace(/\\left|\\right/g, '').replace(/\\quad|\\,|\\;|\\ /g, ' ');
  const out = [];
  let i = 0;
  while (i < s.length) {
    const c = s[i];
    if (/\s/.test(c)) { i += 1; continue; }
    const num = /^\d+(?:\.(?:\d|\\dot\{\d\})*)?/.exec(s.slice(i));
    if (num && num[0].length) { out.push({ t: 'num', v: num[0].replace(/\.$/, '') }); i += num[0].length; continue; }
    const cmd = /^\\[a-zA-Z]+/.exec(s.slice(i));
    if (cmd) { out.push({ t: cmd[0] }); i += cmd[0].length; continue; }
    if (c === '\\' && s[i + 1] === '%') { out.push({ t: '%' }); i += 2; continue; }
    out.push({ t: c }); i += 1;
  }
  return out;
};

// "1.\dot{6}", "0.3\dot{2}", "0.\dot{3}\dot{6}", "0.35"
const numberValue = (txt) => {
  const [ip, rest = ''] = txt.split('.');
  const parts = [...rest.matchAll(/\\dot\{(\d)\}|(\d)/g)].map((m) => ({ d: m[1] ?? m[2], dot: m[1] !== undefined }));
  const first = parts.findIndex((p) => p.dot);
  const whole = R(Number(ip));
  if (first === -1) {
    const ds = parts.map((p) => p.d).join('');
    return ds ? radd(whole, R(Number(ds), 10 ** ds.length)) : whole;
  }
  let last = parts.length - 1;
  while (!parts[last].dot) last -= 1;
  if (last !== parts.length - 1) throw new Error(`digits after the recurring block: ${txt}`);
  const pre = parts.slice(0, first).map((p) => p.d).join('');
  const block = parts.slice(first).map((p) => p.d).join('');
  const k = pre.length, L = block.length;
  let v = whole;
  if (pre) v = radd(v, R(Number(pre), 10 ** k));
  return radd(v, R(Number(block), 10 ** k * (10 ** L - 1)));
};

export const parse = (src) => {
  const toks = tokenize(src);
  let i = 0;
  const peek = () => toks[i]?.t;
  const eat = (t) => { if (peek() !== t) throw new Error(`expected ${t}, got ${peek()} in ${src}`); i += 1; };
  const group = () => {
    if (peek() === '{') { eat('{'); const e = expr(); eat('}'); return e; }
    const tk = toks[i++];
    if (tk?.t === 'num' && /^\d/.test(tk.v)) {
      // ^23 means ^{2}3 in TeX; only a single digit belongs to the power.
      if (tk.v.length > 1) { toks.splice(i, 0, { t: 'num', v: tk.v.slice(1) }); return { k: 'num', v: tk.v[0] }; }
      return { k: 'num', v: tk.v };
    }
    throw new Error(`bad group in ${src}`);
  };
  const atom = () => {
    const t = peek();
    if (t === 'num') return { k: 'num', v: toks[i++].v };
    if (t === '(') { eat('('); const e = expr(); eat(')'); return e; }
    if (t === '{') { eat('{'); const e = expr(); eat('}'); return e; }
    if (t === '\\frac' || t === '\\dfrac') { i += 1; const a = group(); const b = group(); return { k: 'div', a, b }; }
    if (t === '\\sqrt') {
      i += 1;
      let n = 2;
      if (peek() === '[') { eat('['); n = Number(toks[i++].v); eat(']'); }
      return { k: 'root', n, a: group() };
    }
    if (t === '\\pi') { i += 1; return { k: 'pi' }; }
    throw new Error(`unexpected ${t} in ${src}`);
  };
  const power = () => {
    let a = atom();
    while (peek() === '^') { eat('^'); a = { k: 'pow', a, b: group() }; }
    if (peek() === '%') { eat('%'); a = { k: 'div', a, b: { k: 'num', v: '100' } }; }
    return a;
  };
  const unary = () => {
    if (peek() === '-') { eat('-'); return { k: 'neg', a: unary() }; }
    if (peek() === '+') { eat('+'); return unary(); }
    return power();
  };
  const startsAtom = () => ['(', '\\frac', '\\dfrac', '\\sqrt', '\\pi', 'num'].includes(peek());
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

/* --------------------------------------------------------- exact values */
// A value is { irr: true } or a Map from square-free s to rational q.

export const IRR = { irr: true };
const mono = (q, s = 1) => new Map([[s, q]]);
const clean = (m) => { for (const [s, q] of m) if (q[0] === 0) m.delete(s); return m; };
const vadd = (a, b) => {
  if (a.irr || b.irr) return IRR;
  const m = new Map(a);
  for (const [s, q] of b) m.set(s, m.has(s) ? radd(m.get(s), q) : q);
  return clean(m);
};
const vmul = (a, b) => {
  if (a.irr || b.irr) return IRR;
  const m = new Map();
  for (const [s1, q1] of a) for (const [s2, q2] of b) {
    const [k, sf] = squareFree(s1 * s2);
    const q = rmul(rmul(q1, q2), R(k));
    m.set(sf, m.has(sf) ? radd(m.get(sf), q) : q);
  }
  return clean(m);
};
const vinv = (a) => {
  if (a.irr) return IRR;
  if (a.size !== 1) throw new Error('can only divide by a single term');
  const [[s, q]] = [...a];
  return mono(rinv(rmul(q, R(s))), s);           // 1/(q√s) = √s/(q s)
};
export const asRational = (v) => {
  if (v.irr) return null;
  if (v.size === 0) return R(0);
  if (v.size === 1 && v.has(1)) return v.get(1);
  return null;
};
const vroot = (a, n) => {
  const q = asRational(a);
  if (q === null) return IRR;
  if (n === 2) {
    if (q[0] < 0) throw new Error('square root of a negative');
    const [k, sf] = squareFree(q[0] * q[1]);       // √(p/d) = √(pd)/d
    return mono(R(k, q[1]), sf);
  }
  const top = intRoot(q[0], n), bot = intRoot(q[1], n);
  return top === null || bot === null ? IRR : mono(R(top, bot));
};
const vpow = (a, e) => {
  const q = asRational(e);
  if (q === null) throw new Error('irrational exponent');
  const [m, n] = q;
  let base = n === 1 ? a : vroot(a, n);
  if (base.irr) return IRR;
  let out = mono(R(1));
  for (let j = 0; j < Math.abs(m); j++) out = vmul(out, base);
  return m < 0 ? vinv(out) : out;
};

export const exact = (t) => {
  switch (t.k) {
    case 'num': return mono(numberValue(t.v));
    case 'pi': return IRR;
    case 'neg': return vmul(mono(R(-1)), exact(t.a));
    case 'add': return vadd(exact(t.a), exact(t.b));
    case 'mul': return vmul(exact(t.a), exact(t.b));
    case 'div': return vmul(exact(t.a), vinv(exact(t.b)));
    case 'root': return vroot(exact(t.a), t.n);
    case 'pow': return vpow(exact(t.a), exact(t.b));
    default: throw new Error(t.k);
  }
};

export const float = (t) => {
  switch (t.k) {
    case 'num': { const [n, d] = numberValue(t.v); return n / d; }
    case 'pi': return Math.PI;
    case 'neg': return -float(t.a);
    case 'add': return float(t.a) + float(t.b);
    case 'mul': return float(t.a) * float(t.b);
    case 'div': return float(t.a) / float(t.b);
    case 'root': return t.n === 3 ? Math.cbrt(float(t.a)) : float(t.a) ** (1 / t.n);
    case 'pow': return float(t.a) ** float(t.b);
    default: throw new Error(t.k);
  }
};

/** Two exact values are equal. */
export const vequal = (a, b) => {
  if (a.irr || b.irr) return false;
  const d = vadd(a, vmul(mono(R(-1)), b));
  return d.size === 0;
};

/** Replace each letter with a bracketed value: subst('4a^{3}', { a: 2 }). */
export const subst = (tex, vars) => tex.replace(/(?<!\\[a-zA-Z]*)([a-zA-Z])/g, (m, v) => (v in vars ? `(${vars[v]})` : m));

export const exactOf = (tex) => exact(parse(tex));
export const floatOf = (tex) => float(parse(tex));
