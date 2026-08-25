// src/generators/puzzles/symbolPuzzleGenerators.js
//
// Symbol puzzles for the Last year retrieval pool. Simultaneous equations
// wearing a disguise: a class that can't yet see past the letters will often
// solve these, which is what makes them worth having.
//
// The question IS the question — these return questionMath, not a figure.
// Multi-line, so they use \n per SPEC.md §3.
//
// Symbols are geometric glyphs rather than emoji: DESIGN.md is flat, hard-edged
// and Archivo only, and full-colour cartoon fruit would be the loudest thing on
// the board. Shape alone distinguishes at the back of a room without leaning on
// colour, which the slot hues are already using.

import _ from 'lodash';

const CIRCLE = '\u25CF'; // ●
const TRIANGLE = '\u25B2'; // ▲
const SQUARE = '\u25A0'; // ■

const GLYPHS = [CIRCLE, TRIANGLE, SQUARE];

const BANDS = ['foundation', 'core', 'stretch'];
const band = (d) => (BANDS.includes(d) ? d : 'core');

/** n copies of a glyph, written out: ● + ● + ▲ */
const lhs = (coeffs, glyphs) =>
  glyphs
    .flatMap((g, i) => _.range(coeffs[i]).map(() => g))
    .join(' + ');

const det2 = (m) => m[0][0] * m[1][1] - m[0][1] * m[1][0];

const det3 = (m) =>
  m[0][0] * (m[1][1] * m[2][2] - m[1][2] * m[2][1]) -
  m[0][1] * (m[1][0] * m[2][2] - m[1][2] * m[2][0]) +
  m[0][2] * (m[1][0] * m[2][1] - m[1][1] * m[2][0]);

// Coefficient patterns with a non-zero determinant, so the system has exactly
// one solution. Verified in the test file rather than trusted here.
// No line may carry more than four glyphs: ● + ● + ■ + ■ + ■ = 37 is unreadable
// at the back of a room and stops being a puzzle.
const CORE_PATTERNS = [
  [[2, 1], [1, 2]],
  [[3, 1], [1, 2]],
  [[1, 2], [3, 1]],
  [[2, 1], [1, 3]],
];

// [[1,1,1],[2,1,0],[0,1,2]] looks plausible and has determinant zero, which
// would give a puzzle with infinitely many solutions. Kept out deliberately;
// the test file checks every pattern here is non-singular.
const STRETCH_PATTERNS = [
  [[1, 1, 0], [0, 1, 1], [1, 0, 1]],
  [[2, 1, 0], [0, 1, 1], [1, 0, 1]],
  [[1, 2, 0], [0, 1, 1], [1, 0, 2]],
  [[1, 1, 0], [0, 2, 1], [1, 0, 1]],
];

/** Values are chosen first, so the totals are always consistent and integral. */
const build = (patterns, count) => {
  const glyphs = _.sampleSize(GLYPHS, count).sort(
    (a, b) => GLYPHS.indexOf(a) - GLYPHS.indexOf(b)
  );
  const values = _.range(count).map(() => _.random(2, 12));
  const pattern = _.sample(patterns);
  const equations = pattern.map((row) => ({
    coeffs: row,
    total: row.reduce((s, k, i) => s + k * values[i], 0),
  }));
  return { glyphs, values, equations };
};

const render = ({ glyphs, equations }) =>
  equations
    .map(({ coeffs, total }) => {
      const used = glyphs.filter((_g, i) => coeffs[i] > 0);
      const usedCoeffs = coeffs.filter((k) => k > 0);
      return `${lhs(usedCoeffs, used)} = ${total}`;
    })
    .join('\n');

const answerOf = ({ glyphs, values }) =>
  glyphs.map((g, i) => `${g} = ${values[i]}`).join(',\\ ');

// Foundation — one symbol is given away outright, then substitute.
// ▲ + ▲ + ▲ = 12,  ▲ + ● = 9
const foundation = () => {
  const [g1, g2] = _.sampleSize(GLYPHS, 2);
  const v1 = _.random(2, 9);
  const v2 = _.random(2, 12);
  const k = _.random(2, 4);
  const equations = [
    { coeffs: [k, 0], total: k * v1 },
    { coeffs: [1, 1], total: v1 + v2 },
  ];
  return { glyphs: [g1, g2], values: [v1, v2], equations };
};

const core = () => build(CORE_PATTERNS, 2);
const stretch = () => build(STRETCH_PATTERNS, 3);

export const generateSymbolPuzzle = (options = {}) => {
  const difficulty = band(options.difficulty);
  const puzzle = { foundation, core, stretch }[difficulty]();

  const first = puzzle.equations[0];
  const solo = first.coeffs.filter((k) => k > 0).length === 1;
  const workingOut = solo
    ? `\\text{the first line gives } ${puzzle.glyphs[first.coeffs.findIndex((k) => k > 0)]} \\text{ on its own}`
    : '\\text{compare the two lines}';

  return {
    instruction: 'Find the value of each symbol',
    questionMath: render(puzzle),
    answer: answerOf(puzzle),
    workingOut,
    metadata: { topic: 'symbol-puzzle', difficulty, tags: ['puzzle'] },
  };
};

export const __test = { det2, det3, CORE_PATTERNS, STRETCH_PATTERNS, GLYPHS };