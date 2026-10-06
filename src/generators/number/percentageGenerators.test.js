// src/generators/number/percentageGenerators.test.js
//
// Substitute-the-answer-back checks for generatePercentageOfAmount, the one
// generator in this file touched here. The other three exports
// (percentage-multiplier, percentage-change, index-laws) are untouched and
// have no coverage yet — this file doesn't claim to cover them.
//
// Every value is recovered from the printed question/answer text (parsing
// the £/comma-formatted story wording as well as the plain-math one) and
// checked against the p/100 relationship directly, never against the
// generator's own p/n/part variables.
//
// Run: npx vitest run src/generators/number/percentageGenerators.test.js

import { describe, expect, it } from 'vitest';
import { generatePercentageOfAmount, generateIndexLaws } from './percentageGenerators';

const BANDS = ['foundation', 'core', 'stretch'];
const SAMPLES = 3000;

/** "\\text{£12,345}" / "12,345" / "12345" -> 12345. */
const num = (s) => Number(String(s).replace(/\\text\{([^}]*)\}/, '$1').replace(/[£,]/g, ''));

describe('percentage-of-amount', () => {
  it.each(BANDS)('is correct at %s', (difficulty) => {
    const distinct = new Set();
    for (let i = 0; i < SAMPLES; i += 1) {
      const q = generatePercentageOfAmount({ difficulty });
      expect(q.metadata).toEqual({ topic: 'percentage-of-amount', difficulty });
      distinct.add(q.questionMath ?? q.questionText);

      if (difficulty !== 'stretch') {
        // Forward: p% of n, read straight off questionMath.
        const m = q.questionMath.match(/^(\d+(?:\.\d+)?)\\% \\text\{ of \} (\d+)$/);
        expect(m, q.questionMath).toBeTruthy();
        const [p, n] = [Number(m[1]), Number(m[2])];
        expect(num(q.answer)).toBeCloseTo((p * n) / 100, 6);
        continue;
      }

      // Stretch: reverse. Every story names the percentage, the given part,
      // and the word "original", regardless of which of the three shapes
      // (money / population / abstract) came up.
      expect(q.instruction).toMatch(/original/);
      const source = q.questionText ?? q.questionMath;
      expect(source).toMatch(/original/);
      const pm = source.match(/(\d+(?:\.\d+)?)\\?%/);
      expect(pm, source).toBeTruthy();
      const p = Number(pm[1]);
      const partMatch = source.match(/£?([\d,]+(?:\.\d+)?)\s*\.?\s*(?:What|$)/);
      expect(partMatch, source).toBeTruthy();
      const part = num(partMatch[1]);
      const n = num(q.answer);
      // n is the original amount: p% of it is the part quoted in the question.
      expect((p * n) / 100).toBeCloseTo(part, 6);
      expect(Number.isInteger(n)).toBe(true);

      if (q.questionText) {
        expect(q.instruction).toMatch(/^Find the original (price|population)$/);
        expect(q.answer).toMatch(q.instruction.includes('price') ? /^\\text\{£[\d,]+\}$/ : /^\\text\{[\d,]+\}$/);
      } else {
        expect(q.instruction).toBe('Find the original amount');
      }
    }
    expect(distinct.size).toBeGreaterThan(1);
  });
});

describe('index-laws foundation', () => {
  it('is correct, and writes some divides as a fraction', () => {
    const forms = { times: 0, div: 0, frac: 0 };
    const distinct = new Set();
    for (let i = 0; i < SAMPLES; i += 1) {
      const q = generateIndexLaws({ difficulty: 'foundation' });
      distinct.add(q.questionMath);
      // Recover base and both indices from the question, in any of its three forms.
      const t = q.questionMath.match(/^(\d+)\^\{(\d+)\} \\(times|div) (\d+)\^\{(\d+)\}$/);
      const f = q.questionMath.match(/^\\frac\{(\d+)\^\{(\d+)\}\}\{(\d+)\^\{(\d+)\}\}$/);
      expect(t || f, q.questionMath).toBeTruthy();
      const [b1, m, op, b2, n] = t ? [t[1], t[2], t[3], t[4], t[5]] : [f[1], f[2], 'frac', f[3], f[4]];
      expect(b1).toBe(b2);
      forms[op] += 1;
      const want = Number(b1) ** (op === 'times' ? Number(m) + Number(n) : Number(m) - Number(n));
      expect(Number(q.answer), q.questionMath).toBe(want);
      expect(Number.isInteger(want) && want >= Number(b1)).toBe(true);
    }
    // Half multiply; the divides split evenly between ÷ and a fraction.
    expect(forms.times / SAMPLES).toBeGreaterThan(0.45);
    expect(forms.frac / SAMPLES).toBeGreaterThan(0.2);
    expect(forms.div / SAMPLES).toBeGreaterThan(0.2);
    console.log('index-laws foundation forms', forms, 'distinct', distinct.size);
  });
});
