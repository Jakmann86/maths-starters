// src/generators/geometry/similarityGenerators.js
//
// Haese 18A, 18B and 18D, with Rayner 7.4 (Exercises 7.8-7.12): similar
// shapes, similar triangles, and the areas and volumes of similar shapes.
// The topic is "Similarity". Haese 18C (problem solving: shadows, ramps) is
// left out, as the scheme marks it.
//
// Every length is built from a scale factor k = p/q and a small shape whose
// sides are multiples of q, so every answer is exact: a whole number or a
// half. Scale factors are 2, 3, 4 at Foundation and fractions such as 3/2,
// 5/2, 4/3 above it.
//
// Figures are schematic (CLAUDE.md 7): similar-pair draws one outline for
// both shapes, so the generator keeps each shape's labelled sides ranked as
// that outline ranks them (triangle: side 1 longest, then 0, then 2;
// rectangle: width longer).

import _ from 'lodash';

const NL = '\n';
const cm = (n) => `${fmt(n)} cm`;
// Exact values only: whole numbers, or a half or quarter as a decimal.
const fmt = (n) => String(Math.round(n * 1000) / 1000);
const frac = (p, q) => (q === 1 ? `${p}` : `\\frac{${p}}{${q}}`);

const K_WHOLE = [[2, 1], [3, 1], [4, 1]];
const K_FRAC = [[3, 2], [5, 2], [4, 3], [5, 3], [5, 4], [7, 2], [2, 1], [3, 1]];

// Triangle sides on the similar-pair outline: s1 > s0 > s2, a real triangle.
function triangleSides(unit, lo = 2, hi = 12) {
  for (;;) {
    const s = [_.random(lo, hi), _.random(lo, hi), _.random(lo, hi)].map((v) => v * unit);
    if (!(s[1] > s[0] && s[0] > s[2])) continue;
    if (s[0] + s[2] <= s[1]) continue;
    return s;
  }
}

const TRI_NAMES = ['ABC', 'PQR', 'XYZ', 'KLM', 'DEF', 'LMN', 'RST'];

/* ----------------------------------------------------- similar shapes */
//   Foundation  side by side, whole-number scale factor, x on the larger
//   Core        a fractional scale factor, x on either shape, the second
//               shape turned round so sides match by their angles
//   Stretch     no figure: triangles named in an order that is not the
//               obvious one ("ABC is similar to QRP"), so the matching comes
//               from the letters alone; or rectangles named the same way
export const generateSimilarShapes = (options = {}) => {
  const { difficulty = 'core' } = options;
  const q = difficulty === 'stretch' ? namedSimilar() : pairQuestion(difficulty);
  return { ...q, metadata: { topic: 'similar-shapes', difficulty } };
};

function pairQuestion(difficulty) {
  const triangle = Math.random() < 0.6;
  const [p, qd] = _.sample(difficulty === 'foundation' ? K_WHOLE : K_FRAC);
  const k = p / qd;
  const small = triangle ? triangleSides(qd) : rectSides(qd);
  const large = small.map((s) => s * k);
  const n = small.length;
  // One matching pair given on both; a second side on one shape, x on the other.
  const [given, asked] = _.sampleSize(_.range(n), 2);
  const xOnLarge = difficulty === 'foundation' ? true : Math.random() < 0.5;
  const sl = Array(n).fill(null), ll = Array(n).fill(null);
  sl[given] = cm(small[given]); ll[given] = cm(large[given]);
  if (xOnLarge) { sl[asked] = cm(small[asked]); ll[asked] = 'x'; } else { ll[asked] = cm(large[asked]); sl[asked] = 'x'; }
  const x = xOnLarge ? large[asked] : small[asked];
  // The larger shape is drawn larger, left or right at random; k < 1 reads
  // the other way round.
  const largeFirst = Math.random() < 0.5;
  const turn = difficulty === 'foundation' ? 'none' : triangle ? _.sample(['rotate', 'flip']) : 'quarter';
  const left = largeFirst ? { sides: ll, big: true } : { sides: sl };
  const right = largeFirst ? { sides: sl } : { sides: ll, big: true };
  const ratio = xOnLarge
    ? `x = ${fmt(small[asked])} \\times ${frac(fmt(large[given]), fmt(small[given]))}`
    : `x = ${fmt(large[asked])} \\times ${frac(fmt(small[given]), fmt(large[given]))}`;
  return {
    instruction: `The ${triangle ? 'triangles' : 'rectangles'} are similar. Find x.`,
    answer: `x = ${fmt(x)}`,
    answerUnits: '\\text{cm}',
    workingOut: [`k = ${frac(fmt(large[given]), fmt(small[given]))}`, ratio, `x = ${fmt(x)}`].join(NL),
    visualization: {
      type: 'similar-pair', big: true, shape: triangle ? 'triangle' : 'rectangle',
      left, right, turn,
      unknown: { side: (xOnLarge === largeFirst) ? 'left' : 'right', index: asked },
    },
  };
}

function rectSides(unit) {
  for (;;) {
    const w = _.random(3, 12) * unit, h = _.random(2, 10) * unit;
    if (w > h && w < 3 * h) return [w, h];
  }
}

// "Triangle ABC is similar to triangle QRP": A matches Q, B matches R, C
// matches P. The second triangle's letters are a shuffle of PQR, so the
// side names do not line up by position in the alphabet.
function namedSimilar() {
  const [p, qd] = _.sample(K_FRAC);
  const k = p / qd;
  if (Math.random() < 0.65) {
    let n1, n2;
    do { [n1, n2] = _.sampleSize(TRI_NAMES, 2); } while ([...n1].some((c) => n2.includes(c)));
    const first = [...n1];
    let second;
    do { second = _.shuffle([...n2]); } while (second.join('') === n2);
    const small = triangleSides(qd);
    const big = small.map((s) => s * k);
    // Side i is opposite vertex i.
    const side = (letters, i) => letters.filter((_c, j) => j !== i).join('');
    const [g, a] = _.sampleSize([0, 1, 2], 2);
    const askOnSecond = Math.random() < 0.5;
    const given = [
      `${side(first, g)} = ${fmt(small[g])}\u00a0cm`,
      `${side(second, g)} = ${fmt(big[g])}\u00a0cm`,
      askOnSecond ? `${side(first, a)} = ${fmt(small[a])}\u00a0cm` : `${side(second, a)} = ${fmt(big[a])}\u00a0cm`,
    ];
    const target = askOnSecond ? side(second, a) : side(first, a);
    const value = askOnSecond ? big[a] : small[a];
    return {
      instruction: `Triangle ${first.join('')} is similar to triangle ${second.join('')}. ${given[0]}, ${given[1]} and ${given[2]}.`,
      questionText: `Find ${target}.`,
      answer: `${target} = ${fmt(value)}`,
      answerUnits: '\\text{cm}',
      workingOut: [`k = ${frac(fmt(big[g]), fmt(small[g]))}`, `${target} = ${fmt(value)}`].join(NL),
    };
  }
  // Rectangles ABCD and a relabelled one, matched by order round the shape.
  const n1 = _.sample(['ABCD', 'PQRS', 'WXYZ', 'EFGH', 'KLMN']);
  let n2;
  do { n2 = _.sample(['ABCD', 'PQRS', 'WXYZ', 'EFGH', 'KLMN']); } while (n2 === n1);
  const shift = _.random(1, 3);
  const second = [...n2.slice(shift), ...n2.slice(0, shift)];   // FGHE from EFGH
  const [w, h] = rectSides(qd);
  const smallSide = [w, h, w, h], bigSide = smallSide.map((s) => s * k);
  const edge = (letters, i) => letters[i] + letters[(i + 1) % 4];
  const [g, a] = _.random(0, 1) ? [0, 1] : [1, 0];
  const askOnSecond = Math.random() < 0.5;
  const given = [
    `${edge([...n1], g)} = ${fmt(smallSide[g])}\u00a0cm`,
    `${edge(second, g)} = ${fmt(bigSide[g])}\u00a0cm`,
    askOnSecond ? `${edge([...n1], a)} = ${fmt(smallSide[a])}\u00a0cm` : `${edge(second, a)} = ${fmt(bigSide[a])}\u00a0cm`,
  ];
  const target = askOnSecond ? edge(second, a) : edge([...n1], a);
  const value = askOnSecond ? bigSide[a] : smallSide[a];
  return {
    instruction: `Rectangles ${n1} and ${second.join('')} are similar. ${given[0]}, ${given[1]} and ${given[2]}.`,
    questionText: `Find ${target}.`,
    answer: `${target} = ${fmt(value)}`,
    answerUnits: '\\text{cm}',
    workingOut: [`k = ${frac(fmt(bigSide[g]), fmt(smallSide[g]))}`, `${target} = ${fmt(value)}`].join(NL),
  };
}

/* --------------------------------------------------- similar triangles */
//   Foundation  the A shape, whole sides given: AD and AB, DE, find BC (or
//               the reverse)
//   Core        the A shape with the parts AD and DB given, so AB comes
//               first (Haese Example 3); or the X shape
//   Stretch     x is a part of a side, so subtract at the end; or the X
//               shape with the whole line AD given (in the question)
export const generateSimilarTriangles = (options = {}) => {
  const { difficulty = 'core' } = options;
  let q;
  if (difficulty === 'foundation') q = aShape('whole');
  else if (difficulty === 'core') q = Math.random() < 0.5 ? aShape('parts') : xShape(false);
  else q = Math.random() < 0.6 ? aShape('find part') : xShape(true);
  return { ...q, metadata: { topic: 'similar-triangles', difficulty } };
};

const FIVE = ['ABCDE', 'PQRST', 'KLMNO', 'VWXYZ', 'FGHIJ'];

// The A shape: triangle ADE inside ABC, DE parallel to BC, AB = k AD.
function aShape(mode) {
  const [p, qd] = _.sample(mode === 'whole' ? K_WHOLE : K_FRAC.filter(([a, b]) => a / b >= 1.25));
  const k = p / qd;
  const AD = _.random(2, 10) * qd, AE = _.random(2, 10) * qd, DE = _.random(2, 12) * qd;
  const v = { AD, AE, DE, AB: AD * k, AC: AE * k, BC: DE * k, DB: AD * (k - 1), EC: AE * (k - 1) };
  const L = [...(_.sample(FIVE))];
  const name = (seg) => seg.split('').map((c) => L['ABCDE'.indexOf(c)]).join('');
  const labels = {};
  let unknown, steps;
  // Which side of the triangle carries the ratio: AB (through D) or AC
  // (through E). The parallel pair DE, BC is the other.
  const side = Math.random() < 0.5 ? ['AD', 'DB', 'AB'] : ['AE', 'EC', 'AC'];
  const [sm, part, whole] = side;
  if (mode === 'whole') {
    labels[sm] = cm(v[sm]); labels[whole] = cm(v[whole]);
    if (Math.random() < 0.5) { labels.DE = cm(v.DE); labels.BC = 'x'; unknown = 'BC'; } else { labels.BC = cm(v.BC); labels.DE = 'x'; unknown = 'DE'; }
    steps = [`k = ${frac(fmt(v[whole]), fmt(v[sm]))}`];
  } else if (mode === 'parts') {
    labels[sm] = cm(v[sm]); labels[part] = cm(v[part]);
    if (Math.random() < 0.5) { labels.DE = cm(v.DE); labels.BC = 'x'; unknown = 'BC'; } else { labels.BC = cm(v.BC); labels.DE = 'x'; unknown = 'DE'; }
    steps = [`${name(whole)} = ${fmt(v[sm])} + ${fmt(v[part])} = ${fmt(v[whole])}`, `k = ${frac(fmt(v[whole]), fmt(v[sm]))}`];
  } else {
    // x is the part. Either the parallel pair gives k, or the other side's
    // parts do.
    unknown = part;
    labels[sm] = cm(v[sm]); labels[part] = 'x';
    const other = side[0] === 'AD' ? ['AE', 'EC', 'AC'] : ['AD', 'DB', 'AB'];
    if (Math.random() < 0.5) {
      labels.DE = cm(v.DE); labels.BC = cm(v.BC);
      steps = [`k = ${frac(fmt(v.BC), fmt(v.DE))}`, `${name(whole)} = ${fmt(v[sm])} \\times ${frac(fmt(v.BC), fmt(v.DE))} = ${fmt(v[whole])}`];
    } else {
      labels[other[0]] = cm(v[other[0]]); labels[other[1]] = cm(v[other[1]]);
      steps = [`${name(other[2])} = ${fmt(v[other[0]])} + ${fmt(v[other[1]])} = ${fmt(v[other[2]])}`, `${name(whole)} = ${fmt(v[sm])} \\times ${frac(fmt(v[other[2]]), fmt(v[other[0]]))} = ${fmt(v[whole])}`];
    }
    steps.push(`x = ${fmt(v[whole])} - ${fmt(v[sm])}`);
  }
  if (mode !== 'find part') steps.push(`x = ${fmt(v[unknown])}`);
  else steps.push(`x = ${fmt(v[unknown])}`);
  return {
    instruction: `${name('DE')} is parallel to ${name('BC')}. Find x.`,
    answer: `x = ${fmt(v[unknown])}`,
    answerUnits: '\\text{cm}',
    workingOut: steps.join(NL),
    visualization: { type: 'similar-triangles', kind: 'A', big: true, mirror: _.sample([true, false]), vertices: L, labels, unknown },
  };
}

// The X shape: AD and BE cross at C, AB parallel to ED; triangle CAB
// enlarged by k about C gives CDE, so CD = k AC, CE = k BC, DE = k AB.
function xShape(wholeLine) {
  const [p, qd] = _.sample(K_FRAC.filter(([a, b]) => a / b >= 1.25));
  const k = p / qd;
  const AC = _.random(2, 10) * qd, BC = _.random(2, 10) * qd, AB = _.random(2, 10) * qd;
  const v = { AC, BC, AB, CD: AC * k, CE: BC * k, DE: AB * k, AD: AC * (1 + k) };
  const L = [...(_.sample(FIVE))];
  const name = (seg) => seg.split('').map((c) => L['ABCDE'.indexOf(c)]).join('');
  const labels = {};
  let unknown, steps, questionMath;
  const pairs = [['AC', 'CD'], ['BC', 'CE'], ['AB', 'DE']];
  if (!wholeLine) {
    const [g, a] = _.sampleSize(pairs, 2);
    labels[g[0]] = cm(v[g[0]]); labels[g[1]] = cm(v[g[1]]);
    const onBig = Math.random() < 0.5;
    labels[a[0]] = onBig ? cm(v[a[0]]) : 'x';
    labels[a[1]] = onBig ? 'x' : cm(v[a[1]]);
    unknown = onBig ? a[1] : a[0];
    steps = [`k = ${frac(fmt(v[g[1]]), fmt(v[g[0]]))}`, `x = ${fmt(v[unknown])}`];
  } else {
    // AD is given whole; AB and DE give k; x is AC or CD.
    labels.AB = cm(v.AB); labels.DE = cm(v.DE);
    unknown = _.sample(['AC', 'CD']);
    labels[unknown] = 'x';
    questionMath = `${name('AD')} = ${fmt(v.AD)}\\text{ cm}`;
    steps = [
      `k = ${frac(fmt(v.DE), fmt(v.AB))}`,
      `${name('AC')} + ${name('CD')} = ${fmt(v.AD)}`,
      `x = ${fmt(v[unknown])}`,
    ];
  }
  return {
    instruction: `${name('AB')} is parallel to ${name('ED')}. Find x.`,
    ...(questionMath ? { questionMath, questionMathCompact: true } : {}),
    answer: `x = ${fmt(v[unknown])}`,
    answerUnits: '\\text{cm}',
    workingOut: steps.join(NL),
    visualization: { type: 'similar-triangles', kind: 'X', big: true, mirror: _.sample([true, false]), vertices: L, labels, unknown },
  };
}

/* ------------------------------------- areas and volumes of similar shapes */
//   Foundation  k from a matching pair of sides, the area of one shape
//               given, find the other's (k squared; Haese Example 7)
//   Core        both areas given, find a length (k is a square root); or
//               similar solids, lengths given, a volume (k cubed)
//   Stretch     surface areas given, find a volume (Haese 18D Q7-8); or the
//               trapezium left when the small triangle is cut from the A
//               shape (Haese 18D Q3)
export const generateSimilarAreasVolumes = (options = {}) => {
  const { difficulty = 'core' } = options;
  let q;
  if (difficulty === 'foundation') q = areaFromSides();
  else if (difficulty === 'core') q = Math.random() < 0.5 ? lengthFromAreas() : volumeFromLengths();
  else q = Math.random() < 0.55 ? volumeFromAreas() : trapeziumArea();
  return { ...q, metadata: { topic: 'similar-areas-volumes', difficulty } };
};

const K_AREA = [[2, 1], [3, 1], [3, 2], [5, 2], [4, 3], [5, 3]];
const sq = (n) => n * n;
const area = (v) => `Area = ${fmt(v)} cm²`;

function areaFromSides() {
  const triangle = Math.random() < 0.6;
  const [p, qd] = _.sample(K_AREA);
  const k = p / qd;
  const index = triangle ? _.random(0, 2) : _.random(0, 1);
  const small = _.random(2, 8) * qd;
  const A = _.random(2, 12) * sq(qd);
  const big = small * k, B = A * k * k;
  const askBig = Math.random() < 0.6;
  const sides = (len) => { const s = Array(triangle ? 3 : 2).fill(null); s[index] = cm(len); return s; };
  const sm = { sides: sides(small), area: askBig ? area(A) : 'Area = A' };
  const lg = { sides: sides(big), area: askBig ? 'Area = A' : area(B), big: true };
  const largeFirst = Math.random() < 0.5;
  return {
    instruction: `The ${triangle ? 'triangles' : 'rectangles'} are similar. Find the area A.`,
    answer: `A = ${fmt(askBig ? B : A)}`,
    answerUnits: '\\text{cm}^2',
    workingOut: [
      `k = ${frac(fmt(big), fmt(small))}`,
      askBig ? `A = ${fmt(A)} \\times (${frac(fmt(big), fmt(small))})^2 = ${fmt(B)}` : `A = ${fmt(B)} \\times (${frac(fmt(small), fmt(big))})^2 = ${fmt(A)}`,
    ].join(NL),
    visualization: {
      type: 'similar-pair', big: true, shape: triangle ? 'triangle' : 'rectangle',
      left: largeFirst ? lg : sm, right: largeFirst ? sm : lg,
      turn: triangle ? _.sample(['none', 'flip']) : 'none',
      unknown: { area: (askBig === largeFirst) ? 'left' : 'right' },
    },
  };
}

function lengthFromAreas() {
  const triangle = Math.random() < 0.6;
  const [p, qd] = _.sample(K_AREA);
  const k = p / qd;
  const index = triangle ? _.random(0, 2) : _.random(0, 1);
  const small = _.random(2, 8) * qd, A = _.random(2, 12) * sq(qd);
  const big = small * k, B = A * k * k;
  const xBig = Math.random() < 0.5;
  const sides = (text) => { const s = Array(triangle ? 3 : 2).fill(null); s[index] = text; return s; };
  const sm = { sides: sides(xBig ? cm(small) : 'x'), area: area(A) };
  const lg = { sides: sides(xBig ? 'x' : cm(big)), area: area(B), big: true };
  const largeFirst = Math.random() < 0.5;
  return {
    instruction: `The ${triangle ? 'triangles' : 'rectangles'} are similar. Find x.`,
    answer: `x = ${fmt(xBig ? big : small)}`,
    answerUnits: '\\text{cm}',
    workingOut: [`k^2 = ${frac(fmt(B), fmt(A))}`, `k = ${frac(p, qd)}`, `x = ${fmt(xBig ? big : small)}`].join(NL),
    visualization: {
      type: 'similar-pair', big: true, shape: triangle ? 'triangle' : 'rectangle',
      left: largeFirst ? lg : sm, right: largeFirst ? sm : lg,
      turn: triangle ? _.sample(['none', 'flip']) : 'none',
      unknown: { side: (xBig === largeFirst) ? 'left' : 'right', index },
    },
  };
}

const SOLIDS = { cylinder: 'cylinders', cuboid: 'cuboids', cone: 'cones' };
const vol = (v) => `V = ${fmt(v)} cm³`;
const surf = (v) => `S = ${fmt(v)} cm²`;

function volumeFromLengths() {
  const solid = _.sample(Object.keys(SOLIDS));
  const [p, qd] = _.sample([[2, 1], [3, 1], [3, 2], [5, 2], [4, 3]]);
  const k = p / qd;
  const h = _.random(2, 6) * qd, V = _.random(2, 12) * qd ** 3;
  const H = h * k, W = V * k ** 3;
  const askBig = Math.random() < 0.6;
  const sm = { length: cm(h), value: askBig ? vol(V) : 'V = x' };
  const lg = { length: cm(H), value: askBig ? 'V = x' : vol(W), big: true };
  const largeFirst = Math.random() < 0.4;
  return {
    instruction: `The ${SOLIDS[solid]} are similar. Find the volume x.`,
    answer: `x = ${fmt(askBig ? W : V)}`,
    answerUnits: '\\text{cm}^3',
    workingOut: [
      `k = ${frac(fmt(H), fmt(h))}`,
      askBig ? `x = ${fmt(V)} \\times (${frac(fmt(H), fmt(h))})^3 = ${fmt(W)}` : `x = ${fmt(W)} \\times (${frac(fmt(h), fmt(H))})^3 = ${fmt(V)}`,
    ].join(NL),
    visualization: {
      type: 'similar-solids', big: true, solid,
      left: largeFirst ? lg : sm, right: largeFirst ? sm : lg,
      unknown: (askBig === largeFirst) ? 'left' : 'right',
    },
  };
}

function volumeFromAreas() {
  const solid = _.sample(Object.keys(SOLIDS));
  const [p, qd] = _.sample([[2, 1], [3, 1], [3, 2], [5, 2], [4, 3]]);
  const k = p / qd;
  const S = _.random(2, 12) * qd ** 2, V = _.random(2, 10) * qd ** 3;
  const T = S * k * k, W = V * k ** 3;
  const askBig = Math.random() < 0.6;
  const sm = { value: askBig ? `${surf(S)}, ${vol(V)}` : `${surf(S)}, V = x` };
  const lg = { value: askBig ? `${surf(T)}, V = x` : `${surf(T)}, ${vol(W)}`, big: true };
  const largeFirst = Math.random() < 0.4;
  return {
    instruction: `The ${SOLIDS[solid]} are similar. S is the surface area. Find the volume x.`,
    answer: `x = ${fmt(askBig ? W : V)}`,
    answerUnits: '\\text{cm}^3',
    workingOut: [
      `k^2 = ${frac(fmt(T), fmt(S))}`,
      `k = ${frac(p, qd)}`,
      askBig ? `x = ${fmt(V)} \\times (${frac(p, qd)})^3 = ${fmt(W)}` : `x = ${fmt(W)} \\times (${frac(qd, p)})^3 = ${fmt(V)}`,
    ].join(NL),
    visualization: {
      type: 'similar-solids', big: true, solid,
      left: largeFirst ? lg : sm, right: largeFirst ? sm : lg,
      unknown: (askBig === largeFirst) ? 'left' : 'right',
    },
  };
}

// The A shape with the area of the small triangle given: the area of the
// trapezium DBCE is (k^2 - 1) times it.
function trapeziumArea() {
  const [p, qd] = _.sample([[2, 1], [3, 1], [3, 2], [5, 2], [5, 3], [4, 3]]);
  const k = p / qd;
  const AD = _.random(2, 8) * qd;
  const small = _.random(2, 12) * qd * qd;
  const big = small * k * k, trap = big - small;
  const L = [...(_.sample(FIVE))];
  const name = (seg) => seg.split('').map((c) => L['ABCDE'.indexOf(c)]).join('');
  const side = Math.random() < 0.5 ? ['AD', 'DB'] : ['AE', 'EC'];
  const labels = { [side[0]]: cm(AD), [side[1]]: cm(AD * (k - 1)) };
  return {
    instruction: `${name('DE')} is parallel to ${name('BC')}. Find the area of ${name('DBCE')}.`,
    questionMath: `\\text{Area of triangle } ${name('ADE')} = ${fmt(small)}\\text{ cm}^2`,
    questionMathCompact: true,
    answer: fmt(trap),
    answerUnits: '\\text{cm}^2',
    workingOut: [
      `k = ${frac(fmt(AD * k), fmt(AD))}`,
      `\\text{Area of } ${name('ABC')} = ${fmt(small)} \\times (${frac(fmt(AD * k), fmt(AD))})^2 = ${fmt(big)}`,
      `${fmt(big)} - ${fmt(small)} = ${fmt(trap)}`,
    ].join(NL),
    visualization: { type: 'similar-triangles', kind: 'A', big: true, mirror: _.sample([true, false]), vertices: L, labels, unknown: null },
  };
}
