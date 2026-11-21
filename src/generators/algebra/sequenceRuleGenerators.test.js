// Substitute-the-answer-back harness for sequence-rules, with its mutation
// test. The checker (sequenceRuleGenerators.check.js) makes every term
// from the stated rule and confirms no other kind of rule reads the four
// terms differently.
//
// Run: npx vitest run src/generators/algebra/sequenceRuleGenerators.test.js

import { describe, expect, it } from 'vitest';
import { BANDS, sample, report, mutants, generic, bandMove } from '../harness.check';
import { checkSequenceRules } from './sequenceRuleGenerators.check';
import { skillsInTopic } from '../../curriculum/skills';

const N = 6000;
const check = (q, band) => checkSequenceRules(q, band);
const KINDS = {
  foundation: ['add', 'subtract'],
  core: ['divide', 'multiply'],
  stretch: ['add the two before', 'rising differences', 'two-step rule'],
};
// Distinct questions in 6,000, floors just under the real pools. Core is
// small by nature: four terms of a geometric sequence with whole terms that
// stay readable, multiplying or dividing, 197 in all, every one seen.
// Foundation and Stretch each have about 1,550.
const FLOOR = { foundation: 1400, core: 190, stretch: 1100 };

describe('next terms and term-to-term rules', () => {
  BANDS.forEach((band) => {
    it(`sequence-rules ${band}: the rule makes every term`, () => {
      const r = sample('sequence-rules', band, check, N);
      report('sequence-rules', band, r, N);
      expect(Object.keys(r.mix).sort()).toEqual(KINDS[band]);
      expect(r.distinct).toBeGreaterThanOrEqual(FLOOR[band]);
    });
  });

  it('opens Arithmetic and geometric sequences', () => {
    expect(skillsInTopic('Arithmetic and geometric sequences')[0]).toBe('sequence-rules');
  });

  it('rejects every broken copy', () => {
    const ops = {
      ...generic('answer nudged', 'question line nudged', 'a working number nudged', 'metadata changed'),
      'the rule number nudged': (q) => {
        const m = /\\text\{([^}]*?)(\d+)([^}]*)\}$/.exec(q.answer);
        if (!m) return false;
        q.answer = q.answer.replace(m[0], `\\text{${m[1]}${Number(m[2]) + 1}${m[3]}}`);
      },
      'the next two swapped': (q) => {
        const m = /^(-?\d+), (-?\d+);/.exec(q.answer);
        q.answer = q.answer.replace(m[0], `${m[2]}, ${m[1]};`);
      },
      'a shown term nudged': (q) => {
        const m = /, (-?\d+), \\ldots$/.exec(q.questionMath);
        q.questionMath = q.questionMath.replace(m[0], `, ${Number(m[1]) + 1}, \\ldots`);
      },
      'moved to another band': bandMove({ foundation: 'core', core: 'stretch', stretch: 'foundation' }),
    };
    const tally = mutants({ skills: ['sequence-rules'], check, ops, perBand: 200 });
    Object.entries(tally).forEach(([name, r]) => expect(r.survivors.slice(0, 2).map((s) => s.q), name).toEqual([]));
    expect(Object.keys(tally).sort()).toEqual(Object.keys(ops).sort());
  });
});
