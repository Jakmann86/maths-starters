// Test support only. Reads the polynomials the factorising generators print —
// 12a^2b - 8ab^2, 3x(2x^2 + 3x - 1), (2a + 5)(2b - 3) — and expands them to
// a canonical map from monomial to integer coefficient, so a harness can
// expand the printed answer and compare it with the printed question.
// Nothing here is imported from a generator.

const key = (powers) => Object.keys(powers).filter((v) => powers[v]).sort().map((v) => `${v}${powers[v]}`).join('');

const mulPoly = (p, q) => {
  const out = new Map();
  for (const [ka, a] of p) for (const [kb, b] of q) {
    const pa = ka.match(/[a-z]\d+/g) || [];
    const pb = kb.match(/[a-z]\d+/g) || [];
    const pw = {};
    for (const t of [...pa, ...pb]) pw[t[0]] = (pw[t[0]] || 0) + Number(t.slice(1));
    const k = key(pw);
    out.set(k, (out.get(k) || 0) + a * b);
  }
  return clean(out);
};
const addPoly = (p, q, sign = 1) => {
  const out = new Map(p);
  for (const [k, v] of q) out.set(k, (out.get(k) || 0) + sign * v);
  return clean(out);
};
const clean = (p) => new Map([...p].filter(([, v]) => v !== 0));

/** Parse and expand. Throws on anything it does not understand. */
export const expand = (src) => {
  const s = src.replace(/\s+/g, '');
  let i = 0;
  const expr = () => {
    let sign = 1;
    if (s[i] === '-') { sign = -1; i++; } else if (s[i] === '+') i++;
    let acc = addPoly(new Map(), term(), sign);
    while (s[i] === '+' || s[i] === '-') {
      const sg = s[i] === '-' ? -1 : 1;
      i++;
      acc = addPoly(acc, term(), sg);
    }
    return acc;
  };
  const term = () => {
    let acc = new Map([['', 1]]);
    let any = false;
    const num = /^\d+/.exec(s.slice(i));
    if (num) { acc = new Map([['', Number(num[0])]]); i += num[0].length; any = true; }
    for (;;) {
      if (/[a-z]/.test(s[i] || '')) {
        const v = s[i++];
        let p = 1;
        if (s[i] === '^') { i++; const d = /^\d+/.exec(s.slice(i)); p = Number(d[0]); i += d[0].length; }
        acc = mulPoly(acc, new Map([[key({ [v]: p }), 1]]));
        any = true;
      } else if (s[i] === '(') {
        i++;
        const inner = expr();
        if (s[i++] !== ')') throw new Error(`expected ) in ${src}`);
        acc = mulPoly(acc, inner);
        any = true;
      } else break;
    }
    if (!any) throw new Error(`empty term at ${i} in ${src}`);
    return acc;
  };
  const out = expr();
  if (i !== s.length) throw new Error(`trailing input at ${i} in ${src}`);
  return out;
};

export const samePoly = (a, b) => {
  const p = expand(a); const q = expand(b);
  return p.size === q.size && [...p].every(([k, v]) => q.get(k) === v);
};

/** The factors of a product as printed: `3x(2x - 1)` -> ['3x', '2x - 1']. */
export const splitFactors = (src) => {
  const out = [];
  let i = 0;
  const head = /^[^(]*/.exec(src)[0];
  if (head) out.push(head);
  i = head.length;
  while (i < src.length) {
    if (src[i] !== '(') throw new Error(`not a product: ${src}`);
    let depth = 0; let j = i;
    for (; j < src.length; j++) {
      if (src[j] === '(') depth++;
      if (src[j] === ')' && --depth === 0) break;
    }
    out.push(src.slice(i + 1, j));
    i = j + 1;
  }
  return out;
};

const gcd = (a, b) => { a = Math.abs(a); b = Math.abs(b); while (b) [a, b] = [b, a % b]; return a; };

/** True when a bracket's terms share no number and no letter. */
export const noCommonFactor = (src) => {
  const p = expand(src);
  const g = [...p.values()].reduce(gcd, 0);
  if (g !== 1) return false;
  const lettersIn = [...p.keys()].map((k) => new Set((k.match(/[a-z]/g) || [])));
  return lettersIn.reduce((acc, set) => new Set([...acc].filter((v) => set.has(v)))).size === 0;
};
