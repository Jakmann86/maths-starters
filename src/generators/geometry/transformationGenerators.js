// src/generators/geometry/transformationGenerators.js
//
// Haese 20A-D and Rayner 11, at Year 8: translation, reflection, rotation
// and enlargement on a coordinate grid, and describing a transformation
// fully. The topic is "Transformations". Column vectors are used for
// translations from Core; the vectors chapter itself is not here.
//
// Every question is drawn on the transform-grid figure. A carry-out
// question letters one vertex A and asks for the coordinates of its image
// A'; the image itself is drawn on reveal, in the slot colour, so a class
// can check their drawing. A describe question draws shapes A and B, and
// the reveal draws the mirror line or the centre that the answer names.
//
// Shapes have no line or turn of symmetry, so a pair A, B is the image of
// one transformation only and the answer is the only one. The checker
// confirms that by searching every candidate.

import _ from 'lodash';

const NL = '\n';
const MINUS = '−';
// A real minus sign on numbers and on -x; the hyphen in y-axis stays.
const txt = (s) => s.replace(/-(?=[\dx])/g, MINUS);
const pt = ([x, y]) => `(${x}, ${y})`;

const box = (pts) => [Math.min(...pts.map((p) => p[0])), Math.max(...pts.map((p) => p[0])), Math.min(...pts.map((p) => p[1])), Math.max(...pts.map((p) => p[1]))];

// Asymmetric outlines, at the origin, in families: right triangles with
// unequal legs, an L with arms 3 and 2, two right trapezia, an irregular
// quadrilateral and a flag.
const tri = (a, b) => [[0, 0], [a, 0], [0, b]];
const FAMILIES = [
  [tri(1, 2), tri(1, 3), tri(2, 3)],
  [[[0, 0], [3, 0], [3, 1], [1, 1], [1, 2], [0, 2]]],
  [[[0, 0], [3, 0], [2, 2], [0, 2]]],
  [[[0, 0], [2, 0], [3, 2], [0, 1]]],
  [[[0, 0], [1, 0], [1, 2], [3, 3], [0, 3]]],
  [[[0, 0], [2, 0], [2, 1], [0, 2]]],
];

// Every family in all eight turns and flips, moved to sit at the origin.
const normalise = (pts) => { const [x0, , y0] = box(pts); return pts.map(([x, y]) => [x - x0, y - y0]); };
const ORIENTED = FAMILIES.map((fam) => fam.flatMap((s) => [0, 1, 2, 3].flatMap((t) => {
  let out = s;
  for (let i = 0; i < t; i += 1) out = out.map(([x, y]) => [-y, x]);
  return [normalise(out), normalise(out.map(([x, y]) => [-x, y]))];
})));

// A shape no more than maxSize squares across or up: a family at random,
// then one of its turns that fits.
const BY_SIZE = {};
function shape(maxSize = 3) {
  const fits = (pts) => { const [, w, , h] = box(pts); return w <= maxSize && h <= maxSize; };
  BY_SIZE[maxSize] ??= ORIENTED.map((f) => f.filter(fits)).filter((f) => f.length);
  return _.sample(_.sample(BY_SIZE[maxSize]));
}

const move = (pts, dx, dy) => pts.map(([x, y]) => [x + dx, y + dy]);
const inGrid = (pts, lim = 7) => pts.every(([x, y]) => Math.abs(x) <= lim && Math.abs(y) <= lim);
// The two shapes' boxes do not touch, so each can be seen on its own.
const apart = (p, q) => {
  const [a, b] = [box(p), box(q)];
  return a[1] < b[0] || b[1] < a[0] || a[3] < b[2] || b[3] < a[2];
};
const inside = ([x, y], pts) => { const b = box(pts); return x >= b[0] && x <= b[1] && y >= b[2] && y <= b[3]; };

/* ---------------------------------------------------- the transformations */

export const TRANSFORMS = {
  translate: ([dx, dy]) => ([x, y]) => [x + dx, y + dy],
  reflect: (line) => ([x, y]) => {
    if (line.x !== undefined) return [2 * line.x - x, y];
    if (line.y !== undefined) return [x, 2 * line.y - y];
    return line.m === 1 ? [y, x] : [-y, -x];
  },
  // angle: 90 anticlockwise, -90 clockwise, 180 a half turn
  rotate: (angle, [a, b]) => ([x, y]) => {
    if (angle === 180) return [2 * a - x, 2 * b - y];
    if (angle === 90) return [a - (y - b), b + (x - a)];
    return [a + (y - b), b - (x - a)];
  },
  enlarge: (k, [a, b]) => ([x, y]) => [a + k * (x - a), b + k * (y - b)],
};

// The grid drawn runs one square past every point, the origin included.
// It is kept to at most TALL squares high and WIDE across, so it fills the
// box beside the question at a size the class can read, and its numbers
// run in ones (the figure counts in twos past 14).
export const TALL = 10, WIDE = 14;
const fits = (pts) => { const [x0, x1, y0, y1] = box([...pts, [0, 0]]); return x1 - x0 + 2 <= WIDE && y1 - y0 + 2 <= TALL; };

// Each shape sits inside one quadrant, clear of both axes, so no edge or
// letter lies over the numbers on them.
const inQuadrant = (pts) => [0, 1].every((i) => pts.every((p) => p[i] > 0) || pts.every((p) => p[i] < 0));

// An object and its image: on the grid, apart, each in a quadrant, and
// the whole drawing small enough to read.
const valid = (r) => inGrid(r.object) && inGrid(r.image) && apart(r.object, r.image)
  && inQuadrant(r.object) && inQuadrant(r.image)
  && fits([...r.object, ...r.image, ...(r.centre ? [r.centre] : [])]);

// Place an object, with its image, by trying placements until one is valid.
function place(make) {
  for (let t = 0; t < 20000; t += 1) {
    const r = make();
    if (r && valid(r)) return r;
  }
  throw new Error('transformations: could not place a shape');
}

const anyObject = () => move(shape(), _.random(-7, 4), _.random(-7, 4));

const makeTranslation = () => place(() => {
  const v = [_.random(-6, 6), _.random(-6, 6)];
  if (v[0] === 0 && v[1] === 0) return null;
  const object = anyObject();
  return { kind: 'translation', v, object, image: object.map(TRANSFORMS.translate(v)) };
});

const STRAIGHT = [() => ({ x: _.random(-4, 4) }), () => ({ y: _.random(-4, 4) })];
const DIAGONAL = [() => ({ m: 1, c: 0 }), () => ({ m: -1, c: 0 })];
// Each maker settles the kind (which line, which turn, which factor) before
// placing, so a kind that is harder to fit on the grid is not drawn less.
const makeReflection = (lines) => { const pick = _.sample(lines); return place(() => {
  const line = pick();
  const object = anyObject();
  return { kind: 'reflection', line, object, image: object.map(TRANSFORMS.reflect(line)) };
}); };

// A centre drawn as a dot stays off the axes, where it would cover a
// number; the origin is only ever named, never drawn.
const offAxes = (p) => p[0] !== 0 && p[1] !== 0;
const ORIGIN = () => [0, 0];
const ANYWHERE = () => (Math.random() < 0.25 ? [0, 0] : OFF_ORIGIN());
const OFF_ORIGIN = () => { for (;;) { const c = [_.random(-3, 3), _.random(-3, 3)]; if (offAxes(c)) return c; } };
const makeRotation = (angles, centreOf) => { const angle = _.sample(angles); return place(() => {
  const centre = centreOf();
  const object = anyObject();
  if (inside(centre, object)) return null;
  return { kind: 'rotation', angle, centre, object, image: object.map(TRANSFORMS.rotate(angle, centre)) };
}); };

// For a half, the small shape is the image, and the object is its
// enlargement by 2, so every image corner lands on a grid point. The centre
// lies off the axes and outside both shapes, so the rays from it can be
// drawn. Few placements of a shape and its enlargement fit the grid, so
// rather than guessing, every centre and offset is tried once per shape and
// factor, and one of those that fit is drawn.
const ENLARGEMENTS = new Map();
function enlargementsOf(k, base) {
  const key = `${k}|${base.join(';')}`;
  if (!ENLARGEMENTS.has(key)) {
    const [, w, , h] = box(base);
    const near = k === 3 ? 2 : 3;
    const list = [];
    for (let cx = -6; cx <= 6; cx += 1) for (let cy = -6; cy <= 6; cy += 1) {
      const centre = [cx, cy];
      if (!offAxes(centre)) continue;
      for (let dx = -w - near; dx <= near; dx += 1) for (let dy = -h - near; dy <= near; dy += 1) {
        // The boxes first, which an enlargement maps to boxes: most
        // placements fail on them, before any shape is built.
        const s = k === 0.5 ? 2 : 1;
        const ob = [cx + s * dx, cx + s * (dx + w), cy + s * dy, cy + s * (dy + h)];
        const ib = [cx + k * (ob[0] - cx), cx + k * (ob[1] - cx), cy + k * (ob[2] - cy), cy + k * (ob[3] - cy)];
        const corners = (b) => [[b[0], b[2]], [b[1], b[3]]];
        if (![ob, ib].every((b) => inGrid(corners(b)) && inQuadrant(corners(b)) && !inside(centre, corners(b)))) continue;
        if (!fits([...corners(ob), ...corners(ib), centre])) continue;
        const small = move(base, cx + dx, cy + dy);
        const object = k === 0.5 ? small.map(TRANSFORMS.enlarge(2, centre)) : small;
        const image = object.map(TRANSFORMS.enlarge(k, centre));
        const r = { kind: 'enlargement', k, centre, object, image };
        if (valid(r)) list.push(r);
      }
    }
    ENLARGEMENTS.set(key, list);
  }
  return ENLARGEMENTS.get(key);
}

const makeEnlargement = (factors) => {
  const k = _.sample(factors);
  for (;;) {
    const list = enlargementsOf(k, shape(k === 3 ? 2 : 3));
    if (list.length) return _.cloneDeep(_.sample(list));
  }
};

/* ------------------------------------------------------------- wording */

const lineName = (line) => (line.x !== undefined ? (line.x === 0 ? 'the y-axis' : `the line x = ${line.x}`)
  : line.y !== undefined ? (line.y === 0 ? 'the x-axis' : `the line y = ${line.y}`)
    : line.m === 1 ? 'the line y = x' : 'the line y = -x');
const lineTex = (line) => (line.x !== undefined ? `x = ${line.x}` : line.y !== undefined ? `y = ${line.y}` : line.m === 1 ? 'y = x' : 'y = -x');
// An axis drawn as a mirror needs no label: the sentence names it.
const lineLabel = (line) => (line.x === 0 || line.y === 0 ? undefined : txt(lineTex(line)));
const lineDescTex = (line) => (line.x === 0 ? '\\text{the } y\\text{-axis}' : line.y === 0 ? '\\text{the } x\\text{-axis}' : `\\text{the line } ${lineTex(line)}`);

const vecTex = ([dx, dy]) => `\\begin{pmatrix} ${dx} \\\\ ${dy} \\end{pmatrix}`;
const turnName = (angle) => (angle === 180 ? '180°' : angle === 90 ? '90° anticlockwise' : '90° clockwise');
const turnTex = (angle) => (angle === 180 ? '180^\\circ' : angle === 90 ? '90^\\circ \\text{ anticlockwise}' : '90^\\circ \\text{ clockwise}');
const kText = (k) => (k === 0.5 ? '½' : String(k));
const kTex = (k) => (k === 0.5 ? '\\frac{1}{2}' : String(k));

// The full description, as the answer to a describe question.
export function describeTex(r) {
  if (r.kind === 'translation') return `\\text{Translation by } ${vecTex(r.v)}`;
  if (r.kind === 'reflection') return `\\text{Reflection in } ${lineDescTex(r.line)}`;
  if (r.kind === 'rotation') return `\\text{Rotation } ${turnTex(r.angle)} \\text{ about } ${pt(r.centre)}`;
  return `\\text{Enlargement, scale factor } ${kTex(r.k)}, \\text{ centre } ${pt(r.centre)}`;
}

/* ------------------------------------------------------- question builders */

// Carry out: the object with vertex A lettered, the image drawn on reveal,
// the answer A'. A corner two or more squares from both axes is lettered
// when there is one, so A and A' stay clear of the numbers on the axes.
function carryOut(r, { instruction, questionMath, showMirror, showCentre }, topic, difficulty) {
  const clear = (p) => Math.abs(p[0]) >= 2 && Math.abs(p[1]) >= 2;
  const corners = _.range(r.object.length);
  const roomy = corners.filter((j) => clear(r.object[j]) && clear(r.image[j]));
  const i = _.sample(roomy.length ? roomy : corners);
  const A = r.object[i], A2 = r.image[i];
  return {
    instruction: txt(instruction),
    ...(questionMath ? { questionMath } : {}),
    answer: `A' = ${pt(A2)}`,
    workingOut: [`A = ${pt(A)}`, `A' = ${pt(A2)}`].join(NL),
    visualization: {
      type: 'transform-grid', big: true,
      shapes: [{ pts: r.object, vertex: { index: i, text: 'A' } }],
      solution: [{ pts: r.image, vertex: { index: i, text: "A'" } }],
      ...(showMirror ? { mirror: r.line, ...(lineLabel(r.line) ? { mirrorLabel: lineLabel(r.line) } : {}) } : {}),
      ...(showCentre ? { centre: r.centre } : {}),
    },
    metadata: { topic, difficulty },
  };
}

// Describe: A and B drawn; the reveal shows the mirror line or centre.
function describe(r, topic, difficulty, { instruction, answer } = {}) {
  const reveal = r.kind === 'reflection' ? { solutionMirror: r.line, ...(lineLabel(r.line) ? { solutionMirrorLabel: lineLabel(r.line) } : {}) }
    : r.kind === 'rotation' || r.kind === 'enlargement' ? { solutionCentre: r.centre } : {};
  const ans = answer ?? describeTex(r);
  return {
    instruction: instruction ?? 'Describe fully the single transformation that maps shape A onto shape B.',
    answer: ans,
    workingOut: ans,
    visualization: {
      type: 'transform-grid', big: true,
      shapes: [{ pts: r.object, name: 'A' }, { pts: r.image, name: 'B' }],
      ...reveal,
    },
    metadata: { topic, difficulty },
  };
}

const findA = 'Find the coordinates of A′.';

/* ---------------------------------------------------------- translation */
//   Foundation  in words, "3 squares right and 2 squares down": find A'
//   Core        by a column vector: find A'
//   Stretch     the column vector that translates A onto B
export const generateTranslation = (options = {}) => {
  const { difficulty = 'core' } = options;
  const topic = 'translation';
  const r = makeTranslation();
  const [dx, dy] = r.v;
  if (difficulty === 'foundation') {
    const sq = (n) => `${Math.abs(n)} square${Math.abs(n) === 1 ? '' : 's'}`;
    const parts = [dx ? `${sq(dx)} ${dx > 0 ? 'right' : 'left'}` : null, dy ? `${sq(dy)} ${dy > 0 ? 'up' : 'down'}` : null].filter(Boolean);
    return carryOut(r, { instruction: `Translate the shape ${parts.join(' and ')}. ${findA}` }, topic, difficulty);
  }
  if (difficulty === 'core') {
    return carryOut(r, { instruction: `Translate the shape by the column vector. ${findA}`, questionMath: vecTex(r.v) }, topic, difficulty);
  }
  return describe(r, topic, difficulty, { instruction: 'Write down the column vector that translates shape A onto shape B.', answer: vecTex(r.v) });
};

/* ----------------------------------------------------------- reflection */
//   Foundation  in a vertical or horizontal line, the axes among them
//   Core        in y = x or y = -x
//   Stretch     the equation of the mirror line that maps A onto B
export const generateReflection = (options = {}) => {
  const { difficulty = 'core' } = options;
  const topic = 'reflection';
  if (difficulty === 'stretch') {
    const r = makeReflection([...STRAIGHT, ...DIAGONAL]);
    return describe(r, topic, difficulty, { instruction: 'Shape A is reflected onto shape B. Write down the equation of the mirror line.', answer: lineTex(r.line) });
  }
  const r = makeReflection(difficulty === 'foundation' ? STRAIGHT : DIAGONAL);
  return carryOut(r, { instruction: `Reflect the shape in ${lineName(r.line)}. ${findA}`, showMirror: true }, topic, difficulty);
};

/* ------------------------------------------------------------- rotation */
//   Foundation  90 or 180 degrees about the origin
//   Core        about another centre, marked on the grid
//   Stretch     describe fully: angle, direction and centre
export const generateRotation = (options = {}) => {
  const { difficulty = 'core' } = options;
  const topic = 'rotation';
  if (difficulty === 'stretch') return describe(makeRotation([90, -90, 180], OFF_ORIGIN), topic, difficulty);
  const origin = difficulty === 'foundation';
  const r = makeRotation([90, -90, 180], origin ? ORIGIN : OFF_ORIGIN);
  const about = origin ? 'the origin' : pt(r.centre);
  return carryOut(r, { instruction: `Rotate the shape ${turnName(r.angle)} about ${about}. ${findA}`, showCentre: !origin }, topic, difficulty);
};

/* ---------------------------------------------------------- enlargement */
//   Foundation  scale factor 2 or 3 from a marked centre: find A'
//   Core        describe fully: scale factor and centre
//   Stretch     scale factor 1/2: carry it out, or describe one
export const generateEnlargement = (options = {}) => {
  const { difficulty = 'core' } = options;
  const topic = 'enlargement';
  const r = makeEnlargement(difficulty === 'stretch' ? [0.5] : [2, 3]);
  const carry = difficulty === 'foundation' || (difficulty === 'stretch' && Math.random() < 0.5);
  if (carry) {
    return carryOut(r, { instruction: `Enlarge the shape by scale factor ${kText(r.k)}, centre ${pt(r.centre)}. ${findA}`, showCentre: true }, topic, difficulty);
  }
  return describe(r, topic, difficulty);
};

/* -------------------------------------------- describe the transformation */
//   Foundation  translation, reflection in a vertical or horizontal line,
//               or rotation about the origin
//   Core        any of the four: centres anywhere, y = x, scale factor 2 or 3
//   Stretch     the harder case of three: y = x and y = -x, quarter turns
//               about centres off the origin, scale factor 1/2. A
//               translation has no harder case, so it stays at Core.
const DESCRIBE_KINDS = {
  foundation: [makeTranslation, () => makeReflection(STRAIGHT), () => makeRotation([90, -90, 180], ORIGIN)],
  core: [makeTranslation, () => makeReflection([...STRAIGHT, DIAGONAL[0]]), () => makeRotation([90, -90, 180], ANYWHERE), () => makeEnlargement([2, 3])],
  stretch: [() => makeReflection(DIAGONAL), () => makeRotation([90, -90], OFF_ORIGIN), () => makeEnlargement([0.5])],
};

export const generateDescribeTransformation = (options = {}) => {
  const { difficulty = 'core' } = options;
  return describe(_.sample(DESCRIBE_KINDS[difficulty])(), 'describe-transformation', difficulty);
};
