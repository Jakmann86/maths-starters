// src/generators/geometry/sohcahtoaGenerators.js
//
// Haese 15B — right-angled trigonometry. Shares the right-triangle figure
// with pythagorasGenerators.js: side 'a' is the left (vertical) leg, 'b' the
// base leg, 'c' the hypotenuse (see Figure.jsx). Which of those two legs is
// "opposite" vs "adjacent" depends on which vertex carries the marked angle,
// so angleAt is chosen at random per call and sideRoles() below resolves the
// mapping — this is what makes the figure vary rather than always marking
// the same corner.
//
// No worded/context problems here (ladder-against-a-wall etc.) — that's a
// separate skill for later, not a Stretch band of this one.

import _ from 'lodash';

const NL = '\n';
const toSig3 = (n) => n.toPrecision(3); // string, so a significant trailing zero survives
const round1 = (n) => Math.round(n * 10) / 10;
const toRad = (deg) => (deg * Math.PI) / 180;

const RATIO_FN = { sin: Math.sin, cos: Math.cos, tan: Math.tan };
const INVERSE_FN = { sin: Math.asin, cos: Math.acos, tan: Math.atan };

// sin = opposite/hypotenuse, cos = adjacent/hypotenuse, tan = opposite/adjacent.
const RATIO_ROLES = {
  sin: { num: 'opposite', den: 'hypotenuse' },
  cos: { num: 'adjacent', den: 'hypotenuse' },
  tan: { num: 'opposite', den: 'adjacent' },
};

// The vertex the angle sits at decides which leg is opposite vs adjacent;
// the hypotenuse is always 'c'.
const sideRoles = (angleAt) => (angleAt === 'top'
  ? { opposite: 'b', adjacent: 'a', hypotenuse: 'c' }
  : { opposite: 'a', adjacent: 'b', hypotenuse: 'c' });

// generateSohcahtoaFindSide -----------------------------------------------
//   Foundation  integer angle 20-70, sin/cos only, hypotenuse always given  answer 3 s.f.
//   Core        integer angle 10-80, any ratio (incl. tan), either of the
//               ratio's two sides may be the given one                      answer 3 s.f.
//   Stretch     as Core, but the given side may be a 1 d.p. value too       answer 3 s.f.
export const generateSohcahtoaFindSide = (options = {}) => {
  const { difficulty = 'core' } = options;
  const angleAt = _.sample(['top', 'bottomRight']);
  const roles = sideRoles(angleAt);

  const ratio = difficulty === 'foundation' ? _.sample(['sin', 'cos']) : _.sample(['sin', 'cos', 'tan']);
  const { num, den } = RATIO_ROLES[ratio];

  const angle = difficulty === 'foundation' ? _.random(20, 70) : _.random(10, 80);
  // Foundation always gives the hypotenuse (= 'den' for sin/cos), so the leg is unknown.
  const unknownRole = difficulty === 'foundation' ? num : _.sample([num, den]);
  const givenRole = unknownRole === num ? den : num;

  const oneDp = difficulty === 'stretch';
  const givenValue = oneDp ? round1(_.random(5, 30, true)) : _.random(5, 30);

  const r = RATIO_FN[ratio](toRad(angle));
  const unknownValue = toSig3(unknownRole === num ? givenValue * r : givenValue / r);

  const givenLetter = roles[givenRole];
  const unknownLetter = roles[unknownRole];
  const sideLabels = { [givenLetter]: `${givenValue} cm`, [unknownLetter]: 'x' };

  const eq1 = unknownRole === num
    ? `\\text{${ratio}}(${angle}^\\circ) = \\frac{x}{${givenValue}}`
    : `\\text{${ratio}}(${angle}^\\circ) = \\frac{${givenValue}}{x}`;
  const eq2 = unknownRole === num
    ? `x = ${givenValue} \\times \\text{${ratio}}(${angle}^\\circ)`
    : `x = \\frac{${givenValue}}{\\text{${ratio}}(${angle}^\\circ)}`;
  const steps = [eq1, eq2, `x = ${unknownValue} \\text{ (3 s.f.)}`];

  return {
    instruction: 'Find the length of the marked side',
    answer: `x = ${unknownValue}`,
    answerUnits: 'cm',
    workingOut: steps.join(NL),
    visualization: {
      type: 'right-triangle',
      a: sideLabels.a,
      b: sideLabels.b,
      c: sideLabels.c,
      unknown: unknownLetter,
      angleAt,
      angleLabel: `${angle}^\\circ`,
      big: 1,
    },
    metadata: { topic: 'sohcahtoa-find-side', difficulty },
  };
};

// generateSohcahtoaFindAngle -----------------------------------------------
// Two of the three sides are given outright (no angle is chosen up front —
// the angle falls out of their ratio), so no side is "the unknown": the
// figure instead sets unknown: '' (Figure.jsx's right-triangle branch
// defaults an absent `unknown` to 'c' for pythagoras-hypotenuse's sake, so
// an explicit empty string is needed here to opt out of colouring any side)
// and unknownAngle: true, which colours the angle marker itself instead.
//   Foundation  opposite & adjacent only (tan), both integers under 15      answer 1 d.p.
//   Core        any two sides, any ratio, values up to 30                   answer 1 d.p.
//   Stretch     as Core, with one given side to 1 d.p.
export const generateSohcahtoaFindAngle = (options = {}) => {
  const { difficulty = 'core' } = options;
  const angleAt = _.sample(['top', 'bottomRight']);
  const roles = sideRoles(angleAt);

  const ratio = difficulty === 'foundation' ? 'tan' : _.sample(['sin', 'cos', 'tan']);
  const oneDp = difficulty === 'stretch';
  const { num, den } = RATIO_ROLES[ratio];
  let numValue, denValue;

  if (ratio === 'tan') {
    const maxV = difficulty === 'foundation' ? 14 : 30;
    numValue = _.random(2, maxV);
    denValue = _.random(2, maxV);
    if (oneDp) {
      if (_.sample([true, false])) numValue = round1(_.random(2, maxV, true));
      else denValue = round1(_.random(2, maxV, true));
    }
  } else {
    // sin/cos: the leg (numerator) must stay strictly under the hypotenuse
    // (denominator) so the ratio is < 1 and the inverse trig is defined.
    denValue = _.random(6, 30);
    numValue = _.random(2, denValue - 1);
    if (oneDp) {
      if (_.sample([true, false])) denValue = round1(_.random(numValue + 1, 30, true));
      else numValue = round1(_.random(2, denValue - 1, true));
    }
  }

  const angleDeg = round1((INVERSE_FN[ratio](numValue / denValue) * 180) / Math.PI);

  const numLetter = roles[num];
  const denLetter = roles[den];
  const sideLabels = { [numLetter]: `${numValue} cm`, [denLetter]: `${denValue} cm` };

  const steps = [
    `\\text{${ratio}}(x) = \\frac{${numValue}}{${denValue}}`,
    `x = \\text{${ratio}}^{-1}(\\frac{${numValue}}{${denValue}})`,
    `x = ${angleDeg}^\\circ \\text{ (1 d.p.)}`,
  ];

  return {
    instruction: 'Find the marked angle',
    answer: `x = ${angleDeg}^\\circ`,
    workingOut: steps.join(NL),
    visualization: {
      type: 'right-triangle',
      a: sideLabels.a,
      b: sideLabels.b,
      c: sideLabels.c,
      unknown: '',
      angleAt,
      angleLabel: 'x',
      unknownAngle: true,
      big: 1,
    },
    metadata: { topic: 'sohcahtoa-find-angle', difficulty },
  };
};
