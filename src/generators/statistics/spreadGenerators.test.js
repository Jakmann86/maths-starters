// Substitute-the-answer-back harness for quartiles-iqr and
// compare-distributions. The data are read back off the printed list or the
// table and every statistic recomputed — see spreadGenerators.check.js.
// spreadGenerators.mutation.test.js shows the checker fails when it should.
//
// Run: npx vitest run src/generators/statistics/spreadGenerators.test.js

import { describe, expect, it } from 'vitest';
import { generateQuartilesIqr, generateCompareDistributions } from './spreadGenerators';
import { checkQuartiles, checkCompare } from './spreadGenerators.check';
import { generateForSkill, getSkill, strandOf } from '../../curriculum/skills';

const SAMPLES = 6000;
const BANDS = ['foundation', 'core', 'stretch'];

const run = (name, gen, check) => describe(name, () => {
  BANDS.forEach((difficulty) => {
    it(`${difficulty}: every answer follows from the data on the board`, () => {
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

run('quartiles-iqr', generateQuartilesIqr, checkQuartiles);
run('compare-distributions', generateCompareDistributions, checkCompare);

describe('catalogue', () => {
  it('serves both skills in the Spread topic of the statistics strand', () => {
    ['quartiles-iqr', 'compare-distributions'].forEach((id) => expect(getSkill(id).topic).toBe('Spread'));
    expect(strandOf('Spread')).toBe('Statistics and probability');
    BANDS.forEach((band) => {
      checkQuartiles(generateForSkill('quartiles-iqr', band), band);
      checkCompare(generateForSkill('compare-distributions', band), band);
    });
  });
});
