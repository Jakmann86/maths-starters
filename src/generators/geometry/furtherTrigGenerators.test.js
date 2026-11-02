// Substitute-the-answer-back harness for Further trigonometry. Each answer
// is recomputed from the figure's labels or the printed sentences, by
// building the triangle in coordinates (furtherTrigGenerators.check.js),
// never from the generator's variables. Every working line is evaluated
// and must hold. furtherTrigGenerators.mutation.test.js shows the checker
// fails when it should.
//
// Run: npx vitest run src/generators/geometry/furtherTrigGenerators.test.js

import { describe, expect, it } from 'vitest';
import {
  generateSineRule, generateCosineRule, generateTriangleAreaSine, generateSineCosineMixed,
} from './furtherTrigGenerators';
import {
  checkSineRule, checkCosineRule, checkTriangleArea, checkMixed, solveTriangle, checkLine, roundsTo,
} from './furtherTrigGenerators.check';
import { generateForSkill, getSkill, strandOf, topicGroups } from '../../curriculum/skills';

const SAMPLES = 6000;
const BANDS = ['foundation', 'core', 'stretch'];

const SKILLS = [
  { id: 'sine-rule', gen: generateSineRule, check: checkSineRule },
  { id: 'cosine-rule', gen: generateCosineRule, check: checkCosineRule },
  { id: 'triangle-area-sine', gen: generateTriangleAreaSine, check: checkTriangleArea },
  { id: 'sine-cosine-mixed', gen: generateSineCosineMixed, check: checkMixed },
];

// What each band must draw on, and nothing else.
const KINDS = {
  'sine-rule': { foundation: ['side-opp-angle'], core: ['SSA', 'side-via-sum'], stretch: ['one', 'two'] },
  'cosine-rule': { foundation: ['acute', 'obtuse'], core: ['acute', 'obtuse'], stretch: ['largest acute', 'largest in x acute', 'largest in x obtuse', 'largest obtuse', 'smallest', 'smallest in x'] },
  'triangle-area-sine': { foundation: ['area'], core: ['side'], stretch: ['two angles'] },
  'sine-cosine-mixed': {
    foundation: ['cosine angle', 'cosine side', 'sine angle', 'sine side'],
    core: ['cosine then sine'],
    stretch: ['bearings bearing', 'bearings distance', 'compound cos-angle', 'compound cos-sin BC', 'compound cos-sin CD', 'compound sin-cos'],
  },
};

describe('the checker itself', () => {
  it('builds known triangles', () => {
    const [t] = solveTriangle([3, 4, 5], [null, null, null]);
    expect(t.A[2]).toBeCloseTo(90, 9);
    expect(t.area).toBeCloseTo(6, 9);
    // The ambiguous case: a = 7 opposite A = 50°, b = 8.5, so b sin A < a < b.
    const two = solveTriangle([7, 8.5, null], [50, null, null]);
    expect(two.length).toBe(2);
    expect(two[0].A[1] + two[1].A[1]).toBeCloseTo(180, 9);
    expect(solveTriangle([5, 7, null], [100, null, null]).length).toBe(0);
  });
  it('holds working to its stated accuracy', () => {
    expect(checkLine('x = 9.91 \\text{ (3 s.f.)}', { x: 9.9124 })).toBe(true);
    expect(checkLine('x = 9.92 \\text{ (3 s.f.)}', { x: 9.9124 })).toBe(false);
    expect(checkLine('BD = 9.8826\\ldots', { BD: 9.88269 })).toBe(true);
    expect(checkLine('BD = 9.8827\\ldots', { BD: 9.88269 })).toBe(false);
    expect(checkLine('180^\\circ - 48^\\circ - 63^\\circ = 69^\\circ', {})).toBe(true);
    expect(checkLine('40^\\circ + 136.5^\\circ > 180^\\circ', {})).toBe(false);
    expect(roundsTo(21.04, '21.0', 'sf3')).toBe(true);
    expect(roundsTo(21.04, '21', 'sf3')).toBe(false);
  });
});

describe('Further trigonometry', () => {
  SKILLS.forEach(({ id, gen, check }) => {
    BANDS.forEach((difficulty) => {
      it(`${id} ${difficulty}: every answer follows from what is printed`, () => {
        const questions = new Set();
        const answers = new Set();
        const mix = {};
        for (let t = 0; t < SAMPLES; t += 1) {
          const q = gen({ difficulty });
          const { kind } = check(q, difficulty);
          mix[kind] = (mix[kind] ?? 0) + 1;
          const f = q.visualization;
          questions.add(JSON.stringify([q.instruction, q.questionText, q.questionMath, f?.sides, f?.angleLabels, f?.angles?.length === 3 ? null : f?.angles]));
          answers.add(q.answer);
        }
        process.stdout.write(
          `${id} ${difficulty}: ${questions.size} distinct questions, ${answers.size} distinct answers; `
          + `${Object.entries(mix).sort().map(([k, v]) => `${k} ${v}`).join(', ')}\n`,
        );
        expect(Object.keys(mix).sort()).toEqual(KINDS[id][difficulty]);
        expect(questions.size).toBeGreaterThan(SAMPLES * 0.5);
      });
    });
  });

  it('is served by the catalogue, in its own Geometry topic', () => {
    SKILLS.forEach(({ id, check }) => {
      expect(getSkill(id).topic).toBe('Further trigonometry');
      BANDS.forEach((band) => check(generateForSkill(id, band), band));
    });
    expect(strandOf('Further trigonometry')).toBe('Geometry');
    const geo = topicGroups().find((g) => g.name === 'Geometry').topics;
    expect(geo.indexOf('Further trigonometry')).toBe(geo.indexOf('Pythagoras and trigonometry') + 1);
  });
});
