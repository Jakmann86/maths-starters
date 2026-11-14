// The checker for the modal-class and stem-and-leaf skills, shared by the
// harness (dataDisplayGenerators.test.js) and its mutation test. Test
// support only. Nothing is imported from the generator.
//
// A grouped table's classes and frequencies are read off the figure (a
// cumulative table is differenced first); a stem-and-leaf plot's values are
// read back from its stems and leaves. Each answer is recomputed from those.

import _ from 'lodash';
import { compiles } from '../number/latexArithmetic.check';

const fail = (msg, q) => { throw new Error(`${msg}\n${JSON.stringify(q)}`); };
const must = (cond, msg, q) => { if (!cond) fail(msg, q); };
// Tenths as printed: 45 -> "4.5", 40 -> "4".
const tenths = (t) => (t % 10 === 0 ? String(t / 10) : `${Math.trunc(t / 10)}.${Math.abs(t % 10)}`);

function common(q, topic, band) {
  must(q.metadata?.topic === topic && q.metadata?.difficulty === band, 'metadata', q);
  must(q.questionMath === undefined && q.answerUnits === undefined, 'everything is on the figure', q);
  must(typeof q.workingOut === 'string' && !q.workingOut.includes('\\n'), 'working uses real newlines', q);
  [q.answer, q.workingOut].forEach((s) => compiles(s));
}

/* ------------------------------------------------- modal and median class */

// Classes lo ≤ x < hi, contiguous and of equal width.
function readClasses(rows, q) {
  const cls = rows.map(([label]) => {
    const m = /^(\d+) ≤ x < (\d+)$/.exec(label);
    must(m, `a class interval: ${label}`, q);
    return [Number(m[1]), Number(m[2])];
  });
  const width = cls[0][1] - cls[0][0];
  must(width > 0, 'a class with width', q);
  cls.forEach(([lo, hi], i) => {
    must(hi - lo === width, 'equal-width classes', q);
    if (i) must(lo === cls[i - 1][1], 'contiguous classes', q);
  });
  return cls;
}

// Classes and frequencies, from a frequency table or (`fromCumulative`) a
// cumulative one, which is differenced.
function readGrouped(q, fromCumulative) {
  const f = q.visualization;
  must(f?.type === 'table' && f.header === 'row', 'a table with a header row', q);
  const [head, ...rows] = f.rows;
  let cls, fs;
  if (fromCumulative) {
    must(JSON.stringify(head) === '["Value","Cumulative frequency"]', 'a cumulative table', q);
    const ups = rows.map(([label]) => { const m = /^x < (\d+)$/.exec(label); must(m, `an upper bound: ${label}`, q); return Number(m[1]); });
    const width = ups[1] - ups[0];
    ups.forEach((u, i) => { if (i) must(u - ups[i - 1] === width, 'equal-width classes', q); });
    cls = ups.map((u) => [u - width, u]);
    const cum = rows.map(([, c]) => Number(c));
    fs = cum.map((c, i) => c - (i ? cum[i - 1] : 0));
    fs.forEach((v) => must(v > 0, 'cumulative frequencies rise', q));
  } else {
    must(JSON.stringify(head) === '["Value","Frequency"]', 'a frequency table', q);
    cls = readClasses(rows, q);
    fs = rows.map(([, v]) => Number(v));
    fs.forEach((v) => must(Number.isInteger(v) && v > 0, 'whole-number frequencies', q));
  }
  return { cls, fs, rows };
}

const tex = ([lo, hi]) => `${lo} \\le x < ${hi}`;

function medianClass(q, band) {
  common(q, 'median-class', band);
  const { cls, fs, rows } = readGrouped(q, band === 'stretch');
  const n = _.sum(fs);
  const cum = fs.map((_v, i) => _.sum(fs.slice(0, i + 1)));
  must(rows.length === (band === 'foundation' ? 4 : 5), 'four classes at Foundation, five above', q);
  if (band === 'foundation') must(n <= 30, 'a small total', q);
  if (band === 'core') must(n >= 50 && n <= 100, 'a larger total', q);
  must(q.instruction === 'Write down the class containing the median', 'instruction', q);
  // The median sits between the floor and ceiling of (n + 1)/2: both must
  // fall in one class, or there is no single class to name.
  const classOf = (k) => cum.findIndex((c) => c >= k);
  const [lo, hi] = [classOf(Math.floor((n + 1) / 2)), classOf(Math.ceil((n + 1) / 2))];
  must(lo === hi, 'the median falls inside one class', q);
  must(lo === 0 || cum[lo - 1] !== Math.floor((n + 1) / 2), 'the median is not the last value of the class before', q);
  if (band === 'stretch' && lo === 0) must(cls[0][0] === 0, 'a first class whose lower bound the table shows (it starts at 0)', q);
  must(q.answer === tex(cls[lo]), `answer ${q.answer}, expected ${tex(cls[lo])}`, q);
  const position = `n = ${n}, \\frac{n + 1}{2} = ${tenths(5 * (n + 1))}`;
  must(q.workingOut === (band === 'stretch' ? [position, tex(cls[lo])] : [position, `\\text{cumulative: } ${cum.join(', ')}`, tex(cls[lo])]).join('\n'), 'working: n, the position, the running totals', q);
  return { kind: band === 'stretch' ? 'from cumulative' : 'median class' };
}

function modalClass(q, band) {
  common(q, 'modal-class', band);
  const { cls, fs, rows } = readGrouped(q, band === 'stretch');
  must(band === 'core' ? rows.length === 6 : rows.length >= 4 && rows.length <= 5, 'six classes at Core, four or five otherwise', q);
  const peak = Math.max(...fs);
  must(fs.filter((v) => v === peak).length === 1, 'one tallest class', q);
  const mode = fs.indexOf(peak);
  if (band === 'core') must(peak - Math.max(...fs.filter((v) => v !== peak)) <= 2, 'a close second', q);

  must(q.instruction === 'Write down the modal class', 'instruction', q);
  if (band === 'stretch' && mode === 0) must(cls[0][0] === 0, 'a first class whose lower bound the table shows (it starts at 0)', q);
  must(q.answer === tex(cls[mode]), `answer ${q.answer}, expected ${tex(cls[mode])}`, q);
  const lines = band === 'stretch'
    ? [`\\text{frequencies: } ${fs.join(', ')}`, `\\text{the largest is } ${peak}`, tex(cls[mode])]
    : [`\\text{the largest frequency is } ${peak}`, tex(cls[mode])];
  must(q.workingOut === lines.join('\n'), `working:\n${q.workingOut}`, q);
  return { kind: band === 'stretch' ? 'from cumulative' : 'modal class' };
}

/* --------------------------------------------------------- stem and leaf */

function stemAndLeaf(q, band) {
  common(q, 'stem-and-leaf-averages', band);
  const f = q.visualization;
  must(f?.type === 'stem-leaf' && Array.isArray(f.rows), 'a stem-and-leaf plot', q);
  f.rows.forEach((r, i) => {
    must(Number.isInteger(r.stem) && r.stem >= 1, 'whole-number stems', q);
    if (i) must(r.stem === f.rows[i - 1].stem + 1, 'consecutive stems, none skipped', q);
    must(r.leaves.length >= 1 && r.leaves.length <= 9, 'one to nine leaves a row', q);
    r.leaves.forEach((l, j) => {
      must(Number.isInteger(l) && l >= 0 && l <= 9, 'single-digit leaves', q);
      if (j) must(l >= r.leaves[j - 1], 'leaves in order', q);
    });
  });
  must(f.rows.length >= 3, 'three or more stems', q);
  // The key reads as a real value on the plot.
  must(f.rows.some((r) => r.stem === f.keyStem && r.leaves.includes(f.keyLeaf)), 'the key is a value on the plot', q);
  const values = f.rows.flatMap((r) => r.leaves.map((l) => r.stem * 10 + l));
  const n = values.length;
  const lines = q.workingOut.split('\n');

  must(f.rows.length === 3, 'three stems', q);
  if (band !== 'stretch') {
    must(q.instruction === 'Find the median', 'instruction', q);
    const odd = n % 2 === 1;
    must(odd === (band === 'foundation'), band === 'foundation' ? 'an odd count' : 'an even count', q);
    if (band === 'foundation') must(n <= 11, 'a short plot', q);
    const med10 = odd ? 10 * values[(n - 1) / 2] : 5 * (values[n / 2 - 1] + values[n / 2]);
    if (!odd) must(values[n / 2 - 1] !== values[n / 2], 'the two middle values differ, so they are averaged', q);
    must(q.answer === tenths(med10), `answer ${q.answer}, expected ${tenths(med10)}`, q);
    const last = odd ? `\\text{median} = ${tenths(med10)}` : `\\text{median} = \\frac{${values[n / 2 - 1]} + ${values[n / 2]}}{2} = ${tenths(med10)}`;
    must(q.workingOut === [`n = ${n}, \\frac{n + 1}{2} = ${tenths(5 * (n + 1))}`, last].join('\n'), 'working', q);
    return { kind: odd ? 'odd n' : 'even n' };
  }

  must(q.instruction === 'Find the mean', 'instruction', q);
  must(n >= 15, 'fifteen or more values', q);
  const total = _.sum(values);
  must((10 * total) % n === 0, 'the mean is exact to 1 d.p.', q);
  const mean = tenths((10 * total) / n);
  must(q.answer === mean, `answer ${q.answer}, expected ${mean}`, q);
  must(lines.length === 3 && lines[0] === `\\text{values: } ${values.join(', ')}` && lines[1] === `\\text{sum} = ${total}`
    && lines[2] === `\\text{mean} = \\frac{${total}}{${n}} = ${mean}`, 'working: the values, their sum, the mean', q);
  return { kind: Number.isInteger(total / n) ? 'whole mean' : '1 d.p. mean' };
}

export function checkDataDisplay(q, band) {
  if (q.metadata?.topic === 'modal-class') return modalClass(q, band);
  if (q.metadata?.topic === 'median-class') return medianClass(q, band);
  if (q.metadata?.topic === 'stem-and-leaf-averages') return stemAndLeaf(q, band);
  return fail(`topic ${q.metadata?.topic}`, q);
}
