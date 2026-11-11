// Substitute-the-answer-back harness for the Probability skills in
// probabilityTopicsGenerators.js. Every answer is recomputed by
// probabilityTopicsGenerators.check.js from the printed prose, the table or
// grid in the figure, and the given probabilities, and every working line is
// checked. The mutation test beside it shows the checker fails when it
// should.
//
// Run: npx vitest run src/generators/number/probabilityTopicsGenerators.test.js

import { describe, expect, it } from 'vitest';
import { BANDS, report, sample } from '../harness.check';
import { checkProbability } from './probabilityTopicsGenerators.check';
import { getSkill, skillsInTopic } from '../../curriculum/skills';

const SAMPLES = 6000;

export const KINDS = {
  'relative-frequency': { foundation: ['from a count'], core: ['one outcome', 'two outcomes'], stretch: ['a missing frequency', 'pooled results'] },
  'two-way-tables': { foundation: ['a row or column', 'one cell'], core: ['either', 'with totals'], stretch: ['given a column', 'given a row'] },
  expectation: { foundation: ['from a fair dice', 'from a probability'], core: ['from a bag', 'from an experiment'], stretch: ['expected score', 'how many trials'] },
  'sample-spaces': { foundation: ['product', 'total'], core: ['difference', 'product', 'total'], stretch: ['given', 'three coins'] },
  'independent-events': { foundation: ['both'], core: ['neither', 'one but not the other'], stretch: ['at least one', 'exactly one'] },
  'either-or': { foundation: ['either', 'the rest'], core: ['a pack of cards', 'numbered cards'], stretch: ['find P(A and B)', 'find P(A or B)'] },
};

// The fewest distinct questions in 6,000 per band. Sample spaces are small
// by nature: two dice, or a dice and one of three spinners, with an
// operation and an event on its values, give about 230 Foundation grids
// questions and 300 at Core; the coin questions are six events on one list.
const FLOOR = {
  'relative-frequency': { foundation: 2100, core: 5500, stretch: 5500 },
  'two-way-tables': { foundation: 5500, core: 5500, stretch: 5500 },
  expectation: { foundation: 1300, core: 4200, stretch: 2800 },
  'sample-spaces': { foundation: 210, core: 270, stretch: 580 },
  'independent-events': { foundation: 3600, core: 3900, stretch: 3900 },
  'either-or': { foundation: 3600, core: 800, stretch: 950 },
};

describe('Probability: experiments, tables and sample spaces', () => {
  Object.keys(KINDS).forEach((id) => {
    BANDS.forEach((band) => {
      it(`${id} ${band}: every answer follows from what is printed`, () => {
        const result = sample(id, band, checkProbability, SAMPLES);
        report(id, band, result, SAMPLES);
        expect(Object.keys(result.mix).sort()).toEqual(KINDS[id][band]);
        expect(result.distinct).toBeGreaterThanOrEqual(FLOOR[id][band]);
      });
    });
  });

  it('sits in the Probability topic in Haese order, tree diagrams among them', () => {
    expect(skillsInTopic('Probability')).toEqual([
      'simple-probability', 'relative-frequency', 'two-way-tables', 'expectation', 'sample-spaces',
      'independent-events', 'tree-diagrams', 'either-or',
    ]);
    Object.keys(KINDS).forEach((id) => expect(getSkill(id).topic).toBe('Probability'));
  });
});
