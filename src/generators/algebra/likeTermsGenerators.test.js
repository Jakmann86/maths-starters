// Substitute-the-answer-back harness for like-terms, with its mutation
// test. The checker expands the question, the working and the answer and
// compares the three polynomials.
//
// Run: npx vitest run src/generators/algebra/likeTermsGenerators.test.js

import { describe, expect, it } from 'vitest';
import { BANDS, sample, report, mutants, generic, bandMove } from '../harness.check';
import { checkLikeTerms } from './likeTermsGenerators.check';
import { skillsInTopic } from '../../curriculum/skills';

const N = 6000;
const check = (q, band) => checkLikeTerms(q, band);
// Nearly every question in 6,000 is new: about 5,900, 6,000 and 6,000.
const FLOOR = { foundation: 5800, core: 5900, stretch: 5900 };

describe('collecting like terms', () => {
  BANDS.forEach((band) => {
    it(`like-terms ${band}: the answer is the question collected`, () => {
      const r = sample('like-terms', band, check, N);
      report('like-terms', band, r, N);
      expect(r.distinct).toBeGreaterThanOrEqual(FLOOR[band]);
    });
  });

  it('opens Expanding brackets', () => {
    expect(skillsInTopic('Expanding brackets')[0]).toBe('like-terms');
  });

  it('rejects every broken copy', () => {
    const ops = {
      ...generic('answer nudged', 'question line nudged', 'a working number nudged', 'the working stops short', 'metadata changed'),
      'a sign flipped in the answer': (q) => {
        const i = q.answer.search(/ [+-] /);
        if (i < 0) return false;
        const s = q.answer[i + 1] === '+' ? '-' : '+';
        q.answer = `${q.answer.slice(0, i + 1)}${s}${q.answer.slice(i + 2)}`;
        q.workingOut = q.workingOut.replace(/\n.*$/, `\n${q.answer}`);
      },
      'a power dropped in the answer': (q) => {
        if (!/\^/.test(q.answer)) return false;
        q.answer = q.answer.replace(/\^\d/, '');
        q.workingOut = q.workingOut.replace(/\n.*$/, `\n${q.answer}`);
      },
      'unlike terms grouped': (q) => {
        const w = q.workingOut.split('\n');
        w[0] = w[0].replace(') + (', ' + ');
        q.workingOut = w.join('\n');
      },
      'moved to another band': bandMove({ foundation: 'core', core: 'stretch', stretch: 'foundation' }),
    };
    const tally = mutants({ skills: ['like-terms'], check, ops, perBand: 200 });
    Object.entries(tally).forEach(([name, r]) => expect(r.survivors.slice(0, 2).map((s) => s.q), name).toEqual([]));
    expect(Object.keys(tally).sort()).toEqual(Object.keys(ops).sort());
  });
});
