// Test support only. Recomputes every Ratio and proportion answer (the
// four ratio skills) from what is printed: the ratio or the prose read
// back with patterns, never the generator's variables. Every working line
// is checked too: arithmetic is evaluated, and a line in quantities
// ("2 m = 200 cm") is checked in a common unit, so a line can only be true
// by being right.
//
// The quantity reader (lineHolds, read) is shared with the Metric units
// checker.

const must = (cond, msg) => { if (!cond) throw new Error(msg); };
const close = (a, b) => Number.isFinite(a) && Number.isFinite(b) && Math.abs(a - b) <= 1e-9 * Math.max(1, Math.abs(a), Math.abs(b));
const lines = (s) => String(s ?? '').split('\n');
const gcd = (a, b) => (b ? gcd(b, a % b) : Math.abs(a));
const gcdAll = (xs) => xs.reduce(gcd);
const lcm = (a, b) => a * b / gcd(a, b);
const num = (v) => String(Number(v.toFixed(6)));

/* ------------------------------------------------- reading quantities */

// Every unit in a common one per kind: mm, mm², mm³ (with ml as cm³), g,
// minutes, pence.
export const UNITS = {
  mm: ['length', 1], cm: ['length', 10], m: ['length', 1000], km: ['length', 1e6],
  'mm^2': ['area', 1], 'cm^2': ['area', 100], 'm^2': ['area', 1e6], 'km^2': ['area', 1e12],
  'mm^3': ['volume', 1], 'cm^3': ['volume', 1000], 'm^3': ['volume', 1e9],
  ml: ['volume', 1000], litre: ['volume', 1e6], litres: ['volume', 1e6],
  g: ['mass', 1], kg: ['mass', 1000], tonne: ['mass', 1e6], tonnes: ['mass', 1e6],
  minutes: ['time', 1], hour: ['time', 60], hours: ['time', 60],
  p: ['money', 1],
};

/** A TeX arithmetic expression's value: numbers, + - × ÷, powers, brackets, \frac. */
export function evaluate(tex) {
  let s = String(tex).trim();
  for (let i = 0; i < 4; i += 1) s = s.replace(/\\frac\{([^{}]+)\}\{([^{}]+)\}/g, '(($1)/($2))');
  s = s.replace(/\^\{(\d+)\}/g, '**$1').replace(/\^(\d)/g, '**$1');
  s = s.replace(/\\times/g, '*').replace(/\\div/g, '/').replace(/\s+/g, '');
  must(/^[\d.+\-*/()]+$/.test(s), `not arithmetic: ${tex}`);
  // eslint-disable-next-line no-new-func
  const v = Function(`"use strict"; return (${s});`)();
  must(Number.isFinite(v), `not a number: ${tex}`);
  return v;
}

/**
 * One side of a working line: { v, kind, base } for a quantity, where base
 * is v in its kind's common unit, or { v } for a bare number. Money as
 * \text{£2.40} reads as 240 pence.
 */
export function read(side) {
  const s = side.replace(/\\ /g, ' ').trim();
  let m = /^\\text\{£([\d,]+(?:\.\d\d)?)\}$/.exec(s);
  if (m) {
    const v = Number(m[1].replace(/,/g, '')) * 100;
    return { v, kind: 'money', base: v };
  }
  m = /^(.*?)\s*\\text\{ ?([a-z]+)\}(\^[23])?$/.exec(s);
  if (m) {
    const unit = m[2] + (m[3] ?? '');
    must(UNITS[unit], `unit: ${unit}`);
    const v = evaluate(m[1]);
    return { v, kind: UNITS[unit][0], base: v * UNITS[unit][1] };
  }
  return { v: evaluate(s) };
}

/**
 * Whether a working line is true: its sides split at " = ". Quantities
 * must agree in their common unit; bare arithmetic must equal the number
 * of the last quantity on the line (so "1 m² = 100 × 100 = 10000 cm²"
 * holds), or every other side if there is none. A leading single letter
 * (V = ..., A = ...) names what is found and is skipped.
 */
export function lineHolds(line) {
  const parts = line.split(', \\ ');
  parts.forEach((part) => {
    let sides = part.split(' = ');
    if (/^[A-Za-z]$/.test(sides[0].trim())) sides = sides.slice(1);
    must(sides.length >= 2, `not an equation: ${line}`);
    const rs = sides.map(read);
    const qs = rs.filter((r) => r.kind);
    qs.forEach((r) => must(r.kind === qs[0].kind && close(r.base, qs[0].base), `false: ${line}`));
    const ref = qs.length ? qs.at(-1).v : rs[0].v;
    rs.filter((r) => !r.kind).forEach((r) => must(close(r.v, ref), `false: ${line}`));
  });
}

const common = (q, topic, band) => {
  must(q.metadata?.topic === topic && q.metadata.difficulty === band, 'metadata');
  must(typeof q.workingOut === 'string' && !q.workingOut.includes('\\n'), 'real newlines');
  must(!/\d/.test(q.instruction), `no digits in the instruction: ${q.instruction}`);
};
const money = (pence) => {
  const p = Math.round(pence);
  const whole = String(Math.floor(p / 100)).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return `\\text{£${whole}${p % 100 ? `.${String(p % 100).padStart(2, '0')}` : ''}}`;
};
const poundsIn = (s) => Math.round(Number(s.replace(/,/g, '')) * 100);
const MONEY = '£([\\d,]+(?:\\.\\d\\d)?)';

/* ------------------------------------------------------ ratio-simplify */

const ratioOf = (s) => s.split(' : ');
const divideLines = (w, at, g, xs) => {
  must(w[at] === `\\text{divide each part by } ${g}`, `working: ${w[at]}`);
  must(w[at + 1] === `= ${xs.join(' : ')}`, `working: ${w[at + 1]}`);
};

export function checkRatioSimplify(q, band) {
  common(q, 'ratio-simplify', band);
  must(q.instruction === 'Write the ratio in its simplest form' && !q.visualization && !q.answerUnits, 'instruction');
  const w = lines(q.workingOut);
  const done = (whole) => {
    const g = gcdAll(whole);
    const xs = whole.map((x) => x / g);
    must(q.answer === xs.join(' : '), `answer ${q.answer}, expected ${xs.join(' : ')}`);
    must(new Set(xs).size === xs.length, 'parts not all equal');
    must(w.at(-1) === `= ${q.answer}`, 'the working ends on the answer');
    return g;
  };
  const parts = ratioOf(q.questionMath);

  if (band === 'foundation') {
    const whole = parts.map(Number);
    must(whole.every((x) => Number.isInteger(x) && x > 0) && (whole.length === 2 || whole.length === 3), `whole numbers: ${q.questionMath}`);
    const g = done(whole);
    must(g > 1 && w.length === 2, 'not already simplest');
    divideLines(w, 0, g, whole.map((x) => x / g));
    return { kind: whole.length === 2 ? 'two parts' : 'three parts' };
  }

  if (band === 'core') {
    must(parts.length === 2, 'two quantities');
    const rs = parts.map(read);
    must(rs.every((r) => r.kind) && rs[0].kind === rs[1].kind, 'two quantities of one kind');
    const us = parts.map((p) => /\\text\{ ([a-z]+)\}/.exec(p)[1]);
    must(UNITS[us[0]][1] !== UNITS[us[1]][1], 'in different units');
    // In the smaller unit, both whole.
    const small = Math.min(UNITS[us[0]][1], UNITS[us[1]][1]);
    const whole = rs.map((r) => r.base / small);
    must(whole.every(Number.isInteger), 'whole in the smaller unit');
    const g = done(whole);
    must(g > 1 && w.length === 4, 'four lines');
    lineHolds(w[0]);
    const big = UNITS[us[0]][1] > UNITS[us[1]][1] ? 0 : 1;
    must(w[0].startsWith(parts[big]) && read(w[0].split(' = ')[1]).base / small === whole[big], `the larger unit converted: ${w[0]}`);
    must(w[1] === `= ${whole.join(' : ')}`, `working: ${w[1]}`);
    divideLines(w, 2, g, whole.map((x) => x / g));
    return { kind: 'different units' };
  }

  const fr = /^\\frac\{(\d+)\}\{(\d+)\} : \\frac\{(\d+)\}\{(\d+)\}$/.exec(q.questionMath);
  let L, kind, whole;
  if (fr) {
    const [n1, d1, n2, d2] = fr.slice(1).map(Number);
    must(n1 < d1 && n2 < d2 && gcd(n1, d1) === 1 && gcd(n2, d2) === 1 && d1 !== d2, 'proper fractions in lowest terms, different denominators');
    L = lcm(d1, d2);
    whole = [n1 * L / d1, n2 * L / d2];
    kind = 'fractions';
  } else {
    const xs = parts.map(Number);
    must(parts.length === 2 && xs.every((x) => x > 0) && xs.some((x) => !Number.isInteger(x)), `decimals: ${q.questionMath}`);
    must(parts.every((p) => /^\d+(\.\d)?$/.test(p)), 'one decimal place at most');
    L = 10;
    whole = xs.map((x) => Math.round(x * 10));
    kind = 'decimals';
  }
  const g = done(whole);
  must(w[0] === `\\text{multiply each part by } ${L}` && w[1] === `= ${whole.join(' : ')}`, `working: ${w[0]} / ${w[1]}`);
  if (g > 1) { must(w.length === 4, 'four lines'); divideLines(w, 2, g, whole.map((x) => x / g)); } else must(w.length === 2, 'two lines');
  return { kind };
}

/* ---------------------------------------------------- ratio-proportion */

// Every line but the answer line and the per-100 comparisons, which are
// checked exactly where they are read.
const arithmetic = (w) => w.forEach((line) => { if (!line.startsWith('= ') && !line.startsWith('\\text{the') && !line.includes('per 100')) lineHolds(line); });

export function checkRatioProportion(q, band) {
  common(q, 'ratio-proportion', band);
  must(!q.visualization && !q.questionMath, 'prose only');
  const w = lines(q.workingOut);
  arithmetic(w);
  const t = q.questionText;

  let m = /^A recipe for (\d+) (?:person|people) uses (\d+) (g|ml) of ([a-z]+)\. How much \4 is needed for (\d+) (?:person|people)\?$/.exec(t);
  if (m) {
    must(band !== 'stretch' && q.instruction === 'Find the amount needed', 'a recipe below Stretch');
    const [from, amount, , , to] = [Number(m[1]), Number(m[2]), m[3], m[4], Number(m[5])];
    const v = amount / from * to;
    must(Number.isInteger(v) && q.answer === String(v) && q.answerUnits === m[3], `answer ${q.answer} ${q.answerUnits}, expected ${v} ${m[3]}`);
    must(w.at(-1).endsWith(`= ${v}`), 'the working ends on the answer');
    const whole = to % from === 0 || from % to === 0;
    if (band === 'foundation') {
      must(whole && from !== to, 'scaled by a whole number');
      return { kind: to > from ? 'scaled up' : 'scaled down' };
    }
    must(!whole, 'Core goes through one: neither a multiple of the other');
    must(w[0] === `${amount} \\div ${from} = ${amount / from}`, 'through one');
    return { kind: 'recipe' };
  }

  m = new RegExp(`^(\\d+) ([a-z ]+) cost ${MONEY}\\. Find the cost of (\\d+) \\2\\.$`).exec(t);
  if (m) {
    must(band === 'core' && q.instruction === 'Find the cost', 'a price is Core');
    const [n, p, k] = [Number(m[1]), poundsIn(m[3]), Number(m[4])];
    must(p % n === 0 && n !== k && k % n !== 0 && n % k !== 0, 'through one, not a multiple');
    must(q.answer === money(p / n * k) && !q.answerUnits, `answer ${q.answer}`);
    must(w.at(-1) === `= ${q.answer}` && read(w.at(-2).split(' = ').at(-1)).base === p / n * k, 'the working ends on the answer');
    return { kind: 'cost' };
  }

  m = new RegExp(`^An? (\\d+) (g|ml) ([a-z]+) of ([a-z -]+) costs ${MONEY}\\. An? (\\d+) \\2 \\3 costs ${MONEY}\\. Which is the better value\\?$`).exec(t);
  must(m, `a question the skill asks: ${t}`);
  must(band === 'stretch' && q.instruction === 'Find the better value', 'best value is Stretch');
  const [s1, u, pack] = [Number(m[1]), m[2], m[3]];
  const [p1, s2, p2] = [poundsIn(m[5]), Number(m[6]), poundsIn(m[7])];
  [s1, s2].forEach((s) => must(/^An? /.test(t) && (String(s).startsWith('8') ? t.includes(`An ${s} `) : t.includes(`A ${s} `)), 'a or an'));
  const r1 = p1 * 100 / s1, r2 = p2 * 100 / s2;
  must(s1 < s2 && r1 !== r2 && Math.abs(r1 - r2) <= Math.min(r1, r2) / 4, 'two sizes, close in value');
  const better = r1 < r2 ? s1 : s2;
  must(q.answer === `\\text{the ${better} ${u} ${pack}}` && w.at(-1) === q.answer, `answer ${q.answer}`);
  [[s1, p1, r1], [s2, p2, r2]].forEach(([s, p, r], i) => must(w[i] === `${p} \\div ${num(s / 100)} = ${num(r)}\\text{p per 100 ${u}}`, `working line ${i}: ${w[i]}`));
  return { kind: better === s2 ? 'bigger is better' : 'smaller is better' };
}

/* --------------------------------------------------------- ratio-share */

const shareLines = (w) => w.slice(0, -1).forEach((line) => lineHolds(line.replace(/\\text\{ parts?\}/, '')));

export function checkRatioShare(q, band) {
  common(q, 'ratio-share', band);
  must(!q.visualization && !q.questionMath, 'prose only');
  const w = lines(q.workingOut);
  must(w.at(-1) === q.answer, 'the working ends on the answer');
  shareLines(w);
  const t = q.questionText;

  if (band === 'foundation') {
    const m = new RegExp(`^Share (?:${MONEY}|(\\d+) ([a-z]+) of ([a-z]+)) in the ratio ((?:\\d+ : )+\\d+)\\.$`).exec(t);
    must(m && q.instruction === 'Share in the ratio', `question: ${t}`);
    const xs = ratioOf(m[5]).map(Number);
    must(gcdAll(xs) === 1 && (xs.length === 2 || xs.length === 3), 'a ratio in simplest form');
    const total = m[1] ? poundsIn(m[1]) / 100 : Number(m[2]);
    const sum = xs.reduce((a, b) => a + b);
    must(total % sum === 0, 'shares in whole units');
    const shares = xs.map((x) => x * total / sum);
    const out = (m[1] ? shares.map((s) => money(s * 100)) : shares.map(String));
    const expect = out.length === 2 ? `${out[0]} \\text{ and } ${out[1]}` : `${out[0]}, ${out[1]} \\text{ and } ${out[2]}`;
    must(q.answer === expect && q.answerUnits === (m[1] ? undefined : m[3]), `answer ${q.answer}, expected ${expect}`);
    must(w[0] === `${xs.join(' + ')} = ${sum}\\text{ parts}` && w.length === xs.length + 3, 'parts counted first');
    shares.forEach((s, i) => must(w[2 + i].endsWith(`= ${s}`) && w[2 + i].startsWith(`${xs[i]} \\times`), `share ${i}`));
    return { kind: xs.length === 2 ? 'two parts' : 'three parts' };
  }

  const m = new RegExp(`^([A-Z][a-z]+) and ([A-Z][a-z]+) share some money in the ratio (\\d+) : (\\d+)\\. \\1 gets ${MONEY}( more than \\2)?\\. (How much does \\2 get|How much did they share)\\?$`).exec(t);
  must(m, `question: ${t}`);
  const [B, p, r] = [m[2], Number(m[3]), Number(m[4])];
  const given = poundsIn(m[5]) / 100;
  must(gcd(p, r) === 1 && p !== r, 'a ratio in simplest form');
  const diff = Boolean(m[6]);
  must(diff === (band === 'stretch'), 'a difference is Stretch, a share is Core');
  if (diff) must(p > r, 'the first gets more');
  const perPart = given / (diff ? p - r : p);
  must(Number.isInteger(perPart), 'whole pounds a part');
  const total = m[7].startsWith('How much did');
  const v = total ? (p + r) * perPart : r * perPart;
  must(q.instruction === (total ? 'Find the total' : `Find ${B}'s share`), 'instruction');
  must(q.answer === money(v * 100) && !q.answerUnits, `answer ${q.answer}, expected ${money(v * 100)}`);
  must(w.at(-2).endsWith(`= ${v}`), 'the working reaches the answer');
  if (diff) must(w[0] === `${p} - ${r} = ${p - r}\\text{ part${p - r === 1 ? '' : 's'}}`, 'the difference in parts first');
  return { kind: total ? 'find the total' : 'find a share' };
}

/* ----------------------------------------------------------- map-scale */

const PER = { m: 100, km: 100000 };

export function checkMapScale(q, band) {
  common(q, 'map-scale', band);
  must(!q.visualization && !q.questionMath, 'prose only');
  const w = lines(q.workingOut);
  w.forEach(lineHolds);
  const t = q.questionText;
  // Real distances in metres at 1 : 25000 and larger, kilometres smaller.
  const unitFor = (n) => (n <= 25000 ? 'm' : 'km');
  let m;

  if (band === 'foundation') {
    m = /^A map has a scale of 1 : (\d+)\. Two villages are ([\d.]+) cm apart on the map\. How far apart are they in real life\?$/.exec(t);
    must(m && q.instruction === 'Find the real distance', `question: ${t}`);
    const [n, d] = [Number(m[1]), Number(m[2])];
    const u = unitFor(n);
    const v = d * n / PER[u];
    must(q.answer === num(v) && q.answerUnits === u, `answer ${q.answer} ${q.answerUnits}`);
    must(w.at(-1).endsWith(`= ${num(v)}`) && w[0].startsWith(`${m[2]} \\times ${n} =`), 'working');
    return { kind: 'real distance' };
  }
  if (band === 'core') {
    m = /^A map has a scale of 1 : (\d+)\. Two villages are ([\d.]+) (m|km) apart\. How far apart are they on the map\?$/.exec(t);
    must(m && q.instruction === 'Find the distance on the map', `question: ${t}`);
    const [n, R, u] = [Number(m[1]), Number(m[2]), m[3]];
    must(u === unitFor(n), 'the unit that fits the scale');
    const v = R * PER[u] / n;
    must(q.answer === num(v) && q.answerUnits === 'cm', `answer ${q.answer}`);
    must(w.at(-1).endsWith(`= ${num(v)}`) && w[0].startsWith(`${m[2]} \\times ${PER[u]} =`), 'working');
    return { kind: 'map distance' };
  }
  m = /^On a map, (\d+) cm represents ([\d.]+) (m|km)\. Write the scale in the form 1 : n\.$/.exec(t);
  must(m && q.instruction === 'Find the scale of the map', `question: ${t}`);
  const [d, R, u] = [Number(m[1]), Number(m[2]), m[3]];
  const n = Math.round(R * PER[u] / d);
  must(close(n, R * PER[u] / d) && d > 1 && u === unitFor(n), 'a whole scale, in the unit that fits it');
  must(q.answer === `1 : ${n}` && !q.answerUnits, `answer ${q.answer}`);
  must(w.at(-1).endsWith(`= ${n}`) && w[0].startsWith(`${m[2]} \\times ${PER[u]} =`), 'working');
  return { kind: 'the scale' };
}
