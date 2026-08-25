// src/curriculum/skills.js
//
// The skill catalogue: curriculum labels -> generator functions. Code, not data.
// Schemes reference these ids; they never hold function references themselves.
//
// `difficulties` lists only the bands a generator genuinely varies across.
// Declaring a band the generator ignores is a lie the board can't detect —
// see MIGRATION.md issue 5.

import * as expressions from '../generators/algebra/expressionsGenerators';
import * as factorising from '../generators/algebra/factorisingGenerators';
import * as equations from '../generators/algebra/equationGenerators';
import * as magicSquares from '../generators/puzzles/magicSquareGenerators';
import * as symbolPuzzles from '../generators/puzzles/symbolPuzzleGenerators';
import * as pythagoras from '../generators/geometry/pythagorasGenerators';

export const BANDS = ['foundation', 'core', 'stretch'];

export const skills = {
  // --- Haese 1A: the distributive law -----------------------------------------------------------
  'expand-single-brackets': {
    label: 'Expanding single brackets',
    generate: (opts) => expressions.generateExpandSingleBrackets(opts),
    difficulties: ['foundation', 'core', 'stretch'],
  },

  // --- Haese 1B -----------------------------------------------------------
  // Two bands. Exercise 1B's harder strands — Q3 difference of two squares and
  // Q4 perfect squares — are separate skills below, which leaves 1B itself with
  // monic and non-monic and nothing genuinely harder.
  'expand-double-brackets': {
    label: 'Expanding double brackets',
    generate: (opts) => expressions.generateExpandDoubleBrackets(opts),
    difficulties: ['foundation', 'core'],
  },

  // --- Haese 1C: difference of two squares -----------------------------------------------------------
  'difference-of-two-squares': {
    label: 'Difference of two squares',
    generate: (opts) => expressions.generateDifferenceOfTwoSquares(opts),
    difficulties: ['foundation', 'core', 'stretch'],
  },
  'difference-of-two-squares-numeric': {
    label: 'Difference of two squares: mental arithmetic',
    generate: (opts) => expressions.generateDifferenceOfTwoSquaresNumeric(opts),
    difficulties: ['core', 'stretch'],
  },

  // --- Haese 1D -----------------------------------------------------------
  'expand-perfect-square': {
    label: 'Expanding a perfect square',
    generate: (opts) => expressions.generateExpandPerfectSquare(opts),
    difficulties: ['foundation', 'core', 'stretch'],
  },

  // --- Haese 1H: difference of two squares, factorising -----------------------------------------------------------
  // The reverse operation of 'difference-of-two-squares' above (which expands).
  // Same object, opposite direction, so it carries its own id.
  'factorise-difference-of-two-squares': {
    label: 'Factorising a difference of two squares',
    generate: (opts) => factorising.generateDifferenceOfTwoSquares(opts),
    difficulties: ['foundation', 'core', 'stretch'],
  },

  // --- Haese 1J: expressions with four terms -----------------------------------------------------------
  'factorise-grouping': {
    label: 'Factorising by grouping',
    generate: (opts) => factorising.generateFactoriseGrouping(opts),
    difficulties: ['foundation', 'core', 'stretch'],
  },

  // --- Haese 1K: x^2 + bx + c -----------------------------------------------------------
  'factorise-monic': {
    label: 'Factorising: x² + bx + c',
    generate: (opts) => factorising.generateFactoriseMonic(opts),
    difficulties: ['foundation', 'core', 'stretch'],
  },

  // --- Haese 1L: ax^2 + bx + c, splitting the middle term -----------------------------------------------------------
  'factorise-splitting-middle': {
    label: 'Factorising: ax² + bx + c',
    generate: (opts) => factorising.generateFactoriseSplittingMiddle(opts),
    difficulties: ['foundation', 'core', 'stretch'],
  },

    // --- Haese 3A: solving linear equations ---
  'solve-linear-equations': {
    label: 'Solving linear equations',
    generate: (opts) => equations.generateSolveLinear(opts),
    difficulties: ['foundation', 'core', 'stretch'],
  },

  // --- Haese 3A.2: unknown on both sides ---
  // id matches the generator's own metadata.topic ('solve-linear-both-sides'),
  // not the -equations- naming used by the other three below.
  'solve-linear-both-sides': {
    label: 'Solving equations: unknown on both sides',
    generate: (opts) => equations.generateSolveBothSides(opts),
    difficulties: ['foundation', 'core', 'stretch'],
  },

  // --- Haese 3B: equations with fractions ---
  'solve-equations-fractions': {
    label: 'Solving equations with fractions',
    generate: (opts) => equations.generateSolveFractions(opts),
    difficulties: ['foundation', 'core', 'stretch'],
  },

  // --- Haese 3E: power equations ---
  'solve-power-equations': {
    label: 'Solving power equations',
    generate: (opts) => equations.generateSolvePower(opts),
    difficulties: ['foundation', 'core', 'stretch'],
  },

  // --- Haese 3C-D: forming equations -----------------------------------------
  // Returns `questionText`, not `questionMath` — Board.jsx's slotData only
  // wires questionMath through to the slot's question field, so this skill
  // will render with a blank question until that text path is added.
  'forming-equations': {
    label: 'Forming equations',
    generate: (opts) => equations.generateFormingEquation(opts),
    difficulties: ['foundation', 'core', 'stretch'],
  },

    // --- Haese Ch 8: Pythagoras ---
  'pythagoras-hypotenuse': {
    label: 'Pythagoras: find the hypotenuse',
    generate: (opts) => pythagoras.generatePythagorasHypotenuse(opts),
    difficulties: ['foundation', 'core', 'stretch'],
  },

  // --- Puzzles: the retrieval pool, and the backstop every fallback chain in
  // SPEC.md 4.2 terminates in. No prerequisites, so these can always fill a slot.
  'magic-square': {
    label: 'Magic squares',
    generate: (opts) => magicSquares.generateMagicSquare(opts),
    difficulties: ['foundation', 'core', 'stretch'],
  },
  'symbol-puzzle': {
    label: 'Symbol puzzles',
    generate: (opts) => symbolPuzzles.generateSymbolPuzzle(opts),
    difficulties: ['foundation', 'core', 'stretch'],
  },
};

export const skillIds = Object.keys(skills);

export const getSkill = (id) => skills[id];

/**
 * The nearest band a skill actually declares (SPEC §4.3). Steps down before it
 * steps up, so a Stretch class never gets an easier question than a Core one.
 */
export const nearestBand = (id, wanted) => {
  const skill = skills[id];
  if (!skill) return null;
  const preference = {
    stretch: ['stretch', 'core', 'foundation'],
    core: ['core', 'foundation', 'stretch'],
    foundation: ['foundation', 'core', 'stretch'],
  }[BANDS.includes(wanted) ? wanted : 'core'];
  return preference.find((b) => skill.difficulties.includes(b)) || null;
};

/**
 * The board's single entry point. Returns null for an unknown id rather than
 * throwing — a stale scheme entry should render a slot's empty state, not
 * take down the lesson.
 */
export const generateForSkill = (id, wanted = 'core') => {
  const skill = skills[id];
  if (!skill) return null;
  return skill.generate({ difficulty: nearestBand(id, wanted) });
};