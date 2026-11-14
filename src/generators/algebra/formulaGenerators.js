// src/generators/algebra/formulaGenerators.js
//
// Haese Chapter 7 — formulae and simultaneous equations. Simultaneous
// equations are two skills, by substitution and by elimination (skill-ladder
// review); elimination scales by the smallest multipliers that match the y
// coefficients. Checked in formulaLadder.test.js.

import _ from 'lodash';

const NL = '\n';

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
// generateFormulaSubstitution (Haese 7A), reworked in the skill-ladder review
// for variety: real formulae only (never invented), and many more of them.
//   foundation  substitute forward                         v = u + at
//   core        substitute, then solve for the one left    23 = 3 + 5a
//   stretch     rearrange first, then substitute: a square or a root to undo
//
// Each formula lists its letters with a range for each, how to work out its
// subject, and, for Core, how to solve for each other letter. Core builds
// the question backward from a whole-number answer, so the solving is clean.
// `pi` marks the formulae whose answers are rounded to 3 s.f.
// 3 significant figures as text, trailing zeros kept (12.0, not 12) and
// never in exponent form (6280, not 6.28e+3).
const S3 = (v) => {
  const r = Number(v.toPrecision(3));
  const mag = Math.floor(Math.log10(Math.abs(r)) + 1e-12);
  return r.toFixed(Math.max(0, 2 - mag));
};
const fmt = (v) => String(v);
const LINEAR_FORMULAS = [
  {
    tex: 'v = u + at', subject: 'v', vars: { u: [0, 20], a: [2, 10], t: [2, 12] },
    value: ({ u, a, t }) => u + a * t,
    sub: ({ u, a, t }) => `${u} + ${a} \\times ${t}`,
    solve: { u: 'v - at', a: '\\frac{v - u}{t}', t: '\\frac{v - u}{a}' },
  },
  {
    tex: 'A = \\frac{1}{2}bh', subject: 'A', vars: { b: [2, 20, 2], h: [2, 15] },
    value: ({ b, h }) => (b * h) / 2,
    sub: ({ b, h }) => `\\frac{1}{2} \\times ${b} \\times ${h}`,
    solve: { b: '\\frac{2A}{h}', h: '\\frac{2A}{b}' },
  },
  {
    tex: 'P = 2(l + w)', subject: 'P', vars: { l: [3, 25], w: [2, 15] },
    value: ({ l, w }) => 2 * (l + w),
    sub: ({ l, w }) => `2(${l} + ${w})`,
    solve: { l: '\\frac{P}{2} - w', w: '\\frac{P}{2} - l' },
  },
  {
    tex: 'A = \\frac{1}{2}(a + b)h', subject: 'A', vars: { a: [2, 12], b: [3, 16], h: [2, 12, 2] },
    value: ({ a, b, h }) => ((a + b) * h) / 2,
    sub: ({ a, b, h }) => `\\frac{1}{2}(${a} + ${b}) \\times ${h}`,
    solve: { h: '\\frac{2A}{a + b}' },
  },
  {
    tex: 'V = lwh', subject: 'V', vars: { l: [2, 12], w: [2, 10], h: [2, 10] },
    value: ({ l, w, h }) => l * w * h,
    sub: ({ l, w, h }) => `${l} \\times ${w} \\times ${h}`,
    solve: { h: '\\frac{V}{lw}', l: '\\frac{V}{wh}' },
  },
  {
    tex: 'F = ma', subject: 'F', vars: { m: [2, 30], a: [2, 12] },
    value: ({ m, a }) => m * a,
    sub: ({ m, a }) => `${m} \\times ${a}`,
    solve: { m: '\\frac{F}{a}', a: '\\frac{F}{m}' },
  },
  {
    tex: 'd = st', subject: 'd', vars: { s: [3, 90], t: [2, 9] },
    value: ({ s, t }) => s * t,
    sub: ({ s, t }) => `${s} \\times ${t}`,
    solve: { s: '\\frac{d}{t}', t: '\\frac{d}{s}' },
  },
  {
    tex: 'F = \\frac{9}{5}C + 32', subject: 'F', vars: { C: [-8, 20, 5] },
    value: ({ C }) => (9 * C) / 5 + 32,
    sub: ({ C }) => `\\frac{9}{5} \\times ${C < 0 ? `(${C})` : C} + 32`,
    solve: { C: '\\frac{5(F - 32)}{9}' },
  },
  {
    tex: 'C = 2\\pi r', subject: 'C', vars: { r: [2, 25] }, pi: true, figure: { type: 'circle', r: 'r' },
    value: ({ r }) => 2 * Math.PI * r,
    sub: ({ r }) => `2\\pi \\times ${r}`,
  },
  {
    tex: 'V = \\pi r^2 h', subject: 'V', vars: { r: [2, 10], h: [3, 20] }, pi: true, figure: { type: 'cylinder', r: 'r', h: 'h' },
    value: ({ r, h }) => Math.PI * r * r * h,
    sub: ({ r, h }) => `\\pi \\times ${r}^2 \\times ${h}`,
  },
];

// Stretch: the letter wanted is squared or under a root, so the formula is
// rearranged before anything is substituted. `make` is the rearranged
// formula; answers to 3 s.f.
const POWER_FORMULAS = [
  {
    tex: 'A = \\pi r^2', want: 'r', given: { A: [20, 900] }, figure: { type: 'circle', r: 'r' },
    make: 'r = \\sqrt{\\frac{A}{\\pi}}', value: ({ A }) => Math.sqrt(A / Math.PI), sub: ({ A }) => `\\sqrt{\\frac{${A}}{\\pi}}`,
  },
  {
    tex: 'A = 4\\pi r^2', want: 'r', given: { A: [50, 2000] }, figure: { type: 'sphere', r: 'r' },
    make: 'r = \\sqrt{\\frac{A}{4\\pi}}', value: ({ A }) => Math.sqrt(A / (4 * Math.PI)), sub: ({ A }) => `\\sqrt{\\frac{${A}}{4\\pi}}`,
  },
  {
    tex: 'V = \\pi r^2 h', want: 'r', given: { V: [100, 3000], h: [3, 20] }, figure: { type: 'cylinder', r: 'r', h: 'h' },
    make: 'r = \\sqrt{\\frac{V}{\\pi h}}', value: ({ V, h }) => Math.sqrt(V / (Math.PI * h)), sub: ({ V, h }) => `\\sqrt{\\frac{${V}}{\\pi \\times ${h}}}`,
  },
  {
    tex: 'E = \\frac{1}{2}mv^2', want: 'v', given: { E: [50, 900], m: [2, 20] },
    make: 'v = \\sqrt{\\frac{2E}{m}}', value: ({ E, m }) => Math.sqrt((2 * E) / m), sub: ({ E, m }) => `\\sqrt{\\frac{2 \\times ${E}}{${m}}}`,
  },
  {
    tex: 'v^2 = u^2 + 2as', want: 'u', given: { v: [15, 40], a: [1, 5], s: [5, 40] },
    make: 'u = \\sqrt{v^2 - 2as}', value: ({ v, a, s }) => Math.sqrt(v * v - 2 * a * s), sub: ({ v, a, s }) => `\\sqrt{${v}^2 - 2 \\times ${a} \\times ${s}}`,
    ok: ({ v, a, s }) => v * v - 2 * a * s > 4,
  },
  {
    tex: 'c = \\sqrt{a^2 + b^2}', want: 'a', given: { c: [10, 40], b: [3, 25] },
    make: 'a = \\sqrt{c^2 - b^2}', value: ({ c, b }) => Math.sqrt(c * c - b * b), sub: ({ c, b }) => `\\sqrt{${c}^2 - ${b}^2}`,
    ok: ({ c, b }) => c > b + 1,
  },
  {
    tex: 'T = 2\\pi\\sqrt{\\frac{l}{g}}', want: 'l', given: { T: [2, 6], g: [10, 10] },
    make: 'l = g\\left(\\frac{T}{2\\pi}\\right)^2', value: ({ T, g }) => g * (T / (2 * Math.PI)) ** 2, sub: ({ T, g }) => `${g}\\left(\\frac{${T}}{2\\pi}\\right)^2`,
  },
];

const pick = ([lo, hi, by = 1]) => _.random(Math.ceil(lo / by), Math.floor(hi / by)) * by;
const givenLine = (vals) => Object.entries(vals).map(([k, v]) => `${k} = ${v}`).join(', \\; ');
const isWhole = (v) => Math.abs(v - Math.round(v)) < 1e-9;

export const generateFormulaSubstitution = (options = {}) => {
  const { difficulty = 'core' } = options;
  const meta = { topic: 'formula-substitution', difficulty, tags: ['algebra', 'formulae'] };

  if (difficulty === 'stretch') {
    for (;;) {
      const f = _.sample(POWER_FORMULAS);
      const vals = _.mapValues(f.given, pick);
      if (f.ok && !f.ok(vals)) continue;
      const x = f.value(vals);
      if (isWhole(x)) continue; // a rounded answer, not a whole one
      const ans = S3(x);
      return {
        instruction: `Make ${f.want} the subject, then find ${f.want} correct to 3 significant figures`,
        questionMath: `${f.tex}${NL}${givenLine(vals)}`,
        answer: `${f.want} = ${fmt(ans)}`,
        workingOut: [f.make, `${f.want} = ${f.sub(vals)}`, `${f.want} = ${fmt(ans)}`].join(NL),
        visualization: f.figure ?? null,
        metadata: meta,
      };
    }
  }

  if (difficulty === 'foundation') {
    for (;;) {
      const f = _.sample(LINEAR_FORMULAS);
      const vals = _.mapValues(f.vars, pick);
      if (Object.values(vals).includes(0)) continue; // a zero would hide a wrong coefficient
      const v = f.value(vals);
      if (!f.pi && !isWhole(v)) continue;
      const ans = f.pi ? S3(v) : Math.round(v);
      return {
        instruction: `Use the formula to find ${f.subject}${f.pi ? ', correct to 3 significant figures' : ''}`,
        questionMath: `${f.tex}${NL}${givenLine(vals)}`,
        answer: `${f.subject} = ${fmt(ans)}`,
        workingOut: [`${f.subject} = ${f.sub(vals)}`, `${f.subject} = ${fmt(ans)}`].join(NL),
        visualization: f.figure ?? null,
        metadata: meta,
      };
    }
  }

  // Core: the subject's value is given, and one other letter is wanted.
  for (;;) {
    const f = _.sample(LINEAR_FORMULAS.filter((x) => x.solve));
    const want = _.sample(Object.keys(f.solve));
    const vals = _.mapValues(f.vars, pick);
    if (Object.values(vals).includes(0)) continue;
    const total = f.value(vals);
    if (!isWhole(total)) continue;
    const given = { [f.subject]: total, ..._.omit(vals, want) };
    return {
      instruction: `Use the formula to find ${want}`,
      questionMath: `${f.tex}${NL}${givenLine(given)}`,
      answer: `${want} = ${vals[want]}`,
      workingOut: [`${total} = ${f.sub({ ...vals, [want]: want })}`, `${want} = ${f.solve[want]}`, `${want} = ${vals[want]}`].join(NL),
      visualization: f.figure ?? null,
      metadata: meta,
    };
  }
};

// ---------------------------------------------------------------------------
// generateFormulaRearrangement (Haese 7B + 7D), reworked in the skill-ladder
// review. Solving ax + c = bx + d for a number has gone: that is an
// equation, and the Equations topic has it (unknown on both sides).
//   foundation  ax + by = c, b positive: y = (c - ax)/b
//   core        a negative coefficient, the answer tidied so its top leads
//               with a positive term: y = (4x - 20)/3, never (20 - 4x)/-3
//   stretch     the subject in a denominator, or under a root
const signedTerm = (n, letter) => `${n < 0 ? '-' : '+'} ${Math.abs(n) === 1 ? '' : Math.abs(n)}${letter}`;
const leadTerm = (n, letter) => `${n === 1 ? '' : n === -1 ? '-' : n}${letter}`;

export const generateFormulaRearrangement = (options = {}) => {
  const { difficulty = 'core' } = options;
  const meta = { topic: 'formula-rearrangement', difficulty, tags: ['algebra', 'formulae'] };

  if (difficulty === 'stretch') {
    const kind = _.sample(['denominator', 'root', 'square root of a sum']);
    if (kind === 'denominator') {
      // T = a/(x - b): x = (a + bT)/T.
      const a = _.random(2, 30);
      const b = _.random(1, 12);
      return {
        instruction: 'Make x the subject',
        questionMath: `T = \\frac{${a}}{x - ${b}}`,
        answer: `x = \\frac{${a} + ${b}T}{T}`,
        workingOut: [`T(x - ${b}) = ${a}`, `Tx - ${b}T = ${a}`, `Tx = ${a} + ${b}T`, `x = \\frac{${a} + ${b}T}{T}`].join(NL),
        visualization: null,
        metadata: meta,
      };
    }
    if (kind === 'root') {
      // y = a\sqrt{x}: x = y^2/a^2.
      const a = _.random(2, 12);
      return {
        instruction: 'Make x the subject',
        questionMath: `y = ${a}\\sqrt{x}`,
        answer: `x = \\frac{y^2}{${a * a}}`,
        workingOut: [`\\frac{y}{${a}} = \\sqrt{x}`, `x = \\frac{y^2}{${a * a}}`].join(NL),
        visualization: null,
        metadata: meta,
      };
    }
    // y = \sqrt{x + b} - c, or \sqrt{ax - b}: square after isolating the root.
    const a = _.random(2, 9);
    const b = _.random(1, 20);
    return {
      instruction: 'Make x the subject',
      questionMath: `y = \\sqrt{${a}x - ${b}}`,
      answer: `x = \\frac{y^2 + ${b}}{${a}}`,
      workingOut: [`y^2 = ${a}x - ${b}`, `${a}x = y^2 + ${b}`, `x = \\frac{y^2 + ${b}}{${a}}`].join(NL),
      visualization: null,
      metadata: meta,
    };
  }

  const a = _.random(2, 9);
  const c = _.random(5, 40);
  const b0 = _.random(2, 9);
  // Nothing common to all three, or the answer would simplify further.
  if (gcdOf(gcdOf(a, b0), c) !== 1) return generateFormulaRearrangement(options);
  if (difficulty === 'foundation') {
    const b = b0;
    return {
      instruction: 'Make y the subject',
      questionMath: `${a}x + ${b}y = ${c}`,
      answer: `y = \\frac{${c} - ${a}x}{${b}}`,
      workingOut: [`${b}y = ${c} - ${a}x`, `y = \\frac{${c} - ${a}x}{${b}}`].join(NL),
      visualization: null,
      metadata: meta,
    };
  }
  // Core: by = c - ax with b negative: divide by b and tidy the signs.
  const b = -b0;
  const sa = _.sample([1, -1]) * a;   // the x coefficient, either sign
  // y = (c - sa x)/b = (sa x - c)/|b|
  const top = `${leadTerm(sa, 'x')} - ${c}`;
  return {
    instruction: 'Make y the subject',
    questionMath: `${leadTerm(sa, 'x')} ${signedTerm(b, 'y')} = ${c}`,
    answer: sa > 0 ? `y = \\frac{${top}}{${-b}}` : `y = -\\frac{${-sa}x + ${c}}{${-b}}`,
    workingOut: [
      `${b}y = ${c} ${signedTerm(-sa, 'x')}`,
      `y = \\frac{${c} ${signedTerm(-sa, 'x')}}{${b}}`,
      sa > 0 ? `y = \\frac{${top}}{${-b}}` : `y = -\\frac{${-sa}x + ${c}}{${-b}}`,
    ].join(NL),
    visualization: null,
    metadata: meta,
  };
};

// ---------------------------------------------------------------------------
// generateFormulaDerivation (Haese 7C)
// One worded situation per context, each a starting value and a steady change.
// The same sentence serves all three bands: Foundation fills in every number,
// Core leaves the count as a letter, Stretch leaves all three as letters.
//
//   text     the situation, given its three quantities as strings
//   letter   the subject of the formula, and `of` what it stands for
//   vars     the letters Stretch uses for the start, the rate and the count;
//            `count` is the one Core keeps
//   sign     +1 or -1: whether the rate adds to the start or takes from it
//   reversed the rate comes first, as a profit does: P = rn - s
//   money    show the Foundation answer in pounds; otherwise `units`
const DERIVATION_CONTEXTS = [
  {
    letter: 'A', of: 'the final amount', vars: ['P', 'x', 'n'], sign: 1, money: true,
    start: [20, 80, 10], rate: [5, 50, 5], count: [4, 20],
    text: (s, r, n) => `A savings account starts with £${s}. £${r} is deposited into it ${n} times.`,
  },
  {
    letter: 'A', of: 'the final amount', vars: ['P', 'x', 'n'], sign: -1, money: true,
    start: [40, 90, 10], rate: [5, 25, 5], count: [4, 12],
    text: (s, r, n) => `A savings account starts with £${s}. £${r} is withdrawn from it ${n} times.`,
  },
  {
    letter: 'C', of: 'the total cost', vars: ['F', 'r', 'm'], sign: 1, money: true,
    start: [2, 6, 1], rate: [1, 3, 1], count: [3, 25],
    text: (s, r, n) => `A taxi charges a fixed fee of £${s}, plus £${r} per mile. A journey is ${n} miles.`,
  },
  {
    letter: 'C', of: 'the total cost', vars: ['F', 'r', 'h'], sign: 1, money: true,
    start: [3, 8, 10], rate: [2, 6, 10], count: [2, 9],
    text: (s, r, n) => `A plumber charges a call-out fee of £${s}, plus £${r} per hour. A job takes ${n} hours.`,
  },
  {
    letter: 'C', of: 'the total cost', vars: ['B', 'p', 'n'], sign: 1, money: true,
    start: [15, 45, 10], rate: [4, 15, 1], count: [12, 32],
    text: (s, r, n) => `A school trip pays £${s} for a coach, plus £${r} for each of the ${n} students.`,
  },
  {
    letter: 'P', of: 'the profit', vars: ['c', 'x', 'n'], sign: -1, reversed: true, money: true,
    start: [2, 8, 10], rate: [2, 6, 1], count: [40, 90],
    text: (s, r, n) => `A baker spends £${s} on ingredients, then sells ${n} cakes at £${r} each.`,
  },
  {
    letter: 'V', of: 'the final volume', vars: ['a', 'r', 't'], sign: 1, units: 'litres',
    start: [5, 30, 10], rate: [2, 12, 1], count: [3, 20],
    text: (s, r, n) => `A tank holds ${s} litres of water. A tap adds ${r} litres per minute for ${n} minutes.`,
  },
  {
    letter: 'V', of: 'the final volume', vars: ['a', 'r', 't'], sign: -1, units: 'litres',
    start: [40, 90, 10], rate: [5, 20, 1], count: [3, 15],
    text: (s, r, n) => `A tank holds ${s} litres of water. It drains at ${r} litres per minute for ${n} minutes.`,
  },
  {
    letter: 'H', of: 'the final height', vars: ['a', 'r', 't'], sign: -1, units: 'cm',
    start: [18, 40, 1], rate: [1, 3, 1], count: [2, 8],
    text: (s, r, n) => `A candle is ${s} cm tall. It burns down ${r} cm every hour for ${n} hours.`,
  },
];

const stepped = ([lo, hi, by = 1]) => _.random(lo, hi) * by;

export const generateFormulaDerivation = (options = {}) => {
  const { difficulty = 'core' } = options;
  const ctx = _.sample(DERIVATION_CONTEXTS);
  const { letter: L } = ctx;
  const meta = { topic: 'formula-derivation', difficulty, tags: ['algebra', 'formulae'] };
  // The two ways round: A = 800 - 25n, and P = 3n - 40.
  const formula = (s, rn) => {
    if (ctx.reversed) return `${L} = ${rn} - ${s}`;
    return `${L} = ${s} ${ctx.sign > 0 ? '+' : '-'} ${rn}`;
  };

  if (difficulty === 'stretch') {
    const [s, r, n] = ctx.vars;
    return {
      instruction: `Write a formula for ${ctx.of} ${L} in terms of ${s}, ${r} and ${n}`,
      questionText: ctx.text(s, r, n),
      answer: formula(s, `${r}${n}`),
      workingOut: formula(s, `${r} \\times ${n}`) + NL + formula(s, `${r}${n}`),
      visualization: null,
      metadata: meta,
    };
  }

  // Redrawn until the total is a positive amount: an account can't be
  // overdrawn, and a tank can't go below empty, in a question this simple.
  for (;;) {
    const s = stepped(ctx.start);
    const r = stepped(ctx.rate);

    if (difficulty === 'core') {
      const n = ctx.vars[2];
      return {
        instruction: `Write a formula for ${ctx.of} ${L} in terms of ${n}`,
        questionText: ctx.text(s, r, n),
        answer: formula(s, `${r}${n}`),
        workingOut: formula(s, `${r} \\times ${n}`) + NL + formula(s, `${r}${n}`),
        visualization: null,
        metadata: meta,
      };
    }

    const n = _.random(ctx.count[0], ctx.count[1]);
    const value = ctx.reversed ? r * n - s : s + ctx.sign * r * n;
    if (value <= 0) continue;
    return {
      instruction: `Write a formula for ${ctx.of} ${L}, then work it out`,
      questionText: ctx.text(s, r, n),
      answer: `${L} = ${ctx.money ? '\\pounds ' : ''}${value}`,
      ...(ctx.units ? { answerUnits: ctx.units } : {}),
      workingOut: formula(s, `${r} \\times ${n}`) + NL + `${L} = ${value}`,
      visualization: null,
      metadata: meta,
    };
  }
};

// ---------------------------------------------------------------------------
// Simultaneous equations (Haese 7E), split by method in the skill-ladder
// review. x and y are chosen first and the equations built backward.
const VALUES = [-8, -7, -6, -5, -4, -3, -2, -1, 1, 2, 3, 4, 5, 6, 7, 8];
const eqn = (a, b, k) => `${leadTerm(a, 'x')} ${signedTerm(b, 'y')} = ${k}`;
const ANSWER = (x, y) => `x = ${x}, \\ y = ${y}`;
const simMeta = (topic, difficulty) => ({ topic, difficulty, tags: ['algebra', 'simultaneous'] });

//   foundation  y = mx + c with a simple equation: another y = ..., or x + y = k
//   core        y = mx + c into ax + by = k with coefficients
//   stretch     neither in y = form: one is rearranged first
export const generateSimultaneousSubstitution = (options = {}) => {
  const { difficulty = 'core' } = options;
  const x = _.sample(VALUES);
  const y = _.sample(VALUES);
  const meta = simMeta('simultaneous-substitution', difficulty);
  const instruction = 'Solve simultaneously, by substitution';

  if (difficulty === 'foundation') {
    const m1 = _.random(1, 5);
    if (Math.random() < 0.5) {
      const m2 = _.sample([-3, -2, -1, 1, 2, 3, 4].filter((v) => v !== m1));
      const [c1, c2] = [y - m1 * x, y - m2 * x];
      return {
        instruction,
        questionMath: `y = ${formatLinear(m1, c1)}${NL}y = ${formatLinear(m2, c2)}`,
        answer: ANSWER(x, y),
        workingOut: [`${formatLinear(m1, c1)} = ${formatLinear(m2, c2)}`, `x = ${x}`, `y = ${y}`].join(NL),
        visualization: null,
        metadata: meta,
      };
    }
    const c = y - m1 * x;
    return {
      instruction,
      questionMath: `y = ${formatLinear(m1, c)}${NL}x + y = ${x + y}`,
      answer: ANSWER(x, y),
      workingOut: [`x + ${formatLinear(m1, c).startsWith('-') ? `(${formatLinear(m1, c)})` : formatLinear(m1, c)} = ${x + y}`, `x = ${x}`, `y = ${y}`].join(NL),
      visualization: null,
      metadata: meta,
    };
  }

  if (difficulty === 'core') {
    const m = _.sample([-4, -3, -2, -1, 2, 3, 4]);
    const c = y - m * x;
    const a = _.random(2, 6);
    const b = _.sample([-1, 1]) * _.random(2, 6);
    if (a + b * m === 0) return generateSimultaneousSubstitution(options);
    return {
      instruction,
      questionMath: `y = ${formatLinear(m, c)}${NL}${eqn(a, b, a * x + b * y)}`,
      answer: ANSWER(x, y),
      workingOut: [`${a}x ${b < 0 ? '-' : '+'} ${Math.abs(b)}(${formatLinear(m, c)}) = ${a * x + b * y}`, `x = ${x}`, `y = ${y}`].join(NL),
      visualization: null,
      metadata: meta,
    };
  }

  // Stretch: x + py = k1 (x has a coefficient of 1, so it is the one to
  // make the subject) with ax + by = k2.
  const p = _.sample([-1, 1]) * _.random(2, 5);
  const a = _.random(2, 5);
  const b = _.sample([-1, 1]) * _.random(2, 6);
  if (b - a * p === 0) return generateSimultaneousSubstitution(options);
  const k1 = x + p * y;
  const k2 = a * x + b * y;
  const rearranged = `x = ${k1} ${signedTerm(-p, 'y')}`;
  return {
    instruction,
    questionMath: `${eqn(1, p, k1)}${NL}${eqn(a, b, k2)}`,
    answer: ANSWER(x, y),
    workingOut: [rearranged, `${a}(${k1} ${signedTerm(-p, 'y')}) ${signedTerm(b, 'y')} = ${k2}`, `y = ${y}`, `x = ${x}`].join(NL),
    visualization: null,
    metadata: meta,
  };
};

//   foundation  one coefficient already matches: add or subtract
//   core        multiply one equation to match a coefficient
//   stretch     multiply both
export const generateSimultaneousElimination = (options = {}) => {
  const { difficulty = 'core' } = options;
  const meta = simMeta('simultaneous-elimination', difficulty);
  for (;;) {
    const x = _.sample(VALUES);
    const y = _.sample(VALUES);
    let a1; let b1; let a2; let b2; let m1; let m2;
    if (difficulty === 'foundation') {
      // The y coefficients match, or are opposite.
      b1 = _.random(1, 6);
      b2 = _.sample([-1, 1]) * b1;
      a1 = _.random(1, 7);
      a2 = _.random(1, 7);
      [m1, m2] = [1, 1];
    } else if (difficulty === 'core') {
      // Times the first equation by k matches y.
      b1 = _.random(1, 4);
      const k = _.random(2, 4);
      b2 = _.sample([-1, 1]) * k * b1;
      a1 = _.random(1, 6);
      a2 = _.random(1, 9);
      [m1, m2] = [k, 1];
    } else {
      // Neither y coefficient divides the other, nor does either x one.
      b1 = _.random(2, 7);
      b2 = _.sample([-1, 1]) * _.random(2, 7);
      a1 = _.random(2, 7);
      a2 = _.random(2, 7);
      const divides = (u, v) => Math.abs(u) % Math.abs(v) === 0 || Math.abs(v) % Math.abs(u) === 0;
      if (divides(b1, b2) || divides(a1, a2)) continue;
      const l = (Math.abs(b1) * Math.abs(b2)) / gcdOf(b1, b2);
      [m1, m2] = [l / Math.abs(b1), l / Math.abs(b2)];
    }
    if (a1 * b2 - a2 * b1 === 0) continue;
    if (difficulty === 'core' && (a2 % a1 === 0 || a2 === a1)) continue; // x matching by accident
    const [k1, k2] = [a1 * x + b1 * y, a2 * x + b2 * y];
    // An equation with a common factor could be divided down first, which
    // would change which multiplying the band asks for.
    if (gcdOf(gcdOf(a1, b1), k1) !== 1 || gcdOf(gcdOf(a2, b2), k2) !== 1) continue;
    const scaled = [[a1 * m1, b1 * m1, k1 * m1], [a2 * m2, b2 * m2, k2 * m2]];
    const add = scaled[0][1] === -scaled[1][1];
    const ax = add ? scaled[0][0] + scaled[1][0] : scaled[0][0] - scaled[1][0];
    const kx = add ? scaled[0][2] + scaled[1][2] : scaled[0][2] - scaled[1][2];
    if (ax === 0) continue;
    const steps = [];
    if (m1 !== 1) steps.push(`${eqn(...scaled[0])} \\quad (\\times ${m1})`);
    if (m2 !== 1) steps.push(`${eqn(...scaled[1])} \\quad (\\times ${m2})`);
    steps.push(`${add ? '\\text{add: }' : '\\text{subtract: }'} ${leadTerm(ax, 'x')} = ${kx}`);
    return {
      instruction: 'Solve simultaneously, by elimination',
      questionMath: `${eqn(a1, b1, k1)}${NL}${eqn(a2, b2, k2)}`,
      answer: ANSWER(x, y),
      workingOut: [...steps, `x = ${x}`, `y = ${y}`].join(NL),
      visualization: null,
      metadata: meta,
    };
  }
};

const gcdOf = (a, b) => { a = Math.abs(a); b = Math.abs(b); while (b) [a, b] = [b, a % b]; return a; };

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
const GRAPH_WINDOW = [-5, 5, -5, 5];

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
  // The crossing stays near the origin, inside the fixed window the Foundation
  // graph is drawn on: squares big enough to read from the back of the room.
  const px = difficulty === 'foundation' ? _.sample([-3, -2, -1, 1, 2, 3]) : _.random(0, 4);
  const py = difficulty === 'foundation' ? _.sample([-3, -2, -1, 1, 2, 3]) : _.random(0, 6);
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
      visualization: { type: 'coordinate-grid', lines: [{ m: m1, c: c1 }, { m: m2, c: c2 }], window: GRAPH_WINDOW, big: true },
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
// 'Simultaneous equations'.
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
