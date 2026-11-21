// Substitute-the-answer-back harness for set-symbols, with its mutation
// test. The checker (setSymbolGenerators.check.js) rebuilds each set from
// its list, words or condition and works out each statement and its
// reason.
//
// Run: npx vitest run src/generators/number/setSymbolGenerators.test.js

import { describe, expect, it } from 'vitest';
import { BANDS, sample, report, mutants, generic, bandMove } from '../harness.check';
import { checkSetSymbols } from './setSymbolGenerators.check';
import { skillsInTopic } from '../../curriculum/skills';

const N = 6000;
const check = (q, band) => checkSetSymbols(q, band);
const KINDS = {
  foundation: ['in words', 'listed'],
  core: ['two listed sets', 'with the empty set'],
  stretch: ['P empty', 'P not empty'],
};
// Distinct questions in 6,000, floors a little under what is seen; every
// band runs to thousands.
const FLOOR = { foundation: 5200, core: 5700, stretch: 5500 };

describe('set symbols', () => {
  BANDS.forEach((band) => {
    it(`set-symbols ${band}: each statement is judged right`, () => {
      const r = sample('set-symbols', band, check, N);
      report('set-symbols', band, r, N);
      expect(Object.keys(r.mix).sort()).toEqual(KINDS[band]);
      expect(r.distinct).toBeGreaterThanOrEqual(FLOOR[band]);
    });
  });

  it('opens Sets', () => {
    expect(skillsInTopic('Sets')[0]).toBe('set-symbols');
  });

  it('rejects every broken copy', () => {
    const ops = {
      // No 'answer nudged': the answer is true or false, with no number in
      // it; the swap below is its stand-in.
      ...generic('a working number nudged', 'metadata changed'),
      'a true and false swapped': (q) => {
        q.answer = q.answer.replace('(a) true', '(a) XX').replace('(a) false', '(a) true').replace('(a) XX', '(a) false');
      },
      'an element moved in a statement': (q) => {
        const lines = q.questionMath.split('\n');
        const i = lines.findIndex((l) => /^\\text\{\(a\) \} \d+ \\in A$/.test(l));
        if (i < 0) return false;
        const [, v] = /(\d+) \\in A$/.exec(lines[i]);
        const A = lines[0];
        // A number on the other side of membership: the next one that is, or isn't, in a listed A.
        const listed = /^A = \\\{(.+)\\\}$/.exec(A);
        if (!listed) return false;
        const xs = listed[1].split(', ').map(Number);
        const inA = xs.includes(Number(v));
        const swap = Array.from({ length: 30 }, (_, k) => k + 1).find((k) => xs.includes(k) !== inA);
        lines[i] = lines[i].replace(`${v} \\in A`, `${swap} \\in A`);
        q.questionMath = lines.join('\n');
      },
      // R changed so that (b) must flip: to multiples of 1 when Q is not a
      // subset (now it is), to one past Q's number when it is (now not).
      'the subset moved': (q) => {
        if (!/multiples of/.test(q.questionMath)) return false;
        const qn = Number(/Q = \\\{\\text\{multiples of \} (\d+)/.exec(q.questionMath)[1]);
        const to = q.answer.includes('(b) true') ? qn + 1 : 1;
        q.questionMath = q.questionMath.replace(/(R = \\\{\\text\{multiples of \} )(\d+)/, `$1${to}`);
      },
      'moved to another band': bandMove({ foundation: 'core', core: 'stretch', stretch: 'foundation' }),
    };
    const tally = mutants({ skills: ['set-symbols'], check, ops, perBand: 200 });
    Object.entries(tally).forEach(([name, r]) => expect(r.survivors.slice(0, 2).map((s) => s.q), name).toEqual([]));
    expect(Object.keys(tally).sort()).toEqual(Object.keys(ops).sort());
  });
});
