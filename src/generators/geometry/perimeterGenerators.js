import _ from 'lodash';

const NL = '\n';
const UNITS = ['cm', 'm', 'mm'];
const pick = () => _.sample(UNITS);
const lbl = (n, u) => `${n} ${u}`;
const piTerm = (n) => (n === 1 ? '\\pi' : `${n}\\pi`);

/* -------------------------------------------------------------------- circle */

export const generateCircumferenceCircle = (options = {}) => {
  const { difficulty = 'core' } = options;
  const u = pick();

  if (difficulty === 'stretch') {
    const r = _.random(2, 40);
    return {
      instruction: 'Find the radius of the circle',
      answer: `x = ${r}`,
      answerUnits: `\\text{${u}}`,
      workingOut: `2\\pi r = ${piTerm(2 * r)}${NL}2r = ${2 * r}${NL}r = ${r}`,
      visualization: { type: 'circle', r: 'x', given: `C = ${2 * r}π ${u}`, unknown: 'r' },
      metadata: { topic: 'circumference-circle', difficulty },
    };
  }

  const r = _.random(2, 40);

  if (difficulty === 'foundation') {
    return {
      instruction: 'Find the circumference. Leave your answer in terms of π',
      answer: piTerm(2 * r),
      answerUnits: `\\text{${u}}`,
      workingOut: `C = 2\\pi r${NL}C = 2 \\times \\pi \\times ${r}${NL}C = ${piTerm(2 * r)}`,
      visualization: { type: 'circle', r: lbl(r, u) },
      metadata: { topic: 'circumference-circle', difficulty },
    };
  }

  return {
    instruction: 'Find the circumference. Leave your answer in terms of π',
    answer: piTerm(2 * r),
    answerUnits: `\\text{${u}}`,
    workingOut: `C = \\pi d${NL}C = \\pi \\times ${2 * r}${NL}C = ${piTerm(2 * r)}`,
    visualization: { type: 'circle', diameter: lbl(2 * r, u) },
    metadata: { topic: 'circumference-circle', difficulty },
  };
};

export const generateAreaCircle = (options = {}) => {
  const { difficulty = 'core' } = options;
  const u = pick();

  if (difficulty === 'stretch') {
    const r = _.random(2, 40);
    return {
      instruction: 'Find the radius of the circle',
      answer: `x = ${r}`,
      answerUnits: `\\text{${u}}`,
      workingOut: `\\pi r^2 = ${piTerm(r * r)}${NL}r^2 = ${r * r}${NL}r = ${r}`,
      visualization: { type: 'circle', r: 'x', given: `A = ${r * r}π ${u}²`, unknown: 'r' },
      metadata: { topic: 'area-circle', difficulty },
    };
  }

  const r = _.random(2, 40);

  if (difficulty === 'foundation') {
    return {
      instruction: 'Find the area. Leave your answer in terms of π',
      answer: piTerm(r * r),
      answerUnits: `\\text{${u}}^2`,
      workingOut: `A = \\pi r^2${NL}A = \\pi \\times ${r}^2${NL}A = ${piTerm(r * r)}`,
      visualization: { type: 'circle', r: lbl(r, u) },
      metadata: { topic: 'area-circle', difficulty },
    };
  }

  return {
    instruction: 'Find the area. Leave your answer in terms of π',
    answer: piTerm(r * r),
    answerUnits: `\\text{${u}}^2`,
    workingOut: `r = ${2 * r} \\div 2 = ${r}${NL}A = \\pi r^2 = \\pi \\times ${r}^2${NL}A = ${piTerm(r * r)}`,
    visualization: { type: 'circle', diameter: lbl(2 * r, u) },
    metadata: { topic: 'area-circle', difficulty },
  };
};

/* ------------------------------------------------------------------- L-shape */
// Six sides, four labelled. The two unlabelled ones are e = a + c along the
// bottom and f = b + d up the left — deriving them IS the skill (Haese 9C.2
// Q1, 9B Q2). Perimeter therefore collapses to 2(a + c) + 2(b + d), the same
// as the bounding rectangle, which is worth showing in the working.
// Area = ab + (a + c)d, splitting into the upper and lower rectangles.

const lshape = () => {
  const a = _.random(2, 18);
  const b = _.random(2, 18);
  const c = _.random(2, 18);
  const d = _.random(2, 18);
  return [a, b, c, d];
};

export const generatePerimeterCompound = (options = {}) => {
  const { difficulty = 'foundation' } = options;
  const u = pick();
  const [a, b, c, d] = lshape();
  const P = 2 * (a + c) + 2 * (b + d);

  if (difficulty === 'core') {
    const which = _.sample(['a', 'b', 'c', 'd']);
    const vals = { a, b, c, d };
    const others = ['a', 'b', 'c', 'd'].filter((k) => k !== which).reduce((s, k) => s + vals[k], 0);
    const fig = { type: 'l-shape', a: lbl(a, u), b: lbl(b, u), c: lbl(c, u), d: lbl(d, u), given: `P = ${P} ${u}`, unknown: which };
    fig[which] = 'x';
    return {
      instruction: 'Find the missing length',
      answer: `x = ${vals[which]}`,
      answerUnits: `\\text{${u}}`,
      workingOut: `P = 2(a + c) + 2(b + d) = ${P}${NL}a + b + c + d = ${P / 2}${NL}x = ${P / 2} - ${others} = ${vals[which]}`,
      visualization: fig,
      metadata: { topic: 'perimeter-compound', difficulty },
    };
  }

  return {
    instruction: 'Find the perimeter of the shape',
    answer: String(P),
    answerUnits: `\\text{${u}}`,
    workingOut: `\\text{the two unmarked sides are } ${a} + ${c} = ${a + c} \\text{ and } ${b} + ${d} = ${b + d}${NL}P = 2 \\times ${a + c} + 2 \\times ${b + d}${NL}P = ${P}`,
    visualization: { type: 'l-shape', a: lbl(a, u), b: lbl(b, u), c: lbl(c, u), d: lbl(d, u) },
    metadata: { topic: 'perimeter-compound', difficulty },
  };
};

export const generateAreaCompound = (options = {}) => {
  const { difficulty = 'foundation' } = options;
  const u = pick();
  const [a, b, c, d] = lshape();
  const A = a * b + (a + c) * d;

  if (difficulty === 'core') {
    const which = _.sample(['a', 'b', 'c', 'd']);
    const vals = { a, b, c, d };
    const fig = { type: 'l-shape', a: lbl(a, u), b: lbl(b, u), c: lbl(c, u), d: lbl(d, u), given: `A = ${A} ${u}²`, unknown: which };
    fig[which] = 'x';
    return {
      instruction: 'Find the missing length',
      answer: `x = ${vals[which]}`,
      answerUnits: `\\text{${u}}`,
      // Spelling out the rearrangement per case: "substitute the three known
      // lengths" is not working, it is an instruction to do the working.
      workingOut: {
        a: `a(b + d) + cd = ${A}${NL}x \\times ${b + d} = ${A} - ${c * d}${NL}x = ${A - c * d} \\div ${b + d} = ${a}`,
        b: `ab + ad + cd = ${A}${NL}${a}x = ${A} - ${a * d} - ${c * d}${NL}x = ${A - a * d - c * d} \\div ${a} = ${b}`,
        c: `ab + ad + cd = ${A}${NL}${d}x = ${A} - ${a * b} - ${a * d}${NL}x = ${A - a * b - a * d} \\div ${d} = ${c}`,
        d: `ab + (a + c)d = ${A}${NL}${a + c}x = ${A} - ${a * b}${NL}x = ${A - a * b} \\div ${a + c} = ${d}`,
      }[which],
      visualization: fig,
      metadata: { topic: 'area-compound', difficulty },
    };
  }

  return {
    instruction: 'Find the area of the shape',
    answer: String(A),
    answerUnits: `\\text{${u}}^2`,
    workingOut: `\\text{split into two rectangles}${NL}\\text{upper} = ${a} \\times ${b} = ${a * b}, \\text{lower} = ${a + c} \\times ${d} = ${(a + c) * d}${NL}A = ${a * b} + ${(a + c) * d} = ${A}`,
    visualization: { type: 'l-shape', a: lbl(a, u), b: lbl(b, u), c: lbl(c, u), d: lbl(d, u) },
    metadata: { topic: 'area-compound', difficulty },
  };
};

/* --------------------------------------------------------- rectangle perimeter */

export const generatePerimeterRectangle = (options = {}) => {
  const { difficulty = 'core' } = options;
  const u = pick();

  if (difficulty === 'stretch') {
    // Sides given algebraically (Haese 9B Q3). The answer is a formula.
    const p = _.random(2, 15);
    const q = _.random(2, 15);
    return {
      instruction: 'Find a formula for the perimeter',
      answer: `P = ${2 * (p + q)}a`,
      workingOut: `P = 2(l + w)${NL}P = 2(${p}a + ${q}a)${NL}P = ${2 * (p + q)}a`,
      visualization: { type: 'rectangle', l: `${p}a`, w: `${q}a` },
      metadata: { topic: 'perimeter-rectangle', difficulty },
    };
  }

  const l = _.random(2, 30);
  const w = _.random(2, 30);
  const P = 2 * (l + w);

  if (difficulty === 'core') {
    const findL = _.random(0, 1) === 1;
    const fig = { type: 'rectangle', l: lbl(l, u), w: lbl(w, u), area: `P = ${P} ${u}`, unknown: findL ? 'l' : 'w' };
    fig[findL ? 'l' : 'w'] = 'x';
    return {
      instruction: 'Find the missing length',
      answer: `x = ${findL ? l : w}`,
      answerUnits: `\\text{${u}}`,
      workingOut: `2(l + w) = ${P}${NL}l + w = ${P / 2}${NL}x = ${P / 2} - ${findL ? w : l} = ${findL ? l : w}`,
      visualization: fig,
      metadata: { topic: 'perimeter-rectangle', difficulty },
    };
  }

  return {
    instruction: 'Find the perimeter of the rectangle',
    answer: String(P),
    answerUnits: `\\text{${u}}`,
    workingOut: `P = 2(l + w)${NL}P = 2(${l} + ${w})${NL}P = ${P}`,
    visualization: { type: 'rectangle', l: lbl(l, u), w: lbl(w, u) },
    metadata: { topic: 'perimeter-rectangle', difficulty },
  };
};
