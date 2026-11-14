// Test support only. Checks the straight-line skills from what is printed:
// parallel-gradients, perpendicular-gradients, horizontal-vertical-lines,
// lines-meet and line-general-form. Every equation is read back by
// evaluating it (latexArithmetic.check), so a line is known by its
// coefficients, not by how the generator built it; the gradient, the line
// or the point is worked out here and the answer and every working line
// must agree. Nothing is imported from the generator.

import { asRational, compiles, exactOf, req, subst } from '../number/latexArithmetic.check';

const must = (cond, msg) => { if (!cond) throw new Error(msg); };
const lines = (s) => String(s ?? '').split('\n');

/* -------------------------------------------------------------- numbers */

const gcd = (a, b) => { a = Math.abs(a); b = Math.abs(b); while (b) [a, b] = [b, a % b]; return a; };
const R = (n, d = 1) => { if (d < 0) { n = -n; d = -d; } const g = gcd(n, d) || 1; return [n / g, d / g]; };
const val = (tex) => asRational(exactOf(tex));
const sub = (a, b) => R(a[0] * b[1] - b[0] * a[1], a[1] * b[1]);
const div = (a, b) => R(a[0] * b[1], a[1] * b[0]);
const neg = (a) => [-a[0], a[1]];
const isWhole = (a) => a[1] === 1;

/** lhs - rhs of an equation at (x, y), exactly. */
const residual = (eq, x, y) => {
  const [l, r] = eq.split(' = ');
  must(r !== undefined && !eq.split(' = ')[2], `an equation: ${eq}`);
  const at = (s) => val(subst(s, { x: String(x), y: String(y) }));
  return sub(at(l), at(r));
};
/** a, b, d with ax + by - d the residual. */
const linear = (eq) => {
  const z = residual(eq, 0, 0);
  return { a: sub(residual(eq, 1, 0), z), b: sub(residual(eq, 0, 1), z), d: neg(z) };
};
/** The gradient of a line that is not vertical. */
const gradientOf = ({ a, b }) => { must(b[0] !== 0, 'not a vertical line'); return neg(div(a, b)); };

/* ------------------------------------------------------------- printing */
// How the board prints a gradient, a line and a point: the presentation the
// skills share, written out here again.

const fracTex = ([n, d]) => (d === 1 ? String(n) : n < 0 ? `-\\frac{${-n}}{${d}}` : `\\frac{${n}}{${d}}`);
const coefTex = (r) => { const t = fracTex(r); return t === '1' ? '' : t === '-1' ? '-' : t; };
const signed = (c) => (c === 0 ? '' : ` ${c < 0 ? '-' : '+'} ${Math.abs(c)}`);
const coefInt = (v) => (v === 1 ? '' : v === -1 ? '-' : String(v));
const br = (v) => (v < 0 ? `(${v})` : String(v));
const lineTex = (m, c) => (m[0] === 0 ? `y = ${c}` : `y = ${coefTex(m)}x${signed(c)}`);
const generalTex = (a, b, d) => `${coefInt(a)}x ${b === 1 ? '+ y' : b === -1 ? '- y' : b < 0 ? `- ${-b}y` : `+ ${b}y`} = ${d}`;

/** A line printed as y = mx + c, read: its gradient and intercept. */
function readSlope(tex) {
  must(/^y = /.test(tex), `y = mx + c: ${tex}`);
  const L = linear(tex);
  const m = gradientOf(L), c = div(L.d, L.b);
  must(isWhole(c), 'a whole intercept');
  must(tex === lineTex(m, c[0]), `printed as y = mx + c reads: ${tex}`);
  return { m, c: c[0] };
}
/** A line printed as ax + by = d, read: whole coefficients, a and b coprime. */
function readGeneral(tex) {
  must(!/^y = /.test(tex), `general form: ${tex}`);
  const { a, b, d } = linear(tex);
  [a, b, d].forEach((r) => must(isWhole(r), 'whole coefficients'));
  must(a[0] !== 0 && b[0] !== 0, 'both x and y in it');
  must(gcd(a[0], b[0]) === 1, 'a and b with no common factor');
  must(tex === generalTex(a[0], b[0], d[0]), `printed as ax + by = d reads: ${tex}`);
  return { a: a[0], b: b[0], d: d[0] };
}
const readPoint = (s) => { const m = /^\((-?\d+), (-?\d+)\)$/.exec(s ?? ''); must(m, `a point: ${s}`); return [Number(m[1]), Number(m[2])]; };
const readThrough = (s) => { const m = /^\\text\{through \} (\(.+\))$/.exec(s ?? ''); must(m, `through a point: ${s}`); return readPoint(m[1]); };
/** ax + by = d made y = (-a/b)x + d/b, as the first working line writes it. */
const solvedForY = ({ a, b, d }) => `${coefInt(b)}y = ${coefInt(-a)}x${signed(d)}`;

function common(q, topic, band) {
  must(q.metadata?.topic === topic && q.metadata.difficulty === band, 'metadata');
  [q.questionMath, q.answer, q.workingOut].filter((s) => s !== undefined).forEach((s) => compiles(s));
  must(!/\d/.test(q.instruction), 'no number in the instruction');
  must(typeof q.workingOut === 'string' && !q.workingOut.includes('\\n'), 'real newlines');
}
const noFigure = (q) => must(q.visualization == null, 'no figure');

/* ------------------------------------------------------- parallel lines */

export function checkParallel(q, band) {
  common(q, 'parallel-gradients', band);
  noFigure(q);
  const w = lines(q.workingOut);
  if (band === 'stretch') {
    must(q.instruction === 'Find the equation of the line parallel to this one, through the point given', 'instruction');
    const [l1, l2, l3] = lines(q.questionMath);
    must(l3 === undefined, 'a line and a point');
    const { m, c } = readSlope(l1);
    const [x, y] = readThrough(l2);
    must(x !== 0, 'a point off the y-axis, or the intercept is given');
    const c2 = sub([y, 1], R(m[0] * x, m[1]));
    must(isWhole(c2), 'a whole intercept');
    must(c2[0] !== c, 'not the same line');
    must(q.answer === lineTex(m, c2[0]), `answer ${q.answer}`);
    const ans = readSlope(q.answer);
    must(req(ans.m, m) && req(residual(q.answer, x, y), [0, 1]), 'parallel, through the point');
    must(w.join('|') === [`y = ${coefTex(m)}x + c`, `${y} = ${fracTex(m)} \\times ${br(x)} + c`, `c = ${c2[0]}`, q.answer].join('|'), 'working');
    return { kind: 'through a point' };
  }
  must(q.instruction === 'Find the gradient of a line parallel to this one', 'instruction');
  must(lines(q.questionMath).length === 1, 'one line');
  if (band === 'foundation') {
    const { m } = readSlope(q.questionMath);
    must(q.answer === fracTex(m), `answer ${q.answer}`);
    must(w.join('|') === ['\\text{parallel lines have equal gradients}', `m = ${q.answer}`].join('|'), 'working');
    return { kind: isWhole(m) ? 'whole gradient' : 'fraction gradient' };
  }
  const L = readGeneral(q.questionMath);
  const m = R(-L.a, L.b);
  must(q.answer === fracTex(m), `answer ${q.answer}`);
  must(w.join('|') === [solvedForY(L), `m = ${q.answer}`].join('|'), 'working');
  return { kind: 'general form' };
}

/* -------------------------------------------------- perpendicular lines */

export function checkPerpendicular(q, band) {
  common(q, 'perpendicular-gradients', band);
  noFigure(q);
  must(q.instruction === 'Find the gradient of a line perpendicular to this one', 'instruction');
  must(lines(q.questionMath).length === 1, 'one line');
  const w = lines(q.workingOut);
  if (band === 'stretch') {
    const L = readGeneral(q.questionMath);
    const m = R(-L.a, L.b);
    const p = R(L.b, L.a);
    must(q.answer === fracTex(p), `answer ${q.answer}`);
    must(w.join('|') === [solvedForY(L), `m = ${fracTex(m)}`, `\\text{perpendicular gradient} = ${q.answer}`].join('|'), 'working');
    return { kind: 'general form' };
  }
  const { m } = readSlope(q.questionMath);
  must(m[0] !== 0, 'a sloping line');
  must(isWhole(m) === (band === 'foundation'), band === 'foundation' ? 'a whole-number gradient' : 'a fraction for a gradient');
  const p = neg(div([1, 1], m));
  must(q.answer === fracTex(p), `answer ${q.answer}, expected ${fracTex(p)}`);
  const shown = fracTex(m).startsWith('-') ? `(${fracTex(m)})` : fracTex(m);
  must(w.join('|') === [`m = ${fracTex(m)}`, `\\text{perpendicular gradient} = -1 \\div ${shown} = ${q.answer}`].join('|'), 'working');
  return { kind: isWhole(m) ? 'whole gradient' : 'fraction gradient' };
}

/* ------------------------------------------- vertical and horizontal lines */

const DESCRIBED = {
  '\\text{parallel to the } x\\text{-axis}': false,
  '\\text{parallel to the } y\\text{-axis}': true,
  '\\text{perpendicular to the } x\\text{-axis}': true,
  '\\text{perpendicular to the } y\\text{-axis}': false,
  '\\text{gradient } 0': false,
};

export function checkHorizontalVertical(q, band) {
  common(q, 'horizontal-vertical-lines', band);
  const w = lines(q.workingOut);
  if (band === 'foundation') {
    must(q.instruction === 'Find the equation of this line' && q.questionMath === undefined, 'read off the graph');
    const { line } = q.visualization ?? {};
    must(q.visualization?.type === 'coordinate-grid' && q.visualization.big === true && line, 'a drawn line');
    const vertical = line.x !== undefined;
    must(vertical || (line.m === 0 && Object.keys(line).length === 2), 'a vertical or horizontal line');
    const k = vertical ? line.x : line.c;
    must(Number.isInteger(k) && k !== 0 && Math.abs(k) <= 4, 'on the grid, off the axes');
    const ans = `${vertical ? 'x' : 'y'} = ${k}`;
    must(q.answer === ans, `answer ${q.answer}`);
    must(w.join('|') === [`\\text{every point on the line has } ${ans}`, ans].join('|'), 'working');
    return { kind: vertical ? 'vertical' : 'horizontal' };
  }
  noFigure(q);
  if (band === 'core') {
    must(q.instruction === 'Find the equation of the line through A and B', 'instruction');
    const m = /^A(\(.+?\)) \\text\{ and \} B(\(.+?\))$/.exec(q.questionMath);
    must(m, 'two points');
    const [a, b] = [readPoint(m[1]), readPoint(m[2])];
    must((a[0] === b[0]) !== (a[1] === b[1]), 'two points sharing exactly one coordinate');
    const vertical = a[0] === b[0];
    const ans = vertical ? `x = ${a[0]}` : `y = ${a[1]}`;
    must(q.answer === ans, `answer ${q.answer}`);
    must(w.join('|') === [`\\text{both points have } ${ans}\\text{, so the line is ${vertical ? 'vertical' : 'horizontal'}}`, ans].join('|'), 'working');
    return { kind: vertical ? 'vertical' : 'horizontal' };
  }
  must(q.instruction === 'Find the equation of the line', 'instruction');
  const [l1, l2, l3] = lines(q.questionMath);
  must(l3 === undefined && l1 in DESCRIBED, `a description: ${l1}`);
  const [x, y] = readThrough(l2);
  must(x && y && Math.abs(x) !== Math.abs(y), 'a point whose coordinates cannot be mistaken for each other');
  const vertical = DESCRIBED[l1];
  const ans = vertical ? `x = ${x}` : `y = ${y}`;
  must(q.answer === ans, `answer ${q.answer}`);
  must(w.join('|') === [`\\text{the line is ${vertical ? 'vertical' : 'horizontal'}, so every point has } ${ans}`, ans].join('|'), 'working');
  return { kind: l1.replace(/\\text\{|\}/g, '').replace(/ +/g, ' ') };
}

/* ------------------------------------------- where a line meets x = a or y = b */

const readFlat = (tex) => { const m = /^([xy]) = (-?\d+)$/.exec(tex ?? ''); return m ? { axis: m[1], k: Number(m[2]) } : null; };

export function checkLinesMeet(q, band) {
  common(q, 'lines-meet', band);
  noFigure(q);
  must(q.instruction === 'Find the point where these two lines meet', 'instruction');
  const eqs = lines(q.questionMath);
  must(eqs.length === 2, 'two lines');
  const [px, py] = readPoint(q.answer);
  eqs.forEach((eq) => must(req(residual(eq, px, py), [0, 1]), `${q.answer} lies on ${eq}`));
  must(px !== 0 && py !== 0, 'a point off the axes');
  const w = lines(q.workingOut);
  if (band === 'foundation') {
    const f = eqs.map(readFlat);
    must(f[0] && f[1] && f[0].axis !== f[1].axis, 'x = a and y = b');
    must(w.join('|') === [`\\text{the point has } x = ${px} \\text{ and } y = ${py}`, q.answer].join('|'), 'working');
    return { kind: 'x = a and y = b' };
  }
  const flat = readFlat(eqs[1]);
  must(flat && !readFlat(eqs[0]), 'a sloping line, then x = k or y = k');
  const vertical = flat.axis === 'x';
  if (band === 'core') {
    const { m, c } = readSlope(eqs[0]);
    must(isWhole(m) && m[0] !== 0, 'a whole-number gradient');
    must(w.join('|') === (vertical
      ? [`y = ${m[0]} \\times ${br(px)}${signed(c)} = ${py}`, q.answer]
      : [`${py} = ${coefInt(m[0])}x${signed(c)}`, `x = ${px}`, q.answer]).join('|'), 'working');
    return { kind: vertical ? 'y = mx + c and x = k' : 'y = mx + c and y = k' };
  }
  const L = readGeneral(eqs[0]);
  must(L.b > 0, 'b positive');
  must(vertical ? L.b !== 1 : Math.abs(L.a) !== 1, 'something to divide by');
  must(w.join('|') === (vertical
    ? [`${L.a} \\times ${br(px)} + ${coefInt(L.b)}y = ${L.d}`, `${L.b}y = ${L.d - L.a * px}`, `y = ${py}`, q.answer]
    : [`${coefInt(L.a)}x + ${L.b} \\times ${br(py)} = ${L.d}`, `${L.a}x = ${L.d - L.b * py}`, `x = ${px}`, q.answer]).join('|'), 'working');
  return { kind: vertical ? 'general form and x = k' : 'general form and y = k' };
}

/* ------------------------------------------------- general form ax + by = d */

export function checkGeneralForm(q, band) {
  common(q, 'line-general-form', band);
  noFigure(q);
  const w = lines(q.workingOut);
  if (band === 'foundation') {
    must(q.instruction === 'Write this in the form ax + by = d', 'instruction');
    const { m, c } = readSlope(q.questionMath);
    must(!isWhole(m), 'a fraction to clear');
    const G = readGeneral(q.answer);
    must(G.a > 0, 'a positive');
    must(req(R(-G.a, G.b), m) && req(R(G.d, G.b), [c, 1]), 'the same line');
    must(w.join('|') === [`${m[1]}y = ${coefInt(m[0])}x${signed(m[1] * c)}`, q.answer].join('|'), 'working');
    return { kind: 'to general form' };
  }
  if (band === 'core') {
    must(q.instruction === 'Write this in the form y = mx + c', 'instruction');
    const L = readGeneral(q.questionMath);
    must(L.b >= 2, 'a y-coefficient to divide by');
    const { m, c } = readSlope(q.answer);
    must(req(m, R(-L.a, L.b)) && req([c, 1], R(L.d, L.b)), 'the same line');
    must(w.join('|') === [solvedForY(L), q.answer].join('|'), 'working');
    return { kind: 'to y = mx + c' };
  }
  must(q.instruction === 'Find the equation of the line through A and B, in the form ax + by = d', 'instruction');
  const pm = /^A(\(.+?\)) \\text\{ and \} B(\(.+?\))$/.exec(q.questionMath);
  must(pm, 'two points');
  const [p, r] = [readPoint(pm[1]), readPoint(pm[2])];
  must(p[0] !== r[0] && p[1] !== r[1], 'a sloping line');
  const m = R(r[1] - p[1], r[0] - p[0]);
  must(!isWhole(m), 'a fraction to clear');
  const G = readGeneral(q.answer);
  must(G.a > 0, 'a positive');
  [p, r].forEach(([x, y]) => must(G.a * x + G.b * y === G.d, `the line passes through (${x}, ${y})`));
  must(w.join('|') === [
    `m = \\frac{${r[1]} - ${br(p[1])}}{${r[0]} - ${br(p[0])}} = ${fracTex(m)}`,
    generalTex(G.a, G.b, 'd'),
    `d = ${G.a} \\times ${br(p[0])} + ${br(G.b)} \\times ${br(p[1])} = ${G.d}`,
    q.answer,
  ].join('|'), 'working');
  return { kind: 'from two points' };
}
