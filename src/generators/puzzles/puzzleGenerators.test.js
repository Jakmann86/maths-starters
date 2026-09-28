// src/generators/puzzles/puzzleGenerators.test.js
//
// The load-bearing tests here are solvability and uniqueness. A magic square
// with badly chosen blanks can be unsolvable by hand, or admit more than one
// completion — neither is visible by looking at it. A symbol puzzle built on a
// singular coefficient matrix has infinitely many solutions and looks fine.

import { describe, expect, it } from 'vitest';
import { generateMagicSquare } from './magicSquareGenerators';
import { generateSymbolPuzzle, __test as sp } from './symbolPuzzleGenerators';

const BANDS = ['foundation', 'core', 'stretch'];
const SAMPLES = 300;

// The generator's own figure contract (see magicSquareGenerators.js's header
// comment): `cells`/`solution` are flat, row-major arrays of length n*n, not
// 2D grids, and there's no separate `magicSum`/`showMagicSum`/`size` field —
// the sum lives only in the text `answer`/`workingOut`.

/** Flat index lists for every row, column and the two diagonals of an n x n grid. */
const linesOf = (n) => {
  const rows = _range(n).map((r) => _range(n).map((c) => r * n + c));
  const cols = _range(n).map((c) => _range(n).map((r) => r * n + c));
  const diag1 = _range(n).map((i) => i * n + i);
  const diag2 = _range(n).map((i) => i * n + (n - 1 - i));
  return [...rows, ...cols, diag1, diag2];
};
const _range = (n) => Array.from({ length: n }, (_v, i) => i);

/** Every row, column and diagonal of a flat n x n grid sums to the same value. */
const isMagic = (flat, n) => {
  const sums = linesOf(n).map((line) => line.reduce((s, i) => s + flat[i], 0));
  return sums.every((s) => s === sums[0]);
};

/**
 * Reduced row-echelon form of an augmented matrix (partial pivoting), used to
 * solve the magic square's blanks from the visible cells alone — never from
 * the generator's own `solution` — per CLAUDE.md #8.
 */
const rref = (matrix) => {
  const rows = matrix.map((r) => [...r]);
  const nRows = rows.length;
  const nCols = rows[0].length - 1;
  let pivotRow = 0;
  for (let col = 0; col < nCols && pivotRow < nRows; col += 1) {
    let sel = -1;
    let best = 1e-9;
    for (let r = pivotRow; r < nRows; r += 1) {
      if (Math.abs(rows[r][col]) > best) { best = Math.abs(rows[r][col]); sel = r; }
    }
    if (sel === -1) continue;
    [rows[pivotRow], rows[sel]] = [rows[sel], rows[pivotRow]];
    const pivot = rows[pivotRow][col];
    for (let c = col; c <= nCols; c += 1) rows[pivotRow][c] /= pivot;
    for (let r = 0; r < nRows; r += 1) {
      if (r === pivotRow) continue;
      const factor = rows[r][col];
      if (Math.abs(factor) < 1e-12) continue;
      for (let c = col; c <= nCols; c += 1) rows[r][c] -= factor * rows[pivotRow][c];
    }
    pivotRow += 1;
  }
  return { rows, rank: pivotRow, nCols };
};

/**
 * Solves for every blank cell from the visible `cells` alone (never `solution`),
 * by treating each row/column/diagonal as "its cells sum to some common total
 * S" and running Gaussian elimination over the blanks plus S. Returns the
 * solved blank values (in flat-index order) if the system has a unique,
 * consistent solution, or null otherwise — this is what proves a hand-solver
 * could actually complete the square from what's shown.
 */
const solveByElimination = (cells, n) => {
  const blanks = cells.map((v, i) => (v === null ? i : -1)).filter((i) => i >= 0);
  const varIndex = new Map(blanks.map((idx, k) => [idx, k]));
  const nVars = blanks.length + 1; // + S
  const sIndex = blanks.length;

  const equations = linesOf(n).map((line) => {
    const coeffs = new Array(nVars).fill(0);
    let knownSum = 0;
    line.forEach((idx) => {
      if (varIndex.has(idx)) coeffs[varIndex.get(idx)] += 1;
      else knownSum += cells[idx];
    });
    coeffs[sIndex] -= 1;
    return [...coeffs, -knownSum];
  });

  const { rows, rank, nCols } = rref(equations);
  if (rank < nCols) return null; // underdetermined — not solvable from what's shown
  for (let r = rank; r < rows.length; r += 1) {
    if (Math.abs(rows[r][nCols]) > 1e-6) return null; // contradiction
  }
  const solved = new Array(cells.length).fill(null);
  blanks.forEach((idx, k) => { solved[idx] = rows[k][nCols]; });
  return solved;
};

describe('magic square', () => {
  it.each(BANDS)('always produces a puzzle at %s', (difficulty) => {
    for (let i = 0; i < SAMPLES; i += 1) {
      expect(generateMagicSquare({ difficulty })).not.toBeNull();
    }
  });

  it.each(BANDS)('is genuinely magic at %s', (difficulty) => {
    for (let i = 0; i < SAMPLES; i += 1) {
      const { visualization: v } = generateMagicSquare({ difficulty });
      expect(isMagic(v.solution, v.n)).toBe(true);
    }
  });

  it.each(BANDS)('is solvable by hand and has one completion at %s', (difficulty) => {
    for (let i = 0; i < SAMPLES; i += 1) {
      const { visualization: v } = generateMagicSquare({ difficulty });
      // Resolving by elimination from the visible cells alone proves both:
      // every blank is reachable, and no other set of values could fill them.
      const solved = solveByElimination(v.cells, v.n);
      expect(solved, JSON.stringify(v.cells)).not.toBeNull();
      v.cells.forEach((cell, idx) => {
        if (cell === null) expect(Math.round(solved[idx])).toBe(v.solution[idx]);
      });
    }
  });

  it.each(BANDS)('states the magic sum that its own solution actually has at %s', (difficulty) => {
    for (let i = 0; i < SAMPLES; i += 1) {
      const q = generateMagicSquare({ difficulty });
      const { n, solution } = q.visualization;
      const trueSum = linesOf(n)[0].reduce((s, idx) => s + solution[idx], 0);
      expect(q.answer).toBe(`\\text{Each line totals } ${trueSum}`);
    }
  });

  it('keeps foundation positive and puts negatives on the harder grids', () => {
    for (let i = 0; i < SAMPLES; i += 1) {
      const f = generateMagicSquare({ difficulty: 'foundation' });
      expect(Math.min(...f.visualization.solution)).toBeGreaterThan(0);
      const c = generateMagicSquare({ difficulty: 'core' });
      expect(Math.min(...c.visualization.solution)).toBeLessThan(0);
    }
  });

  it('escalates 3x3 to 4x4 at stretch', () => {
    for (let i = 0; i < 50; i += 1) {
      expect(generateMagicSquare({ difficulty: 'foundation' }).visualization.n).toBe(3);
      expect(generateMagicSquare({ difficulty: 'core' }).visualization.n).toBe(3);
      expect(generateMagicSquare({ difficulty: 'stretch' }).visualization.n).toBe(4);
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
      q.questionMath.split('\n').forEach((line) => {
        const [left, right] = line.split(' = ');
        const total = left.split(' + ').reduce((s, g) => s + values[g], 0);
        expect(total).toBe(Number(right));
      });
    }
  });

  it.each(BANDS)('never writes more than four glyphs on a line at %s', (difficulty) => {
    for (let i = 0; i < SAMPLES; i += 1) {
      const q = generateSymbolPuzzle({ difficulty });
      q.questionMath.split('\n').forEach((line) => {
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
      expect(three.questionMath.split('\n').length).toBe(3);
    }
  });

  it('gives away one symbol outright at foundation', () => {
    for (let i = 0; i < 100; i += 1) {
      const q = generateSymbolPuzzle({ difficulty: 'foundation' });
      const first = q.questionMath.split('\n')[0].split(' = ')[0];
      expect(new Set(first.split(' + ')).size).toBe(1);
    }
  });

  it('is a question, not a figure', () => {
    const q = generateSymbolPuzzle({ difficulty: 'core' });
    expect(q.visualization).toBeUndefined();
    expect(q.questionMath).toContain('\n');
  });
});