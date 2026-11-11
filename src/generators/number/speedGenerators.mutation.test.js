// Mutation test for the Speed, distance and time harness. Each operator
// breaks real generator output; the checker must reject every broken copy.
// MUTANT_REASONS=1 lists why each copy was rejected.
//
// Run: npx vitest run src/generators/number/speedGenerators.mutation.test.js

import _ from 'lodash';
import { describe, expect, it } from 'vitest';
import { bandMove, bump, generic, mutants } from '../harness.check';
import { checkSpeed } from './speedGenerators.check';

const IDS = ['speed-distance-time', 'travel-graphs'];

const OPS = {
  ...generic('answer nudged', 'a working number nudged', 'the working stops short', 'metadata changed', 'units changed'),
  'moved to another band': bandMove(),
  'a number in the question nudged': (q) => {
    const key = q.questionMath ? 'questionMath' : 'questionText';
    const s = bump(q[key]);
    if (!s) return false;
    q[key] = s;
  },
  'km/h and m/s swapped': (q) => {
    if (!/^(km\/h|m\/s)$/.test(q.answerUnits ?? '')) return false;
    q.answerUnits = q.answerUnits === 'km/h' ? 'm/s' : 'km/h';
  },
  'hours read as minutes': (q) => {
    if (!/\d+ hours\b/.test(q.questionText ?? '')) return false;
    q.questionText = q.questionText.replace(/(\d+) hours\b/, '$1 minutes');
  },
  // A corner moved where the answer is read from it: the corner at or just
  // after the reading, the end of the second traveller's line, the end of
  // the stop (made longer), or the furthest point. A corner the answer
  // never reads would be an equivalent copy, so the operator doesn't move one.
  'a corner of the journey moved': (q) => {
    const f = q.visualization;
    if (!f) return false;
    const [A, B] = f.journeys;
    const dy = (pts, k) => {
      const [x, y] = pts[k];
      pts[k] = [x, y + f.yAxis.step <= f.yAxis.max ? y + f.yAxis.step : y - f.yAxis.step];
    };
    if (B) { dy(B.points, B.points.length - 1); return undefined; }
    if (/stop\?$/.test(q.questionText)) {
      const k = A.points.findIndex(([, y], i) => i && y === A.points[i - 1][1]);
      A.points = A.points.map(([x, y], i) => (i >= k ? [x + f.xAxis.step, y] : [x, y]));
      f.xAxis.max += f.xAxis.step;
      return undefined;
    }
    if (f.reading) { dy(A.points, A.points.findIndex(([x]) => x >= f.reading.x)); return undefined; }
    const m = /between (\d+(?:\.\d+)?) and/.exec(q.questionText);
    if (m) { dy(A.points, A.points.findIndex(([x]) => x === Number(m[1])) + 1); return undefined; }
    const far = Math.max(...A.points.map(([, y]) => y));
    dy(A.points, A.points.findIndex(([, y]) => y === far));
    return undefined;
  },
  'the reading lines moved': (q) => {
    const r = q.visualization?.reading;
    if (!r) return false;
    q.visualization.reading = { ...r, y: r.y + q.visualization.yAxis.step };
  },
  'the second traveller left at another time': (q) => {
    const B = q.visualization?.journeys?.[1];
    if (!B) return false;
    B.points[0] = [B.points[0][0] + q.visualization.xAxis.step, 0];
  },
  'the travellers swapped': (q) => {
    const js = q.visualization?.journeys;
    if (!js || js.length < 2) return false;
    [js[0].name, js[1].name] = [js[1].name, js[0].name];
  },
  'the axes stretched': (q) => {
    const f = q.visualization;
    if (!f) return false;
    f.xAxis.max += f.xAxis.step;
  },
};

describe('Speed, distance and time mutation test', () => {
  it('rejects every broken copy', () => {
    const tally = mutants({ skills: IDS, check: checkSpeed, ops: OPS });
    Object.entries(tally).forEach(([name, r]) => expect(r.survivors.slice(0, 2), name).toEqual([]));
    expect(Object.keys(tally).sort()).toEqual(Object.keys(OPS).sort());
  }, 600000);
});
