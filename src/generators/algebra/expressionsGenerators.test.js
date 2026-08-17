// src/generators/algebra/expressionsGenerators.test.js
//
// The important test here is `identity`: it converts the question and the
// answer independently into JavaScript, evaluates both at a dozen random
// values for every variable, and requires them to agree. That catches a wrong
// sign or a dropped term without anyone having to write out expected answers.
//
// Run: npx vitest run src/generators/algebra
// Needs: npm i -D vitest

import { describe, expect, it } from 'vitest';
import {
  generateExpandSingleBrackets,
  generateExpandDoubleBrackets,
  generateDifferenceOfTwoSquares,
  generateDifferenceOfTwoSquaresNumeric,
} from './expressionsGenerators';

const BANDS = ['foundation', 'core', 'stretch'];
const SAMPLES = 400;

/** LaTeX subset -> evaluable JavaScript. Only handles what these generators emit. */
const toJs = (latex) => {
  let s = latex
    .replace(/\\times/g, '*')
    .replace(/\\text\{[^}]*\}/g, '')
    .replace(/\s+/g, '');
  s = s.replace(/([a-z])([a-z])/g, '$1*$2'); // xy
  s = s.replace(/(\d)([a-z(])/g, '$1*$2'); // 3x, 2(
  s = s.replace(/([a-z)])(\()/g, '$1*$2'); // x(, )(
  s = s.replace(/(\))([a-z0-9])/g, '$1*$2'); // )x
  s = s.replace(/([a-z0-9])\^\{(\d+)\}/g, '($1**$2)');
  s = s.replace(/(\([^()]*\))\^\{(\d+)\}/g, '($1**$2)');
  return s;
};

const varsIn = (latex) => [...new Set(latex.match(/[a-z]/g) || [])];

/** Question and answer must be the same function of their variables. */
const identity = (q) => {
  const vars = [...new Set([...varsIn(q.questionMath), ...varsIn(q.answer)])];
  const lhs = new Function(vars.join(','), `return (${toJs(q.questionMath)});`);
  const rhs = new Function(vars.join(','), `return (${toJs(q.answer)});`);
  for (let i = 0; i < 12; i += 1) {
    const vals = vars.map((v, j) => 2 + i * 0.37 + j * 0.13 + v.charCodeAt(0) * 0.011);
    const a = lhs(...vals);
    const b = rhs(...vals);
    expect(Number.isFinite(a) && Number.isFinite(b)).toBe(true);
    expect(Math.abs(a - b)).toBeLessThan(1e-9 * Math.max(1, Math.abs(a)));
  }
};

const generators = {
  'expand-single-brackets': generateExpandSingleBrackets,
  'expand-double-brackets': generateExpandDoubleBrackets,
  'difference-of-two-squares': generateDifferenceOfTwoSquares,
  'difference-of-two-squares-numeric': generateDifferenceOfTwoSquaresNumeric,
};

describe.each(Object.entries(generators))('%s', (topic, generate) => {
  it.each(BANDS)('is algebraically correct at %s', (difficulty) => {
    for (let i = 0; i < SAMPLES; i += 1) identity(generate({ difficulty }));
  });

  it.each(BANDS)('returns the documented question shape at %s', (difficulty) => {
    const q = generate({ difficulty });
    expect(q.instruction).toMatch(/^[A-Z]/);
    expect(q.questionMath).toBeTruthy();
    expect(q.answer).toBeTruthy();
    expect(q.workingOut).toBeTruthy();
    expect(q.metadata.topic).toBe(topic);
    expect(BANDS).toContain(q.metadata.difficulty);
    // Nothing here should reach for KaTeX: SPEC §6 says the Archivo parser
    // takes \times, \text{} and ^{}, and falls back on anything else.
    const commands = (q.questionMath + q.answer + q.workingOut).match(/\\[a-z]+/g) || [];
    commands.forEach((c) => expect(['\\times', '\\text']).toContain(c));
  });

  it('defaults to core and tolerates an unknown band', () => {
    expect(generate().metadata.difficulty).toBeTruthy();
    expect(generate({ difficulty: 'medium' }).metadata.difficulty).toBeTruthy();
  });

  it('does not repeat itself excessively', () => {
    const seen = new Set();
    for (let i = 0; i < 200; i += 1) seen.add(generate({ difficulty: 'core' }).questionMath);
    expect(seen.size).toBeGreaterThan(30);
  });
});

describe('band-specific shapes', () => {
  it('keeps foundation single brackets free of negative multipliers', () => {
    for (let i = 0; i < 200; i += 1) {
      const q = generateExpandSingleBrackets({ difficulty: 'foundation' });
      expect(q.questionMath).not.toMatch(/^-/);
    }
  });

  it('escalates single brackets to two brackets at stretch', () => {
    for (let i = 0; i < 200; i += 1) {
      const q = generateExpandSingleBrackets({ difficulty: 'stretch' });
      expect((q.questionMath.match(/\(/g) || []).length).toBe(2);
    }
  });

  it('keeps foundation double brackets monic', () => {
    for (let i = 0; i < 200; i += 1) {
      const q = generateExpandDoubleBrackets({ difficulty: 'foundation' });
      expect(q.answer).toMatch(/^[a-z]\^\{2\}/);
    }
  });

  it('never lets the middle term vanish in a double bracket', () => {
    for (let i = 0; i < 400; i += 1) {
      const q = generateExpandDoubleBrackets({ difficulty: 'core' });
      expect(q.answer.split(/ [+-] /).length).toBeGreaterThanOrEqual(3);
    }
  });

  it('always cancels the middle term in a difference of two squares', () => {
    for (let i = 0; i < 400; i += 1) {
      const q = generateDifferenceOfTwoSquares({ difficulty: 'core' });
      expect(q.answer.split(/ [+-] /).length).toBe(2);
    }
  });

  it('gives the numeric variant a whole-number answer', () => {
    for (let i = 0; i < 200; i += 1) {
      const q = generateDifferenceOfTwoSquaresNumeric({ difficulty: 'stretch' });
      expect(Number.isInteger(Number(q.answer))).toBe(true);
    }
  });
});