// Mutation test for the Further trigonometry harness. Each operator breaks
// real generator output; the checker must reject every broken copy.
// Unchanged copies are skipped, and so are equivalent mutants: a changed
// number that leaves a correct question with the same printed answer. Those
// are ruled out by the small solver below, written for this file with the
// sine and cosine rules themselves (the checker builds coordinates
// instead) and not shared with it. Where a change would also make the
// drawing lie, the drawing is repaired first, so the kill has to come from
// the answer.
//
// Run: npx vitest run src/generators/geometry/furtherTrigGenerators.mutation.test.js

import { describe, expect, it } from 'vitest';
import _ from 'lodash';
import {
  generateSineRule, generateCosineRule, generateTriangleAreaSine, generateSineCosineMixed,
} from './furtherTrigGenerators';
import { checkSineRule, checkCosineRule, checkTriangleArea, checkMixed } from './furtherTrigGenerators.check';

const PER_BAND = 300;
const BANDS = ['foundation', 'core', 'stretch'];
const SKILLS = [
  ['sine-rule', generateSineRule, checkSineRule],
  ['cosine-rule', generateCosineRule, checkCosineRule],
  ['triangle-area-sine', generateTriangleAreaSine, checkTriangleArea],
  ['sine-cosine-mixed', generateSineCosineMixed, checkMixed],
];

/* --------------------------------------------- a solver of its own */

const R = Math.PI / 180;
const sinD = (d) => Math.sin(d * R);
const cosD = (d) => Math.cos(d * R);
const nn = (arr) => arr.filter((v) => v != null).length;

// Sine and cosine rules, side i opposite angle i. Every solution.
function local(s0, A0) {
  const s = [...s0], A = [...A0];
  if (nn(A) === 2) { const i = A.findIndex((v) => v == null); A[i] = 180 - A[(i + 1) % 3] - A[(i + 2) % 3]; }
  if (nn(A) === 3) {
    if (A.some((a) => a <= 0)) return [];
    const i = s.findIndex((v) => v != null);
    const k = s[i] / sinD(A[i]);
    return [{ s: A.map((a) => k * sinD(a)), A }];
  }
  if (nn(s) === 3) {
    const ang = [0, 1, 2].map((i) => {
      const [j, k] = [(i + 1) % 3, (i + 2) % 3];
      return Math.acos((s[j] ** 2 + s[k] ** 2 - s[i] ** 2) / (2 * s[j] * s[k])) / R;
    });
    return ang.some(Number.isNaN) ? [] : [{ s, A: ang }];
  }
  const i = A.findIndex((v) => v != null);
  const [j, k] = [(i + 1) % 3, (i + 2) % 3];
  if (s[j] != null && s[k] != null) {
    s[i] = Math.sqrt(s[j] ** 2 + s[k] ** 2 - 2 * s[j] * s[k] * cosD(A[i]));
    return local(s, [null, null, null]);
  }
  const o = s[j] != null ? j : k;
  const r = (s[o] * sinD(A[i])) / s[i];
  if (r > 1) return [];
  const B = Math.asin(r) / R;
  return _.uniqBy([B, 180 - B].filter((b) => A[i] + b < 180 - 1e-9), (b) => b.toFixed(6))
    .map((b) => { const a = [...A]; a[o] = b; return local(s.map((v, x) => (x === i ? v : null)), a)[0]; });
}

const sf3 = (v) => v.toPrecision(3);
const dp1 = (v) => v.toFixed(1);
const num = (l) => (l == null || l === 'x' ? null : parseFloat(l));

// The answer this file expects for a question, or null where the question
// is not a sound one (so a mutant reaching it must be killed).
function expected(q) {
  const f = q.visualization;
  if (f?.type === 'oblique-triangle') {
    const xi = f.sides.indexOf('x'), xa = f.angleLabels.indexOf('x');
    if (q.questionMath) {   // area given, x a side
      const area = parseFloat(q.questionMath.replace('\\text{Area} = ', ''));
      const i = f.angleLabels.findIndex((v) => v != null);
      const k = [0, 1, 2].find((n) => n !== i && n !== xi);
      return `x = ${sf3((2 * area) / (num(f.sides[k]) * sinD(num(f.angleLabels[i]))))}`;
    }
    if (xi < 0 && xa < 0) {   // area asked
      const i = f.angleLabels.findIndex((v) => v != null);
      const [j, k] = [(i + 1) % 3, (i + 2) % 3];
      return sf3(0.5 * num(f.sides[j]) * num(f.sides[k]) * sinD(num(f.angleLabels[i])));
    }
    const sols = local(f.sides.map(num), f.angleLabels.map(num));
    if (sols.length !== 1) return null;
    return xi >= 0 ? `x = ${sf3(sols[0].s[xi])}` : `x = ${dp1(sols[0].A[xa])}^\\circ`;
  }
  if (f?.type === 'two-triangles') {
    const S = _.mapValues(f.sides, num), A = _.mapValues(f.angles, num);
    const t1 = local([null, S.DA, S.AB], [A.A, A.ABD, A.ADB]);
    if (t1.length !== 1) return null;
    const BD = t1[0].s[0];
    const t2 = local([S.CD, BD, S.BC], [A.CBD, A.C, A.CDB]);
    if (t2.length !== 1) return null;
    const [a, b, d] = t1[0].A, [cb, c, cd] = t2[0].A;
    if (!(a - d >= 3 - 1e-6 && d - b >= 3 - 1e-6 && a < 90 && cb - c >= 3 - 1e-6 && c - cd >= 3 - 1e-6 && cb < 90)) return null;
    const v = { CD: t2[0].s[0], BC: t2[0].s[2], CDB: cd };
    const key = Object.keys(f.sides).find((k) => f.sides[k] === 'x') ?? Object.keys(f.angles).find((k) => f.angles[k] === 'x');
    return key === 'CDB' ? `x = ${dp1(v[key])}^\\circ` : `x = ${sf3(v[key])}`;
  }
  const ints = (str) => (str.match(/\d+/g) ?? []).map(Number);
  const text = q.questionText ?? q.instruction;
  if (text.startsWith('In triangle')) {
    const [name, s1, v1, s2, v2, ang, va] = /^In triangle (\w+), (\w+) = (\d+) cm, (\w+) = (\d+) cm and angle (\w+) = (\d+)°\.$/.exec(text).slice(1);
    const ask = /angle (\w+),/.exec(q.instruction)[1];
    const idx = (ch) => name.indexOf(ch);
    const opp = (nm) => idx([...name].find((ch) => !nm.includes(ch)));
    const s = [null, null, null], A = [null, null, null];
    s[opp(s1)] = Number(v1); s[opp(s2)] = Number(v2); A[idx(ang[1])] = Number(va);
    const vals = local(s, A).map((t) => t.A[idx(ask[1])]).sort((p, r) => p - r).map(dp1);
    return vals.length === 2 ? `${vals[0]}^\\circ \\text{ or } ${vals[1]}^\\circ` : vals.length === 1 ? `${vals[0]}^\\circ \\text{ only}` : null;
  }
  if (text.startsWith('A triangle has')) {
    const s = ints(q.questionMath.replace(/\\quad/g, ''));
    const sols = local(s, [null, null, null]);
    if (sols.length !== 1) return null;
    return `${dp1(text.includes('largest') ? Math.max(...sols[0].A) : Math.min(...sols[0].A))}^\\circ`;
  }
  if (text.startsWith('Triangle')) {
    const [area, p, qq] = ints(text.replace(/cm²/, ''));
    const r = (2 * area) / (p * qq);
    if (r >= 1) return null;
    const t = Math.asin(r) / R;
    return `${dp1(t)}^\\circ \\text{ or } ${dp1(180 - Number(dp1(t)))}^\\circ`;
  }
  // Bearings, by the cosine and sine rules from the turn.
  const m = /(\d+) km on a bearing of (\d{3})°.* (\d+) km on a bearing of (\d{3})°/.exec(text);
  const [l1, b1, l2, b2] = m.slice(1).map(Number);
  let d = (b2 - b1 + 360) % 360;
  const cw = d < 180;
  if (!cw) d = 360 - d;
  const T = 180 - d;
  const dist = Math.sqrt(l1 ** 2 + l2 ** 2 - 2 * l1 * l2 * cosD(T));
  if (q.instruction.startsWith('Find the distance')) return sf3(dist);
  const alpha = Math.asin((l2 * sinD(T)) / dist) / R;
  const brg = (((cw ? b1 + alpha : b1 - alpha) % 360) + 360) % 360;
  return `${dp1(brg).padStart(5, '0')}^\\circ`;
}

/* -------------------------------------------------------- operators */

const bump = (str) => {   // the last digit up by one, same width
  const dec = (str.split('.')[1] ?? '').length;
  return (Number(str) + 10 ** -dec).toFixed(dec).padStart(str.length, '0');
};
const firstNum = /\d+(\.\d+)?/;

// Recompute the oblique drawing from its labels, where it can be done.
function redraw(q) {
  const f = q.visualization;
  if (f?.type !== 'oblique-triangle') return true;
  let s = f.sides.map(num);
  if (q.questionMath) {   // area given: put the true x in first, unrounded
    const xi = f.sides.indexOf('x');
    const area = parseFloat(q.questionMath.replace('\\text{Area} = ', ''));
    const i = f.angleLabels.findIndex((v) => v != null);
    const k = [0, 1, 2].find((n) => n !== i && n !== xi);
    s = [...s]; s[xi] = (2 * area) / (num(f.sides[k]) * sinD(num(f.angleLabels[i])));
  }
  const xi = f.sides.indexOf('x');
  const known = q.questionMath ? s : s.map((v, i) => (i === xi ? null : v));
  const sols = local(known, f.angleLabels.map(num));
  if (sols.length !== 1) return true;   // nothing honest to draw: must be killed anyway
  f.angles = sols[0].A;
  return true;
}

const OPS = {
  'answer nudged': (q) => { q.answer = q.answer.replace(firstNum, (n) => bump(n)); return true; },
  'answer to the wrong accuracy': (q) => {
    q.answer = q.answer.replace(firstNum, (n) => (n.includes('.') ? String(Math.round(Number(n))) : `${n}.0`));
    return true;
  },
  'second answer dropped': (q) => {
    if (!q.answer.includes('\\text{ or }')) return false;
    q.answer = `${q.answer.split(' \\text{ or }')[0]} \\text{ only}`;
    return true;
  },
  'second answer added': (q) => {
    const m = /^(\d+\.\d)\^\\circ \\text\{ only\}$/.exec(q.answer);
    if (!m) return false;
    q.answer = `${m[1]}^\\circ \\text{ or } ${dp1(180 - Number(m[1]))}^\\circ`;
    return true;
  },
  'units changed': (q) => {
    if (q.answerUnits === '\\text{cm}') q.answerUnits = '\\text{km}';
    else if (q.answerUnits) delete q.answerUnits;
    else q.answerUnits = '\\text{cm}';
    return true;
  },
  'instruction swapped': (q) => {
    const swaps = [['side', 'angle'], ['length', 'size'], ['3 significant figures', '1 decimal place'], ['largest', 'smallest'], ['distance', 'bearing']];
    const before = q.instruction + q.questionText;
    for (const [a, b] of _.shuffle(swaps)) {
      if (q.instruction.includes(a)) { q.instruction = q.instruction.replace(a, b); break; }
      if (q.instruction.includes(b)) { q.instruction = q.instruction.replace(b, a); break; }
    }
    return before !== q.instruction + q.questionText;
  },
  'metadata changed': (q) => { q.metadata.topic = 'sine-rule' === q.metadata.topic ? 'cosine-rule' : 'sine-rule'; return true; },
  'a working number changed': (q) => {
    const lines = q.workingOut.split('\n');
    const k = _.random(0, lines.length - 1);
    const hits = [...lines[k].matchAll(/\d+(\.\d+)?/g)];
    if (!hits.length) return false;
    const h = _.sample(hits);
    lines[k] = lines[k].slice(0, h.index) + String(Number(h[0]) + 1) + lines[k].slice(h.index + h[0].length);
    q.workingOut = lines.join('\n');
    return true;
  },
  'the working stops short': (q) => {
    const lines = q.workingOut.split('\n');
    const n = q.answer.match(firstNum)[0];
    const keep = lines.filter((l) => !l.includes(`= ${n}`));
    if (keep.length === lines.length || !keep.length) return false;
    q.workingOut = keep.join('\n');
    return true;
  },

  // Figures.
  'the drawing lies': (q) => {
    const f = q.visualization;
    if (f?.type !== 'oblique-triangle') return false;
    const [i, j] = _.sampleSize([0, 1, 2], 2);
    if (Math.abs(f.angles[i] - f.angles[j]) < 1e-6) return false;
    [f.angles[i], f.angles[j]] = [f.angles[j], f.angles[i]];
    return true;
  },
  'highlight on the wrong label': (q) => {
    const f = q.visualization;
    if (!f) return false;
    if (f.type === 'oblique-triangle') {
      if (!f.unknown) { f.unknown = { side: _.random(0, 2) }; return true; }
      const [kind] = Object.keys(f.unknown);
      f.unknown = { [kind]: (f.unknown[kind] + 1) % 3 };
      return true;
    }
    f.unknown = f.unknown.side ? { side: f.unknown.side === 'CD' ? 'BC' : 'CD' } : { angle: 'C' };
    return true;
  },
  'a given label changed, drawing repaired': (q) => {
    const f = q.visualization;
    if (!f) return false;
    const before = expected(q);
    if (f.type === 'oblique-triangle') {
      const slots = [...f.sides.map((v, i) => ['sides', i, v]), ...f.angleLabels.map((v, i) => ['angleLabels', i, v])]
        .filter(([, , v]) => v != null && v !== 'x');
      const [arr, i, v] = _.sample(slots);
      f[arr][i] = arr === 'sides' ? `${num(v) + 1} cm` : `${num(v) + 1}^\\circ`;
      redraw(q);
    } else {
      const slots = [...Object.entries(f.sides).map(([k, v]) => ['sides', k, v]), ...Object.entries(f.angles).map(([k, v]) => ['angles', k, v])]
        .filter(([, , v]) => v !== 'x');
      const [arr, k, v] = _.sample(slots);
      f[arr][k] = arr === 'sides' ? `${num(v) + 1} cm` : `${num(v) + 1}^\\circ`;
    }
    const after = expected(q);
    return !(after !== null && after === before);   // same sound question, same answer: equivalent
  },
  'the x moved, drawing repaired': (q) => {
    const f = q.visualization;
    if (f?.type !== 'oblique-triangle' || q.questionMath) return false;
    const arr = f.sides.includes('x') ? 'sides' : f.angleLabels.includes('x') ? 'angleLabels' : null;
    if (!arr) return false;
    const xi = f[arr].indexOf('x');
    const others = [0, 1, 2].filter((i) => i !== xi && f[arr][i] != null);
    if (!others.length) return false;
    const before = expected(q);
    const to = _.sample(others);
    [f[arr][xi], f[arr][to]] = [f[arr][to], 'x'];
    f.unknown = { [arr === 'sides' ? 'side' : 'angle']: to };
    redraw(q);
    const after = expected(q);
    return !(after !== null && after === before);
  },
  'vertex letters changed': (q) => {
    const f = q.visualization;
    if (!f?.vertices) return false;
    f.vertices = f.vertices.length === 3 ? (f.vertices.join('') === 'XYZ' ? ['P', 'Q', 'R'] : ['X', 'Y', 'Z']) : (f.vertices.join('') === 'WXYZ' ? ['P', 'Q', 'R', 'S'] : ['W', 'X', 'Y', 'Z']);
    return true;
  },
  'compound labels swapped across the diagonal': (q) => {
    const f = q.visualization;
    if (f?.type !== 'two-triangles') return false;
    const before = expected(q);
    const pick = _.sampleSize(Object.keys(f.angles).filter((k) => f.angles[k] !== 'x'), 2);
    if (pick.length < 2 || f.angles[pick[0]] === f.angles[pick[1]]) return false;
    [f.angles[pick[0]], f.angles[pick[1]]] = [f.angles[pick[1]], f.angles[pick[0]]];
    const after = expected(q);
    return !(after !== null && after === before);
  },

  // Sentences.
  'a number in the sentence changed': (q) => {
    if (q.visualization) return false;
    const target = q.questionMath ? 'questionMath' : 'questionText';
    const hits = [...q[target].matchAll(/\d+/g)];
    if (!hits.length) return false;
    const before = expected(q);
    const h = _.sample(hits);
    const v = String(Number(h[0]) + 1).padStart(h[0].length, '0');
    q[target] = q[target].slice(0, h.index) + v + q[target].slice(h.index + h[0].length);
    let after;
    try { after = expected(q); } catch { after = null; }
    return !(after !== null && after === before);
  },
  // Moved to another vertex. For the ambiguous case that may be a sound
  // question with the same answer (equivalent); for the area it never is,
  // since the angle must lie between the two sides given.
  'the angle asked changed': (q) => {
    const m = /angle ([A-Z]{3}),/.exec(q.instruction ?? '');
    if (!m) return false;
    const name = /triangle (\w+)/i.exec(q.questionText)[1];
    const v = _.sample([...name].filter((ch) => ch !== m[1][1]));
    const rest = [...name].filter((ch) => ch !== v);
    const before = expected(q);
    q.instruction = q.instruction.replace(m[1], `${rest[0]}${v}${rest[1]}`);
    if (!q.questionText.startsWith('In triangle')) return true;
    let after;
    try { after = expected(q); } catch { after = null; }
    return !(after !== null && after === before);
  },
  'from and to swapped': (q) => {
    const m = /^Find the bearing of ([A-Z]) from ([A-Z])\./.exec(q.instruction ?? '');
    if (!m) return false;
    q.instruction = q.instruction.replace(`of ${m[1]} from ${m[2]}`, `of ${m[2]} from ${m[1]}`);
    return true;
  },
};

describe('Further trigonometry mutation test', () => {
  it('rejects every broken copy', () => {
    const tally = {};
    SKILLS.forEach(([, gen, check]) => {
      BANDS.forEach((band) => {
        for (let t = 0; t < PER_BAND; t += 1) {
          const q = gen({ difficulty: band });
          check(q, band);
          Object.entries(OPS).forEach(([name, op]) => {
            const m = _.cloneDeep(q);
            if (!op(m) || _.isEqual(m, q)) return;
            const row = (tally[name] ??= { applied: 0, killed: 0, survivors: [] });
            row.applied += 1;
            try { check(m, band); row.survivors.push(m); } catch { row.killed += 1; }
          });
        }
      });
    });
    Object.entries(tally).forEach(([name, r]) => process.stdout.write(`${name}: ${r.killed}/${r.applied} killed\n`));
    Object.entries(tally).forEach(([name, r]) => {
      expect(r.applied, `${name} never applied`).toBeGreaterThan(0);
      expect(r.survivors.slice(0, 2), name).toEqual([]);
    });
    expect(Object.keys(tally).sort()).toEqual(Object.keys(OPS).sort());
  });
});
