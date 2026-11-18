// Test support only. Checks perpendicular-line from what is printed: the
// given line and point, or A and B, are read back, and the answer line must
// be at right angles to the given one (or to AB) and pass through the point
// (or the midpoint), in lowest terms. The working is rebuilt here from the
// same reading and must match line for line.

const must = (cond, msg) => { if (!cond) throw new Error(msg); };
const lines = (s) => String(s ?? '').split('\n');
const gcd = (a, b) => (b ? gcd(b, a % b) : Math.abs(a));

/** A fraction in lowest terms as LaTeX, whole numbers whole. */
function frac(n, d) {
  if (d < 0) { n = -n; d = -d; }
  const g = gcd(n, d) || 1;
  [n, d] = [n / g, d / g];
  if (d === 1) return String(n);
  return n < 0 ? `-\\frac{${-n}}{${d}}` : `\\frac{${n}}{${d}}`;
}
const xCoef = (n, d) => { const f = frac(n, d); return f === '1' ? '' : f === '-1' ? '-' : f; };
const signed = (c) => (c === 0 ? '' : ` ${c < 0 ? '-' : '+'} ${Math.abs(c)}`);
const slope = (n, d, c) => (n === 0 ? `y = ${c}` : `y = ${xCoef(n, d)}x${signed(c)}`);
const coef = (v) => (v === 1 ? '' : v === -1 ? '-' : String(v));
const general = (a, b, d) => `${coef(a)}x ${b === 1 ? '+ y' : b === -1 ? '- y' : b < 0 ? `- ${-b}y` : `+ ${b}y`} = ${d}`;
const br = (v) => (v < 0 ? `(${v})` : String(v));
const pt = (x, y) => `(${x}, ${y})`;

/** y = mx + c, m whole or a fraction: [num, den, c]. */
function readSlope(s) {
  const m = /^y = (-?)(\\frac\{(\d+)\}\{(\d+)\}|\d*)x(?: ([+-]) (\d+))?$/.exec(s);
  must(m, `y = mx + c: ${s}`);
  const sign = m[1] ? -1 : 1;
  const [n, d] = m[3] ? [Number(m[3]), Number(m[4])] : [m[2] === '' ? 1 : Number(m[2]), 1];
  return [sign * n, d, m[5] ? (m[5] === '-' ? -1 : 1) * Number(m[6]) : 0];
}
/** ax + by = d: [a, b, d]. */
function readGeneral(s) {
  const m = /^(-?\d*)x ([+-]) (\d*)y = (-?\d+)$/.exec(s);
  must(m, `ax + by = d: ${s}`);
  const a = m[1] === '' ? 1 : m[1] === '-' ? -1 : Number(m[1]);
  const b = (m[2] === '-' ? -1 : 1) * (m[3] === '' ? 1 : Number(m[3]));
  return [a, b, Number(m[4])];
}
const readPoint = (s) => { const m = /^\((-?\d+), (-?\d+)\)$/.exec(s); must(m, `a point: ${s}`); return [Number(m[1]), Number(m[2])]; };

export function checkPerpendicularLine(q, band) {
  must(q.metadata?.topic === 'perpendicular-line' && q.metadata.difficulty === band, 'metadata');
  must(typeof q.workingOut === 'string' && !q.workingOut.includes('\\n'), 'real newlines');
  must(!/\d/.test(q.instruction) && !q.visualization && q.questionMathCompact === true, 'no digits in the instruction, no figure');
  const w = lines(q.workingOut);
  must(w.at(-1) === q.answer, 'the working ends on the answer');

  if (band === 'foundation') {
    must(q.instruction === 'Find the equation of the line perpendicular to this one, through the point given', 'instruction');
    const [line, through] = lines(q.questionMath);
    const [n, d, c] = readSlope(line);
    must(d === 1 && n !== 0, 'a whole-number gradient');
    const P = readPoint(through.replace('\\text{through } ', ''));
    // At right angles: gradient -1/n. Through P: c2 = y - (-1/n) x.
    const c2 = P[1] + P[0] / n;
    must(Number.isInteger(c2) && c2 !== c, 'a whole constant, a different line');
    const want = slope(-1, n, c2);
    must(q.answer === want, `answer ${q.answer}, expected ${want}`);
    const work = [
      `\\text{perpendicular gradient} = ${frac(-1, n)}`,
      `y = ${xCoef(-1, n)}x + c`,
      `${P[1]} = ${frac(-1, n)} \\times ${br(P[0])} + c`,
      `c = ${c2}`,
      want,
    ];
    must(w.join('|') === work.join('|'), `working: ${w.join(' / ')}`);
    return { kind: 'gradient-intercept' };
  }

  let A, B, K, P, work;
  if (band === 'core') {
    must(q.instruction === 'Find the equation of the perpendicular line through the point, in the form ax + by = d', 'instruction');
    const [line, through] = lines(q.questionMath);
    const [a, b] = readGeneral(line);
    must(a > 0 && b !== 0 && gcd(a, b) === 1, 'a line in lowest terms');
    P = readPoint(through.replace('\\text{through } ', ''));
    [A, B, K] = readGeneral(q.answer);
    must(a * A + b * B === 0, 'at right angles to the given line');
    work = [`m = ${frac(-a, b)}`, `\\text{perpendicular gradient} = ${frac(b, a)}`];
  } else {
    must(q.instruction === 'Find the equation of the perpendicular bisector of AB, in the form ax + by = d', 'instruction');
    const m = /^A(\(-?\d+, -?\d+\)) \\text\{ and \} B(\(-?\d+, -?\d+\))$/.exec(q.questionMath);
    must(m, `A and B: ${q.questionMath}`);
    const [p, r] = [readPoint(m[1]), readPoint(m[2])];
    const [dx, dy] = [r[0] - p[0], r[1] - p[1]];
    must(dx && dy && !(dx % 2) && !(dy % 2), 'a whole midpoint, AB on a slant');
    P = [(p[0] + r[0]) / 2, (p[1] + r[1]) / 2];
    [A, B, K] = readGeneral(q.answer);
    must(A * dy - B * dx === 0, 'at right angles to AB');
    work = [`M = ${pt(P[0], P[1])}`, `m_{AB} = \\frac{${r[1]} - ${br(p[1])}}{${r[0]} - ${br(p[0])}} = ${frac(dy, dx)}`, `\\text{perpendicular gradient} = ${frac(-dx, dy)}`];
  }
  must(A > 0 && gcd(A, B) === 1, 'lowest terms, x coefficient positive');
  must(A * P[0] + B * P[1] === K, `through ${pt(...P)}`);
  must(q.answer === general(A, B, K), 'written as the skill writes it');
  work.push(general(A, B, 'd'), `d = ${A} \\times ${br(P[0])} + ${br(B)} \\times ${br(P[1])} = ${K}`, general(A, B, K));
  must(w.join('|') === work.join('|'), `working: ${w.join(' / ')}`);
  return { kind: band === 'core' ? 'general form' : 'bisector' };
}
