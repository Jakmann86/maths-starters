// Substitute-the-answer-back harness for percentage-of-another
// (Percentages) and growth-decay (Profit and interest), with their
// mutation test. The checker (percentGrowthGenerators.check.js) reads each
// quantity or population back and works growth year on year.
//
// Run: npx vitest run src/generators/number/percentGrowthGenerators.test.js

import { describe, expect, it } from 'vitest';
import { BANDS, sample, report, mutants, generic, bandMove } from '../harness.check';
import { checkPercentageOfAnother, checkGrowthDecay } from './percentGrowthGenerators.check';
import { skillsInTopic } from '../../curriculum/skills';

const N = 6000;
const CHECKS = { 'percentage-of-another': checkPercentageOfAnother, 'growth-decay': checkGrowthDecay };
const check = (q, band) => CHECKS[q.metadata?.topic]?.(q, band) ?? (() => { throw new Error('topic'); })();

const KINDS = {
  'percentage-of-another': { foundation: ['out of'], core: ['different units'], stretch: ['a total', 'the rest'] },
  'growth-decay': { foundation: ['decay', 'growth'], core: ['decay', 'growth'], stretch: ['decay', 'growth'] },
};

// Distinct questions in 6,000, each floor a little under what is seen.
// k out of n as a whole-number percentage, with n from fourteen friendly
// totals, is about 650 in all; everything else runs to thousands.
const FLOOR = {
  'percentage-of-another': { foundation: 570, core: 3900, stretch: 4300 },
  'growth-decay': { foundation: 5400, core: 5300, stretch: 4950 },
};

describe('percentages of another, and growth and decay', () => {
  Object.keys(CHECKS).forEach((id) => BANDS.forEach((band) => {
    it(`${id} ${band}: the answer follows from what is printed`, () => {
      const r = sample(id, band, check, N);
      report(id, band, r, N);
      expect(Object.keys(r.mix).sort()).toEqual([...KINDS[id][band]].sort());
      expect(r.distinct).toBeGreaterThanOrEqual(FLOOR[id][band]);
    });
  }));

  it('sits beside the skills it extends', () => {
    expect(skillsInTopic('Percentages').slice(0, 2)).toEqual(['percentage-of-amount', 'percentage-of-another']);
    expect(skillsInTopic('Profit and interest').at(-1)).toBe('growth-decay');
  });

  it('rejects every broken copy', () => {
    const ops = {
      ...generic('answer nudged', 'question line nudged', 'a working number nudged', 'metadata changed'),
      'a number in the prose nudged': (q) => {
        const m = /\d+/.exec(q.questionText ?? '');
        if (!m) return false;
        q.questionText = q.questionText.replace(m[0], String(Number(m[0]) + 1));
      },
      'the rate nudged': (q) => {
        const m = /by (\d+)% each/.exec(q.questionText ?? '');
        if (!m) return false;
        q.questionText = q.questionText.replace(m[0], `by ${Number(m[1]) + 1}% each`);
      },
      'growth turned to decay': (q) => {
        if (!/grows|grew/.test(q.questionText ?? '')) return false;
        q.questionText = q.questionText.replace('grows', 'falls').replace('grew', 'fell');
      },
      'moved to another band': bandMove({ foundation: 'core', core: 'stretch', stretch: 'foundation' }),
    };
    const tally = mutants({ skills: Object.keys(CHECKS), check, ops, perBand: 200 });
    Object.entries(tally).forEach(([name, r]) => expect(r.survivors.slice(0, 2).map((s) => s.q), name).toEqual([]));
    expect(Object.keys(tally).sort()).toEqual(Object.keys(ops).sort());
  });
});
