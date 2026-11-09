// The checker for the SOHCAHTOA skills, shared by the harness
// (sohcahtoaGenerators.test.js) and its mutation test. Test support only.
//
// The right-triangle figure has its right angle at the bottom left, leg a
// up the left side, leg b along the base and c the hypotenuse. An angle at
// the top vertex is opposite b; an angle at the bottom right is opposite a.
// Which ratio a question needs follows from which two sides it gives, so
// the checker works that out from the figure and recomputes the answer.
// Nothing is imported from the generator.

import { compiles } from '../number/latexArithmetic.check';

const fail = (msg, q) => { throw new Error(`${msg}\n${JSON.stringify(q)}`); };
const must = (cond, msg, q) => { if (!cond) fail(msg, q); };
const rad = (d) => (d * Math.PI) / 180;
const deg = (r) => (r * 180) / Math.PI;

const ROLES = {
  top: { a: 'adjacent', b: 'opposite', c: 'hypotenuse' },
  bottomRight: { a: 'opposite', b: 'adjacent', c: 'hypotenuse' },
};
// The ratio named by a pair of roles, written top over bottom.
const RATIO = [
  { ratio: 'sin', top: 'opposite', bottom: 'hypotenuse', f: Math.sin, inv: Math.asin },
  { ratio: 'cos', top: 'adjacent', bottom: 'hypotenuse', f: Math.cos, inv: Math.acos },
  { ratio: 'tan', top: 'opposite', bottom: 'adjacent', f: Math.tan, inv: Math.atan },
];
const ratioFor = (r1, r2) => RATIO.find((R) => (R.top === r1 && R.bottom === r2) || (R.top === r2 && R.bottom === r1));

// "12 cm", "7.5 cm" -> number, with how many decimal places it was given to.
function length(label, q) {
  const m = /^(\d+)(?:\.(\d))? cm$/.exec(label ?? '');
  must(m, `a length label in cm: ${label}`, q);
  must(!(m[2] === '0'), `no trailing zero on a length: ${label}`, q);
  return { v: Number(`${m[1]}${m[2] ? `.${m[2]}` : ''}`), dp: m[2] ? 1 : 0, text: label.slice(0, -3) };
}

function checkCommon(q, topic, band) {
  must(q.metadata?.topic === topic && q.metadata?.difficulty === band, 'metadata', q);
  must(q.questionMath === undefined, 'a forward question: everything is on the figure', q);
  must(typeof q.workingOut === 'string' && !q.workingOut.includes('\\n'), 'working uses real newlines', q);
  [q.answer, q.workingOut].forEach((s) => compiles(s));
  const f = q.visualization;
  must(f?.type === 'right-triangle' && f.big === true, 'a big right triangle', q);
  must(ROLES[f.angleAt], `the angle sits at the top or the bottom right: ${f.angleAt}`, q);
  return f;
}

/* ------------------------------------------------------------ find a side */

function checkFindSide(q, band) {
  const f = checkCommon(q, 'sohcahtoa-find-side', band);
  must(q.instruction === 'Find the length of the marked side', 'instruction', q);
  must(q.answerUnits === '\\text{cm}', 'answer in cm', q);
  const am = /^(\d+)\^\\circ$/.exec(f.angleLabel ?? '');
  must(am, `a whole-degree angle label: ${f.angleLabel}`, q);
  const angle = Number(am[1]);
  const labelled = ['a', 'b', 'c'].filter((k) => f[k] !== undefined);
  must(labelled.length === 2, 'two sides labelled', q);
  const xSide = labelled.find((k) => f[k] === 'x');
  const gSide = labelled.find((k) => f[k] !== 'x');
  must(xSide && gSide && f.unknown === xSide, 'one side x, coloured; one side given', q);
  const g = length(f[gSide], q);
  const roles = ROLES[f.angleAt];
  const R = ratioFor(roles[xSide], roles[gSide]);
  must(R, 'the two sides make a ratio', q);
  const xOnTop = R.top === roles[xSide];
  const x = xOnTop ? g.v * R.f(rad(angle)) : g.v / R.f(rad(angle));
  const shown = x.toPrecision(3);
  must(q.answer === `x = ${shown}`, `answer ${q.answer}, expected x = ${shown}`, q);

  const t = `\\text{${R.ratio}}(${angle}^\\circ)`;
  const lines = q.workingOut.split('\n');
  must(lines.length === 3, 'three working lines', q);
  must(lines[0] === (xOnTop ? `${t} = \\frac{x}{${g.text}}` : `${t} = \\frac{${g.text}}{x}`), `working line 1 "${lines[0]}" is the right ratio`, q);
  must(lines[1] === (xOnTop ? `x = ${g.text} \\times ${t}` : `x = \\frac{${g.text}}{${t}}`), `working line 2 "${lines[1]}"`, q);
  must(lines[2] === `x = ${shown} \\text{ (3 s.f.)}`, `working line 3 "${lines[2]}"`, q);

  // Foundation: sin or cos with the hypotenuse given, a leg to find, an
  // angle from 20 to 70. Core: any ratio, either side, 10 to 80. Stretch:
  // as Core, and the given side may be to 1 d.p.
  if (band === 'foundation') {
    must(R.ratio !== 'tan' && roles[gSide] === 'hypotenuse', 'Foundation gives the hypotenuse for sin or cos', q);
    must(angle >= 20 && angle <= 70, 'Foundation angle 20-70', q);
  } else must(angle >= 10 && angle <= 80, 'angle 10-80', q);
  must(band === 'stretch' || g.dp === 0, 'only Stretch gives a side to 1 d.p.', q);
  return { kind: `${R.ratio} ${xOnTop ? 'x on top' : 'x below'}${g.dp ? ' 1 d.p.' : ''}` };
}

/* ----------------------------------------------------------- find an angle */

function checkFindAngle(q, band) {
  const f = checkCommon(q, 'sohcahtoa-find-angle', band);
  must(q.instruction === 'Find the marked angle', 'instruction', q);
  must(q.answerUnits === undefined, 'no units on an angle answer', q);
  must(f.angleLabel === 'x' && f.unknown === '', 'the angle is x and no side is coloured', q);
  const labelled = ['a', 'b', 'c'].filter((k) => f[k] !== undefined);
  must(labelled.length === 2, 'two sides labelled', q);
  const [s1, s2] = labelled.map((k) => ({ k, ...length(f[k], q) }));
  const roles = ROLES[f.angleAt];
  const R = ratioFor(roles[s1.k], roles[s2.k]);
  must(R, 'the two sides make a ratio', q);
  const [top, bottom] = R.top === roles[s1.k] ? [s1, s2] : [s2, s1];
  if (R.ratio !== 'tan') must(top.v < bottom.v, 'a leg shorter than the hypotenuse', q);
  const angle = deg(R.inv(top.v / bottom.v));
  const shown = angle.toFixed(1);
  must(q.answer === `x = ${shown}^\\circ`, `answer ${q.answer}, expected x = ${shown}°`, q);

  const lines = q.workingOut.split('\n');
  const fr = `\\frac{${top.text}}{${bottom.text}}`;
  must(lines.length === 3, 'three working lines', q);
  must(lines[0] === `\\text{${R.ratio}}(x) = ${fr}`, `working line 1 "${lines[0]}" is the right ratio`, q);
  must(lines[1] === `x = \\text{${R.ratio}}^{-1}(${fr})`, `working line 2 "${lines[1]}"`, q);
  must(lines[2] === `x = ${shown}^\\circ \\text{ (1 d.p.)}`, `working line 3 "${lines[2]}"`, q);

  // Foundation: tan from two whole-number legs under 15. Core: any ratio,
  // whole-number sides up to 30. Stretch: as Core with one side to 1 d.p.
  const dps = s1.dp + s2.dp;
  if (band === 'foundation') must(R.ratio === 'tan' && s1.v <= 14 && s2.v <= 14 && dps === 0, 'Foundation is tan from two small whole-number legs', q);
  if (band === 'core') must(dps === 0 && s1.v <= 30 && s2.v <= 30, 'Core sides are whole numbers up to 30', q);
  if (band === 'stretch') must(dps === 1 && s1.v <= 30 && s2.v <= 30, 'Stretch gives exactly one side to 1 d.p.', q);
  return { kind: `${R.ratio}${dps ? ' 1 d.p.' : ''}` };
}

export function checkSohcahtoa(q, band) {
  if (q.metadata?.topic === 'sohcahtoa-find-side') return checkFindSide(q, band);
  if (q.metadata?.topic === 'sohcahtoa-find-angle') return checkFindAngle(q, band);
  return fail(`topic ${q.metadata?.topic}`, q);
}
