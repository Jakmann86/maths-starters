// src/generators/geometry/circleLengthGenerators.test.js
//
// Substitute-the-answer-back checks for the two length-based circle theorems.
// Every length is read back out of the figure config — the label strings,
// parsed to numbers — never out of the generator's own variables, so a
// generator and a figure that disagreed about which edge is which would fail
// here rather than reach a board.
//
// Re-checked per sample: Pythagoras closes on the figure's own numbers; the
// unknown is marked on the field the question actually asks for; no chord
// exceeds its diameter; the longer of two parallel chords is the one nearer
// the centre; every numeric side of every working line agrees; and every
// number in the opening working line already appears on the figure — that
// last one is what catches a working line that has silently halved a chord
// before its first "=".
//
// Run: npx vitest run src/generators/geometry/circleLengthGenerators.test.js

import { describe, expect, it } from 'vitest';
import { generateChordBisector, generateTangentLength } from './circleLengthGenerators';

const BANDS = ['foundation', 'core', 'stretch'];
const SAMPLES = 6000;

/** "48 cm" -> 48. Throws on anything that isn't a plain centimetre length. */
const cm = (label) => {
  const m = String(label).match(/^(\d+) cm$/);
  if (!m) throw new Error(`not a length label: "${label}"`);
  return Number(m[1]);
};

/** Every integer appearing in a string, in order. */
const nums = (s) => (String(s).match(/\d+/g) ?? []).map(Number);

/** Checks `a^2 + b^2 = c^2` exactly, on integers. */
const pythag = (a, b, c) => a * a + b * b === c * c;

const sample = (fn, band) => Array.from({ length: SAMPLES }, () => fn({ difficulty: band }));

/** Every working line of the form "lhs = ... = n" must agree arithmetically. */
const workingArithmeticHolds = (workingOut) => String(workingOut).split('\n').every((line) => {
  const parts = line.split('=').map((t) => t.trim());
  if (parts.length < 3) return true;              // "AM = 24", nothing to check
  const rhs = parts.slice(1);
  const evaluated = rhs.map((expr) => {
    // The only arithmetic the working ever writes out: a difference or sum of
    // squares, a halving, or a product.
    const norm = expr
      // pi is a common factor on both sides of a "C = ..." line, so it can be
      // divided out rather than modelled.
      .replace(/\\times\s*\\pi/g, '')
      .replace(/\\pi\s*\\times/g, '')
      .replace(/\\pi/g, '')
      .replace(/\\times/g, '*')
      .replace(/\\div/g, '/')
      // A bracketed group can be squared too — "(48 \\div 2)^2" — and dropping
      // that exponent instead of applying it is how a check like this quietly
      // stops checking anything.
      .replace(/(\([^()]*\))\^2/g, '($1*$1)')
      .replace(/(\d+)\^2/g, '($1*$1)');
    if (!/^[\d\s+*/()-]+$/.test(norm)) return null;
    // eslint-disable-next-line no-new-func
    return Function(`"use strict";return (${norm})`)();
  });
  const known = evaluated.filter((v) => v !== null);
  return known.every((v) => v === known[0]);
});

describe('generateChordBisector', () => {
  it.each(BANDS)('%s: recomputes from the figure alone', (band) => {
    for (const q of sample(generateChordBisector, band)) {
      const f = q.visualization;
      expect(q.metadata).toEqual({ topic: 'chord-perpendicular-bisector', difficulty: band });
      expect(q.questionMath).toBeUndefined();     // forward question, CLAUDE.md §2
      expect(q.answerUnits).toBe('cm');
      expect(f[f.unknown]).toBe('x');             // the unknown really is the blank
      expect(workingArithmeticHolds(q.workingOut)).toBe(true);

      const r = cm(f.r);
      if (band === 'stretch') {
        expect(f.type).toBe('circle-parallel-chords');
        expect(f.unknown).toBe('gap');
        const c1 = cm(f.chord1), c2 = cm(f.chord2);
        expect(c1).toBeLessThanOrEqual(2 * r);
        expect(c2).toBeLessThanOrEqual(2 * r);
        expect(c1).not.toBe(c2);
        // Distances recovered from the chords, not from the generator.
        const d1 = Math.sqrt(r * r - (c1 / 2) ** 2);
        const d2 = Math.sqrt(r * r - (c2 / 2) ** 2);
        expect(Number.isInteger(d1)).toBe(true);
        expect(Number.isInteger(d2)).toBe(true);
        // chord1 is drawn above chord2; the longer chord is nearer the centre,
        // so it must be the lower one.
        expect(c1).toBeLessThan(c2);
        expect(d1).toBeGreaterThan(d2);
        const expected = f.sameSide ? Math.abs(d1 - d2) : d1 + d2;
        expect(Number(q.answer)).toBe(expected);
        expect(q.instruction).toContain(f.sameSide ? 'same side' : 'opposite sides');
        // The opening line must not have quietly halved anything: every number
        // in it appears on the figure or is r^2 arithmetic.
        expect(nums(q.workingOut.split('\n')[0])).toContain(c1);
      } else {
        expect(f.type).toBe('circle-chord');
        const chord = band === 'foundation' ? Number(q.answer) : cm(f.chord);
        const d = band === 'foundation' ? cm(f.d) : Number(q.answer);
        expect(f.unknown).toBe(band === 'foundation' ? 'chord' : 'd');
        expect(chord).toBeLessThanOrEqual(2 * r);
        expect(pythag(chord / 2, d, r)).toBe(true);
        expect(nums(q.workingOut.split('\n')[0])).toContain(band === 'foundation' ? d : chord);
      }
    }
  });
});

describe('generateTangentLength', () => {
  it.each(BANDS)('%s: recomputes from the figure alone', (band) => {
    const seen = new Set();
    for (const q of sample(generateTangentLength, band)) {
      const f = q.visualization;
      expect(q.metadata).toEqual({ topic: 'tangent-length', difficulty: band });
      expect(q.questionMath).toBeUndefined();
      expect(q.answerUnits).toBe('cm');
      expect(f.type).toBe('circle-tangent-kite');
      expect(f.lengths).toBe(true);
      expect(f.single).toBe(true);
      expect(f.op).toBe(true);
      expect([0, 90, 180, 270]).toContain(f.rotate);
      seen.add(f.rotate);
      expect(workingArithmeticHolds(q.workingOut)).toBe(true);

      if (band === 'stretch') {
        // The radius is withheld, so it can only come back out of the figure's
        // other two lengths.
        const op = cm(f.opLabel), tangent = cm(f.tangent);
        expect(f.radius).toBeUndefined();
        expect(f.unknown).toBeNull();
        const r = Math.sqrt(op * op - tangent * tangent);
        expect(Number.isInteger(r)).toBe(true);
        expect(q.answer).toBe(`${2 * r}\\pi`);
        expect(q.instruction).toContain('in terms of π');
      } else {
        const r = cm(f.radius);
        const tangent = band === 'foundation' ? Number(q.answer) : cm(f.tangent);
        const op = band === 'foundation' ? cm(f.opLabel) : Number(q.answer);
        expect(f.unknown).toBe(band === 'foundation' ? 'tangent' : 'opLabel');
        expect(f[f.unknown]).toBe('x');
        expect(pythag(r, tangent, op)).toBe(true);   // tangent ⊥ radius at A
        expect(op).toBeGreaterThan(r);               // P really is outside
      }
    }
    expect(seen.size).toBe(4);
  });
});

describe('question ceilings', () => {
  // Both skills need a Pythagorean triple, so the variety is the number of
  // triples with a hypotenuse in a sensible classroom range — the thinnest
  // ceiling in the app, and worth stating plainly rather than inflating.
  //
  // `rotate` is stripped from the key first. tangent-length draws 416
  // distinct figures, but that is 104 pieces of maths seen at four
  // rotations; the four turns of the same triangle are not four questions,
  // and counting them as such would flatter the number by 4x.
  //
  // Asserted as floors, so a later widening is free but a silent narrowing
  // is not. Actual counts when written: 104 / 104 / 160 and 104 / 104 / 104.
  it.each([
    ['chord-perpendicular-bisector', generateChordBisector, { foundation: 104, core: 104, stretch: 160 }],
    ['tangent-length', generateTangentLength, { foundation: 104, core: 104, stretch: 104 }],
  ])('%s produces at least the documented variety', (_id, fn, floors) => {
    for (const band of BANDS) {
      const distinct = new Set(
        Array.from({ length: 24000 }, () => {
          const q = fn({ difficulty: band });
          const { rotate: _rotate, ...fig } = q.visualization;   // rotation is not new maths
          return JSON.stringify(fig);
        }),
      );
      expect(distinct.size).toBeGreaterThanOrEqual(floors[band]);
    }
  });
});
