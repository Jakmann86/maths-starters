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
import * as sequences from '../generators/algebra/sequencesGenerators';
import * as formulae from '../generators/algebra/formulaGenerators';
import * as quadEq from '../generators/algebra/quadraticEquationGenerators';
import * as solids from '../generators/geometry/solidsGenerators';
import * as area from '../generators/geometry/areaGenerators';
import * as perim from '../generators/geometry/perimeterGenerators';
import * as circleThm from '../generators/geometry/circleTheoremGenerators';
import * as pct from '../generators/number/percentageGenerators';

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

  // --- Haese 21A-C: solving quadratic equations ---
  'solve-quadratic-roots': {
    label: 'Quadratic equations of the form x² = k',
    topic: 'Quadratic equations',
    generate: (opts) => quadEq.generateSolveQuadraticRoots(opts),
    difficulties: ['foundation', 'core', 'stretch'],
  },
  'solve-quadratic-factorising': {
    label: 'Solving quadratics by factorising',
    topic: 'Quadratic equations',
    generate: (opts) => quadEq.generateSolveQuadraticFactorising(opts),
    difficulties: ['foundation', 'core', 'stretch'],
  },
  'solve-quadratic-formula': {
    label: 'Solving quadratics with the formula',
    topic: 'Quadratic equations',
    generate: (opts) => quadEq.generateSolveQuadraticFormula(opts),
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

  // --- Haese 4C: isosceles base angles ---
  'isosceles-base-angles': {
    label: 'Isosceles base angles',
    topic: 'Angles',
    generate: (opts) => angleFacts.generateIsoscelesBaseAngles(opts),
    difficulties: ['foundation', 'core', 'stretch'],
  },

  // --- angle sum of a quadrilateral ---
  'quadrilateral-angle-sum': {
    label: 'Angle sum of a quadrilateral',
    topic: 'Angles',
    generate: (opts) => angleFacts.generateQuadrilateralAngleSum(opts),
    difficulties: ['foundation', 'core', 'stretch'],
  },

  // --- Haese 4: angle problem solving (two-theorem chains) ---
  // Topic moved from 'Angles' to 'Problem solving' alongside
  // simultaneous-problem-solving below — the two are the same kind of
  // skill (a worded problem building a small system to solve), not really
  // an "Angles" skill that happens to use a triangle figure.
  'angles-problem-solving': {
    label: 'Angle problem solving',
    topic: 'Problem solving',
    generate: (opts) => angleFacts.generateAnglesProblemSolving(opts),
    difficulties: ['foundation', 'core', 'stretch'],
  },

  // --- Haese: angles in parallel lines ---
  'corresponding-angles': {
    label: 'Corresponding angles',
    topic: 'Angles',
    generate: (opts) => angleFacts.generateCorrespondingAngles(opts),
    difficulties: ['foundation', 'core', 'stretch'],
  },
  'alternate-angles': {
    label: 'Alternate angles',
    topic: 'Angles',
    generate: (opts) => angleFacts.generateAlternateAngles(opts),
    difficulties: ['foundation', 'core', 'stretch'],
  },
  'co-interior-angles': {
    label: 'Co-interior angles',
    topic: 'Angles',
    generate: (opts) => angleFacts.generateCoInteriorAngles(opts),
    difficulties: ['foundation', 'core', 'stretch'],
  },

  // --- Haese: polygon angles ---
  'polygon-interior-angles': {
    label: 'Polygon interior angles',
    topic: 'Angles',
    generate: (opts) => angleFacts.generatePolygonInteriorAngles(opts),
    difficulties: ['foundation', 'core', 'stretch'],
  },
  'polygon-exterior-angles': {
    label: 'Polygon exterior angles',
    topic: 'Angles',
    generate: (opts) => angleFacts.generatePolygonExteriorAngles(opts),
    difficulties: ['foundation', 'core', 'stretch'],
  },

  // --- Haese 26C: geometric sequences ---
  'sequences-geometric-nth-term': {
    label: 'Geometric sequences: find the nth term rule',
    topic: 'Sequences',
    generate: (opts) => sequences.generateSequenceFindNthTermGeometric(opts),
    difficulties: ['foundation', 'core', 'stretch'],
  },
  'sequences-geometric-use-nth-term': {
    label: 'Geometric sequences: use the nth term rule',
    topic: 'Sequences',
    generate: (opts) => sequences.generateSequenceUseNthTermGeometric(opts),
    difficulties: ['foundation', 'core', 'stretch'],
  },
  'sequences-geometric-is-term': {
    label: 'Geometric sequences: is it a term?',
    topic: 'Sequences',
    generate: (opts) => sequences.generateSequenceIsInSequenceGeometric(opts),
    difficulties: ['foundation', 'core', 'stretch'],
  },
  'sequences-geometric-pattern': {
    label: 'Geometric sequences: branching pattern',
    topic: 'Sequences',
    generate: (opts) => sequences.generateSequencePatternGeometric(opts),
    difficulties: ['foundation', 'core', 'stretch'],
  },

  // --- Haese 26B: arithmetic sequences ---
  'sequences-arithmetic-nth-term': {
    label: 'Arithmetic sequences: find the nth term rule',
    topic: 'Sequences',
    generate: (opts) => sequences.generateSequenceFindNthTermArithmetic(opts),
    difficulties: ['foundation', 'core', 'stretch'],
  },
  'sequences-arithmetic-use-nth-term': {
    label: 'Arithmetic sequences: use the nth term rule',
    topic: 'Sequences',
    generate: (opts) => sequences.generateSequenceUseNthTermArithmetic(opts),
    difficulties: ['foundation', 'core', 'stretch'],
  },
  'sequences-arithmetic-is-term': {
    label: 'Arithmetic sequences: is it a term?',
    topic: 'Sequences',
    generate: (opts) => sequences.generateSequenceIsInSequenceArithmetic(opts),
    difficulties: ['foundation', 'core', 'stretch'],
  },
  'sequences-arithmetic-pattern': {
    label: 'Arithmetic sequences: growing pattern',
    topic: 'Sequences',
    generate: (opts) => sequences.generateSequencePatternArithmetic(opts),
    difficulties: ['foundation', 'core', 'stretch'],
  },

  // --- Haese 26D: quadratic sequences ---
  'sequences-quadratic-nth-term': {
    label: 'Quadratic sequences: find the nth term rule',
    topic: 'Sequences',
    generate: (opts) => sequences.generateSequenceFindNthTermQuadratic(opts),
    difficulties: ['foundation', 'core', 'stretch'],
  },
  'sequences-quadratic-use-nth-term': {
    label: 'Quadratic sequences: use the nth term rule',
    topic: 'Sequences',
    generate: (opts) => sequences.generateSequenceUseNthTermQuadratic(opts),
    difficulties: ['foundation', 'core', 'stretch'],
  },
  'sequences-quadratic-is-term': {
    label: 'Quadratic sequences: is it a term?',
    topic: 'Sequences',
    generate: (opts) => sequences.generateSequenceIsInSequenceQuadratic(opts),
    difficulties: ['foundation', 'core', 'stretch'],
  },
  'sequences-quadratic-pattern': {
    label: 'Quadratic sequences: dot grid pattern',
    topic: 'Sequences',
    generate: (opts) => sequences.generateSequencePatternQuadratic(opts),
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

  // --- Haese 7: formulae and simultaneous equations -----------------------
  'formula-substitution': {
    label: 'Formula substitution',
    topic: 'Formulae and simultaneous equations',
    generate: (opts) => formulae.generateFormulaSubstitution(opts),
    difficulties: ['foundation', 'core', 'stretch'],
  },
  'formula-rearrangement': {
    label: 'Formula rearrangement',
    topic: 'Formulae and simultaneous equations',
    generate: (opts) => formulae.generateFormulaRearrangement(opts),
    difficulties: ['foundation', 'core', 'stretch'],
  },
  'formula-derivation': {
    label: 'Formula derivation',
    topic: 'Formulae and simultaneous equations',
    generate: (opts) => formulae.generateFormulaDerivation(opts),
    difficulties: ['foundation', 'core', 'stretch'],
  },
  'simultaneous-equations': {
    label: 'Simultaneous equations',
    topic: 'Formulae and simultaneous equations',
    generate: (opts) => formulae.generateSimultaneousEquations(opts),
    difficulties: ['foundation', 'core', 'stretch'],
  },
  // Joins angles-problem-solving under 'Problem solving' (see its entry
  // above) rather than 'Formulae and simultaneous equations' — it's a
  // worded-problem skill first, algebra-topic second.
  'simultaneous-problem-solving': {
    label: 'Simultaneous equations: problem solving',
    topic: 'Problem solving',
    generate: (opts) => formulae.generateSimultaneousProblemSolving(opts),
    difficulties: ['foundation', 'core', 'stretch'],
  },

  // --- Haese 11A: surface area ---
  'surface-area-cuboid': {
    label: 'Surface area of a cuboid',
    topic: 'Surface area',
    generate: (opts) => solids.generateSurfaceAreaCuboid(opts),
    difficulties: ['foundation', 'core', 'stretch'],
  },

  // --- Haese 11A: surface area of solids with curved surfaces ---
  'surface-area-cylinder': {
    label: 'Surface area of a cylinder',
    topic: 'Surface area',
    generate: (opts) => solids.generateSurfaceAreaCylinder(opts),
    difficulties: ['foundation', 'core', 'stretch'],
  },
  'surface-area-cone': {
    label: 'Surface area of a cone',
    topic: 'Surface area',
    generate: (opts) => solids.generateSurfaceAreaCone(opts),
    difficulties: ['foundation', 'core', 'stretch'],
  },
  'surface-area-sphere': {
    label: 'Surface area of a sphere',
    topic: 'Surface area',
    generate: (opts) => solids.generateSurfaceAreaSphere(opts),
    difficulties: ['foundation', 'core', 'stretch'],
  },
  'surface-area-prism': {
    label: 'Surface area of a prism',
    topic: 'Surface area',
    generate: (opts) => solids.generateSurfaceAreaPrism(opts),
    difficulties: ['foundation', 'core', 'stretch'],
  },
  'surface-area-pyramid': {
    label: 'Surface area of a pyramid',
    topic: 'Surface area',
    generate: (opts) => solids.generateSurfaceAreaPyramid(opts),
    difficulties: ['foundation', 'core', 'stretch'],
  },

  // --- Haese 11B: volume ---
  'volume-cuboid': {
    label: 'Volume of a cuboid',
    topic: 'Volume',
    generate: (opts) => solids.generateVolumeCuboid(opts),
    difficulties: ['foundation', 'core', 'stretch'],
  },

  // --- Haese 11B: volume of solids with curved surfaces ---
  'volume-cylinder': {
    label: 'Volume of a cylinder',
    topic: 'Volume',
    generate: (opts) => solids.generateVolumeCylinder(opts),
    difficulties: ['foundation', 'core', 'stretch'],
  },
  'volume-cone': {
    label: 'Volume of a cone',
    topic: 'Volume',
    generate: (opts) => solids.generateVolumeCone(opts),
    difficulties: ['foundation', 'core', 'stretch'],
  },
  'volume-sphere': {
    label: 'Volume of a sphere',
    topic: 'Volume',
    generate: (opts) => solids.generateVolumeSphere(opts),
    difficulties: ['foundation', 'core', 'stretch'],
  },
  'volume-prism': {
    label: 'Volume of a prism',
    topic: 'Volume',
    generate: (opts) => solids.generateVolumePrism(opts),
    difficulties: ['foundation', 'core', 'stretch'],
  },
  'volume-pyramid': {
    label: 'Volume of a pyramid',
    topic: 'Volume',
    generate: (opts) => solids.generateVolumePyramid(opts),
    difficulties: ['foundation', 'core', 'stretch'],
  },

  // --- Haese 9C / Rayner 4.1: area of plane shapes ---
  'area-rectangle': {
    label: 'Area of a rectangle',
    topic: 'Area',
    generate: (opts) => area.generateAreaRectangle(opts),
    difficulties: ['foundation', 'core', 'stretch'],
  },
  'area-triangle': {
    label: 'Area of a triangle',
    topic: 'Area',
    generate: (opts) => area.generateAreaTriangle(opts),
    difficulties: ['foundation', 'core', 'stretch'],
  },
  'area-parallelogram': {
    label: 'Area of a parallelogram',
    topic: 'Area',
    generate: (opts) => area.generateAreaParallelogram(opts),
    difficulties: ['foundation', 'core', 'stretch'],
  },
  'area-trapezium': {
    label: 'Area of a trapezium',
    topic: 'Area',
    generate: (opts) => area.generateAreaTrapezium(opts),
    difficulties: ['foundation', 'core', 'stretch'],
  },
  'area-kite': {
    label: 'Area of a kite',
    topic: 'Area',
    generate: (opts) => area.generateAreaKite(opts),
    difficulties: ['foundation', 'core', 'stretch'],
  },
  'area-compound': {
    label: 'Area of a compound shape',
    topic: 'Area',
    generate: (opts) => perim.generateAreaCompound(opts),
    difficulties: ['foundation', 'core'],
  },

  // --- Haese 9D / Rayner 4.2: circles ---
  'circumference-circle': {
    label: 'Circumference of a circle',
    topic: 'Circles',
    generate: (opts) => perim.generateCircumferenceCircle(opts),
    difficulties: ['foundation', 'core', 'stretch'],
  },
  'area-circle': {
    label: 'Area of a circle',
    topic: 'Circles',
    generate: (opts) => perim.generateAreaCircle(opts),
    difficulties: ['foundation', 'core', 'stretch'],
  },

  // --- Haese 9B: perimeter ---
  'perimeter-rectangle': {
    label: 'Perimeter of a rectangle',
    topic: 'Perimeter',
    generate: (opts) => perim.generatePerimeterRectangle(opts),
    difficulties: ['foundation', 'core', 'stretch'],
  },
  'perimeter-compound': {
    label: 'Perimeter of a compound shape',
    topic: 'Perimeter',
    generate: (opts) => perim.generatePerimeterCompound(opts),
    difficulties: ['foundation', 'core'],
  },

  // --- Haese 27A-B: circle theorems ---
  'angle-in-semicircle': {
    label: 'The angle in a semi-circle',
    topic: 'Circle theorems',
    generate: (opts) => circleThm.generateAngleInSemicircle(opts),
    difficulties: ['foundation', 'core', 'stretch'],
  },
  'angle-at-centre': {
    label: 'The angle at the centre',
    topic: 'Circle theorems',
    generate: (opts) => circleThm.generateAngleAtCentre(opts),
    difficulties: ['foundation', 'core', 'stretch'],
  },
  'cyclic-quadrilateral': {
    label: 'Cyclic quadrilaterals',
    topic: 'Circle theorems',
    generate: (opts) => circleThm.generateCyclicQuadrilateral(opts),
    difficulties: ['foundation', 'core', 'stretch'],
  },

  // --- Haese 10A, 10D, 10E: percentages ---
  'percentage-of-amount': {
    label: 'Percentage of an amount',
    topic: 'Percentages',
    generate: (opts) => pct.generatePercentageOfAmount(opts),
    difficulties: ['foundation', 'core', 'stretch'],
  },
  'percentage-multiplier': {
    label: 'Percentage multipliers',
    topic: 'Percentages',
    generate: (opts) => pct.generatePercentageMultiplier(opts),
    difficulties: ['foundation', 'core', 'stretch'],
  },
  'percentage-change': {
    label: 'Percentage increase and decrease',
    topic: 'Percentages',
    generate: (opts) => pct.generatePercentageChange(opts),
    difficulties: ['foundation', 'core', 'stretch'],
  },

  // --- Haese 6B: index laws ---
  'index-laws': {
    label: 'Index laws',
    topic: 'Indices',
    generate: (opts) => pct.generateIndexLaws(opts),
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