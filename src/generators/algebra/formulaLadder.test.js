// Substitute-the-answer-back harness for formula substitution, formula
// rearrangement and the two simultaneous-equations skills
// (formulaGenerators.check.js), with a mutation test below it.
//
// Run: npx vitest run src/generators/algebra/formulaLadder.test.js

import { describe, expect, it } from 'vitest';
import { BANDS, bandMove, generic, mutants, report, sample } from '../harness.check';
import { checkFormula } from './formulaGenerators.check';

const SAMPLES = 6000;
const KINDS = {
  'formula-substitution': { foundation: ['whole', 'with pi'], core: ['solve'], stretch: ['rearrange first'] },
  'formula-rearrangement': { foundation: ['positive'], core: ['minus outside', 'tidied'], stretch: ['denominator', 'root', 'root of an expression'] },
  'simultaneous-substitution': { foundation: ['equating y', 'x + y'], core: ['into ax + by'], stretch: ['rearranged first'] },
  'simultaneous-elimination': { foundation: ['add', 'subtract'], core: ['multiply one'], stretch: ['multiply both'] },
};
// The fewest distinct questions in 6,000 per band. Stretch rearrangement is
// three formula shapes with one or two numbers each (about 500).
const FLOOR = {
  'formula-substitution': { foundation: 2400, core: 3200, stretch: 3800 },
  'formula-rearrangement': { foundation: 1600, core: 2700, stretch: 450 },
  'simultaneous-substitution': { foundation: 3300, core: 5300, stretch: 5300 },
  'simultaneous-elimination': { foundation: 5400, core: 5400, stretch: 5400 },
};

describe('Formulae and simultaneous equations', () => {
  Object.keys(KINDS).forEach((id) => {
    BANDS.forEach((band) => {
      it(`${id} ${band}: every answer follows from what is printed`, () => {
        const result = sample(id, band, checkFormula, SAMPLES);
        report(id, band, result, SAMPLES);
        expect(Object.keys(result.mix).sort()).toEqual(KINDS[id][band]);
        expect(result.distinct).toBeGreaterThanOrEqual(FLOOR[id][band]);
      });
    });
  });

  it('rejects every broken copy', () => {
    const ops = {
      ...generic('answer nudged', 'question line nudged', 'a working number nudged', 'the working stops short', 'metadata changed'),
      'moved to another band': bandMove(),
      'a sign flipped in the answer': (q) => {
        if (!/ [+-] /.test(q.answer)) return false;
        q.answer = q.answer.replace(/ ([+-]) /, (w, c) => ` ${c === '+' ? '-' : '+'} `);
      },
      'x and y swapped': (q) => {
        const m = /^x = (-?\d+), \\ y = (-?\d+)$/.exec(q.answer);
        if (!m || m[1] === m[2]) return false;
        q.answer = `x = ${m[2]}, \\ y = ${m[1]}`;
      },
    };
    const tally = mutants({ skills: Object.keys(KINDS), check: checkFormula, ops });
    if (process.env.SHOW) Object.entries(tally).forEach(([name, r]) => r.survivors.slice(0, 3).forEach((x) => console.log('SURV', name, JSON.stringify(x.q))));
    Object.entries(tally).forEach(([name, r]) => expect(r.survivors.slice(0, 2), name).toEqual([]));
  }, 600000);
});
