// Substitute-the-answer-back harness for the function-graph skills, with
// its mutation test: transforming-graphs, cubic-graphs, tangent-gradient
// and exponential-graphs. The checker (functionGraphGenerators.check.js)
// evaluates every printed equation and reads every graph off its figure.
//
// Run: npx vitest run src/generators/algebra/functionGraphGenerators.test.js

import { describe, expect, it } from 'vitest';
import { BANDS, sample, report, mutants, generic, bandMove } from '../harness.check';
import { checkTransforming, checkCubic, checkTangent, checkExponential } from './functionGraphGenerators.check';
import { skillsInTopic } from '../../curriculum/skills';

const N = 6000;
const CHECKS = {
  'transforming-graphs': checkTransforming,
  'cubic-graphs': checkCubic,
  'tangent-gradient': checkTangent,
  'exponential-graphs': checkExponential,
};
const check = (q, band) => CHECKS[q.metadata?.topic]?.(q, band) ?? (() => { throw new Error('topic'); })();

const KINDS = {
  'transforming-graphs': {
    foundation: ['translate across', 'translate up or down'],
    core: ['reflect', 'stretch'],
    stretch: ['reflect and translate', 'translate both ways'],
  },
  'cubic-graphs': { foundation: ['root at 0', 'three roots'], core: ['repeated root'], stretch: ['a half', 'a of 1', 'a of 2'] },
  'tangent-gradient': { foundation: ['positive'], core: ['a half', 'negative'], stretch: ['a half', 'whole'] },
  'exponential-graphs': { foundation: ['f(0)', 'positive x'], core: ['negative x'], stretch: ['base 2', 'base 3'] },
};

// Distinct questions in 6,000. Graphs read off a grid have small pools by
// nature: everything has to sit on a gridline crossing inside a window you
// can count squares in. A parabola and one translation of it is a few
// hundred; reflecting or stretching it adds no number at all, so Core
// transforming is the vertex alone, about 30. Reading k and c off an
// exponential is base, k and c, with the y-intercept kept off the origin: 50
// in all, every one of them seen. A cubic
// with three roots from -5 to 5 has exactly 165, all seen; with a repeated
// root and a leading coefficient, about 290. Reading a cubic's equation off
// its graph needs its y-intercept on a grid short enough to read, within 5,
// and that keeps its roots small: 63 in all, every one of them seen.
const FLOOR = {
  'transforming-graphs': { foundation: 150, core: 25, stretch: 250 },
  'cubic-graphs': { foundation: 165, core: 280, stretch: 63 },
  'tangent-gradient': { foundation: 40, core: 100, stretch: 150 },
  'exponential-graphs': { foundation: 300, core: 250, stretch: 50 },
};

describe('graphs of functions', () => {
  Object.keys(CHECKS).forEach((id) => BANDS.forEach((band) => {
    it(`${id} ${band}: the answer follows from what is printed`, () => {
      const r = sample(id, band, check, N);
      report(id, band, r, N);
      expect(Object.keys(r.mix).sort()).toEqual([...KINDS[id][band]].sort());
      expect(r.distinct).toBeGreaterThanOrEqual(FLOOR[id][band]);
    });
  }));

  it('sits in its topic in textbook order', () => {
    expect(skillsInTopic('Graphs of functions')).toEqual(['transforming-graphs', 'cubic-graphs', 'tangent-gradient', 'exponential-graphs']);
  });

  it('rejects every broken copy', () => {
    const ops = {
      ...generic('answer nudged', 'question line nudged', 'a working number nudged', 'metadata changed'),
      'a curve moved': (q) => {
        const cv = q.visualization?.curves?.at(-1);
        if (!cv) return false;
        if (cv.exp) cv.exp[0] += 1; else if (cv.cubic) cv.cubic[3] += 1; else cv.c += 1;
      },
      'the given curve moved': (q) => {
        const cv = q.visualization?.curves?.[0];
        if (!cv || !cv.ink) return false;
        cv.c += 1;
      },
      'a point moved': (q) => { const p = q.visualization?.points?.at(-1); if (!p) return false; p.y += 1; },
      'the tangent tilted': (q) => { const l = q.visualization?.lines?.[0]; if (!l || l.dashed) return false; l.m += 1; },
      'the asymptote moved': (q) => { const l = q.visualization?.lines?.[0]; if (!l?.dashed) return false; l.c += 1; },
      'f and g swapped': (q) => {
        const cs = q.visualization?.curves;
        if (cs?.length !== 2) return false;
        [cs[0].label, cs[1].label] = [cs[1].label, cs[0].label];
      },
      'touch and cut swapped': (q) => {
        if (!/touches/.test(q.answer)) return false;
        const m = /touches at } x = (-?\d+), \\ \\text\{cuts at } x = (-?\d+)/.exec(q.answer);
        q.answer = q.answer.replace(m[0], `touches at } x = ${m[2]}, \\ \\text{cuts at } x = ${m[1]}`);
      },
      'moved to another band': bandMove({ foundation: 'core', core: 'stretch', stretch: 'foundation' }),
    };
    const tally = mutants({ skills: Object.keys(CHECKS), check, ops, perBand: 200 });
    Object.entries(tally).forEach(([name, r]) => expect(r.survivors.slice(0, 2).map((s) => s.q), name).toEqual([]));
    expect(Object.keys(tally).sort()).toEqual(Object.keys(ops).sort());
  });
});
