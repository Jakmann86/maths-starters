// src/generators/number/logarithmGenerators.js
//
// Logarithms — Haese 31A–E, in teaching order:
//
//   log-index-form          2^5 = 32 and log_2 32 = 5 are the same statement
//   evaluate-logs           log_3 81, log_2(1/8), log_4 8, without a calculator
//   log-single              log_3 2 + log_3 8 as one logarithm
//   log-in-terms            log_2 7 = p, log_2 3 = q: write log_2 21 in p and q
//   log-remove              log_3 y = 3 log_3 u - log_3 v, so y = u^3 / v
//   log-solve-exponential   a^x = b by taking logs, to 3 significant figures
//   log-equations           log_2 x = 5, log_5(2x) = -1, log_2 x + log_2 3 = 4
//
// Base 10 is written plain, as "log", the way Haese 31D and the exam papers
// write it; every other base carries its subscript. An argument that is more
// than one number, letter or root is bracketed, so log_2(3x) never reads as
// (log_2 3)x.
//
// Every question is built from its answer. The harness beside this file
// recomputes each answer from the printed question alone.

import _ from 'lodash';
import { gcd } from '../shared';
import { sf } from '../geometry/solidsGenerators';

const NL = '\n';

/* ------------------------------------------------------------- helpers */

// n/d as an integer or a signed fraction, in lowest terms.
const frac = (n, d = 1) => {
  if (d < 0) { n = -n; d = -d; }
  const g = gcd(n, d) || 1;
  n /= g; d /= g;
  if (d === 1) return `${n}`;
  return n < 0 ? `-\\frac{${-n}}{${d}}` : `\\frac{${n}}{${d}}`;
};
const reduce = (n, d) => { const g = gcd(n, d) || 1; return [n / g, d / g]; };

// A number written without the clutter of floating point: 0.1 + 0.2 never
// prints as 0.30000000000000004.
const num = (v) => String(Number(v.toFixed(6)));

// The terminating decimal p/q, or null if it needs more than `dp` places.
const decimal = (p, q, dp = 4) => {
  const v = p / q;
  for (let k = 0; k <= dp; k += 1) {
    const s = v * 10 ** k;
    if (Math.abs(s - Math.round(s)) < 1e-9) return v.toFixed(k);
  }
  return null;
};

// One number or letter, perhaps to a power (log_3 3^4), or one root.
const PLAIN = /^(\d+|[a-zA-Z])(\^\{([^{}]|\{[^{}]*\})*\})?$|^\\sqrt(\[\d\])?\{[^{}]*\}$/;
// A fraction needs brackets that grow with it; anything else takes plain ones.
const arg = (t) => {
  if (PLAIN.test(t)) return ` ${t}`;
  return t.includes('\\frac') ? `\\left(${t}\\right)` : `(${t})`;
};
// log_b t, with base 10 written plain.
const log = (b, t) => `${b === 10 || b === '10' ? '\\log' : `\\log_{${b}}`}${arg(String(t))}`;
// A coefficient in front of a log: 1 dropped, 1/2 as a fraction.
const coef = (c) => {
  if (c === 1) return '';
  if (Array.isArray(c)) return `\\frac{${c[0]}}{${c[1]}}`;
  return `${c}`;
};
// p/q as a log argument: an integer, or a bracketed fraction.
const ratTex = (p, q) => (q === 1 ? `${p}` : `\\frac{${p}}{${q}}`);

// Is k a whole-number power of b (b^0 = 1 included)?
const isPowerOf = (k, b) => {
  if (k < 1 || !Number.isInteger(k)) return false;
  let v = 1;
  while (v < k) v *= b;
  return v === k;
};

// A linear expression in letters: [[2, 'p'], [-1, 'q'], [3, '']] → 2p - q + 3.
// A positive letter term comes first (q − p, not −p + q, and p − 2q + 3);
// with no positive letter, a positive constant leads (3 − 2p − q).
const linear = (terms) => {
  const out = [];
  const live = terms.filter(([c]) => c !== 0);
  const lettersOf = (pos) => live.filter(([c, v]) => v && (c > 0) === pos);
  const constant = live.filter(([, v]) => !v);
  const order = lettersOf(true).length
    ? [...lettersOf(true), ...lettersOf(false), ...constant]
    : [...constant.filter(([c]) => c > 0), ...lettersOf(false), ...constant.filter(([c]) => c < 0)];
  order.forEach(([c, v]) => {
    const mag = Math.abs(c);
    const body = v ? `${mag === 1 ? '' : mag}${v}` : `${mag}`;
    if (!out.length) out.push(c < 0 ? `-${body}` : body);
    else out.push(`${c < 0 ? '-' : '+'} ${body}`);
  });
  return out.length ? out.join(' ') : '0';
};
// m x + c written plainly.
const linX = (m, c, v = 'x') => linear([[m, v], [c, '']]);

const BASES = [2, 3, 4, 5, 6, 7, 8, 9, 10];
const exponentsUpTo = (a, max, from = 2) => {
  const out = [];
  for (let n = from; a ** n <= max; n += 1) out.push(n);
  return out;
};

/* ------------------------------------------------------ log-index-form */
//
//   foundation  whole-number powers, either way round      2^5 = 32 ⇔ log_2 32 = 5
//   core        negative and fractional powers             5^-2 = 1/25, 27^(1/3) = 3
//   stretch     make x the subject: y = 3^(2x) → x = ½ log_3 y,
//               w = log_5(2x) → x = 5^w / 2

const TO_LOG = 'Write in logarithmic form';
const TO_INDEX = 'Write in index form';

// The pair of equivalent statements for base^power = value, as TeX.
const pair = (baseTex, powerTex, valueTex) => ({
  index: `${baseTex}^{${powerTex}} = ${valueTex}`,
  logForm: `${log(baseTex, valueTex)} = ${powerTex}`,
});
const either = (statements, difficulty) => {
  const toLog = _.random(0, 1) === 1;
  const q = toLog ? statements.index : statements.logForm;
  const a = toLog ? statements.logForm : statements.index;
  return {
    instruction: toLog ? TO_LOG : TO_INDEX,
    questionMath: q,
    answer: a,
    workingOut: `${statements.index} \\iff ${statements.logForm}`,
    metadata: { topic: 'log-index-form', difficulty },
  };
};

const LETTERS = ['y', 'w', 'z', 't', 'p'];

const makeSubject = (difficulty) => {
  const a = _.sample([2, 3, 4, 5, 7, 10]);
  const L = _.sample(LETTERS);
  const form = _.sample(['kx', 'x+c', 'mult', 'log kx', 'log x+c', 'k log']);
  const k = _.random(2, 4);
  const c = _.sample([-4, -3, -2, -1, 1, 2, 3, 4, 5]);
  const m = _.random(2, 9);
  const pow = (e) => (a === 10 ? `10^{${e}}` : `${a}^{${e}}`);
  let q, ans, working;
  if (form === 'kx') {
    q = `${L} = ${pow(`${k}x`)}`;
    ans = `x = \\frac{1}{${k}}${log(a, L)}`;
    working = [`${k}x = ${log(a, L)}`, ans];
  } else if (form === 'x+c') {
    q = `${L} = ${pow(linX(1, c))}`;
    ans = `x = ${log(a, L)} ${c > 0 ? '-' : '+'} ${Math.abs(c)}`;
    working = [`${linX(1, c)} = ${log(a, L)}`, ans];
  } else if (form === 'mult') {
    q = `${L} = ${m} \\times ${pow('x')}`;
    ans = `x = ${log(a, `\\frac{${L}}{${m}}`)}`;
    working = [`${pow('x')} = \\frac{${L}}{${m}}`, ans];
  } else if (form === 'log kx') {
    q = `${L} = ${log(a, `${k}x`)}`;
    ans = `x = \\frac{${pow(L)}}{${k}}`;
    working = [`${k}x = ${pow(L)}`, ans];
  } else if (form === 'log x+c') {
    q = `${L} = ${log(a, linX(1, c))}`;
    ans = `x = ${pow(L)} ${c > 0 ? '-' : '+'} ${Math.abs(c)}`;
    working = [`${linX(1, c)} = ${pow(L)}`, ans];
  } else {
    q = `${L} = ${k}${log(a, 'x')}`;
    ans = `x = ${pow(`\\frac{${L}}{${k}}`)}`;
    working = [`${log(a, 'x')} = \\frac{${L}}{${k}}`, ans];
  }
  return {
    instruction: 'Make x the subject',
    questionMath: q,
    answer: ans,
    workingOut: working.join(NL),
    metadata: { topic: 'log-index-form', difficulty },
  };
};

export const generateLogIndexForm = (options = {}) => {
  const { difficulty = 'core' } = options;

  if (difficulty === 'foundation') {
    const a = _.sample(BASES);
    const n = _.sample(exponentsUpTo(a, 10000));
    return either(pair(`${a}`, `${n}`, `${a ** n}`), difficulty);
  }

  if (difficulty === 'core') {
    if (_.random(0, 1)) {
      // A negative power: 5^-2 = 1/25, 10^-3 = 0.001.
      const a = _.sample(BASES);
      const n = _.sample(exponentsUpTo(a, 1000, 1));
      const dec = decimal(1, a ** n);
      const useDec = dec && (a === 10 ? Math.random() < 0.7 : Math.random() < 0.3);
      return either(pair(`${a}`, `-${n}`, useDec ? dec : `\\frac{1}{${a ** n}}`), difficulty);
    }
    // A fractional power: 27^(1/3) = 3, 8^(2/3) = 4, 8^(-1/3) = 1/2.
    for (;;) {
      const s = _.sample([2, 3, 5, 10]);
      const k = _.sample([2, 2, 3, 3, 4]);
      if (s ** k > 1000) continue;
      const m = _.sample([1, 1, 1, 2, 3]);
      if (gcd(m, k) !== 1) continue;
      const neg = Math.random() < 0.2;
      const valueTex = neg ? `\\frac{1}{${s ** m}}` : `${s ** m}`;
      const powerTex = `${neg ? '-' : ''}\\frac{${m}}{${k}}`;
      return either(pair(`${s ** k}`, powerTex, valueTex), difficulty);
    }
  }

  return makeSubject(difficulty);
};

/* ------------------------------------------------------- evaluate-logs */
//
//   foundation  whole-number answers, log 1 = 0 and log_a a = 1 among them
//   core        negative answers: log_2(1/8), log(0.001), log_5(0.2)
//   stretch     fractional answers through roots: log_2 √8, log_4 8, log_√2 4

const evaluate = (q, steps, value, difficulty) => ({
  instruction: 'Evaluate',
  questionMath: q,
  answer: value,
  workingOut: (steps.length
    ? [`${q} = ${steps[0]}`, ...steps.slice(1).map((s) => `= ${s}`), `= ${value}`]
    : [`${q} = ${value}`]).join(NL),
  metadata: { topic: 'evaluate-logs', difficulty },
});

export const generateEvaluateLogs = (options = {}) => {
  const { difficulty = 'core' } = options;

  if (difficulty === 'foundation') {
    const a = _.sample(BASES);
    const r = Math.random();
    const n = r < 0.1 ? 0 : r < 0.2 ? 1 : _.sample(exponentsUpTo(a, 10000));
    return evaluate(log(a, a ** n), n > 1 ? [log(a, `${a}^{${n}}`)] : [], `${n}`, difficulty);
  }

  if (difficulty === 'core') {
    const a = _.sample(BASES);
    const n = _.sample(exponentsUpTo(a, a === 10 ? 10000 : 1000, 1));
    const dec = decimal(1, a ** n, 4);
    const useDec = dec && (a === 10 || Math.random() < 0.5);
    const t = useDec ? dec : `\\frac{1}{${a ** n}}`;
    return evaluate(log(a, t), [log(a, `${a}^{-${n}}`)], `-${n}`, difficulty);
  }

  // Stretch
  const kind = _.sample(['root argument', 'power base', 'root base']);
  if (kind === 'root argument') {
    for (;;) {
      const a = _.sample([2, 3, 5, 10]);
      const r = _.sample([2, 2, 3]);
      const k = _.random(1, 5);
      if (k % r === 0 || a ** k > 1000) continue;
      const root = r === 2 ? `\\sqrt{${a ** k}}` : `\\sqrt[3]{${a ** k}}`;
      const shape = _.sample(['root', 'root', 'reciprocal', 'times']);
      if (shape === 'root') {
        return evaluate(log(a, root), [log(a, `${a}^{\\frac{${k}}{${r}}}`)], frac(k, r), difficulty);
      }
      if (shape === 'reciprocal') {
        return evaluate(log(a, `\\frac{1}{${root}}`), [log(a, `${a}^{-\\frac{${k}}{${r}}}`)], frac(-k, r), difficulty);
      }
      // a^j times a root: log_2(4√2) = 5/2
      if (k !== 1) continue;
      const j = _.random(1, 3);
      if (a ** j > 100) continue;
      return evaluate(
        log(a, `${a ** j}${root}`),
        [`${log(a, `${a}^{${j}}`)} + ${log(a, `${a}^{\\frac{1}{${r}}}`)}`, `${j} + \\frac{1}{${r}}`],
        frac(j * r + 1, r),
        difficulty,
      );
    }
  }
  if (kind === 'power base') {
    // log_(s^m) s^k = k/m: log_4 8 = 3/2, log_27 9 = 2/3
    for (;;) {
      const s = _.sample([2, 3, 5]);
      const m = _.sample([2, 3]);
      const k = _.random(1, 6);
      if (k % m === 0 || s ** m > 125 || s ** k > 1000) continue;
      const neg = Math.random() < 0.25;
      const t = neg ? `\\frac{1}{${s ** k}}` : `${s ** k}`;
      const e = neg ? -k : k;
      return {
        instruction: 'Evaluate',
        questionMath: log(s ** m, t),
        answer: frac(e, m),
        workingOut: [`${log(s ** m, t)} = x`, `${s ** m}^{x} = ${t}`, `${s}^{${m}x} = ${s}^{${e}}`, `${m}x = ${e}`, `x = ${frac(e, m)}`].join(NL),
        metadata: { topic: 'evaluate-logs', difficulty },
      };
    }
  }
  // root base: log_√2 4 = 4, log_√3 27 = 6
  for (;;) {
    const s = _.sample([2, 3, 5]);
    const k = _.random(1, 5);
    if (s ** k > 250) continue;
    const neg = Math.random() < 0.2;
    const t = neg ? `\\frac{1}{${s ** k}}` : `${s ** k}`;
    const e = neg ? -k : k;
    return {
      instruction: 'Evaluate',
      questionMath: log(`\\sqrt{${s}}`, t),
      answer: `${2 * e}`,
      workingOut: [`${log(`\\sqrt{${s}}`, t)} = x`, `\\left(\\sqrt{${s}}\\right)^{x} = ${t}`, `${s}^{\\frac{x}{2}} = ${s}^{${e}}`, `\\frac{x}{2} = ${e}`, `x = ${2 * e}`].join(NL),
      metadata: { topic: 'evaluate-logs', difficulty },
    };
  }
};

/* ---------------------------------------------------------- log-single */
//
//   foundation  one law, two terms                 log_3 2 + log_3 8 = log_3 16
//   core        coefficients, or three terms       3 log_5 2 + 2 log_5 3 = log_5 72
//   stretch     a whole number to turn into a log  1 + log_3 4 = log_3 12,
//               or a half or third in front        ½ log_2 9 + log_2 5 = log_2 15

const SINGLE_BASES = [2, 3, 5, 7, 10, 10];

// Terms [c, x, sign] → TeX; sign +1 or −1, c a whole number or [1, r].
const termsTex = (b, terms) => terms.map(([c, x, s], i) => {
  const body = typeof x === 'number' || typeof x === 'string' ? `${coef(c)}${log(b, x)}` : x.tex;
  if (i === 0) return s < 0 ? `-${body}` : body;
  return `${s < 0 ? '-' : '+'} ${body}`;
}).join(' ');

const single = (b, q, steps, p, d, difficulty) => {
  const ans = log(b, ratTex(p, d));
  return {
    instruction: 'Write as a single logarithm',
    questionMath: q,
    answer: ans,
    workingOut: [...steps.map((s) => `= ${s}`), `= ${ans}`].join(NL),
    metadata: { topic: 'log-single', difficulty },
  };
};

// The value of the product of x^c (s = +1) over x^c (s = −1), reduced.
const valueOf = (terms) => {
  let p = 1, d = 1;
  terms.forEach(([c, x, s]) => { const v = x ** c; if (s > 0) p *= v; else d *= v; });
  return reduce(p, d);
};
const fine = (b, p, d) => p > 0 && !(d === 1 && isPowerOf(p, b)) && !(p === 1 && isPowerOf(d, b)) && p <= 1000 && d <= 200;

export const generateLogSingle = (options = {}) => {
  const { difficulty = 'core' } = options;

  if (difficulty === 'foundation') {
    for (;;) {
      const b = _.sample(SINGLE_BASES);
      if (_.random(0, 1)) {
        const m = _.random(2, 12), n = _.random(2, 12);
        if (m === n || m * n > 150 || isPowerOf(m * n, b)) continue;
        return single(b, `${log(b, m)} + ${log(b, n)}`, [log(b, `${m} \\times ${n}`)], m * n, 1, difficulty);
      }
      const n = _.random(2, 9), k = _.random(2, 12);
      if (k === n || isPowerOf(k, b)) continue;
      return single(b, `${log(b, k * n)} - ${log(b, n)}`, [log(b, `\\frac{${k * n}}{${n}}`)], k, 1, difficulty);
    }
  }

  if (difficulty === 'core') {
    for (;;) {
      const b = _.sample(SINGLE_BASES);
      let terms;
      if (_.random(0, 1)) {
        const c1 = _.random(1, 3), c2 = _.random(1, 3);
        if (c1 === 1 && c2 === 1) continue;
        const x1 = _.random(2, 7), x2 = _.random(2, 7);
        if (x1 === x2) continue;
        terms = [[c1, x1, 1], [c2, x2, _.sample([1, -1])]];
      } else {
        const xs = _.sampleSize([2, 3, 4, 5, 6, 7, 8, 9, 10, 12], 3);
        terms = [[1, xs[0], 1], [_.sample([1, 1, 2]), xs[1], _.sample([1, -1])], [1, xs[2], -1]];
      }
      const [p, d] = valueOf(terms);
      if (!fine(b, p, d)) continue;
      const powered = terms.some(([c]) => c > 1);
      const steps = powered ? [termsTex(b, terms.map(([c, x, s]) => [1, x ** c, s]))] : [];
      return single(b, termsTex(b, terms), steps, p, d, difficulty);
    }
  }

  // Stretch
  for (;;) {
    const b = _.sample(SINGLE_BASES);
    if (_.random(0, 1)) {
      // A whole number as a log: 1 = log_b b, 2 = log_b b^2.
      const n = _.random(1, b === 10 || b === 2 ? 3 : 2);
      const sn = _.sample([1, -1]);
      const c = _.sample([1, 1, 2]);
      const x = _.random(2, 9);
      const sx = sn < 0 ? 1 : _.sample([1, -1]);
      if (x === b) continue;
      const nTerm = [n, { tex: `${n}` }, sn];
      const xTerm = [c, x, sx];
      const constFirst = sx < 0 || (sn > 0 && _.random(0, 1));
      const ordered = constFirst ? [nTerm, xTerm] : [xTerm, nTerm];
      if (ordered[0][2] < 0) continue;
      const [p, d] = valueOf([[n, b, sn], [c, x, sx]]);
      if (!fine(b, p, d)) continue;
      const rewrite = ordered.map(([cc, xx, s]) => (typeof xx === 'object' ? [1, b ** n, s] : [1, xx ** cc, s]));
      return single(b, termsTex(b, ordered), [termsTex(b, rewrite)], p, d, difficulty);
    }
    // A half or a third in front: ½ log 9 = log 3.
    const r = _.sample([2, 2, 3]);
    const root = _.random(2, r === 2 ? 9 : 5);
    const x = _.random(2, 9);
    const s = _.sample([1, -1]);
    if (x === root) continue;
    const terms = [[[1, r], root ** r, 1], [1, x, s]];
    const ordered = _.random(0, 1) || s < 0 ? terms : [terms[1], terms[0]];
    const [p, d] = reduce(s > 0 ? root * x : root, s > 0 ? 1 : x);
    if (!fine(b, p, d)) continue;
    const rewrite = ordered.map(([c, xx, sg]) => (Array.isArray(c) ? [1, root, sg] : [1, xx, sg]));
    return single(b, termsTex(b, ordered), [termsTex(b, rewrite)], p, d, difficulty);
  }
};

/* -------------------------------------------------------- log-in-terms */
//
//   foundation  one law: log 21 = p + q, log(3/7) = q − p, log 49 = 2p
//   core        powers and quotients together: log(7/9) = p − 2q
//   stretch     a power of the base folded in: log_2 56 = p + 3,
//               log_2(5.25) = p + q − 2

const PRIMES = [2, 3, 5, 7, 11];

// ∏ base^e over the positive e, over ∏ over the negative, as TeX.
const factorTex = (factors) => {
  const part = (fs) => fs.map(([x, e]) => (e === 1 ? `${x}` : `${x}^{${e}}`)).join(' \\times ');
  const top = factors.filter(([, e]) => e > 0);
  const bot = factors.filter(([, e]) => e < 0).map(([x, e]) => [x, -e]);
  if (!bot.length) return part(top);
  return `\\frac{${top.length ? part(top) : 1}}{${part(bot)}}`;
};

export const generateLogInTerms = (options = {}) => {
  const { difficulty = 'core' } = options;
  for (;;) {
    const b = _.sample([2, 3, 5, 10, 10]);
    const avail = PRIMES.filter((x) => b % x !== 0);
    const [m, n] = _.sampleSize(avail, 2);
    let i, j, c = 0;
    if (difficulty === 'foundation') {
      const kind = _.sample(['product', 'quotient', 'power']);
      if (kind === 'product') [i, j] = [1, 1];
      else if (kind === 'quotient') [i, j] = _.sample([[1, -1], [-1, 1]]);
      else [i, j] = _.sample([[_.random(2, 3), 0], [0, _.random(2, 3)]]);
    } else if (difficulty === 'core') {
      i = _.sample([-3, -2, -1, 1, 2, 3]); j = _.sample([-3, -2, -1, 1, 2, 3]);
      if (Math.max(Math.abs(i), Math.abs(j)) < 2) continue;
    } else {
      i = _.sample([-2, -1, 1, 1, 2]); j = _.sample([-2, -1, 0, 1, 2]);
      c = _.sample([-3, -2, -1, 1, 2, 3]);
    }
    const factors = [[b, c], [m, i], [n, j]].filter(([, e]) => e !== 0);
    let top = 1, bot = 1;
    factors.forEach(([x, e]) => { if (e > 0) top *= x ** e; else bot *= x ** -e; });
    if (top > 2000 || bot > 500) continue;
    if (difficulty === 'foundation' && (top > 1000 || (top > 200 && bot === 1 && i && j))) continue;
    if (top === 1 && bot === 1) continue;

    let target = ratTex(top, bot);
    if (difficulty === 'stretch' && bot > 1) {
      const dec = decimal(top, bot, 3);
      if (dec && Math.random() < 0.4) target = dec;
    }
    // Write the factors with the base first, then m and n.
    const lines = [
      `${log(b, target)} = ${log(b, factorTex(factors))}`,
      `= ${[...factors.filter(([, e]) => e > 0), ...factors.filter(([, e]) => e < 0)].map(([x, e], k) => {
        const t = `${coef(Math.abs(e))}${log(b, x)}`;
        if (k === 0) return e < 0 ? `-${t}` : t;
        return `${e < 0 ? '-' : '+'} ${t}`;
      }).join(' ')}`,
    ];
    const ans = linear([[i, 'p'], [j, 'q'], [c, '']]);
    lines.push(`= ${ans}`);
    return {
      instruction: 'Write in terms of p and q',
      questionMath: `${log(b, m)} = p, \\quad ${log(b, n)} = q${NL}${log(b, target)}`,
      answer: ans,
      workingOut: lines.join(NL),
      metadata: { topic: 'log-in-terms', difficulty },
    };
  }
};

/* ---------------------------------------------------------- log-remove */
//
//   foundation  one law: log_2 y = 3 log_2 u → y = u^3, or straight from the
//               definition: log D = 2x + 1 → D = 10^(2x + 1)
//   core        two terms with coefficients: y = u^2 v^3, y = u^3 / v^2
//   stretch     a whole number among the logs (log_7 y = 1 + 2 log_7 v → y = 7v^2),
//               or a half or third in front (y = √v / u^2)

const NAMES = [['y', 'u', 'v'], ['M', 'a', 'b'], ['N', 'c', 'd'], ['P', 'm', 'n'], ['T', 'r', 's']];

// letter^e for e a whole number, ½ or ⅓.
const powTex = (v, e) => {
  if (Array.isArray(e)) return e[1] === 2 ? `\\sqrt{${v}}` : `\\sqrt[3]{${v}}`;
  return e === 1 ? v : `${v}^{${e}}`;
};
// k × ∏ top / ∏ bottom, where k = b^n (n may be negative).
const monomial = (k, letters) => {
  const top = letters.filter(([, , s]) => s > 0).map(([v, e]) => powTex(v, e));
  const bot = letters.filter(([, , s]) => s < 0).map(([v, e]) => powTex(v, e));
  const [kn, kd] = k;
  const numer = `${kn === 1 && top.length ? '' : kn}${top.join('')}`;
  const denom = `${kd === 1 ? '' : kd}${bot.join('')}`;
  return denom ? `\\frac{${numer}}{${denom}}` : numer;
};

export const generateLogRemove = (options = {}) => {
  const { difficulty = 'core' } = options;
  const b = _.sample([2, 3, 5, 7, 10, 10]);
  const [Y, u, v] = _.sample(NAMES);
  const out = (q, steps, ans) => ({
    instruction: 'Write without logarithms',
    questionMath: q,
    answer: `${Y} = ${ans}`,
    workingOut: [...steps, `${Y} = ${ans}`].join(NL),
    metadata: { topic: 'log-remove', difficulty },
  });
  const lhs = log(b, Y);
  // Terms [c, letter, sign] → the right-hand side, the rewritten line, the answer.
  const build = (terms, constant = 0) => {
    const parts = [], rewrite = [];
    terms.forEach(([c, letter, s], k) => {
      if (letter === null) {
        parts.push([s, `${c}`]);
        rewrite.push([s, log(b, `${b ** c}`)]);
      } else {
        parts.push([s, `${coef(c)}${log(b, letter)}`]);
        rewrite.push([s, log(b, powTex(letter, c))]);
      }
      return k;
    });
    const join = (ps) => ps.map(([s, t], k) => (k === 0 ? (s < 0 ? `-${t}` : t) : `${s < 0 ? '-' : '+'} ${t}`)).join(' ');
    const consts = terms.filter(([, l]) => l === null);
    let kn = 1, kd = 1;
    consts.forEach(([c, , s]) => { if (s > 0) kn *= b ** c; else kd *= b ** c; });
    const ans = monomial([kn, kd], terms.filter(([, l]) => l !== null).map(([c, l, s]) => [l, c, s]).sort((x, y) => (x[0] < y[0] ? -1 : 1)));
    return { rhs: join(parts), rewritten: join(rewrite), ans, constant };
  };
  const answerLines = ({ rhs, rewritten, ans }, extraStep = true) => [
    `${lhs} = ${rhs}`,
    ...(extraStep && rewritten !== rhs ? [`${lhs} = ${rewritten}`] : []),
    `${lhs} = ${log(b, ans)}`,
  ].slice(1).filter((line, k, all) => all.indexOf(line) === k);

  if (difficulty === 'foundation') {
    if (_.random(0, 1)) {
      const D = _.sample(['D', 'Q', 'J', 'N', 'y']);
      const m = _.random(1, 3), c = _.sample([-3, -2, -1, 1, 2, 3]);
      const e = linX(m, c);
      return {
        instruction: 'Write without logarithms',
        questionMath: `${log(b, D)} = ${e}`,
        answer: `${D} = ${b}^{${e}}`,
        workingOut: `${D} = ${b}^{${e}}`,
        metadata: { topic: 'log-remove', difficulty },
      };
    }
    const form = _.sample(['power', 'product', 'quotient']);
    const terms = form === 'power' ? [[_.random(2, 5), _.sample([u, v]), 1]]
      : form === 'product' ? _.shuffle([[1, u, 1], [1, v, 1]])
        : [[1, u, 1], [1, v, -1]];
    const t = build(terms);
    return out(`${lhs} = ${t.rhs}`, answerLines(t), t.ans);
  }

  if (difficulty === 'core') {
    for (;;) {
      const c1 = _.random(1, 4), c2 = _.random(1, 4);
      const shape = _.sample(['times', 'over', 'over', 'negative']);
      let terms;
      if (shape === 'negative') terms = [[_.random(1, 4), _.sample([u, v]), -1]];
      else {
        if (c1 === 1 && c2 === 1) continue;
        terms = shape === 'times' ? [[c1, u, 1], [c2, v, 1]] : [[c1, u, 1], [c2, v, -1]];
        if (_.random(0, 1) && shape === 'times') terms.reverse();
      }
      const t = build(terms);
      return out(`${lhs} = ${t.rhs}`, answerLines(t), t.ans);
    }
  }

  // Stretch
  if (_.random(0, 1)) {
    // A whole number among the logs.
    const n = _.random(1, b === 10 || b === 2 ? 3 : 2);
    if (b ** n > 100) return generateLogRemove(options);
    const sn = _.sample([1, -1]);
    const letterTerms = _.random(0, 1)
      ? [[_.random(1, 3), _.sample([u, v]), _.sample([1, -1])]]
      : [[_.random(1, 3), u, 1], [_.random(1, 3), v, -1]];
    const all = sn > 0 && _.random(0, 1) ? [[n, null, sn], ...letterTerms] : [...letterTerms, [n, null, sn]];
    if (all[0][2] < 0) [all[0], all[all.length - 1]] = [all[all.length - 1], all[0]];
    if (all[0][2] < 0) return generateLogRemove(options);
    const t = build(all);
    return out(`${lhs} = ${t.rhs}`, answerLines(t), t.ans);
  }
  // A half or a third in front.
  const r = _.sample([2, 2, 3]);
  const first = _.sample([u, v]);
  const other = first === u ? v : u;
  const terms = [[[1, r], first, 1], [_.random(1, 3), other, _.sample([1, -1])]];
  if (Math.random() < 0.3) {
    const n = 1;
    terms.push([n, null, _.sample([1, -1])]);
  }
  const t = build(terms);
  return out(`${lhs} = ${t.rhs}`, answerLines(t), t.ans);
};

/* ----------------------------------------------- log-solve-exponential */
//
//   foundation  10^x = b                         x = log b
//   core        a^x = b, with decimal bases and negative answers
//   stretch     half equations, k × a^x = b or a^(mx + c) = b, and half
//               worded growth and decay models (find t when P = 3000)
//
// Every answer is to 3 significant figures, and no exact value sits within
// a hair of a rounding boundary, so the rounding is never in doubt.

const SF3 = 'Give your answer to 3 significant figures';
const safe = (x) => {
  if (!Number.isFinite(x)) return false;
  const mag = Math.floor(Math.log10(Math.abs(x)));
  const scaled = Math.abs(x) * 10 ** (2 - mag);
  return Math.abs(scaled - Math.floor(scaled) - 0.5) > 1e-4;
};
const nearWhole = (x) => Math.abs(x - Math.round(x)) < 0.02;

// A number with 2 to 4 significant figures between 0.001 and 99 999.
const someNumber = () => {
  for (;;) {
    const s = _.random(2, 4);
    const M = _.random(10 ** (s - 1) + 1, 10 ** s - 1);
    if (M % 10 === 0) continue;
    const e = _.random(-3 - s, 5 - s);
    const v = M * 10 ** e;
    if (v < 0.001 || v >= 100000) continue;
    return { v, tex: v.toFixed(Math.max(0, -e)) };
  }
};
// A decimal base is bracketed, (1.05)^x, as Haese prints it.
const baseTex = (a) => (Number.isInteger(a) ? `${a}` : `(${num(a)})`);
const logsTex = (bTex, aTex) => `\\frac{${log(10, bTex)}}{${log(10, aTex)}}`;

const MODELS = [
  {
    kind: 'growth model', S: 'P', t: 't', units: 'days', base: 2,
    instruction: `A hive has P bees t days after it is found. ${SF3}`,
    start: () => _.random(2, 20) * 100, rate: () => _.random(2, 9) / 100,
    target: (A) => Math.round(A * _.random(15, 120) / 10 / 100) * 100,
  },
  {
    kind: 'growth model', S: 'W', t: 't', units: 'hours', base: 2,
    instruction: `A culture of bacteria has a mass of W grams after t hours. ${SF3}`,
    start: () => _.random(3, 10) / 2, rate: () => _.random(3, 8) / 100,
    target: (A) => Math.round(A * _.random(15, 100) / 10),
  },
  {
    kind: 'growth model', S: 'V', t: 'n', units: 'years', ratio: [1.02, 1.025, 1.03, 1.035, 1.04, 1.045, 1.05, 1.06],
    instruction: `A savings account is worth £V after n years. ${SF3}`,
    start: () => _.random(2, 18) * 500, rate: null,
    target: (A) => Math.round(A * _.random(12, 25) / 10 / 100) * 100,
  },
  {
    kind: 'decay model', S: 'V', t: 'n', units: 'years', ratio: [0.8, 0.82, 0.85, 0.88, 0.9],
    instruction: `A car is worth £V after n years. ${SF3}`,
    start: () => _.random(12, 30) * 1000, rate: null,
    target: (A) => Math.round(A * _.random(2, 7) / 10 / 500) * 500,
  },
  {
    kind: 'decay model', S: 'D', t: 't', units: 'hours', ratio: [0.7, 0.75, 0.8, 0.85, 0.9],
    instruction: `A patient has D mg of a medicine in the blood t hours after a dose. ${SF3}`,
    start: () => _.random(4, 10) * 50, rate: null,
    target: (A) => Math.round(A * _.random(1, 6) / 10 / 5) * 5,
  },
];

const solved = (instruction, questionMath, working, letter, x, difficulty, units) => ({
  instruction,
  questionMath,
  answer: `${letter} = ${sf(x)}`,
  ...(units ? { answerUnits: units } : {}),
  workingOut: [...working, `${letter} = ${sf(x)}`].join(NL),
  metadata: { topic: 'log-solve-exponential', difficulty },
});

const model = (difficulty) => {
  for (;;) {
    const M = _.sample(MODELS);
    const A = M.start();
    const T = M.target(A);
    if (T <= 0 || T === A) continue;
    const { S, t } = M;
    let rhs, solve, working;
    if (M.base) {
      const k = M.rate();
      rhs = `${num(A)} \\times 2^{${num(k)}${t}}`;
      const x = Math.log(T / A) / Math.log(2) / k;
      if (!safe(x) || x <= 0 || x > 500) continue;
      const ratio = decimal(T, A, 3) ?? `\\frac{${T}}{${num(A)}}`;
      working = [`2^{${num(k)}${t}} = ${ratio}`, `${num(k)}${t} = ${logsTex(ratio, '2')}`];
      solve = x;
    } else {
      const r = _.sample(M.ratio);
      if ((M.kind === 'growth model') !== (r > 1) || (r > 1) !== (T > A)) continue;
      rhs = `${num(A)} \\times ${baseTex(r)}^{${t}}`;
      const x = Math.log(T / A) / Math.log(r);
      if (!safe(x) || x <= 0 || x > 100) continue;
      const ratio = decimal(T, A, 3) ?? `\\frac{${T}}{${num(A)}}`;
      working = [`${baseTex(r)}^{${t}} = ${ratio}`, `${t} = ${logsTex(ratio, num(r))}`];
      solve = x;
    }
    if (M.kind === 'decay model' && T >= A) continue;
    return solved(
      M.instruction,
      `${S} = ${rhs}${NL}\\text{Find } ${t} \\text{ when } ${S} = ${num(T)}`,
      working, t, solve, difficulty, M.units,
    );
  }
};

export const generateLogSolveExponential = (options = {}) => {
  const { difficulty = 'core' } = options;
  const instruction = `Solve. ${SF3}`;

  if (difficulty === 'foundation') {
    for (;;) {
      const { v, tex } = someNumber();
      const x = Math.log10(v);
      if (!safe(x) || nearWhole(x)) continue;
      return solved(instruction, `10^{x} = ${tex}`, [`x = ${log(10, tex)}`], 'x', x, difficulty);
    }
  }

  if (difficulty === 'core') {
    for (;;) {
      const a = _.sample([2, 3, 4, 5, 6, 7, 8, 9, 1.5, 1.2, 1.1, 1.05, 1.08, 0.5, 0.8, 0.9, 0.95]);
      const shape = _.random(0, 2);
      const bv = shape === 0 ? _.random(2, 500) : shape === 1 ? _.random(1, 95) / 100 : _.random(15, 500) / 10;
      const x = Math.log(bv) / Math.log(a);
      if (!safe(x) || nearWhole(x) || Math.abs(x) < 0.15 || Math.abs(x) > 30) continue;
      const bTex = num(bv);
      return solved(instruction, `${baseTex(a)}^{x} = ${bTex}`, [`x = ${logsTex(bTex, num(a))}`], 'x', x, difficulty);
    }
  }

  // Stretch
  if (_.random(0, 1)) return model(difficulty);
  for (;;) {
    if (_.random(0, 1)) {
      // k × a^x = b
      const a = _.sample([2, 3, 4, 5, 1.5, 1.2]);
      const k = _.random(2, 9);
      const bv = _.random(k * 2, k * 80);
      const R = bv / k;
      const x = Math.log(R) / Math.log(a);
      if (!safe(x) || nearWhole(x)) continue;
      const rTex = decimal(bv, k, 3) ?? frac(bv, k);
      return solved(
        instruction,
        `${k} \\times ${baseTex(a)}^{x} = ${bv}`,
        [`${baseTex(a)}^{x} = ${rTex}`, `x = ${logsTex(rTex, num(a))}`],
        'x', x, difficulty,
      );
    }
    // a^(mx + c) = b
    const a = _.sample([2, 3, 5, 10]);
    const m = _.random(2, 3);
    const c = _.sample([-3, -2, -1, 1, 2, 3]);
    const bv = _.random(5, 500);
    const L = Math.log(bv) / Math.log(a);
    const x = (L - c) / m;
    if (!safe(x) || nearWhole(L) || Math.abs(x) < 0.1) continue;
    const e = linX(m, c);
    const logs = a === 10 ? log(10, bv) : logsTex(`${bv}`, `${a}`);
    return solved(instruction, `${a}^{${e}} = ${bv}`, [`${e} = ${logs}`], 'x', x, difficulty);
  }
};

/* ------------------------------------------------------- log-equations */
//
//   foundation  log_2 x = 5 → x = 32, or the base unknown: log_x 64 = 3 → x = 4
//   core        a negative or fractional power (log_5 x = −2, log_8 x = 2/3), or
//               a linear argument (log_5(2x) = −1, log_2(x + 3) = 4)
//   stretch     combine the logs first: log_2 x + log_2 3 = 4 → x = 16/3, or two
//               logs of x: log_2 x + log_2(x + 2) = 3 → x = 2

const eq = (q, working, ans, difficulty) => ({
  instruction: 'Solve',
  questionMath: q,
  answer: `x = ${ans}`,
  workingOut: [...working, `x = ${ans}`].join(NL),
  metadata: { topic: 'log-equations', difficulty },
});
// a^n for whole n, possibly negative, as TeX: an integer, a fraction, or a
// decimal for base 10.
const powerValue = (a, n) => {
  if (n >= 0) return [a ** n, 1];
  return [1, a ** -n];
};
const valueTex = (a, [p, q]) => {
  if (q === 1) return `${p}`;
  if (a === 10 && p === 1) return decimal(p, q, 6);
  return frac(p, q);
};

export const generateLogEquations = (options = {}) => {
  const { difficulty = 'core' } = options;

  if (difficulty === 'foundation') {
    if (_.random(0, 2) > 0) {
      const a = _.sample(BASES);
      const n = _.sample(exponentsUpTo(a, 10000, 1));
      return eq(`${log(a, 'x')} = ${n}`, [`x = ${a}^{${n}}`], `${a ** n}`, difficulty);
    }
    const a = _.sample(BASES);
    const n = _.sample(exponentsUpTo(a, 10000).filter((k) => k <= 4));
    return eq(`\\log_{x} ${a ** n} = ${n}`, [`x^{${n}} = ${a ** n}`], `${a}`, difficulty);
  }

  if (difficulty === 'core') {
    if (_.random(0, 1)) {
      if (_.random(0, 1)) {
        const a = _.sample([2, 3, 4, 5, 10]);
        const n = _.sample(exponentsUpTo(a, a === 10 ? 10000 : 1000, 1));
        return eq(`${log(a, 'x')} = -${n}`, [`x = ${a}^{-${n}}`], valueTex(a, powerValue(a, -n)), difficulty);
      }
      for (;;) {
        const s = _.sample([2, 3, 5]);
        const k = _.sample([2, 3]);
        const m = _.sample([1, 1, 2, -1]);
        if (gcd(Math.abs(m), k) !== 1 || s ** k > 125) continue;
        const r = frac(m, k);
        const ans = m > 0 ? `${s ** m}` : `\\frac{1}{${s ** -m}}`;
        return eq(`${log(s ** k, 'x')} = ${r}`, [`x = ${s ** k}^{${r}}`], ans, difficulty);
      }
    }
    for (;;) {
      const a = _.sample([2, 3, 5, 10]);
      const n = _.sample([-2, -1, 1, 2, 3]);
      const m = _.random(1, 3), c = _.sample([0, 0, -5, -3, -2, -1, 1, 2, 3, 5]);
      if (m === 1 && c === 0) continue;
      const [p, q] = powerValue(a, n);
      if (a ** Math.abs(n) > 1000) continue;
      // m x + c = p/q → x = (p − c q) / (m q)
      const xn = p - c * q, xd = m * q;
      // A negative power stays as clean as Haese's log_5(2x) = -1, so no
      // constant beside it; a positive one gives a whole answer.
      if (xn === 0 || (n < 0 && c !== 0) || (n > 0 && xn % xd !== 0)) continue;
      const inside = c === 0 ? `${m}x` : linX(m, c);
      const working = [`${inside} = ${a}^{${n}}`];
      if (n !== 1) working.push(`${inside} = ${valueTex(a, [p, q])}`);
      const ans = frac(xn, xd);
      return eq(`${log(a, inside)} = ${n}`, working, ans, difficulty);
    }
  }

  // Stretch
  if (_.random(0, 1)) {
    for (;;) {
      const a = _.sample([2, 3, 5, 10]);
      const n = _.random(1, a === 10 ? 3 : 4);
      const m = _.random(2, 9);
      if (isPowerOf(m, a) || a ** n > 1000) continue;
      const V = a ** n;
      const form = _.sample(['sum', 'difference', 'reversed']);
      if (form === 'sum') {
        const ans = frac(V, m);
        return eq(`${log(a, 'x')} + ${log(a, m)} = ${n}`, [`${log(a, `${m}x`)} = ${n}`, `${m}x = ${V}`], ans, difficulty);
      }
      if (form === 'difference') {
        return eq(`${log(a, 'x')} - ${log(a, m)} = ${n}`, [`${log(a, `\\frac{x}{${m}}`)} = ${n}`, `\\frac{x}{${m}} = ${V}`], `${m * V}`, difficulty);
      }
      return eq(`${log(a, m)} - ${log(a, 'x')} = ${n}`, [`${log(a, `\\frac{${m}}{x}`)} = ${n}`, `\\frac{${m}}{x} = ${V}`], frac(m, V), difficulty);
    }
  }
  for (;;) {
    const a = _.sample([2, 3, 5, 10]);
    const n = _.random(1, 4);
    const V = a ** n;
    if (V < 6 || V > 200) continue;
    const pairs = [];
    for (let r = 1; r * r < V; r += 1) if (V % r === 0 && V / r - r <= 12) pairs.push([r, V / r - r]);
    if (!pairs.length) continue;
    const [r, d] = _.sample(pairs);
    return eq(
      `${log(a, 'x')} + ${log(a, `x + ${d}`)} = ${n}`,
      [
        `${log(a, `x(x + ${d})`)} = ${n}`,
        `x^{2} + ${d === 1 ? '' : d}x = ${V}`,
        `(x - ${r})(x + ${r + d}) = 0`,
      ],
      `${r}`,
      difficulty,
    );
  }
};
