// Mutation test for the Vectors harness. Each operator breaks real
// generator output; the checker must reject every broken copy.
//
// Equivalent mutants are skipped by rule: a vector's components swapped
// when they are equal, and a diagram's two vectors swapped when the answer
// uses them equally (a + b). Every operator was checked by hand to be killed for
// its own reason (MUTANT_REASONS=1 lists them).
//
// Run: npx vitest run src/generators/geometry/vectorGenerators.mutation.test.js

import { describe, expect, it } from 'vitest';
import _ from 'lodash';
import { bandMove, bump, generic, mutants } from '../harness.check';
import { checkVector, evalVec } from './vectorGenerators.check';

const PM = /\\begin\{pmatrix\} (-?\d+) \\\\ (-?\d+) \\end\{pmatrix\}/;

const OPS = {
  ...generic('answer nudged', 'question line nudged', 'a working number nudged', 'the working stops short', 'metadata changed'),
  'moved to another band': bandMove(),
  'the answer\'s components swapped': (q) => {
    const m = PM.exec(q.answer);
    if (!m || m[1] === m[2]) return false;
    q.answer = q.answer.replace(PM, `\\begin{pmatrix} ${m[2]} \\\\ ${m[1]} \\end{pmatrix}`);
  },
  'a sign dropped in the answer': (q) => {
    if (!/-\d|- \\|-\\/.test(q.answer)) return false;
    q.answer = q.answer.replace(/-(\d)/, '$1').replace(/ - \\/, ' + \\');
  },
  'an arrow moved on the grid': (q) => {
    const f = q.visualization;
    if (f?.type !== 'vector-grid') return false;
    f.arrows[0].to = [f.arrows[0].to[0] + 1, f.arrows[0].to[1]];
  },
  'the arrow reversed': (q) => {
    const f = q.visualization;
    if (f?.type !== 'vector-grid') return false;
    [f.arrows[0].from, f.arrows[0].to] = [f.arrows[0].to, f.arrows[0].from];
  },
  'the vector asked for reversed': (q) => {
    const m = /\\overrightarrow\{([A-Z])([A-Z])\}$/.exec(q.questionMath ?? '');
    if (!m) return false;
    q.questionMath = q.questionMath.replace(/\\overrightarrow\{([A-Z])([A-Z])\}$/, `\\overrightarrow{${m[2]}${m[1]}}`);
  },
  'the two vectors renamed the other way round': (q) => {
    const f = q.visualization;
    if (f?.type !== 'vector-diagram') return false;
    // Equivalent when the answer uses both equally (a + b): skipped.
    const [u, w] = f.arrows.map((a) => a.label);
    const c = evalVec(q.answer.split(' = ')[1], { vec: { [u]: [1, 0], [w]: [0, 1] } });
    if (c[0] === c[1]) return false;
    [f.arrows[0].label, f.arrows[1].label] = [f.arrows[1].label, f.arrows[0].label];
  },
  'the point moved along its side': (q) => {
    const p = q.visualization?.points?.[0];
    if (!p) return false;
    p.t = p.t === 0.5 ? 0.25 : 0.5;
  },
  'the ratio turned round': (q) => {
    const m = / = (\d) : (\d)\n/.exec(q.questionMath ?? '');
    if (!m || m[1] === m[2]) return false;
    q.questionMath = q.questionMath.replace(/ = (\d) : (\d)\n/, ` = ${m[2]} : ${m[1]}\n`);
  },
  'a coefficient changed in the answer': (q) => {
    if (!/\\frac\{\d\}\{\d\}/.test(q.answer)) return false;
    q.answer = q.answer.replace(/\\frac\{(\d)\}\{(\d)\}/, (w, n, d) => `\\frac{${Number(n) + 1}}{${Number(d) + 1}}`);
  },
  'the reveal shows another vector': (q) => {
    const s = q.visualization?.solution?.[0];
    if (!s) return false;
    [s.from, s.to] = [s.to, s.from];
  },
  'a given vector nudged': (q) => {
    if (!/^\\mathbf\{[a-z]\} = \\begin/.test(q.questionMath ?? '')) return false;
    const [first, ...rest] = q.questionMath.split('\n');
    q.questionMath = [bump(first), ...rest].join('\n');
  },
  'a scalar changed in the question': (q) => {
    const lines = (q.questionMath ?? '').split('\n');
    if (lines.length < 2 || !/\d\\mathbf/.test(lines[1])) return false;
    lines[1] = lines[1].replace(/(\d)\\mathbf/, (w, d) => `${Number(d) + 1}\\mathbf`);
    q.questionMath = lines.join('\n');
  },
  'k given the wrong sign': (q) => {
    const m = /^k = (-?\d+)$/.exec(q.answer);
    if (!m) return false;
    q.answer = `k = ${-Number(m[1])}`;
  },
  'the surd left unsimplified': (q) => {
    const m = /= (\d+)\\sqrt\{(\d+)\}$/.exec(q.answer);
    if (!m) return false;
    q.answer = q.answer.replace(/(\d+)\\sqrt\{(\d+)\}$/, `\\sqrt{${Number(m[1]) ** 2 * Number(m[2])}}`);
    const lines = q.workingOut.split('\n');
    lines.pop();
    q.workingOut = lines.join('\n');
  },
  'the point not on a side': (q) => {
    const p = q.visualization?.points?.[0];
    if (!p || q.visualization.layout !== 'parallelogram') return false;
    const V = q.visualization.vertices;
    p.on = [V[0], V[2]];
  },
};

describe('Vectors mutation test', () => {
  it('rejects every broken copy', () => {
    const tally = mutants({ skills: ['column-vectors', 'vector-arithmetic', 'vector-magnitude', 'parallel-vectors', 'vector-geometry'], check: checkVector, ops: OPS });
    Object.entries(tally).forEach(([name, r]) => expect(r.survivors.slice(0, 2), name).toEqual([]));
    expect(Object.keys(tally).sort()).toEqual(Object.keys(OPS).sort());
  });
});
