// src/generators/geometry/perpendicularLineGenerators.js
//
// Perpendicular lines — Haese 14F (and the perpendicular questions in its
// review sets), syllabus E4.6. In Straight-line graphs:
//
//   foundation  perpendicular to y = mx + c through a point, in
//               gradient-intercept form
//   core        perpendicular to ax + by = d through a point, in general
//               form: bx - ay = k, k from the point
//   stretch     the perpendicular bisector of AB, in general form: through
//               the midpoint, at right angles to AB
//
// Points sit where the constant comes out whole, so no answer needs a
// fraction for c.

import _ from 'lodash';
import { gcd } from '../shared';
import { frac, mx, lineEquation, generalForm, point, br } from './coordinateGeometryGenerators';

const NL = '\n';
const nonZero = (a, b) => _.sample(_.range(a, b + 1).filter((v) => v !== 0));

export const generatePerpendicularLine = (options = {}) => {
  const { difficulty = 'core' } = options;
  const metadata = { topic: 'perpendicular-line', difficulty };

  for (;;) {
    if (difficulty === 'foundation') {
      const m = nonZero(-5, 5);
      const c = _.random(-6, 6);
      // x0 a multiple of m, so -x0/m and the new constant are whole.
      const x0 = m * nonZero(-3, 3);
      const y0 = _.random(-8, 8);
      const c2 = y0 + x0 / m;
      // A gradient of 1 or -1 makes a thin question; let few through.
      if (Math.abs(x0) > 10 || c2 === c || (Math.abs(m) === 1 && _.random(0, 2) > 0)) continue;
      return {
        instruction: 'Find the equation of the line perpendicular to this one, through the point given',
        questionMath: `${lineEquation(m, 1, c)}${NL}\\text{through } ${point(x0, y0)}`,
        questionMathCompact: true,
        answer: lineEquation(-1, m, c2),
        workingOut: [
          `\\text{perpendicular gradient} = ${frac(-1, m)}`,
          `y = ${mx(-1, m)}x + c`,
          `${y0} = ${frac(-1, m)} \\times ${br(x0)} + c`,
          `c = ${c2}`,
          lineEquation(-1, m, c2),
        ].join(NL),
        metadata,
      };
    }

    if (difficulty === 'core') {
      const a = nonZero(-6, 6), b = nonZero(-6, 6);
      if (gcd(Math.abs(a), Math.abs(b)) !== 1 || a < 0) continue;
      const d = _.random(-20, 20);
      const [x0, y0] = [_.random(-6, 6), _.random(-6, 6)];
      // Perpendicular to ax + by = d: bx - ay = k, x-coefficient positive.
      const flip = b < 0 ? -1 : 1;
      const [A, B] = [b * flip, -a * flip];
      const k = A * x0 + B * y0;
      return {
        instruction: 'Find the equation of the perpendicular line through the point, in the form ax + by = d',
        questionMath: `${generalForm(a, b, d)}${NL}\\text{through } ${point(x0, y0)}`,
        questionMathCompact: true,
        answer: generalForm(A, B, k),
        workingOut: [
          `m = ${frac(-a, b)}`,
          `\\text{perpendicular gradient} = ${frac(b, a)}`,
          generalForm(A, B, 'd'),
          `d = ${A} \\times ${br(x0)} + ${br(B)} \\times ${br(y0)} = ${k}`,
          generalForm(A, B, k),
        ].join(NL),
        metadata,
      };
    }

    // stretch: A and B with a whole-number midpoint, AB neither across nor
    // up the grid.
    const p = [_.random(-6, 6), _.random(-6, 6)];
    const q = [_.random(-6, 8), _.random(-6, 8)];
    const [dx, dy] = [q[0] - p[0], q[1] - p[1]];
    if (dx === 0 || dy === 0 || dx % 2 || dy % 2) continue;
    const M = [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2];
    const g = gcd(Math.abs(dx), Math.abs(dy));
    const flip = dx < 0 ? -1 : 1;
    const [A, B] = [(dx / g) * flip, (dy / g) * flip];
    const k = A * M[0] + B * M[1];
    return {
      instruction: 'Find the equation of the perpendicular bisector of AB, in the form ax + by = d',
      questionMath: `A${point(p[0], p[1])} \\text{ and } B${point(q[0], q[1])}`,
      questionMathCompact: true,
      answer: generalForm(A, B, k),
      workingOut: [
        `M = ${point(M[0], M[1])}`,
        `m_{AB} = \\frac{${q[1]} - ${br(p[1])}}{${q[0]} - ${br(p[0])}} = ${frac(dy, dx)}`,
        `\\text{perpendicular gradient} = ${frac(-dx, dy)}`,
        generalForm(A, B, 'd'),
        `d = ${A} \\times ${br(M[0])} + ${br(B)} \\times ${br(M[1])} = ${k}`,
        generalForm(A, B, k),
      ].join(NL),
      metadata,
    };
  }
};
