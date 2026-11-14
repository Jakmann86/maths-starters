import { describe, it, expect } from 'vitest';
import { generateFormulaDerivation, generateSimultaneousGraphical } from './formulaGenerators';

const BANDS = ['foundation', 'core', 'stretch'];
const RUNS = 3000;

// The arithmetic each situation describes, read from its own wording: the three
// numbers appear in the order start, rate, count, except the baker's.
const SITUATIONS = [
  { re: /savings account .*deposited/, f: (s, r, n) => s + r * n, letter: 'A' },
  { re: /savings account .*withdrawn/, f: (s, r, n) => s - r * n, letter: 'A' },
  { re: /taxi/, f: (s, r, n) => s + r * n, letter: 'C' },
  { re: /plumber/, f: (s, r, n) => s + r * n, letter: 'C' },
  { re: /school trip/, f: (s, r, n) => s + r * n, letter: 'C' },
  { re: /baker/, f: (s, n, r) => r * n - s, letter: 'P' },
  { re: /tap adds/, f: (s, r, n) => s + r * n, letter: 'V' },
  { re: /drains/, f: (s, r, n) => s - r * n, letter: 'V' },
  { re: /candle/, f: (s, r, n) => s - r * n, letter: 'H' },
];

const situationOf = (text) => {
  const hit = SITUATIONS.filter((s) => s.re.test(text));
  expect(hit, text).toHaveLength(1);
  return hit[0];
};

// Formula substitution's figures (4πr² on a sphere, never a circle) are
// checked in formulaLadder.test.js, with the rest of that skill.

describe('formula derivation', () => {
  it('Foundation: the answer is what the sentence works out to', () => {
    const seen = new Set();
    const contexts = new Set();
    for (let i = 0; i < RUNS; i += 1) {
      const q = generateFormulaDerivation({ difficulty: 'foundation' });
      const sit = situationOf(q.questionText);
      contexts.add(sit.re.source);
      const nums = q.questionText.match(/\d+/g).map(Number);
      expect(nums, q.questionText).toHaveLength(3);
      const value = sit.f(...nums);
      expect(value).toBeGreaterThan(0);
      expect(q.answer).toBe(`${sit.letter} = ${/£/.test(q.questionText) ? '\\pounds ' : ''}${value}`);
      seen.add(q.questionText);
    }
    expect(contexts.size).toBe(SITUATIONS.length);
    expect(seen.size).toBeGreaterThan(500);
  });

  it('Core: the formula, evaluated at any n, is what the sentence describes', () => {
    for (let i = 0; i < RUNS; i += 1) {
      const q = generateFormulaDerivation({ difficulty: 'core' });
      const sit = situationOf(q.questionText);
      const letter = q.instruction.match(/in terms of (\w)$/)[1];
      const [first, second] = q.questionText.match(/\d+/g).map(Number);
      const m = q.answer.match(new RegExp(`^${sit.letter} = (\\d+)${letter} - (\\d+)$|^${sit.letter} = (\\d+) ([+-]) (\\d+)${letter}$`));
      expect(m, q.answer).not.toBeNull();
      const formula = m[1]
        ? (n) => Number(m[1]) * n - Number(m[2])
        : (n) => Number(m[3]) + (m[4] === '+' ? 1 : -1) * Number(m[5]) * n;
      // The baker's sentence gives the cost and then the price.
      const bySentence = /baker/.test(q.questionText)
        ? (n) => sit.f(first, n, second)
        : (n) => sit.f(first, second, n);
      for (const n of [1, 2, 7]) expect(formula(n), q.questionText).toBe(bySentence(n));
    }
  });

  it('Stretch: no numbers, and every letter named in the instruction is used', () => {
    const contexts = new Set();
    for (let i = 0; i < RUNS; i += 1) {
      const q = generateFormulaDerivation({ difficulty: 'stretch' });
      contexts.add(situationOf(q.questionText).re.source);
      expect(q.questionText).not.toMatch(/\d/);
      const letters = q.instruction.match(/in terms of (\w), (\w) and (\w)$/).slice(1);
      expect(new Set(letters).size).toBe(3);
      for (const l of letters) expect(q.answer).toContain(l);
    }
    expect(contexts.size).toBe(SITUATIONS.length);
  });

  it('every number in a band is in the big text, none in the instruction', () => {
    for (const difficulty of BANDS) {
      for (let i = 0; i < 500; i += 1) {
        expect(generateFormulaDerivation({ difficulty }).instruction).not.toMatch(/\d/);
      }
    }
  });
});

describe('solving graphically', () => {
  it('Foundation: the lines really cross where the answer says, inside the window', () => {
    for (let i = 0; i < RUNS; i += 1) {
      const q = generateSimultaneousGraphical({ difficulty: 'foundation' });
      const [x0, x1, y0, y1] = q.visualization.window;
      const [a, b] = q.visualization.lines;
      const px = (b.c - a.c) / (a.m - b.m);
      const py = a.m * px + a.c;
      expect(px).toBeGreaterThan(x0);
      expect(px).toBeLessThan(x1);
      expect(py).toBeGreaterThan(y0);
      expect(py).toBeLessThan(y1);
      expect(q.answer).toContain(String(px));
      expect(q.answer).toContain(String(py));
    }
  });
});
