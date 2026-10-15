// Substitute-the-answer-back checks for mean-missing-value (all bands, with
// Core's new list half) and data-types. Every answer is recomputed from the
// printed instruction, list and figure — never from the generator's own
// variables.
//
// Run: npx vitest run src/generators/statistics/meanMissingAndDataTypes.test.js

import { describe, expect, it } from 'vitest';
import _ from 'lodash';
import { generateMeanMissingValue } from './averagesGenerators';
import { generateDataTypes, CONTEXTS } from './dataTypesGenerators';
import { parseArchivoLine } from '../../lib/archivoMath.jsx';

const SAMPLES = 4000;
const BANDS = ['foundation', 'core', 'stretch'];

const parses = (q) => {
  [q.answer, q.workingOut, q.questionMath].filter(Boolean).join('\n').split('\n')
    .forEach((line) => expect(parseArchivoLine(line, 'k'), line).not.toBeNull());
  expect([q.instruction, q.answer, q.workingOut].join(' ')).not.toMatch(/\\n|undefined|NaN/);
};

const answerX = (q) => {
  const m = q.answer.match(/^x = (\d+)$/);
  expect(m, q.answer).not.toBeNull();
  return Number(m[1]);
};

// Mean of a table, from the printed cells, with x replaced by a candidate.
const tableMean = (fig, x) => {
  const { rows } = fig;
  if (fig.header === 'column') {
    const vals = rows[0].slice(1).map(Number);
    const fs = rows[1].slice(1).map((f) => (f === 'x' ? x : Number(f)));
    return _.sum(vals.map((v, i) => v * fs[i])) / _.sum(fs);
  }
  const body = rows.slice(1);
  const mids = body.map(([cls]) => {
    const [lo, hi] = cls.split(' ≤ x < ').map(Number);
    return (lo + hi) / 2;
  });
  const fs = body.map((r) => (r[1] === 'x' ? x : Number(r[1])));
  return _.sum(mids.map((m, i) => m * fs[i])) / _.sum(fs);
};

describe('mean-missing-value', () => {
  BANDS.forEach((difficulty) => {
    it(`${difficulty}: the stated x gives the stated mean, and no other x does`, () => {
      const distinct = new Set();
      let lists = 0;
      for (let t = 0; t < SAMPLES; t += 1) {
        const q = generateMeanMissingValue({ difficulty });
        parses(q);
        const target = Number(q.instruction.match(/is (\d+(?:\.\d)?)\. Find x$/)[1]);
        const x = answerX(q);
        expect(x).toBeGreaterThan(0);

        if (q.questionMath) {
          lists += 1;
          expect(q.visualization).toBeUndefined();
          const items = q.questionMath.split(', ');
          expect(items.filter((s) => s === 'x')).toHaveLength(1);
          const known = items.filter((s) => s !== 'x').map(Number);
          expect(known.every(Number.isInteger)).toBe(true);
          const n = items.length;
          expect((_.sum(known) + x) / n).toBeCloseTo(target, 9);
          if (difficulty === 'foundation') {
            expect(Number.isInteger(target)).toBe(true);
          } else {
            // Core's list half: longer, and the mean genuinely has a decimal.
            expect(difficulty).toBe('core');
            expect([8, 10]).toContain(n);
            expect(Number.isInteger(target)).toBe(false);
          }
        } else {
          expect(difficulty).not.toBe('foundation');
          expect(tableMean(q.visualization, x)).toBeCloseTo(target, 9);
          // The guard: a different frequency must give a different mean,
          // or the question has no unique answer.
          expect(tableMean(q.visualization, x + 1)).not.toBeCloseTo(target, 9);
          expect(q.visualization.header).toBe(difficulty === 'core' ? 'column' : 'row');
        }
        distinct.add(q.instruction + q.questionMath + JSON.stringify(q.visualization));
      }
      if (difficulty === 'core') {
        // Roughly half and half.
        expect(lists).toBeGreaterThan(SAMPLES * 0.4);
        expect(lists).toBeLessThan(SAMPLES * 0.6);
      }
      expect(distinct.size).toBeGreaterThan(SAMPLES * 0.9);
    });
  });
});

describe('data-types', () => {
  const byIntro = Object.fromEntries(CONTEXTS.map((c) => [c.intro, c]));
  const want = (v, difficulty) => (
    difficulty === 'foundation' && v.type !== 'qualitative' ? 'numerical' : v.type
  );

  BANDS.forEach((difficulty) => {
    it(`${difficulty}: every printed variable is labelled by the context's own classification`, () => {
      const distinct = new Set();
      for (let t = 0; t < SAMPLES; t += 1) {
        const q = generateDataTypes({ difficulty });
        parses(q);
        const intro = Object.keys(byIntro).find((i) => q.instruction.startsWith(i));
        expect(intro, q.instruction).toBeDefined();
        const context = byIntro[intro];
        expect(q.instruction).toMatch(difficulty === 'foundation'
          ? /qualitative or numerical$/
          : /qualitative, discrete or continuous$/);

        const { rows } = q.visualization;
        expect(rows[0]).toEqual(['Variable', 'Type']);
        const names = rows.slice(1).map((r) => r[0]);
        rows.slice(1).forEach((r) => expect(r[1]).toBe(''));
        expect(names).toHaveLength(difficulty === 'foundation' ? 4 : 5);
        expect(new Set(names).size).toBe(names.length);

        const vars = names.map((nm) => context.vars.find((v) => v.name === nm));
        vars.forEach((v, i) => expect(v, names[i]).toBeDefined());

        const expected = vars.map((v) => want(v, difficulty));
        // The answer band's counts agree with the table, recounted here.
        const counts = Object.fromEntries(
          [...q.answer.matchAll(/(\d+) (qualitative|numerical|discrete|continuous)/g)]
            .map((m) => [m[2], Number(m[1])]),
        );
        expect(counts).toEqual(_.countBy(expected));
        // The reveal fills exactly the blank Type cells, row for row.
        const { solution } = q.visualization;
        expect(solution).toHaveLength(rows.length);
        expect(solution[0]).toEqual(['', '']);
        expect(solution.slice(1).map((r) => r[1])).toEqual(expected);
        solution.slice(1).forEach((r) => expect(r[0]).toBe(''));

        const traps = vars.filter((v) => v.trap).length;
        if (difficulty === 'stretch') expect(traps).toBeGreaterThanOrEqual(2);
        else expect(traps).toBe(0);
        const kinds = new Set(vars.map((v) => want(v, difficulty)));
        expect(kinds.size).toBe(difficulty === 'foundation' ? 2 : 3);

        distinct.add(q.instruction + names.join('|'));
      }
      // eslint-disable-next-line no-console
      console.log(`data-types ${difficulty}: ${distinct.size} distinct in ${SAMPLES}`);
      expect(distinct.size).toBeGreaterThan(SAMPLES * 0.5);
    });
  });
});
