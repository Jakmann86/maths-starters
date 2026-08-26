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
import * as sohcahtoa from '../generators/geometry/sohcahtoaGenerators';
import * as angleFacts from '../generators/geometry/angleFactsGenerators';

export const BANDS = ['foundation', 'core', 'stretch'];

export const skills = {
  // --- Haese 1A: the distributive law -----------------------------------------------------------
  'expand-single-brackets': {
    label: 'Expanding single brackets',
    topic: 'Expanding brackets',
    generate: (opts) => expressions.generateExpandSingleBrackets(opts),
    difficulties: ['foundation', 'core', 'stretch'],
  },

  // --- Haese 1B -----------------------------------------------------------
  // Two bands. Exercise 1B's harder strands — Q3 difference of two squares and
  // Q4 perfect squares — are separate skills below, which leaves 1B itself with
  // monic and non-monic and nothing genuinely harder.
  'expand-double-brackets': {
    label: 'Expanding double brackets',
    topic: 'Expanding brackets',
    generate: (opts) => expressions.generateExpandDoubleBrackets(opts),
    difficulties: ['foundation', 'core'],
  },

  // --- Haese 1C: difference of two squares -----------------------------------------------------------
  'difference-of-two-squares': {
    label: 'Difference of two squares',
    topic: 'Expanding brackets',
    generate: (opts) => expressions.generateDifferenceOfTwoSquares(opts),
    difficulties: ['foundation', 'core', 'stretch'],
  },
  'difference-of-two-squares-numeric': {
    label: 'Difference of two squares: mental arithmetic',
    topic: 'Expanding brackets',
    generate: (opts) => expressions.generateDifferenceOfTwoSquaresNumeric(opts),
    difficulties: ['core', 'stretch'],
  },

  // --- Haese 1D -----------------------------------------------------------
  'expand-perfect-square': {
    label: 'Expanding a perfect square',
    topic: 'Expanding brackets',
    generate: (opts) => expressions.generateExpandPerfectSquare(opts),
    difficulties: ['foundation', 'core', 'stretch'],
  },

  // --- Haese 1H: difference of two squares, factorising -----------------------------------------------------------
  // The reverse operation of 'difference-of-two-squares' above (which expands).
  // Same object, opposite direction, so it carries its own id.
  'factorise-difference-of-two-squares': {
    label: 'Factorising a difference of two squares',
    topic: 'Factorising',
    generate: (opts) => factorising.generateDifferenceOfTwoSquares(opts),
    difficulties: ['foundation', 'core', 'stretch'],
  },

  // --- Haese 1J: expressions with four terms -----------------------------------------------------------
  'factorise-grouping': {
    label: 'Factorising by grouping',
    topic: 'Factorising',
    generate: (opts) => factorising.generateFactoriseGrouping(opts),
    difficulties: ['foundation', 'core', 'stretch'],
  },

  // --- Haese 1K: x^2 + bx + c -----------------------------------------------------------
  'factorise-monic': {
    label: 'Factorising: x² + bx + c',
    topic: 'Factorising',
    generate: (opts) => factorising.generateFactoriseMonic(opts),
    difficulties: ['foundation', 'core', 'stretch'],
  },

  // --- Haese 1L: ax^2 + bx + c, splitting the middle term -----------------------------------------------------------
  'factorise-splitting-middle': {
    label: 'Factorising: ax² + bx + c',
    topic: 'Factorising',
    generate: (opts) => factorising.generateFactoriseSplittingMiddle(opts),
    difficulties: ['foundation', 'core', 'stretch'],
  },

    // --- Haese 3A: solving linear equations ---
  'solve-linear-equations': {
    label: 'Solving linear equations',
    topic: 'Equations',
    generate: (opts) => equations.generateSolveLinear(opts),
    difficulties: ['foundation', 'core', 'stretch'],
  },

  // --- Haese 3A.2: unknown on both sides ---
  // id matches the generator's own metadata.topic ('solve-linear-both-sides'),
  // not the -equations- naming used by the other three below.
  'solve-linear-both-sides': {
    label: 'Solving equations: unknown on both sides',
    topic: 'Equations',
    generate: (opts) => equations.generateSolveBothSides(opts),
    difficulties: ['foundation', 'core', 'stretch'],
  },

  // --- Haese 3B: equations with fractions ---
  'solve-equations-fractions': {
    label: 'Solving equations with fractions',
    topic: 'Equations',
    generate: (opts) => equations.generateSolveFractions(opts),
    difficulties: ['foundation', 'core', 'stretch'],
  },

  // --- Haese 3E: power equations ---
  'solve-power-equations': {
    label: 'Solving power equations',
    topic: 'Equations',
    generate: (opts) => equations.generateSolvePower(opts),
    difficulties: ['foundation', 'core', 'stretch'],
  },

  // --- Haese 3C-D: forming equations -----------------------------------------
  // Returns `questionText`, not `questionMath` — Board.jsx's slotData only
  // wires questionMath through to the slot's question field, so this skill
  // will render with a blank question until that text path is added.
  'forming-equations': {
    label: 'Forming equations',
    topic: 'Equations',
    generate: (opts) => equations.generateFormingEquation(opts),
    difficulties: ['foundation', 'core', 'stretch'],
  },

    // --- Haese Ch 8: Pythagoras ---
  'pythagoras-hypotenuse': {
    label: 'Pythagoras: find the hypotenuse',
    topic: 'Pythagoras',
    generate: (opts) => pythagoras.generatePythagorasHypotenuse(opts),
    difficulties: ['foundation', 'core', 'stretch'],
  },
  'pythagoras-missing-side': {
    label: 'Pythagoras: find a missing side',
    topic: 'Pythagoras',
    generate: (opts) => pythagoras.generatePythagorasMissingSide(opts),
    difficulties: ['foundation', 'core', 'stretch'],
  },
  'pythagoras-isosceles': {
    label: 'Pythagoras: isosceles triangles',
    topic: 'Pythagoras',
    generate: (opts) => pythagoras.generatePythagorasIsosceles(opts),
    difficulties: ['foundation', 'core', 'stretch'],
  },

  // --- Haese 15B: right-angled trigonometry ---
  'sohcahtoa-find-side': {
    label: 'SOHCAHTOA: find a side',
    topic: 'Trigonometry',
    generate: (opts) => sohcahtoa.generateSohcahtoaFindSide(opts),
    difficulties: ['foundation', 'core', 'stretch'],
  },
  'sohcahtoa-find-angle': {
    label: 'SOHCAHTOA: find an angle',
    topic: 'Trigonometry',
    generate: (opts) => sohcahtoa.generateSohcahtoaFindAngle(opts),
    difficulties: ['foundation', 'core', 'stretch'],
  },

  // --- Haese 4A: angle facts at a point ---
  'angles-on-a-line': {
    label: 'Angles on a line',
    topic: 'Angles',
    generate: (opts) => angleFacts.generateAnglesOnALine(opts),
    difficulties: ['foundation', 'core', 'stretch'],
  },
  'angles-at-a-point': {
    label: 'Angles at a point',
    topic: 'Angles',
    generate: (opts) => angleFacts.generateAnglesAtAPoint(opts),
    difficulties: ['foundation', 'core', 'stretch'],
  },
  'vertically-opposite': {
    label: 'Vertically opposite angles',
    topic: 'Angles',
    generate: (opts) => angleFacts.generateVerticallyOpposite(opts),
    difficulties: ['foundation', 'core', 'stretch'],
  },

  // --- Haese 4B: triangle angle sum / exterior angle ---
  'triangle-angle-sum': {
    label: 'Triangle angle sum',
    topic: 'Angles',
    generate: (opts) => angleFacts.generateTriangleAngleSum(opts),
    difficulties: ['foundation', 'core', 'stretch'],
  },
  'triangle-exterior-angle': {
    label: 'Triangle exterior angle',
    topic: 'Angles',
    generate: (opts) => angleFacts.generateTriangleExteriorAngle(opts),
    difficulties: ['foundation', 'core', 'stretch'],
  },

  // --- Puzzles: the retrieval pool, and the backstop every fallback chain in
  // SPEC.md 4.2 terminates in. No prerequisites, so these can always fill a slot.
  'magic-square': {
    label: 'Magic squares',
    topic: 'Puzzles',
    generate: (opts) => magicSquares.generateMagicSquare(opts),
    difficulties: ['foundation', 'core', 'stretch'],
  },
  'symbol-puzzle': {
    label: 'Symbol puzzles',
    topic: 'Puzzles',
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

/**
 * Distinct topic names, in order of first appearance in `skills` (SPEC.md
 * "Design revision: topic-level selection (v1)").
 */
export const topics = () => {
  const seen = [];
  skillIds.forEach((id) => {
    const t = skills[id].topic;
    if (!seen.includes(t)) seen.push(t);
  });
  return seen;
};

/** Skill ids whose topic matches `topicName`, in catalogue order. */
export const skillsInTopic = (topicName) => skillIds.filter((id) => skills[id].topic === topicName);

/**
 * The next skill id within a topic, cycling back to the first after the
 * last. An unknown/null/missing `currentSkillId` (or one not in the topic)
 * returns the topic's first skill. A single-skill topic returns itself.
 */
export const nextSkillInTopic = (topicName, currentSkillId) => {
  const ids = skillsInTopic(topicName);
  if (ids.length === 0) return null;
  const index = ids.indexOf(currentSkillId);
  if (index === -1) return ids[0];
  return ids[(index + 1) % ids.length];
};