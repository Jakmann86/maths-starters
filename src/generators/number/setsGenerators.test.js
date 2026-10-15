// Substitute-the-answer-back checks for the three Venn skills. Counts are
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
import { generateVennCounts, generateVennSetOperations, generateVennPlaceElements, COUNT_CONTEXTS } from './setsGenerators';

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

const KEYS3 = ['aOnly', 'bOnly', 'cOnly', 'ab', 'ac', 'bc', 'abc', 'outside'];
// The regions' membership, written out here rather than imported.
const IN3 = { aOnly: 'a', bOnly: 'b', cOnly: 'c', ab: 'ab', ac: 'ac', bc: 'bc', abc: 'abc', outside: '' };
// Elements per line and lines, as the three-set figure's anchors allow.
const LAYOUT3 = { aOnly: [2, 2], bOnly: [2, 2], cOnly: [2, 2], ab: [2, 1], abc: [2, 1], ac: [1, 2], bc: [1, 2], outside: [2, 3] };

const readLines = (lines, [per, max]) => {
  expect(Array.isArray(lines)).toBe(true);
  expect(lines.length).toBeLessThanOrEqual(max);
  return lines.flatMap((l) => {
    const xs = l.split(', ').map(Number);
    expect(xs.length).toBeLessThanOrEqual(per);
    return xs;
  });
};

// Rebuild each set from a three-set figure's regions.
const setsOfThree = (fig, els) => {
  const { a, b, c } = fig.labels;
  const of = (s) => _.sortBy(KEYS3.filter((k) => IN3[k].includes(s)).flatMap((k) => els[k]));
  return { [a]: of('a'), [b]: of('b'), [c]: of('c') };
};

describe('venn-set-operations', () => {
  BANDS.forEach((difficulty) => {
    it(`${difficulty}: the listed set is the expression evaluated on the figure`, () => {
      const answers = new Set();
      const figures = { 'venn-two-set': 0, 'venn-three-set': 0 };
      for (let t = 0; t < SAMPLES; t += 1) {
        const q = generateVennSetOperations({ difficulty });
        const fig = q.visualization;
        figures[fig.type] += 1;
        expect(fig.unknown).toBeNull();

        let els, sets, universe;
        if (fig.type === 'venn-three-set') {
          expect(difficulty).toBe('stretch');
          expect(fig.universe).toBe('U');
          els = _.mapValues(LAYOUT3, (layout, k) => readLines(fig.regions[k], layout));
          sets = setsOfThree(fig, els);
        } else {
          checkFigure(fig);
          els = _.mapValues(fig.regions, (lines) => readLines(lines, [2, Infinity]));
          const { a, b } = fig.labels;
          sets = { [a]: _.union(els.aOnly, els.both), [b]: _.union(els.bOnly, els.both) };
        }
        universe = _.sortBy(Object.values(els).flat());
        // 1..n, each element in exactly one region, every region occupied.
        expect(universe).toEqual(_.range(1, universe.length + 1));
        Object.values(els).forEach((xs) => expect(xs.length).toBeGreaterThan(0));

        const want = evaluate(q.questionMath, sets, universe);
        const got = q.answer.match(/^\\\{(.*)\\\}$/)[1].split(', ').map(Number);
        expect(got).toEqual(want);
        expect(got.length).toBeGreaterThan(0);
        expect(got.length).toBeLessThanOrEqual(8);

        const ops = (q.questionMath.match(/\\cap|\\cup/g) || []).length;
        const comp = q.questionMath.includes("'");
        if (difficulty === 'foundation') expect([ops, comp]).toEqual([0, false]);
        if (difficulty === 'core') expect([ops, comp]).toEqual([1, false]);
        if (difficulty === 'stretch' && fig.type === 'venn-two-set') { expect(ops).toBe(1); expect(comp).toBe(true); }
        if (fig.type === 'venn-three-set') {
          // A bracket and a second operation, over all three sets.
          expect(ops).toBeGreaterThanOrEqual(2);
          expect(q.questionMath).toContain('(');
          Object.keys(sets).forEach((l) => expect(q.questionMath).toContain(l));
          // Letters inside a two-letter bracket read in order.
          (q.questionMath.match(/\(([A-Z]) \\c[au]p ([A-Z])\)/g) || []).forEach((m) => expect(m[1] < m[m.length - 2], m).toBe(true));
        }
        expect(q.workingOut.split('\n').pop()).toBe(`= ${q.answer}`);
        answers.add(q.questionMath.replace(/[A-Z]/g, 'L') + q.answer);
      }
      process.stdout.write(`venn-set-operations ${difficulty}: ${answers.size} distinct, figures ${JSON.stringify(figures)}\n`);
      expect(answers.size).toBeGreaterThan(50);
      if (difficulty === 'stretch') {
        // Roughly half and half; neither branch silently unreachable.
        expect(figures['venn-three-set'] / SAMPLES).toBeGreaterThan(0.45);
        expect(figures['venn-three-set'] / SAMPLES).toBeLessThan(0.55);
      } else expect(figures['venn-three-set']).toBe(0);
    });
  });
});

/* Descriptions the placing skill can print, defined again here from their
   words so the check does not borrow the generator's tests. */
function described(text, n) {
  const u = _.range(1, n + 1);
  let m;
  if (text === 'even numbers') return u.filter((k) => k % 2 === 0);
  if (text === 'odd numbers') return u.filter((k) => k % 2 === 1);
  if (text === 'prime numbers') return u.filter((k) => [2, 3, 5, 7, 11, 13, 17, 19].includes(k));
  if (text === 'square numbers') return u.filter((k) => [1, 4, 9, 16].includes(k));
  if ((m = text.match(/^multiples of (\d+)$/))) return u.filter((k) => k % Number(m[1]) === 0);
  if ((m = text.match(/^factors of (\d+)$/))) return u.filter((k) => Number(m[1]) % k === 0);
  throw new Error(`unknown description: ${text}`);
}

describe('venn-place-elements', () => {
  BANDS.forEach((difficulty) => {
    it(`${difficulty}: the revealed diagram sorts U by the sets in the question`, () => {
      const questions = new Set();
      for (let t = 0; t < SAMPLES; t += 1) {
        const q = generateVennPlaceElements({ difficulty });
        const fig = q.visualization;
        expect(q.instruction).toBe('Place each element of U in the Venn diagram');
        // Nothing in the regions until the reveal.
        expect(fig.regions).toEqual({});

        const [uLine, ...setLines] = q.questionMath.split('\n');
        const n = Number(uLine.match(/^U = \\\{1, 2, 3, \\ldots, (\d+)\\\}$/)[1]);
        const sets = {};
        let worded = 0;
        setLines.forEach((line) => {
          let m;
          if ((m = line.match(/^([A-Z]) = \\\{(.*)\\\}$/))) sets[m[1]] = m[2].split(', ').map(Number);
          else if ((m = line.match(/^([A-Z]) = \\text\{(.*)\}$/))) { sets[m[1]] = described(m[2], n); worded += 1; }
          else throw new Error(line);
        });
        const letters = Object.keys(sets);
        expect(letters).toEqual(Object.values(fig.labels));
        expect(fig.universe).toBe('U');

        let els;
        if (difficulty === 'stretch') {
          expect(fig.type).toBe('venn-three-set');
          expect(worded).toBe(3);
          els = _.mapValues(LAYOUT3, (layout, k) => readLines(fig.solution[k], layout));
          const rebuilt = setsOfThree(fig, els);
          letters.forEach((l) => expect(rebuilt[l], l).toEqual(sets[l]));
          expect(els.abc.length).toBeGreaterThan(0);
          expect(KEYS3.filter((k) => !els[k].length).length).toBeLessThanOrEqual(2);
          const centre = sets[letters[0]].filter((k) => sets[letters[1]].includes(k) && sets[letters[2]].includes(k));
          expect(q.answer).toBe(`${letters.join(' \\cap ')} = \\{${centre.join(', ')}\\}`);
        } else {
          checkFigure({ ...fig, regions: fig.solution });
          expect(worded).toBe(difficulty === 'core' ? 2 : 0);
          // The two-set figure's capacities, as set operations caps them.
          const CAP = { aOnly: 4, both: 3, bOnly: 4, outside: 4 };
          els = _.mapValues(fig.solution, (lines, k) => {
            const xs = readLines(lines, [2, Infinity]);
            expect(xs.length).toBeLessThanOrEqual(CAP[k]);
            return xs;
          });
          const [a, b] = letters;
          expect(_.sortBy([...els.aOnly, ...els.both])).toEqual(sets[a]);
          expect(_.sortBy([...els.bOnly, ...els.both])).toEqual(sets[b]);
          const both = sets[a].filter((k) => sets[b].includes(k));
          expect(q.answer).toBe(`${a} \\cap ${b} = \\{${both.join(', ')}\\}`);
        }
        // Every element of U lands in exactly one region.
        expect(_.sortBy(Object.values(els).flat())).toEqual(_.range(1, n + 1));
        expect(q.workingOut.split('\n').pop()).toBe(q.answer);
        // What makes a question distinct is the sets, not the letters.
        questions.add(q.questionMath.replace(/^[A-Z] = /gm, ''));
      }
      process.stdout.write(`venn-place-elements ${difficulty}: ${questions.size} distinct questions\n`);
      expect(questions.size).toBeGreaterThan(difficulty === 'foundation' ? SAMPLES * 0.8 : 40);
    });
  });
});
