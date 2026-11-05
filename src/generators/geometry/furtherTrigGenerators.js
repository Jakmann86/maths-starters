// src/generators/geometry/furtherTrigGenerators.js
//
// Haese 29B-F, with Rayner 10: the sine rule, the cosine rule, the area of a
// triangle as ½ab sin C, and problems that need the rules together. The
// topic is "Further trigonometry".
//
// Single triangles use the oblique-triangle figure. Its arrays are indexed
// by vertex, side i opposite angle i, and its `angles` are the triangle's
// true angles, worked out here from the numbers printed, so the figure can
// draw an obtuse triangle obtuse. Compound problems use two-triangles,
// whose outline is fixed, so the generator keeps each triangle's angles
// ranked as drawn (see Figure.jsx). Questions with no figure are the ones
// where a drawing would give the game away: the ambiguous case, and the
// two-answer area question, where any drawing commits to one of the
// answers.
//
// Lengths are given to 3 s.f., angles to 1 d.p., and the instruction says
// so. Working names any intermediate value (BD = 9.8826...) and then uses
// the name, never the rounded digits, so every working line holds exactly.

import _ from 'lodash';

const NL = '\n';
const toRad = (d) => (d * Math.PI) / 180;
const toDeg = (r) => (r * 180) / Math.PI;
const sin = (d) => Math.sin(toRad(d));
const cos = (d) => Math.cos(toRad(d));
const asin = (x) => toDeg(Math.asin(x));
const acos = (x) => toDeg(Math.acos(Math.max(-1, Math.min(1, x))));
const sig3 = (n) => n.toPrecision(3);
const dp1 = (n) => n.toFixed(1);
const trunc4 = (n) => (Math.floor(n * 1e4) / 1e4).toFixed(4);
const deg = (n) => `${n}^\\circ`;
const cm = (n) => `${n} cm`;

const SIDE = 'Find the length of the side marked x. Give your answer to 3 significant figures.';
const ANGLE = 'Find the size of the angle marked x. Give your answer to 1 decimal place.';
const AREA = 'Find the area of the triangle. Give your answer to 3 significant figures.';

const others = (i) => [(i + 1) % 3, (i + 2) % 3];
const TRIANGLES = ['ABC', 'PQR', 'XYZ', 'KLM', 'DEF', 'LMN'];
const QUADS = ['ABCD', 'PQRS', 'KLMN', 'WXYZ', 'EFGH'];

// A side named by its ends, and an angle by its vertex in the middle, both
// in the order the letters appear in the triangle's name.
const sideName = (name, u, v) => (name.indexOf(u) < name.indexOf(v) ? u + v : v + u);
const angleName = (name, v, p, q) => {
  const [s, t] = name.indexOf(p) < name.indexOf(q) ? [p, q] : [q, p];
  return `${s}${v}${t}`;
};

/* -------------------------------------------------------- triangles */

// Complete a triangle from sides j and k and the angle i between them.
function fromSAS(i, j, k, sj, sk, Ai) {
  const s = [];
  s[i] = Math.sqrt(sj * sj + sk * sk - 2 * sj * sk * cos(Ai));
  s[j] = sj; s[k] = sk;
  return { s, A: anglesOf(s) };
}

const anglesOf = (s) => [0, 1, 2].map((i) => {
  const [j, k] = others(i);
  return acos((s[j] * s[j] + s[k] * s[k] - s[i] * s[i]) / (2 * s[j] * s[k]));
});

// Integer angles, each at least `min`, summing to 180.
function angleSet(min, max) {
  for (;;) {
    const a = _.random(min, max), b = _.random(min, max);
    const c = 180 - a - b;
    if (c >= min && c <= max) return [a, b, c];
  }
}

const nearRight = (a, gap = 3) => Math.abs(a - 90) < gap;

const oblique = (extra) => ({ type: 'oblique-triangle', big: true, mirror: _.sample([true, false]), ...extra });

/* ------------------------------------------------------ single steps */
// Each builder returns a question body: figure, answer, working. The
// skills below pick among them and stamp the metadata.

// Sine rule for a side: side i with its opposite angle, and the angle
// opposite the side wanted. `viaSum` shows the other two angles instead,
// so the angle opposite the given side comes from the angle sum first.
function sineSide({ viaSum = false } = {}) {
  for (;;) {
    const A = angleSet(25, 115);
    const i = _.random(0, 2);
    const [j, k] = _.shuffle(others(i));
    if (A[i] === A[j]) continue;
    const si = _.random(5, 20);
    const x = (si * sin(A[j])) / sin(A[i]);
    const s = [];
    s[i] = si; s[j] = x; s[k] = (si * sin(A[k])) / sin(A[i]);
    const sides = [null, null, null];
    sides[i] = cm(si); sides[j] = 'x';
    const angleLabels = [null, null, null];
    angleLabels[j] = deg(A[j]);
    angleLabels[viaSum ? k : i] = deg(A[viaSum ? k : i]);
    const steps = [];
    if (viaSum) steps.push(`180^\\circ - ${deg(A[j])} - ${deg(A[k])} = ${deg(A[i])}`);
    steps.push(
      `\\frac{x}{\\sin(${deg(A[j])})} = \\frac{${si}}{\\sin(${deg(A[i])})}`,
      `x = \\frac{${si} \\times \\sin(${deg(A[j])})}{\\sin(${deg(A[i])})}`,
      `x = ${sig3(x)} \\text{ (3 s.f.)}`,
    );
    return {
      instruction: SIDE,
      answer: `x = ${sig3(x)}`,
      answerUnits: '\\text{cm}',
      workingOut: steps.join(NL),
      visualization: oblique({ angles: A, sides, angleLabels, unknown: { side: j } }),
    };
  }
}

// Sine rule for an angle: two sides and the angle opposite one of them,
// find the angle opposite the other. The other side is the shorter, so
// the angle is acute and there is only one answer.
function sineAngle() {
  for (;;) {
    const i = _.random(0, 2);
    const [j, k] = _.shuffle(others(i));
    const Ai = _.random(35, 130);
    const si = _.random(6, 20);
    const sj = _.random(3, si - 1);
    const r = (sj * sin(Ai)) / si;
    if (r >= 1) continue;
    const Aj = asin(r);
    const Ak = 180 - Ai - Aj;
    if (Aj < 18 || Ak < 18 || nearRight(Aj) || nearRight(Ak)) continue;
    const A = []; A[i] = Ai; A[j] = Aj; A[k] = Ak;
    const sides = [null, null, null];
    sides[i] = cm(si); sides[j] = cm(sj);
    const angleLabels = [null, null, null];
    angleLabels[i] = deg(Ai); angleLabels[j] = 'x';
    return {
      instruction: ANGLE,
      answer: `x = ${deg(dp1(Aj))}`,
      workingOut: [
        `\\frac{\\sin(x)}{${sj}} = \\frac{\\sin(${deg(Ai)})}{${si}}`,
        `\\sin(x) = \\frac{${sj} \\times \\sin(${deg(Ai)})}{${si}}`,
        `x = ${deg(dp1(Aj))} \\text{ (1 d.p.)}`,
      ].join(NL),
      visualization: oblique({ angles: A, sides, angleLabels, unknown: { angle: j } }),
    };
  }
}

// Cosine rule for a side: two sides and the angle between them.
function cosineSide() {
  for (;;) {
    const i = _.random(0, 2);
    const [j, k] = others(i);
    const Ai = _.random(25, 145);
    if (nearRight(Ai, 6)) continue;
    const sj = _.random(4, 20), sk = _.random(4, 20);
    const t = fromSAS(i, j, k, sj, sk, Ai);
    if (Math.min(...t.A) < 12) continue;
    const sides = [null, null, null];
    sides[i] = 'x'; sides[j] = cm(sj); sides[k] = cm(sk);
    const angleLabels = [null, null, null];
    angleLabels[i] = deg(Ai);
    return {
      instruction: SIDE,
      answer: `x = ${sig3(t.s[i])}`,
      answerUnits: '\\text{cm}',
      workingOut: [
        `x^2 = ${sj}^2 + ${sk}^2 - 2 \\times ${sj} \\times ${sk} \\times \\cos(${deg(Ai)})`,
        `x = \\sqrt{${sj}^2 + ${sk}^2 - 2 \\times ${sj} \\times ${sk} \\times \\cos(${deg(Ai)})}`,
        `x = ${sig3(t.s[i])} \\text{ (3 s.f.)}`,
      ].join(NL),
      visualization: oblique({ angles: t.A, sides, angleLabels, unknown: { side: i } }),
    };
  }
}

// Three whole-number sides, every angle at least `min`, none a right angle.
function sssSides(min = 18) {
  for (;;) {
    const s = [_.random(3, 20), _.random(3, 20), _.random(3, 20)];
    const A = anglesOf(s);
    if (A.some(Number.isNaN) || Math.min(...A) < min || A.some((a) => nearRight(a, 2))) continue;
    return { s, A };
  }
}

// Cosine rule for an angle: three sides.
function cosineAngle() {
  const { s, A } = sssSides();
  const i = _.random(0, 2);
  const [j, k] = others(i);
  const angleLabels = [null, null, null];
  angleLabels[i] = 'x';
  return {
    instruction: ANGLE,
    answer: `x = ${deg(dp1(A[i]))}`,
    workingOut: [
      `\\cos(x) = \\frac{${s[j]}^2 + ${s[k]}^2 - ${s[i]}^2}{2 \\times ${s[j]} \\times ${s[k]}}`,
      `x = ${deg(dp1(A[i]))} \\text{ (1 d.p.)}`,
    ].join(NL),
    visualization: oblique({ angles: A, sides: s.map(cm), angleLabels, unknown: { angle: i } }),
  };
}

/* ------------------------------------------------------- sine rule */
//   Foundation  a side; its opposite angle and the angle opposite x shown
//   Core        a side, with the angle opposite the given side left for the
//               angle sum; or an angle, from two sides and one angle
//   Stretch     no figure: two sides and a non-included acute angle, find
//               the other angle, giving both values when both are possible
//               (the ambiguous case, Haese 29C Examples 6 and 7)
export const generateSineRule = (options = {}) => {
  const { difficulty = 'core' } = options;
  let q;
  if (difficulty === 'foundation') q = sineSide();
  else if (difficulty === 'core') q = _.sample([true, false]) ? sineSide({ viaSum: true }) : sineAngle();
  else q = ambiguous();
  return { ...q, metadata: { topic: 'sine-rule', difficulty } };
};

function ambiguous() {
  const both = Math.random() < 0.65;
  for (;;) {
    const name = _.sample(TRIANGLES);
    const [K, O, M] = _.shuffle([...name]);   // known angle at K, asked at O
    const Ak = _.random(25, 70);
    const a = _.random(5, 20);                // OM, opposite K
    const b = _.random(5, 20);                // KM, opposite O
    if (both ? b <= a : b >= a) continue;
    const r = (b * sin(Ak)) / a;
    if (r >= 1) continue;
    const O1 = asin(r);
    if (O1 < 20 || O1 > 78) continue;
    const r1 = Number(dp1(O1));
    const r2 = Number(dp1(180 - r1));
    const angleK = angleName(name, K, O, M);
    const angleO = angleName(name, O, K, M);
    const given = _.shuffle([
      `${sideName(name, K, M)} = ${b} cm`,
      `${sideName(name, O, M)} = ${a} cm`,
    ]);
    const check = both
      ? `${deg(Ak)} + ${deg(dp1(r2))} < 180^\\circ`
      : `${deg(Ak)} + ${deg(dp1(r2))} > 180^\\circ`;
    return {
      instruction: `Find the size of angle ${angleO}, giving every possible value to 1 decimal place.`,
      questionText: `In triangle ${name}, ${given[0]}, ${given[1]} and angle ${angleK} = ${Ak}°.`,
      answer: both ? `${deg(dp1(r1))} \\text{ or } ${deg(dp1(r2))}` : `${deg(dp1(r1))} \\text{ only}`,
      workingOut: [
        `\\frac{\\sin(${O})}{${b}} = \\frac{\\sin(${deg(Ak)})}{${a}}`,
        `\\sin(${O}) = \\frac{${b} \\times \\sin(${deg(Ak)})}{${a}}`,
        `${O} = ${deg(dp1(O1))} \\text{ (1 d.p.)}`,
        `180^\\circ - ${deg(dp1(r1))} = ${deg(dp1(r2))}`,
        check,
      ].join(NL),
    };
  }
}

/* ----------------------------------------------------- cosine rule */
//   Foundation  a side, from two sides and the angle between them
//   Core        an angle, from three sides
//   Stretch     no figure: three sides, find the largest or the smallest
//               angle, so which angle comes first; sometimes in terms of x
//               (Rayner 10: sides 3x, 4x and 6x)
export const generateCosineRule = (options = {}) => {
  const { difficulty = 'core' } = options;
  let q;
  if (difficulty === 'foundation') q = cosineSide();
  else if (difficulty === 'core') q = cosineAngle();
  else q = extremeAngle();
  return { ...q, metadata: { topic: 'cosine-rule', difficulty } };
};

function extremeAngle() {
  const ask = Math.random() < 0.7 ? 'largest' : 'smallest';
  const wantObtuse = ask === 'largest' && Math.random() < 0.6;
  const algebraic = Math.random() < 0.25;
  for (;;) {
    const s = algebraic
      ? [_.random(2, 9), _.random(2, 9), _.random(2, 9)]
      : [_.random(3, 20), _.random(3, 20), _.random(3, 20)];
    if (new Set(s).size < 3) continue;
    const A = anglesOf(s);
    if (A.some(Number.isNaN) || Math.min(...A) < 10 || A.some((a) => nearRight(a, 2))) continue;
    const big = Math.max(...A);
    if (ask === 'largest' && wantObtuse !== big > 90) continue;
    const i = ask === 'largest' ? s.indexOf(Math.max(...s)) : s.indexOf(Math.min(...s));
    const [j, k] = others(i);
    const len = (n) => (algebraic ? `${n}x` : `${n}`);
    const sq = (n) => (algebraic ? `(${n}x)^2` : `${n}^2`);
    const two = algebraic ? `2 \\times ${s[j]}x \\times ${s[k]}x` : `2 \\times ${s[j]} \\times ${s[k]}`;
    const steps = [`\\cos(\\theta) = \\frac{${sq(s[j])} + ${sq(s[k])} - ${sq(s[i])}}{${two}}`];
    if (algebraic) steps.push(`\\cos(\\theta) = \\frac{${s[j]}^2 + ${s[k]}^2 - ${s[i]}^2}{2 \\times ${s[j]} \\times ${s[k]}}`);
    steps.push(`\\theta = ${deg(dp1(A[i]))} \\text{ (1 d.p.)}`);
    return {
      instruction: `A triangle has sides of these lengths. Find the size of its ${ask} angle. Give your answer to 1 decimal place.`,
      questionMath: _.shuffle(s).map((n) => `${len(n)}\\text{ cm}`).join(',\\quad '),
      answer: deg(dp1(A[i])),
      workingOut: steps.join(NL),
    };
  }
}

/* ------------------------------------------------ area, ½ab sin C */
//   Foundation  the area, from two sides and the angle between them
//   Core        the area given, find one of the two sides
//   Stretch     no figure: the area and two sides given, find the angle
//               between them: two answers, θ and 180° - θ (Haese 29B)
export const generateTriangleAreaSine = (options = {}) => {
  const { difficulty = 'core' } = options;
  let q;
  if (difficulty === 'foundation') q = areaForward();
  else if (difficulty === 'core') q = areaFindSide();
  else q = areaFindAngle();
  return { ...q, metadata: { topic: 'triangle-area-sine', difficulty } };
};

function sasFigure() {
  for (;;) {
    const i = _.random(0, 2);
    const [j, k] = _.shuffle(others(i));
    const Ai = _.random(25, 150);
    if (nearRight(Ai, 6)) continue;
    const sj = _.random(4, 20), sk = _.random(4, 20);
    const t = fromSAS(i, j, k, sj, sk, Ai);
    if (Math.min(...t.A) < 12) continue;
    return { i, j, k, Ai, sj, sk, t };
  }
}

function areaForward() {
  const { i, j, k, Ai, sj, sk, t } = sasFigure();
  const area = 0.5 * sj * sk * sin(Ai);
  const sides = [null, null, null];
  sides[j] = cm(sj); sides[k] = cm(sk);
  const angleLabels = [null, null, null];
  angleLabels[i] = deg(Ai);
  return {
    instruction: AREA,
    answer: sig3(area),
    answerUnits: '\\text{cm}^2',
    workingOut: [
      `\\text{Area} = \\frac{1}{2} \\times ${sj} \\times ${sk} \\times \\sin(${deg(Ai)})`,
      `\\text{Area} = ${sig3(area)} \\text{ (3 s.f.)}`,
    ].join(NL),
    visualization: oblique({ angles: t.A, sides, angleLabels, unknown: null }),
  };
}

function areaFindSide() {
  for (;;) {
    const { i, j, k, Ai, sj, sk } = sasFigure();
    const area = Math.round(0.5 * sj * sk * sin(Ai));
    if (area < 5) continue;
    const x = (2 * area) / (sk * sin(Ai));
    const t = fromSAS(i, j, k, x, sk, Ai);
    if (Math.min(...t.A) < 12) continue;
    const sides = [null, null, null];
    sides[j] = 'x'; sides[k] = cm(sk);
    const angleLabels = [null, null, null];
    angleLabels[i] = deg(Ai);
    return {
      instruction: SIDE,
      questionMath: `\\text{Area} = ${area}\\text{ cm}^2`,
      questionMathCompact: true,
      answer: `x = ${sig3(x)}`,
      answerUnits: '\\text{cm}',
      workingOut: [
        `\\frac{1}{2} \\times x \\times ${sk} \\times \\sin(${deg(Ai)}) = ${area}`,
        `x = \\frac{2 \\times ${area}}{${sk} \\times \\sin(${deg(Ai)})}`,
        `x = ${sig3(x)} \\text{ (3 s.f.)}`,
      ].join(NL),
      visualization: oblique({ angles: t.A, sides, angleLabels, unknown: { side: j } }),
    };
  }
}

function areaFindAngle() {
  for (;;) {
    const name = _.sample(TRIANGLES);
    const [V, P, Q] = _.shuffle([...name]);
    const p = _.random(4, 20), q = _.random(4, 20);
    const area = _.random(5, Math.floor(0.5 * p * q));
    const r = (2 * area) / (p * q);
    if (r >= 1) continue;
    const t1 = asin(r);
    if (t1 < 20 || t1 > 80) continue;
    const r1 = dp1(t1), r2 = dp1(180 - Number(r1));
    const given = _.shuffle([`${sideName(name, V, P)} = ${p} cm`, `${sideName(name, V, Q)} = ${q} cm`]);
    return {
      instruction: `Find the size of angle ${angleName(name, V, P, Q)}, giving every possible value to 1 decimal place.`,
      questionText: `Triangle ${name} has area ${area} cm², ${given[0]} and ${given[1]}.`,
      answer: `${deg(r1)} \\text{ or } ${deg(r2)}`,
      workingOut: [
        `\\frac{1}{2} \\times ${p} \\times ${q} \\times \\sin(${V}) = ${area}`,
        `\\sin(${V}) = \\frac{2 \\times ${area}}{${p} \\times ${q}}`,
        `${V} = ${deg(r1)} \\text{ (1 d.p.)}`,
        `180^\\circ - ${deg(r1)} = ${deg(r2)}`,
      ].join(NL),
    };
  }
}

/* ------------------------------------------ sine and cosine, mixed */
//   Foundation  one step, rule not named: the student chooses
//   Core        two steps in one triangle: the cosine rule for the third
//               side, then the sine rule for an angle (Haese 29F)
//   Stretch     either a bearings problem with no figure (Haese 29E,
//               Rayner 10), or two triangles sharing a side, solved one
//               after the other with one rule each (Haese 29F)
export const generateSineCosineMixed = (options = {}) => {
  const { difficulty = 'core' } = options;
  let q;
  if (difficulty === 'foundation') q = _.sample([sineSide, sineAngle, cosineSide, cosineAngle])();
  else if (difficulty === 'core') q = cosineThenSine();
  else q = _.sample([true, false]) ? bearings() : compound();
  return { ...q, metadata: { topic: 'sine-cosine-mixed', difficulty } };
};

function cosineThenSine() {
  for (;;) {
    const name = _.sample(TRIANGLES);
    const i = _.random(0, 2);
    const [j, k] = _.shuffle(others(i));
    const Ai = _.random(30, 140);
    if (nearRight(Ai, 6)) continue;
    const sj = _.random(4, 20), sk = _.random(4, 20);
    const t = fromSAS(i, j, k, sj, sk, Ai);
    // The angle wanted is opposite a side that is not the longest, so it is
    // acute and the sine rule finds it without ambiguity.
    if (sj >= Math.max(...t.s) || t.A[j] < 15 || nearRight(t.A[j]) || Math.min(...t.A) < 12) continue;
    const L = [...name];
    const third = sideName(name, L[j], L[k]);
    const sides = [null, null, null];
    sides[j] = cm(sj); sides[k] = cm(sk);
    const angleLabels = [null, null, null];
    angleLabels[i] = deg(Ai); angleLabels[j] = 'x';
    return {
      instruction: ANGLE,
      answer: `x = ${deg(dp1(t.A[j]))}`,
      workingOut: [
        `${third}^2 = ${sj}^2 + ${sk}^2 - 2 \\times ${sj} \\times ${sk} \\times \\cos(${deg(Ai)})`,
        `${third} = ${trunc4(t.s[i])}\\ldots`,
        `\\frac{\\sin(x)}{${sj}} = \\frac{\\sin(${deg(Ai)})}{${third}}`,
        `\\sin(x) = \\frac{${sj} \\times \\sin(${deg(Ai)})}{${third}}`,
        `x = ${deg(dp1(t.A[j]))} \\text{ (1 d.p.)}`,
      ].join(NL),
      visualization: oblique({ angles: t.A, sides, angleLabels, vertices: L, unknown: { angle: j } }),
    };
  }
}

const CONTEXTS = [
  { who: 'A ship', go: 'sails', verb: 'sails', from: 'port', to1: 'a buoy', to2: 'a lighthouse', letters: ['P', 'B', 'L'] },
  { who: 'A plane', go: 'flies', verb: 'flies', from: 'airport', to1: 'a beacon', to2: 'a town', letters: ['A', 'B', 'T'] },
  { who: 'A hiker', go: 'walks', verb: 'walks', from: 'camp', to1: 'a bridge', to2: 'a hut', letters: ['C', 'B', 'H'] },
  { who: 'A drone', go: 'flies', verb: 'flies', from: 'base', to1: 'a mast', to2: 'a farm', letters: ['D', 'M', 'F'] },
];
const brg = (n) => String(n).padStart(3, '0');
const brg1 = (n) => dp1(n).padStart(5, '0');

// Two legs on given bearings; find the distance back to the start, or its
// bearing. The turn is never near a right angle (that is SOHCAHTOA).
function bearings() {
  const ask = _.sample(['distance', 'bearing']);
  for (;;) {
    const c = _.sample(CONTEXTS);
    const [S, T, E] = c.letters;
    const b1 = _.random(10, 350);
    const d = _.random(30, 150);
    if (Math.abs(d - 90) < 10) continue;
    const clockwise = _.sample([true, false]);
    const b2 = ((clockwise ? b1 + d : b1 - d) + 360) % 360;
    if (b2 === 0) continue;
    const l1 = _.random(5, 30), l2 = _.random(5, 30);
    const T_ = 180 - d;
    const dist = Math.sqrt(l1 * l1 + l2 * l2 - 2 * l1 * l2 * cos(T_));
    const alpha = asin((l2 * sin(T_)) / dist);
    // The angle at the start must be acute for the sine rule to find it:
    // it is opposite the second leg, so that leg must not be the longest.
    if (l2 * l2 >= l1 * l1 + dist * dist || alpha < 8 || alpha > 80) continue;
    let bearing = clockwise ? b1 + alpha : b1 - alpha;
    let wrap = '';
    if (bearing >= 360) { bearing -= 360; wrap = ' - 360^\\circ'; }
    if (bearing < 0) { bearing += 360; wrap = ' + 360^\\circ'; }
    if (Number(dp1(bearing)) >= 360 || Number(dp1(bearing)) === 0) continue;

    // The turn, from the two bearings.
    let turn;
    if (clockwise) turn = b2 > b1 ? `${deg(brg(b2))} - ${deg(brg(b1))}` : `${deg(brg(b2))} + 360^\\circ - ${deg(brg(b1))}`;
    else turn = b1 > b2 ? `${deg(brg(b1))} - ${deg(brg(b2))}` : `${deg(brg(b1))} + 360^\\circ - ${deg(brg(b2))}`;
    const atT = `\\angle ${S}${T}${E}`;
    const atS = `\\angle ${T}${S}${E}`;
    const SE = `${S}${E}`;
    const steps = [
      `${turn} = ${deg(d)}`,
      `${atT} = 180^\\circ - ${deg(d)} = ${deg(T_)}`,
      `${SE}^2 = ${l1}^2 + ${l2}^2 - 2 \\times ${l1} \\times ${l2} \\times \\cos(${atT})`,
    ];
    let answer, answerUnits, instruction;
    if (ask === 'distance') {
      steps.push(`${SE} = ${sig3(dist)} \\text{ (3 s.f.)}`);
      answer = sig3(dist);
      answerUnits = '\\text{km}';
      instruction = `Find the distance ${SE}. Give your answer to 3 significant figures.`;
    } else {
      steps.push(
        `${SE} = ${trunc4(dist)}\\ldots`,
        `\\frac{\\sin(${atS})}{${l2}} = \\frac{\\sin(${atT})}{${SE}}`,
        `${atS} = ${trunc4(alpha)}\\ldots`,
        `${deg(brg(b1))} ${clockwise ? '+' : '-'} ${atS}${wrap} = ${deg(brg1(bearing))} \\text{ (1 d.p.)}`,
      );
      answer = deg(brg1(bearing));
      instruction = `Find the bearing of ${E} from ${S}. Give your answer to 1 decimal place.`;
    }
    return {
      instruction,
      questionText: `${c.who} ${c.go} ${l1} km on a bearing of ${brg(b1)}° from ${c.from} ${S} to ${c.to1} ${T}. It then ${c.verb} ${l2} km on a bearing of ${brg(b2)}° to ${c.to2} ${E}.`,
      answer,
      ...(answerUnits ? { answerUnits } : {}),
      workingOut: steps.join(NL),
    };
  }
}

// Two triangles, ABD then BCD, sharing the diagonal BD (two-triangles in
// Figure.jsx). Three plans, each one rule per triangle:
//   cos-sin   SAS in ABD for BD; two angles in BCD, find a side
//   sin-cos   two angles and a side in ABD for BD; SAS in BCD for CD
//   cos-angle SAS in ABD for BD; BC and angle C, find angle CDB
// Each triangle's angles must rank as drawn: A > ADB > ABD and
// CBD > C > CDB, all acute and at least 3° apart.
// At least 3° apart, so the order shows.
const ranked = (big, mid, small) => big - mid >= 3 && mid - small >= 3 && big < 88 && small >= 22;

function compound() {
  const plan = _.sample(['cos-sin', 'sin-cos', 'cos-angle']);
  for (;;) {
    const g = {};
    if (plan === 'sin-cos') {
      g.A = _.random(55, 87); g.ADB = _.random(40, 75);
      g.ABD = 180 - g.A - g.ADB;
      g.AB = _.random(5, 15);
      g.BD = (g.AB * sin(g.A)) / sin(g.ADB);
      g.DA = (g.AB * sin(g.ABD)) / sin(g.ADB);
    } else {
      g.AB = _.random(5, 15); g.DA = _.random(5, 15); g.A = _.random(55, 87);
      g.BD = Math.sqrt(g.AB ** 2 + g.DA ** 2 - 2 * g.AB * g.DA * cos(g.A));
      g.ABD = acos((g.AB ** 2 + g.BD ** 2 - g.DA ** 2) / (2 * g.AB * g.BD));
      g.ADB = 180 - g.A - g.ABD;
    }
    if (!ranked(g.A, g.ADB, g.ABD)) continue;

    if (plan === 'cos-sin') {
      g.CBD = _.random(55, 87); g.C = _.random(40, 80);
      g.CDB = 180 - g.CBD - g.C;
      g.CD = (g.BD * sin(g.CBD)) / sin(g.C);
      g.BC = (g.BD * sin(g.CDB)) / sin(g.C);
    } else if (plan === 'sin-cos') {
      g.BC = _.random(5, 15); g.CBD = _.random(55, 87);
      g.CD = Math.sqrt(g.BD ** 2 + g.BC ** 2 - 2 * g.BD * g.BC * cos(g.CBD));
      g.C = acos((g.BC ** 2 + g.CD ** 2 - g.BD ** 2) / (2 * g.BC * g.CD));
      g.CDB = 180 - g.CBD - g.C;
    } else {
      g.BC = _.random(4, 15); g.C = _.random(40, 80);
      const r = (g.BC * sin(g.C)) / g.BD;
      if (r >= 1) continue;
      g.CDB = asin(r);
      g.CBD = 180 - g.C - g.CDB;
      g.CD = (g.BD * sin(g.CBD)) / sin(g.C);
    }
    if (!ranked(g.CBD, g.C, g.CDB)) continue;

    const L = [..._.sample(QUADS)];
    const at = { A: L[0], B: L[1], C: L[2], D: L[3] };
    const side = (k) => at[k[0]] + at[k[1]];
    const ang = (k) => at[k[0]] + at[k[1]] + at[k[2]];
    const BD = side('BD');
    const sides = {}, angles = {};
    const steps = [];
    let unknown, answer, answerUnits, instruction;

    if (plan === 'sin-cos') {
      sides.AB = cm(g.AB); angles.A = deg(g.A); angles.ADB = deg(g.ADB);
      steps.push(
        `\\frac{${BD}}{\\sin(${deg(g.A)})} = \\frac{${g.AB}}{\\sin(${deg(g.ADB)})}`,
        `${BD} = ${trunc4(g.BD)}\\ldots`,
      );
    } else {
      sides.AB = cm(g.AB); sides.DA = cm(g.DA); angles.A = deg(g.A);
      steps.push(
        `${BD}^2 = ${g.AB}^2 + ${g.DA}^2 - 2 \\times ${g.AB} \\times ${g.DA} \\times \\cos(${deg(g.A)})`,
        `${BD} = ${trunc4(g.BD)}\\ldots`,
      );
    }

    if (plan === 'cos-sin') {
      angles.CBD = deg(g.CBD); angles.C = deg(g.C);
      const target = _.sample(['CD', 'BC']);
      if (target === 'CD') {
        steps.push(`\\frac{x}{\\sin(${deg(g.CBD)})} = \\frac{${BD}}{\\sin(${deg(g.C)})}`);
        steps.push(`x = \\frac{${BD} \\times \\sin(${deg(g.CBD)})}{\\sin(${deg(g.C)})}`);
      } else {
        steps.push(`\\angle ${ang('CDB')} = 180^\\circ - ${deg(g.CBD)} - ${deg(g.C)} = ${deg(g.CDB)}`);
        steps.push(`\\frac{x}{\\sin(\\angle ${ang('CDB')})} = \\frac{${BD}}{\\sin(${deg(g.C)})}`);
      }
      sides[target] = 'x'; unknown = { side: target };
      const x = g[target];
      steps.push(`x = ${sig3(x)} \\text{ (3 s.f.)}`);
      answer = `x = ${sig3(x)}`; answerUnits = '\\text{cm}'; instruction = SIDE;
    } else if (plan === 'sin-cos') {
      sides.BC = cm(g.BC); angles.CBD = deg(g.CBD); sides.CD = 'x'; unknown = { side: 'CD' };
      steps.push(
        `x^2 = ${BD}^2 + ${g.BC}^2 - 2 \\times ${BD} \\times ${g.BC} \\times \\cos(${deg(g.CBD)})`,
        `x = ${sig3(g.CD)} \\text{ (3 s.f.)}`,
      );
      answer = `x = ${sig3(g.CD)}`; answerUnits = '\\text{cm}'; instruction = SIDE;
    } else {
      sides.BC = cm(g.BC); angles.C = deg(g.C); angles.CDB = 'x'; unknown = { angle: 'CDB' };
      steps.push(
        `\\frac{\\sin(x)}{${g.BC}} = \\frac{\\sin(${deg(g.C)})}{${BD}}`,
        `x = ${deg(dp1(g.CDB))} \\text{ (1 d.p.)}`,
      );
      answer = `x = ${deg(dp1(g.CDB))}`; instruction = ANGLE;
    }

    return {
      instruction,
      answer,
      ...(answerUnits ? { answerUnits } : {}),
      workingOut: steps.join(NL),
      visualization: {
        type: 'two-triangles', big: true, mirror: _.sample([true, false]),
        vertices: L, sides, angles, unknown,
      },
    };
  }
}
