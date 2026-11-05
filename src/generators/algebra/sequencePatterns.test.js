import { describe, it, expect } from 'vitest';
import {
  generateSequencePatternQuadratic,
  generateSequencePatternArithmetic,
  generateSequencePatternGeometric,
} from './sequencesGenerators';

const RUNS = 3000;
const BANDS = ['foundation', 'core', 'stretch'];

describe('quadratic dot pattern', () => {
  it.each(BANDS)('%s: the answer is counted from the drawn blocks', (difficulty) => {
    const seen = new Set();
    for (let i = 0; i < RUNS; i += 1) {
      const q = generateSequencePatternQuadratic({ difficulty });
      const { terms } = q.visualization;
      expect(terms).toHaveLength(3);
      // Solid blocks: term n is n wide and a fixed amount taller than wide.
      terms.forEach(([cols], n) => expect(cols).toBe(n + 1));
      const k = terms[0][1] - terms[0][0];
      terms.forEach(([cols, rows]) => expect(rows - cols).toBe(k));
      // Quadratic in n, as a second difference of 2 confirms.
      const counts = terms.map(([cols, rows]) => cols * rows);
      expect(counts[2] - 2 * counts[1] + counts[0]).toBe(2);
      const countAt = (n) => n * (n + k);
      const text = q.questionText;
      seen.add(text + k);
      if (difficulty === 'foundation') {
        const n = Number(text.match(/term (\d+)\?/)[1]);
        expect(q.answer).toBe(String(countAt(n)));
      } else if (difficulty === 'core') {
        const count = Number(text.match(/has (\d+) dots/)[1]);
        const n = Number(q.answer.match(/(\d+)$/)[1]);
        expect(countAt(n)).toBe(count);
      } else {
        const n = Number(text.match(/term number (\d+)/)[1]);
        const value = Number(q.answer.split('\n')[1].split('= ')[1]);
        expect(value).toBe(countAt(n));
        expect(k).toBeGreaterThan(0);
      }
    }
    // A documented ceiling, not a target: see the generator's comment.
    expect(seen.size).toBe({ foundation: 12, core: 16, stretch: 18 }[difficulty]);
  });
});

describe('the other pattern questions', () => {
  it('ask in the big text, not the instruction', () => {
    for (const difficulty of BANDS) {
      for (const gen of [generateSequencePatternArithmetic, generateSequencePatternGeometric, generateSequencePatternQuadratic]) {
        const q = gen({ difficulty });
        expect(q.instruction).toBe('Study the pattern');
        expect(q.questionText).toMatch(/\d/);
      }
    }
  });

  it('arithmetic counts what is drawn: squares, dots or tiles', () => {
    const UNIT = { 'matchstick-squares': 'squares', 'dot-row': 'dots', 'tile-squares': 'tiles' };
    for (let i = 0; i < 500; i += 1) {
      const q = generateSequencePatternArithmetic({ difficulty: 'foundation' });
      expect(q.questionText).toContain(UNIT[q.visualization.motif]);
    }
  });
});
