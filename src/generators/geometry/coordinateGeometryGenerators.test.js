// src/generators/geometry/coordinateGeometryGenerators.test.js
//
// Substitute-the-answer-back for horizontal-vertical-lines and
// simultaneous-graphical (which lives in formulaGenerators but draws on the
// same grid). Answers are recomputed from the printed equations and the
// figure config, never the generator's variables: a figure that draws one
// line while the question prints another is the failure this is for.
//
// Run: npx vitest run src/generators/geometry/coordinateGeometryGenerators.test.js

import { describe, expect, it } from 'vitest';
import { generateHorizontalVerticalLines } from './coordinateGeometryGenerators';
import { generateSimultaneousGraphical } from '../algebra/formulaGenerators';
import { exactOf, asRational, subst, compiles } from '../number/latexArithmetic.check';

const BANDS = ['foundation', 'core', 'stretch'];
const SAMPLES = 4000;

const num = (tex) => { const [n, d] = asRational(exactOf(tex)); return n / d; };
/** lhs - rhs of an equation at (x, y). */
const residual = (eq, x, y) => {
  const [l, r] = eq.split(' = ');
  return num(subst(l, { x: String(x), y: String(y) })) - num(subst(r, { x: String(x), y: String(y) }));
};
/** a, b, d with ax + by - d = residual, read off by evaluating it. */
const linear = (eq) => {
  const z = residual(eq, 0, 0);
  return { a: residual(eq, 1, 0) - z, b: residual(eq, 0, 1) - z, d: -z };
};
const pointRe = /\((-?\d+), (-?\d+)\)/;

describe('horizontal-vertical-lines', () => {
  it.each(BANDS)('the equation is the line, at %s', (difficulty) => {
    const distinct = new Set();
    let vertical = 0;
    for (let i = 0; i < SAMPLES; i++) {
      const q = generateHorizontalVerticalLines({ difficulty });
      expect(q.metadata).toEqual({ topic: 'horizontal-vertical-lines', difficulty });
      const id = JSON.stringify([q.questionMath, q.visualization]);
      if (!distinct.has(id)) { if (q.questionMath) compiles(q.questionMath); compiles(q.answer); compiles(q.workingOut); }
      distinct.add(id);

      if (difficulty === 'foundation') {
        const { line } = q.visualization;
        expect(q.visualization.type).toBe('coordinate-grid');
        if (line.x !== undefined) {
          vertical += 1;
          expect(q.answer).toBe(`x = ${line.x}`);
        } else {
          expect(line.m).toBe(0);
          expect(q.answer).toBe(`y = ${line.c}`);
        }
        expect(line.x ?? line.c).not.toBe(0); // never hidden under an axis
      } else if (difficulty === 'core') {
        const [, x1, y1] = pointRe.exec(q.questionMath.split('\\text{ and }')[0]).map(Number);
        const [, x2, y2] = pointRe.exec(q.questionMath.split('\\text{ and }')[1]).map(Number);
        expect([x1, y1]).not.toEqual([x2, y2]);
        expect((x1 === x2) !== (y1 === y2), q.questionMath).toBe(true);
        if (x1 === x2) vertical += 1;
        expect(q.answer).toBe(x1 === x2 ? `x = ${x1}` : `y = ${y1}`);
      } else {
        const eqs = q.questionMath.split('\n');
        const [, px, py] = pointRe.exec(q.answer).map(Number);
        eqs.forEach((eq) => expect(residual(eq, px, py), `${eq} at ${q.answer}`).toBe(0));
        const [l1, l2] = eqs.map(linear);
        expect(l1.a * l2.b - l2.a * l1.b, q.questionMath).not.toBe(0); // one crossing
        if (/^x = /.test(eqs[1])) vertical += 1;
      }
    }
    console.log(`horizontal-vertical-lines ${difficulty}: ${distinct.size} distinct, ${vertical} vertical`);
    expect(vertical).toBeGreaterThan(SAMPLES * 0.45);
    expect(vertical).toBeLessThan(SAMPLES * 0.55);
    // Foundation's ceiling is 20 (see the generator), and it should reach it.
    expect(distinct.size).toBeGreaterThanOrEqual(difficulty === 'foundation' ? 20 : 300);
  });
});

describe('simultaneous-graphical', () => {
  it.each(BANDS)('the answer is the crossing of the printed lines, at %s', (difficulty) => {
    const distinct = new Set();
    for (let i = 0; i < SAMPLES; i++) {
      const q = generateSimultaneousGraphical({ difficulty });
      expect(q.metadata).toEqual({ topic: 'simultaneous-graphical', difficulty });
      if (!distinct.has(q.questionMath)) { compiles(q.questionMath); compiles(q.answer); compiles(q.workingOut); }
      distinct.add(q.questionMath);

      const m = /^x = (-?\d+), \\ y = (-?\d+)$/.exec(q.answer);
      expect(m, q.answer).toBeTruthy();
      const [px, py] = [Number(m[1]), Number(m[2])];
      const eqs = q.questionMath.split('\n');
      expect(eqs).toHaveLength(2);
      eqs.forEach((eq) => expect(residual(eq, px, py), `${eq} at ${q.answer}`).toBe(0));
      const [l1, l2] = eqs.map(linear);
      expect(l1.a * l2.b - l2.a * l1.b, q.questionMath).not.toBe(0);

      if (difficulty === 'foundation') {
        const fig = q.visualization;
        expect(fig.type).toBe('coordinate-grid');
        expect(fig.lines).toHaveLength(2);
        // each drawn line is the printed equation it stands for
        fig.lines.forEach((ln, j) => {
          [-3, 0, 4].forEach((x) => expect(residual(eqs[j], x, ln.m * x + ln.c), `${eqs[j]} vs drawn ${JSON.stringify(ln)}`).toBe(0));
        });
        const [x0, x1, y0, y1] = fig.window;
        expect(x1 - x0).toBe(y1 - y0);
        expect(x0 < 0 && x1 > 0 && y0 < 0 && y1 > 0).toBe(true);
        expect(px > x0 && px < x1 && py > y0 && py < y1, `${q.answer} in ${fig.window}`).toBe(true);
        expect(px !== 0 && py !== 0, `${q.answer} sits on an axis`).toBe(true);
      } else {
        expect(q.visualization).toBeNull();
        // the class draws its own axes, so the crossing stays in the first quadrant
        expect(px >= 0 && py >= 0 && px <= 6 && py <= 6).toBe(true);
      }
      if (difficulty === 'stretch') {
        expect(eqs[0]).not.toMatch(/^y = /);
        const { a, b, d } = linear(eqs[0]);
        expect(Number.isInteger(d / a) && Number.isInteger(d / b), eqs[0]).toBe(true); // whole intercepts
      } else {
        eqs.forEach((eq) => expect(eq).toMatch(/^y = /));
      }
    }
    console.log(`simultaneous-graphical ${difficulty}: ${distinct.size} distinct`);
    expect(distinct.size).toBeGreaterThan(difficulty === 'stretch' ? 80 : 100);
  });
});
