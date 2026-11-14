// Substitute-the-answer-back harness for sequences-arithmetic-use-nth-term
// (sequencesGenerators.check.js), with a mutation test below it.
//
// Run: npx vitest run src/generators/algebra/sequencesGenerators.test.js

import { describe, expect, it } from 'vitest';
import { BANDS, bandMove, generic, mutants, report, sample } from '../harness.check';
import { checkUseNthTerm } from './sequencesGenerators.check';

const SAMPLES = 6000;
const KINDS = { foundation: ['first five'], core: ['decreasing', 'increasing'], stretch: ['rule from two terms', 'which term'] };
const FLOOR = { foundation: 120, core: 5000, stretch: 4000 };

describe('Arithmetic sequences: use the nth term rule', () => {
  BANDS.forEach((band) => {
    it(`${band}: every answer follows from what is printed`, () => {
      const result = sample('sequences-arithmetic-use-nth-term', band, checkUseNthTerm, SAMPLES);
      report('sequences-arithmetic-use-nth-term', band, result, SAMPLES);
      expect(Object.keys(result.mix).sort()).toEqual(KINDS[band]);
      expect(result.distinct).toBeGreaterThanOrEqual(FLOOR[band]);
    });
  });

  it('rejects every broken copy', () => {
    const ops = {
      ...generic('answer nudged', 'question line nudged', 'a working number nudged', 'the working stops short', 'metadata changed'),
      'moved to another band': bandMove(),
    };
    const tally = mutants({ skills: ['sequences-arithmetic-use-nth-term'], check: checkUseNthTerm, ops });
    Object.entries(tally).forEach(([name, r]) => expect(r.survivors.slice(0, 2), name).toEqual([]));
  }, 300000);
});
