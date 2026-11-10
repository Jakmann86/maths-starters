// Substitute-the-answer-back harness for Logarithms. Every answer is
// recomputed by logarithmGenerators.check.js from the printed question
// alone, with its own reader for logs, roots and powers, and every working
// line is checked. The mutation test beside it shows the checker fails when
// it should.
//
// Distinct questions are honest ceilings where they are small: a log you can
// evaluate without a calculator is a power of a small base, and there are
// only so many of those.
// - Index form at Foundation is a whole-number power of a base from 2 to 10,
//   up to 10 000, either way round: 88. Core adds negative powers (values
//   down to 1/1000) and fractional ones of 2, 3, 5 and 10: 192.
// - Evaluating at Foundation is the same powers, plus log 1 and log_a a: 62.
//   Core is their reciprocals, as fractions or terminating decimals: 50.
//   Stretch is roots and root or power bases: 130.
// - Solving log equations at Foundation is log_a x = n or log_x N = n over
//   those powers: 80. Core keeps a linear argument as clean as Haese's
//   log_5(2x) = −1 (no constant beside a negative power, a whole answer
//   otherwise): 235 with the negative and fractional powers. Stretch's two-logs-of-x questions need a power of the
//   base that factorises as r(r + d) with d at most 12: 295 with the others.
//
// Run: npx vitest run src/generators/number/logarithmGenerators.test.js

import { describe, expect, it } from 'vitest';
import { BANDS, report, sample } from '../harness.check';
import { checkLog } from './logarithmGenerators.check';
import { getSkill, skillsInTopic, strandOf, topicGroups } from '../../curriculum/skills';

const SAMPLES = 6000;

const KINDS = {
  'log-index-form': {
    foundation: ['to index form', 'to log form'],
    core: ['fractional power, to index form', 'fractional power, to log form', 'negative power, to index form', 'negative power, to log form'],
    stretch: ['index to log', 'log to index'],
  },
  'evaluate-logs': { foundation: ['a power', 'log of 1', 'log of the base'], core: ['decimal', 'fraction'], stretch: ['power base', 'root argument', 'root base'] },
  'log-single': { foundation: ['difference', 'sum'], core: ['three terms', 'two terms'], stretch: ['a fraction in front', 'whole number'] },
  'log-in-terms': { foundation: ['power', 'product', 'quotient'], core: ['product of powers', 'quotient of powers'], stretch: ['fraction or decimal', 'whole number'] },
  'log-remove': { foundation: ['from the definition', 'one law'], core: ['powers divided', 'powers multiplied'], stretch: ['a constant', 'a fraction in front'] },
  'log-solve-exponential': { foundation: ['negative answer', 'positive answer'], core: ['negative answer', 'positive answer'], stretch: ['coefficient', 'decay model', 'growth model', 'linear index'] },
  'log-equations': { foundation: ['find the base', 'find the number'], core: ['linear inside', 'negative or fractional'], stretch: ['combine with a number', 'two logs of x'] },
};

// The fewest distinct questions in 6,000 per band.
const FLOOR = {
  'log-index-form': { foundation: 85, core: 180, stretch: 950 },
  'evaluate-logs': { foundation: 60, core: 48, stretch: 125 },
  'log-single': { foundation: 820, core: 4100, stretch: 1450 },
  'log-in-terms': { foundation: 260, core: 870, stretch: 2750 },
  'log-remove': { foundation: 680, core: 1100, stretch: 2600 },
  'log-solve-exponential': { foundation: 4000, core: 4000, stretch: 4800 },
  'log-equations': { foundation: 78, core: 225, stretch: 280 },
};

describe('Logarithms', () => {
  Object.keys(KINDS).forEach((id) => {
    BANDS.forEach((band) => {
      it(`${id} ${band}: every answer follows from what is printed`, () => {
        const result = sample(id, band, checkLog, SAMPLES);
        report(id, band, result, SAMPLES);
        expect(Object.keys(result.mix).sort()).toEqual(KINDS[id][band]);
        expect(result.distinct).toBeGreaterThanOrEqual(FLOOR[id][band]);
      });
    });
  });

  it('is its own Number topic, after Indices, in teaching order', () => {
    Object.keys(KINDS).forEach((id) => expect(getSkill(id).topic).toBe('Logarithms'));
    expect(skillsInTopic('Logarithms')).toEqual(Object.keys(KINDS));
    expect(strandOf('Logarithms')).toBe('Number');
    const num = topicGroups().find((g) => g.name === 'Number').topics;
    expect(num.indexOf('Logarithms')).toBe(num.indexOf('Indices') + 1);
  });
});
