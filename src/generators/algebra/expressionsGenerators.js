// src/generators/algebra/expressionsGenerators.js
//
// Expanding brackets. Calibrated against Haese 1A (single brackets),
// 1B (double brackets) and 1C (difference of two squares) — see calibration.md.
//
// Difficulty changes the SHAPE of the question, never the size of the number.
// Foundation / core / stretch only. Pure functions; no React, no state.

import _ from 'lodash';

// ---------------------------------------------------------------------------
// Term algebra
//
// A term is { c, p }: a coefficient and a map of variable -> power.
// T(3, { x: 2 }) is 3x².  An ordered array of terms is a written expression;
// collect() turns one into a simplified, ordered answer.
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

/** Collect like terms, then order by descending degree, then alphabetically. */
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

// ---------------------------------------------------------------------------
// Rendering an unexpanded expression
//
// A "part" is either a loose term { t } or a bracket product { mult, inner }.
// Parts are rendered in the order given so the question reads the way the
// textbook writes it: 13 - 4(x + 3), not -4(x + 3) + 13.
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

const SINGLE_VARS = ['x', 'y', 'a', 'n', 'p'];
const VAR_PAIRS = [
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

/**
 * Collected terms as a written answer. Descending degree is standard form, but
 * a two-term answer should not open with a minus: 20 - 4p, not -4p + 20, and
 * 4 - x^2, not -x^2 + 4. Three-term quadratics stay in standard form.
 */
const answerLatex = (terms) => {
  if (terms.length === 2 && terms[0].c < 0 && terms[1].c > 0) {
    return termsLatex([terms[1], terms[0]]);
  }
  return termsLatex(terms);
};

/** Rebuild until the shape is acceptable; give up rather than loop forever. */
const attempt = (build, ok, tries = 40) => {
  let last = build();
  for (let i = 0; i < tries && !ok(last); i += 1) last = build();
  return last;
};

// ---------------------------------------------------------------------------
// Haese 1A — single brackets
// ---------------------------------------------------------------------------

// Foundation (Ex 1A Q1 a-h): one bracket, positive integer multiplier,
// two terms inside. 3(x + 1), 2(5 - x), 4(a + 2b).
const singleFoundation = () => {
  const k = _.random(2, 6);
  const v = _.sample(SINGLE_VARS);
  return _.sample([
    () => ({
      parts: [{ mult: T(k), inner: [T(1, { [v]: 1 }), T(pm() * _.random(1, 9))] }],
      hint: `\\text{multiply both terms by } ${k}`,
    }),
    () => ({
      parts: [{ mult: T(k), inner: [T(_.random(2, 9)), T(-1, { [v]: 1 })] }],
      hint: `\\text{multiply both terms by } ${k}`,
    }),
    () => {
      const [v1, v2] = _.sample(VAR_PAIRS);
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
  ])();
};

// Core (Ex 1A Q1 i-t, Q2): negative multipliers, bare minus signs, variable
// multipliers, and a bracket with loose terms to collect afterwards.
// Sign errors are the intended difficulty here, so negatives are deliberate.
const singleCore = () => {
  const v = _.sample(SINGLE_VARS);
  return _.sample([
    () => {
      const k = _.random(2, 6);
      return {
        parts: [{ mult: T(-k), inner: [T(1, { [v]: 1 }), T(pm() * _.random(1, 9))] }],
        hint: `\\text{the } -${k} \\text{ multiplies both terms}`,
      };
    },
    () => ({
      // -(3 - x)
      parts: [{ mult: T(-1), inner: [T(_.random(2, 9)), T(-1, { [v]: 1 })] }],
      hint: '\\text{subtracting the bracket changes both signs}',
    }),
    () => {
      // x(x + 3), 2x(x - 5)
      const m = _.random(1, 4);
      return {
        parts: [
          { mult: T(m, { [v]: 1 }), inner: [T(1, { [v]: 1 }), T(pm() * _.random(2, 9))] },
        ],
        hint: `\\text{multiply both terms by } ${multLatex(T(m, { [v]: 1 }))}`,
      };
    },
    () => {
      // a(a + b)
      const [v1, v2] = _.sample(VAR_PAIRS);
      return {
        parts: [
          { mult: T(1, { [v1]: 1 }), inner: [T(1, { [v1]: 1 }), T(1, { [v2]: 1 })] },
        ],
        hint: `\\text{multiply both terms by } ${v1}`,
      };
    },
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
    // 7x² - 5x(x + 2)
    () => ({
      parts: [
        { t: T(_.random(2, 8), { [v]: 2 }) },
        {
          mult: T(-_.random(2, 5), { [v]: 1 }),
          inner: [T(1, { [v]: 1 }), T(_.random(1, 5))],
        },
      ],
    }),
  ])();
};

// Stretch (Ex 1A Q3): two brackets, both expanded, then collected.
const singleStretch = () => {
  const v = _.sample(SINGLE_VARS);
  return _.sample([
    // 2(y - 3) - 4(2y + 1)
    () => ({
      parts: [
        { mult: T(_.random(2, 5)), inner: [T(1, { [v]: 1 }), T(-_.random(1, 6))] },
        {
          mult: T(-_.random(2, 5)),
          inner: [T(_.random(2, 3), { [v]: 1 }), T(_.random(1, 6))],
        },
      ],
    }),
    // x(x + 4) - 2(x - 3)
    () => ({
      parts: [
        { mult: T(1, { [v]: 1 }), inner: [T(1, { [v]: 1 }), T(_.random(2, 7))] },
        { mult: T(-_.random(2, 5)), inner: [T(1, { [v]: 1 }), T(-_.random(1, 6))] },
      ],
    }),
    // -4(x - 2) - (3 - x)
    () => ({
      parts: [
        { mult: T(-_.random(2, 5)), inner: [T(1, { [v]: 1 }), T(-_.random(1, 5))] },
        { mult: T(-1), inner: [T(_.random(2, 8)), T(-1, { [v]: 1 })] },
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
      const [v1, v2] = _.sample(VAR_PAIRS);
      return {
        parts: [
          { mult: T(1, { [v1]: 1 }), inner: [T(1, { [v1]: 1 }), T(1, { [v2]: 1 })] },
          { mult: T(-1, { [v2]: 1 }), inner: [T(1, { [v1]: 1 }), T(1, { [v2]: 1 })] },
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
    instruction: difficulty === 'foundation' ? 'Expand' : 'Expand and simplify',
    questionMath: partsLatex(spec.parts),
    answer: answerLatex(collect(expanded)),
    workingOut: spec.hint || termsLatex(expanded),
    metadata: { topic: 'expand-single-brackets', difficulty },
  };
};

// ---------------------------------------------------------------------------
// Haese 1B — double brackets
// ---------------------------------------------------------------------------

// Foundation (Ex 1B Q2 a-e): monic, x written first in both, at most one negative.
const doubleFoundation = () => {
  const v = _.sample(SINGLE_VARS);
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

// Core (Ex 1B Q2 f-l): non-monic, or the constant written first.
const doubleCore = () => {
  const v = _.sample(SINGLE_VARS);
  return _.sample([
    // (2x + 1)(3x + 4)
    () => ({
      A: [T(_.random(2, 4), { [v]: 1 }), T(pm() * _.random(1, 5))],
      B: [T(_.random(2, 4), { [v]: 1 }), T(pm() * _.random(1, 5))],
    }),
    // (1 - 2x)(4x + 1)
    () => ({
      A: [T(_.random(1, 5)), T(-_.random(2, 4), { [v]: 1 })],
      B: [T(_.random(2, 4), { [v]: 1 }), T(_.random(1, 5))],
    }),
    // (4 - x)(2x + 3)
    () => ({
      A: [T(_.random(2, 6)), T(-1, { [v]: 1 })],
      B: [T(_.random(2, 4), { [v]: 1 }), T(_.random(1, 5))],
    }),
    // (5 - 3x)(5 + x)
    () => ({
      A: [T(_.random(2, 6)), T(-_.random(2, 4), { [v]: 1 })],
      B: [T(_.random(2, 6)), T(1, { [v]: 1 })],
    }),
  ])();
};

// Stretch (Ex 1B Q3 f, Q4): squares of binomials, and two variables.
const doubleStretch = () => {
  const [v, w] = _.sample(VAR_PAIRS);
  return _.sample([
    // (3x - 2)²
    () => {
      const A = [T(_.random(2, 5), { [v]: 1 }), T(-_.random(1, 6))];
      return { A, B: A, square: true };
    },
    // (1 - 3x)²
    () => {
      const A = [T(_.random(1, 6)), T(-_.random(2, 5), { [v]: 1 })];
      return { A, B: A, square: true };
    },
    // (5x - y)²
    () => {
      const A = [
        T(_.random(2, 5), { [v]: 1 }),
        T(-_.random(1, 4), { [w]: 1 }),
      ];
      return { A, B: A, square: true };
    },
    // (2x + 3y)(x - 4y)
    () => ({
      A: [T(_.random(1, 4), { [v]: 1 }), T(pm() * _.random(1, 4), { [w]: 1 })],
      B: [T(_.random(1, 4), { [v]: 1 }), T(pm() * _.random(1, 4), { [w]: 1 })],
    }),
  ])();
};

/**
 * Two binomials give four products and three terms. If they collapse to two,
 * the middle has cancelled and the question is really 1C in disguise.
 */
const hasMiddleTerm = ({ A, B }) => collect(mulTerms(A, B)).length >= 3;

/** No common factor inside either bracket, and no accidental square or 1C. */
const okDouble = (spec) =>
  hasMiddleTerm(spec) &&
  coprime(spec.A) &&
  coprime(spec.B) &&
  (spec.square || termsLatex(spec.A) !== termsLatex(spec.B));

export const generateExpandDoubleBrackets = (options = {}) => {
  const difficulty = band(options.difficulty);
  const build = { foundation: doubleFoundation, core: doubleCore, stretch: doubleStretch }[
    difficulty
  ];

  const spec = attempt(build, okDouble);
  const { A, B, square } = spec;

  const questionMath = square
    ? `(${termsLatex(A)})^{2}`
    : `(${termsLatex(A)})(${termsLatex(B)})`;

  return {
    instruction: 'Expand and simplify',
    questionMath,
    answer: answerLatex(collect(mulTerms(A, B))),
    workingOut: termsLatex(mulTerms(A, B)),
    metadata: { topic: 'expand-double-brackets', difficulty },
  };
};

// ---------------------------------------------------------------------------
// Haese 1C — difference of two squares
//
// A separate skill from 1B: Haese teaches it as a pattern to recognise, not a
// product to multiply out. The working shows the middle terms cancelling.
// ---------------------------------------------------------------------------

const dotsFoundation = () => {
  const v = _.sample(SINGLE_VARS);
  const b = _.random(2, 9);
  const flip = Math.random() < 0.4;
  return flip
    ? { A: [T(b), T(-1, { [v]: 1 })], B: [T(b), T(1, { [v]: 1 })] }
    : { A: [T(1, { [v]: 1 }), T(b)], B: [T(1, { [v]: 1 }), T(-b)] };
};

const dotsCore = () => {
  const v = _.sample(SINGLE_VARS);
  const a = _.random(2, 5);
  const b = _.random(1, 9);
  const flip = Math.random() < 0.4;
  return flip
    ? { A: [T(b), T(-a, { [v]: 1 })], B: [T(b), T(a, { [v]: 1 })] }
    : { A: [T(a, { [v]: 1 }), T(-b)], B: [T(a, { [v]: 1 }), T(b)] };
};

const dotsStretch = () => {
  const [v, w] = _.sample(VAR_PAIRS);
  const a = _.random(2, 7);
  const b = _.random(2, 7);
  return {
    A: [T(a, { [v]: 1 }), T(b, { [w]: 1 })],
    B: [T(a, { [v]: 1 }), T(-b, { [w]: 1 })],
  };
};

export const generateDifferenceOfTwoSquares = (options = {}) => {
  const difficulty = band(options.difficulty);
  const build = { foundation: dotsFoundation, core: dotsCore, stretch: dotsStretch }[
    difficulty
  ];
  const { A, B } = attempt(build, (s) => coprime(s.A) && coprime(s.B));

  return {
    instruction: 'Expand and simplify',
    questionMath: `(${termsLatex(A)})(${termsLatex(B)})`,
    answer: answerLatex(collect(mulTerms(A, B))),
    workingOut: termsLatex(mulTerms(A, B)),
    metadata: { topic: 'difference-of-two-squares', difficulty },
  };
};

// Haese 1C Q4: 43 x 37 as 40² - 3². No figure, one line, and unlike anything
// else in the retrieval pool.
export const generateDifferenceOfTwoSquaresNumeric = (options = {}) => {
  // Two bands only: the shape doesn't have a third gear.
  const difficulty = band(options.difficulty) === 'stretch' ? 'stretch' : 'core';
  const base =
    difficulty === 'core'
      ? _.sample([20, 30, 40, 50, 60, 70, 80, 90])
      : _.sample([30, 40, 50, 60, 70, 80, 90, 100, 110]);
  const d = difficulty === 'core' ? _.random(1, 3) : _.random(2, 6);

  const lo = base - d;
  const hi = base + d;
  const order = Math.random() < 0.5 ? [lo, hi] : [hi, lo];

  return {
    instruction: 'Evaluate without a calculator',
    questionMath: `${order[0]} \\times ${order[1]}`,
    answer: `${base * base - d * d}`,
    workingOut: `${base}^{2} - ${d}^{2} = ${base * base} - ${d * d}`,
    metadata: { topic: 'difference-of-two-squares-numeric', difficulty },
  };
};