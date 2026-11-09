// Mutation test for the algebraic-fractions harness. Each operator breaks
// real generator output; the checker must reject every broken copy.
//
// The checker requires every working line to equal the question and the
// last to be the answer, not a set number of steps, so dropping a middle
// line leaves valid working: that operator is left out.
//
// Run: npx vitest run src/generators/algebra/algebraicFractionGenerators.mutation.test.js

import { describe, expect, it } from 'vitest';
import { generic, bandMove, bump, mutants } from '../harness.check';
import { checkAlgebraicFraction } from './algebraicFractionGenerators.check';

const OPS = {
  ...generic('answer nudged', 'a working number nudged', 'the working stops short', 'metadata changed', 'question line nudged'),
  'moved to another band': bandMove({ foundation: 'stretch', core: 'foundation', stretch: 'core' }),
  'the answer left unsimplified': (q) => {
    // Top and bottom both doubled: equal in value, but not simplified.
    const m = /^\\frac\{(.+)\}\{([^{}]+)\}$/.exec(q.answer);
    q.answer = m ? `\\frac{2(${m[1]})}{2(${m[2]})}` : `\\frac{2(${q.answer})}{2}`;
    const lines = q.workingOut.split('\n');
    lines[lines.length - 1] = q.answer;
    q.workingOut = lines.join('\n');
  },
  // The answer and the working's last line changed together, so the copy
  // is caught by its value and not only by the two disagreeing.
  'the answer and the working nudged together': (q) => {
    const s = bump(q.answer);
    if (!s) return false;
    q.answer = s;
    const lines = q.workingOut.split('\n');
    lines[lines.length - 1] = s;
    q.workingOut = lines.join('\n');
  },
  'the answer turned upside down': (q) => {
    const m = /^\\frac\{(.+)\}\{([^{}]+)\}$/.exec(q.answer);
    if (!m) return false;
    q.answer = `\\frac{${m[2]}}{${m[1]}}`;
  },
  'a sign flipped in the answer': (q) => {
    if (!/[+-]/.test(q.answer)) return false;
    q.answer = q.answer.replace(/ ([+-]) /, (w, s) => ` ${s === '+' ? '-' : '+'} `);
  },
  'an index changed in the question': (q) => {
    if (!/\^\d/.test(q.questionMath)) return false;
    q.questionMath = q.questionMath.replace(/\^(\d)/, (w, d) => `^${Number(d) + 1}`);
  },
  'times and divide swapped': (q) => {
    if (!/\\times|\\div/.test(q.questionMath)) return false;
    q.questionMath = q.questionMath.replace(/\\times|\\div/, (w) => (w === '\\times' ? '\\div' : '\\times'));
  },
  'a working line made wrong': (q) => {
    const lines = q.workingOut.split('\n');
    if (lines.length < 2) return false;
    lines[0] = lines[0].replace(/(\d+)/, (d) => String(Number(d) + 1));
    q.workingOut = lines.join('\n');
  },
};

describe('Algebraic fractions mutation test', () => {
  it('rejects every broken copy', () => {
    const tally = mutants({ skills: ['simplify-algebraic-fractions', 'simplify-fractions-factorising', 'multiply-divide-algebraic-fractions'], check: checkAlgebraicFraction, ops: OPS, perBand: 100 });
    Object.entries(tally).forEach(([name, r]) => expect(r.survivors.slice(0, 2), name).toEqual([]));
    expect(Object.keys(tally).sort()).toEqual(Object.keys(OPS).sort());
  });
});
