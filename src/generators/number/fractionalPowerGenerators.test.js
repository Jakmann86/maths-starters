// src/generators/number/fractionalPowerGenerators.test.js
//
// Substitute-the-answer-back checks for fractional-powers. Every answer is
// rebuilt from the printed question alone: n, m and the letter are pulled
// back out of the LaTeX, never taken from the generator. Evaluation uses an
// exact integer nth root, so a base that is only nearly a perfect power fails
// rather than rounding into one. Every distinct expression is also compiled
// with KaTeX (throwOnError), since this whole topic renders there.
//
// Run: npx vitest run src/generators/number/fractionalPowerGenerators.test.js

import { describe, expect, it } from 'vitest';
import katex from 'katex';
import { generateFractionalPowers } from './fractionalPowerGenerators';

const SAMPLES = 8000;
const gcd = (a, b) => (b === 0 ? a : gcd(b, a % b));

// Exact integer nth root, or null when base is not a perfect nth power.
const exactRoot = (base, n) => {
  const r = Math.round(base ** (1 / n));
  for (const c of [r - 1, r, r + 1]) if (c > 0 && c ** n === base) return c;
  return null;
};

const draw = (difficulty) => {
  const out = [];
  for (let i = 0; i < SAMPLES; i++) out.push(generateFractionalPowers({ difficulty }));
  return out;
};

const ROOT = /\\sqrt(?:\[(\d+)\])?\{([a-z])\^\{(\d+)\}\}/;

// "\sqrt[n]{v^{m}}" -> { n, m, v }
const parseRoot = (tex) => {
  const r = tex.match(ROOT);
  if (!r) return null;
  return { n: Number(r[1] ?? 2), v: r[2], m: Number(r[3]) };
};

const allTex = (q) => [q.questionMath, q.answer, ...q.workingOut.split('\n')];

describe('fractional-powers', () => {
  it('foundation: \\sqrt[n]{v^m} -> v^{m/n}, lowest terms, m >= 2', () => {
    const seen = new Set();
    for (const q of draw('foundation')) {
      const p = parseRoot(q.questionMath);
      expect(p, q.questionMath).not.toBeNull();
      expect(q.questionMath).toBe(p.n === 2 ? `\\sqrt{${p.v}^{${p.m}}}` : `\\sqrt[${p.n}]{${p.v}^{${p.m}}}`);
      expect(gcd(p.m, p.n)).toBe(1);
      expect(p.m).toBeGreaterThanOrEqual(2);
      expect(p.v).not.toBe('n');
      expect(q.instruction).toBe(`Write as a single power of ${p.v}`);
      expect(q.answer).toBe(`${p.v}^{\\frac{${p.m}}{${p.n}}}`);
      seen.add(q.questionMath);
    }
    console.log(`foundation: ${seen.size} distinct`);
  });

  it('core: base^{m/n} evaluates exactly to the printed answer', () => {
    const qs = new Set();
    const as = new Set();
    for (const q of draw('core')) {
      const r = q.questionMath.match(/^(\d+)\^\{\\frac\{(\d+)\}\{(\d+)\}\}$/);
      expect(r, q.questionMath).not.toBeNull();
      const [base, m, n] = r.slice(1).map(Number);
      expect(gcd(m, n)).toBe(1);
      const k = exactRoot(base, n);
      expect(k, `${base} is not a perfect ${n}th power`).not.toBeNull();
      expect(q.answer).toBe(String(k ** m));
      expect(base).toBeLessThanOrEqual(1000);
      expect(k ** m).toBeLessThanOrEqual(1000);
      qs.add(q.questionMath);
      as.add(q.answer);
    }
    console.log(`core: ${qs.size} distinct questions, ${as.size} distinct answers`);
  });

  it('stretch: both variants correct, split roughly 50/50', () => {
    let evalCount = 0;
    let convCount = 0;
    const seen = new Set();
    for (const q of draw('stretch')) {
      seen.add(q.questionMath);
      const ev = q.questionMath.match(/^(\d+)\^\{-\\frac\{(\d+)\}\{(\d+)\}\}$/);
      if (ev) {
        evalCount++;
        const [base, m, n] = ev.slice(1).map(Number);
        expect(gcd(m, n)).toBe(1);
        const k = exactRoot(base, n);
        expect(k).not.toBeNull();
        expect(k ** m).toBeLessThanOrEqual(125);
        expect(q.answer).toBe(`\\frac{1}{${k ** m}}`);
        continue;
      }
      const cv = q.questionMath.match(/^\\frac\{1\}\{(.*)\}$/);
      expect(cv, q.questionMath).not.toBeNull();
      const p = parseRoot(cv[1]);
      expect(p).not.toBeNull();
      expect(gcd(p.m, p.n)).toBe(1);
      expect(q.answer).toBe(`${p.v}^{-\\frac{${p.m}}{${p.n}}}`);
      convCount++;
    }
    const share = evalCount / SAMPLES;
    expect(share).toBeGreaterThan(0.45);
    expect(share).toBeLessThan(0.55);
    console.log(`stretch: ${seen.size} distinct; evaluate ${evalCount} / convert ${convCount}`);
  });

  it('working opens with the question and closes on the answer', () => {
    for (const band of ['foundation', 'core', 'stretch']) {
      for (const q of draw(band)) {
        const lines = q.workingOut.split('\n');
        expect(lines[0].startsWith(`${q.questionMath} = `)).toBe(true);
        expect(lines.at(-1)).toBe(`= ${q.answer}`);
        expect(q.workingOut).not.toMatch(/\\n(?![a-z])/);
      }
    }
  });

  it('every distinct expression compiles in KaTeX', () => {
    const exprs = new Set();
    for (const band of ['foundation', 'core', 'stretch']) {
      for (const q of draw(band)) allTex(q).forEach((t) => exprs.add(t));
    }
    for (const t of exprs) {
      expect(() => katex.renderToString(t, { throwOnError: true }), t).not.toThrow();
    }
    console.log(`katex: ${exprs.size} distinct expressions compiled`);
  });
});
