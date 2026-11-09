// src/generators/geometry/vectorGenerators.js
//
// Haese 24A-H and Rayner 11.1-11.5: vectors for Year 10 IGCSE 0607. The
// topic is "Vectors". The bearings and velocity problems of Haese 24C-D
// (wind, rivers, aircraft) are left out: they are trigonometry.
//
// Vectors are bold (\mathbf{a}), as the books and the exam papers print
// them; a vector between two points is \overrightarrow{AB}. The plain-text
// instruction cannot set either, so a question names the vector it asks
// for in questionMath. Exact magnitudes are given in simplest surd form.

import _ from 'lodash';

const NL = '\n';

/* ----------------------------------------------------------- notation */

export const col = ([x, y]) => `\\begin{pmatrix} ${x} \\\\ ${y} \\end{pmatrix}`;
const bf = (n) => `\\mathbf{${n}}`;
const arrow = (p, q) => `\\overrightarrow{${p}${q}}`;
const pt = ([x, y]) => `(${x}, ${y})`;
const paren = (v) => (v < 0 ? `(${v})` : String(v));
const add = (u, v) => [u[0] + v[0], u[1] + v[1]];
const sub = (u, v) => [u[0] - v[0], u[1] - v[1]];
const scale = (k, u) => [k * u[0], k * u[1]];
const nonZero = (lo, hi) => { for (;;) { const v = _.random(lo, hi); if (v) return v; } };

// sqrt(n) in simplest surd form: [outside, inside].
function surd(n) {
  let out = 1, inside = n;
  for (let f = 2; f * f <= inside; f += 1) {
    while (inside % (f * f) === 0) { inside /= f * f; out *= f; }
  }
  return [out, inside];
}
const surdTex = (n) => {
  const [o, i] = surd(n);
  if (i === 1) return String(o);
  return o === 1 ? `\\sqrt{${i}}` : `${o}\\sqrt{${i}}`;
};

/* ---------------------------------------------------------- fractions */

const gcd = (a, b) => { a = Math.abs(a); b = Math.abs(b); while (b) [a, b] = [b, a % b]; return a || 1; };
const F = (n, d = 1) => { const g = gcd(n, d) * Math.sign(d); return [n / g, d / g]; };
const fAdd = (p, q) => F(p[0] * q[1] + q[0] * p[1], p[1] * q[1]);
const fMul = (p, q) => F(p[0] * q[0], p[1] * q[1]);
const fNeg = (p) => [-p[0], p[1]];
const isZero = (p) => p[0] === 0;

// A coefficient in front of a vector: 1 -> '', -1 -> '-', 1/2 -> \frac{1}{2}.
function coefTex(c) {
  const [n, d] = c;
  const sign = n < 0 ? '-' : '';
  const a = Math.abs(n);
  if (d === 1) return a === 1 ? sign : `${sign}${a}`;
  return `${sign}\\frac{${a}}{${d}}`;
}

// A combination of two named vectors, c1·u + c2·v, tidily: a positive term
// first when there is one (b - a, not -a + b), no 1 or 0 coefficients.
export function combo([c1, c2], [u, v]) {
  const terms = [[c1, u], [c2, v]].filter(([c]) => !isZero(c));
  if (!terms.length) return '\\mathbf{0}';
  if (terms.length === 2 && terms[0][0][0] < 0 && terms[1][0][0] > 0) terms.reverse();
  return terms.map(([c, n], i) => {
    const t = `${coefTex(c)}${bf(n)}`;
    if (i === 0) return t;
    return c[0] < 0 ? ` - ${t.slice(1)}` : ` + ${t}`;
  }).join('');
}
const termCount = (c) => c.filter((x) => !isZero(x)).length;

/* ======================================================= column vectors */
//   Foundation  read an arrow off a squared grid
//   Core        the vector between two points, from their coordinates
//   Stretch     a missing point: given one end and the vector, find the other

const VEC_NAMES = ['a', 'b', 'p', 'q', 'u', 'v'];
const PAIRS = [['A', 'B'], ['P', 'Q'], ['C', 'D'], ['L', 'M'], ['R', 'S']];
const point = () => [_.random(-7, 7), _.random(-7, 7)];

export const generateColumnVectors = (options = {}) => {
  const { difficulty = 'core' } = options;
  const metadata = { topic: 'column-vectors', difficulty };

  if (difficulty === 'foundation') {
    let v;
    do { v = [_.random(-6, 6), _.random(-4, 4)]; } while ((v[0] === 0 && v[1] === 0) || ((v[0] === 0 || v[1] === 0) && Math.random() < 0.8));
    const from = [_.random(0, 6 - Math.max(0, v[0])) - Math.min(0, v[0]), _.random(0, 4 - Math.max(0, v[1])) - Math.min(0, v[1])];
    const name = _.sample(VEC_NAMES);
    return {
      instruction: 'Write the vector as a column vector.',
      answer: `${bf(name)} = ${col(v)}`,
      workingOut: [`x\\text{-step} = ${v[0]},\\ y\\text{-step} = ${v[1]}`, `${bf(name)} = ${col(v)}`].join(NL),
      visualization: { type: 'vector-grid', big: true, arrows: [{ from, to: add(from, v), label: name }] },
      metadata,
    };
  }

  const [P, Q] = _.sample(PAIRS);
  if (difficulty === 'core') {
    let A, B;
    do { A = point(); B = point(); } while (A[0] === B[0] || A[1] === B[1]);
    // From the first named point to the second, or back the other way.
    const [s, e, sn, en] = Math.random() < 0.7 ? [A, B, P, Q] : [B, A, Q, P];
    const v = sub(e, s);
    return {
      instruction: 'Find the column vector.',
      questionMath: `${P}${pt(A)},\\quad ${Q}${pt(B)}${NL}${arrow(sn, en)}`,
      answer: `${arrow(sn, en)} = ${col(v)}`,
      workingOut: [
        `${arrow(sn, en)} = \\begin{pmatrix} ${e[0]} - ${paren(s[0])} \\\\ ${e[1]} - ${paren(s[1])} \\end{pmatrix}`,
        `${arrow(sn, en)} = ${col(v)}`,
      ].join(NL),
      metadata,
    };
  }

  // Stretch: one end and the vector; find the other end.
  let A, v;
  do { A = point(); v = [nonZero(-8, 8), nonZero(-8, 8)]; } while (!add(A, v).every((c) => Math.abs(c) <= 9));
  const B = add(A, v);
  if (Math.random() < 0.5) {
    return {
      instruction: `Find the coordinates of ${Q}.`,
      questionMath: `${P}${pt(A)},\\quad ${arrow(P, Q)} = ${col(v)}`,
      answer: `${Q} = ${pt(B)}`,
      workingOut: [`${Q} = (${A[0]} + ${paren(v[0])},\\ ${A[1]} + ${paren(v[1])})`, `${Q} = ${pt(B)}`].join(NL),
      metadata,
    };
  }
  return {
    instruction: `Find the coordinates of ${P}.`,
    questionMath: `${Q}${pt(B)},\\quad ${arrow(P, Q)} = ${col(v)}`,
    answer: `${P} = ${pt(A)}`,
    workingOut: [`${P} = (${B[0]} - ${paren(v[0])},\\ ${B[1]} - ${paren(v[1])})`, `${P} = ${pt(A)}`].join(NL),
    metadata,
  };
};

/* =================================================== vector arithmetic */
//   Foundation  a + b, a - b
//   Core        a combination with scalar multiples, 2a - 3b
//   Stretch     solve a vector equation for x, 2x + b = a

const NAME_PAIRS = [['a', 'b'], ['p', 'q'], ['u', 'v'], ['r', 's']];
const smallVec = (n = 6) => { for (;;) { const v = [_.random(-n, n), _.random(-n, n)]; if (v[0] || v[1]) return v; } };
const given = ([u, v], [U, V]) => `${bf(u)} = ${col(U)},\\quad ${bf(v)} = ${col(V)}`;

export const generateVectorArithmetic = (options = {}) => {
  const { difficulty = 'core' } = options;
  const metadata = { topic: 'vector-arithmetic', difficulty };
  const names = _.sample(NAME_PAIRS);
  const U = smallVec(), V = smallVec();

  if (difficulty === 'stretch') {
    // kx ± v = u, or u - kx = v, with x a whole-number vector.
    const [u, v] = names;
    const k = _.random(2, 3);
    const form = _.sample(['plus', 'minus', 'from']);
    let X, V2, U2, eq, lines;
    do { X = smallVec(5); V2 = smallVec(5); } while (form === 'minus' ? sub(scale(k, X), V2).every((c) => c === 0) : add(scale(k, X), V2).every((c) => c === 0));
    const kx = `${k}${bf('x')}`;
    if (form === 'plus') {
      U2 = add(scale(k, X), V2);
      eq = `${kx} + ${bf(v)} = ${bf(u)}`;
      lines = [`${kx} = ${bf(u)} - ${bf(v)} = ${col(sub(U2, V2))}`];
    } else if (form === 'minus') {
      U2 = sub(scale(k, X), V2);
      eq = `${kx} - ${bf(v)} = ${bf(u)}`;
      lines = [`${kx} = ${bf(u)} + ${bf(v)} = ${col(add(U2, V2))}`];
    } else {
      U2 = add(scale(k, X), V2);
      eq = `${bf(u)} - ${kx} = ${bf(v)}`;
      lines = [`${kx} = ${bf(u)} - ${bf(v)} = ${col(sub(U2, V2))}`];
    }
    return {
      instruction: 'Find the column vector x.',
      questionMath: `${given(names, [U2, V2])}${NL}${eq}`,
      answer: `${bf('x')} = ${col(X)}`,
      workingOut: [...lines, `${bf('x')} = ${col(X)}`].join(NL),
      metadata,
    };
  }

  let c;
  if (difficulty === 'foundation') c = _.sample([[1, 1], [1, -1], [-1, 1]]);
  else {
    do { c = [nonZero(-3, 3), nonZero(-3, 3)]; } while (Math.abs(c[0]) < 2 && Math.abs(c[1]) < 2);
  }
  const expr = combo(c.map((k) => F(k)), names);
  const R = add(scale(c[0], U), scale(c[1], V));
  const parts = [scale(c[0], U), scale(c[1], V)];
  return {
    instruction: 'Find the column vector.',
    questionMath: `${given(names, [U, V])}${NL}${expr}`,
    answer: `${expr} = ${col(R)}`,
    workingOut: [`${expr} = ${col(parts[0])} + ${col(parts[1])}`, `= ${col(R)}`].join(NL),
    metadata,
  };
};

/* ========================================================== magnitude */
//   Foundation  a whole-number length (a Pythagorean pair)
//   Core        an exact length in simplest surd form
//   Stretch     the length of a combination, or of the vector between two
//               points: find the vector first

// Euclid's formula over a range, scaled, legs up to 24.
const TRIPLES = (() => {
  const out = [];
  for (let m = 2; m <= 6; m += 1) for (let n = 1; n < m; n += 1) {
    if ((m - n) % 2 === 0 || gcd(m, n) !== 1) continue;
    for (let k = 1; k <= 4; k += 1) {
      const [p, q] = [k * (m * m - n * n), k * 2 * m * n];
      if (p <= 24 && q <= 24) out.push([p, q]);
    }
  }
  return out;
})();
const signs = ([p, q]) => (Math.random() < 0.5 ? [p, q] : [q, p]).map((c) => (Math.random() < 0.5 ? -c : c));

function lengthLines(name, v) {
  const n = v[0] ** 2 + v[1] ** 2;
  const lines = [`${name} = \\sqrt{${paren(v[0])}^2 + ${paren(v[1])}^2}`, `= \\sqrt{${n}}`];
  if (surdTex(n) !== `\\sqrt{${n}}`) lines.push(`= ${surdTex(n)}`);
  return { lines, value: surdTex(n) };
}

export const generateVectorMagnitude = (options = {}) => {
  const { difficulty = 'core' } = options;
  const metadata = { topic: 'vector-magnitude', difficulty };
  const name = _.sample(VEC_NAMES);

  if (difficulty !== 'stretch') {
    let v;
    if (difficulty === 'foundation') v = signs(_.sample(TRIPLES));
    else {
      // Half the time the root simplifies (sqrt 45 = 3 sqrt 5), half not.
      const wantSimplify = Math.random() < 0.5;
      for (;;) {
        v = [nonZero(-9, 9), nonZero(-9, 9)];
        const n = v[0] ** 2 + v[1] ** 2;
        const [o, i] = surd(n);
        if (i !== 1 && (o > 1) === wantSimplify) break;
      }
    }
    const { lines, value } = lengthLines(`|${bf(name)}|`, v);
    return {
      instruction: difficulty === 'foundation' ? 'Find the magnitude of the vector.' : 'Find the exact magnitude of the vector.',
      questionMath: `${bf(name)} = ${col(v)}`,
      answer: `|${bf(name)}| = ${value}`,
      workingOut: lines.join(NL),
      metadata,
    };
  }

  // Stretch: build the vector first.
  if (Math.random() < 0.5) {
    const names = _.sample(NAME_PAIRS);
    let c, U, V, R;
    do {
      c = _.sample([[1, 1], [1, -1], [2, 1], [1, 2], [2, -1], [1, -2], [3, 1], [1, 3]]);
      U = smallVec(5); V = smallVec(5);
      R = add(scale(c[0], U), scale(c[1], V));
    } while ((R[0] === 0 && R[1] === 0) || Math.abs(R[0]) > 15 || Math.abs(R[1]) > 15);
    const expr = combo(c.map((k) => F(k)), names);
    const { lines, value } = lengthLines(`|${expr}|`, R);
    return {
      instruction: 'Find the exact magnitude.',
      questionMath: `${given(names, [U, V])}${NL}|${expr}|`,
      answer: `|${expr}| = ${value}`,
      workingOut: [`${expr} = ${col(R)}`, ...lines].join(NL),
      metadata,
    };
  }
  const [P, Q] = _.sample(PAIRS);
  let A, B;
  do { A = point(); B = point(); } while (A[0] === B[0] && A[1] === B[1]);
  const v = sub(B, A);
  const { lines, value } = lengthLines(`|${arrow(P, Q)}|`, v);
  return {
    instruction: 'Find the exact distance between the points.',
    questionMath: `${P}${pt(A)},\\quad ${Q}${pt(B)}${NL}|${arrow(P, Q)}|`,
    answer: `|${arrow(P, Q)}| = ${value}`,
    workingOut: [`${arrow(P, Q)} = ${col(v)}`, ...lines].join(NL),
    metadata,
  };
};

/* =================================================== parallel vectors */
//   Foundation  one vector is k times another: find k
//   Core        a missing component that makes two vectors parallel
//   Stretch     three points on a straight line: find a missing coordinate

export const generateParallelVectors = (options = {}) => {
  const { difficulty = 'core' } = options;
  const metadata = { topic: 'parallel-vectors', difficulty };

  if (difficulty === 'foundation') {
    const u = [nonZero(-5, 5), nonZero(-5, 5)];
    const k = _.sample([-4, -3, -2, 2, 3, 4, 5]);
    const w = scale(k, u);
    return {
      instruction: 'Find k.',
      questionMath: `${col(w)} = k${col(u)}`,
      answer: `k = ${k}`,
      workingOut: [`${w[0]} = k \\times ${paren(u[0])}`, `k = ${k}`].join(NL),
      metadata,
    };
  }

  if (difficulty === 'core') {
    // u = d·base and w = n·base, so w = (n/d)u with whole components.
    let base, d, n;
    do {
      base = [nonZero(-4, 4), nonZero(-4, 4)];
      d = _.random(1, 3); n = nonZero(-4, 4);
    } while (Math.abs(n) === d || gcd(base[0], base[1]) !== 1);
    const u = scale(d, base), w = scale(n, base);
    const hide = _.random(0, 1);
    const shown = w.map((c, i) => (i === hide ? 'k' : String(c)));
    const other = 1 - hide;
    return {
      instruction: 'The two vectors are parallel. Find k.',
      questionMath: `${col(u)} \\text{ and } \\begin{pmatrix} ${shown[0]} \\\\ ${shown[1]} \\end{pmatrix}`,
      answer: `k = ${w[hide]}`,
      workingOut: [
        `\\frac{k}{${u[hide]}} = \\frac{${w[other]}}{${u[other]}}`,
        `k = ${w[hide]}`,
      ].join(NL),
      metadata,
    };
  }

  // Stretch: C = A + t·AB, with one coordinate of C hidden.
  const [A, B, C] = (() => {
    for (;;) {
      const a = point();
      const ab = [nonZero(-4, 4), nonZero(-4, 4)];
      const t = _.sample([-2, -1, 2, 3]);
      const b = add(a, ab), c = add(a, scale(t, ab));
      if ([b, c].every((p) => Math.abs(p[0]) <= 12 && Math.abs(p[1]) <= 12)) return [a, b, c];
    }
  })();
  const hide = _.random(0, 1);
  const cShown = C.map((c, i) => (i === hide ? 'k' : String(c)));
  const AB = sub(B, A);
  const t = (C[1 - hide] - A[1 - hide]) / AB[1 - hide];
  const acTop = hide === 0 ? `k - ${paren(A[0])}` : String(C[0] - A[0]);
  const acBot = hide === 1 ? `k - ${paren(A[1])}` : String(C[1] - A[1]);
  return {
    instruction: 'A, B and C lie on a straight line. Find k.',
    questionMath: `A${pt(A)},\\quad B${pt(B)},\\quad C(${cShown[0]}, ${cShown[1]})`,
    answer: `k = ${C[hide]}`,
    workingOut: [
      `${arrow('A', 'B')} = ${col(AB)},\\quad ${arrow('A', 'C')} = \\begin{pmatrix} ${acTop} \\\\ ${acBot} \\end{pmatrix}`,
      `${arrow('A', 'C')} = ${t === -1 ? '-' : t}${arrow('A', 'B')}`,
      `k = ${C[hide]}`,
    ].join(NL),
    metadata,
  };
};

/* ================================================= vectors in geometry */
//   Foundation  a vector between two corners of a triangle or parallelogram
//   Core        to or from the midpoint of a side
//   Stretch     to or from a point dividing a side in a ratio m : n

// Each layout's corners in the basis of its two arrows: the triangle's
// arrows run O->A (first) and O->B (second); the parallelogram's run A->B
// and A->D.
const SHAPES = {
  triangle: { corners: [[0, 0], [1, 0], [0, 1]], names: [['O', 'A', 'B'], ['O', 'P', 'Q'], ['O', 'X', 'Y']], arrows: [[0, 1], [0, 2]] },
  parallelogram: { corners: [[0, 0], [1, 0], [1, 1], [0, 1]], names: [['A', 'B', 'C', 'D'], ['P', 'Q', 'R', 'S'], ['K', 'L', 'M', 'N']], arrows: [[0, 1], [0, 3]] },
};
const VEC_PAIRS = [['a', 'b'], ['p', 'q'], ['u', 'v']];

// A position in the basis, as fractions.
const pos = (c) => c.map((x) => (Array.isArray(x) ? x : F(x)));
const vsub = (p, q) => [fAdd(p[0], fNeg(q[0])), fAdd(p[1], fNeg(q[1]))];
const vscale = (k, p) => [fMul(k, p[0]), fMul(k, p[1])];
const vadd = (p, q) => [fAdd(p[0], q[0]), fAdd(p[1], q[1])];

export const generateVectorGeometry = (options = {}) => {
  const { difficulty = 'core' } = options;
  const metadata = { topic: 'vector-geometry', difficulty };
  const layout = difficulty === 'stretch' ? _.sample(['triangle', 'triangle', 'parallelogram']) : _.sample(['triangle', 'parallelogram']);
  const S = SHAPES[layout];
  const V = _.sample(S.names);
  const vn = _.sample(VEC_PAIRS);
  const n = V.length;
  const at = {};
  V.forEach((name, i) => { at[name] = pos(S.corners[i]); });

  // The boundary in order, with a point on one side when the band has one.
  let point = null;
  let instruction;
  if (difficulty !== 'foundation') {
    const side = _.random(0, n - 1);
    const [U, W] = [V[side], V[(side + 1) % n]];
    let t, m, k;
    if (difficulty === 'core') { t = F(1, 2); } else {
      do { m = _.random(1, 4); k = _.random(1, 4); } while (m === k || gcd(m, k) !== 1);
      t = F(m, m + k);
    }
    const name = _.sample(['M', 'N', 'T', 'X', 'Z'].filter((x) => !V.includes(x)));
    point = { name, on: [U, W], t, m, k };
    at[name] = vadd(at[U], vscale(t, vsub(at[W], at[U])));
    const shape = layout === 'triangle' ? `${V.join('')} is a triangle.` : `${V.join('')} is a parallelogram.`;
    // A midpoint's side is named in the shape's own order (OB, not BO).
    const sideName = V.indexOf(U) < V.indexOf(W) ? `${U}${W}` : `${W}${U}`;
    instruction = difficulty === 'core'
      ? `${shape} ${name} is the midpoint of ${sideName}. Write this vector in terms of ${vn[0]} and ${vn[1]}.`
      : `${shape} ${name} lies on ${sideName} with ${U}${name} : ${name}${W} = ${m} : ${k}. Write this vector in terms of ${vn[0]} and ${vn[1]}.`;
  } else {
    instruction = `${V.join('')} is a ${layout}. Write this vector in terms of ${vn[0]} and ${vn[1]}.`;
  }

  // Boundary nodes in order round the shape, each tagged with its side.
  const nodes = [];
  V.forEach((name, i) => {
    nodes.push(name);
    if (point && point.on[0] === name) nodes.push(point.name);
    void i;
  });
  const sideOf = (x, y) => {
    // The side that both lie on, as [from, to] corners in boundary order.
    for (let i = 0; i < n; i += 1) {
      const [U, W] = [V[i], V[(i + 1) % n]];
      const on = [U, W, ...(point && point.on[0] === U ? [point.name] : [])];
      if (on.includes(x) && on.includes(y)) return [U, W];
    }
    return null;
  };

  // The vector asked for: between two boundary nodes, not one of the drawn
  // arrows, and (with a point) starting or ending at the point.
  const drawn = S.arrows.map(([i, j]) => `${V[i]}${V[j]}`);
  // With a point, the vector is not just part of an arrow (A to the
  // midpoint of OA is half of a, no more): it has both a and b in it.
  const candidates = [];
  nodes.forEach((x) => nodes.forEach((y) => {
    if (x === y || drawn.includes(`${x}${y}`)) return;
    if (point && x !== point.name && y !== point.name) return;
    if (point && vsub(at[y], at[x]).some(isZero)) return;
    candidates.push([x, y]);
  }));
  // Two-step vectors (through a corner) come up twice as often as a side
  // read straight off, which only needs a sign or an equal side.
  const weighted = candidates.flatMap((c) => (vsub(at[c[1]], at[c[0]]).some(isZero) ? [c] : [c, c]));
  const [X, Y] = _.sample(weighted);

  // A route round the boundary from X to Y through the fewest corners;
  // each leg runs along one side.
  const walk = (dir) => {
    const seq = [X];
    for (let i = nodes.indexOf(X); nodes[i] !== Y;) {
      i = (i + dir + nodes.length) % nodes.length;
      seq.push(nodes[i]);
    }
    // Merge consecutive nodes on one side into a single leg.
    const legs = [];
    let start = seq[0];
    for (let k = 1; k < seq.length; k += 1) {
      const last = k === seq.length - 1;
      const same = (p, q) => p && q && p[0] === q[0] && p[1] === q[1];
      if (!last && same(sideOf(start, seq[k]), sideOf(start, seq[k + 1]))) continue;
      legs.push([start, seq[k]]);
      start = seq[k];
    }
    return legs;
  };
  // Fewest legs, but never the whole of the triangle's third side (AB is
  // what the question is testing: it goes the long way, via O).
  const thirdSide = layout === 'triangle' ? [V[1], V[2]] : [];
  const cost = (legs) => legs.length + 10 * legs.filter(([x, y]) => thirdSide.includes(x) && thirdSide.includes(y)).length;
  const routes = [walk(1), walk(-1)].sort((p, q) => cost(p) - cost(q));
  const legs = cost(routes[0]) === cost(routes[1]) ? _.sample(routes) : routes[0];

  // A leg is a part of a side: t of the side's vector, written as t(side).
  const basisOf = (c) => combo(c, vn);
  const legTex = ([x, y]) => {
    const v = vsub(at[y], at[x]);
    const side = sideOf(x, y);
    const sv = vsub(at[side[1]], at[side[0]]);
    // v = s·sv for a fraction s; orient the side so s > 0.
    const idx = isZero(sv[0]) ? 1 : 0;
    let s = fMul(v[idx], [sv[idx][1], sv[idx][0]]);
    let base = sv;
    if (s[0] < 0) { s = fNeg(s); base = vscale(F(-1), sv); }
    if (s[0] === s[1]) return { tex: basisOf(v), v };
    const inner = basisOf(base);
    return { tex: termCount(base) === 2 ? `${coefTex(s)}(${inner})` : basisOf(v), v };
  };
  const answerV = vsub(at[Y], at[X]);
  const answer = basisOf(answerV);
  const pieces = legs.map(legTex);
  const lines = [];
  if (legs.length > 1) {
    lines.push(`${arrow(X, Y)} = ${legs.map(([x, y]) => arrow(x, y)).join(' + ')}`);
    const joined = pieces.map((p, i) => (i === 0 ? p.tex : (p.tex.startsWith('-') ? ` - ${p.tex.slice(1)}` : ` + ${p.tex}`))).join('');
    if (joined !== answer) lines.push(`= ${joined}`);
    lines.push(`= ${answer}`);
  } else {
    lines.push(`${arrow(X, Y)} = ${pieces[0].tex}`);
    if (pieces[0].tex !== answer) lines.push(`= ${answer}`);
  }

  const toFig = (f) => f[0] / f[1];
  return {
    instruction,
    questionMath: arrow(X, Y),
    answer: `${arrow(X, Y)} = ${answer}`,
    workingOut: lines.join(NL),
    visualization: {
      type: 'vector-diagram', big: true, layout, vertices: V,
      arrows: S.arrows.map(([i, j], k) => ({ from: V[i], to: V[j], label: vn[k] })),
      points: point ? [{ name: point.name, on: point.on, t: toFig(point.t) }] : [],
      solution: [{ from: X, to: Y }],
    },
    metadata,
  };
};

