// src/generators/geometry/angleFactsGenerators.test.js
//
// Substitute-the-answer-back check for quadrilateral-angle-sum: every vertex
// label on the printed figure (never an internal generator variable) is
// resolved to a number — evaluating any algebraic label at the answer's x —
// and the four must sum to exactly 360. Also checks every angle is strictly
// between 0 and 180 (so the drawn convex outline never contradicts a label),
// and that `unknownIndex` marks exactly the vertices that actually carry x.
//
// Run: npx vitest run src/generators/geometry/angleFactsGenerators.test.js

import { describe, expect, it } from 'vitest';
import { generateQuadrilateralAngleSum } from './angleFactsGenerators';

const BANDS = ['foundation', 'core', 'stretch'];
const SAMPLES = 2000;

/** "x = 84^\circ" or "x = 27" -> 84 or 27. */
const parseX = (answer) => {
  const m = answer.match(/^x\s*=\s*(-?\d+)/);
  expect(m, `could not parse answer "${answer}"`).toBeTruthy();
  return Number(m[1]);
};

/** "84^\circ" -> 84, "x" -> x, "3x" -> 3x, "3x - 5" -> 3x - 5, "x + 12" -> x + 12. */
const parseLabel = (label, x) => {
  const asAngle = label.match(/^(-?\d+)\^\\circ$/);
  if (asAngle) return { value: Number(asAngle[1]), isUnknown: false };
  const m = label.match(/^(-?\d*)x(?:\s*([+-])\s*(\d+))?$/);
  expect(m, `could not parse label "${label}"`).toBeTruthy();
  const c = m[1] === '' ? 1 : m[1] === '-' ? -1 : Number(m[1]);
  const sign = m[2] === '-' ? -1 : 1;
  const d = m[3] === undefined ? 0 : sign * Number(m[3]);
  return { value: c * x + d, isUnknown: true };
};

describe('quadrilateral-angle-sum', () => {
  it.each(BANDS)('resolves all four vertices to angles summing to 360, at %s', (difficulty) => {
    const distinct = new Set();
    for (let i = 0; i < SAMPLES; i += 1) {
      const q = generateQuadrilateralAngleSum({ difficulty });
      const x = parseX(q.answer);
      const fig = q.visualization;

      expect(fig.type).toBe('polygon-irregular');
      expect(fig.n).toBe(4);
      expect(fig.angles.length).toBe(4);
      expect(Array.isArray(fig.unknownIndex)).toBe(true);

      let sum = 0;
      fig.angles.forEach((label, idx) => {
        const { value, isUnknown } = parseLabel(label, x);
        sum += value;
        expect(value).toBeGreaterThan(0);
        expect(value).toBeLessThan(180);
        expect(fig.unknownIndex.includes(idx)).toBe(isUnknown);
      });
      expect(sum).toBe(360);

      // radiusFactors stays within the convexity-preserving range.
      fig.radiusFactors.forEach((rf) => {
        expect(rf).toBeGreaterThanOrEqual(0.75);
        expect(rf).toBeLessThanOrEqual(1.25);
      });

      distinct.add(JSON.stringify(fig.angles));
    }
    expect(distinct.size).toBeGreaterThan(30);
  });

  it('marks exactly one unknown vertex at foundation', () => {
    for (let i = 0; i < 300; i += 1) {
      const q = generateQuadrilateralAngleSum({ difficulty: 'foundation' });
      expect(q.visualization.unknownIndex.length).toBe(1);
    }
  });

  it('marks exactly two unknown vertices at core, and the equation is "2x = ..."', () => {
    for (let i = 0; i < 300; i += 1) {
      const q = generateQuadrilateralAngleSum({ difficulty: 'core' });
      expect(q.visualization.unknownIndex.length).toBe(2);
      expect(q.workingOut).toContain('2x =');
    }
  });

  it('marks exactly three unknown vertices at stretch', () => {
    for (let i = 0; i < 300; i += 1) {
      const q = generateQuadrilateralAngleSum({ difficulty: 'stretch' });
      expect(q.visualization.unknownIndex.length).toBe(3);
    }
  });

  it('shuffles the unknown position rather than always landing on the same vertex', () => {
    const seen = new Set();
    for (let i = 0; i < 200; i += 1) {
      const q = generateQuadrilateralAngleSum({ difficulty: 'foundation' });
      seen.add(q.visualization.unknownIndex[0]);
    }
    expect(seen.size).toBe(4);
  });

  it('never returns JSX and always declares a topic', () => {
    BANDS.forEach((difficulty) => {
      const q = generateQuadrilateralAngleSum({ difficulty });
      expect(q.visualization.$$typeof).toBeUndefined();
      expect(q.metadata.topic).toBe('quadrilateral-angle-sum');
    });
  });
});
