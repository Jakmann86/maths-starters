// The checker for quartiles-iqr and compare-distributions, shared by the
// harness (spreadGenerators.test.js) and the mutation test
// (spreadGenerators.mutation.test.js). Test support only.
//
// The data are read back off the board — the printed list, or the table —
// and every statistic is recomputed here with its own implementation of
// Haese's quartile method. Nothing is imported from the generator.

const fail = (msg, q) => { throw new Error(`${msg}\n${JSON.stringify(q)}`); };
const must = (cond, msg, q) => { if (!cond) fail(msg, q); };

/* --------------------------------------------------------------- maths */

const asc = (xs) => [...xs].sort((a, b) => a - b);
const med = (s) => (s.length % 2 ? s[(s.length - 1) / 2] : (s[s.length / 2 - 1] + s[s.length / 2]) / 2);

// Haese 13D: an odd n drops the median from both halves.
export function haese(values) {
  const s = asc(values);
  const n = s.length;
  const k = Math.floor(n / 2);
  return { q1: med(s.slice(0, k)), q2: med(s), q3: med(s.slice(n - k)), sorted: s };
}

const fmt = (x) => String(Number(x.toFixed(2)));
const sorted = (xs) => xs.every((x, i) => i === 0 || xs[i - 1] <= x);
const range = (xs) => Math.max(...xs) - Math.min(...xs);

// "a - b = c" balances.
const balances = (line) => {
  const m = /(\d+(?:\.\d+)?) - (\d+(?:\.\d+)?) = (\d+(?:\.\d+)?)$/.exec(line);
  return m && Math.abs(Number(m[1]) - Number(m[2]) - Number(m[3])) < 1e-9 ? m.slice(1).map(Number) : null;
};

/* ------------------------------------------------------- quartiles-iqr */

const LIST_SENTENCE = /^Find the interquartile range of (?:the marks of (\d+) students in a test out of 40|the goals scored by a team in (\d+) matches|the times, in minutes, that (\d+) students took to get to school|the ages of (\d+) people at a party|the numbers of books read by (\d+) students last year|the heights, in cm, of (\d+) seedlings)\.$/;

export function checkQuartiles(q, difficulty) {
  must(q.metadata?.topic === 'quartiles-iqr' && q.metadata?.difficulty === difficulty, 'metadata', q);
  must(q.answerUnits === undefined, 'no units', q);
  let data;
  if (difficulty === 'stretch') {
    must(q.questionMath === undefined, 'the table carries the data', q);
    const f = q.visualization;
    must(f?.type === 'table' && f.header === 'column' && f.big === true && f.rows.length === 2, 'a two-row table', q);
    const [xr, fr] = f.rows;
    must(fr[0] === 'Frequency', 'second row is frequency', q);
    must(/^The table shows .+\. Find the interquartile range\.$/.test(q.instruction), 'stretch instruction', q);
    const xs = xr.slice(1).map(Number), fs = fr.slice(1).map(Number);
    must(xs.every(Number.isInteger) && fs.every((x) => Number.isInteger(x) && x >= 1), 'whole numbers, every frequency at least 1', q);
    must(sorted(xs) && new Set(xs).size === xs.length, 'values in order', q);
    data = xs.flatMap((x, i) => Array(fs[i]).fill(x));
    must(data.length >= 15 && data.length <= 35, 'a class-sized total', q);
  } else {
    const m = LIST_SENTENCE.exec(q.instruction);
    must(m, `instruction "${q.instruction}"`, q);
    const n = Number(m.slice(1).find(Boolean));
    must(q.visualization === undefined, 'no figure for a list', q);
    must(/^\d+(, \d+)*$/.test(q.questionMath), 'a plain comma list', q);
    data = q.questionMath.split(', ').map(Number);
    must(data.length === n, `list has ${data.length} values, sentence says ${n}`, q);
    if (difficulty === 'foundation') {
      must([7, 11, 15].includes(n), 'foundation n gives quartiles that are data values', q);
      must(sorted(data), 'foundation list is ordered', q);
    } else {
      must([8, 9, 10, 12].includes(n), 'core n', q);
      must(!sorted(data), 'core list is unordered', q);
    }
  }
  const { q1, q3 } = haese(data);
  if (difficulty === 'foundation') must(data.includes(q1) && data.includes(q3), 'foundation quartiles are data values', q);
  if (difficulty === 'core') must(!(Number.isInteger(q1) && Number.isInteger(q3)), 'core averages at least one quartile', q);
  const iqr = q3 - q1;
  must(iqr > 0, 'positive IQR', q);
  must(q.answer === fmt(iqr), `answer ${q.answer} should be ${fmt(iqr)}`, q);
  // Working: names Q1 and Q3 as recomputed, and the last line balances.
  const w = q.workingOut.split('\n');
  must(w.some((l) => l.endsWith(`Q_1 = ${fmt(q1)}`)), `working names Q1 = ${fmt(q1)}`, q);
  must(w.some((l) => l.endsWith(`Q_3 = ${fmt(q3)}`)), `working names Q3 = ${fmt(q3)}`, q);
  const b = balances(w.at(-1));
  must(b && b[0] === q3 && b[1] === q1 && fmt(b[2]) === fmt(iqr), 'last working line balances', q);
  return { n: data.length, q1, q3 };
}

/* ------------------------------------------------ compare-distributions */

const PAIR_SENTENCE = /^The table shows (?:the points scored by two basketball players in (\d+) games|the marks of two students in (\d+) spelling tests out of 30|the runs scored by two cricketers in (\d+) innings|the numbers of customers at two cafés on (\d+) days)\.$/;

export function checkCompare(q, difficulty) {
  must(q.metadata?.topic === 'compare-distributions' && q.metadata?.difficulty === difficulty, 'metadata', q);
  const m = PAIR_SENTENCE.exec(q.instruction);
  must(m, `instruction "${q.instruction}"`, q);
  const n = Number(m.slice(1).find(Boolean));
  const f = q.visualization;
  must(f?.type === 'table' && f.rows.length === 2 && f.big === true, 'a two-row table', q);
  const [[a, ...xr], [b, ...yr]] = f.rows;
  must(a !== b, 'two different names', q);
  must(xr.length === n && yr.length === n, 'the table holds the stated number each', q);
  const xs = xr.map(Number), ys = yr.map(Number);
  must([...xs, ...ys].every((v) => Number.isInteger(v) && v >= 0), 'whole numbers', q);
  must(q.questionMath === undefined, 'parts, not questionMath', q);
  const lines = q.answer.split('\n');
  const hx = haese(xs), hy = haese(ys);
  const ix = hx.q3 - hx.q1, iy = hy.q3 - hy.q1;
  // The working restates each player's own statistics, recomputed here —
  // balancing arithmetic alone would pass a line copied from stale data.
  const w = q.workingOut.split('\n');
  must(w.length === 2, 'two working lines', q);
  const workFor = (name) => w.find((l) => l.startsWith(`\\text{${name}: `));
  const expectWork = (name, data, h, kind) => {
    const l = workFor(name);
    must(l, `a working line for ${name}`, q);
    const want = {
      range: `\\text{${name}: } ${Math.max(...data)} - ${Math.min(...data)} = ${range(data)}`,
      core: `\\text{${name}: median } ${fmt(h.q2)} \\text{, IQR } ${fmt(h.q3)} - ${fmt(h.q1)} = ${fmt(h.q3 - h.q1)}`,
      stretch: `\\text{${name}: range } ${range(data)} \\text{, IQR } ${fmt(h.q3)} - ${fmt(h.q1)} = ${fmt(h.q3 - h.q1)}`,
    }[kind];
    must(l === want, `working for ${name} should read ${want}`, q);
  };
  const kind = { foundation: 'range', core: 'core', stretch: 'stretch' }[difficulty];
  expectWork(a, xs, hx, kind);
  expectWork(b, ys, hy, kind);

  if (difficulty === 'foundation') {
    must(JSON.stringify(q.questionParts) === JSON.stringify(['Who was more consistent?', 'Use the range.']), 'foundation parts', q);
    const [rx, ry] = [range(xs), range(ys)];
    must(Math.abs(rx - ry) >= 4, 'ranges clearly differ', q);
    const who = rx < ry ? a : b;
    must(lines[0] === `\\text{${who}}`, `answer should be ${who}`, q);
    must(lines[1] === `\\text{range ${Math.min(rx, ry)}, against ${Math.max(rx, ry)}}`, 'the two ranges', q);
    q.workingOut.split('\n').forEach((l) => must(balances(l), `working "${l}" balances`, q));
    return { who };
  }
  if (difficulty === 'core') {
    must(JSON.stringify(q.questionParts) === JSON.stringify(['(a) Who scored higher on average?', '(b) Who was more consistent?']), 'core parts', q);
    must(sorted(xs) && sorted(ys), 'core lists ordered', q);
    must([7, 11].includes(n), 'core n', q);
    must(Math.abs(hx.q2 - hy.q2) >= 3 && Math.abs(ix - iy) >= 3, 'clear differences', q);
    const higher = hx.q2 > hy.q2 ? a : b, steadier = ix < iy ? a : b;
    must(lines[0] === `\\text{(a) ${higher}, by the median}`, `(a) should be ${higher}`, q);
    must(lines[1] === `\\text{(b) ${steadier}, by the IQR}`, `(b) should be ${steadier}`, q);
    q.workingOut.split('\n').forEach((l) => must(balances(l), `working "${l}" balances`, q));
    return { higher, steadier };
  }
  // Stretch: the range points one way, the IQR the other.
  must(JSON.stringify(q.questionParts) === JSON.stringify(['Who was more consistent?', 'Explain which measure you used.']), 'stretch parts', q);
  must(!sorted(xs) && !sorted(ys), 'stretch lists unordered', q);
  const [rx, ry] = [range(xs), range(ys)];
  const steady = ix < iy ? 'x' : 'y';
  const [sv, ov] = steady === 'x' ? [xs, ys] : [ys, xs];
  const [sName] = steady === 'x' ? [a] : [b];
  const [si, oi] = steady === 'x' ? [ix, iy] : [iy, ix];
  const [sr, or] = steady === 'x' ? [rx, ry] : [ry, rx];
  must(oi - si >= 3, 'IQRs clearly differ', q);
  must(sr > or + 2, 'the trap: the steadier one has the larger range', q);
  must(lines[0] === `\\text{${sName}: IQR ${fmt(si)}, against ${fmt(oi)}}`, `answer should be ${sName} with IQRs`, q);
  const e = /^\\text\{one score of (\d+) widens the range\}$/.exec(lines[1]);
  must(e, 'the explanation names a score', q);
  const extreme = Number(e[1]);
  must(extreme === Math.min(...sv) || extreme === Math.max(...sv), 'the named score is an end of that player\'s data', q);
  // Without it, the steady player's range is no longer the larger.
  const rest = [...sv]; rest.splice(rest.indexOf(extreme), 1);
  must(range(rest) <= range(ov), 'that one score is what makes the range mislead', q);
  q.workingOut.split('\n').forEach((l) => must(balances(l), `working "${l}" balances`, q));
  return { steady: sName };
}
