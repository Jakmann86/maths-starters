// src/generators/geometry/bearingGenerators.js
//
// Three-figure bearings — syllabus E5.2b ("three-figure bearings; back
// bearings"), Haese 15 (trigonometry, bearings), Rayner 7 and 10. Solved
// with angle facts, not trigonometry: the north lines at two points are
// parallel, so the angles at either end of a line are co-interior.
//
//   foundation  one north line and an angle from it: write the bearing,
//               three figures, measured clockwise
//   core        north lines at both ends: the back bearing, or the bearing
//               from an angle marked at the far end (co-interior angles)
//   stretch     a triangle, the bearings marked clockwise from each north
//               line as Haese 15E marks them: two bearings give angle ABC,
//               or a bearing and angle ABC give the next bearing
//
// The `bearings` figure is drawn to the true directions, so a bearing over
// 180 degrees looks it.

import _ from 'lodash';

const NL = '\n';
const deg = (a) => `${a}^\\circ`;
/** A bearing written in three figures: 065°. */
export const three = (b) => `${String(b).padStart(3, '0')}^\\circ`;
const rad = (d) => (d * Math.PI) / 180;
const step = ([x, y], b, d) => [Math.round((x + d * Math.sin(rad(b))) * 10) / 10, Math.round((y + d * Math.cos(rad(b))) * 10) / 10];
/**
 * How long to draw a line on bearing b: shorter the nearer it runs to
 * north-south, so its height stays about the same and a steep drawing is
 * not shrunk to fit the row.
 */
const lengthFor = (b) => Math.min(130, Math.round(85 / Math.abs(Math.cos(rad(b)))));
/** The angle between north and a line on bearing b, under 180°. */
const fromNorth = (b) => (b <= 180 ? b : 360 - b);
/** A bearing whose line sits clear of the north-south line. */
const bearing = () => {
  for (;;) {
    const b = _.random(20, 340);
    if (Math.abs(b - 180) >= 20) return b;
  }
};
/** The distance from point p to the segment ab. */
const toSegment = (p, a, b) => {
  const [dx, dy] = [b[0] - a[0], b[1] - a[1]];
  const t = Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / (dx * dx + dy * dy || 1)));
  return Math.hypot(p[0] - a[0] - t * dx, p[1] - a[1] - t * dy);
};
/**
 * True when nothing crowds a north line: no other point within 36 units of
 * it (label and all, so 90 units up), and no line it does not start on
 * within 20 units of it. The angles and labels then have room.
 */
const uncrowded = (pts, north, segs) => north.every((k) => {
  const [p, top] = [pts[k], [pts[k][0], pts[k][1] + 90]];
  const others = Object.keys(pts).filter((o) => o !== k);
  if (others.some((o) => toSegment(pts[o], p, top) < 36)) return false;
  return segs.filter((sg) => !sg.includes(k)).every(([a, b]) => {
    const [A, B] = [pts[a], pts[b]];
    // Sampled along the north line: its distance from the segment.
    for (let t = 0; t <= 1; t += 0.05) if (toSegment([p[0], p[1] + 90 * t], A, B) < 20) return false;
    return true;
  });
});
/** How the bearing comes from the angle at north: clockwise, or 360 minus. */
const readBearing = (b) => (b <= 180
  ? `${deg(b)} \\text{ clockwise from north}`
  : `360^\\circ - ${deg(360 - b)} = ${deg(b)}`);

export const generateBearings = (options = {}) => {
  const { difficulty = 'core' } = options;
  const metadata = { topic: 'bearings', difficulty };
  const A = [0, 0];

  if (difficulty === 'foundation') {
    const b = bearing();
    const answer = three(b);
    return {
      instruction: 'Find the bearing of B from A',
      answer,
      workingOut: [readBearing(b), answer].join(NL),
      visualization: {
        type: 'bearings', big: true, points: { A, B: step(A, b, lengthFor(b)) }, north: ['A'], segments: [['A', 'B']],
        angles: [{ at: 'A', from: 'N', to: 'B', label: deg(fromNorth(b)) }],
      },
      metadata,
    };
  }

  if (difficulty === 'core') {
    let b, B;
    // Side by side rather than one above the other, so the two north
    // lines stay apart.
    do { b = bearing(); B = step(A, b, lengthFor(b)); } while (Math.abs(Math.sin(rad(b))) < 0.5);
    const back = (b + 180) % 360;
    const fig = { type: 'bearings', big: true, points: { A, B }, north: ['A', 'B'], segments: [['A', 'B']] };
    if (_.random(0, 1)) {
      // The angle at A is given: the back bearing from B.
      const answer = three(back);
      return {
        instruction: 'Find the bearing of A from B',
        answer,
        workingOut: [
          `\\text{bearing of B from A} = ${b <= 180 ? deg(b) : `360^\\circ - ${deg(360 - b)} = ${deg(b)}`}`,
          `${deg(b)} ${b < 180 ? '+' : '-'} 180^\\circ = ${deg(back)}`,
          answer,
        ].join(NL),
        visualization: { ...fig, angles: [{ at: 'A', from: 'N', to: 'B', label: deg(fromNorth(b)) }] },
        metadata,
      };
    }
    // The angle at B is given: co-interior with the angle at A.
    const atB = 180 - fromNorth(b);
    const answer = three(b);
    return {
      instruction: 'Find the bearing of B from A',
      answer,
      workingOut: [
        `180^\\circ - ${deg(atB)} = ${deg(fromNorth(b))} \\text{ (co-interior)}`,
        ...(b <= 180 ? [] : [`360^\\circ - ${deg(360 - b)} = ${deg(b)}`]),
        answer,
      ].join(NL),
      visualization: { ...fig, angles: [{ at: 'B', from: 'N', to: 'A', label: deg(atB) }] },
      metadata,
    };
  }

  // stretch: a triangle ABC, A to B to C.
  for (;;) {
    const b1 = bearing(), b2 = bearing();
    const back = (b1 + 180) % 360;
    const angle = Math.abs(back - b2);
    // No wrap past north, a triangle that reads, and C's line clear of B's
    // north line.
    if (angle < 35 || angle > 140) continue;
    const B = step(A, b1, lengthFor(b1));
    const C = step(B, b2, Math.round(lengthFor(b2) * _.random(0.8, 1.05)));
    const side = (p) => Math.hypot(p[0], p[1]);
    if (side(C) < 70) continue;
    if (!uncrowded({ A, B, C }, ['A', 'B'], [['A', 'B'], ['B', 'C'], ['C', 'A']])) continue;
    // Room for the marks at each corner. The line to C keeps clear of A's
    // north line; a marked bearing leaves a gap after it for the point's
    // name, and no other line runs through the middle of its arc, where
    // the label goes.
    const AC = Math.round(((Math.atan2(C[0], C[1]) * 180) / Math.PI + 360) % 360);
    const apart = (x, y) => Math.abs((((x - y) % 360) + 540) % 360 - 180);
    if (AC < 25 || AC > 335) continue;
    // Not too tall: a drawing taller than it is wide shrinks to fit the row.
    const ys = [A[1], B[1], C[1]];
    if (Math.max(...ys) - Math.min(...ys) > 140) continue;
    const roomy = (b, others) => b <= 315 && others.every((o) => apart(o, b / 2) >= 55);
    const pickAngle = _.random(0, 1);
    if (!roomy(b1, [AC]) || (pickAngle && !roomy(b2, [back]))) continue;
    // Angle ABC marked: AC far enough from B that its label clears it.
    if (!pickAngle && toSegment(B, A, C) < 62) continue;
    const fig = {
      type: 'bearings', big: true, points: { A, B, C }, north: ['A', 'B'], segments: [['A', 'B'], ['B', 'C'], ['C', 'A']],
    };
    const backLine = `\\text{bearing of A from B} = ${deg(b1)} ${b1 < 180 ? '+' : '-'} 180^\\circ = ${deg(back)}`;
    // The bearings are marked on the figure, clockwise from each north
    // line, as Haese marks them: no text beside it.
    const atA = { at: 'A', to: 'B', bearing: b1, label: deg(b1) };
    if (pickAngle) {
      const answer = deg(angle);
      return {
        instruction: 'Find angle ABC',
        answer,
        workingOut: [backLine, `${deg(Math.max(back, b2))} - ${deg(Math.min(back, b2))} = ${deg(angle)}`, answer].join(NL),
        visualization: { ...fig, angles: [atA, { at: 'B', to: 'C', bearing: b2, label: deg(b2) }] },
        metadata,
      };
    }
    const answer = three(b2);
    return {
      instruction: 'Find the bearing of C from B',
      answer,
      workingOut: [backLine, `${deg(back)} ${b2 > back ? '+' : '-'} ${deg(angle)} = ${deg(b2)}`, answer].join(NL),
      visualization: { ...fig, angles: [atA, { at: 'B', from: 'A', to: 'C', label: deg(angle) }] },
      metadata,
    };
  }
};
