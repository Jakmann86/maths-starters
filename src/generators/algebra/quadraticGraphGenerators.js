// Quadratic functions and their graphs — Haese 21D-H.
//
//   quadratic-substitution   21D  y from x, then x from y
//   quadratic-vertex-form    21E  the vertex of y = a(x - h)^2 + k
//   quadratic-intercepts     21F  where the curve meets the axes
//   quadratic-symmetry       21G  line of symmetry, then the vertex
//   quadratic-find-function  21H  the function from its features
//
// The drawn graphs use `coordinate-grid` with a `curves` entry and a
// `window`, so they are to scale like every coordinate-grid: an intercept the
// question reads off sits on a gridline.
//
// Every quadratic is built from its answer (roots, or vertex and a), so
// every printed coefficient is a whole number and every answer is exact.

import _ from 'lodash';
import { gcd } from '../shared';

const NL = '\n';

const nonZero = (lo, hi) => {
  let n = 0;
  while (n === 0) n = _.random(lo, hi);
  return n;
};

/** n/d in lowest terms, sign out in front. */
const frac = (n, d) => {
  if (d < 0) { n = -n; d = -d; }
  const g = gcd(n, d) || 1;
  const [nn, dd] = [n / g, d / g];
  if (dd === 1) return `${nn}`;
  return nn < 0 ? `-\\frac{${-nn}}{${dd}}` : `\\frac{${nn}}{${dd}}`;
};

/** ax^2 + bx + c with the signs a student would see. */
const quad = (a, b, c) => {
  const t = [];
  t.push(a === 1 ? 'x^2' : a === -1 ? '-x^2' : `${a}x^2`);
  if (b !== 0) t.push(`${b < 0 ? '-' : '+'} ${Math.abs(b) === 1 ? '' : Math.abs(b)}x`);
  if (c !== 0) t.push(`${c < 0 ? '-' : '+'} ${Math.abs(c)}`);
  return t.join(' ');
};

const lead = (a) => (a === 1 ? '' : a === -1 ? '-' : `${a}`);

/** (x - r), or x when r is 0. */
const factor = (r) => (r === 0 ? 'x' : `(x ${r < 0 ? '+' : '-'} ${Math.abs(r)})`);

/** a(x - p)(x - q), or a(x - p)^2 when the roots agree. x first if a root is 0. */
const factored = (a, p, q) => {
  if (p === q) return `${lead(a)}${p === 0 ? 'x^2' : `${factor(p)}^2`}`;
  const [r, s] = q === 0 ? [q, p] : [p, q];
  return `${lead(a)}${factor(r)}${factor(s)}`;
};

/** a(x - h)^2 + k. */
const turning = (a, h, k) => {
  const sq = h === 0 ? 'x^2' : `${factor(h)}^2`;
  return `${lead(a)}${sq}${k === 0 ? '' : ` ${k < 0 ? '-' : '+'} ${Math.abs(k)}`}`;
};

const pt = (x, y) => `(${x}, ${y})`;
// The same in the instruction, which is Archivo, not KaTeX: a true minus
// sign, not the hyphen KaTeX would have turned into one.
const minus = (v) => String(v).replace('-', '\u2212');
const ptText = (x, y) => `(${minus(x)}, ${minus(y)})`;

/** The roots in Haese's form, smaller first. */
const rootList = (p, q) => (p === q ? `${p}` : `${Math.min(p, q)} \\text{ and } ${Math.max(p, q)}`);

/** Substitution written out: a(x)^2 + b(x) + c with x bracketed. */
const subst = (a, b, c, x) => {
  const t = [`${lead(a)}(${x})^2`];
  if (b !== 0) t.push(`${b < 0 ? '-' : '+'} ${Math.abs(b) === 1 ? '' : Math.abs(b)}(${x})`);
  if (c !== 0) t.push(`${c < 0 ? '-' : '+'} ${Math.abs(c)}`);
  return t.join(' ');
};

/**
 * A window [x0, x1, y0, y1] covering every x and y given, the origin
 * included, padded by a square, and at least six squares each way.
 */
const windowFor = (xs, ys) => {
  let x0 = Math.floor(Math.min(0, ...xs)) - 1;
  let x1 = Math.ceil(Math.max(0, ...xs)) + 1;
  let y0 = Math.floor(Math.min(0, ...ys)) - 1;
  let y1 = Math.ceil(Math.max(0, ...ys)) + 1;
  while (x1 - x0 < 6) { x0 -= 1; x1 += 1; }
  while (y1 - y0 < 6) { y0 -= 1; y1 += 1; }
  return [x0, x1, y0, y1];
};

/**
 * The graph of y = a(x - p)(x - q), with the x-intercepts dotted. The window
 * covers the intercepts and the vertex, not the y-intercept: the curve is
 * clipped where it leaves, as any graph is, and a window tall enough for
 * the y-intercept draws every square too small to count from the back.
 */
const graphOf = (a, p, q) => {
  const b = -a * (p + q);
  const c = a * p * q;
  const h = (p + q) / 2;
  const k = a * (h - p) * (h - q);
  return {
    type: 'coordinate-grid',
    curves: [{ a, b, c }],
    points: _.uniq([p, q]).map((r) => ({ x: r, y: 0 })),
    window: windowFor([p, q, h], [k]),
    big: true,
  };
};

/* ------------------------------------------------ 21D: substituting */

export const generateQuadraticSubstitution = (options = {}) => {
  const { difficulty = 'core' } = options;

  if (difficulty === 'foundation' || difficulty === 'core') {
    // Foundation: monic, x positive (Haese 21D Q2a). Core: a leading
    // coefficient, often negative, and x negative (Q2b-d), where the
    // bracket round (-3)^2 is the whole point.
    const F = difficulty === 'foundation';
    const a = F ? 1 : _.sample([2, 3, 4, 5, -1, -2, -3]);
    const b = nonZero(-9, 9);
    const c = nonZero(-12, 12);
    const x = F ? _.random(1, 6) : -_.random(1, 5);
    const y = a * x * x + b * x + c;
    return {
      // The condition is words, so it goes with the instruction; KaTeX
      // keeps the formula alone.
      instruction: `Find the value of y when x = ${minus(x)}`,
      questionMath: `y = ${quad(a, b, c)}`,
      answer: `y = ${y}`,
      workingOut: [
        `y = ${subst(a, b, c, x)}`,
        `y = ${a * x * x} ${b * x < 0 ? '-' : '+'} ${Math.abs(b * x)} ${c < 0 ? '-' : '+'} ${Math.abs(c)}`,
        `y = ${y}`,
      ].join(NL),
      visualization: null,
      metadata: { topic: 'quadratic-substitution', difficulty },
    };
  }

  // Stretch: x from y (Haese Example 9, 21D Q4). y = k leaves a quadratic
  // to solve, which may have one root. Built from its roots.
  const p = _.random(-7, 7);
  const q = Math.random() < 0.2 ? p : _.random(-7, 7);
  const b = -(p + q);
  const pq = p * q;
  const k = nonZero(-12, 12);
  const c = pq + k;
  if (b === 0 || c === 0) return generateQuadraticSubstitution(options);
  return {
    instruction: `Find the value or values of x when y = ${minus(k)}`,
    questionMath: `y = ${quad(1, b, c)}`,
    answer: p === q ? `x = ${p}` : `x = ${Math.min(p, q)} \\text{ or } ${Math.max(p, q)}`,
    workingOut: [
      `${quad(1, b, c)} = ${k}`,
      `${quad(1, b, pq)} = 0`,
      `${factored(1, p, q)} = 0`,
      p === q ? `x = ${p}` : `x = ${Math.min(p, q)} \\text{ or } ${Math.max(p, q)}`,
    ].join(NL),
    visualization: null,
    metadata: { topic: 'quadratic-substitution', difficulty },
  };
};

/* --------------------------------------- 21E: vertex of a(x - h)^2 + k */

export const generateQuadraticVertexForm = (options = {}) => {
  const { difficulty = 'core' } = options;

  if (difficulty === 'foundation') {
    // One shift: y = x^2 + k or y = (x - h)^2 (Haese 21E.2 Q1-2), either
    // way up, since the sign of a never moves the vertex.
    const a = _.sample([1, -1]);
    const vertical = Math.random() < 0.5;
    const h = vertical ? 0 : nonZero(-8, 8);
    const k = vertical ? nonZero(-9, 9) : 0;
    return {
      instruction: 'Write down the coordinates of the vertex',
      questionMath: `y = ${turning(a, h, k)}`,
      answer: pt(h, k),
      workingOut: `h = ${h}, \\; k = ${k}${NL}${pt(h, k)}`,
      visualization: null,
      metadata: { topic: 'quadratic-vertex-form', difficulty },
    };
  }

  const h = nonZero(-6, 6);
  const k = nonZero(-9, 9);

  if (difficulty === 'core') {
    // Both shifts (Haese 21E.2 Q3, Example 14): the sign of h is the trap.
    const a = _.sample([1, -1]);
    return {
      instruction: 'Write down the coordinates of the vertex',
      questionMath: `y = ${turning(a, h, k)}`,
      answer: pt(h, k),
      workingOut: `h = ${h}, \\; k = ${k}${NL}${pt(h, k)}`,
      visualization: null,
      metadata: { topic: 'quadratic-vertex-form', difficulty },
    };
  }

  // Stretch: a non-unit a, and the y-intercept as well (Haese Review 21A
  // Q10), which means substituting x = 0 through the bracket.
  const a = _.sample([2, 3, -2, -3]);
  const hh = nonZero(-5, 5);
  const kk = nonZero(-12, 12);
  const c = a * hh * hh + kk;
  return {
    instruction: 'Find the vertex and the y-intercept',
    questionMath: `y = ${turning(a, hh, kk)}`,
    answer: `\\text{vertex } ${pt(hh, kk)}${NL}y\\text{-intercept } ${c}`,
    workingOut: [
      `\\text{vertex } ${pt(hh, kk)}`,
      `y = ${lead(a)}(0 ${hh < 0 ? '+' : '-'} ${Math.abs(hh)})^2 ${kk < 0 ? '-' : '+'} ${Math.abs(kk)}`,
      `y = ${a * hh * hh} ${kk < 0 ? '-' : '+'} ${Math.abs(kk)} = ${c}`,
    ].join(NL),
    visualization: null,
    metadata: { topic: 'quadratic-vertex-form', difficulty },
  };
};

/* ---------------------------------------------------- 21F: intercepts */

export const generateQuadraticIntercepts = (options = {}) => {
  const { difficulty = 'core' } = options;

  if (difficulty === 'foundation') {
    // Factorised form (Haese Example 15, 21F.1 Q2): the roots are read off,
    // the trap is the sign. A repeated root now and then: it touches.
    const a = _.sample([1, 1, 2, 3, -1, -2, -3]);
    const p = _.random(-8, 8);
    const q = Math.random() < 0.15 ? p : _.random(-8, 8);
    if (p === 0 && q === 0) return generateQuadraticIntercepts(options);
    const one = p === q;
    return {
      instruction: one ? 'Find the x-intercept' : 'Find the x-intercepts',
      questionMath: `y = ${factored(a, p, q)}`,
      answer: rootList(p, q),
      workingOut: `${factored(a, p, q)} = 0${NL}x = ${one ? p : `${Math.min(p, q)} \\text{ or } ${Math.max(p, q)}`}`,
      visualization: null,
      metadata: { topic: 'quadratic-intercepts', difficulty },
    };
  }

  if (difficulty === 'core') {
    // Expanded and monic (Haese Example 16a, 21F.1 Q3): factorise first.
    // Roots of opposite sign give the difference of two squares; a zero
    // root gives x(x - k).
    for (;;) {
      const p = _.random(-9, 9);
      const q = Math.random() < 0.12 ? p : _.random(-9, 9);
      const b = -(p + q);
      const c = p * q;
      if (b === 0 && c === 0) continue;
      const one = p === q;
      return {
        instruction: one ? 'Find the x-intercept' : 'Find the x-intercepts',
        questionMath: `y = ${quad(1, b, c)}`,
        answer: rootList(p, q),
        workingOut: `${quad(1, b, c)} = 0${NL}${factored(1, p, q)} = 0${NL}x = ${one ? p : `${Math.min(p, q)} \\text{ or } ${Math.max(p, q)}`}`,
        visualization: null,
        metadata: { topic: 'quadratic-intercepts', difficulty },
      };
    }
  }

  // Stretch: both axes, from an expanded form that needs more than a monic
  // factorisation (Haese 21F.1 Q3f-g, 21F.2 Q2i): a common factor first,
  // often negative, or a non-monic quadratic with a fractional root.
  for (;;) {
    let A; let B; let C; let roots; let work;
    if (Math.random() < 0.5) {
      const a = _.sample([-1, -2, -3, 2, 3]);
      const p = nonZero(-6, 6);
      const q = Math.random() < 0.15 ? p : nonZero(-6, 6);
      [A, B, C] = [a, -a * (p + q), a * p * q];
      roots = p === q ? [p] : [Math.min(p, q), Math.max(p, q)];
      work = `${quad(A, B, C)} = 0${NL}${factored(a, p, q)} = 0`;
    } else {
      // (mx - n)(x - r): roots n/m and r, m in 2..3, n prime to m.
      const m = _.sample([2, 3]);
      const n = nonZero(-7, 7);
      const r = nonZero(-6, 6);
      if (gcd(n, m) !== 1) continue;
      [A, B, C] = [m, -(n + m * r), n * r];
      roots = [n / m, r].sort((u, v) => u - v);
      const first = `(${m}x ${n < 0 ? '+' : '-'} ${Math.abs(n)})`;
      work = `${quad(A, B, C)} = 0${NL}${first}${factor(r)} = 0`;
    }
    if (B === 0 || C === 0) continue;
    const show = (v) => (Number.isInteger(v) ? `${v}` : frac(Math.round(v * 6), 6));
    const xs = roots.length === 1 ? show(roots[0]) : `${show(roots[0])} \\text{ and } ${show(roots[1])}`;
    return {
      instruction: 'Find the axes intercepts',
      questionMath: `y = ${quad(A, B, C)}`,
      answer: `x\\text{-intercept${roots.length === 1 ? '' : 's'} } ${xs}${NL}y\\text{-intercept } ${C}`,
      workingOut: `${work}${NL}x = ${roots.map(show).join(' \\text{ or } ')}${NL}x = 0: \\; y = ${C}`,
      visualization: null,
      metadata: { topic: 'quadratic-intercepts', difficulty },
    };
  }
};

/* ------------------------------------------ 21G: line of symmetry, vertex */

export const generateQuadraticSymmetry = (options = {}) => {
  const { difficulty = 'core' } = options;

  if (difficulty === 'foundation') {
    // Midway between the x-intercepts (Haese Example 22-23): read off a
    // drawn graph, or from the factorised form.
    if (Math.random() < 0.5) {
      // The graph: intercepts on gridlines, an even gap so the line of
      // symmetry is a gridline too, and no deeper than four squares so the
      // grid stays legible.
      for (;;) {
        const a = _.sample([1, -1]);
        const p = _.random(-6, 4);
        const q = p + _.sample([2, 4]);
        if (q > 6) continue;
        const h = (p + q) / 2;
        return {
          instruction: 'Find the equation of the line of symmetry',
          answer: `x = ${h}`,
          workingOut: `x\\text{-intercepts } ${p} \\text{ and } ${q}${NL}x = \\frac{${p} + ${q}}{2}${NL}x = ${h}`,
          visualization: graphOf(a, p, q),
          metadata: { topic: 'quadratic-symmetry', difficulty },
        };
      }
    }
    const a = _.sample([1, 2, 3, -1, -2]);
    const p = _.random(-8, 8);
    let q = _.random(-8, 8);
    while (q === p) q = _.random(-8, 8);
    return {
      instruction: 'Find the equation of the line of symmetry',
      questionMath: `y = ${factored(a, p, q)}`,
      answer: `x = ${frac(p + q, 2)}`,
      workingOut: `x\\text{-intercepts } ${Math.min(p, q)} \\text{ and } ${Math.max(p, q)}${NL}x = \\frac{${Math.min(p, q)} + ${Math.max(p, q)}}{2}${NL}x = ${frac(p + q, 2)}`,
      visualization: null,
      metadata: { topic: 'quadratic-symmetry', difficulty },
    };
  }

  if (difficulty === 'core') {
    // x = -b/2a from the expanded form (Haese Example 19, 21G Q1), the
    // answer whole or a fraction.
    const a = _.sample([1, 2, 3, 4, -1, -2, -3]);
    const b = nonZero(-12, 12);
    const c = _.random(-9, 9);
    return {
      instruction: 'Find the equation of the line of symmetry',
      questionMath: `y = ${quad(a, b, c)}`,
      answer: `x = ${frac(-b, 2 * a)}`,
      // The unsimplified line only when it simplifies.
      workingOut: [
        'x = \\frac{-b}{2a}',
        ...(gcd(b, 2 * a) === 1 && a > 0 ? [] : [`x = \\frac{${-b}}{${2 * a}}`]),
        `x = ${frac(-b, 2 * a)}`,
      ].join(NL),
      visualization: null,
      metadata: { topic: 'quadratic-symmetry', difficulty },
    };
  }

  // Stretch: the vertex (Haese Example 20, 21G Q2): x = -b/2a, then
  // substitute. Built from a whole-number vertex.
  const a = _.sample([1, 2, 3, -1, -2, -3]);
  const h = nonZero(-5, 5);
  const k = _.random(-12, 12);
  const b = -2 * a * h;
  const c = a * h * h + k;
  if (c === 0) return generateQuadraticSymmetry(options);
  return {
    instruction: 'Find the coordinates of the vertex',
    questionMath: `y = ${quad(a, b, c)}`,
    answer: pt(h, k),
    workingOut: [
      `x = \\frac{${-b}}{${2 * a}} = ${h}`,
      `y = ${subst(a, b, c, h)}`,
      `y = ${k}`,
      pt(h, k),
    ].join(NL),
    visualization: null,
    metadata: { topic: 'quadratic-symmetry', difficulty },
  };
};

/* ----------------------------------------- 21H: finding the function */

// a(x - h)^2 + k with a still unknown, and the same with a value put in for
// x (bracketed, so the working line reads back unambiguously).
const tpBody = (h, k) => `a${factor(h)}^2 ${k < 0 ? '-' : '+'} ${Math.abs(k)}`;
const at0 = (body, x) => body.replace(/x/g, `(${x})`);

export const generateQuadraticFindFunction = (options = {}) => {
  const { difficulty = 'core' } = options;

  if (difficulty === 'foundation') {
    // a = 1 (Haese 21H Q1-2): from the x-intercepts, given or drawn, or
    // from the vertex.
    const kind = _.sample(['graph', 'roots', 'vertex']);
    if (kind === 'vertex') {
      const h = nonZero(-5, 5);
      const k = _.random(-9, 9);
      const b = -2 * h;
      const c = h * h + k;
      return {
        instruction: `Find b and c given the vertex ${ptText(h, k)}`,
        questionMath: 'y = x^2 + bx + c',
        answer: `y = ${quad(1, b, c)}`,
        workingOut: `y = ${turning(1, h, k)}${NL}y = ${quad(1, b, c)}`,
        visualization: null,
        metadata: { topic: 'quadratic-find-function', difficulty },
      };
    }
    for (;;) {
      const p = _.random(-6, 5);
      const q = _.random(p + 1, 6);
      const b = -(p + q);
      const c = p * q;
      if (kind === 'graph' && q - p > 4) continue;
      return {
        instruction: kind === 'graph'
          ? 'Find the equation of the curve'
          : `Find b and c given the x-intercepts ${minus(p)} and ${minus(q)}`,
        questionMath: 'y = x^2 + bx + c',
        answer: `y = ${quad(1, b, c)}`,
        workingOut: `y = ${factored(1, p, q)}${NL}y = ${quad(1, b, c)}`,
        visualization: kind === 'graph' ? { ...graphOf(1, p, q), hug: true } : null,
        metadata: { topic: 'quadratic-find-function', difficulty },
      };
    }
  }

  if (difficulty === 'core') {
    // The vertex and the y-intercept (Haese Example 24a, 21H Q4): a is
    // what is unknown.
    const a = _.sample([1, 2, 3, -1, -2, -3]);
    const h = nonZero(-4, 4);
    const k = nonZero(-12, 12);
    const d = a * h * h + k;
    if (d === 0) return generateQuadraticFindFunction(options);
    return {
      instruction: `Find a, h and k given the vertex ${ptText(h, k)} and the y-intercept ${minus(d)}`,
      questionMath: 'y = a(x - h)^2 + k',
      answer: `y = ${turning(a, h, k)}`,
      workingOut: [
        `y = ${tpBody(h, k)}`,
        `${d} = ${at0(tpBody(h, k), 0)}`,
        `${d} = ${h * h}a ${k < 0 ? '-' : '+'} ${Math.abs(k)}`,
        `a = ${a}`,
        `y = ${turning(a, h, k)}`,
      ].join(NL),
      visualization: null,
      metadata: { topic: 'quadratic-find-function', difficulty },
    };
  }

  // Stretch: a point that is not the y-intercept (Haese Example 24b-25,
  // 21H Q6, Q8): from the vertex, or from the x-intercepts to expanded form.
  for (;;) {
    const a = _.sample([2, 3, -1, -2, -3, 4]);
    if (Math.random() < 0.5) {
      const h = nonZero(-4, 4);
      const k = nonZero(-12, 12);
      const x = nonZero(-4, 4);
      if (x === h) continue;
      const y = a * (x - h) ** 2 + k;
      if (Math.abs(y) > 60) continue;
      return {
        instruction: `Find a, h and k given the vertex ${ptText(h, k)} and the point ${ptText(x, y)}`,
        questionMath: 'y = a(x - h)^2 + k',
        answer: `y = ${turning(a, h, k)}`,
        workingOut: [
          `y = ${tpBody(h, k)}`,
          `${y} = ${at0(tpBody(h, k), x)}`,
          `${y} = ${(x - h) ** 2}a ${k < 0 ? '-' : '+'} ${Math.abs(k)}`,
          `a = ${a}`,
          `y = ${turning(a, h, k)}`,
        ].join(NL),
        visualization: null,
        metadata: { topic: 'quadratic-find-function', difficulty },
      };
    }
    const p = _.random(-6, 5);
    const q = _.random(p + 1, 6);
    const x = nonZero(-5, 5);
    if (x === p || x === q) continue;
    const y = a * (x - p) * (x - q);
    if (Math.abs(y) > 60) continue;
    const B = -a * (p + q);
    const C = a * p * q;
    if (B === 0 || C === 0) continue;
    return {
      instruction: `Find a, b and c given the x-intercepts ${minus(p)} and ${minus(q)}, and the point ${ptText(x, y)}`,
      questionMath: 'y = ax^2 + bx + c',
      answer: `y = ${quad(a, B, C)}`,
      workingOut: [
        `y = a${factored(1, p, q)}`,
        `${y} = ${at0(`a${factored(1, p, q)}`, x)}`,
        `${y} = ${(x - p) * (x - q)}a`,
        `a = ${a}`,
        `y = ${quad(a, B, C)}`,
      ].join(NL),
      visualization: null,
      metadata: { topic: 'quadratic-find-function', difficulty },
    };
  }
};
