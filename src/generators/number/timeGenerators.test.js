// Substitute-the-answer-back harness for time, with its mutation test.
// The checker reads every clock time and duration back to minutes.
//
// Run: npx vitest run src/generators/number/timeGenerators.test.js

import { describe, expect, it } from 'vitest';
import { BANDS, sample, report, mutants, generic, bandMove } from '../harness.check';
import { checkTime } from './timeGenerators.check';

const N = 6000;
const check = (q, band) => checkTime(q, band);
// Distinct questions in 6,000: about 2,400 at Foundation (a pool of 2,880
// clock times, the midnight and noon hours drawn more often), and 5,900 or
// more above it.
const FLOOR = { foundation: 2300, core: 5800, stretch: 5800 };

describe('time', () => {
  BANDS.forEach((band) => {
    it(`time ${band}: the answer is the time asked for`, () => {
      const r = sample('time', band, check, N);
      report('time', band, r, N);
      expect(r.distinct).toBeGreaterThanOrEqual(FLOOR[band]);
    });
  });

  it('rejects every broken copy', () => {
    const ops = {
      ...generic('answer nudged', 'question line nudged', 'a working number nudged', 'the working stops short', 'metadata changed'),
      'am and pm swapped': (q) => {
        if (!/am|pm/.test(q.answer + q.questionMath)) return false;
        const flip = (s) => s.replace(/\b(am|pm)\b/, (m) => (m === 'am' ? 'pm' : 'am'));
        if (/am|pm/.test(q.answer)) { q.answer = flip(q.answer); q.workingOut = q.workingOut.replace(/\n[^\n]*$/, `\n${q.answer}`); } else q.questionMath = flip(q.questionMath);
      },
      'ahead for behind': (q) => {
        if (!/ahead|behind/.test(q.questionMath || '')) return false;
        q.questionMath = q.questionMath.replace(/ahead|behind/, (m) => (m === 'ahead' ? 'behind' : 'ahead'));
      },
      'the day left out': (q) => {
        if (!/\(the /.test(q.answer)) return false;
        q.answer = q.answer.replace(/ \\text\{ \(.+\)\}$/, '');
        q.workingOut = q.workingOut.replace(/\n[^\n]*$/, `\n${q.answer}`);
      },
      'moved to another band': bandMove({ foundation: 'core', core: 'stretch', stretch: 'foundation' }),
    };
    const tally = mutants({ skills: ['time'], check, ops, perBand: 200 });
    Object.entries(tally).forEach(([name, r]) => expect(r.survivors.slice(0, 2).map((s) => s.q), name).toEqual([]));
    expect(Object.keys(tally).sort()).toEqual(Object.keys(ops).sort());
  });
});
