// Substitute-the-answer-back harness for bearings, with its mutation test.
// The checker measures every bearing and angle from the drawn points.
//
// Run: npx vitest run src/generators/geometry/bearingGenerators.test.js

import _ from 'lodash';
import { describe, expect, it } from 'vitest';
import { BANDS, sample, report, mutants, generic, bandMove } from '../harness.check';
import { checkBearings } from './bearingGenerators.check';

const N = 6000;
const check = (q, band) => checkBearings(q, band);
const KINDS = {
  foundation: ['anticlockwise', 'clockwise'],
  core: ['back bearing', 'co-interior'],
  stretch: ['angle in the triangle', 'next bearing'],
};
// Distinct questions in 6,000. Foundation is the whole pool of 282: one
// bearing, from 020° to 340°, kept 20° off south. A real ceiling: a bearing
// has one number in it. Core keeps A and B side by side (030° to 150° or
// 210° to 330°, so the two north lines stay apart), twice over by its two
// kinds: 484. Stretch sees about 5,970.
const FLOOR = { foundation: 280, core: 480, stretch: 5900 };

describe('bearings', () => {
  BANDS.forEach((band) => {
    it(`bearings ${band}: the answer is the bearing drawn`, () => {
      const r = sample('bearings', band, check, N);
      report('bearings', band, r, N);
      expect(Object.keys(r.mix).sort()).toEqual(KINDS[band]);
      expect(r.distinct).toBeGreaterThanOrEqual(FLOOR[band]);
    });
  });

  it('rejects every broken copy', () => {
    const ops = {
      ...generic('answer nudged', 'a working number nudged', 'the working stops short', 'metadata changed'),
      // Turned, not slid: a point nudged along its own line keeps its
      // bearing, which would be an equivalent mutant.
      'a point turned five degrees': (q) => {
        const P = q.visualization.points;
        const k = _.sample(Object.keys(P).filter((n) => n !== 'A'));
        const o = k === 'C' ? P.B : P.A;
        const t = (5 * Math.PI) / 180;
        const [dx, dy] = [P[k][0] - o[0], P[k][1] - o[1]];
        P[k] = [o[0] + dx * Math.cos(t) - dy * Math.sin(t), o[1] + dx * Math.sin(t) + dy * Math.cos(t)];
      },
      'a marked angle relabelled': (q) => {
        const an = q.visualization.angles[0];
        if (an.label === '?') return false;
        an.label = an.label.replace(/^\d+/, (d) => String(Number(d) + 2));
      },
      'the leading zero dropped': (q) => {
        if (!/^0/.test(q.answer)) return false;
        q.answer = q.answer.replace(/^0+/, '');
        q.workingOut = q.workingOut.replace(/\n[^\n]*$/, `\n${q.answer}`);
      },
      'off by 180': (q) => {
        const m = /^(\d{3})\^\\circ$/.exec(q.answer);
        if (!m) return false;
        q.answer = `${String((Number(m[1]) + 180) % 360).padStart(3, '0')}^\\circ`;
        q.workingOut = q.workingOut.replace(/\n[^\n]*$/, `\n${q.answer}`);
      },
      'from the wrong point': (q) => {
        q.instruction = q.instruction.includes('of B from A') ? 'Find the bearing of A from B' : 'Find the bearing of B from A';
      },
      'moved to another band': bandMove({ foundation: 'core', core: 'stretch', stretch: 'foundation' }),
    };
    const tally = mutants({ skills: ['bearings'], check, ops, perBand: 200 });
    Object.entries(tally).forEach(([name, r]) => expect(r.survivors.slice(0, 2).map((s) => s.q), name).toEqual([]));
    expect(Object.keys(tally).sort()).toEqual(Object.keys(ops).sort());
  });
});
