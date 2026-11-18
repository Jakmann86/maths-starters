// Test support only. Checks arc-length and sector-area from what is
// printed: the angle and the radius read off the sector figure, an arc or
// an area off the question line, and the answer worked out here as a
// multiple of π. The 3 s.f. rounding is done here too, not borrowed.

const must = (cond, msg) => { if (!cond) throw new Error(msg); };
const lines = (s) => String(s ?? '').split('\n');
const piTerm = (n) => (n === 1 ? '\\pi' : `${n}\\pi`);
/** 3 significant figures as printed: trailing zeros kept, no exponent. */
const sf3 = (x) => {
  const s = x.toPrecision(3);
  return s.includes('e') ? String(Number(s)) : s;
};
const EXACT_ASK = '. Leave your answer in terms of π';
const SF_ASK = '. Give your answer to 3 significant figures';

/** The sector: its drawn angle, the angle label, and the radius label. */
function readSector(f) {
  must(f?.type === 'sector' && f.big === true, 'a sector figure');
  must(Number.isInteger(f.angle) && f.angle >= 25 && f.angle <= 160, 'drawn to a true angle the figure can show');
  const r = /^(\d+) (cm|m|mm)$/.exec(f.r ?? '');
  return { t: f.angle, label: f.angleLabel, r: r ? Number(r[1]) : null, u: r ? r[2] : null, rLabel: f.r };
}

/** The asked form, and the answer in it, for k π plus an optional extra. */
function piAnswer(q, what, k, extra = 0) {
  const exact = q.instruction === `${what}${EXACT_ASK}`;
  must(exact || q.instruction === `${what}${SF_ASK}`, `instruction: ${q.instruction}`);
  const want = exact ? (extra ? `${piTerm(k)} + ${extra}` : piTerm(k)) : sf3(k * Math.PI + extra);
  must(q.answer === want, `answer ${q.answer}, expected ${want}`);
  return exact;
}

function common(q, topic, band) {
  must(q.metadata?.topic === topic && q.metadata.difficulty === band, 'metadata');
  must(typeof q.workingOut === 'string' && !q.workingOut.includes('\\n'), 'real newlines');
  return lines(q.workingOut);
}

/* ------------------------------------------------------------ arc-length */

export function checkArcLength(q, band) {
  const w = common(q, 'arc-length', band);
  const S = readSector(q.visualization);

  if (band !== 'stretch') {
    must(S.r && S.label === `${S.t}^\\circ` && !q.questionMath, 'radius and angle on the figure, nothing more');
    const k = (S.t * S.r) / 180;
    must(Number.isInteger(k), 'a whole multiple of π');
    must(q.answerUnits === `\\text{${S.u}}`, 'the radius\'s unit');
    const arcLines = [`l = \\frac{${S.t}}{360} \\times 2\\pi \\times ${S.r}`, `l = ${piTerm(k)}`];
    if (band === 'foundation') {
      must(360 % S.t === 0, 'a factor of 360');
      must(q.visualization.unknown === 'arc', 'the arc in colour');
      const exact = piAnswer(q, 'Find the length of the arc', k);
      const want = ['l = \\frac{\\theta}{360} \\times 2\\pi r', ...arcLines, ...(exact ? [] : [`l = ${sf3(k * Math.PI)} \\text{ (3 s.f.)}`])];
      must(w.join('|') === want.join('|'), `working: ${w.join(' / ')}`);
      return { kind: exact ? 'exact' : '3 s.f.' };
    }
    must(S.t % 5 === 0 && q.visualization.unknown === null, 'an angle in fives; the whole outline asked for');
    const exact = piAnswer(q, 'Find the perimeter of the sector', k, 2 * S.r);
    const want = [...arcLines, `P = ${piTerm(k)} + 2 \\times ${S.r}`, `P = ${piTerm(k)} + ${2 * S.r}`, ...(exact ? [] : [`P = ${sf3(k * Math.PI + 2 * S.r)} \\text{ (3 s.f.)}`])];
    must(w.join('|') === want.join('|'), `working: ${w.join(' / ')}`);
    return { kind: exact ? 'exact' : '3 s.f.' };
  }

  must(q.visualization.hug === true, 'the figure hugs, beside its question line');
  const m = /^l = (\d*)\\pi\\text\{ (cm|m|mm)\}$/.exec(q.questionMath ?? '');
  must(m, `the arc given: ${q.questionMath}`);
  const k = m[1] ? Number(m[1]) : 1;
  if (q.instruction === 'Find the angle θ') {
    must(S.label === 'θ' && S.r && S.u === m[2] && q.visualization.unknown === 'angle', 'θ marked, the radius given');
    const t = (k * 180) / S.r;
    must(Number.isInteger(t) && t === S.t && t % 5 === 0, 'a whole angle, drawn true');
    must(q.answer === `\\theta = ${t}^\\circ` && !q.answerUnits, `answer ${q.answer}`);
    must(w[0] === `\\frac{\\theta}{360} \\times 2\\pi \\times ${S.r} = ${piTerm(k)}` && w[1] === `\\theta = \\frac{${k} \\times 360}{${2 * S.r}}` && w[2] === q.answer && w.length === 3, 'working');
    return { kind: 'find the angle' };
  }
  must(q.instruction === 'Find the radius r' && S.rLabel === 'r' && q.visualization.unknown === 'r', 'r marked');
  must(S.label === `${S.t}^\\circ`, 'the angle given');
  const r = (k * 180) / S.t;
  must(Number.isInteger(r) && r >= 2 && q.answer === `r = ${r}` && q.answerUnits === `\\text{${m[2]}}`, `answer ${q.answer}`);
  must(w[0] === `\\frac{${S.t}}{360} \\times 2\\pi r = ${piTerm(k)}` && w[1] === `r = \\frac{${k} \\times 360}{2 \\times ${S.t}}` && w[2] === q.answer && w.length === 3, 'working');
  return { kind: 'find the radius' };
}

/* ----------------------------------------------------------- sector-area */

export function checkSectorArea(q, band) {
  const w = common(q, 'sector-area', band);
  const S = readSector(q.visualization);

  if (band !== 'stretch') {
    must(S.r && S.label === `${S.t}^\\circ` && !q.questionMath, 'radius and angle on the figure, nothing more');
    must(q.answerUnits === `\\text{${S.u}}^2`, 'square units');
    const major = band === 'core';
    must(Boolean(q.visualization.major) === major, 'the major sector shaded in Core only');
    const over = major ? 360 - S.t : S.t;
    const k = (over * S.r * S.r) / 360;
    must(Number.isInteger(k), 'a whole multiple of π');
    const exact = piAnswer(q, major ? 'Find the area of the shaded sector' : 'Find the area of the sector', k);
    const tail = [`A = ${piTerm(k)}`, ...(exact ? [] : [`A = ${sf3(k * Math.PI)} \\text{ (3 s.f.)}`])];
    const want = major
      ? [`360 - ${S.t} = ${over}`, `A = \\frac{${over}}{360} \\times \\pi \\times ${S.r}^2`, ...tail]
      : ['A = \\frac{\\theta}{360} \\times \\pi r^2', `A = \\frac{${S.t}}{360} \\times \\pi \\times ${S.r}^2`, ...tail];
    if (!major) must(360 % S.t === 0 && q.visualization.unknown === 'area', 'a factor of 360, the sector tinted');
    must(w.join('|') === want.join('|'), `working: ${w.join(' / ')}`);
    return { kind: exact ? 'exact' : '3 s.f.' };
  }

  must(q.visualization.hug === true, 'the figure hugs, beside its question line');
  const m = /^A = (\d*)\\pi\\text\{ (cm|m|mm)\}\^2$/.exec(q.questionMath ?? '');
  must(m, `the area given: ${q.questionMath}`);
  const k = m[1] ? Number(m[1]) : 1;
  if (q.instruction === 'Find the angle θ') {
    must(S.label === 'θ' && S.r && S.u === m[2] && q.visualization.unknown === 'angle', 'θ marked, the radius given');
    const t = (k * 360) / (S.r * S.r);
    must(Number.isInteger(t) && t === S.t, 'a whole angle, drawn true');
    must(q.answer === `\\theta = ${t}^\\circ` && !q.answerUnits, `answer ${q.answer}`);
    must(w[0] === `\\frac{\\theta}{360} \\times \\pi \\times ${S.r}^2 = ${piTerm(k)}` && w[1] === `\\theta = \\frac{${k} \\times 360}{${S.r * S.r}}` && w[2] === q.answer && w.length === 3, 'working');
    return { kind: 'find the angle' };
  }
  must(q.instruction === 'Find the radius r' && S.rLabel === 'r' && q.visualization.unknown === 'r' && S.label === `${S.t}^\\circ`, 'r marked, the angle given');
  const r2 = (k * 360) / S.t;
  const r = Math.round(Math.sqrt(r2));
  must(r * r === r2 && r >= 2, 'a whole radius');
  must(q.answer === `r = ${r}` && q.answerUnits === `\\text{${m[2]}}`, `answer ${q.answer}`);
  must(w[0] === `\\frac{${S.t}}{360} \\times \\pi r^2 = ${piTerm(k)}` && w[1] === `r^2 = \\frac{${k} \\times 360}{${S.t}} = ${r2}` && w[2] === q.answer && w.length === 3, 'working');
  return { kind: 'find the radius' };
}
