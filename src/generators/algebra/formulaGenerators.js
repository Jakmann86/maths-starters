// src/generators/algebra/formulaGenerators.js
//
// Haese Chapter 7 — formulae and simultaneous equations. Six textbook
// sections map to five skills here: 7B (rearrangement) and 7D (harder
// rearrangement) are one skill at different bands, same convention as every
// other chapter migrated so far where a "harder version" section isn't a
// separate skill.
//
// What's deliberately thin in this first pass: formula-substitution only
// draws the circle figure (no cylinder/sphere shapes yet), formula-derivation
// has one context (a savings account) rather than several, and elimination's
// working-out always cross-multiplies (scale eq1 by |b2|, eq2 by |b1|) rather
// than finding the minimal scale factor a textbook would pick. All safe
// simplifications, narrower than the full chapter but not wrong.

import _ from 'lodash';

const NL = '\n';
const round = (v, d) => Number(v.toFixed(d));

// Not the same function as angleFactsGenerators.js's local formatLinear —
// that one doesn't special-case m === -1 (prints "-1x"), which never comes
// up there (its callers only ever pass positive m) but does here
// (simultaneous-equations' equating-y method picks m2 from a range that
// includes -1). Kept separate rather than forcing one file's convention
// onto the other's callers.
const formatLinear = (m, c) => {
  const mPart = m === 1 ? 'x' : m === -1 ? '-x' : `${m}x`;
  if (c === 0) return mPart;
  return `${mPart} ${c > 0 ? '+' : '-'} ${Math.abs(c)}`;
};

// ---------------------------------------------------------------------------
// generateFormulaSubstitution (Haese 7A)
// Real formulae only (never invented) — same convention as Pythagoras/trig.
// Foundation is always forward (direct substitution). Core/Stretch reverse
// it; Stretch restricts to the squared formulas so finding r genuinely
// needs a square root, not just a division.
const TWO_VAR_FORMULAS = [
  {
    formula: 'C = 2\\pi r', known: 'r', unknown: 'C',
    forward: (r) => 2 * Math.PI * r,
    reverse: (C) => C / (2 * Math.PI),
    substitutedForward: (r) => `C = 2\\pi \\times ${r}`,
    substitutedReverse: (C) => `r = \\frac{${C}}{2\\pi}`,
    range: [2, 25], decimals: 2, unitK: '\\text{cm}', unitU: '\\text{cm}',
  },
  {
    formula: 'A = \\pi r^2', known: 'r', unknown: 'A',
    forward: (r) => Math.PI * r * r,
    reverse: (A) => Math.sqrt(A / Math.PI),
    substitutedForward: (r) => `A = \\pi \\times ${r}^2`,
    substitutedReverse: (A) => `r = \\sqrt{\\frac{${A}}{\\pi}}`,
    range: [2, 20], decimals: 2, unitK: '\\text{cm}', unitU: '\\text{cm}^2',
  },
  {
    formula: 'A = 4\\pi r^2', known: 'r', unknown: 'A',
    forward: (r) => 4 * Math.PI * r * r,
    reverse: (A) => Math.sqrt(A / (4 * Math.PI)),
    substitutedForward: (r) => `A = 4\\pi \\times ${r}^2`,
    substitutedReverse: (A) => `r = \\sqrt{\\frac{${A}}{4\\pi}}`,
    range: [2, 15], decimals: 2, unitK: '\\text{cm}', unitU: '\\text{cm}^2',
  },
];

export const generateFormulaSubstitution = (options = {}) => {
  const { difficulty = 'core' } = options;

  if (difficulty === 'foundation') {
    const f = _.sample(TWO_VAR_FORMULAS);
    const r = _.random(f.range[0], f.range[1]);
    const result = round(f.forward(r), f.decimals);
    return {
      instruction: `Use the formula to find ${f.unknown}`,
      questionMath: `${f.formula}` + NL + `${f.known} = ${r}\\text{ }${f.unitK}`,
      answer: `${f.unknown} = ${result}`,
      answerUnits: f.unitU,
      workingOut: [f.substitutedForward(r), `${f.unknown} = ${result}`].join(NL),
      visualization: null,
      metadata: { topic: 'formula-substitution', difficulty, tags: ['algebra', 'formulae'] },
    };
  }

  const pool = difficulty === 'stretch' ? TWO_VAR_FORMULAS.filter((x) => x.formula.includes('r^2')) : TWO_VAR_FORMULAS;
  const g = _.sample(pool);
  const r = _.random(g.range[0], g.range[1]);
  const knownValue = round(g.forward(r), g.decimals);
  const result = round(g.reverse(knownValue), g.decimals);
  return {
    instruction: 'Use the formula to find r',
    questionMath: `${g.formula}` + NL + `${g.unknown} = ${knownValue}\\text{ }${g.unitU}`,
    answer: `r \\approx ${result}`,
    answerUnits: g.unitK,
    workingOut: [g.substitutedReverse(knownValue), `r \\approx ${result}`].join(NL),
    visualization: { type: 'circle', r: 'r' },
    metadata: { topic: 'formula-substitution', difficulty, tags: ['algebra', 'formulae'] },
  };
};

// ---------------------------------------------------------------------------
// generateFormulaRearrangement (Haese 7B + 7D)
// Foundation/Core: ax + by = c, make y the subject. Stretch: two different
// techniques (variable appears twice → factor it out; variable in a
// fraction's denominator → multiply through), picked at random for variety.
export const generateFormulaRearrangement = (options = {}) => {
  const { difficulty = 'core' } = options;

  if (difficulty === 'stretch') {
    if (_.sample([true, false])) {
      // ax + c = bx + d, make x the subject. Built backward from a chosen x
      // (same convention as every other Stretch band in this project) —
      // picking a, c, d independently of x would almost always leave
      // (d - c)/(a - b) an ugly fraction rather than the clean value a
      // "factor it out" exercise is meant to land on.
      const x = _.sample([-8, -6, -5, -4, -3, -2, -1, 1, 2, 3, 4, 5, 6, 8]);
      const a = _.random(2, 8);
      let b = _.random(2, 8);
      if (a === b) b += 1; // guard against a zero coefficient after subtracting
      const c = _.random(1, 20);
      const d = c + x * (a - b);
      return {
        instruction: 'Solve for x',
        questionMath: `${a}x + ${c} = ${b}x ${d >= 0 ? '+' : '-'} ${Math.abs(d)}`,
        answer: `x = ${x}`,
        workingOut: [
          `${a}x - ${b}x = ${d} - ${c}`,
          `x(${a - b}) = ${d - c}`,
          `x = ${x}`,
        ].join(NL),
        visualization: null,
        metadata: { topic: 'formula-rearrangement', difficulty, tags: ['algebra', 'formulae'] },
      };
    }
    // T = a / (x - b), make x the subject — a genuine rearrangement (the
    // answer is a formula in T, not a specific number), so there's no
    // "chosen x" to build backward from here.
    const a = _.random(2, 20), b = _.random(1, 10);
    return {
      instruction: 'Make x the subject',
      questionMath: `T = \\frac{${a}}{x - ${b}}`,
      answer: `x = \\frac{${a}}{T} + ${b}`,
      workingOut: [
        `T(x - ${b}) = ${a}`,
        `Tx - ${b}T = ${a}`,
        `Tx = ${a} + ${b}T`,
        `x = \\frac{${a} + ${b}T}{T}`,
      ].join(NL),
      visualization: null,
      metadata: { topic: 'formula-rearrangement', difficulty, tags: ['algebra', 'formulae'] },
    };
  }

  const a = _.random(2, 9);
  const b = difficulty === 'foundation' ? _.random(2, 9) : _.sample([-9, -8, -7, -6, -5, -4, -3, -2, 2, 3, 4, 5, 6, 7, 8, 9]);
  const c = _.random(5, 40);
  return {
    instruction: 'Make y the subject',
    questionMath: `${a}x ${b >= 0 ? '+' : '-'} ${Math.abs(b)}y = ${c}`,
    answer: `y = \\frac{${c} - ${a}x}{${b}}`,
    workingOut: [`${b}y = ${c} - ${a}x`, `y = \\frac{${c} - ${a}x}{${b}}`].join(NL),
    visualization: null,
    metadata: { topic: 'formula-rearrangement', difficulty, tags: ['algebra', 'formulae'] },
  };
};

// ---------------------------------------------------------------------------
// generateFormulaDerivation (Haese 7C)
// One scenario for now (savings account, gain or loss) — a second context
// is a straightforward extension later, not worth the unit-mismatch risk
// of mixing $ and litres/points contexts in a first version.
export const generateFormulaDerivation = (options = {}) => {
  const { difficulty = 'core' } = options;
  const initial = _.random(20, 80) * 10;
  const isGain = _.sample([true, false]);
  const opWord = isGain ? 'deposited into' : 'withdrawn from';
  const opSign = isGain ? '+' : '-';

  if (difficulty === 'foundation') {
    const rate = _.random(5, 50);
    const count = _.random(4, 20);
    const total = initial + (isGain ? 1 : -1) * rate * count;
    return {
      instruction: 'Write a formula for the final amount A, then work it out',
      questionText: `A savings account starts with £${initial}. £${rate} is ${opWord} it ${count} times.`,
      answer: `A = ${total}`,
      workingOut: [`A = ${initial} ${opSign} ${rate} \\times ${count}`, `A = ${total}`].join(NL),
      visualization: null,
      metadata: { topic: 'formula-derivation', difficulty, tags: ['algebra', 'formulae'] },
    };
  }

  if (difficulty === 'core') {
    const rate = _.random(5, 50);
    return {
      instruction: 'Write a formula for the final amount A in terms of n',
      questionText: `A savings account starts with £${initial}. £${rate} is ${opWord} it n times.`,
      answer: `A = ${initial} ${opSign} ${rate}n`,
      workingOut: `A = ${initial} ${opSign} ${rate} \\times n = ${initial} ${opSign} ${rate}n`,
      visualization: null,
      metadata: { topic: 'formula-derivation', difficulty, tags: ['algebra', 'formulae'] },
    };
  }

  return {
    instruction: 'Write a formula for the final amount A in terms of P, x and n',
    questionText: `A savings account starts with £P. £x is ${opWord} it n times.`,
    answer: `A = P ${opSign} xn`,
    workingOut: `A = P ${opSign} x \\times n = P ${opSign} xn`,
    visualization: null,
    metadata: { topic: 'formula-derivation', difficulty, tags: ['algebra', 'formulae'] },
  };
};

// ---------------------------------------------------------------------------
// generateSimultaneousEquations (Haese 7E, all three methods)
// x, y chosen first, equations built backward — same technique as everywhere
// else tonight. Elimination's working-out always scales eq1 by |b2| and eq2
// by |b1| (a Cramer's-rule-style cross-multiply) rather than hunting for the
// minimal scale factor — deliberately, since that's guaranteed correct for
// any coefficients rather than needing case-by-case sign handling.
export const generateSimultaneousEquations = (options = {}) => {
  const { difficulty = 'core' } = options;
  const method = _.sample(['equating-y', 'substitution', 'elimination']);
  const x = _.sample([-8, -7, -6, -5, -4, -3, -2, -1, 1, 2, 3, 4, 5, 6, 7, 8]);
  const y = _.sample([-8, -7, -6, -5, -4, -3, -2, -1, 1, 2, 3, 4, 5, 6, 7, 8]);

  if (method === 'equating-y') {
    const m1 = _.random(1, 5);
    const m2 = _.sample([-5, -4, -3, -2, -1, 1, 2, 3, 4, 5].filter((v) => v !== m1));
    const c1 = y - m1 * x, c2 = y - m2 * x;
    return {
      instruction: 'Find the simultaneous solution',
      questionMath: `y = ${formatLinear(m1, c1)}` + NL + `y = ${formatLinear(m2, c2)}`,
      answer: `x = ${x}, \\ y = ${y}`,
      workingOut: [
        `${formatLinear(m1, c1)} = ${formatLinear(m2, c2)} \\ \\text{(equating y)}`,
        `x = ${x}`, `y = ${y}`,
      ].join(NL),
      visualization: null,
      metadata: { topic: 'simultaneous-equations', difficulty, tags: ['algebra', 'simultaneous'] },
    };
  }

  if (method === 'substitution') {
    const m = _.sample([-4, -3, -2, -1, 1, 2, 3, 4]);
    const c = y - m * x;
    const a = _.random(1, 5), b = _.random(1, 5);
    const k = a * x + b * y;
    return {
      instruction: 'Solve simultaneously, by substitution',
      questionMath: `y = ${formatLinear(m, c)}` + NL + `${a}x ${b >= 0 ? '+' : '-'} ${Math.abs(b)}y = ${k}`,
      answer: `x = ${x}, \\ y = ${y}`,
      workingOut: [`${a}x + ${b}(${formatLinear(m, c)}) = ${k}`, `x = ${x}`, `y = ${y}`].join(NL),
      visualization: null,
      metadata: { topic: 'simultaneous-equations', difficulty, tags: ['algebra', 'simultaneous'] },
    };
  }

  const range = difficulty === 'stretch' ? [2, 9] : [2, 6];
  let a1, b1, a2, b2;
  do {
    a1 = _.random(range[0], range[1]); b1 = _.random(range[0], range[1]);
    a2 = _.random(range[0], range[1]);
    b2 = difficulty === 'foundation' ? -b1 : _.sample([-1, 1]) * _.random(range[0], range[1]);
  } while (a1 * b2 - a2 * b1 === 0);
  const k1 = a1 * x + b1 * y, k2 = a2 * x + b2 * y;

  return {
    instruction: 'Solve simultaneously, by elimination',
    questionMath: `${a1}x ${b1 >= 0 ? '+' : '-'} ${Math.abs(b1)}y = ${k1}` + NL + `${a2}x ${b2 >= 0 ? '+' : '-'} ${Math.abs(b2)}y = ${k2}`,
    answer: `x = ${x}, \\ y = ${y}`,
    workingOut: [
      `\\text{multiply the first equation by } ${Math.abs(b2)}\\text{, the second by } ${Math.abs(b1)}`,
      `${a1 * b2}x ${b1 * b2 >= 0 ? '+' : '-'} ${Math.abs(b1 * b2)}y = ${k1 * b2}`,
      `${a2 * b1}x ${b2 * b1 >= 0 ? '+' : '-'} ${Math.abs(b2 * b1)}y = ${k2 * b1}`,
      `\\text{subtract: } ${a1 * b2 - a2 * b1}x = ${k1 * b2 - k2 * b1}`,
      `x = ${x}`, `y = ${y}`,
    ].join(NL),
    visualization: null,
    metadata: { topic: 'simultaneous-equations', difficulty, tags: ['algebra', 'simultaneous'] },
  };
};

// ---------------------------------------------------------------------------
// generateSimultaneousGraphical (Y9 Unit 2 do-nows)
//   foundation  both lines drawn, read the crossing
//   core        two lines y = mx + c, draw them, then read the crossing
//   stretch     one line in the form ax + by = d, plotted from its intercepts
// The crossing is chosen first and is always a whole-number grid point, in
// the first quadrant or close to it, since the class draws its own axes.
const pointOf = (x, y) => `(${x}, ${y})`;

// A square window around the crossing that always includes the origin, so
// both axes are on screen — the same squaring-up the drawn-points grid does.
const windowAround = (px, py) => {
  let x0 = Math.min(-1, px - 3); let x1 = Math.max(1, px + 3);
  let y0 = Math.min(-1, py - 3); let y1 = Math.max(1, py + 3);
  while (x1 - x0 < y1 - y0) { if ((x1 - x0) % 2) x1 += 1; else x0 -= 1; }
  while (y1 - y0 < x1 - x0) { if ((y1 - y0) % 2) y1 += 1; else y0 -= 1; }
  return [x0, x1, y0, y1];
};

export const generateSimultaneousGraphical = (options = {}) => {
  const { difficulty = 'core' } = options;
  const answerOf = (x, y) => `x = ${x}, \\ y = ${y}`;
  const meta = { topic: 'simultaneous-graphical', difficulty };

  if (difficulty === 'stretch') {
    let a, b, d, px, py;
    do {
      a = _.random(1, 4); b = _.random(1, 4);
      px = _.random(0, 5); py = _.random(0, 6);
      d = a * px + b * py;
    } while (d === 0 || d % a !== 0 || d % b !== 0 || d / a > 10 || d / b > 10 || (px === 0 && py === 0));
    let m;
    do { m = _.sample([-2, -1, 1, 2, 3]); } while (m * b === -a); // not parallel
    const c = py - m * px;
    const general = `${a === 1 ? '' : a}x + ${b === 1 ? '' : b}y = ${d}`;
    return {
      instruction: 'Solve graphically: draw both lines and find where they cross',
      questionMath: `${general}${NL}y = ${formatLinear(m, c)}`,
      answer: answerOf(px, py),
      workingOut: [
        `${general}\\text{ crosses the axes at } ${pointOf(d / a, 0)} \\text{ and } ${pointOf(0, d / b)}`,
        `y = ${formatLinear(m, c)}\\text{ passes through } ${pointOf(0, c)} \\text{ and } ${pointOf(1, m + c)}`,
        `\\text{the lines cross at } ${pointOf(px, py)}`,
      ].join(NL),
      visualization: null,
      metadata: meta,
    };
  }

  // On the board the crossing is never on an axis: there both lines run over
  // the very axis numbers the answer is read from.
  const px = difficulty === 'foundation' ? _.sample([-2, -1, 1, 2, 3, 4]) : _.random(0, 4);
  const py = difficulty === 'foundation' ? _.sample([-2, -1, 1, 2, 3, 4, 5, 6]) : _.random(0, 6);
  const m1 = _.random(1, 3);
  const m2 = _.sample([-3, -2, -1, ...(difficulty === 'foundation' ? [] : [m1 === 1 ? 2 : 1])]);
  const c1 = py - m1 * px;
  const c2 = py - m2 * px;
  const questionMath = `y = ${formatLinear(m1, c1)}${NL}y = ${formatLinear(m2, c2)}`;

  if (difficulty === 'foundation') {
    return {
      instruction: 'Use the graph to solve the simultaneous equations',
      questionMath,
      answer: answerOf(px, py),
      workingOut: `\\text{the lines cross at } ${pointOf(px, py)}${NL}${answerOf(px, py)}`,
      visualization: { type: 'coordinate-grid', lines: [{ m: m1, c: c1 }, { m: m2, c: c2 }], window: windowAround(px, py), big: true },
      metadata: meta,
    };
  }

  const table = (m, c) => [0, 1, 2].map((x) => pointOf(x, m * x + c)).join(',\\ ');
  return {
    instruction: 'Solve graphically: draw both lines and find where they cross',
    questionMath,
    answer: answerOf(px, py),
    workingOut: [
      `y = ${formatLinear(m1, c1)}: \\ ${table(m1, c1)}`,
      `y = ${formatLinear(m2, c2)}: \\ ${table(m2, c2)}`,
      `\\text{the lines cross at } ${pointOf(px, py)}`,
    ].join(NL),
    visualization: null,
    metadata: meta,
  };
};

// ---------------------------------------------------------------------------
// generateSimultaneousProblemSolving (Haese 7F + Rayner 3.25#10) — topic
// 'Problem solving', the same one angles-problem-solving already lives in.
export const generateSimultaneousProblemSolving = (options = {}) => {
  const { difficulty = 'core' } = options;
  const pool = difficulty === 'foundation' ? ['numbers', 'coins']
    : difficulty === 'core' ? ['numbers', 'coins', 'items']
    : ['coins', 'items', 'triangle-angles'];
  const scenario = _.sample(pool);

  if (scenario === 'numbers') {
    const a = _.random(15, 60), b = _.random(5, a - 5);
    const sum = a + b, diff = a - b;
    return {
      instruction: 'Form two equations and solve',
      questionText: `Two numbers have a sum of ${sum} and a difference of ${diff}. Find the numbers.`,
      answer: `${a} \\text{ and } ${b}`,
      workingOut: [`x + y = ${sum}`, `x - y = ${diff}`, `2x = ${sum + diff} \\ \\text{(adding)}`, `x = ${a}, \\ y = ${b}`].join(NL),
      visualization: null,
      metadata: { topic: 'simultaneous-problem-solving', difficulty, tags: ['algebra', 'simultaneous', 'problem-solving'] },
    };
  }

  if (scenario === 'coins') {
    const denomA = _.sample([1, 2, 5]);
    const denomB = _.sample([10, 20, 50].filter((d) => d !== denomA));
    const countA = _.random(5, 20), countB = _.random(5, 20);
    const totalCoins = countA + countB;
    const totalValue = denomA * countA + denomB * countB;
    return {
      instruction: 'Form two equations and solve',
      questionText: `A jar holds ${totalCoins} coins, all ${denomA}p or ${denomB}p. Their total value is ${totalValue}p. How many of each coin are there?`,
      answer: `${countA} \\times ${denomA}\\text{p}, \\ ${countB} \\times ${denomB}\\text{p}`,
      workingOut: [`x + y = ${totalCoins}`, `${denomA}x + ${denomB}y = ${totalValue}`, `x = ${countA}, \\ y = ${countB}`].join(NL),
      visualization: null,
      metadata: { topic: 'simultaneous-problem-solving', difficulty, tags: ['algebra', 'simultaneous', 'problem-solving'] },
    };
  }

  if (scenario === 'items') {
    const priceA = _.random(2, 12) * 5, priceB = _.random(2, 12) * 5;
    // Reject quantity pairs whose two equations are linearly dependent
    // (proportional coefficients) — without this, the "system" can have
    // no unique solution (or infinitely many), even though priceA/priceB
    // was chosen up front, because a second equation that's just a scaled
    // copy of the first pins down nothing new.
    let qty1A, qty1B, qty2A, qty2B;
    do {
      qty1A = _.random(2, 8); qty1B = _.random(2, 8);
      qty2A = _.random(2, 8); qty2B = _.random(2, 8);
    } while (qty1A * qty2B - qty2A * qty1B === 0);
    const total1 = qty1A * priceA + qty1B * priceB;
    const total2 = qty2A * priceA + qty2B * priceB;
    const itemA = _.sample(['apples', 'pens', 'mangoes', 'notebooks']);
    const itemB = _.sample(['oranges', 'rulers', 'papayas', 'pencils'].filter((i) => i !== itemA));
    return {
      instruction: 'Form two equations and solve',
      questionText: `${qty1A} ${itemA} and ${qty1B} ${itemB} cost ${total1}p. ${qty2A} ${itemA} and ${qty2B} ${itemB} cost ${total2}p. Find the cost of each.`,
      answer: `\\text{${itemA}: } ${priceA}\\text{p}, \\ \\text{${itemB}: } ${priceB}\\text{p}`,
      workingOut: [`${qty1A}x + ${qty1B}y = ${total1}`, `${qty2A}x + ${qty2B}y = ${total2}`, `x = ${priceA}, \\ y = ${priceB}`].join(NL),
      visualization: null,
      metadata: { topic: 'simultaneous-problem-solving', difficulty, tags: ['algebra', 'simultaneous', 'problem-solving'] },
    };
  }

  // Two angles labelled x and y (related by a stated difference), the third
  // given numerically - a genuine two-equation system, reusing the
  // existing triangle figure.
  let given, diff, remainderSum, x, y;
  do {
    given = _.random(30, 90);
    diff = _.random(5, 40);
    remainderSum = 180 - given;
    y = (remainderSum + diff) / 2;
    x = y - diff;
  } while (!Number.isInteger(x) || !Number.isInteger(y) || x < 5 || y < 5);

  return {
    // Plain prose, not KaTeX (this field never goes through MathDisplay) —
    // a literal ° character, not the LaTeX \circ command.
    instruction: `In the triangle, one unknown angle is ${diff}° more than the other. Find both.`,
    questionMath: `x + ${given}^\\circ + y = 180^\\circ, \\quad y = x + ${diff}^\\circ`,
    answer: `x = ${x}^\\circ, \\ y = ${y}^\\circ`,
    workingOut: [
      `x + y = ${remainderSum}^\\circ \\ \\text{(angle sum of a triangle)}`,
      `y = x + ${diff}^\\circ`,
      `x + (x + ${diff}) = ${remainderSum}`,
      `x = ${x}^\\circ, \\ y = ${y}^\\circ`,
    ].join(NL),
    visualization: { type: 'triangle', labels: ['x', 'y', `${given}^\\circ`], big: true },
    metadata: { topic: 'simultaneous-problem-solving', difficulty, tags: ['algebra', 'simultaneous', 'problem-solving', 'angles'] },
  };
};
