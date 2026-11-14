// src/curriculum/skills.js
//
// The skill catalogue: curriculum labels -> generator functions. Code, not data.
// Schemes reference these ids; they never hold function references themselves.
//
// `difficulties` lists only the bands a generator genuinely varies across.
// Declaring a band the generator ignores is a lie the board can't detect —
// see MIGRATION.md issue 5.

import * as further from '../generators/algebra/furtherAlgebraGenerators';
import * as expressions from '../generators/algebra/expressionsGenerators';
import * as factorising from '../generators/algebra/factorisingGenerators';
import * as equations from '../generators/algebra/equationGenerators';
import * as algFrac from '../generators/algebra/algebraicFractionGenerators';
import * as magicSquares from '../generators/puzzles/magicSquareGenerators';
import * as symbolPuzzles from '../generators/puzzles/symbolPuzzleGenerators';
import * as arithmagon from '../generators/puzzles/arithmagonGenerators';
import * as pythagoras from '../generators/geometry/pythagorasGenerators';
import * as pythProblems from '../generators/geometry/pythagorasProblemsGenerators';
import * as sohcahtoa from '../generators/geometry/sohcahtoaGenerators';
import * as functions from '../generators/algebra/functionGenerators';
import * as furtherTrig from '../generators/geometry/furtherTrigGenerators';
import * as similarity from '../generators/geometry/similarityGenerators';
import * as transformations from '../generators/geometry/transformationGenerators';
import * as vectors from '../generators/geometry/vectorGenerators';
import * as angleFacts from '../generators/geometry/angleFactsGenerators';
import * as sequences from '../generators/algebra/sequencesGenerators';
import * as cubicSeq from '../generators/algebra/cubicSequenceGenerators';
import * as formulae from '../generators/algebra/formulaGenerators';
import * as inequalities from '../generators/algebra/inequalityGenerators';
import * as quadEq from '../generators/algebra/quadraticEquationGenerators';
import * as quadGraph from '../generators/algebra/quadraticGraphGenerators';
import * as solids from '../generators/geometry/solidsGenerators';
import * as area from '../generators/geometry/areaGenerators';
import * as perim from '../generators/geometry/perimeterGenerators';
import * as circleThm from '../generators/geometry/circleTheoremGenerators';
import * as circleLen from '../generators/geometry/circleLengthGenerators';
import * as pct from '../generators/number/percentageGenerators';
import * as ch6 from '../generators/number/chapter6Generators';
import * as fracPow from '../generators/number/fractionalPowerGenerators';
import * as indexLaws from '../generators/number/indexLawGenerators';
import * as logs from '../generators/number/logarithmGenerators';
import * as money from '../generators/number/moneyGenerators';
import * as speed from '../generators/number/speedGenerators';
import * as rational from '../generators/number/rationalNumberGenerators';
import * as bidmas from '../generators/number/orderOfOperationsGenerators';
import * as stats from '../generators/statistics/averagesGenerators';
import * as displays from '../generators/statistics/dataDisplayGenerators';
import * as pie from '../generators/statistics/pieChartGenerators';
import * as bars from '../generators/statistics/barChartGenerators';
import * as freqTable from '../generators/statistics/frequencyTableGenerators';
import * as dataTypes from '../generators/statistics/dataTypesGenerators';
import * as sets from '../generators/number/setsGenerators';
import * as probability from '../generators/number/probabilityGenerators';
import * as trees from '../generators/number/treeDiagramGenerators';
import * as probMore from '../generators/number/probabilityTopicsGenerators';
import * as variation from '../generators/algebra/variationGenerators';
import * as coord from '../generators/geometry/coordinateGeometryGenerators';
import * as scatter from '../generators/statistics/scatterGenerators';
import * as spread from '../generators/statistics/spreadGenerators';
import * as boxPlots from '../generators/statistics/boxPlotGenerators';

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

  // --- Haese 1D -----------------------------------------------------------
  'expand-perfect-square': {
    label: 'Expanding a perfect square',
    topic: 'Expanding brackets',
    generate: (opts) => expressions.generateExpandPerfectSquare(opts),
    difficulties: ['foundation', 'core', 'stretch'],
  },
  'expand-further': {
    label: 'Further expansion',
    topic: 'Expanding brackets',
    generate: (opts) => further.generateExpandFurther(opts),
    difficulties: ['foundation', 'core', 'stretch'],
  },

  // --- Haese 1G: factorising with common factors (Y9 Unit 2 do-nows) ---
  // First in the topic: taking out the HCF is the move every later
  // factorising skill starts from, so a fresh draw opens here.
  'factorise-common-factor': {
    label: 'Factorising: common factors',
    topic: 'Factorising',
    generate: (opts) => factorising.generateFactoriseCommonFactor(opts),
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
  'factorise-perfect-square': {
    label: 'Perfect squares',
    topic: 'Factorising',
    generate: (opts) => further.generateFactorisePerfectSquare(opts),
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
  'factorise-fully': {
    label: 'Factorising fully',
    topic: 'Factorising',
    generate: (opts) => further.generateFactoriseFully(opts),
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

  // --- Haese 21D-H: quadratic functions and their graphs ---
  'quadratic-substitution': {
    label: 'Substituting into a quadratic',
    topic: 'Quadratic graphs',
    generate: (opts) => quadGraph.generateQuadraticSubstitution(opts),
    difficulties: ['foundation', 'core', 'stretch'],
  },
  'quadratic-vertex-form': {
    label: 'Vertex from turning point form',
    topic: 'Quadratic graphs',
    generate: (opts) => quadGraph.generateQuadraticVertexForm(opts),
    difficulties: ['foundation', 'core', 'stretch'],
  },
  'quadratic-intercepts': {
    label: 'Axes intercepts',
    topic: 'Quadratic graphs',
    generate: (opts) => quadGraph.generateQuadraticIntercepts(opts),
    difficulties: ['foundation', 'core', 'stretch'],
  },
  'quadratic-symmetry': {
    label: 'Line of symmetry and vertex',
    topic: 'Quadratic graphs',
    generate: (opts) => quadGraph.generateQuadraticSymmetry(opts),
    difficulties: ['foundation', 'core', 'stretch'],
  },
  'quadratic-find-function': {
    label: 'Finding a quadratic function',
    topic: 'Quadratic graphs',
    generate: (opts) => quadGraph.generateQuadraticFindFunction(opts),
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

  // --- Y9 do-nows: fractional coefficients, (3/4)x - 2 = 7 ---
  'solve-fractional-coefficients': {
    label: 'Solving equations with fractional coefficients',
    topic: 'Equations',
    generate: (opts) => equations.generateSolveFractionalCoefficients(opts),
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
  'forming-equations': {
    label: 'Forming equations',
    topic: 'Equations',
    generate: (opts) => equations.generateFormingEquation(opts),
    difficulties: ['foundation', 'core', 'stretch'],
  },

  // --- Haese 3F-3G: linear inequalities (Y9 Unit 2 do-nows) ---
  'inequality-list-values': {
    label: 'Inequalities: which numbers fit?',
    topic: 'Inequalities',
    generate: (opts) => inequalities.generateInequalityListValues(opts),
    difficulties: ['foundation', 'core', 'stretch'],
  },
  'solve-linear-inequalities': {
    label: 'Solving linear inequalities',
    topic: 'Inequalities',
    generate: (opts) => inequalities.generateSolveLinearInequalities(opts),
    difficulties: ['foundation', 'core', 'stretch'],
  },

  // --- Haese 16A-B: algebraic fractions ---
  'simplify-algebraic-fractions': {
    label: 'Simplifying algebraic fractions',
    topic: 'Algebraic fractions',
    generate: (opts) => algFrac.generateSimplifyAlgebraicFraction(opts),
    difficulties: ['foundation', 'core', 'stretch'],
  },
  'simplify-fractions-factorising': {
    label: 'Algebraic fractions: factorise and cancel',
    topic: 'Algebraic fractions',
    generate: (opts) => algFrac.generateSimplifyFractionsFactorising(opts),
    difficulties: ['foundation', 'core', 'stretch'],
  },
  'multiply-algebraic-fractions': {
    label: 'Multiplying algebraic fractions',
    topic: 'Algebraic fractions',
    generate: (opts) => algFrac.generateMultiplyAlgebraicFractions(opts),
    difficulties: ['foundation', 'core', 'stretch'],
  },
  'divide-algebraic-fractions': {
    label: 'Dividing algebraic fractions',
    topic: 'Algebraic fractions',
    generate: (opts) => algFrac.generateDivideAlgebraicFractions(opts),
    difficulties: ['foundation', 'core', 'stretch'],
  },
  'add-algebraic-fractions': {
    label: 'Adding and subtracting fractions',
    topic: 'Algebraic fractions',
    generate: (opts) => further.generateAddAlgebraicFractions(opts),
    difficulties: ['foundation', 'core', 'stretch'],
  },

    // --- Haese Ch 8: Pythagoras ---
  'pythagoras-hypotenuse': {
    label: 'Pythagoras: find the hypotenuse',
    topic: 'Pythagoras and trigonometry',
    generate: (opts) => pythagoras.generatePythagorasHypotenuse(opts),
    difficulties: ['foundation', 'core', 'stretch'],
  },
  'pythagoras-missing-side': {
    label: 'Pythagoras: find a missing side',
    topic: 'Pythagoras and trigonometry',
    generate: (opts) => pythagoras.generatePythagorasMissingSide(opts),
    difficulties: ['foundation', 'core', 'stretch'],
  },
  'pythagoras-converse': {
    label: 'Pythagoras: is it right-angled?',
    topic: 'Pythagoras and trigonometry',
    generate: (opts) => pythProblems.generatePythagorasConverse(opts),
    difficulties: ['foundation', 'core', 'stretch'],
  },
  'pythagoras-isosceles': {
    label: 'Pythagoras: isosceles triangles',
    topic: 'Pythagoras and trigonometry',
    generate: (opts) => pythagoras.generatePythagorasIsosceles(opts),
    difficulties: ['foundation', 'core', 'stretch'],
  },
  'pythagoras-3d': {
    label: 'Pythagoras in three dimensions',
    topic: 'Pythagoras and trigonometry',
    generate: (opts) => pythProblems.generatePythagoras3d(opts),
    difficulties: ['foundation', 'core', 'stretch'],
  },

  // --- Haese 15B: right-angled trigonometry ---
  'sohcahtoa-find-side': {
    label: 'SOHCAHTOA: find a side',
    topic: 'Pythagoras and trigonometry',
    generate: (opts) => sohcahtoa.generateSohcahtoaFindSide(opts),
    difficulties: ['foundation', 'core', 'stretch'],
  },
  'sohcahtoa-find-angle': {
    label: 'SOHCAHTOA: find an angle',
    topic: 'Pythagoras and trigonometry',
    generate: (opts) => sohcahtoa.generateSohcahtoaFindAngle(opts),
    difficulties: ['foundation', 'core', 'stretch'],
  },

  // --- Haese 29B-F: the sine and cosine rules ---
  'sine-rule': {
    label: 'The sine rule',
    topic: 'Further trigonometry',
    generate: (opts) => furtherTrig.generateSineRule(opts),
    difficulties: ['foundation', 'core', 'stretch'],
  },
  'cosine-rule': {
    label: 'The cosine rule',
    topic: 'Further trigonometry',
    generate: (opts) => furtherTrig.generateCosineRule(opts),
    difficulties: ['foundation', 'core', 'stretch'],
  },
  'triangle-area-sine': {
    label: 'Area of a triangle: ½ab sin C',
    topic: 'Further trigonometry',
    generate: (opts) => furtherTrig.generateTriangleAreaSine(opts),
    difficulties: ['foundation', 'core', 'stretch'],
  },
  'sine-cosine-mixed': {
    label: 'Sine and cosine rules: mixed',
    topic: 'Further trigonometry',
    generate: (opts) => furtherTrig.generateSineCosineMixed(opts),
    difficulties: ['foundation', 'core', 'stretch'],
  },

  // --- Haese 18A, 18B, 18D: similarity ---
  'similar-shapes': {
    label: 'Similar shapes',
    topic: 'Similarity',
    generate: (opts) => similarity.generateSimilarShapes(opts),
    difficulties: ['foundation', 'core', 'stretch'],
  },
  'similar-triangles': {
    label: 'Similar triangles',
    topic: 'Similarity',
    generate: (opts) => similarity.generateSimilarTriangles(opts),
    difficulties: ['foundation', 'core', 'stretch'],
  },
  'similar-areas': {
    label: 'Areas of similar shapes',
    topic: 'Similarity',
    generate: (opts) => similarity.generateSimilarAreas(opts),
    difficulties: ['foundation', 'core', 'stretch'],
  },
  'similar-volumes': {
    label: 'Volumes of similar solids',
    topic: 'Similarity',
    generate: (opts) => similarity.generateSimilarVolumes(opts),
    difficulties: ['foundation', 'core', 'stretch'],
  },

  // --- Haese 20A-D: transformations on a grid (no vectors chapter) ---
  'translation': {
    label: 'Translation',
    topic: 'Transformations',
    generate: (opts) => transformations.generateTranslation(opts),
    difficulties: ['foundation', 'core', 'stretch'],
  },
  'reflection': {
    label: 'Reflection',
    topic: 'Transformations',
    generate: (opts) => transformations.generateReflection(opts),
    difficulties: ['foundation', 'core', 'stretch'],
  },
  'rotation': {
    label: 'Rotation',
    topic: 'Transformations',
    generate: (opts) => transformations.generateRotation(opts),
    difficulties: ['foundation', 'core', 'stretch'],
  },
  'enlargement': {
    label: 'Enlargement',
    topic: 'Transformations',
    generate: (opts) => transformations.generateEnlargement(opts),
    difficulties: ['foundation', 'core', 'stretch'],
  },
  'describe-transformation': {
    label: 'Describing a transformation',
    topic: 'Transformations',
    generate: (opts) => transformations.generateDescribeTransformation(opts),
    difficulties: ['foundation', 'core', 'stretch'],
  },

  // --- Haese 24A-H, Rayner 11.1-11.5: vectors (bearings problems left out) ---
  'column-vectors': {
    label: 'Column vectors',
    topic: 'Vectors',
    generate: (opts) => vectors.generateColumnVectors(opts),
    difficulties: ['foundation', 'core', 'stretch'],
  },
  'vector-arithmetic': {
    label: 'Adding and scaling vectors',
    topic: 'Vectors',
    generate: (opts) => vectors.generateVectorArithmetic(opts),
    difficulties: ['foundation', 'core', 'stretch'],
  },
  'vector-magnitude': {
    label: 'Magnitude of a vector',
    topic: 'Vectors',
    generate: (opts) => vectors.generateVectorMagnitude(opts),
    difficulties: ['foundation', 'core', 'stretch'],
  },
  'parallel-vectors': {
    label: 'Parallel vectors',
    topic: 'Vectors',
    generate: (opts) => vectors.generateParallelVectors(opts),
    difficulties: ['foundation', 'core', 'stretch'],
  },
  'vector-geometry': {
    label: 'Vectors in geometry',
    topic: 'Vectors',
    generate: (opts) => vectors.generateVectorGeometry(opts),
    difficulties: ['foundation', 'core', 'stretch'],
  },

  // --- Haese 4A: angle facts at a point ---
  'angles-on-a-line': {
    label: 'Angles on a line',
    topic: 'Angle facts',
    generate: (opts) => angleFacts.generateAnglesOnALine(opts),
    difficulties: ['foundation', 'core', 'stretch'],
  },
  'angles-at-a-point': {
    label: 'Angles at a point',
    topic: 'Angle facts',
    generate: (opts) => angleFacts.generateAnglesAtAPoint(opts),
    difficulties: ['foundation', 'core', 'stretch'],
  },
  'vertically-opposite': {
    label: 'Vertically opposite angles',
    topic: 'Angle facts',
    generate: (opts) => angleFacts.generateVerticallyOpposite(opts),
    difficulties: ['foundation', 'core', 'stretch'],
  },

  // --- Haese 4B: triangle angle sum / exterior angle ---
  'triangle-angle-sum': {
    label: 'Triangle angle sum',
    topic: 'Angle facts',
    generate: (opts) => angleFacts.generateTriangleAngleSum(opts),
    difficulties: ['foundation', 'core', 'stretch'],
  },
  'triangle-exterior-angle': {
    label: 'Triangle exterior angle',
    topic: 'Angle facts',
    generate: (opts) => angleFacts.generateTriangleExteriorAngle(opts),
    difficulties: ['foundation', 'core', 'stretch'],
  },

  // --- Haese 4C: isosceles base angles ---
  'isosceles-base-angles': {
    label: 'Isosceles base angles',
    topic: 'Angle facts',
    generate: (opts) => angleFacts.generateIsoscelesBaseAngles(opts),
    difficulties: ['foundation', 'core', 'stretch'],
  },

  // --- angle sum of a quadrilateral ---
  'quadrilateral-angle-sum': {
    label: 'Angle sum of a quadrilateral',
    topic: 'Angle facts',
    generate: (opts) => angleFacts.generateQuadrilateralAngleSum(opts),
    difficulties: ['foundation', 'core', 'stretch'],
  },

  // --- Haese 4: angle problem solving (two-theorem chains) ---
  // Last in 'Angle facts': it chains the facts above, so it is where ↻
  // arrives once the single-fact skills have been seen.
  'angles-problem-solving': {
    label: 'Angle problem solving',
    topic: 'Angle facts',
    generate: (opts) => angleFacts.generateAnglesProblemSolving(opts),
    difficulties: ['foundation', 'core', 'stretch'],
  },

  // --- Haese: angles in parallel lines ---
  // One skill for all three relationships, chosen at random per question,
  // so the class has to recognise which one applies.
  'parallel-line-angles': {
    label: 'Angles in parallel lines',
    topic: 'Parallel lines and polygons',
    generate: (opts) => angleFacts.generateParallelLineAngles(opts),
    difficulties: ['foundation', 'core', 'stretch'],
  },

  // --- Haese: polygon angles ---
  'polygon-interior-angles': {
    label: 'Polygon interior angles',
    topic: 'Parallel lines and polygons',
    generate: (opts) => angleFacts.generatePolygonInteriorAngles(opts),
    difficulties: ['foundation', 'core', 'stretch'],
  },
  'polygon-exterior-angles': {
    label: 'Polygon exterior angles',
    topic: 'Parallel lines and polygons',
    generate: (opts) => angleFacts.generatePolygonExteriorAngles(opts),
    difficulties: ['foundation', 'core', 'stretch'],
  },

  // --- Haese 12, 14: coordinate geometry ---
  'distance-between-points': {
    label: 'Distance between two points',
    topic: 'Coordinate geometry',
    generate: (opts) => coord.generateDistanceBetweenPoints(opts),
    difficulties: ['foundation', 'core', 'stretch'],
  },
  'midpoint-of-segment': {
    label: 'Midpoint of a line segment',
    topic: 'Coordinate geometry',
    generate: (opts) => coord.generateMidpoint(opts),
    difficulties: ['foundation', 'core', 'stretch'],
  },
  'gradient-of-segment': {
    label: 'Gradient of a line segment',
    topic: 'Coordinate geometry',
    generate: (opts) => coord.generateGradientOfSegment(opts),
    difficulties: ['foundation', 'core', 'stretch'],
  },
  'parallel-gradients': {
    label: 'Parallel lines',
    topic: 'Coordinate geometry',
    generate: (opts) => coord.generateParallelGradients(opts),
    difficulties: ['foundation', 'core', 'stretch'],
  },
  'perpendicular-gradients': {
    label: 'Perpendicular lines',
    topic: 'Coordinate geometry',
    generate: (opts) => coord.generatePerpendicularGradients(opts),
    difficulties: ['foundation', 'core', 'stretch'],
  },
  // --- Haese 14A: vertical and horizontal lines (Y9 Unit 2 do-nows) ---
  'horizontal-vertical-lines': {
    label: 'Vertical and horizontal lines',
    topic: 'Straight-line graphs',
    generate: (opts) => coord.generateHorizontalVerticalLines(opts),
    difficulties: ['foundation', 'core', 'stretch'],
  },
  'lines-meet': {
    label: 'Where a line meets x = a or y = b',
    topic: 'Straight-line graphs',
    generate: (opts) => coord.generateLinesMeet(opts),
    difficulties: ['foundation', 'core', 'stretch'],
  },
  'equation-of-a-line': {
    label: 'Equation of a line',
    topic: 'Straight-line graphs',
    generate: (opts) => coord.generateEquationOfALine(opts),
    difficulties: ['foundation', 'core', 'stretch'],
  },
  'line-general-form': {
    label: 'Straight lines in general form',
    topic: 'Straight-line graphs',
    generate: (opts) => coord.generateLineGeneralForm(opts),
    difficulties: ['foundation', 'core', 'stretch'],
  },
  'point-on-line': {
    label: 'A point on a line',
    topic: 'Straight-line graphs',
    generate: (opts) => coord.generatePointOnLine(opts),
    difficulties: ['foundation', 'core', 'stretch'],
  },

  // --- Haese 26B: arithmetic sequences ---
  'sequences-arithmetic-nth-term': {
    label: 'Arithmetic sequences: find the nth term rule',
    topic: 'Arithmetic and geometric sequences',
    generate: (opts) => sequences.generateSequenceFindNthTermArithmetic(opts),
    difficulties: ['foundation', 'core', 'stretch'],
  },
  'sequences-arithmetic-use-nth-term': {
    label: 'Arithmetic sequences: use the nth term rule',
    topic: 'Arithmetic and geometric sequences',
    generate: (opts) => sequences.generateSequenceUseNthTermArithmetic(opts),
    difficulties: ['foundation', 'core', 'stretch'],
  },
  'sequences-arithmetic-is-term': {
    label: 'Arithmetic sequences: is it a term?',
    topic: 'Arithmetic and geometric sequences',
    generate: (opts) => sequences.generateSequenceIsInSequenceArithmetic(opts),
    difficulties: ['foundation', 'core', 'stretch'],
  },
  'sequences-arithmetic-pattern': {
    label: 'Arithmetic sequences: growing pattern',
    topic: 'Arithmetic and geometric sequences',
    generate: (opts) => sequences.generateSequencePatternArithmetic(opts),
    difficulties: ['foundation', 'core', 'stretch'],
  },

  // --- Haese 26C: geometric sequences ---
  'sequences-geometric-nth-term': {
    label: 'Geometric sequences: find the nth term rule',
    topic: 'Arithmetic and geometric sequences',
    generate: (opts) => sequences.generateSequenceFindNthTermGeometric(opts),
    difficulties: ['foundation', 'core', 'stretch'],
  },
  'sequences-geometric-use-nth-term': {
    label: 'Geometric sequences: use the nth term rule',
    topic: 'Arithmetic and geometric sequences',
    generate: (opts) => sequences.generateSequenceUseNthTermGeometric(opts),
    difficulties: ['foundation', 'core', 'stretch'],
  },
  'sequences-geometric-is-term': {
    label: 'Geometric sequences: is it a term?',
    topic: 'Arithmetic and geometric sequences',
    generate: (opts) => sequences.generateSequenceIsInSequenceGeometric(opts),
    difficulties: ['foundation', 'core', 'stretch'],
  },
  'sequences-geometric-pattern': {
    label: 'Geometric sequences: branching pattern',
    topic: 'Arithmetic and geometric sequences',
    generate: (opts) => sequences.generateSequencePatternGeometric(opts),
    difficulties: ['foundation', 'core', 'stretch'],
  },

  // --- Haese 26D: quadratic sequences ---
  'sequences-quadratic-nth-term': {
    label: 'Quadratic sequences: find the nth term rule',
    topic: 'Quadratic and cubic sequences',
    generate: (opts) => sequences.generateSequenceFindNthTermQuadratic(opts),
    difficulties: ['foundation', 'core', 'stretch'],
  },
  'sequences-quadratic-use-nth-term': {
    label: 'Quadratic sequences: use the nth term rule',
    topic: 'Quadratic and cubic sequences',
    generate: (opts) => sequences.generateSequenceUseNthTermQuadratic(opts),
    difficulties: ['foundation', 'core', 'stretch'],
  },
  'sequences-quadratic-is-term': {
    label: 'Quadratic sequences: is it a term?',
    topic: 'Quadratic and cubic sequences',
    generate: (opts) => sequences.generateSequenceIsInSequenceQuadratic(opts),
    difficulties: ['foundation', 'core', 'stretch'],
  },
  'sequences-quadratic-pattern': {
    label: 'Quadratic sequences: dot grid pattern',
    topic: 'Quadratic and cubic sequences',
    generate: (opts) => sequences.generateSequencePatternQuadratic(opts),
    difficulties: ['foundation', 'core', 'stretch'],
  },

  // --- Haese 26D: the difference method and cubic sequences ---
  'sequences-difference-method': {
    label: 'The difference method: naming a sequence',
    topic: 'Quadratic and cubic sequences',
    generate: (opts) => cubicSeq.generateDifferenceMethod(opts),
    difficulties: ['foundation', 'core', 'stretch'],
  },
  'sequences-cubic-nth-term': {
    label: 'Cubic sequences: find the nth term rule',
    topic: 'Quadratic and cubic sequences',
    generate: (opts) => cubicSeq.generateCubicNthTerm(opts),
    difficulties: ['foundation', 'core', 'stretch'],
  },
  'sequences-cubic-use-nth-term': {
    label: 'Cubic sequences: use the nth term rule',
    topic: 'Quadratic and cubic sequences',
    generate: (opts) => cubicSeq.generateCubicUseNthTerm(opts),
    difficulties: ['foundation', 'core', 'stretch'],
  },

  // --- Haese 19, Rayner 5.1-5.3: functions ---
  'function-notation': {
    label: 'Function notation',
    topic: 'Functions',
    generate: (opts) => functions.generateFunctionNotation(opts),
    difficulties: ['foundation', 'core', 'stretch'],
  },
  'domain-range': {
    label: 'Domain and range',
    topic: 'Functions',
    generate: (opts) => functions.generateDomainRange(opts),
    difficulties: ['foundation', 'core', 'stretch'],
  },
  'composite-functions': {
    label: 'Composite functions',
    topic: 'Functions',
    generate: (opts) => functions.generateCompositeFunctions(opts),
    difficulties: ['foundation', 'core', 'stretch'],
  },
  'inverse-functions': {
    label: 'Inverse functions',
    topic: 'Functions',
    generate: (opts) => functions.generateInverseFunctions(opts),
    difficulties: ['foundation', 'core', 'stretch'],
  },
  'absolute-value': {
    label: 'The absolute value function',
    topic: 'Functions',
    generate: (opts) => functions.generateAbsoluteValue(opts),
    difficulties: ['foundation', 'core', 'stretch'],
  },
  'reciprocal-functions': {
    label: 'Reciprocal functions',
    topic: 'Functions',
    generate: (opts) => functions.generateReciprocalFunctions(opts),
    difficulties: ['foundation', 'core', 'stretch'],
  },

  // --- Haese 30A-B: variation ---
  'direct-variation': {
    label: 'Direct variation',
    topic: 'Variation',
    generate: (opts) => variation.generateDirectVariation(opts),
    difficulties: ['foundation', 'core', 'stretch'],
  },
  'inverse-variation': {
    label: 'Inverse variation',
    topic: 'Variation',
    generate: (opts) => variation.generateInverseVariation(opts),
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
  'arithmagon': {
    label: 'Arithmagons',
    topic: 'Puzzles',
    generate: (opts) => arithmagon.generateArithmagon(opts),
    difficulties: ['foundation', 'core', 'stretch'],
  },
  'number-wall': {
    label: 'Number walls',
    topic: 'Puzzles',
    generate: (opts) => arithmagon.generateNumberWall(opts),
    difficulties: ['foundation', 'core', 'stretch'],
  },

  // --- Haese 7: formulae and simultaneous equations -----------------------
  'formula-substitution': {
    label: 'Formula substitution',
    topic: 'Formulae',
    generate: (opts) => formulae.generateFormulaSubstitution(opts),
    difficulties: ['foundation', 'core', 'stretch'],
  },
  'formula-rearrangement': {
    label: 'Formula rearrangement',
    topic: 'Formulae',
    generate: (opts) => formulae.generateFormulaRearrangement(opts),
    difficulties: ['foundation', 'core', 'stretch'],
  },
  'rearrange-harder': {
    label: 'Harder rearranging',
    topic: 'Formulae',
    generate: (opts) => further.generateRearrangeHarder(opts),
    difficulties: ['foundation', 'core', 'stretch'],
  },
  'formula-derivation': {
    label: 'Formula derivation',
    topic: 'Formulae',
    generate: (opts) => formulae.generateFormulaDerivation(opts),
    difficulties: ['foundation', 'core', 'stretch'],
  },
  // A pair of equations set at full display size filled the box and left
  // the teacher nowhere to write the working (questionScale, typeSizing.js).
  'simultaneous-substitution': {
    label: 'Simultaneous equations: substitution',
    topic: 'Simultaneous equations',
    generate: (opts) => formulae.generateSimultaneousSubstitution(opts),
    difficulties: ['foundation', 'core', 'stretch'],
    questionScale: 0.75,
  },
  'simultaneous-elimination': {
    label: 'Simultaneous equations: elimination',
    topic: 'Simultaneous equations',
    generate: (opts) => formulae.generateSimultaneousElimination(opts),
    difficulties: ['foundation', 'core', 'stretch'],
    questionScale: 0.75,
  },
  // --- Y9 Unit 2 do-nows: solving simultaneous equations graphically ---
  'simultaneous-graphical': {
    label: 'Simultaneous equations: solving graphically',
    topic: 'Simultaneous equations',
    generate: (opts) => formulae.generateSimultaneousGraphical(opts),
    difficulties: ['foundation', 'core', 'stretch'],
    // A pair of equations set at full display size filled the box and left
    // the teacher nowhere to write the working (questionScale, typeSizing.js).
    questionScale: 0.75,
  },
  // Last in 'Simultaneous equations': the worded problem comes after the
  // two methods it relies on.
  'simultaneous-problem-solving': {
    label: 'Simultaneous equations: problem solving',
    topic: 'Simultaneous equations',
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

  // --- Haese 9D / Rayner 4.2: circles ---
  // Split across Perimeter and Area rather than a two-skill topic of their
  // own; after the rectilinear skills so each topic still opens on the
  // rectangle.
  'circumference-circle': {
    label: 'Circumference of a circle',
    topic: 'Perimeter',
    generate: (opts) => perim.generateCircumferenceCircle(opts),
    difficulties: ['foundation', 'core', 'stretch'],
  },
  'area-circle': {
    label: 'Area of a circle',
    topic: 'Area',
    generate: (opts) => perim.generateAreaCircle(opts),
    difficulties: ['foundation', 'core', 'stretch'],
  },

  // --- Haese 27A-B: circle theorems, plus tangent theorems not in that backlog ---
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
  'angle-same-segment': {
    label: 'Angles in the same segment',
    topic: 'Circle theorems',
    generate: (opts) => circleThm.generateAngleSameSegment(opts),
    difficulties: ['foundation', 'core', 'stretch'],
  },
  'tangents-from-point': {
    label: 'Tangents from an external point',
    topic: 'Circle theorems',
    generate: (opts) => circleThm.generateTangentsFromPoint(opts),
    difficulties: ['foundation', 'core', 'stretch'],
  },
  'alternate-segment': {
    label: 'The alternate segment theorem',
    topic: 'Circle theorems',
    generate: (opts) => circleThm.generateAlternateSegment(opts),
    difficulties: ['foundation', 'core', 'stretch'],
  },
  // Last in the topic, so the six angle theorems come first: the cycle runs in
  // catalogue order, and these two are the odd ones out — they answer in
  // centimetres rather than degrees.
  'chord-perpendicular-bisector': {
    label: 'Chords: the perpendicular from the centre',
    topic: 'Circle theorems',
    generate: (opts) => circleLen.generateChordBisector(opts),
    difficulties: ['foundation', 'core', 'stretch'],
  },
  'tangent-length': {
    label: 'Tangent length from an external point',
    topic: 'Circle theorems',
    generate: (opts) => circleLen.generateTangentLength(opts),
    difficulties: ['foundation', 'core', 'stretch'],
  },

  // --- Haese 10A, 10D, 10E: percentages ---
  'percentage-of-amount': {
    label: 'Percentage of an amount',
    topic: 'Percentages',
    generate: (opts) => pct.generatePercentageOfAmount(opts),
    difficulties: ['foundation', 'core', 'stretch'],
  },
  'reverse-percentages': {
    label: 'Reverse percentages',
    topic: 'Percentages',
    generate: (opts) => pct.generateReversePercentages(opts),
    difficulties: ['foundation', 'core', 'stretch'],
  },
  'percentage-multiplier': {
    label: 'Finding a multiplier',
    topic: 'Percentages',
    generate: (opts) => pct.generatePercentageMultiplier(opts),
    difficulties: ['foundation', 'core', 'stretch'],
  },
  'multiplier-to-percentage': {
    label: 'Reading a multiplier as a change',
    topic: 'Percentages',
    generate: (opts) => pct.generateMultiplierToPercentage(opts),
    difficulties: ['foundation', 'core', 'stretch'],
  },
  'percentage-change': {
    label: 'Increasing or decreasing by a percentage',
    topic: 'Percentages',
    generate: (opts) => pct.generatePercentageChange(opts),
    difficulties: ['foundation', 'core', 'stretch'],
  },
  'percentage-change-find': {
    label: 'Percentage change, profit and loss',
    topic: 'Percentages',
    generate: (opts) => pct.generatePercentageChangeFind(opts),
    difficulties: ['foundation', 'core', 'stretch'],
  },

  // --- Y9 do-nows: rational numbers ---
  'decimal-percent-to-fraction': {
    label: 'Decimals and percentages to fractions',
    topic: 'Rational numbers',
    generate: (opts) => rational.generateDecimalPercentToFraction(opts),
    difficulties: ['foundation', 'core', 'stretch'],
  },
  'fraction-to-decimal-percent': {
    label: 'Fractions to decimals and percentages',
    topic: 'Rational numbers',
    generate: (opts) => rational.generateFractionToDecimalPercent(opts),
    difficulties: ['foundation', 'core', 'stretch'],
  },
  'recurring-decimals': {
    label: 'Recurring decimals to fractions',
    topic: 'Rational numbers',
    generate: (opts) => rational.generateRecurringDecimals(opts),
    difficulties: ['foundation', 'core', 'stretch'],
  },
  'negative-fractions-add': {
    label: 'Adding and subtracting negative fractions',
    topic: 'Rational numbers',
    generate: (opts) => rational.generateNegativeFractionsAdd(opts),
    difficulties: ['foundation', 'core', 'stretch'],
  },
  'negative-fractions-multiply': {
    label: 'Multiplying and dividing negative fractions',
    topic: 'Rational numbers',
    generate: (opts) => rational.generateNegativeFractionsMultiply(opts),
    difficulties: ['foundation', 'core', 'stretch'],
  },

  // --- Y9 do-nows: order of operations ---
  'order-of-operations': {
    label: 'Order of operations',
    topic: 'Order of operations',
    generate: (opts) => bidmas.generateOrderOfOperations(opts),
    difficulties: ['foundation', 'core', 'stretch'],
  },
  'order-of-operations-tiles': {
    label: 'Number cards: make it true',
    topic: 'Order of operations',
    generate: (opts) => bidmas.generateNumberCards(opts),
    difficulties: ['foundation', 'core', 'stretch'],
  },

  // --- Haese 6B: index laws ---
  'index-laws-multiply-divide': {
    label: 'Multiplying and dividing powers',
    topic: 'Indices',
    generate: (opts) => indexLaws.generateIndexLawsMultiplyDivide(opts),
    difficulties: ['foundation', 'core', 'stretch'],
  },
  'index-laws-power': {
    label: 'A power of a power',
    topic: 'Indices',
    generate: (opts) => indexLaws.generateIndexLawsPower(opts),
    difficulties: ['foundation', 'core', 'stretch'],
  },
  'index-laws-coefficients': {
    label: 'Index laws with coefficients',
    topic: 'Indices',
    generate: (opts) => indexLaws.generateIndexLawsCoefficients(opts),
    difficulties: ['foundation', 'core', 'stretch'],
  },

  // --- Haese 6C: zero and negative indices ---
  'indices-zero-negative': {
    label: 'Zero and negative indices',
    topic: 'Indices',
    generate: (opts) => ch6.generateIndicesZeroNegative(opts),
    difficulties: ['foundation', 'core', 'stretch'],
  },

  // --- Fractional indices (beyond Haese 6C; Y9 do-nows) ---
  'roots-as-powers': {
    label: 'Writing roots as powers',
    topic: 'Indices',
    generate: (opts) => fracPow.generateRootsAsPowers(opts),
    difficulties: ['foundation', 'core', 'stretch'],
  },
  'fractional-powers': {
    label: 'Evaluating fractional powers',
    topic: 'Indices',
    generate: (opts) => fracPow.generateFractionalPowers(opts),
    difficulties: ['foundation', 'core', 'stretch'],
  },
  'index-laws-missing-power': {
    label: 'Index laws: find the missing power',
    topic: 'Indices',
    generate: (opts) => indexLaws.generateIndexMissingPower(opts),
    difficulties: ['foundation', 'core', 'stretch'],
  },
  'exponential-equations': {
    label: 'Exponential equations',
    topic: 'Indices',
    generate: (opts) => indexLaws.generateExponentialEquations(opts),
    difficulties: ['foundation', 'core', 'stretch'],
  },

  // --- Haese 10B, 10C, 10F: profit and interest; 10G, 10H: speed ---
  'profit-loss': {
    label: 'Profit and loss',
    topic: 'Profit and interest',
    generate: (opts) => money.generateProfitLoss(opts),
    difficulties: ['foundation', 'core', 'stretch'],
  },
  'simple-interest': {
    label: 'Simple interest',
    topic: 'Profit and interest',
    generate: (opts) => money.generateSimpleInterest(opts),
    difficulties: ['foundation', 'core', 'stretch'],
  },
  'compound-interest': {
    label: 'Compound interest',
    topic: 'Profit and interest',
    generate: (opts) => money.generateCompoundInterest(opts),
    difficulties: ['foundation', 'core', 'stretch'],
  },
  'speed-distance-time': {
    label: 'Speed, distance and time',
    topic: 'Speed, distance and time',
    generate: (opts) => speed.generateSpeedDistanceTime(opts),
    difficulties: ['foundation', 'core', 'stretch'],
  },
  'travel-graphs': {
    label: 'Travel graphs',
    topic: 'Speed, distance and time',
    generate: (opts) => speed.generateTravelGraphs(opts),
    difficulties: ['foundation', 'core', 'stretch'],
  },

  // --- Haese 31A–E: logarithms ---
  'log-index-form': {
    label: 'Logarithmic and index form',
    topic: 'Logarithms',
    generate: (opts) => logs.generateLogIndexForm(opts),
    difficulties: ['foundation', 'core', 'stretch'],
  },
  'evaluate-logs': {
    label: 'Evaluating logarithms',
    topic: 'Logarithms',
    generate: (opts) => logs.generateEvaluateLogs(opts),
    difficulties: ['foundation', 'core', 'stretch'],
  },
  'log-single': {
    label: 'Writing as a single logarithm',
    topic: 'Logarithms',
    generate: (opts) => logs.generateLogSingle(opts),
    difficulties: ['foundation', 'core', 'stretch'],
  },
  'log-in-terms': {
    label: 'Logarithms in terms of p and q',
    topic: 'Logarithms',
    generate: (opts) => logs.generateLogInTerms(opts),
    difficulties: ['foundation', 'core', 'stretch'],
  },
  'log-remove': {
    label: 'Equations without logarithms',
    topic: 'Logarithms',
    generate: (opts) => logs.generateLogRemove(opts),
    difficulties: ['foundation', 'core', 'stretch'],
  },
  'log-solve-exponential': {
    label: 'Solving exponential equations with logarithms',
    topic: 'Logarithms',
    generate: (opts) => logs.generateLogSolveExponential(opts),
    difficulties: ['foundation', 'core', 'stretch'],
  },
  'log-equations': {
    label: 'Solving logarithmic equations',
    topic: 'Logarithms',
    generate: (opts) => logs.generateLogEquations(opts),
    difficulties: ['foundation', 'core', 'stretch'],
  },

  // --- Haese 6D: standard form ---
  'standard-form-write': {
    label: 'Writing in standard form',
    topic: 'Standard form',
    generate: (opts) => ch6.generateStandardFormWrite(opts),
    difficulties: ['foundation', 'core', 'stretch'],
  },
  'standard-form-ordinary': {
    label: 'Standard form as an ordinary number',
    topic: 'Standard form',
    generate: (opts) => ch6.generateStandardFormOrdinary(opts),
    difficulties: ['foundation', 'core', 'stretch'],
  },
  'standard-form-multiply-divide': {
    label: 'Multiplying and dividing in standard form',
    topic: 'Standard form',
    generate: (opts) => ch6.generateStandardFormMultiplyDivide(opts),
    difficulties: ['foundation', 'core', 'stretch'],
  },
  'standard-form-add-subtract': {
    label: 'Adding and subtracting in standard form',
    topic: 'Standard form',
    generate: (opts) => ch6.generateStandardFormAddSubtract(opts),
    difficulties: ['foundation', 'core', 'stretch'],
  },

  // --- Haese 6E-6H: surds ---
  // Each surd skill asks the same kind of question at every band (see
  // chapter6Generators.js), so Mixed can put any of them in any box.
  'surds-simplify': {
    label: 'Simplifying surds',
    topic: 'Surds',
    generate: (opts) => ch6.generateSurdsSimplify(opts),
    difficulties: ['foundation', 'core', 'stretch'],
  },
  'surds-add': {
    label: 'Adding and subtracting surds',
    topic: 'Surds',
    generate: (opts) => ch6.generateSurdsAdd(opts),
    difficulties: ['foundation', 'core', 'stretch'],
  },
  'surds-multiply': {
    label: 'Multiplying and dividing surds',
    topic: 'Surds',
    generate: (opts) => ch6.generateSurdsMultiply(opts),
    difficulties: ['foundation', 'core', 'stretch'],
  },
  'surds-expand': {
    label: 'Expanding brackets with surds',
    topic: 'Surds',
    generate: (opts) => ch6.generateSurdsExpand(opts),
    difficulties: ['foundation', 'core', 'stretch'],
  },
  'rationalise-denominator': {
    label: 'Rationalising the denominator',
    topic: 'Surds',
    generate: (opts) => ch6.generateRationaliseDenominator(opts),
    difficulties: ['foundation', 'core', 'stretch'],
  },

  // --- Haese 2D-2F, Rayner 12: Venn diagrams ---
  'venn-counts': {
    label: 'Venn diagrams: counting',
    topic: 'Sets',
    generate: (opts) => sets.generateVennCounts(opts),
    difficulties: ['foundation', 'core', 'stretch'],
  },
  'venn-place-elements': {
    label: 'Venn diagrams: placing elements',
    topic: 'Sets',
    generate: (opts) => sets.generateVennPlaceElements(opts),
    difficulties: ['foundation', 'core', 'stretch'],
  },
  'venn-set-operations': {
    label: 'Venn diagrams: set operations',
    topic: 'Sets',
    generate: (opts) => sets.generateVennSetOperations(opts),
    difficulties: ['foundation', 'core', 'stretch'],
  },
  'venn-notation': {
    label: 'Venn diagrams: set notation',
    topic: 'Sets',
    generate: (opts) => sets.generateVennNotation(opts),
    difficulties: ['foundation', 'core', 'stretch'],
  },
  'venn-probability': {
    label: 'Venn diagrams: probability',
    topic: 'Sets',
    generate: (opts) => sets.generateVennProbability(opts),
    difficulties: ['foundation', 'core', 'stretch'],
  },

  // --- Haese 25A, 25F: one draw ---
  // Ahead of tree-diagrams in the same topic, so ↻ steps from one draw to two.
  'simple-probability': {
    label: 'Simple probability',
    topic: 'Probability',
    generate: (opts) => probability.generateSimpleProbability(opts),
    difficulties: ['foundation', 'core', 'stretch'],
  },

  // --- Haese 25B-G: from experiments, tables and sample spaces ---
  'relative-frequency': {
    label: 'Relative frequency',
    topic: 'Probability',
    generate: (opts) => probMore.generateRelativeFrequency(opts),
    difficulties: ['foundation', 'core', 'stretch'],
  },
  'two-way-tables': {
    label: 'Two-way tables',
    topic: 'Probability',
    generate: (opts) => probMore.generateTwoWayTables(opts),
    difficulties: ['foundation', 'core', 'stretch'],
  },
  'expectation': {
    label: 'Expectation',
    topic: 'Probability',
    generate: (opts) => probMore.generateExpectation(opts),
    difficulties: ['foundation', 'core', 'stretch'],
  },
  'sample-spaces': {
    label: 'Sample spaces',
    topic: 'Probability',
    generate: (opts) => probMore.generateSampleSpaces(opts),
    difficulties: ['foundation', 'core', 'stretch'],
  },
  'independent-events': {
    label: 'Independent events',
    topic: 'Probability',
    generate: (opts) => probMore.generateIndependentEvents(opts),
    difficulties: ['foundation', 'core', 'stretch'],
  },

  // --- Haese 25H-I: tree diagrams ---
  'tree-diagrams': {
    label: 'Tree diagrams',
    topic: 'Probability',
    generate: (opts) => trees.generateTreeDiagrams(opts),
    difficulties: ['foundation', 'core', 'stretch'],
  },

  // --- Haese 25J: mutually exclusive or not ---
  'either-or': {
    label: 'Either or: the addition rule',
    topic: 'Probability',
    generate: (opts) => probMore.generateEitherOr(opts),
    difficulties: ['foundation', 'core', 'stretch'],
  },

  // --- Haese 13A: variables used in statistics ---
  'data-types': {
    label: 'Types of data',
    topic: 'Representing data',
    generate: (opts) => dataTypes.generateDataTypes(opts),
    difficulties: ['foundation', 'core', 'stretch'],
  },

  // --- Haese 13C-F, 17A: averages ---
  'averages-from-list': {
    label: 'Averages from a list',
    topic: 'Averages',
    generate: (opts) => stats.generateAveragesFromList(opts),
    difficulties: ['foundation', 'core', 'stretch'],
  },
  'frequency-table-reading': {
    label: 'Reading a frequency table',
    topic: 'Representing data',
    generate: (opts) => freqTable.generateFrequencyTableReading(opts),
    difficulties: ['foundation', 'core', 'stretch'],
  },
  'averages-from-table': {
    label: 'Averages from a frequency table',
    topic: 'Averages',
    generate: (opts) => stats.generateAveragesFromTable(opts),
    difficulties: ['foundation', 'core', 'stretch'],
  },
  'estimated-mean': {
    label: 'Estimated mean of grouped data',
    topic: 'Averages',
    generate: (opts) => stats.generateEstimatedMean(opts),
    difficulties: ['foundation', 'core', 'stretch'],
  },
  'mean-missing-value': {
    label: 'Finding a missing value from the mean',
    topic: 'Averages',
    generate: (opts) => stats.generateMeanMissingValue(opts),
    difficulties: ['foundation', 'core', 'stretch'],
  },
  'modal-class': {
    label: 'Modal class of grouped data',
    topic: 'Averages',
    generate: (opts) => displays.generateModalClass(opts),
    difficulties: ['foundation', 'core', 'stretch'],
  },
  'median-class': {
    label: 'Class containing the median',
    topic: 'Averages',
    generate: (opts) => displays.generateMedianClass(opts),
    difficulties: ['foundation', 'core', 'stretch'],
  },
  'table-averages': {
    label: 'Mean, mode and median from a table',
    topic: 'Averages',
    generate: (opts) => freqTable.generateTableAverages(opts),
    difficulties: ['foundation', 'core', 'stretch'],
  },
  // --- Haese 17C: cumulative frequency, the table only ---
  'cumulative-frequency-table': {
    label: 'Cumulative frequency tables',
    topic: 'Representing data',
    generate: (opts) => freqTable.generateCumulativeFrequencyTable(opts),
    difficulties: ['foundation', 'core', 'stretch'],
  },
  'stem-and-leaf-averages': {
    label: 'Averages from a stem-and-leaf plot',
    topic: 'Averages',
    generate: (opts) => displays.generateStemAndLeafAverages(opts),
    difficulties: ['foundation', 'core', 'stretch'],
  },
  'pie-charts': {
    label: 'Reading pie charts',
    topic: 'Representing data',
    generate: (opts) => pie.generatePieCharts(opts),
    difficulties: ['foundation', 'core', 'stretch'],
  },
  'pie-chart-angles': {
    label: 'Drawing pie charts',
    topic: 'Representing data',
    generate: (opts) => pie.generatePieChartAngles(opts),
    difficulties: ['foundation', 'core', 'stretch'],
  },
  'bar-charts': {
    label: 'Bar charts',
    topic: 'Representing data',
    generate: (opts) => bars.generateBarCharts(opts),
    difficulties: ['foundation', 'core', 'stretch'],
  },
  // --- Haese 13D-E, 13G: spread ---
  'quartiles-iqr': {
    label: 'Quartiles and the interquartile range',
    topic: 'Spread',
    generate: (opts) => spread.generateQuartilesIqr(opts),
    difficulties: ['foundation', 'core', 'stretch'],
  },
  'five-number-summary': {
    label: 'Five-number summary and box plot',
    topic: 'Spread',
    generate: (opts) => boxPlots.generateFiveNumberSummary(opts),
    difficulties: ['foundation', 'core', 'stretch'],
  },
  'box-plot-reading': {
    label: 'Reading box plots',
    topic: 'Spread',
    generate: (opts) => boxPlots.generateBoxPlotReading(opts),
    difficulties: ['foundation', 'core', 'stretch'],
  },
  'compare-distributions': {
    label: 'Comparing two data sets',
    topic: 'Spread',
    generate: (opts) => spread.generateCompareDistributions(opts),
    difficulties: ['foundation', 'core', 'stretch'],
  },
  // --- Haese 22A-B, Rayner 14.5: scatter graphs ---
  'scatter-correlation': {
    label: 'Scatter graphs: correlation',
    topic: 'Scatter graphs',
    generate: (opts) => scatter.generateScatterCorrelation(opts),
    difficulties: ['foundation', 'core', 'stretch'],
  },
  'line-of-best-fit': {
    label: 'Line of best fit',
    topic: 'Scatter graphs',
    generate: (opts) => scatter.generateLineOfBestFit(opts),
    difficulties: ['foundation', 'core', 'stretch'],
  },
  'mean-point': {
    label: 'The mean point',
    topic: 'Scatter graphs',
    generate: (opts) => scatter.generateMeanPoint(opts),
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
 * Display order for the topic panel, grouped into curriculum strands.
 *
 * Kept deliberately separate from the catalogue's physical order: where a
 * skill sits in this file and where a teacher sees it on screen are different
 * decisions, and adding a skill should never silently reshuffle the panel.
 *
 * Within a strand, topics run in the textbook's order: by the first Haese
 * section (haese-igcse.json) that uses one of their skills. A topic the
 * book takes as assumed knowledge, with no section of its own (order of
 * operations, fractions), goes first in its strand. topicOrder.test.js holds
 * the panel to that rule.
 */
export const STRANDS = [
  {
    name: 'Number',
    topics: [
      'Order of operations',
      'Rational numbers',
      'Surds',
      'Indices',
      'Standard form',
      'Percentages',
      'Profit and interest',
      'Speed, distance and time',
      'Logarithms',
    ],
  },
  {
    name: 'Algebra',
    topics: [
      'Expanding brackets',
      'Factorising',
      'Equations',
      'Inequalities',
      'Formulae',
      'Simultaneous equations',
      'Algebraic fractions',
      'Functions',
      'Quadratic equations',
      'Quadratic graphs',
      'Arithmetic and geometric sequences',
      'Quadratic and cubic sequences',
      'Variation',
    ],
  },
  {
    name: 'Geometry',
    topics: [
      'Angle facts',
      'Parallel lines and polygons',
      'Pythagoras and trigonometry',
      'Coordinate geometry',
      'Straight-line graphs',
      'Similarity',
      'Transformations',
      'Vectors',
      'Circle theorems',
      'Further trigonometry',
    ],
  },
  { name: 'Mensuration', topics: ['Perimeter', 'Area', 'Surface area', 'Volume'] },
  // Sets sits here rather than in Number: Venn diagrams lead into
  // probability from a diagram, and the scheme teaches them together.
  { name: 'Statistics and probability', topics: ['Sets', 'Representing data', 'Averages', 'Spread', 'Scatter graphs', 'Probability'] },
  { name: 'Problem solving', topics: ['Puzzles'] },
];

const catalogueTopics = () => {
  const seen = [];
  skillIds.forEach((id) => {
    const t = skills[id].topic;
    if (!seen.includes(t)) seen.push(t);
  });
  return seen;
};

/**
 * Topics grouped for the panel. Anything not listed in STRANDS lands in
 * "Other" at the end, so a topic added without a STRANDS entry doesn't
 * silently disappear from the panel.
 */
export const topicGroups = () => {
  const all = catalogueTopics();
  const listed = STRANDS.flatMap((s) => s.topics);
  const groups = STRANDS.map((s) => ({ name: s.name, topics: s.topics.filter((t) => all.includes(t)) }));
  const rest = all.filter((t) => !listed.includes(t));
  return rest.length ? [...groups, { name: 'Other', topics: rest }] : groups;
};

/** The strand a topic sits in ('Number', 'Algebra', ...), or null. */
export const strandOf = (topicName) => STRANDS.find((s) => s.topics.includes(topicName))?.name ?? null;

/** Every topic once, in panel order. */
export const topics = () => topicGroups().flatMap((g) => g.topics);

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