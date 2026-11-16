// Test support only. Checks the function-graph skills from what is printed:
// transforming-graphs, cubic-graphs, tangent-gradient, exponential-graphs.
// Equations are read back by evaluating them (latexArithmetic.check), and
// curves, lines and points off the figure config; the answer is worked out
// here and must agree, as must the working. Nothing is imported from the
// generator.

import { asRational, compiles, exactOf, subst } from '../number/latexArithmetic.check';

// A figure label is plain text, so its minus is a real one.
const ptLabel = (x, y) => `(${x}, ${y})`.replace(/-(?=\d)/g, '−');
const must = (cond, msg) => { if (!cond) throw new Error(msg); };
const lines = (s) => String(s ?? '').split('\n');

/** An expression in x, exactly, at a whole or rational x. */
const at = (expr, x) => {
  const v = asRational(exactOf(subst(expr, { x: String(x) })));
  must(v, `a rational value of ${expr} at ${x}`);
  return v[0] / v[1];
};
const close = (a, b) => Math.abs(a - b) < 1e-9;
const fracTex = (n, d) => {
  const g = ((a, b) => { a = Math.abs(a); b = Math.abs(b); while (b) [a, b] = [b, a % b]; return a; })(n, d) || 1;
  [n, d] = [n / g, d / g];
  if (d < 0) { n = -n; d = -d; }
  return d === 1 ? String(n) : n < 0 ? `-\\frac{${-n}}{${d}}` : `\\frac{${n}}{${d}}`;
};

function common(q, topic, band) {
  must(q.metadata?.topic === topic && q.metadata.difficulty === band, 'metadata');
  [q.questionMath, q.answer, q.workingOut].filter((s) => s !== undefined).forEach((s) => compiles(s));
  must(typeof q.workingOut === 'string' && !q.workingOut.includes('\\n'), 'real newlines');
  must(lines(q.workingOut).at(-1).endsWith(q.answer.replace(/^f\(-?\d+\) = /, '')), 'the working ends on the answer');
}

function grid(q) {
  const f = q.visualization;
  must(f?.type === 'coordinate-grid' && f.big === true && Array.isArray(f.window), 'a coordinate grid with a window');
  const [x0, x1, y0, y1] = f.window;
  must(x0 < 0 && x1 > 0 && y0 < 0 && y1 > 0, 'both axes on the grid');
  must(x1 - x0 <= 12 && y1 - y0 <= 12, 'a window small enough to count squares in');
  const inWin = ([x, y]) => x >= x0 && x <= x1 && y >= y0 && y <= y1;
  return { f, inWin };
}

/* ------------------------------------------------ transforming graphs */

const quadAt = ({ a, b, c }, x) => a * x * x + b * x + c;
const vertexOf = ({ a, b, c }) => { const h = -b / (2 * a); return [h, quadAt({ a, b, c }, h)]; };

export function checkTransforming(q, band) {
  common(q, 'transforming-graphs', band);
  must(q.instruction === 'Write g(x) in terms of f(x)' && q.questionMath === undefined, 'instruction');
  const { f: fig, inWin } = grid(q);
  const [F, G] = fig.curves ?? [];
  must(fig.curves.length === 2 && F.ink && !G.ink && F.label === 'f' && G.label === 'g', 'f in ink, g in the slot colour, labelled');
  must(F.a === 1, 'f is y = (x - p)^2 + q');
  const [p, qq] = vertexOf(F);
  must(Number.isInteger(p) && Number.isInteger(qq), 'f has its vertex on a gridline crossing');
  // Each label beside its own curve: level with it 0.6 to one side, on the
  // outside of the arm, and inside the grid.
  [F, G].forEach((c) => {
    const [lx, ly] = c.labelAt;
    const [vx] = vertexOf(c);
    const side = lx > vx ? 1 : -1;
    must(close(ly, quadAt(c, lx - side * 0.6)), `${c.label}'s label beside its curve`);
    must(inWin(c.labelAt), `${c.label}'s label on the grid`);
  });
  // Clear of each other, and each clear of the other curve.
  must(Math.hypot(F.labelAt[0] - G.labelAt[0], F.labelAt[1] - G.labelAt[1]) >= 1.2, 'the labels apart');
  must(Math.abs(F.labelAt[1] - quadAt(G, F.labelAt[0])) >= 0.6 && Math.abs(G.labelAt[1] - quadAt(F, G.labelAt[0])) >= 0.6, 'each label clear of the other curve');
  const m = /^g\(x\) = (-|2)?f\(x(?: ([+-]) (\d+))?\)(?: ([+-]) (\d+))?$/.exec(q.answer);
  must(m, `answer in the form a·f(x - h) + k: ${q.answer}`);
  const a = m[1] === '-' ? -1 : m[1] === '2' ? 2 : 1;
  const h = m[2] ? (m[2] === '-' ? 1 : -1) * Number(m[3]) : 0;
  const k = m[4] ? (m[4] === '+' ? 1 : -1) * Number(m[5]) : 0;
  // g(x) = a·f(x - h) + k, compared at several x.
  [-2, -1, 0, 1, 2, 3].forEach((x) => must(close(quadAt(G, x), a * quadAt(F, x - h) + k), `g is ${q.answer} at x = ${x}`));
  const [gp, gq] = vertexOf(G);
  must(inWin([p, qq]) && inWin([gp, gq]), 'both vertices on the grid');
  must(Math.hypot(gp - p, gq - qq) >= 2, 'the two curves told apart');
  const rule = {
    foundation: a === 1 && (h === 0) !== (k === 0),
    core: (a === -1 || a === 2) && h === 0 && k === 0,
    stretch: (a === 1 && h !== 0 && k !== 0) || (a === -1 && h === 0 && k !== 0),
  }[band];
  must(rule, `the band's transformation: ${q.answer}`);
  const lr = (v) => (v > 0 ? 'right' : 'left'), ud = (v) => (v > 0 ? 'up' : 'down');
  const say = a === 2 ? '\\text{stretched from the } x\\text{-axis, scale factor } 2'
    : a === -1 ? (k ? `\\text{reflected in the } x\\text{-axis, then translated ${ud(k)} } ${Math.abs(k)}` : '\\text{reflected in the } x\\text{-axis}')
      : h && k ? `\\text{translated ${lr(h)} } ${Math.abs(h)} \\text{ and ${ud(k)} } ${Math.abs(k)}`
        : h ? `\\text{translated ${lr(h)} } ${Math.abs(h)}` : `\\text{translated ${ud(k)} } ${Math.abs(k)}`;
  must(lines(q.workingOut).join('|') === [`\\text{vertex } (${p}, ${qq}) \\to (${gp}, ${gq})`, say, q.answer].join('|'), 'working: the vertex moves, how, then g');
  const kind = a === 2 ? 'stretch' : a === -1 ? (k ? 'reflect and translate' : 'reflect') : h && k ? 'translate both ways' : h ? 'translate across' : 'translate up or down';
  return { kind };
}

/* ------------------------------------------------------------ cubic graphs */

/** The whole-number roots of a cubic in x, from -12 to 12, with multiplicity. */
function rootsOf(fx) {
  const out = [];
  for (let r = -12; r <= 12; r += 1) {
    if (!close(fx(r), 0)) continue;
    // Touching: the curve keeps its sign either side.
    const touch = Math.sign(fx(r - 0.01)) === Math.sign(fx(r + 0.01));
    out.push({ r, touch });
  }
  return out;
}

export function checkCubic(q, band) {
  common(q, 'cubic-graphs', band);
  if (band !== 'stretch') {
    const core = band === 'core';
    must(q.instruction === (core
      ? 'Where does the graph of this cubic meet each axis? Where does it touch the x-axis?'
      : 'Where does the graph of this cubic meet each axis?'), 'instruction');
    must(q.visualization === undefined, 'no figure');
    must(/^y = /.test(q.questionMath), 'y = a cubic');
    const expr = q.questionMath.slice(4);
    const fx = (x) => at(expr, x);
    // A cubic: the third differences are constant and not zero.
    const v = [0, 1, 2, 3, 4].map(fx);
    const d3 = v[3] - 3 * v[2] + 3 * v[1] - v[0];
    must(!close(d3, 0) && close(v[4] - 3 * v[3] + 3 * v[2] - v[1], d3), 'a cubic');
    must(core ? close(Math.abs(d3), 6) || close(Math.abs(d3), 12) : close(d3, 6), core ? 'a leading 1, -1, 2 or -2' : 'a leading 1');
    const roots = rootsOf(fx);
    const y0 = fx(0);
    // A negative number after a word, braced so it reads as a sign.
    const br = (v) => (v < 0 ? `{${v}}` : String(v));
    // 0 put in for x in the printed factors.
    const sub = expr.replace(/\(x /g, '(0 ').replace(/x/g, '(0)');
    const w = lines(q.workingOut);
    must(w[0] === `y = 0: \\ x = ${roots.map((r) => r.r).join(', ')}` && w[1] === `x = 0: \\ y = ${sub} = ${y0}` && w.length === 3, 'working: y = 0, then x = 0');
    if (core) {
      must(roots.length === 2 && roots.filter((r) => r.touch).length === 1, 'one root it touches, one it cuts');
      const t = roots.find((r) => r.touch).r, c = roots.find((r) => !r.touch).r;
      must(q.answer === `\\text{touches at } x = ${t}, \\ \\text{cuts at } x = ${c}; \\ y\\text{-intercept } ${br(y0)}`, `answer ${q.answer}`);
      return { kind: 'repeated root' };
    }
    must(roots.length === 3 && roots.every((r) => !r.touch), 'three roots it cuts');
    must(q.answer === `x\\text{-intercepts } ${roots.map((r) => br(r.r)).join(', ')}; \\ y\\text{-intercept } ${br(y0)}`, `answer ${q.answer}`);
    return { kind: roots.some((r) => r.r === 0) ? 'root at 0' : 'three roots' };
  }

  must(q.instruction === 'Find the equation of the cubic, in factorised form', 'instruction');
  const { f: fig, inWin } = grid(q);
  must(fig.curves?.length === 1 && fig.curves[0].cubic && !fig.curves[0].ink, 'one cubic, in the slot colour');
  const [A, B, C, D] = fig.curves[0].cubic;
  const fx = (x) => ((A * x + B) * x + C) * x + D;
  const roots = rootsOf(fx);
  must(roots.length === 3 && roots.every((r) => !r.touch && r.r !== 0), 'three roots, none at 0');
  // Every root dotted on the x-axis, and the y-intercept dotted and labelled.
  const pts = fig.points ?? [];
  roots.forEach(({ r }) => must(pts.some((p) => p.x === r && p.y === 0 && !p.label) && inWin([r, 0]), `the root ${r} marked`));
  must(Number.isInteger(D) && D !== 0, 'a whole y-intercept');
  must(pts.some((p) => p.x === 0 && p.y === D && p.label === ptLabel(0, D)) && inWin([0, D]), 'the y-intercept marked with its coordinates');
  // Its label right of the axis, on the side the curve leaves empty, and
  // never pushed up from -1 onto the x-axis numbers.
  const dir = pts.find((p) => p.label).labelDir ?? [];
  const slope0 = C;
  must(dir[0] === 1 && dir[1] === (slope0 > 0 ? -1 : 1) && !(dir[1] === 1 && D === -1), 'the y-intercept label clear of the curve and the axis numbers');
  must(pts.length === 4, 'four points marked');
  must(/^y = (-|\\frac\{1\}\{2\}|-\\frac\{1\}\{2\}|2|-2)?(\(x [+-] \d\)){3}$/.test(q.answer), `factorised form: ${q.answer}`);
  const expr = q.answer.slice(4);
  [-3, -1, 0, 1, 2, 5].forEach((x) => must(close(at(expr, x), fx(x)), `the answer is the cubic drawn, at x = ${x}`));
  const fs = expr.match(/\(x [+-] \d\)/g).join('');
  const rs = roots.map(({ r }) => r);
  const prod = -rs[0] * -rs[1] * -rs[2];
  const aTex = { 1: '1', '-1': '-1', 2: '2', '-2': '-2', 0.5: '\\frac{1}{2}', '-0.5': '-\\frac{1}{2}' }[A];
  must(lines(q.workingOut).join('|') === [
    `y = a${fs}`,
    `x = 0: \\ ${D} = a${rs.map((r) => `(${-r})`).join('')}`,
    `${D} = ${prod}a, \\ a = ${aTex}`,
    q.answer,
  ].join('|'), 'working: the factors, then a from the y-intercept');
  return { kind: Math.abs(A) === 0.5 ? 'a half' : Math.abs(A) === 2 ? 'a of 2' : 'a of 1' };
}

/* -------------------------------------------------------- tangent gradient */

export function checkTangent(q, band) {
  common(q, 'tangent-gradient', band);
  const stretch = band === 'stretch';
  must(q.instruction === (stretch
    ? 'The line is the tangent to the curve at P. Find its equation'
    : 'The line is the tangent to the curve at P. Find the gradient of the curve at P'), 'instruction');
  const { f: fig, inWin } = grid(q);
  const [cv] = fig.curves ?? [];
  const [ln] = fig.lines ?? [];
  must(fig.curves.length === 1 && cv.ink && cv.a !== undefined, 'the curve, in ink');
  must(fig.lines.length === 1 && !ln.ink && ln.m !== undefined, 'the tangent, in the slot colour');
  const P = fig.points.find((p) => p.label === 'P');
  const Q = fig.points.find((p) => p.label === 'Q');
  must(fig.points.length === 2 && P && Q, 'P and Q marked');
  [P, Q].forEach((p) => must(Number.isInteger(p.x) && Number.isInteger(p.y) && inWin([p.x, p.y]), 'on gridline crossings, on the grid'));
  // Each letter on the far side of the tangent from the curve, and clear of
  // the axes and their numbers.
  const dir = cv.a > 0 ? [Math.sign(ln.m), -1] : [-Math.sign(ln.m), 1];
  [P, Q].forEach((p) => {
    must(String(p.labelDir) === String(dir), `${p.label}'s letter off the lines`);
    const [ux, uy] = dir;
    must(p.x !== 0 && p.y !== 0 && !(ux === -1 && p.x === 1) && !(ux === 1 && p.x === -1) && !(uy === 1 && p.y === -1), `${p.label}'s letter clear of the axes and their numbers`);
  });
  must(close(quadAt(cv, P.x), P.y), 'P on the curve');
  const slope = 2 * cv.a * P.x + cv.b;
  must(close(ln.m, slope) && close(ln.m * P.x + ln.c, P.y), 'the line touches the curve at P');
  must(close(ln.m * Q.x + ln.c, Q.y) && Q.x > P.x, 'Q on the tangent, to the right of P');
  // Read off the grid: rise over run between P and Q.
  const [n, d] = [Q.y - P.y, Q.x - P.x];
  const m = n / d;
  const mTex = fracTex(n, d);
  must(close(m, slope), 'rise over run is the gradient');
  const half = !Number.isInteger(m);
  if (band === 'foundation') must(!half && m > 0, 'a positive whole gradient');
  if (band === 'core') must(half || m < 0, 'a negative or half gradient');
  must(Math.abs(m) <= 3 && m !== 0, 'a gradient that can be counted');
  const w = lines(q.workingOut);
  const br = (v) => (v < 0 ? `(${v})` : `${v}`);
  must(w[0] === `m = \\frac{${Q.y} - ${br(P.y)}}{${Q.x} - ${br(P.x)}} = ${mTex}`, 'working: rise over run');
  if (!stretch) {
    must(q.answer === mTex, `answer ${q.answer}, expected ${mTex}`);
    return { kind: half ? 'a half' : m > 0 ? 'positive' : 'negative' };
  }
  const c = P.y - m * P.x;
  must(Number.isInteger(c) && close(c, ln.c), 'a whole intercept');
  must(w[1] === `${P.y} = ${mTex} \\times ${br(P.x)} + c, \\ c = ${c}` && w.length === 3, 'working: c from P');
  const coef = Math.abs(m) === 1 ? (m < 0 ? '-' : '') : mTex;
  const want = `y = ${coef}x${c ? ` ${c < 0 ? '-' : '+'} ${Math.abs(c)}` : ''}`;
  must(q.answer === want, `answer ${q.answer}, expected ${want}`);
  return { kind: half ? 'a half' : 'whole' };
}

/* -------------------------------------------------------- exponential graphs */

export function checkExponential(q, band) {
  common(q, 'exponential-graphs', band);
  if (band !== 'stretch') {
    must(q.instruction === 'Find the value' && q.visualization === undefined, 'instruction, no figure');
    const [def, call] = lines(q.questionMath);
    const m = /^f\(x\) = (?:(\d+) \\times )?(\d)\^x(?: ([+-]) (\d+))?$/.exec(def);
    must(m, `f(x) = k·b^x + c: ${def}`);
    const [k, b] = [m[1] ? Number(m[1]) : 1, Number(m[2])];
    const c = m[3] ? (m[3] === '+' ? 1 : -1) * Number(m[4]) : 0;
    must(k !== 1 || m[1] === undefined, 'a k of 1 not written');
    const n = Number(/^f\((-?\d+)\)$/.exec(call)?.[1]);
    must(Number.isInteger(n), `f at a whole number: ${call}`);
    must(band === 'foundation' ? n >= 0 && n <= 3 : n < 0, band === 'foundation' ? 'x from 0 to 3' : 'a negative x');
    // k·b^n + c exactly.
    const [num, den] = n >= 0 ? [k * b ** n + c, 1] : [k + c * b ** -n, b ** -n];
    must(q.answer === `f(${n}) = ${fracTex(num, den)}`, `answer ${q.answer}, expected ${fracTex(num, den)}`);
    const kx = k === 1 ? '' : `${k} \\times `;
    const cs = c ? ` ${c < 0 ? '-' : '+'} ${Math.abs(c)}` : '';
    must(lines(q.workingOut).join('|') === [
      `f(${n}) = ${kx}${b}^{${n}}${cs}`,
      `= ${kx}${n < 0 ? `\\frac{1}{${b ** -n}}` : b ** n}${cs}`,
      `= ${fracTex(num, den)}`,
    ].join('|'), 'working: substitute, the power, the value');
    return { kind: n === 0 ? 'f(0)' : n > 0 ? 'positive x' : 'negative x' };
  }
  must(q.instruction === 'The graph has the equation given. Find k and c', 'instruction');
  const { f: fig, inWin } = grid(q);
  const [cv] = fig.curves ?? [];
  must(fig.curves.length === 1 && cv.exp && !cv.ink, 'one exponential curve');
  const [k, b, c] = cv.exp;
  must(q.questionMath === `y = k \\times ${b}^x + c`, 'the base in the equation is the curve\'s');
  const [asym] = fig.lines ?? [];
  must(fig.lines.length === 1 && asym.m === 0 && asym.ink && asym.dashed, 'the asymptote, dashed in ink');
  must(asym.c === c, 'the asymptote where the curve levels off');
  const [P] = fig.points ?? [];
  must(fig.points.length === 1 && P.x === 0 && P.y === k + c && P.label === ptLabel(0, k + c) && inWin([0, k + c]), 'the y-intercept marked with its coordinates');
  must(String(P.labelDir) === '1,-1', 'its label below and right, where the curve is not');
  must(P.y !== 0 && fig.hug === true, 'the y-intercept off the origin; the graph hugs, beside its equation');
  must(inWin([fig.window[0], c]), 'the asymptote on the grid');
  must(q.answer === `k = ${P.y - asym.c}, \\ c = ${asym.c}`, `answer ${q.answer}`);
  const cs = c < 0 ? `- ${-c}` : `+ ${c}`;
  must(lines(q.workingOut).join('|') === [
    `\\text{asymptote } y = ${c}, \\text{ so } c = ${c}`,
    `x = 0: \\ ${k + c} = k \\times 1 ${cs}, \\text{ so } k = ${k}`,
    q.answer,
  ].join('|'), 'working: c from the asymptote, k from the y-intercept');
  return { kind: `base ${b}` };
}
