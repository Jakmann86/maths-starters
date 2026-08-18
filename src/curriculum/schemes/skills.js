// src/generators/algebra/expressionsGenerators.js
//
// Expansion of brackets. Calibrated directly against Haese Chapter 1:
//   1A  The distributive law            -> expand-single-brackets
//   1B  The product (a+b)(c+d)          -> expand-double-brackets
//   1C  Difference of two squares       -> difference-of-two-squares
//   1C  Q4, numerical application       -> difference-of-two-squares-numeric
//   1D  Perfect squares expansion       -> expand-perfect-square
//
// Difficulty changes the SHAPE of the question, never the size of the number.
// Bands are foundation / core / stretch. Pure functions: no React, no state.

import _ from 'lodash';

// ---------------------------------------------------------------------------
// Term algebra
//
// A term is { c, p }: a coefficient and a map of variable -> power.
// T(3, { x: 2 }) is 3x². An ordered array of terms is an expression as
// written; collect() turns one into a simplified answer.
// ---------------------------------------------------------------------------

const T = (c, p = {}) => ({ c, p });

const monoLatex = (p) =>
  Object.keys(p)
    .filter((v) => p[v] > 0)
    .sort()
    .map((v) => (p[v] === 1 ? v : `${v}^{${p[v]}}`))
    .join('');

const degree = (p) => Object.keys(p).reduce((s, v) => s + p[v], 0);

const monoKey = (p) => monoLatex(p) || '1';

const isConstant = (t) => monoLatex(t.p) === '';

/** A term's magnitude, no sign: 3x², x, 7. */
const magLatex = (t) => {
  const m = monoLatex(t.p);
  const a = Math.abs(t.c);
  if (!m) return `${a}`;
  return a === 1 ? m : `${a}${m}`;
};

/** An ordered term list as written, without collecting. */
const termsLatex = (terms) => {
  const live = terms.filter((t) => t.c !== 0);
  if (!live.length) return '0';
  return live
    .map((t, i) => {
      const body = magLatex(t);
      if (i === 0) return t.c < 0 ? `-${body}` : body;
      return `${t.c < 0 ? ' - ' : ' + '}${body}`;
    })
    .join('');
};

/** Collect like terms, descending degree, then alphabetically. */
const collect = (terms) => {
  const bag = {};
  terms.forEach((t) => {
    const k = monoKey(t.p);
    if (!bag[k]) bag[k] = T(0, t.p);
    bag[k].c += t.c;
  });
  return Object.values(bag)
    .filter((t) => t.c !== 0)
    .sort((a, b) => {
      const d = degree(b.p) - degree(a.p);
      return d !== 0 ? d : monoLatex(a.p).localeCompare(monoLatex(b.p));
    });
};

const mulTerms = (A, B) => {
  const out = [];
  A.forEach((a) =>
    B.forEach((b) => {
      const p = { ...a.p };
      Object.keys(b.p).forEach((v) => {
        p[v] = (p[v] || 0) + b.p[v];
      });
      out.push(T(a.c * b.c, p));
    })
  );
  return out;
};

/**
 * The answer, ordered the way Haese orders it: the answer opens the way the
 * question opens. A question whose first product term is a constant gets an
 * ascending answer — 2(5 - x) = 10 - 2x, (3 - y)(3 + y) = 9 - y^2 — while
 * anything led by a variable term stays in descending standard form, leading
 * minus and all: -2x(x - 3) = -2x^2 + 6x.
 */
const answerLatex = (collected, leadTerm) =>
  termsLatex(isConstant(leadTerm) ? [...collected].reverse() : collected);

// ---------------------------------------------------------------------------
// Rendering an unexpanded expression
//
// A "part" is either a loose term { t } or a bracket product { mult, inner }.
// Parts render in the order given, so the question reads the way the textbook
// writes it: 13 - 4(x + 3), and 3(x - 2) + 5, not a normalised form.
// ---------------------------------------------------------------------------

/** A bracket's multiplier, magnitude only. Returns '' for 1, so -(3 - x) works. */
const multLatex = (t) => {
  const m = monoLatex(t.p);
  const a = Math.abs(t.c);
  if (!m) return a === 1 ? '' : `${a}`;
  return a === 1 ? m : `${a}${m}`;
};

const partsLatex = (parts) =>
  parts
    .map((part, i) => {
      const lead = part.t || part.mult;
      const neg = lead.c < 0;
      const body = part.t
        ? magLatex(part.t)
        : `${multLatex(part.mult)}(${termsLatex(part.inner)})`;
      if (i === 0) return neg ? `-${body}` : body;
      return `${neg ? ' - ' : ' + '}${body}`;
    })
    .join('');

/** Every product carried out, in written order, nothing collected. */
const partsExpanded = (parts) =>
  parts.flatMap((part) => (part.t ? [part.t] : mulTerms([part.mult], part.inner)));

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

const BANDS = ['foundation', 'core', 'stretch'];
const band = (d) => (BANDS.includes(d) ? d : 'core');

const VARS = ['x', 'y', 'a', 'n', 'p', 'c', 'd'];
const PAIRS = [
  ['a', 'b'],
  ['x', 'y'],
  ['p', 'q'],
  ['m', 'n'],
];

const pm = () => _.sample([1, -1]);
const gcd = (a, b) => (b ? gcd(b, a % b) : Math.abs(a));

/** Haese never leaves a common factor inside a bracket: (4a + 2)(2a + 4) is out. */
const coprime = (terms) =>
  terms.map((t) => Math.abs(t.c)).reduce((a, b) => gcd(a, b)) === 1;

/** Rebuild until the shape is acceptable; give up rather than loop forever. */
const attempt = (build, ok, tries = 60) => {
  let last = build();
  for (let i = 0; i < tries && !ok(last); i += 1) last = build();
  return last;
};

// ---------------------------------------------------------------------------
// Haese 1A — the distributive law
// ---------------------------------------------------------------------------

// Foundation — Ex 1A Q1 a-h. One bracket, two terms inside, multiplier either a
// positive integer or a bare minus sign. The bare minus is Q1 c-d, so it belongs
// here rather than at Core.
const singleFoundation = () => {
  const v = _.sample(VARS);
  const k = _.random(2, 6);
  return _.sample([
    // 3(x + 1)
    () => ({
      parts: [{ mult: T(k), inner: [T(1, { [v]: 1 }), T(pm() * _.random(1, 9))] }],
      hint: `\\text{multiply both terms by } ${k}`,
    }),
    // 2(5 - x)
    () => ({
      parts: [{ mult: T(k), inner: [T(_.random(2, 9)), T(-1, { [v]: 1 })] }],
      hint: `\\text{multiply both terms by } ${k}`,
    }),
    // -(x + 2), -(3 - x)
    () => {
      const constFirst = Math.random() < 0.5;
      return {
        parts: [
          {
            mult: T(-1),
            inner: constFirst
              ? [T(_.random(2, 9)), T(-1, { [v]: 1 })]
              : [T(1, { [v]: 1 }), T(pm() * _.random(1, 9))],
          },
        ],
        hint: '\\text{subtracting the bracket changes both signs}',
      };
    },
    // 4(a + 2b), 5(x - y)
    () => {
      const [v1, v2] = _.sample(PAIRS);
      return {
        parts: [
          {
            mult: T(k),
            inner: [T(1, { [v1]: 1 }), T(pm() * _.random(1, 3), { [v2]: 1 })],
          },
        ],
        hint: `\\text{multiply both terms by } ${k}`,
      };
    },
    // 3(2x + y)
    () => {
      const [v1, v2] = _.sample(PAIRS);
      return {
        parts: [
          {
            mult: T(k),
            inner: [T(_.random(2, 4), { [v1]: 1 }), T(pm(), { [v2]: 1 })],
          },
        ],
        hint: `\\text{multiply both terms by } ${k}`,
      };
    },
  ])();
};

// Core — Ex 1A Q1 i-t and Q2. Negative multipliers, variable multipliers,
// coefficients inside the bracket, three terms inside, or one loose term to
// collect afterwards. Sign errors are the intended difficulty, so negatives are
// generated deliberately rather than by accident.
const singleCore = () => {
  const v = _.sample(VARS);
  return _.sample([
    // -2(x + 4), -3(2x - 1)
    () => {
      const k = _.random(2, 6);
      const a = _.random(1, 3);
      return {
        parts: [
          { mult: T(-k), inner: [T(a, { [v]: 1 }), T(pm() * _.random(1, 9))] },
        ],
        hint: `\\text{the } -${k} \\text{ multiplies both terms}`,
      };
    },
    // -(7 - 2x)
    () => ({
      parts: [
        { mult: T(-1), inner: [T(_.random(3, 9)), T(-_.random(2, 4), { [v]: 1 })] },
      ],
      hint: '\\text{subtracting the bracket changes both signs}',
    }),
    // x(x + 3), 2x(x - 5), x(2x - 1)
    () => {
      const m = _.random(1, 4);
      const a = _.random(1, 3);
      return {
        parts: [
          {
            mult: T(m, { [v]: 1 }),
            inner: [T(a, { [v]: 1 }), T(pm() * _.random(1, 9))],
          },
        ],
        hint: `\\text{multiply both terms by } ${multLatex(T(m, { [v]: 1 }))}`,
      };
    },
    // a(a + b), -a(a - b)
    () => {
      const [v1, v2] = _.sample(PAIRS);
      const sign = pm();
      return {
        parts: [
          {
            mult: T(sign, { [v1]: 1 }),
            inner: [T(1, { [v1]: 1 }), T(pm(), { [v2]: 1 })],
          },
        ],
        hint:
          sign < 0
            ? `\\text{the } -${v1} \\text{ multiplies both terms}`
            : `\\text{multiply both terms by } ${v1}`,
      };
    },
    // 2x(x^2 - x - 2)
    () => ({
      parts: [
        {
          mult: T(_.random(2, 4), { [v]: 1 }),
          inner: [
            T(1, { [v]: 2 }),
            T(pm(), { [v]: 1 }),
            T(pm() * _.random(1, 4)),
          ],
        },
      ],
      hint: `\\text{multiply all three terms}`,
    }),
    // 13 - 4(x + 3)
    () => ({
      parts: [
        { t: T(_.random(6, 20)) },
        { mult: T(-_.random(2, 5)), inner: [T(1, { [v]: 1 }), T(_.random(1, 6))] },
      ],
    }),
    // 4x - 3x(x - 1)
    () => ({
      parts: [
        { t: T(_.random(2, 8), { [v]: 1 }) },
        {
          mult: T(-_.random(2, 4), { [v]: 1 }),
          inner: [T(1, { [v]: 1 }), T(-_.random(1, 5))],
        },
      ],
    }),
    // 7x^2 - 5x(x + 2)
    () => ({
      parts: [
        { t: T(_.random(2, 8), { [v]: 2 }) },
        {
          mult: T(-_.random(2, 5), { [v]: 1 }),
          inner: [T(1, { [v]: 1 }), T(_.random(1, 5))],
        },
      ],
    }),
    // 3(x - 2) + 5, 4(3 - x) - 10   (loose term last)
    () => ({
      parts: [
        {
          mult: T(_.random(2, 5)),
          inner: [T(1, { [v]: 1 }), T(-_.random(1, 6))],
        },
        { t: T(pm() * _.random(2, 10)) },
      ],
    }),
    // x(x - 1) + x, 2x(3 - x) + x^2   (loose term last)
    () => ({
      parts: [
        {
          mult: T(_.random(1, 3), { [v]: 1 }),
          inner: [T(_.random(2, 5)), T(-1, { [v]: 1 })],
        },
        { t: T(_.random(1, 4), { [v]: _.sample([1, 2]) }) },
      ],
    }),
    // 2a(b - a) + 3a^2
    () => {
      const [v1, v2] = _.sample(PAIRS);
      return {
        parts: [
          {
            mult: T(_.random(1, 3), { [v1]: 1 }),
            inner: [T(1, { [v2]: 1 }), T(-1, { [v1]: 1 })],
          },
          { t: T(_.random(2, 4), { [v1]: 2 }) },
        ],
      };
    },
  ])();
};

// Stretch — Ex 1A Q3. Two brackets, both expanded, then collected. Joined by
// either sign: Haese has 3(x - 4) + 2(5 + x) as well as 2(y - 3) - 4(2y + 1).
const singleStretch = () => {
  const v = _.sample(VARS);
  const join = () => _.sample([1, -1]);
  return _.sample([
    // 2(y - 3) - 4(2y + 1), 3(x - 4) + 2(5 + x)
    () => ({
      parts: [
        { mult: T(_.random(2, 5)), inner: [T(1, { [v]: 1 }), T(-_.random(1, 6))] },
        {
          mult: T(join() * _.random(2, 5)),
          inner: [T(_.random(1, 3), { [v]: 1 }), T(_.random(1, 6))],
        },
      ],
    }),
    // x(x + 4) - 2(x - 3), x(x + 4) + 2(x - 3)
    () => ({
      parts: [
        { mult: T(1, { [v]: 1 }), inner: [T(1, { [v]: 1 }), T(_.random(2, 7))] },
        {
          mult: T(join() * _.random(2, 5)),
          inner: [T(1, { [v]: 1 }), T(-_.random(1, 6))],
        },
      ],
    }),
    // -4(x - 2) - (3 - x), 5(2x - 1) - (2x + 3)
    () => ({
      parts: [
        {
          mult: T(pm() * _.random(2, 5)),
          inner: [T(_.random(1, 2), { [v]: 1 }), T(-_.random(1, 5))],
        },
        {
          mult: T(-1),
          inner: _.sample([
            [T(_.random(2, 8)), T(-1, { [v]: 1 })],
            [T(_.random(2, 3), { [v]: 1 }), T(_.random(1, 5))],
          ]),
        },
      ],
    }),
    // 4x(x - 3) - 2x(5 - x)
    () => ({
      parts: [
        {
          mult: T(_.random(2, 4), { [v]: 1 }),
          inner: [T(1, { [v]: 1 }), T(-_.random(2, 6))],
        },
        {
          mult: T(-_.random(2, 4), { [v]: 1 }),
          inner: [T(_.random(2, 6)), T(-1, { [v]: 1 })],
        },
      ],
    }),
    // x(x + y) - y(x + y)
    () => {
      const [v1, v2] = _.sample(PAIRS);
      return {
        parts: [
          { mult: T(1, { [v1]: 1 }), inner: [T(1, { [v1]: 1 }), T(1, { [v2]: 1 })] },
          { mult: T(-1, { [v2]: 1 }), inner: [T(1, { [v1]: 1 }), T(1, { [v2]: 1 })] },
        ],
      };
    },
    // x^2 + x(x - 1), -x^2 - x(x - 2)
    () => {
      const sign = pm();
      return {
        parts: [
          { t: T(sign, { [v]: 2 }) },
          {
            mult: T(sign, { [v]: 1 }),
            inner: [T(1, { [v]: 1 }), T(-_.random(1, 4))],
          },
        ],
      };
    },
    // 2a + (a - 2b), 2a - (a - 2b)
    () => {
      const [v1, v2] = _.sample(PAIRS);
      return {
        parts: [
          { t: T(_.random(2, 5), { [v1]: 1 }) },
          {
            mult: T(join()),
            inner: [T(1, { [v1]: 1 }), T(-_.random(1, 3), { [v2]: 1 })],
          },
        ],
      };
    },
  ])();
};

export const generateExpandSingleBrackets = (options = {}) => {
  const difficulty = band(options.difficulty);
  const build = { foundation: singleFoundation, core: singleCore, stretch: singleStretch }[
    difficulty
  ];

  const spec = attempt(build, (s) => collect(partsExpanded(s.parts)).length >= 2);
  const expanded = partsExpanded(spec.parts);

  return {
    instruction: 'Expand and simplify',
    questionMath: partsLatex(spec.parts),
    answer: answerLatex(collect(expanded), expanded[0]),
    workingOut: spec.hint || termsLatex(expanded),
    metadata: { topic: 'expand-single-brackets', difficulty },
  };
};

// ---------------------------------------------------------------------------
// Haese 1B — the product (a+b)(c+d)
//
// Two bands only. Exercise 1B has three strands: Q2 (monic then non-monic),
// Q3 (difference of two squares) and Q4 (perfect squares). The last two are
// separate skills here, which leaves 1B with two genuine tiers. Declaring a
// third would mean varying the numbers, which is not a difficulty change.
// ---------------------------------------------------------------------------

// Foundation — Ex 1B Q2 a-e. Monic, x written first in both, at most one negative.
const doubleFoundation = () => {
  const v = _.sample(VARS);
  const [s1, s2] = _.sample([
    [1, 1],
    [1, -1],
    [-1, 1],
  ]);
  return {
    A: [T(1, { [v]: 1 }), T(s1 * _.random(1, 9))],
    B: [T(1, { [v]: 1 }), T(s2 * _.random(1, 9))],
  };
};

// Core — Ex 1B Q2 f-l. Non-monic, or a bracket written constant-first.
const doubleCore = () => {
  const v = _.sample(VARS);
  return _.sample([
    // (2x + 1)(3x + 4)
    () => ({
      A: [T(_.random(2, 4), { [v]: 1 }), T(pm() * _.random(1, 5))],
      B: [T(_.random(2, 4), { [v]: 1 }), T(pm() * _.random(1, 5))],
    }),
    // (1 - 2x)(4x + 1), (4 - x)(2x + 3), (7 - x)(4x + 1)
    () => ({
      A: [T(_.random(1, 7)), T(-_.random(1, 4), { [v]: 1 })],
      B: [T(_.random(2, 4), { [v]: 1 }), T(_.random(1, 5))],
    }),
    // (5 - 3x)(5 + x)
    () => ({
      A: [T(_.random(2, 6)), T(-_.random(1, 4), { [v]: 1 })],
      B: [T(_.random(2, 6)), T(_.random(1, 2), { [v]: 1 })],
    }),
    // (3x - 2)(1 + 2x)
    () => ({
      A: [T(_.random(2, 4), { [v]: 1 }), T(-_.random(1, 5))],
      B: [T(_.random(1, 5)), T(_.random(2, 4), { [v]: 1 })],
    }),
  ])();
};

/**
 * Two binomials give four products and three terms. If they collapse to two the
 * middle has cancelled and this is a 1C question, which is its own skill. Also
 * rejects identical brackets, which are 1D.
 */
const okDouble = ({ A, B }) =>
  collect(mulTerms(A, B)).length >= 3 &&
  coprime(A) &&
  coprime(B) &&
  termsLatex(A) !== termsLatex(B);

export const generateExpandDoubleBrackets = (options = {}) => {
  const wanted = band(options.difficulty);
  const difficulty = wanted === 'stretch' ? 'core' : wanted;
  const build = { foundation: doubleFoundation, core: doubleCore }[difficulty];

  const { A, B } = attempt(build, okDouble);
  const expanded = mulTerms(A, B);

  return {
    instruction: 'Expand and simplify',
    questionMath: `(${termsLatex(A)})(${termsLatex(B)})`,
    answer: answerLatex(collect(expanded), expanded[0]),
    workingOut: termsLatex(expanded),
    metadata: { topic: 'expand-double-brackets', difficulty },
  };
};

// ---------------------------------------------------------------------------
// Haese 1D — perfect squares expansion (also Ex 1B Q4)
// ---------------------------------------------------------------------------

const squareFoundation = () => {
  const v = _.sample(VARS);
  return [T(1, { [v]: 1 }), T(pm() * _.random(2, 9))];
};

const squareCore = () => {
  const v = _.sample(VARS);
  return Math.random() < 0.5
    ? [T(_.random(2, 5), { [v]: 1 }), T(-_.random(1, 6))] // (3x - 2)^2
    : [T(_.random(1, 6)), T(-_.random(2, 5), { [v]: 1 })]; // (1 - 3x)^2
};

const squareStretch = () => {
  const [v, w] = _.sample(PAIRS);
  return [T(_.random(2, 5), { [v]: 1 }), T(pm() * _.random(1, 4), { [w]: 1 })];
};

export const generateExpandPerfectSquare = (options = {}) => {
  const difficulty = band(options.difficulty);
  const build = {
    foundation: squareFoundation,
    core: squareCore,
    stretch: squareStretch,
  }[difficulty];

  const A = attempt(build, coprime);
  const expanded = mulTerms(A, A);

  return {
    instruction: 'Expand and simplify',
    questionMath: `(${termsLatex(A)})^{2}`,
    answer: answerLatex(collect(expanded), expanded[0]),
    workingOut: termsLatex(expanded),
    metadata: { topic: 'expand-perfect-square', difficulty },
  };
};

// ---------------------------------------------------------------------------
// Haese 1C — difference of two squares
//
// A separate skill from 1B: Haese teaches it as a pattern to recognise rather
// than a product to multiply out. The working shows the middle terms cancelling.
// ---------------------------------------------------------------------------

// Foundation — Ex 1C Q1. A single letter and an integer, either order, plus the
// two-letter case (x + y)(x - y) which Haese also puts in Q1.
const dotsFoundation = () => {
  const flip = Math.random() < 0.4;
  if (Math.random() < 0.2) {
    const [v, w] = _.sample(PAIRS);
    return flip
      ? { A: [T(1, { [v]: 1 }), T(-1, { [w]: 1 })], B: [T(1, { [v]: 1 }), T(1, { [w]: 1 })] }
      : { A: [T(1, { [v]: 1 }), T(1, { [w]: 1 })], B: [T(1, { [v]: 1 }), T(-1, { [w]: 1 })] };
  }
  const v = _.sample(VARS);
  const b = _.random(2, 9);
  return flip
    ? { A: [T(b), T(-1, { [v]: 1 })], B: [T(b), T(1, { [v]: 1 })] }
    : { A: [T(1, { [v]: 1 }), T(b)], B: [T(1, { [v]: 1 }), T(-b)] };
};

// Core — Ex 1C Q2. A coefficient on the variable.
const dotsCore = () => {
  const v = _.sample(VARS);
  const a = _.random(2, 5);
  const b = _.random(1, 9);
  return Math.random() < 0.4
    ? { A: [T(b), T(-a, { [v]: 1 })], B: [T(b), T(a, { [v]: 1 })] }
    : { A: [T(a, { [v]: 1 }), T(-b)], B: [T(a, { [v]: 1 }), T(b)] };
};

// Stretch — Ex 1C Q3. Two variables, coefficients on both.
const dotsStretch = () => {
  const [v, w] = _.sample(PAIRS);
  const a = _.random(1, 7);
  const b = _.random(2, 7);
  return {
    A: [T(a, { [v]: 1 }), T(b, { [w]: 1 })],
    B: [T(a, { [v]: 1 }), T(-b, { [w]: 1 })],
  };
};

export const generateDifferenceOfTwoSquares = (options = {}) => {
  const difficulty = band(options.difficulty);
  const build = {
    foundation: dotsFoundation,
    core: dotsCore,
    stretch: dotsStretch,
  }[difficulty];

  const { A, B } = attempt(build, (s) => coprime(s.A) && coprime(s.B));
  const expanded = mulTerms(A, B);

  return {
    instruction: 'Expand and simplify',
    questionMath: `(${termsLatex(A)})(${termsLatex(B)})`,
    answer: answerLatex(collect(expanded), expanded[0]),
    workingOut: termsLatex(expanded),
    metadata: { topic: 'difference-of-two-squares', difficulty },
  };
};

// Ex 1C Q4: 43 x 37 as 40^2 - 3^2, 24 x 26 as 25^2 - 1^2, 103 x 97 as 100^2 - 3^2.
// No figure, one line, and unlike anything else in the retrieval pool.
export const generateDifferenceOfTwoSquaresNumeric = (options = {}) => {
  // Two bands: the shape has no third gear.
  const difficulty = band(options.difficulty) === 'stretch' ? 'stretch' : 'core';
  const base =
    difficulty === 'core'
      ? _.sample([20, 25, 30, 40, 50, 60, 70, 80, 90])
      : _.sample([40, 50, 60, 70, 80, 90, 100, 110, 120]);
  const d = difficulty === 'core' ? _.random(1, 4) : _.random(2, 7);

  const pair = _.shuffle([base - d, base + d]);

  return {
    instruction: 'Evaluate without a calculator',
    questionMath: `${pair[0]} \\times ${pair[1]}`,
    answer: `${base * base - d * d}`,
    workingOut: `${base}^{2} - ${d}^{2} = ${base * base} - ${d * d}`,
    metadata: { topic: 'difference-of-two-squares-numeric', difficulty },
  };
};