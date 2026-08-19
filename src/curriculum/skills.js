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
import * as magicSquares from '../generators/puzzles/magicSquareGenerators';
import * as symbolPuzzles from '../generators/puzzles/symbolPuzzleGenerators';

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