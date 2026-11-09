// The checker for the Vectors skills, shared by the harness
// (vectorGenerators.test.js) and its mutation test. Test support only.
// Nothing is imported from the generator.
//
// The question is read back from what is printed: column vectors and
// points from questionMath, arrows from the grid, a shape's corners and
// points from the diagram and the sentence. Vector expressions (\mathbf,
// \overrightarrow, column vectors, whole and fractional scalars, brackets)
// are evaluated by this file's own parser, and every answer and working
// line is recomputed from those values.

import { asRational, compiles, exactOf } from '../number/latexArithmetic.check';

// A plain number expression ("4 - (-3)") evaluated exactly.
const num = (tex) => { const r = asRational(exactOf(tex)); return r && r[1] === 1 ? r[0] : NaN; };

const fail = (msg, q) => { throw new Error(`${msg}\n${JSON.stringify(q)}`); };
const must = (cond, msg, q) => { if (!cond) fail(msg, q); };
const EPS = 1e-9;
const close = (u, v) => Math.abs(u[0] - v[0]) < EPS && Math.abs(u[1] - v[1]) < EPS;
const NUM = '-?\\d+';
const PM = `\\\\begin\\{pmatrix\\} (${NUM}) \\\\\\\\ (${NUM}) \\\\end\\{pmatrix\\}`;
const colOf = (s) => { const m = new RegExp(`^${PM}$`).exec(s); return m ? [Number(m[1]), Number(m[2])] : null; };
const colTex = ([x, y]) => `\\begin{pmatrix} ${x} \\\\ ${y} \\end{pmatrix}`;
const ptOf = (s) => { const m = /^\((-?\d+), (-?\d+)\)$/.exec(s); return m ? [Number(m[1]), Number(m[2])] : null; };

/* ------------------------------------------------- a vector expression */

// Evaluates a LaTeX vector expression to [x, y]. `env.vec[name]` gives
// \mathbf{name}; `env.pt[P]` gives a point, so \overrightarrow{PQ} is
// pt[Q] - pt[P]. Scalars are whole numbers or \frac{n}{d}; a scalar before
// a vector or a bracket multiplies it.
export function evalVec(src, env, q) {
  let s = src.replace(/\s+/g, ' ').trim();
  let i = 0;
  const peek = () => s.slice(i).trimStart();
  const skip = () => { while (s[i] === ' ') i += 1; };
  const eat = (t) => { skip(); if (s.startsWith(t, i)) { i += t.length; return true; } return false; };
  const scalar = () => {
    skip();
    let m = /^\\frac\{(\d+)\}\{(\d+)\}/.exec(s.slice(i));
    if (m) { i += m[0].length; return Number(m[1]) / Number(m[2]); }
    m = /^\d+/.exec(s.slice(i));
    if (m) { i += m[0].length; return Number(m[0]); }
    return null;
  };
  const atom = () => {
    skip();
    let m = /^\\mathbf\{([a-z0-9])\}/.exec(s.slice(i));
    if (m) {
      i += m[0].length;
      if (m[1] === '0') return [0, 0];
      must(env.vec?.[m[1]], `a known vector ${m[1]} in "${src}"`, q);
      return env.vec[m[1]];
    }
    m = /^\\overrightarrow\{([A-Z])([A-Z])\}/.exec(s.slice(i));
    if (m) {
      i += m[0].length;
      must(env.pt?.[m[1]] && env.pt?.[m[2]], `known points ${m[1]}${m[2]} in "${src}"`, q);
      return [env.pt[m[2]][0] - env.pt[m[1]][0], env.pt[m[2]][1] - env.pt[m[1]][1]];
    }
    m = new RegExp(`^${PM}`).exec(s.slice(i));
    if (m) { i += m[0].length; return [Number(m[1]), Number(m[2])]; }
    if (eat('(')) { const v = expr(); must(eat(')'), `a closing bracket in "${src}"`, q); return v; }
    return fail(`cannot read "${peek()}" in "${src}"`, q);
  };
  const term = () => {
    if (eat('-')) { const v = term(); return [-v[0], -v[1]]; }
    const k = scalar();
    const v = atom();
    return k === null ? v : [k * v[0], k * v[1]];
  };
  const expr = () => {
    let v = term();
    for (;;) {
      if (eat('+')) { const w = term(); v = [v[0] + w[0], v[1] + w[1]]; } else if (eat('-')) { const w = term(); v = [v[0] - w[0], v[1] - w[1]]; } else return v;
    }
  };
  const v = expr();
  skip();
  must(i === s.length, `nothing left over in "${src}" (at "${s.slice(i)}")`, q);
  return v;
}

// A combination of two named vectors, printed tidily: no 1 or 0
// coefficients, no "+ -", a fraction in lowest terms, and a positive term
// first if there is one.
function tidy(tex, q) {
  must(!/(^|[^\d}])1\\mathbf|\+ -|- -|\b0\\mathbf/.test(tex), `a tidy expression: ${tex}`, q);
  for (const m of tex.matchAll(/\\frac\{(\d+)\}\{(\d+)\}/g)) {
    const [n, d] = [Number(m[1]), Number(m[2])];
    let [a, b] = [n, d];
    while (b) [a, b] = [b, a % b];
    must(a === 1 && d > 1 && n > 0, `a fraction in lowest terms: ${m[0]}`, q);
  }
  must(!(tex.startsWith('-') && / \+ /.test(tex)), `a positive term first: ${tex}`, q);
}

// Simplest surd form of sqrt(n), found by trial from the largest square.
function simplestRoot(n) {
  for (let f = Math.floor(Math.sqrt(n)); f >= 1; f -= 1) {
    if (n % (f * f) === 0) {
      const inside = n / (f * f);
      if (inside === 1) return String(f);
      return f === 1 ? `\\sqrt{${inside}}` : `${f}\\sqrt{${inside}}`;
    }
  }
  return null;
}

function common(q, topic, band) {
  must(q.metadata?.topic === topic && q.metadata?.difficulty === band, 'metadata', q);
  must(q.answerUnits === undefined, 'no units', q);
  must(typeof q.workingOut === 'string' && !q.workingOut.includes('\\n'), 'working uses real newlines', q);
  [q.answer, q.workingOut, q.questionMath].filter((x) => x !== undefined).forEach((x) => compiles(x));
  must(!/-(?=\d)/.test(q.instruction), 'instructions use a real minus sign', q);
}

// Every "lhs = rhs" in a working line holds; a line starting "= " continues
// from the previous line's value.
function workingHolds(q, env, final) {
  const lines = q.workingOut.split('\n');
  let prev = null;
  lines.forEach((line) => {
    const parts = line.split(/ = | =$|^= /).map((p) => p.trim()).filter((p) => p !== '');
    const vals = parts.map((p) => evalVec(p.replace(/,\\ .*$/, ''), env, q));
    if (line.startsWith('= ') && prev) vals.unshift(prev);
    vals.forEach((v) => must(close(v, vals[0]), `working line "${line}" holds`, q));
    prev = vals[vals.length - 1];
  });
  must(close(prev, final), 'the working reaches the answer', q);
}

/* ------------------------------------------------------- column vectors */

function columnVectors(q, band) {
  common(q, 'column-vectors', band);
  const lines = q.workingOut.split('\n');
  if (band === 'foundation') {
    must(q.instruction === 'Write the vector as a column vector.' && q.questionMath === undefined, 'instruction', q);
    const f = q.visualization;
    must(f?.type === 'vector-grid' && f.arrows?.length === 1 && !f.solution?.length, 'one arrow on a grid', q);
    const [{ from, to, label }] = f.arrows;
    [from, to].forEach((p) => must(p.every(Number.isInteger), 'arrows run between grid points', q));
    const v = [to[0] - from[0], to[1] - from[1]];
    must(v[0] || v[1], 'an arrow with length', q);
    must(q.answer === `\\mathbf{${label}} = ${colTex(v)}`, `answer ${q.answer}, expected ${label} = (${v})`, q);
    must(lines[0] === `x\\text{-step} = ${v[0]},\\ y\\text{-step} = ${v[1]}` && lines[1] === q.answer, 'working: the steps, then the vector', q);
    return { kind: v[0] && v[1] ? 'diagonal arrow' : 'straight arrow' };
  }
  must(q.visualization === undefined, 'no figure', q);
  const m = /^([A-Z])(\(-?\d+, -?\d+\)),\\quad (.+)$/s.exec(q.questionMath ?? '');
  must(m, `a point and more: ${q.questionMath}`, q);
  const pt = { [m[1]]: ptOf(m[2]) };
  if (band === 'core') {
    must(q.instruction === 'Find the column vector.', 'instruction', q);
    const r = /^([A-Z])(\(-?\d+, -?\d+\))\n\\overrightarrow\{([A-Z])([A-Z])\}$/.exec(m[3]);
    must(r, `a second point and the vector asked for: ${m[3]}`, q);
    pt[r[1]] = ptOf(r[2]);
    const [s, e] = [r[3], r[4]];
    must(pt[s] && pt[e] && s !== e, 'the vector runs between the two points', q);
    const v = [pt[e][0] - pt[s][0], pt[e][1] - pt[s][1]];
    must(v[0] !== 0 && v[1] !== 0, 'both steps non-zero', q);
    const name = `\\overrightarrow{${s}${e}}`;
    must(q.answer === `${name} = ${colTex(v)}`, `answer ${q.answer}`, q);
    // The subtraction line: end minus start, each entry.
    const sl = new RegExp(`^\\\\overrightarrow\\{${s}${e}\\} = \\\\begin\\{pmatrix\\} (.+) \\\\\\\\ (.+) \\\\end\\{pmatrix\\}$`).exec(lines[0]);
    must(sl, `working line 1 "${lines[0]}"`, q);
    must(num(sl[1]) === v[0] && num(sl[2]) === v[1], 'working line 1 subtracts start from end', q);
    must(sl[1].startsWith(`${pt[e][0]} - `) && sl[2].startsWith(`${pt[e][1]} - `), 'end minus start, in that order', q);
    must(lines[1] === q.answer, 'working ends on the answer', q);
    return { kind: s < e ? 'forwards' : 'backwards' };
  }
  // Stretch: one end and the vector between them; the other end asked for.
  const r = /^\\overrightarrow\{([A-Z])([A-Z])\} = (.+)$/.exec(m[3]);
  must(r, `the vector between the points: ${m[3]}`, q);
  const v = colOf(r[3]);
  must(v, 'a column vector', q);
  const [P, Q] = [r[1], r[2]];
  const known = m[1];
  must(known === P || known === Q, 'the point given is an end of the vector', q);
  const want = known === P ? Q : P;
  must(q.instruction === `Find the coordinates of ${want}.`, 'instruction', q);
  const res = known === P ? [pt[P][0] + v[0], pt[P][1] + v[1]] : [pt[Q][0] - v[0], pt[Q][1] - v[1]];
  must(q.answer === `${want} = (${res[0]}, ${res[1]})`, `answer ${q.answer}, expected ${want} = (${res})`, q);
  must(lines[1] === q.answer, 'working ends on the answer', q);
  const wl = new RegExp(`^${want} = \\((.+),\\\\ (.+)\\)$`).exec(lines[0]);
  must(wl, `working line 1 "${lines[0]}"`, q);
  must(num(wl[1]) === res[0] && num(wl[2]) === res[1], 'working line 1 adds (or takes away) the vector', q);
  must(wl[1].startsWith(`${pt[known][0]} `) && wl[2].startsWith(`${pt[known][1]} `), 'working starts from the point given', q);
  return { kind: known === P ? 'find the end' : 'find the start' };
}

/* ---------------------------------------------------- vector arithmetic */

// "\mathbf{a} = (..),\quad \mathbf{b} = (..)" -> { a: [..], b: [..] }
function givenVectors(line, q) {
  const re = new RegExp(`^\\\\mathbf\\{([a-z])\\} = ${PM},\\\\quad \\\\mathbf\\{([a-z])\\} = ${PM}$`);
  const m = re.exec(line);
  must(m, `two vectors given: ${line}`, q);
  must(m[1] !== m[4], 'two different names', q);
  return { [m[1]]: [Number(m[2]), Number(m[3])], [m[4]]: [Number(m[5]), Number(m[6])] };
}

// The coefficients of a combination of the two given vectors, read by
// evaluating it with each set to a unit vector in turn.
function coefficients(expr, names, q) {
  const [u, v] = names;
  const cu = evalVec(expr, { vec: { [u]: [1, 0], [v]: [0, 1] } }, q);
  return { [u]: cu[0], [v]: cu[1] };
}

function vectorArithmetic(q, band) {
  common(q, 'vector-arithmetic', band);
  must(q.visualization === undefined, 'no figure', q);
  const [first, second, ...rest] = (q.questionMath ?? '').split('\n');
  must(second && !rest.length, 'two lines: the vectors, then what to find', q);
  const vec = givenVectors(first, q);
  const names = Object.keys(vec);
  Object.values(vec).forEach((v) => must(v[0] || v[1], 'non-zero vectors', q));

  if (band === 'stretch') {
    must(q.instruction === 'Find the column vector x.', 'instruction', q);
    const sides = second.split(' = ');
    must(sides.length === 2 && second.includes('\\mathbf{x}'), `an equation in x: ${second}`, q);
    // lhs - rhs is affine in x: k·x + c. Solve k·x + c = 0.
    const f = (x) => { const env = { vec: { ...vec, x } }; const l = evalVec(sides[0], env, q), r = evalVec(sides[1], env, q); return [l[0] - r[0], l[1] - r[1]]; };
    const c = f([0, 0]), k = f([1, 0])[0] - c[0];
    must(Math.abs(f([0, 1])[1] - c[1] - k) < EPS && k !== 0, 'x appears as a scalar multiple', q);
    must(Math.abs(k) >= 2, 'x has a coefficient of 2 or more', q);
    const x = [-c[0] / k, -c[1] / k];
    must(x.every(Number.isInteger), 'a whole-number answer', q);
    must(q.answer === `\\mathbf{x} = ${colTex(x)}`, `answer ${q.answer}, expected x = (${x})`, q);
    // Working lines read "kx = u - v = (..)" then the answer.
    workingHolds(q, { vec: { ...vec, x } }, x);
    must(q.workingOut.split('\n').pop() === q.answer, 'the working ends on the answer', q);
    return { kind: second.startsWith(`${Math.abs(k)}\\mathbf{x} +`) ? 'kx + v = u' : second.startsWith(`${Math.abs(k)}\\mathbf{x} -`) ? 'kx - v = u' : 'u - kx = v' };
  }

  must(q.instruction === 'Find the column vector.', 'instruction', q);
  tidy(second, q);
  const c = coefficients(second, names, q);
  const cs = Object.values(c);
  cs.forEach((k) => must(Number.isInteger(k) && k !== 0, 'both vectors used, with whole-number scalars', q));
  if (band === 'foundation') must(cs.every((k) => Math.abs(k) === 1), 'Foundation adds or subtracts', q);
  else must(cs.some((k) => Math.abs(k) >= 2), 'Core has a scalar multiple', q);
  const R = evalVec(second, { vec }, q);
  must(q.answer === `${second} = ${colTex(R)}`, `answer ${q.answer}, expected (${R})`, q);
  workingHolds(q, { vec }, R);
  must(q.workingOut.split('\n').pop() === `= ${colTex(R)}`, 'the working ends on the answer', q);
  return { kind: band === 'foundation' ? (cs[0] === 1 && cs[1] === 1 ? 'sum' : 'difference') : 'scalar multiples' };
}

/* ------------------------------------------------------------ magnitude */

function magnitude(q, band) {
  common(q, 'vector-magnitude', band);
  must(q.visualization === undefined, 'no figure', q);
  const lines = q.workingOut.split('\n');
  let v, name, kind;
  if (band !== 'stretch') {
    must(q.instruction === (band === 'foundation' ? 'Find the magnitude of the vector.' : 'Find the exact magnitude of the vector.'), 'instruction', q);
    const m = new RegExp(`^\\\\mathbf\\{([a-z])\\} = ${PM}$`).exec(q.questionMath ?? '');
    must(m, `one vector: ${q.questionMath}`, q);
    v = [Number(m[2]), Number(m[3])];
    name = `|\\mathbf{${m[1]}}|`;
    kind = 'one vector';
  } else {
    const [first, second, ...rest] = (q.questionMath ?? '').split('\n');
    must(second && !rest.length && /^\|.+\|$/.test(second), 'two lines, the second a length', q);
    name = second;
    const inner = second.slice(1, -1);
    if (/^[A-Z]\(/.test(first)) {
      must(q.instruction === 'Find the exact distance between the points.', 'instruction', q);
      const pm = /^([A-Z])(\(-?\d+, -?\d+\)),\\quad ([A-Z])(\(-?\d+, -?\d+\))$/.exec(first);
      must(pm, `two points: ${first}`, q);
      const pt = { [pm[1]]: ptOf(pm[2]), [pm[3]]: ptOf(pm[4]) };
      must(inner === `\\overrightarrow{${pm[1]}${pm[3]}}`, 'the distance between the two points given', q);
      v = evalVec(inner, { pt }, q);
      must(lines[0] === `${inner} = ${colTex(v)}`, 'working opens with the vector', q);
      kind = 'between points';
    } else {
      must(q.instruction === 'Find the exact magnitude.', 'instruction', q);
      const vec = givenVectors(first, q);
      tidy(inner, q);
      const c = Object.values(coefficients(inner, Object.keys(vec), q));
      must(c.every((k) => Number.isInteger(k) && k !== 0), 'a combination of both', q);
      v = evalVec(inner, { vec }, q);
      must(lines[0] === `${inner} = ${colTex(v)}`, 'working opens with the combination', q);
      kind = 'of a combination';
    }
    lines.shift();
  }
  must(v[0] || v[1], 'a non-zero vector', q);
  const n = v[0] ** 2 + v[1] ** 2;
  const root = simplestRoot(n);
  if (band === 'foundation') must(Number.isInteger(Math.sqrt(n)), 'Foundation is a whole-number length', q);
  if (band === 'core') must(!Number.isInteger(Math.sqrt(n)), 'Core is an exact surd', q);
  must(q.answer === `${name} = ${root}`, `answer ${q.answer}, expected ${name} = ${root}`, q);
  const p = (x) => (x < 0 ? `(${x})` : String(x));
  const want = [`${name} = \\sqrt{${p(v[0])}^2 + ${p(v[1])}^2}`, `= \\sqrt{${n}}`, ...(root !== `\\sqrt{${n}}` ? [`= ${root}`] : [])];
  must(lines.join('\n') === want.join('\n'), `working:\n${lines.join('\n')}\nexpected:\n${want.join('\n')}`, q);
  if (band === 'core') kind = root.startsWith('\\sqrt') ? 'surd' : 'surd simplified';
  if (band === 'foundation') kind = 'whole number';
  return { kind };
}

/* ----------------------------------------------------- parallel vectors */

function parallel(q, band) {
  common(q, 'parallel-vectors', band);
  must(q.visualization === undefined, 'no figure', q);
  const lines = q.workingOut.split('\n');
  let k;
  if (band === 'foundation') {
    must(q.instruction === 'Find k.', 'instruction', q);
    const m = new RegExp(`^${PM} = k${PM}$`).exec(q.questionMath ?? '');
    must(m, `w = k u: ${q.questionMath}`, q);
    const [w, u] = [[Number(m[1]), Number(m[2])], [Number(m[3]), Number(m[4])]];
    must(u[0] && u[1], 'no zero components', q);
    k = w[0] / u[0];
    must(w[1] === k * u[1], 'one vector really is k times the other', q);
    must(Number.isInteger(k) && Math.abs(k) >= 2, 'k is a whole number, 2 or more in size', q);
    must(lines[0] === `${w[0]} = k \\times ${u[0] < 0 ? `(${u[0]})` : u[0]}`, `working line "${lines[0]}"`, q);
    must(q.answer === `k = ${k}` && lines[1] === q.answer, `answer ${q.answer}, expected k = ${k}`, q);
    return { kind: k < 0 ? 'negative k' : 'positive k' };
  }
  if (band === 'core') {
    must(q.instruction === 'The two vectors are parallel. Find k.', 'instruction', q);
    const m = new RegExp(`^${PM} \\\\text\\{ and \\} \\\\begin\\{pmatrix\\} (${NUM}|k) \\\\\\\\ (${NUM}|k) \\\\end\\{pmatrix\\}$`).exec(q.questionMath ?? '');
    must(m, `two vectors, one with k: ${q.questionMath}`, q);
    const u = [Number(m[1]), Number(m[2])];
    const hide = m[3] === 'k' ? 0 : 1;
    must((m[3] === 'k') !== (m[4] === 'k'), 'exactly one k', q);
    const other = 1 - hide;
    const known = Number(m[other + 3]);
    must(u[0] && u[1] && known, 'no zero components', q);
    k = (u[hide] * known) / u[other];
    must(Number.isInteger(k), 'k comes out whole', q);
    must(Math.abs(known / u[other]) !== 1, 'not simply the same vector or its negative', q);
    must(lines[0] === `\\frac{k}{${u[hide]}} = \\frac{${known}}{${u[other]}}`, `working line "${lines[0]}"`, q);
    must(q.answer === `k = ${k}` && lines[1] === q.answer, `answer ${q.answer}, expected k = ${k}`, q);
    return { kind: hide === 0 ? 'k on top' : 'k below' };
  }
  must(q.instruction === 'A, B and C lie on a straight line. Find k.', 'instruction', q);
  const m = /^A\((-?\d+), (-?\d+)\),\\quad B\((-?\d+), (-?\d+)\),\\quad C\((-?\d+|k), (-?\d+|k)\)$/.exec(q.questionMath ?? '');
  must(m, `three points, one coordinate k: ${q.questionMath}`, q);
  const [A, B] = [[Number(m[1]), Number(m[2])], [Number(m[3]), Number(m[4])]];
  const hide = m[5] === 'k' ? 0 : 1;
  must((m[5] === 'k') !== (m[6] === 'k'), 'exactly one k', q);
  const other = 1 - hide;
  const cKnown = Number(m[other + 5]);
  const AB = [B[0] - A[0], B[1] - A[1]];
  must(AB[0] && AB[1], 'A to B moves both ways', q);
  const t = (cKnown - A[other]) / AB[other];
  k = A[hide] + t * AB[hide];
  must(Number.isInteger(k), 'k comes out whole', q);
  must(t !== 0 && t !== 1, 'C is not A or B', q);
  must(q.answer === `k = ${k}` && lines[lines.length - 1] === q.answer, `answer ${q.answer}, expected k = ${k}`, q);
  const p = (x) => (x < 0 ? `(${x})` : String(x));
  const ac = hide === 0 ? [`k - ${p(A[0])}`, String(cKnown - A[1])] : [String(cKnown - A[0]), `k - ${p(A[1])}`];
  must(lines[0] === `\\overrightarrow{AB} = ${colTex(AB)},\\quad \\overrightarrow{AC} = \\begin{pmatrix} ${ac[0]} \\\\ ${ac[1]} \\end{pmatrix}`, `working line "${lines[0]}": AB, and AC with k in it`, q);
  must(lines[1] === `\\overrightarrow{AC} = ${t === -1 ? '-' : t}\\overrightarrow{AB}`, `working line "${lines[1]}"`, q);
  return { kind: hide === 0 ? 'k is x' : 'k is y' };
}

/* -------------------------------------------------- vectors in geometry */

function geometry(q, band) {
  common(q, 'vector-geometry', band);
  const f = q.visualization;
  must(f?.type === 'vector-diagram' && f.big, 'a vector diagram', q);
  const V = f.vertices;
  must(new Set(V).size === V.length, 'distinct corners', q);
  const tri = f.layout === 'triangle';
  must(tri ? V.length === 3 : f.layout === 'parallelogram' && V.length === 4, 'a triangle or a parallelogram', q);
  // The arrows: the triangle's run from its first corner to the other two;
  // the parallelogram's from its first corner along both sides.
  const want = tri ? [[V[0], V[1]], [V[0], V[2]]] : [[V[0], V[1]], [V[0], V[3]]];
  must(f.arrows.length === 2 && f.arrows.every((a, i) => a.from === want[i][0] && a.to === want[i][1]), 'the two arrows along the sides from the first corner', q);
  const [u, w] = f.arrows.map((a) => a.label);
  must(u !== w && /^[a-z]$/.test(u) && /^[a-z]$/.test(w), 'two named vectors', q);
  // Numbers for u and w, not parallel, so a combination is read exactly.
  const U = [3, 1], W = [1, 4];
  const pt = {};
  if (tri) { pt[V[0]] = [0, 0]; pt[V[1]] = U; pt[V[2]] = W; } else { pt[V[0]] = [0, 0]; pt[V[1]] = U; pt[V[3]] = W; pt[V[2]] = [U[0] + W[0], U[1] + W[1]]; }

  // The sentence: the shape, the point (midpoint or ratio), the request.
  const shape = `${V.join('')} is a ${tri ? 'triangle' : 'parallelogram'}.`;
  // The sentence may name the two vectors in either order; which arrow is
  // which is read from the diagram.
  const tailOf = (x) => x.slice(x.indexOf('Write this vector'));
  const tail = [`Write this vector in terms of ${u} and ${w}.`, `Write this vector in terms of ${w} and ${u}.`].find((t) => tailOf(q.instruction) === t) ?? `Write this vector in terms of ${u} and ${w}.`;
  const pts = f.points ?? [];
  let kind;
  if (band === 'foundation') {
    must(q.instruction === `${shape} ${tail}`, `instruction "${q.instruction}"`, q);
    must(pts.length === 0, 'no point on a side', q);
    kind = 'corner to corner';
  } else {
    must(pts.length === 1, 'one point on a side', q);
    const [P] = pts;
    must(!V.includes(P.name), 'the point has its own letter', q);
    const [A, B] = P.on;
    const ia = V.indexOf(A), ib = V.indexOf(B);
    must(ia >= 0 && ib >= 0 && (Math.abs(ia - ib) === 1 || Math.abs(ia - ib) === V.length - 1), 'the point is on a side', q);
    const side = ia < ib ? `${A}${B}` : `${B}${A}`;
    let t;
    if (band === 'core') {
      must(q.instruction === `${shape} ${P.name} is the midpoint of ${side}. ${tail}`, `instruction "${q.instruction}"`, q);
      t = 1 / 2;
      kind = tri ? 'midpoint, triangle' : 'midpoint, parallelogram';
    } else {
      const m = new RegExp(`^${shape.replace('.', '\\.')} ${P.name} lies on ${side} with ${A}${P.name} : ${P.name}${B} = (\\d) : (\\d)\\. ${tail.replace('.', '\\.')}$`).exec(q.instruction);
      must(m, `instruction "${q.instruction}"`, q);
      const [r, s] = [Number(m[1]), Number(m[2])];
      must(r !== s && r > 0 && s > 0, 'an unequal ratio', q);
      t = r / (r + s);
      kind = tri ? 'ratio, triangle' : 'ratio, parallelogram';
    }
    must(Math.abs(P.t - t) < EPS, 'the point is drawn where the sentence puts it', q);
    pt[P.name] = [pt[A][0] + t * (pt[B][0] - pt[A][0]), pt[A][1] + t * (pt[B][1] - pt[A][1])];
  }
  const m = /^\\overrightarrow\{([A-Z])([A-Z])\}$/.exec(q.questionMath ?? '');
  must(m && pt[m[1]] && pt[m[2]] && m[1] !== m[2], `the vector asked for: ${q.questionMath}`, q);
  const [X, Y] = [m[1], m[2]];
  must(!f.arrows.some((a) => a.from === X && a.to === Y), 'not one of the arrows drawn', q);
  if (pts.length) must(X === pts[0].name || Y === pts[0].name, 'the vector starts or ends at the point', q);
  must(JSON.stringify(f.solution) === JSON.stringify([{ from: X, to: Y }]), 'the reveal draws the vector asked for', q);
  const target = [pt[Y][0] - pt[X][0], pt[Y][1] - pt[X][1]];
  // The answer, in u and w: read with u, w set to the numbers above.
  const am = new RegExp(`^\\\\overrightarrow\\{${X}${Y}\\} = (.+)$`).exec(q.answer);
  must(am, `answer ${q.answer}`, q);
  tidy(am[1], q);
  const got = evalVec(am[1], { vec: { [u]: U, [w]: W } }, q);
  must(close(got, target), `answer ${q.answer} is not ${X} to ${Y}`, q);
  // Both vectors in the answer once a point is on a side.
  if (pts.length) must(am[1].includes(`\\mathbf{${u}}`) && am[1].includes(`\\mathbf{${w}}`), 'the answer uses both vectors', q);
  workingHolds(q, { vec: { [u]: U, [w]: W }, pt }, target);
  must(q.workingOut.split('\n').pop().endsWith(am[1]), 'the working ends on the answer', q);
  return { kind };
}

export function checkVector(q, band) {
  const topic = q.metadata?.topic;
  if (topic === 'column-vectors') return columnVectors(q, band);
  if (topic === 'vector-arithmetic') return vectorArithmetic(q, band);
  if (topic === 'vector-magnitude') return magnitude(q, band);
  if (topic === 'parallel-vectors') return parallel(q, band);
  if (topic === 'vector-geometry') return geometry(q, band);
  return fail(`topic ${topic}`, q);
}
