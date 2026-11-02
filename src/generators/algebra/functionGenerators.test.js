// Substitute-the-answer-back harness for Functions. Each answer is tested
// against the definitions printed, run as functions by
// functionGenerators.check.js, never against the generator's variables.
// functionGenerators.mutation.test.js shows the checker fails when it should.
//
// Run: npx vitest run src/generators/algebra/functionGenerators.test.js

import { describe, expect, it } from 'vitest';
import * as gen from './functionGenerators';
import * as chk from './functionGenerators.check';
import { generateForSkill, getSkill, strandOf, topicGroups } from '../../curriculum/skills';

const SAMPLES = 6000;
const BANDS = ['foundation', 'core', 'stretch'];

export const SKILLS = [
  { id: 'function-notation', gen: gen.generateFunctionNotation, check: chk.checkFunctionNotation },
  { id: 'domain-range', gen: gen.generateDomainRange, check: chk.checkDomainRange },
  { id: 'composite-functions', gen: gen.generateCompositeFunctions, check: chk.checkComposite },
  { id: 'inverse-functions', gen: gen.generateInverseFunctions, check: chk.checkInverse },
  { id: 'absolute-value', gen: gen.generateAbsoluteValue, check: chk.checkAbsolute },
  { id: 'reciprocal-functions', gen: gen.generateReciprocalFunctions, check: chk.checkReciprocal },
];

// What each band must draw on, and nothing else.
const KINDS = {
  'function-notation': { foundation: ['linear value'], core: ['quadratic value', 'reverse'], stretch: ['substitute', 'two values'] },
  'domain-range': { foundation: ['set linear', 'set quadratic'], core: ['interval'], stretch: ['quadratic'] },
  'composite-functions': { foundation: ['value'], core: ['expression'], stretch: ['self', 'solve'] },
  'inverse-functions': { foundation: ['(x+b)/a', 'a(x+b)', 'ax+b'], core: ['(ax+b)/c', 'reversed', 'value'], stretch: ['meets inverse', 'rational'] },
  'absolute-value': { foundation: ['value in a and b', 'value in x'], core: ['two solutions'], stretch: ['line, both', 'line, one rejected'] },
  'reciprocal-functions': { foundation: ['k from a point', 'plain'], core: ['shifted'], stretch: ['k from asymptotes', 'rewrite'] },
};

// Distinct questions per 6,000. Most bands are near 6,000; these are the
// honest ceilings of small spaces, and the floors sit a little under what
// they reach, to catch a narrowing:
//   reciprocal foundation  about 410: y = k/(x - a) has only k and a, and
//                          widening k makes no better question
//   absolute foundation    about 1,000: one x into a short expression, or
//                          a and b into five set forms
//   absolute core/stretch  about 700-1,000: whole-number solutions on both
//                          sides of the V leave few equations
//   domain foundation      about 2,100: four or five consecutive x values
//   composite stretch      about 3,200: f(f(x)) = 4x - 15 with both pairs whole
const FLOOR = {
  'function-notation': { foundation: 4500, core: 5000, stretch: 5000 },
  'domain-range': { foundation: 1800, core: 5000, stretch: 4200 },
  'composite-functions': { foundation: 5500, core: 5500, stretch: 2800 },
  'inverse-functions': { foundation: 2200, core: 3300, stretch: 3700 },
  'absolute-value': { foundation: 900, core: 550, stretch: 900 },
  'reciprocal-functions': { foundation: 370, core: 2500, stretch: 3400 },
};

describe('the checker itself', () => {
  it('reads the notation', () => {
    const fns = { f: (x) => 2 * x + 1, g: (x) => x * x };
    expect(chk.evaluate('fg(3)', { vars: {}, fns })).toBe(19);
    expect(chk.evaluate('f(g(3))', { vars: {}, fns })).toBe(19);
    expect(chk.evaluate('\\frac{2x - 1}{x + 3}', { vars: { x: 2 }, fns: {} })).toBeCloseTo(0.6, 12);
    expect(chk.evaluate('\\lvert 3 - 2x \\rvert', { vars: { x: 4 }, fns: {} })).toBe(5);
    expect(chk.evaluate('-(-3)^2 + 3(-3) + 6', { vars: {}, fns: {} })).toBe(-12);
    expect(chk.evaluate('a^2x + ab + b', { vars: { a: 3, b: 1, x: 2 }, fns: {} })).toBe(22);
  });
  it('knows simplest form', () => {
    expect(chk.simplestPoly('4x^2 - 12x + 10')).toBe(true);
    expect(chk.simplestPoly('-x^2 + 3')).toBe(true);
    expect(chk.simplestPoly('1x + 3')).toBe(false);
    expect(chk.simplestPoly('3x + 2x')).toBe(false);
    expect(chk.simplestPoly('(x + 3)^2')).toBe(false);
    expect(chk.simplestPoly('3 + x')).toBe(false);
  });
});

describe('Functions', () => {
  SKILLS.forEach(({ id, gen: g, check }) => {
    BANDS.forEach((difficulty) => {
      it(`${id} ${difficulty}: every answer follows from what is printed`, () => {
        const questions = new Set();
        const answers = new Set();
        const mix = {};
        for (let t = 0; t < SAMPLES; t += 1) {
          const q = g({ difficulty });
          const { kind } = check(q, difficulty);
          mix[kind] = (mix[kind] ?? 0) + 1;
          questions.add(`${q.instruction}|${q.questionMath}`);
          answers.add(q.answer);
        }
        process.stdout.write(
          `${id} ${difficulty}: ${questions.size} distinct questions, ${answers.size} distinct answers; `
          + `${Object.entries(mix).sort().map(([k, v]) => `${k} ${v}`).join(', ')}\n`,
        );
        expect(Object.keys(mix).sort()).toEqual(KINDS[id][difficulty]);
        expect(questions.size).toBeGreaterThan(FLOOR[id][difficulty]);
      });
    });
  });

  it('is served by the catalogue, in its own Algebra topic', () => {
    SKILLS.forEach(({ id, check }) => {
      expect(getSkill(id).topic).toBe('Functions');
      BANDS.forEach((band) => check(generateForSkill(id, band), band));
    });
    expect(strandOf('Functions')).toBe('Algebra');
    expect(topicGroups().find((g) => g.name === 'Algebra').topics).toContain('Functions');
  });
});
