// src/generators/algebra/sequenceRuleGenerators.js
//
// Next terms and term-to-term rules — Haese 26A, syllabus E2.7a ("continue
// a sequence; term-to-term rules"). First in Arithmetic and geometric
// sequences, before any nth term:
//
//   foundation  add or subtract the same number each time
//   core        multiply or divide by the same number each time; the
//               multiplier may be negative, so the signs alternate
//   stretch     a rule of another kind: the difference goes up by the same
//               amount each time, each term is the two before added, or
//               multiply then add
//
// Four terms are shown. A sequence is only used if no other kind of rule
// here also fits its four terms with different next ones, so the answer is
// never one of two.

import _ from 'lodash';

const NL = '\n';
const list = (xs) => `${xs.join(', ')}, \\ldots`;
const tx = (s) => `\\text{${s}}`;
const answerOf = (next, rule) => `${next.join(', ')}; \\ ${rule}`;
const signed = (v) => (v < 0 ? `- ${-v}` : `+ ${v}`);

/** Next two terms under each kind of rule that fits all four terms. */
export function fits(t) {
  const out = [];
  const [a, b, c, d] = t;
  if (b - a === c - b && c - b === d - c) out.push(['add', [d + (d - c), d + 2 * (d - c)]]);
  if (a !== 0 && b * b === a * c && c * c === b * d && b !== a) {
    const r = b / a;
    out.push(['multiply', [d * r, d * r * r]]);
  }
  const s = (c - b) - (b - a);
  if (s !== 0 && (d - c) - (c - b) === s) out.push(['rising', [d + (d - c) + s, d + 2 * (d - c) + 3 * s]]);
  if (a + b === c && b + c === d) out.push(['two before', [c + d, c + 2 * d]]);
  // multiply then add: b = m a + k, c = m b + k gives m from the differences.
  if (b !== a && (c - b) % (b - a) === 0) {
    const m = (c - b) / (b - a), k = b - m * a;
    if (m !== 1 && m !== 0 && c * m + k === d) out.push(['two-step', [d * m + k, (d * m + k) * m + k]]);
  }
  return out;
}
/** True when every fitting rule gives the same next two terms. */
const unambiguous = (t) => new Set(fits(t).map(([, n]) => n.join())).size === 1;

export const generateSequenceRules = (options = {}) => {
  const { difficulty = 'core' } = options;
  const metadata = { topic: 'sequence-rules', difficulty };
  const instruction = 'Write down the next two terms and the term-to-term rule';
  const pick = _.random(0, difficulty === 'stretch' ? 2 : 1);

  for (;;) {
    let t, next, rule, work;

    if (difficulty === 'foundation') {
      const d = _.random(2, 12) * (pick === 0 ? 1 : -1);
      const a = _.random(pick === 0 ? -20 : 10, pick === 0 ? 40 : 90);
      t = [0, 1, 2, 3].map((i) => a + i * d);
      next = [a + 4 * d, a + 5 * d];
      rule = d > 0 ? tx(`add ${d}`) : tx(`subtract ${-d}`);
      work = [`${tx('differences: ')} ${[d, d, d].join(', ')}`, `${t[3]} ${signed(d)} = ${next[0]}, \\ ${next[0]} ${signed(d)} = ${next[1]}`];
    } else if (difficulty === 'core') {
      const r = _.sample(pick === 0 ? [2, 3, 4, 5, 10, -2, -3] : [2, 3, 4, 5, 10]);
      if (pick === 0) {
        const a = _.random(1, Math.abs(r) >= 5 ? 4 : 12) * _.sample([1, 1, -1]);
        t = [0, 1, 2, 3].map((i) => a * r ** i);
        next = [a * r ** 4, a * r ** 5];
        rule = tx(`multiply by ${r}`);
        const b = (v) => (v < 0 ? `(${v})` : v);
        work = [`${t[1]} \\div ${b(t[0])} = ${r}`, `${t[3]} \\times ${b(r)} = ${next[0]}, \\ ${next[0]} \\times ${b(r)} = ${next[1]}`];
      } else {
        const last = _.random(1, r >= 5 ? 6 : 20);
        const a = last * r ** 5;
        t = [0, 1, 2, 3].map((i) => a / r ** i);
        next = [a / r ** 4, last];
        rule = tx(`divide by ${r}`);
        work = [`${t[0]} \\div ${t[1]} = ${r}`, `${t[3]} \\div ${r} = ${next[0]}, \\ ${next[0]} \\div ${r} = ${next[1]}`];
      }
      if (Math.max(...t.map(Math.abs), ...next.map(Math.abs)) > 100000) continue;
    } else if (pick === 0) {
      // The difference goes up (or down) by s each time.
      const a = _.random(-5, 20), d1 = _.random(-3, 8), s = _.sample([1, 2, 3, 4, -1, -2]);
      const diffs = [d1, d1 + s, d1 + 2 * s, d1 + 3 * s, d1 + 4 * s];
      t = [a];
      diffs.forEach((dd) => t.push(t.at(-1) + dd));
      next = t.splice(4, 2);
      rule = tx(`the difference goes ${s > 0 ? 'up' : 'down'} by ${Math.abs(s)} each time`);
      work = [`${tx('differences: ')} ${diffs.slice(0, 3).join(', ')}`, `${tx('next differences: ')} ${diffs.slice(3).join(', ')}`];
    } else if (pick === 1) {
      const [a, b] = [_.random(1, 9), _.random(1, 12)];
      t = [a, b, a + b, a + 2 * b];
      next = [t[2] + t[3], t[3] + t[2] + t[3]];
      rule = tx('add the two terms before');
      work = [`${t[2]} + ${t[3]} = ${next[0]}, \\ ${t[3]} + ${next[0]} = ${next[1]}`];
    } else {
      const m = _.sample([2, 2, 3]), k = _.sample([-3, -2, -1, 1, 2, 3]);
      const a = _.random(1, 6);
      t = [a];
      for (let i = 0; i < 5; i += 1) t.push(t.at(-1) * m + k);
      next = t.splice(4, 2);
      rule = tx(`multiply by ${m}, then ${k > 0 ? 'add' : 'subtract'} ${Math.abs(k)}`);
      work = [`${t[3]} \\times ${m} ${signed(k)} = ${next[0]}, \\ ${next[0]} \\times ${m} ${signed(k)} = ${next[1]}`];
      if (Math.max(...next.map(Math.abs)) > 2000) continue;
    }

    // Distinct terms, and only one reading of them.
    if (new Set(t).size < 4 || !unambiguous(t)) continue;
    const answer = answerOf(next, rule);
    return {
      instruction,
      questionMath: list(t),
      answer,
      workingOut: [...work, answer].join(NL),
      metadata,
    };
  }
};
