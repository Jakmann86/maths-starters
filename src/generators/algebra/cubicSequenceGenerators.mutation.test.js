// Mutation test for the difference-method and cubic-sequence harness. Each
// operator breaks real generator output; the checker must reject every
// broken copy.
//
// Equivalent mutants are skipped by rule. Naming a sequence at Foundation
// (linear or quadratic) is a Core question too, so that skill's Foundation
// moves to Stretch, which also asks for the coefficient, and only a cubic
// moves down from Core.
//
// Run: npx vitest run src/generators/algebra/cubicSequenceGenerators.mutation.test.js

import { describe, expect, it } from 'vitest';
import { generic, bandMove, mutants } from '../harness.check';
import { checkCubicSequence } from './cubicSequenceGenerators.check';

const OPS = {
  ...generic('answer nudged', 'a working number nudged', 'the working stops short', 'metadata changed', 'question line nudged', 'a working line dropped'),
  'moved to another band': (q) => {
    // Naming a sequence: Foundation's linear and quadratic are Core
    // questions too, so only a cubic moves down; everything else moves up.
    if (q.metadata.topic === 'sequences-difference-method') {
      if (q.metadata.difficulty === 'core' && !q.answer.includes('cubic')) return false;
      return bandMove({ foundation: 'stretch', core: 'foundation', stretch: 'core' })(q);
    }
    return bandMove()(q);
  },
  'a term nudged': (q) => {
    const m = /^(.*?)(-?\d+)(, \.\.\.)$/.exec(q.questionMath ?? '');
    if (!m) return false;
    q.questionMath = `${m[1]}${Number(m[2]) + 1}${m[3]}`;
  },
  'the type misnamed': (q) => {
    if (!/\\text\{(linear|quadratic|cubic)\}/.test(q.answer)) return false;
    q.answer = q.answer.replace(/linear|quadratic|cubic/, (w) => ({ linear: 'quadratic', quadratic: 'cubic', cubic: 'linear' }[w]));
  },
  'a coefficient changed in the rule': (q) => {
    const m = /^u_n = (.+)$/.exec(q.answer);
    if (!m) return false;
    q.answer = `u_n = ${m[1].replace(/(\d+)n/, (w, d) => `${Number(d) + 1}n`).replace(/^n\^3/, '2n^3')}`;
  },
  'the term asked changed': (q) => {
    if (!/u_\{\d+\}$/.test(q.questionMath ?? '')) return false;
    q.questionMath = q.questionMath.replace(/u_\{(\d+)\}$/, (w, k) => `u_{${Number(k) + 1}}`);
  },
  'a 1n left in the rule': (q) => {
    const m = /^u_n = (.+)$/.exec(q.answer);
    if (!m || !/(^|- |\+ )n(?!\^)/.test(m[1])) return false;
    q.answer = `u_n = ${m[1].replace(/(^|- |\+ )n(?!\^)/, '$11n')}`;
  },
};

describe('Cubic sequences mutation test', () => {
  it('rejects every broken copy', () => {
    const tally = mutants({ skills: ['sequences-difference-method', 'sequences-cubic-nth-term', 'sequences-cubic-use-nth-term'], check: checkCubicSequence, ops: OPS });
    Object.entries(tally).forEach(([name, r]) => expect(r.survivors.slice(0, 2), name).toEqual([]));
    expect(Object.keys(tally).sort()).toEqual(Object.keys(OPS).sort());
  });
});
