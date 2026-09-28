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
import { generatePercentageOfAmount } from './percentageGenerators';

const BANDS = ['foundation', 'core', 'stretch'];
const SAMPLES = 3000;

/** "£12,345" / "12,345" / "12345" -> 12345. */
const num = (s) => Number(String(s).replace(/[£,]/g, ''));

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
        expect(q.answer).toMatch(q.instruction.includes('price') ? /^£[\d,]+$/ : /^[\d,]+$/);
      } else {
        expect(q.instruction).toBe('Find the original amount');
      }
    }
    expect(distinct.size).toBeGreaterThan(1);
  });
});
