// Test support only. Checks the skills in quadraticGraphGenerators.js from
// what is printed: the quadratic is read back from the question (or from the
// drawn curve, when the graph is the question), its features are recomputed
// here, and the answer and every working line must agree with them. Nothing
// is imported from the generator.

import { compiles } from '../number/latexArithmetic.check';
import { value } from '../number/logarithmGenerators.check';

const must = (cond, msg) => { if (!cond) throw new Error(msg); };
const close = (a, b) => Number.isFinite(a) && Number.isFinite(b) && Math.abs(a - b) <= 1e-9 * Math.max(1, Math.abs(a), Math.abs(b));
const gcd = (a, b) => { a = Math.abs(a); b = Math.abs(b); while (b) [a, b] = [b, a % b]; return a; };
const POINTS = [-2.7, -1.3, 0.6, 1.9, 3.4];
const lines = (s) => String(s ?? '').split('\n');

/** a, b, c of a quadratic in x, read by evaluating it, and checked quadratic. */
const tri = (tex) => {
  const f = (x) => value(tex, { x });
  const c = f(0);
  const a = (f(1) + f(-1)) / 2 - c;
  const b = (f(1) - f(-1)) / 2;
  POINTS.forEach((t) => must(close(f(t), a * t * t + b * t + c), `not a quadratic: ${tex}`));
  must(a !== 0, `not a quadratic: ${tex}`);
  return { a, b, c };
};
const at = ({ a, b, c }, x) => a * x * x + b * x + c;
const sameFn = (p, q) => POINTS.forEach((t) => must(close(at(p, t), at(q, t)), 'not the same quadratic'));
const realRoots = ({ a, b, c }) => {
  const d = b * b - 4 * a * c;
  if (Math.abs(d) < 1e-9) return [-b / (2 * a)];
  if (d < 0) return [];
  const r = Math.sqrt(d);
  return [(-b - r) / (2 * a), (-b + r) / (2 * a)].sort((u, v) => u - v);
};
const vertex = (f) => { const h = -f.b / (2 * f.a); return [h, at(f, h)]; };

/** y = <rhs>, the rhs returned. */
const rhs = (line) => {
  must(line.startsWith('y = '), `not y = ...: ${line}`);
  return line.slice(4);
};

/** An integer, or a fraction in lowest terms with the sign out in front. */
const rational = (tex) => {
  let m = /^(-?)(\d+)$/.exec(tex);
  if (m) return Number(m[2]) * (m[1] ? -1 : 1);
  m = /^(-?)\\frac\{(\d+)\}\{(\d+)\}$/.exec(tex);
  must(m, `not an integer or a fraction: ${tex}`);
  const [n, d] = [Number(m[2]), Number(m[3])];
  must(d > 1 && gcd(n, d) === 1, `fraction not in lowest terms: ${tex}`);
  return (n / d) * (m[1] ? -1 : 1);
};
const point = (tex) => {
  const m = /^\((-?\d+), (-?\d+)\)$/.exec(tex);
  must(m, `not a point: ${tex}`);
  return [Number(m[1]), Number(m[2])];
};
/** "p \text{ and } q", smaller first, or a single value. */
const list = (tex, sep = ' \\text{ and } ') => {
  const vs = tex.split(sep).map(rational);
  must(vs.length <= 2, `too many values: ${tex}`);
  if (vs.length === 2) must(vs[0] < vs[1], `not smaller first: ${tex}`);
  return vs;
};
const sameList = (got, want, what) => {
  must(got.length === want.length, `${what}: ${got.length} values, ${want.length} expected`);
  got.forEach((g, i) => must(close(g, want[i]), `${what}: ${g} is not ${want[i]}`));
};

// The forms a quadratic is printed in. No unit coefficient, no zero term.
const NUM = '[1-9]\\d*';
const EXPANDED = new RegExp(`^-?(?:[2-9]|[1-9]\\d+)?x\\^2(?: [+-] (?:[2-9]|[1-9]\\d+)?x)?(?: [+-] ${NUM})?$`);
const TURNING = new RegExp(`^-?(?:[2-9]|[1-9]\\d+)?(?:\\(x [+-] ${NUM}\\)\\^2|x\\^2)(?: [+-] ${NUM})?$`);
const FACTORISED = new RegExp(`^-?(?:[2-9]|[1-9]\\d+)?(?:x|\\(x [+-] ${NUM}\\))(?:\\(x [+-] ${NUM}\\)|\\^2)$`);
const form = (tex, re, what) => must(re.test(tex), `not in ${what} form: ${tex}`);

const VTX = '\\text{vertex } ';
const YINT = 'y\\text{-intercept } ';

const lastIs = (q, want) => must(lines(q.workingOut).pop() === want, `working ends at ${lines(q.workingOut).pop()}`);

/** A drawn curve: to scale, x-intercepts on gridlines and dotted, in view. */
function readGraph(fig) {
  must(fig && fig.type === 'coordinate-grid', 'a coordinate grid');
  must(Array.isArray(fig.curves) && fig.curves.length === 1, 'one curve');
  must(!fig.line && !fig.lines && !fig.segment, 'nothing else drawn');
  const f = fig.curves[0];
  must(f.a !== 0 && [f.a, f.b, f.c].every(Number.isInteger), 'whole coefficients');
  const [x0, x1, y0, y1] = fig.window;
  const rs = realRoots(f);
  must(rs.length === 2, 'two x-intercepts to read');
  rs.forEach((r) => {
    must(Number.isInteger(Math.round(r * 1e9) / 1e9) && Math.abs(r - Math.round(r)) < 1e-9, `an x-intercept off the gridlines: ${r}`);
    must(r > x0 && r < x1, 'an x-intercept outside the window');
  });
  const dots = (fig.points ?? []).map((p) => [p.x, p.y]).sort((u, v) => u[0] - v[0]);
  must(dots.length === 2 && dots.every(([x, y], i) => y === 0 && close(x, rs[i])), 'the x-intercepts dotted');
  const [, k] = vertex(f);
  must(k > y0 && k < y1 && x0 <= 0 && x1 >= 0 && y0 <= 0 && y1 >= 0, 'the vertex and origin in view');
  return { f, roots: rs.map(Math.round) };
}

/* ---------------------------------------------------------- substitution */

function checkSubstitution(q, band) {
  // The formula is the whole question; the value given is in the
  // instruction, in words, with a true minus sign.
  const [l1] = lines(q.questionMath);
  must(lines(q.questionMath).length === 1, 'one question line: the formula');
  const f = tri(rhs(l1));
  form(rhs(l1), EXPANDED, 'expanded');
  must(q.visualization === null, 'no figure');
  if (band !== 'stretch') {
    const m = new RegExp(`^Find the value of y when x = (${INUM})$`).exec(q.instruction);
    must(m, `the x given: ${q.instruction}`);
    const x = num(m[1]);
    must(band === 'foundation' ? x > 0 && f.a === 1 : x < 0, 'the band of x');
    if (band === 'core') must(f.a !== 1, 'a leading coefficient at Core');
    const y = at(f, x);
    must(q.answer === `y = ${y}`, `answer: ${q.answer}, expected y = ${y}`);
    const w = lines(q.workingOut);
    must(w.length === 3 && w[0].includes(`(${x})^2`) && !w[1].includes('('), 'working: substitute, multiply, add');
    w.forEach((ln) => must(close(value(rhs(ln)), y), `working line: ${ln}`));
    lastIs(q, q.answer);
    return { kind: band === 'foundation' ? 'x positive' : 'x negative' };
  }
  must(f.a === 1, 'monic at Stretch');
  const m = new RegExp(`^Find the value or values of x when y = (${INUM})$`).exec(q.instruction);
  must(m, `the y given: ${q.instruction}`);
  const k = num(m[1]);
  const g = { ...f, c: f.c - k };
  const want = realRoots(g);
  must(want.length > 0 && want.every((r) => Number.isInteger(Math.round(r)) && close(r, Math.round(r))), 'whole roots');
  const am = /^x = (.+)$/.exec(q.answer);
  must(am, `answer: ${q.answer}`);
  sameList(list(am[1], ' \\text{ or } '), want, 'roots');
  const w = lines(q.workingOut);
  w.slice(0, -1).forEach((ln) => {
    const [L, R] = ln.split(' = ');
    must(ln.split(' = ').length === 2, `one equation: ${ln}`);
    POINTS.forEach((t) => must(close(value(L, { x: t }) - value(R, { x: t }), at(g, t)), `working line: ${ln}`));
  });
  lastIs(q, q.answer);
  return { kind: want.length === 1 ? 'one root' : 'two roots' };
}

/* ----------------------------------------------------------- vertex form */

function checkVertexForm(q, band) {
  must(lines(q.questionMath).length === 1 && q.visualization === null, 'one line, no figure');
  const src = rhs(q.questionMath);
  form(src, TURNING, 'turning point');
  const f = tri(src);
  const [h, k] = vertex(f);
  if (band !== 'stretch') {
    must(q.instruction === 'Write down the coordinates of the vertex', 'instruction');
    must(Math.abs(f.a) === 1, 'a = ±1 below Stretch');
    if (band === 'foundation') must((h === 0) !== (k === 0), 'one shift at Foundation');
    else must(h !== 0 && k !== 0, 'both shifts at Core');
    const [ah, ak] = point(q.answer);
    must(close(ah, h) && close(ak, k), `vertex ${q.answer}, expected (${h}, ${k})`);
    must(lines(q.workingOut)[0] === `h = ${h}, \\; k = ${k}`, 'working reads h and k');
    lastIs(q, q.answer);
    return { kind: band === 'core' ? 'both shifts' : h === 0 ? 'up or down' : 'across' };
  }
  must(q.instruction === 'Find the vertex and the y-intercept', 'instruction');
  must(Math.abs(f.a) !== 1 && h !== 0 && k !== 0, 'a non-unit a and both shifts');
  const [v, y] = lines(q.answer);
  must(lines(q.answer).length === 2 && v.startsWith(VTX) && y.startsWith(YINT), `answer: ${q.answer}`);
  const [ah, ak] = point(v.slice(VTX.length));
  must(close(ah, h) && close(ak, k), 'vertex');
  must(close(rational(y.slice(YINT.length)), f.c), `y-intercept ${y}, expected ${f.c}`);
  const w = lines(q.workingOut);
  must(w[0] === v, 'working names the vertex');
  must(w[1] === `y = ${src.replace(/x/g, '0')}`, 'working substitutes x = 0');
  w.slice(1).forEach((ln) => rhs(ln).split(' = ').forEach((p) => must(close(value(p), f.c), `working line: ${ln}`)));
  must(w.pop().endsWith(` = ${f.c}`), 'working ends at the y-intercept');
  return { kind: 'with y-intercept' };
}

/* ------------------------------------------------------------ intercepts */

function checkIntercepts(q, band) {
  must(lines(q.questionMath).length === 1 && q.visualization === null, 'one line, no figure');
  const src = rhs(q.questionMath);
  const f = tri(src);
  const rs = realRoots(f);
  must(rs.length > 0, 'it meets the x-axis');
  // Each working line E = 0 is the question's quadratic; x = ... its roots.
  const work = () => lines(q.workingOut).forEach((ln) => {
    if (ln.startsWith('x = 0: ')) {
      must(ln === `x = 0: \\; y = ${f.c}`, `working line: ${ln}`);
    } else if (ln.startsWith('x = ')) {
      sameList(list(ln.slice(4), ' \\text{ or } '), rs, 'working roots');
    } else {
      must(ln.endsWith(' = 0'), `working line: ${ln}`);
      sameFn(tri(ln.slice(0, -4)), f);
    }
  });
  if (band !== 'stretch') {
    form(src, band === 'foundation' ? FACTORISED : EXPANDED, band === 'foundation' ? 'factorised' : 'expanded');
    if (band === 'core') must(f.a === 1, 'monic at Core');
    must(q.instruction === (rs.length === 1 ? 'Find the x-intercept' : 'Find the x-intercepts'), 'instruction');
    sameList(list(q.answer), rs, 'x-intercepts');
    work();
    must(lines(q.workingOut).pop().startsWith('x = '), 'working ends at the roots');
    return { kind: rs.length === 1 ? 'one root' : 'two roots' };
  }
  form(src, EXPANDED, 'expanded');
  must(f.a !== 1 && f.b !== 0 && f.c !== 0, 'non-monic, every term present');
  must(q.instruction === 'Find the axes intercepts', 'instruction');
  const [xl, yl] = lines(q.answer);
  const head = rs.length === 1 ? 'x\\text{-intercept } ' : 'x\\text{-intercepts } ';
  must(lines(q.answer).length === 2 && xl.startsWith(head) && yl.startsWith(YINT), `answer: ${q.answer}`);
  sameList(list(xl.slice(head.length)), rs, 'x-intercepts');
  must(rational(yl.slice(YINT.length)) === f.c, `y-intercept ${yl}`);
  work();
  must(lines(q.workingOut).pop() === `x = 0: \\; y = ${f.c}`, 'working ends at the y-intercept');
  return { kind: rs.every((r) => close(r, Math.round(r))) ? 'whole roots' : 'a fractional root' };
}

/* -------------------------------------------------------------- symmetry */

function checkSymmetry(q, band) {
  if (band === 'foundation' && q.visualization) {
    must(q.questionMath === undefined, 'the graph alone');
    const { f, roots } = readGraph(q.visualization);
    must(Math.abs(f.a) === 1, 'a = ±1 on a drawn graph');
    const h = (roots[0] + roots[1]) / 2;
    must(Number.isInteger(h), 'the line of symmetry on a gridline');
    must(q.instruction === 'Find the equation of the line of symmetry', 'instruction');
    must(q.answer === `x = ${h}`, `answer ${q.answer}, expected x = ${h}`);
    const w = lines(q.workingOut);
    must(w[0] === `x\\text{-intercepts } ${roots[0]} \\text{ and } ${roots[1]}`, 'working reads the intercepts');
    must(w[1] === `x = \\frac{${roots[0]} + ${roots[1]}}{2}`, 'working averages them');
    w.slice(1).forEach((ln) => must(close(value(ln.slice(4)), h) && ln.startsWith('x = '), `working line: ${ln}`));
    lastIs(q, q.answer);
    return { kind: 'graph' };
  }
  must(lines(q.questionMath).length === 1 && q.visualization === null, 'one line, no figure');
  const src = rhs(q.questionMath);
  const f = tri(src);
  const [h, k] = vertex(f);
  if (band !== 'stretch') {
    must(q.instruction === 'Find the equation of the line of symmetry', 'instruction');
    form(src, band === 'foundation' ? FACTORISED : EXPANDED, band === 'foundation' ? 'factorised' : 'expanded');
    if (band === 'foundation') must(realRoots(f).length === 2, 'two intercepts to average');
    must(q.answer.startsWith('x = ') && close(rational(q.answer.slice(4)), h), `answer ${q.answer}, expected x = ${h}`);
    const w = lines(q.workingOut);
    if (band === 'foundation') {
      const rs = realRoots(f);
      must(w[0] === `x\\text{-intercepts } ${rs[0]} \\text{ and } ${rs[1]}`, 'working reads the intercepts');
      must(w[1] === `x = \\frac{${rs[0]} + ${rs[1]}}{2}`, 'working averages them');
    } else must(w[0] === 'x = \\frac{-b}{2a}', 'working quotes the rule');
    w.slice(1).forEach((ln) => must(ln.startsWith('x = ') && close(value(ln.slice(4)), h), `working line: ${ln}`));
    lastIs(q, q.answer);
    return { kind: band === 'foundation' ? 'factorised' : Number.isInteger(h) ? 'whole' : 'fraction' };
  }
  must(q.instruction === 'Find the coordinates of the vertex', 'instruction');
  form(src, EXPANDED, 'expanded');
  const [ah, ak] = point(q.answer);
  must(close(ah, h) && close(ak, k), `vertex ${q.answer}, expected (${h}, ${k})`);
  const w = lines(q.workingOut);
  w[0].slice(4).split(' = ').forEach((p) => must(close(value(p), h), `working line: ${w[0]}`));
  must(w[1] === `y = ${src.replace(/x/g, `(${h})`)}`, 'working substitutes the x of the vertex');
  w.slice(1, -1).forEach((ln) => must(close(value(rhs(ln)), k), `working line: ${ln}`));
  lastIs(q, q.answer);
  return { kind: 'vertex' };
}

/* --------------------------------------------------------- find function */

// "vertex (h, k), \; y-intercept d" and friends, parsed into what is given.
// A number in an instruction: Archivo, so a true minus sign. A hyphen there
// is a bug (it reads as a dash), so NUM does not accept one.
const INUM = '\u2212?\\d+';
const num = (t) => Number(t.replace('\u2212', '-'));
const PT = `\\((${INUM}), (${INUM})\\)`;
// What the instruction gives, after the task: the vertex or the
// x-intercepts, then perhaps a y-intercept or a point.
const GIVEN = new RegExp(`^(?:the vertex ${PT}|the x-intercepts (${INUM}) and (${INUM}))(?: and the y-intercept (${INUM})|,? and the point ${PT})?$`);
// "Find b and c given the vertex (5, −4)": the task, and what is given.
const task = (instr) => {
  const m = /^(Find [a-z, ]+ and [a-z]) given (.+)$/.exec(instr);
  must(m, `task and given: ${instr}`);
  const g = GIVEN.exec(m[2]);
  must(g, `given: ${m[2]}`);
  return { ask: m[1], m: [g[0], ...g.slice(1).map((t) => (t === undefined ? undefined : num(t)))] };
};

function checkFindFunction(q, band) {
  must(q.answer.startsWith('y = '), 'an equation');
  const ans = rhs(q.answer);
  const f = tri(ans);
  const w = lines(q.workingOut);
  lastIs(q, q.answer);
  // Every working line that is an equation in x (and a, once found) is the answer.
  const aLine = w.find((ln) => /^a = -?\d+$/.test(ln));
  w.forEach((ln) => {
    // "18 = 9a - 5": the given point substituted, true for the answer's a.
    if (/^-?\d+ = /.test(ln)) {
      const [L, R] = ln.split(' = ');
      must(close(value(L), value(R, { a: f.a })), `working line: ${ln}`);
      return;
    }
    if (!ln.startsWith('y = ')) return;
    const body = rhs(ln);
    if (/a/.test(body.replace(/\\[a-z]+/g, ''))) {
      must(aLine && Number(aLine.slice(4)) === f.a, 'a found as the answer has it');
      POINTS.forEach((t) => must(close(value(body, { x: t, a: f.a }), at(f, t)), `working line: ${ln}`));
    } else sameFn(tri(body), f);
  });

  // The given point substituted, into the general form the working starts from.
  const sub = (x, y) => {
    must(w[0].startsWith('y = a'), 'working starts from the general form');
    must(w[1] === `${y} = ${rhs(w[0]).replace(/x/g, `(${x})`)}`, 'working substitutes the given point');
  };

  if (band === 'foundation') {
    must(f.a === 1, 'monic at Foundation');
    form(ans, EXPANDED, 'expanded');
    if (q.visualization) {
      must(q.questionMath === 'y = x^2 + bx + c' && q.instruction === 'Find the equation of the curve', 'the form asked');
      const { f: g } = readGraph(q.visualization);
      sameFn(g, f);
      return { kind: 'graph' };
    }
    const { ask, m } = task(q.instruction);
    must(q.questionMath === 'y = x^2 + bx + c' && ask === 'Find b and c', 'the form asked');
    must(m[5] === undefined && m[6] === undefined, `given: ${q.instruction}`);
    if (m[1] !== undefined) {
      const [h, k] = vertex(f);
      must(h === Number(m[1]) && close(k, Number(m[2])), 'the vertex given');
      return { kind: 'vertex' };
    }
    sameList([Number(m[3]), Number(m[4])], realRoots(f), 'the x-intercepts given');
    must(Number(m[3]) < Number(m[4]), 'intercepts smaller first');
    return { kind: 'intercepts' };
  }

  must(q.visualization === null, 'no figure');
  const l1 = q.questionMath;
  const { ask, m } = task(q.instruction);
  if (m[1] !== undefined) {
    must(l1 === 'y = a(x - h)^2 + k' && ask === 'Find a, h and k', 'the form asked');
    form(ans, TURNING, 'turning point');
    const [h, k] = vertex(f);
    must(h === Number(m[1]) && close(k, Number(m[2])) && h !== 0, 'the vertex given');
    if (band === 'core') {
      must(m[5] !== undefined, 'a y-intercept at Core');
      must(close(f.c, Number(m[5])), 'through the y-intercept');
      sub(0, Number(m[5]));
      return { kind: 'vertex and y-intercept' };
    }
    must(m[6] !== undefined, 'a point at Stretch');
    const [x, y] = [Number(m[6]), Number(m[7])];
    must(x !== 0 && x !== h && close(at(f, x), y), 'through the point');
    sub(x, y);
    return { kind: 'vertex and a point' };
  }
  must(band === 'stretch' && m[6] !== undefined, 'intercepts and a point at Stretch');
  must(l1 === 'y = ax^2 + bx + c' && ask === 'Find a, b and c', 'the form asked');
  form(ans, EXPANDED, 'expanded');
  must(f.a !== 1, 'a found, not 1');
  sameList([Number(m[3]), Number(m[4])], realRoots(f), 'the x-intercepts given');
  const [x, y] = [Number(m[6]), Number(m[7])];
  must(Number(m[3]) < Number(m[4]) && y !== 0 && close(at(f, x), y), 'through the point');
  sub(x, y);
  return { kind: 'intercepts and a point' };
}

/* ------------------------------------------------------------------- all */

const CHECKS = {
  'quadratic-substitution': checkSubstitution,
  'quadratic-vertex-form': checkVertexForm,
  'quadratic-intercepts': checkIntercepts,
  'quadratic-symmetry': checkSymmetry,
  'quadratic-find-function': checkFindFunction,
};

export function checkQuadraticGraphs(q, band) {
  const run = CHECKS[q.metadata?.topic];
  must(run, `unknown topic ${q.metadata?.topic}`);
  must(q.metadata.difficulty === band, 'metadata band');
  // Only substitution and finding the function give a value in the
  // instruction, in words; the other topics' instructions never hold one.
  const gives = ['quadratic-substitution', 'quadratic-find-function'].includes(q.metadata.topic);
  if (!gives) must(!/\d/.test(q.instruction), `a digit in the instruction: ${q.instruction}`);
  must(!/-/.test(q.instruction.replace(/[a-z]-intercept/g, '')), `a hyphen for a minus sign: ${q.instruction}`);
  [q.questionMath, q.answer, q.workingOut].forEach((s) => s !== undefined && compiles(s));
  return run(q, band);
}
