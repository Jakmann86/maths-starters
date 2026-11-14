// Substitute-the-answer-back harness for the Indices skills reworked in the
// skill-ladder review: index-laws-multiply-divide, index-laws-power,
// fractional-powers and roots-as-powers. Every letter is replaced by two
// values, and the question, every working line and the answer must agree.
// Each band is held to its shape, and the answer to its simplest form.
//
// Run: npx vitest run src/generators/number/indicesLadder.test.js

import { describe, expect, it } from 'vitest';
import { getSkill } from '../../curriculum/skills';
import { compiles, floatOf, subst } from './latexArithmetic.check';

const BANDS = ['foundation', 'core', 'stretch'];
const SAMPLES = 4000;
const lettersOf = (tex) => [...new Set(tex.replace(/\\[a-z]+/g, '').match(/[a-z]/g) || [])];
const near = (a, b) => Number.isFinite(a) && Number.isFinite(b) && Math.abs(a - b) <= 1e-9 * Math.max(1, Math.abs(a), Math.abs(b));
// The working's "= ..." lines are read without their leading "= ".
const exprs = (q) => [q.questionMath, ...q.workingOut.split('\n').flatMap((ln) => ln.replace(/^= /, '').split(' = ')), q.answer];

function sameValue(q) {
  const letters = lettersOf(exprs(q).join(' ')).filter((v) => !/^[A-Z]$/.test(v));
  [[1.07, 1.13], [1.21, 0.93]].forEach((vals) => {
    const vars = Object.fromEntries(letters.map((v, i) => [v, vals[i % 2] + i * 0.1]));
    // "\div y^{4}" divides by the whole power, as printed algebra is read.
    const read = (e) => floatOf(subst(e.replace(/\\div ([0-9a-z^{}]+)/g, '\\div ($1)'), vars));
    const want = read(q.questionMath);
    exprs(q).forEach((e) => expect(near(read(e), want), `${e} vs ${q.questionMath} at ${JSON.stringify(vars)}`).toBe(true));
  });
}

const SHAPE = {
  'index-laws-multiply-divide': (q, band) => {
    const terms = q.questionMath.split(/\\times|\\div|\}\{/).length;
    if (band === 'foundation') { expect(lettersOf(q.questionMath)).toEqual([]); expect(q.answer).toMatch(/^\d+$/); return 'number'; }
    expect(lettersOf(q.questionMath).length).toBe(1);
    expect(q.answer).toMatch(/^[a-z](\^\{\d+\})?$/);
    if (band === 'core') { expect(terms).toBe(2); return 'one law'; }
    expect(terms).toBeGreaterThanOrEqual(3);
    return terms === 4 ? 'four terms' : 'three terms';
  },
  'index-laws-power': (q, band) => {
    expect(q.instruction).toBe('Remove the brackets and simplify');
    if (band === 'foundation') { expect(q.questionMath).toMatch(/^\([a-z]\^\{\d+\}\)\^\{\d+\}$/); return 'one letter'; }
    if (band === 'core') { expect(q.questionMath).toMatch(/^\(\d+[a-z]\^\{\d+\}\)\^\{\d+\}$/); return 'coefficient'; }
    if (q.questionMath.includes('\\frac')) return 'fraction';
    expect(lettersOf(q.questionMath).length).toBe(2);
    return 'two letters';
  },
  'fractional-powers': (q, band) => {
    // The answer has no fractional or negative index left in it.
    expect(q.answer, q.answer).not.toMatch(/\^\{-|\^\{\\frac/);
    if (band === 'foundation') { expect(q.questionMath).toMatch(/^\d+\^\{\\frac\{1\}\{\d\}\}$/); return 'unit fraction'; }
    if (band === 'core') {
      expect(lettersOf(q.questionMath)).toEqual([]);
      return q.questionMath.includes('^{-') ? 'negative' : 'numerator';
    }
    expect(q.instruction).toBe('Simplify');
    expect(lettersOf(q.questionMath).length).toBe(1);
    expect(q.questionMath).toMatch(/^\\left\(/);
    return q.questionMath.includes('^{-') ? 'negative, letters' : 'letters';
  },
  'roots-as-powers': (q, band) => {
    expect(q.answer).toMatch(/^\d*[a-z]\^\{-?\\frac\{\d\}\{\d\}\}$/);
    if (band === 'foundation') { expect(q.questionMath).toMatch(/^\\sqrt(\[\d\])?\{[a-z]\^\{\d\}\}$/); return 'root'; }
    if (band === 'core') { expect(q.questionMath).toMatch(/^\\sqrt(\[\d\])?\{\d+[a-z]\^\{\d\}\}$/); return 'coefficient'; }
    expect(q.questionMath).toMatch(/^\\frac\{\d\}\{\\sqrt/);
    return q.questionMath.startsWith('\\frac{1}') ? 'reciprocal' : 'reciprocal, coefficient';
  },
};
const KINDS = {
  'index-laws-multiply-divide': { foundation: ['number'], core: ['one law'], stretch: ['four terms', 'three terms'] },
  'index-laws-power': { foundation: ['one letter'], core: ['coefficient'], stretch: ['fraction', 'two letters'] },
  'fractional-powers': { foundation: ['unit fraction'], core: ['negative', 'numerator'], stretch: ['letters', 'negative, letters'] },
  'roots-as-powers': { foundation: ['root'], core: ['coefficient'], stretch: ['reciprocal', 'reciprocal, coefficient'] },
};
// The fewest distinct questions in 4,000 per band. Small ones are honest:
// Foundation fractional powers is every unit-fraction root of a perfect
// power (29); Foundation roots-as-powers is the 17 index pairs in lowest
// terms on six letters (102).
const FLOOR = {
  'index-laws-multiply-divide': { foundation: 250, core: 900, stretch: 2500 },
  'index-laws-power': { foundation: 260, core: 400, stretch: 1500 },
  'fractional-powers': { foundation: 28, core: 70, stretch: 400 },
  'roots-as-powers': { foundation: 95, core: 290, stretch: 500 },
};

describe('Indices, reworked ladders', () => {
  Object.keys(KINDS).forEach((id) => {
    it.each(BANDS)(`${id} %s: the answer equals the question`, (band) => {
      const distinct = new Set();
      const mix = {};
      for (let i = 0; i < SAMPLES; i += 1) {
        const q = getSkill(id).generate({ difficulty: band });
        expect(q.metadata).toEqual({ topic: id, difficulty: band });
        expect(/\d/.test(q.instruction), q.instruction).toBe(false);
        if (!distinct.has(q.questionMath)) { compiles(q.questionMath); compiles(q.answer); compiles(q.workingOut); }
        distinct.add(q.questionMath);
        expect(q.questionMath + q.answer, q.questionMath).not.toMatch(/\^\{1\}|\^\{0\}/);
        sameValue(q);
        const kind = SHAPE[id](q, band);
        mix[kind] = (mix[kind] ?? 0) + 1;
      }
      console.log(`${id} ${band}: ${distinct.size} distinct`, mix);
      expect(Object.keys(mix).sort()).toEqual(KINDS[id][band]);
      expect(distinct.size).toBeGreaterThanOrEqual(FLOOR[id][band]);
    });
  });
});
