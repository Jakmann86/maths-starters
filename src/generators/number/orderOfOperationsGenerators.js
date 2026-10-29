// src/generators/number/orderOfOperationsGenerators.js
//
// Order of operations (BIDMAS) — from the Y9 Unit 1 do-nows.
//
//   order-of-operations         evaluate an expression
//   order-of-operations-tiles   place number cards so an equation is true
//
// Each expression is built backwards from its answer, or checked forwards in
// whole numbers, so every answer is an integer by construction.

import _ from 'lodash';

const NL = '\n';

// A literal as it sits in an expression: negatives keep their minus.
const num = (n) => String(n);
// "- 5" / "+ 5" for a signed term after an operator.
const signed = (n) => (n < 0 ? `- ${-n}` : `+ ${n}`);

/* --------------------------------------------------- evaluate an expression */
//
//   foundation  negatives, brackets, × and ÷            (-14 - 2 × 3) ÷ 5
//   core        powers and roots join in                (3 - 7)² - ∛125 + 2³
//   stretch     a fraction bar groups a whole numerator and denominator
//               ((-4)² - 2 × 5) / (3 - √36)
//
// Core includes -a², which is -(a²): the power binds before the minus. That is
// the error the band exists to catch.

const foundationExpr = () => {
  const kind = _.sample(['divide', 'bracket', 'mixed']);
  if (kind === 'divide') {
    // (A - B × C) ÷ D, A chosen so the bracket divides exactly.
    let r, D, B, C, A;
    do {
      r = _.random(-9, 9); D = _.random(2, 6); B = _.random(2, 9); C = _.random(2, 9);
      A = r * D + B * C;
    } while (r === 0 || A === 0 || Math.abs(A) > 60);
    return {
      tex: `(${num(A)} - ${B} \\times ${C}) \\div ${D}`,
      value: r,
      steps: [`${B} \\times ${C} = ${B * C}`, `${num(A)} - ${B * C} = ${A - B * C}`, `${A - B * C} \\div ${D} = ${r}`],
    };
  }
  if (kind === 'bracket') {
    // A - B × (C - D), the bracket often negative.
    const A = _.random(-12, 20) || 5;
    const B = _.random(2, 9);
    const C = _.random(1, 12);
    let D;
    do { D = _.random(1, 15); } while (D === C);
    return {
      tex: `${num(A)} - ${B} \\times (${C} - ${D})`,
      value: A - B * (C - D),
      steps: [`${C} - ${D} = ${C - D}`, `${B} \\times ${C - D} = ${B * (C - D)}`, `${num(A)} - ${B * (C - D) < 0 ? `(${B * (C - D)})` : B * (C - D)} = ${A - B * (C - D)}`],
    };
  }
  // A ÷ (B - C) + D × E, the bracket a factor of A, possibly negative.
  let A, B, C, q;
  do {
    q = _.random(-6, 6); B = _.random(1, 12);
    const m = _.sample([-4, -3, -2, 2, 3, 4, 5]);
    C = B - m;
    A = q * m;
  } while (q === 0 || C < 1 || A === 0);
  const D = _.random(2, 9) * (_.random(0, 2) === 0 ? -1 : 1);
  const E = _.random(2, 9);
  return {
    tex: `${num(A)} \\div (${B} - ${C}) ${signed(D)} \\times ${E}`,
    value: q + D * E,
    steps: [`${B} - ${C} = ${B - C}`, `${num(A)} \\div ${B - C < 0 ? `(${B - C})` : B - C} = ${q}`, `${D} \\times ${E} = ${D * E}`, `${q} ${signed(D * E)} = ${q + D * E}`],
  };
};

const coreExpr = () => {
  const kind = _.sample(['square-root-cube', 'negative-cube', 'minus-square']);
  if (kind === 'square-root-cube') {
    // (a - b)² - ∛c + d^k, with a < b so the bracket is negative.
    const a = _.random(1, 9);
    const b = a + _.random(1, 6);
    const r = _.random(2, 5);
    const d = _.random(2, 4);
    const k = d === 4 ? 2 : _.sample([2, 3]);
    return {
      tex: `(${a} - ${b})^{2} - \\sqrt[3]{${r ** 3}} + ${d}^{${k}}`,
      value: (a - b) ** 2 - r + d ** k,
      steps: [`(${a - b})^{2} = ${(a - b) ** 2}`, `\\sqrt[3]{${r ** 3}} = ${r}`, `${d}^{${k}} = ${d ** k}`, `${(a - b) ** 2} - ${r} + ${d ** k} = ${(a - b) ** 2 - r + d ** k}`],
    };
  }
  if (kind === 'negative-cube') {
    // √s + (-a)³ ÷ b, b a factor of a³.
    const s = _.random(2, 12);
    const a = _.random(2, 5);
    const b = _.sample(_.range(2, a ** 3 + 1).filter((v) => a ** 3 % v === 0 && v <= 25));
    const t = -(a ** 3) / b;
    return {
      tex: `\\sqrt{${s * s}} + (-${a})^{3} \\div ${b}`,
      value: s + t,
      steps: [`\\sqrt{${s * s}} = ${s}`, `(-${a})^{3} = ${-(a ** 3)}`, `${-(a ** 3)} \\div ${b} = ${t}`, `${s} ${signed(t)} = ${s + t}`],
    };
  }
  // -a² + (b - c)³: the minus is outside the power.
  const a = _.random(2, 7);
  const b = _.random(1, 9);
  let c;
  do { c = _.random(1, 12); } while (c === b || Math.abs(b - c) > 4);
  const cube = (b - c) ** 3;
  return {
    tex: `-${a}^{2} + (${b} - ${c})^{3}`,
    value: -(a * a) + cube,
    steps: [`-${a}^{2} = -${a * a}`, `(${b - c})^{3} = ${cube}`, `-${a * a} ${signed(cube)} = ${-(a * a) + cube}`],
  };
};

const stretchExpr = () => {
  if (_.random(0, 1)) {
    // ((-a)² - b × c) / (d - √e) = r
    for (;;) {
      const r = _.random(-9, 9);
      const se = _.random(2, 9);
      const d = _.random(1, 12);
      const den = d - se;
      const a = _.random(2, 9);
      if (r === 0 || den === 0) continue;
      const bc = a * a - r * den;
      const pairs = _.range(2, 10).filter((b) => bc % b === 0 && bc / b >= 2 && bc / b <= 9);
      if (!pairs.length) continue;
      const b = _.sample(pairs);
      const c = bc / b;
      return {
        tex: `\\frac{(-${a})^{2} - ${b} \\times ${c}}{${d} - \\sqrt{${se * se}}}`,
        value: r,
        steps: [`\\text{top: } ${a * a} - ${bc} = ${a * a - bc}`, `\\text{bottom: } ${d} - ${se} = ${den}`, `${a * a - bc} \\div ${den < 0 ? `(${den})` : den} = ${r}`],
      };
    }
  }
  // (a³ - b) / ∛c - (d - e)²
  for (;;) {
    const a = _.random(2, 5);
    const root = _.random(2, 5);
    const b = _.random(1, 30);
    const top = a ** 3 - b;
    if (top === 0 || top % root !== 0) continue;
    const d = _.random(1, 9);
    const e = _.random(1, 12);
    if (d === e) continue;
    const value = top / root - (d - e) ** 2;
    if (Math.abs(value) > 60) continue;
    return {
      tex: `\\frac{${a}^{3} - ${b}}{\\sqrt[3]{${root ** 3}}} - (${d} - ${e})^{2}`,
      value,
      steps: [`\\text{top: } ${a ** 3} - ${b} = ${top}`, `\\text{bottom: } ${root}`, `${top} \\div ${root} = ${top / root}`, `(${d - e})^{2} = ${(d - e) ** 2}`, `${top / root} - ${(d - e) ** 2} = ${value}`],
    };
  }
};

export const generateOrderOfOperations = (options = {}) => {
  const { difficulty = 'core' } = options;
  const build = difficulty === 'foundation' ? foundationExpr : difficulty === 'stretch' ? stretchExpr : coreExpr;
  const { tex, value, steps } = build();
  return {
    instruction: 'Calculate',
    questionMath: tex,
    answer: String(value),
    workingOut: steps.join(NL),
    metadata: { topic: 'order-of-operations', difficulty },
  };
};

/* ------------------------------------------------------- number-card puzzle */
//
// Cards are shown above an equation of empty boxes; each card goes in one box.
//
//   foundation  three cards and a target, no powers      □ + □ × □ = 14
//   core        four cards, a square, and the answer is itself a card
//               □ × □ − □² = □
//   stretch     four cards, brackets and a square         (□ + □)² − □ × □ = 9
//
// The puzzle is only kept when it has exactly one solution, counting a swap
// across + or × (or inside a squared difference) as the same solution. Every
// permutation of the cards is tried, so this is checked, not hoped for.
//
// Core has a real ceiling of about 43 puzzles: the answer card must be a
// single digit different from the other three, and few fillings manage that
// with a unique solution. Allowing a two-digit answer card would lift it, but
// a card reading 23 is not what the do-nows' cards look like.

const BOX = '\\boxed{\\phantom{0}}';

// Each template: slot count, whether the last slot is the result, its value
// (or null when a division does not come out whole), the LaTeX with a filler
// function for each slot, and a key that is equal for equivalent fillings.
const sortKey = (...xs) => xs.slice().sort((p, q) => p - q).join(',');
const TEMPLATES = {
  foundation: [
    { n: 3, tex: (s) => `${s(0)} + ${s(1)} \\times ${s(2)}`, value: ([a, b, c]) => a + b * c, key: ([a, b, c]) => `${a}|${sortKey(b, c)}` },
    { n: 3, tex: (s) => `${s(0)} \\times ${s(1)} - ${s(2)}`, value: ([a, b, c]) => a * b - c, key: ([a, b, c]) => `${sortKey(a, b)}|${c}` },
    { n: 3, tex: (s) => `(${s(0)} + ${s(1)}) \\times ${s(2)}`, value: ([a, b, c]) => (a + b) * c, key: ([a, b, c]) => `${sortKey(a, b)}|${c}` },
  ],
  core: [
    { n: 4, result: true, tex: (s) => `${s(0)} \\times ${s(1)} - ${s(2)}^{2}`, value: ([a, b, c]) => a * b - c * c, key: ([a, b, c, d]) => `${sortKey(a, b)}|${c}|${d}` },
    { n: 4, result: true, tex: (s) => `${s(0)}^{2} - ${s(1)} \\times ${s(2)}`, value: ([a, b, c]) => a * a - b * c, key: ([a, b, c, d]) => `${a}|${sortKey(b, c)}|${d}` },
    { n: 4, result: true, tex: (s) => `${s(0)} + ${s(1)}^{2} \\div ${s(2)}`, value: ([a, b, c]) => ((b * b) % c ? null : a + (b * b) / c), key: (f) => f.join('|') },
  ],
  stretch: [
    { n: 4, tex: (s) => `(${s(0)} + ${s(1)})^{2} - ${s(2)} \\times ${s(3)}`, value: ([a, b, c, d]) => (a + b) ** 2 - c * d, key: ([a, b, c, d]) => `${sortKey(a, b)}|${sortKey(c, d)}` },
    { n: 4, tex: (s) => `(${s(0)} - ${s(1)})^{2} + ${s(2)} \\times ${s(3)}`, value: ([a, b, c, d]) => (a - b) ** 2 + c * d, key: ([a, b, c, d]) => `${sortKey(a, b)}|${sortKey(c, d)}` },
    { n: 4, tex: (s) => `${s(0)}^{2} - (${s(1)} + ${s(2)}) \\times ${s(3)}`, value: ([a, b, c, d]) => a * a - (b + c) * d, key: ([a, b, c, d]) => `${a}|${sortKey(b, c)}|${d}` },
  ],
};

const permutations = (xs) => (xs.length <= 1 ? [xs] : xs.flatMap((x, i) => permutations([...xs.slice(0, i), ...xs.slice(i + 1)]).map((p) => [x, ...p])));

// The distinct solutions of a template over a set of cards.
const solutions = (t, cards, target) => {
  const keys = new Set();
  permutations(cards).forEach((f) => {
    const v = t.value(f);
    const ok = t.result ? v === f[t.n - 1] : v === target;
    if (ok) keys.add(t.key(f));
  });
  return keys;
};

export const generateNumberCards = (options = {}) => {
  const { difficulty = 'core' } = options;
  const pool = TEMPLATES[difficulty] ?? TEMPLATES.core;

  for (;;) {
    const t = _.sample(pool);
    const lhsSlots = t.result ? t.n - 1 : t.n;
    const fill = _.sampleSize(_.range(1, 10), lhsSlots);
    const v = t.value(fill);
    if (v === null) continue;
    let target = null;
    if (t.result) {
      if (v < 1 || v > 9 || fill.includes(v)) continue;
      fill.push(v);
    } else {
      if (v < 1 || v > 99) continue;
      target = v;
    }
    if (solutions(t, fill, target).size !== 1) continue;

    const cards = _.sortBy(fill);
    const lhs = t.tex(() => BOX);
    const rhs = t.result ? BOX : String(target);
    const filledLhs = t.tex((i) => String(fill[i]));
    const filledRhs = t.result ? String(fill[t.n - 1]) : String(target);
    return {
      instruction: 'Use each card once to make the equation true',
      questionMath: `${cards.map((c) => `\\boxed{${c}}`).join('\\quad ')}${NL}${lhs} = ${rhs}`,
      answer: `${filledLhs} = ${filledRhs}`,
      workingOut: `${filledLhs} = ${filledRhs}${NL}\\text{powers, then } \\times \\div \\text{, then } + -`,
      metadata: { topic: 'order-of-operations-tiles', difficulty },
    };
  }
};
