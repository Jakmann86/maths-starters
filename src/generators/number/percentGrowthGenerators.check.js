// Test support only. Checks percentage-of-another and growth-decay from
// what is printed: quantities and their units read back (in a common unit,
// from ratioGenerators.check.js), prose read with patterns, and growth
// worked year on year here. Every working line must hold.

import { UNITS, evaluate, lineHolds, read } from './ratioGenerators.check';

const must = (cond, msg) => { if (!cond) throw new Error(msg); };
const lines = (s) => String(s ?? '').split('\n');
const num = (v) => String(Number(v.toFixed(6)));
const uncomma = (s) => Number(s.replace(/,/g, ''));
const grouped = (n) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ',');

function common(q, topic, band) {
  must(q.metadata?.topic === topic && q.metadata.difficulty === band, 'metadata');
  must(typeof q.workingOut === 'string' && !q.workingOut.includes('\\n'), 'real newlines');
  must(!/\d/.test(q.instruction), `no digits in the instruction: ${q.instruction}`);
  must(!q.visualization, 'no figure');
  return lines(q.workingOut);
}

/* ------------------------------------------------- percentage-of-another */

/** k of n as a percentage, exact to one decimal place, or a failure. */
const asPct = (k, n) => {
  const p = k * 100 / n;
  must(Math.abs(p * 10 - Math.round(p * 10)) < 1e-9 && p > 0 && p < 100, `exact to one decimal place, under 100%: ${k} of ${n}`);
  return `${num(p)}\\%`;
};
const percentLine = (line) => lineHolds(line.replace(/\\%/g, ''));

export function checkPercentageOfAnother(q, band) {
  const w = common(q, 'percentage-of-another', band);
  must(w.at(-1).endsWith(`= ${q.answer}`), 'the working ends on the answer');
  w.forEach(percentLine);
  must(!q.answerUnits, 'a percentage carries no unit');

  if (band === 'foundation') {
    const m = /^(\d+) \\text\{ out of \} (\d+)$/.exec(q.questionMath ?? '');
    must(m && q.instruction === 'Write as a percentage', 'k out of n');
    const ans = asPct(Number(m[1]), Number(m[2]));
    must(Number.isInteger(Number(m[1]) * 100 / Number(m[2])) && q.answer === ans, `answer ${q.answer}, expected ${ans}`);
    must(w.length === 1 && w[0].startsWith(`\\frac{${m[1]}}{${m[2]}} \\times 100`), 'working');
    return { kind: 'out of' };
  }

  if (band === 'core') {
    const [a, b] = (q.questionMath ?? '').split(' \\text{ of } ');
    must(b && q.instruction === 'Write the first as a percentage of the second', 'two quantities');
    const [A, B] = [read(a), read(b)];
    must(A.kind && A.kind === B.kind, 'quantities of one kind');
    const ua = /\\text\{ ([a-z]+)\}/.exec(a)[1], ub = /\\text\{ ([a-z]+)\}/.exec(b)[1];
    must(UNITS[ua][1] < UNITS[ub][1], 'the second in the larger unit');
    const ans = asPct(A.base, B.base);
    must(q.answer === ans, `answer ${q.answer}, expected ${ans}`);
    must(w.length === 2 && w[0].startsWith(`${b} = `) && read(w[0].split(' = ')[1]).base === B.base, 'the larger unit converted first');
    return { kind: 'different units' };
  }

  must(q.instruction === 'Find the percentage' && !q.questionMath, 'a problem in words');
  const t = q.questionText;
  let m = /^In a group of (\d+) students, (\d+) ([a-z ]+) and (\d+) ([a-z ]+)\. The rest ([a-z ]+)\. What percentage \6\?$/.exec(t);
  if (m) {
    const rest = Number(m[1]) - Number(m[2]) - Number(m[4]);
    must(rest >= 2, 'some left over');
    must(q.answer === asPct(rest, Number(m[1])) && w[0].startsWith(`${m[1]} - ${m[2]} - ${m[4]} =`), `answer ${q.answer}`);
    return { kind: 'the rest' };
  }
  m = /^([A-Z][a-z]+) scores (\d+) out of (\d+) on one test and (\d+) out of (\d+) on another\. What percentage of the marks did \1 get altogether\?$/.exec(t);
  must(m, `a problem the skill sets: ${t}`);
  const [k1, n1, k2, n2] = m.slice(2).map(Number);
  must(k1 <= n1 && k2 <= n2 && n1 !== n2, 'scores within their totals');
  must(q.answer === asPct(k1 + k2, n1 + n2), `answer ${q.answer}`);
  return { kind: 'a total' };
}

/* --------------------------------------------------------- growth-decay */

const GROW = /^(?:A (?:town|city|colony)|An? (?:lake|forest|island)) has ([\d,]+) ([a-z]+)\./;
const multiplierLine = (line, up, r) => must(line === `\\text{multiplier} = ${num(1 + (up ? r : -r) / 100)}`, `the multiplier: ${line}`);
/** "a × (m)^{n} ≈ v": the left side worked out, rounded, equals v. */
const approx = (line) => {
  const [lhs, rhs] = line.split(' \\approx ');
  must(rhs !== undefined, `an approximation: ${line}`);
  const v = evaluate(lhs);
  must(Math.round(v) === Number(rhs) && Math.abs(v - Math.round(v) - 0.5) > 1e-6, `false: ${line}`);
  return v;
};

export function checkGrowthDecay(q, band) {
  const w = common(q, 'growth-decay', band);
  must(!q.questionMath, 'a problem in words');
  const t = q.questionText;
  const head = GROW.exec(t);
  must(head, `a population: ${t}`);
  const [count, things] = [uncomma(head[1]), head[2]];
  const growing = /grows|grew/.test(t);
  const shrinking = /falls|fell/.test(t);
  must(growing !== shrinking, 'growing or shrinking');
  must(head[1] === grouped(count), 'thousands separated');

  if (band === 'foundation') {
    const m = /(?:grows|falls) by (\d+)% each year\. How many ([a-z]+) will there be after (\d+) years\?$/.exec(t);
    must(m && m[2] === things && q.instruction === 'Find the number, to the nearest whole number', `question: ${t}`);
    const [r, n] = [Number(m[1]), Number(m[3])];
    const v = count * (1 + (growing ? r : -r) / 100) ** n;
    must(q.answer === String(Math.round(v)) && q.answerUnits === things, `answer ${q.answer}, expected ${Math.round(v)}`);
    must(w.length === 2, 'two lines');
    multiplierLine(w[0], growing, r);
    must(w[1].startsWith(`${count} \\times (`) && w[1].endsWith(`)^{${n}} \\approx ${q.answer}`), 'the value after n years');
    approx(w[1]);
    return { kind: growing ? 'growth' : 'decay' };
  }

  if (band === 'core') {
    const m = /Over the last (\d+) years the number (?:grew|fell) by (\d+)% each year\. How many ([a-z]+) were there \1 years ago\?$/.exec(t);
    must(m && m[3] === things && q.instruction === 'Find the starting number, to the nearest whole number', `question: ${t}`);
    const [n, r] = [Number(m[1]), Number(m[2])];
    const v = count / (1 + (growing ? r : -r) / 100) ** n;
    must(q.answer === String(Math.round(v)) && q.answerUnits === things, `answer ${q.answer}, expected ${Math.round(v)}`);
    must(w.length === 2, 'two lines');
    multiplierLine(w[0], growing, r);
    must(w[1].startsWith(`${count} \\div (`) && w[1].endsWith(`)^{${n}} \\approx ${q.answer}`), 'back n years');
    approx(w[1]);
    return { kind: growing ? 'growth' : 'decay' };
  }

  const m = /(?:grows|falls) by (\d+)% each year\. After how many whole years will there first be (more|fewer) than ([\d,]+) ([a-z]+)\?$/.exec(t);
  must(m && m[4] === things && q.instruction === 'Find how many whole years', `question: ${t}`);
  must((m[2] === 'more') === growing, 'more for growth, fewer for decay');
  const [r, level] = [Number(m[1]), uncomma(m[3])];
  must(m[3] === grouped(level), 'thousands separated');
  const mult = 1 + (growing ? r : -r) / 100;
  let k = 0;
  let v = count;
  while (growing ? v <= level : v >= level) { v *= mult; k += 1; must(k < 50, 'it gets there'); }
  must(k >= 3 && q.answer === String(k) && q.answerUnits === 'years', `answer ${q.answer}, expected ${k}`);
  // The year before and the year itself, each clear of the level.
  must(w.length === 3 && w[2] === `n = ${k}`, 'three lines');
  const before = approx(w[0]), after = approx(w[1]);
  const from = `${count} \\times (${num(mult)})^`;
  must(w[0] === `${from}{${k - 1}} \\approx ${Math.round(before)}` && w[1] === `${from}{${k}} \\approx ${Math.round(after)}`, 'the year before, then the year, from the start');
  must(Math.abs(before - level) > level * 0.004 && Math.abs(after - level) > level * 0.004, 'clear of the level');
  return { kind: growing ? 'growth' : 'decay' };
}
