// src/generators/puzzles/magicSquareGenerators.js
//
// Magic squares for the Last year retrieval pool. No prerequisites, so these
// are the backstop the fallback chain in SPEC.md §4.2 terminates in.
//
// Every square is a known base square put through one of the eight dihedral
// symmetries and then an affine map v -> mv + c. That guarantees it stays magic
// while giving several hundred distinct boards, and the offset is what puts
// negatives on the grid.
//
// Blanks are not chosen freely. A random selection can leave a grid that is
// unsolvable by hand, or worse, one with more than one valid completion. Every
// puzzle here is checked by the same elimination a student would use — find a
// line with one unknown, fill it, repeat — which proves both solvability and
// uniqueness, and counts the passes needed as the difficulty measure.

import _ from 'lodash';

const BASE_3 = [
  [2, 7, 6],
  [9, 5, 1],
  [4, 3, 8],
];

const BASE_4 = [
  [16, 3, 2, 13],
  [5, 10, 11, 8],
  [9, 6, 7, 12],
  [4, 15, 14, 1],
];

// --- symmetries -------------------------------------------------------------

const transpose = (g) => g[0].map((_c, i) => g.map((row) => row[i]));
const flipRows = (g) => [...g].reverse();

/** One of the eight dihedral symmetries, chosen at random. */
const symmetry = (grid) => {
  let g = grid.map((r) => [...r]);
  if (Math.random() < 0.5) g = transpose(g);
  const quarters = _.random(0, 3);
  for (let i = 0; i < quarters; i += 1) g = transpose(flipRows(g));
  return g;
};

const affine = (g, m, c) => g.map((row) => row.map((v) => v * m + c));

// --- lines ------------------------------------------------------------------

const linesOf = (n) => {
  const out = [];
  for (let r = 0; r < n; r += 1) out.push(_.range(n).map((c) => [r, c]));
  for (let c = 0; c < n; c += 1) out.push(_.range(n).map((r) => [r, c]));
  out.push(_.range(n).map((i) => [i, i]));
  out.push(_.range(n).map((i) => [i, n - 1 - i]));
  return out;
};

const isMagic = (g) => {
  const n = g.length;
  const target = g[0].reduce((a, b) => a + b, 0);
  return linesOf(n).every(
    (line) => line.reduce((s, [r, c]) => s + g[r][c], 0) === target
  );
};

// --- the solver, which is also the difficulty measure -----------------------

/**
 * Solve by elimination, exactly as a student would. Returns whether the grid
 * resolves completely, how many passes it took, and the first line that gave
 * something away — that last one becomes the working.
 *
 * A grid that resolves this way has exactly one completion, so this doubles as
 * the uniqueness check.
 */
const solveByElimination = (puzzle, magicSum, sumIsGiven) => {
  const n = puzzle.length;
  const g = puzzle.map((r) => [...r]);
  const lines = linesOf(n);
  let sum = sumIsGiven ? magicSum : null;
  let passes = 0;
  let firstMove = null;

  for (;;) {
    let moved = false;

    if (sum === null) {
      const complete = lines.find((line) => line.every(([r, c]) => g[r][c] !== null));
      if (!complete) break;
      sum = complete.reduce((s, [r, c]) => s + g[r][c], 0);
      moved = true;
    }

    lines.forEach((line) => {
      const unknown = line.filter(([r, c]) => g[r][c] === null);
      if (unknown.length !== 1) return;
      const known = line
        .filter(([r, c]) => g[r][c] !== null)
        .reduce((s, [r, c]) => s + g[r][c], 0);
      const [r, c] = unknown[0];
      g[r][c] = sum - known;
      if (!firstMove) firstMove = { line, known, value: sum - known };
      moved = true;
    });

    if (!moved) break;
    passes += 1;
  }

  const solved = g.every((row) => row.every((v) => v !== null));
  return { solved, passes, firstMove, sum };
};

// --- describing the first move ---------------------------------------------

const lineName = (line) => {
  const [r0, c0] = line[0];
  if (line.every(([r]) => r === r0)) return `row ${r0 + 1}`;
  if (line.every(([, c]) => c === c0)) return `column ${c0 + 1}`;
  return line[0][0] === line[0][1] ? 'the leading diagonal' : 'the other diagonal';
};

// ---------------------------------------------------------------------------

const BANDS = ['foundation', 'core', 'stretch'];
const band = (d) => (BANDS.includes(d) ? d : 'core');

const SETTINGS = {
  // 3x3, all positive, magic sum given, every blank falls out in one pass.
  foundation: { n: 3, m: [1, 3], c: [0, 8], blanks: 3, sumIsGiven: true, maxPasses: 1 },
  // 3x3, negatives on the grid, at least one blank needs a second pass.
  core: { n: 3, m: [1, 4], c: [-12, 4], blanks: 4, sumIsGiven: true, minPasses: 2 },
  // 4x4, negatives, and the magic sum has to be found from a complete line first.
  stretch: { n: 4, m: [1, 3], c: [-9, 4], blanks: 6, sumIsGiven: false },
};

export const generateMagicSquare = (options = {}) => {
  const difficulty = band(options.difficulty);
  const s = SETTINGS[difficulty];
  const base = s.n === 3 ? BASE_3 : BASE_4;
  const cells = _.range(s.n).flatMap((r) => _.range(s.n).map((c) => [r, c]));

  let built = null;
  for (let attempt = 0; attempt < 400 && !built; attempt += 1) {
    const m = _.random(s.m[0], s.m[1]);
    const c = _.random(s.c[0], s.c[1]);
    const solution = affine(symmetry(base), m, c);
    const values = solution.flat();

    if (difficulty === 'foundation' && Math.min(...values) < 1) continue;
    if (difficulty !== 'foundation' && Math.min(...values) >= 0) continue;
    if (Math.max(...values.map(Math.abs)) > 45) continue;

    const magicSum = solution[0].reduce((a, b) => a + b, 0);
    const hidden = _.sampleSize(cells, s.blanks);
    const puzzle = solution.map((row, r) =>
      row.map((v, col) => (hidden.some(([hr, hc]) => hr === r && hc === col) ? null : v))
    );

    const check = solveByElimination(puzzle, magicSum, s.sumIsGiven);
    if (!check.solved) continue;
    if (s.maxPasses && check.passes > s.maxPasses) continue;
    if (s.minPasses && check.passes < s.minPasses) continue;

    built = { solution, puzzle, magicSum, hidden, check };
  }

  if (!built) return null;

  const { solution, puzzle, magicSum, check } = built;

  // Reading order, so the spoken answer matches the grid left to right, top down.
  const missing = _.range(s.n)
    .flatMap((r) => _.range(s.n).map((c) => (puzzle[r][c] === null ? solution[r][c] : null)))
    .filter((v) => v !== null);

  const { line, known, value } = check.firstMove;
  const workingOut = s.sumIsGiven
    ? `\\text{${lineName(line)}: } ${magicSum} - ${known} = ${value}`
    : `\\text{one line is complete: the total is } ${magicSum}`;

  return {
    instruction: 'Fill in the missing numbers',
    questionText: s.sumIsGiven
      ? `Every row, column and diagonal adds to ${magicSum}.`
      : 'Every row, column and diagonal adds to the same total.',
    answer: missing.join(',\\ '),
    workingOut,
    visualization: {
      type: 'magic-square',
      size: s.n,
      cells: puzzle,
      solution,
      magicSum,
      showMagicSum: s.sumIsGiven,
    },
    metadata: { topic: 'magic-square', difficulty, tags: ['puzzle'] },
  };
};

export const __test = { isMagic, solveByElimination, linesOf };