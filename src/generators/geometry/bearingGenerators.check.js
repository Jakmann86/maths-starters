// Test support only. Checks bearings from the figure: every bearing and
// angle is measured from the drawn points (y up, north along +y), never
// taken from the generator. Labels must match the drawing, the answer must
// be the bearing or angle the drawing shows, in three figures for a
// bearing, and every working line's arithmetic must hold.

const must = (cond, msg) => { if (!cond) throw new Error(msg); };
const DEG = 180 / Math.PI;
/** The bearing of q from p, as drawn, to the nearest degree. */
const bearingOf = (p, q) => Math.round(((Math.atan2(q[0] - p[0], q[1] - p[1]) * DEG) + 360) % 360) % 360;
const angleAt = (v, p, q) => {
  const a = Math.atan2(p[1] - v[1], p[0] - v[0]), b = Math.atan2(q[1] - v[1], q[0] - v[0]);
  let d = Math.abs(a - b) * DEG;
  if (d > 180) d = 360 - d;
  return Math.round(d);
};
const readDeg = (s) => {
  const m = /^(\d+)\^\\circ$/.exec(s);
  must(m, `an angle in degrees: ${s}`);
  return Number(m[1]);
};
const readThree = (s) => {
  const m = /^(\d{3})\^\\circ$/.exec(s);
  must(m, `a bearing in three figures: ${s}`);
  return Number(m[1]);
};
/** Every "a = b = c" in a line, with \text{} stripped, must agree. */
function arithmetic(line) {
  const maths = line.replace(/\\text\{[^}]*\}/g, ' ').replace(/\^\\circ/g, '');
  const parts = maths.split('=').map((p) => p.trim()).filter((p) => /\d/.test(p));
  const vals = parts.map((p) => {
    must(/^[\d\s+\-()]+$/.test(p), `plain arithmetic: ${p}`);
    // eslint-disable-next-line no-new-func
    return Function(`return (${p});`)();
  });
  vals.slice(1).forEach((v) => must(v === vals[0], `the arithmetic is wrong: ${line}`));
  return vals;
}

export function checkBearings(q, band) {
  must(q.metadata?.topic === 'bearings' && q.metadata.difficulty === band, 'metadata');
  must(!q.answerUnits && !q.questionText, 'no units or question text');
  must(typeof q.workingOut === 'string' && !/\\n(?![a-z])/.test(q.workingOut), 'real newlines');
  must(!/\d/.test(q.instruction), 'no digits in the instruction');
  const f = q.visualization;
  must(f?.type === 'bearings', 'the bearings figure');
  const P = f.points;
  const names = Object.keys(P);
  const angles = f.angles || [];
  // Each marked angle's label (or '?') against the drawing.
  angles.forEach((an) => {
    if (an.bearing !== undefined) {
      // A bearing marked clockwise from north: the drawn bearing to `to`.
      const drawn = bearingOf(P[an.at], P[an.to]);
      must(an.bearing === drawn && readDeg(an.label) === drawn, `the bearing ${an.label} is not the ${drawn}° drawn`);
      must(Math.abs(drawn - 180) >= 15 && drawn >= 15 && drawn <= 345, 'a bearing clear of north and south');
      return;
    }
    const ray = (r) => (r === 'N' ? [P[an.at][0], P[an.at][1] + 100] : P[r]);
    const size = angleAt(P[an.at], ray(an.from), ray(an.to));
    must(size >= 15 && size <= 165, `a marked angle that reads: ${size}`);
    if (an.label !== '?') must(readDeg(an.label) === size, `the label ${an.label} is not the ${size}° drawn`);
    else must(an.unknown === true, 'the unknown in the slot colour');
  });
  const w = q.workingOut.split('\n');
  must(w.at(-1) === q.answer, 'the working ends on the answer');
  w.slice(0, -1).forEach(arithmetic);
  const AB = bearingOf(P.A, P.B);

  if (band === 'foundation') {
    must(names.join() === 'A,B' && f.north.join() === 'A', 'A and B, a north line at A');
    must(angles.length === 1 && angles[0].at === 'A' && angles[0].from === 'N' && angles[0].to === 'B', 'the angle at A from north');
    must(q.instruction === 'Find the bearing of B from A' && !q.questionMath, 'instruction');
    must(readThree(q.answer) === AB, `the bearing drawn is ${AB}`);
    must(w.length === 2, 'one line, then the answer');
    if (AB <= 180) must(w[0] === `${AB}^\\circ \\text{ clockwise from north}`, 'the bearing, clockwise from north');
    else must(w[0] === `360^\\circ - ${360 - AB}^\\circ = ${AB}^\\circ`, '360 take away the angle');
    return { kind: AB <= 180 ? 'clockwise' : 'anticlockwise' };
  }
  if (band === 'core') {
    must(names.join() === 'A,B' && f.north.join() === 'A,B', 'north lines at A and B');
    must(angles.length === 1 && angles[0].from === 'N', 'one angle, from a north line');
    if (q.instruction === 'Find the bearing of A from B') {
      must(angles[0].at === 'A', 'the angle at A given');
      must(readThree(q.answer) === bearingOf(P.B, P.A), 'the back bearing');
      must(w.length === 3 && /180\^\\circ/.test(w[1]), 'the bearing from A, plus or minus 180');
      must(arithmetic(w[0]).at(-1) === AB && arithmetic(w[1]).at(-1) === bearingOf(P.B, P.A), 'each line ends on the right bearing');
      return { kind: 'back bearing' };
    }
    must(q.instruction === 'Find the bearing of B from A', 'instruction');
    must(angles[0].at === 'B', 'the angle at B given');
    must(readThree(q.answer) === AB, 'the bearing of B from A');
    must(w[0].includes('co-interior') && w.length === (AB <= 180 ? 2 : 3), 'co-interior angles, then 360 take away if west');
    must(w[0].startsWith(`180^\\circ - ${angles[0].label} = `) && arithmetic(w[0]).at(-1) === (AB <= 180 ? AB : 360 - AB), 'the co-interior angle from the one marked');
    return { kind: 'co-interior' };
  }
  must(names.join() === 'A,B,C' && f.north.join() === 'A,B' && f.segments.length === 3, 'triangle ABC, north lines at A and B');
  const BC = bearingOf(P.B, P.C);
  const ABC = angleAt(P.B, P.A, P.C);
  must(ABC >= 35 && ABC <= 140, 'a triangle that reads');
  must(!q.questionMath, 'the bearings are on the figure, not beside it');
  const atA = angles.find((an) => an.at === 'A');
  must(atA && atA.bearing === AB && atA.to === 'B', 'the bearing of B from A marked at A');
  must(angles.length === 2, 'two angles marked');
  const atB = angles.find((an) => an.at === 'B');
  must(/^\\text\{bearing of A from B\} = /.test(w[0]) && arithmetic(w[0]).at(-1) === bearingOf(P.B, P.A), 'the back bearing first');
  must(w.length === 3, 'the back bearing, one step, the answer');
  must(arithmetic(w[1]).at(-1) === (q.instruction === 'Find angle ABC' ? ABC : BC), 'the step ends on the answer');
  if (q.instruction === 'Find angle ABC') {
    must(atB && atB.bearing === BC && atB.to === 'C', 'the bearing of C from B marked at B');
    must(readDeg(q.answer) === ABC, `angle ABC drawn is ${ABC}`);
    return { kind: 'angle in the triangle' };
  }
  must(q.instruction === 'Find the bearing of C from B', 'instruction');
  must(atB && atB.from === 'A' && atB.to === 'C', 'angle ABC marked at B');
  must(readThree(q.answer) === BC, `the bearing of C from B drawn is ${BC}`);
  return { kind: 'next bearing' };
}
