// Graphs of functions — Haese 20F, 23A, 23D and 28B.
//
//   transforming-graphs   20F  g(x) in terms of f(x), from both graphs
//   cubic-graphs          23A  a cubic's intercepts, and its equation
//   tangent-gradient      23D  the gradient of a curve, from its tangent
//   exponential-graphs    28B  values, then the equation from a graph
//
// Every graph is a `coordinate-grid` with a `window`, to scale like every
// coordinate-grid: anything the question reads off sits on a gridline.
// Each curve is built from its answer (a vertex, roots, a gradient, k and
// c), so every printed number is whole and every answer exact.

import _ from 'lodash';

const NL = '\n';

const nonZero = (lo, hi) => { for (;;) { const n = _.random(lo, hi); if (n) return n; } };
const signed = (n) => (n < 0 ? `- ${-n}` : `+ ${n}`);
/** (x - r), or x when r is 0. */
const factor = (r) => (r === 0 ? 'x' : `(x ${r < 0 ? '+' : '-'} ${Math.abs(r)})`);
const pt = (x, y) => `(${x}, ${y})`;
/** A point's coordinates for a figure label, which is plain text: a real minus. */
const ptLabel = (x, y) => pt(x, y).replace(/-(?=\d)/g, '−');

/** A square-ish window covering every x and y given, padded by one. */
function windowFor(xs, ys, min = 6) {
  let x0 = Math.floor(Math.min(...xs)) - 1;
  let x1 = Math.ceil(Math.max(...xs)) + 1;
  let y0 = Math.floor(Math.min(...ys)) - 1;
  let y1 = Math.ceil(Math.max(...ys)) + 1;
  x0 = Math.min(x0, -1); x1 = Math.max(x1, 1); y0 = Math.min(y0, -1); y1 = Math.max(y1, 1);
  while (x1 - x0 < min) { x0 -= 1; x1 += 1; }
  while (y1 - y0 < min) { y0 -= 1; y1 += 1; }
  return [x0, x1, y0, y1];
}

/* ------------------------------------------------ 20F transforming graphs */
//   Foundation  a translation one way: f(x) + k, or f(x - h)
//   Core        a reflection in the x-axis, -f(x), or a stretch, 2f(x)
//   Stretch     two at once: f(x - h) + k, or -f(x) + k
//
// f is a parabola (x - p)^2 + q, drawn in ink and labelled f; g, its image,
// is drawn in the slot colour and labelled g. A parabola is symmetric, so
// f(-x) would be a translation of it and is left out: every g here has one
// right answer.

/** a(x - h)^2 + k as { a, b, c }. */
const parabola = (a, h, k) => ({ a, b: -2 * a * h, c: a * h * h + k });

/**
 * Where to write f and g. Each label goes beside one arm of its parabola,
 * 0.6 out from a point a little way up (or down) it from the vertex. Of the
 * ways to choose an arm and a height for each, the one whose labels sit
 * furthest from everything they could be misread against: the other label,
 * the other curve, the axes and their numbers, and the edge of the grid.
 * Null when none is clear, and the question is drawn again.
 */
function labelSpots([x0, x1, y0, y1], curves) {
  const quad = ([a, h, k], x) => a * (x - h) ** 2 + k;
  const options = ([a, h, k]) => [2.25, 1.5, 3].flatMap((rise) => [-1, 1].map((side) => {
    const dx = Math.sqrt(rise / Math.abs(a));
    return [h + side * (dx + 0.6), k + Math.sign(a) * rise];
  }));
  // Slack, in grid units, between a label and what it must keep clear of:
  // negative is a clash.
  const slack = ([x, y], other) => Math.min(
    Math.abs(y - quad(other, x)) - 0.6,
    x > 0 ? x - 0.5 : -x - 0.9, // the y-axis, its numbers to its left
    y > 0 ? y - 0.45 : -y - 1, // the x-axis, its numbers below
    x - x0 - 0.3, x1 - x - 0.3, y - y0 - 0.4, y1 - y - 0.4,
  );
  let best = null;
  options(curves[0]).forEach((s0) => options(curves[1]).forEach((s1) => {
    const worst = Math.min(slack(s0, curves[1]), slack(s1, curves[0]), Math.hypot(s0[0] - s1[0], s0[1] - s1[1]) - 1.2);
    if (worst >= 0 && (!best || worst > best.worst)) best = { worst, spots: [s0, s1] };
  }));
  return best && best.spots;
}

export const generateTransformingGraphs = (options = {}) => {
  const { difficulty = 'core' } = options;
  const topic = 'transforming-graphs';
  for (;;) {
    const p = _.random(-2, 2), q = _.random(-3, 1);
    let kind, h = 0, k = 0, a = 1;
    if (difficulty === 'foundation') {
      kind = _.sample(['up', 'across']);
      if (kind === 'up') k = nonZero(-4, 4); else h = nonZero(-3, 3);
    } else if (difficulty === 'core') {
      kind = _.sample(['reflect', 'stretch']);
      a = kind === 'reflect' ? -1 : 2;
    } else {
      kind = _.sample(['both', 'reflect-up']);
      if (kind === 'both') { h = nonZero(-3, 3); k = nonZero(-4, 4); } else { a = -1; k = nonZero(-4, 4); }
    }
    // g(x) = a·f(x - h) + k, so its vertex is (p + h, a·q + k).
    const [gp, gq] = [p + h, a * q + k];
    const ys = [q, q + 4, gq, gq + 4 * a];
    const win = windowFor([p - 2, p + 2, gp - 2, gp + 2], ys);
    if (win[1] - win[0] > 12 || win[3] - win[2] > 12) continue;
    // The two vertices apart, so the two curves are told apart.
    if (Math.hypot(gp - p, gq - q) < 2) continue;
    const inside = (h === 0 ? 'x' : `x ${signed(-h)}`);
    const body = `${a === -1 ? '-' : a === 2 ? '2' : ''}f(${inside})${k ? ` ${signed(k)}` : ''}`;
    const answer = `g(x) = ${body}`;
    const say = {
      up: `\\text{translated ${k > 0 ? 'up' : 'down'} } ${Math.abs(k)}`,
      across: `\\text{translated ${h > 0 ? 'right' : 'left'} } ${Math.abs(h)}`,
      reflect: '\\text{reflected in the } x\\text{-axis}',
      stretch: '\\text{stretched from the } x\\text{-axis, scale factor } 2',
      both: `\\text{translated ${h > 0 ? 'right' : 'left'} } ${Math.abs(h)} \\text{ and ${k > 0 ? 'up' : 'down'} } ${Math.abs(k)}`,
      'reflect-up': `\\text{reflected in the } x\\text{-axis, then translated ${k > 0 ? 'up' : 'down'} } ${Math.abs(k)}`,
    }[kind];
    const f = parabola(1, p, q);
    const g = parabola(a, gp, gq);
    const spot = labelSpots(win, [[1, p, q], [a, gp, gq]]);
    if (!spot) continue;
    return {
      instruction: 'Write g(x) in terms of f(x)',
      answer,
      workingOut: [`\\text{vertex } ${pt(p, q)} \\to ${pt(gp, gq)}`, say, answer].join(NL),
      visualization: {
        type: 'coordinate-grid', big: true, window: win,
        curves: [
          { ...f, ink: true, label: 'f', labelAt: spot[0] },
          { ...g, label: 'g', labelAt: spot[1] },
        ],
      },
      metadata: { topic, difficulty },
    };
  }
};

/* ------------------------------------------------------ 23A cubic graphs */
//   Foundation  y = (x - p)(x - q)(x - r): where it meets the axes
//   Core        y = a(x - p)^2(x - q): the same, and where it touches
//   Stretch     the graph, with its x-intercepts and y-intercept marked:
//               the equation, a found from the y-intercept (Haese
//               Example 2)

/** a(x - p)(x - q)(x - r) as [a, b, c, d] for ax^3 + bx^2 + cx + d. */
const expandCubic = (a, p, q, r) => [a, -a * (p + q + r), a * (p * q + q * r + r * p), -a * p * q * r];
const lead = (a) => (a === 1 ? '' : a === -1 ? '-' : a === 0.5 ? '\\frac{1}{2}' : a === -0.5 ? '-\\frac{1}{2}' : String(a));
/** The factors, x first when a root is 0, then in order of the roots. */
const factors = (roots) => _.sortBy(roots, (r) => (r === 0 ? -Infinity : r)).map(factor).join('');
/** A factor with 0 put in for x: (0 - 3), or (0) where the factor is x. */
const atZero = (r) => (r === 0 ? '(0)' : `(0 ${r > 0 ? '-' : '+'} ${Math.abs(r)})`);

export const generateCubicGraphs = (options = {}) => {
  const { difficulty = 'core' } = options;
  const topic = 'cubic-graphs';

  if (difficulty !== 'stretch') {
    for (;;) {
      const core = difficulty === 'core';
      const a = core ? _.sample([1, 1, -1, 2, -2]) : 1;
      const roots = core ? (() => { const [p, q] = _.sampleSize(_.range(-4, 5), 2); return [p, p, q]; })() : _.sampleSize(_.range(-5, 6), 3);
      const d = expandCubic(a, ...roots)[3];
      const xs = _.sortBy(_.uniq(roots));
      const touch = core ? roots[0] : null;
      const cut = core ? roots[2] : null;
      // The y-intercept worked out only where it is not simply a root at 0.
      const square = touch === 0 ? 'x^2' : `${factor(touch)}^2`;
      // x leads when it is a factor of its own, as everywhere on the board.
      const eq = core
        ? `y = ${lead(a)}${cut === 0 ? `x${square}` : `${square}${factor(cut)}`}`
        : `y = ${factors(roots)}`;
      const sub = core
        ? `${lead(a)}${cut === 0 ? `(0)${atZero(touch)}^2` : `${atZero(touch)}^2${atZero(cut)}`}`
        : _.sortBy(roots, (r) => (r === 0 ? -Infinity : r)).map(atZero).join('');
      // A negative number straight after a word is braced, so it reads as
      // minus four, not as a subtraction.
      const n = (v) => (v < 0 ? `{${v}}` : String(v));
      const answer = core
        ? `\\text{touches at } x = ${touch}, \\ \\text{cuts at } x = ${cut}; \\ y\\text{-intercept } ${n(d)}`
        : `x\\text{-intercepts } ${xs.map(n).join(', ')}; \\ y\\text{-intercept } ${n(d)}`;
      return {
        instruction: core ? 'Where does the graph of this cubic meet each axis? Where does it touch the x-axis?' : 'Where does the graph of this cubic meet each axis?',
        questionMath: eq,
        answer,
        workingOut: [
          `y = 0: \\ x = ${xs.join(', ')}`,
          `x = 0: \\ y = ${sub} = ${d}`,
          answer,
        ].join(NL),
        metadata: { topic, difficulty },
      };
    }
  }

  for (;;) {
    const a = _.sample([1, -1, 2, -2, 0.5, -0.5]);
    const roots = _.sortBy(_.sampleSize([-4, -3, -2, -1, 1, 2, 3, 4], 3));
    const coef = expandCubic(a, ...roots);
    const d = coef[3];
    if (!Number.isInteger(d) || Math.abs(d) > 5 || d === 0) continue;
    // Taller than wide draws every square too small: the curve is clipped
    // top and bottom, as any graph is, and the intercepts stay on screen.
    const win = [Math.min(-1, roots[0] - 1), Math.max(1, roots[2] + 1), -6, 6];
    if (win[1] - win[0] > 10) continue;
    // The y-intercept's label right of the axis, clear of its numbers, and
    // on the side the curve leaves empty: below it where the curve climbs.
    const up = coef[2] > 0 ? -1 : 1;
    if (up === 1 && d === -1) continue; // up from -1 is onto the x-axis numbers
    const answer = `y = ${lead(a)}${factors(roots)}`;
    return {
      instruction: 'Find the equation of the cubic, in factorised form',
      answer,
      workingOut: [
        `y = a${factors(roots)}`,
        `x = 0: \\ ${d} = a${roots.map((r) => `(${-r})`).join('')}`,
        `${d} = ${-roots[0] * -roots[1] * -roots[2]}a, \\ a = ${lead(a) === '' ? '1' : lead(a) === '-' ? '-1' : lead(a)}`,
        answer,
      ].join(NL),
      visualization: {
        type: 'coordinate-grid', big: true, window: win,
        curves: [{ cubic: coef }],
        points: [...roots.map((r) => ({ x: r, y: 0 })), { x: 0, y: d, label: ptLabel(0, d), labelDir: [1, up] }],
      },
      metadata: { topic, difficulty },
    };
  }
};

/* ------------------------------------------------ 23D gradient of a curve */
//   Foundation  the tangent at P drawn: a positive whole-number gradient,
//               read off the grid
//   Core        the same, the gradient negative or a half
//   Stretch     the equation of the tangent, y = mx + c
//
// The curve is a parabola, in ink, through P on a gridline crossing; the
// tangent is in the slot colour, and a second point on it, Q, sits on a
// gridline crossing too, so the gradient can be counted as rise over run.

/**
 * Whether a point's letter, at corner dir of the point, would land on an
 * axis or its numbers: a point on an axis; one square right of the y-axis
 * with its letter to the left, or one left with it to the right; one square
 * below the x-axis with its letter above.
 */
const labelClash = (x, y, [ux, uy]) => x === 0 || y === 0 || (ux === -1 && x === 1) || (ux === 1 && x === -1) || (uy === 1 && y === -1);

export const generateTangentGradient = (options = {}) => {
  const { difficulty = 'core' } = options;
  const topic = 'tangent-gradient';
  for (;;) {
    // Built from the answer: P, the gradient there and how sharply the curve
    // bends (a), then b and c to fit. Only P, Q and the gradient are read,
    // so b and c need not be whole.
    const a = _.sample([1, -1, 0.5, -0.5, 0.25, -0.25]);
    const x0 = _.random(-3, 3), y0 = _.random(-3, 3);
    const m = {
      foundation: () => _.random(1, 3),
      core: () => (Math.random() < 0.5 ? -_.random(1, 3) : nonZero(-5, 5) / 2),
      stretch: () => (Math.random() < 0.5 ? nonZero(-3, 3) : nonZero(-5, 5) / 2),
    }[difficulty]();
    const b = m - 2 * a * x0;
    const c = y0 - a * x0 * x0 - b * x0;
    const half = !Number.isInteger(m);
    if (difficulty === 'core' && !half && m > 0) continue;
    if (Math.abs(m) > 3) continue;
    const run = half ? 2 : 1;
    const Q = [x0 + run, y0 + m * run];
    // P's and Q's letters on the far side of the tangent from the curve, so
    // neither sits on a line; and the points placed so neither letter lands
    // on an axis or its numbers.
    const dir = a > 0 ? [Math.sign(m), -1] : [-Math.sign(m), 1];
    if ([[x0, y0], Q].some(([x, y]) => labelClash(x, y, dir))) continue;
    const cInt = y0 - m * x0;
    const win = windowFor([x0 - 2, x0 + 2, Q[0]], [y0 - 2, y0 + 2, Q[1]]);
    if (win[1] - win[0] > 10 || win[3] - win[2] > 10) continue;
    const mTex = half ? `${m < 0 ? '-' : ''}\\frac{${Math.abs(2 * m)}}{2}` : String(m);
    const grad = [`m = \\frac{${Q[1]} - ${y0 < 0 ? `(${y0})` : y0}}{${Q[0]} - ${x0 < 0 ? `(${x0})` : x0}} = ${mTex}`];
    const line = `y = ${Math.abs(m) === 1 ? (m < 0 ? '-' : '') : mTex}x${cInt ? ` ${signed(cInt)}` : ''}`;
    const stretch = difficulty === 'stretch';
    if (stretch && !Number.isInteger(cInt)) continue;
    return {
      instruction: stretch ? 'The line is the tangent to the curve at P. Find its equation' : 'The line is the tangent to the curve at P. Find the gradient of the curve at P',
      answer: stretch ? line : mTex,
      workingOut: (stretch
        ? [...grad, `${y0} = ${mTex} \\times ${x0 < 0 ? `(${x0})` : x0} + c, \\ c = ${cInt}`, line]
        : grad).join(NL),
      visualization: {
        type: 'coordinate-grid', big: true, window: win,
        curves: [{ a, b, c, ink: true }],
        lines: [{ m, c: cInt }],
        points: [{ x: x0, y: y0, label: 'P', labelDir: dir }, { x: Q[0], y: Q[1], label: 'Q', labelDir: dir }],
      },
      metadata: { topic, difficulty },
    };
  }
};

/* -------------------------------------------------- 28B exponential graphs */
//   Foundation  f(x) = k·b^x + c at a whole x from 0 to 3
//   Core        the same at a negative x, a fraction (Haese Example 3c)
//   Stretch     the graph of y = k·b^x + c with its asymptote dashed and its
//               y-intercept marked: k and c (Haese 28B Q5: the y-intercept
//               and the horizontal asymptote)

const fracTex = (n, d) => (d === 1 ? String(n) : n < 0 ? `-\\frac{${-n}}{${d}}` : `\\frac{${n}}{${d}}`);
const gcd = (x, y) => { x = Math.abs(x); y = Math.abs(y); while (y) [x, y] = [y, x % y]; return x; };
const expTex = (k, b, c) => `${k === 1 ? '' : `${k} \\times `}${b}^x${c ? ` ${signed(c)}` : ''}`;

export const generateExponentialGraphs = (options = {}) => {
  const { difficulty = 'core' } = options;
  const topic = 'exponential-graphs';

  if (difficulty !== 'stretch') {
    const b = _.sample([2, 3, 4, 5]);
    const k = _.sample([1, 1, 2, 3]);
    const c = _.random(-5, 5);
    const n = difficulty === 'foundation' ? _.random(0, 3) : -_.random(1, b > 3 ? 2 : 3);
    // k·b^n + c as an exact fraction over b^|n|.
    const den = n < 0 ? b ** -n : 1;
    const num = n < 0 ? k + c * den : k * b ** n + c;
    const g = gcd(num, den) || 1;
    const value = fracTex(num / g, den / g);
    const power = n < 0 ? `\\frac{1}{${den}}` : String(b ** n);
    return {
      instruction: 'Find the value',
      questionMath: `f(x) = ${expTex(k, b, c)}${NL}f(${n})`,
      answer: `f(${n}) = ${value}`,
      workingOut: [
        `f(${n}) = ${k === 1 ? '' : `${k} \\times `}${b}^{${n}}${c ? ` ${signed(c)}` : ''}`,
        `= ${k === 1 ? '' : `${k} \\times `}${power}${c ? ` ${signed(c)}` : ''}`,
        `= ${value}`,
        // f(x) = b^x alone has nothing left to combine: its evaluated power is
        // already the value, so that line is printed once.
      ].filter((l, i, all) => i === 0 || l !== all[i - 1]).join(NL),
      metadata: { topic, difficulty },
    };
  }

  const b = _.sample([2, 3]);
  const k = _.sample([1, 2, 3, 4]);
  // The y-intercept off the origin, where its label would sit on the axes.
  const c = _.sample(_.range(-3, 4).filter((v) => v !== -k));
  const top = k + c;
  const win = [-4, 2, Math.min(-1, c - 2), Math.max(top + 2, c + 3, 1)];
  return {
    instruction: 'The graph has the equation given. Find k and c',
    questionMath: `y = k \\times ${b}^x + c`,
    answer: `k = ${k}, \\ c = ${c}`,
    workingOut: [
      `\\text{asymptote } y = ${c}, \\text{ so } c = ${c}`,
      `x = 0: \\ ${top} = k \\times 1${c ? ` ${signed(c)}` : ''}, \\text{ so } k = ${k}`,
      `k = ${k}, \\ c = ${c}`,
    ].join(NL),
    visualization: {
      type: 'coordinate-grid', big: true, window: win,
      curves: [{ exp: [k, b, c] }],
      lines: [{ m: 0, c, ink: true, dashed: true }],
      // Down and right of the y-intercept: the curve climbs away above it.
      points: [{ x: 0, y: top, label: ptLabel(0, top), labelDir: [1, -1] }],
      // The equation sits beside the graph: hug, so it keeps its width.
      hug: true,
    },
    metadata: { topic, difficulty },
  };
};
