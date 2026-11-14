// src/generators/number/percentageGenerators.test.js
//
// Substitute-the-answer-back checks for the six percentages skills
// (percentageGenerators.check.js), with a mutation test, and the Foundation
// band of index-laws-multiply-divide.
//
// Every value is recovered from the printed question/answer text (parsing
// the £/comma-formatted story wording as well as the plain-math one) and
// checked against the p/100 relationship directly, never against the
// generator's own p/n/part variables.
//
// Run: npx vitest run src/generators/number/percentageGenerators.test.js

import { describe, expect, it } from 'vitest';
import { bandMove, generic, mutants, report, sample } from '../harness.check';
import { checkPercentage } from './percentageGenerators.check';
import { generateIndexLawsMultiplyDivide as generateIndexLaws } from './indexLawGenerators';

const BANDS = ['foundation', 'core', 'stretch'];
const SAMPLES = 3000;


const KINDS = {
  'percentage-of-amount': { foundation: ['percent'], core: ['over 100%', 'percent'], stretch: ['half percent'] },
  'reverse-percentages': { foundation: ['part known'], core: ['part known'], stretch: ['after a change'] },
  'percentage-multiplier': { foundation: ['decrease', 'increase'], core: ['decrease', 'increase'], stretch: ['two changes'] },
  'multiplier-to-percentage': { foundation: ['decrease', 'increase'], core: ['decrease', 'increase'], stretch: ['two multipliers'] },
  'percentage-change': { foundation: ['one step'], core: ['two steps'], stretch: ['compound'] },
  'percentage-change-find': { foundation: ['whole percent'], core: ['one decimal place'], stretch: ['loss', 'profit'] },
};
// The fewest distinct questions in 6,000 per band. Small ones are honest:
// Foundation percentage of an amount is six friendly percentages of round
// amounts with whole answers (about 350); a whole-percentage multiplier is
// 90 percentages either way (180).
const FLOOR = {
  'percentage-of-amount': { foundation: 300, core: 5300, stretch: 1000 },
  'reverse-percentages': { foundation: 2800, core: 4400, stretch: 3600 },
  'percentage-multiplier': { foundation: 170, core: 1800, stretch: 3500 },
  'multiplier-to-percentage': { foundation: 170, core: 1800, stretch: 1400 },
  'percentage-change': { foundation: 4600, core: 5300, stretch: 5300 },
  'percentage-change-find': { foundation: 5000, core: 5300, stretch: 4200 },
};

describe('Percentages: every answer follows from what is printed', () => {
  Object.keys(KINDS).forEach((id) => {
    BANDS.forEach((band) => {
      it(`${id} ${band}`, () => {
        const result = sample(id, band, checkPercentage, 6000);
        report(id, band, result, 6000);
        expect(Object.keys(result.mix).sort()).toEqual(KINDS[id][band]);
        expect(result.distinct).toBeGreaterThanOrEqual(FLOOR[id][band]);
      });
    });
  });

  it('rejects every broken copy', () => {
    const ops = {
      ...generic('answer nudged', 'question line nudged', 'metadata changed'),
      'moved to another band': bandMove(),
      'increase and decrease swapped': (q) => {
        const f = (s) => s.replace(/increase|decrease/, (w) => (w === 'increase' ? 'decrease' : 'increase'));
        if (/increase|decrease/.test(q.answer)) q.answer = f(q.answer);
        else if (q.questionMath && /increase|decrease/.test(q.questionMath)) q.questionMath = f(q.questionMath);
        else return false;
      },
      'a number in the story nudged': (q) => {
        if (!q.questionText) return false;
        q.questionText = q.questionText.replace(/(\d)(?=[^\d]*$)|(\d)%/, (m, a, b) => (a ? String((Number(a) + 1) % 10) : `${(Number(b) + 1) % 10}%`));
      },
    };
    const tally = mutants({ skills: Object.keys(KINDS), check: checkPercentage, ops });
    if (process.env.SHOW) Object.entries(tally).forEach(([name, r]) => r.survivors.slice(0, 3).forEach((x) => console.log('SURV', name, JSON.stringify(x.q))));
    Object.entries(tally).forEach(([name, r]) => expect(r.survivors.slice(0, 2), name).toEqual([]));
  }, 600000);
});

describe('index-laws-multiply-divide foundation', () => {
  it('is correct, and writes some divides as a fraction', () => {
    const forms = { times: 0, div: 0, frac: 0 };
    const distinct = new Set();
    for (let i = 0; i < SAMPLES; i += 1) {
      const q = generateIndexLaws({ difficulty: 'foundation' });
      distinct.add(q.questionMath);
      // Recover base and both indices from the question, in any of its three forms.
      const t = q.questionMath.match(/^(\d+)\^\{(\d+)\} \\(times|div) (\d+)\^\{(\d+)\}$/);
      const f = q.questionMath.match(/^\\frac\{(\d+)\^\{(\d+)\}\}\{(\d+)\^\{(\d+)\}\}$/);
      expect(t || f, q.questionMath).toBeTruthy();
      const [b1, m, op, b2, n] = t ? [t[1], t[2], t[3], t[4], t[5]] : [f[1], f[2], 'frac', f[3], f[4]];
      expect(b1).toBe(b2);
      forms[op] += 1;
      const want = Number(b1) ** (op === 'times' ? Number(m) + Number(n) : Number(m) - Number(n));
      expect(Number(q.answer), q.questionMath).toBe(want);
      expect(Number.isInteger(want) && want >= Number(b1)).toBe(true);
    }
    // Half multiply; the divides split evenly between ÷ and a fraction.
    expect(forms.times / SAMPLES).toBeGreaterThan(0.45);
    expect(forms.frac / SAMPLES).toBeGreaterThan(0.2);
    expect(forms.div / SAMPLES).toBeGreaterThan(0.2);
    console.log('index-laws foundation forms', forms, 'distinct', distinct.size);
  });
});
