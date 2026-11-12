// Test support only. Recomputes every answer for the Probability skills in
// probabilityTopicsGenerators.js from what is printed: the prose read back
// with patterns, tables and grids from the figure config, given
// probabilities from questionMath. The checker keeps its own dictionary of
// what each table heading means, so a phrase and a column that disagree are
// caught. Working lines are checked with the TeX reader from the Logarithms
// checker.

import { compiles } from './latexArithmetic.check';
import { value } from './logarithmGenerators.check';

const must = (cond, msg) => { if (!cond) throw new Error(msg); };
const close = (a, b) => Number.isFinite(a) && Math.abs(a - b) < 1e-9;
const gcd = (a, b) => { a = Math.abs(a); b = Math.abs(b); while (b) [a, b] = [b, a % b]; return a; };
const dec = (v) => String(Number(v.toFixed(6)));
const P = (e) => `P(\\text{${e}})`;
// The checker's own fraction form: k/n, then simplified when it can be.
const frac = (k, n) => {
  const g = gcd(k, n);
  return `\\frac{${k}}{${n}}${g > 1 ? ` = \\frac{${k / g}}{${n / g}}` : ''}`;
};

// Working: an equation's parts agree; a bare expression or a line that
// starts "=" has the answer's value; a P(...) line is the answer, or has the
// value `p` given for it. Lines with words are checked by the skill.
const working = (q, p, extra = () => false) => {
  const target = p;
  q.workingOut.split('\n').forEach((line) => {
    if (extra(line)) return;
    if (/^P\(/.test(line)) {
      if (line === q.answer) return;
      const rhs = line.split(' = ').slice(1);
      rhs.forEach((r) => must(close(value(r), target), `working line: ${line}`));
      return;
    }
    must(!line.includes('\\text'), `a worded working line the skill did not check: ${line}`);
    const parts = line.split(' = ').filter(Boolean).map((s) => s.replace(/^= /, ''));
    if (line.startsWith('= ') || parts.length === 1) {
      parts.forEach((r) => must(close(value(r), target), `working line has the wrong value: ${line}`));
      return;
    }
    const vals = parts.map((r) => value(r));
    vals.forEach((v) => must(close(v, vals[0]), `working line false: ${line}`));
  });
  // The working ends at the answer: the answer line itself, or its value.
  const last = q.workingOut.split('\n').pop();
  if (/^P\(/.test(last)) must(last === q.answer, `working ends elsewhere: ${last}`);
  else if (!extra(last)) must(close(value(last.split(' = ').pop().replace(/^= /, '')), target), `working ends elsewhere: ${last}`);
};

/* -------------------------------------------------- relative-frequency */

const EXPERIMENTS = [
  [/^A coin is tossed (\d+) times and lands on heads (\d+) times\.$/, 'Estimate the probability that it lands on heads', 'heads', false],
  [/^A drawing pin is dropped (\d+) times and lands point up (\d+) times\.$/, 'Estimate the probability that it lands point up', 'point up', false],
  [/^An archer fires (\d+) arrows and hits the target with (\d+) of them\.$/, 'Estimate the probability that her next arrow hits the target', 'hit', false],
  [/^A bus was late on (\d+) of the last (\d+) school days\.$/, 'Estimate the probability that the bus is late tomorrow', 'late', true],
  [/^A footballer scored (\d+) of her last (\d+) penalties\.$/, 'Estimate the probability that she scores her next penalty', 'scores', true],
];
const tableOf = (f) => {
  must(f?.type === 'table' && f.rows[0][0] === 'Colour' && f.rows[0][1] === 'Frequency', 'frequency table');
  return f.rows.slice(1).map(([c, x]) => [c.toLowerCase(), x]);
};
const colours = (ev) => ev.split(' or ');

function checkRelative(q, band) {
  if (band === 'foundation') {
    must(!q.visualization, 'no table at Foundation');
    const e = EXPERIMENTS.find(([re]) => re.test(q.questionText));
    must(e && q.instruction === e[1], `question: ${q.questionText}`);
    let [, n, f] = e[0].exec(q.questionText).map(Number);
    if (e[3]) [n, f] = [f, n];
    must(f > 0 && f < n, 'a frequency inside the trials');
    must(q.answer === `${P(e[2])} = ${dec(f / n)}`, `wrong: ${q.answer}`);
    working(q, f / n);
    return { kind: 'from a count' };
  }
  if (q.questionText.includes(' spins a spinner ')) {
    must(band === 'stretch', 'pooled results at Stretch');
    const m = /^([A-Z][a-z]+) spins a spinner (\d+) times and gets ([a-z]+) (\d+) times\. ([A-Z][a-z]+) spins the same spinner (\d+) times and gets ([a-z]+) (\d+) times\.$/.exec(q.questionText);
    must(m && m[3] === m[7] && m[1] !== m[5], `question: ${q.questionText}`);
    must(q.instruction === `Use all of the results to estimate the probability of ${m[3]}`, 'instruction');
    const v = (Number(m[4]) + Number(m[8])) / (Number(m[2]) + Number(m[6]));
    must(q.answer === `${P(m[3])} = ${dec(v)}`, `wrong: ${q.answer}`);
    working(q, v);
    return { kind: 'pooled results' };
  }
  const t = tableOf(q.visualization);
  const ask = /^Estimate the probability that it lands on ([a-z ]+)$/.exec(q.instruction);
  must(ask, 'instruction');
  const want = colours(ask[1]);
  want.forEach((c) => must(t.some(([x]) => x === c), `no ${c} in the table`));
  const blanks = t.filter(([, x]) => x === '');
  let freqs;
  if (blanks.length) {
    must(band === 'stretch' && blanks.length === 1, 'one missing frequency, at Stretch');
    const m = /^The table shows the results of spinning a spinner (\d+) times\. One frequency is missing\.$/.exec(q.questionText);
    must(m, `question: ${q.questionText}`);
    const known = t.filter(([, x]) => x !== '').reduce((s, [, x]) => s + Number(x), 0);
    const miss = Number(m[1]) - known;
    must(miss > 0, 'the missing frequency is positive');
    must(q.visualization.solution.slice(1).some(([, x]) => x === String(miss)), 'the reveal shows the missing frequency');
    freqs = Object.fromEntries(t.map(([c, x]) => [c, x === '' ? miss : Number(x)]));
  } else {
    must(band === 'core' && q.questionText === 'The table shows the results of spinning a spinner.', 'a full table at Core');
    freqs = Object.fromEntries(t.map(([c, x]) => [c, Number(x)]));
  }
  const N = Object.values(freqs).reduce((a, b) => a + b, 0);
  const k = want.reduce((s, c) => s + freqs[c], 0);
  must(q.answer === `${P(ask[1])} = ${dec(k / N)}`, `wrong: ${q.answer}, should be ${dec(k / N)}`);
  working(q, k / N);
  if (band === 'stretch') return { kind: 'a missing frequency' };
  return { kind: want.length === 1 ? 'one outcome' : 'two outcomes' };
}

/* ------------------------------------------------------ two-way-tables */

// What each heading means: a row is a noun phrase, a column a predicate.
const ROWS = { Boys: 'a boy', Girls: 'a girl', Men: 'a man', Women: 'a woman', 'Year 7': 'in Year 7', 'Year 8': 'in Year 8', 'Year 9': 'in Year 9', 'Year 10': 'in Year 10' };
const COLS = { Walk: 'walks', Bus: 'takes the bus', Car: 'comes by car', Football: 'prefers football', Tennis: 'prefers tennis', Swimming: 'prefers swimming', 'Can swim': 'can swim', 'Cannot swim': 'cannot swim', Left: 'is left-handed', Right: 'is right-handed' };
const SHORT_R = { Boys: 'boy', Girls: 'girl', Men: 'man', Women: 'woman' };
const SHORT_C = { Walk: 'walks', Bus: 'bus', Car: 'car', Football: 'football', Tennis: 'tennis', Swimming: 'swimming', Left: 'left-handed', Right: 'right-handed' };
const short = (h, map) => map[h] ?? h.toLowerCase().replace(/^year/, 'Year');
const isNP = (np) => `is ${np}`;

function checkTwoWay(q, band) {
  const f = q.visualization;
  must(f?.type === 'table' && f.header === 'both', 'two-way table');
  const head = f.rows[0];
  const totals = head[head.length - 1] === 'Total';
  must(totals === (band === 'core' && f.rows.length > 0 && f.rows[f.rows.length - 1][0] === 'Total'), 'totals only in a Core table');
  const colH = head.slice(1, totals ? -1 : undefined);
  const body = f.rows.slice(1, totals ? -1 : undefined);
  const rowH = body.map((r) => r[0]);
  [...colH].forEach((h) => must(COLS[h], `unknown column ${h}`));
  rowH.forEach((h) => must(ROWS[h], `unknown row ${h}`));
  let cells = body.map((r) => r.slice(1, totals ? -1 : undefined));
  if (totals) {
    const blanks = cells.flatMap((r, i) => r.map((x, j) => (x === '' ? [i, j] : null))).filter(Boolean);
    must(blanks.length === 1, 'one blank cell');
    const [[bi, bj]] = blanks;
    const rowTotal = Number(body[bi][body[bi].length - 1]);
    const fill = rowTotal - cells[bi].reduce((s, x) => s + (x === '' ? 0 : Number(x)), 0);
    cells = cells.map((r, i) => r.map((x, j) => (i === bi && j === bj ? fill : Number(x))));
    // The printed totals agree with the cells.
    cells.forEach((r, i) => must(r.reduce((a, b) => a + b, 0) === Number(body[i][body[i].length - 1]), 'a row total'));
    const last = f.rows[f.rows.length - 1];
    colH.forEach((_h, j) => must(cells.reduce((s, r) => s + r[j], 0) === Number(last[j + 1]), 'a column total'));
    must(cells.flat().reduce((a, b) => a + b, 0) === Number(last[last.length - 1]), 'the grand total');
    must(f.solution[bi + 1][bj + 1] === String(fill), 'the reveal fills the blank');
  } else cells = cells.map((r) => r.map(Number));
  must(cells.flat().every((x) => Number.isInteger(x) && x > 0), 'counts');
  const N = cells.flat().reduce((a, b) => a + b, 0);
  const rowSum = (i) => cells[i].reduce((a, b) => a + b, 0);
  const colSum = (j) => cells.reduce((s, r) => s + r[j], 0);
  const who = /One (student|adult) is chosen at random\.$/.exec(q.instruction)?.[1];
  must(who, 'one chosen at random');
  const extra = (line) => {
    const m = /^\\text\{total\} = (\d+)$/.exec(line);
    if (m) { must(Number(m[1]) === N, 'total'); return true; }
    return false;
  };

  if (band === 'stretch') {
    const m = new RegExp(`^The ${who} chosen (.+)\\. Find the probability that this ${who} (.+)\\.$`).exec(q.questionText);
    must(m, `question: ${q.questionText}`);
    const ri = rowH.findIndex((h) => isNP(ROWS[h]) === m[1]), cj = colH.findIndex((h) => COLS[h] === m[2]);
    if (ri >= 0 && cj >= 0) {
      const label = `${short(colH[cj], SHORT_C)} given ${short(rowH[ri], SHORT_R)}`;
      must(q.answer === `${P(label)} = ${frac(cells[ri][cj], rowSum(ri))}`, `wrong: ${q.answer}`);
      working(q, rowSum(ri) === 0 ? 0 : cells[ri][cj] / rowSum(ri), extra);
      must(q.workingOut.startsWith(`${cells[ri].join(' + ')} = ${rowSum(ri)}`), 'working adds up the row');
      return { kind: 'given a row' };
    }
    const cj2 = colH.findIndex((h) => COLS[h] === m[1]), ri2 = rowH.findIndex((h) => isNP(ROWS[h]) === m[2]);
    must(cj2 >= 0 && ri2 >= 0, `question: ${q.questionText}`);
    const label = `${short(rowH[ri2], SHORT_R)} given ${short(colH[cj2], SHORT_C)}`;
    must(q.answer === `${P(label)} = ${frac(cells[ri2][cj2], colSum(cj2))}`, `wrong: ${q.answer}`);
    working(q, cells[ri2][cj2] / colSum(cj2), extra);
    must(q.workingOut.startsWith(`${cells.map((r) => r[cj2]).join(' + ')} = ${colSum(cj2)}`), 'working adds up the column');
    return { kind: 'given a column' };
  }

  const m = new RegExp(`^Find the probability that the ${who} (.+)\\.$`).exec(q.questionText);
  must(m, `question: ${q.questionText}`);
  const ask = m[1];
  const find = () => {
    for (let i = 0; i < rowH.length; i += 1) {
      const np = ROWS[rowH[i]];
      for (let j = 0; j < colH.length; j += 1) {
        const pr = COLS[colH[j]];
        const lab = `${short(rowH[i], SHORT_R)}`, labC = short(colH[j], SHORT_C);
        if (ask === `is ${np} who ${pr}` || ask === `is ${np} and ${pr}`) return ['one cell', cells[i][j], `${lab} and ${labC}`];
        if (ask === `is ${np} or ${pr}`) return ['either', rowSum(i) + colSum(j) - cells[i][j], `${lab} or ${labC}`];
      }
      if (ask === `is ${np}`) return ['a row or column', rowSum(i), short(rowH[i], SHORT_R)];
    }
    const j = colH.findIndex((h) => COLS[h] === ask);
    if (j >= 0) return ['a row or column', colSum(j), short(colH[j], SHORT_C)];
    throw new Error(`ask: ${ask}`);
  };
  const [kind, k, label] = find();
  must(q.answer === `${P(label)} = ${frac(k, N)}`, `wrong: ${q.answer}, should be ${frac(k, N)}`);
  must(q.workingOut.split('\n').pop() === q.answer, 'working ends at the answer');
  // The working's sums are the table's own.
  const first = q.workingOut.split('\n')[0];
  if (kind === 'either') {
    const [ri, cj] = [rowH.findIndex((h) => ask.startsWith(`is ${ROWS[h]} or`)), colH.findIndex((h) => ask.endsWith(` or ${COLS[h]}`))];
    must(first === `${rowSum(ri)} + ${colSum(cj)} - ${cells[ri][cj]} = ${k}`, `working: ${first}`);
  }
  if (totals) {
    const bi = body.findIndex((r) => r.includes(''));
    const bj = body[bi].indexOf('') - 1;
    const others = cells[bi].filter((_x, b) => b !== bj);
    must(first === `${rowSum(bi)} - ${others.length > 1 ? `(${others.join(' + ')})` : others[0]} = ${cells[bi][bj]}`, `working: ${first}`);
  }
  if (kind === 'a row or column') {
    const ri = rowH.findIndex((h) => ask === `is ${ROWS[h]}`);
    const line = ri >= 0 ? cells[ri] : cells.map((r) => r[colH.findIndex((h) => COLS[h] === ask)]);
    must(first === `${line.join(' + ')} = ${k}`, `working: ${first}`);
  }
  working(q, k / N, (line) => {
    if (extra(line)) return true;
    // "rowTotal − (others) = cell", for the blank.
    return false;
  });
  if (band === 'foundation') {
    must(kind !== 'either', 'a union at Foundation');
    return { kind };
  }
  if (totals) { must(kind === 'one cell', 'the blank cell is asked for'); return { kind: 'with totals' }; }
  must(kind === 'either', 'Core asks for a union');
  return { kind };
}

/* --------------------------------------------------------- expectation */

const EXPECT = 'Find the number you would expect';
const CHANCES = {
  late: [/^The probability that a train is late is ([\d.]+)\. There are (\d+) trains this week\. How many trains would you expect to be late\?$/, /^There are (\d+) trains this week\. How many trains would you expect to be late\?$/, 'trains', [0.05, 0.4]],
  grows: [/^The probability that a seed grows is ([\d.]+)\. (\d+) seeds are planted\. How many seeds would you expect to grow\?$/, /^(\d+) seeds are planted\. How many seeds would you expect to grow\?$/, 'seeds', [0.5, 0.95]],
  faulty: [/^The probability that a battery is faulty is ([\d.]+)\. A shop sells (\d+) batteries\. How many would you expect to be faulty\?$/, /^A shop sells (\d+) batteries\. How many would you expect to be faulty\?$/, 'batteries', [0.05, 0.2]],
  rain: [/^The probability that it rains on a day in April is ([\d.]+)\. April has (30) days\. On how many days would you expect it to rain\?$/, /^April has (30) days\. On how many days would you expect it to rain\?$/, 'days', [0.1, 0.8]],
};
const DICE = { 'a six': 1, 'an even number': 3, 'a number greater than 4': 2, 'a prime number': 3, 'a 1 or a 2': 2, 'a multiple of 3': 2 };
const whole = (v) => { must(close(v, Math.round(v)), `not a whole number: ${v}`); return Math.round(v); };

function checkExpectation(q, band) {
  const t = q.questionText;
  if (band === 'foundation') {
    must(q.instruction === EXPECT, 'instruction');
    const m = /^A fair dice is rolled (\d+) times\. How many times would you expect (.+)\?$/.exec(t);
    if (m) {
      const ev = m[2];
      must(DICE[ev], `event: ${ev}`);
      const e = whole((Number(m[1]) * DICE[ev]) / 6);
      must(q.answer === `${e}` && !q.answerUnits, `wrong: ${q.answer}`);
      working(q, e);
      return { kind: 'from a fair dice' };
    }
    const [label, c] = Object.entries(CHANCES).find(([, x]) => x[0].test(t) || (q.questionMath && x[1].test(t))) ?? [];
    must(c && q.answerUnits === c[2], `question: ${t}`);
    let p, n;
    if (q.questionMath) {
      const g = new RegExp(`^P\\(\\\\text\\{${label}\\}\\) = \\\\frac\\{(\\d+)\\}\\{(\\d+)\\}$`).exec(q.questionMath);
      must(g, `given: ${q.questionMath}`);
      p = Number(g[1]) / Number(g[2]); n = Number(c[1].exec(t)[1]);
    } else {
      const g = c[0].exec(t);
      p = Number(g[1]); n = Number(g[2]);
    }
    must(p >= c[3][0] - 0.1 - 1e-9 && p <= c[3][1] + 0.1 + 1e-9, 'a sensible probability for the context');
    const e = whole(n * p);
    must(q.answer === `${e}`, `wrong: ${q.answer}`);
    working(q, e);
    return { kind: 'from a probability' };
  }
  if (band === 'core') {
    must(q.instruction === EXPECT, 'instruction');
    let m = /^A drawing pin lands point up (\d+) times in (\d+) drops\. It is then dropped another (\d+) times\. How many times would you expect it to land point up\?$/.exec(t);
    if (m) {
      const [f, n, k] = m.slice(1).map(Number);
      const e = whole((k * f) / n);
      must(q.answer === `${e}`, `wrong: ${q.answer}`);
      working(q, e, (line) => {
        if (line.startsWith('P(')) { must(close(value(line.split(' = ').pop()), f / n) && line.startsWith(`P(\\text{point up}) = \\frac{${f}}{${n}}`), `working: ${line}`); return true; }
        return false;
      });
      return { kind: 'from an experiment' };
    }
    m = /^A bag holds (\d+) ([a-z]+) and (\d+) ([a-z]+) counters\. A counter is taken and put back, (\d+) times\. How many times would you expect a ([a-z]+) counter\?$/.exec(t);
    must(m && m[2] !== m[4] && m[6] === m[2], `question: ${t}`);
    const x = Number(m[1]), y = Number(m[3]), k = Number(m[5]);
    const e = whole((k * x) / (x + y));
    must(q.answer === `${e}`, `wrong: ${q.answer}`);
    working(q, e, (line) => {
      if (line.startsWith('P(')) { must(line === `P(\\text{${m[2]}}) = \\frac{${x}}{${x + y}}`, `working: ${line}`); return true; }
      return false;
    });
    return { kind: 'from a bag' };
  }
  let m = /^A spinner scores (\d+) points with probability ([\d.]+) and (\d+) points with probability ([\d.]+)\. Otherwise it scores nothing\. It is spun (\d+) times\.$/.exec(t);
  if (m) {
    must(q.instruction === 'Find the total score you would expect' && q.answerUnits === 'points', 'instruction');
    const [v1, p1, v2, p2, n] = m.slice(1).map(Number);
    must(p1 + p2 <= 1 + 1e-9, 'probabilities add to at most 1');
    const per = v1 * p1 + v2 * p2;
    const e = whole(n * per);
    must(q.answer === `${e}`, `wrong: ${q.answer}`);
    const [l1, l2] = q.workingOut.split('\n');
    must(close(value(l1.split(' = ')[0]), per) && close(value(l1.split(' = ')[1]), per), `working: ${l1}`);
    must(close(value(l2.split(' = ')[0]), e) && l2.endsWith(` = ${e}`), `working: ${l2}`);
    return { kind: 'expected score' };
  }
  m = /^A biased coin lands on heads with probability ([\d.]+)\. It is expected to land on heads (\d+) times\. How many times was it tossed\?$/.exec(t);
  must(m && q.instruction === 'Work back to the number of trials', `question: ${t}`);
  const n = whole(Number(m[2]) / Number(m[1]));
  must(q.answer === `${n}`, `wrong: ${q.answer}`);
  const [l1, l2] = q.workingOut.split('\n');
  must(close(value(l1.split(' = ')[0], { n }), Number(m[2])) && l1.split(' = ')[1] === m[2], `working: ${l1}`);
  must(close(value(l2.split(' = ')[1]), n) && l2.endsWith(` = ${n}`), `working: ${l2}`);
  return { kind: 'how many trials' };
}

/* ------------------------------------------------------- sample-spaces */

const OPF = { '+': ['total', (a, b) => a + b], '×': ['product', (a, b) => a * b], '−': ['difference', (a, b) => Math.abs(a - b)] };
const event = (ev, noun) => {
  let m = new RegExp(`^a ${noun} of (\\d+)$`).exec(ev);
  if (m) return (x) => x === Number(m[1]);
  m = new RegExp(`^a ${noun} greater than (\\d+)$`).exec(ev);
  if (m) return (x) => x > Number(m[1]);
  m = new RegExp(`^a ${noun} less than (\\d+)$`).exec(ev);
  if (m) return (x) => x < Number(m[1]);
  if (ev === `an even ${noun}`) return (x) => x % 2 === 0;
  if (ev === `an odd ${noun}`) return (x) => x % 2 === 1;
  throw new Error(`event: ${ev}`);
};
const COINS = {
  'exactly two heads': (o) => o.split('H').length - 1 === 2,
  'exactly one head': (o) => o.split('H').length - 1 === 1,
  'at least one head': (o) => o.includes('H'),
  'at least two tails': (o) => o.split('T').length - 1 >= 2,
  'all three the same': (o) => new Set(o).size === 1,
  'more heads than tails': (o) => o.split('H').length - 1 >= 2,
};

function checkSampleSpaces(q, band) {
  if (q.instruction === 'Three fair coins are tossed.') {
    must(band === 'stretch' && !q.visualization, 'three coins at Stretch');
    const ev = /^Find the probability of (.+)\.$/.exec(q.questionText)?.[1];
    must(COINS[ev], `event: ${ev}`);
    const all = ['H', 'T'].flatMap((a) => ['H', 'T'].flatMap((b) => ['H', 'T'].map((c) => a + b + c)));
    const hits = all.filter(COINS[ev]);
    must(q.answer === `${P(ev)} = ${frac(hits.length, 8)}`, `wrong: ${q.answer}`);
    const [l1, l2, l3] = q.workingOut.split('\n');
    const list = (s) => /^\\text\{(.+)\}$/.exec(s)?.[1].split(', ').sort().join(',');
    must(list(l1) === all.sort().join(','), 'all eight listed');
    must(list(l2) === hits.sort().join(','), 'the right ones picked');
    must(l3 === q.answer, 'working ends at the answer');
    return { kind: 'three coins' };
  }
  const f = q.visualization;
  must(f?.type === 'table' && f.header === 'both', 'grid');
  const [corner, ...bh] = f.rows[0];
  must(OPF[corner], `corner: ${corner}`);
  const [noun, op] = OPF[corner];
  const two = /^Two fair dice are rolled\. /.test(q.questionText);
  const sp = /^A fair dice is rolled and a fair spinner numbered 1 to (\d+) is spun\. /.exec(q.questionText);
  must(two || sp, `set-up: ${q.questionText}`);
  const setup = two ? 'Two fair dice are rolled.' : sp[0].trim();
  const ask = q.questionText.slice(setup.length + 1);
  const aVals = [1, 2, 3, 4, 5, 6], bVals = two ? [1, 2, 3, 4, 5, 6] : Array.from({ length: Number(sp[1]) }, (_x, i) => i + 1);
  must(bh.join() === bVals.join() && f.rows.slice(1).map((r) => r[0]).join() === aVals.join(), 'grid headings match the dice');
  const vals = aVals.flatMap((a) => bVals.map((b) => op(a, b)));
  const N = vals.length;
  const cellsShown = f.rows.slice(1).map((r) => r.slice(1));
  const filled = cellsShown.flat().every((x) => x !== '');
  if (filled) cellsShown.forEach((r, i) => r.forEach((x, j) => must(Number(x) === op(aVals[i], bVals[j]), 'a grid cell is wrong')));
  else {
    must(cellsShown.flat().every((x) => x === ''), 'all blank or all filled');
    f.solution.slice(1).forEach((r, i) => r.slice(1).forEach((x, j) => must(Number(x) === op(aVals[i], bVals[j]), 'a revealed cell is wrong')));
  }
  const countLine = (line, k) => {
    const m = /^(\d+) \\text\{ of the \} (\d+) \\text\{ outcomes\}$/.exec(line);
    if (!m) return false;
    must(Number(m[1]) === k && Number(m[2]) === N, `working: ${line}`);
    return true;
  };

  if (band === 'stretch') {
    must(filled && two && q.instruction === `The grid shows every ${noun}.`, 'Stretch reads a filled two-dice grid');
    const m = /^Given (.+), find the probability of (.+)\.$/.exec(ask);
    must(m, `question: ${q.questionText}`);
    const test = event(m[2], noun);
    let cond;
    const d = /^the first dice shows (\d)$/.exec(m[1]);
    if (m[1] === 'a double') cond = (a, b) => a === b;
    else if (d) cond = (a) => a === Number(d[1]);
    else { const g = event(m[1], noun); cond = (a, b) => g(op(a, b)); }
    const pool = aVals.flatMap((a) => bVals.map((b) => [a, b])).filter(([a, b]) => cond(a, b));
    const hits = pool.filter(([a, b]) => test(op(a, b)));
    must(hits.length > 0 && hits.length < pool.length, 'a real narrowing');
    must(q.answer === frac(hits.length, pool.length), `wrong: ${q.answer}`);
    const [l1, l2, l3] = q.workingOut.split('\n');
    must(l1 === `${pool.length} \\text{ outcomes have ${m[1]}}` && l2 === `${hits.length} \\text{ of them have ${m[2]}}` && l3 === q.answer, `working: ${q.workingOut}`);
    return { kind: 'given' };
  }
  must(q.instruction === (band === 'foundation' ? `The grid shows every ${noun}.` : `Complete the grid of the ${noun}s.`), 'instruction');
  const ev = /^Find the probability of (.+)\.$/.exec(ask)?.[1];
  must(ev, `question: ${q.questionText}`);
  const k = vals.filter(event(ev, noun)).length;
  must(q.answer === `${P(ev)} = ${frac(k, N)}`, `wrong: ${q.answer}, should be ${frac(k, N)}`);
  working(q, k / N, (line) => countLine(line, k));
  must(q.workingOut.split('\n').pop() === q.answer, 'working ends at the answer');
  if (band === 'foundation') {
    must(filled && noun !== 'difference', 'Foundation is a filled grid of totals or products');
    return { kind: noun };
  }
  must(!filled, 'Core grid is blank');
  return { kind: noun };
}

/* -------------------------------------------------- independent-events */

const VERBS = { hits: ['misses', 'hit', 'shot at a target'], scores: ['misses', 'score', 'penalty'], works: ['breaks down', 'work', null] };
const readP = (s) => {
  const m = /^P\(\\text\{(.+) (hits|scores|works)\}\) = (\\frac\{(\d+)\}\{(\d+)\}|0\.\d)$/.exec(s);
  must(m, `given: ${s}`);
  const v = m[4] ? Number(m[4]) / Number(m[5]) : Number(m[3]);
  return { who: m[1], verb: m[2], v, fraction: Boolean(m[4]) };
};

function checkIndependent(q, band) {
  const [g1, g2, ...rest] = q.questionMath.split('\n');
  must(!rest.length, 'two given probabilities');
  const A = readP(g1), B = readP(g2);
  must(A.verb === B.verb && A.who !== B.who && A.fraction === B.fraction && A.v !== B.v, 'two people, one event');
  const [not, base, what] = VERBS[A.verb];
  must(what ? q.questionText === `${A.who} and ${B.who} each take one ${what}.` : q.questionText === 'Two machines work independently.', `set-up: ${q.questionText}`);
  const ask = /^Find the probability that (.+)$/.exec(q.instruction)?.[1];
  let v, label, kind;
  if (ask === `both ${base}`) [v, label, kind] = [A.v * B.v, `both ${base}`, 'both'];
  else if (ask === `neither of them ${A.verb}`) [v, label, kind] = [(1 - A.v) * (1 - B.v), `neither ${A.verb}`, 'neither'];
  else if (ask === `${A.who} ${A.verb} and ${B.who} ${not}`) [v, label, kind] = [A.v * (1 - B.v), `${A.who} ${A.verb}, ${B.who} ${not}`, 'one but not the other'];
  else if (ask === `exactly one of them ${A.verb}`) [v, label, kind] = [A.v * (1 - B.v) + (1 - A.v) * B.v, `exactly one ${A.verb}`, 'exactly one'];
  else if (ask === `at least one of them ${A.verb}`) [v, label, kind] = [1 - (1 - A.v) * (1 - B.v), `at least one ${A.verb}`, 'at least one'];
  else throw new Error(`ask: ${ask}`);
  // The answer in lowest terms (fractions) or exactly (decimals).
  const m = /^P\(\\text\{(.+)\}\) = (\\frac\{(\d+)\}\{(\d+)\}|\d+|0\.\d+)$/.exec(q.answer);
  must(m && m[1] === label, `answer: ${q.answer}`);
  if (A.fraction) {
    must(m[3] ? gcd(Number(m[3]), Number(m[4])) === 1 : true, 'answer in lowest terms');
    must(close(m[3] ? Number(m[3]) / Number(m[4]) : Number(m[2]), v), `wrong: ${q.answer}`);
  } else must(m[2] === dec(v), `wrong: ${q.answer}, should be ${dec(v)}`);
  // The working multiplies the given probabilities and their complements.
  const t = (g, comp) => {
    const m2 = /= (.+)$/.exec(g)[1];
    if (!comp) return m2;
    const f = /^\\frac\{(\d+)\}\{(\d+)\}$/.exec(m2);
    return f ? `\\frac{${Number(f[2]) - Number(f[1])}}{${f[2]}}` : dec(1 - Number(m2));
  };
  const expected = {
    both: `${t(g1)} \\times ${t(g2)}`,
    neither: `${t(g1, true)} \\times ${t(g2, true)}`,
    'one but not the other': `${t(g1)} \\times ${t(g2, true)}`,
    'exactly one': `${t(g1)} \\times ${t(g2, true)} + ${t(g1, true)} \\times ${t(g2)}`,
    'at least one': `1 - ${t(g1, true)} \\times ${t(g2, true)}`,
  }[kind];
  must(q.workingOut.split('\n')[0] === expected, `working: ${q.workingOut.split('\n')[0]}, should be ${expected}`);
  must(q.workingOut.split('\n').pop() === q.answer, 'working ends at the answer');
  working(q, v);
  const bands = { foundation: ['both'], core: ['neither', 'one but not the other'], stretch: ['exactly one', 'at least one'] };
  must(bands[band].includes(kind), `${kind} at ${band}`);
  return { kind };
}

/* ------------------------------------------------------------ either-or */

const PROPS = {
  'an even number': (x) => x % 2 === 0, 'an odd number': (x) => x % 2 === 1,
  'a multiple of 3': (x) => x % 3 === 0, 'a multiple of 4': (x) => x % 4 === 0,
  'a multiple of 5': (x) => x % 5 === 0, 'a square number': (x) => Number.isInteger(Math.sqrt(x)),
  'a prime number': (x) => x > 1 && Array.from({ length: x - 2 }, (_y, i) => i + 2).every((d) => x % d),
  'greater than 15': (x) => x > 15, 'less than 6': (x) => x < 6,
};
// The pack, card by card.
const PACK = ['C', 'D', 'H', 'S'].flatMap((s) => ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'].map((r) => [s, r]));
const CARDS = {
  'a heart': ([s]) => s === 'H', 'a red card': ([s]) => s === 'H' || s === 'D', 'a spade': ([s]) => s === 'S',
  'a king': ([, r]) => r === 'K', 'a picture card': ([, r]) => ['J', 'Q', 'K'].includes(r), 'an ace': ([, r]) => r === 'A',
};
const bare = (s) => s.replace(/^an? /, '');

function checkEitherOr(q, band) {
  if (band === 'foundation') {
    const m = /^A spinner can land on ([a-z]+), ([a-z]+) or ([a-z]+)\.$/.exec(q.questionText);
    must(m, `set-up: ${q.questionText}`);
    const g = /^P\(\\text\{([a-z]+)\}\) = (0\.\d+)\nP\(\\text\{([a-z]+)\}\) = (0\.\d+)$/.exec(q.questionMath);
    must(g && g[1] === m[1] && g[3] === m[2], `given: ${q.questionMath}`);
    const a = Number(g[2]), b = Number(g[4]);
    must(a + b < 1, 'room for the third colour');
    if (q.instruction === `Find the probability that it lands on ${m[1]} or ${m[2]}`) {
      must(q.answer === `${P(`${m[1]} or ${m[2]}`)} = ${dec(a + b)}`, `wrong: ${q.answer}`);
      working(q, a + b);
      return { kind: 'either' };
    }
    must(q.instruction === `Find the probability that it lands on ${m[3]}`, 'instruction');
    must(q.answer === `${P(m[3])} = ${dec(1 - a - b)}`, `wrong: ${q.answer}`);
    working(q, 1 - a - b);
    return { kind: 'the rest' };
  }
  if (band === 'core') {
    const ask = /Find the probability that it is (.+) or (.+)\.$/.exec(q.questionText);
    must(ask, `question: ${q.questionText}`);
    const cards = /^Cards are numbered 1 to (\d+)\. Find/.exec(q.questionText);
    must(q.instruction === (cards ? 'One card is taken at random.' : 'One card is taken at random from an ordinary pack.'), 'instruction');
    let n, a, b, ab, kind;
    if (cards) {
      n = Number(cards[1]);
      must(PROPS[ask[1]] && PROPS[ask[2]], 'properties');
      const xs = Array.from({ length: n }, (_y, i) => i + 1);
      [a, b, ab] = [xs.filter(PROPS[ask[1]]).length, xs.filter(PROPS[ask[2]]).length, xs.filter((x) => PROPS[ask[1]](x) && PROPS[ask[2]](x)).length];
      kind = 'numbered cards';
    } else {
      must(/^A pack has 52 cards\. Find/.test(q.questionText) && CARDS[ask[1]] && CARDS[ask[2]], `set-up: ${q.questionText}`);
      n = 52;
      [a, b, ab] = [PACK.filter(CARDS[ask[1]]).length, PACK.filter(CARDS[ask[2]]).length, PACK.filter((c) => CARDS[ask[1]](c) && CARDS[ask[2]](c)).length];
      kind = 'a pack of cards';
    }
    must(ab > 0 && ab < a && ab < b, 'the two events overlap, neither inside the other');
    const k = a + b - ab;
    must(q.answer === `${P(`${bare(ask[1])} or ${bare(ask[2])}`)} = ${frac(k, n)}`, `wrong: ${q.answer}, should be ${frac(k, n)}`);
    must(q.workingOut === `\\frac{${a}}{${n}} + \\frac{${b}}{${n}} - \\frac{${ab}}{${n}}\n= ${frac(k, n)}`, 'working uses the addition rule');
    working(q, k / n);
    return { kind };
  }
  const lines = q.questionMath.split('\n');
  must(lines.length === 3 && !q.questionText, 'three given probabilities');
  const r = (s) => /^P\(([A-Z])\) = (0\.\d+)$/.exec(s);
  const [x, y] = [r(lines[0]), r(lines[1])];
  must(x && y, 'P(A) and P(B)');
  const third = /^P\(([A-Z]) \\text\{ (and|or) \} ([A-Z])\) = (0\.\d+)$/.exec(lines[2]);
  must(third && third[1] === x[1] && third[3] === y[1], `given: ${lines[2]}`);
  const a = Number(x[2]), b = Number(y[2]), t = Number(third[4]);
  if (third[2] === 'and') {
    must(q.instruction === `Find the probability of ${x[1]} or ${y[1]}`, 'instruction');
    must(t < Math.min(a, b) && a + b - t < 1, 'a possible overlap');
    must(q.answer === `P(${x[1]} \\text{ or } ${y[1]}) = ${dec(a + b - t)}`, `wrong: ${q.answer}`);
    working(q, a + b - t);
    return { kind: 'find P(A or B)' };
  }
  must(q.instruction === 'Find the probability of both', 'instruction');
  const both = a + b - t;
  must(both > 0 && both < Math.min(a, b) && t < 1, 'a possible overlap');
  must(q.answer === `P(${x[1]} \\text{ and } ${y[1]}) = ${dec(both)}`, `wrong: ${q.answer}`);
  working(q, both);
  return { kind: 'find P(A and B)' };
}

const CHECKS = {
  'relative-frequency': checkRelative, 'two-way-tables': checkTwoWay, expectation: checkExpectation,
  'sample-spaces': checkSampleSpaces, 'independent-events': checkIndependent, 'either-or': checkEitherOr,
};

export function checkProbability(q, band) {
  const topic = q.metadata?.topic;
  must(CHECKS[topic], `unknown topic ${topic}`);
  must(q.metadata.difficulty === band, 'metadata difficulty');
  must(!/\d/.test(q.instruction), 'a number in the instruction');
  [q.questionMath ?? '1', q.answer, q.workingOut].forEach(compiles);
  return CHECKS[topic](q, band);
}
