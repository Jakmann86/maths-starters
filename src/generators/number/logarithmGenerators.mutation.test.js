// Mutation test for the Logarithms harness. Each operator breaks real
// generator output; the checker must reject every broken copy.
//
// Equivalent mutants are skipped by rule: letters swapped in an answer that
// uses them equally (y = uv); p and q swapped when their coefficients are
// equal (in the answer, or in the givens they name); and a given the answer
// never uses, nudged to another prime. Every operator was checked by hand
// to be killed for its own reason (MUTANT_REASONS=1 lists them).
//
// Run: npx vitest run src/generators/number/logarithmGenerators.mutation.test.js

import { describe, expect, it } from 'vitest';
import { GENERIC, bandMove, bump, generic, mutants } from '../harness.check';
import { checkLog, value } from './logarithmGenerators.check';

const IDS = ['log-index-form', 'evaluate-logs', 'log-single', 'log-in-terms', 'log-remove', 'log-solve-exponential', 'log-equations'];

const swapLetters = (s, a, b) => s.replace(new RegExp(`[${a}${b}]`, 'g'), (c) => (c === a ? b : a));

const OPS = {
  ...generic('answer nudged', 'a working number nudged', 'the working stops short', 'metadata changed', 'units changed'),
  'moved to another band': bandMove(),
  // A given the answer never uses can be nudged to another fair prime and
  // the question is still right: that copy is equivalent, so only the
  // target line is nudged there.
  'question line nudged': (q) => {
    const unused = q.metadata.topic === 'log-in-terms' && !(q.answer.includes('p') && q.answer.includes('q'));
    if (!unused) return GENERIC['question line nudged'](q);
    const [givens, target] = q.questionMath.split('\n');
    const t = bump(target);
    if (!t) return false;
    q.questionMath = `${givens}\n${t}`;
  },
  'question and answer swapped': (q) => {
    if (!/form$/.test(q.instruction)) return false;
    [q.questionMath, q.answer] = [q.answer, q.questionMath];
  },
  'the instruction turned round': (q) => {
    if (!/form$/.test(q.instruction)) return false;
    q.instruction = q.instruction.includes('index') ? 'Write in logarithmic form' : 'Write in index form';
  },
  'a sign dropped in the answer': (q) => {
    if (!/(^|= )-/.test(q.answer)) return false;
    q.answer = q.answer.replace(/(^|= )-/, '$1');
  },
  'a fraction turned over in the answer': (q) => {
    const m = /\\frac\{(\d+)\}\{(\d+)\}/.exec(q.answer);
    if (!m || m[1] === m[2]) return false;
    q.answer = q.answer.replace(m[0], `\\frac{${m[2]}}{${m[1]}}`);
  },
  'a fraction left unreduced': (q) => {
    const m = /(^|= |-)\\frac\{(\d+)\}\{(\d+)\}$/.exec(q.answer);
    if (!m) return false;
    q.answer = q.answer.replace(/\\frac\{(\d+)\}\{(\d+)\}$/, `\\frac{${2 * m[2]}}{${2 * m[3]}}`);
  },
  'the answer in another base': (q) => {
    if (!/^\\log_\{\d+\}/.test(q.answer)) return false;
    q.answer = q.answer.replace(/^\\log_\{(\d+)\}/, (w, b) => `\\log_{${Number(b) + 1}}`);
  },
  'p and q swapped in the answer': (q) => {
    if (q.metadata.topic !== 'log-in-terms') return false;
    const s = swapLetters(q.answer, 'p', 'q');
    const c = (t) => [value(t, { p: 1, q: 0 }) - value(t, { p: 0, q: 0 }), value(t, { p: 0, q: 1 }) - value(t, { p: 0, q: 0 })];
    const [a, b] = c(q.answer);
    if (a === b) return false;
    q.answer = s;
  },
  'the givens swapped': (q) => {
    if (q.metadata.topic !== 'log-in-terms') return false;
    // Equivalent when p and q appear alike (p + q): skipped.
    const at = (p, qq) => value(q.answer, { p, q: qq });
    if (at(1, 0) === at(0, 1)) return false;
    const [g, ...rest] = q.questionMath.split('\n');
    const [x, y] = g.split(', \\quad ');
    const nx = / (\d+) = /.exec(x)[1], ny = / (\d+) = /.exec(y)[1];
    q.questionMath = [`${x.replace(` ${nx} = `, ` ${ny} = `)}, \\quad ${y.replace(` ${ny} = `, ` ${nx} = `)}`, ...rest].join('\n');
  },
  'a coefficient dropped from the question': (q) => {
    const m = /(^| )(\d)\\log/.exec(q.questionMath);
    if (!m) return false;
    q.questionMath = q.questionMath.replace(/(^| )(\d)\\log/, '$1\\log');
  },
  'two letters swapped in the answer': (q) => {
    if (q.metadata.topic !== 'log-remove') return false;
    const letters = [...new Set(q.answer.split(' = ')[1].match(/[a-z]/g) ?? [])].filter((c) => !/[xy]/.test(c));
    if (letters.length !== 2) return false;
    const [rhs] = [q.answer.split(' = ')[1]];
    const swapped = swapLetters(rhs, letters[0], letters[1]);
    // Equivalent when the answer uses both letters alike (y = uv).
    const vars = { [letters[0]]: 1.7, [letters[1]]: 2.9 };
    if (Math.abs(value(rhs, vars) - value(swapped, vars)) < 1e-9) return false;
    q.answer = `${q.answer.split(' = ')[0]} = ${swapped}`;
  },
  'an argument left unbracketed': (q) => {
    const m = /\((\d+)x\)/.exec(q.questionMath);
    if (!m) return false;
    q.questionMath = q.questionMath.replace(m[0], ` ${m[1]}x`);
  },
  'rounded to 2 or 4 significant figures': (q) => {
    if (q.metadata.topic !== 'log-solve-exponential') return false;
    const [l, v] = q.answer.split(' = ');
    const x = Number(v);
    const alt = Math.random() < 0.5 ? x.toPrecision(2) : value(`${x}`).toPrecision(4);
    if (Number(alt) === x && alt === v) return false;
    q.answer = `${l} = ${Number(alt).toString() === alt ? alt : alt}`;
    q.workingOut = q.workingOut.replace(/[^\n]*$/, q.answer);
  },
  'truncated, not rounded': (q) => {
    if (q.metadata.topic !== 'log-solve-exponential') return false;
    const [l, v] = q.answer.split(' = ');
    const digits = v.replace(/^-?0\.0*|[-.]/g, '');
    if (!/[1-9]$/.test(digits)) return false;
    // Round the last digit down by one, the way truncating a round-up would.
    const dec = (v.split('.')[1] ?? '').length;
    const t = (Number(v) - Math.sign(Number(v)) * 10 ** -dec).toFixed(dec);
    q.answer = `${l} = ${t}`;
    q.workingOut = q.workingOut.replace(/[^\n]*$/, q.answer);
  },
  'the other root given': (q) => {
    const m = /\(x - (\d+)\)\(x \+ (\d+)\) = 0/.exec(q.workingOut);
    if (!m) return false;
    q.answer = `x = -${m[2]}`;
    q.workingOut = q.workingOut.replace(/[^\n]*$/, q.answer);
  },
  'the subject letter changed': (q) => {
    if (q.instruction !== 'Make x the subject') return false;
    q.answer = q.answer.replace(/^x = /, 'y = ');
  },
  'a model\'s start value changed': (q) => {
    const m = /^([A-Z]) = (\d+(?:\.\d+)?) \\times/.exec(q.questionMath);
    if (!m) return false;
    q.questionMath = q.questionMath.replace(`${m[1]} = ${m[2]} \\times`, `${m[1]} = ${Number(m[2]) * 2} \\times`);
  },
};

describe('Logarithms mutation test', () => {
  it('rejects every broken copy', () => {
    const tally = mutants({ skills: IDS, check: checkLog, ops: OPS });
    Object.entries(tally).forEach(([name, r]) => expect(r.survivors.slice(0, 2), name).toEqual([]));
    expect(Object.keys(tally).sort()).toEqual(Object.keys(OPS).sort());
  }, 600000);
});
