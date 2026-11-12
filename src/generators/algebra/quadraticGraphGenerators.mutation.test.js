// Mutation test for the quadraticGraphGenerators harness. Each operator
// breaks real generator output; the checker must reject every broken copy.
// MUTANT_REASONS=1 lists why; SHOW=1 prints the first survivors.
//
// Run: npx vitest run src/generators/algebra/quadraticGraphGenerators.mutation.test.js

import { describe, expect, it } from 'vitest';
import { bandMove, generic, mutants } from '../harness.check';
import { checkQuadraticGraphs } from './quadraticGraphGenerators.check';
import { value } from '../number/logarithmGenerators.check';

const IDS = ['quadratic-substitution', 'quadratic-vertex-form', 'quadratic-intercepts', 'quadratic-symmetry', 'quadratic-find-function'];

// ax^2 + bx + c printed, for an answer rewritten in another form.
const expanded = (tex) => {
  const f = (x) => value(tex, { x });
  const c = f(0); const a = (f(1) + f(-1)) / 2 - c; const b = (f(1) - f(-1)) / 2;
  const t = [a === 1 ? 'x^2' : a === -1 ? '-x^2' : `${a}x^2`];
  if (b) t.push(`${b < 0 ? '-' : '+'} ${Math.abs(b) === 1 ? '' : Math.abs(b)}x`);
  if (c) t.push(`${c < 0 ? '-' : '+'} ${Math.abs(c)}`);
  return t.join(' ');
};

const OPS = {
  ...generic('answer nudged', 'a working number nudged', 'the working stops short', 'metadata changed'),
  // Any number but the leading coefficient of a factorised form, which moves
  // neither its intercepts nor its line of symmetry (an equivalent mutant).
  'a number in the question nudged': (q) => {
    if (!q.questionMath) return false;
    const [l1] = q.questionMath.split('\n');
    const fact = /^y = -?\d*[(x]/.test(l1) && !l1.includes('^2 ') && /\)$|\)\^2$/.test(l1);
    const all = [...q.questionMath.matchAll(/\d+/g)];
    // Nor the constant of a line-of-symmetry question at Core: it moves the
    // curve up or down, not across.
    const symConst = q.metadata.topic === 'quadratic-symmetry' && q.metadata.difficulty === 'core' && / [+-] \d+$/.test(l1);
    const nums = all.filter((m, i) => !(fact && m.index < l1.length && m.index === 4 + (l1[4] === '-' ? 1 : 0)) && !(symConst && i === all.length - 1));
    if (!nums.length) return false;
    const m = nums[Math.floor(Math.random() * nums.length)];
    q.questionMath = q.questionMath.slice(0, m.index) + (Number(m[0]) + 1) + q.questionMath.slice(m.index + m[0].length);
  },
  // Substitution and finding the function give their values in the
  // instruction, so a wrong one there must be caught too.
  'a number in the instruction nudged': (q) => {
    const nums = [...q.instruction.matchAll(/\d+/g)];
    if (!nums.length) return false;
    const m = nums[Math.floor(Math.random() * nums.length)];
    q.instruction = q.instruction.slice(0, m.index) + (Number(m[0]) + 1) + q.instruction.slice(m.index + m[0].length);
  },
  'a hyphen for a minus sign in the instruction': (q) => {
    if (!q.instruction.includes('\u2212')) return false;
    q.instruction = q.instruction.replace('\u2212', '-');
  },
  'moved to another band': bandMove(),
  'a sign flipped in the answer': (q) => {
    const m = / ([+-]) /.exec(q.answer);
    if (!m) return false;
    q.answer = q.answer.replace(/ ([+-]) /, ` ${m[1] === '+' ? '-' : '+'} `);
  },
  'the vertex read with h the wrong sign': (q) => {
    const m = /\((-?\d+), (-?\d+)\)$/.exec(q.answer.split('\n')[0]);
    if (!m || m[1] === '0') return false;
    q.answer = q.answer.replace(m[0], `(${-Number(m[1])}, ${m[2]})`);
  },
  'the coordinates swapped': (q) => {
    const m = /\((-?\d+), (-?\d+)\)$/.exec(q.answer.split('\n')[0]);
    if (!m || m[1] === m[2]) return false;
    q.answer = q.answer.replace(m[0], `(${m[2]}, ${m[1]})`);
  },
  'roots listed larger first': (q) => {
    const re = /(-?\\frac\{\d+\}\{\d+\}|-?\d+) \\text\{ (and|or) \} (-?\\frac\{\d+\}\{\d+\}|-?\d+)/;
    const m = re.exec(q.answer);
    if (!m) return false;
    q.answer = q.answer.replace(re, `${m[3]} \\text{ ${m[2]} } ${m[1]}`);
  },
  'a root dropped': (q) => {
    const re = / \\text\{ (and|or) \} (-?\\frac\{\d+\}\{\d+\}|-?\d+)/;
    if (!re.test(q.answer)) return false;
    q.answer = q.answer.replace(re, '');
  },
  'answer in the wrong form': (q) => {
    if (!q.answer.startsWith('y = ') || !/\(/.test(q.answer)) return false;
    q.answer = `y = ${expanded(q.answer.slice(4))}`;
    const w = q.workingOut.split('\n'); w[w.length - 1] = q.answer; q.workingOut = w.join('\n');
  },
  'the curve nudged': (q) => { if (!q.visualization?.curves) return false; q.visualization.curves[0].c += 1; },
  'an intercept dot moved': (q) => { if (!q.visualization?.points) return false; q.visualization.points[0].x += 1; },
  'the window cut short': (q) => {
    const f = q.visualization; if (!f?.window) return false;
    const xs = f.points.map((p) => p.x); f.window = [f.window[0], Math.max(...xs), f.window[2], f.window[3]];
  },
  // Not on a line-of-symmetry graph, where turning it over is equivalent.
  'the curve turned over': (q) => {
    const c = q.visualization?.curves?.[0]; if (!c || q.metadata.topic !== 'quadratic-find-function') return false;
    c.a = -c.a; c.b = -c.b; c.c = -c.c;
  },
};

describe('Quadratic graphs mutation test', () => {
  it('rejects every broken copy', () => {
    const tally = mutants({ skills: IDS, check: checkQuadraticGraphs, ops: OPS });
    if (process.env.SHOW) Object.entries(tally).forEach(([name, r]) => r.survivors.slice(0, 3).forEach((x) => console.log('SURV', name, JSON.stringify({ q: x.q.questionMath, a: x.q.answer, w: x.q.workingOut, v: x.q.visualization }))));
    Object.entries(tally).forEach(([name, r]) => expect(r.survivors.slice(0, 2), name).toEqual([]));
    expect(Object.keys(tally).sort()).toEqual(Object.keys(OPS).sort());
  }, 600000);
});
