// Substitute-the-answer-back harness for Similarity. Each answer is
// recomputed from the figure's labels or the sentences by
// similarityGenerators.check.js, never from the generator's variables.
// similarityGenerators.mutation.test.js shows the checker fails when it
// should.
//
// Run: npx vitest run src/generators/geometry/similarityGenerators.test.js

import { describe, expect, it } from 'vitest';
import { generateSimilarShapes, generateSimilarTriangles, generateSimilarAreas, generateSimilarVolumes } from './similarityGenerators';
import { checkSimilarShapes, checkSimilarTriangles, checkSimilarAreasVolumes } from './similarityGenerators.check';
import { generateForSkill, getSkill, strandOf, topicGroups } from '../../curriculum/skills';

const SAMPLES = 6000;
const BANDS = ['foundation', 'core', 'stretch'];

export const SKILLS = [
  { id: 'similar-shapes', gen: generateSimilarShapes, check: checkSimilarShapes },
  { id: 'similar-triangles', gen: generateSimilarTriangles, check: checkSimilarTriangles },
  { id: 'similar-areas', gen: generateSimilarAreas, check: checkSimilarAreasVolumes },
  { id: 'similar-volumes', gen: generateSimilarVolumes, check: checkSimilarAreasVolumes },
];

const KINDS = {
  'similar-shapes': {
    foundation: ['rectangle x larger', 'triangle x larger'],
    core: ['rectangle x larger', 'rectangle x smaller', 'triangle x larger', 'triangle x smaller'],
    stretch: ['named rectangles', 'named triangles'],
  },
  'similar-triangles': { foundation: ['A, whole sides'], core: ['A, parts given', 'X'], stretch: ['A, x a part', 'X, whole line'] },
  'similar-areas': { foundation: ['area from sides'], core: ['length from areas'], stretch: ['trapezium'] },
  'similar-volumes': { foundation: ['volume from lengths'], core: ['length from volumes'], stretch: ['volume from areas'] },
};

// Most bands give 4,000 or more distinct questions in 6,000. Similar shapes
// at Foundation is the honest exception: a whole-number k of 2, 3 or 4 on a
// shape with two labelled sides each leaves about 1,700.
const FLOOR = { 'similar-shapes': { foundation: 1400 } };

describe('Similarity', () => {
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
          const f = q.visualization ?? {};
          questions.add(JSON.stringify([q.instruction, q.questionText, q.questionMath, f.left, f.right, f.labels, f.turn]));
          answers.add(q.answer);
        }
        process.stdout.write(
          `${id} ${difficulty}: ${questions.size} distinct questions, ${answers.size} distinct answers; `
          + `${Object.entries(mix).sort().map(([k, v]) => `${k} ${v}`).join(', ')}\n`,
        );
        expect(Object.keys(mix).sort()).toEqual(KINDS[id][difficulty]);
        expect(questions.size).toBeGreaterThan(FLOOR[id]?.[difficulty] ?? SAMPLES * 0.5);
      });
    });
  });

  it('is served by the catalogue, in its own Geometry topic', () => {
    SKILLS.forEach(({ id, check }) => {
      expect(getSkill(id).topic).toBe('Similarity');
      BANDS.forEach((band) => check(generateForSkill(id, band), band));
    });
    expect(strandOf('Similarity')).toBe('Geometry');
    const geo = topicGroups().find((g) => g.name === 'Geometry').topics;
    expect(geo).toContain('Similarity');
  });
});
