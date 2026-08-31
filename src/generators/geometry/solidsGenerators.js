import _ from 'lodash';

const NL = '\n';

// One length unit per question, never mixed within one. This is not
// decoration: the cube band has a single parameter, so the unit is the only
// other axis of variation it has — without it that band produces 19 distinct
// questions, which is close enough to a hardcoded bank to matter.
const UNITS = ['cm', 'm', 'mm'];
const pick = () => _.sample(UNITS);
const lbl = (n, u) => `${n} ${u}`;

// Three integer dimensions, rejecting the all-equal case — that is the cube,
// which surface-area-cuboid's foundation band owns, so a question that says
// "cuboid" never draws one.
const dims = (min, max) => {
  let l, w, h;
  do {
    l = _.random(min, max);
    w = _.random(min, max);
    h = _.random(min, max);
  } while (l === w && w === h);
  return [l, w, h];
};

// Exact-in-pi answers are the house convention for every curved solid at
// foundation and core (Haese Ex 11A.2 Q2 and Rayner Ex 4.14 both ask for
// answers left in terms of pi). A coefficient of 1 prints as a bare \pi.
const piTerm = (n) => (n === 1 ? '\\pi' : `${n}\\pi`);
// Sphere volume is 4r^3/3, which is only a whole coefficient when r is a
// multiple of 3. Rather than restrict r to multiples of 3 (which would leave
// the band with almost no distinct questions), print the honest fraction.
const piThirds = (num) => (num % 3 === 0 ? piTerm(num / 3) : `\\frac{${num}}{3}\\pi`);

// Pythagorean triples generated, never listed: Euclid's formula over a real
// range of (m, n, k), then filtered to sane classroom sizes. The two legs
// become r and h in random order, so the slant height is always a whole
// number without any hardcoded (3,4,5)-style bank.
const triple = () => {
  const options = [];
  for (let m = 2; m <= 13; m++) {
    for (let n = 1; n < m; n++) {
      for (let k = 1; k <= 7; k++) {
        const a = (m * m - n * n) * k;
        const b = 2 * m * n * k;
        const c = (m * m + n * n) * k;
        if (a >= 3 && b >= 3 && a <= 60 && b <= 60 && c <= 65) options.push([a, b, c]);
      }
    }
  }
  const [a, b, c] = _.sample(options);
  return _.random(0, 1) ? [a, b, c] : [b, a, c];
};

export const generateVolumeCuboid = (options = {}) => {
  const { difficulty = 'core' } = options;

  if (difficulty === 'foundation') {
    const u = pick();
    const [l, w, h] = dims(2, 18);
    const V = l * w * h;
    return {
      instruction: 'Find the volume of the cuboid',
      answer: String(V),
      answerUnits: `\\text{${u}}^3`,
      workingOut: `V = l \\times w \\times h${NL}V = ${l} \\times ${w} \\times ${h}${NL}V = ${V}`,
      visualization: { type: 'cuboid', l: lbl(l, u), d: lbl(w, u), h: lbl(h, u) },
      metadata: { topic: 'volume-cuboid', difficulty },
    };
  }

  if (difficulty === 'stretch') {
    const u = pick();
    const [l, w, h] = dims(2, 18);
    const V = l * w * h;
    // Figure keys are l / d / h; 'w' is the maths name for the depth edge.
    const which = _.sample(['l', 'd', 'h']);
    const value = { l, d: w, h }[which];
    const fig = { type: 'cuboid', l: lbl(l, u), d: lbl(w, u), h: lbl(h, u), unknown: which };
    fig[which] = 'x';
    const others = { l: [w, h], d: [l, h], h: [l, w] }[which];
    return {
      instruction: 'Find the missing length',
      questionMath: `V = ${V}\\text{ ${u}}^3`,
      answer: `x = ${value}`,
      answerUnits: `\\text{${u}}`,
      workingOut: `l \\times w \\times h = V${NL}${others[0]} \\times ${others[1]} \\times x = ${V}${NL}x = ${V} \\div ${others[0] * others[1]} = ${value}`,
      visualization: fig,
      metadata: { topic: 'volume-cuboid', difficulty },
    };
  }

  // core: area of cross-section x length. The tinted face IS the
  // cross-section, so the labelled edge must be the one perpendicular to it
  // (the receding depth), never an edge lying in it.
  const u = pick();
  const A = _.random(6, 90);
  const len = _.random(3, 20);
  const V = A * len;
  return {
    instruction: 'Find the volume of the prism',
    answer: String(V),
    answerUnits: `\\text{${u}}^3`,
    workingOut: `V = A \\times \\text{length}${NL}V = ${A} \\times ${len}${NL}V = ${V}`,
    // The area goes INSIDE the shaded face, where both textbooks put it
    // (Haese p244 'area 15 cm^2'; Rayner p142 labels the shaded end 'A').
    // A separate line of question text reads as detached from the figure.
    // Figure labels are plain SVG text, not LaTeX, so the superscript is the
    // literal character — the same reason plainAngleLabel swaps \circ for a
    // real degree sign.
    visualization: {
      type: 'cuboid',
      d: lbl(len, u),
      crossSection: true,
      crossSectionLabel: `${A} ${u}²`,
    },
    metadata: { topic: 'volume-cuboid', difficulty },
  };
};

export const generateSurfaceAreaCuboid = (options = {}) => {
  const { difficulty = 'core' } = options;

  if (difficulty === 'foundation') {
    const u = pick();
    const s = _.random(2, 20);
    const A = 6 * s * s;
    return {
      instruction: 'Find the surface area of the cube',
      answer: String(A),
      answerUnits: `\\text{${u}}^2`,
      workingOut: `A = 6s^2${NL}A = 6 \\times ${s}^2${NL}A = ${A}`,
      // All three edges carry the same label deliberately. That repetition is
      // the visual cue that makes 6s^2 obvious rather than something to be
      // recalled — the same argument as the tick marks on the isosceles
      // figures. There is no `cube` flag; the generator just passes the same
      // value three times.
      visualization: { type: 'cuboid', l: lbl(s, u), d: lbl(s, u), h: lbl(s, u) },
      metadata: { topic: 'surface-area-cuboid', difficulty },
    };
  }

  if (difficulty === 'stretch') {
    const u = pick();
    const [l, w, h] = dims(2, 18);
    const base = l * w;
    const sides = 2 * l * h + 2 * w * h;
    const A = base + sides;
    return {
      instruction: 'Find the surface area of the open box (it has no lid)',
      answer: String(A),
      answerUnits: `\\text{${u}}^2`,
      workingOut: `\\text{base} = ${l} \\times ${w} = ${base}${NL}\\text{sides} = 2(${l} \\times ${h}) + 2(${w} \\times ${h}) = ${sides}${NL}A = ${base} + ${sides} = ${A}`,
      visualization: { type: 'cuboid', l: lbl(l, u), d: lbl(w, u), h: lbl(h, u), open: true },
      metadata: { topic: 'surface-area-cuboid', difficulty },
    };
  }

  const u = pick();
  const [l, w, h] = dims(2, 18);
  const A = 2 * (l * w + l * h + w * h);
  return {
    instruction: 'Find the surface area of the cuboid',
    answer: String(A),
    answerUnits: `\\text{${u}}^2`,
    workingOut: `A = 2(lw + lh + wh)${NL}A = 2(${l * w} + ${l * h} + ${w * h})${NL}A = ${A}`,
    visualization: { type: 'cuboid', l: lbl(l, u), d: lbl(w, u), h: lbl(h, u) },
    metadata: { topic: 'surface-area-cuboid', difficulty },
  };
};

/* ------------------------------------------------------------------ cylinder */

export const generateSurfaceAreaCylinder = (options = {}) => {
  const { difficulty = 'core' } = options;
  const u = pick();

  if (difficulty === 'foundation') {
    // Hollow cylinder, no ends (Haese p235, first row of the table).
    const r = _.random(2, 20);
    const h = _.random(3, 30);
    return {
      instruction: 'Find the curved surface area. Leave your answer in terms of π',
      answer: piTerm(2 * r * h),
      answerUnits: `\\text{${u}}^2`,
      workingOut: `A = 2\\pi rh${NL}A = 2 \\times \\pi \\times ${r} \\times ${h}${NL}A = ${piTerm(2 * r * h)}`,
      visualization: { type: 'cylinder', r: lbl(r, u), h: lbl(h, u), openTop: true },
      metadata: { topic: 'surface-area-cylinder', difficulty },
    };
  }

  if (difficulty === 'stretch') {
    // A can: one end only, and the DIAMETER is given, so the radius has to be
    // found before anything else (Haese p235, middle row).
    const r = _.random(2, 20);
    const h = _.random(3, 30);
    const k = r * (2 * h + r);
    return {
      instruction: 'The can is closed at one end only. Find its surface area in terms of π',
      answer: piTerm(k),
      answerUnits: `\\text{${u}}^2`,
      workingOut: `r = ${2 * r} \\div 2 = ${r}${NL}A = 2\\pi rh + \\pi r^2${NL}A = ${piTerm(2 * r * h)} + ${piTerm(r * r)} = ${piTerm(k)}`,
      visualization: { type: 'cylinder', diameter: lbl(2 * r, u), h: lbl(h, u), openTop: true },
      metadata: { topic: 'surface-area-cylinder', difficulty },
    };
  }

  // Solid cylinder, both ends (Haese p235, last row).
  const r = _.random(2, 20);
  const h = _.random(3, 30);
  const k = 2 * r * (h + r);
  return {
    instruction: 'Find the total surface area. Leave your answer in terms of π',
    answer: piTerm(k),
    answerUnits: `\\text{${u}}^2`,
    workingOut: `A = 2\\pi rh + 2\\pi r^2${NL}A = ${piTerm(2 * r * h)} + ${piTerm(2 * r * r)}${NL}A = ${piTerm(k)}`,
    visualization: { type: 'cylinder', r: lbl(r, u), h: lbl(h, u) },
    metadata: { topic: 'surface-area-cylinder', difficulty },
  };
};

export const generateVolumeCylinder = (options = {}) => {
  const { difficulty = 'core' } = options;
  const u = pick();

  if (difficulty === 'foundation') {
    const r = _.random(2, 20);
    const h = _.random(3, 30);
    return {
      instruction: 'Find the volume. Leave your answer in terms of π',
      answer: piTerm(r * r * h),
      answerUnits: `\\text{${u}}^3`,
      workingOut: `V = \\pi r^2 h${NL}V = \\pi \\times ${r}^2 \\times ${h}${NL}V = ${piTerm(r * r * h)}`,
      visualization: { type: 'cylinder', r: lbl(r, u), h: lbl(h, u) },
      metadata: { topic: 'volume-cylinder', difficulty },
    };
  }

  if (difficulty === 'stretch') {
    // Reverse: the volume is given, one dimension is missing. The given
    // quantity is not a length, so it cannot sit on the figure as a label —
    // this is the one case that uses questionMath.
    const r = _.random(2, 16);
    const h = _.random(3, 30);
    const k = r * r * h;
    const findH = _.random(0, 1) === 1;
    const fig = { type: 'cylinder', r: lbl(r, u), h: lbl(h, u), unknown: findH ? 'h' : 'r' };
    fig[findH ? 'h' : 'r'] = 'x';
    return {
      instruction: 'Find the missing length',
      questionMath: `V = ${piTerm(k)}\\text{ ${u}}^3`,
      answer: `x = ${findH ? h : r}`,
      answerUnits: `\\text{${u}}`,
      workingOut: findH
        ? `\\pi r^2 h = ${piTerm(k)}${NL}${r * r}h = ${k}${NL}h = ${k} \\div ${r * r} = ${h}`
        : `\\pi r^2 h = ${piTerm(k)}${NL}${h}r^2 = ${k}${NL}r^2 = ${r * r},\\ r = ${r}`,
      visualization: fig,
      metadata: { topic: 'volume-cylinder', difficulty },
    };
  }

  // Diameter given, so it must be halved before substituting.
  const r = _.random(2, 20);
  const h = _.random(3, 30);
  return {
    instruction: 'Find the volume. Leave your answer in terms of π',
    answer: piTerm(r * r * h),
    answerUnits: `\\text{${u}}^3`,
    workingOut: `r = ${2 * r} \\div 2 = ${r}${NL}V = \\pi r^2 h = \\pi \\times ${r}^2 \\times ${h}${NL}V = ${piTerm(r * r * h)}`,
    visualization: { type: 'cylinder', diameter: lbl(2 * r, u), h: lbl(h, u) },
    metadata: { topic: 'volume-cylinder', difficulty },
  };
};

/* ---------------------------------------------------------------------- cone */

export const generateSurfaceAreaCone = (options = {}) => {
  const { difficulty = 'core' } = options;
  const u = pick();

  if (difficulty === 'foundation') {
    // Slant height given, curved surface only.
    const r = _.random(2, 20);
    const l = _.random(r + 2, r + 30);
    return {
      instruction: 'Find the curved surface area. Leave your answer in terms of π',
      answer: piTerm(r * l),
      answerUnits: `\\text{${u}}^2`,
      workingOut: `A = \\pi rl${NL}A = \\pi \\times ${r} \\times ${l}${NL}A = ${piTerm(r * l)}`,
      visualization: { type: 'cone', r: lbl(r, u), l: lbl(l, u) },
      metadata: { topic: 'surface-area-cone', difficulty },
    };
  }

  if (difficulty === 'stretch') {
    // Slant height NOT given — Pythagoras first, then the total. This is
    // Haese Example 6 and Rayner Example 11, the standard hard version.
    const [r, h, l] = triple();
    const k = r * (l + r);
    return {
      instruction: 'Find the total surface area. Leave your answer in terms of π',
      answer: piTerm(k),
      answerUnits: `\\text{${u}}^2`,
      workingOut: `l^2 = ${r}^2 + ${h}^2 = ${r * r + h * h},\\ l = ${l}${NL}A = \\pi rl + \\pi r^2${NL}A = ${piTerm(r * l)} + ${piTerm(r * r)} = ${piTerm(k)}`,
      visualization: { type: 'cone', r: lbl(r, u), h: lbl(h, u), l: 'l', unknown: 'l' },
      metadata: { topic: 'surface-area-cone', difficulty },
    };
  }

  // Slant height given, total surface area.
  const r = _.random(2, 20);
  const l = _.random(r + 2, r + 30);
  const k = r * (l + r);
  return {
    instruction: 'Find the total surface area. Leave your answer in terms of π',
    answer: piTerm(k),
    answerUnits: `\\text{${u}}^2`,
    workingOut: `A = \\pi rl + \\pi r^2${NL}A = ${piTerm(r * l)} + ${piTerm(r * r)}${NL}A = ${piTerm(k)}`,
    visualization: { type: 'cone', r: lbl(r, u), l: lbl(l, u) },
    metadata: { topic: 'surface-area-cone', difficulty },
  };
};

export const generateVolumeCone = (options = {}) => {
  const { difficulty = 'core' } = options;
  const u = pick();

  if (difficulty === 'stretch') {
    const r = _.random(2, 16);
    const h = 3 * _.random(1, 15);
    const k = (r * r * h) / 3;
    return {
      instruction: 'Find the height of the cone',
      questionMath: `V = ${piTerm(k)}\\text{ ${u}}^3`,
      answer: `x = ${h}`,
      answerUnits: `\\text{${u}}`,
      workingOut: `\\frac{1}{3}\\pi r^2 h = ${piTerm(k)}${NL}${r * r}h = ${3 * k}${NL}h = ${3 * k} \\div ${r * r} = ${h}`,
      visualization: { type: 'cone', r: lbl(r, u), h: 'x', unknown: 'h' },
      metadata: { topic: 'volume-cone', difficulty },
    };
  }

  // h is a multiple of 3 so the third cancels and the answer stays a whole
  // multiple of pi rather than a fraction.
  const r = _.random(2, 20);
  const h = 3 * _.random(1, 15);
  const k = (r * r * h) / 3;

  if (difficulty === 'foundation') {
    return {
      instruction: 'Find the volume. Leave your answer in terms of π',
      answer: piTerm(k),
      answerUnits: `\\text{${u}}^3`,
      workingOut: `V = \\frac{1}{3}\\pi r^2 h${NL}V = \\frac{1}{3} \\times \\pi \\times ${r}^2 \\times ${h}${NL}V = ${piTerm(k)}`,
      visualization: { type: 'cone', r: lbl(r, u), h: lbl(h, u) },
      metadata: { topic: 'volume-cone', difficulty },
    };
  }

  return {
    instruction: 'Find the volume. Leave your answer in terms of π',
    answer: piTerm(k),
    answerUnits: `\\text{${u}}^3`,
    workingOut: `r = ${2 * r} \\div 2 = ${r}${NL}V = \\frac{1}{3}\\pi r^2 h = \\frac{1}{3} \\times \\pi \\times ${r}^2 \\times ${h}${NL}V = ${piTerm(k)}`,
    visualization: { type: 'cone', diameter: lbl(2 * r, u), h: lbl(h, u) },
    metadata: { topic: 'volume-cone', difficulty },
  };
};

/* -------------------------------------------------------------------- sphere */

export const generateSurfaceAreaSphere = (options = {}) => {
  const { difficulty = 'core' } = options;
  const u = pick();

  if (difficulty === 'stretch') {
    const r = _.random(2, 40);
    const k = 4 * r * r;
    return {
      instruction: 'Find the radius of the sphere',
      questionMath: `A = ${piTerm(k)}\\text{ ${u}}^2`,
      answer: `x = ${r}`,
      answerUnits: `\\text{${u}}`,
      workingOut: `4\\pi r^2 = ${piTerm(k)}${NL}r^2 = ${k} \\div 4 = ${r * r}${NL}r = ${r}`,
      visualization: { type: 'sphere', r: 'x', unknown: 'r' },
      metadata: { topic: 'surface-area-sphere', difficulty },
    };
  }

  const r = _.random(2, 40);
  const k = 4 * r * r;

  if (difficulty === 'foundation') {
    return {
      instruction: 'Find the surface area. Leave your answer in terms of π',
      answer: piTerm(k),
      answerUnits: `\\text{${u}}^2`,
      workingOut: `A = 4\\pi r^2${NL}A = 4 \\times \\pi \\times ${r}^2${NL}A = ${piTerm(k)}`,
      visualization: { type: 'sphere', r: lbl(r, u) },
      metadata: { topic: 'surface-area-sphere', difficulty },
    };
  }

  return {
    instruction: 'Find the surface area. Leave your answer in terms of π',
    answer: piTerm(k),
    answerUnits: `\\text{${u}}^2`,
    workingOut: `r = ${2 * r} \\div 2 = ${r}${NL}A = 4\\pi r^2 = 4 \\times \\pi \\times ${r}^2${NL}A = ${piTerm(k)}`,
    visualization: { type: 'sphere', diameter: lbl(2 * r, u) },
    metadata: { topic: 'surface-area-sphere', difficulty },
  };
};

export const generateVolumeSphere = (options = {}) => {
  const { difficulty = 'core' } = options;
  const u = pick();

  if (difficulty === 'stretch') {
    // Cube root, integer by construction.
    const r = _.random(2, 15);
    const num = 4 * r * r * r;
    return {
      instruction: 'Find the radius of the sphere',
      questionMath: `V = ${piThirds(num)}\\text{ ${u}}^3`,
      answer: `x = ${r}`,
      answerUnits: `\\text{${u}}`,
      workingOut: `\\frac{4}{3}\\pi r^3 = ${piThirds(num)}${NL}r^3 = ${num} \\div 4 = ${r * r * r}${NL}r = ${r}`,
      visualization: { type: 'sphere', r: 'x', unknown: 'r' },
      metadata: { topic: 'volume-sphere', difficulty },
    };
  }

  const r = _.random(2, 20);
  const num = 4 * r * r * r;

  if (difficulty === 'foundation') {
    return {
      instruction: 'Find the volume. Leave your answer in terms of π',
      answer: piThirds(num),
      answerUnits: `\\text{${u}}^3`,
      workingOut: `V = \\frac{4}{3}\\pi r^3${NL}V = \\frac{4}{3} \\times \\pi \\times ${r}^3${NL}V = ${piThirds(num)}`,
      visualization: { type: 'sphere', r: lbl(r, u) },
      metadata: { topic: 'volume-sphere', difficulty },
    };
  }

  return {
    instruction: 'Find the volume. Leave your answer in terms of π',
    answer: piThirds(num),
    answerUnits: `\\text{${u}}^3`,
    workingOut: `r = ${2 * r} \\div 2 = ${r}${NL}V = \\frac{4}{3}\\pi r^3 = \\frac{4}{3} \\times \\pi \\times ${r}^3${NL}V = ${piThirds(num)}`,
    visualization: { type: 'sphere', diameter: lbl(2 * r, u) },
    metadata: { topic: 'volume-sphere', difficulty },
  };
};

/* --------------------------------------------------------------------- prism */

export const generateVolumePrism = (options = {}) => {
  const { difficulty = 'core' } = options;
  const u = pick();

  if (difficulty === 'core') {
    // Trapezium cross-section — the shape Cambridge actually asks about
    // (Haese p155 Q3, the gold bar; Rayner p142). Constrained so the half
    // cancels and the answer stays a whole number.
    let a, b, h;
    do {
      a = _.random(2, 14);
      b = _.random(a + 1, a + 14);
      h = _.random(2, 14);
    } while (((a + b) * h) % 2 !== 0);
    const L = _.random(3, 20);
    const A = ((a + b) * h) / 2;
    return {
      instruction: 'Find the volume of the prism',
      answer: String(A * L),
      answerUnits: `\\text{${u}}^3`,
      workingOut: `A = \\frac{1}{2}(a + b)h = \\frac{1}{2}(${a} + ${b}) \\times ${h} = ${A}${NL}V = A \\times \\text{length} = ${A} \\times ${L}${NL}V = ${A * L}`,
      visualization: { type: 'prism', shape: 'trapezium', a: lbl(a, u), b: lbl(b, u), ht: lbl(h, u), L: lbl(L, u), crossSection: true },
      metadata: { topic: 'volume-prism', difficulty },
    };
  }

  let b, h;
  do {
    b = _.random(2, 20);
    h = _.random(2, 20);
  } while ((b * h) % 2 !== 0);
  const L = _.random(3, 20);
  const A = (b * h) / 2;

  if (difficulty === 'foundation') {
    return {
      instruction: 'Find the volume of the prism',
      answer: String(A * L),
      answerUnits: `\\text{${u}}^3`,
      workingOut: `A = \\frac{1}{2}bh = \\frac{1}{2} \\times ${b} \\times ${h} = ${A}${NL}V = A \\times \\text{length} = ${A} \\times ${L}${NL}V = ${A * L}`,
      visualization: { type: 'prism', shape: 'triangle', b: lbl(b, u), ht: lbl(h, u), L: lbl(L, u), crossSection: true },
      metadata: { topic: 'volume-prism', difficulty },
    };
  }

  // stretch: volume given, one dimension missing.
  const V = A * L;
  const which = _.sample(['b', 'ht', 'L']);
  const value = { b, ht: h, L }[which];
  const fig = { type: 'prism', shape: 'triangle', b: lbl(b, u), ht: lbl(h, u), L: lbl(L, u), crossSection: true, unknown: which };
  fig[which] = 'x';
  return {
    instruction: 'Find the missing length',
    questionMath: `V = ${V}\\text{ ${u}}^3`,
    answer: `x = ${value}`,
    answerUnits: `\\text{${u}}`,
    // Substituting x in place shows the structure; a bare "V divided by the
    // known product" line would print an awkward 7.5 whenever the remaining
    // pair is odd.
    workingOut: `\\frac{1}{2}bh \\times \\text{length} = ${V}${NL}\\frac{1}{2} \\times ${which === 'b' ? 'x' : b} \\times ${which === 'ht' ? 'x' : h} \\times ${which === 'L' ? 'x' : L} = ${V}${NL}x = ${value}`,
    visualization: fig,
    metadata: { topic: 'volume-prism', difficulty },
  };
};

export const generateSurfaceAreaPrism = (options = {}) => {
  const { difficulty = 'core' } = options;
  const u = pick();
  const [b, h, hyp] = triple();
  const L = _.random(3, 20);
  const lateral = (b + h + hyp) * L;
  const ends = b * h; // 2 x (1/2 b h)

  if (difficulty === 'foundation') {
    return {
      instruction: 'Find the area of the three rectangular faces',
      answer: String(lateral),
      answerUnits: `\\text{${u}}^2`,
      workingOut: `\\text{perimeter} = ${b} + ${h} + ${hyp} = ${b + h + hyp}${NL}A = \\text{perimeter} \\times \\text{length}${NL}A = ${b + h + hyp} \\times ${L} = ${lateral}`,
      visualization: { type: 'prism', shape: 'triangle', b: lbl(b, u), ht: lbl(h, u), hyp: lbl(hyp, u), L: lbl(L, u) },
      metadata: { topic: 'surface-area-prism', difficulty },
    };
  }

  if (difficulty === 'stretch') {
    // Sloping edge not given — Pythagoras first, then the whole solid.
    // This is Haese Example 2, the wedge.
    return {
      instruction: 'Find the total surface area of the prism',
      answer: String(lateral + ends),
      answerUnits: `\\text{${u}}^2`,
      workingOut: `x^2 = ${b}^2 + ${h}^2 = ${b * b + h * h},\\ x = ${hyp}${NL}\\text{rectangles} = (${b} + ${h} + ${hyp}) \\times ${L} = ${lateral}${NL}\\text{2 triangles} = ${b} \\times ${h} = ${ends}${NL}A = ${lateral + ends}`,
      visualization: { type: 'prism', shape: 'triangle', b: lbl(b, u), ht: lbl(h, u), hyp: 'x', L: lbl(L, u), unknown: 'hyp' },
      metadata: { topic: 'surface-area-prism', difficulty },
    };
  }

  return {
    instruction: 'Find the total surface area of the prism',
    answer: String(lateral + ends),
    answerUnits: `\\text{${u}}^2`,
    workingOut: `\\text{rectangles} = (${b} + ${h} + ${hyp}) \\times ${L} = ${lateral}${NL}\\text{2 triangles} = ${b} \\times ${h} = ${ends}${NL}A = ${lateral} + ${ends} = ${lateral + ends}`,
    visualization: { type: 'prism', shape: 'triangle', b: lbl(b, u), ht: lbl(h, u), hyp: lbl(hyp, u), L: lbl(L, u) },
    metadata: { topic: 'surface-area-prism', difficulty },
  };
};

/* ------------------------------------------------------------------- pyramid */

export const generateVolumePyramid = (options = {}) => {
  const { difficulty = 'core' } = options;
  const u = pick();

  if (difficulty === 'core') {
    // Rectangular base (Rayner Ex 4.11 Q9), so the base area is itself a
    // step rather than a square.
    let l, w, h;
    do {
      l = _.random(2, 18);
      w = _.random(2, 18);
      h = _.random(2, 24);
    } while ((l * w * h) % 3 !== 0 || l === w);
    const V = (l * w * h) / 3;
    return {
      instruction: 'Find the volume of the pyramid',
      answer: String(V),
      answerUnits: `\\text{${u}}^3`,
      workingOut: `V = \\frac{1}{3} \\times \\text{base area} \\times h${NL}V = \\frac{1}{3} \\times ${l} \\times ${w} \\times ${h}${NL}V = ${V}`,
      visualization: { type: 'pyramid', base: lbl(l, u), baseSide: lbl(w, u), h: lbl(h, u) },
      metadata: { topic: 'volume-pyramid', difficulty },
    };
  }

  const s = _.random(2, 20);
  const h = 3 * _.random(1, 12);
  const V = (s * s * h) / 3;

  if (difficulty === 'foundation') {
    return {
      instruction: 'Find the volume of the square-based pyramid',
      answer: String(V),
      answerUnits: `\\text{${u}}^3`,
      workingOut: `V = \\frac{1}{3} \\times \\text{base area} \\times h${NL}V = \\frac{1}{3} \\times ${s}^2 \\times ${h}${NL}V = ${V}`,
      visualization: { type: 'pyramid', base: lbl(s, u), h: lbl(h, u) },
      metadata: { topic: 'volume-pyramid', difficulty },
    };
  }

  return {
    instruction: 'Find the height of the pyramid',
    questionMath: `V = ${V}\\text{ ${u}}^3`,
    answer: `x = ${h}`,
    answerUnits: `\\text{${u}}`,
    workingOut: `\\frac{1}{3} \\times ${s}^2 \\times h = ${V}${NL}${s * s}h = ${3 * V}${NL}h = ${3 * V} \\div ${s * s} = ${h}`,
    visualization: { type: 'pyramid', base: lbl(s, u), h: 'x', unknown: 'h' },
    metadata: { topic: 'volume-pyramid', difficulty },
  };
};

export const generateSurfaceAreaPyramid = (options = {}) => {
  const { difficulty = 'core' } = options;
  const u = pick();

  if (difficulty === 'stretch') {
    // Slant height not given: it comes from the perpendicular height and
    // HALF the base, which is the step students miss. Haese Example 3.
    // Half the base is one leg of the triple, so the base is twice it.
    const [half, h, slant] = triple();
    const s = 2 * half;
    const A = s * s + 2 * s * slant;
    return {
      instruction: 'Find the total surface area of the square-based pyramid',
      answer: String(A),
      answerUnits: `\\text{${u}}^2`,
      workingOut: `l^2 = ${h}^2 + ${half}^2 = ${h * h + half * half},\\ l = ${slant}${NL}\\text{base} = ${s}^2 = ${s * s}${NL}\\text{4 triangles} = 4 \\times \\frac{1}{2} \\times ${s} \\times ${slant} = ${2 * s * slant}${NL}A = ${A}`,
      visualization: { type: 'pyramid', base: lbl(s, u), h: lbl(h, u), l: 'l', unknown: 'l' },
      metadata: { topic: 'surface-area-pyramid', difficulty },
    };
  }

  const s = _.random(2, 20);
  const l = _.random(s, s + 24);

  if (difficulty === 'foundation') {
    return {
      instruction: 'Find the area of the four triangular faces',
      answer: String(2 * s * l),
      answerUnits: `\\text{${u}}^2`,
      workingOut: `\\text{one face} = \\frac{1}{2} \\times ${s} \\times ${l}${NL}A = 4 \\times \\frac{1}{2} \\times ${s} \\times ${l}${NL}A = ${2 * s * l}`,
      visualization: { type: 'pyramid', base: lbl(s, u), l: lbl(l, u) },
      metadata: { topic: 'surface-area-pyramid', difficulty },
    };
  }

  return {
    instruction: 'Find the total surface area of the square-based pyramid',
    answer: String(s * s + 2 * s * l),
    answerUnits: `\\text{${u}}^2`,
    workingOut: `\\text{base} = ${s}^2 = ${s * s}${NL}\\text{4 triangles} = 4 \\times \\frac{1}{2} \\times ${s} \\times ${l} = ${2 * s * l}${NL}A = ${s * s} + ${2 * s * l} = ${s * s + 2 * s * l}`,
    visualization: { type: 'pyramid', base: lbl(s, u), l: lbl(l, u) },
    metadata: { topic: 'surface-area-pyramid', difficulty },
  };
};
