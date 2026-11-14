// Mutation test for the Transformations harness. Each operator breaks real
// generator output; the checker must reject every broken copy. Unchanged
// copies are skipped, and so are the equivalent mutants, by rule: an answer
// with x and y swapped when they are equal, and shapes A and B swapped for
// a reflection or a half turn, which are their own inverses. In the mixed
// describe skill Core is "any of the four" and overlaps the bands either
// side by design, so its band move goes between Foundation and Stretch
// only. The kill reasons were checked by hand.
//
// Run: npx vitest run src/generators/geometry/transformationGenerators.mutation.test.js

import { describe, expect, it } from 'vitest';
import _ from 'lodash';
import {
  generateTranslation, generateReflection, generateRotation, generateEnlargement, generateDescribeTransformation,
} from './transformationGenerators';
import { checkTransformation } from './transformationGenerators.check';

const PER_BAND = 200;
const BANDS = ['foundation', 'core', 'stretch'];
const GENS = [generateTranslation, generateReflection, generateRotation, generateEnlargement, generateDescribeTransformation];

const NUM = /−?-?\d+/g;
const value = (s) => Number(s.replace('−', '-'));
// Add one to a randomly chosen integer in s (signed, either minus sign).
function bumpOne(s) {
  const hits = [...s.matchAll(NUM)];
  if (!hits.length) return null;
  const h = _.sample(hits);
  const minus = h[0].startsWith('−') ? '−' : '-';
  const v = value(h[0]) + 1;
  return s.slice(0, h.index) + (v < 0 ? `${minus}${-v}` : String(v)) + s.slice(h.index + h[0].length);
}
const isDescribe = (q) => !q.visualization.solution;
const swapWords = (s, a, b) => s.replace(new RegExp(`\\b(${a}|${b})\\b`), (w) => (w === a ? b : a));

// Where the sentence saying what to do lives.
const said = (q) => (q.questionText ? 'questionText' : 'instruction');

const OPS = {
  'answer nudged': (q) => { const s = bumpOne(q.answer.replace(/\\frac\{1\}\{2\}/, 'HALF')); if (!s) return false; q.answer = s.replace('HALF', '\\frac{1}{2}'); },
  'answer coordinates swapped': (q) => {
    const m = /^([AP]'+) = \((-?\d+), (-?\d+)\)$/.exec(q.answer);
    if (!m || m[2] === m[3]) return false;
    q.answer = `${m[1]} = (${m[3]}, ${m[2]})`;
  },
  'a sign dropped in the answer': (q) => { if (!/-\d/.test(q.answer)) return false; q.answer = q.answer.replace(/-(\d)/, '$1'); },
  'a vertex of the image moved': (q) => {
    const s = q.visualization.solution?.[0];
    if (!s) return false;
    const i = _.random(0, s.pts.length - 1);
    s.pts[i] = [s.pts[i][0] + _.sample([-1, 1]), s.pts[i][1]];
  },
  'the whole image moved': (q) => {
    const s = q.visualization.solution?.[0];
    if (!s) return false;
    s.pts = s.pts.map(([x, y]) => [x, y + 1]);
  },
  'A lettered at another corner': (q) => {
    const f = q.visualization;
    if (!f.solution || f.shapes[0].pts.length < 2) return false;
    const n = f.shapes[0].pts.length;
    const j = (f.shapes[0].vertex.index + _.random(1, n - 1)) % n;
    if (Math.random() < 0.5) f.shapes[0].vertex.index = j;
    else { f.shapes[0].vertex.index = j; f.solution[0].vertex.index = j; }
  },
  'a vertex of the object moved': (q) => {
    const s = q.visualization.shapes[0];
    const i = _.random(0, s.pts.length - 1);
    s.pts[i] = [s.pts[i][0], s.pts[i][1] + _.sample([-1, 1])];
  },
  'shape B moved': (q) => {
    const f = q.visualization;
    if (!isDescribe(q)) return false;
    const [dx, dy] = _.sample([[1, 0], [-1, 0], [0, 1], [0, -1]]);
    f.shapes[1].pts = f.shapes[1].pts.map(([x, y]) => [x + dx, y + dy]);
  },
  'shapes A and B swapped': (q) => {
    if (!isDescribe(q) || /Reflection|^[xy] = |180/.test(q.answer)) return false;
    const f = q.visualization;
    [f.shapes[0].pts, f.shapes[1].pts] = [f.shapes[1].pts, f.shapes[0].pts];
  },
  'a number in the sentence changed': (q) => { const s = bumpOne(q[said(q)]); if (!s) return false; q[said(q)] = s; },
  'a direction reversed': (q) => {
    const s = q[said(q)];
    let t = /clockwise/.test(s) ? s.replace(/\b(anti)?clockwise/, (w) => (w === 'clockwise' ? 'anticlockwise' : 'clockwise'))
      : /right|left/.test(s) ? swapWords(s, 'right', 'left') : /up|down/.test(s) ? swapWords(s, 'up', 'down') : null;
    if (!t && /clockwise/.test(q.answer)) { q.answer = q.answer.replace(/\{ (anti)?clockwise\}/, (w) => (w.includes('anti') ? '{ clockwise}' : '{ anticlockwise}')); return undefined; }
    if (!t) return false;
    q[said(q)] = t;
  },
  'the axis named instead': (q) => {
    if (!/the [xy]-axis/.test(q[said(q)])) return false;
    q[said(q)] = q[said(q)].replace(/the ([xy])-axis/, (w, a) => `the line ${a === 'x' ? 'y' : 'x'} = 0`);
  },
  'the scale factor changed': (q) => {
    if (/scale factor/.test(q[said(q)])) { q[said(q)] = q[said(q)].replace(/scale factor (2|3|½|−1|−2)/, (w, k) => `scale factor ${{ 2: 3, 3: 2, '½': 2, '−1': '−2', '−2': '−1' }[k]}`); return undefined; }
    if (!/scale factor/.test(q.answer)) return false;
    q.answer = q.answer.replace(/scale factor \} (2|3|\\frac\{1\}\{2\})/, (w, k) => `scale factor } ${{ 2: '3', 3: '2' }[k] ?? '2'}`);
  },
  'the column vector changed': (q) => { if (!q.questionMath) return false; q.questionMath = bumpOne(q.questionMath); },
  'the mirror line moved': (q) => {
    const f = q.visualization;
    const key = f.mirror ? 'mirror' : f.solutionMirror ? 'solutionMirror' : null;
    if (!key) return false;
    const ln = f[key];
    if (ln.x !== undefined) ln.x += 1; else if (ln.y !== undefined) ln.y += 1; else ln.m = -ln.m;
  },
  'the mirror label changed': (q) => {
    const f = q.visualization;
    const key = f.mirrorLabel ? 'mirrorLabel' : f.solutionMirrorLabel ? 'solutionMirrorLabel' : null;
    if (!key) return false;
    f[key] = /\d/.test(f[key]) ? bumpOne(f[key]) : f[key].replace(/x$/, 'x + 1');
  },
  'an axis mirror labelled': (q) => {
    const f = q.visualization;
    const key = f.mirror ? 'mirror' : f.solutionMirror ? 'solutionMirror' : null;
    if (!key || !(f[key].x === 0 || f[key].y === 0)) return false;
    f[`${key}Label`] = f[key].x === 0 ? 'x = 0' : 'y = 0';
  },
  'the centre moved': (q) => {
    const f = q.visualization;
    const key = f.centre ? 'centre' : f.solutionCentre ? 'solutionCentre' : null;
    if (!key) return false;
    f[key] = [f[key][0] + 1, f[key][1]];
  },
  'a centre or mirror given away before reveal': (q) => {
    const f = q.visualization;
    if (f.solutionCentre) f.centre = f.solutionCentre;
    else if (f.solutionMirror) { f.mirror = f.solutionMirror; f.mirrorLabel = f.solutionMirrorLabel; } else return false;
  },
  'the reveal dropped': (q) => {
    const f = q.visualization;
    if (f.solution) delete f.solution[0].vertex;
    else if (f.solutionCentre) delete f.solutionCentre;
    else if (f.solutionMirror) delete f.solutionMirror;
    else return false;
  },
  'a hyphen for a minus sign': (q) => { if (!q[said(q)].includes('−')) return false; q[said(q)] = q[said(q)].replace('−', '-'); },
  'a working number changed': (q) => { const s = bumpOne(q.workingOut.replace(/\\frac\{1\}\{2\}/, 'HALF')); if (!s) return false; q.workingOut = s.replace('HALF', '\\frac{1}{2}'); },
  'the working stops short': (q) => {
    const lines = q.workingOut.split('\n');
    if (lines.length < 2) return false;
    q.workingOut = lines.slice(0, -1).join('\n');
  },
  'a prime dropped': (q) => { if (!/''/.test(q.answer)) return false; q.answer = q.answer.replace("''", "'"); },
  'a point called the shape': (q) => { if (!/the point P/.test(q[said(q)])) return false; q[said(q)] = q[said(q)].replace('the point P', 'the shape'); },
  'a shape called the point': (q) => { if (!/the shape/.test(q[said(q)]) || !q.visualization.solution) return false; q[said(q)] = q[said(q)].replace('the shape', 'the point P'); },
  'the second translation dropped': (q) => {
    if (!/then/.test(q.questionMath ?? '')) return false;
    q.questionMath = q.questionMath.split(' \\text{ then } ')[0];
  },
  'the two translations swapped for one': (q) => {
    if (!/then/.test(q.questionMath ?? '')) return false;
    q.instruction = q.instruction.replace('by the first column vector, then by the second', 'by the column vector');
  },
  'metadata changed': (q) => { q.metadata.difficulty = q.metadata.difficulty === 'core' ? 'stretch' : 'core'; },
  'moved to another band': (q) => {
    const band = q.metadata.difficulty;
    if (q.metadata.topic === 'describe-transformation') {
      if (band === 'core') return false;
      q.__band = band === 'foundation' ? 'stretch' : 'foundation';
    } else q.__band = band === 'foundation' ? 'core' : 'foundation';
  },
};

describe('Transformations mutation test', () => {
  it('rejects every broken copy', () => {
    const tally = {};
    GENS.forEach((gen) => {
      BANDS.forEach((band) => {
        for (let t = 0; t < PER_BAND; t += 1) {
          const q = gen({ difficulty: band });
          checkTransformation(q, band);
          Object.entries(OPS).forEach(([name, op]) => {
            const m = _.cloneDeep(q);
            if (op(m) === false || _.isEqual(m, q)) return;
            const row = (tally[name] ??= { applied: 0, killed: 0, survivors: [] });
            row.applied += 1;
            const b = m.__band ?? band;
            if (m.__band) { m.metadata.difficulty = b; delete m.__band; }
            try { checkTransformation(m, b); row.survivors.push(m); } catch { row.killed += 1; }
          });
        }
      });
    });
    Object.entries(tally).forEach(([name, r]) => process.stdout.write(`${name}: ${r.killed}/${r.applied} killed\n`));
    Object.entries(tally).forEach(([name, r]) => expect(r.survivors.slice(0, 2), name).toEqual([]));
    expect(Object.keys(tally).sort()).toEqual(Object.keys(OPS).sort());
  });
});
