import _ from 'lodash';

const NL = '\n';
const UNITS = ['cm', 'm', 'mm'];
const pick = () => _.sample(UNITS);
const lbl = (n, u) => `${n} ${u}`;

// TODO: this duplicates solidsGenerators.js's own TRIPLES/triple (with a
// wider cap here). Three generators now want Pythagorean triples, which is
// the point at which it should move to a shared
// src/generators/core/helpers.js alongside NL, UNITS, pick and lbl — flagged
// rather than done here, see the commit note.
const TRIPLES = (() => {
  const out = [];
  for (let m = 2; m <= 13; m++) {
    for (let n = 1; n < m; n++) {
      for (let k = 1; k <= 12; k++) {
        const a = (m * m - n * n) * k;
        const b = 2 * m * n * k;
        const c = (m * m + n * n) * k;
        if (a >= 3 && b >= 3 && a <= 80 && b <= 80 && c <= 100) out.push([a, b, c]);
      }
    }
  }
  return out;
})();
const triple = () => {
  const [a, b, c] = _.sample(TRIPLES);
  return _.random(0, 1) ? [a, b, c] : [b, a, c];
};

/* ----------------------------------------------------------------- rectangle */

export const generateAreaRectangle = (options = {}) => {
  const { difficulty = 'core' } = options;
  const u = pick();

  if (difficulty === 'core') {
    // The diagonal is given as well, and is not needed (Rayner 4.1 Q6).
    // A triple keeps it a whole number so it reads as real data rather than
    // as something obviously ignorable.
    const [l, w, d] = triple();
    return {
      instruction: 'Find the area of the rectangle',
      answer: String(l * w),
      answerUnits: `\\text{${u}}^2`,
      workingOut: `A = l \\times w${NL}A = ${l} \\times ${w}${NL}A = ${l * w}${NL}\\text{the diagonal is not needed}`,
      visualization: { type: 'rectangle', l: lbl(l, u), w: lbl(w, u), diagonal: lbl(d, u) },
      metadata: { topic: 'area-rectangle', difficulty },
    };
  }

  if (difficulty === 'stretch') {
    // Area and one side given (Rayner 4.1 Q10). Constructed so the division
    // is exact.
    const l = _.random(2, 25);
    const w = _.random(2, 25);
    const A = l * w;
    const findL = _.random(0, 1) === 1;
    const fig = { type: 'rectangle', l: lbl(l, u), w: lbl(w, u), area: `${A} ${u}²`, unknown: findL ? 'l' : 'w' };
    fig[findL ? 'l' : 'w'] = 'x';
    return {
      instruction: 'Find the missing length',
      answer: `x = ${findL ? l : w}`,
      answerUnits: `\\text{${u}}`,
      workingOut: `l \\times w = ${A}${NL}x = ${A} \\div ${findL ? w : l}${NL}x = ${findL ? l : w}`,
      visualization: fig,
      metadata: { topic: 'area-rectangle', difficulty },
    };
  }

  const l = _.random(2, 25);
  const w = _.random(2, 25);
  return {
    instruction: 'Find the area of the rectangle',
    answer: String(l * w),
    answerUnits: `\\text{${u}}^2`,
    workingOut: `A = l \\times w${NL}A = ${l} \\times ${w}${NL}A = ${l * w}`,
    visualization: { type: 'rectangle', l: lbl(l, u), w: lbl(w, u) },
    metadata: { topic: 'area-rectangle', difficulty },
  };
};

/* ------------------------------------------------------------------ triangle */

export const generateAreaTriangle = (options = {}) => {
  const { difficulty = 'core' } = options;
  const u = pick();

  if (difficulty === 'stretch') {
    const b = _.random(2, 24);
    const h = _.random(2, 24);
    const A = (b * h) / 2;
    if (!Number.isInteger(A)) return generateAreaTriangle(options);
    return {
      instruction: 'Find the perpendicular height',
      answer: `x = ${h}`,
      answerUnits: `\\text{${u}}`,
      workingOut: `\\frac{1}{2} \\times b \\times h = ${A}${NL}\\frac{1}{2} \\times ${b} \\times x = ${A}${NL}x = ${2 * A} \\div ${b} = ${h}`,
      visualization: { type: 'triangle-area', b: lbl(b, u), h: 'x', area: `${A} ${u}²`, unknown: 'h' },
      metadata: { topic: 'area-triangle', difficulty },
    };
  }

  let b, h;
  do {
    b = _.random(2, 24);
    h = _.random(2, 24);
  } while ((b * h) % 2 !== 0);
  const A = (b * h) / 2;

  if (difficulty === 'core') {
    // A sloping side is given too. It is longer than the perpendicular
    // height, so it is a genuinely tempting wrong choice — this is the
    // selection skill Rayner 4.1 is built around, not a harder calculation.
    const slant = h + _.random(1, 12);
    return {
      instruction: 'Find the area of the triangle',
      answer: String(A),
      answerUnits: `\\text{${u}}^2`,
      workingOut: `A = \\frac{1}{2} \\times b \\times h${NL}A = \\frac{1}{2} \\times ${b} \\times ${h}${NL}A = ${A}${NL}\\text{the sloping side is not needed}`,
      visualization: { type: 'triangle-area', b: lbl(b, u), h: lbl(h, u), slant: lbl(slant, u) },
      metadata: { topic: 'area-triangle', difficulty },
    };
  }

  return {
    instruction: 'Find the area of the triangle',
    answer: String(A),
    answerUnits: `\\text{${u}}^2`,
    workingOut: `A = \\frac{1}{2} \\times b \\times h${NL}A = \\frac{1}{2} \\times ${b} \\times ${h}${NL}A = ${A}`,
    visualization: { type: 'triangle-area', b: lbl(b, u), h: lbl(h, u) },
    metadata: { topic: 'area-triangle', difficulty },
  };
};

/* ------------------------------------------------------------- parallelogram */

export const generateAreaParallelogram = (options = {}) => {
  const { difficulty = 'core' } = options;
  const u = pick();
  const b = _.random(2, 25);
  const h = _.random(2, 20);
  const A = b * h;

  if (difficulty === 'core') {
    const slant = h + _.random(1, 12);
    return {
      instruction: 'Find the area of the parallelogram',
      answer: String(A),
      answerUnits: `\\text{${u}}^2`,
      workingOut: `A = b \\times h${NL}A = ${b} \\times ${h}${NL}A = ${A}${NL}\\text{the sloping side is not needed}`,
      visualization: { type: 'parallelogram', b: lbl(b, u), h: lbl(h, u), slant: lbl(slant, u) },
      metadata: { topic: 'area-parallelogram', difficulty },
    };
  }

  if (difficulty === 'stretch') {
    return {
      instruction: 'Find the perpendicular height',
      answer: `x = ${h}`,
      answerUnits: `\\text{${u}}`,
      workingOut: `b \\times h = ${A}${NL}${b} \\times x = ${A}${NL}x = ${A} \\div ${b} = ${h}`,
      visualization: { type: 'parallelogram', b: lbl(b, u), h: 'x', area: `${A} ${u}²`, unknown: 'h' },
      metadata: { topic: 'area-parallelogram', difficulty },
    };
  }

  return {
    instruction: 'Find the area of the parallelogram',
    answer: String(A),
    answerUnits: `\\text{${u}}^2`,
    workingOut: `A = b \\times h${NL}A = ${b} \\times ${h}${NL}A = ${A}`,
    visualization: { type: 'parallelogram', b: lbl(b, u), h: lbl(h, u) },
    metadata: { topic: 'area-parallelogram', difficulty },
  };
};

/* ----------------------------------------------------------------- trapezium */

export const generateAreaTrapezium = (options = {}) => {
  const { difficulty = 'core' } = options;
  const u = pick();
  let a, b, h;
  do {
    a = _.random(2, 16);
    b = _.random(a + 1, a + 16);
    h = _.random(2, 18);
  } while (((a + b) * h) % 2 !== 0);
  const A = ((a + b) * h) / 2;

  if (difficulty === 'core') {
    const slant = h + _.random(1, 10);
    return {
      instruction: 'Find the area of the trapezium',
      answer: String(A),
      answerUnits: `\\text{${u}}^2`,
      workingOut: `A = \\frac{1}{2}(a + b) \\times h${NL}A = \\frac{1}{2}(${a} + ${b}) \\times ${h}${NL}A = ${A}${NL}\\text{the sloping side is not needed}`,
      visualization: { type: 'trapezium-area', a: lbl(a, u), b: lbl(b, u), h: lbl(h, u), slant: lbl(slant, u) },
      metadata: { topic: 'area-trapezium', difficulty },
    };
  }

  if (difficulty === 'stretch') {
    // Area, one parallel side and the height given; find the other parallel
    // side (Rayner 4.1 Q14).
    return {
      instruction: 'Find the length of the other parallel side',
      answer: `x = ${b}`,
      answerUnits: `\\text{${u}}`,
      workingOut: `\\frac{1}{2}(a + b) \\times h = ${A}${NL}(${a} + x) \\times ${h} = ${2 * A}${NL}${a} + x = ${(2 * A) / h}${NL}x = ${b}`,
      visualization: { type: 'trapezium-area', a: lbl(a, u), b: 'x', h: lbl(h, u), area: `${A} ${u}²`, unknown: 'b' },
      metadata: { topic: 'area-trapezium', difficulty },
    };
  }

  return {
    instruction: 'Find the area of the trapezium',
    answer: String(A),
    answerUnits: `\\text{${u}}^2`,
    workingOut: `A = \\frac{1}{2}(a + b) \\times h${NL}A = \\frac{1}{2}(${a} + ${b}) \\times ${h}${NL}A = ${A}`,
    visualization: { type: 'trapezium-area', a: lbl(a, u), b: lbl(b, u), h: lbl(h, u) },
    metadata: { topic: 'area-trapezium', difficulty },
  };
};

/* ---------------------------------------------------------------------- kite */

export const generateAreaKite = (options = {}) => {
  const { difficulty = 'core' } = options;
  const u = pick();

  if (difficulty === 'stretch') {
    // One diagonal a fixed amount longer than the other, area given
    // (Rayner 4.1 Q13). Numbers kept small: this is a quadratic in disguise
    // and is meant to take a minute, not five.
    const d = _.random(3, 15);
    const k = _.random(1, 8);
    const A = (d * (d + k)) / 2;
    if (!Number.isInteger(A)) return generateAreaKite(options);
    return {
      instruction: 'Find the length of the shorter diagonal',
      answer: `x = ${d}`,
      answerUnits: `\\text{${u}}`,
      workingOut: `\\frac{1}{2} \\times x \\times (x + ${k}) = ${A}${NL}x^2 + ${k}x = ${2 * A}${NL}x = ${d}`,
      visualization: { type: 'kite', d1: 'x', d2: `x + ${k}`, area: `${A} ${u}²`, unknown: 'd1' },
      metadata: { topic: 'area-kite', difficulty },
    };
  }

  let d1, d2;
  do {
    d1 = _.random(2, 24);
    d2 = _.random(2, 24);
  } while ((d1 * d2) % 2 !== 0);
  const A = (d1 * d2) / 2;

  if (difficulty === 'core') {
    // Area and one diagonal given (Rayner 4.1 Q12).
    return {
      instruction: 'Find the length of the other diagonal',
      answer: `x = ${d2}`,
      answerUnits: `\\text{${u}}`,
      workingOut: `\\frac{1}{2} \\times d_1 \\times d_2 = ${A}${NL}${d1} \\times x = ${2 * A}${NL}x = ${2 * A} \\div ${d1} = ${d2}`,
      visualization: { type: 'kite', d1: lbl(d1, u), d2: 'x', area: `${A} ${u}²`, unknown: 'd2' },
      metadata: { topic: 'area-kite', difficulty },
    };
  }

  return {
    instruction: 'Find the area of the kite',
    answer: String(A),
    answerUnits: `\\text{${u}}^2`,
    workingOut: `A = \\frac{1}{2} \\times d_1 \\times d_2${NL}A = \\frac{1}{2} \\times ${d1} \\times ${d2}${NL}A = ${A}`,
    visualization: { type: 'kite', d1: lbl(d1, u), d2: lbl(d2, u) },
    metadata: { topic: 'area-kite', difficulty },
  };
};
