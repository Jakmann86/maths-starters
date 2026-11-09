// The checker for the difference-method and cubic-sequence skills (Haese
// 26D), shared by the harness (cubicSequenceGenerators.test.js) and its
// mutation test. Test support only. Nothing is imported from the generator.
//
// The terms are read off the question and differenced here; a printed rule
// is expanded and must reproduce every term shown; a value of u_k is
// recomputed from the printed rule.

import { compiles, exactOf, asRational } from '../number/latexArithmetic.check';
import { expand } from './polynomial.check';

const fail = (msg, q) => { throw new Error(`${msg}\n${JSON.stringify(q)}`); };
const must = (cond, msg, q) => { if (!cond) fail(msg, q); };
const diffs = (t) => t.slice(1).map((v, i) => v - t[i]);
const constant = (t) => t.length > 0 && t.every((v) => v === t[0]);
const KIND = { 1: 'linear', 2: 'quadratic', 3: 'cubic' };

// "4, 11, 30, ..." -> [4, 11, 30]
function terms(q) {
  const m = /^(-?\d+(?:, -?\d+)+), \.\.\.$/.exec(q.questionMath ?? '');
  must(m, `a list of terms: ${q.questionMath}`, q);
  const t = m[1].split(', ').map(Number);
  must(t.length === 6, 'six terms shown', q);
  return t;
}

// The difference table, and the level at which it first goes constant.
function table(t, q) {
  const rows = [diffs(t)];
  while (!constant(rows[rows.length - 1])) {
    must(rows.length < 3, 'constant by the third differences', q);
    rows.push(diffs(rows[rows.length - 1]));
  }
  return { rows, level: rows.length };
}
const tableLines = (rows) => rows.map((r, i) => `\\Delta_${i + 1}: ${r.join(', ')}`);

// u_n = a n^3 + b n^2 + c n + d, read from a printed rule.
function coefficients(rule, q) {
  const p = expand(rule);
  [...p.keys()].forEach((k) => must(/^(n\d)?$/.test(k), `a rule in n alone: ${rule}`, q));
  return { a: p.get('n3') ?? 0, b: p.get('n2') ?? 0, c: p.get('n1') ?? 0, d: p.get('') ?? 0 };
}
const value = ({ a, b, c, d }, n) => a * n ** 3 + b * n ** 2 + c * n + d;

// The rule printed the way a student writes it: n^3 - 5n - 2, no 1n or + -.
function tidy(rule, q) {
  must(!/(^|[^\d])1n/.test(rule) && !/\+ -|- -|\b0n/.test(rule) && !/\s0$/.test(rule), `a tidy rule: ${rule}`, q);
}

function common(q, topic, band) {
  must(q.metadata?.topic === topic && q.metadata?.difficulty === band, 'metadata', q);
  must(q.visualization === undefined && q.answerUnits === undefined, 'no figure, no units', q);
  must(typeof q.workingOut === 'string' && !q.workingOut.includes('\\n'), 'working uses real newlines', q);
  [q.questionMath, q.answer, q.workingOut].forEach((s) => compiles(s));
}

/* ------------------------------------------------- naming the sequence */

function differenceMethod(q, band) {
  common(q, 'sequences-difference-method', band);
  const t = terms(q);
  const { rows, level } = table(t, q);
  const kind = KIND[level];
  must(band !== 'foundation' || level < 3, 'Foundation is linear or quadratic', q);
  const lines = q.workingOut.split('\n');
  const said = `\\text{the } \\Delta_${level} \\text{ values are constant, so the sequence is ${kind}}`;
  if (band === 'stretch') {
    must(q.instruction === 'Use the difference method to name the type of sequence and find its leading coefficient', 'instruction', q);
    const divisor = { 1: 1, 2: 2, 3: 6 }[level];
    const k = rows[level - 1][0];
    must(k % divisor === 0, 'a whole-number leading coefficient', q);
    const lead = k / divisor;
    must(q.answer === `\\text{${kind}}, a = ${lead}`, `answer ${q.answer}, expected ${kind}, a = ${lead}`, q);
    must(q.workingOut === [...tableLines(rows), said, `${divisor === 1 ? '' : `${divisor}a = ${k}, `}a = ${lead}`].join('\n'), 'working: the table, the reason, the coefficient', q);
  } else {
    must(q.instruction === 'Use the difference method to name the type of sequence', 'instruction', q);
    must(q.answer === `\\text{${kind}}`, `answer ${q.answer}, expected ${kind}`, q);
    must(q.workingOut === [...tableLines(rows), said].join('\n'), 'working: the table, the reason', q);
  }
  must(lines.length >= level + 1, 'the working shows the table', q);
  return { kind };
}

/* ------------------------------------------------- finding the nth term */

function cubicNthTerm(q, band) {
  common(q, 'sequences-cubic-nth-term', band);
  must(q.instruction === 'Use the difference method to find a formula for the nth term of the sequence', 'instruction', q);
  const t = terms(q);
  const { rows, level } = table(t, q);
  must(level === 3, 'a cubic sequence', q);
  const m = /^u_n = (.+)$/.exec(q.answer);
  must(m, `answer u_n = ...: ${q.answer}`, q);
  tidy(m[1], q);
  const C = coefficients(m[1], q);
  t.forEach((u, i) => must(value(C, i + 1) === u, `the rule gives u_${i + 1} = ${value(C, i + 1)}, the question shows ${u}`, q));

  // Foundation: an^3 + d. Core: an^3 + cn + d. Stretch: every term, with b.
  if (band === 'foundation') must(C.b === 0 && C.c === 0 && C.d !== 0, 'Foundation is an^3 + d', q);
  if (band === 'core') must(C.b === 0 && C.c !== 0, 'Core is an^3 + cn + d', q);
  if (band === 'stretch') must(C.b !== 0, 'Stretch has an n^2 term', q);

  // The working: the table, then each coefficient from its relation, in turn.
  const lines = q.workingOut.split('\n');
  must(lines.slice(0, 3).join('\n') === tableLines(rows).join('\n'), 'working opens with the difference table', q);
  must(lines[lines.length - 1] === q.answer, 'working ends on the rule', q);
  const rel = {
    a: [`6a = ${rows[2][0]}`, C.a],
    b: [`12a + 2b = ${rows[1][0]}`, C.b],
    c: [`7a + 3b + c = ${rows[0][0]}`, C.c],
    d: [`a + b + c + d = ${t[0]}`, C.d],
  };
  const steps = lines.slice(3, -1);
  const want = ['a', ...(C.b !== 0 || band === 'stretch' ? ['b'] : []), ...(C.c !== 0 || band !== 'foundation' ? ['c'] : []), 'd'];
  must(steps.length === want.length, `one line per coefficient found (${want.join(', ')})`, q);
  steps.forEach((s, i) => {
    const [lhs, v] = rel[want[i]];
    must(s === `${lhs} \\text{ so } ${want[i]} = ${v}`, `working line "${s}"`, q);
  });
  return { kind: band };
}

/* ------------------------------------------------- using the nth term */

function cubicUseNthTerm(q, band) {
  common(q, 'sequences-cubic-use-nth-term', band);
  must(q.instruction === 'Find the value of this term', 'instruction', q);
  const m = /^u_n = (.+)\nu_\{(\d+)\}$/.exec(q.questionMath ?? '');
  must(m, `a rule and a term: ${q.questionMath}`, q);
  tidy(m[1], q);
  const C = coefficients(m[1], q);
  const k = Number(m[2]);
  const v = value(C, k);
  must(q.answer === `u_{${k}} = ${v}`, `answer ${q.answer}, expected u_{${k}} = ${v}`, q);
  const lines = q.workingOut.split('\n');
  must(lines.length === 2 && lines[1] === `= ${v}`, 'working: the substitution, then the value', q);
  const sub = new RegExp(`^u_\\{${k}\\} = (.+)$`).exec(lines[0]);
  must(sub && !/n/.test(sub[1]), `the substitution line "${lines[0]}" has numbers only`, q);
  const got = asRational(exactOf(sub[1]));
  must(got && got[1] === 1 && got[0] === v, `the substitution line comes to ${got}, not ${v}`, q);

  // Foundation: n^3 + d. Core: an^3 + cn + d, k up to 7. Stretch: all four
  // terms, k from 5 to 12.
  must(C.a !== 0, 'a cubic rule', q);
  if (band === 'foundation') must(C.a === 1 && C.b === 0 && C.c === 0 && C.d !== 0 && k >= 2 && k <= 8, 'Foundation is n^3 + d', q);
  if (band === 'core') must(C.b === 0 && C.c !== 0 && k >= 2 && k <= 7, 'Core is an^3 + cn + d', q);
  if (band === 'stretch') must(C.b !== 0 && C.c !== 0 && k >= 5 && k <= 12, 'Stretch has every term', q);
  return { kind: band };
}

export function checkCubicSequence(q, band) {
  const topic = q.metadata?.topic;
  if (topic === 'sequences-difference-method') return differenceMethod(q, band);
  if (topic === 'sequences-cubic-nth-term') return cubicNthTerm(q, band);
  if (topic === 'sequences-cubic-use-nth-term') return cubicUseNthTerm(q, band);
  return fail(`topic ${topic}`, q);
}
