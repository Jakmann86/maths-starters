// Substitute-the-answer-back checks for the two Venn skills. Counts are
// rebuilt from the numbers drawn in the regions and the total read out of the
// prose; set operations by parsing questionMath and evaluating it against the
// element lists drawn in the regions. Never from the generator's variables.
//
// Where the labels physically sit is checked in a browser, not here — see the
// commit that added this file.
//
// Run: npx vitest run src/generators/number/setsGenerators.test.js

import { describe, expect, it } from 'vitest';
import _ from 'lodash';
import { generateVennCounts, generateVennSetOperations, COUNT_CONTEXTS } from './setsGenerators';

const SAMPLES = 5000;
const BANDS = ['foundation', 'core', 'stretch'];
const KEYS = ['aOnly', 'both', 'bOnly', 'outside'];
const MINUS = '−';

const checkFigure = (fig) => {
  expect(fig.type).toBe('venn-two-set');
  expect(fig.universe).toBe('U');
  KEYS.forEach((k) => expect(fig.regions[k], k).toBeTruthy());
  // Circle labels wider than this overrun the rectangle.
  [fig.labels.a, fig.labels.b].forEach((l) => expect(l.length).toBeLessThanOrEqual(7));
};

describe('venn-counts', () => {
  const contextOf = (fig) => COUNT_CONTEXTS.find((c) => c.a.label === fig.labels.a && c.b.label === fig.labels.b);

  BANDS.forEach((difficulty) => {
    it(`${difficulty}: the answer follows from the figure and the prose`, () => {
      const answers = new Set();
      const questions = new Set();
      for (let t = 0; t < SAMPLES; t += 1) {
        const q = generateVennCounts({ difficulty });
        const fig = q.visualization;
        checkFigure(fig);
        const c = contextOf(fig);
        expect(c, JSON.stringify(fig.labels)).toBeDefined();
        expect(q.answerUnits).toBe(`\\text{${c.unit}}`);
        expect(q.answer).toMatch(/^\d+$/);
        const ans = Number(q.answer);
        expect(ans).toBeGreaterThan(0);
        expect(q.workingOut).not.toContain(MINUS);
        const r = fig.regions;

        if (difficulty === 'foundation') {
          const n = _.mapValues(r, Number);
          KEYS.forEach((k) => expect(Number.isInteger(n[k]), r[k]).toBe(true));
          expect(fig.unknown).toBeNull();
          const s = q.instruction;
          let want;
          if (s.endsWith('altogether?')) want = n.aOnly + n.both + n.bOnly + n.outside;
          else if (s.endsWith('or both?')) want = n.aOnly + n.both + n.bOnly;
          else if (s.endsWith(`${c.a.phrase}?`)) want = n.aOnly + n.both;
          else if (s.endsWith(`${c.b.phrase}?`)) want = n.bOnly + n.both;
          expect(want, s).toBeDefined();
          expect(ans).toBe(want);
          // Never a bare read of one printed label.
          expect(KEYS.map((k) => n[k])).not.toContain(ans);
        }

        if (difficulty === 'core') {
          const hidden = KEYS.filter((k) => r[k] === '?');
          expect(hidden).toHaveLength(1);
          expect(fig.unknown).toBe(hidden[0]);
          const total = Number(q.instruction.match(/^There are (\d+) /)[1]);
          const shown = KEYS.filter((k) => k !== hidden[0]).map((k) => Number(r[k]));
          expect(ans).toBe(total - _.sum(shown));
          // The question names the region that is withheld.
          const ask = {
            aOnly: `${c.a.phrase} but not ${c.b.phrase}?`,
            both: `both ${c.a.phrase} and ${c.b.phrase}?`,
            bOnly: `${c.b.phrase} but not ${c.a.phrase}?`,
            outside: `neither ${c.a.phrase} nor ${c.b.phrase}?`,
          }[hidden[0]];
          expect(q.instruction.endsWith(ask), q.instruction).toBe(true);
        }

        if (difficulty === 'stretch') {
          const m = q.instruction.match(/^In a group of (\d+) \w+, (\d+) .+ and (\d+) .+\. (\d+) \w+ neither\. How many \w+ both\?$/);
          expect(m, q.instruction).not.toBeNull();
          const [total, a, b, neither] = m.slice(1).map(Number);
          // The figure's algebra uses U+2212, never a hyphen (figure text
          // never reaches the renderer).
          expect(r.aOnly).toBe(`${a} ${MINUS} x`);
          expect(r.bOnly).toBe(`${b} ${MINUS} x`);
          expect(r.both).toBe('x');
          expect(Number(r.outside)).toBe(neither);
          expect(fig.unknown).toBe('both');
          // (a - x) + x + (b - x) + neither = total
          expect(a - ans + ans + b - ans + neither).toBe(total);
          expect(a - ans).toBeGreaterThanOrEqual(2);
          expect(b - ans).toBeGreaterThanOrEqual(2);
          // The working goes through the parser, so it carries the hyphen.
          expect(q.workingOut).toContain(`(${a} - x)`);
        }
        answers.add(ans);
        questions.add(q.instruction + JSON.stringify(fig.regions));
      }
      process.stdout.write(`venn-counts ${difficulty}: ${answers.size} distinct answers, ${questions.size} distinct questions\n`);
      expect(questions.size).toBeGreaterThan(SAMPLES * 0.8);
    });
  });
});

/* A small evaluator for the expressions questionMath can hold: letters,
   ' (complement), \cap, \cup and brackets. */
function evaluate(tex, sets, universe) {
  const tokens = tex.replace(/\\cap/g, ' ∩ ').replace(/\\cup/g, ' ∪ ')
    .replace(/([()'])/g, ' $1 ').trim().split(/\s+/);
  let i = 0;
  const primary = () => {
    let v;
    const tok = tokens[i++];
    if (tok === '(') { v = binary(); expect(tokens[i++]).toBe(')'); }
    else { expect(sets[tok], tok).toBeDefined(); v = sets[tok]; }
    while (tokens[i] === "'") { i += 1; v = universe.filter((e) => !v.includes(e)); }
    return v;
  };
  const binary = () => {
    let v = primary();
    while (tokens[i] === '∩' || tokens[i] === '∪') {
      const op = tokens[i++];
      const w = primary();
      v = op === '∩' ? v.filter((e) => w.includes(e)) : _.union(v, w);
    }
    return v;
  };
  const out = binary();
  expect(i).toBe(tokens.length);
  return _.sortBy(out);
}

describe('venn-set-operations', () => {
  BANDS.forEach((difficulty) => {
    it(`${difficulty}: the listed set is the expression evaluated on the figure`, () => {
      const answers = new Set();
      for (let t = 0; t < SAMPLES; t += 1) {
        const q = generateVennSetOperations({ difficulty });
        const fig = q.visualization;
        checkFigure(fig);
        expect(fig.unknown).toBeNull();
        const els = _.mapValues(fig.regions, (lines) => {
          expect(Array.isArray(lines)).toBe(true);
          lines.forEach((l) => expect(l.split(', ').length).toBeLessThanOrEqual(2));
          return lines.flatMap((l) => l.split(', ')).map(Number);
        });
        const universe = _.sortBy(KEYS.flatMap((k) => els[k]));
        // 1..n, each element in exactly one region, every region occupied.
        expect(universe).toEqual(_.range(1, universe.length + 1));
        KEYS.forEach((k) => expect(els[k].length).toBeGreaterThan(0));
        const { a, b } = fig.labels;
        const sets = { [a]: _.union(els.aOnly, els.both), [b]: _.union(els.bOnly, els.both) };

        const want = evaluate(q.questionMath, sets, universe);
        const got = q.answer.match(/^\\\{(.*)\\\}$/)[1].split(', ').map(Number);
        expect(got).toEqual(want);
        expect(got.length).toBeGreaterThan(0);
        expect(got.length).toBeLessThanOrEqual(8);

        const ops = (q.questionMath.match(/\\cap|\\cup/g) || []).length;
        const comp = q.questionMath.includes("'");
        if (difficulty === 'foundation') expect([ops, comp]).toEqual([0, false]);
        if (difficulty === 'core') expect([ops, comp]).toEqual([1, false]);
        if (difficulty === 'stretch') { expect(ops).toBe(1); expect(comp).toBe(true); }
        expect(q.workingOut.split('\n').pop()).toBe(`= ${q.answer}`);
        answers.add(q.questionMath.replace(/[A-Z]/g, 'L') + q.answer);
      }
      process.stdout.write(`venn-set-operations ${difficulty}: ${answers.size} distinct\n`);
      expect(answers.size).toBeGreaterThan(50);
    });
  });
});
