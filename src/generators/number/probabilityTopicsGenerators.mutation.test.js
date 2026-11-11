// Mutation test for the Probability harness in
// probabilityTopicsGenerators.check.js. Each operator breaks real generator
// output; the checker must reject every broken copy. MUTANT_REASONS=1 lists
// why each copy was rejected; SHOW=1 prints the first survivors of each.
//
// Run: npx vitest run src/generators/number/probabilityTopicsGenerators.mutation.test.js

import _ from 'lodash';
import { describe, expect, it } from 'vitest';
import { bandMove, bump, generic, mutants } from '../harness.check';
import { checkProbability } from './probabilityTopicsGenerators.check';

const IDS = ['relative-frequency', 'two-way-tables', 'expectation', 'sample-spaces', 'independent-events', 'either-or'];

// A table cell holding a number, nudged by one. A conditional two-way
// question reads only its given row or column, so there the cell is taken
// from the line whose total is the answer's denominator; a cell elsewhere
// would be an equivalent copy.
const cellNudge = (q) => {
  const f = q.visualization;
  if (!f?.rows) return false;
  let spots = f.rows.flatMap((r, i) => r.map((c, j) => (i && j && /^\d+$/.test(c) ? [i, j] : null))).filter(Boolean);
  if (q.metadata.topic === 'two-way-tables' && q.metadata.difficulty === 'stretch') {
    // The given line, named in "The student chosen ... .".
    const given = /chosen ([^.]+)\./.exec(q.questionText)[1].toLowerCase();
    const word = (h) => ({ Boys: 'boy', Girls: 'girl', Men: 'man', Women: 'woman', Walk: 'walk', Left: 'left', Right: 'right' }[h] ?? h.toLowerCase());
    const has = (w) => new RegExp(`\\b${w}\\b`).test(given);
    const i = f.rows.findIndex((r, k) => k && has(word(r[0])));
    const j = f.rows[0].findIndex((h, k) => k && has(word(h)) && !(word(h) === 'can swim' && given.includes('cannot')));
    spots = spots.filter(([a, b]) => (i > 0 ? a === i : b === j));
  }
  if (!spots.length) return false;
  const [i, j] = _.sample(spots);
  f.rows[i][j] = String(Number(f.rows[i][j]) + 1);
};

const OPS = {
  ...generic('answer nudged', 'a working number nudged', 'the working stops short', 'metadata changed', 'units changed'),
  'moved to another band': bandMove(),
  'a number in the question nudged': (q) => { const s = q.questionText && bump(q.questionText); if (!s) return false; q.questionText = s; },
  'a given probability nudged': (q) => { const s = q.questionMath && bump(q.questionMath); if (!s) return false; q.questionMath = s; },
  'a table or grid cell nudged': cellNudge,
  'two rows of the table swapped': (q) => {
    const f = q.visualization;
    if (!f?.rows || f.header !== 'both' || f.rows[0][0] === '' || f.rows.length < 3) return false;
    // A sample-space grid: swap two row headings, so the cells no longer match.
    [f.rows[1][0], f.rows[2][0]] = [f.rows[2][0], f.rows[1][0]];
  },
  // The heading the question asks about swapped with its neighbour, so the
  // counts under it change. (A heading the question never reads would be an
  // equivalent copy.)
  'a heading swapped for another': (q) => {
    const f = q.visualization;
    if (q.metadata.topic !== 'two-way-tables') return false;
    const token = (h) => ({ Boys: 'boy', Girls: 'girl', Men: 'man', Women: 'woman', Walk: 'walks', Left: 'left-handed', Right: 'right-handed' }[h] ?? h.toLowerCase());
    const label = q.answer.toLowerCase();
    const head = f.rows[0];
    const j = head.findIndex((h, k) => k && h !== 'Total' && new RegExp(`\\b${token(h)}\\b`).test(label));
    if (j > 0) {
      const k = head[j + 1] && head[j + 1] !== 'Total' ? j + 1 : j - 1;
      if (k < 1) return false;
      // Equivalent if what the question reads under the two headings is the
      // same: the asked row's cells, or else the column totals.
      // A blank cell (a table with totals) counts as what its row total makes it.
      const body = f.rows.slice(1).filter((r) => r[0] !== 'Total').map((r) => {
        if (!r.includes('')) return r;
        const known = r.slice(1, -1).reduce((a, x) => a + Number(x || 0), 0);
        return r.map((x) => (x === '' ? String(Number(r[r.length - 1]) - known) : x));
      });
      const row = body.find((r) => new RegExp(`\\b${token(r[0])}\\b`).test(label));
      const sum = (c) => body.reduce((a, r) => a + Number(r[c] || 0), 0);
      if (row ? row[j] === row[k] : sum(j) === sum(k)) return false;
      [head[j], head[k]] = [head[k], head[j]];
      return undefined;
    }
    const rows = f.rows.filter((r) => r[0] !== '' && r[0] !== 'Total');
    const i = rows.findIndex((r) => new RegExp(`\\b${token(r[0])}\\b`).test(label));
    if (i < 0) return false;
    const other = rows[i + 1] ?? rows[i - 1];
    if (other.slice(1).join() === rows[i].slice(1).join()) return false;
    [rows[i][0], other[0]] = [other[0], rows[i][0]];
    return undefined;
  },
  'the fraction left unsimplified': (q) => {
    const m = / = \\frac\{(\d+)\}\{(\d+)\} = \\frac\{(\d+)\}\{(\d+)\}$/.exec(q.answer);
    if (!m) return false;
    q.answer = q.answer.replace(/ = \\frac\{\d+\}\{\d+\}$/, '');
  },
  'the complement given': (q) => {
    const m = /= (0\.\d+)$/.exec(q.answer);
    if (!m) return false;
    const c = String(Number((1 - Number(m[1])).toFixed(6)));
    if (c === m[1]) return false;
    q.answer = q.answer.replace(/= 0\.\d+$/, `= ${c}`);
  },
  'and for or': (q) => {
    const t = q.questionText ?? '';
    if (!/ or /.test(t) || q.metadata.topic !== 'two-way-tables') return false;
    q.questionText = t.replace(/ or (\w+)/, ' who $1');
  },
  'the given turned round': (q) => {
    const m = /^The (student|adult) chosen (.+)\. Find the probability that this \1 (.+)\.$/.exec(q.questionText ?? '');
    if (!m) return false;
    const flip = (s) => (/^is /.test(s) ? s : s);
    q.questionText = `The ${m[1]} chosen ${flip(m[3])}. Find the probability that this ${m[1]} ${m[2]}.`;
  },
  'the reveal disagrees with the grid': (q) => {
    const sol = q.visualization?.solution;
    if (!sol) return false;
    const spots = sol.flatMap((r, i) => r.map((c, j) => (/^\d+$/.test(c) ? [i, j] : null))).filter(Boolean);
    const [i, j] = _.sample(spots);
    sol[i][j] = String(Number(sol[i][j]) + 1);
  },
  'the event changed': (q) => {
    const t = q.questionText ?? '';
    const m = /(total|product|difference) (of|greater than|less than) (\d+)/.exec(t);
    if (!m) return false;
    q.questionText = t.replace(m[0], `${m[1]} ${m[2]} ${Number(m[3]) + 1}`);
  },
};

describe('Probability (experiments, tables, sample spaces) mutation test', () => {
  it('rejects every broken copy', () => {
    const tally = mutants({ skills: IDS, check: checkProbability, ops: OPS });
    if (process.env.SHOW) Object.entries(tally).forEach(([name, r]) => r.survivors.slice(0, 3).forEach((x) => console.log('SURV', name, JSON.stringify({ i: x.q.instruction, t: x.q.questionText, m: x.q.questionMath, a: x.q.answer, w: x.q.workingOut, rows: x.q.visualization?.rows }))));
    Object.entries(tally).forEach(([name, r]) => expect(r.survivors.slice(0, 2), name).toEqual([]));
    expect(Object.keys(tally).sort()).toEqual(Object.keys(OPS).sort());
  }, 600000);
});
