// Substitute-the-answer-back harness for Factors and multiples, with its
// mutation test: prime-factors and hcf-lcm. The checker
// (factorGenerators.check.js) tests primes, multiplies factorisations back
// out and finds each HCF and LCM from the numbers themselves.
//
// Run: npx vitest run src/generators/number/factorGenerators.test.js

import { describe, expect, it } from 'vitest';
import { BANDS, sample, report, mutants, generic, bandMove } from '../harness.check';
import { checkPrimeFactors, checkHcfLcm } from './factorGenerators.check';
import { skillsInTopic, strandOf } from '../../curriculum/skills';

const N = 6000;
const CHECKS = { 'prime-factors': checkPrimeFactors, 'hcf-lcm': checkHcfLcm };
const check = (q, band) => CHECKS[q.metadata?.topic]?.(q, band) ?? (() => { throw new Error('topic'); })();

const KINDS = {
  'prime-factors': { foundation: ['product'], core: ['index form'], stretch: ['cube', 'square'] },
  'hcf-lcm': { foundation: ['HCF', 'LCM'], core: ['both'], stretch: ['HCF problem', 'LCM problem'] },
};

// Distinct questions in 6,000, each floor a little under what is seen. The
// numbers are their own pools. Foundation is every number up to 200 with
// three or more prime factors, none above 13: 69 in all, all seen. Core is
// every number from 100 to 2000 with a repeated prime: 228 in all. Listing
// factors or multiples keeps Foundation HCF and LCM to two numbers up to
// 48: 291 pairs.
const FLOOR = {
  'prime-factors': { foundation: 66, core: 220, stretch: 860 },
  'hcf-lcm': { foundation: 280, core: 2700, stretch: 1120 },
};

describe('factors and multiples', () => {
  Object.keys(CHECKS).forEach((id) => BANDS.forEach((band) => {
    it(`${id} ${band}: the answer follows from what is printed`, () => {
      const r = sample(id, band, check, N);
      report(id, band, r, N);
      expect(Object.keys(r.mix).sort()).toEqual([...KINDS[id][band]].sort());
      expect(r.distinct).toBeGreaterThanOrEqual(FLOOR[id][band]);
    });
  }));

  it('is its own topic in Number', () => {
    expect(skillsInTopic('Factors and multiples')).toEqual(Object.keys(CHECKS));
    expect(strandOf('Factors and multiples')).toBe('Number');
  });

  it('rejects every broken copy', () => {
    const ops = {
      ...generic('answer nudged', 'question line nudged', 'a working number nudged', 'metadata changed'),
      'a prime swapped in the answer': (q) => {
        if (!/\\times/.test(q.answer)) return false;
        q.answer = q.answer.replace(/^(\d+)/, (d) => (d === '2' ? '3' : '2'));
      },
      'a number in the prose nudged': (q) => {
        const m = /\d+/.exec(q.questionText ?? '');
        if (!m) return false;
        q.questionText = q.questionText.replace(m[0], String(Number(m[0]) + 1));
      },
      'HCF and LCM swapped': (q) => {
        const m = /^\\text\{HCF\} = (\d+), \\ \\text\{LCM\} = (\d+)$/.exec(q.answer);
        if (!m) return false;
        q.answer = `\\text{HCF} = ${m[2]}, \\ \\text{LCM} = ${m[1]}`;
      },
      'square and cube swapped': (q) => {
        if (!/square|cube/.test(q.instruction)) return false;
        q.instruction = q.instruction.includes('square') ? q.instruction.replace('square', 'cube') : q.instruction.replace('cube', 'square');
      },
      'moved to another band': bandMove({ foundation: 'core', core: 'stretch', stretch: 'foundation' }),
    };
    const tally = mutants({ skills: Object.keys(CHECKS), check, ops, perBand: 200 });
    Object.entries(tally).forEach(([name, r]) => expect(r.survivors.slice(0, 2).map((s) => s.q), name).toEqual([]));
    expect(Object.keys(tally).sort()).toEqual(Object.keys(ops).sort());
  });
});
