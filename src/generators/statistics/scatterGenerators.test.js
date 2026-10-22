// Substitute-the-answer-back harness for scatter-correlation and
// line-of-best-fit. Every answer is recomputed from the plotted points, the
// drawn line, the axis titles and the printed sentences — see
// scatterGenerators.check.js. scatterGenerators.mutation.test.js shows the
// checker fails when it should.
//
// Run: npx vitest run src/generators/statistics/scatterGenerators.test.js

import { describe, expect, it } from 'vitest';
import { generateScatterCorrelation, generateLineOfBestFit } from './scatterGenerators';
import { checkCorrelation, checkLineOfBestFit } from './scatterGenerators.check';
import { generateForSkill, getSkill, strandOf } from '../../curriculum/skills';

const SAMPLES = 5000;
const BANDS = ['foundation', 'core', 'stretch'];

const run = (name, gen, check) => describe(name, () => {
  BANDS.forEach((difficulty) => {
    it(`${difficulty}: every answer follows from what is on the board`, () => {
      const questions = new Set();
      const answers = new Set();
      const tally = {};
      for (let t = 0; t < SAMPLES; t += 1) {
        const q = gen({ difficulty });
        const s = check(q, difficulty);
        questions.add(JSON.stringify([q.instruction, q.questionText, q.visualization]));
        answers.add(q.answer + (q.answerUnits ?? ''));
        const key = s.strength ?? (s.inside === undefined ? (s.odd ? 'outlier' : 'mean point') : s.inside ? 'inside' : 'outside');
        tally[key] = (tally[key] ?? 0) + 1;
      }
      process.stdout.write(`${name} ${difficulty}: ${questions.size} distinct questions, ${answers.size} distinct answers; ${JSON.stringify(tally)}\n`);
      expect(questions.size).toBeGreaterThan(SAMPLES * 0.9);
    }, 60000);
  });
});

run('scatter-correlation', generateScatterCorrelation, checkCorrelation);
run('line-of-best-fit', generateLineOfBestFit, checkLineOfBestFit);

describe('catalogue', () => {
  it('serves both skills in the Scatter graphs topic of the statistics strand', () => {
    ['scatter-correlation', 'line-of-best-fit'].forEach((id) => {
      expect(getSkill(id).topic).toBe('Scatter graphs');
      expect(strandOf('Scatter graphs')).toBe('Statistics and probability');
    });
    BANDS.forEach((band) => {
      checkCorrelation(generateForSkill('scatter-correlation', band), band);
      checkLineOfBestFit(generateForSkill('line-of-best-fit', band), band);
    });
  });
});
