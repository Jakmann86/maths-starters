// src/generators/number/treeDiagramGenerators.js
//
// Haese Chapter 25 H (using tree diagrams) and I (sampling with and without
// replacement). One skill, `tree-diagrams`, on the two-stage tree figure.
//
//   foundation  every branch labelled; one path, so multiply along it
//               a bag taken from with replacement, or two independent
//               decimal events                      "both are red"
//   core        every branch labelled; two paths, so multiply then add
//               any of: with replacement, without replacement, independent
//               decimals, decimals where the second stage depends on the
//               first                                "different colours"
//   stretch     without replacement, and the second stage is left blank, so
//               the class works it out from the bag first; two paths, or
//               "at least one" by the complement     "at least one is red"
//
// ANSWERS ARE NOT SIMPLIFIED. 4/9 x 5/9 is left as 20/81 and two paths as
// 40/81, and a without-replacement denominator stays n(n - 1). A tree's
// products all share a denominator, so leaving them unsimplified is what
// lets two paths be added on sight; it is also how the class will write
// them. Branch labels are the bag counts over the bag total, likewise as
// they stand (4/8, not 1/2).
//
// Decimals are tenths on every branch, so every product is a whole number of
// hundredths and the arithmetic stays exact here and calculator-free there.
//
// FIELDS. `instruction` is the set-up (the bag, or what the tree shows);
// `questionText` is the ask, so it renders at question size. The Probability
// strand is all-KaTeX, so the ask is set in the serif and the working and
// answer lines go to KaTeX — `\frac` and `\text{}` throughout.

import _ from 'lodash';

const NL = '\n';

/* ------------------------------------------------------------- contexts */

// Initials all differ, so any two colours give two distinct letters.
export const COLOURS = [
  ['red', 'R'], ['blue', 'B'], ['green', 'G'], ['yellow', 'Y'],
  ['white', 'W'], ['purple', 'P'], ['orange', 'O'],
];

export const ITEMS = [
  { container: 'bag', plural: 'counters' },
  { container: 'bag', plural: 'marbles' },
  { container: 'box', plural: 'cubes' },
  { container: 'jar', plural: 'beads' },
  { container: 'box', plural: 'balls' },
];

// Two outcomes per stage, a letter for each, and the wording of every ask.
// `dependent` marks a context where the second stage plausibly depends on
// the first (yesterday's rain, a team's morale), so it can carry Core's
// conditional trees; the traffic lights cannot.
export const EVENTS = [
  {
    id: 'weather',
    setup: () => 'The tree shows whether it rains (R) or is dry (D) on Saturday and on Sunday.',
    letters: ['R', 'D'],
    dependent: true,
    ask: {
      XX: 'it rains on both days',
      XY: 'it rains on Saturday but not on Sunday',
      YX: 'it is dry on Saturday but rains on Sunday',
      YY: 'it is dry on both days',
      one: 'it rains on exactly one of the two days',
      same: 'the weather is the same on both days',
    },
  },
  {
    id: 'penalties',
    setup: (who) => `The tree shows whether ${who} scores (S) or misses (M) each of two penalties.`,
    letters: ['S', 'M'],
    dependent: true,
    ask: {
      XX: (who) => `${who} scores both penalties`,
      XY: (who) => `${who} scores the first penalty and misses the second`,
      YX: (who) => `${who} misses the first penalty and scores the second`,
      YY: (who) => `${who} misses both penalties`,
      one: (who) => `${who} scores exactly one of the penalties`,
      same: () => 'both penalties have the same result',
    },
  },
  {
    id: 'bus',
    setup: () => 'The tree shows whether a bus is late (L) or on time (T) on Monday and on Tuesday.',
    letters: ['L', 'T'],
    dependent: true,
    ask: {
      XX: 'the bus is late on both days',
      XY: 'the bus is late on Monday but on time on Tuesday',
      YX: 'the bus is on time on Monday but late on Tuesday',
      YY: 'the bus is on time on both days',
      one: 'the bus is late on exactly one of the two days',
      same: 'the bus is late on both days or on time on both days',
    },
  },
  {
    id: 'matches',
    setup: () => 'The tree shows whether a team wins (W) or loses (L) each of its first two matches.',
    letters: ['W', 'L'],
    dependent: true,
    ask: {
      XX: 'the team wins both matches',
      XY: 'the team wins the first match and loses the second',
      YX: 'the team loses the first match and wins the second',
      YY: 'the team loses both matches',
      one: 'the team wins exactly one of the two matches',
      same: 'the team wins both matches or loses both',
    },
  },
  {
    id: 'lights',
    setup: () => 'The tree shows whether a driver meets red (R) or green (G) at each of two sets of traffic lights.',
    letters: ['R', 'G'],
    dependent: false,
    ask: {
      XX: 'both lights are red',
      XY: 'the first light is red and the second is green',
      YX: 'the first light is green and the second is red',
      YY: 'both lights are green',
      one: 'exactly one of the two lights is red',
      same: 'both lights show the same colour',
    },
  },
];

export const NAMES = ['Ana', 'Sami', 'Leo', 'Priya', 'Tomás', 'Mei', 'Kofi', 'Zara'];

/* ---------------------------------------------------------- arithmetic */

// A probability is held exactly: a fraction as { n, d }, a decimal as a
// whole number of hundredths { h }. Never a float.
const fr = (n, d) => ({ n, d });
const tenth = (t) => ({ h: t * 10 });

const mul = (p, q) => (p.d != null ? fr(p.n * q.n, p.d * q.d) : { h: (p.h * q.h) / 100 });
// Only ever adds probabilities that share a denominator (two paths of one
// tree), so the denominator carries through unchanged.
const add = (p, q) => (p.d != null ? fr(p.n + q.n, p.d) : { h: p.h + q.h });
const complement = (p) => (p.d != null ? fr(p.d - p.n, p.d) : { h: 100 - p.h });

const decText = (h) => {
  const s = (h / 100).toFixed(2);
  return s.replace(/0$/, '');
};
// Plain text, for a figure label: '4/9' or '0.3'.
const plain = (p) => (p.d != null ? `${p.n}/${p.d}` : decText(p.h));
// LaTeX, for working and answers.
const tex = (p) => (p.d != null ? `\\frac{${p.n}}{${p.d}}` : decText(p.h));

/* ---------------------------------------------------------- the trees */

// A tree is the six branch probabilities keyed by path, plus the two letters.
// x, y: first stage. xx, xy: second stage after X. yx, yy: after Y.

function bagTree(replace) {
  let a, b;
  do {
    a = _.random(2, 9);
    b = _.random(2, 9);
    // Equal counts make the two colours interchangeable: every branch reads
    // the same both ways round and the question loses its point.
  } while (a === b || a + b > 15);
  const n = a + b;
  const [[c1, L1], [c2, L2]] = _.sampleSize(COLOURS, 2);
  const item = _.sample(ITEMS);
  const m = replace ? n : n - 1;
  return {
    kind: replace ? 'with' : 'without',
    letters: [L1, L2],
    names: [c1, c2],
    item,
    counts: [a, b],
    p: {
      x: fr(a, n), y: fr(b, n),
      xx: fr(replace ? a : a - 1, m), xy: fr(b, m),
      yx: fr(a, m), yy: fr(replace ? b : b - 1, m),
    },
  };
}

function eventTree(dependent) {
  const e = _.sample(dependent ? EVENTS.filter((ev) => ev.dependent) : EVENTS);
  const p1 = _.random(1, 9);
  let q1, q2;
  if (dependent) {
    // What happens first changes the odds of what happens second.
    do { q1 = _.random(1, 9); q2 = _.random(1, 9); } while (q1 === q2);
  } else {
    q1 = _.random(1, 9);
    q2 = q1;
  }
  return {
    kind: dependent ? 'dependent' : 'independent',
    event: e,
    who: _.sample(NAMES),
    letters: e.letters,
    p: {
      x: tenth(p1), y: tenth(10 - p1),
      xx: tenth(q1), xy: tenth(10 - q1),
      yx: tenth(q2), yy: tenth(10 - q2),
    },
  };
}

const PATH_KEYS = { XX: 'xx', XY: 'xy', YX: 'yx', YY: 'yy' };
const pathProb = (t, path) => mul(t.p[path[0].toLowerCase()], t.p[PATH_KEYS[path]]);
const outcome = (t, path) => path.split('').map((c) => t.letters[c === 'X' ? 0 : 1]).join('');

/* -------------------------------------------------------------- wording */

function setupText(t) {
  if (t.event) return t.event.setup(t.who);
  const [a, b] = t.counts;
  const [c1, c2] = t.names;
  const [L1, L2] = t.letters;
  return `A ${t.item.container} holds ${a} ${c1} (${L1}) and ${b} ${c2} (${L2}) ${t.item.plural}. ` +
    `Two are taken at random, ${t.kind} replacement.`;
}

function askText(t, ask) {
  if (t.event) {
    const w = t.event.ask[ask];
    return `Find the probability that ${typeof w === 'function' ? w(t.who) : w}.`;
  }
  const [c1, c2] = t.names;
  const body = {
    XX: `both are ${c1}`,
    XY: `the first is ${c1} and the second is ${c2}`,
    YX: `the first is ${c2} and the second is ${c1}`,
    YY: `both are ${c2}`,
    one: `the two ${t.item.plural} are different colours`,
    same: `the two ${t.item.plural} are the same colour`,
    atLeastX: `at least one is ${c1}`,
    atLeastY: `at least one is ${c2}`,
  }[ask];
  return `Find the probability that ${body}.`;
}

/* ------------------------------------------------------------ the asks */

// One path: P(path) = p x q.
function onePath(t, path) {
  const [k1, k2] = [path[0].toLowerCase(), PATH_KEYS[path]];
  const ans = pathProb(t, path);
  return {
    ans,
    working:
      `P(\\text{${outcome(t, path)}}) = ${tex(t.p[k1])} \\times ${tex(t.p[k2])}${NL}` +
      `= ${tex(ans)}`,
  };
}

// Two paths: each product, then the sum.
function twoPaths(t, paths) {
  const lines = paths.map((path) => {
    const [k1, k2] = [path[0].toLowerCase(), PATH_KEYS[path]];
    return `P(\\text{${outcome(t, path)}}) = ${tex(t.p[k1])} \\times ${tex(t.p[k2])} = ${tex(pathProb(t, path))}`;
  });
  const [p, q] = paths.map((path) => pathProb(t, path));
  const ans = add(p, q);
  return { ans, working: [...lines, `${tex(p)} + ${tex(q)} = ${tex(ans)}`].join(NL) };
}

// At least one X is everything but YY (and the reverse).
function atLeast(t, ask) {
  const none = ask === 'atLeastX' ? 'YY' : 'XX';
  const [k1, k2] = [none[0].toLowerCase(), PATH_KEYS[none]];
  const miss = pathProb(t, none);
  const ans = complement(miss);
  return {
    ans,
    working:
      `P(\\text{${outcome(t, none)}}) = ${tex(t.p[k1])} \\times ${tex(t.p[k2])} = ${tex(miss)}${NL}` +
      `1 - ${tex(miss)} = ${tex(ans)}`,
  };
}

const TWO = { one: ['XY', 'YX'], same: ['XX', 'YY'] };

function solve(t, ask) {
  if (PATH_KEYS[ask]) return onePath(t, ask);
  if (TWO[ask]) return twoPaths(t, TWO[ask]);
  return atLeast(t, ask);
}

/* ----------------------------------------------------------- assembling */

function build(t, ask, difficulty, hideSecond) {
  const { ans, working } = solve(t, ask);
  const probs = _.mapValues(t.p, plain);
  const visualization = {
    type: 'tree-diagram',
    outcomes: [...t.letters],
    probs,
    big: true,
  };
  if (hideSecond) {
    visualization.solution = _.pick(probs, ['xx', 'xy', 'yx', 'yy']);
    visualization.probs = { ...probs, xx: '', xy: '', yx: '', yy: '' };
  }
  return {
    instruction: setupText(t),
    questionText: askText(t, ask),
    answer: tex(ans),
    workingOut: working,
    visualization,
    metadata: { topic: 'tree-diagrams', difficulty },
  };
}

export const generateTreeDiagrams = (options = {}) => {
  const { difficulty = 'core' } = options;
  if (difficulty === 'core') return treeCore();
  if (difficulty === 'stretch') return treeStretch();
  return treeFoundation();
};

function treeFoundation() {
  for (;;) {
    const t = _.random(0, 1) ? bagTree(true) : eventTree(false);
    const q = build(t, _.sample(['XX', 'XY', 'YX', 'YY']), 'foundation', false);
    // 0.5 x 0.6 = 0.3 would print an answer that is also a branch label,
    // and a student who read the wrong branch off would be right.
    if (!Object.values(q.visualization.probs).includes(q.answer)) return q;
  }
}

function treeCore() {
  const source = _.sample(['with', 'without', 'independent', 'dependent']);
  const t = source === 'with' || source === 'without'
    ? bagTree(source === 'with')
    : eventTree(source === 'dependent');
  return build(t, _.sample(['one', 'same']), 'core', false);
}

function treeStretch() {
  const t = bagTree(false);
  return build(t, _.sample(['one', 'same', 'atLeastX', 'atLeastY']), 'stretch', true);
}
