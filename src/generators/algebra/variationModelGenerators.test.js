// Substitute-the-answer-back harness for variation-model, with its
// mutation test. The checker reads the model from the answer and fits it
// to every column of the table.
//
// Run: npx vitest run src/generators/algebra/variationModelGenerators.test.js

import _ from 'lodash';
import { describe, expect, it } from 'vitest';
import { BANDS, sample, report, mutants, generic, bandMove } from '../harness.check';
import { checkVariationModel } from './variationModelGenerators.check';

const N = 6000;
const check = (q, band) => checkVariationModel(q, band);
const KINDS = {
  foundation: ['direct', 'inverse'],
  core: ['cube', 'root', 'square'],
  stretch: ['cube', 'inverse', 'inverse root', 'inverse square', 'root', 'square'],
};
// Distinct questions in 6,000: about 4,400, 3,900 and 4,600. Plenty: the
// letters, four x values and k all vary.
const FLOOR = { foundation: 4000, core: 3500, stretch: 4200 };

describe('variation model', () => {
  BANDS.forEach((band) => {
    it(`variation-model ${band}: the model fits the table, and only it`, () => {
      const r = sample('variation-model', band, check, N);
      report('variation-model', band, r, N);
      expect(Object.keys(r.mix).sort()).toEqual(KINDS[band]);
      expect(r.distinct).toBeGreaterThanOrEqual(FLOOR[band]);
    });
  });

  it('rejects every broken copy', () => {
    const cell = () => [1, _.random(1, 4)];
    const ops = {
      ...generic('answer nudged', 'a working number nudged', 'the working stops short', 'metadata changed'),
      'a y value changed': (q) => { const [r, c] = cell(); q.visualization.rows[r][c] = String(Number(q.visualization.rows[r][c]) + 1); },
      'two x values swapped': (q) => {
        const row = q.visualization.rows[0];
        [row[1], row[4]] = [row[4], row[1]];
      },
      'the power changed': (q) => {
        q.answer = q.answer.replace(/\^(\d)/, (m, e) => `^${e === '2' ? 3 : 2}`).replace(/([a-z])$/, '$1^2');
      },
      'direct for inverse': (q) => {
        const m = /^(\w) = \\frac\{(\d+)\}\{(.+)\}$/.exec(q.answer);
        q.answer = m ? `${m[1]} = ${m[2]}${m[3]}` : q.answer.replace(/^(\w) = (\d+)(.+)$/, '$1 = \\frac{$2}{$3}');
      },
      'the step factor wrong': (q) => {
        const w = q.workingOut.split('\n');
        w[1] = w[1].replace(/(\\times|\\div) (\d+), /, (m, op, f) => `${op} ${Number(f) * 2}, `);
        q.workingOut = w.join('\n');
      },
      'the models not offered': (q) => {
        if (q.metadata.difficulty === 'stretch') q.questionMath = 'y \\propto x';
        else delete q.questionMath;
      },
      'moved to another band': bandMove({ foundation: 'core', core: 'stretch', stretch: 'foundation' }),
    };
    const tally = mutants({ skills: ['variation-model'], check, ops, perBand: 200 });
    Object.entries(tally).forEach(([name, r]) => expect(r.survivors.slice(0, 2).map((s) => s.q), name).toEqual([]));
    expect(Object.keys(tally).sort()).toEqual(Object.keys(ops).sort());
  });
});
