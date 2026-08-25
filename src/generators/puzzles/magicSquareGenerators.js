// src/generators/puzzles/magicSquareGenerators.js
//
// Magic squares — retrieval-pool puzzle. Rewritten to SPEC §3 from the old
// magicSquareGenerator.js (singular): that file exported no generateMagicSquare
// (the name skills.js calls), emitted a 2D { grid, fullGrid, size } visualization
// the board can't read, and carried a base square that wasn't actually magic on
// its diagonal. All fixed here. Replace/delete the singular file — MIGRATION #4.
//
// The board's Figure `magic-square` branch reads a flat, row-major contract:
//   { type: 'magic-square', n, cells, solution, big }
// where cells has null for blanks (given cells show in ink) and solution is the
// completed grid (blanks fill in the slot hue on reveal). The magic square is
// the one figure that does NOT shrink on reveal — the grid is what's read after.
//
// Bands change the shape, not just the numbers:
//   Foundation  3x3, positive              sum 15
//   Core        3x3, includes negatives    negative-number arithmetic
//   Stretch     4x4                         larger grid, more deduction
//
// Every hide-pattern leaves at most one blank per row and per column, so each
// blank is solvable from a single line — verified across the base data.

import _ from 'lodash';

const SQ3 = [
  [[8, 1, 6], [3, 5, 7], [4, 9, 2]],
  [[6, 1, 8], [7, 5, 3], [2, 9, 4]],
  [[2, 7, 6], [9, 5, 1], [4, 3, 8]],
  [[4, 9, 2], [3, 5, 7], [8, 1, 6]],
  [[2, 9, 4], [7, 5, 3], [6, 1, 8]],
  [[6, 7, 2], [1, 5, 9], [8, 3, 4]],
];

const NEG3 = [
  { grid: [[3, -4, 1], [-2, 0, 2], [-1, 4, -3]], sum: 0 },
  { grid: [[4, -3, 2], [-1, 1, 3], [0, 5, -2]], sum: 3 },
  { grid: [[2, -5, 0], [-3, -1, 1], [-2, 3, -4]], sum: -3 },
  { grid: [[5, -2, 3], [0, 2, 4], [1, 6, -1]], sum: 6 },
  { grid: [[1, -6, -1], [-4, -2, 0], [-3, 2, -5]], sum: -6 },
];

const SQ4 = [
  [[16, 3, 2, 13], [5, 10, 11, 8], [9, 6, 7, 12], [4, 15, 14, 1]],
  [[1, 14, 15, 4], [12, 7, 6, 9], [8, 11, 10, 5], [13, 2, 3, 16]],
];

// Each pattern hides at most one cell per row and per column (line-solvable).
const HID3 = [
  [[0, 0], [1, 1], [2, 2]],
  [[0, 2], [1, 1], [2, 0]],
  [[0, 1], [1, 2], [2, 0]],
  [[0, 0], [1, 2], [2, 1]],
  [[0, 1], [1, 0], [2, 2]],
];
const HID4 = [
  [[0, 0], [1, 1], [2, 2], [3, 3]],
  [[0, 3], [1, 2], [2, 1], [3, 0]],
];

const build = (fullGrid, magicSum, hidden, n, difficulty) => {
  const solution = fullGrid.flat();
  const hiddenSet = new Set(hidden.map(([i, j]) => i * n + j));
  const cells = solution.map((v, idx) => (hiddenSet.has(idx) ? null : v));
  return {
    instruction: 'Complete the magic square',
    answer: `\\text{Each line totals } ${magicSum}`,
    workingOut: `\\text{Rows, columns and diagonals all sum to } ${magicSum}`,
    visualization: { type: 'magic-square', n, cells, solution, big: 1 },
    metadata: { topic: 'magic-square', difficulty },
  };
};

export const generateMagicSquare = (options = {}) => {
  const { difficulty = 'core' } = options;
  if (difficulty === 'foundation') return build(_.sample(SQ3), 15, _.sample(HID3), 3, difficulty);
  if (difficulty === 'stretch') return build(_.sample(SQ4), 34, _.sample(HID4), 4, difficulty);
  const s = _.sample(NEG3);
  return build(s.grid, s.sum, _.sample(HID3), 3, difficulty);
};

export const magicSquareGenerators = { generateMagicSquare };
export default magicSquareGenerators;