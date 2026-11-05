// src/generators/algebra/functionGenerators.js
//
// Haese chapter 19 (introduction to functions), with Rayner 5.1-5.3: function
// notation, domain and range, composite functions, inverse functions, the
// absolute value function and reciprocal functions. The topic is
// "Functions".
//
// Question shape. The function definitions go in questionMath, one per
// line. The instruction is plain text and never reaches the renderer, so it
// names the task in words and holds at most a plain call like f(5) or
// f(g(3)); anything with an exponent or an inverse sign (f^{-1}(7), f(x^2))
// goes in questionMath instead.
//
// Notation, as the two textbooks mix it: a quarter of definitions use the
// arrow form f : x \mapsto 3x - 7, and composites are written f(g(x))
// (Haese) or fg(x) (Rayner) at random.
//
// Every value is built from the answer outwards, so answers are whole
// numbers wherever a number is asked for.

import _ from 'lodash';

const NL = '\n';

/* ------------------------------------------------------- polynomials */
// A polynomial in x is an array of coefficients, constant first.

const trim = (p) => { const q = [...p]; while (q.length > 1 && q[q.length - 1] === 0) q.pop(); return q; };
const add = (p, q) => trim(_.range(Math.max(p.length, q.length)).map((i) => (p[i] ?? 0) + (q[i] ?? 0)));
const scale = (p, k) => trim(p.map((c) => c * k));
const mul = (p, q) => {
  const out = Array(p.length + q.length - 1).fill(0);
  p.forEach((a, i) => q.forEach((b, j) => { out[i + j] += a * b; }));
  return trim(out);
};
// f(g(x)) for polynomials f and g.
const compose = (f, g) => f.reduceRight((acc, c) => add(mul(acc, g), [c]), [0]);
const at = (p, x) => p.reduceRight((acc, c) => acc * x + c, 0);

// 3x^2 - x + 4, highest power first.
export function polyTex(p, v = 'x') {
  const terms = [];
  for (let i = p.length - 1; i >= 0; i -= 1) {
    const c = p[i];
    if (c === 0) continue;
    const pow = i === 0 ? '' : i === 1 ? v : `${v}^${i}`;
    const mag = Math.abs(c) === 1 && i > 0 ? '' : String(Math.abs(c));
    terms.push({ neg: c < 0, body: `${mag}${pow}` });
  }
  if (!terms.length) return '0';
  return terms.map((t, k) => (k === 0 ? `${t.neg ? '-' : ''}${t.body}` : ` ${t.neg ? '-' : '+'} ${t.body}`)).join('');
}

// A linear expression with its positive term first: 5 - 2x rather than
// -2x + 5, as both textbooks write an inverse such as (7 - x)/2.
const linTex = (c0, c1) => (c1 < 0 && c0 > 0 ? `${c0} - ${polyTex([0, -c1])}` : polyTex([c0, c1]));

// The polynomial with the value substituted: 3(-2)^2 - 4(-2) + 1.
function subTex(p, val) {
  const v = val < 0 ? `(${val})` : String(val);
  const terms = [];
  for (let i = p.length - 1; i >= 0; i -= 1) {
    const c = p[i];
    if (c === 0) continue;
    const pow = i === 0 ? '' : i === 1 ? v : `${v}^${i}`;
    let body;
    if (i === 0) body = String(Math.abs(c));
    else if (Math.abs(c) === 1) body = pow;
    else body = val < 0 ? `${Math.abs(c)}${pow}` : `${Math.abs(c)} \\times ${pow}`;
    terms.push({ neg: c < 0, body });
  }
  return terms.map((t, k) => (k === 0 ? `${t.neg ? '-' : ''}${t.body}` : ` ${t.neg ? '-' : '+'} ${t.body}`)).join('');
}

// The polynomial with an expression substituted: 3(x + 2)^2 - (x + 2) + 1.
function subExpr(p, arg) {
  const v = `(${arg})`;
  const terms = [];
  for (let i = p.length - 1; i >= 0; i -= 1) {
    const c = p[i];
    if (c === 0) continue;
    const pow = i === 0 ? '' : i === 1 ? v : `${v}^${i}`;
    const mag = Math.abs(c) === 1 && i > 0 ? '' : String(Math.abs(c));
    terms.push({ neg: c < 0, body: `${mag}${pow}` });
  }
  return terms.map((t, k) => (k === 0 ? `${t.neg ? '-' : ''}${t.body}` : ` ${t.neg ? '-' : '+'} ${t.body}`)).join('');
}

const nz = (lo, hi) => { for (;;) { const n = _.random(lo, hi); if (n !== 0) return n; } };
const arrow = () => Math.random() < 0.25;
const def = (name, body, useArrow = arrow()) => (useArrow ? `${name} : x \\mapsto ${body}` : `${name}(x) = ${body}`);
const NAMES = [['f', 'g'], ['f', 'g'], ['g', 'h'], ['f', 'h']];
const one = () => _.sample(['f', 'f', 'g', 'h']);

// A composite in either notation: f(g(3)) or fg(3).
const comp = (outer, inner, arg, short) => (short ? `${outer}${inner}(${arg})` : `${outer}(${inner}(${arg}))`);

const linear = () => [nz(-12, 12), _.sample([2, 3, 4, 5, 6, 7, 8, 9, -2, -3, -4, -5])];
const quadratic = () => [_.random(-9, 9), _.random(-6, 6), _.sample([1, 1, 2, 3, -1])];
const setTex = (xs) => `\\{${xs.join(', ')}\\}`;

/* ------------------------------------------------- function notation */
//   Foundation  evaluate a linear function: f(5)
//   Core        evaluate a quadratic at a negative number; or the reverse,
//               find x when f(x) = 11
//   Stretch     substitute an expression and simplify: f(x + 2), f(-x),
//               f(2x); or find a and b in f(x) = ax + b from two values
//               (Rayner 5.1 Q26)
export const generateFunctionNotation = (options = {}) => {
  const { difficulty = 'core' } = options;
  const name = one();
  let q;
  if (difficulty === 'foundation') q = evaluate(name, linear(), nz(-5, 10));
  else if (difficulty === 'core') q = Math.random() < 0.5 ? evaluate(name, quadratic(), _.random(-5, -1)) : reverseEval(name);
  else q = Math.random() < 0.6 ? substitute(name) : twoValues(name);
  return { ...q, metadata: { topic: 'function-notation', difficulty } };
};

function evaluate(name, p, n) {
  const v = at(p, n);
  return {
    instruction: 'Evaluate',
    questionMath: `${def(name, polyTex(p))}${NL}${name}(${n})`,
    answer: String(v),
    workingOut: `${name}(${n}) = ${subTex(p, n)} = ${v}`,
  };
}

function reverseEval(name) {
  const [b, a] = linear();
  const t = nz(-6, 10);
  const k = a * t + b;
  return {
    instruction: 'Find x',
    questionMath: `${def(name, polyTex([b, a]))}${NL}${name}(x) = ${k}`,
    answer: `x = ${t}`,
    workingOut: [`${polyTex([b, a])} = ${k}`, `${polyTex([0, a])} = ${k - b}`, `x = ${t}`].join(NL),
  };
}

const INNER = [
  { tex: (k) => `x + ${k}`, p: (k) => [k, 1] },
  { tex: (k) => `x - ${k}`, p: (k) => [-k, 1] },
  { tex: () => '-x', p: () => [0, -1] },
  { tex: (k) => `${k}x`, p: (k) => [0, k] },
];

function substitute(name) {
  for (;;) {
    const f = Math.random() < 0.5 ? linear() : [_.random(-9, 9), _.random(-6, 6), _.sample([1, 1, -1, 2])];
    const inner = _.sample(INNER);
    const k = _.random(2, 5);
    const g = inner.p(k);
    const result = compose(f, g);
    // Substituting must change something worth simplifying.
    if (_.isEqual(result, f)) continue;
    const arg = inner.tex(k);
    return {
      instruction: 'Find, in simplest form,',
      questionMath: `${name}(${arg}) \\text{ when } ${def(name, polyTex(f), false)}`,
      answer: `${name}(${arg}) = ${polyTex(result)}`,
      workingOut: [`${name}(${arg}) = ${subExpr(f, arg)}`, `${name}(${arg}) = ${polyTex(result)}`].join(NL),
    };
  }
}

function twoValues(name) {
  const a = nz(-6, 6), b = _.random(-10, 10);
  const [p, q] = _.sortBy(_.sampleSize(_.range(-3, 7), 2));
  const m = a * p + b, n = a * q + b;
  return {
    instruction: 'Find a and b',
    questionMath: [`${name}(x) = ax + b`, `${name}(${p}) = ${m}, \\quad ${name}(${q}) = ${n}`].join(NL),
    answer: `a = ${a}, \\ b = ${b}`,
    workingOut: [
      `${polyTex([0, p], 'a') === '0' ? 'b' : `${polyTex([0, p], 'a')} + b`} = ${m}`,
      `${polyTex([0, q], 'a') === '0' ? 'b' : `${polyTex([0, q], 'a')} + b`} = ${n}`,
      `${polyTex([0, q - p], 'a')} = ${n - m}`,
      `a = ${a}, \\ b = ${b}`,
    ].join(NL),
  };
}

/* -------------------------------------------------- domain and range */
//   Foundation  a listed domain: find the range as a set (Haese 19A)
//   Core        an interval of x, a linear function, increasing or
//               decreasing, ends included or not (Rayner 5.1 Example 1)
//   Stretch     a quadratic on an interval with its turning point inside,
//               so one end of the range is the turning point
export const generateDomainRange = (options = {}) => {
  const { difficulty = 'core' } = options;
  const name = one();
  let q;
  if (difficulty === 'foundation') q = rangeOfSet(name);
  else if (difficulty === 'core') q = rangeOfLine(name);
  else q = rangeOfQuadratic(name);
  return { ...q, instruction: 'Find the range of the function', metadata: { topic: 'domain-range', difficulty } };
};

function rangeOfSet(name) {
  const lo = _.random(-3, 0);
  const xs = _.range(lo, lo + _.random(4, 5));
  const p = Math.random() < 0.6 ? [nz(-6, 6), nz(-4, 5)] : [_.random(-4, 4), 0, 1];
  const ys = _.sortBy(_.uniq(xs.map((x) => at(p, x))));
  return {
    questionMath: `${def(name, polyTex(p), false)}, \\quad x \\in ${setTex(xs)}`,
    answer: setTex(ys),
    workingOut: xs.map((x) => `${name}(${x}) = ${at(p, x)}`).join(NL),
  };
}

// a(x - p)^2 + q, as completing the square would leave it.
function vertexTex(a, p, q) {
  const sq = p === 0 ? 'x^2' : `(x ${p < 0 ? '+' : '-'} ${Math.abs(p)})^2`;
  const lead = a === 1 ? '' : a === -1 ? '-' : String(a);
  return `${lead}${sq}${q === 0 ? '' : ` ${q < 0 ? '-' : '+'} ${Math.abs(q)}`}`;
}

const LE = (strict) => (strict ? '<' : '\\le');

function rangeOfLine(name) {
  const [b, a] = [_.random(-9, 9), nz(-4, 4)];
  const lo = _.random(-5, 1), hi = lo + _.random(2, 6);
  const strictLo = Math.random() < 0.25, strictHi = Math.random() < 0.25;
  const [ylo, yhi] = a > 0 ? [at([b, a], lo), at([b, a], hi)] : [at([b, a], hi), at([b, a], lo)];
  const [sLo, sHi] = a > 0 ? [strictLo, strictHi] : [strictHi, strictLo];
  return {
    questionMath: `${def(name, polyTex([b, a]), false)}, \\quad ${lo} ${LE(strictLo)} x ${LE(strictHi)} ${hi}`,
    answer: `${ylo} ${LE(sLo)} ${name}(x) ${LE(sHi)} ${yhi}`,
    workingOut: [`${name}(${lo}) = ${at([b, a], lo)}`, `${name}(${hi}) = ${at([b, a], hi)}`].join(NL),
  };
}

function rangeOfQuadratic(name) {
  for (;;) {
    const a = _.sample([1, 1, -1, 2, -2]);
    const p = _.random(-3, 3), qv = _.random(-8, 8);
    const lo = p - _.random(1, 4), hi = p + _.random(1, 4);
    if (hi - p === p - lo) continue;   // the far end must be one end, not both
    const f = add(scale(mul([-p, 1], [-p, 1]), a), [qv]);
    if (f[1] === 0) continue;          // a turning point on the y-axis is too easy to read off
    const far = Math.abs(hi - p) > Math.abs(lo - p) ? hi : lo;
    const ext = at(f, far);
    const [ylo, yhi] = a > 0 ? [qv, ext] : [ext, qv];
    return {
      questionMath: `${def(name, polyTex(f), false)}, \\quad ${lo} \\le x \\le ${hi}`,
      answer: `${ylo} \\le ${name}(x) \\le ${yhi}`,
      workingOut: [
        `${name}(x) = ${vertexTex(a, p, qv)}`,
        `${name}(${p}) = ${qv}`,
        `${name}(${lo}) = ${at(f, lo)}, \\quad ${name}(${hi}) = ${at(f, hi)}`,
      ].join(NL),
    };
  }
}

/* ------------------------------------------------ composite functions */
//   Foundation  a number: f(g(3)), working out g(3) first
//   Core        in simplest form, one of the two quadratic, so expanding a
//               bracket squared (Haese 19D Example 6)
//   Stretch     solve g(f(x)) = 17 (Haese 19D Q8); or find a and b when
//               f(f(x)) = 4x - 15, both pairs (Haese 19D Q11)
export const generateCompositeFunctions = (options = {}) => {
  const { difficulty = 'core' } = options;
  const [F, G] = _.sample(NAMES);
  const short = Math.random() < 0.5;
  let q;
  if (difficulty === 'foundation') q = compositeValue(F, G, short);
  else if (difficulty === 'core') q = compositeExpression(F, G, short);
  else q = Math.random() < 0.5 ? compositeSolve(F, G, short) : selfComposite(F, short);
  return { ...q, metadata: { topic: 'composite-functions', difficulty } };
};

const simpleQuad = () => _.sample([[_.random(-5, 5), 0, 1], [0, nz(-5, 5), 1], [_.random(-5, 5), 0, 2]]);

function pair(oneQuadratic) {
  const f = linear(), g = oneQuadratic ? simpleQuad() : (Math.random() < 0.5 ? linear() : simpleQuad());
  return _.shuffle([f, g]);
}

function compositeValue(F, G, short) {
  const [pf, pg] = pair(false);
  const [outer, inner, po, pi] = Math.random() < 0.5 ? [F, G, pf, pg] : [G, F, pg, pf];
  const n = nz(-3, 5);
  const mid = at(pi, n), v = at(po, mid);
  // Numbers a class can do in their heads.
  if (Math.abs(mid) > 12 || Math.abs(v) > 150) return compositeValue(F, G, short);
  return {
    instruction: 'Evaluate',
    questionMath: [def(F, polyTex(pf)), def(G, polyTex(pg)), comp(outer, inner, n, short)].join(NL),
    answer: String(v),
    workingOut: [`${inner}(${n}) = ${subTex(pi, n)} = ${mid}`, `${outer}(${mid}) = ${subTex(po, mid)} = ${v}`].join(NL),
  };
}

function compositeExpression(F, G, short) {
  const [pf, pg] = pair(true);
  const [outer, inner, po, pi] = Math.random() < 0.5 ? [F, G, pf, pg] : [G, F, pg, pf];
  const result = compose(po, pi);
  const label = comp(outer, inner, 'x', short);
  return {
    instruction: `Find ${label} in simplest form`,
    questionMath: [def(F, polyTex(pf)), def(G, polyTex(pg))].join(NL),
    answer: `${label} = ${polyTex(result)}`,
    workingOut: [`${label} = ${outer}(${polyTex(pi)})`, `${label} = ${polyTex(result)}`].join(NL),
  };
}

function compositeSolve(F, G, short) {
  const pf = linear(), pg = linear();
  const [outer, inner, po, pi] = Math.random() < 0.5 ? [F, G, pf, pg] : [G, F, pg, pf];
  const t = nz(-6, 8);
  const result = compose(po, pi);
  const k = at(result, t);
  const label = comp(outer, inner, 'x', short);
  return {
    instruction: 'Find x',
    questionMath: [def(F, polyTex(pf)), def(G, polyTex(pg)), `${label} = ${k}`].join(NL),
    answer: `x = ${t}`,
    workingOut: [`${label} = ${polyTex(result)}`, `${polyTex(result)} = ${k}`, `x = ${t}`].join(NL),
  };
}

function selfComposite(F, short) {
  for (;;) {
    const a = _.sample([2, 3, 4, 5]) * _.sample([1, -1]);
    const b = nz(-9, 9);
    const A = a * a, B = a * b + b;
    const a2 = -a;
    if ((B % (a2 + 1)) !== 0 || B === 0) continue;
    const b2 = B / (a2 + 1);
    const sols = _.sortBy([[a, b], [a2, b2]], ([x]) => -x);
    return {
      instruction: 'Find all the possible values of a and b',
      questionMath: [`${F}(x) = ax + b`, `${comp(F, F, 'x', short)} = ${polyTex([B, A])}`].join(NL),
      answer: sols.map(([x, y]) => `a = ${x}, \\ b = ${y}`).join(' \\text{ or } '),
      workingOut: [
        `${comp(F, F, 'x', short)} = a(ax + b) + b = a^2x + ab + b`,
        `a^2 = ${A}`,
        ...sols.map(([x, y]) => `a = ${x}: \\ ${polyTex([0, x + 1], 'b')} = ${B}, \\ b = ${y}`),
      ].join(NL),
    };
  }
}

/* -------------------------------------------------- inverse functions */
//   Foundation  two operations: 3x + 2, (x + 4)/5, 3(x - 1)
//   Core        three operations or a reversal: (5x - 2)/3, 7 - 2x; or
//               evaluate the inverse at a number (Rayner 5.2)
//   Stretch     x on top and bottom: (2x + 1)/(x - 3); or solve
//               f(x) = f^{-1}(x)
export const generateInverseFunctions = (options = {}) => {
  const { difficulty = 'core' } = options;
  const name = one();
  let q;
  if (difficulty === 'foundation') q = inverseTwoStep(name);
  else if (difficulty === 'core') q = _.sample([inverseFraction, inverseReversed, inverseValue])(name);
  else q = Math.random() < 0.6 ? inverseRational(name) : inverseMeetsSelf(name);
  return { ...q, metadata: { topic: 'inverse-functions', difficulty } };
};

const INV_I = 'Find the inverse function';
const frac = (n, d) => `\\frac{${n}}{${d}}`;

function inverseTwoStep(name) {
  const a = _.random(2, 9), b = nz(-12, 12);
  const sb = (v) => (v < 0 ? `- ${-v}` : `+ ${v}`);
  const form = _.sample(['ax+b', '(x+b)/a', 'a(x+b)']);
  let body, inv, steps;
  if (form === 'ax+b') {
    body = `${a}x ${sb(b)}`; inv = frac(`x ${sb(-b)}`, a);
    steps = [`y = ${body}`, `${a}x = y ${sb(-b)}`, `x = ${frac(`y ${sb(-b)}`, a)}`];
  } else if (form === '(x+b)/a') {
    body = frac(`x ${sb(b)}`, a); inv = `${a}x ${sb(-b)}`;
    steps = [`y = ${body}`, `x ${sb(b)} = ${a}y`, `x = ${a}y ${sb(-b)}`];
  } else {
    body = `${a}(x ${sb(b)})`; inv = `${frac('x', a)} ${sb(-b)}`;
    steps = [`y = ${body}`, `x ${sb(b)} = ${frac('y', a)}`, `x = ${frac('y', a)} ${sb(-b)}`];
  }
  return {
    instruction: INV_I,
    questionMath: def(name, body),
    answer: `${name}^{-1}(x) = ${inv}`,
    workingOut: [...steps, `${name}^{-1}(x) = ${inv}`].join(NL),
  };
}

function inverseFraction(name) {
  for (;;) {
    const a = _.random(2, 7), b = nz(-9, 9), c = _.random(2, 6);
    if (a === c) continue;
    const body = frac(polyTex([b, a]), c);
    const inv = frac(polyTex([-b, c]), a);
    return {
      instruction: INV_I,
      questionMath: def(name, body),
      answer: `${name}^{-1}(x) = ${inv}`,
      workingOut: [`y = ${body}`, `${c}y = ${polyTex([b, a])}`, `x = ${frac(polyTex([-b, c], 'y'), a)}`, `${name}^{-1}(x) = ${inv}`].join(NL),
    };
  }
}

function inverseReversed(name) {
  const a = _.random(2, 9), b = _.random(1, 15);
  const body = linTex(b, -a);
  const inv = frac(linTex(b, -1), a);
  return {
    instruction: INV_I,
    questionMath: def(name, body),
    answer: `${name}^{-1}(x) = ${inv}`,
    workingOut: [`y = ${body}`, `${a}x = ${linTex(b, 0)} - y`, `x = ${frac(`${b} - y`, a)}`, `${name}^{-1}(x) = ${inv}`].join(NL),
  };
}

function inverseValue(name) {
  const [b, a] = linear();
  const t = nz(-6, 9);
  const k = a * t + b;
  return {
    instruction: 'Evaluate',
    questionMath: `${name}^{-1}(${k}) \\text{ when } ${def(name, polyTex([b, a]), false)}`,
    answer: `${name}^{-1}(${k}) = ${t}`,
    workingOut: [`${polyTex([b, a])} = ${k}`, `x = ${t}`].join(NL),
  };
}

// (ax + b)/(x + c) has inverse (b - cx)/(x - a).
function inverseRational(name) {
  for (;;) {
    const a = nz(-5, 5), b = nz(-9, 9), c = nz(-6, 6);
    if (a * c === b) continue;   // constant, not a function with an inverse
    if (a === -c) continue;      // its own inverse: the answer would repeat the question
    if (a < 0 && b < 0) continue;
    const body = frac(linTex(b, a), polyTex([c, 1]));
    const inv = frac(linTex(b, -c), polyTex([-a, 1]));
    return {
      instruction: INV_I,
      questionMath: def(name, body),
      answer: `${name}^{-1}(x) = ${inv}`,
      workingOut: [
        `y = ${body}`,
        `y(x ${c < 0 ? '-' : '+'} ${Math.abs(c)}) = ${linTex(b, a)}`,
        `x(y ${a < 0 ? '+' : '-'} ${Math.abs(a)}) = ${linTex(b, -c).replace(/x/g, 'y')}`,
        `${name}^{-1}(x) = ${inv}`,
      ].join(NL),
    };
  }
}

// A linear f meets its inverse on y = x: (ax + b)/c = x.
function inverseMeetsSelf(name) {
  for (;;) {
    const c = _.random(2, 6), a = _.random(1, 9), t = nz(-8, 8);
    if (a === c) continue;
    const b = (c - a) * t;
    if (b === 0) continue;
    const body = frac(polyTex([b, a]), c);
    return {
      instruction: 'Solve',
      questionMath: `${name}(x) = ${name}^{-1}(x) \\text{ when } ${def(name, body, false)}`,
      answer: `x = ${t}`,
      workingOut: [`${name}^{-1}(x) = ${frac(polyTex([-b, c]), a)}`, `${frac(polyTex([b, a]), c)} = ${frac(polyTex([-b, c]), a)}`, `x = ${t}`].join(NL),
    };
  }
}

/* ------------------------------------------ the absolute value function */
//   Foundation  evaluate: |2x + 3| when x = -4, or |a + b| with a and b
//               given (Haese 19F Example 7)
//   Core        solve |x + 1| = 3, |2 - x| = 5, |x| + 1 = 7: two answers
//               (Haese 19F.1 Q4)
//   Stretch     solve |px + q| = mx + d: both candidates checked, and
//               sometimes one is rejected
export const generateAbsoluteValue = (options = {}) => {
  const { difficulty = 'core' } = options;
  let q;
  if (difficulty === 'foundation') q = Math.random() < 0.6 ? absEvaluateX() : absEvaluateAB();
  else if (difficulty === 'core') q = absSolve();
  else q = absAgainstLine();
  return { ...q, metadata: { topic: 'absolute-value', difficulty } };
};

const abs = (t) => `\\lvert ${t} \\rvert`;

function absEvaluateX() {
  for (;;) {
    const x = _.random(-8, -1);
    const p = _.sample([[nz(-9, 9), 1], [nz(-9, 9), _.sample([2, 3, -2, -3])], [_.random(1, 9), -1], [0, -_.random(2, 7), 1]]);
    const v = at(p, x);
    if (v >= 0 && Math.random() < 0.7) continue;   // mostly a negative inside
    return {
      instruction: 'Evaluate',
      questionMath: `${abs(p.length === 2 ? linTex(p[0], p[1]) : polyTex(p))}${NL}x = ${x}`,
      answer: String(Math.abs(v)),
      workingOut: `${abs(subTex(p, x))} = ${abs(v)} = ${Math.abs(v)}`,
    };
  }
}

const AB = [
  { tex: abs('a + b'), f: (a, b) => Math.abs(a + b) },
  { tex: abs('a - b'), f: (a, b) => Math.abs(a - b) },
  { tex: abs('ab'), f: (a, b) => Math.abs(a * b) },
  { tex: `${abs('a')} - ${abs('b')}`, f: (a, b) => Math.abs(a) - Math.abs(b) },
  { tex: `${abs('a')} + ${abs('b')}`, f: (a, b) => Math.abs(a) + Math.abs(b) },
];

function absEvaluateAB() {
  const a = -_.random(2, 9), b = _.random(2, 9);
  const e = _.sample(AB);
  const v = e.f(a, b);
  return {
    instruction: 'Evaluate',
    questionMath: `${e.tex}${NL}a = ${a},\\ b = ${b}`,
    answer: String(v),
    workingOut: `${e.tex} = ${v}`,
  };
}

const orTex = (xs) => xs.map((x) => `x = ${x}`).join(' \\text{ or } ');

function absSolve() {
  if (Math.random() < 0.25) {
    // |x| + k = r + k, or c - |x| = c - r (Haese 19F.1 Q4d, g).
    const r = _.random(1, 12), k = _.random(1, 9);
    const questionMath = Math.random() < 0.5
      ? `${abs('x')} + ${k} = ${r + k}`
      : `${r + k} - ${abs('x')} = ${k}`;
    return {
      instruction: 'Solve',
      questionMath,
      answer: orTex([-r, r]),
      workingOut: [`${abs('x')} = ${r}`, orTex([-r, r])].join(NL),
    };
  }
  for (;;) {
    const p = _.sample([1, 1, -1, 2, 3]);
    const r = _.random(1, 12);
    if ((2 * r) % p !== 0) continue;
    const x1 = _.random(-8, 10);
    const q = r - p * x1;
    const x2 = (-r - q) / p;
    if (q === 0) continue;
    const xs = _.sortBy([x1, x2]);
    const inside = linTex(q, p);
    return {
      instruction: 'Solve',
      questionMath: `${abs(inside)} = ${r}`,
      answer: orTex(xs),
      workingOut: [`${inside} = ${r} \\text{ or } ${inside} = -${r}`, orTex(xs)].join(NL),
    };
  }
}

// |px + q| = mx + d. The two cases give x1 = (d - q)/(p - m) and
// x2 = -(d + q)/(p + m); each stands only if mx + d >= 0 there. When the
// line is shallower than the V (|m| < |p|) the two stand or fall together,
// so both answers stand; when it is steeper, exactly one can, and the other
// is rejected.
function absAgainstLine() {
  const keepBoth = Math.random() < 0.6;
  for (;;) {
    const [p, m] = keepBoth ? [_.sample([2, 3, -2, -3]), 1] : _.sample([[1, 2], [-1, 2], [1, 3], [-1, 3], [2, 3], [-2, 3]]);
    const x1 = _.random(-6, 8), x2 = _.random(-6, 8);
    if (x1 === x2) continue;
    const twoD = (p - m) * x1 - (p + m) * x2;
    const twoQ = -(p + m) * x2 - (p - m) * x1;
    if (twoD % 2 || twoQ % 2) continue;
    const d = twoD / 2, q = twoQ / 2;
    if (q === 0 || d === 0) continue;
    const r1 = m * x1 + d, r2 = m * x2 + d;
    if (r1 === 0 || r2 === 0) continue;
    const ok1 = r1 > 0, ok2 = r2 > 0;
    if (!ok1 && !ok2) continue;
    if (keepBoth !== (ok1 && ok2)) continue;
    const valid = _.sortBy([ok1 ? x1 : null, ok2 ? x2 : null].filter((v) => v != null));
    const rejected = !ok1 ? x1 : !ok2 ? x2 : null;
    const inside = linTex(q, p);
    const rhs = polyTex([d, m]);
    const lines = [
      `${inside} = ${rhs} \\text{ gives } x = ${x1}`,
      `${inside} = -(${rhs}) \\text{ gives } x = ${x2}`,
    ];
    if (rejected != null) lines.push(`x = ${rejected} \\text{ makes } ${rhs} \\text{ negative, so reject it}`);
    return {
      instruction: 'Solve',
      questionMath: `${abs(inside)} = ${rhs}`,
      answer: valid.length === 2 ? orTex(valid) : `x = ${valid[0]} \\text{ only}`,
      workingOut: lines.join(NL),
    };
  }
}

/* ----------------------------------------------- reciprocal functions */
//   Foundation  the asymptotes of y = k/(x - a); or k from a point on
//               y = k/x (Haese 19E Q3)
//   Core        the asymptotes of y = k/(x - a) + b (Haese 19E Q4)
//   Stretch     the asymptotes of y = (bx + c)/(x - a), rewritten first;
//               or k from the asymptotes and a point
export const generateReciprocalFunctions = (options = {}) => {
  const { difficulty = 'core' } = options;
  let q;
  if (difficulty === 'foundation') q = Math.random() < 0.6 ? asymptotes(false) : kFromPoint();
  else if (difficulty === 'core') q = asymptotes(true);
  else q = Math.random() < 0.6 ? asymptotesRational() : kFromAsymptotes();
  return { ...q, metadata: { topic: 'reciprocal-functions', difficulty } };
};

const ASY = 'Find the equations of the asymptotes';
const asyAnswer = (a, b) => `x = ${a}, \\quad y = ${b}`;
const shift = (b) => (b < 0 ? ` - ${-b}` : ` + ${b}`);

function asymptotes(withShift) {
  const k = nz(-9, 9), a = nz(-6, 6), b = withShift ? nz(-8, 8) : 0;
  return {
    instruction: ASY,
    questionMath: `y = ${frac(k, polyTex([-a, 1]))}${withShift ? shift(b) : ''}`,
    answer: asyAnswer(a, b),
    workingOut: [`x ${a < 0 ? '+' : '-'} ${Math.abs(a)} = 0 \\text{ when } x = ${a}`, `\\text{as } x \\text{ grows}, \\ y \\to ${b}`].join(NL),
  };
}

function kFromPoint() {
  const p = nz(-6, 6), q = nz(-8, 8);
  return {
    instruction: 'Find k',
    questionMath: `y = ${frac('k', 'x')} \\text{ passes through } (${p}, ${q})`,
    questionMathCompact: true,
    answer: `k = ${p * q}`,
    workingOut: [`${q} = ${frac('k', p)}`, `k = ${p * q}`].join(NL),
  };
}

// (bx + c)/(x - a) = b + (c + ab)/(x - a).
function asymptotesRational() {
  for (;;) {
    const a = nz(-6, 6), b = nz(-5, 5), c = nz(-9, 9);
    const k = c + a * b;
    if (k === 0) continue;
    return {
      instruction: ASY,
      questionMath: `y = ${frac(polyTex([c, b]), polyTex([-a, 1]))}`,
      answer: asyAnswer(a, b),
      workingOut: `y = ${b} ${k < 0 ? '-' : '+'} ${frac(Math.abs(k), polyTex([-a, 1]))}`,
    };
  }
}

function kFromAsymptotes() {
  const a = nz(-5, 5), b = nz(-6, 6), k = nz(-12, 12);
  const dx = _.sample([1, 2, 3, 4, 6].filter((d) => k % d === 0)) * _.sample([1, -1]);
  const px = a + dx, py = b + k / dx;
  return {
    instruction: 'Find k',
    questionMath: [`y = ${frac('k', 'x - a')} + b \\text{ has asymptotes } x = ${a} \\text{ and } y = ${b}`, `\\text{and passes through } (${px}, ${py})`].join(NL),
    questionMathCompact: true,
    answer: `k = ${k}`,
    workingOut: [`y = ${frac('k', polyTex([-a, 1]))}${shift(b)}`, `${py} = ${frac('k', px - a)}${shift(b)}`, `k = ${k}`].join(NL),
  };
}
