// Substitute-the-answer-back harness for perpendicular-line, with its
// mutation test. The checker (perpendicularLineGenerators.check.js) reads
// the given line and point (or A and B) back and requires the answer at
// right angles, through the point, in lowest terms.
//
// Run: npx vitest run src/generators/geometry/perpendicularLineGenerators.test.js

import { describe, expect, it } from 'vitest';
import { BANDS, sample, report, mutants, generic, bandMove } from '../harness.check';
import { checkPerpendicularLine } from './perpendicularLineGenerators.check';
import { skillsInTopic } from '../../curriculum/skills';

const N = 6000;
const check = (q, band) => checkPerpendicularLine(q, band);
const KINDS = { foundation: ['gradient-intercept'], core: ['general form'], stretch: ['bisector'] };
// Distinct questions in 6,000, floors a little under what is seen.
const FLOOR = { foundation: 4300, core: 5600, stretch: 3800 };

describe('perpendicular lines', () => {
  BANDS.forEach((band) => {
    it(`perpendicular-line ${band}: the answer follows from what is printed`, () => {
      const r = sample('perpendicular-line', band, check, N);
      report('perpendicular-line', band, r, N);
      expect(Object.keys(r.mix)).toEqual(KINDS[band]);
      expect(r.distinct).toBeGreaterThanOrEqual(FLOOR[band]);
    });
  });

  it('closes Straight-line graphs', () => {
    expect(skillsInTopic('Straight-line graphs').at(-1)).toBe('perpendicular-line');
  });

  it('rejects every broken copy', () => {
    const ops = {
      ...generic('answer nudged', 'a working number nudged', 'metadata changed'),
      // Not the generic question nudge: it may hit the given line's
      // intercept, which no perpendicular through the point depends on, so
      // that change is no change. This one moves what every band uses: the
      // given line's x coefficient, or A's x coordinate.
      'the gradient changed': (q) => {
        const m = /^(y = -?|A\()(\d*)/.exec(q.questionMath) ?? /^(-?)(\d*)x/.exec(q.questionMath);
        const v = m[2] === '' ? 1 : Number(m[2]);
        q.questionMath = q.questionMath.replace(m[0], `${m[1]}${v + 1}`);
      },
      'the point moved': (q) => {
        const m = /\((-?\d+), (-?\d+)\)/.exec(q.questionMath);
        q.questionMath = q.questionMath.replace(m[0], `(${m[1]}, ${Number(m[2]) + 1})`);
      },
      'the answer made parallel instead': (q) => {
        if (q.metadata.difficulty !== 'foundation') return false;
        const given = q.questionMath.split('\n')[0];
        q.answer = given.replace(/ [+-] \d+$/, '') + ' + 1';
      },
      'moved to another band': bandMove({ foundation: 'core', core: 'stretch', stretch: 'foundation' }),
    };
    const tally = mutants({ skills: ['perpendicular-line'], check, ops, perBand: 200 });
    Object.entries(tally).forEach(([name, r]) => expect(r.survivors.slice(0, 2).map((s) => s.q), name).toEqual([]));
    expect(Object.keys(tally).sort()).toEqual(Object.keys(ops).sort());
  });
});
