// Test support only. Checks the six percentages skills from what is printed:
// the amounts and percentages are read back out of the question (math or
// story), the arithmetic is redone exactly here with whole numbers, and the
// answer and its rounding must agree. Nothing is imported from the generator.

import { compiles } from './latexArithmetic.check';

const must = (cond, msg) => { if (!cond) throw new Error(msg); };
const lines = (s) => String(s ?? '').split('\n');

/** "1,234.5" -> [12345n, 1]: digits and decimal places, exact. */
const dec = (s) => {
  const m = /^(-?)([\d,]+)(?:\.(\d+))?$/.exec(String(s).trim());
  must(m, `a number: ${s}`);
  const frac = m[3] ?? '';
  return [BigInt((m[1] ? '-' : '') + m[2].replace(/,/g, '') + frac), frac.length];
};
/** A ratio a/b of BigInts, compared exactly. */
const eqRatio = ([a, b], [c, d]) => a * d === c * b;
const asRatio = (s) => { const [n, p] = dec(s); return [n, 10n ** BigInt(p)]; };
const fromAnswer = (tex) => String(tex).replace(/^\\text\{(.*)\}$/, '$1').replace('£', '');
const roundHalfUp = ([a, b]) => (a >= 0n ? (2n * a + b) / (2n * b) : -((2n * -a + b) / (2n * b)));

const changeText = (tex) => {
  const m = /^\\text\{a \} ([\d.]+)\\% \\text\{ (increase|decrease)\}$/.exec(tex);
  must(m, `a change: ${tex}`);
  return { t: m[1], up: m[2] === 'increase' };
};
/** 1 ± t/100 as a ratio. */
const multiplierOf = ({ t, up }) => {
  const [n, d] = asRatio(t);
  return [100n * d + (up ? n : -n), 100n * d];
};
const mulR = ([a, b], [c, d]) => [a * c, b * d];

function percentageOfAmount(q, band) {
  const m = /^([\d.]+)\\% \\text\{ of \} (\d+)$/.exec(q.questionMath ?? '');
  must(m && q.instruction === 'Work out', `p% of n: ${q.questionMath}`);
  const [p, n] = [m[1], BigInt(m[2])];
  const want = mulR(asRatio(p), [n, 100n]);
  must(eqRatio(asRatio(q.answer), want), `answer ${q.answer}`);
  if (band === 'foundation') must([10, 20, 25, 50, 75, 5].includes(Number(p)), 'Foundation: 25%, 10% and friends');
  if (band === 'core') must(/^\d+$/.test(p) && ![10, 20, 25, 50, 75, 5].includes(Number(p)), 'Core: a whole percentage, not a friendly one');
  if (band === 'stretch') must(/\.5$/.test(p), 'Stretch: a half percentage');
  return { kind: Number(p) > 100 ? 'over 100%' : band === 'stretch' ? 'half percent' : 'percent' };
}

const PCT_OF = [
  /^([\d.]+)% of the price of .+ is £([\d,]+)\. What was the original price\?$/,
  /^([\d.]+)% of the population of .+ is ([\d,]+)\. What was the original population\?$/,
];

function reverse(q, band) {
  const ans = asRatio(fromAnswer(q.answer));
  if (band === 'stretch') {
    let m = /^After a (\d+)% (increase|decrease), the price of .+ is £([\d,]+)\. What was the price before\?$/.exec(q.questionText ?? '');
    if (!m) m = /^\\text\{after a \} (\d+)\\% \\text\{ (increase|decrease), the amount is \} (\d+)$/.exec(q.questionMath ?? '');
    must(m, 'an amount after a change');
    const mult = multiplierOf({ t: m[1], up: m[2] === 'increase' });
    must(eqRatio(mulR(ans, mult), asRatio(m[3])), `answer ${q.answer}`);
    return { kind: 'after a change' };
  }
  let m = PCT_OF.map((re) => re.exec(q.questionText ?? '')).find(Boolean);
  if (!m) m = /^(\d+)\\% \\text\{ of the original amount is \} (\d+)$/.exec(q.questionMath ?? '');
  must(m, 'p% of the original');
  must(eqRatio(mulR(ans, [BigInt(m[1]), 100n]), asRatio(m[2])), `answer ${q.answer}`);
  if (band === 'foundation') must(['10', '50'].includes(m[1]), 'Foundation: 10% or 50%');
  else must(!['10', '50'].includes(m[1]), 'Core: not 10% or 50%');
  return { kind: 'part known' };
}

function multiplier(q, band) {
  if (band === 'stretch') {
    const [a, b] = q.questionMath.split(' \\text{ followed by } ');
    must(b, 'two changes');
    const want = mulR(multiplierOf(changeText(a)), multiplierOf(changeText(b)));
    must(eqRatio(asRatio(q.answer), want), `answer ${q.answer}`);
    return { kind: 'two changes' };
  }
  const c = changeText(q.questionMath);
  must(eqRatio(asRatio(q.answer), multiplierOf(c)), `answer ${q.answer}`);
  if (band === 'foundation') must(/^\d+$/.test(c.t) && Number(c.t) < 100, 'Foundation: a whole percentage');
  else must(!/^\d+$/.test(c.t) || Number(c.t) >= 100, 'Core: an awkward percentage');
  return { kind: c.up ? 'increase' : 'decrease' };
}

function toPercentage(q, band) {
  const c = changeText(q.answer);
  let mult;
  if (band === 'stretch') {
    const m = /^\\times ([\d.]+) \\text\{ then \} \\times ([\d.]+)$/.exec(q.questionMath);
    must(m, 'two multipliers');
    mult = mulR(asRatio(m[1]), asRatio(m[2]));
  } else {
    const m = /^\\times ([\d.]+)$/.exec(q.questionMath);
    must(m, 'a multiplier');
    mult = asRatio(m[1]);
    if (band === 'foundation') must(/^\d+$/.test(c.t) && Number(c.t) < 100, 'Foundation: a whole percentage');
    else must(!/^\d+$/.test(c.t) || Number(c.t) >= 100, 'Core: an awkward percentage');
  }
  must(eqRatio(multiplierOf(c), mult), `answer ${q.answer}`);
  return { kind: band === 'stretch' ? 'two multipliers' : c.up ? 'increase' : 'decrease' };
}

function change(q, band) {
  const ans = fromAnswer(q.answer);
  if (band === 'foundation') {
    let m = /^\\text\{(increase|decrease) \} (\d+) \\text\{ by \} (\d+)\\%$/.exec(q.questionMath ?? '');
    let n; let p; let up;
    if (m) [up, n, p] = [m[1] === 'increase', m[2], m[3]];
    else {
      m = /^The (?:value|population) of .+ was £?([\d,]+)\. It (increases|decreases|grows|falls) by (\d+)%\./.exec(q.questionText ?? '');
      must(m, 'one change');
      [n, up, p] = [m[1], ['increases', 'grows'].includes(m[2]), m[3]];
    }
    must(eqRatio(asRatio(ans), mulR(asRatio(n), multiplierOf({ t: p, up }))), `answer ${q.answer}`);
    return { kind: 'one step' };
  }
  if (band === 'core') {
    let n; let c1; let c2; let rounding = null;
    let m = /^\\text\{(Increase|Decrease) \} (\d+) \\text\{ by \} ([\d.]+)\\%,\n\\text\{then (increase|decrease) the result by \} ([\d.]+)\\%$/.exec(q.questionMath ?? '');
    if (m) [n, c1, c2] = [m[2], { t: m[3], up: m[1] === 'Increase' }, { t: m[5], up: m[4] === 'increase' }];
    else {
      m = /^The (value|population) of .+ was £?([\d,]+)\. (?:In the first year|Over one year) it (increases|decreases|grows|falls) by ([\d.]+)%\. (?:In the second year|Over the next year) it (increases|decreases|grows|falls) by ([\d.]+)%\./.exec(q.questionText ?? '');
      must(m, 'two changes');
      const upw = (w) => ['increases', 'grows'].includes(w);
      [n, c1, c2] = [m[2], { t: m[4], up: upw(m[3]) }, { t: m[6], up: upw(m[5]) }];
      rounding = m[1] === 'value' ? 'penny' : 'whole';
    }
    const exact = mulR(mulR(asRatio(n), multiplierOf(c1)), multiplierOf(c2));
    // The working multiplies by the two multipliers the question describes.
    const mtex = (c) => { const [a, b] = multiplierOf(c); let t = (Number(a) / Number(b)).toString(); if (!t.includes('.')) t = String(t); return t; };
    must(lines(q.workingOut)[0] === `${String(n).replace(/,/g, '')} \\times ${mtex(c1)} \\times ${mtex(c2)}`, `working: ${lines(q.workingOut)[0]}`);
    if (!rounding) must(eqRatio(asRatio(ans), exact), `answer ${q.answer}`);
    else if (rounding === 'penny') must(asRatio(ans)[0] === roundHalfUp(mulR(exact, [100n, 1n])) && dec(ans)[1] === 2, `answer ${q.answer} to the penny`);
    else must(dec(ans)[1] === 0 && dec(ans)[0] === roundHalfUp(exact), `answer ${q.answer} to the whole number`);
    return { kind: 'two steps' };
  }
  const m = /^The (value|population) of .+ is £?([\d,]+)\. It (increases|decreases|grows|falls) by (\d+)% every year\. What will (?:it be worth|it be) after (\d+) years\?$/.exec(q.questionText ?? '');
  must(m, 'compounded over years');
  const years = Number(m[5]);
  must(years >= 3, 'several years');
  const mult = multiplierOf({ t: m[4], up: ['increases', 'grows'].includes(m[3]) });
  let exact = asRatio(m[2]);
  for (let i = 0; i < years; i += 1) exact = mulR(exact, mult);
  if (m[1] === 'value') must(dec(ans)[1] === 2 && dec(ans)[0] === roundHalfUp(mulR(exact, [100n, 1n])), `answer ${q.answer} to the penny`);
  else must(dec(ans)[1] === 0 && dec(ans)[0] === roundHalfUp(exact), `answer ${q.answer} to the whole number`);
  return { kind: 'compound' };
}

function changeFind(q, band) {
  if (band === 'stretch') {
    const m = /^A shop sells .+ for £([\d,]+), making a (\d+)% (profit|loss)\. What did the shop pay for it\?$/.exec(q.questionText ?? '');
    must(m && q.instruction === 'Find the cost price', 'profit or loss, reversed');
    const cost = asRatio(fromAnswer(q.answer));
    must(eqRatio(mulR(cost, multiplierOf({ t: m[2], up: m[3] === 'profit' })), asRatio(m[1])), `answer ${q.answer}`);
    return { kind: m[3] };
  }
  let m = /^([\d,]+) \\text\{ changes to \} ([\d,]+)$/.exec(q.questionMath ?? '');
  if (!m) m = /^The (?:value|population) of .+ was £?([\d,]+)\. It is now £?([\d,]+)\. What percentage change is this\?$/.exec(q.questionText ?? '');
  must(m, 'before and after');
  const [o, nw] = [asRatio(m[1])[0], asRatio(m[2])[0]];
  const up = nw > o;
  const pct = [100n * (up ? nw - o : o - nw), o];
  const w = lines(q.workingOut);
  must(w[0] === `\\text{change} = ${up ? nw - o : o - nw}` && w[1].startsWith(`\\frac{${up ? nw - o : o - nw}}{${o}}`), 'working: the change over the original');
  if (band === 'foundation') {
    must(q.instruction === 'Find the percentage change', 'instruction');
    const c = changeText(q.answer);
    must(c.up === up && eqRatio(asRatio(c.t), pct), `answer ${q.answer}`);
    return { kind: 'whole percent' };
  }
  must(q.instruction === 'Find the percentage change, to one decimal place', 'instruction');
  const am = /^\\text\{a \} (\d+\.\d)\\% \\text\{ (increase|decrease)\}$/.exec(q.answer);
  must(am && (am[2] === 'increase') === up, `answer ${q.answer}`);
  must(!eqRatio(asRatio(am[1]), pct), 'not exact: that is Foundation');
  must(dec(am[1])[0] === roundHalfUp(mulR(pct, [10n, 1n])), `answer ${q.answer} to one decimal place`);
  return { kind: 'one decimal place' };
}

const BY = {
  'percentage-of-amount': percentageOfAmount,
  'reverse-percentages': reverse,
  'percentage-multiplier': multiplier,
  'multiplier-to-percentage': toPercentage,
  'percentage-change': change,
  'percentage-change-find': changeFind,
};

export function checkPercentage(q, band) {
  must(q.metadata?.difficulty === band, 'metadata band');
  must(!/\d/.test(q.instruction), `a digit in the instruction: ${q.instruction}`);
  [q.questionMath, q.answer, q.workingOut].forEach((s) => s && compiles(s));
  must(lines(q.workingOut).length >= 1, 'working');
  return BY[q.metadata.topic](q, band);
}
