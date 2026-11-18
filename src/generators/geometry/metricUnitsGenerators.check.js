// Test support only. Recomputes every Metric units answer from what is
// printed: the amount and the two units in the question, the prose of a
// problem, or a shape's edge labels off its figure config. Units are read
// into one common unit per kind (the table in ratioGenerators.check.js),
// so a conversion is checked by its size, not by the factor the generator
// used. Every working line must hold in those units.

import { UNITS, lineHolds, read } from '../number/ratioGenerators.check';

const must = (cond, msg) => { if (!cond) throw new Error(msg); };
const close = (a, b) => Number.isFinite(a) && Math.abs(a - b) <= 1e-9 * Math.max(1, Math.abs(a), Math.abs(b));
const lines = (s) => String(s ?? '').split('\n');
const num = (v) => String(Number(v.toFixed(6)));

// Each kind's units, smallest first: neighbours are one step apart.
const LADDERS = [['mm', 'cm', 'm', 'km'], ['g', 'kg', 'tonnes'], ['ml', 'litres']];
const steps = (a, b) => {
  const L = LADDERS.find((l) => l.includes(a) && l.includes(b));
  must(L, `units of one kind: ${a}, ${b}`);
  return Math.abs(L.indexOf(a) - L.indexOf(b));
};

function common(q, topic, band) {
  must(q.metadata?.topic === topic && q.metadata.difficulty === band, 'metadata');
  must(typeof q.workingOut === 'string' && !q.workingOut.includes('\\n'), 'real newlines');
  must(!/\d/.test(q.instruction), `no digits in the instruction: ${q.instruction}`);
  const w = lines(q.workingOut);
  w.forEach(lineHolds);
  must(w.at(-1).endsWith(`= ${q.answer}`), 'the working ends on the answer');
  return w;
}

/** "4.2\text{ km} \to \text{m}", or with \ \text{cm}^2 units: amount, from, to. */
function conversion(tex) {
  const m = /^([\d.]+)(\\ \\text\{[a-z]+\}\^[23]|\\ \\text\{litres\}|\\text\{ [a-z]+\}) \\to (\\text\{[a-z]+\}(?:\^[23])?)$/.exec(tex ?? '');
  must(m, `a conversion: ${tex}`);
  const key = (u) => u.replace(/\\ /g, '').replace(/\\text\{ ?([a-z]+)\}/, '$1');
  const from = key(m[2]), to = key(m[3]);
  must(UNITS[from] && UNITS[to] && UNITS[from][0] === UNITS[to][0] && from !== to, `two units of one kind: ${from}, ${to}`);
  const x = Number(m[1]);
  return { x, from, to, toTex: m[3], value: x * UNITS[from][1] / UNITS[to][1], given: read(`${m[1]}${m[2]}`) };
}

/* -------------------------------------------------------- convert-units */

export function checkConvertUnits(q, band) {
  const w = common(q, 'convert-units', band);
  must(!q.visualization, 'no figure');

  if (band !== 'stretch') {
    must(q.instruction === 'Convert' && !q.questionText, 'instruction');
    const c = conversion(q.questionMath);
    must(['length', 'mass', 'volume'].includes(UNITS[c.from][0]) && !c.from.includes('^'), 'length, mass or capacity');
    must(steps(c.from, c.to) === (band === 'foundation' ? 1 : 2), `${band === 'foundation' ? 'one step' : 'two steps'}: ${c.from} to ${c.to}`);
    must(q.answer === num(c.value) && q.answerUnits === c.to, `answer ${q.answer} ${q.answerUnits}, expected ${num(c.value)} ${c.to}`);
    must(w.length === 2 && w[1].startsWith(`${num(c.x)} `), 'the rule, then the calculation');
    must(c.x !== 1 && c.value !== 1, 'never one unit: it reads as a definition');
    return { kind: UNITS[c.to][1] < UNITS[c.from][1] ? 'to a smaller unit' : 'to a larger unit' };
  }

  must(q.instruction === 'Find how many' && !q.questionMath, 'a problem in words');
  const t = q.questionText;
  const PATTERNS = [
    ['length', /^An? ([\d.]+) m plank of wood is cut into (\d+) cm pieces\. How many pieces are there\?$/, 'm', 'cm', 'pieces'],
    ['capacity', /^A jug holds ([\d.]+) litres of water\. How many (\d+) ml glasses can it fill\?$/, 'litres', 'ml', 'glasses'],
    ['mass', /^An? ([\d.]+) kg sack of rice is packed into (\d+) g bags\. How many bags are there\?$/, 'kg', 'g', 'bags'],
  ];
  for (const [kind, re, big, small, things] of PATTERNS) {
    const m = re.exec(t);
    if (!m) continue;
    if (kind !== 'capacity') must(t.startsWith(/^(8|11|18)(\.|$)/.test(m[1]) ? 'An ' : 'A '), 'a or an');
    const count = Number(m[1]) * UNITS[big][1] / (Number(m[2]) * UNITS[small][1]);
    must(Number.isInteger(Math.round(count * 1e9) / 1e9) && close(count, Math.round(count)), 'a whole number of them');
    must(q.answer === String(Math.round(count)) && q.answerUnits === things, `answer ${q.answer}, expected ${count}`);
    must(w.length === 2 && w[0].startsWith(`${m[1]}\\text{ ${big}} = `), 'the conversion first');
    return { kind };
  }
  return must(false, `a problem the skill sets: ${t}`);
}

/* -------------------------------------------------- convert-area-volume */

const lengthOf = (label) => {
  const m = /^([\d.]+) (cm|m)$/.exec(label ?? '');
  must(m, `an edge label: ${label}`);
  return { cm: Number(m[1]) * UNITS[m[2]][1] / 10, unit: m[2] };
};

export function checkConvertAreaVolume(q, band) {
  const w = common(q, 'convert-area-volume', band);

  if (band !== 'stretch') {
    must(q.instruction === 'Convert' && !q.visualization, 'instruction');
    const c = conversion(q.questionMath);
    const kind = UNITS[c.from][0];
    must(q.answer === num(c.value) && q.answerUnits === c.toTex, `answer ${q.answer} ${q.answerUnits}, expected ${num(c.value)} ${c.toTex}`);
    must(c.x !== 1 && c.value !== 1 && w.length === 2, 'never one unit; the rule then the calculation');
    if (band === 'foundation') {
      must(kind === 'area', 'area units');
      // Neighbouring length units, squared.
      must(steps(c.from.replace('^2', ''), c.to.replace('^2', '')) === 1, 'one length step');
      return { kind: UNITS[c.to][1] < UNITS[c.from][1] ? 'to a smaller unit' : 'to a larger unit' };
    }
    must(kind === 'volume', 'volume or capacity');
    const litres = [c.from, c.to].includes('litres');
    if (!litres) must(steps(c.from.replace('^3', ''), c.to.replace('^3', '')) === 1, 'one length step, cubed');
    else must(['cm^3', 'm^3'].includes(litres && c.from === 'litres' ? c.to : c.from), 'litres with cm³ or m³');
    return { kind: litres ? 'volume to capacity' : 'volume units' };
  }

  const f = q.visualization;
  must(!q.questionMath && !q.questionText, 'the figure carries the question');
  if (f?.type === 'rectangle') {
    must(q.instruction === 'Find the area of the rectangle, in square centimetres', 'instruction');
    const [a, b] = [lengthOf(f.l), lengthOf(f.w)];
    must(new Set([a.unit, b.unit]).size === 2, 'one side in metres, one in centimetres');
    const v = a.cm * b.cm;
    must(Number.isInteger(v) && q.answer === String(v) && q.answerUnits === '\\text{cm}^2', `answer ${q.answer}, expected ${v}`);
    return { kind: 'rectangle' };
  }
  must(f?.type === 'cuboid' && !f.unknown, 'a rectangle or a tank');
  must(q.instruction === 'Find how many litres the tank holds', 'instruction');
  const edges = [f.l, f.d, f.h].map(lengthOf);
  must(edges.filter((e) => e.unit === 'm').length === 1, 'one edge in metres, two in centimetres');
  const litres = edges.reduce((v, e) => v * e.cm, 1) / 1000;
  must(q.answer === num(litres) && q.answerUnits === 'litres', `answer ${q.answer}, expected ${num(litres)}`);
  must(w.length === 3 && w[2].startsWith(`${num(litres * 1000)} \\div 1000`), 'cm³ to litres last');
  return { kind: 'tank' };
}
