// Mutation test for the Similarity harness. Each operator breaks real
// generator output; the checker must reject every broken copy. Unchanged
// copies are skipped. Every printed number in these questions is used, so
// a changed number always changes the answer. The one equivalent mutant,
// x swapped with a label of the same value, is skipped by rule; the kill
// reasons were checked by hand.
//
// Run: npx vitest run src/generators/geometry/similarityGenerators.mutation.test.js

import { describe, expect, it } from 'vitest';
import _ from 'lodash';
import { generateSimilarShapes, generateSimilarTriangles, generateSimilarAreas, generateSimilarVolumes } from './similarityGenerators';
import { checkSimilarShapes, checkSimilarTriangles, checkSimilarAreasVolumes } from './similarityGenerators.check';

const PER_BAND = 300;
const BANDS = ['foundation', 'core', 'stretch'];
const SKILLS = [
  [generateSimilarShapes, checkSimilarShapes],
  [generateSimilarTriangles, checkSimilarTriangles],
  [generateSimilarAreas, checkSimilarAreasVolumes],
  [generateSimilarVolumes, checkSimilarAreasVolumes],
];

const bump = (s) => s.replace(/(\d+(?:\.\d+)?)(?!.*\d)/, (n) => String(Number(n) + 1));
const bumpFirst = (s) => s.replace(/\d+(?:\.\d+)?/, (n) => String(Number(n) + 1));
// Every numeric label on a figure, as [object, key] pairs.
function numericLabels(f) {
  const out = [];
  if (!f) return out;
  if (f.type === 'similar-pair') ['left', 'right'].forEach((w) => f[w].sides.forEach((t, i) => { if (t && t !== 'x') out.push([f[w].sides, i]); }));
  if (f.type === 'similar-triangles') Object.keys(f.labels).forEach((k) => { if (f.labels[k] !== 'x') out.push([f.labels, k]); });
  if (f.type === 'similar-solids') ['left', 'right'].forEach((w) => { if (f[w].length && f[w].length !== 'x') out.push([f[w], 'length']); });
  return out;
}

const OPS = {
  'answer nudged': (q) => { q.answer = bump(q.answer); },
  'answer doubled': (q) => { q.answer = q.answer.replace(/(\d+(?:\.\d+)?)$/, (n) => String(Number(n) * 2)); },
  'units changed': (q) => { q.answerUnits = q.answerUnits === '\\text{cm}' ? '\\text{cm}^2' : '\\text{cm}'; },
  'a figure label changed': (q) => {
    const labels = numericLabels(q.visualization);
    if (!labels.length) return false;
    const [obj, key] = _.sample(labels);
    obj[key] = bumpFirst(obj[key]);
  },
  'an area or volume changed': (q) => {
    const f = q.visualization;
    if (!f) return false;
    const spots = [];
    if (f.type === 'similar-pair') ['left', 'right'].forEach((w) => { if (/\d/.test(f[w].area ?? '')) spots.push(f[w]); });
    if (f.type === 'similar-solids') ['left', 'right'].forEach((w) => { if (/\d/.test(f[w].value ?? '')) spots.push(f[w]); });
    if (!spots.length) return false;
    const s = _.sample(spots);
    if (s.area) s.area = bumpFirst(s.area); else s.value = bumpFirst(s.value);
  },
  'the given line changed': (q) => {
    if (!q.questionMath) return false;
    q.questionMath = bump(q.questionMath.replace(/\\text\{ cm\}\^2$/, ' CMSQ').replace(/\\text\{ cm\}$/, ' CM')).replace(' CMSQ', '\\text{ cm}^2').replace(' CM', '\\text{ cm}');
  },
  'a number in the sentence changed': (q) => {
    if (q.visualization) return false;
    const hits = [...q.questionText.matchAll(/\d+(\.\d+)?/g)];
    const h = _.sample(hits);
    q.questionText = q.questionText.slice(0, h.index) + String(Number(h[0]) + 1) + q.questionText.slice(h.index + h[0].length);
  },
  // Swapping x with a label equal to the answer leaves the same numbers in
  // the same places: an equivalent mutant, skipped.
  'x moved to another label': (q) => {
    const f = q.visualization;
    if (!f) return false;
    const answer = Number(q.answer.split(' = ')[1]);
    if (f.type === 'similar-pair') {
      const w = ['left', 'right'].find((s) => f[s].sides.includes('x'));
      if (!w) return false;
      const xi = f[w].sides.indexOf('x');
      const others = f[w].sides.map((t, i) => (t && i !== xi ? i : -1)).filter((i) => i >= 0);
      if (!others.length) return false;
      const j = _.sample(others);
      if (parseFloat(f[w].sides[j]) === answer) return false;
      [f[w].sides[xi], f[w].sides[j]] = [f[w].sides[j], 'x'];
      f.unknown = { side: w, index: j };
    } else if (f.type === 'similar-triangles') {
      const keys = Object.keys(f.labels).filter((k) => f.labels[k] !== 'x');
      const xk = Object.keys(f.labels).find((k) => f.labels[k] === 'x');
      if (!xk) return false;
      const j = _.sample(keys);
      if (parseFloat(f.labels[j]) === answer) return false;
      [f.labels[xk], f.labels[j]] = [f.labels[j], 'x'];
      f.unknown = j;
    } else return false;
  },
  'the slot colour on the wrong label': (q) => {
    const f = q.visualization;
    if (!f) return false;
    if (f.type === 'similar-pair') f.unknown = f.unknown?.side ? { ...f.unknown, side: f.unknown.side === 'left' ? 'right' : 'left' } : { area: f.unknown?.area === 'left' ? 'right' : 'left' };
    else if (f.type === 'similar-triangles') f.unknown = f.unknown === null ? 'DE' : null;
    else f.unknown = f.unknown === 'left' ? 'right' : 'left';
  },
  'the smaller shape drawn larger': (q) => {
    const f = q.visualization;
    if (!f || f.type === 'similar-triangles') return false;
    [f.left.big, f.right.big] = [f.right.big, f.left.big];
  },
  'turn changed': (q) => {
    const f = q.visualization;
    if (f?.type !== 'similar-pair' || q.metadata.topic !== 'similar-shapes') return false;
    f.turn = f.turn === 'none' ? (f.shape === 'triangle' ? 'rotate' : 'quarter') : 'none';
  },
  'vertex letters swapped': (q) => {
    const f = q.visualization;
    if (f?.type !== 'similar-triangles') return false;
    const [i, j] = _.sampleSize([0, 1, 2, 3, 4], 2);
    [f.vertices[i], f.vertices[j]] = [f.vertices[j], f.vertices[i]];
  },
  'second shape named in order': (q) => {
    const m = /(similar to triangle|Rectangles [A-Z]{4} and) ([A-Z]{3,4})(?=\.| are)/.exec(q.questionText ?? '');
    if (!m || q.visualization) return false;
    q.questionText = q.questionText.replace(`${m[1]} ${m[2]}`, `${m[1]} ${[...m[2]].sort().join('')}`);
  },
  'a working number changed': (q) => {
    const lines = q.workingOut.split('\n');
    const k = _.random(0, lines.length - 1);
    const hits = [...lines[k].matchAll(/\d+(\.\d+)?/g)];
    if (!hits.length) return false;
    const h = _.sample(hits);
    lines[k] = lines[k].slice(0, h.index) + String(Number(h[0]) + 1) + lines[k].slice(h.index + h[0].length);
    q.workingOut = lines.join('\n');
  },
  'the working stops short': (q) => {
    const lines = q.workingOut.split('\n');
    if (lines.length < 2) return false;
    q.workingOut = lines.slice(0, -1).join('\n');
  },
  'metadata changed': (q) => { q.metadata.difficulty = q.metadata.difficulty === 'core' ? 'stretch' : 'core'; },
};

describe('Similarity mutation test', () => {
  it('rejects every broken copy', () => {
    const tally = {};
    SKILLS.forEach(([gen, check]) => {
      BANDS.forEach((band) => {
        for (let t = 0; t < PER_BAND; t += 1) {
          const q = gen({ difficulty: band });
          check(q, band);
          Object.entries(OPS).forEach(([name, op]) => {
            const m = _.cloneDeep(q);
            if (op(m) === false || _.isEqual(m, q)) return;
            const row = (tally[name] ??= { applied: 0, killed: 0, survivors: [] });
            row.applied += 1;
            try { check(m, band); row.survivors.push(m); } catch { row.killed += 1; }
          });
        }
      });
    });
    Object.entries(tally).forEach(([name, r]) => process.stdout.write(`${name}: ${r.killed}/${r.applied} killed\n`));
    Object.entries(tally).forEach(([name, r]) => expect(r.survivors.slice(0, 2), name).toEqual([]));
    expect(Object.keys(tally).sort()).toEqual(Object.keys(OPS).sort());
  });
});
