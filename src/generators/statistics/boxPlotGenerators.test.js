// Substitute-the-answer-back harness for five-number-summary and
// box-plot-reading. The data are read back off the printed list, the table
// or the drawn plot and every statistic recomputed — see
// boxPlotGenerators.check.js. boxPlotGenerators.mutation.test.js shows the
// checker fails when it should.
//
// Run: npx vitest run src/generators/statistics/boxPlotGenerators.test.js

import { describe, expect, it } from 'vitest';
import { generateFiveNumberSummary, generateBoxPlotReading } from './boxPlotGenerators';
import { checkSummary, checkReading } from './boxPlotGenerators.check';
import { generateForSkill, getSkill, skillIds } from '../../curriculum/skills';

const SAMPLES = 6000;
const BANDS = ['foundation', 'core', 'stretch'];

const run = (name, gen, check) => describe(name, () => {
  BANDS.forEach((difficulty) => {
    it(`${difficulty}: every answer follows from what is on the board`, () => {
      const questions = new Set();
      const answers = new Set();
      for (let t = 0; t < SAMPLES; t += 1) {
        const q = gen({ difficulty });
        check(q, difficulty);
        questions.add(JSON.stringify([q.instruction, q.questionMath, q.visualization]));
        answers.add(q.answer);
      }
      process.stdout.write(`${name} ${difficulty}: ${questions.size} distinct questions, ${answers.size} distinct answers\n`);
      expect(questions.size).toBeGreaterThan(SAMPLES * 0.9);
    }, 60000);
  });
});

run('five-number-summary', generateFiveNumberSummary, checkSummary);
run('box-plot-reading', generateBoxPlotReading, checkReading);

describe('catalogue', () => {
  it('serves both skills in Spread, between quartiles-iqr and compare-distributions', () => {
    ['five-number-summary', 'box-plot-reading'].forEach((id) => expect(getSkill(id).topic).toBe('Spread'));
    const spread = skillIds.filter((id) => getSkill(id).topic === 'Spread');
    expect(spread).toEqual(['quartiles-iqr', 'five-number-summary', 'box-plot-reading', 'compare-distributions']);
    BANDS.forEach((band) => {
      checkSummary(generateForSkill('five-number-summary', band), band);
      checkReading(generateForSkill('box-plot-reading', band), band);
    });
  });
});
