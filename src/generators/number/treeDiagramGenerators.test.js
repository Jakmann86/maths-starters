// Substitute-the-answer-back harness for tree-diagrams. Each answer is
// recomputed from the branch labels on the figure, the set-up sentence and
// the ask — see treeDiagramGenerators.check.js — never from the generator's
// variables. treeDiagramGenerators.mutation.test.js shows the checker fails
// when it should.
//
// Run: npx vitest run src/generators/number/treeDiagramGenerators.test.js

import { describe, expect, it } from 'vitest';
import { generateTreeDiagrams } from './treeDiagramGenerators';
import { checkTree } from './treeDiagramGenerators.check';
import { generateForSkill, strandOf, getSkill } from '../../curriculum/skills';

const SAMPLES = 6000;
const BANDS = ['foundation', 'core', 'stretch'];

describe('tree-diagrams', () => {
  BANDS.forEach((difficulty) => {
    it(`${difficulty}: every answer follows from the tree, the set-up and the ask`, () => {
      const questions = new Set();
      const maths = new Set();
      const answers = new Set();
      const mix = {};
      for (let t = 0; t < SAMPLES; t += 1) {
        const q = generateTreeDiagrams({ difficulty });
        const s = checkTree(q, difficulty);
        const fig = q.visualization;
        questions.add(`${q.instruction}|${q.questionText}|${JSON.stringify(fig.probs)}`);
        // The maths alone: the tree's numbers and which paths are asked for,
        // with colours, names and contexts set aside.
        maths.add(`${JSON.stringify({ ...fig.probs, ...fig.solution })}|${s.paths}`);
        answers.add(q.answer);
        const key = s.source === 'bag' ? `bag ${s.replace ? 'with' : 'without'}` : `event ${s.independent ? 'independent' : 'dependent'}`;
        mix[key] = (mix[key] ?? 0) + 1;
      }
      process.stdout.write(
        `tree-diagrams ${difficulty}: ${questions.size} distinct questions, ` +
        `${maths.size} distinct as maths, ${answers.size} distinct answers; ` +
        `${Object.entries(mix).map(([k, v]) => `${k} ${v}`).join(', ')}\n`,
      );
      expect(questions.size).toBeGreaterThan(SAMPLES * 0.5);
    });
  });

  it('every band draws on every source it is meant to', () => {
    const seen = { foundation: new Set(), core: new Set(), stretch: new Set() };
    BANDS.forEach((difficulty) => {
      for (let t = 0; t < 2000; t += 1) {
        const s = checkTree(generateTreeDiagrams({ difficulty }), difficulty);
        seen[difficulty].add(s.source === 'bag' ? (s.replace ? 'with' : 'without') : (s.independent ? 'independent' : 'dependent'));
      }
    });
    expect([...seen.foundation].sort()).toEqual(['independent', 'with']);
    expect([...seen.core].sort()).toEqual(['dependent', 'independent', 'with', 'without']);
    expect([...seen.stretch]).toEqual(['without']);
  });

  it('is served by the catalogue, in the Probability topic', () => {
    expect(strandOf(getSkill('tree-diagrams').topic)).toBe('Statistics and probability');
    BANDS.forEach((band) => checkTree(generateForSkill('tree-diagrams', band), band));
  });
});
