// Test support only. Checks inequality-regions from the figure: R is
// rebuilt from the drawn lines (dashed or solid) and the shading (the side
// not wanted), never from the generator. The answer is then tested against
// that R at every quarter-square of the window, which puts every boundary
// point under test, so a ≤ for a < fails as surely as a wrong line.

const must = (cond, msg) => { if (!cond) throw new Error(msg); };
const NL = '\n';
const EPS = 1e-9;
const WIN = [0, 8, 0, 8];

/** Every quarter-square point of the window. */
function grid(step = 0.25) {
  const out = [];
  for (let x = WIN[0]; x <= WIN[1] + EPS; x += step) for (let y = WIN[2]; y <= WIN[3] + EPS; y += step) out.push([x, y]);
  return out;
}

/** A drawn line and its shading as a test: { inR(x, y), on(x, y), dashed }. */
function boundary(ln, sh) {
  if (ln.x !== undefined) {
    must(sh.x === ln.x && sh.m === undefined && ['left', 'right'].includes(sh.side), 'a vertical line shaded on one side of itself');
    // Signed distance into the unshaded side.
    const d = (x) => (sh.side === 'left' ? x - ln.x : ln.x - x);
    return { d: (x) => d(x), dashed: Boolean(ln.dashed), ln };
  }
  must(sh.m === ln.m && sh.c === ln.c && sh.x === undefined && ['above', 'below'].includes(sh.side), 'a line shaded on one side of itself');
  const d = (x, y) => (sh.side === 'below' ? y - (ln.m * x + ln.c) : ln.m * x + ln.c - y);
  return { d, dashed: Boolean(ln.dashed), ln };
}
const holdsB = (b, x, y, closed = false) => (b.dashed && !closed ? b.d(x, y) > EPS : b.d(x, y) >= -EPS);
/** R from the figure; `closed` counts dashed edges in, for "on a dashed line". */
const inFig = (bs, x, y, closed = false) => bs.every((b) => holdsB(b, x, y, closed));

/** "x \ge 3", "y < -2x + 5": a predicate, and the line it is bounded by. */
export function parseIneq(s) {
  const m = /^([xy]) (\\le|\\ge|<|>) (.+)$/.exec(s.trim());
  must(m, `an inequality: ${s}`);
  const [, v, op, rhsTex] = m;
  let slope = 0, icpt;
  const n = /^-?\d+$/.exec(rhsTex);
  if (n) icpt = Number(rhsTex);
  else {
    const e = /^(-?)(\d*)x(?: ([+-]) (\d+))?$/.exec(rhsTex);
    must(e && v === 'y', `y against a line in x: ${s}`);
    must(e[2] !== '1' && e[2] !== '0', `no coefficient of 1 or 0 written: ${s}`);
    slope = (e[1] ? -1 : 1) * (e[2] ? Number(e[2]) : 1);
    icpt = e[3] ? (e[3] === '-' ? -1 : 1) * Number(e[4]) : 0;
    must(!(e[3] && Number(e[4]) === 0), `no + 0: ${s}`);
  }
  const lhs = (x, y) => (v === 'x' ? x : y);
  const rhs = (x) => slope * x + icpt;
  const test = (x, y) => {
    const a = lhs(x, y), b = rhs(x);
    return op === '\\le' ? a <= b + EPS : op === '\\ge' ? a >= b - EPS : op === '<' ? a < b - EPS : a > b + EPS;
  };
  const line = v === 'x' ? { x: icpt } : { m: slope, c: icpt };
  return { test, line, strict: op === '<' || op === '>' };
}
const sameLine = (a, b) => (a.x !== undefined ? b.x === a.x : b.x === undefined && b.m === a.m && b.c === a.c);

/** The answer's inequalities define exactly the figure's R, one per line. */
function matchesRegion(list, bs, what) {
  const parts = list.split(', \\ ');
  must(parts.length === bs.length, `${what}: ${bs.length} inequalities, one per line`);
  const ps = parts.map(parseIneq);
  bs.forEach((b) => {
    const p = ps.find((q) => sameLine(q.line, b.ln));
    must(p, `${what}: an inequality on each drawn line`);
    must(p.strict === b.dashed, `${what}: strict exactly where the line is dashed`);
  });
  grid().forEach(([x, y]) => must(ps.every((p) => p.test(x, y)) === inFig(bs, x, y), `${what}: wrong at (${x}, ${y})`));
  return parts;
}
const lineWords = (ln) => {
  if (ln.x !== undefined) return `x = ${ln.x}`;
  if (ln.m === 0) return `y = ${ln.c}`;
  const mx = ln.m === 1 ? 'x' : ln.m === -1 ? '-x' : `${ln.m}x`;
  return `y = ${ln.c === 0 ? mx : `${mx} ${ln.c < 0 ? '-' : '+'} ${Math.abs(ln.c)}`}`;
};
const pt = ([x, y]) => `(${x}, ${y})`;

export function checkInequalityRegions(q, band) {
  must(q.metadata?.topic === 'inequality-regions' && q.metadata.difficulty === band, 'metadata');
  must(!q.questionMath && !q.questionText && !q.answerUnits, 'everything is on the figure');
  must(typeof q.workingOut === 'string' && !/\\n(?![a-z])/.test(q.workingOut), 'real newlines');
  must(!/\d/.test(q.instruction), 'no digits in the instruction');
  const f = q.visualization;
  must(f?.type === 'coordinate-grid' && JSON.stringify(f.window) === JSON.stringify(WIN), 'the first-quadrant grid');
  const n = band === 'foundation' ? 2 : 3;
  must(Array.isArray(f.lines) && f.lines.length === n && f.shade?.length === n, `${n} lines, each shaded`);
  f.lines.forEach((ln) => {
    must(ln.ink === true, 'lines in ink');
    const k = ln.x !== undefined ? [ln.x] : [ln.m, ln.c];
    must(k.every(Number.isInteger), 'whole-number lines, read off the grid');
  });
  const bs = f.lines.map((ln, i) => boundary(ln, f.shade[i]));
  const vert = f.lines.filter((l) => l.x !== undefined), flat = f.lines.filter((l) => l.m === 0), slope = f.lines.filter((l) => l.m !== undefined && l.m !== 0);
  must(vert.length === 1 && flat.length === 1 && slope.length === n - 2, 'one vertical, one horizontal, and (past Foundation) one sloping line');
  slope.forEach((l) => must([1, -1, 2, -2].includes(l.m), 'a gradient of 1 or 2 either way'));
  // Every line inside the window, so it is seen: not on an axis or the edge.
  vert.forEach((l) => must(l.x > WIN[0] && l.x < WIN[1], 'the vertical line inside the window'));
  flat.forEach((l) => must(l.c > WIN[2] && l.c < WIN[3], 'the horizontal line inside the window'));

  // R is there, and the label sits in it, clear of every edge.
  const [lx, ly] = f.regionLabel || [];
  must(Number.isFinite(lx) && Number.isFinite(ly), 'R labelled');
  must(inFig(bs, lx, ly), 'the label inside R');
  const gaps = [lx - WIN[0], WIN[1] - lx, ly - WIN[2], WIN[3] - ly, ...f.lines.map((l) => (l.x !== undefined ? Math.abs(lx - l.x) : Math.abs(ly - l.m * lx - l.c) / Math.hypot(1, l.m)))];
  must(Math.min(...gaps) >= 0.5 - EPS, 'the label half a square clear of every line');
  const cells = grid().filter(([x, y]) => inFig(bs, x, y));
  must(cells.length > 0, 'R is not empty');
  if (band !== 'foundation') {
    // A closed triangle: no point of the window's edge in R, dashed or not.
    for (let i = 0; i <= 160; i += 1) {
      const t = WIN[0] + (i / 160) * (WIN[1] - WIN[0]);
      [[t, WIN[2]], [t, WIN[3]], [WIN[0], t], [WIN[1], t]].forEach(([x, y]) => must(!inFig(bs, x, y, true), `R closed off by its three lines: (${x}, ${y})`));
    }
  }

  const w = q.workingOut.split(NL);
  must(w.at(-1) === q.answer, 'the working ends on the answer');
  if (band !== 'stretch') {
    must(q.instruction === `Write down the ${n === 2 ? 'two' : 'three'} inequalities that define the unshaded region R`, 'instruction');
    const parts = matchesRegion(q.answer, bs, 'the answer');
    must(w.length === n + 1, `a line for each boundary, then the answer: ${n + 1} lines`);
    f.lines.forEach((ln, i) => {
      must(w[i] === `${lineWords(ln)}\\text{ (${ln.dashed ? 'dashed' : 'solid'})}: \\ ${parts[i]}`, `working line ${i + 1}: the line, its style and its inequality`);
    });
    return { kind: band === 'foundation' ? 'two lines' : 'three lines' };
  }

  must(q.instruction === 'List the points with integer coordinates in the unshaded region R', 'instruction');
  const whole = [];
  for (let x = WIN[0]; x <= WIN[1]; x += 1) for (let y = WIN[2]; y <= WIN[3]; y += 1) whole.push([x, y]);
  const pts = whole.filter(([x, y]) => inFig(bs, x, y));
  const kept = whole.filter(([x, y]) => !inFig(bs, x, y) && inFig(bs, x, y, true));
  must(pts.length >= 2 && pts.length <= 8, 'two to eight points');
  must(kept.length > 0, 'a dashed line keeps some point out');
  must(q.answer === pts.map(pt).join(', '), `every point in R, in order of x then y: ${pts.map(pt).join(', ')}`);
  must(w.length === 3, 'the inequalities, the points left out, the answer');
  must(w[0].startsWith('R: \\ '), 'the working names R');
  matchesRegion(w[0].slice(5), bs, 'the working');
  must(w[1] === `\\text{on a dashed line, not in R: } ${kept.map(pt).join(', ')}`, 'the points on a dashed line, left out');
  return { kind: 'integer points' };
}
