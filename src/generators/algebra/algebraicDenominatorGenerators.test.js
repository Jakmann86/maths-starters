// Substitute-the-answer-back harness for algebraic-denominators, with its
// mutation test. The checker (algebraicDenominatorGenerators.check.js)
// reads each equation into a function of x and requires the answer to be
// its only solution, with every working line true there and nowhere near.
//
// Run: npx vitest run src/generators/algebra/algebraicDenominatorGenerators.test.js

import { describe, expect, it } from 'vitest';
import { BANDS, sample, report, mutants, generic, bandMove } from '../harness.check';
import { checkAlgebraicDenominators } from './algebraicDenominatorGenerators.check';
import { skillsInTopic } from '../../curriculum/skills';

const N = 6000;
const check = (q, band) => checkAlgebraicDenominators(q, band);
const KINDS = { foundation: ['number over x'], core: ['x above and below'], stretch: ['two fractions'] };
// Distinct questions in 6,000, floors a little under what is seen. A number
// over a short expression with a small whole answer is the smallest pool,
// about 2,300.
const FLOOR = { foundation: 2100, core: 5200, stretch: 3400 };

describe('equations with x in the denominator', () => {
  BANDS.forEach((band) => {
    it(`algebraic-denominators ${band}: the answer solves what is printed`, () => {
      const r = sample('algebraic-denominators', band, check, N);
      report('algebraic-denominators', band, r, N);
      expect(Object.keys(r.mix)).toEqual(KINDS[band]);
      expect(r.distinct).toBeGreaterThanOrEqual(FLOOR[band]);
    });
  });

  it('follows the other fraction equations', () => {
    const eq = skillsInTopic('Equations');
    expect(eq[eq.indexOf('solve-fractional-coefficients') + 1]).toBe('algebraic-denominators');
  });

  it('rejects every broken copy', () => {
    const ops = {
      ...generic('answer nudged', 'question line nudged', 'a working number nudged', 'the working stops short', 'metadata changed'),
      'a denominator sign flipped': (q) => {
        const m = /\}\{([^{}]*?)([+-]) (\d+)\}/.exec(q.questionMath);
        if (!m) return false;
        q.questionMath = q.questionMath.replace(m[0], `}{${m[1]}${m[2] === '+' ? '-' : '+'} ${m[3]}}`);
      },
      'moved to another band': bandMove({ foundation: 'core', core: 'stretch', stretch: 'foundation' }),
    };
    const tally = mutants({ skills: ['algebraic-denominators'], check, ops, perBand: 200 });
    Object.entries(tally).forEach(([name, r]) => expect(r.survivors.slice(0, 2).map((s) => s.q), name).toEqual([]));
    expect(Object.keys(tally).sort()).toEqual(Object.keys(ops).sort());
  });
});
