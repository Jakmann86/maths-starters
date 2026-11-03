// The checker for the Transformations skills, shared by the harness
// (transformationGenerators.test.js) and the mutation test
// (transformationGenerators.mutation.test.js). Test support only.
//
// Everything is read back off the board. A carry-out question's
// transformation is parsed from the sentence (and the column vector), then
// applied here, by this file's own affine maps, to the shape drawn on the
// grid; the answer, the image drawn on reveal and the mirror line or
// centre drawn on the grid must all agree with that. A describe question
// is solved from the two drawn shapes alone: every translation, every
// reflection (in any line), every quarter and half turn (about any point)
// and every enlargement by 2, 3, 1/2, 1/3 or their negatives that sends
// one vertex of A to a vertex of B is tried, and exactly one distinct map
// may carry A's vertices onto B's. The answer must name that map.
// Nothing is imported from the generator.

import { compiles as compilesOnce } from '../number/latexArithmetic.check';

// The same few hundred answer strings recur thousands of times; KaTeX need
// only see each once.
const compiled = new Set();
const compiles = (tex) => { if (!compiled.has(tex)) { compilesOnce(tex); compiled.add(tex); } };

const fail = (msg, q) => { throw new Error(`${msg}\n${JSON.stringify(q)}`); };
const must = (cond, msg, q) => { if (!cond) fail(msg, q); };
const EPS = 1e-9;
const same = (p, q) => Math.abs(p[0] - q[0]) < EPS && Math.abs(p[1] - q[1]) < EPS;
const plain = (s) => (s ?? '').replace(/\u2212/g, '-').replace(/\u00a0/g, ' ');
const LIMIT = 7;

/* ------------------------------------------------------------ affine maps */
// A map is [[a, b], [c, d]] with offset [e, f]: P -> (aX + bY + e, cX + dY + f).
const tidy = (v) => Math.round(v * 1e9) / 1e9;
const affine = (M, t) => ({ M, t, at: ([x, y]) => [tidy(M[0][0] * x + M[0][1] * y + t[0]), tidy(M[1][0] * x + M[1][1] * y + t[1])] });
const about = (M, c) => affine(M, [c[0] - (M[0][0] * c[0] + M[0][1] * c[1]), c[1] - (M[1][0] * c[0] + M[1][1] * c[1])]);
const QUARTER = { 90: [[0, -1], [1, 0]], 180: [[-1, 0], [0, -1]], 270: [[0, 1], [-1, 0]] };
const MAPS = {
  translation: (v) => affine([[1, 0], [0, 1]], v),
  // In the line through p with direction d: the reflection matrix of d.
  reflection: (p, d) => {
    const n = Math.hypot(d[0], d[1]), [u, w] = [d[0] / n, d[1] / n];
    return about([[u * u - w * w, 2 * u * w], [2 * u * w, w * w - u * u]], p);
  },
  // Anticlockwise turns of 90, 180, 270.
  rotation: (deg, c) => about(QUARTER[deg], c),
  enlargement: (k, c) => about([[k, 0], [0, k]], c),
};
const lineMap = (line) => (line.x !== undefined ? MAPS.reflection([line.x, 0], [0, 1])
  : line.y !== undefined ? MAPS.reflection([0, line.y], [1, 0]) : MAPS.reflection([0, line.c], [1, line.m]));

/* ---------------------------------------------------------------- parsing */

const num = (s) => Number(s);
const point = (s) => { const m = /^\((-?\d+), (-?\d+)\)$/.exec(s ?? ''); return m ? [num(m[1]), num(m[2])] : null; };
const vector = (s) => { const m = /^\\begin\{pmatrix\} (-?\d+) \\\\ (-?\d+) \\end\{pmatrix\}$/.exec(s ?? ''); return m ? [num(m[1]), num(m[2])] : null; };
const factor = (s) => ({ 2: 2, 3: 3, '½': 0.5, '\\frac{1}{2}': 0.5 }[s]);

// "the y-axis", "the line x = 2", "the line y = -x"
function lineFromWords(s) {
  if (s === 'the y-axis') return { x: 0 };
  if (s === 'the x-axis') return { y: 0 };
  const m = /^the line (x|y) = (-?\d+|-?x)$/.exec(s);
  if (!m) return null;
  if (m[1] === 'y' && /x$/.test(m[2])) return { m: m[2] === 'x' ? 1 : -1, c: 0 };
  return m[1] === 'x' ? { x: num(m[2]) } : { y: num(m[2]) };
}
const sameLine = (a, b) => JSON.stringify({ x: a?.x, y: a?.y, m: a?.m, c: a?.c }) === JSON.stringify({ x: b?.x, y: b?.y, m: b?.m, c: b?.c });
const lineLabelOf = (line) => (line.x !== undefined ? `x = ${line.x}` : line.y !== undefined ? `y = ${line.y}` : `y = ${line.m === 1 ? '' : '-'}x`).replace(/-/g, '\u2212');

// The carry-out sentence -> { kind, map, line?, centre?, ... }.
function parseCarryOut(q) {
  const s = plain(q.instruction);
  must(s.endsWith(' Find the coordinates of A′.'), 'asks for A′', q);
  const head = s.slice(0, -' Find the coordinates of A′.'.length);
  let m = /^Translate the shape (\d+) squares? (right|left)(?: and (\d+) squares? (up|down))?\.$/.exec(head)
    ?? /^Translate the shape ()()(\d+) squares? (up|down)\.$/.exec(head);
  if (m) {
    const dx = m[1] ? num(m[1]) * (m[2] === 'right' ? 1 : -1) : 0;
    const dy = m[3] ? num(m[3]) * (m[4] === 'up' ? 1 : -1) : 0;
    must(!m[1] || num(m[1]) > 0, 'no zero squares', q);
    must(!m[3] || num(m[3]) > 0, 'no zero squares', q);
    must(!/\b1 squares|\b([2-9]|\d\d) square\b/.test(head), 'square or squares agrees with the number', q);
    must(q.questionMath === undefined, 'a translation in words has no vector', q);
    return { kind: 'translation', mode: 'words', v: [dx, dy], map: MAPS.translation([dx, dy]) };
  }
  if (head === 'Translate the shape by the column vector.') {
    const v = vector(q.questionMath);
    must(v && (v[0] || v[1]), 'the column vector', q);
    return { kind: 'translation', mode: 'vector', v, map: MAPS.translation(v) };
  }
  must(q.questionMath === undefined, 'only a column vector goes in the question line', q);
  m = /^Reflect the shape in (.+)\.$/.exec(head);
  if (m) {
    const line = lineFromWords(m[1]);
    must(line, `mirror line "${m[1]}"`, q);
    must(!/[xy] = 0$/.test(m[1]), 'an axis is named as an axis', q);
    return { kind: 'reflection', line, map: lineMap(line) };
  }
  m = /^Rotate the shape (90° clockwise|90° anticlockwise|180°) about (the origin|\(-?\d+, -?\d+\))\.$/.exec(head);
  if (m) {
    const centre = m[2] === 'the origin' ? [0, 0] : point(m[2]);
    const deg = { '90° clockwise': 270, '90° anticlockwise': 90, '180°': 180 }[m[1]];
    must(m[2] === 'the origin' || centre[0] || centre[1], 'the origin is named as the origin', q);
    return { kind: 'rotation', deg, centre, origin: m[2] === 'the origin', map: MAPS.rotation(deg, centre) };
  }
  m = /^Enlarge the shape by scale factor (2|3|½), centre (\(-?\d+, -?\d+\))\.$/.exec(head);
  if (m) {
    const k = factor(m[1]), centre = point(m[2]);
    return { kind: 'enlargement', k, centre, map: MAPS.enlargement(k, centre) };
  }
  return fail(`instruction "${q.instruction}"`, q);
}

// A describe answer -> the same shape of record.
function parseDescription(q, answer, axesByName = true) {
  let m = /^\\text\{Translation by \} (.+)$/.exec(answer);
  if (m) { const v = vector(m[1]); must(v && (v[0] || v[1]), 'translation vector', q); return { kind: 'translation', v, map: MAPS.translation(v) }; }
  m = /^\\text\{Reflection in \} (.+)$/.exec(answer);
  if (m) {
    const words = m[1] === '\\text{the } y\\text{-axis}' ? 'the y-axis' : m[1] === '\\text{the } x\\text{-axis}' ? 'the x-axis'
      : m[1].startsWith('\\text{the line } ') ? `the line ${m[1].slice('\\text{the line } '.length)}` : '';
    const line = lineFromWords(words);
    must(line, `mirror line "${m[1]}"`, q);
    must(!axesByName || !/[xy] = 0$/.test(m[1]), 'an axis is named as an axis', q);
    return { kind: 'reflection', line, map: lineMap(line) };
  }
  m = /^\\text\{Rotation \} (90\^\\circ \\text\{ clockwise\}|90\^\\circ \\text\{ anticlockwise\}|180\^\\circ) \\text\{ about \} (\(-?\d+, -?\d+\))$/.exec(answer);
  if (m) {
    const deg = m[1].includes('anticlockwise') ? 90 : m[1].includes('clockwise') ? 270 : 180;
    const centre = point(m[2]);
    return { kind: 'rotation', deg, centre, map: MAPS.rotation(deg, centre) };
  }
  m = /^\\text\{Enlargement, scale factor \} (2|3|\\frac\{1\}\{2\}), \\text\{ centre \} (\(-?\d+, -?\d+\))$/.exec(answer);
  if (m) {
    const k = factor(m[1]), centre = point(m[2]);
    return { kind: 'enlargement', k, centre, map: MAPS.enlargement(k, centre) };
  }
  return fail(`description "${answer}"`, q);
}

/* -------------------------------------------------------------- the figure */

const isInt = (p) => Number.isInteger(p[0]) && Number.isInteger(p[1]);
const box = (pts) => [Math.min(...pts.map((p) => p[0])), Math.max(...pts.map((p) => p[0])), Math.min(...pts.map((p) => p[1])), Math.max(...pts.map((p) => p[1]))];
const inBox = (p, pts) => { const b = box(pts); return p[0] >= b[0] && p[0] <= b[1] && p[1] >= b[2] && p[1] <= b[3]; };

function checkPolygon(pts, q) {
  must(Array.isArray(pts) && pts.length >= 3, 'a polygon', q);
  pts.forEach((p) => must(isInt(p) && Math.abs(p[0]) <= LIMIT && Math.abs(p[1]) <= LIMIT, `vertex ${JSON.stringify(p)} on the grid, within ±${LIMIT}`, q));
  must(new Set(pts.map(String)).size === pts.length, 'distinct vertices', q);
  // Simple and non-degenerate: positive area, no edge crossing another.
  const area = pts.reduce((t, p, i) => { const r = pts[(i + 1) % pts.length]; return t + p[0] * r[1] - r[0] * p[1]; }, 0) / 2;
  must(Math.abs(area) > EPS, 'a polygon with area', q);
  const cross = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  for (let i = 0; i < pts.length; i += 1) {
    for (let j = i + 2; j < pts.length; j += 1) {
      if (i === 0 && j === pts.length - 1) continue;
      const [a, b, c, d] = [pts[i], pts[(i + 1) % pts.length], pts[j], pts[(j + 1) % pts.length]];
      must(!(cross(a, b, c) * cross(a, b, d) < 0 && cross(c, d, a) * cross(c, d, b) < 0), 'edges do not cross', q);
    }
  }
}

// Each shape sits inside one quadrant, clear of both axes.
function checkQuadrant(pts, q) {
  [0, 1].forEach((i) => must(pts.every((p) => p[i] > 0) || pts.every((p) => p[i] < 0), 'the shape sits in one quadrant, clear of the axes', q));
}

// Two shapes stand apart on the grid: their boxes do not meet.
function checkApart(p, r, q) {
  const [a, b] = [box(p), box(r)];
  must(a[1] < b[0] || b[1] < a[0] || a[3] < b[2] || b[3] < a[2], 'the two shapes stand apart', q);
}

// The shape has no symmetry: no map but the identity sends its vertices
// onto themselves. Rotations and reflections of a polygon onto itself fix
// its centroid, so trying them about the centroid is enough.
function checkAsymmetric(pts, q) {
  const n = pts.length;
  const G = [pts.reduce((t, p) => t + p[0], 0) / n, pts.reduce((t, p) => t + p[1], 0) / n];
  const self = (f) => pts.every((p) => pts.some((r) => same(f.at(p), r)));
  [90, 180, 270].forEach((deg) => must(!self(MAPS.rotation(deg, G)), 'an asymmetric shape (turn)', q));
  pts.forEach((p) => {
    // A mirror through the centroid sends p to some vertex r: the mirror is
    // the line through G and the midpoint of p and r (or through p itself).
    pts.forEach((r) => {
      const mid = [(p[0] + r[0]) / 2, (p[1] + r[1]) / 2];
      const d = same(mid, G) ? [r[1] - p[1], p[0] - r[0]] : [mid[0] - G[0], mid[1] - G[1]];
      if (Math.hypot(d[0], d[1]) < EPS) return;
      must(!self(MAPS.reflection(G, d)), 'an asymmetric shape (mirror)', q);
    });
  });
}

// Every candidate map that sends the vertex set of A onto that of B.
function solve(A, B) {
  const found = new Map();
  const tryMap = (f, rec) => {
    const img = A.map((p) => f.at(p));
    if (img.every((p) => B.some((r) => same(p, r))) && B.every((r) => img.some((p) => same(p, r)))) {
      // A half turn is also an enlargement by -1: the same map, kept under
      // the name tried first.
      const key = img.map((p) => p.map((v) => Math.round(v * 1e6) / 1e6)).join(';');
      if (!found.has(key)) found.set(key, rec);
    }
  };
  const P = A[0];
  B.forEach((Q) => {
    tryMap(MAPS.translation([Q[0] - P[0], Q[1] - P[1]]), { kind: 'translation', v: [Q[0] - P[0], Q[1] - P[1]] });
    // Rotation about c by M sending P to Q: (I - M)c = Q - MP.
    Object.keys(QUARTER).forEach((deg) => {
      const M = QUARTER[deg];
      const rhs = [Q[0] - (M[0][0] * P[0] + M[0][1] * P[1]), Q[1] - (M[1][0] * P[0] + M[1][1] * P[1])];
      const [a, b, c, d] = [1 - M[0][0], -M[0][1], -M[1][0], 1 - M[1][1]];
      const det = a * d - b * c;
      const C = [(d * rhs[0] - b * rhs[1]) / det, (a * rhs[1] - c * rhs[0]) / det];
      tryMap(MAPS.rotation(Number(deg), C), { kind: 'rotation', deg: Number(deg), centre: C });
    });
    // Enlargement by k about c sending P to Q: c = (Q - kP) / (1 - k).
    [2, 3, 0.5, 1 / 3, -1, -2, -3, -0.5, -1 / 3].forEach((k) => {
      const C = [(Q[0] - k * P[0]) / (1 - k), (Q[1] - k * P[1]) / (1 - k)];
      tryMap(MAPS.enlargement(k, C), { kind: 'enlargement', k, centre: C });
    });
    // Reflection sending P to Q: the perpendicular bisector of PQ, or, if
    // P is fixed, any line through it; for those try the four grid
    // directions and the line to each other vertex's partner.
    if (!same(P, Q)) {
      tryMap(MAPS.reflection([(P[0] + Q[0]) / 2, (P[1] + Q[1]) / 2], [P[1] - Q[1], Q[0] - P[0]]), { kind: 'reflection' });
    } else {
      [[1, 0], [0, 1], [1, 1], [1, -1]].forEach((d) => tryMap(MAPS.reflection(P, d), { kind: 'reflection' }));
      A.slice(1).forEach((R) => B.forEach((S) => {
        const mid = [(R[0] + S[0]) / 2, (R[1] + S[1]) / 2];
        if (!same(mid, P)) tryMap(MAPS.reflection(P, [mid[0] - P[0], mid[1] - P[1]]), { kind: 'reflection' });
      }));
    }
  });
  return found;
}

/* ------------------------------------------------------------ the bands */

const BAND_RULES = {
  translation: {
    foundation: (r) => r.mode === 'words',
    core: (r) => r.mode === 'vector',
    stretch: (r) => r.mode === 'describe-vector',
  },
  reflection: {
    foundation: (r) => r.mode === 'carry' && r.line.m === undefined,
    core: (r) => r.mode === 'carry' && r.line.m !== undefined,
    stretch: (r) => r.mode === 'describe-line',
  },
  rotation: {
    foundation: (r) => r.mode === 'carry' && r.origin,
    core: (r) => r.mode === 'carry' && !r.origin,
    stretch: (r) => r.mode === 'describe' && (r.centre[0] || r.centre[1]),
  },
  enlargement: {
    foundation: (r) => r.mode === 'carry' && r.k > 1,
    core: (r) => r.mode === 'describe' && r.k > 1,
    stretch: (r) => r.k === 0.5,
  },
  'describe-transformation': {
    foundation: (r) => r.mode === 'describe' && (r.kind === 'translation' || (r.kind === 'reflection' && r.line.m === undefined) || (r.kind === 'rotation' && !r.centre[0] && !r.centre[1])),
    core: (r) => r.mode === 'describe' && (r.kind !== 'reflection' || r.line.m !== -1) && (r.kind !== 'enlargement' || r.k > 1),
    stretch: (r) => r.mode === 'describe' && ((r.kind === 'reflection' && r.line.m !== undefined)
      || (r.kind === 'rotation' && r.deg !== 180 && (r.centre[0] || r.centre[1])) || (r.kind === 'enlargement' && r.k === 0.5)),
  },
};

const lineKind = (line) => (line.x !== undefined ? 'x = a' : line.y !== undefined ? 'y = b' : line.m === 1 ? 'y = x' : 'y = -x');
const turnKind = (deg) => ({ 90: '90 acw', 270: '90 cw', 180: '180' }[deg]);
const kindOf = (r) => {
  const detail = r.kind === 'translation' ? (r.mode === 'words' ? ' words' : r.mode === 'vector' ? ' vector' : '')
    : r.kind === 'reflection' ? ` ${lineKind(r.line)}`
      : r.kind === 'rotation' ? ` ${turnKind(r.deg)}`
        : ` sf ${r.k === 0.5 ? '1/2' : r.k}`;
  return `${r.mode.startsWith('describe') ? 'describe' : 'carry'} ${r.kind}${detail}`;
};

/* -------------------------------------------------------------- the check */

// The grid runs one square past every point and the origin; the generator
// keeps it to at most 14 squares across and 10 high, so the figure is drawn
// at a readable size with its numbers in ones.
function checkWindow(f, q) {
  const pts = [[0, 0], ...(f.shapes ?? []).flatMap((s) => s.pts), ...(f.solution ?? []).flatMap((s) => s.pts),
    ...(f.centre ? [f.centre] : []), ...(f.solutionCentre ? [f.solutionCentre] : [])];
  const [x0, x1, y0, y1] = box(pts);
  must(x1 - x0 + 2 <= 14 && y1 - y0 + 2 <= 10, `grid ${x1 - x0 + 2} by ${y1 - y0 + 2} is too big to read`, q);
}

function checkCommon(q, topic, band) {
  must(q.metadata?.topic === topic && q.metadata?.difficulty === band, 'metadata', q);
  const f = q.visualization;
  must(f?.type === 'transform-grid' && f.big === true, 'a transform-grid figure', q);
  must(typeof q.workingOut === 'string' && !q.workingOut.includes('\\n'), 'working uses real newlines', q);
  must(q.answerUnits === undefined, 'no units on a coordinate or a description', q);
  [q.answer, q.questionMath, q.workingOut].filter((s) => s !== undefined).forEach((s) => compiles(s));
  must(!/-(?=[\dx])/.test(q.instruction), 'instructions use a real minus sign', q);
  must(!/\u2212(?![\dx])/.test(q.instruction), 'a hyphen, not a minus sign, in y-axis', q);
  checkWindow(f, q);
  return f;
}

export function checkTransformation(q, band) {
  const topic = q.metadata?.topic;
  must(BAND_RULES[topic], `topic ${topic}`, q);
  const f = checkCommon(q, topic, band);
  let rec;
  if (f.solution) {
    // Carry out.
    must(f.shapes?.length === 1 && f.solution.length === 1, 'one shape and its image', q);
    const obj = f.shapes[0], img = f.solution[0];
    checkPolygon(obj.pts, q);
    checkAsymmetric(obj.pts, q);
    rec = parseCarryOut(q);
    rec.mode ??= 'carry';
    const i = obj.vertex?.index;
    must(obj.vertex?.text === 'A' && Number.isInteger(i) && i >= 0 && i < obj.pts.length && !obj.name, 'vertex A lettered on the shape', q);
    must(img.vertex?.text === "A'" && img.vertex.index === i && !img.name, "A' lettered on the image, at the same corner", q);
    const expected = obj.pts.map((p) => rec.map.at(p));
    must(img.pts.length === expected.length && img.pts.every((p, k) => same(p, expected[k])), 'the image drawn on reveal is the image', q);
    checkPolygon(img.pts, q);
    checkApart(obj.pts, img.pts, q);
    [obj.pts, img.pts].forEach((pts) => checkQuadrant(pts, q));
    const A = obj.pts[i], A2 = expected[i];
    must(q.answer === `A' = (${A2[0]}, ${A2[1]})`, `answer ${q.answer}, expected (${A2})`, q);
    must(q.workingOut === `A = (${A[0]}, ${A[1]})\nA' = (${A2[0]}, ${A2[1]})`, 'working: A, then A′', q);
    // What is drawn on the grid matches the sentence.
    if (rec.kind === 'reflection') {
      const axis = rec.line.x === 0 || rec.line.y === 0;
      must(sameLine(f.mirror, rec.line) && f.mirrorLabel === (axis ? undefined : lineLabelOf(rec.line)), 'the mirror line drawn and labelled as named (an axis unlabelled)', q);
    } else must(f.mirror === undefined && f.mirrorLabel === undefined, 'no mirror line', q);
    if (rec.kind === 'enlargement' || (rec.kind === 'rotation' && !rec.origin)) {
      must(f.centre && same(f.centre, rec.centre), 'the centre dot where the sentence says', q);
      must(rec.centre[0] && rec.centre[1], 'a centre dot stands off the axes', q);
      must(!inBox(rec.centre, obj.pts) && !inBox(rec.centre, img.pts), 'the centre stands clear of both shapes', q);
    } else must(f.centre === undefined, 'no centre dot', q);
    must(f.solutionMirror === undefined && f.solutionCentre === undefined, 'nothing else drawn on reveal', q);
  } else {
    // Describe.
    must(f.shapes?.length === 2 && f.shapes[0].name === 'A' && f.shapes[1].name === 'B', 'shapes A and B', q);
    f.shapes.forEach((s) => { checkPolygon(s.pts, q); must(!s.vertex, 'no lettered vertex', q); });
    const [A, B] = f.shapes.map((s) => s.pts);
    checkAsymmetric(A, q);
    checkApart(A, B, q);
    [A, B].forEach((pts) => checkQuadrant(pts, q));
    must(f.mirror === undefined && f.centre === undefined, 'nothing given away before reveal', q);
    const found = solve(A, B);
    must(found.size === 1, `exactly one transformation maps A onto B (found ${found.size})`, q);
    const truth = [...found.values()][0];
    // The answer, in the skill's form.
    let mode = 'describe';
    if (topic === 'translation') {
      must(q.instruction === 'Write down the column vector that translates shape A onto shape B.', 'translation instruction', q);
      rec = parseDescription(q, `\\text{Translation by } ${q.answer}`);
      mode = 'describe-vector';
    } else if (topic === 'reflection') {
      must(q.instruction === 'Shape A is reflected onto shape B. Write down the equation of the mirror line.', 'reflection instruction', q);
      must(/^(x|y) = -?(\d+|x)$/.test(q.answer), 'the answer is an equation', q);
      rec = parseDescription(q, `\\text{Reflection in } \\text{the line } ${q.answer}`, false);
      mode = 'describe-line';
    } else {
      must(q.instruction === 'Describe fully the single transformation that maps shape A onto shape B.', 'describe instruction', q);
      rec = parseDescription(q, q.answer);
    }
    rec.mode = mode;
    must(rec.kind === truth.kind, `the answer names a ${rec.kind}, the shapes show a ${truth.kind}`, q);
    const img = A.map((p) => rec.map.at(p));
    must(img.every((p) => B.some((r) => same(p, r))) && B.every((r) => img.some((p) => same(p, r))), 'the map named carries A onto B', q);
    must(q.workingOut === q.answer, 'working is the description', q);
    // The reveal draws what the answer names, and nothing else.
    if (rec.kind === 'reflection') {
      const axis = rec.line.x === 0 || rec.line.y === 0;
      must(sameLine(f.solutionMirror, rec.line) && f.solutionMirrorLabel === (axis ? undefined : lineLabelOf(rec.line)) && f.solutionCentre === undefined, 'the mirror line drawn on reveal (an axis unlabelled)', q);
    } else if (rec.kind === 'translation') {
      must(f.solutionMirror === undefined && f.solutionCentre === undefined, 'nothing drawn on reveal', q);
    } else {
      must(f.solutionCentre && same(f.solutionCentre, rec.centre) && f.solutionMirror === undefined, 'the centre drawn on reveal', q);
      must(Math.abs(rec.centre[0]) <= LIMIT && Math.abs(rec.centre[1]) <= LIMIT, 'the centre on the grid', q);
      must((rec.centre[0] && rec.centre[1]) || (!rec.centre[0] && !rec.centre[1] && rec.kind === 'rotation'), 'a centre dot stands off the axes, unless it is the origin', q);
      must(!inBox(rec.centre, A) && !inBox(rec.centre, B), 'the centre stands clear of both shapes', q);
    }
    must(f.solution === undefined, 'no image drawn', q);
  }
  must(BAND_RULES[topic][band](rec), `${kindOf(rec)} is not a ${topic} ${band} question`, q);
  return { kind: kindOf(rec) };
}
