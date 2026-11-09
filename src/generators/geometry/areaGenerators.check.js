// The checker for the area skills (rectangle, triangle, parallelogram,
// trapezium, kite), shared by the harness (areaGenerators.test.js) and its
// mutation test. Test support only.
//
// Every answer is recomputed from the figure's labels. A distractor (a
// rectangle's diagonal, a sloping side) must also fit the shape as drawn:
// a diagonal obeys Pythagoras, and a sloping side is longer than the height
// and leans no further than the drawing lets it (the foot of the height
// lands on the base). Nothing is imported from the generator.

import { compiles } from '../number/latexArithmetic.check';

const fail = (msg, q) => { throw new Error(`${msg}\n${JSON.stringify(q)}`); };
const must = (cond, msg, q) => { if (!cond) fail(msg, q); };
const UNITS = ['cm', 'm', 'mm'];

// Reads every label on the figure in one unit: lengths "7 cm", the area
// "35 cm²", and "x" (or "x + 3" for a kite's diagonal).
function reader(f, q) {
  let unit = null;
  const unitIs = (u) => {
    must(UNITS.includes(u), `unit ${u}`, q);
    must(unit === null || unit === u, 'one unit throughout the figure', q);
    unit = u;
  };
  return {
    len(label) {
      if (label === 'x') return 'x';
      const m = /^(\d+) (cm|m|mm)$/.exec(label ?? '');
      must(m, `a whole-number length: ${label}`, q);
      unitIs(m[2]);
      return Number(m[1]);
    },
    area(label) {
      const m = /^(\d+) (cm|m|mm)²$/.exec(label ?? '');
      must(m, `a whole-number area: ${label}`, q);
      unitIs(m[2]);
      return Number(m[1]);
    },
    get unit() { return unit; },
  };
}

// The keys a figure may carry, and that only the expected ones are set.
function keys(f, allowed, q) {
  Object.keys(f).filter((k) => !['type', 'unknown', 'big'].includes(k)).forEach((k) => {
    must(allowed.includes(k), `no ${k} label here`, q);
  });
}

function common(q, topic, band, type) {
  must(q.metadata?.topic === topic && q.metadata?.difficulty === band, 'metadata', q);
  must(q.questionMath === undefined, 'a forward question: everything is on the figure', q);
  must(typeof q.workingOut === 'string' && !q.workingOut.includes('\\n'), 'working uses real newlines', q);
  [q.answer, q.workingOut].forEach((s) => compiles(s));
  must(q.visualization?.type === type, `a ${type} figure`, q);
  return q.visualization;
}

// An area answer: the number alone, in square units.
function areaAnswer(q, A, unit) {
  must(q.answer === String(A), `answer ${q.answer}, expected ${A}`, q);
  must(q.answerUnits === `\\text{${unit}}^2`, `answer in ${unit}²`, q);
}
// A length answer: x = n, in the figure's unit.
function lengthAnswer(q, x, unit) {
  must(Number.isInteger(x) && x > 0, `a whole-number length (${x})`, q);
  must(q.answer === `x = ${x}`, `answer ${q.answer}, expected x = ${x}`, q);
  must(q.answerUnits === `\\text{${unit}}`, `answer in ${unit}`, q);
}
const working = (q, lines) => must(q.workingOut === lines.join('\n'), `working:\n${q.workingOut}\nexpected:\n${lines.join('\n')}`, q);

// A sloping side s beside a height h leans sqrt(s^2 - h^2) along the base;
// it must be longer than the height and lean less than `room`.
function slopes(s, h, room, q) {
  must(s > h, `the sloping side ${s} is longer than the height ${h}`, q);
  must(s * s - h * h < room * room, `the sloping side ${s} leans less than ${room} beside a height of ${h}`, q);
}

/* ------------------------------------------------------------------ shapes */

function rectangle(q, band) {
  const f = common(q, 'area-rectangle', band, 'rectangle');
  const r = reader(f, q);
  if (band === 'stretch') {
    keys(f, ['l', 'w', 'area'], q);
    must(q.instruction === 'Find the missing length', 'instruction', q);
    const [l, w, A] = [r.len(f.l), r.len(f.w), r.area(f.area)];
    const unknown = l === 'x' ? 'l' : 'w';
    must((l === 'x') !== (w === 'x') && f.unknown === unknown, 'one side x, coloured', q);
    const known = unknown === 'l' ? w : l;
    const x = A / known;
    lengthAnswer(q, x, r.unit);
    working(q, [`l \\times w = ${A}`, `x = ${A} \\div ${known}`, `x = ${x}`]);
    return { kind: `find ${unknown}` };
  }
  must(q.instruction === 'Find the area of the rectangle', 'instruction', q);
  keys(f, band === 'core' ? ['l', 'w', 'diagonal'] : ['l', 'w'], q);
  const [l, w] = [r.len(f.l), r.len(f.w)];
  must(l !== 'x' && w !== 'x', 'both sides given', q);
  const lines = ['A = l \\times w', `A = ${l} \\times ${w}`, `A = ${l * w}`];
  if (band === 'core') {
    const d = r.len(f.diagonal);
    must(d * d === l * l + w * w, `the diagonal ${d} fits a ${l} by ${w} rectangle`, q);
    lines.push('\\text{the diagonal is not needed}');
  }
  areaAnswer(q, l * w, r.unit);
  working(q, lines);
  return { kind: band === 'core' ? 'with diagonal' : 'plain' };
}

function triangle(q, band) {
  const f = common(q, 'area-triangle', band, 'triangle-area');
  const r = reader(f, q);
  const half = '\\frac{1}{2} \\times';
  if (band === 'stretch') {
    keys(f, ['b', 'h', 'area'], q);
    must(q.instruction === 'Find the perpendicular height', 'instruction', q);
    const [b, A] = [r.len(f.b), r.area(f.area)];
    must(f.h === 'x' && f.unknown === 'h', 'the height is x, coloured', q);
    const x = (2 * A) / b;
    lengthAnswer(q, x, r.unit);
    working(q, [`${half} b \\times h = ${A}`, `${half} ${b} \\times x = ${A}`, `x = ${2 * A} \\div ${b} = ${x}`]);
    return { kind: 'find h' };
  }
  must(q.instruction === 'Find the area of the triangle', 'instruction', q);
  keys(f, band === 'core' ? ['b', 'h', 'slant'] : ['b', 'h'], q);
  const [b, h] = [r.len(f.b), r.len(f.h)];
  must(b !== 'x' && h !== 'x', 'base and height given', q);
  const A = (b * h) / 2;
  must(Number.isInteger(A), 'a whole-number area', q);
  const lines = [`A = ${half} b \\times h`, `A = ${half} ${b} \\times ${h}`, `A = ${A}`];
  if (band === 'core') {
    // The sloping side drawn is the left one, from the base's left end to
    // the apex; the height's foot is on the base, so it leans less than b.
    slopes(r.len(f.slant), h, b, q);
    lines.push('\\text{the sloping side is not needed}');
  }
  areaAnswer(q, A, r.unit);
  working(q, lines);
  return { kind: band === 'core' ? 'with sloping side' : 'plain' };
}

function parallelogram(q, band) {
  const f = common(q, 'area-parallelogram', band, 'parallelogram');
  const r = reader(f, q);
  if (band === 'stretch') {
    keys(f, ['b', 'h', 'area'], q);
    must(q.instruction === 'Find the perpendicular height', 'instruction', q);
    const [b, A] = [r.len(f.b), r.area(f.area)];
    must(f.h === 'x' && f.unknown === 'h', 'the height is x, coloured', q);
    const x = A / b;
    lengthAnswer(q, x, r.unit);
    working(q, [`b \\times h = ${A}`, `${b} \\times x = ${A}`, `x = ${A} \\div ${b} = ${x}`]);
    return { kind: 'find h' };
  }
  must(q.instruction === 'Find the area of the parallelogram', 'instruction', q);
  keys(f, band === 'core' ? ['b', 'h', 'slant'] : ['b', 'h'], q);
  const [b, h] = [r.len(f.b), r.len(f.h)];
  must(b !== 'x' && h !== 'x', 'base and height given', q);
  const lines = ['A = b \\times h', `A = ${b} \\times ${h}`, `A = ${b * h}`];
  if (band === 'core') {
    // The height is dropped from the top-left corner onto the base, so the
    // left side leans less than the base is long.
    slopes(r.len(f.slant), h, b, q);
    lines.push('\\text{the sloping side is not needed}');
  }
  areaAnswer(q, b * h, r.unit);
  working(q, lines);
  return { kind: band === 'core' ? 'with sloping side' : 'plain' };
}

function trapezium(q, band) {
  const f = common(q, 'area-trapezium', band, 'trapezium-area');
  const r = reader(f, q);
  if (band === 'stretch') {
    keys(f, ['a', 'b', 'h', 'area'], q);
    must(q.instruction === 'Find the length of the other parallel side', 'instruction', q);
    const [a, h, A] = [r.len(f.a), r.len(f.h), r.area(f.area)];
    must(f.b === 'x' && f.unknown === 'b', 'the bottom side is x, coloured', q);
    const x = (2 * A) / h - a;
    lengthAnswer(q, x, r.unit);
    must(x > a, 'the bottom side is the longer, as drawn', q);
    working(q, ['\\frac{1}{2}(a + b) \\times h = ' + A, `(${a} + x) \\times ${h} = ${2 * A}`, `${a} + x = ${(2 * A) / h}`, `x = ${x}`]);
    return { kind: 'find b' };
  }
  must(q.instruction === 'Find the area of the trapezium', 'instruction', q);
  keys(f, band === 'core' ? ['a', 'b', 'h', 'slant'] : ['a', 'b', 'h'], q);
  const [a, b, h] = [r.len(f.a), r.len(f.b), r.len(f.h)];
  must(a !== 'x' && b !== 'x' && h !== 'x', 'both parallel sides and the height given', q);
  must(b > a, 'the bottom side is the longer, as drawn', q);
  const A = ((a + b) * h) / 2;
  must(Number.isInteger(A), 'a whole-number area', q);
  const lines = ['A = \\frac{1}{2}(a + b) \\times h', `A = \\frac{1}{2}(${a} + ${b}) \\times ${h}`, `A = ${A}`];
  if (band === 'core') {
    // Both sides lean outward as drawn, so the right one (the labelled
    // one) leans less than the whole overhang b - a.
    slopes(r.len(f.slant), h, b - a, q);
    lines.push('\\text{the sloping side is not needed}');
  }
  areaAnswer(q, A, r.unit);
  working(q, lines);
  return { kind: band === 'core' ? 'with sloping side' : 'plain' };
}

function kite(q, band) {
  const f = common(q, 'area-kite', band, 'kite');
  const r = reader(f, q);
  keys(f, band === 'foundation' ? ['d1', 'd2'] : ['d1', 'd2', 'area'], q);
  if (band === 'foundation') {
    must(q.instruction === 'Find the area of the kite', 'instruction', q);
    const [d1, d2] = [r.len(f.d1), r.len(f.d2)];
    must(d1 !== 'x' && d2 !== 'x', 'both diagonals given', q);
    const A = (d1 * d2) / 2;
    must(Number.isInteger(A), 'a whole-number area', q);
    areaAnswer(q, A, r.unit);
    working(q, ['A = \\frac{1}{2} \\times d_1 \\times d_2', `A = \\frac{1}{2} \\times ${d1} \\times ${d2}`, `A = ${A}`]);
    return { kind: 'plain' };
  }
  const A = r.area(f.area);
  if (band === 'core') {
    must(q.instruction === 'Find the length of the other diagonal', 'instruction', q);
    const d1 = r.len(f.d1);
    must(f.d2 === 'x' && f.unknown === 'd2', 'one diagonal x, coloured', q);
    const x = (2 * A) / d1;
    lengthAnswer(q, x, r.unit);
    working(q, [`\\frac{1}{2} \\times d_1 \\times d_2 = ${A}`, `${d1} \\times x = ${2 * A}`, `x = ${2 * A} \\div ${d1} = ${x}`]);
    return { kind: 'find a diagonal' };
  }
  // Stretch: d1 = x, d2 = x + k; x(x + k) = 2A has one positive root.
  must(q.instruction === 'Find the length of the shorter diagonal', 'instruction', q);
  must(f.d1 === 'x' && f.unknown === 'd1', 'the shorter diagonal is x, coloured', q);
  const m = /^x \+ (\d+)$/.exec(f.d2 ?? '');
  must(m && Number(m[1]) > 0, `the other diagonal is x + k: ${f.d2}`, q);
  const k = Number(m[1]);
  const x = (-k + Math.sqrt(k * k + 8 * A)) / 2;
  lengthAnswer(q, x, r.unit);
  working(q, [`\\frac{1}{2} \\times x \\times (x + ${k}) = ${A}`, `x^2 + ${k === 1 ? '' : k}x = ${2 * A}`, `x = ${x}`]);
  return { kind: 'quadratic' };
}

const SHAPES = { 'area-rectangle': rectangle, 'area-triangle': triangle, 'area-parallelogram': parallelogram, 'area-trapezium': trapezium, 'area-kite': kite };

export function checkArea(q, band) {
  const check = SHAPES[q.metadata?.topic];
  if (!check) return fail(`topic ${q.metadata?.topic}`, q);
  return check(q, band);
}
