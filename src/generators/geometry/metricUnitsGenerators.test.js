// Substitute-the-answer-back harness for Metric units, with its mutation
// test: convert-units and convert-area-volume. The checker
// (metricUnitsGenerators.check.js) reads each amount and unit, problem or
// figure back and checks every conversion by its size in a common unit.
//
// Run: npx vitest run src/generators/geometry/metricUnitsGenerators.test.js

import { describe, expect, it } from 'vitest';
import { BANDS, sample, report, mutants, generic, bandMove } from '../harness.check';
import { checkConvertUnits, checkConvertAreaVolume } from './metricUnitsGenerators.check';
import { skillsInTopic, strandOf } from '../../curriculum/skills';

const N = 6000;
const CHECKS = { 'convert-units': checkConvertUnits, 'convert-area-volume': checkConvertAreaVolume };
const check = (q, band) => CHECKS[q.metadata?.topic]?.(q, band) ?? (() => { throw new Error('topic'); })();

const KINDS = {
  'convert-units': { foundation: ['to a larger unit', 'to a smaller unit'], core: ['to a larger unit', 'to a smaller unit'], stretch: ['capacity', 'length', 'mass'] },
  'convert-area-volume': { foundation: ['to a larger unit', 'to a smaller unit'], core: ['volume to capacity', 'volume units'], stretch: ['rectangle', 'tank'] },
};

// Distinct questions in 6,000, with each floor a little under what is
// seen. A problem is a whole number of pieces, glasses or bags from a total
// that converts cleanly: about 900 in all, the one small pool here.
const FLOOR = {
  'convert-units': { foundation: 4700, core: 4500, stretch: 840 },
  'convert-area-volume': { foundation: 4400, core: 5000, stretch: 5000 },
};

describe('metric units', () => {
  Object.keys(CHECKS).forEach((id) => BANDS.forEach((band) => {
    it(`${id} ${band}: the answer follows from what is printed`, () => {
      const r = sample(id, band, check, N);
      report(id, band, r, N);
      expect(Object.keys(r.mix).sort()).toEqual([...KINDS[id][band]].sort());
      expect(r.distinct).toBeGreaterThanOrEqual(FLOOR[id][band]);
    });
  }));

  it('is its own topic, first in Mensuration', () => {
    expect(skillsInTopic('Metric units')).toEqual(Object.keys(CHECKS));
    expect(strandOf('Metric units')).toBe('Mensuration');
  });

  it('rejects every broken copy', () => {
    const ops = {
      ...generic('answer nudged', 'question line nudged', 'a working number nudged', 'metadata changed'),
      'a number in the prose nudged': (q) => {
        const m = /\d+/.exec(q.questionText ?? '');
        if (!m) return false;
        q.questionText = q.questionText.replace(m[0], String(Number(m[0]) + 1));
      },
      'the target unit changed': (q) => {
        if (!q.questionMath) return false;
        const swaps = [['\\to \\text{m}$', '\\to \\text{cm}'], ['\\to \\text{cm}^2', '\\to \\text{mm}^2'], ['\\to \\text{litres}', '\\to \\text{cm}^3'], ['\\to \\text{kg}', '\\to \\text{g}']];
        const hit = swaps.find(([a]) => new RegExp(a.replace(/[\\^$]/g, (c) => (c === '$' ? '$' : `\\${c}`))).test(q.questionMath));
        if (!hit) return false;
        q.questionMath = q.questionMath.replace(hit[0].replace('$', ''), hit[1]);
      },
      'an edge relabelled in the other unit': (q) => {
        const f = q.visualization;
        if (!f) return false;
        const key = ['l', 'w', 'd', 'h'].find((k) => / m$/.test(f[k] ?? ''));
        f[key] = f[key].replace(/ m$/, ' cm');
      },
      'the answer unit changed': (q) => {
        if (!q.answerUnits) return false;
        q.answerUnits = q.answerUnits === 'm' ? 'cm' : 'm';
      },
      'moved to another band': bandMove({ foundation: 'core', core: 'stretch', stretch: 'foundation' }),
    };
    const tally = mutants({ skills: Object.keys(CHECKS), check, ops, perBand: 200 });
    Object.entries(tally).forEach(([name, r]) => expect(r.survivors.slice(0, 2).map((s) => s.q), name).toEqual([]));
    expect(Object.keys(tally).sort()).toEqual(Object.keys(ops).sort());
  });
});
