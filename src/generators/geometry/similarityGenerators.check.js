// The checker for the Similarity skills, shared by the harness
// (similarityGenerators.test.js) and the mutation test
// (similarityGenerators.mutation.test.js). Test support only.
//
// Everything is read back off the board: the figure's labels, the
// sentences, and the given line. The scale factor is found here from
// whichever matching pair is fully labelled, and the unknown is then solved
// for by bisection on the one ratio it appears in, so a figure whose
// labels sit on the wrong sides gives the wrong number. Areas go with k
// squared and volumes with k cubed. Nothing is imported from the generator.
//
// Working lines are evaluated with checkLine from the further-trig checker
// (its own small LaTeX evaluator, test support too), with every named
// segment bound to the value worked out here.

import { checkLine } from './furtherTrigGenerators.check';

const fail = (msg, q) => { throw new Error(`${msg}\n${JSON.stringify(q)}`); };
const must = (cond, msg, q) => { if (!cond) fail(msg, q); };
const close = (a, b) => Math.abs(a - b) <= 1e-9 * Math.max(1, Math.abs(a), Math.abs(b));

const len = (label) => { const m = /^(\d+(?:\.\d+)?) cm$/.exec(label ?? ''); return m ? Number(m[1]) : NaN; };
const exact = (s) => /^\d+(\.(5|25|75))?$/.test(s);

// The answer "x = 7.5" (or "QR = 7.5"), exact, and its value.
function answerOf(q, name = 'x') {
  const m = new RegExp(`^${name} = (\\d+(?:\\.\\d+)?)$`).exec(q.answer);
  must(m && exact(m[1]), `answer "${q.answer}"`, q);
  return Number(m[1]);
}

function checkWorking(q, env) {
  must(typeof q.workingOut === 'string' && !q.workingOut.includes('\\n'), 'working uses real newlines', q);
  // The working arrives at the answer.
  const final = (q.answer.match(/\d+(\.\d+)?$/) ?? [])[0];
  const last = q.workingOut.split('\n').at(-1);
  const lhs = /^([A-Za-z]+) = /.exec(q.answer)?.[1];
  must(last.endsWith(`= ${final}`) && (!lhs || last.startsWith(`${lhs} = `)), `the working stops short of ${q.answer}`, q);
  q.workingOut.split('\n').forEach((raw) => {
    const line = raw.replace(/\\text\{Area of \} ([A-Z]{3})/g, 'T$1');
    let ok;
    try { ok = checkLine(line, env); } catch (e) { fail(`working "${raw}": ${e.message}`, q); }
    must(ok, `working "${raw}" does not hold`, q);
  });
}

const meta = (q, topic, difficulty) => must(q.metadata?.topic === topic && q.metadata?.difficulty === difficulty, 'metadata', q);

// Solve f(x) = target on (0, 2000) by bisection, f monotonic.
function solve(f, target) {
  let lo = 1e-6, hi = 2000;
  const g = (x) => f(x) - target;
  if (g(lo) * g(hi) > 0) return NaN;
  for (let i = 0; i < 200; i += 1) {
    const mid = (lo + hi) / 2;
    if (g(lo) * g(mid) <= 0) hi = mid; else lo = mid;
  }
  return (lo + hi) / 2;
}

/* -------------------------------------------------- the similar pair */

// Both shapes' labels; which is larger; the scale factor from the side
// labelled on both; the unknown side solved for.
function readPair(q, areasGiveK = false) {
  const f = q.visualization;
  must(f?.type === 'similar-pair' && f.big === true && ['triangle', 'rectangle'].includes(f.shape), 'a similar-pair figure', q);
  const n = f.shape === 'triangle' ? 3 : 2;
  const L = f.left, R = f.right;
  must(L && R && L.sides?.length === n && R.sides?.length === n, 'both shapes have their sides', q);
  must(Boolean(L.big) !== Boolean(R.big), 'one shape is the larger', q);
  const [big, small] = L.big ? ['left', 'right'] : ['right', 'left'];
  const S = { left: L, right: R };
  const both = [...Array(n).keys()].filter((i) => Number.isFinite(len(S.left.sides[i])) && Number.isFinite(len(S.right.sides[i])));
  // When both areas are given, k comes from them and no side pair is needed.
  must(both.length === (areasGiveK ? 0 : 1), areasGiveK ? 'no side pair: the areas give k' : 'exactly one side is labelled on both shapes', q);
  const g = both[0];
  const k = areasGiveK ? NaN : len(S[big].sides[g]) / len(S[small].sides[g]);
  if (!areasGiveK) must(k > 1, 'the larger shape is drawn larger', q);
  // Ranking honesty, with any x filled in once known.
  const ranked = (sides) => {
    const v = sides.map(len);
    if (f.shape === 'rectangle') return !(Number.isFinite(v[0]) && Number.isFinite(v[1])) || v[0] > v[1];
    const ok = (a, b) => !(Number.isFinite(v[a]) && Number.isFinite(v[b])) || v[a] > v[b];
    return ok(1, 0) && ok(0, 2) && ok(1, 2);
  };
  return { f, n, S, big, small, g, k, ranked };
}

/* --------------------------------------------------- similar shapes */

export function checkSimilarShapes(q, difficulty) {
  meta(q, 'similar-shapes', difficulty);
  must(q.answerUnits === '\\text{cm}', 'units cm', q);
  if (difficulty === 'stretch') return checkNamed(q);
  must(q.questionText === undefined && q.questionMath === undefined, 'everything is on the figure', q);
  const { f, n, S, big, k, ranked } = readPair(q);
  must(q.instruction === `The ${f.shape}s are similar. Find x.`, 'instruction', q);
  const xs = ['left', 'right'].flatMap((w) => S[w].sides.map((t, i) => (t === 'x' ? { which: w, index: i } : null))).filter(Boolean);
  must(xs.length === 1, 'one x', q);
  const [u] = xs;
  must(JSON.stringify(f.unknown) === JSON.stringify({ side: u.which, index: u.index }), 'x takes the slot colour', q);
  const other = u.which === 'left' ? 'right' : 'left';
  const given = len(S[other].sides[u.index]);
  must(Number.isFinite(given), 'the matching side is labelled on the other shape', q);
  const labelled = ['left', 'right'].map((w) => S[w].sides.filter((t) => t).length);
  must(labelled.every((c) => c === 2), 'two sides labelled on each shape', q);
  const x = u.which === big ? given * k : given / k;
  must(close(answerOf(q), x), `answer ${q.answer}, x is ${x}`, q);
  // With x filled in, both shapes rank as drawn.
  const filled = (w) => S[w].sides.map((t) => (t === 'x' ? `${x} cm` : t));
  must(ranked(filled('left')) && ranked(filled('right')), 'the labels rank as the outline does', q);
  void n;
  if (difficulty === 'foundation') {
    must(f.turn === 'none' && u.which === big && Number.isInteger(k), 'foundation: side by side, x on the larger, whole k', q);
  } else {
    must(f.shape === 'triangle' ? ['rotate', 'flip'].includes(f.turn) : f.turn === 'quarter', 'core: the second shape turned', q);
  }
  checkWorking(q, { k, x });
  return { kind: `${f.shape}${u.which === big ? ' x larger' : ' x smaller'}` };
}

// A number and its unit are held together by a no-break space.
const NAMED_TRI = /^Triangle ([A-Z]{3}) is similar to triangle ([A-Z]{3})\. ([A-Z]{2}) = (\d+(?:\.\d+)?)\u00a0cm, ([A-Z]{2}) = (\d+(?:\.\d+)?)\u00a0cm and ([A-Z]{2}) = (\d+(?:\.\d+)?)\u00a0cm\.$/;
const NAMED_RECT = /^Rectangles ([A-Z]{4}) and ([A-Z]{4}) are similar\. ([A-Z]{2}) = (\d+(?:\.\d+)?)\u00a0cm, ([A-Z]{2}) = (\d+(?:\.\d+)?)\u00a0cm and ([A-Z]{2}) = (\d+(?:\.\d+)?)\u00a0cm\.$/;

// A side named by two letters, located in one of the shapes: which shape,
// and its position (the vertex opposite for a triangle, the edge number
// round the rectangle, with opposite edges equal).
function locate(name, shapes, rect) {
  for (let s = 0; s < 2; s += 1) {
    const L = shapes[s];
    if (!rect) {
      const [i, j] = [L.indexOf(name[0]), L.indexOf(name[1])];
      if (i >= 0 && j >= 0 && i !== j) return { shape: s, index: 3 - i - j };
    } else {
      for (let e = 0; e < 4; e += 1) {
        const ends = [L[e], L[(e + 1) % 4]];
        if ((ends[0] === name[0] && ends[1] === name[1]) || (ends[0] === name[1] && ends[1] === name[0])) return { shape: s, index: e % 2 };
      }
    }
  }
  return null;
}

function checkNamed(q) {
  must(q.visualization === undefined && q.questionMath === undefined, 'no figure', q);
  const t = NAMED_TRI.exec(q.instruction), r = NAMED_RECT.exec(q.instruction);
  const m = t ?? r;
  must(m, `instruction "${q.instruction}"`, q);
  const rect = Boolean(r);
  const shapes = [m[1], m[2]];
  must(new Set([...m[1], ...m[2]]).size === (rect ? 8 : 6), 'two shapes with different letters', q);
  if (rect) {
    // The second name is a relabelling round the rectangle, not in order.
    const sorted = [...m[2]].sort().join('');
    must(m[2] !== sorted, 'the second rectangle is named starting part way round', q);
  } else {
    must(m[2] !== [...m[2]].sort().join(''), 'the second triangle is named out of order', q);
  }
  const facts = [[m[3], Number(m[4])], [m[5], Number(m[6])], [m[7], Number(m[8])]].map(([nm, v]) => ({ nm, v, at: locate(nm, shapes, rect) }));
  must(facts.every((x) => x.at), 'every side named is a side of one shape', q);
  const ask = /^Find ([A-Z]{2})\.$/.exec(q.questionText ?? '');
  must(ask, `question "${q.questionText}"`, q);
  const target = locate(ask[1], shapes, rect);
  must(target, 'the side asked is a side', q);
  // k from the pair on both shapes; then the side matching the one asked.
  const pair = facts.filter((a) => facts.some((b) => b !== a && b.at.index === a.at.index && b.at.shape !== a.at.shape));
  must(pair.length === 2, 'one matching pair', q);
  const k = pair.find((x) => x.at.shape === 1).v / pair.find((x) => x.at.shape === 0).v;
  const lone = facts.find((x) => !pair.includes(x));
  must(lone.at.index === target.index && lone.at.shape !== target.shape, 'the side asked matches the third side given', q);
  const value = target.shape === 1 ? lone.v * k : lone.v / k;
  must(close(answerOf(q, ask[1]), value), `answer ${q.answer}, ${ask[1]} is ${value}`, q);
  must(k > 1, 'the second shape is the larger', q);
  checkWorking(q, { k, [ask[1]]: value });
  return { kind: rect ? 'named rectangles' : 'named triangles' };
}

/* ------------------------------------------------- similar triangles */

const SEG_A = ['AD', 'DB', 'AB', 'AE', 'EC', 'AC', 'DE', 'BC'];
const SEG_X = ['AC', 'CD', 'BC', 'CE', 'AB', 'DE'];

// Values of every segment, with x standing in for the unknown; null where
// not known. The A shape's whole sides come from their parts and back.
function segments(labels, kind, x, extra = {}) {
  const v = {};
  (kind === 'A' ? SEG_A : SEG_X).forEach((s) => {
    const t = labels[s];
    v[s] = t === 'x' ? x : t ? len(t) : null;
  });
  Object.assign(v, extra);
  if (kind === 'A') {
    [['AD', 'DB', 'AB'], ['AE', 'EC', 'AC']].forEach(([a, b, w]) => {
      if (v[w] == null && v[a] != null && v[b] != null) v[w] = v[a] + v[b];
      if (v[a] == null && v[w] != null && v[b] != null) v[a] = v[w] - v[b];
      if (v[b] == null && v[w] != null && v[a] != null) v[b] = v[w] - v[a];
    });
  }
  return v;
}

const RATIOS = { A: [['AB', 'AD'], ['AC', 'AE'], ['BC', 'DE']], X: [['CD', 'AC'], ['CE', 'BC'], ['DE', 'AB']] };

// The one value of x that makes every complete ratio equal.
function solveTriangles(labels, kind, extra, q) {
  // Ratios complete without x give k.
  const base = segments(labels, kind, null, extra);
  const known = RATIOS[kind].filter(([b, s]) => base[b] != null && base[s] != null).map(([b, s]) => base[b] / base[s]);
  must(known.length >= 1, 'a matching pair gives the scale factor', q);
  must(known.every((r) => close(r, known[0])), 'the given lengths agree', q);
  const k = known[0];
  let x;
  if (kind === 'X' && extra.AD != null) {
    // AD = AC + CD, with CD = k AC.
    x = solve((t) => {
      const v = segments(labels, kind, t, {});
      const AC = v.AC ?? (v.CD != null ? v.CD / k : null);
      const CD = v.CD ?? AC * k;
      return AC + CD;
    }, extra.AD);
  } else {
    const ratio = RATIOS[kind].find(([b, s]) => {
      const v = segments(labels, kind, 1.2345, extra);
      return v[b] != null && v[s] != null && (base[b] == null || base[s] == null);
    });
    must(ratio, 'x is in a matching pair', q);
    x = solve((t) => { const v = segments(labels, kind, t, extra); return v[ratio[0]] / v[ratio[1]]; }, k);
    // The ratio may fall as x grows; bisection needs only a sign change.
  }
  must(Number.isFinite(x), 'x can be found', q);
  // Every segment's value, the ones not labelled from their partners.
  const v = segments(labels, kind, x, extra);
  RATIOS[kind].forEach(([b, s]) => {
    if (v[b] == null && v[s] != null) v[b] = v[s] * k;
    if (v[s] == null && v[b] != null) v[s] = v[b] / k;
  });
  return { k, x, v: kind === 'A' ? segments(Object.fromEntries(Object.entries(v).filter(([, val]) => val != null).map(([key, val]) => [key, `${val} cm`])), 'A', x) : v };
}

function readTriangles(q) {
  const f = q.visualization;
  must(f?.type === 'similar-triangles' && f.big === true && ['A', 'X'].includes(f.kind) && typeof f.mirror === 'boolean', 'a similar-triangles figure', q);
  const L = f.vertices;
  must(Array.isArray(L) && L.length === 5 && new Set(L).size === 5, 'five vertex letters', q);
  const name = (seg) => [...seg].map((c) => L['ABCDE'.indexOf(c)]).join('');
  const segs = f.kind === 'A' ? SEG_A : SEG_X;
  must(Object.keys(f.labels ?? {}).every((s) => segs.includes(s)), 'labels on segments of the shape', q);
  return { f, name };
}

export function checkSimilarTriangles(q, difficulty) {
  meta(q, 'similar-triangles', difficulty);
  must(q.answerUnits === '\\text{cm}' && q.questionText === undefined, 'units cm', q);
  const { f, name } = readTriangles(q);
  const xs = Object.keys(f.labels).filter((s) => f.labels[s] === 'x');
  must(xs.length === 1 && f.unknown === xs[0], 'one x, in the slot colour', q);
  const u = xs[0];
  must(q.instruction === (f.kind === 'A' ? `${name('DE')} is parallel to ${name('BC')}. Find x.` : `${name('AB')} is parallel to ${name('ED')}. Find x.`), 'the instruction names the parallel sides', q);
  let extra = {};
  if (q.questionMath !== undefined) {
    const m = new RegExp(`^${name('AD')} = (\\d+(?:\\.\\d+)?)\\\\text\\{ cm\\}$`).exec(q.questionMath);
    must(m && f.kind === 'X' && q.questionMathCompact === true, `given line "${q.questionMath}"`, q);
    extra = { AD: Number(m[1]) };
  }
  const { k, x, v } = solveTriangles(f.labels, f.kind, extra, q);
  must(k > 1, 'the larger triangle is drawn larger', q);
  must(close(answerOf(q), x), `answer ${q.answer}, x is ${x}`, q);
  const L = f.labels;
  const parts = ['DB', 'EC'].some((s) => L[s]);
  let kind;
  if (f.kind === 'A') {
    if (['DB', 'EC'].includes(u)) kind = 'A, x a part';
    else if (parts) kind = 'A, parts given';
    else kind = 'A, whole sides';
  } else kind = extra.AD != null ? 'X, whole line' : 'X';
  const allowed = { foundation: ['A, whole sides'], core: ['A, parts given', 'X'], stretch: ['A, x a part', 'X, whole line'] }[difficulty];
  must(allowed.includes(kind), `${difficulty} does not ask "${kind}"`, q);
  const env = { k, x };
  Object.entries(v).forEach(([s, val]) => { if (val != null) env[name(s)] = val; });
  if (f.kind === 'X') { env[name('AD')] = v.AC + v.CD; env[name('ED')] = v.DE; }
  checkWorking(q, env);
  return { kind };
}

/* ----------------------------------- areas and volumes of similar shapes */

const AREA = /^Area = (\d+(?:\.\d+)?) cm²$/;

export function checkSimilarAreasVolumes(q, difficulty) {
  meta(q, 'similar-areas-volumes', difficulty);
  must(q.questionText === undefined, 'no prose question', q);
  const f = q.visualization;
  let kind;
  if (f?.type === 'similar-pair') {
    must(q.questionMath === undefined, 'everything on the figure', q);
    const both = ['left', 'right'].every((w) => AREA.test(f[w]?.area ?? ''));
    const { S, big, small, k } = readPair(q, both);
    const areaOf = (w) => { const m = AREA.exec(S[w].area ?? ''); return m ? Number(m[1]) : S[w].area === 'Area = A' ? 'A' : NaN; };
    const [aBig, aSmall] = [areaOf(big), areaOf(small)];
    if (aBig === 'A' || aSmall === 'A') {
      must(q.instruction === `The ${f.shape}s are similar. Find the area A.`, 'instruction', q);
      const which = aBig === 'A' ? big : small;
      must(JSON.stringify(f.unknown) === JSON.stringify({ area: which }), 'A takes the slot colour', q);
      const known = aBig === 'A' ? aSmall : aBig;
      must(Number.isFinite(known), 'the other area is given', q);
      const A = aBig === 'A' ? known * k * k : known / (k * k);
      const m = /^A = (\d+(?:\.\d+)?)$/.exec(q.answer);
      must(m && exact(m[1]) && close(Number(m[1]), A), `answer ${q.answer}, A is ${A}`, q);
      must(q.answerUnits === '\\text{cm}^2', 'units cm²', q);
      must(S.left.sides.filter((t) => t).length === 1 && S.right.sides.filter((t) => t).length === 1, 'one matching side on each', q);
      kind = 'area from sides';
      checkWorking(q, { k, A });
    } else {
      // Both areas given: k is the square root of their ratio; x is a side.
      must(Number.isFinite(aBig) && Number.isFinite(aSmall), 'both areas', q);
      const xs = ['left', 'right'].flatMap((w) => S[w].sides.map((t, i) => (t === 'x' ? { which: w, index: i } : null))).filter(Boolean);
      must(xs.length === 1, 'one x', q);
      const [u] = xs;
      must(JSON.stringify(f.unknown) === JSON.stringify({ side: u.which, index: u.index }), 'x takes the slot colour', q);
      const kk = Math.sqrt(aBig / aSmall);
      must(kk > 1, 'the larger shape has the larger area', q);
      const other = u.which === 'left' ? 'right' : 'left';
      const given = len(S[other].sides[u.index]);
      must(Number.isFinite(given), 'the matching side is given', q);
      void k;
      const x = u.which === big ? given * kk : given / kk;
      must(close(answerOf(q), x), `answer ${q.answer}, x is ${x}`, q);
      must(q.answerUnits === '\\text{cm}' && q.instruction === `The ${f.shape}s are similar. Find x.`, 'units and instruction', q);
      kind = 'length from areas';
      checkWorking(q, { k: kk, x });
    }
  } else if (f?.type === 'similar-solids') {
    must(['cylinder', 'cuboid', 'cone'].includes(f.solid) && f.big === true, 'a similar-solids figure', q);
    const S = { left: f.left, right: f.right };
    must(Boolean(S.left.big) !== Boolean(S.right.big), 'one solid is the larger', q);
    const [big, small] = S.left.big ? ['left', 'right'] : ['right', 'left'];
    const read = (w) => {
      const out = {};
      (S[w].value ?? '').split(', ').forEach((part) => {
        let m;
        if ((m = /^V = (\d+(?:\.\d+)?) cm³$/.exec(part))) out.V = Number(m[1]);
        else if (part === 'V = x') out.V = 'x';
        else if ((m = /^S = (\d+(?:\.\d+)?) cm²$/.exec(part))) out.S = Number(m[1]);
        else if (part) fail(`value "${part}"`, q);
      });
      if (S[w].length) out.h = len(S[w].length);
      return out;
    };
    const [B, Sm] = [read(big), read(small)];
    const plural = { cylinder: 'cylinders', cuboid: 'cuboids', cone: 'cones' }[f.solid];
    let k;
    if (Number.isFinite(B.h) && Number.isFinite(Sm.h)) {
      k = B.h / Sm.h;
      must(B.S === undefined && Sm.S === undefined, 'lengths or surface areas, not both', q);
      must(q.instruction === `The ${plural} are similar. Find the volume x.`, 'instruction', q);
      kind = 'volume from lengths';
    } else {
      must(Number.isFinite(B.S) && Number.isFinite(Sm.S) && B.h === undefined && Sm.h === undefined, 'both surface areas', q);
      k = Math.sqrt(B.S / Sm.S);
      must(q.instruction === `The ${plural} are similar. S is the surface area. Find the volume x.`, 'instruction', q);
      kind = 'volume from areas';
    }
    must(k > 1, 'the larger solid is drawn larger', q);
    const which = B.V === 'x' ? big : Sm.V === 'x' ? small : null;
    must(which && f.unknown === which, 'x is a volume, in the slot colour', q);
    const known = B.V === 'x' ? Sm.V : B.V;
    must(Number.isFinite(known), 'the other volume is given', q);
    const x = B.V === 'x' ? known * k ** 3 : known / k ** 3;
    must(close(answerOf(q), x), `answer ${q.answer}, x is ${x}`, q);
    must(q.answerUnits === '\\text{cm}^3', 'units cm³', q);
    checkWorking(q, { k, x });
  } else if (f?.type === 'similar-triangles') {
    const { name } = readTriangles(q);
    must(f.kind === 'A' && f.unknown === null, 'the A shape, no side unknown', q);
    must(q.instruction === `${name('DE')} is parallel to ${name('BC')}. Find the area of ${name('DBCE')}.`, 'instruction', q);
    const m = new RegExp(`^\\\\text\\{Area of triangle \\} ${name('ADE')} = (\\d+(?:\\.\\d+)?)\\\\text\\{ cm\\}\\^2$`).exec(q.questionMath ?? '');
    must(m && q.questionMathCompact === true, `given line "${q.questionMath}"`, q);
    const small = Number(m[1]);
    const base = segments(f.labels, 'A', null);
    const ks = RATIOS.A.filter(([b, s]) => base[b] != null && base[s] != null).map(([b, s]) => base[b] / base[s]);
    must(ks.length === 1, 'one side gives the scale factor', q);
    const k = ks[0];
    must(k > 1, 'scale factor', q);
    const trap = small * (k * k - 1);
    must(exact(q.answer) && close(Number(q.answer), trap), `answer ${q.answer}, the trapezium is ${trap}`, q);
    must(q.answerUnits === '\\text{cm}^2', 'units cm²', q);
    kind = 'trapezium';
    checkWorking(q, { k, [`T${name('ABC')}`]: small * k * k });
  } else fail('figure', q);
  const allowed = { foundation: ['area from sides'], core: ['length from areas', 'volume from lengths'], stretch: ['volume from areas', 'trapezium'] }[difficulty];
  must(allowed.includes(kind), `${difficulty} does not ask "${kind}"`, q);
  return { kind };
}
