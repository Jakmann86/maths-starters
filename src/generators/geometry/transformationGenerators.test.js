// Substitute-the-answer-back harness for Transformations. Each answer is
// recomputed by transformationGenerators.check.js from the sentence and the
// shapes drawn on the grid, never from the generator's variables; a
// describe question is solved by searching every candidate map, and must
// have exactly one. transformationGenerators.mutation.test.js shows the
// checker fails when it should.
//
// Run: npx vitest run src/generators/geometry/transformationGenerators.test.js

import { describe, expect, it } from 'vitest';
import {
  generateTranslation, generateReflection, generateRotation, generateEnlargement, generateDescribeTransformation,
} from './transformationGenerators';
import { checkTransformation } from './transformationGenerators.check';
import { generateForSkill, getSkill, strandOf, topicGroups, skillsInTopic } from '../../curriculum/skills';

const SAMPLES = 6000;
const BANDS = ['foundation', 'core', 'stretch'];

export const SKILLS = [
  { id: 'translation', gen: generateTranslation },
  { id: 'reflection', gen: generateReflection },
  { id: 'rotation', gen: generateRotation },
  { id: 'enlargement', gen: generateEnlargement },
  { id: 'describe-transformation', gen: generateDescribeTransformation },
];

const turns = (mode) => ['90 acw', '90 cw', '180'].map((t) => `${mode} rotation ${t}`);
const KINDS = {
  translation: { foundation: ['carry translation words'], core: ['carry translation vector'], stretch: ['describe translation'] },
  reflection: {
    foundation: ['carry reflection x = a', 'carry reflection y = b'],
    core: ['carry reflection y = -x', 'carry reflection y = x'],
    stretch: ['describe reflection x = a', 'describe reflection y = -x', 'describe reflection y = b', 'describe reflection y = x'],
  },
  rotation: { foundation: turns('carry'), core: turns('carry'), stretch: turns('describe') },
  enlargement: {
    foundation: ['carry enlargement sf 2', 'carry enlargement sf 3'],
    core: ['describe enlargement sf 2', 'describe enlargement sf 3'],
    stretch: ['carry enlargement sf 1/2', 'describe enlargement sf 1/2'],
  },
  'describe-transformation': {
    foundation: ['describe reflection x = a', 'describe reflection y = b', ...turns('describe'), 'describe translation'],
    core: ['describe enlargement sf 2', 'describe enlargement sf 3', 'describe reflection x = a', 'describe reflection y = b', 'describe reflection y = x', ...turns('describe'), 'describe translation'],
    stretch: ['describe enlargement sf 1/2', 'describe reflection y = -x', 'describe reflection y = x', 'describe rotation 90 acw', 'describe rotation 90 cw'],
  },
};

// Distinct questions in 6,000 run from about 1,800 to 6,000 per band. Every
// shape sits in one quadrant, clear of the axes, on a grid of at most 14 by
// 10 with the origin on it, so the class can read it, and that is the
// ceiling. Enlargements are the tightest: there are exactly 2,080 ways to
// place a shape and its enlargement by 2 (or by a half), and only 320 by 3,
// so describing one (Enlargement Core, sampled 6,000 times) shows about
// 1,800. A diagonal mirror through the origin has only so many places for a
// shape too, and a mirror-line answer can only be one of twenty lines.
const FLOOR = {
  reflection: { foundation: 4800, core: 2500, stretch: 3500 },
  rotation: { foundation: 4400, stretch: 5000 },
  enlargement: { foundation: 2200, core: 1500, stretch: 2900 },
  'describe-transformation': { foundation: 5000, core: 4600, stretch: 3800 },
};

describe('Transformations', () => {
  SKILLS.forEach(({ id, gen }) => {
    BANDS.forEach((difficulty) => {
      it(`${id} ${difficulty}: every answer follows from what is drawn`, () => {
        const questions = new Set();
        const answers = new Set();
        const mix = {};
        for (let t = 0; t < SAMPLES; t += 1) {
          const q = gen({ difficulty });
          const { kind } = checkTransformation(q, difficulty);
          mix[kind] = (mix[kind] ?? 0) + 1;
          questions.add(JSON.stringify([q.instruction, q.questionText, q.questionMath, q.visualization.shapes, q.visualization.mirror]));
          answers.add(q.answer);
        }
        process.stdout.write(
          `${id} ${difficulty}: ${questions.size} distinct questions, ${answers.size} distinct answers; `
          + `${Object.entries(mix).sort().map(([k, v]) => `${k} ${v}`).join(', ')}\n`,
        );
        expect(Object.keys(mix).sort()).toEqual([...KINDS[id][difficulty]].sort());
        expect(questions.size).toBeGreaterThan(FLOOR[id]?.[difficulty] ?? SAMPLES * 0.9);
      });
    });
  });

  it('is served by the catalogue, in its own Geometry topic, in teaching order', () => {
    SKILLS.forEach(({ id }) => {
      expect(getSkill(id).topic).toBe('Transformations');
      BANDS.forEach((band) => checkTransformation(generateForSkill(id, band), band));
    });
    expect(strandOf('Transformations')).toBe('Geometry');
    const geo = topicGroups().find((g) => g.name === 'Geometry').topics;
    expect(geo.indexOf('Transformations')).toBe(geo.indexOf('Similarity') + 1);
    expect(skillsInTopic('Transformations')).toEqual(SKILLS.map((s) => s.id));
  });
});
