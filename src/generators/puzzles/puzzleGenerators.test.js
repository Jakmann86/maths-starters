// src/generators/puzzles/puzzleGenerators.test.js
//
// The load-bearing tests here are solvability and uniqueness. A magic square
// with badly chosen blanks can be unsolvable by hand, or admit more than one
// completion — neither is visible by looking at it. A symbol puzzle built on a
// singular coefficient matrix has infinitely many solutions and looks fine.

import { describe, expect, it } from 'vitest';
import { generateMagicSquare, __test as ms } from './magicSquareGenerators';
import { generateSymbolPuzzle, __test as sp } from './symbolPuzzleGenerators';

const BANDS = ['foundation', 'core', 'stretch'];
const SAMPLES = 300;

describe('magic square', () => {
  it.each(BANDS)('always produces a puzzle at %s', (difficulty) => {
    for (let i = 0; i < SAMPLES; i += 1) {
      expect(generateMagicSquare({ difficulty })).not.toBeNull();
    }
  });

  it.each(BANDS)('is genuinely magic at %s', (difficulty) => {
    for (let i = 0; i < SAMPLES; i += 1) {
      const { visualization } = generateMagicSquare({ difficulty });
      expect(ms.isMagic(visualization.solution)).toBe(true);
    }
  });

  it.each(BANDS)('is solvable by hand and has one completion at %s', (difficulty) => {
    for (let i = 0; i < SAMPLES; i += 1) {
      const { visualization: v } = generateMagicSquare({ difficulty });
      // Resolving by elimination proves both: every blank is reachable, and no
      // other set of values could have filled them.
      const check = ms.solveByElimination(v.cells, v.magicSum, v.showMagicSum);
      expect(check.solved).toBe(true);
    }
  });

  it.each(BANDS)('states the answer in reading order at %s', (difficulty) => {
    for (let i = 0; i < SAMPLES; i += 1) {
      const q = generateMagicSquare({ difficulty });
      const missing = [];
      q.visualization.cells.forEach((row, r) =>
        row.forEach((cell, c) => {
          if (cell === null) missing.push(q.visualization.solution[r][c]);
        })
      );
      expect(q.answer).toBe(missing.join(',\\ '));
    }
  });

  it('keeps foundation positive and puts negatives on the harder grids', () => {
    for (let i = 0; i < SAMPLES; i += 1) {
      const f = generateMagicSquare({ difficulty: 'foundation' });
      expect(Math.min(...f.visualization.solution.flat())).toBeGreaterThan(0);
      const c = generateMagicSquare({ difficulty: 'core' });
      expect(Math.min(...c.visualization.solution.flat())).toBeLessThan(0);
    }
  });

  it('escalates 3x3 to 4x4, and hides the total at stretch', () => {
    for (let i = 0; i < 50; i += 1) {
      expect(generateMagicSquare({ difficulty: 'foundation' }).visualization.size).toBe(3);
      expect(generateMagicSquare({ difficulty: 'core' }).visualization.size).toBe(3);
      const s = generateMagicSquare({ difficulty: 'stretch' });
      expect(s.visualization.size).toBe(4);
      expect(s.visualization.showMagicSum).toBe(false);
    }
  });

  it('returns a figure config, never JSX', () => {
    const q = generateMagicSquare({ difficulty: 'core' });
    expect(q.visualization.type).toBe('magic-square');
    expect(typeof q.visualization).toBe('object');
    expect(q.visualization.$$typeof).toBeUndefined();
  });
});

describe('symbol puzzle', () => {
  it('has no singular coefficient pattern', () => {
    // A zero determinant means infinitely many solutions and a broken puzzle.
    sp.CORE_PATTERNS.forEach((m) => expect(sp.det2(m)).not.toBe(0));
    sp.STRETCH_PATTERNS.forEach((m) => expect(sp.det3(m)).not.toBe(0));
  });

  it.each(BANDS)('states totals that match the stated values at %s', (difficulty) => {
    for (let i = 0; i < SAMPLES; i += 1) {
      const q = generateSymbolPuzzle({ difficulty });
      const values = {};
      q.answer.split(',\\ ').forEach((part) => {
        const [glyph, value] = part.split(' = ');
        values[glyph] = Number(value);
      });
      q.questionMath.split('\\n').forEach((line) => {
        const [left, right] = line.split(' = ');
        const total = left.split(' + ').reduce((s, g) => s + values[g], 0);
        expect(total).toBe(Number(right));
      });
    }
  });

  it.each(BANDS)('never writes more than four glyphs on a line at %s', (difficulty) => {
    for (let i = 0; i < SAMPLES; i += 1) {
      const q = generateSymbolPuzzle({ difficulty });
      q.questionMath.split('\\n').forEach((line) => {
        expect(line.split(' = ')[0].split(' + ').length).toBeLessThanOrEqual(4);
      });
    }
  });

  it('escalates two symbols to three at stretch', () => {
    for (let i = 0; i < 100; i += 1) {
      const two = generateSymbolPuzzle({ difficulty: 'core' });
      expect(two.answer.split(',\\ ').length).toBe(2);
      const three = generateSymbolPuzzle({ difficulty: 'stretch' });
      expect(three.answer.split(',\\ ').length).toBe(3);
      expect(three.questionMath.split('\\n').length).toBe(3);
    }
  });

  it('gives away one symbol outright at foundation', () => {
    for (let i = 0; i < 100; i += 1) {
      const q = generateSymbolPuzzle({ difficulty: 'foundation' });
      const first = q.questionMath.split('\\n')[0].split(' = ')[0];
      expect(new Set(first.split(' + ')).size).toBe(1);
    }
  });

  it('is a question, not a figure', () => {
    const q = generateSymbolPuzzle({ difficulty: 'core' });
    expect(q.visualization).toBeUndefined();
    expect(q.questionMath).toContain('\\n');
  });
});