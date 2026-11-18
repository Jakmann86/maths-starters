// Substitute-the-answer-back harness for Money and rates, with its
// mutation test: exchange-rates and rates. The checker
// (ratesGenerators.check.js) reads each rate and amount back from the prose
// and works the answer out in whole pence, cents or yen.
//
// Run: npx vitest run src/generators/number/ratesGenerators.test.js

import { describe, expect, it } from 'vitest';
import { BANDS, sample, report, mutants, generic, bandMove } from '../harness.check';
import { checkExchangeRates, checkRates } from './ratesGenerators.check';
import { skillsInTopic, strandOf } from '../../curriculum/skills';

const N = 6000;
const CHECKS = { 'exchange-rates': checkExchangeRates, rates: checkRates };
const check = (q, band) => CHECKS[q.metadata?.topic]?.(q, band) ?? (() => { throw new Error('topic'); })();

const KINDS = {
  'exchange-rates': { foundation: ['to another currency'], core: ['to pounds'], stretch: ['cheaper abroad', 'cheaper in London'] },
  rates: { foundation: ['flow', 'pay'], core: ['fuel', 'time to fill'], stretch: ['fuel cost', 'overtime'] },
};

// Distinct questions in 6,000, each floor a little under what is seen;
// every band runs to thousands.
const FLOOR = {
  'exchange-rates': { foundation: 4400, core: 4400, stretch: 5800 },
  rates: { foundation: 4000, core: 4050, stretch: 5400 },
};

describe('money and rates', () => {
  Object.keys(CHECKS).forEach((id) => BANDS.forEach((band) => {
    it(`${id} ${band}: the answer follows from what is printed`, () => {
      const r = sample(id, band, check, N);
      report(id, band, r, N);
      expect(Object.keys(r.mix).sort()).toEqual([...KINDS[id][band]].sort());
      expect(r.distinct).toBeGreaterThanOrEqual(FLOOR[id][band]);
    });
  }));

  it('is its own topic in Number', () => {
    expect(skillsInTopic('Money and rates')).toEqual(Object.keys(CHECKS));
    expect(strandOf('Money and rates')).toBe('Number');
  });

  it('rejects every broken copy', () => {
    const ops = {
      ...generic('answer nudged', 'a working number nudged', 'metadata changed'),
      'a number in the prose nudged': (q) => {
        const hits = [...q.questionText.matchAll(/\d+/g)];
        const h = hits.at(-1);
        q.questionText = q.questionText.slice(0, h.index) + String(Number(h[0]) + 1) + q.questionText.slice(h.index + h[0].length);
      },
      'the rate changed': (q) => {
        const m = /£1 = ([€$¥])([\d.]+)/.exec(q.questionText);
        if (!m) return false;
        const r = m[2].includes('.') ? (Number(m[2]) + 0.01).toFixed(2) : String(Number(m[2]) + 1);
        q.questionText = q.questionText.replace(m[0], `£1 = ${m[1]}${r}`);
      },
      'the cheaper place swapped': (q) => {
        const m = /^\\text\{([A-Z][A-Za-z ]+), by/.exec(q.answer);
        if (!m) return false;
        const place = /in ([A-Z][A-Za-z ]+)\. The exchange/.exec(q.questionText)[1];
        q.answer = q.answer.replace(m[1], m[1] === 'London' ? place : 'London');
      },
      'the unit changed': (q) => {
        if (!q.answerUnits) return false;
        q.answerUnits = q.answerUnits === 'litres' ? 'minutes' : 'litres';
      },
      'moved to another band': bandMove({ foundation: 'core', core: 'stretch', stretch: 'foundation' }),
    };
    const tally = mutants({ skills: Object.keys(CHECKS), check, ops, perBand: 200 });
    Object.entries(tally).forEach(([name, r]) => expect(r.survivors.slice(0, 2).map((s) => s.q), name).toEqual([]));
    expect(Object.keys(tally).sort()).toEqual(Object.keys(ops).sort());
  });
});
