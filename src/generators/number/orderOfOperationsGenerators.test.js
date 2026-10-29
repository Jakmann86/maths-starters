// src/generators/number/orderOfOperationsGenerators.test.js
//
// Substitute-the-answer-back checks for Order of operations. The expression
// is evaluated by the harness's own exact reader (latexArithmetic.check.js),
// which binds powers before a leading minus — so -5^{2} is -25 there too, and
// a generator that thought otherwise would fail.
//
// For the number cards, the filled answer must: use every card exactly once,
// reproduce the question when its numbers are boxed back up, and be true.
// Then every permutation of the cards is tried against the question, and
// every true one must be the answer up to swapping the two sides of a + or a
// × (or the inside of a squared difference) — the puzzle has one solution.
//
// Run: npx vitest run src/generators/number/orderOfOperationsGenerators.test.js

import { describe, expect, it } from 'vitest';
import { generateOrderOfOperations, generateNumberCards } from './orderOfOperationsGenerators';
import { exactOf, asRational, compiles } from './latexArithmetic.check';

const BANDS = ['foundation', 'core', 'stretch'];
const SAMPLES = 3000;
const BOX = '\\boxed{\\phantom{0}}';

describe('order-of-operations', () => {
  it.each(BANDS)('every answer equals its question at %s', (difficulty) => {
    const distinct = new Set();
    for (let i = 0; i < SAMPLES; i++) {
      const q = generateOrderOfOperations({ difficulty });
      expect(q.metadata.topic).toBe('order-of-operations');
      if (!distinct.has(q.questionMath)) { compiles(q.questionMath); compiles(q.workingOut); }
      distinct.add(q.questionMath);
      const v = asRational(exactOf(q.questionMath));
      expect(v, q.questionMath).not.toBeNull();
      expect(v[1], `${q.questionMath} is not a whole number`).toBe(1);
      expect(q.answer, q.questionMath).toBe(String(v[0]));
      if (difficulty === 'foundation') expect(q.questionMath).not.toMatch(/\^|sqrt|frac/);
      if (difficulty === 'core') expect(q.questionMath).toMatch(/\^/);
      if (difficulty === 'stretch') expect(q.questionMath).toMatch(/^\\frac/);
    }
    console.log(`order-of-operations ${difficulty}: ${distinct.size} distinct`);
    // Core's universe is about 1,100 expressions (three shapes over small
    // numbers) — ample for a starter, so it is held to a lower floor.
    expect(distinct.size).toBeGreaterThan(difficulty === 'core' ? 800 : SAMPLES * 0.6);
  });
});

const permutations = (xs) => (xs.length <= 1 ? [xs] : xs.flatMap((x, i) => permutations([...xs.slice(0, i), ...xs.slice(i + 1)]).map((p) => [x, ...p])));

// Fill the boxes of an equation, left to right.
const fill = (eq, nums) => { let k = 0; return eq.split(BOX).reduce((acc, part, i) => (i === 0 ? part : `${acc}${nums[k++]}${part}`)); };
const holds = (eq) => {
  const [l, r] = eq.split(' = ');
  const a = asRational(exactOf(l)), b = asRational(exactOf(r));
  return a !== null && b !== null && a[0] === b[0] && a[1] === b[1];
};

// The fillings reachable by swapping the two boxes either side of " + " or
// " \times ", or the two inside "(□ - □)^{2}".
const equivalents = (eq, nums) => {
  const parts = eq.split(BOX);
  const swappable = [];
  for (let i = 1; i < parts.length - 1; i++) {
    const between = parts[i];
    const after = parts[i + 1] ?? '';
    if (between === ' + ' || between === ' \\times ') swappable.push(i - 1);
    if (between === ' - ' && parts[i - 1].endsWith('(') && after.startsWith(')^{2}')) swappable.push(i - 1);
  }
  const seen = new Set([nums.join(',')]);
  const queue = [nums];
  while (queue.length) {
    const cur = queue.pop();
    swappable.forEach((j) => {
      const nxt = [...cur];
      [nxt[j], nxt[j + 1]] = [nxt[j + 1], nxt[j]];
      const key = nxt.join(',');
      if (!seen.has(key)) { seen.add(key); queue.push(nxt); }
    });
  }
  return seen;
};

describe('order-of-operations-tiles', () => {
  it.each(BANDS)('has exactly one solution, and the answer is it, at %s', (difficulty) => {
    const distinct = new Set();
    for (let i = 0; i < SAMPLES; i++) {
      const q = generateNumberCards({ difficulty });
      expect(q.metadata.topic).toBe('order-of-operations-tiles');
      if (!distinct.has(q.questionMath)) { compiles(q.questionMath); compiles(q.answer); }
      distinct.add(q.questionMath);

      const [cardLine, eq] = q.questionMath.split('\n');
      const cards = [...cardLine.matchAll(/\\boxed\{(\d)\}/g)].map((m) => Number(m[1]));
      expect(new Set(cards).size, cardLine).toBe(cards.length);
      const boxes = eq.split(BOX).length - 1;
      expect(boxes).toBe(cards.length);
      expect(cards.length).toBe(difficulty === 'foundation' ? 3 : 4);

      // The answer is the question with the boxes filled. The squares' 2s
      // are not cards, so they are blanked before the numbers are read off.
      const target = difficulty === 'core' ? null : Number(/= (\d+)$/.exec(eq)[1]);
      const answerNums = [...q.answer.replace(/\^\{2\}/g, '').matchAll(/\d+/g)].map((m) => Number(m[0]));
      const filled = target === null ? answerNums : answerNums.slice(0, -1);
      if (target !== null) expect(answerNums.at(-1)).toBe(target);
      expect([...filled].sort().join(','), q.answer).toBe([...cards].sort().join(','));
      expect(fill(eq, filled), q.answer).toBe(q.answer);
      expect(holds(q.answer), q.answer).toBe(true);

      // Uniqueness, by brute force over every arrangement of the cards.
      const ok = permutations(cards).filter((p) => holds(fill(eq, p)));
      const same = equivalents(eq, filled);
      ok.forEach((p) => expect(same.has(p.join(',')), `${eq}: ${p} also works (answer ${q.answer})`).toBe(true));
      if (difficulty === 'stretch') expect(eq).toMatch(/\(|\)/);
      if (difficulty !== 'foundation') expect(eq).toMatch(/\^\{2\}/);
    }
    console.log(`order-of-operations-tiles ${difficulty}: ${distinct.size} distinct`);
    expect(distinct.size).toBeGreaterThan(difficulty === 'core' ? 20 : 100);
  });
});
