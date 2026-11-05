import { describe, it, expect } from 'vitest';
import { generateDirectVariation, generateInverseVariation } from './variationGenerators';

const BANDS = ['foundation', 'core', 'stretch'];
const RUNS = 3000;

const power = (tex, letter) => {
  if (tex === letter) return (v) => v;
  if (tex === `\\sqrt{${letter}}`) return Math.sqrt;
  const m = tex.match(/\^(\d)$/);
  expect(m, tex).not.toBeNull();
  return (v) => v ** Number(m[1]);
};

// Everything is read back from the question's own three lines.
function solve(q, inverse) {
  const [law, given, ask] = q.questionMath.split('\n');
  const body = law.split('\\propto ')[1];
  const D = law[0];
  const inner = inverse ? body.match(/^\\frac\{1\}\{(.*)\}$/)[1] : body;
  const I = /\\sqrt\{(\w)\}|^(\w)/.exec(inner).slice(1).find(Boolean);
  const f = power(inner, I);
  const g = given.match(/^(\w) = (\d+) \\text\{ when \} (\w) = (\d+)$/);
  expect(g, given).not.toBeNull();
  expect([g[1], g[3]]).toEqual([D, I]);
  const [y1, x1] = [Number(g[2]), Number(g[4])];
  const k = inverse ? y1 * f(x1) : y1 / f(x1);
  const a = ask.match(/^\\text\{Find \} (\w) \\text\{ when \} (\w) = (\d+)$/);
  expect(a, ask).not.toBeNull();
  const known = Number(a[3]);
  if (a[1] === D) return inverse ? k / f(known) : k * f(known);
  // Reversed: try whole numbers until the power is undone.
  for (let x = 1; x <= 400; x += 1) {
    if (Math.abs((inverse ? k / f(x) : k * f(x)) - known) < 1e-9) return x;
  }
  return NaN;
}

describe.each([
  ['direct', generateDirectVariation, false],
  ['inverse', generateInverseVariation, true],
])('%s variation', (_n, gen, inverse) => {
  it.each(BANDS)('%s: the answer follows from the big text alone', (difficulty) => {
    const seen = new Set();
    for (let i = 0; i < RUNS; i += 1) {
      const q = gen({ difficulty });
      expect(solve(q, inverse), q.questionMath).toBe(Number(q.answer));
      // No number the class needs is left in the instruction.
      expect(q.instruction).not.toMatch(/\d/);
      seen.add(q.questionMath.replace(/[A-Za-z]/g, '?'));
    }
    expect(seen.size).toBeGreaterThan(40);
  });
});
