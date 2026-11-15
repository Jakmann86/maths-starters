// Test support only. Checks interval-list-elements and interval-write from
// what is printed. Set-builder notation is parsed into a membership test
// here, lists are read element by element, and a number line is read off
// its figure config; a list must be exactly the set's elements, and a set
// written for a list or a line must hold exactly what they show. Nothing is
// imported from the generator.

const must = (cond, msg) => { if (!cond) throw new Error(msg); };
const lines = (s) => String(s ?? '').split('\n');

const SETS = { '\\mathbb{Z}': 'Z', '\\mathbb{N}': 'N', '\\mathbb{Z}^+': 'Z+' };
const START = { Z: -Infinity, N: 0, 'Z+': 1 };
const TEST = { '<': (a, b) => a < b, '\\le': (a, b) => a <= b, '>': (a, b) => a > b, '\\ge': (a, b) => a >= b };
const NUM = '(-?\\d+)';
const OP = '(<|\\\\le|>|\\\\ge)';

/**
 * {x | ...} read: { has(x), set, bounds } where bounds lists each bound
 * as { v, op } in the order printed, and set is 'Z', 'N', 'Z+' or null.
 */
export function readBuilder(tex) {
  const m = /^\\\{x \\mid (.+?)(?:, \\ x \\in (\\mathbb\{Z\}\^\+|\\mathbb\{Z\}|\\mathbb\{N\}))?\\\}$/.exec(tex ?? '');
  must(m, `set-builder form: ${tex}`);
  const cond = m[1];
  const set = m[2] ? SETS[m[2]] : null;
  let test, kind;
  let r = new RegExp(`^${NUM} ${OP} x ${OP} ${NUM}$`).exec(cond);
  if (r) {
    const [a, o1, o2, b] = [Number(r[1]), r[2], r[3], Number(r[4])];
    must((o1 === '<' || o1 === '\\le') && (o2 === '<' || o2 === '\\le') && a < b, `a between: ${cond}`);
    test = (x) => TEST[o1](a, x) && TEST[o2](x, b);
    kind = { type: 'between', lo: { v: a, inc: o1 === '\\le' }, hi: { v: b, inc: o2 === '\\le' } };
  } else if ((r = new RegExp(`^x ${OP} ${NUM} \\\\text\\{ or \\} x ${OP} ${NUM}$`).exec(cond))) {
    const [o1, a, o2, b] = [r[1], Number(r[2]), r[3], Number(r[4])];
    must((o1 === '<' || o1 === '\\le') && (o2 === '>' || o2 === '\\ge') && a < b, `two rays: ${cond}`);
    test = (x) => TEST[o1](x, a) || TEST[o2](x, b);
    kind = { type: 'or', lo: { v: a, inc: o1 === '\\le' }, hi: { v: b, inc: o2 === '\\ge' } };
  } else if ((r = new RegExp(`^x ${OP} ${NUM}$`).exec(cond))) {
    const [o, v] = [r[1], Number(r[2])];
    test = (x) => TEST[o](x, v);
    kind = { type: o === '>' || o === '\\ge' ? 'above' : 'below', v, inc: o === '\\le' || o === '\\ge' };
  } else must(false, `a condition the skill writes: ${cond}`);
  const inSet = (x) => !set || (Number.isInteger(x) && x >= START[set]);
  return { has: (x) => inSet(x) && test(x), set, kind };
}

/** {a, b, c}, with \ldots at either end. */
export function readList(tex) {
  const m = /^\\\{(.+)\\\}$/.exec(tex ?? '');
  must(m, `a list in braces: ${tex}`);
  const items = m[1].split(', ');
  const before = items[0] === '\\ldots';
  const after = items.at(-1) === '\\ldots';
  const xs = items.filter((v) => v !== '\\ldots').map(Number);
  must(xs.every(Number.isInteger) && xs.length, `whole numbers: ${tex}`);
  must(!(before && after), 'not open at both ends');
  xs.forEach((v, i) => i && must(v === xs[i - 1] + 1, `consecutive: ${tex}`));
  return { xs, before, after };
}

const REACH = 40;
const integersIn = (has) => { const out = []; for (let x = -REACH; x <= REACH; x += 1) if (has(x)) out.push(x); return out; };

function common(q, topic, band) {
  must(q.metadata?.topic === topic && q.metadata.difficulty === band, 'metadata');
  must(typeof q.workingOut === 'string' && !q.workingOut.includes('\\n'), 'real newlines');
  must(lines(q.workingOut).at(-1) === q.answer, 'the working ends on the answer');
}

/* ---------------------------------------------------- list the elements */

export function checkListElements(q, band) {
  common(q, 'interval-list-elements', band);
  must(q.instruction === 'List the elements of the set' && q.visualization == null, 'instruction, no figure');
  const S = readBuilder(q.questionMath);
  must(S.set, 'a set of integers: x is in Z, N or Z+');
  const xs = integersIn(S.has);
  const L = readList(q.answer);
  const w = lines(q.workingOut);
  const infiniteUp = xs.at(-1) === REACH, infiniteDown = xs[0] === -REACH;

  if (band === 'stretch') {
    must(infiniteUp !== infiniteDown, 'one bound: the set carries on one way');
    must(S.kind.type === 'above' || S.kind.type === 'below', 'one bound');
    if (infiniteUp) {
      must(L.after && !L.before && L.xs.join() === xs.slice(0, 3).join(), `answer ${q.answer}: the first three, then ...`);
      must(w[0] === `\\text{the smallest is } ${xs[0]}\\text{, and there is no largest}`, 'working');
    } else {
      must(L.before && !L.after && L.xs.join() === xs.slice(-3).join(), `answer ${q.answer}: ..., then the last three`);
      must(w[0] === `\\text{the largest is } ${xs.at(-1)}\\text{, and there is no smallest}`, 'working');
    }
    // With N, a bound below 0 says nothing: that is Core's trap, not this.
    if (S.set === 'N' && S.kind.type === 'above') must(S.kind.v >= (S.kind.inc ? 0 : -1), 'N with a bound that matters');
    return { kind: infiniteUp ? `up ${S.set}` : `down ${S.set}` };
  }

  must(!infiniteUp && !infiniteDown, 'a finite set');
  must(!L.before && !L.after && L.xs.join() === xs.join(), `answer ${q.answer}, expected {${xs.join(', ')}}`);
  if (band === 'foundation') {
    must(S.set === 'Z' && S.kind.type === 'between', 'integers between two bounds');
    must(xs.length >= 3 && xs.length <= 7, 'three to seven elements');
    const said = (b) => `${b.v} \\text{ is ${b.inc ? '' : 'not '}included}`;
    must(w[0] === `${said(S.kind.lo)}, \\ ${said(S.kind.hi)}`, 'working');
    return { kind: `${S.kind.lo.inc ? '≤' : '<'} ${S.kind.hi.inc ? '≤' : '<'}` };
  }
  must(S.set === 'N' || S.set === 'Z+', 'N or Z+');
  // The trap: the set starts the list, not the bound below it.
  must(xs[0] === START[S.set], 'the list starts where the set does');
  if (S.kind.type === 'between') must(S.kind.lo.v + (S.kind.lo.inc ? 0 : 1) <= START[S.set], 'a lower bound at or below where the set starts');
  else must(S.kind.type === 'below', 'an upper bound only, or both');
  must(w[0] === (S.set === 'N' ? '\\mathbb{N} = \\{0, 1, 2, 3, \\ldots\\}' : '\\mathbb{Z}^+ = \\{1, 2, 3, \\ldots\\}'), 'working');
  return { kind: `${S.set} ${S.kind.type === 'between' ? 'two bounds' : 'upper bound'}` };
}

/* --------------------------------------------------- write in interval form */

const endText = (v, inc) => `\\text{${inc ? 'filled' : 'open'} at } ${v}\\text{: ${inc ? 'included' : 'not included'}}`;

/** A number line's set, as a membership test, read off the figure. */
function lineSet(f) {
  must(f?.type === 'number-line' && f.big === true && Number.isInteger(f.min) && Number.isInteger(f.max), 'a number line', f);
  must(f.max - f.min >= 8 && f.max - f.min <= 11, 'eight to eleven units wide');
  const parts = f.set?.parts;
  must(Array.isArray(parts) && parts.length >= 1 && parts.length <= 2, 'one or two parts');
  parts.forEach((p) => [p.from, p.to].forEach((v) => {
    if (v !== null) must(Number.isInteger(v) && v > f.min && v < f.max, 'each circle inside the line, clear of its ends');
  }));
  return { parts, has: (x) => parts.some((p) => (p.from === null || (p.fromIn ? x >= p.from : x > p.from)) && (p.to === null || (p.toIn ? x <= p.to : x < p.to))) };
}

export function checkWrite(q, band) {
  common(q, 'interval-write', band);
  must(q.instruction === 'Write in interval notation', 'instruction');
  const A = readBuilder(q.answer);
  const w = lines(q.workingOut);

  if (q.visualization) {
    must(band !== 'foundation' && q.questionMath === undefined, 'a line alone');
    const L = lineSet(q.visualization);
    must(A.set === null, 'a real interval: no number set');
    // Every half-unit across the line and beyond agrees.
    for (let x = q.visualization.min - 6; x <= q.visualization.max + 6; x += 0.5) must(A.has(x) === L.has(x), `the set and the line disagree at ${x}`);
    const ends = L.parts.flatMap((p) => [[p.from, p.fromIn], [p.to, p.toIn]]).filter(([v]) => v !== null);
    if (band === 'core') {
      must(L.parts.length === 1 && L.parts[0].from !== null && L.parts[0].to !== null, 'a stretch between two numbers');
      must(w[0] === ends.map(([v, inc]) => endText(v, inc)).join(', \\ '), 'working');
      return { kind: 'between' };
    }
    must(L.parts.some((p) => p.from === null || p.to === null), 'a ray');
    if (L.parts.length === 1) must(w[0] === `${endText(...ends[0])}\\text{; the arrow carries on}`, 'working');
    else must(w[0] === ends.map(([v, inc]) => endText(v, inc)).join(', \\ '), 'working');
    return { kind: L.parts.length === 2 ? 'two rays' : 'ray' };
  }

  const L = readList(q.questionMath);
  must(A.set === 'Z', 'a list of integers: x in Z');
  if (band === 'foundation') {
    must(!L.before && !L.after && L.xs.length >= 4 && L.xs.length <= 8, 'a finite list of four to eight');
    must(integersIn(A.has).join() === L.xs.join(), 'the set holds exactly the list');
    must(A.kind.type === 'between' && A.kind.lo.inc && A.kind.hi.inc && A.kind.lo.v === L.xs[0] && A.kind.hi.v === L.xs.at(-1), 'written with ≤ at both ends');
    must(w[0] === `\\text{integers from } ${L.xs[0]} \\text{ to } ${L.xs.at(-1)}`, 'working');
    return { kind: 'finite list' };
  }
  must(band === 'stretch' && (L.before || L.after), 'a list that carries on');
  const xs = integersIn(A.has);
  if (L.after) {
    must(xs.at(-1) === REACH && xs.slice(0, L.xs.length).join() === L.xs.join(), 'the set starts the list and has no largest');
    must(A.kind.type === 'above' && A.kind.inc && A.kind.v === L.xs[0], 'x ≥ the first');
  } else {
    must(xs[0] === -REACH && xs.slice(-L.xs.length).join() === L.xs.join(), 'the set ends the list and has no smallest');
    must(A.kind.type === 'below' && A.kind.inc && A.kind.v === L.xs.at(-1), 'x ≤ the last');
  }
  const a = L.after ? L.xs[0] : L.xs.at(-1);
  must(w[0] === `\\text{integers, ${L.after ? 'from' : 'up to'} } ${a}\\text{, with no ${L.after ? 'largest' : 'smallest'}}`, 'working');
  return { kind: 'list carrying on' };
}
