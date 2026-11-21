// Substitute-the-answer-back harness for inequality-regions, with its
// mutation test. The checker (inequalityRegionGenerators.check.js) rebuilds
// R from the drawn lines and the shading, then tests the answer against it
// at every quarter-square of the grid.
//
// Run: npx vitest run src/generators/algebra/inequalityRegionGenerators.test.js

import _ from 'lodash';
import { describe, expect, it } from 'vitest';
import { BANDS, sample, report, mutants, generic, bandMove } from '../harness.check';
import { checkInequalityRegions } from './inequalityRegionGenerators.check';
import { skillsInTopic } from '../../curriculum/skills';

const N = 6000;
const check = (q, band) => checkInequalityRegions(q, band);
const KINDS = { foundation: ['two lines'], core: ['three lines'], stretch: ['integer points'] };
// Distinct questions in 6,000. Foundation is a whole pool of 400 and every
// one is seen: two lines at 2 to 6, each solid or dashed, R on either side
// of each. A real ceiling: the lines must sit far enough in for R to be
// read, and two lines have no more to them. Core sees about 1,600 triangles
// and Stretch, which also wants two to eight points with a dashed edge that
// matters, about 990.
const FLOOR = { foundation: 395, core: 1450, stretch: 900 };

const flipSym = (s, from, to) => {
  const hits = [...s.matchAll(new RegExp(from.map((f) => f.replace(/\\/g, '\\\\')).join('|'), 'g'))];
  if (!hits.length) return null;
  const h = _.sample(hits);
  return s.slice(0, h.index) + to[from.indexOf(h[0])] + s.slice(h.index + h[0].length);
};

// A changed answer with the working's last line changed to match, so the
// region test has to catch it, not the working's ending.
const setAnswer = (q, s) => {
  const w = q.workingOut.split('\n');
  w[w.length - 1] = s;
  q.workingOut = w.join('\n');
  q.answer = s;
};

describe('inequality regions', () => {
  BANDS.forEach((band) => {
    it(`inequality-regions ${band}: the answer is the region drawn`, () => {
      const r = sample('inequality-regions', band, check, N);
      report('inequality-regions', band, r, N);
      expect(Object.keys(r.mix)).toEqual(KINDS[band]);
      expect(r.distinct).toBeGreaterThanOrEqual(FLOOR[band]);
    });
  });

  it('ends Inequalities, after solving', () => {
    expect(skillsInTopic('Inequalities').at(-1)).toBe('inequality-regions');
  });

  it('rejects every broken copy', () => {
    const anyLine = (q) => _.random(0, q.visualization.lines.length - 1);
    const ops = {
      ...generic('answer nudged', 'a working number nudged', 'the working stops short', 'metadata changed'),
      'a number in the answer nudged, and in the working': (q) => {
        const hits = [...q.answer.matchAll(/\d+/g)];
        const h = _.sample(hits);
        setAnswer(q, q.answer.slice(0, h.index) + (Number(h[0]) + 1) + q.answer.slice(h.index + h[0].length));
      },
      'a line solid for dashed': (q) => { const ln = q.visualization.lines[anyLine(q)]; ln.dashed = !ln.dashed; },
      'the shading on the wrong side': (q) => {
        const sh = q.visualization.shade[anyLine(q)];
        sh.side = { left: 'right', right: 'left', above: 'below', below: 'above' }[sh.side];
      },
      'a line moved with its shading': (q) => {
        const i = anyLine(q);
        const [ln, sh] = [q.visualization.lines[i], q.visualization.shade[i]];
        if (ln.x !== undefined) { ln.x += 1; sh.x += 1; } else { ln.c -= 1; sh.c -= 1; }
      },
      'a strict sign made inclusive or back': (q) => {
        const s = flipSym(q.answer, ['\\le', '\\ge', '<', '>'], ['<', '>', '\\le', '\\ge']);
        if (!s) return false;
        setAnswer(q, s);
      },
      'an inequality turned round': (q) => {
        const s = flipSym(q.answer, ['\\le', '\\ge', '<', '>'], ['\\ge', '\\le', '>', '<']);
        if (!s) return false;
        setAnswer(q, s);
      },
      'a point left out': (q) => {
        if (q.metadata.difficulty !== 'stretch') return false;
        const pts = q.answer.split('), (');
        pts.splice(_.random(0, pts.length - 1), 1);
        setAnswer(q, pts.join('), (').replace(/^(?!\()/, '(').replace(/([^)])$/, '$1)'));
      },
      'a point on a dashed line put in': (q) => {
        if (q.metadata.difficulty !== 'stretch') return false;
        const kept = /not in R: \} (\(-?\d+, -?\d+\))/.exec(q.workingOut);
        setAnswer(q, `${q.answer}, ${kept[1]}`);
      },
      'R labelled on a line': (q) => {
        const ln = q.visualization.lines.find((l) => l.x !== undefined);
        q.visualization.regionLabel[0] = ln.x;
      },
      'moved to another band': bandMove({ foundation: 'core', core: 'stretch', stretch: 'foundation' }),
    };
    const tally = mutants({ skills: ['inequality-regions'], check, ops, perBand: 200 });
    Object.entries(tally).forEach(([name, r]) => expect(r.survivors.slice(0, 2).map((s) => s.q), name).toEqual([]));
    expect(Object.keys(tally).sort()).toEqual(Object.keys(ops).sort());
  });
});
