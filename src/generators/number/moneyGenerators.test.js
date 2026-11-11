// Substitute-the-answer-back harness for Profit and interest. Every answer
// is recomputed by moneyGenerators.check.js from the printed prose alone, in
// whole pence (BigInt for compound growth), and every working line is
// checked. The mutation test beside it shows the checker fails when it
// should.
//
// Run: npx vitest run src/generators/number/moneyGenerators.test.js

import { describe, expect, it } from 'vitest';
import { BANDS, report, sample } from '../harness.check';
import { checkMoney } from './moneyGenerators.check';
import { getSkill, skillsInTopic, strandOf } from '../../curriculum/skills';

const SAMPLES = 6000;

export const KINDS = {
  'profit-loss': {
    foundation: ['loss', 'profit'],
    core: ['percentage loss', 'percentage profit'],
    stretch: ['cost price, loss', 'cost price, profit'],
  },
  'simple-interest': {
    foundation: ['interest charged', 'interest earned'],
    core: ['total over months', 'total over years'],
    stretch: ['principal', 'rate', 'time'],
  },
  'compound-interest': {
    foundation: ['value'],
    core: ['depreciation', 'interest earned'],
    stretch: ['principal', 'rate'],
  },
};

// The fewest distinct questions in 6,000 per band.
const FLOOR = {
  'profit-loss': { foundation: 4400, core: 4700, stretch: 3800 },
  'simple-interest': { foundation: 4900, core: 5000, stretch: 5200 },
  'compound-interest': { foundation: 3600, core: 4700, stretch: 4100 },
};

describe('Profit and interest', () => {
  Object.keys(KINDS).forEach((id) => {
    BANDS.forEach((band) => {
      it(`${id} ${band}: every answer follows from what is printed`, () => {
        const result = sample(id, band, checkMoney, SAMPLES);
        report(id, band, result, SAMPLES);
        expect(Object.keys(result.mix).sort()).toEqual(KINDS[id][band]);
        expect(result.distinct).toBeGreaterThanOrEqual(FLOOR[id][band]);
      });
    });
  });

  it('is its own Number topic, in teaching order', () => {
    Object.keys(KINDS).forEach((id) => expect(getSkill(id).topic).toBe('Profit and interest'));
    expect(skillsInTopic('Profit and interest')).toEqual(Object.keys(KINDS));
    expect(strandOf('Profit and interest')).toBe('Number');
  });
});
