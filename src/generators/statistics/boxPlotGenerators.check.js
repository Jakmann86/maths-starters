// The checker for five-number-summary and box-plot-reading, shared by the
// harness (boxPlotGenerators.test.js) and the mutation test
// (boxPlotGenerators.mutation.test.js). Test support only.
//
// Everything is read back off the board: the printed list or the table for
// a summary, the drawn plot and the sentence for a reading. Statistics are
// recomputed with this file's own Haese quartiles; nothing is imported from
// the generator.

const fail = (msg, q) => { throw new Error(`${msg}\n${JSON.stringify(q)}`); };
const must = (cond, msg, q) => { if (!cond) fail(msg, q); };

const asc = (xs) => [...xs].sort((a, b) => a - b);
const med = (s) => (s.length % 2 ? s[(s.length - 1) / 2] : (s[s.length / 2 - 1] + s[s.length / 2]) / 2);
const five = (values) => {
  const s = asc(values);
  const k = Math.floor(s.length / 2);
  return { min: s[0], q1: med(s.slice(0, k)), q2: med(s), q3: med(s.slice(s.length - k)), max: s.at(-1) };
};
const fmt = (x) => String(Number(x.toFixed(2)));
const sorted = (xs) => xs.every((x, i) => i === 0 || xs[i - 1] <= x);
const KEYS = ['min', 'q1', 'q2', 'q3', 'max'];
const sameFive = (p, f) => KEYS.every((k) => p[k] === f[k]);

// The axis is sound and holds the plot: a whole number of steps, labels on
// whole steps, every value inside it.
function checkAxis(axis, plot, q, onGrid) {
  must(axis && axis.max > axis.min && axis.step > 0 && axis.every >= 1 && typeof axis.title === 'string', 'an axis', q);
  const steps = (axis.max - axis.min) / axis.step;
  must(Number.isInteger(steps) && steps <= 60, 'a whole number of steps, not too many gridlines', q);
  KEYS.forEach((k) => must(plot[k] >= axis.min && plot[k] <= axis.max, `${k} inside the axis`, q));
  for (let i = 1; i < KEYS.length; i += 1) must(plot[KEYS[i - 1]] < plot[KEYS[i]], 'five values in increasing order', q);
  if (onGrid) KEYS.forEach((k) => must(Number.isInteger((plot[k] - axis.min) / axis.step), `${k} on a gridline`, q));
}

/* ------------------------------------------------- five-number-summary */

const SUMMARY_SENTENCE = /^Find the five-number summary of (?:the marks of (\d+) students in a test out of 40|the times, in minutes, that (\d+) students took to get to school|the ages of (\d+) people at a party|the numbers of books read by (\d+) students last year|the heights, in cm, of (\d+) seedlings)\. Draw a box plot\.$/;

const ANSWER = /^\\text\{min\} = (\d+(?:\.\d+)?),\\ \\text\{max\} = (\d+(?:\.\d+)?)\nQ_1 = (\d+(?:\.\d+)?),\\ Q_2 = (\d+(?:\.\d+)?),\\ Q_3 = (\d+(?:\.\d+)?)$/;
const readAnswer = (q) => {
  const m = ANSWER.exec(q.answer);
  must(m, `answer "${q.answer}"`, q);
  const [min, max, q1, q2, q3] = m.slice(1).map(Number);
  return { min, q1, q2, q3, max };
};

export function checkSummary(q, difficulty) {
  must(q.metadata?.topic === 'five-number-summary' && q.metadata?.difficulty === difficulty, 'metadata', q);
  must(q.answerUnits === undefined, 'no units', q);
  let data;
  if (difficulty === 'stretch') {
    must(q.questionMath === undefined, 'the table carries the data', q);
    must(/^The table shows .+\. Find the five-number summary\.$/.test(q.instruction), 'stretch instruction', q);
    const f = q.visualization;
    must(f?.type === 'table' && f.header === 'column' && f.rows.length === 2, 'a two-row table', q);
    const [xr, fr] = f.rows;
    must(fr[0] === 'Frequency', 'second row is frequency', q);
    const xs = xr.slice(1).map(Number), fs = fr.slice(1).map(Number);
    must(xs.every(Number.isInteger) && fs.every((x) => Number.isInteger(x) && x >= 1), 'whole numbers, every frequency at least 1', q);
    must(sorted(xs) && new Set(xs).size === xs.length, 'values in order', q);
    data = xs.flatMap((x, i) => Array(fs[i]).fill(x));
    must(data.length >= 15 && data.length <= 35, 'a class-sized total', q);
  } else {
    const m = SUMMARY_SENTENCE.exec(q.instruction);
    must(m, `instruction "${q.instruction}"`, q);
    const n = Number(m.slice(1).find(Boolean));
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
  const want = five(data);
  if (difficulty === 'foundation') must(data.includes(want.q1) && data.includes(want.q3), 'foundation quartiles are data values', q);
  const got = readAnswer(q);
  must(sameFive(got, want), `answer should be ${JSON.stringify(want)}`, q);
  must(want.q1 < want.q2 && want.q2 < want.q3, 'a box with a median inside it', q);

  // The working names each quartile as recomputed.
  const w = q.workingOut.split('\n');
  ['Q_1', 'Q_3'].forEach((name, i) => {
    const v = fmt(i ? want.q3 : want.q1);
    must(w.some((l) => l.endsWith(`${name} = ${v}`)), `working names ${name} = ${v}`, q);
  });

  if (difficulty === 'stretch') return want;
  // The plot drawn on reveal is the summary, on a scale that holds it.
  must(new Set(KEYS.map((k) => want[k])).size === 5, 'five different values', q);
  const f = q.visualization;
  must(f?.type === 'box-plot' && f.reveal === true && f.plots.length === 1 && !f.marks, 'one plot, drawn on reveal', q);
  must(sameFive(f.plots[0], want), 'the drawn plot is the summary', q);
  checkAxis(f.axis, f.plots[0], q, false);
  return want;
}

/* ---------------------------------------------------- box-plot-reading */

const ONE = /^The box plot shows (?:the marks of some students in a test|the times, in minutes, that some runners took to finish a race|the heights, in cm, of some sunflower seedlings|the ages of the people at a concert)\. Find the (median|range|interquartile range)\.$/;

// Core: the sentence names the group size, the count noun, and a threshold
// with the side it is on.
const SIDES = [
  [/^the marks of (\d+) students in a test\. About how many students scored (more|fewer) than (\d+) marks\?$/, { fewer: 'less' }],
  [/^the times, in minutes, that (\d+) runners took to finish a race\. About how many runners took (longer|less) than (\d+) minutes\?$/, { longer: 'more' }],
  [/^the heights, in cm, of (\d+) sunflower seedlings\. About how many seedlings were (taller|shorter) than (\d+) cm\?$/, { taller: 'more', shorter: 'less' }],
  [/^the ages of (\d+) people at a concert\. About how many people were (older|younger) than (\d+)\?$/, { older: 'more', younger: 'less' }],
];

const TWO = [
  { re: /^The box plots show the points scored by two basketball players in each game of a season\.$/, who: 'Who', ask: 'scored more points on average', better: 'higher' },
  { re: /^The box plots show the marks of two classes in the same test\.$/, who: 'Which class', ask: 'did better on average', better: 'higher' },
  { re: /^The box plots show the times, in minutes, two runners took in each race of a season\.$/, who: 'Who', ask: 'was faster on average', better: 'lower' },
];

export function checkReading(q, difficulty) {
  must(q.metadata?.topic === 'box-plot-reading' && q.metadata?.difficulty === difficulty, 'metadata', q);
  must(q.answerUnits === undefined && q.questionMath === undefined, 'the plot carries the data', q);
  const f = q.visualization;
  must(f?.type === 'box-plot' && !f.reveal && f.big === true, 'a big box plot, shown with the question', q);
  f.plots.forEach((p) => checkAxis(f.axis, p, q, true));
  const marked = (f.marks || []).map((m) => `${m.plot}:${m.value}`).sort();
  const w = q.workingOut.split('\n');

  if (difficulty === 'foundation') {
    must(f.plots.length === 1 && !f.plots[0].name, 'one unnamed plot', q);
    const p = f.plots[0];
    const m = ONE.exec(q.instruction);
    must(m, `instruction "${q.instruction}"`, q);
    const [want, marks] = {
      median: [p.q2, [p.q2]],
      range: [p.max - p.min, [p.min, p.max]],
      'interquartile range': [p.q3 - p.q1, [p.q1, p.q3]],
    }[m[1]];
    must(q.answer === fmt(want), `answer ${q.answer} should be ${fmt(want)}`, q);
    must(JSON.stringify(marked) === JSON.stringify(marks.map((v) => `0:${v}`).sort()), 'reading lines at the values used', q);
    must(w.at(-1).endsWith(`= ${fmt(want)}`), 'working ends on the answer', q);
    return { ask: m[1], want };
  }

  if (difficulty === 'core') {
    must(f.plots.length === 1 && !f.plots[0].name, 'one unnamed plot', q);
    const p = f.plots[0];
    const head = 'The box plot shows ';
    must(q.instruction.startsWith(head), 'core instruction', q);
    const rest = q.instruction.slice(head.length);
    const hit = SIDES.map(([re, map]) => [re.exec(rest), map]).find(([m]) => m);
    must(hit, `instruction "${q.instruction}"`, q);
    const [m, map] = hit;
    const N = Number(m[1]);
    const side = map[m[2]] || m[2];
    const v = Number(m[3]);
    must(N % 4 === 0, 'a group that splits into quarters', q);
    const at = ['q1', 'q2', 'q3'].filter((k) => p[k] === v);
    must(at.length === 1, `the threshold ${v} is one of the quartiles`, q);
    const below = { q1: 1, q2: 2, q3: 3 }[at[0]];
    const quarters = side === 'less' ? below : 4 - below;
    must(q.answer === String((N * quarters) / 4), `answer ${q.answer} should be ${(N * quarters) / 4}`, q);
    must(JSON.stringify(marked) === JSON.stringify([`0:${v}`]), 'a reading line at the threshold', q);
    // The working names the quartile, the fraction and the side the
    // sentence asks about: at the median the count is the same either way,
    // so only the working can be wrong about the side.
    const frac = quarters === 2 ? '\\tfrac{1}{2}' : `\\tfrac{${quarters}}{4}`;
    const qname = { q1: 'Q_1', q2: '\\text{the median}', q3: 'Q_3' }[at[0]];
    const count = /How many (\w+)/i.exec(q.instruction)[1];
    const where = side === 'more' ? 'are above' : 'are below';
    must(w[0] === `${v} \\text{ is } ${qname} \\text{, so } ${frac} \\text{ of the ${count} ${where} it}`, 'working names the quartile, fraction and side', q);
    must(w.at(-1) === `${frac} \\times ${N} = ${(N * quarters) / 4}`, 'working ends on the answer', q);
    return { quarters };
  }

  // Stretch: two named plots, who did better on average and who was more
  // consistent; the more consistent one by the IQR has the larger range.
  const ctx = TWO.find((c) => c.re.test(q.instruction));
  must(ctx, `instruction "${q.instruction}"`, q);
  must(f.plots.length === 2 && f.plots.every((p) => p.name) && f.plots[0].name !== f.plots[1].name, 'two named plots', q);
  must(!f.marks, 'no reading lines', q);
  must(JSON.stringify(q.questionParts) === JSON.stringify([`(a) ${ctx.who} ${ctx.ask}?`, `(b) ${ctx.who} was more consistent?`]), 'stretch parts', q);
  const [pa, pb] = f.plots;
  const st = f.axis.step;
  const iqr = (p) => p.q3 - p.q1, rng = (p) => p.max - p.min;
  must(Math.abs(pa.q2 - pb.q2) >= 3 * st && Math.abs(iqr(pa) - iqr(pb)) >= 3 * st, 'clear differences', q);
  const best = (ctx.better === 'higher') === (pa.q2 > pb.q2) ? pa : pb;
  const steady = iqr(pa) < iqr(pb) ? pa : pb;
  const other = (p) => (p === pa ? pb : pa);
  must(rng(steady) >= rng(other(steady)) + 2 * st, 'the trap: the steadier one has the larger range', q);
  const lines = q.answer.split('\n');
  must(lines[0] === `\\text{(a) ${best.name}: median ${fmt(best.q2)}, against ${fmt(other(best).q2)}}`, `(a) should be ${best.name}`, q);
  must(lines[1] === `\\text{(b) ${steady.name}: IQR ${fmt(iqr(steady))}, against ${fmt(iqr(other(steady)))}}`, `(b) should be ${steady.name}`, q);
  must(lines.length === 2, 'two answer lines', q);
  [pa, pb].forEach((p) => {
    const want = `\\text{${p.name}: median } ${fmt(p.q2)} \\text{, IQR } ${fmt(p.q3)} - ${fmt(p.q1)} = ${fmt(iqr(p))} \\text{, range } ${fmt(rng(p))}`;
    must(w.includes(want), `working for ${p.name} should read ${want}`, q);
  });
  return { best: best.name, steady: steady.name };
}
