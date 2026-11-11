// Substitute-the-answer-back harness for quadraticGraphGenerators.js: the
// quadratic is read back from the question or the drawn curve, its features
// recomputed, and the answer and working must agree
// (quadraticGraphGenerators.check.js). The mutation test beside it shows the
// checker fails when it should.
//
// Run: npx vitest run src/generators/algebra/quadraticGraphGenerators.test.js

import { describe, expect, it } from 'vitest';
import { BANDS, report, sample } from '../harness.check';
import { checkQuadraticGraphs } from './quadraticGraphGenerators.check';
import { skillsInTopic, strandOf } from '../../curriculum/skills';

const SAMPLES = 6000;

export const KINDS = {
  'quadratic-substitution': { foundation: ['x positive'], core: ['x negative'], stretch: ['one root', 'two roots'] },
  'quadratic-vertex-form': { foundation: ['across', 'up or down'], core: ['both shifts'], stretch: ['with y-intercept'] },
  'quadratic-intercepts': { foundation: ['one root', 'two roots'], core: ['one root', 'two roots'], stretch: ['a fractional root', 'whole roots'] },
  'quadratic-symmetry': { foundation: ['factorised', 'graph'], core: ['fraction', 'whole'], stretch: ['vertex'] },
  'quadratic-find-function': { foundation: ['graph', 'intercepts', 'vertex'], core: ['vertex and y-intercept'], stretch: ['intercepts and a point', 'vertex and a point'] },
};

// The fewest distinct questions in 6,000 per band. Small ones are honest:
// Foundation vertex form is one shift, either way up (about 70, its real
// size); Core intercepts are the pairs of roots from -9 to 9 (about 190);
// Foundation find-the-function is a monic quadratic with small roots, given,
// drawn or from the vertex (about 300).
const FLOOR = {
  'quadratic-substitution': { foundation: 2200, core: 4700, stretch: 2100 },
  'quadratic-vertex-form': { foundation: 66, core: 420, stretch: 900 },
  'quadratic-intercepts': { foundation: 1400, core: 180, stretch: 520 },
  'quadratic-symmetry': { foundation: 1100, core: 2500, stretch: 1350 },
  'quadratic-find-function': { foundation: 280, core: 1050, stretch: 3800 },
};

describe('Quadratic graphs', () => {
  Object.keys(KINDS).forEach((id) => {
    BANDS.forEach((band) => {
      it(`${id} ${band}: every answer follows from what is printed`, () => {
        const result = sample(id, band, checkQuadraticGraphs, SAMPLES);
        report(id, band, result, SAMPLES);
        expect(Object.keys(result.mix).sort()).toEqual(KINDS[id][band]);
        expect(result.distinct).toBeGreaterThanOrEqual(FLOOR[id][band]);
      });
    });
  });

  it('is an Algebra topic in Haese order', () => {
    expect(skillsInTopic('Quadratic graphs')).toEqual(Object.keys(KINDS));
    expect(strandOf('Quadratic graphs')).toBe('Algebra');
  });
});
