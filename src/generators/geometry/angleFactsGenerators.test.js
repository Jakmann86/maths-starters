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
import {
  ACUTE_POSITIONS, generateAnglesOnALine, generateParallelLineAngles, generatePolygonInteriorAngles,
  generateQuadrilateralAngleSum,
} from './angleFactsGenerators';

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

// Angles on a line: the answer is recomputed from the figure — the two gap
// sizes and their labels — never from the generator's variables. The line is
// turned to a random tilt, so this also checks the rays still make a straight
// line, and that the middle ray really splits it into the two labelled gaps.
describe('angles-on-a-line', () => {
  const mod = (a) => ((a % 360) + 360) % 360;

  it.each(BANDS)('resolves the two labelled angles to 180 on a straight line, at %s', (difficulty) => {
    const distinct = new Set();
    const tilts = new Set();
    for (let i = 0; i < SAMPLES; i += 1) {
      const q = generateAnglesOnALine({ difficulty });
      const fig = q.visualization;
      const x = parseX(q.answer);

      expect(fig.type).toBe('angle-rays');
      expect(fig.wrap).toBe(false);
      const [r0, r1, r2] = fig.rays;
      expect(mod(r0 - r2)).toBe(180);
      // r0 -> r1 -> r2 runs one way round, gap by gap.
      expect(mod(r0 - r1)).toBe(fig.gapDegrees[0]);
      expect(mod(r1 - r2)).toBe(fig.gapDegrees[1]);
      expect(fig.gapDegrees[0] + fig.gapDegrees[1]).toBe(180);

      // Every label, evaluated at the answer, is the gap it sits in.
      fig.labels.forEach((label, idx) => {
        const { value } = parseLabel(label, x);
        expect(value).toBe(fig.gapDegrees[idx]);
      });

      distinct.add(JSON.stringify(fig.labels));
      tilts.add(mod(r2));
    }
    expect(distinct.size).toBeGreaterThan(30);
    // Tilted both ways and turned over, not one horizontal line.
    expect(tilts.size).toBeGreaterThan(50);
  });
});

// Angles in parallel lines: the relationship is read off the two labelled
// positions on the figure (never the generator's own choice), the unknown is
// recomputed from it and the given label, and the answer must match. Every
// label must also sit in a wedge of its own kind: the figure draws TL and BR
// acute, TR and BL obtuse.
describe('parallel-line-angles', () => {
  const relationshipOf = (a, b) => {
    const [qa, la] = [a.slice(0, 2), a[2]];
    const [qb, lb] = [b.slice(0, 2), b[2]];
    if (la === lb) return null; // same crossing: not one of the three
    if (qa === qb) return 'corresponding';
    const lower = la === '2' ? qa : qb;
    const upper = la === '1' ? qa : qb;
    // Between the lines: B at the upper crossing, T at the lower.
    if (upper[0] !== 'B' || lower[0] !== 'T') return null;
    return upper[1] === lower[1] ? 'coInterior' : 'alternate';
  };

  it.each(BANDS)('resolves the unknown from the figure, in a wedge of its own kind, at %s', (difficulty) => {
    const seen = new Set();
    const distinct = new Set();
    for (let i = 0; i < SAMPLES; i += 1) {
      const q = generateParallelLineAngles({ difficulty });
      const { given, unknown } = q.visualization;
      const rel = relationshipOf(given.position, unknown.position);
      expect(rel, `${given.position} / ${unknown.position}`).toBeTruthy();
      seen.add(rel);

      const g = parseLabel(given.label, 0).value;
      expect(g).not.toBe(90);
      const u = rel === 'coInterior' ? 180 - g : g;
      const x = parseX(q.answer);
      if (difficulty === 'stretch') expect(parseLabel(unknown.label, x).value).toBe(u);
      else {
        expect(unknown.label).toBe('x');
        expect(x).toBe(u);
      }

      expect(ACUTE_POSITIONS.includes(given.position)).toBe(g < 90);
      expect(ACUTE_POSITIONS.includes(unknown.position)).toBe(u < 90);
      expect(q.workingOut).toContain(rel === 'coInterior' ? 'co-interior' : rel);
      distinct.add(JSON.stringify([given, unknown]));
    }
    expect([...seen].sort()).toEqual(['alternate', 'coInterior', 'corresponding']);
    expect(distinct.size).toBeGreaterThan(100);
  });
});

// A forward polygon question carries its angles on the figure only.
describe('polygon-interior-angles', () => {
  it('never repeats the figure in a question line, at stretch', () => {
    for (let i = 0; i < 500; i += 1) {
      expect(generatePolygonInteriorAngles({ difficulty: 'stretch' }).questionMath).toBeNull();
    }
  });
});

