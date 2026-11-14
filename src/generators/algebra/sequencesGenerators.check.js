// Test support only. Checks sequences-arithmetic-use-nth-term from what is
// printed: the rule (or the two given terms) is read back from the question,
// the terms are recomputed here, and the answer and every working line must
// agree. Nothing is imported from the generator.

import { compiles } from '../number/latexArithmetic.check';

const must = (cond, msg) => { if (!cond) throw new Error(msg); };
const lines = (s) => String(s ?? '').split('\n');
const signed = (c) => `${c >= 0 ? '+' : '-'} ${Math.abs(c)}`;
const rule = (d, c) => `a_n = ${d === 1 ? '' : d === -1 ? '-' : d}n${c === 0 ? '' : ` ${signed(c)}`}`;

/** a_n = dn + c, read. */
const readRule = (tex) => {
  const m = /^a_n = (-?\d*)n(?: ([+-]) (\d+))?$/.exec(tex);
  must(m, `a rule: ${tex}`);
  const d = m[1] === '' ? 1 : m[1] === '-' ? -1 : Number(m[1]);
  const c = m[2] ? Number(m[3]) * (m[2] === '-' ? -1 : 1) : 0;
  must(rule(d, c) === tex, `printed as the rule reads: ${tex}`);
  return [d, c];
};

export function checkUseNthTerm(q, band) {
  must(q.metadata?.topic === 'sequences-arithmetic-use-nth-term' && q.metadata.difficulty === band, 'metadata');
  must(q.visualization === null, 'no figure');
  [q.questionMath, q.answer, q.workingOut].forEach((s) => compiles(s));
  const [l1, l2] = lines(q.questionMath);
  const w = lines(q.workingOut);

  if (band === 'foundation') {
    must(q.instruction === 'Find the first five terms' && l2 === undefined, 'instruction');
    const [d, c] = readRule(l1);
    must(d >= 2, 'an increasing rule at Foundation');
    const five = [1, 2, 3, 4, 5].map((n) => d * n + c);
    must(q.answer === five.join(', '), `answer ${q.answer}`);
    must(w.join('|') === five.map((t, i) => `a_{${i + 1}} = ${d}(${i + 1}) ${signed(c)} = ${t}`).join('|'), 'working');
    return { kind: 'first five' };
  }
  if (band === 'core') {
    must(q.instruction === 'Find this term', 'instruction');
    const [d, c] = readRule(l1);
    const m = /^a_\{(\d+)\}$/.exec(l2 ?? '');
    must(m, `a term asked for: ${l2}`);
    const n = Number(m[1]);
    must(n > 20, 'a far term');
    const v = d * n + c;
    must(q.answer === `a_{${n}} = ${v}`, `answer ${q.answer}, expected ${v}`);
    must(w.join('|') === `a_{${n}} = ${d}(${n}) ${signed(c)} = ${v}`, 'working');
    return { kind: d < 0 ? 'decreasing' : 'increasing' };
  }
  if (q.instruction === 'Find which term has this value') {
    const [d, c] = readRule(l1);
    const m = /^a_n = (-?\d+)$/.exec(l2 ?? '');
    must(m, `a value given: ${l2}`);
    const v = Number(m[1]);
    const n = (v - c) / d;
    must(Number.isInteger(n) && n > 0, 'a term of the sequence');
    must(q.answer === `n = ${n}`, `answer ${q.answer}, expected n = ${n}`);
    must(w.join('|') === [`${d}n ${signed(c)} = ${v}`, `${d}n = ${v - c}`, `n = ${n}`].join('|'), 'working');
    return { kind: 'which term' };
  }
  must(q.instruction === 'Find a formula for the nth term' && l2 === undefined, 'instruction');
  const m = /^a_\{(\d+)\} = (-?\d+), \\; a_\{(\d+)\} = (-?\d+)$/.exec(l1);
  must(m, `two terms given: ${l1}`);
  const [p, vp, r, vr] = m.slice(1).map(Number);
  must(r - p >= 3, 'not next to each other');
  const d = (vr - vp) / (r - p);
  must(Number.isInteger(d) && d !== 0, 'a whole-number difference');
  const c = vp - d * p;
  must(q.answer === rule(d, c), `answer ${q.answer}, expected ${rule(d, c)}`);
  const br = (n) => (n < 0 ? `(${n})` : `${n}`);
  must(w.join('|') === [
    `${r - p}d = ${vr} - ${br(vp)} = ${vr - vp}`,
    `d = ${d}`,
    `c = ${vp} - ${br(d * p)} = ${c}`,
    q.answer,
  ].join('|'), 'working');
  return { kind: 'rule from two terms' };
}
