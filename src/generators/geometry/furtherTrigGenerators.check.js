// The checker for the Further trigonometry skills, shared by the harness
// (furtherTrigGenerators.test.js) and the mutation test
// (furtherTrigGenerators.mutation.test.js). Test support only.
//
// Everything is read back off the board: the figure's labels, or the
// printed sentences. Each triangle is then rebuilt in coordinates, by its
// own construction for each case (two angles and a side, two sides and the
// angle between, three sides, two sides and an angle not between them) and
// measured with distances and dot products. The sine and cosine rules are
// not used to find any answer. Nothing is imported from the generator.
//
// Working is checked line by line: every line is evaluated with each named
// quantity (x, BD, angle PBL) bound to the value measured here, and must
// hold, rounding lines to their stated accuracy.

const fail = (msg, q) => { throw new Error(`${msg}\n${JSON.stringify(q)}`); };
const must = (cond, msg, q) => { if (!cond) fail(msg, q); };

const RAD = Math.PI / 180;
const close = (a, b, tol = 1e-9) => Math.abs(a - b) <= tol * Math.max(1, Math.abs(a), Math.abs(b));

/* ------------------------------------------------------- rounding */

export function roundsTo(value, shown, mode) {
  const n = Number(shown);
  if (!Number.isFinite(n)) return false;
  if (mode === 'sf3') {
    if (Number(n.toPrecision(3)) !== n || !/^\d+(\.\d+)?$/.test(shown)) return false;
    const digits = shown.replace('.', '').replace(/^0+/, '').length;
    if (digits !== 3) return false;
    const unit = 10 ** (Math.floor(Math.log10(Math.abs(n))) - 2);
    return Math.abs(value - n) <= unit / 2 + 1e-9;
  }
  if (mode === 'dp1') return /^\d+\.\d$/.test(shown) && Math.abs(value - n) <= 0.05 + 1e-9;
  if (mode === 'trunc4') return /^\d+\.\d{4}$/.test(shown) && value >= n - 1e-9 && value < n + 1e-4 + 1e-9;
  return false;
}

/* ---------------------------------------------------- the working */

function tokenize(src) {
  const out = [];
  let s = src;
  while (s.length) {
    let m;
    if ((m = /^\s+/.exec(s))) { s = s.slice(m[0].length); continue; }
    if ((m = /^\d+(\.\d+)?/.exec(s))) out.push({ t: 'num', v: m[0] });
    else if ((m = /^\\ldots/.exec(s))) out.push({ t: 'ldots' });
    else if ((m = /^\\angle ([A-Z]{3})/.exec(s))) out.push({ t: 'id', v: `∠${m[1]}` });
    else if ((m = /^\\text\{([A-Za-z]+)\}/.exec(s))) out.push({ t: 'id', v: m[1] });
    else if ((m = /^\^\\circ/.exec(s))) out.push({ t: 'circ' });
    else if ((m = /^\\(frac|sqrt|times|sin|cos|tan|theta)/.exec(s))) out.push({ t: m[1] === 'theta' ? 'id' : m[1], v: m[1] === 'theta' ? 'θ' : undefined });
    else if ((m = /^[A-Z]+|^[a-z]/.exec(s))) out.push({ t: 'id', v: m[0] });
    else if ((m = /^[-+(){}^=<>]/.exec(s))) out.push({ t: m[0] });
    else throw new Error(`cannot read "${s}" in working`);
    s = s.slice(m[0].length);
  }
  return out;
}

// expr := term (('+' | '-') term)*;  term := factor ('\times' factor | implicit id)*
function evaluate(tokens, env) {
  let i = 0;
  const peek = () => tokens[i];
  const take = (t) => {
    if (tokens[i]?.t !== t) throw new Error(`expected ${t} in working, got ${tokens[i]?.t}`);
    return tokens[i++];
  };
  const group = (open, close_) => { take(open); const v = expr(); take(close_); return v; };
  const TRIG = { sin: Math.sin, cos: Math.cos, tan: Math.tan };
  const primary = () => {
    const tk = peek();
    if (!tk) throw new Error('working ends early');
    if (tk.t === 'num') { i += 1; return Number(tk.v); }
    if (tk.t === 'id') {
      i += 1;
      if (!(tk.v in env)) throw new Error(`working names ${tk.v}, which the checker has not measured`);
      return env[tk.v];
    }
    if (tk.t === '(') return group('(', ')');
    if (tk.t === 'frac') { i += 1; const a = group('{', '}'); return a / group('{', '}'); }
    if (tk.t === 'sqrt') { i += 1; return Math.sqrt(group('{', '}')); }
    if (TRIG[tk.t]) { i += 1; return TRIG[tk.t](group('(', ')') * RAD); }
    if (tk.t === '-') { i += 1; return -factor(); }
    throw new Error(`unexpected ${tk.t} in working`);
  };
  const factor = () => {
    let v = primary();
    for (;;) {
      if (peek()?.t === 'circ') { i += 1; continue; }
      if (peek()?.t === '^') { i += 1; v **= peek()?.t === '{' ? group('{', '}') : Number(take('num').v); continue; }
      return v;
    }
  };
  const term = () => {
    let v = factor();
    for (;;) {
      if (peek()?.t === 'times') { i += 1; v *= factor(); continue; }
      if (peek()?.t === 'id') { v *= factor(); continue; }   // 3x
      return v;
    }
  };
  function expr() {
    let v = term();
    while (peek()?.t === '+' || peek()?.t === '-') {
      const op = tokens[i++].t;
      v = op === '+' ? v + term() : v - term();
    }
    return v;
  }
  const v = expr();
  if (i !== tokens.length) throw new Error(`unread ${tokens[i].t} in working`);
  return v;
}

// One working line: a chain of parts joined by =, < or >. A line ending in
// a rounding note, or in \ldots, holds to that accuracy at its last part.
export function checkLine(line, env) {
  let mode = null;
  let src = line;
  const note = / \\text\{ \((3 s\.f\.|1 d\.p\.)\)\}$/.exec(src);
  if (note) { mode = note[1] === '3 s.f.' ? 'sf3' : 'dp1'; src = src.slice(0, note.index); }
  if (/\\ldots$/.test(src)) { mode = 'trunc4'; src = src.replace(/\\ldots$/, ''); }
  const toks = tokenize(src);
  const parts = [[]];
  const rels = [];
  toks.forEach((tk) => {
    if (tk.t === '=' || tk.t === '<' || tk.t === '>') { rels.push(tk.t); parts.push([]); } else parts[parts.length - 1].push(tk);
  });
  if (parts.length < 2) throw new Error(`no relation in "${line}"`);
  let shown = null;
  if (mode) {
    const last = parts[parts.length - 1].filter((tk) => tk.t !== 'circ');
    if (last.length !== 1 || last[0].t !== 'num') throw new Error(`a rounded line must end in a number: "${line}"`);
    shown = last[0].v;
  }
  const vals = parts.map((p) => evaluate(p, env));
  for (let k = 0; k < rels.length; k += 1) {
    const [a, b] = [vals[k], vals[k + 1]];
    const rounding = mode && k === rels.length - 1;
    if (rounding) {
      if (rels[k] !== '=' || !roundsTo(a, shown, mode)) return false;
    } else if (rels[k] === '=' ? !close(a, b) : rels[k] === '<' ? !(a < b) : !(a > b)) return false;
  }
  return true;
}

// Every line holds, and the working arrives at each number in the answer.
const checkWorking = (q, env, shown) => {
  must(typeof q.workingOut === 'string' && !q.workingOut.includes('\\n'), 'working uses real newlines', q);
  const lines = q.workingOut.split('\n');
  lines.forEach((line) => {
    let ok;
    try { ok = checkLine(line, env); } catch (e) { fail(`working line "${line}": ${e.message}`, q); }
    must(ok, `working line "${line}" does not hold`, q);
  });
  [].concat(shown).forEach((n) => {
    const tail = new RegExp(`= ${n.replace('.', '\\.')}(\\^\\\\circ)?( \\\\text\\{ \\((3 s\\.f\\.|1 d\\.p\\.)\\)\\})?$`);
    must(lines.some((l) => tail.test(l)), `the working never reaches ${n}`, q);
  });
};

/* ------------------------------------------------- triangle building */

const dist = (P, Q) => Math.hypot(P[0] - Q[0], P[1] - Q[1]);
const angleAt = (V, P, Q) => {
  const u = [P[0] - V[0], P[1] - V[1]], v = [Q[0] - V[0], Q[1] - V[1]];
  return Math.acos(Math.max(-1, Math.min(1, (u[0] * v[0] + u[1] * v[1]) / (Math.hypot(...u) * Math.hypot(...v))))) / RAD;
};
const shoelace = (P) => Math.abs((P[1][0] - P[0][0]) * (P[2][1] - P[0][1]) - (P[2][0] - P[0][0]) * (P[1][1] - P[0][1])) / 2;
const oth = (i) => [(i + 1) % 3, (i + 2) % 3];

const measure = (P) => ({
  P,
  s: [0, 1, 2].map((i) => { const [j, k] = oth(i); return dist(P[j], P[k]); }),
  A: [0, 1, 2].map((i) => { const [j, k] = oth(i); return angleAt(P[i], P[j], P[k]); }),
  area: shoelace(P),
});

// Every triangle with the given sides s[i] and angles A[i] (null where not
// given), side i opposite angle i. Throws if the givens are not enough.
export function solveTriangle(s, A) {
  const S = [...s], An = [...A];
  const nA = An.filter((a) => a != null).length;
  if (nA === 2) { const i = An.findIndex((a) => a == null); An[i] = 180 - An[(i + 1) % 3] - An[(i + 2) % 3]; }
  const nS = S.filter((x) => x != null).length;
  const sols = [];
  const place = (pts) => sols.push(measure(pts));

  if (An.every((a) => a != null) && nS >= 1) {
    if (An.some((a) => a <= 0)) return [];
    // Two angles and a side: side i along the axis, rays from its ends.
    const i = S.findIndex((x) => x != null);
    const [j, k] = oth(i);
    const Pj = [0, 0], Pk = [S[i], 0];
    const tj = An[j] * RAD, tk = (180 - An[k]) * RAD;
    // Pj + u (cos tj, sin tj) = Pk + w (cos tk, sin tk)
    const det = Math.cos(tj) * -Math.sin(tk) + Math.sin(tj) * Math.cos(tk);
    const u = (S[i] * -Math.sin(tk)) / det;
    const P = []; P[j] = Pj; P[k] = Pk; P[i] = [u * Math.cos(tj), u * Math.sin(tj)];
    place(P);
  } else if (nS === 3) {
    const [a, b, c] = S;
    if (a + b <= c || b + c <= a || a + c <= b) return [];
    // Three sides: B at the origin, C along the axis, A where the circles meet.
    const x = (c * c - b * b + a * a) / (2 * a);
    place([[x, Math.sqrt(c * c - x * x)], [0, 0], [a, 0]]);
  } else if (nS === 2 && nA === 1) {
    const i = An.findIndex((a) => a != null);
    const [j, k] = oth(i);
    if (S[j] != null && S[k] != null) {
      // The angle between: vertex i at the origin, the two sides from it.
      const P = []; P[i] = [0, 0]; P[k] = [S[j], 0]; P[j] = [S[k] * Math.cos(An[i] * RAD), S[k] * Math.sin(An[i] * RAD)];
      place(P);
    } else {
      // An angle not between: vertex i at the origin, the known adjacent
      // side along the axis, the third vertex on the ray where a circle
      // round the far end of that side meets it, at 0, 1 or 2 points.
      // Side adj runs from vertex i to vertex m; vertex adj is on the ray.
      const adj = S[j] != null ? j : k;
      const m = adj === j ? k : j;
      const d = S[adj], r = S[i];
      const c0 = Math.cos(An[i] * RAD);
      const disc = d * d * c0 * c0 - (d * d - r * r);
      if (disc < -1e-12) return [];
      const roots = disc <= 1e-12 ? [d * c0] : [d * c0 - Math.sqrt(disc), d * c0 + Math.sqrt(disc)];
      roots.filter((t) => t > 1e-9).forEach((t) => {
        const P = []; P[i] = [0, 0]; P[m] = [d, 0];
        P[adj] = [t * Math.cos(An[i] * RAD), t * Math.sin(An[i] * RAD)];
        place(P);
      });
    }
  } else throw new Error('not enough given to fix the triangle');

  // Every solution must agree with everything given.
  return sols.filter((t) => [0, 1, 2].every((i) => (S[i] == null || close(t.s[i], S[i], 1e-7)) && (A[i] == null || close(t.A[i], A[i], 1e-7))));
}

/* ---------------------------------------------------------- reading */

const SIDE_I = 'Find the length of the side marked x. Give your answer to 3 significant figures.';
const ANGLE_I = 'Find the size of the angle marked x. Give your answer to 1 decimal place.';
const AREA_I = 'Find the area of the triangle. Give your answer to 3 significant figures.';

const lengthOf = (label) => { const m = /^(\d+(?:\.\d+)?) cm$/.exec(label); return m ? Number(m[1]) : NaN; };
const angleOf = (label) => { const m = /^(\d+)\^\\circ$/.exec(label); return m ? Number(m[1]) : NaN; };

// The labels on an oblique-triangle: numbers, or 'x', or null.
function readOblique(q) {
  const f = q.visualization;
  must(f?.type === 'oblique-triangle' && f.big === true && typeof f.mirror === 'boolean', 'an oblique-triangle figure', q);
  must(Array.isArray(f.sides) && f.sides.length === 3 && Array.isArray(f.angleLabels) && f.angleLabels.length === 3, 'three sides and three angles', q);
  must(Array.isArray(f.angles) && f.angles.length === 3, 'the true angles, for the drawing', q);
  const read = (arr, parse) => arr.map((l) => {
    if (l == null) return null;
    if (l === 'x') return 'x';
    const v = parse(l);
    must(Number.isFinite(v) && v > 0, `label "${l}"`, q);
    return v;
  });
  const s = read(f.sides, lengthOf), A = read(f.angleLabels, angleOf);
  const xs = [...s.map((v, i) => (v === 'x' ? { side: i } : null)), ...A.map((v, i) => (v === 'x' ? { angle: i } : null))].filter(Boolean);
  return { f, s, A, xs };
}

const count = (arr) => arr.filter((v) => v != null && v !== 'x').length;
const numbers = (arr) => arr.map((v) => (v === 'x' ? null : v));

// Solve a single figure with one 'x' label; the triangle must be fixed.
function solveFigure(q, s, A) {
  let sols;
  try { sols = solveTriangle(numbers(s), numbers(A)); } catch (e) { fail(e.message, q); }
  must(sols.length === 1, `the figure fixes ${sols.length} triangles, not one`, q);
  return sols[0];
}

// The drawing is honest: its true angles are the triangle's.
const checkDrawn = (q, t) => {
  q.visualization.angles.forEach((a, i) => must(Math.abs(a - t.A[i]) < 1e-6, `drawn angle ${i} is ${a}, the triangle's is ${t.A[i]}`, q));
};

const answerX = (q) => {
  const m = /^x = (\d+(?:\.\d+)?)(\^\\circ)?$/.exec(q.answer);
  must(m, `answer "${q.answer}"`, q);
  return { shown: m[1], degrees: Boolean(m[2]) };
};

// A figure question with x on the figure: the answer, its units, the
// instruction and the working, all checked against the measured triangle.
function checkXFigure(q, t, xs, env = {}) {
  must(xs.length === 1, 'exactly one x on the figure', q);
  const [u] = xs;
  must(JSON.stringify(q.visualization.unknown) === JSON.stringify(u), 'the x label takes the slot colour', q);
  const { shown, degrees } = answerX(q);
  if (u.side != null) {
    must(!degrees && q.answerUnits === '\\text{cm}' && q.instruction === SIDE_I, 'a side: cm, side instruction', q);
    must(roundsTo(t.s[u.side], shown, 'sf3'), `answer ${shown}, measured ${t.s[u.side]}`, q);
    checkWorking(q, { ...env, x: t.s[u.side] }, shown);
  } else {
    must(degrees && q.answerUnits === undefined && q.instruction === ANGLE_I, 'an angle: degrees, angle instruction', q);
    must(roundsTo(t.A[u.angle], shown, 'dp1'), `answer ${shown}, measured ${t.A[u.angle]}`, q);
    checkWorking(q, { ...env, x: t.A[u.angle] }, shown);
  }
  return u;
}

const meta = (q, topic, difficulty) => must(q.metadata?.topic === topic && q.metadata?.difficulty === difficulty, 'metadata', q);
const noText = (q) => must(q.questionText === undefined, 'no question text', q);

// Which shape the givens make, ignoring the x.
function shapeOf(s, A) {
  const ns = count(s), na = count(A);
  if (ns === 3 && na === 0) return 'SSS';
  if (ns === 1 && na === 2) {
    const i = s.findIndex((v) => v != null && v !== 'x');
    return typeof A[i] === 'number' ? 'side-opp-angle' : 'side-via-sum';
  }
  if (ns === 2 && na === 1) {
    const i = A.findIndex((v) => typeof v === 'number');
    return typeof s[i] === 'number' ? 'SSA' : 'SAS';
  }
  return `${ns} sides, ${na} angles`;
}

/* --------------------------------------------------------- sine rule */

export function checkSineRule(q, difficulty) {
  meta(q, 'sine-rule', difficulty);
  if (difficulty === 'stretch') return checkAmbiguous(q);
  noText(q);
  const { s, A, xs } = readOblique(q);
  const t = solveFigure(q, s, A);
  checkDrawn(q, t);
  must(q.visualization.vertices === undefined, 'no vertex letters', q);
  const u = checkXFigure(q, t, xs);
  const shape = shapeOf(s, A);
  if (difficulty === 'foundation') {
    must(shape === 'side-opp-angle' && u.side != null && typeof A[u.side] === 'number', 'foundation: a side, its angle and the angle opposite x', q);
  } else {
    must((shape === 'side-via-sum' && u.side != null && typeof A[u.side] === 'number')
      || (shape === 'SSA' && u.angle != null && typeof s[u.angle] === 'number'),
    `core: a side through the angle sum, or an angle; got ${shape}`, q);
  }
  return { kind: shape };
}

const TRI = '(ABC|PQR|XYZ|KLM|DEF|LMN)';
const AMBIG = new RegExp(`^In triangle ${TRI}, ([A-Z]{2}) = (\\d+) cm, ([A-Z]{2}) = (\\d+) cm and angle ([A-Z]{3}) = (\\d+)°\\.$`);
const ASK_ANGLE = /^Find the size of angle ([A-Z]{3}), giving every possible value to 1 decimal place\.$/;

// Givens named in a sentence, into a triangle's arrays.
function fromNames(q, name, sidesGiven, anglesGiven) {
  const s = [null, null, null], A = [null, null, null];
  const idx = (ch) => { const i = name.indexOf(ch); must(i >= 0, `${ch} is not in ${name}`, q); return i; };
  sidesGiven.forEach(([nm, v]) => {
    must(nm.length === 2 && nm[0] !== nm[1] && name.indexOf(nm[0]) < name.indexOf(nm[1]), `side ${nm} named in order`, q);
    const opp = [...name].find((ch) => !nm.includes(ch));
    must(s[idx(opp)] == null, `side ${nm} given twice`, q);
    s[idx(opp)] = v;
  });
  anglesGiven.forEach(([nm, v]) => {
    must(new Set(nm).size === 3 && [...nm].every((ch) => name.includes(ch)) && name.indexOf(nm[0]) < name.indexOf(nm[2]), `angle ${nm}`, q);
    A[idx(nm[1])] = v;
  });
  return { s, A, idx };
}

function readAngles(q) {
  const two = /^(\d+\.\d)\^\\circ \\text\{ or \} (\d+\.\d)\^\\circ$/.exec(q.answer);
  const one = /^(\d+\.\d)\^\\circ \\text\{ only\}$/.exec(q.answer);
  must(two || one, `answer "${q.answer}"`, q);
  return two ? [two[1], two[2]] : [one[1]];
}

function checkAmbiguous(q) {
  must(q.visualization === undefined && q.questionMath === undefined, 'stretch has no figure', q);
  const m = AMBIG.exec(q.instruction);
  must(m, `instruction "${q.instruction}"`, q);
  const a = ASK_ANGLE.exec(q.questionText);
  must(a, `question "${q.questionText}"`, q);
  const name = m[1];
  const { s, A, idx } = fromNames(q, name, [[m[2], Number(m[3])], [m[4], Number(m[5])]], [[m[6], Number(m[7])]]);
  must(shapeOf(s, A) === 'SSA', 'two sides and an angle not between them', q);
  const ask = a[1];
  must(ask !== m[6] && [...ask].every((ch) => name.includes(ch)) && new Set(ask).size === 3, 'asks for a different angle', q);
  const ai = idx(ask[1]);
  must(typeof s[ai] === 'number', 'the angle asked is opposite a given side', q);
  must(A[A.findIndex((v) => v != null)] < 90, 'the given angle is acute', q);
  const sols = solveTriangle(s, A);
  const truth = sols.map((t) => t.A[ai]).sort((p, r) => p - r);
  const shown = readAngles(q);
  must(shown.length === truth.length, `${shown.length} answers, but ${truth.length} triangles`, q);
  shown.forEach((v, k) => must(roundsTo(truth[k], v, 'dp1'), `answer ${v}, measured ${truth[k]}`, q));
  must(q.answerUnits === undefined, 'no units', q);
  // The second triangle's angle, written from the rounded first one.
  checkWorking(q, { [ask[1]]: truth[0] }, shown);
  // And tests the obtuse angle against the angle given, by name.
  const given = A.find((v) => v != null);
  const obtuse = (180 - Number(shown[0])).toFixed(1);
  const test = `${given}^\\circ + ${obtuse}^\\circ ${truth.length === 2 ? '<' : '>'} 180^\\circ`;
  must(q.workingOut.split('\n').includes(test), `the working tests ${obtuse}° with "${test}"`, q);
  return { kind: truth.length === 2 ? 'two' : 'one' };
}

/* ------------------------------------------------------- cosine rule */

export function checkCosineRule(q, difficulty) {
  meta(q, 'cosine-rule', difficulty);
  if (difficulty === 'stretch') return checkExtreme(q);
  noText(q);
  const { s, A, xs } = readOblique(q);
  const t = solveFigure(q, s, A);
  checkDrawn(q, t);
  const u = checkXFigure(q, t, xs);
  const shape = shapeOf(s, A);
  if (difficulty === 'foundation') must(shape === 'SAS' && u.side != null, 'foundation: two sides and the angle between, find the third', q);
  else must(shape === 'SSS' && u.angle != null, 'core: three sides, find an angle', q);
  return { kind: Math.max(...t.A) > 90 ? 'obtuse' : 'acute' };
}

const EXTREME = /^A triangle has sides of these lengths\. Find the size of its (largest|smallest) angle\. Give your answer to 1 decimal place\.$/;

function checkExtreme(q) {
  must(q.visualization === undefined && q.questionText === undefined, 'stretch has no figure', q);
  const m = EXTREME.exec(q.instruction);
  must(m, `instruction "${q.instruction}"`, q);
  const items = q.questionMath.split(',\\quad ');
  must(items.length === 3, 'three sides', q);
  const parsed = items.map((it) => /^(\d+)(x?)\\text\{ cm\}$/.exec(it));
  must(parsed.every(Boolean), `sides "${q.questionMath}"`, q);
  const alg = parsed[0][2] === 'x';
  must(parsed.every((p) => (p[2] === 'x') === alg), 'all in x or none', q);
  const s = parsed.map((p) => Number(p[1]));
  must(new Set(s).size === 3, 'three different sides', q);
  const sols = solveTriangle(s, [null, null, null]);
  must(sols.length === 1, 'the sides make a triangle', q);
  const t = sols[0];
  const want = m[1] === 'largest' ? Math.max(...t.A) : Math.min(...t.A);
  const am = /^(\d+\.\d)\^\\circ$/.exec(q.answer);
  must(am && roundsTo(want, am[1], 'dp1'), `answer "${q.answer}", measured ${want}`, q);
  must(q.answerUnits === undefined, 'no units', q);
  // x cancels, so any value of it must do.
  checkWorking(q, { θ: want, x: 1.7 }, am[1]);
  return { kind: `${m[1]}${alg ? ' in x' : ''}${m[1] === 'largest' ? (want > 90 ? ' obtuse' : ' acute') : ''}` };
}

/* ------------------------------------------------------------- area */

export function checkTriangleArea(q, difficulty) {
  meta(q, 'triangle-area-sine', difficulty);
  if (difficulty === 'stretch') return checkAreaAngle(q);
  noText(q);
  const { s, A, xs } = readOblique(q);
  if (difficulty === 'foundation') {
    must(xs.length === 0 && q.visualization.unknown === null, 'no x: the area is asked', q);
    must(shapeOf(s, A) === 'SAS', 'two sides and the angle between', q);
    const t = solveFigure(q, s, A);
    checkDrawn(q, t);
    must(q.instruction === AREA_I && q.answerUnits === '\\text{cm}^2' && q.questionMath === undefined, 'area instruction and units', q);
    must(roundsTo(t.area, q.answer, 'sf3'), `answer ${q.answer}, measured ${t.area}`, q);
    checkWorking(q, { Area: t.area }, q.answer);
    return { kind: 'area' };
  }
  // Core: the area given, x one of the two sides beside the angle.
  const am = /^\\text\{Area\} = (\d+)\\text\{ cm\}\^2$/.exec(q.questionMath ?? '');
  must(am && q.questionMathCompact === true, `the given area "${q.questionMath}"`, q);
  const area = Number(am[1]);
  must(xs.length === 1 && xs[0].side != null, 'x is a side', q);
  const sUnit = s.map((v) => (v === 'x' ? 1 : v));
  must(shapeOf(sUnit, A) === 'SAS', 'x and a side, with the angle between', q);
  // Area grows in proportion to x: measure the triangle with x = 1, scale.
  const x = area / solveTriangle(sUnit, numbers(A))[0].area;
  const t = solveTriangle(s.map((v) => (v === 'x' ? x : v)), numbers(A))[0];
  must(close(t.area, area, 1e-7), 'the scaled triangle has the area given', q);
  checkDrawn(q, t);
  checkXFigure(q, t, xs);
  return { kind: 'side' };
}

const AREA_SENT = new RegExp(`^Triangle ${TRI} has area (\\d+) cm², ([A-Z]{2}) = (\\d+) cm and ([A-Z]{2}) = (\\d+) cm\\.$`);

function checkAreaAngle(q) {
  must(q.visualization === undefined && q.questionMath === undefined, 'stretch has no figure', q);
  const m = AREA_SENT.exec(q.instruction);
  must(m, `instruction "${q.instruction}"`, q);
  const a = ASK_ANGLE.exec(q.questionText);
  must(a, `question "${q.questionText}"`, q);
  const name = m[1], area = Number(m[2]);
  const { s, idx } = fromNames(q, name, [[m[3], Number(m[4])], [m[5], Number(m[6])]], []);
  const ask = a[1];
  const vi = idx(ask[1]);
  must(s[vi] == null, 'the angle asked lies between the two sides given', q);
  // The two triangles with that area: the third vertex on the line at the
  // right height above the base, on either side of the foot.
  const [j, k] = oth(vi);
  const base = s[j], other = s[k];
  const h = (2 * area) / base;
  must(h < other, 'the area is possible', q);
  const foot = Math.sqrt(other * other - h * h);
  const truth = [foot, -foot].map((xf) => angleAt([0, 0], [base, 0], [xf, h])).sort((p, r) => p - r);
  const shown = readAngles(q);
  must(shown.length === 2, 'both angles', q);
  shown.forEach((v, n) => must(roundsTo(truth[n], v, 'dp1'), `answer ${v}, measured ${truth[n]}`, q));
  must(q.answerUnits === undefined, 'no units', q);
  checkWorking(q, { [ask[1]]: truth[0] }, shown);
  return { kind: 'two angles' };
}

/* ------------------------------------------------------------ mixed */

export function checkMixed(q, difficulty) {
  meta(q, 'sine-cosine-mixed', difficulty);
  if (difficulty === 'stretch') {
    return q.visualization ? checkCompound(q) : checkBearings(q);
  }
  noText(q);
  const { f, s, A, xs } = readOblique(q);
  const t = solveFigure(q, s, A);
  checkDrawn(q, t);
  const shape = shapeOf(s, A);
  if (difficulty === 'foundation') {
    must(f.vertices === undefined, 'no vertex letters', q);
    const u = checkXFigure(q, t, xs);
    const ok = (shape === 'side-opp-angle' && u.side != null && typeof A[u.side] === 'number')
      || (shape === 'SSA' && u.angle != null && typeof s[u.angle] === 'number')
      || (shape === 'SAS' && u.side != null && typeof A[u.side] === 'number')
      || (shape === 'SSS' && u.angle != null);
    must(ok, `foundation: one rule, one step; got ${shape}`, q);
    return { kind: u.side != null ? (shape === 'SAS' ? 'cosine side' : 'sine side') : (shape === 'SSS' ? 'cosine angle' : 'sine angle') };
  }
  // Core: two sides and the angle between; x an angle beside the given
  // angle, opposite a side that is not the longest, so it is acute.
  must(shape === 'SAS' && xs.length === 1 && xs[0].angle != null && A[xs[0].angle] === 'x', 'core: SAS, an angle asked', q);
  const xi = xs[0].angle;
  must(typeof s[xi] === 'number' && s[xi] < Math.max(...t.s), 'the angle asked faces a given side, not the longest', q);
  const L = f.vertices;
  must(Array.isArray(L) && L.length === 3 && TRI.includes(L.join('')), 'vertex letters', q);
  const env = namesOf(L, t);
  checkXFigure(q, t, xs, env);
  return { kind: 'cosine then sine' };
}

// Every side and angle of a triangle, under each name it could be given.
function namesOf(L, t) {
  const env = {};
  [0, 1, 2].forEach((i) => {
    const [j, k] = oth(i);
    env[L[j] + L[k]] = t.s[i]; env[L[k] + L[j]] = t.s[i];
    env[`∠${L[j]}${L[i]}${L[k]}`] = t.A[i]; env[`∠${L[k]}${L[i]}${L[j]}`] = t.A[i];
  });
  return env;
}

// two-triangles: ABD then BCD, through BD.
const PLANS = {
  'cos-sin CD': { sides: ['AB', 'CD', 'DA'], angles: ['A', 'C', 'CBD'] },
  'cos-sin BC': { sides: ['AB', 'BC', 'DA'], angles: ['A', 'C', 'CBD'] },
  'sin-cos': { sides: ['AB', 'BC', 'CD'], angles: ['A', 'ADB', 'CBD'] },
  'cos-angle': { sides: ['AB', 'BC', 'DA'], angles: ['A', 'C', 'CDB'] },
};

function checkCompound(q) {
  const f = q.visualization;
  must(f.type === 'two-triangles' && f.big === true && typeof f.mirror === 'boolean', 'a two-triangles figure', q);
  noText(q);
  must(q.questionMath === undefined, 'no question line', q);
  const L = f.vertices;
  must(Array.isArray(L) && L.length === 4 && ['ABCD', 'PQRS', 'KLMN', 'WXYZ', 'EFGH'].includes(L.join('')), 'four vertex letters', q);
  const sides = f.sides ?? {}, angles = f.angles ?? {};
  const keys = { sides: Object.keys(sides).sort(), angles: Object.keys(angles).sort() };
  const plan = Object.keys(PLANS).find((p) => JSON.stringify(PLANS[p]) === JSON.stringify(keys));
  must(plan, `labels ${JSON.stringify(keys)} are not one of the plans`, q);
  const read = (obj, parse) => Object.fromEntries(Object.entries(obj).map(([k, v]) => {
    if (v === 'x') return [k, 'x'];
    const n = parse(v);
    must(Number.isFinite(n) && n > 0, `label "${v}"`, q);
    return [k, n];
  }));
  const S = read(sides, lengthOf), An = read(angles, angleOf);
  const xs = [...Object.keys(S).filter((k) => S[k] === 'x').map((k) => ({ side: k })), ...Object.keys(An).filter((k) => An[k] === 'x').map((k) => ({ angle: k }))];
  must(xs.length === 1 && JSON.stringify(f.unknown) === JSON.stringify(xs[0]), 'one x, in the slot colour', q);
  const num = (v) => (typeof v === 'number' ? v : null);

  // Triangle ABD, vertices [A, B, D]: opposite A is BD, B is DA, D is AB.
  const s1 = [null, num(S.DA), num(S.AB)], a1 = [num(An.A), num(An.ABD), num(An.ADB)];
  const t1s = solveTriangle(s1, a1);
  must(t1s.length === 1, 'triangle ABD is fixed', q);
  const t1 = t1s[0];
  const BD = t1.s[0];
  // Triangle BCD, vertices [B, C, D]: opposite B is CD, C is BD, D is BC.
  const s2 = [num(S.CD), BD, num(S.BC)], a2 = [num(An.CBD), num(An.C), num(An.CDB)];
  const t2s = solveTriangle(s2, a2);
  must(t2s.length === 1, 'triangle BCD is fixed once BD is known', q);
  const t2 = t2s[0];
  // Each triangle ranked as drawn, visibly (3° apart), all acute.
  const [A_, ABD, ADB] = t1.A, [CBD, C_, CDB] = t2.A;
  const apart = (p, r) => p - r >= 3 - 1e-6;
  must(apart(A_, ADB) && apart(ADB, ABD) && A_ < 90, `ABD ranks as drawn: ${t1.A}`, q);
  must(apart(CBD, C_) && apart(C_, CDB) && CBD < 90, `BCD ranks as drawn: ${t2.A}`, q);

  const value = { AB: t1.s[2], DA: t1.s[1], BD, CD: t2.s[0], BC: t2.s[2], A: A_, ABD, ADB, C: C_, CBD, CDB };
  const [u] = xs;
  const truth = value[u.side ?? u.angle];
  const { shown, degrees } = answerX(q);
  if (u.side) {
    must(!degrees && q.answerUnits === '\\text{cm}' && q.instruction === SIDE_I, 'a side', q);
    must(roundsTo(truth, shown, 'sf3'), `answer ${shown}, measured ${truth}`, q);
  } else {
    must(degrees && q.answerUnits === undefined && q.instruction === ANGLE_I, 'an angle', q);
    must(roundsTo(truth, shown, 'dp1'), `answer ${shown}, measured ${truth}`, q);
  }
  const at = { A: L[0], B: L[1], C: L[2], D: L[3] };
  const env = { x: truth };
  Object.entries({ AB: 'AB', DA: 'DA', BD: 'BD', CD: 'CD', BC: 'BC' }).forEach(([k, nm]) => {
    env[at[nm[0]] + at[nm[1]]] = value[k]; env[at[nm[1]] + at[nm[0]]] = value[k];
  });
  Object.entries({ A: 'DAB', ABD: 'ABD', ADB: 'ADB', C: 'BCD', CBD: 'CBD', CDB: 'CDB' }).forEach(([k, nm]) => {
    env[`∠${at[nm[0]]}${at[nm[1]]}${at[nm[2]]}`] = value[k]; env[`∠${at[nm[2]]}${at[nm[1]]}${at[nm[0]]}`] = value[k];
  });
  checkWorking(q, env, shown);
  return { kind: `compound ${plan}` };
}

const BEARING = /^(A ship|A plane|A hiker|A drone) (sails|flies|walks) (\d+) km on a bearing of (\d{3})° from (port|airport|camp|base) ([A-Z]) to (a buoy|a beacon|a bridge|a mast) ([A-Z])\. It then (sails|flies|walks) (\d+) km on a bearing of (\d{3})° to (a lighthouse|a town|a hut|a farm) ([A-Z])\.$/;
const ASK_DIST = /^Find the distance ([A-Z]{2})\. Give your answer to 3 significant figures\.$/;
const ASK_BRG = /^Find the bearing of ([A-Z]) from ([A-Z])\. Give your answer to 1 decimal place\.$/;

function checkBearings(q) {
  must(q.questionMath === undefined, 'no question line', q);
  const m = BEARING.exec(q.instruction);
  must(m, `instruction "${q.instruction}"`, q);
  const [l1, b1, S, T, l2, b2, E] = [Number(m[3]), Number(m[4]), m[6], m[8], Number(m[10]), Number(m[11]), m[13]];
  must(new Set([S, T, E]).size === 3, 'three different points', q);
  must(m[2] === m[9], 'one verb for both legs', q);
  must(b1 > 0 && b1 < 360 && b2 > 0 && b2 < 360, 'bearings between 000° and 360°', q);
  // East and north, leg by leg.
  const Ps = [0, 0];
  const Pt = [l1 * Math.sin(b1 * RAD), l1 * Math.cos(b1 * RAD)];
  const Pe = [Pt[0] + l2 * Math.sin(b2 * RAD), Pt[1] + l2 * Math.cos(b2 * RAD)];
  const d = dist(Ps, Pe);
  const atT = angleAt(Pt, Ps, Pe), atS = angleAt(Ps, Pt, Pe);
  must(Math.abs(atT - 90) >= 10 - 1e-9 && atT >= 30 - 1e-9 && atT <= 150 + 1e-9, `the turn at ${T} is ${atT}`, q);
  const env = { [S + E]: d, [E + S]: d, [`∠${S}${T}${E}`]: atT, [`∠${E}${T}${S}`]: atT, [`∠${T}${S}${E}`]: atS, [`∠${E}${S}${T}`]: atS };
  let kind;
  const dm = ASK_DIST.exec(q.questionText ?? ''), bm = ASK_BRG.exec(q.questionText ?? '');
  if (dm) {
    must(dm[1] === S + E, 'the distance asked runs from start to end', q);
    must(q.answerUnits === '\\text{km}' && roundsTo(d, q.answer, 'sf3'), `answer ${q.answer}, measured ${d}`, q);
    kind = 'bearings distance';
    checkWorking(q, env, q.answer);
  } else {
    must(bm && bm[1] === E && bm[2] === S, `question "${q.questionText}"`, q);
    must(atS < 90, 'the angle at the start is acute, so the sine rule finds it', q);
    const bearing = ((Math.atan2(Pe[0], Pe[1]) / RAD) + 360) % 360;
    const am = /^(\d{3}\.\d)\^\\circ$/.exec(q.answer);
    must(am && q.answerUnits === undefined, `answer "${q.answer}"`, q);
    must(roundsTo(bearing, am[1], 'dp1'), `answer ${am[1]}, measured ${bearing}`, q);
    kind = 'bearings bearing';
    checkWorking(q, env, am[1]);
  }
  return { kind };
}
