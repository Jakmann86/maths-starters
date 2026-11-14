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
import _ from 'lodash';
import {
  ACUTE_POSITIONS, PARALLEL_CHAINS, generateAnglesOnALine, generateParallelChain, generateParallelLineAngles,
  generatePolygonExteriorAngles, generatePolygonInteriorAngles, generateQuadrilateralAngleSum,
} from './angleFactsGenerators';
import { evenEnough, polygonFromInteriorAngles } from '../../lib/polygonFromAngles.js';

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
      // Half of Stretch is a shape chain, checked in 'parallel-chain' below.
      if (q.visualization.type === 'parallel-chain') continue;
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

// The polygon ladder, both skills, read back from what is printed:
//   Foundation  n in the big text, a regular n-gon drawn: the angle
//   Core        the angle in the question line, no figure: n, which must be
//               a whole number, from 360 over the exterior angle
//   Stretch     (interior) an irregular polygon drawn to its true angles:
//               the labels and x sum to 180(n - 2); or polygons at a point,
//               checked below. (exterior) checked below.
// A regular polygon with whole-number angles has n dividing 360, so
// Foundation and Core hold ten to a dozen questions each: the real ceiling.
describe('polygon angle ladder', () => {
  const deg = (l) => Number(/^(\d+)\^\\circ$/.exec(l)[1]);
  const GENS = { interior: generatePolygonInteriorAngles, exterior: generatePolygonExteriorAngles };
  Object.entries(GENS).forEach(([which, gen]) => {
    const angleOf = (n) => (which === 'interior' ? (180 * (n - 2)) / n : 360 / n);
    it(`${which} Foundation: the angle of the regular polygon named`, () => {
      const seen = new Set();
      for (let i = 0; i < SAMPLES; i += 1) {
        const q = gen({ difficulty: 'foundation' });
        const n = Number(/^(\d+) sides$/.exec(q.questionText)[1]);
        expect(q.instruction).toBe(`Find the ${which} angle of this regular polygon`);
        expect(q.visualization).toMatchObject({ type: 'polygon', n, angleLabel: 'x' });
        expect(Boolean(q.visualization.exterior)).toBe(which === 'exterior');
        expect(q.answer).toBe(`${angleOf(n)}^\\circ`);
        expect(Number.isInteger(angleOf(n))).toBe(true);
        seen.add(n);
      }
      expect(seen.size).toBeGreaterThanOrEqual(10);
    });
    it(`${which} Core: the number of sides from the angle, no figure`, () => {
      const seen = new Set();
      for (let i = 0; i < SAMPLES; i += 1) {
        const q = gen({ difficulty: 'core' });
        expect(q.instruction).toBe(`Each ${which} angle of a regular polygon is given. How many sides does it have?`);
        expect(q.visualization).toBeNull();
        const m = new RegExp(`^\\\\text\\{${which} angle\\} = (\\d+)\\^\\\\circ$`).exec(q.questionMath);
        expect(m, q.questionMath).toBeTruthy();
        const a = Number(m[1]);
        const ext = which === 'interior' ? 180 - a : a;
        const n = 360 / ext;
        expect(Number.isInteger(n) && n >= 3).toBe(true);
        expect(q.answer).toBe(`n = ${n}`);
        expect(q.workingOut.split('\n').at(-1)).toBe(`n = \\frac{360}{${ext}} = ${n}`);
        seen.add(n);
      }
      expect(seen.size).toBe(12);
    });
  });
  it('interior Stretch: the irregular polygon, from its labels', () => {
    const seen = new Set();
    let irregular = 0;
    for (let i = 0; i < SAMPLES; i += 1) {
      const q = generatePolygonInteriorAngles({ difficulty: 'stretch' });
      const v = q.visualization;
      if (v.type !== 'polygon-irregular') { expect(v.type).toBe('polygons-at-point'); continue; }
      irregular += 1;
      expect(q.instruction).toBe(`This is an irregular ${v.n}-sided polygon. Find the missing angle x.`);
      expect(v.angles[v.unknownIndex]).toBe('x');
      expect(evenEnough(v.interiorValues)).toBe(true);
      const given = v.angles.filter((_l, k) => k !== v.unknownIndex).map(deg);
      given.forEach((a, k) => expect(a).toBe(v.interiorValues.filter((_l, j) => j !== v.unknownIndex)[k]));
      const x = 180 * (v.n - 2) - given.reduce((a, b) => a + b, 0);
      expect(x).toBe(v.interiorValues[v.unknownIndex]);
      expect(x).toBeGreaterThan(0);
      expect(x).toBeLessThan(180);
      expect(q.answer).toBe(`x = ${x}^\\circ`);
      seen.add(JSON.stringify(v.angles));
    }
    expect(irregular).toBeGreaterThan(SAMPLES * 0.4);
    expect(seen.size).toBeGreaterThan(irregular * 0.95);
  });
});

// Parallel lines with a shape (Stretch). The figure is drawn from `a` and
// `b`, so every label must be the angle the geometry gives that mark: worked
// out here from a and b alone, never from the generator's own values. The
// answer is the value under the label marked x.
describe('parallel-chain', () => {
  const expected = ({ variant, a, b }) => ({
    'triangle-between': { top: a, base: b, apex: 180 - a - b },
    'triangle-on-line': { line: a, corner: b, apex: 180 - a - b },
    arrowhead: { top: a, bottom: b, bend: a + b },
    'iso-trapezium': { A: a, B: a, C: 180 - a, D: 180 - a },
    parallelogram: { A: a, B: 180 - a, C: a, D: 180 - a, ext: 180 - a },
  })[variant];

  it.each(PARALLEL_CHAINS)('labels agree with the drawn angles, %s', (variant) => {
    const distinct = new Set();
    for (let i = 0; i < SAMPLES; i += 1) {
      const q = generateParallelChain(variant);
      const fig = q.visualization;
      const want = expected(fig);
      const x = parseX(q.answer);
      const names = Object.keys(fig.labels);
      expect(names.length).toBeGreaterThanOrEqual(2);
      expect(fig.labels[fig.unknown]).toBe('x');
      names.forEach((name) => {
        const label = fig.labels[name];
        const value = label === 'x' ? x : parseLabel(label, 0).value;
        expect(value, `${variant} ${name}`).toBe(want[name]);
      });
      // Every drawn angle is a real, legible angle.
      Object.values(want).forEach((v) => {
        expect(v).toBeGreaterThan(20);
        expect(v).toBeLessThan(160);
      });
      expect(q.questionMath).toBeNull();
      distinct.add(JSON.stringify(fig.labels));
    }
    // The parallelogram has one free angle (50-80), so 31 is its ceiling.
    expect(distinct.size).toBeGreaterThan(variant === 'parallelogram' ? 25 : 60);
  });

  it('makes up about half of Stretch, and every design appears', () => {
    const seen = new Set();
    let chains = 0;
    for (let i = 0; i < 2000; i += 1) {
      const q = generateParallelLineAngles({ difficulty: 'stretch' });
      if (q.visualization.type === 'parallel-chain') {
        chains += 1;
        seen.add(q.visualization.variant);
      }
    }
    expect(chains).toBeGreaterThan(850);
    expect(chains).toBeLessThan(1150);
    expect([...seen].sort()).toEqual([...PARALLEL_CHAINS].sort());
  });
});

// Stretch draws an irregular polygon to its true angles, with every angle the
// question uses on the figure. Recomputed from the labels alone: either the
// exterior labels and x sum to 360, or the interior labels and the missing
// interior angle (180 - x) sum to 180(n - 2). Each label must also match the
// angle the outline is actually drawn with.
describe('polygon-exterior-angles stretch', () => {
  const num = (label) => Number(label.match(/^(\d+)\^\\circ$/)[1]);
  const turn = (a, b) => {
    const d = Math.atan2(a[0] * b[1] - a[1] * b[0], a[0] * b[0] + a[1] * b[1]);
    return (Math.abs(d) * 180) / Math.PI;
  };

  it('every label is drawn true and the answer substitutes back', () => {
    const seen = { exterior: new Set(), interior: new Set() };
    for (let s = 0; s < SAMPLES * 2; s += 1) {
      const q = generatePolygonExteriorAngles({ difficulty: 'stretch' });
      const v = q.visualization;
      const x = parseX(q.answer);
      expect(q.questionMath).toBeNull();
      expect(v.type).toBe('polygon-irregular');
      expect(v.interiorValues).toHaveLength(v.n);
      expect(evenEnough(v.interiorValues)).toBe(true);
      expect(v.exteriorLabels[v.unknownIndex]).toBe('x');

      // The drawn outline turns through each vertex's exterior angle.
      const { verts } = polygonFromInteriorAngles(v.interiorValues);
      const drawnExterior = verts.map((p, i) => {
        const prev = verts[(i - 1 + v.n) % v.n], next = verts[(i + 1) % v.n];
        return turn([p[0] - prev[0], p[1] - prev[1]], [next[0] - p[0], next[1] - p[1]]);
      });
      drawnExterior.forEach((e, i) => expect(e).toBeCloseTo(180 - v.interiorValues[i], 6));

      const allExterior = v.exteriorLabels.filter(Boolean).length === v.n;
      if (allExterior) {
        expect(v.angles.every((a) => a === '')).toBe(true);
        const given = v.exteriorLabels.filter((l, i) => i !== v.unknownIndex).map(num);
        given.forEach((e) => expect(e).toBeGreaterThanOrEqual(35));
        expect(given.reduce((a, b) => a + b, 0) + x).toBe(360);
        v.exteriorLabels.forEach((l, i) => {
          if (i !== v.unknownIndex) expect(num(l)).toBe(180 - v.interiorValues[i]);
        });
        seen.exterior.add(JSON.stringify(v.exteriorLabels));
      } else {
        expect(v.exteriorLabels.filter(Boolean)).toEqual(['x']);
        expect(v.angles[v.unknownIndex]).toBe('');
        const given = v.angles.filter((l, i) => i !== v.unknownIndex).map(num);
        expect(given).toHaveLength(v.n - 1);
        expect(given.reduce((a, b) => a + b, 0) + (180 - x)).toBe(180 * (v.n - 2));
        v.angles.forEach((l, i) => {
          if (i !== v.unknownIndex) expect(num(l)).toBe(v.interiorValues[i]);
        });
        seen.interior.add(JSON.stringify(v.angles));
      }
      expect(x).toBe(180 - v.interiorValues[v.unknownIndex]);
    }
    // Both designs appear, and neither has a low ceiling.
    expect(seen.exterior.size).toBeGreaterThan(1000);
    expect(seen.interior.size).toBeGreaterThan(1000);
  });
});

// Regular polygons meeting at a point (interior Stretch). The answer is
// recomputed from the instruction's polygon names and the gap label alone:
// P's interior angle is what is left of 360, its exterior angle is 180 minus
// that, and n = 360 / exterior. The figure must agree: its polygons are the
// ones named, P is drawn with the answer's n, and the wedges close round the
// point. checkJoined is mutation-tested below.
const NAMED = {
  'equilateral triangle': 3, square: 4, 'regular pentagon': 5, 'regular hexagon': 6,
  'regular octagon': 8, 'regular nonagon': 9, 'regular decagon': 10, 'regular dodecagon': 12,
};
const inner = (n) => 180 - 360 / n;
const AT_POINT = /^(?:Two (.+)s|(?:A|An) (.+), (?:a|an) (.+)) and (a|part of a) regular polygon P meet at a point\. How many sides does P have\?$/;
const SHARE = /^(?:A|An) (.+) and part of a regular polygon P share a side\. How many sides does P have\?$/;

function checkJoined(q) {
  const fail = (m) => { throw new Error(`${m}: ${JSON.stringify(q)}`); };
  const f = q.visualization;
  if (f?.type !== 'polygons-at-point' || f.big !== true || f.unknown !== 'P') fail('figure');
  if (q.questionMath !== null || q.answerUnits !== undefined) fail('no question line, no units');
  if (q.metadata?.topic !== 'polygon-interior-angles' || q.metadata?.difficulty !== 'stretch') fail('metadata');
  let known, gap = 0;
  const a = AT_POINT.exec(q.instruction), s = SHARE.exec(q.instruction);
  if (a) known = a[1] ? [a[1], a[1]] : [a[2], a[3]];
  else if (s) known = [s[1]];
  else fail('instruction');
  known = known.map((name) => NAMED[name] ?? fail(`name ${name}`));
  const gaps = f.wedges.filter((w) => w.gap !== undefined);
  const ps = f.wedges.filter((w) => w.label === 'P');
  const whole = f.wedges.filter((w) => w.n && !w.partial);
  const withGap = Boolean(s) || a?.[4] === 'part of a';
  if (ps.length !== 1 || !ps[0].partial || f.wedges.length !== known.length + 1 + (withGap ? 1 : 0)) fail('P, the polygons named and any gap are the wedges');
  if (JSON.stringify(whole.map((w) => w.n).sort()) !== JSON.stringify([...known].sort())) fail('the figure draws the polygons named');
  if (withGap) {
    if (gaps.length !== 1) fail('one gap');
    const m = /^(\d+)\^\\circ$/.exec(gaps[0].label);
    if (!m || Number(m[1]) !== gaps[0].gap) fail('the gap label is the gap drawn');
    gap = Number(m[1]);
  } else if (gaps.length) fail('no gap at a point');
  const pInterior = 360 - known.reduce((t, n) => t + inner(n), 0) - gap;
  const ext = 180 - pInterior;
  const n = 360 / ext;
  if (!(pInterior > 0 && pInterior < 180 && Number.isInteger(n) && n >= 5)) fail(`P's interior angle ${pInterior} is not a regular polygon's`);
  if (q.answer !== `n = ${n}`) fail(`answer ${q.answer}, P has ${n} sides`);
  if (ps[0].n !== n) fail('P is drawn with the right number of sides');
  const total = f.wedges.reduce((t, w) => t + (w.n ? inner(w.n) : w.gap), 0);
  if (Math.abs(total - 360) > 1e-9) fail('the wedges close round the point');
  // Every working line holds: "a - b - c = d", "180 - a = b", "n = 360/e = n".
  const lines = q.workingOut.split('\n');
  const nums = (l) => (l.match(/\d+(\.\d+)?/g) ?? []).map(Number);
  const [w1, w2, w3] = lines.map(nums);
  if (lines.length !== 3) fail('three working lines');
  if (w1[0] !== 360 || w1.slice(1, -1).reduce((t, v) => t - v, 360) !== w1.at(-1) || w1.at(-1) !== pInterior) fail(`working "${lines[0]}"`);
  if (w2[0] !== 180 || w2[0] - w2[1] !== w2[2] || w2[1] !== pInterior) fail(`working "${lines[1]}"`);
  if (w3[0] !== 360 || w3[0] / w3[1] !== w3[2] || w3[2] !== n) fail(`working "${lines[2]}"`);
  if (a && !withGap && /part of/.test(q.instruction)) fail('wording');
  return { kind: s ? 'sharing a side' : withGap ? 'point and gap' : 'at a point', n };
}

describe('polygons at a point', () => {
  const joined = () => {
    for (;;) {
      const q = generatePolygonInteriorAngles({ difficulty: 'stretch' });
      if (q.visualization.type === 'polygons-at-point') return q;
    }
  };

  it('every answer follows from the names and the gap', () => {
    const distinct = { 'at a point': new Set(), 'sharing a side': new Set(), 'point and gap': new Set() };
    const ns = new Set();
    for (let i = 0; i < 6000; i += 1) {
      const q = joined();
      const { kind, n } = checkJoined(q);
      distinct[kind].add(`${q.instruction}|${JSON.stringify(q.visualization.wedges.map((w) => w.gap ?? w.n))}`);
      ns.add(n);
    }
    // As maths: the polygons and the gap, set aside the order drawn.
    const maths = new Set();
    for (let i = 0; i < 3000; i += 1) {
      const q = joined();
      maths.add(JSON.stringify(q.visualization.wedges.map((w) => w.gap ?? w.n).sort()));
    }
    process.stdout.write(`polygons at a point: ${Object.entries(distinct).map(([k, v]) => `${v.size} ${k}`).join(', ')}; ${maths.size} distinct as maths; P has ${[...ns].sort((p, r) => p - r).join(', ')} sides\n`);
    // Seven sets close round a point with a whole n; the gaps give the variety.
    expect(distinct['sharing a side'].size).toBeGreaterThan(300);
    expect(distinct['point and gap'].size).toBeGreaterThan(200);
    expect(distinct['at a point'].size).toBeGreaterThan(20);
    expect(maths.size).toBeGreaterThan(100);   // about 115: the real ceiling, given P and the known polygons must have whole-number angles
  });

  it('makes up half of interior Stretch', () => {
    let k = 0;
    for (let i = 0; i < 4000; i += 1) if (generatePolygonInteriorAngles({ difficulty: 'stretch' }).visualization.type === 'polygons-at-point') k += 1;
    expect(k).toBeGreaterThan(1800);
    expect(k).toBeLessThan(2200);
  });

  it('the checker rejects broken copies', () => {
    const OPS = {
      'answer nudged': (q) => { q.answer = q.answer.replace(/\d+$/, (d) => String(Number(d) + 1)); },
      'gap label changed': (q) => {
        const g = q.visualization.wedges.find((w) => w.gap);
        if (!g) return false;
        g.label = `${g.gap + 2}^\\circ`;
      },
      'gap drawn differently': (q) => {
        const g = q.visualization.wedges.find((w) => w.gap);
        if (!g) return false;
        g.gap += 2; g.label = `${g.gap}^\\circ`;
      },
      'a known polygon swapped': (q) => {
        const w = q.visualization.wedges.find((x) => x.n && !x.partial);
        w.n = w.n === 4 ? 5 : 4;
      },
      'P drawn with another n': (q) => { const w = q.visualization.wedges.find((x) => x.partial); w.n += 1; },
      'instruction names another polygon': (q) => {
        const name = Object.keys(NAMED).find((nm) => q.instruction.includes(nm));
        const other = name === 'square' ? 'regular pentagon' : 'square';
        q.instruction = q.instruction.replace(name, other).replace(/\b(A|An) (?=square|regular)/, 'A ').replace(/\b(a|an) (?=square|regular)/, 'a ');
      },
      'a working number changed': (q) => {
        const lines = q.workingOut.split('\n');
        const k = _.random(0, 2);
        const hits = [...lines[k].matchAll(/\d+/g)];
        const h = _.sample(hits);
        lines[k] = lines[k].slice(0, h.index) + String(Number(h[0]) + 1) + lines[k].slice(h.index + h[0].length);
        q.workingOut = lines.join('\n');
      },
      'P label moved off P': (q) => {
        const w = q.visualization.wedges.find((x) => x.n && !x.partial);
        w.label = 'P';
      },
    };
    const tally = {};
    for (let i = 0; i < 400; i += 1) {
      const q = joined();
      Object.entries(OPS).forEach(([name, op]) => {
        const m = _.cloneDeep(q);
        if (op(m) === false || _.isEqual(m, q)) return;
        tally[name] ??= [0, 0];
        tally[name][0] += 1;
        try { checkJoined(m); } catch { tally[name][1] += 1; }
      });
    }
    Object.entries(tally).forEach(([name, [applied, killed]]) => {
      process.stdout.write(`  ${name}: ${killed}/${applied} killed\n`);
      expect(killed, name).toBe(applied);
    });
    expect(Object.keys(tally).sort()).toEqual(Object.keys(OPS).sort());
  });
});
