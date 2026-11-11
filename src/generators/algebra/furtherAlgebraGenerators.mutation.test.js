// Mutation test for the furtherAlgebraGenerators harness. Each operator
// breaks real generator output; the checker must reject every broken copy.
// MUTANT_REASONS=1 lists why; SHOW=1 prints the first survivors.
//
// Run: npx vitest run src/generators/algebra/furtherAlgebraGenerators.mutation.test.js

import { describe, expect, it } from 'vitest';
import { bandMove, bump, generic, mutants } from '../harness.check';
import { checkFurtherAlgebra } from './furtherAlgebraGenerators.check';

const IDS = ['expand-further', 'factorise-perfect-square', 'factorise-fully', 'rearrange-harder', 'add-algebraic-fractions'];

const OPS = {
  ...generic('answer nudged', 'a working number nudged', 'the working stops short', 'metadata changed'),
  'moved to another band': bandMove(),
  'a number in the question nudged': (q) => { const s = bump(q.questionMath); if (!s) return false; q.questionMath = s; },
  'a sign flipped in the answer': (q) => {
    const m = / ([+-]) /.exec(q.answer);
    if (!m) return false;
    q.answer = q.answer.replace(/ ([+-]) /, ` ${m[1] === '+' ? '-' : '+'} `);
  },
  'the question given back': (q) => { q.answer = q.questionMath.includes(' = ') ? `x = ${q.questionMath.split(' = ')[1]}` : q.questionMath; },
  'a factor left inside a bracket': (q) => {
    // k(px + q)(...) -> (kpx + kq)(...): equal, but not fully factorised.
    const m = /^(\d+)\((\d*)x ([+-]) (\d+)\)(.*)$/.exec(q.answer);
    if (!m) return false;
    const k = Number(m[1]), p = m[2] ? Number(m[2]) : 1;
    q.answer = `(${k * p}x ${m[3]} ${k * Number(m[4])})${m[5]}`;
  },
  'a common factor left in the fraction': (q) => {
    const m = /^(-?)\\frac\{(.+)\}\{(\d+)\}$/.exec(q.answer);
    if (!m || q.metadata.topic !== 'add-algebraic-fractions') return false;
    const doubled = m[2].replace(/(\d*)([a-z]?)/g, (w, d, l) => (w === '' ? '' : `${(d ? Number(d) : 1) * 2}${l}`));
    q.answer = `${m[1]}\\frac{${doubled}}{${Number(m[3]) * 2}}`;
  },
  'the minus left in the numerator': (q) => {
    const m = /^-\\frac\{(.+)\}\{(.+)\}$/.exec(q.answer);
    if (!m) return false;
    const neg = m[1].replace(/^/, '-').replace(/ \+ /g, ' @ ').replace(/ - /g, ' + ').replace(/ @ /g, ' - ');
    q.answer = `\\frac{${neg}}{${m[2]}}`;
  },
  'the root dropped': (q) => {
    if (!/^x = \\sqrt\{/.test(q.answer)) return false;
    q.answer = q.answer.replace(/^x = \\sqrt\{(.*)\}$/, 'x = $1');
  },
  'terms out of order': (q) => {
    if (q.metadata.topic !== 'expand-further') return false;
    const terms = q.answer.replace(/ - /g, ' + -').split(' + ');
    if (terms.length < 2) return false;
    [terms[0], terms[1]] = [terms[1], terms[0]];
    q.answer = terms.map((t, i) => (i === 0 ? t : t.startsWith('-') ? `- ${t.slice(1)}` : `+ ${t}`)).join(' ');
  },
};

describe('Further algebra mutation test', () => {
  it('rejects every broken copy', () => {
    const tally = mutants({ skills: IDS, check: checkFurtherAlgebra, ops: OPS });
    if (process.env.SHOW) Object.entries(tally).forEach(([name, r]) => r.survivors.slice(0, 3).forEach((x) => console.log('SURV', name, JSON.stringify({ q: x.q.questionMath, a: x.q.answer, w: x.q.workingOut }))));
    Object.entries(tally).forEach(([name, r]) => expect(r.survivors.slice(0, 2), name).toEqual([]));
    expect(Object.keys(tally).sort()).toEqual(Object.keys(OPS).sort());
  }, 600000);
});
