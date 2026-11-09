// The checker for the Pythagoras skills, shared by the harness
// (pythagorasGenerators.test.js) and its mutation test. Test support only.
//
// Every answer is recomputed from the figure's labels: the right-triangle
// figure has its right angle between leg a (the vertical side) and leg b
// (the base), with c the hypotenuse; the isosceles figure's height bisects
// its base. Nothing is imported from the generator.

import { compiles } from '../number/latexArithmetic.check';

const fail = (msg, q) => { throw new Error(`${msg}\n${JSON.stringify(q)}`); };
const must = (cond, msg, q) => { if (!cond) fail(msg, q); };

const isSquare = (n) => Number.isInteger(Math.sqrt(n));

// "7 cm" -> 7; "x" -> 'x'. Every length on these figures is a whole number
// of centimetres.
function length(label, q) {
  if (label === 'x') return 'x';
  const m = /^(\d+) cm$/.exec(label ?? '');
  must(m, `a length label in cm: ${label}`, q);
  return Number(m[1]);
}

// The answer to x^2 = s in the band's form: Foundation a whole number,
// Core the exact surd, Stretch 3 significant figures.
function expectedRoot(s, band, q) {
  must(Number.isInteger(s) && s > 0, `x^2 = ${s} is a positive whole number`, q);
  if (band === 'foundation') {
    must(isSquare(s), `Foundation is a whole-number answer (x^2 = ${s})`, q);
    return { value: String(Math.sqrt(s)), last: `x = ${Math.sqrt(s)}` };
  }
  must(!isSquare(s), `Core and Stretch are not a whole number (x^2 = ${s})`, q);
  if (band === 'core') return { value: `\\sqrt{${s}}`, last: `x = \\sqrt{${s}}` };
  const r = Math.sqrt(s).toPrecision(3);
  return { value: r, last: `x = ${r} \\text{ (3 s.f.)}` };
}

function checkCommon(q, topic, band, instruction) {
  must(q.metadata?.topic === topic && q.metadata?.difficulty === band, 'metadata', q);
  must(q.instruction === instruction, `instruction "${q.instruction}"`, q);
  must(q.answerUnits === '\\text{cm}', 'answer in cm', q);
  must(q.questionMath === undefined, 'a forward question: everything is on the figure', q);
  must(typeof q.workingOut === 'string' && !q.workingOut.includes('\\n'), 'working uses real newlines', q);
  [q.answer, q.workingOut].forEach((s) => compiles(s));
}

// The three working lines: the theorem with the figure's numbers, the sum or
// difference, the root.
function checkWorking(q, first, s, last) {
  const lines = q.workingOut.split('\n');
  must(lines.length === 3, 'three working lines', q);
  must(first.includes(lines[0]), `working line 1 "${lines[0]}" uses the figure's sides`, q);
  must(lines[1] === `x^2 = ${s}`, `working line 2 "${lines[1]}"`, q);
  must(lines[2] === last, `working line 3 "${lines[2]}" is the answer`, q);
}

export function checkPythagoras(q, band) {
  const topic = q.metadata?.topic;
  const f = q.visualization;
  must(f?.big === true, 'a big figure', q);

  if (topic === 'pythagoras-hypotenuse') {
    checkCommon(q, topic, band, 'Find the length of the hypotenuse');
    must(f.type === 'right-triangle', 'a right triangle', q);
    const [a, b, c] = [length(f.a, q), length(f.b, q), length(f.c, q)];
    must(c === 'x' && a !== 'x' && b !== 'x', 'the hypotenuse is x, both legs given', q);
    must(f.unknown === undefined || f.unknown === 'c', 'the hypotenuse is the coloured side', q);
    const s = a * a + b * b;
    const { value, last } = expectedRoot(s, band, q);
    must(q.answer === `x = ${value}`, `answer ${q.answer}, expected x = ${value}`, q);
    checkWorking(q, [`x^2 = ${a}^2 + ${b}^2`, `x^2 = ${b}^2 + ${a}^2`], s, last);
    return { kind: band };
  }

  if (topic === 'pythagoras-missing-side') {
    checkCommon(q, topic, band, 'Find the length of the missing side');
    must(f.type === 'right-triangle', 'a right triangle', q);
    const sides = { a: length(f.a, q), b: length(f.b, q), c: length(f.c, q) };
    must(sides.c !== 'x', 'the hypotenuse is given', q);
    const leg = ['a', 'b'].find((k) => sides[k] === 'x');
    must(leg && f.unknown === leg, 'one leg is x, and it is the coloured side', q);
    const known = sides[leg === 'a' ? 'b' : 'a'];
    must(known !== 'x' && known < sides.c, 'the other leg is given, shorter than the hypotenuse', q);
    const s = sides.c * sides.c - known * known;
    const { value, last } = expectedRoot(s, band, q);
    must(q.answer === `x = ${value}`, `answer ${q.answer}, expected x = ${value}`, q);
    checkWorking(q, [`x^2 = ${sides.c}^2 - ${known}^2`], s, last);
    return { kind: `${band} leg ${leg}` };
  }

  if (topic === 'pythagoras-isosceles') {
    checkCommon(q, topic, band, 'Find the height of the isosceles triangle');
    must(f.type === 'isosceles-triangle', 'an isosceles triangle', q);
    const [base, side] = [length(f.base, q), length(f.side, q)];
    must(base !== 'x' && side !== 'x' && base % 2 === 0, 'the base and the equal sides given, the base even', q);
    const half = base / 2;
    must(half < side, 'the equal sides are longer than half the base', q);
    const s = side * side - half * half;
    const { value, last } = expectedRoot(s, band, q);
    must(q.answer === `x = ${value}`, `answer ${q.answer}, expected x = ${value}`, q);
    checkWorking(q, [`x^2 = ${side}^2 - ${half}^2`], s, last);
    return { kind: band };
  }

  return fail(`topic ${topic}`, q);
}
