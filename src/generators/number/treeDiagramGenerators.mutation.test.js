// Mutation test for the tree-diagram harness: break real generator output in
// specific ways and require checkTree to reject every broken copy. A checker
// that passes everything proves nothing until it has been seen to fail.
//
// A mutation that leaves the object unchanged is skipped. So is one that
// turns a question into a different but still correct one (an "equivalent
// mutant") — those are filtered by an explicit rule per operator, written
// next to it, never by asking the checker.
//
// Run: npx vitest run src/generators/number/treeDiagramGenerators.mutation.test.js

import { describe, expect, it } from 'vitest';
import _ from 'lodash';
import { generateTreeDiagrams } from './treeDiagramGenerators';
import { checkTree } from './treeDiagramGenerators.check';

const PER_BAND = 400;
const BANDS = ['foundation', 'core', 'stretch'];
const gcd = (a, b) => (b ? gcd(b, a % b) : a);

// Every label, whichever field holds it.
// Asks that come in pairs, with the paths each covers. Written as whole
// clauses (after "Find the probability that "), with the penalty taker's
// name filled in from the set-up, so a swap reads as a real question.
const ASK_PAIRS = (who) => [
  ['the two counters are different colours', ['XY', 'YX'], 'the two counters are the same colour', ['XX', 'YY']],
  ['it rains on exactly one of the two days', ['XY', 'YX'], 'the weather is the same on both days', ['XX', 'YY']],
  ['it rains on both days', ['XX'], 'it is dry on both days', ['YY']],
  [`${who} scores exactly one of the penalties`, ['XY', 'YX'], 'both penalties have the same result', ['XX', 'YY']],
  [`${who} scores both penalties`, ['XX'], `${who} misses both penalties`, ['YY']],
  ['the bus is late on exactly one of the two days', ['XY', 'YX'], 'the bus is late on both days or on time on both days', ['XX', 'YY']],
  ['the team wins exactly one of the two matches', ['XY', 'YX'], 'the team wins both matches or loses both', ['XX', 'YY']],
  ['exactly one of the two lights is red', ['XY', 'YX'], 'both lights show the same colour', ['XX', 'YY']],
  ['both lights are red', ['XX'], 'both lights are green', ['YY']],
];

const labelsOf = (q) => ({ ...q.visualization.probs, ...(q.visualization.solution ?? {}) });
const setLabel = (q, k, v) => {
  if (q.visualization.solution && k in q.visualization.solution) q.visualization.solution[k] = v;
  else q.visualization.probs[k] = v;
};
const bumpLabel = (s) => {
  const f = /^(\d+)\/(\d+)$/.exec(s);
  if (f) return `${Number(f[1]) + 1}/${f[2]}`;
  const d = /^0\.(\d)$/.exec(s);
  return d && d[1] !== '9' ? `0.${Number(d[1]) + 1}` : null;
};

// Each operator mutates a deep copy in place, or returns false to skip.
const OPERATORS = {
  'answer value nudged': (q) => {
    const f = /^\\frac\{(\d+)\}\{(\d+)\}$/.exec(q.answer);
    if (f) { q.answer = `\\frac{${Number(f[1]) + 1}}{${f[2]}}`; return true; }
    const d = /^0\.(\d+)$/.exec(q.answer);
    if (!d) return false;
    const h = Math.round(Number(`0.${d[1]}`) * 100) + 1;
    q.answer = (h / 100).toFixed(2).replace(/0$/, '');
    return true;
  },
  'answer denominator nudged': (q) => {
    const f = /^\\frac\{(\d+)\}\{(\d+)\}$/.exec(q.answer);
    if (!f) return false;
    q.answer = `\\frac{${f[1]}}{${Number(f[2]) + 1}}`;
    return true;
  },
  // Same value, but breaks the stated convention of not simplifying.
  'answer simplified': (q) => {
    const f = /^\\frac\{(\d+)\}\{(\d+)\}$/.exec(q.answer);
    if (!f) return false;
    const g = gcd(Number(f[1]), Number(f[2]));
    if (g === 1) return false; // nothing to simplify: unchanged
    q.answer = `\\frac{${f[1] / g}}{${f[2] / g}}`;
    return true;
  },
  'one branch label nudged': (q) => {
    const k = _.sample(Object.keys(labelsOf(q)).filter((key) => labelsOf(q)[key] !== ''));
    const v = bumpLabel(labelsOf(q)[k]);
    if (!v) return false;
    setLabel(q, k, v);
    return true;
  },
  // Still sums to 1, so only the set-up or the answer can catch it. Every
  // ask uses the first stage, so the answer always moves.
  'first-stage pair shifted': (q) => {
    const { x, y } = q.visualization.probs;
    const f = /^(\d+)\/(\d+)$/.exec(x), g = /^(\d+)\/(\d+)$/.exec(y);
    if (f) {
      if (Number(g[1]) < 2) return false;
      q.visualization.probs.x = `${Number(f[1]) + 1}/${f[2]}`;
      q.visualization.probs.y = `${Number(g[1]) - 1}/${g[2]}`;
      return true;
    }
    const a = Number(x.slice(2));
    if (a >= 9) return false;
    q.visualization.probs.x = `0.${a + 1}`;
    q.visualization.probs.y = `0.${9 - a}`;
    return true;
  },
  'with and without replacement swapped': (q) => {
    if (!/replacement\.$/.test(q.instruction)) return false;
    q.instruction = q.instruction.includes('without replacement')
      ? q.instruction.replace('without replacement', 'with replacement')
      : q.instruction.replace('with replacement', 'without replacement');
    return true;
  },
  // Counts always differ (a !== b), so the swap always changes the bag.
  'bag counts swapped in the prose': (q) => {
    const m = /holds (\d+) (.+) and (\d+) /.exec(q.instruction);
    if (!m) return false;
    q.instruction = q.instruction.replace(`holds ${m[1]} ${m[2]} and ${m[3]} `, `holds ${m[3]} ${m[2]} and ${m[1]} `);
    return true;
  },
  'letters on the tree reversed': (q) => {
    q.visualization.outcomes = [...q.visualization.outcomes].reverse();
    return true;
  },
  // The ask swapped for its partner, covering different paths. Equivalent
  // when the two happen to have the same probability (P(XX) = P(YY) when
  // p + q = 1 on an independent tree, P(one) = P(same) at one half): that is
  // decided here, from the labels, by plain arithmetic — not by the checker.
  'ask swapped': (q) => {
    const who = /whether (\S+) scores/.exec(q.instruction)?.[1] ?? '';
    const clause = /^Find the probability that (.+)\.$/.exec(q.questionText)[1];
    // Bag asks name the items; put the right plural into the bag pair.
    const plural = / ([a-z]+) are (different|the same) colou?rs?$/.exec(clause)?.[1];
    const pairs = ASK_PAIRS(who).map((pr) => (plural ? pr.map((x) => (typeof x === 'string' ? x.replace('counters', plural) : x)) : pr));
    const swap = pairs.map(([a, pa, b, pb]) => (
      clause === a ? [a, b, pa, pb] : clause === b ? [b, a, pb, pa] : null
    )).find(Boolean);
    if (!swap) return false;
    const [, to, before, after] = swap;
    const L = labelsOf(q);
    const v = (s) => (s.includes('/') ? s.split('/')[0] / s.split('/')[1] : Number(s));
    const P = { XX: v(L.x) * v(L.xx), XY: v(L.x) * v(L.xy), YX: v(L.y) * v(L.yx), YY: v(L.y) * v(L.yy) };
    const sum = (paths) => paths.reduce((acc, k) => acc + P[k], 0);
    if (Math.abs(sum(before) - sum(after)) < 1e-12) return false;
    q.questionText = `Find the probability that ${to}.`;
    return true;
  },
  'a number in the working nudged': (q) => {
    const lines = q.workingOut.split('\n');
    const i = _.random(0, lines.length - 1);
    const m = /\\frac\{(\d+)\}/.exec(lines[i]) || /0\.(\d)(?!\d)/.exec(lines[i]);
    if (!m) return false;
    lines[i] = lines[i].slice(0, m.index) + m[0].replace(m[1], String(Number(m[1]) + 1)) + lines[i].slice(m.index + m[0].length);
    q.workingOut = lines.join('\n');
    return true;
  },
  'second stage shown at stretch': (q) => {
    if (!q.visualization.solution) return false;
    Object.assign(q.visualization.probs, q.visualization.solution);
    delete q.visualization.solution;
    return true;
  },
  'second stage hidden below stretch': (q) => {
    if (q.visualization.solution) return false;
    const p = q.visualization.probs;
    q.visualization.solution = _.pick(p, ['xx', 'xy', 'yx', 'yy']);
    Object.assign(p, { xx: '', xy: '', yx: '', yy: '' });
    return true;
  },
  'working written with U+2212': (q) => {
    if (!q.workingOut.includes(' - ')) return false;
    q.workingOut = q.workingOut.replace(' - ', ' − ');
    return true;
  },
};

describe('tree-diagram harness, mutation test', () => {
  it('rejects every mutated question', () => {
    const tally = {};
    const survivors = [];
    BANDS.forEach((difficulty) => {
      for (let t = 0; t < PER_BAND; t += 1) {
        const original = generateTreeDiagrams({ difficulty });
        checkTree(original, difficulty); // the unmutated question passes
        Object.entries(OPERATORS).forEach(([name, op]) => {
          const q = _.cloneDeep(original);
          if (!op(q) || _.isEqual(q, original)) return;
          tally[name] ??= { tried: 0, killed: 0 };
          tally[name].tried += 1;
          try {
            checkTree(q, difficulty);
            survivors.push({ name, difficulty, q });
          } catch {
            tally[name].killed += 1;
          }
        });
      }
    });
    Object.entries(tally).forEach(([name, { tried, killed }]) => {
      process.stdout.write(`${name.padEnd(38)} ${killed}/${tried} killed\n`);
    });
    survivors.slice(0, 3).forEach((s) => process.stdout.write(`SURVIVOR ${s.name} (${s.difficulty}): ${JSON.stringify(s.q)}\n`));
    expect(Object.keys(tally)).toHaveLength(Object.keys(OPERATORS).length);
    expect(survivors).toHaveLength(0);
  });
});
