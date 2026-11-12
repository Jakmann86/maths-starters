// src/generators/number/probabilityTopicsGenerators.js
//
// The rest of Haese Chapter 25, around simple-probability (25A, F) and
// tree-diagrams (25H, I):
//
//   relative-frequency   25B  estimating a probability from an experiment
//   two-way-tables       25C  one cell, a union, a conditional
//   expectation          25D  np, and an expected score
//   sample-spaces        25E-F  two-dice grids, three coins
//   independent-events   25G  P(A and B) = P(A) × P(B), without a tree
//   either-or            25J  mutually exclusive and not: P(A or B)
//
// Fractions are given as a count over the total and then simplified where
// they can be, as simple-probability does; decimals are exact. Contexts are
// phrasing, not a question bank: every number is generated.
//
// FIELDS. As in simple-probability, `questionText` is the set-up and
// `instruction` the ask, which carries no numbers; a given probability is
// `questionMath`, since it is maths a student reads.

import _ from 'lodash';
import { gcd } from '../shared';

const NL = '\n';
const P = (event) => `P(\\text{${event}})`;
// k over n, then simplified when it can be.
const fracTex = (k, n) => {
  const g = gcd(k, n);
  return `\\frac{${k}}{${n}}${g > 1 ? ` = \\frac{${k / g}}{${n / g}}` : ''}`;
};
const lowest = (k, n) => { const g = gcd(k, n); return [k / g, n / g]; };
const simpleFrac = (k, n) => { const [a, b] = lowest(k, n); return b === 1 ? `${a}` : `\\frac{${a}}{${b}}`; };
// An exact decimal: 0.48, 0.0025.
const dec = (v) => String(Number(v.toFixed(6)));
const cap = (s) => s[0].toUpperCase() + s.slice(1);

/* -------------------------------------------------- relative-frequency */
//
//   foundation  one event from a count: lands on heads 96 times in 200
//   core        from a frequency table: one outcome, or several together
//   stretch     a frequency missing from the table (the total given), or
//               two people's results pooled

const TRIALS = [20, 25, 40, 50, 80, 100, 125, 200, 250, 400, 500];
const EXPERIMENTS = [
  { setup: (n, f) => `A coin is tossed ${n} times and lands on heads ${f} times.`, ask: 'Estimate the probability that it lands on heads', event: 'heads', rate: [0.35, 0.65] },
  { setup: (n, f) => `A drawing pin is dropped ${n} times and lands point up ${f} times.`, ask: 'Estimate the probability that it lands point up', event: 'point up', rate: [0.2, 0.75] },
  { setup: (n, f) => `An archer fires ${n} arrows and hits the target with ${f} of them.`, ask: 'Estimate the probability that her next arrow hits the target', event: 'hit', rate: [0.5, 0.95] },
  { setup: (n, f) => `A bus was late on ${f} of the last ${n} school days.`, ask: 'Estimate the probability that the bus is late tomorrow', event: 'late', rate: [0.05, 0.4] },
  { setup: (n, f) => `A footballer scored ${f} of her last ${n} penalties.`, ask: 'Estimate the probability that she scores her next penalty', event: 'scores', rate: [0.5, 0.9] },
];
const SPIN = ['red', 'blue', 'green', 'yellow', 'white'];

// `count` parts of n, each at least `min`, all different.
const parts = (n, count, min) => {
  for (;;) {
    const cuts = _.sortBy(_.sampleSize(_.range(1, n), count - 1));
    const ps = [...cuts, n].map((c, i) => c - (i ? cuts[i - 1] : 0));
    if (ps.every((p) => p >= min) && _.uniq(ps).length === count) return ps;
  }
};
const freqTable = (names, freqs, solution) => ({
  type: 'table',
  header: 'row',
  rows: [['Colour', 'Frequency'], ...names.map((c, i) => [cap(c), freqs[i]])],
  ...(solution ? { solution: [['', ''], ...names.map((_c, i) => ['', solution[i]])] } : {}),
  big: true,
});
const eventOf = (names) => (names.length === 1 ? names[0] : names.join(' or '));

export const generateRelativeFrequency = (options = {}) => {
  const { difficulty = 'core' } = options;
  const meta = { topic: 'relative-frequency', difficulty };
  const kind = _.random(0, 1);

  if (difficulty === 'foundation') {
    for (;;) {
      const e = _.sample(EXPERIMENTS);
      const n = _.sample(TRIALS);
      const f = _.random(Math.ceil(n * e.rate[0]), Math.floor(n * e.rate[1]));
      if (f < 1 || f >= n) continue;
      return {
        instruction: e.ask,
        questionText: e.setup(n, f),
        answer: `${P(e.event)} = ${dec(f / n)}`,
        workingOut: `\\frac{${f}}{${n}} = ${dec(f / n)}`,
        metadata: meta,
      };
    }
  }

  const n = _.sample([50, 80, 100, 200, 250, 400]);
  const names = _.sampleSize(SPIN, 4);
  const freqs = parts(n, 4, Math.max(3, n / 20));
  const setup = 'The table shows the results of spinning a spinner.';

  if (difficulty === 'core') {
    // One outcome, or two together.
    const asked = _.sortBy(_.sampleSize(_.range(4), kind ? 1 : 2));
    const k = _.sum(asked.map((i) => freqs[i]));
    const ev = eventOf(asked.map((i) => names[i]));
    return {
      instruction: `Estimate the probability that it lands on ${ev}`,
      questionText: setup,
      answer: `${P(ev)} = ${dec(k / n)}`,
      workingOut: [`${freqs.join(' + ')} = ${n}`, `\\frac{${k}}{${n}} = ${dec(k / n)}`].join(NL),
      visualization: freqTable(names, freqs.map(String)),
      metadata: meta,
    };
  }

  // Stretch
  if (kind) {
    // One frequency missing, the number of spins given.
    const miss = _.random(0, 3);
    const asked = _.random(0, 1) ? [miss] : _.sortBy([miss, (miss + _.random(1, 3)) % 4]);
    const k = _.sum(asked.map((i) => freqs[i]));
    const ev = eventOf(asked.map((i) => names[i]));
    const known = freqs.filter((_f, i) => i !== miss);
    return {
      instruction: `Estimate the probability that it lands on ${ev}`,
      questionText: `The table shows the results of spinning a spinner ${n} times. One frequency is missing.`,
      answer: `${P(ev)} = ${dec(k / n)}`,
      workingOut: [`${n} - (${known.join(' + ')}) = ${freqs[miss]}`, `\\frac{${k}}{${n}} = ${dec(k / n)}`].join(NL),
      visualization: freqTable(names, freqs.map((f, i) => (i === miss ? '' : String(f))), freqs.map((f, i) => (i === miss ? String(f) : ''))),
      metadata: meta,
    };
  }
  // Two people's results, pooled.
  for (;;) {
    const [a, b] = _.sampleSize(['Ana', 'Ben', 'Leo', 'Mia', 'Sam', 'Zara'], 2);
    const n1 = _.random(2, 12) * 10, n2 = _.random(2, 12) * 10;
    const N = n1 + n2;
    const f1 = _.random(Math.ceil(n1 * 0.2), Math.floor(n1 * 0.7)), f2 = _.random(Math.ceil(n2 * 0.2), Math.floor(n2 * 0.7));
    const v = (f1 + f2) / N;
    if (!/^0\.\d{1,3}$/.test(dec(v))) continue;
    const c = _.sample(SPIN);
    return {
      instruction: `Use all of the results to estimate the probability of ${c}`,
      questionText: `${a} spins a spinner ${n1} times and gets ${c} ${f1} times. ${b} spins the same spinner ${n2} times and gets ${c} ${f2} times.`,
      answer: `${P(c)} = ${dec(v)}`,
      workingOut: `\\frac{${f1} + ${f2}}{${n1} + ${n2}} = \\frac{${f1 + f2}}{${N}} = ${dec(v)}`,
      metadata: meta,
    };
  }
};

/* ------------------------------------------------------ two-way-tables */
//
//   foundation  one cell, or a whole row or column
//   core        one or the other (a union), or a cell left blank in a table
//               with its totals
//   stretch     given a row or a column: a conditional probability

const TWO_WAY = [
  {
    setup: 'The table shows how a group of students travel to school.', who: 'student',
    rows: [['Boys', 'a boy', 'boy'], ['Girls', 'a girl', 'girl']],
    cols: [['Walk', 'walks', 'walks'], ['Bus', 'takes the bus', 'bus'], ['Car', 'comes by car', 'car']],
    cell: (r, c) => `${r[1]} who ${c[1]}`,
  },
  {
    setup: 'The table shows the favourite sport of some students.', who: 'student',
    rows: [['Year 9', 'in Year 9', 'Year 9'], ['Year 10', 'in Year 10', 'Year 10']],
    cols: [['Football', 'prefers football', 'football'], ['Tennis', 'prefers tennis', 'tennis'], ['Swimming', 'prefers swimming', 'swimming']],
    cell: (r, c) => `${r[1]} and ${c[1]}`,
  },
  {
    setup: 'The table shows which students in three year groups can swim.', who: 'student',
    rows: [['Year 7', 'in Year 7', 'Year 7'], ['Year 8', 'in Year 8', 'Year 8'], ['Year 9', 'in Year 9', 'Year 9']],
    cols: [['Can swim', 'can swim', 'can swim'], ['Cannot swim', 'cannot swim', 'cannot swim']],
    cell: (r, c) => `${r[1]} and ${c[1]}`,
  },
  {
    setup: 'The table shows whether some adults are left- or right-handed.', who: 'adult',
    rows: [['Men', 'a man', 'man'], ['Women', 'a woman', 'woman']],
    cols: [['Left', 'is left-handed', 'left-handed'], ['Right', 'is right-handed', 'right-handed']],
    cell: (r, c) => `${r[1]} who ${c[1]}`,
  },
];
const isPhrase = (s) => (/^(a|an|in) /.test(s) ? `is ${s}` : s);

export const generateTwoWayTables = (options = {}) => {
  const { difficulty = 'core' } = options;
  const meta = { topic: 'two-way-tables', difficulty };
  const kind = _.random(0, 1);
  const T = _.sample(TWO_WAY);
  const R = T.rows.length, C = T.cols.length;
  const counts = _.range(R).map(() => _.range(C).map(() => _.random(3, 40)));
  const N = _.sum(counts.flat());
  const rowSum = (i) => _.sum(counts[i]);
  const colSum = (j) => _.sum(counts.map((r) => r[j]));
  const i = _.random(0, R - 1), j = _.random(0, C - 1);
  const r = T.rows[i], c = T.cols[j];
  const grid = (cells) => [['', ...T.cols.map((x) => x[0])], ...T.rows.map((row, a) => [row[0], ...cells[a]])];
  const figure = { type: 'table', header: 'both', rows: grid(counts.map((row) => row.map(String))) };
  const setup = `${T.setup} One ${T.who} is chosen at random.`;
  const out = (ask, label, k, n, working, viz = figure) => ({
    instruction: setup,
    questionText: `Find the probability that the ${T.who} ${ask}.`,
    answer: `${P(label)} = ${fracTex(k, n)}`,
    workingOut: [...working, `${P(label)} = ${fracTex(k, n)}`].join(NL),
    visualization: viz,
    metadata: meta,
  });

  if (difficulty === 'foundation') {
    if (kind) return out(`is ${T.cell(r, c)}`, `${r[2]} and ${c[2]}`, counts[i][j], N, [`\\text{total} = ${N}`]);
    if (_.random(0, 1)) return out(isPhrase(r[1]), r[2], rowSum(i), N, [`${counts[i].join(' + ')} = ${rowSum(i)}`, `\\text{total} = ${N}`]);
    return out(isPhrase(c[1]), c[2], colSum(j), N, [`${counts.map((x) => x[j]).join(' + ')} = ${colSum(j)}`, `\\text{total} = ${N}`]);
  }

  if (difficulty === 'core') {
    if (kind) {
      const k = rowSum(i) + colSum(j) - counts[i][j];
      return out(`${isPhrase(r[1])} or ${c[1]}`, `${r[2]} or ${c[2]}`, k, N, [`${rowSum(i)} + ${colSum(j)} - ${counts[i][j]} = ${k}`, `\\text{total} = ${N}`]);
    }
    // Totals printed, one cell blank: found from its row total.
    const cells = counts.map((row, a) => [...row.map((x, b) => (a === i && b === j ? '' : String(x))), String(rowSum(a))]);
    const rows = [['', ...T.cols.map((x) => x[0]), 'Total'], ...T.rows.map((row, a) => [row[0], ...cells[a]]),
      ['Total', ...T.cols.map((_x, b) => String(colSum(b))), String(N)]];
    const solution = rows.map((row, a) => row.map((_x, b) => (a === i + 1 && b === j + 1 ? String(counts[i][j]) : '')));
    const others = counts[i].filter((_x, b) => b !== j);
    return out(`is ${T.cell(r, c)}`, `${r[2]} and ${c[2]}`, counts[i][j], N,
      [`${rowSum(i)} - ${others.length > 1 ? `(${others.join(' + ')})` : others[0]} = ${counts[i][j]}`],
      { type: 'table', header: 'both', rows, solution, shrink: true });
  }

  // Stretch: conditional.
  if (kind) {
    return {
      ...out('', '', 0, 1, []),
      questionText: `The ${T.who} chosen ${isPhrase(r[1])}. Find the probability that this ${T.who} ${c[1]}.`,
      answer: `${P(`${c[2]} given ${r[2]}`)} = ${fracTex(counts[i][j], rowSum(i))}`,
      workingOut: [`${counts[i].join(' + ')} = ${rowSum(i)}`, `${P(`${c[2]} given ${r[2]}`)} = ${fracTex(counts[i][j], rowSum(i))}`].join(NL),
    };
  }
  return {
    ...out('', '', 0, 1, []),
    questionText: `The ${T.who} chosen ${c[1]}. Find the probability that this ${T.who} ${isPhrase(r[1])}.`,
    answer: `${P(`${r[2]} given ${c[2]}`)} = ${fracTex(counts[i][j], colSum(j))}`,
    workingOut: [`${counts.map((x) => x[j]).join(' + ')} = ${colSum(j)}`, `${P(`${r[2]} given ${c[2]}`)} = ${fracTex(counts[i][j], colSum(j))}`].join(NL),
  };
};

/* --------------------------------------------------------- expectation */
//
//   foundation  np from a given probability, or from a fair dice or spinner
//   core        the probability first from an experiment or a bag, then np
//   stretch     an expected score from points and probabilities, or the
//               number of trials back from the expected count

const EXPECT = 'Find the number you would expect';
const DICE_EVENTS = [
  ['a six', 1, 6], ['an even number', 3, 6], ['a number greater than 4', 2, 6],
  ['a prime number', 3, 6], ['a 1 or a 2', 2, 6], ['a multiple of 3', 2, 6],
];
const CHANCES = [
  { label: 'late', range: [1, 8], setup: (p) => `The probability that a train is late is ${p}.`, many: (n) => `There are ${n} trains this week.`, ask: 'How many trains would you expect to be late?', units: 'trains' },
  { label: 'grows', range: [10, 19], setup: (p) => `The probability that a seed grows is ${p}.`, many: (n) => `${n} seeds are planted.`, ask: 'How many seeds would you expect to grow?', units: 'seeds' },
  { label: 'faulty', range: [1, 4], setup: (p) => `The probability that a battery is faulty is ${p}.`, many: (n) => `A shop sells ${n} batteries.`, ask: 'How many would you expect to be faulty?', units: 'batteries' },
  { label: 'rain', range: [2, 16], setup: (p) => `The probability that it rains on a day in April is ${p}.`, many: () => 'April has 30 days.', ask: 'On how many days would you expect it to rain?', units: 'days', n: 30 },
];

export const generateExpectation = (options = {}) => {
  const { difficulty = 'core' } = options;
  const meta = { topic: 'expectation', difficulty };
  const kind = _.random(0, 1);

  for (;;) {
    if (difficulty === 'foundation') {
      if (kind) {
        const ch = _.sample(CHANCES);
        const useDec = _.random(0, 1);
        // Probabilities in twentieths, within what fits the context.
        const twentieths = _.random(...ch.range);
        const fr = _.sample([[1, 2], [1, 3], [2, 3], [1, 4], [3, 4], [1, 5], [2, 5], [3, 5], [1, 6], [5, 6], [1, 10], [3, 10]]);
        if (!useDec && Math.abs(fr[0] / fr[1] - twentieths / 20) > 0.1) continue;
        const [a, b] = useDec ? lowest(twentieths * 5, 100) : fr;
        const n = ch.n ?? b * _.random(2, Math.floor(400 / b));
        if (n % b) continue;
        const pTex = useDec ? dec(a / b) : `\\frac{${a}}{${b}}`;
        const pText = useDec ? dec(a / b) : `${a}/${b}`;
        if (!useDec) {
          // A fraction is maths: the given probability goes in questionMath.
          return {
            instruction: EXPECT,
            questionText: `${ch.many(n)} ${ch.ask}`,
            questionMath: `${P(ch.label)} = ${pTex}`,
            answer: `${(n * a) / b}`, answerUnits: ch.units,
            workingOut: `${n} \\times ${pTex} = ${(n * a) / b}`,
            metadata: meta,
          };
        }
        return {
          instruction: EXPECT,
          questionText: `${ch.setup(pText)} ${ch.many(n)} ${ch.ask}`,
          answer: `${(n * a) / b}`, answerUnits: ch.units,
          workingOut: `${n} \\times ${pTex} = ${(n * a) / b}`,
          metadata: meta,
        };
      }
      const [ev, k, s] = _.sample(DICE_EVENTS);
      const n = s * _.random(5, 50);
      return {
        instruction: EXPECT,
        questionText: `A fair dice is rolled ${n} times. How many times would you expect ${ev}?`,
        answer: `${(n * k) / s}`,
        workingOut: `${n} \\times \\frac{${k}}{${s}} = ${(n * k) / s}`,
        metadata: meta,
      };
    }

    if (difficulty === 'core') {
      if (kind) {
        const t = _.sample([50, 80, 100, 200, 250, 400, 500]);
        const f = _.random(Math.ceil(t * 0.15), Math.floor(t * 0.8));
        const [a, b] = lowest(f, t);
        if (b > 100) continue;
        const m = b * _.random(1, Math.floor(300 / b));
        if (m === t || m < 10) continue;
        return {
          instruction: EXPECT,
          questionText: `A drawing pin lands point up ${f} times in ${t} drops. It is then dropped another ${m} times. How many times would you expect it to land point up?`,
          answer: `${(m * a) / b}`,
          workingOut: [`P(\\text{point up}) = ${fracTex(f, t)}`, `${m} \\times \\frac{${a}}{${b}} = ${(m * a) / b}`].join(NL),
          metadata: meta,
        };
      }
      const [c1, c2] = _.sampleSize(SPIN, 2);
      const x = _.random(2, 9), y = _.random(2, 9);
      if (x === y) continue;
      const n = x + y;
      const m = n * _.random(3, Math.floor(400 / n));
      return {
        instruction: EXPECT,
        questionText: `A bag holds ${x} ${c1} and ${y} ${c2} counters. A counter is taken and put back, ${m} times. How many times would you expect a ${c1} counter?`,
        answer: `${(m * x) / n}`,
        workingOut: [`P(\\text{${c1}}) = \\frac{${x}}{${n}}`, `${m} \\times \\frac{${x}}{${n}} = ${(m * x) / n}`].join(NL),
        metadata: meta,
      };
    }

    // Stretch
    if (kind) {
      // An expected score: points with probabilities, the rest score nothing.
      const [v1, v2] = _.sampleSize([1, 2, 3, 5, 10, 20, 50], 2).sort((a, b) => b - a);
      const p1 = _.random(1, 4) / 10, p2 = _.random(1, 5) / 10;
      if (p1 + p2 > 0.9 + 1e-9) continue;
      const n = 10 * _.random(2, 20);
      const per = v1 * p1 + v2 * p2;
      const total = n * per;
      if (Math.abs(total - Math.round(total)) > 1e-9) continue;
      return {
        instruction: 'Find the total score you would expect',
        questionText: `A spinner scores ${v1} points with probability ${dec(p1)} and ${v2} points with probability ${dec(p2)}. Otherwise it scores nothing. It is spun ${n} times.`,
        answer: `${Math.round(total)}`, answerUnits: 'points',
        workingOut: [`${v1} \\times ${dec(p1)} + ${v2} \\times ${dec(p2)} = ${dec(per)}`, `${n} \\times ${dec(per)} = ${Math.round(total)}`].join(NL),
        metadata: meta,
      };
    }
    // Back to the number of trials.
    const p = _.random(1, 18) * 5;
    const [a, b] = lowest(p, 100);
    const e = a * _.random(2, Math.floor(120 / a));
    const n = (e * b) / a;
    if (!Number.isInteger(n) || n > 500) continue;
    return {
      instruction: 'Work back to the number of trials',
      questionText: `A biased coin lands on heads with probability ${dec(p / 100)}. It is expected to land on heads ${e} times. How many times was it tossed?`,
      answer: `${n}`,
      workingOut: [`n \\times ${dec(p / 100)} = ${e}`, `n = ${e} \\div ${dec(p / 100)} = ${n}`].join(NL),
      metadata: meta,
    };
  }
};

/* ------------------------------------------------------- sample-spaces */
//
//   foundation  a filled grid of totals or products: count the outcomes
//   core        the grid headed but empty (filled on reveal): complete it,
//               then count
//   stretch     three coins listed, or a probability given that something
//               has already happened, from the grid

const SPINNERS = [_.range(1, 5), _.range(1, 6), _.range(1, 4)];
const OPS = {
  total: { sym: '+', f: (a, b) => a + b, noun: 'total' },
  product: { sym: '\\times', f: (a, b) => a * b, noun: 'product' },
  difference: { sym: '-', f: (a, b) => Math.abs(a - b), noun: 'difference' },
};
// Events on the grid's values, phrased with the operation's noun.
const gridEvents = (vals, noun) => {
  const out = [];
  _.uniq(vals).forEach((v) => {
    out.push([`a ${noun} of ${v}`, (x) => x === v]);
    out.push([`a ${noun} greater than ${v}`, (x) => x > v]);
    out.push([`a ${noun} less than ${v}`, (x) => x < v]);
  });
  out.push([`an even ${noun}`, (x) => x % 2 === 0], [`an odd ${noun}`, (x) => x % 2 === 1]);
  return out;
};
const PLAIN_OP = { total: '+', product: '×', difference: '−' };

const grid = () => {
  const a = _.range(1, 7);
  const useSpinner = _.random(0, 2) === 0;
  const b = useSpinner ? _.sample(SPINNERS) : _.range(1, 7);
  const setup = useSpinner
    ? `A fair dice is rolled and a fair spinner numbered 1 to ${b.length} is spun.`
    : 'Two fair dice are rolled.';
  return { a, b, setup, twoDice: !useSpinner };
};

export const generateSampleSpaces = (options = {}) => {
  const { difficulty = 'core' } = options;
  const meta = { topic: 'sample-spaces', difficulty };
  const kind = _.random(0, 1);

  if (difficulty === 'stretch' && kind) {
    // Three coins: list the eight outcomes.
    const outcomes = ['HHH', 'HHT', 'HTH', 'THH', 'HTT', 'THT', 'TTH', 'TTT'];
    const ev = _.sample([
      ['exactly two heads', (o) => o.split('H').length - 1 === 2],
      ['exactly one head', (o) => o.split('H').length - 1 === 1],
      ['at least one head', (o) => o.includes('H')],
      ['at least two tails', (o) => o.split('T').length - 1 >= 2],
      ['all three the same', (o) => new Set(o).size === 1],
      ['more heads than tails', (o) => o.split('H').length - 1 >= 2],
    ]);
    const hits = outcomes.filter(ev[1]);
    return {
      instruction: 'Three fair coins are tossed.',
      questionText: `Find the probability of ${ev[0]}.`,
      answer: `${P(ev[0])} = ${fracTex(hits.length, 8)}`,
      workingOut: [`\\text{${outcomes.join(', ')}}`, `\\text{${hits.join(', ')}}`, `${P(ev[0])} = ${fracTex(hits.length, 8)}`].join(NL),
      metadata: meta,
    };
  }

  for (;;) {
    const g = grid();
    const op = OPS[_.sample(difficulty === 'foundation' ? ['total', 'total', 'product'] : ['total', 'product', 'difference'])];
    const vals = g.a.flatMap((x) => g.b.map((y) => op.f(x, y)));
    const N = vals.length;
    const [ev, test] = _.sample(gridEvents(vals, op.noun));
    const k = vals.filter(test).length;
    if (k < 2 || k > N - 2) continue;
    const head = [PLAIN_OP[_.findKey(OPS, (o) => o === op)], ...g.b.map(String)];
    const body = g.a.map((x) => [String(x), ...g.b.map((y) => String(op.f(x, y)))]);
    const filled = [head, ...body];

    if (difficulty === 'foundation') {
      return {
        instruction: `The grid shows every ${op.noun}.`,
        questionText: `${g.setup} Find the probability of ${ev}.`,
        answer: `${P(ev)} = ${fracTex(k, N)}`,
        workingOut: [`${k} \\text{ of the } ${N} \\text{ outcomes}`, `${P(ev)} = ${fracTex(k, N)}`].join(NL),
        visualization: { type: 'table', header: 'both', rows: filled },
        metadata: meta,
      };
    }
    if (difficulty === 'core') {
      const empty = [head, ...g.a.map((x) => [String(x), ...g.b.map(() => '')])];
      const solution = [head.map(() => ''), ...body.map((row) => ['', ...row.slice(1)])];
      return {
        instruction: `Complete the grid of the ${op.noun}s.`,
        questionText: `${g.setup} Find the probability of ${ev}.`,
        answer: `${P(ev)} = ${fracTex(k, N)}`,
        workingOut: [`${k} \\text{ of the } ${N} \\text{ outcomes}`, `${P(ev)} = ${fracTex(k, N)}`].join(NL),
        visualization: { type: 'table', header: 'both', rows: empty, solution, shrink: true },
        metadata: meta,
      };
    }
    // Stretch: given that something has happened, the grid narrows.
    if (!g.twoDice) continue;
    const given = _.sample([
      ['a double', (x, y) => x === y],
      [`the first dice shows ${_.random(1, 6)}`, null],
      [`a ${op.noun} greater than ${_.sample(_.sortBy(_.uniq(vals)).slice(2, -2))}`, null],
    ]);
    let cond;
    if (given[1]) cond = given[1];
    else if (given[0].startsWith('the first')) { const d = Number(given[0].slice(-1)); cond = (x) => x === d; }
    else { const v = Number(given[0].split(' ').pop()); cond = (x, y) => op.f(x, y) > v; }
    const pool = g.a.flatMap((x) => g.b.map((y) => [x, y])).filter(([x, y]) => cond(x, y));
    const hits = pool.filter(([x, y]) => test(op.f(x, y)));
    if (hits.length < 1 || hits.length === pool.length || pool.length < 3) continue;
    return {
      instruction: `The grid shows every ${op.noun}.`,
      questionText: `${g.setup} Given ${given[0]}, find the probability of ${ev}.`,
      // The fraction alone: P(... given ...) would not fit the answer band.
      answer: fracTex(hits.length, pool.length),
      workingOut: [`${pool.length} \\text{ outcomes have ${given[0]}}`, `${hits.length} \\text{ of them have ${ev}}`, fracTex(hits.length, pool.length)].join(NL),
      visualization: { type: 'table', header: 'both', rows: filled },
      metadata: meta,
    };
  }
};

/* -------------------------------------------------- independent-events */
//
//   foundation  P(A and B) = P(A) × P(B)
//   core        with a complement: both fail, or one but not the other
//   stretch     exactly one of the two, or at least one

const PAIRS = [
  { setup: (a, b) => `${a} and ${b} each take one shot at a target.`, verb: 'hits', not: 'misses', ev: 'hit' },
  { setup: (a, b) => `${a} and ${b} each take one penalty.`, verb: 'scores', not: 'misses', ev: 'score' },
  { setup: () => 'Two machines work independently.', verb: 'works', not: 'breaks down', ev: 'work', names: ['Machine A', 'Machine B'] },
];
const FRACS = [[1, 2], [1, 3], [2, 3], [1, 4], [3, 4], [2, 5], [3, 5], [4, 5], [1, 6], [5, 6], [3, 7], [4, 7], [5, 8], [7, 8]];

export const generateIndependentEvents = (options = {}) => {
  const { difficulty = 'core' } = options;
  const meta = { topic: 'independent-events', difficulty };
  const kind = _.random(0, 1);
  for (;;) {
    const ctx = _.sample(PAIRS);
    const [A, B] = ctx.names ?? _.sampleSize(['Ana', 'Ben', 'Leo', 'Mia', 'Sam', 'Zara', 'Kofi', 'Priya'], 2);
    const decimals = _.random(0, 1) === 1;
    // Each probability as [numerator, denominator].
    const pick = () => (decimals ? [_.random(1, 9), 10] : _.sample(FRACS));
    const pa = pick(), pb = pick();
    if (pa[0] * pb[1] === pb[0] * pa[1]) continue;
    const tex = ([n, d]) => (d === 10 ? dec(n / 10) : `\\frac{${n}}{${d}}`);
    const comp = ([n, d]) => [d - n, d];
    const given = `${P(`${A} ${ctx.verb}`)} = ${tex(pa)}${NL}${P(`${B} ${ctx.verb}`)} = ${tex(pb)}`;
    const mult = ([a, b], [c, d]) => [a * c, b * d];
    const value = ([n, d]) => (decimals ? dec(n / d) : simpleFrac(n, d));
    const prodTex = (x, y) => `${tex(x)} \\times ${tex(y)}`;
    const out = (ask, label, working, v) => ({
      instruction: `Find the probability that ${ask}`,
      questionText: ctx.setup(A, B),
      questionMath: given,
      answer: `${P(label)} = ${v}`,
      workingOut: [...working, `${P(label)} = ${v}`].join(NL),
      metadata: meta,
    });

    if (difficulty === 'foundation') {
      const both = mult(pa, pb);
      return out(`both ${ctx.ev}`, `both ${ctx.ev}`, [`${prodTex(pa, pb)}`], value(both));
    }
    if (difficulty === 'core') {
      if (kind) {
        const v = mult(comp(pa), comp(pb));
        return out(`neither of them ${ctx.verb}`, `neither ${ctx.verb}`, [`${tex(comp(pa))} \\times ${tex(comp(pb))}`], value(v));
      }
      const v = mult(pa, comp(pb));
      return out(`${A} ${ctx.verb} and ${B} ${ctx.not}`, `${A} ${ctx.verb}, ${B} ${ctx.not}`, [`${tex(pa)} \\times ${tex(comp(pb))}`], value(v));
    }
    // Stretch
    if (kind) {
      const x = mult(pa, comp(pb)), y = mult(comp(pa), pb);
      const sum = [x[0] * y[1] + y[0] * x[1], x[1] * y[1]];
      return out(`exactly one of them ${ctx.verb}`, `exactly one ${ctx.verb}`, [`${tex(pa)} \\times ${tex(comp(pb))} + ${tex(comp(pa))} \\times ${tex(pb)}`], value(sum));
    }
    const none = mult(comp(pa), comp(pb));
    const v = [none[1] - none[0], none[1]];
    return out(`at least one of them ${ctx.verb}`, `at least one ${ctx.verb}`, [`1 - ${tex(comp(pa))} \\times ${tex(comp(pb))}`], value(v));
  }
};

/* ------------------------------------------------------------ either-or */
//
//   foundation  mutually exclusive: P(A or B) = P(A) + P(B), or neither
//   core        not mutually exclusive, counted: numbered cards, or a pack
//               of 52, where P(A or B) = P(A) + P(B) − P(A and B)
//   stretch     the addition rule with probabilities given: P(A or B), or
//               P(A and B) back from it

const CARD_PROPS = [
  ['an even number', (x) => x % 2 === 0], ['an odd number', (x) => x % 2 === 1],
  ['a multiple of 3', (x) => x % 3 === 0], ['a multiple of 4', (x) => x % 4 === 0],
  ['a multiple of 5', (x) => x % 5 === 0], ['a square number', (x) => Number.isInteger(Math.sqrt(x))],
  ['a prime number', (x) => x > 1 && _.range(2, x).every((d) => x % d)],
  ['greater than 15', (x) => x > 15], ['less than 6', (x) => x < 6],
];
const PACK = [
  ['a heart', 13], ['a red card', 26], ['a king', 4], ['a picture card', 12], ['a spade', 13], ['an ace', 4],
];
// How many of the 52 cards are both.
const packBoth = (a, b) => {
  const suit = { 'a heart': ['H'], 'a red card': ['H', 'D'], 'a spade': ['S'] };
  const rank = { 'a king': ['K'], 'a picture card': ['J', 'Q', 'K'], 'an ace': ['A'] };
  if (suit[a] && suit[b]) return a === 'a red card' && b === 'a heart' ? 13 : b === 'a red card' && a === 'a heart' ? 13 : 0;
  if (rank[a] && rank[b]) return rank[a].filter((r) => rank[b].includes(r)).length * 4;
  const s = suit[a] ?? suit[b], r = rank[a] ?? rank[b];
  return s.length * r.length;
};

export const generateEitherOr = (options = {}) => {
  const { difficulty = 'core' } = options;
  const meta = { topic: 'either-or', difficulty };
  const kind = _.random(0, 1);
  for (;;) {
    if (difficulty === 'foundation') {
      const [c1, c2, c3] = _.sampleSize(SPIN, 3);
      const h1 = _.random(1, 8) * 5, h2 = _.random(1, 8) * 5;
      if (h1 + h2 >= 95 || h1 === h2) continue;
      const given = `${P(c1)} = ${dec(h1 / 100)}${NL}${P(c2)} = ${dec(h2 / 100)}`;
      const setup = `A spinner can land on ${c1}, ${c2} or ${c3}.`;
      if (kind) {
        return {
          instruction: `Find the probability that it lands on ${c1} or ${c2}`,
          questionText: setup, questionMath: given,
          answer: `${P(`${c1} or ${c2}`)} = ${dec((h1 + h2) / 100)}`,
          workingOut: `${dec(h1 / 100)} + ${dec(h2 / 100)} = ${dec((h1 + h2) / 100)}`,
          metadata: meta,
        };
      }
      return {
        instruction: `Find the probability that it lands on ${c3}`,
        questionText: setup, questionMath: given,
        answer: `${P(c3)} = ${dec(1 - (h1 + h2) / 100)}`,
        workingOut: `1 - (${dec(h1 / 100)} + ${dec(h2 / 100)}) = ${dec(1 - (h1 + h2) / 100)}`,
        metadata: meta,
      };
    }

    if (difficulty === 'core') {
      if (kind) {
        const n = _.random(15, 30);
        const [[pa, ta], [pb, tb]] = _.sampleSize(CARD_PROPS, 2);
        const cards = _.range(1, n + 1);
        const A = cards.filter(ta), B = cards.filter(tb), AB = cards.filter((x) => ta(x) && tb(x));
        if (!AB.length || A.length < 2 || B.length < 2 || AB.length === A.length || AB.length === B.length) continue;
        const k = A.length + B.length - AB.length;
        return {
          instruction: 'One card is taken at random.',
          questionText: `Cards are numbered 1 to ${n}. Find the probability that it is ${pa} or ${pb}.`,
          answer: `${P(`${pa.replace(/^an? /, '')} or ${pb.replace(/^an? /, '')}`)} = ${fracTex(k, n)}`,
          workingOut: [`\\frac{${A.length}}{${n}} + \\frac{${B.length}}{${n}} - \\frac{${AB.length}}{${n}}`, `= ${fracTex(k, n)}`].join(NL),
          metadata: meta,
        };
      }
      const [[a, na], [b, nb]] = _.sampleSize(PACK, 2);
      const both = packBoth(a, b);
      if (both === 0 || both === na || both === nb) continue;
      const k = na + nb - both;
      return {
        instruction: 'One card is taken at random from an ordinary pack.',
        questionText: `A pack has 52 cards. Find the probability that it is ${a} or ${b}.`,
        answer: `${P(`${a.replace(/^an? /, '')} or ${b.replace(/^an? /, '')}`)} = ${fracTex(k, 52)}`,
        workingOut: [`\\frac{${na}}{52} + \\frac{${nb}}{52} - \\frac{${both}}{52}`, `= ${fracTex(k, 52)}`].join(NL),
        metadata: meta,
      };
    }

    // Stretch: the addition rule with the probabilities given.
    const a = _.random(2, 7) * 10, b = _.random(2, 7) * 10;
    const ab = _.random(1, Math.min(a, b) / 5 - 1) * 5;
    const or = a + b - ab;
    if (or >= 100 || ab >= Math.min(a, b)) continue;
    const ev = _.sample([['A', 'B'], ['C', 'D'], ['X', 'Y']]);
    if (kind) {
      return {
        instruction: `Find the probability of ${ev[0]} or ${ev[1]}`,
        questionMath: `P(${ev[0]}) = ${dec(a / 100)}${NL}P(${ev[1]}) = ${dec(b / 100)}${NL}P(${ev[0]} \\text{ and } ${ev[1]}) = ${dec(ab / 100)}`,
        answer: `P(${ev[0]} \\text{ or } ${ev[1]}) = ${dec(or / 100)}`,
        workingOut: `${dec(a / 100)} + ${dec(b / 100)} - ${dec(ab / 100)} = ${dec(or / 100)}`,
        metadata: meta,
      };
    }
    return {
      instruction: 'Find the probability of both',
      questionMath: `P(${ev[0]}) = ${dec(a / 100)}${NL}P(${ev[1]}) = ${dec(b / 100)}${NL}P(${ev[0]} \\text{ or } ${ev[1]}) = ${dec(or / 100)}`,
      answer: `P(${ev[0]} \\text{ and } ${ev[1]}) = ${dec(ab / 100)}`,
      workingOut: `${dec(a / 100)} + ${dec(b / 100)} - ${dec(or / 100)} = ${dec(ab / 100)}`,
      metadata: meta,
    };
  }
};
