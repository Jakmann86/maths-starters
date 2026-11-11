// Mutation test for the Profit and interest harness. Each operator breaks
// real generator output; the checker must reject every broken copy.
// MUTANT_REASONS=1 lists why each copy was rejected.
//
// Run: npx vitest run src/generators/number/moneyGenerators.mutation.test.js

import { describe, expect, it } from 'vitest';
import { bandMove, bump, generic, mutants } from '../harness.check';
import { checkMoney } from './moneyGenerators.check';

const IDS = ['profit-loss', 'simple-interest', 'compound-interest'];
const swapWords = (s, a, b) => s.replace(new RegExp(`\\b(${a}|${b})\\b`), (w) => (w === a ? b : a));

const OPS = {
  ...generic('answer nudged', 'a working number nudged', 'the working stops short', 'metadata changed', 'units changed'),
  'moved to another band': bandMove(),
  'a number in the question nudged': (q) => { const s = bump(q.questionText); if (!s) return false; q.questionText = s; },
  'profit and loss swapped': (q) => {
    if (!/\b(profit|loss)\b/.test(q.questionText)) return false;
    q.questionText = swapWords(q.questionText, 'profit', 'loss');
  },
  'up and down swapped': (q) => {
    if (!/marks it (up|down)/.test(q.questionText)) return false;
    q.questionText = q.questionText.replace(/marks it (up|down)/, (w, d) => `marks it ${d === 'up' ? 'down' : 'up'}`);
  },
  // Equivalent, so skipped: for the time a loan takes, it makes no
  // difference whether the money is invested or borrowed.
  'invested and borrowed swapped': (q) => {
    if (!/\b(invested|borrowed)\b/.test(q.questionText) || q.instruction === 'Find how many years it takes') return false;
    q.questionText = swapWords(q.questionText, 'invested', 'borrowed');
  },
  'months read as years': (q) => {
    if (!/\d+ (months|years)\./.test(q.questionText) || q.metadata.topic !== 'simple-interest') return false;
    q.questionText = q.questionText.replace(/(\d+) (months|years)\./, (w, n, u) => `${n} ${u === 'months' ? 'years' : 'months'}.`);
  },
  'the pence dropped': (q) => {
    const m = /^\\text\{£([\d,]+)\.(\d\d)\}$/.exec(q.answer);
    if (!m || m[2] === '00') return false;
    q.answer = `\\text{£${m[1]}}`;
  },
  'the interest given for the total': (q) => {
    if (!/Find the (total|value of the investment at the end)/.test(q.instruction)) return false;
    const m = /I = .* = ([\d.]+)/.exec(q.workingOut);
    const p = Math.round(Number(m[1]) * 100);
    q.answer = `\\text{£${String(Math.floor(p / 100)).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}${p % 100 ? `.${String(p % 100).padStart(2, '0')}` : ''}}`;
  },
  'simple interest for compound': (q) => {
    const m = /^£([\d,]+) is invested for (\d+) years at ([\d.]+)% per year compound interest\.$/.exec(q.questionText);
    if (!m || q.instruction.includes('interest earned')) return false;
    const P = Number(m[1].replace(/,/g, '')), n = Number(m[2]), r = Number(m[3]) / 100;
    const v = Math.round(P * (1 + r * n) * 100);
    q.answer = `\\text{£${String(Math.floor(v / 100)).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}.${String(v % 100).padStart(2, '0')}}`;
  },
  'a percentage given without its word': (q) => {
    if (!/\\% \\text\{ (profit|loss)\}$/.test(q.answer)) return false;
    q.answer = q.answer.replace(/ \\text\{ (profit|loss)\}$/, '');
  },
  'the rate rounded to a whole number': (q) => {
    const m = /^(\d+)\.(\d)\\%$/.exec(q.answer);
    if (!m) return false;
    q.answer = `${Math.round(Number(`${m[1]}.${m[2]}`))}.0\\%`;
  },
};

describe('Profit and interest mutation test', () => {
  it('rejects every broken copy', () => {
    const tally = mutants({ skills: IDS, check: checkMoney, ops: OPS });
    Object.entries(tally).forEach(([name, r]) => expect(r.survivors.slice(0, 2), name).toEqual([]));
    expect(Object.keys(tally).sort()).toEqual(Object.keys(OPS).sort());
  }, 600000);
});
