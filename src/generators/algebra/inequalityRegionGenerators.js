// src/generators/algebra/inequalityRegionGenerators.js
//
// Inequality regions — Haese 32B-C, syllabus E2.6d ("represent
// inequalities in two variables graphically ... broken lines for strict
// inequalities"). Last in Inequalities. The figure follows Rayner and the
// Cambridge papers in shading the unwanted side of each line, so the region
// R is the part left clear.
//
//   foundation  R between a vertical and a horizontal line: write down the
//               two inequalities
//   core        R a triangle, a vertical, a horizontal and a sloping line:
//               write down the three inequalities
//   stretch     the same kind of triangle: list the points with integer
//               coordinates in R, where a dashed edge keeps its points out
//
// Solid lines are ≤ or ≥, dashed lines < or >. Every line is drawn to the
// grid, so its equation is read off it.

import _ from 'lodash';

const NL = '\n';
// The first quadrant, so R never straddles an axis and the squares are as
// big as the slot allows.
const WINDOW = [0, 8, 0, 8];
// "≤" etc. for the side kept: x ≥ a when R is to the right of x = a.
const sym = (keepAboveOrRight, strict) => (keepAboveOrRight ? (strict ? '>' : '\\ge') : (strict ? '<' : '\\le'));
const mx = (m) => (m === 1 ? 'x' : m === -1 ? '-x' : `${m}x`);
const rhs = (m, c) => (c === 0 ? mx(m) : `${mx(m)} ${c < 0 ? '-' : '+'} ${Math.abs(c)}`);

/**
 * A boundary: { kind: 'x' | 'y' | 'slope', k (x = k or y = k) or m, c,
 * keep: true for right / above, strict }. Its inequality, its line for the
 * figure, and the shading of the side not kept.
 */
const ineq = (b) => (b.kind === 'x' ? `x ${sym(b.keep, b.strict)} ${b.k}`
  : b.kind === 'y' ? `y ${sym(b.keep, b.strict)} ${b.k}`
    : `y ${sym(b.keep, b.strict)} ${rhs(b.m, b.c)}`);
const line = (b) => ({ ...(b.kind === 'x' ? { x: b.k } : b.kind === 'y' ? { m: 0, c: b.k } : { m: b.m, c: b.c }), ink: true, dashed: b.strict });
const shadeOf = (b) => (b.kind === 'x'
  ? { x: b.k, side: b.keep ? 'left' : 'right' }
  : { m: b.kind === 'y' ? 0 : b.m, c: b.kind === 'y' ? b.k : b.c, side: b.keep ? 'below' : 'above' });
/** Whether (x, y) is in R: on a solid line counts, on a dashed one does not. */
const inside = (bs, x, y) => bs.every((b) => {
  const v = b.kind === 'x' ? x - b.k : b.kind === 'y' ? y - b.k : y - (b.m * x + b.c);
  const s = b.keep ? v : -v;
  return b.strict ? s > 1e-9 : s >= -1e-9;
});
const lineWords = (b) => `${b.kind === 'x' ? `x = ${b.k}` : b.kind === 'y' ? `y = ${b.k}` : `y = ${rhs(b.m, b.c)}`}\\text{ (${b.strict ? 'dashed' : 'solid'})}`;

/**
 * Where R's label goes: the point of R furthest from every line and window
 * edge (the axes among them), so the letter never sits on a line or among
 * the axis numbers.
 * Null when R has no spot half a square from all of them.
 */
function labelSpot(bs) {
  const [x0, x1, y0, y1] = WINDOW;
  const gap = (x, y) => Math.min(
    ...bs.map((b) => (b.kind === 'x' ? Math.abs(x - b.k) : b.kind === 'y' ? Math.abs(y - b.k)
      : Math.abs(y - b.m * x - b.c) / Math.hypot(1, b.m))),
    x - x0, x1 - x, y - y0, y1 - y,
  );
  let best = null, far = 0.5;
  for (let x = x0; x <= x1; x += 0.25) {
    for (let y = y0; y <= y1; y += 0.25) {
      if (inside(bs, x, y) && gap(x, y) >= far) { far = gap(x, y); best = [x, y]; }
    }
  }
  return best;
}

/**
 * R a triangle inside the window, with room for its label. The three lines
 * meet in three corners; R is that triangle when the corners' centroid is in
 * R (three half-planes that miss their own corners' middle run off to
 * infinity). The label goes at the incentre, the point furthest from all
 * three sides.
 */
function triangle() {
  const [x0, x1, y0, y1] = WINDOW;
  for (;;) {
    const v = { kind: 'x', k: _.random(1, 7), keep: _.random(0, 1) === 1, strict: _.random(0, 1) === 1 };
    const h = { kind: 'y', k: _.random(1, 7), keep: _.random(0, 1) === 1, strict: _.random(0, 1) === 1 };
    const s = { kind: 'slope', m: _.sample([1, -1, 2, -2]), c: _.random(-6, 14), keep: _.random(0, 1) === 1, strict: _.random(0, 1) === 1 };
    const bs = [v, h, s];
    const P = [[v.k, h.k], [v.k, s.m * v.k + s.c], [(h.k - s.c) / s.m, h.k]];
    // Corners strictly inside the window, so R stays off the axes and edges.
    if (!P.every(([x, y]) => x > x0 && x < x1 && y > y0 && y < y1)) continue;
    if (!inside(bs, _.meanBy(P, 0), _.meanBy(P, 1))) continue;
    const [a, b, c] = [[1, 2], [0, 2], [0, 1]].map(([p, q]) => Math.hypot(P[p][0] - P[q][0], P[p][1] - P[q][1]));
    const area = Math.abs((P[1][0] - P[0][0]) * (P[2][1] - P[0][1]) - (P[2][0] - P[0][0]) * (P[1][1] - P[0][1])) / 2;
    // A triangle's corners close in on the letter, so it gets more room
    // (written so that three lines through one point, 0 / 0, fail too).
    if (!(area / ((a + b + c) / 2) >= 0.7)) continue;
    const label = [0, 1].map((d) => (a * P[0][d] + b * P[1][d] + c * P[2][d]) / (a + b + c));
    return { bs, label };
  }
}

export const generateInequalityRegions = (options = {}) => {
  const { difficulty = 'core' } = options;
  const metadata = { topic: 'inequality-regions', difficulty };
  const fig = (bs, label) => ({
    type: 'coordinate-grid', window: WINDOW, big: true, lines: bs.map(line), shade: bs.map(shadeOf), regionLabel: label,
  });

  for (;;) {
    if (difficulty === 'foundation') {
      const bs = [
        { kind: 'x', k: _.random(2, 6), keep: _.random(0, 1) === 1, strict: _.random(0, 1) === 1 },
        { kind: 'y', k: _.random(2, 6), keep: _.random(0, 1) === 1, strict: _.random(0, 1) === 1 },
      ];
      const label = labelSpot(bs);
      if (!label) continue;
      const answer = bs.map(ineq).join(', \\ ');
      return {
        instruction: 'Write down the two inequalities that define the unshaded region R',
        answer,
        workingOut: [...bs.map((b) => `${lineWords(b)}: \\ ${ineq(b)}`), answer].join(NL),
        visualization: fig(bs, label),
        metadata,
      };
    }

    const { bs, label } = triangle();
    if (difficulty === 'core') {
      const answer = bs.map(ineq).join(', \\ ');
      return {
        instruction: 'Write down the three inequalities that define the unshaded region R',
        answer,
        workingOut: [...bs.map((b) => `${lineWords(b)}: \\ ${ineq(b)}`), answer].join(NL),
        visualization: fig(bs, label),
        metadata,
      };
    }

    // stretch: the integer points of R, a handful of them.
    const pts = [];
    for (let x = WINDOW[0]; x <= WINDOW[1]; x += 1) for (let y = WINDOW[2]; y <= WINDOW[3]; y += 1) if (inside(bs, x, y)) pts.push([x, y]);
    if (pts.length < 2 || pts.length > 8) continue;
    // A dashed edge must matter: some integer point sits on it, kept out.
    const onDashed = [];
    for (let x = WINDOW[0]; x <= WINDOW[1]; x += 1) for (let y = WINDOW[2]; y <= WINDOW[3]; y += 1) {
      if (!inside(bs, x, y) && inside(bs.map((b) => ({ ...b, strict: false })), x, y)) onDashed.push([x, y]);
    }
    if (!bs.some((b) => b.strict) || onDashed.length === 0) continue;
    const answer = pts.map(([x, y]) => `(${x}, ${y})`).join(', ');
    return {
      instruction: 'List the points with integer coordinates in the unshaded region R',
      answer,
      workingOut: [`R: \\ ${bs.map(ineq).join(', \\ ')}`, `\\text{on a dashed line, not in R: } ${onDashed.map(([x, y]) => `(${x}, ${y})`).join(', ')}`, answer].join(NL),
      visualization: fig(bs, label),
      metadata,
    };
  }
};
