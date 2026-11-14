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

const turns = (mode, list = ['90 acw', '90 cw', '180']) => list.map((t) => `${mode} rotation ${t}`);
// Shape and point questions, both, for each kind.
const both = (kinds) => kinds.flatMap((k) => [`carry ${k}`, `point ${k}`]);
const KINDS = {
  translation: {
    foundation: both(['translation words']),
    core: both(['translation vector']),
    stretch: both(['translation negative vector', 'translation two vectors']),
  },
  reflection: {
    foundation: both(['reflection axis']),
    core: both(['reflection x = a', 'reflection y = b']),
    stretch: both(['reflection y = x', 'reflection y = -x']),
  },
  rotation: {
    foundation: [...turns('carry'), ...turns('point')],
    core: [...turns('carry', ['180']), ...turns('point', ['180'])],
    stretch: [...turns('carry', ['90 acw', '90 cw']), ...turns('point', ['90 acw', '90 cw'])],
  },
  enlargement: {
    foundation: ['carry enlargement sf 2 from a corner', 'carry enlargement sf 3 from a corner'],
    core: ['carry enlargement sf 2', 'carry enlargement sf 3'],
    stretch: ['carry enlargement sf 1/2', 'carry enlargement sf -1', 'carry enlargement sf -2'],
  },
  'describe-transformation': {
    foundation: ['describe reflection axis', 'describe reflection x = a', 'describe reflection y = b', ...turns('describe'), 'describe translation'],
    core: ['describe enlargement sf 2', 'describe enlargement sf 3', 'describe reflection axis', 'describe reflection x = a', 'describe reflection y = b', 'describe reflection y = x', ...turns('describe'), 'describe translation'],
    stretch: ['describe enlargement sf 1/2', 'describe reflection y = -x', 'describe reflection y = x', 'describe rotation 90 acw', 'describe rotation 90 cw'],
  },
};

// Distinct questions in 6,000 run from about 1,800 to 6,000 per band. Every
// shape sits in one quadrant, clear of the axes, on a grid of at most 14 by
// 10 with the origin on it, so the class can read it, and that is the
// ceiling. A point question (one in three) has fewer still: a point off the
// axes within six squares of the origin, so a few hundred per line or turn.
// Enlargements are the tightest: there are exactly 2,080 ways to place a
// shape and its enlargement by 2 (or by a half), and only 320 by 3, so
// Enlargement Core, sampled 6,000 times, shows about 1,800. A mirror in an
// axis or a diagonal through the origin has only so many places for a
// shape too.
const FLOOR = {
  translation: { core: 5000 },
  reflection: { foundation: 3300, core: 4200, stretch: 2300 },
  rotation: { foundation: 3500, core: 4400, stretch: 5200 },
  enlargement: { foundation: 2600, core: 2300, stretch: 4500 },
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
