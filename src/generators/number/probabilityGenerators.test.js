// Substitute-the-answer-back harness for simple-probability. Every answer is
// recomputed from what the class can see — the set-up sentence, the ask, the
// spinner table, the given probability — never from the generator's
// variables. Card properties are re-tested here by hand rather than through
// the generator's PROPERTIES, so a phrase and a test that disagree fail.
//
// Run: npx vitest run src/generators/number/probabilityGenerators.test.js

import { describe, expect, it } from 'vitest';
import { generateSimpleProbability } from './probabilityGenerators';

const SAMPLES = 5000;
const BANDS = ['foundation', 'core', 'stretch'];
const gcd = (a, b) => (b ? gcd(b, a % b) : a);

const isPrime = (x) => {
  if (x < 2) return false;
  for (let d = 2; d * d <= x; d += 1) if (x % d === 0) return false;
  return true;
};
const PROPERTY = {
  'an even number': (x) => x % 2 === 0,
  'an odd number': (x) => x % 2 !== 0,
  'a multiple of 3': (x) => x % 3 === 0,
  'a multiple of 4': (x) => x % 4 === 0,
  'a multiple of 5': (x) => x % 5 === 0,
  'a prime number': isPrime,
  'a square number': (x) => Math.round(Math.sqrt(x)) ** 2 === x,
  'a factor of 24': (x) => 24 % x === 0,
  'a factor of 36': (x) => 36 % x === 0,
};

const BAG = /^A (bag|box|jar) holds (.+) (counters|marbles|cubes|beads)\. One is taken at random\.$/;
const CARDS = /^Cards numbered 1 to (\d+) are shuffled and one is taken at random\.$/;
const SPINNER = 'The table shows the probabilities for a biased spinner.';
const REVERSE = /^A (bag|box|jar) holds (\d+) ([a-z]+) (\w+) and some ([a-z]+) \4\. One is taken at random\. How many \5 \4 are there\?$/;

// "4 red, 7 blue and 3 green" → { red: 4, blue: 7, green: 3 }
const readBag = (s) => Object.fromEntries([...s.matchAll(/(\d+) ([a-z]+)/g)].map((m) => [m[2], Number(m[1])]));

// "P(\text{E}) = \frac{k}{n}" with an optional "= \frac{a}{b}" in lowest
// terms, which must be present exactly when k/n reduces.
function expectFraction(answer, event, k, n) {
  const m = /^P\(\\text\{(.+)\}\) = \\frac\{(\d+)\}\{(\d+)\}(?: = \\frac\{(\d+)\}\{(\d+)\})?$/.exec(answer);
  expect(m, answer).toBeTruthy();
  expect(m[1]).toBe(event);
  expect([Number(m[2]), Number(m[3])], answer).toEqual([k, n]);
  const g = gcd(k, n);
  if (g > 1) expect([Number(m[4]), Number(m[5])], answer).toEqual([k / g, n / g]);
  else expect(m[4], answer).toBeUndefined();
}

// Hundredths from a table cell or an answer: '0.3' → 30, '0.05' → 5.
const hundredths = (s) => {
  const m = /^0\.(\d{1,2})$/.exec(s);
  expect(m, s).toBeTruthy();
  expect(m[1].length === 2 && m[1].endsWith('0'), `${s} has a trailing zero`).toBe(false);
  return Number(m[1].padEnd(2, '0'));
};

function check(q, difficulty) {
  expect(q.metadata).toEqual({ topic: 'simple-probability', difficulty });
  expect(q.instruction).not.toMatch(/\\/);
  expect(q.workingOut).not.toContain('\\n');
  expect(q.workingOut).not.toContain('−');
  if (q.questionText != null) {
    expect(q.questionText).not.toMatch(/\\/);
    expect(q.questionMath).toBeUndefined();
  }

  // Bag: one colour, "not X", or "X or Y".
  let m = BAG.exec(q.instruction);
  if (m) {
    const counts = readBag(m[2]);
    const colours = Object.keys(counts);
    const total = Object.values(counts).reduce((a, b) => a + b, 0);
    expect(new Set(Object.values(counts)).size, 'counts differ').toBe(colours.length);
    const ask = /^Find the probability that it is (.+)\.$/.exec(q.questionText)[1];
    let k;
    let form;
    if (counts[ask] != null) { k = counts[ask]; form = 'one'; }
    else if (/^not /.test(ask)) { k = total - counts[ask.slice(4)]; form = 'not'; }
    else {
      const [a, b] = ask.split(' or ');
      expect(a).not.toBe(b);
      k = counts[a] + counts[b];
      form = 'or';
    }
    expect(Number.isInteger(k), ask).toBe(true);
    expectFraction(q.answer, ask, k, total);
    expect(q.visualization).toBeUndefined();
    if (difficulty === 'foundation') { expect(form).toBe('one'); expect(colours).toHaveLength(3); }
    else expect(difficulty).toBe('core');
    return `bag ${form}`;
  }

  // Cards: list 1..n with the property.
  m = CARDS.exec(q.instruction);
  if (m) {
    expect(difficulty).toBe('core');
    const n = Number(m[1]);
    const phrase = /^Find the probability that the number is (.+)\.$/.exec(q.questionText)[1];
    const test = PROPERTY[phrase];
    expect(test, phrase).toBeDefined();
    const k = Array.from({ length: n }, (_x, i) => i + 1).filter(test).length;
    expect(k).toBeGreaterThanOrEqual(3);
    expectFraction(q.answer, phrase.replace(/^an? /, ''), k, n);
    return 'cards';
  }

  // Spinner: the table sums to 1.
  if (q.instruction === SPINNER) {
    const fig = q.visualization;
    expect(fig.type).toBe('table');
    expect(fig.rows[0]).toEqual(['Colour', 'Probability']);
    const body = fig.rows.slice(1);
    expect(body).toHaveLength(4);
    const ask = /^Find the probability that it lands on ([a-z]+)\.$/.exec(q.questionText)[1];
    const row = body.findIndex(([c]) => c.toLowerCase() === ask);
    expect(row, ask).toBeGreaterThanOrEqual(0);
    const am = /^P\(\\text\{([a-z]+)\}\) = (0\.\d+)$/.exec(q.answer);
    expect(am, q.answer).toBeTruthy();
    expect(am[1]).toBe(ask);
    const ans = hundredths(am[2]);

    if (difficulty === 'foundation') {
      const blank = body.findIndex(([, p]) => p === '');
      expect(blank).toBe(row);
      expect(body.filter(([, p]) => p === '')).toHaveLength(1);
      const known = body.reduce((s, [, p]) => s + (p === '' ? 0 : hundredths(p)), 0);
      expect(ans).toBe(100 - known);
      expect(fig.solution[row + 1][1]).toBe(am[2]);
      return 'spinner missing';
    }
    expect(difficulty).toBe('stretch');
    expect(fig.solution).toBeUndefined();
    const xs = body.map(([, p]) => /^(\d*)x$/.exec(p));
    const xRows = xs.map((x, i) => (x ? i : -1)).filter((i) => i >= 0);
    expect(xRows).toHaveLength(2);
    const coef = (i) => (xs[i][1] === '' ? 1 : Number(xs[i][1]));
    expect(xRows.map(coef).sort()).toContain(1);
    const known = body.reduce((s, [, p], i) => s + (xs[i] ? 0 : hundredths(p)), 0);
    const total = xRows.reduce((s, i) => s + coef(i), 0);
    const x = (100 - known) / total;
    expect(Number.isInteger(x) && x > 0, `x = ${x}`).toBe(true);
    expect(xs[row], 'asks for an x row').toBeTruthy();
    expect(ans).toBe(coef(row) * x);
    return `spinner ${coef(row) === 1 ? 'x' : 'kx'}`;
  }

  // Reverse bag: scale the given fraction up to the known count.
  m = REVERSE.exec(q.instruction);
  expect(m, q.instruction).toBeTruthy();
  expect(difficulty).toBe('stretch');
  const [, , a, c1, , c2] = m;
  expect(c1).not.toBe(c2);
  const pm = /^P\(\\text\{([a-z]+)\}\) = \\frac\{(\d+)\}\{(\d+)\}$/.exec(q.questionMath);
  expect(pm, q.questionMath).toBeTruthy();
  expect(pm[1]).toBe(c1);
  const [p, d] = [Number(pm[2]), Number(pm[3])];
  expect(gcd(p, d), 'given in lowest terms').toBe(1);
  expect(Number(a) % p).toBe(0);
  expect(Number(a), 'the given fraction is not the counts as they stand').not.toBe(p);
  const total = (Number(a) / p) * d;
  expect(q.answer).toBe(String(total - Number(a)));
  expect(Number(q.answer)).toBeGreaterThan(0);
  expect(q.answerUnits).toBe(`\\text{${c2} ${m[4]}}`);
  return 'reverse bag';
}

describe('simple-probability', () => {
  BANDS.forEach((difficulty) => {
    it(`${difficulty}: every answer follows from what is on the board`, () => {
      const questions = new Set();
      const answers = new Set();
      const mix = {};
      for (let t = 0; t < SAMPLES; t += 1) {
        const q = generateSimpleProbability({ difficulty });
        const form = check(q, difficulty);
        mix[form] = (mix[form] ?? 0) + 1;
        questions.add(JSON.stringify([q.instruction, q.questionText, q.questionMath, q.visualization]));
        answers.add(q.answer);
      }
      process.stdout.write(
        `simple-probability ${difficulty}: ${questions.size} distinct questions, ${answers.size} distinct answers; ` +
        `${Object.entries(mix).map(([k, v]) => `${k} ${v}`).join(', ')}\n`,
      );
      expect(Object.keys(mix).length).toBeGreaterThanOrEqual(2);
    });
  });
});
