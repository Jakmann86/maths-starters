// Test support only. Checks sequence-rules from what is printed: the four
// terms are read back, the stated rule must make every one of them from the
// first and give the two answer terms next, and no other kind of rule may
// fit the four terms with different next ones (worked out here, not
// borrowed from the generator).

import { lineHolds } from '../number/ratioGenerators.check';

const must = (cond, msg) => { if (!cond) throw new Error(msg); };
const lines = (s) => String(s ?? '').split('\n');

/** The next two terms, from each kind of rule that fits all four. */
function readings(t) {
  const out = [];
  const d = [t[1] - t[0], t[2] - t[1], t[3] - t[2]];
  if (d[0] === d[1] && d[1] === d[2]) out.push([t[3] + d[2], t[3] + 2 * d[2]]);
  if (t[0] && t[1] / t[0] === t[2] / t[1] && t[2] / t[1] === t[3] / t[2]) { const r = t[1] / t[0]; out.push([t[3] * r, t[3] * r * r]); }
  const s = d[1] - d[0];
  if (s && d[2] - d[1] === s) out.push([t[3] + d[2] + s, t[3] + 2 * d[2] + 3 * s]);
  if (t[0] + t[1] === t[2] && t[1] + t[2] === t[3]) out.push([t[2] + t[3], t[2] + 2 * t[3]]);
  for (let m = -6; m <= 6; m += 1) {
    if (m === 0 || m === 1) continue;
    const k = t[1] - m * t[0];
    if (t[1] * m + k === t[2] && t[2] * m + k === t[3]) out.push([t[3] * m + k, (t[3] * m + k) * m + k]);
  }
  return out;
}

/** The rule in words, as a step: term -> next term, given the two before. */
function stepOf(rule) {
  let m;
  if ((m = /^add (\d+)$/.exec(rule))) return { band: 'foundation', kind: 'add', f: (a) => a + Number(m[1]) };
  if ((m = /^subtract (\d+)$/.exec(rule))) return { band: 'foundation', kind: 'subtract', f: (a) => a - Number(m[1]) };
  if ((m = /^multiply by (-?\d+)$/.exec(rule))) return { band: 'core', kind: 'multiply', f: (a) => a * Number(m[1]) };
  if ((m = /^divide by (\d+)$/.exec(rule))) return { band: 'core', kind: 'divide', f: (a) => a / Number(m[1]) };
  if ((m = /^multiply by (\d+), then (add|subtract) (\d+)$/.exec(rule))) {
    const k = (m[2] === 'add' ? 1 : -1) * Number(m[3]);
    return { band: 'stretch', kind: 'two-step rule', f: (a) => a * Number(m[1]) + k };
  }
  if (rule === 'add the two terms before') return { band: 'stretch', kind: 'add the two before', f: (a, b) => a + b };
  if ((m = /^the difference goes (up|down) by (\d+) each time$/.exec(rule))) {
    const s = (m[1] === 'up' ? 1 : -1) * Number(m[2]);
    return { band: 'stretch', kind: 'rising differences', f: (a, b) => a + (a - b) + s };
  }
  return must(false, `a rule the skill gives: ${rule}`);
}

export function checkSequenceRules(q, band) {
  must(q.metadata?.topic === 'sequence-rules' && q.metadata.difficulty === band, 'metadata');
  must(q.instruction === 'Write down the next two terms and the term-to-term rule' && !q.visualization, 'instruction');
  must(typeof q.workingOut === 'string' && !q.workingOut.includes('\\n'), 'real newlines');
  const m = /^(-?\d+), (-?\d+), (-?\d+), (-?\d+), \\ldots$/.exec(q.questionMath);
  must(m, `four terms then dots: ${q.questionMath}`);
  const t = m.slice(1).map(Number);
  must(new Set(t).size === 4, 'four different terms');
  const a = /^(-?\d+), (-?\d+); \\ \\text\{(.+)\}$/.exec(q.answer);
  must(a, `next two; rule: ${q.answer}`);
  const next = [Number(a[1]), Number(a[2])];
  const step = stepOf(a[3]);
  must(step.band === band, `${step.kind} is ${step.band}, not ${band}`);

  // The rule makes each term from the one (or two) before; the first two
  // seed rules that look back two.
  const all = [...t, ...next];
  const lookBack = step.kind === 'add the two before' || step.kind === 'rising differences';
  for (let i = lookBack ? 2 : 1; i < 6; i += 1) {
    const v = step.kind === 'add the two before' ? step.f(all[i - 1], all[i - 2]) : step.f(all[i - 1], all[i - 2]);
    must(v === all[i], `the rule gives ${v}, not ${all[i]}, for term ${i + 1}`);
  }
  if (step.kind === 'rising differences') must(t[2] - t[1] - (t[1] - t[0]) !== 0, 'differences that change');
  // One reading only.
  const reads = readings(t);
  must(reads.length >= 1 && reads.every((r) => r.join() === next.join()), `another rule gives different next terms: ${JSON.stringify(reads)}`);

  const w = lines(q.workingOut);
  must(w.at(-1) === q.answer, 'the working ends on the answer');
  w.slice(0, -1).forEach((line) => {
    const lists = /^\\text\{(next )?differences: \} (.+)$/.exec(line);
    if (lists) {
      const ds = [t[1] - t[0], t[2] - t[1], t[3] - t[2], next[0] - t[3], next[1] - next[0]];
      must(lists[2] === (lists[1] ? ds.slice(3) : ds.slice(0, 3)).join(', '), `differences: ${line}`);
    } else lineHolds(line);
  });
  must(w.some((line) => line.includes(String(next[1]))) || step.kind === 'rising differences', 'the working reaches the last term');
  return { kind: step.kind };
}
