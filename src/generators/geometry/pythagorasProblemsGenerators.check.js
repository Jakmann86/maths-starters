// Test support only. Checks pythagorasProblemsGenerators.js from what is
// printed: the side lengths are read off the figure's labels (or the points
// off the question), the converse or the two-step Pythagoras is redone here,
// and the answer and every working line must agree. Nothing is imported from
// the generator.

import { compiles } from '../number/latexArithmetic.check';

const must = (cond, msg) => { if (!cond) throw new Error(msg); };
const isSquare = (n) => Number.isInteger(Math.sqrt(n));
const lines = (s) => String(s ?? '').split('\n');

/** "24 cm" -> [24, 'cm']; 'x' stays 'x'. */
const read = (label) => {
  if (label === 'x') return ['x', null];
  const m = /^(\d+) (cm|m|km)$/.exec(label ?? '');
  must(m, `a whole-number length: ${label}`);
  return [Number(m[1]), m[2]];
};
const cm = (label) => {
  const [n, u] = read(label);
  must(n === 'x' || u === 'cm', `in cm: ${label}`);
  return n;
};

/* --------------------------------------------------------------- converse */

function checkConverseFigure(q, band) {
  const f = q.visualization;
  must(f?.type === 'oblique-triangle' && f.big === true, 'a big oblique triangle');
  must(q.questionMath === undefined, 'everything on the figure');
  const read3 = f.sides.map(read);
  must(read3.every(([, u]) => u === read3[0][1]), 'one unit');
  const s = read3.map(([n]) => n);
  must(s.every((n) => Number.isInteger(n) && n > 0), 'three given sides');
  // The drawing is chosen from the angles, so they must be the triangle's.
  const ang = (x, y, z) => (Math.acos((y * y + z * z - x * x) / (2 * y * z)) * 180) / Math.PI;
  const truth = [ang(s[0], s[1], s[2]), ang(s[1], s[2], s[0]), ang(s[2], s[0], s[1])];
  truth.forEach((t, i) => must(Math.abs(t - f.angles[i]) < 1e-6, 'figure angles are the true ones'));
  const sorted = [...s].sort((x, y) => x - y);
  const [a, b, c] = sorted;
  must(a + b > c && new Set(s).size === 3, 'a scalene triangle');
  const right = a * a + b * b === c * c;
  if (!right) must(Math.abs(a * a + b * b - c * c) <= 4 * c + 4, 'a near miss, not an obvious no');
  const reason = right ? `${a}^2 + ${b}^2 = ${c}^2` : `${a}^2 + ${b}^2 \\ne ${c}^2`;
  let verdict;
  if (band === 'foundation') {
    must(q.instruction === 'Is the triangle right-angled?', 'instruction');
    must(f.vertices === undefined, 'no letters at Foundation');
    must(c <= 30, 'squares to do by hand');
    verdict = right ? '\\text{Yes}' : '\\text{No}';
  } else {
    must(q.instruction === 'Find the right angle, if there is one', 'instruction');
    must(Array.isArray(f.vertices) && f.vertices.length === 3, 'named vertices');
    must(c > 25, 'larger sides at Core');
    verdict = right ? `\\text{Right-angled at } ${f.vertices[s.indexOf(c)]}` : '\\text{Not right-angled}';
  }
  must(q.answer === `${verdict}: \\; ${reason}`, `answer ${q.answer}, expected ${verdict}: ${reason}`);
  const w = lines(q.workingOut);
  must(w.length === 3, 'three working lines');
  must(w[0] === `${a}^2 + ${b}^2 = ${a * a} + ${b * b} = ${a * a + b * b}`, `working line ${w[0]}`);
  must(w[1] === `${c}^2 = ${c * c}`, `working line ${w[1]}`);
  must(w[2] === verdict, 'working ends at the verdict');
  return { kind: right ? 'right' : 'not right' };
}

function checkConversePoints(q) {
  must(q.instruction === 'Find the right angle, if there is one', 'instruction');
  must(q.visualization === null, 'no figure');
  const m = /^A\((-?\d+), (-?\d+)\), \\; B\((-?\d+), (-?\d+)\), \\; C\((-?\d+), (-?\d+)\)$/.exec(q.questionMath ?? '');
  must(m, `three points: ${q.questionMath}`);
  const P = { A: [+m[1], +m[2]], B: [+m[3], +m[4]], C: [+m[5], +m[6]] };
  const [ux, uy] = [P.B[0] - P.A[0], P.B[1] - P.A[1]];
  const [vx, vy] = [P.C[0] - P.A[0], P.C[1] - P.A[1]];
  must(ux * vy - uy * vx !== 0, 'not in a line');
  const run = (k) => Math.abs(P[k[0]][0] - P[k[1]][0]);
  const rise = (k) => Math.abs(P[k[0]][1] - P[k[1]][1]);
  const NAMES = ['AB', 'BC', 'AC'];
  const sq = Object.fromEntries(NAMES.map((k) => [k, run(k) ** 2 + rise(k) ** 2]));
  const max = Math.max(...Object.values(sq));
  const longest = NAMES.filter((k) => sq[k] === max);
  must(longest.length === 1, 'one longest side');
  const L = longest[0];
  const rest = NAMES.filter((k) => k !== L);
  const sum = sq[rest[0]] + sq[rest[1]];
  const right = sum === max;
  const at = ['A', 'B', 'C'].find((n) => !L.includes(n));
  const verdict = right ? `\\text{Right-angled at } ${at}` : '\\text{Not right-angled}';
  must(q.answer === `${verdict}: \\; ${rest[0]}^2 + ${rest[1]}^2 ${right ? '=' : '\\ne'} ${L}^2`, `answer ${q.answer}`);
  const w = lines(q.workingOut);
  must(w.length === 5, 'five working lines');
  NAMES.forEach((k, i) => must(w[i] === `${k}^2 = ${run(k)}^2 + ${rise(k)}^2 = ${sq[k]}`, `working line ${w[i]}`));
  must(w[3] === `${sq[rest[0]]} + ${sq[rest[1]]} = ${sum}${right ? '' : ` \\ne ${max}`}`, `working line ${w[3]}`);
  must(w[4] === verdict, 'working ends at the verdict');
  return { kind: right ? 'right' : 'not right' };
}

/* --------------------------------------------------------------------- 3D */

const surd = (s) => (isSquare(s) ? `${Math.sqrt(s)}` : `\\sqrt{${s}}`);

function check3d(q, band) {
  const f = q.visualization;
  must(f?.big === true && q.questionMath === undefined, 'a big figure, nothing else');
  must(q.answerUnits === '\\text{cm}', 'answer in cm');
  const w = lines(q.workingOut);

  if (band === 'foundation' && f.type === 'cone') {
    const [r, h, l] = [cm(f.r), cm(f.h), cm(f.l)];
    const unk = ['r', 'h', 'l'].filter((k) => cm(f[k]) === 'x');
    must(unk.length === 1 && f.unknown === unk[0], 'one unknown, coloured');
    const name = { h: 'perpendicular height', l: 'slant height', r: 'radius' }[f.unknown];
    must(q.instruction === `Find the ${name} of the cone`, 'instruction');
    const x2 = f.unknown === 'l' ? h * h + r * r : l * l - (f.unknown === 'h' ? r * r : h * h);
    must(x2 > 0 && isSquare(x2), 'a whole-number answer from a triple');
    const x = Math.sqrt(x2);
    must(q.answer === `x = ${x}`, `answer ${q.answer}, expected x = ${x}`);
    const first = f.unknown === 'l' ? `x^2 = ${h}^2 + ${r}^2` : `x^2 = ${l}^2 - ${f.unknown === 'h' ? r : h}^2`;
    must(w.join('|') === [first, `x^2 = ${x2}`, `x = ${x}`].join('|'), 'working');
    return { kind: 'cone' };
  }

  if (band !== 'stretch') {
    must(f.unknown === 'diagonal' && f.diagonal === 'x', 'the diagonal is x');
    if (f.type === 'cylinder') {
      must(q.instruction === 'Find the length of the rod', 'instruction');
      const h = cm(f.h);
      // Foundation gives the diameter; Core the radius, to be doubled.
      const D = band === 'foundation' ? cm(f.diameter) : 2 * cm(f.r);
      must(band === 'foundation' ? f.r === undefined : f.diameter === undefined, 'diameter at Foundation, radius at Core');
      const s = D * D + h * h;
      if (band === 'foundation') must(isSquare(s), 'a triple at Foundation');
      must(q.answer === `x = ${surd(s)}`, `answer ${q.answer}, expected x = ${surd(s)}`);
      const want = band === 'foundation'
        ? [`x^2 = ${D}^2 + ${h}^2`, `x^2 = ${s}`, `x = ${surd(s)}`]
        : [`\\text{diameter} = ${D}`, `x^2 = ${D}^2 + ${h}^2`, `x^2 = ${s}`, `x = ${surd(s)}`];
      must(w.join('|') === want.join('|'), 'working');
      return { kind: 'cylinder' };
    }
    must(band === 'core' && f.type === 'cuboid' && f.baseDiagonal === true, 'a cuboid with its floor diagonal at Core');
    must(q.instruction === 'Find the length of the diagonal', 'instruction');
    const [l, d, h] = [cm(f.l), cm(f.d), cm(f.h)];
    must(!(l === d && d === h), 'not a cube');
    const s = l * l + d * d + h * h;
    must(q.answer === `x = ${surd(s)}`, `answer ${q.answer}, expected x = ${surd(s)}`);
    must(w.join('|') === [`y^2 = ${l}^2 + ${d}^2 = ${l * l + d * d}`, 'x^2 = y^2 + ' + `${h}^2`, `x^2 = ${l * l + d * d} + ${h * h} = ${s}`, `x = ${surd(s)}`].join('|'), 'working');
    return { kind: 'cuboid' };
  }

  // Stretch: the diagonal given, an edge wanted, to 3 s.f.
  must(q.instruction === 'Find x, correct to 3 significant figures', 'instruction');
  const D = cm(f.diagonal);
  must(Number.isInteger(D), 'the diagonal given');
  let x2; let kind; let want;
  if (f.type === 'cylinder') {
    must(cm(f.h) === 'x' && f.unknown === 'h', 'the height is x');
    const dia = 2 * cm(f.r);
    x2 = D * D - dia * dia;
    want = [`\\text{diameter} = ${dia}`, `x^2 + ${dia}^2 = ${D}^2`, `x^2 = ${x2}`];
    kind = 'cylinder';
  } else {
    must(f.type === 'cuboid' && !f.baseDiagonal, 'a cuboid');
    const e = ['l', 'd', 'h'].map((k) => cm(f[k]));
    if (e.every((v) => v === 'x')) {
      must(f.unknown === 'l', 'one of the cube edges coloured');
      x2 = (D * D) / 3;
      want = [`x^2 + x^2 + x^2 = ${D}^2`, `3x^2 = ${D * D}`, `x^2 = ${Number.isInteger(x2) ? x2 : `\\frac{${D * D}}{3}`}`];
      kind = 'cube';
    } else {
      const xs = ['l', 'd', 'h'].filter((k) => cm(f[k]) === 'x');
      must(xs.length === 1 && f.unknown === xs[0], 'one edge x, coloured');
      const [a, b] = e.filter((v) => v !== 'x');
      x2 = D * D - a * a - b * b;
      want = [`x^2 + ${a}^2 + ${b}^2 = ${D}^2`, `x^2 = ${D * D} - ${a * a} - ${b * b}`, `x^2 = ${x2}`];
      kind = 'cuboid';
    }
  }
  must(x2 > 0 && !isSquare(x2), 'a real length, not a whole number');
  const x = Math.sqrt(x2).toPrecision(3);
  must(q.answer === `x = ${x}`, `answer ${q.answer}, expected x = ${x}`);
  must(w.join('|') === [...want, `x = ${x} \\text{ (3 s.f.)}`].join('|'), 'working');
  return { kind };
}

/* ------------------------------------------------------------------- all */

export function checkPythagorasProblems(q, band) {
  const topic = q.metadata?.topic;
  must(q.metadata?.difficulty === band, 'metadata band');
  must(!/\d/.test(q.instruction.replace('3 significant figures', '')), `a digit in the instruction: ${q.instruction}`);
  [q.questionMath, q.answer, q.workingOut].forEach((s) => s && compiles(s));
  if (topic === 'pythagoras-converse') return band === 'stretch' ? checkConversePoints(q) : checkConverseFigure(q, band);
  if (topic === 'pythagoras-3d') return check3d(q, band);
  throw new Error(`unknown topic ${topic}`);
}
