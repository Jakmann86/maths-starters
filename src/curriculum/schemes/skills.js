// src/curriculum/skills.js
//
// The skill catalogue: curriculum labels -> generator functions. Code, not data.
// Schemes reference these ids; they never hold function references themselves.
//
// `difficulties` lists only the bands a generator genuinely varies across.
// Declaring a band the generator ignores is a lie the board can't detect —
// see MIGRATION.md issue 5.

import * as expressions from '../generators/algebra/expressionsGenerators';

export const BANDS = ['foundation', 'core', 'stretch'];

export const skills = {
  // --- Haese 1A -----------------------------------------------------------
  'expand-single-brackets': {
    label: 'Expanding single brackets',
    generate: (opts) => expressions.generateExpandSingleBrackets(opts),
    difficulties: ['foundation', 'core', 'stretch'],
  },

  // --- Haese 1B -----------------------------------------------------------
  'expand-double-brackets': {
    label: 'Expanding double brackets',
    generate: (opts) => expressions.generateExpandDoubleBrackets(opts),
    difficulties: ['foundation', 'core', 'stretch'],
  },

  // --- Haese 1C -----------------------------------------------------------
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