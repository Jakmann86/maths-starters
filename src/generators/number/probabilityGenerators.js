// src/generators/number/probabilityGenerators.js
//
// Haese Chapter 25 A (introduction to probability) and F (theoretical
// probability): one draw, one event. The skill ahead of `tree-diagrams` in
// the Probability topic, so ↻ steps from one draw to two.
//
//   foundation  one outcome: one colour from a bag of three, read as its
//               count over the total; or the missing entry in a spinner's
//               probability table, from the total of 1
//   core        an event made of several outcomes: a numbered card with a
//               property (prime, a multiple of 3, ...), or "not red" /
//               "red or blue" from a bag
//   stretch     reversed: a bag's probability given, find how many of the
//               other colour; or a spinner table where one colour is k times
//               as likely as another, so the class solves x + kx = what is left
//
// Fractions are given as the count over the total and then simplified where
// they can be, as venn-probability does. Decimals are multiples of 0.05.
//
// FIELDS. `instruction` is the set-up and `questionText` the ask, so the ask
// renders at question size, in the Probability strand's serif. The one
// exception is Stretch's bag, a reverse question: the given probability is
// `questionMath` and the ask joins the set-up.

import _ from 'lodash';
import { gcd } from '../shared';

/* ------------------------------------------------------------- contexts */

export const COLOURS = ['red', 'blue', 'green', 'yellow', 'white', 'purple', 'orange'];

export const ITEMS = [
  { container: 'bag', plural: 'counters' },
  { container: 'bag', plural: 'marbles' },
  { container: 'box', plural: 'cubes' },
  { container: 'jar', plural: 'beads' },
];

// The card properties Core asks about, each tested on 1..n. `ok` rules out a
// property that would pick out too few or nearly all of the cards.
export const PROPERTIES = [
  { phrase: 'an even number', test: (x) => x % 2 === 0 },
  { phrase: 'an odd number', test: (x) => x % 2 === 1 },
  { phrase: 'a multiple of 3', test: (x) => x % 3 === 0 },
  { phrase: 'a multiple of 4', test: (x) => x % 4 === 0 },
  { phrase: 'a multiple of 5', test: (x) => x % 5 === 0 },
  { phrase: 'a prime number', test: (x) => x > 1 && _.range(2, x).every((d) => x % d) },
  { phrase: 'a square number', test: (x) => Number.isInteger(Math.sqrt(x)) },
  { phrase: 'a factor of 24', test: (x) => 24 % x === 0 },
  { phrase: 'a factor of 36', test: (x) => 36 % x === 0 },
];

/* ---------------------------------------------------------- arithmetic */

const cap = (s) => s[0].toUpperCase() + s.slice(1);
const P = (event) => `P(\\text{${event}})`;

// k over n, then simplified when it can be.
const fracTex = (k, n) => {
  const g = gcd(k, n);
  return `\\frac{${k}}{${n}}${g > 1 ? ` = \\frac{${k / g}}{${n / g}}` : ''}`;
};

// A whole number of hundredths as a decimal: 30 → '0.3', 25 → '0.25'.
const dec = (h) => (h % 10 === 0 ? `0.${h / 10}` : `0.${String(h).padStart(2, '0')}`);

// `count` multiples of 5 hundredths, each at least `min`, summing to `total`.
function split(total, count, min = 5) {
  for (;;) {
    const cuts = _.sortBy(_.sampleSize(_.range(1, total / 5), count - 1));
    const parts = [...cuts, total / 5].map((c, i) => (c - (i ? cuts[i - 1] : 0)) * 5);
    if (parts.every((p) => p >= min)) return parts;
  }
}

/* ---------------------------------------------------------------- bags */

function bag(colours = 3) {
  const names = _.sampleSize(COLOURS, colours);
  let counts;
  do {
    counts = names.map(() => _.random(2, 9));
  } while (_.uniq(counts).length < colours);
  const item = _.sample(ITEMS);
  const list = names.map((c, i) => `${counts[i]} ${c}`);
  const contents = `${list.slice(0, -1).join(', ')} and ${list[list.length - 1]}`;
  return {
    names, counts, item,
    total: _.sum(counts),
    setup: `A ${item.container} holds ${contents} ${item.plural}. One is taken at random.`,
  };
}

/* ------------------------------------------------------------ spinners */

const spinnerTable = (names, cells, solution) => ({
  type: 'table',
  header: 'row',
  rows: [['Colour', 'Probability'], ...names.map((c, i) => [cap(c), cells[i]])],
  ...(solution ? { solution: [['', ''], ...names.map((_c, i) => ['', solution[i]])] } : {}),
  big: true,
});

const SPINNER = 'The table shows the probabilities for a biased spinner.';

/* -------------------------------------------------------------- the bands */

export const generateSimpleProbability = (options = {}) => {
  const { difficulty = 'core' } = options;
  if (difficulty === 'foundation') return foundation();
  if (difficulty === 'stretch') return stretch();
  return core();
};

const meta = (difficulty) => ({ topic: 'simple-probability', difficulty });

function foundation() {
  if (_.random(0, 1)) {
    const b = bag(3);
    const i = _.random(0, 2);
    const c = b.names[i];
    return {
      instruction: b.setup,
      questionText: `Find the probability that it is ${c}.`,
      answer: `${P(c)} = ${fracTex(b.counts[i], b.total)}`,
      workingOut: `${b.counts.join(' + ')} = ${b.total}\n${P(c)} = ${fracTex(b.counts[i], b.total)}`,
      metadata: meta('foundation'),
    };
  }
  // The missing entry, from the total of 1.
  const names = _.sampleSize(COLOURS, 4);
  const hs = split(100, 4);
  const i = _.random(0, 3);
  const others = hs.filter((_h, j) => j !== i);
  const cells = hs.map((h, j) => (j === i ? '' : dec(h)));
  const solution = hs.map((h, j) => (j === i ? dec(h) : ''));
  return {
    instruction: SPINNER,
    questionText: `Find the probability that it lands on ${names[i]}.`,
    answer: `${P(names[i])} = ${dec(hs[i])}`,
    workingOut: `1 - (${others.map(dec).join(' + ')})\n= 1 - ${dec(_.sum(others))}\n= ${dec(hs[i])}`,
    visualization: spinnerTable(names, cells, solution),
    metadata: meta('foundation'),
  };
}

function core() {
  if (_.random(0, 1)) {
    // Numbered cards with a property: the class lists the cards that have it.
    for (;;) {
      const n = _.random(10, 30);
      const prop = _.sample(PROPERTIES);
      const hits = _.range(1, n + 1).filter(prop.test);
      if (hits.length < 3 || hits.length > n - 3) continue;
      return {
        instruction: `Cards numbered 1 to ${n} are shuffled and one is taken at random.`,
        questionText: `Find the probability that the number is ${prop.phrase}.`,
        answer: `${P(prop.phrase.replace(/^an? /, ''))} = ${fracTex(hits.length, n)}`,
        workingOut: `${hits.join(', ')}\n${hits.length} \\text{ out of } ${n}\n= ${fracTex(hits.length, n)}`,
        metadata: meta('core'),
      };
    }
  }
  const b = bag(_.random(3, 4));
  const [i, j] = _.sampleSize(_.range(b.names.length), 2);
  const not = _.random(0, 1);
  const event = not ? `not ${b.names[i]}` : `${b.names[i]} or ${b.names[j]}`;
  const k = not ? b.total - b.counts[i] : b.counts[i] + b.counts[j];
  return {
    instruction: b.setup,
    questionText: `Find the probability that it is ${event}.`,
    answer: `${P(event)} = ${fracTex(k, b.total)}`,
    workingOut: not
      ? `${b.total} - ${b.counts[i]} = ${k}\n${P(event)} = ${fracTex(k, b.total)}`
      : `${b.counts[i]} + ${b.counts[j]} = ${k}\n${P(event)} = ${fracTex(k, b.total)}`,
    metadata: meta('core'),
  };
}

function stretch() {
  if (_.random(0, 1)) {
    // A bag of two colours with one probability given in its lowest terms,
    // which never shows the total: the class scales it up to the count they
    // know, then subtracts.
    for (;;) {
      const [c1, c2] = _.sampleSize(COLOURS, 2);
      const item = _.sample(ITEMS);
      const a = _.random(2, 12), b = _.random(2, 15);
      const n = a + b;
      const g = gcd(a, n);
      if (g === 1 || a === b || n > 24) continue;
      // A reverse question: the given probability is questionMath, like a
      // given volume, and the instruction carries the ask.
      return {
        instruction:
          `A ${item.container} holds ${a} ${c1} ${item.plural} and some ${c2} ${item.plural}. ` +
          `One is taken at random. How many ${c2} ${item.plural} are there?`,
        questionMath: `${P(c1)} = \\frac{${a / g}}{${n / g}}`,
        answer: String(b),
        answerUnits: `\\text{${c2} ${item.plural}}`,
        workingOut: `\\frac{${a / g}}{${n / g}} = \\frac{${a}}{${n}}\n${n} - ${a} = ${b}`,
        metadata: meta('stretch'),
      };
    }
  }
  // Two colours known; of the other two, one is k times as likely as the
  // other, written into the table as x and kx.
  for (;;) {
    const k = _.random(2, 3);
    const x = _.random(1, 5) * 5;
    const rest = 100 - (k + 1) * x;
    if (rest < 20) continue;
    const names = _.sampleSize(COLOURS, 4);
    const known = split(rest, 2, 10);
    const cells = [dec(known[0]), dec(known[1]), 'x', `${k}x`];
    const askK = _.random(0, 1);
    const asked = names[askK ? 3 : 2];
    const value = askK ? k * x : x;
    return {
      instruction: SPINNER,
      questionText: `Find the probability that it lands on ${asked}.`,
      answer: `${P(asked)} = ${dec(value)}`,
      workingOut:
        `${k + 1}x = 1 - ${dec(rest)} = ${dec(100 - rest)}\n` +
        `x = ${dec(x)}` + (askK ? `\n${k}x = ${dec(value)}` : ''),
      visualization: spinnerTable(names, cells),
      metadata: meta('stretch'),
    };
  }
}
