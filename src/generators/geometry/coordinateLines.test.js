// Substitute-the-answer-back harness for the straight-line skills, with
// its mutation test: parallel-gradients, perpendicular-gradients,
// horizontal-vertical-lines, lines-meet and line-general-form. The checker
// (coordinateLines.check.js) reads every equation back by evaluating it.
//
// Run: npx vitest run src/generators/geometry/coordinateLines.test.js

import { describe, expect, it } from 'vitest';
import { BANDS, sample, report, mutants, generic, bandMove, bump } from '../harness.check';
import {
  checkParallel, checkPerpendicular, checkHorizontalVertical, checkLinesMeet, checkGeneralForm,
} from './coordinateLines.check';
import { getSkill, skillsInTopic } from '../../curriculum/skills';

const N = 6000;

const CHECKS = {
  'parallel-gradients': checkParallel,
  'perpendicular-gradients': checkPerpendicular,
  'horizontal-vertical-lines': checkHorizontalVertical,
  'lines-meet': checkLinesMeet,
  'line-general-form': checkGeneralForm,
};
const check = (q, band) => CHECKS[q.metadata?.topic]?.(q, band) ?? (() => { throw new Error('topic'); })();

const DESCRIPTIONS = ['gradient 0', 'parallel to the x-axis', 'parallel to the y-axis', 'perpendicular to the x-axis', 'perpendicular to the y-axis'];
const KINDS = {
  'parallel-gradients': { foundation: ['fraction gradient', 'whole gradient'], core: ['general form'], stretch: ['through a point'] },
  'perpendicular-gradients': { foundation: ['whole gradient'], core: ['fraction gradient'], stretch: ['general form'] },
  'horizontal-vertical-lines': { foundation: ['horizontal', 'vertical'], core: ['horizontal', 'vertical'], stretch: DESCRIPTIONS },
  'lines-meet': {
    foundation: ['x = a and y = b'],
    core: ['y = mx + c and x = k', 'y = mx + c and y = k'],
    stretch: ['general form and x = k', 'general form and y = k'],
  },
  'line-general-form': { foundation: ['to general form'], core: ['to y = mx + c'], stretch: ['from two points'] },
};

// Distinct questions in 6,000. Foundation reading of a drawn x = k or y = k
// has 16, the real ceiling (see the generator); a whole-number gradient for
// a perpendicular line has 16 gradients and 13 intercepts, about 200; x = a
// and y = b meeting is the 256 points off the axes, both orders.
// The gradient-only questions are small pools by nature, since the
// intercept does not change the answer: y = mx + c with m from a few dozen
// fractions (about 800), general form with a and b up to 6 and coprime
// (about 1,100). Turning a line from one form to the other has about 400 to
// 600.
const FLOOR = {
  'parallel-gradients': { foundation: 750, core: 1000 },
  'perpendicular-gradients': { foundation: 190, core: 570, stretch: 1000 },
  'horizontal-vertical-lines': { foundation: 16, core: 4000, stretch: 1000 },
  'lines-meet': { foundation: 480, core: 2400 },
  'line-general-form': { foundation: 330, core: 530, stretch: 3500 },
};

describe('straight lines', () => {
  Object.keys(CHECKS).forEach((id) => BANDS.forEach((band) => {
    it(`${id} ${band}: the answer follows from the printed equations`, () => {
      const r = sample(id, band, check, N);
      report(id, band, r, N);
      expect(Object.keys(r.mix).sort()).toEqual([...KINDS[id][band]].sort());
      expect(r.distinct).toBeGreaterThanOrEqual(FLOOR[id]?.[band] ?? 4000);
    });
  }));

  it('sits in the catalogue in teaching order', () => {
    expect(getSkill('parallel-gradients').topic).toBe('Coordinate geometry');
    expect(getSkill('perpendicular-gradients').topic).toBe('Coordinate geometry');
    const coord = skillsInTopic('Coordinate geometry');
    expect(coord.indexOf('perpendicular-gradients')).toBe(coord.indexOf('parallel-gradients') + 1);
    const lines = skillsInTopic('Straight-line graphs');
    expect(lines.indexOf('lines-meet')).toBe(lines.indexOf('horizontal-vertical-lines') + 1);
  });

  it('rejects every broken copy', () => {
    const ops = {
      'question line nudged': (q) => {
        if (/gradients$|^horizontal/.test(q.metadata.topic)) return false;
        const s = bump(q.questionMath); if (!s) return false; q.questionMath = s;
      },
      ...generic('answer nudged', 'a working number nudged', 'the working stops short', 'a working line dropped', 'metadata changed'),
      'a sign flipped in the answer': (q) => {
        if (/-/.test(q.answer)) q.answer = q.answer.replace('-', ''); else if (/\d/.test(q.answer)) q.answer = q.answer.replace(/(\d)/, '-$1'); else return false;
      },
      'x and y swapped in the answer': (q) => {
        if (/^\(/.test(q.answer)) { const m = /^\((-?\d+), (-?\d+)\)$/.exec(q.answer); if (m[1] === m[2]) return false; q.answer = `(${m[2]}, ${m[1]})`; return undefined; }
        if (!/^[xy] = /.test(q.answer) || /x.*x|y.*y/.test(q.answer.slice(1))) return false;
        q.answer = q.answer.replace(/^([xy])/, (v) => (v === 'x' ? 'y' : 'x'));
      },
      // The two lines of x = a and y = b come in either order by design.
      'the point changed': (q) => {
        const l = (q.questionMath ?? '').split('\n');
        if (!/through/.test(l[1] ?? '') || /^horizontal/.test(q.metadata.topic)) return false;
        l[1] = bump(l[1]);
        q.questionMath = l.join('\n');
      },
      // For x = k or y = k only the coordinate the line keeps matters.
      'the coordinate the line keeps changed': (q) => {
        if (!/^horizontal/.test(q.metadata.topic) || q.metadata.difficulty === 'foundation') return false;
        const pts = [...q.questionMath.matchAll(/\((-?\d+), (-?\d+)\)/g)];
        const p = pts[pts.length - 1];
        const i = q.answer.startsWith('x') ? 1 : 2;
        const v = String(Number(p[i]) + 1);
        const moved = i === 1 ? `(${v}, ${p[2]})` : `(${p[1]}, ${v})`;
        q.questionMath = q.questionMath.slice(0, p.index) + moved + q.questionMath.slice(p.index + p[0].length);
      },
      'the two lines swapped': (q) => {
        const l = (q.questionMath ?? '').split('\n');
        if (l.length !== 2 || /through/.test(l[1]) || (q.metadata.topic === 'lines-meet' && q.metadata.difficulty === 'foundation')) return false;
        q.questionMath = [l[1], l[0]].join('\n');
      },
      'the description changed': (q) => {
        if (!/axis\}|gradient \} 0/.test(q.questionMath ?? '')) return false;
        q.questionMath = q.questionMath.replace(/(parallel|perpendicular) to the \} ([xy])/, (w, r, a) => `${r} to the } ${a === 'x' ? 'y' : 'x'}`)
          .replace('\\text{gradient } 0', '\\text{parallel to the } y\\text{-axis}');
      },
      'the figure moved': (q) => {
        const ln = q.visualization?.line;
        if (!ln) return false;
        if (ln.x !== undefined) ln.x += 1; else ln.c += 1;
      },
      // A gradient does not depend on the intercept, nor the parallel line
      // through a point on the first line's intercept, so for those only the
      // numbers that set the gradient, or the point, are nudged.
      'the gradient in the question changed': (q) => {
        if (!/gradients$/.test(q.metadata.topic)) return false;
        const cut = q.questionMath.indexOf(q.questionMath.startsWith('y = ') ? 'x' : 'y') + 1;
        const [head, tail] = [q.questionMath.slice(0, cut), q.questionMath.slice(cut)];
        if (!/\d/.test(head)) return false;
        q.questionMath = bump(head) + tail;
      },
      'moved to another band': bandMove({ foundation: 'core', core: 'stretch', stretch: 'foundation' }),
    };
    const tally = mutants({ skills: Object.keys(CHECKS), check, ops, perBand: 150 });
    Object.entries(tally).forEach(([name, r]) => expect(r.survivors.slice(0, 2).map((s) => s.q), name).toEqual([]));
    expect(Object.keys(tally).sort()).toEqual(Object.keys(ops).sort());
  });
});
