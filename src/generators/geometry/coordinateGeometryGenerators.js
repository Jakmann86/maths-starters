// src/generators/geometry/coordinateGeometryGenerators.js
//
// Haese chapter 12 (coordinate geometry) and chapter 14 (straight lines).
//
//   distance-between-points            12B
//   midpoint-of-segment                12C
//   gradient-of-segment                12D
//   parallel-perpendicular-gradients   12E
//   equation-of-a-line                 14C
//   line-general-form                  14D
//   point-on-line                      14C Q8 / 14D Q6
//
// Three of these use the `coordinate-grid` figure at Foundation, where the
// question is read off a drawn graph, and coordinates in questionMath above
// that. That is the band step: read it off, then work from the numbers, then
// work backwards.
//
// Not here, because they need more from the figure than it currently does:
// graphing a line from its equation (14E) and lines of symmetry (14F).
//
// "Does (3, 7) lie on this line" is not here either — a yes/no answer does
// not belong on a board. Haese's own version is better and numeric: find a
// given that (3, a) lies on the line.
//
// `instruction` is plain text (Slot renders it as-is), so a given gradient
// never goes in it: `\frac{3}{2}` would print with its backslash. It goes on
// a second line of questionMath instead, as formulaGenerators already does.

import _ from 'lodash';

const NL = '\n';

const gcd = (a, b) => (b ? gcd(b, Math.abs(a % b)) : Math.abs(a));

/** A signed fraction in lowest terms, as LaTeX. Whole numbers stay whole. */
function frac(num, den) {
  if (den < 0) { num = -num; den = -den; }
  const g = gcd(num, den) || 1;
  const n = num / g;
  const d = den / g;
  if (d === 1) return String(n);
  return n < 0 ? `-\\frac{${-n}}{${d}}` : `\\frac{${n}}{${d}}`;
}

/** `+ 3`, `- 4`, or nothing at all when the constant is zero. */
const signed = (c) => (c === 0 ? '' : ` ${c < 0 ? '-' : '+'} ${Math.abs(c)}`);

/** A coefficient in front of a letter: 1 and -1 lose the digit. */
const coef = (v) => (v === 1 ? '' : (v === -1 ? '-' : String(v)));

/** A fractional gradient in front of x: 1 and -1 lose the digit. */
const mx = (mNum, mDen) => {
  const m = frac(mNum, mDen);
  return m === '1' ? '' : (m === '-1' ? '-' : m);
};

/** y = mx + c, with m as a fraction and the 1s and 0s tidied away. */
function lineEquation(mNum, mDen, c) {
  if (mNum === 0) return `y = ${c}`;
  return `y = ${mx(mNum, mDen)}x${signed(c)}`;
}

/** ax + by = d, with the 1s tidied away. */
function generalForm(a, b, d) {
  const by = b === 1 ? '+ y' : (b === -1 ? '- y' : (b < 0 ? `- ${-b}y` : `+ ${b}y`));
  return `${coef(a)}x ${by} = ${d}`;
}

// A plain comma: `,\\ ` is outside the Archivo subset (so questionMath would
// fall back to KaTeX for a thin space) and `instruction` is plain text, where
// the backslash would simply print.
const point = (x, y) => `(${x}, ${y})`;

/** A value as it should appear inside a sum: -4 becomes (-4), not "+ -4". */
const br = (v) => (v < 0 ? `(${v})` : String(v));

/** A number for plain-text instruction: a true minus sign, as the parser gives questionMath. */
const txt = (v) => String(v).replace('-', '−');

/** Pythagorean triples by Euclid's formula, never a hardcoded list. */
function buildTriples(limit) {
  const out = [];
  for (let m = 2; m * m <= limit; m += 1) {
    for (let n = 1; n < m; n += 1) {
      if ((m - n) % 2 === 0 || gcd(m, n) !== 1) continue;
      for (let k = 1; k * (m * m + n * n) <= limit; k += 1) {
        out.push([k * (m * m - n * n), k * (2 * m * n), k * (m * m + n * n)]);
      }
    }
  }
  return out;
}
const TRIPLES = buildTriples(70);

/** sqrt(n) in exact simplified form. */
function surd(n) {
  let outside = 1;
  let inside = n;
  for (let f = 2; f * f <= inside; f += 1) {
    while (inside % (f * f) === 0) { inside /= f * f; outside *= f; }
  }
  if (inside === 1) return String(outside);
  return outside === 1 ? `\\sqrt{${inside}}` : `${outside}\\sqrt{${inside}}`;
}

const gridOf = (a, b, labels = ['A', 'B']) => ({
  type: 'coordinate-grid',
  points: [{ x: a[0], y: a[1], label: labels[0] }, { x: b[0], y: b[1], label: labels[1] }],
  segment: [a, b],
  // The grid is the whole question at Foundation, like a circle theorem.
  big: 1,
});

/**
 * Two points a triple apart. `maxLeg` keeps the Foundation pair inside a grid
 * a teacher can actually read — the 7-24-25 triple puts a point at y = -27 and
 * the drawn grid is then fifty squares tall.
 */
function triplePair(spread, maxLeg = 99) {
  const usable = TRIPLES.filter((t) => t[0] <= maxLeg && t[1] <= maxLeg);
  const [p, q] = _.shuffle(_.sample(usable).slice(0, 2));
  const dx = _.sample([-1, 1]) * p;
  const dy = _.sample([-1, 1]) * q;
  const ax = _.random(-spread, spread);
  const ay = _.random(-spread, spread);
  return [[ax, ay], [ax + dx, ay + dy]];
}

/* ------------------------------------------------------------ 12B distance */

export const generateDistanceBetweenPoints = (options = {}) => {
  const { difficulty = 'core' } = options;

  if (difficulty === 'stretch') {
    for (;;) {
      const ax = _.random(-5, 5);
      const ay = _.random(-5, 5);
      const dx = _.random(-7, 7);
      const dy = _.random(-7, 7);
      const d2 = dx * dx + dy * dy;
      if (d2 === 0) continue;
      const exact = surd(d2);
      // A whole answer here would be the Core band with extra steps.
      if (!exact.includes('\\sqrt')) continue;
      const b = [ax + dx, ay + dy];
      return {
        instruction: 'Find the exact distance AB',
        questionMath: `A${point(ax, ay)} \\text{ and } B${point(b[0], b[1])}`,
        questionMathCompact: true,
        answer: exact,
        workingOut: [
          `AB^2 = (${dx})^2 + (${dy})^2`,
          `AB^2 = ${d2}`,
          `AB = ${exact}`,
        ].join(NL),
        metadata: { topic: 'distance-between-points', difficulty },
      };
    }
  }

  const [a, b] = difficulty === 'foundation' ? triplePair(2, 15) : triplePair(5);
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const d = Math.round(Math.sqrt(dx * dx + dy * dy));
  const working = [
    `AB^2 = (${dx})^2 + (${dy})^2`,
    `AB^2 = ${dx * dx} + ${dy * dy} = ${dx * dx + dy * dy}`,
    `AB = ${d}`,
  ].join(NL);

  if (difficulty === 'foundation') {
    return {
      instruction: 'Find the length of AB',
      answer: String(d),
      workingOut: working,
      visualization: gridOf(a, b),
      metadata: { topic: 'distance-between-points', difficulty },
    };
  }
  return {
    instruction: 'Find the distance AB',
    questionMath: `A${point(a[0], a[1])} \\text{ and } B${point(b[0], b[1])}`,
    questionMathCompact: true,
    answer: String(d),
    workingOut: working,
    metadata: { topic: 'distance-between-points', difficulty },
  };
};

/* ------------------------------------------------------------ 12C midpoint */

export const generateMidpoint = (options = {}) => {
  const { difficulty = 'core' } = options;

  if (difficulty === 'stretch') {
    // Reversed: the midpoint and one end are given, the other end is wanted.
    const mx = _.random(-4, 4);
    const my = _.random(-4, 4);
    const dx = _.random(1, 5) * _.sample([-1, 1]);
    const dy = _.random(1, 5) * _.sample([-1, 1]);
    const a = [mx - dx, my - dy];
    const b = [mx + dx, my + dy];
    return {
      instruction: 'M is the midpoint of AB. Find the coordinates of B',
      questionMath: `A${point(a[0], a[1])} \\text{ and } M${point(mx, my)}`,
      questionMathCompact: true,
      answer: point(b[0], b[1]),
      workingOut: [
        `x = 2 \\times ${br(mx)} - ${br(a[0])} = ${b[0]}`,
        `y = 2 \\times ${br(my)} - ${br(a[1])} = ${b[1]}`,
        `B = ${point(b[0], b[1])}`,
      ].join(NL),
      metadata: { topic: 'midpoint-of-segment', difficulty },
    };
  }

  // Foundation midpoints land on whole numbers; Core may land on a half,
  // which is the step that makes averaging visible rather than obvious.
  const foundation = difficulty === 'foundation';
  let a;
  let b;
  for (;;) {
    // Foundation stays in the first quadrant but runs to 8, not 5: the
    // parity and "both coordinates must move" constraints cut the pool hard,
    // and 0-5 left only 144 distinct questions.
    const hi = foundation ? 8 : 5;
    a = [_.random(foundation ? 0 : -5, hi), _.random(foundation ? 0 : -5, hi)];
    b = [_.random(foundation ? 0 : -5, hi), _.random(foundation ? 0 : -5, hi)];
    if (a[0] === b[0] && a[1] === b[1]) continue;
    const whole = (a[0] + b[0]) % 2 === 0 && (a[1] + b[1]) % 2 === 0;
    if (foundation && (!whole || a[0] < 0 || a[1] < 0 || b[0] < 0 || b[1] < 0)) continue;
    // A vertical or horizontal segment only exercises one of the two averages.
    if (foundation && (a[0] === b[0] || a[1] === b[1])) continue;
    if (!foundation && whole) continue;
    break;
  }
  // Halve then format, rather than truncate then append ".5". The old way
  // turned -5/2 into "-3.5": truncation rounds a negative away from the
  // value, and the appended half then compounds it in the wrong direction.
  const half = (u, v) => {
    const t = (u + v) / 2;
    return Number.isInteger(t) ? String(t) : t.toFixed(1);
  };
  const answer = `(${half(a[0], b[0])}, ${half(a[1], b[1])})`;
  const working = [
    `x = \\frac{${a[0]} + ${br(b[0])}}{2} = ${half(a[0], b[0])}`,
    `y = \\frac{${a[1]} + ${br(b[1])}}{2} = ${half(a[1], b[1])}`,
  ].join(NL);

  if (foundation) {
    return {
      instruction: 'Find the midpoint of AB',
      answer,
      workingOut: working,
      visualization: gridOf(a, b),
      metadata: { topic: 'midpoint-of-segment', difficulty },
    };
  }
  return {
    instruction: 'Find the midpoint of AB',
    questionMath: `A${point(a[0], a[1])} \\text{ and } B${point(b[0], b[1])}`,
    questionMathCompact: true,
    answer,
    workingOut: working,
    metadata: { topic: 'midpoint-of-segment', difficulty },
  };
};

/* ------------------------------------------------------------ 12D gradient */

export const generateGradientOfSegment = (options = {}) => {
  const { difficulty = 'core' } = options;

  if (difficulty === 'stretch') {
    // Reversed: the gradient is given and one coordinate is missing.
    for (;;) {
      const num = _.random(1, 5) * _.sample([-1, 1]);
      const den = _.random(1, 4);
      if (gcd(num, den) !== 1) continue;
      const a = [_.random(-5, 3), _.random(-5, 3)];
      const steps = _.random(1, 3);
      const b = [a[0] + den * steps, a[1] + num * steps];
      return {
        instruction: 'Find k',
        questionMath: `A${point(a[0], a[1])} \\text{ and } B(${b[0]}, k)${NL}\\text{gradient of } AB = ${frac(num, den)}`,
        questionMathCompact: true,
        answer: `k = ${b[1]}`,
        workingOut: [
          `\\frac{k - ${br(a[1])}}{${b[0]} - ${br(a[0])}} = ${frac(num, den)}`,
          `k - ${br(a[1])} = ${b[1] - a[1]}`,
          `k = ${b[1]}`,
        ].join(NL),
        metadata: { topic: 'gradient-of-segment', difficulty },
      };
    }
  }

  const foundation = difficulty === 'foundation';
  let a;
  let b;
  for (;;) {
    a = [_.random(-4, 2), _.random(-4, 2)];
    // A one-square run makes "count the steps" meaningless at Foundation.
    const dx = foundation ? _.random(2, 3) : _.random(1, 5) * _.sample([-1, 1]);
    const dy = foundation ? _.random(1, 5) * dx : _.random(1, 6) * _.sample([-1, 1]);
    b = [a[0] + dx, a[1] + dy];
    if (b[0] > 8 || b[1] > 12 || b[1] < -8) continue;
    // Foundation gradients are positive whole numbers; Core's are fractions
    // or negative, so the simplifying and the sign are the new work.
    const whole = dy % dx === 0;
    if (foundation && (!whole || dy / dx < 1)) continue;
    if (!foundation && whole && dy / dx > 0) continue;
    break;
  }
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const working = [
    `m = \\frac{${b[1]} - ${br(a[1])}}{${b[0]} - ${br(a[0])}}`,
    `m = \\frac{${dy}}{${dx}} = ${frac(dy, dx)}`,
  ].join(NL);

  if (foundation) {
    return {
      instruction: 'Find the gradient of AB',
      answer: frac(dy, dx),
      workingOut: working,
      visualization: gridOf(a, b),
      metadata: { topic: 'gradient-of-segment', difficulty },
    };
  }
  return {
    instruction: 'Find the gradient of AB',
    questionMath: `A${point(a[0], a[1])} \\text{ and } B${point(b[0], b[1])}`,
    questionMathCompact: true,
    answer: frac(dy, dx),
    workingOut: working,
    metadata: { topic: 'gradient-of-segment', difficulty },
  };
};

/* ------------------------------ 12E parallel and perpendicular gradients */

export const generateParallelPerpendicular = (options = {}) => {
  const { difficulty = 'core' } = options;
  const num = _.random(1, 8) * _.sample([-1, 1]);
  const den = _.random(1, 6);

  if (difficulty === 'foundation') {
    const c = _.random(-6, 6);
    return {
      instruction: 'Find the gradient of a line parallel to this one',
      questionMath: lineEquation(num, den, c),
      questionMathCompact: true,
      answer: frac(num, den),
      workingOut: [
        `\\text{parallel lines have equal gradients}`,
        `m = ${frac(num, den)}`,
      ].join(NL),
      metadata: { topic: 'parallel-perpendicular-gradients', difficulty },
    };
  }

  if (difficulty === 'core') {
    const c = _.random(-6, 6);
    return {
      instruction: 'Find the gradient of a line perpendicular to this one',
      questionMath: lineEquation(num, den, c),
      questionMathCompact: true,
      answer: frac(-den, num),
      workingOut: [
        `m = ${frac(num, den)}`,
        `\\text{perpendicular gradient} = -1 \\div ${frac(num, den)} = ${frac(-den, num)}`,
      ].join(NL),
      metadata: { topic: 'parallel-perpendicular-gradients', difficulty },
    };
  }

  // Stretch: the line arrives in general form, so the gradient has to be
  // recovered before it can be turned over.
  for (;;) {
    const a = _.random(1, 6) * _.sample([-1, 1]);
    const bb = _.random(1, 6);
    const d = _.random(-12, 12);
    if (gcd(a, bb) !== 1) continue;
    return {
      instruction: 'Find the gradient of a line perpendicular to this one',
      questionMath: generalForm(a, bb, d),
      questionMathCompact: true,
      answer: frac(bb, a),
      workingOut: [
        `${coef(bb)}y = ${coef(-a)}x${signed(d)}`,
        `m = ${frac(-a, bb)}`,
        `\\text{perpendicular gradient} = ${frac(bb, a)}`,
      ].join(NL),
      metadata: { topic: 'parallel-perpendicular-gradients', difficulty },
    };
  }
};

/* --------------------------------------------------- 14C equation of a line */

export const generateEquationOfALine = (options = {}) => {
  const { difficulty = 'core' } = options;

  if (difficulty === 'foundation') {
    // Read the gradient and the intercept off a drawn line. Gradients stay
    // countable by eye on a grid — a small whole number, or a fraction whose
    // run is at most 4 squares.
    let den;
    let num;
    do {
      den = _.sample([1, 1, 2, 3, 4]);
      num = _.random(1, 3) * _.sample([-1, 1]);
    } while (gcd(Math.abs(num), den) !== 1);
    const c = _.random(-6, 6);
    return {
      instruction: 'Find the equation of this line',
      answer: lineEquation(num, den, c),
      workingOut: [
        den === 1 ? `m = ${num}` : `m = \\frac{${num}}{${den}} = ${frac(num, den)}`,
        `c = ${c}`,
        lineEquation(num, den, c),
      ].join(NL),
      visualization: { type: 'coordinate-grid', line: { m: num / den, c }, big: 1 },
      metadata: { topic: 'equation-of-a-line', difficulty },
    };
  }

  if (difficulty === 'core') {
    // Gradient and one point.
    for (;;) {
      const num = _.random(1, 5) * _.sample([-1, 1]);
      const den = _.random(1, 3);
      if (gcd(num, den) !== 1) continue;
      const steps = _.random(-3, 3);
      const x = den * steps;
      const c = _.random(-6, 6);
      const y = (num * x) / den + c;
      if (x === 0) continue;
      return {
        instruction: 'Find the equation of the line',
        questionMath: `\\text{gradient } ${frac(num, den)}${NL}\\text{through } ${point(x, y)}`,
        questionMathCompact: true,
        answer: lineEquation(num, den, c),
        workingOut: [
          `y = ${mx(num, den)}x + c`,
          `${y} = ${frac(num, den)} \\times ${br(x)} + c`,
          `c = ${c}`,
          lineEquation(num, den, c),
        ].join(NL),
        metadata: { topic: 'equation-of-a-line', difficulty },
      };
    }
  }

  // Two points: the gradient has to be found first.
  for (;;) {
    const num = _.random(1, 5) * _.sample([-1, 1]);
    const den = _.random(1, 3);
    if (gcd(num, den) !== 1) continue;
    const c = _.random(-5, 5);
    const s1 = _.random(-3, 0);
    const s2 = _.random(1, 3);
    const a = [den * s1, num * s1 + c];
    const b = [den * s2, num * s2 + c];
    return {
      instruction: 'Find the equation of the line through A and B',
      questionMath: `A${point(a[0], a[1])} \\text{ and } B${point(b[0], b[1])}`,
      questionMathCompact: true,
      answer: lineEquation(num, den, c),
      workingOut: [
        `m = \\frac{${b[1]} - ${br(a[1])}}{${b[0]} - ${br(a[0])}} = ${frac(num, den)}`,
        `${a[1]} = ${frac(num, den)} \\times ${br(a[0])} + c`,
        `c = ${c}`,
        lineEquation(num, den, c),
      ].join(NL),
      metadata: { topic: 'equation-of-a-line', difficulty },
    };
  }
};

/* ------------------------------------------------------- 14D general form */

export const generateLineGeneralForm = (options = {}) => {
  const { difficulty = 'core' } = options;

  if (difficulty === 'foundation') {
    // y = mx + c  ->  ax + by = d, clearing the fraction.
    for (;;) {
      const num = _.random(1, 5) * _.sample([-1, 1]);
      const den = _.random(2, 5);
      if (gcd(num, den) !== 1) continue;
      const c = _.random(-6, 6);
      // den*y = num*x + den*c  ->  -num*x + den*y = den*c
      const a = -num;
      const bb = den;
      const d = den * c;
      const flip = a < 0 ? -1 : 1;
      return {
        instruction: 'Write this in the form ax + by = d',
        questionMath: lineEquation(num, den, c),
        questionMathCompact: true,
        answer: generalForm(a * flip, bb * flip, d * flip),
        workingOut: [
          `${den}y = ${coef(num)}x${signed(den * c)}`,
          generalForm(a * flip, bb * flip, d * flip),
        ].join(NL),
        metadata: { topic: 'line-general-form', difficulty },
      };
    }
  }

  if (difficulty === 'core') {
    // ax + by = d  ->  gradient and intercept.
    for (;;) {
      const a = _.random(1, 8) * _.sample([-1, 1]);
      const bb = _.random(2, 6);
      const d = _.random(-20, 20);
      if (gcd(a, bb) !== 1 || d % bb !== 0) continue;
      return {
        instruction: 'Write this in the form y = mx + c',
        questionMath: generalForm(a, bb, d),
        questionMathCompact: true,
        answer: lineEquation(-a, bb, d / bb),
        workingOut: [
          `${bb}y = ${coef(-a)}x${signed(d)}`,
          lineEquation(-a, bb, d / bb),
        ].join(NL),
        metadata: { topic: 'line-general-form', difficulty },
      };
    }
  }

  // Gradient and a point, straight to general form (Haese's fast method).
  for (;;) {
    const num = _.random(1, 5) * _.sample([-1, 1]);
    const den = _.random(2, 5);
    if (gcd(num, den) !== 1) continue;
    const x = _.random(-6, 6);
    const y = _.random(-6, 6);
    const a = -num;
    const bb = den;
    const d = a * x + bb * y;
    const flip = a < 0 ? -1 : 1;
    return {
      instruction: 'Find the equation of the line in the form ax + by = d',
      questionMath: `\\text{gradient } ${frac(num, den)}${NL}\\text{through } ${point(x, y)}`,
      questionMathCompact: true,
      answer: generalForm(a * flip, bb * flip, d * flip),
      workingOut: [
        `${generalForm(a * flip, bb * flip, 'd')}`,
        `d = ${a * flip} \\times ${br(x)} + ${br(bb * flip)} \\times ${br(y)} = ${d * flip}`,
        generalForm(a * flip, bb * flip, d * flip),
      ].join(NL),
      metadata: { topic: 'line-general-form', difficulty },
    };
  }
};

/* -------------------------------------------- 14C Q8 a missing coordinate */

export const generatePointOnLine = (options = {}) => {
  const { difficulty = 'core' } = options;

  if (difficulty === 'foundation') {
    // x is known, so substitute straight in.
    const m = _.random(2, 6) * _.sample([-1, 1]);
    const c = _.random(-8, 8);
    const x = _.random(-9, 9);
    const y = m * x + c;
    return {
      instruction: `Find a, given that (${txt(x)}, a) lies on this line`,
      questionMath: lineEquation(m, 1, c),
      questionMathCompact: true,
      answer: `a = ${y}`,
      workingOut: [`a = ${m} \\times ${br(x)}${signed(c)}`, `a = ${y}`].join(NL),
      metadata: { topic: 'point-on-line', difficulty },
    };
  }

  if (difficulty === 'core') {
    // y is known, so the equation has to be solved for x.
    for (;;) {
      const m = _.random(2, 6) * _.sample([-1, 1]);
      const c = _.random(-8, 8);
      const x = _.random(-12, 12);
      const y = m * x + c;
      if (x === 0) continue;
      return {
        instruction: `Find a, given that (a, ${txt(y)}) lies on this line`,
        questionMath: lineEquation(m, 1, c),
        questionMathCompact: true,
        answer: `a = ${x}`,
        workingOut: [
          `${y} = ${m}a${signed(c)}`,
          `${m}a = ${y - c}`,
          `a = ${x}`,
        ].join(NL),
        metadata: { topic: 'point-on-line', difficulty },
      };
    }
  }

  // General form, so there is nothing to substitute into until it is
  // rearranged or the substitution is done in place.
  for (;;) {
    const a = _.random(1, 6) * _.sample([-1, 1]);
    const bb = _.random(2, 6);
    const x = _.random(-9, 9);
    const k = _.random(-9, 9);
    if (gcd(Math.abs(a), bb) !== 1) continue;
    const d = a * x + bb * k;
    return {
      instruction: `Find k, given that (${txt(x)}, k) lies on this line`,
      questionMath: generalForm(a, bb, d),
      questionMathCompact: true,
      answer: `k = ${k}`,
      workingOut: [
        `${a} \\times ${br(x)} + ${bb}k = ${d}`,
        `${bb}k = ${bb * k}`,
        `k = ${k}`,
      ].join(NL),
      metadata: { topic: 'point-on-line', difficulty },
    };
  }
};
