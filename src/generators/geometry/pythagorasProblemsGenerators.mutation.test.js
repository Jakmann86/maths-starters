// Mutation test for the pythagorasProblemsGenerators harness. Each operator
// breaks real generator output; the checker must reject every broken copy.
// MUTANT_REASONS=1 lists why; SHOW=1 prints the first survivors.
//
// Run: npx vitest run src/generators/geometry/pythagorasProblemsGenerators.mutation.test.js

import { describe, expect, it } from 'vitest';
import { bandMove, generic, mutants } from '../harness.check';
import { checkPythagorasProblems } from './pythagorasProblemsGenerators.check';

const IDS = ['pythagoras-converse', 'pythagoras-3d'];
const LENGTH = /^\d+ (cm|m|km)$/;

const OPS = {
  ...generic('answer nudged', 'question line nudged', 'a working number nudged', 'the working stops short', 'metadata changed'),
  'moved to another band': bandMove(),
  'a side label nudged': (q) => {
    const f = q.visualization; if (!f) return false;
    if (f.sides) { const i = f.sides.findIndex((s) => LENGTH.test(s)); f.sides[i] = f.sides[i].replace(/^\d+/, (n) => Number(n) + 1); return; }
    const k = ['r', 'h', 'l', 'd', 'diameter', 'diagonal'].find((key) => LENGTH.test(f[key] ?? ''));
    if (!k) return false;
    f[k] = f[k].replace(/^\d+/, (n) => Number(n) + 1);
  },
  'two side labels swapped': (q) => {
    const f = q.visualization; if (!f?.sides) return false;
    const [i, j] = [0, 1];
    if (f.sides[i] === f.sides[j]) return false;
    [f.sides[i], f.sides[j]] = [f.sides[j], f.sides[i]];
  },
  'the verdict flipped': (q) => {
    const flips = [['\\text{Yes}', '\\text{No}'], ['\\text{No}', '\\text{Yes}'], ['\\text{Not right-angled}', '\\text{Right-angled at } A'], ['\\text{Right-angled at } ', '\\text{Not right-angled}: \\; ']];
    const f = flips.find(([a]) => q.answer.startsWith(a));
    if (!f) return false;
    q.answer = q.answer.replace(f[0], f[1]);
  },
  'the right angle at the wrong vertex': (q) => {
    const m = /Right-angled at \} ([A-Z])/.exec(q.answer); if (!m) return false;
    const letters = q.visualization?.vertices ?? ['A', 'B', 'C'];
    const other = letters.find((v) => v !== m[1]);
    q.answer = q.answer.replace(`at } ${m[1]}`, `at } ${other}`);
  },
  'a point moved': (q) => {
    if (!q.questionMath?.startsWith('A(')) return false;
    q.questionMath = q.questionMath.replace(/C\((-?\d+)/, (s, n) => `C(${Number(n) + 1}`);
  },
  'the unknown moved': (q) => {
    const f = q.visualization; if (!f || !f.unknown || f.type === 'oblique-triangle') return false;
    const keys = ['r', 'h', 'l', 'd', 'diagonal'].filter((k) => f[k] !== undefined && k !== f.unknown);
    f.unknown = keys[0];
  },
  'the radius read as a diameter': (q) => {
    const f = q.visualization; if (!f?.r || f.type !== 'cylinder') return false;
    f.diameter = f.r; delete f.r;
  },
  'the floor diagonal dropped': (q) => { const f = q.visualization; if (!f?.baseDiagonal) return false; delete f.baseDiagonal; },
  'rounded instead of exact': (q) => {
    const m = /^x = \\sqrt\{(\d+)\}$/.exec(q.answer); if (!m) return false;
    q.answer = `x = ${Math.sqrt(Number(m[1])).toPrecision(3)}`;
  },
};

describe('Pythagoras problems mutation test', () => {
  it('rejects every broken copy', () => {
    const tally = mutants({ skills: IDS, check: checkPythagorasProblems, ops: OPS });
    if (process.env.SHOW) Object.entries(tally).forEach(([name, r]) => r.survivors.slice(0, 3).forEach((x) => console.log('SURV', name, JSON.stringify(x.q))));
    Object.entries(tally).forEach(([name, r]) => expect(r.survivors.slice(0, 2), name).toEqual([]));
    expect(Object.keys(tally).sort()).toEqual(Object.keys(OPS).sort());
  }, 600000);
});
