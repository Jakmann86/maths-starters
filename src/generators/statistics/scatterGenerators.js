// src/generators/statistics/scatterGenerators.js
//
// Haese Chapter 22, Two variable analysis (A correlation, B line of best fit
// by eye; the project PDF is filed as chapter 23), and Rayner 14.5. Two skills, both on the `scatter` figure, in the Scatter graphs topic:
//
//   scatter-correlation
//     foundation  positive, negative or none               "positive correlation"
//     core        with its strength, and what it means     "weak negative correlation:
//                                                           as the age increases,
//                                                           the value decreases"
//     stretch     named points: which one does not fit the trend, and the
//                 correlation of the rest                  "Leo; strong positive"
//
//   line-of-best-fit
//     foundation  read an estimate off a drawn line, x to y
//     core        the mean point (x̄, ȳ) from a table of data — the point a
//                 line of best fit is drawn through (Haese 23B)
//     stretch     read an estimate either way, then judge it: inside the data
//                 it is reliable, outside it is not (extrapolation)
//
// STRENGTH. Correlation is generated to a target r and only ever in clear
// cases: strong |r| >= 0.85, weak 0.4 <= |r| <= 0.75, none |r| < 0.2. Nothing
// falls in the gaps between, where two teachers could mark it differently.
// "Moderate" (Haese's middle word) is not used; Rayner and the Y8 sheets use
// strong and weak only.
//
// READINGS ARE EXACT. A line of best fit runs through two grid crossings, and
// a reading is only asked where the line meets another grid crossing, so the
// answer is read off the graph exactly rather than "about".
//
// The ceiling is the answers, not the questions: correlation has five possible
// descriptions. Every point cloud is drawn fresh, so the questions themselves
// rarely repeat.

import _ from 'lodash';

const NL = '\n';

/* ------------------------------------------------------------- contexts */

// Each variable: its axis (min, step, cells, a number on every `every`-th
// gridline), how it is named in a sentence, its unit, and the decimal places
// its values carry. `be` agrees with `phrase` ("sales are", "the mark is").
// A context's `dir` is the direction the relationship really goes; the cloud
// is always drawn that way.
const v = (title, phrase, be, min, step, cells, unit, dp = 0, every = 1) => ({
  title, phrase, be, min, step, cells, unit, dp, every,
});

export const SCATTER_CONTEXTS = [
  {
    items: 'days', set: (n) => `the temperature and the ice cream sales on ${n} days`, dir: 'positive',
    x: v('Temperature (°C)', 'the temperature', 'is', 10, 2, 10, { post: '°C' }),
    y: v('Sales (£)', 'the sales', 'are', 0, 25, 8, { pre: '£' }, 0, 2),
  },
  {
    items: 'students', set: (n) => `the hours of revision and the test marks of ${n} students`, dir: 'positive', people: true,
    x: v('Revision (hours)', 'the revision time', 'is', 0, 1, 10, { post: 'hours' }),
    y: v('Test mark', 'the test mark', 'is', 20, 10, 8, {}, 0, 2),
  },
  {
    items: 'students', set: (n) => `the marks of ${n} students in a maths test and a science test`, dir: 'positive', people: true,
    x: v('Maths mark', 'the maths mark', 'is', 0, 10, 10, {}, 0, 2),
    y: v('Science mark', 'the science mark', 'is', 0, 10, 8, {}, 0, 2),
  },
  {
    items: 'students', set: (n) => `the heights and arm spans of ${n} students`, dir: 'positive', people: true,
    x: v('Height (cm)', 'the height', 'is', 140, 5, 10, { post: 'cm' }, 0, 2),
    y: v('Arm span (cm)', 'the arm span', 'is', 140, 5, 8, { post: 'cm' }, 0, 2),
  },
  {
    items: 'journeys', set: (n) => `the distance and the fare of ${n} taxi journeys`, dir: 'positive',
    x: v('Distance (km)', 'the distance', 'is', 0, 2, 10, { post: 'km' }, 0, 2),
    y: v('Fare (£)', 'the fare', 'is', 0, 5, 8, { pre: '£' }, 0, 2),
  },
  {
    items: 'cars', set: (n) => `the age and the value of ${n} cars`, dir: 'negative',
    x: v('Age (years)', 'the age', 'is', 0, 1, 10, { post: 'years' }),
    y: v('Value (£)', 'the value', 'is', 0, 2000, 8, { pre: '£' }, 0, 2),
  },
  {
    items: 'days', set: (n) => `the temperature and the hot drinks sold at a café on ${n} days`, dir: 'negative',
    x: v('Temperature (°C)', 'the temperature', 'is', 0, 2, 10, { post: '°C' }),
    y: v('Hot drinks sold', 'the hot drink sales', 'are', 0, 10, 8, {}, 0, 2),
  },
  {
    items: 'students', set: (n) => `the hours of screen time and the homework marks of ${n} students`, dir: 'negative', people: true,
    x: v('Screen time (hours)', 'the screen time', 'is', 0, 2, 10, { post: 'hours' }, 0, 2),
    y: v('Homework mark', 'the homework mark', 'is', 0, 10, 8, {}, 0, 2),
  },
  {
    items: 'runners', set: (n) => `the training per week and the 5 km race time of ${n} runners`, dir: 'negative', people: true,
    x: v('Training (hours)', 'the training time', 'is', 0, 1, 10, { post: 'hours' }),
    y: v('Race time (min)', 'the race time', 'is', 16, 2, 8, { post: 'min' }, 0, 2),
  },
  {
    items: 'students', set: (n) => `the heights and the maths marks of ${n} students`, dir: 'none', people: true,
    x: v('Height (cm)', 'the height', 'is', 140, 5, 10, { post: 'cm' }, 0, 2),
    y: v('Maths mark', 'the maths mark', 'is', 0, 10, 8, {}, 0, 2),
  },
  {
    items: 'students', set: (n) => `the shoe sizes and the reading test scores of ${n} students`, dir: 'none', people: true,
    x: v('Shoe size', 'the shoe size', 'is', 2, 1, 10, {}),
    y: v('Reading score', 'the reading score', 'is', 0, 5, 8, {}, 0, 2),
  },
  {
    items: 'days', set: (n) => `the rainfall and the number of library visitors on ${n} days`, dir: 'none',
    x: v('Rainfall (mm)', 'the rainfall', 'is', 0, 2, 10, { post: 'mm' }, 0, 2),
    y: v('Visitors', 'the number of visitors', 'is', 100, 10, 8, {}, 0, 2),
  },
];

export const NAMES = ['Ana', 'Sami', 'Leo', 'Priya', 'Tomás', 'Mei', 'Kofi', 'Zara', 'Omar', 'Lucía', 'Ben', 'Yuki'];

/* -------------------------------------------------------------- helpers */

const round = (n, dp) => Number(n.toFixed(dp));
// A value as printed: no float noise, no trailing zeros except those its
// axis carries ("1.70 m" if the axis is in hundredths).
const show = (n, dp) => (dp ? n.toFixed(dp) : String(Math.round(n)));
const withUnit = (n, axis) => {
  const s = show(n, axis.dp);
  if (axis.unit.pre) return `${axis.unit.pre}${s}`;
  if (axis.unit.post) return `${s} ${axis.unit.post}`;
  return s;
};
// For the answer, which goes through the renderer: £ inside \text, a unit
// after the number as answerUnits.
const answerOf = (n, axis) => {
  const s = show(n, axis.dp);
  if (axis.unit.pre) return { answer: `\\text{${axis.unit.pre}${s}}` };
  if (axis.unit.post) return { answer: s, answerUnits: `\\text{${axis.unit.post}}` };
  return { answer: s };
};

// Cell coordinates <-> values. u runs 0..x.cells, v runs 0..y.cells.
const xv = (c, u) => round(c.x.min + u * c.x.step, c.x.dp + 2);
const yv = (c, w) => round(c.y.min + w * c.y.step, c.y.dp + 2);

export function pearson(pts) {
  const mx = _.meanBy(pts, 'x'), my = _.meanBy(pts, 'y');
  let sxy = 0, sxx = 0, syy = 0;
  pts.forEach((p) => { sxy += (p.x - mx) * (p.y - my); sxx += (p.x - mx) ** 2; syy += (p.y - my) ** 2; });
  return sxx && syy ? sxy / Math.sqrt(sxx * syy) : 0;
}

const axisOf = (a) => ({ min: a.min, max: round(a.min + a.cells * a.step, 6), step: a.step, every: a.every, title: a.title });

const scatterFig = (c, pts, extra = {}) => ({
  type: 'scatter',
  xAxis: axisOf(c.x),
  yAxis: axisOf(c.y),
  points: pts,
  big: true,
  ...extra,
});

// Points spread across the plot, never on top of one another: at least
// `gap` cells apart, and inside the frame. Each point is snapped to the
// values its axes carry (whole years, whole marks) BEFORE it is spaced: on an
// axis in whole years the rounding alone moves a cross up to half a cell, so
// spacing the unrounded points let two crosses land half a cell apart.
// Returns the snapped values.
function spaced(c, n, draw, gap = 0.7) {
  const cells = { x: c.x.cells, y: c.y.cells };
  const snap = ({ u, w }) => {
    const x = round(xv(c, u), c.x.dp), y = round(yv(c, w), c.y.dp);
    return { x, y, u: (x - c.x.min) / c.x.step, w: (y - c.y.min) / c.y.step };
  };
  for (let tries = 0; tries < 200; tries += 1) {
    const out = [];
    for (let k = 0; k < n * 30 && out.length < n; k += 1) {
      const p = snap(draw(out.length));
      if (p.u < 0.5 || p.u > cells.x - 0.5 || p.w < 0.4 || p.w > cells.y - 0.4) continue;
      if (out.some((q) => Math.hypot(q.u - p.u, q.w - p.w) < gap)) continue;
      out.push(p);
    }
    if (out.length === n) return out.map(({ x, y }) => ({ x, y }));
  }
  return null;
}

// A cloud with correlation in the target band. Values are rounded to what
// the axis carries before r is measured, so r is the r of what is drawn.
const BANDS = {
  strong: { lo: 0.85, hi: 1, sd: [0.25, 0.45] },
  weak: { lo: 0.4, hi: 0.75, sd: [1.0, 1.6] },
  none: { lo: 0, hi: 0.2 },
};

function cloud(c, n, sign, strength, gap) {
  const cells = { x: c.x.cells, y: c.y.cells };
  const band = BANDS[strength];
  for (;;) {
    let draw;
    if (strength === 'none') {
      draw = () => ({ u: _.random(0.5, cells.x - 0.5, true), w: _.random(0.6, cells.y - 0.6, true) });
    } else {
      // A trend from one corner region to the other, kept off the frame.
      const lo = _.random(0.8, 1.8, true), hi = cells.y - _.random(0.8, 1.8, true);
      const [w0, w1] = sign > 0 ? [lo, hi] : [hi, lo];
      const sd = _.random(band.sd[0], band.sd[1], true);
      // One point to each of n equal strips across the x range, jittered
      // within its strip: spread like real data, and fast to space out.
      const strip = (cells.x - 1.2) / n;
      draw = (k) => {
        const u = 0.6 + strip * (k + _.random(0.15, 0.85, true));
        const g = (Math.random() + Math.random() + Math.random() - 1.5) * 2 * sd;
        return { u, w: w0 + ((w1 - w0) * u) / cells.x + g };
      };
    }
    const pts = spaced(c, n, draw, gap);
    if (!pts) continue;
    const r = pearson(pts);
    if (Math.abs(r) < band.lo || Math.abs(r) > band.hi) continue;
    if (strength !== 'none' && Math.sign(r) !== sign) continue;
    return pts;
  }
}

const describe = (strength, sign) => (
  strength === 'none' ? 'no correlation' : `${strength} ${sign > 0 ? 'positive' : 'negative'} correlation`
);

/* --------------------------------------------------- scatter-correlation */

export const generateScatterCorrelation = (options = {}) => {
  const { difficulty = 'core' } = options;
  if (difficulty === 'stretch') return correlationStretch();
  return correlationFoundationCore(difficulty);
};

function correlationFoundationCore(difficulty) {
  const c = _.sample(SCATTER_CONTEXTS);
  const sign = c.dir === 'positive' ? 1 : c.dir === 'negative' ? -1 : 0;
  // Foundation is always clear-cut: strong, or none.
  const strength = sign === 0 ? 'none' : difficulty === 'foundation' ? 'strong' : _.sample(['strong', 'weak']);
  const n = _.random(10, 14);
  const pts = cloud(c, n, sign, strength);

  const word = sign === 0 ? 'no correlation' : `${sign > 0 ? 'positive' : 'negative'} correlation`;
  const full = describe(strength, sign);
  const answer = difficulty === 'foundation'
    ? `\\text{${word}}`
    : [full, ...meaning(c, sign)].map((l) => `\\text{${l}}`).join(NL);
  return {
    instruction: `The scatter graph shows ${c.set(n)}.`,
    questionText: difficulty === 'foundation'
      ? 'Describe the correlation.'
      : 'Describe the correlation, and say what it means.',
    answer,
    workingOut: `r = ${pearson(pts).toFixed(2)}`,
    visualization: scatterFig(c, pts),
    metadata: { topic: 'scatter-correlation', difficulty },
  };
}

// What the correlation means, as the Y8 sheet's sentence frame has it: "As
// the ___ increases, the ___ increases/decreases." Broken at the comma, because
// an answer line does not wrap and the whole sentence runs off the slot.
function meaning(c, sign) {
  if (sign === 0) return ['there is no relationship'];
  const verb = (up, axis) => `${up ? 'increase' : 'decrease'}${axis.be === 'are' ? '' : 's'}`;
  return [`as ${c.x.phrase} ${verb(true, c.x)},`, `${c.y.phrase} ${verb(sign > 0, c.y)}`];
}

// Named points, one of which sits well off a strong trend. The rest have to
// be strongly correlated on their own, and the odd one out has to be the only
// point a class could pick: its distance from the line through the others is
// at least 2.5 cells and four times anyone else's.
function correlationStretch() {
  const c = _.sample(SCATTER_CONTEXTS.filter((k) => k.people && k.dir !== 'none'));
  const sign = c.dir === 'positive' ? 1 : -1;
  const n = _.random(7, 8);
  for (;;) {
    // A name is about a cell and a half wide, so named points sit further
    // apart than plain crosses do.
    const rest = cloud(c, n - 1, sign, 'strong', 1.4);
    const fit = leastSquares(rest);
    // The odd one out: well away from the line, inside the frame, clear of
    // the other crosses.
    const u = _.random(1.5, c.x.cells - 1.5, true);
    const x = round(xv(c, u), c.x.dp);
    const lineY = fit.a + fit.b * x;
    const off = (_.random(0, 1) ? 1 : -1) * _.random(3, 4.5, true) * c.y.step;
    const y = round(lineY + off, c.y.dp);
    if (y < c.y.min + 0.4 * c.y.step || y > c.y.min + (c.y.cells - 0.4) * c.y.step) continue;
    const cellDist = (p, q) => Math.hypot((p.x - q.x) / c.x.step, (p.y - q.y) / c.y.step);
    const odd = { x, y };
    if (rest.some((p) => cellDist(p, odd) < 1.4)) continue;
    // Equal x or y would let a name sit on a gridline with another — fine —
    // but two named points on exactly the same spot cannot be told apart.
    // The odd one out has to be the only answer: at least 2.5 cells off the
    // line through the others and twice as far off as any of them, and
    // leaving out anyone else gives a weaker fit than leaving it out.
    const cell = (p) => ({ x: (p.x - c.x.min) / c.x.step, y: (p.y - c.y.min) / c.y.step });
    const cr = rest.map(cell), co = cell(odd);
    const L = leastSquares(cr);
    const res = (p) => Math.abs(p.y - (L.a + L.b * p.x));
    if (res(co) < 2.5 || res(co) < 2.2 * Math.max(...cr.map(res))) continue;
    const rRest = Math.abs(pearson(cr));
    if (cr.some((_p, i) => Math.abs(pearson([...cr.filter((_q, j) => j !== i), co])) >= rRest - 0.02)) continue;
    const names = _.sampleSize(NAMES, n);
    const all = _.shuffle([...rest, odd]);
    const oddIdx = all.indexOf(odd);
    const pts = all.map((p, i) => ({ ...p, name: names[i] }));
    const oddName = names[oddIdx];

    const fullRest = describe('strong', sign);
    return {
      instruction: `The scatter graph shows ${c.set(n)}.`,
      questionText: `Which ${singular(c.items)} does not fit the trend? Describe the correlation for the others.`,
      answer: `\\text{${oddName}}${NL}\\text{${fullRest}}`,
      workingOut: `\\text{without ${oddName}: } r = ${pearson(rest).toFixed(2)}`,
      visualization: scatterFig(c, pts, { highlight: oddName }),
      metadata: { topic: 'scatter-correlation', difficulty: 'stretch' },
    };
  }
}

const singular = (items) => ({ students: 'student', runners: 'runner' }[items] ?? items);

function leastSquares(pts) {
  const mx = _.meanBy(pts, 'x'), my = _.meanBy(pts, 'y');
  let sxy = 0, sxx = 0;
  pts.forEach((p) => { sxy += (p.x - mx) * (p.y - my); sxx += (p.x - mx) ** 2; });
  const b = sxy / sxx;
  return { a: my - b * mx, b };
}

/* ------------------------------------------------------ line-of-best-fit */

export const generateLineOfBestFit = (options = {}) => {
  const { difficulty = 'core' } = options;
  if (difficulty === 'core') return meanPoint();
  return readLine(difficulty);
};

// A line through two grid crossings, with points scattered about it. The
// gradient is p cells up (or down) for every q across, so the line meets a
// grid crossing every q cells; readings are only asked at those crossings.
function lineAndPoints(c, sign) {
  for (;;) {
    const q = _.sample([2, 4, 5]);
    const p = _.random(1, 3);
    const steps = Math.floor(c.x.cells / q);
    // The line over the whole x range has to stay inside the plot, with a
    // cell of room top and bottom.
    const rise = (p * c.x.cells) / q;
    if (rise > c.y.cells - 1) continue;
    const v0 = sign > 0 ? _.random(0, Math.floor(c.y.cells - rise)) : _.random(Math.ceil(rise), c.y.cells);
    const at = (u) => v0 + sign * (p * u) / q;
    if (at(0) < 0 || at(0) > c.y.cells || at(c.x.cells) < 0 || at(c.x.cells) > c.y.cells) continue;

    // The data occupy a stretch of the x range, so some crossings fall
    // inside it and some outside.
    const u0 = _.random(1, 3), u1 = c.x.cells - _.random(1, 3);
    const n = _.random(9, 12);
    const draw = () => {
      const u = _.random(u0, u1, true);
      const g = (Math.random() + Math.random() + Math.random() - 1.5) * 0.9;
      return { u, w: at(u) + g };
    };
    const pts = spaced(c, n, draw);
    if (!pts) continue;
    if (Math.abs(pearson(pts)) < 0.85) continue;
    // A fair line: about as many points above as below, and close to the
    // mean point (Haese 23B's two rules for a line by eye).
    const lineAt = (x) => c.y.min + at((x - c.x.min) / c.x.step) * c.y.step;
    // A point exactly on the line is neither; the tolerance keeps float
    // noise from calling it one or the other.
    const above = pts.filter((pt) => pt.y > lineAt(pt.x) + 1e-9).length;
    const below = pts.filter((pt) => pt.y < lineAt(pt.x) - 1e-9).length;
    if (Math.abs(above - below) > 2) continue;
    const mx = _.meanBy(pts, 'x'), my = _.meanBy(pts, 'y');
    if (Math.abs(my - lineAt(mx)) > 0.4 * c.y.step) continue;
    // And it slopes about as the data do: within 0.3 of a cell per cell of
    // the least-squares gradient, so the line drawn is one a class would draw.
    const toCells = (b) => (b * c.x.step) / c.y.step;
    if (Math.abs(toCells(leastSquares(pts).b) - (sign * p) / q) > 0.3) continue;

    const crossings = _.range(0, steps + 1).map((k) => k * q).filter((u) => u >= 1 && u <= c.x.cells - 1);
    const dataLo = _.minBy(pts, 'x').x, dataHi = _.maxBy(pts, 'x').x;
    return {
      pts, crossings, dataLo, dataHi,
      line: [[xv(c, 0), yv(c, at(0))], [xv(c, c.x.cells), yv(c, at(c.x.cells))]],
      read: (u) => ({ x: xv(c, u), y: yv(c, at(u)) }),
    };
  }
}

function readLine(difficulty) {
  // Decided before the loop: a cloud with no crossing outside the data is
  // redrawn, not turned into an inside question, or extrapolation came up
  // about one time in seven instead of one in two.
  const wantInside = difficulty === 'foundation' || _.random(0, 1) === 1;
  for (;;) {
    const c = _.sample(SCATTER_CONTEXTS.filter((k) => k.dir !== 'none'));
    const sign = c.dir === 'positive' ? 1 : -1;
    const L = lineAndPoints(c, sign);
    const step = c.x.step;
    // Clearly inside the data or clearly outside it: a cell's margin either
    // way, so "reliable" is never a judgement call at the edge.
    const inside = L.crossings.filter((u) => xv(c, u) >= L.dataLo + step && xv(c, u) <= L.dataHi - step);
    const outside = L.crossings.filter((u) => xv(c, u) <= L.dataLo - step || xv(c, u) >= L.dataHi + step);

    const reliable = wantInside;
    const pool = reliable ? inside : outside;
    if (!pool.length) continue;
    const u = _.sample(pool);
    const r = L.read(u);
    // A reading of 0 on an axis that starts at 0 is the corner of the graph,
    // not a reading.
    if (r.y === c.y.min) continue;
    // Where the line crosses y = x (height and arm span share a scale), the
    // estimate would be the number in the question.
    if (show(r.x, c.x.dp) === show(r.y, c.y.dp)) continue;
    const fromY = difficulty === 'stretch' && _.random(0, 1) === 1;
    const given = fromY ? withUnit(r.y, c.y) : withUnit(r.x, c.x);
    // Foundation names the line; at Stretch it is drawn and the question is
    // long enough already.
    const lead = difficulty === 'foundation' ? 'Use the line of best fit to estimate' : 'Estimate';
    const ask = fromY
      ? `${lead} ${c.x.phrase} when ${c.y.phrase} ${c.y.be} ${given}.`
      : `${lead} ${c.y.phrase} when ${c.x.phrase} ${c.x.be} ${given}.`;
    const value = fromY ? r.x : r.y;
    const axis = fromY ? c.x : c.y;
    const out = answerOf(value, axis);

    const fig = scatterFig(c, L.pts, { line: L.line, reading: { x: r.x, y: r.y, from: fromY ? 'y' : 'x' } });
    const n = L.pts.length;
    if (difficulty === 'foundation') {
      return {
        instruction: `The scatter graph shows ${c.set(n)}.`,
        questionText: ask,
        ...out,
        workingOut: `\\text{read from } ${fromY ? 'y' : 'x'} = ${show(fromY ? r.y : r.x, fromY ? c.y.dp : c.x.dp)} \\text{ to the line}`,
        visualization: fig,
        metadata: { topic: 'line-of-best-fit', difficulty },
      };
    }
    const lo = show(L.dataLo, c.x.dp), hi = show(L.dataHi, c.x.dp);
    // Interpolation and extrapolation are the Y9 scheme's words (Unit 4 L18).
    const verdict = reliable
      ? 'reliable (interpolation)'
      : 'not reliable (extrapolation)';
    // The units sit inside the answer here, ahead of the verdict, so
    // answerUnits is not used.
    const valueTex = out.answerUnits ? `${out.answer}\\text{ ${axis.unit.post}}` : out.answer;
    return {
      instruction: `The scatter graph shows ${c.set(n)}.`,
      questionText: `${ask} Is this reliable?`,
      answer: `${valueTex}${NL}\\text{${verdict}}`,
      workingOut:
        `\\text{${c.x.phrase}: data from } ${lo} \\text{ to } ${hi}${NL}` +
        `x = ${show(r.x, c.x.dp)} \\text{ is ${reliable ? 'inside' : 'outside'} that range}`,
      visualization: fig,
      metadata: { topic: 'line-of-best-fit', difficulty },
    };
  }
}

// Haese 23B: the mean point, from a table. Both means come out whole.
function meanPoint() {
  for (;;) {
    // Small whole numbers only: the means are found by hand, and a row of
    // car values (11831, 10975, ...) is a long division, not a starter.
    const c = _.sample(SCATTER_CONTEXTS.filter((k) => k.dir !== 'none' && k.x.dp === 0 && k.y.dp === 0 && k.y.step < 100));
    const n = _.random(5, 7);
    const sign = c.dir === 'positive' ? 1 : -1;
    const pts = cloud(c, n, sign, 'strong');
    // Whole-number data, as a table prints it.
    const xs = pts.map((p) => Math.round(p.x)), ys = pts.map((p) => Math.round(p.y));
    if (_.sum(xs) % n || _.sum(ys) % n) continue;
    if (new Set(xs).size < n) continue;
    const mx = _.sum(xs) / n, my = _.sum(ys) / n;
    const head = (a) => a.title;
    return {
      instruction: `The table shows ${c.set(n)}.`,
      questionText: 'Find the mean point, which the line of best fit should pass through.',
      answer: `(${mx}, ${my})`,
      workingOut:
        `\\bar{x} = \\frac{${xs.join(' + ')}}{${n}} = ${mx}${NL}` +
        `\\bar{y} = \\frac{${ys.join(' + ')}}{${n}} = ${my}`,
      visualization: {
        type: 'table',
        header: 'column',
        big: true,
        rows: [[head(c.x), ...xs.map(String)], [head(c.y), ...ys.map(String)]],
      },
      metadata: { topic: 'line-of-best-fit', difficulty: 'core' },
    };
  }
}
