// src/generators/algebra/likeTermsGenerators.js
//
// Collecting like terms — syllabus E2.2a ("simplify expressions by
// collecting like terms"), Haese assumed knowledge, Rayner 3. First in
// Expanding brackets, since every expansion ends with it:
//
//   foundation  one or two letters and numbers: 5a + 3 + 2a - 1
//   core        a letter and its square, which are not alike, and minus
//               signs that leave a negative: 3x^2 + 5x - x^2 - 8x + 2
//   stretch     two letters multiplied, the same term written in another
//               order (yx^2 is x^2y), and one group that cancels to nothing
//
// The answer runs in descending powers. The working brackets each group of
// like terms first, in the order the groups first appear.

import _ from 'lodash';

const NL = '\n';
const LETTERS = [['a', 'b'], ['x', 'y'], ['p', 'q'], ['m', 'n'], ['c', 'd']];

/** A monomial as written: [['x', 2], ['y', 1]] → "x^2y". */
const mono = (fs) => fs.map(([v, e]) => (e === 1 ? v : `${v}^${e}`)).join('');
const body = (c, m) => (m === '' ? `${Math.abs(c)}` : `${Math.abs(c) === 1 ? '' : Math.abs(c)}${m}`);
/** Terms { c, m } as one expression: "3x - 2y + 5". */
const expr = (ts) => ts.map((t, i) => (i === 0
  ? `${t.c < 0 ? '-' : ''}${body(t.c, t.m)}`
  : ` ${t.c < 0 ? '-' : '+'} ${body(t.c, t.m)}`)).join('');
const nz = (a, b) => _.sample(_.range(a, b + 1).filter((v) => v !== 0));

/**
 * Split each group's total into written terms, shuffle them into a question,
 * and build the working and answer. groups: [{ fs, total, parts, alt }] with
 * `alt` an optional other way of writing the monomial.
 */
function assemble(groups) {
  const written = groups.flatMap((g, gi) => g.parts.map((c, pi) => ({
    c, gi, m: pi > 0 && g.alt ? g.alt : mono(g.fs),
  })));
  // Shuffled, but the first two terms are never alike, which would make
  // the first step look done already. Never a minus sign first either.
  for (;;) {
    const q = _.shuffle(written);
    if (q[0].gi === q[1].gi || q[0].c < 0) continue;
    const order = _.uniq(q.map((t) => t.gi));
    // The answer in descending powers, a tie going to the positive term and
    // then to the one met first: 7m^2 - 3m - 7, not -3m + 7m^2 - 7.
    const deg = (gi) => _.sumBy(groups[gi].fs, 1);
    const live = order.filter((gi) => groups[gi].total !== 0);
    const ranked = _.sortBy(live, [(gi) => -deg(gi), (gi) => (groups[gi].total > 0 ? 0 : 1), (gi) => order.indexOf(gi)]);
    const answerTerms = ranked.map((gi) => ({ c: groups[gi].total, m: mono(groups[gi].fs) }));
    const grouped = order.map((gi) => `(${expr(q.filter((t) => t.gi === gi))})`).join(' + ');
    return { question: expr(q), answer: answerTerms.length ? expr(answerTerms) : '0', grouped };
  }
}

/** Split a total into n different non-zero parts in range. */
function parts(total, n, lo, hi) {
  for (;;) {
    const ps = _.range(n - 1).map(() => nz(lo, hi));
    const last = total - _.sum(ps);
    // Distinct parts: 2 + 2 reads as a slip, not a question.
    if (last !== 0 && last >= lo && last <= hi && new Set([...ps, last]).size === n) return _.shuffle([...ps, last]);
  }
}

export const generateLikeTerms = (options = {}) => {
  const { difficulty = 'core' } = options;
  const metadata = { topic: 'like-terms', difficulty };
  const [u, v] = _.sample(LETTERS);
  let groups;

  if (difficulty === 'foundation') {
    // Two groups: a letter and numbers, or two letters; positive totals.
    const second = _.random(0, 1) ? [] : [[v, 1]];
    groups = [
      { fs: [[u, 1]], total: _.random(3, 12) },
      { fs: second, total: _.random(3, 12) },
    ].map((g) => ({ ...g, parts: parts(g.total, 2, 1, 9) }));
    // One subtraction: a group written as a bigger number take away a
    // smaller one, so its total stays positive.
    const g = _.sample(groups);
    const b = _.random(1, 5);
    g.parts = [g.total + b, -b];
  } else if (difficulty === 'core') {
    groups = [
      { fs: [[u, 2]], total: nz(-6, 8) },
      { fs: [[u, 1]], total: nz(-9, 9) },
      { fs: [], total: nz(-9, 9) },
    ];
    // At least one total negative, so the signs have to be followed.
    if (groups.every((g) => g.total > 0)) groups[_.random(0, 1)].total *= -1;
    // Some term positive, so the question can open without a minus sign.
    do {
      groups.forEach((g, i) => { g.parts = parts(g.total, i === 2 ? 1 : 2, -9, 9); });
    } while (groups.every((g) => g.parts.every((c) => c < 0)));
  } else {
    // x^2y, xy^2 and xy; one of them cancels, one is written back to front.
    const kinds = _.shuffle([[[u, 2], [v, 1]], [[u, 1], [v, 2]], [[u, 1], [v, 1]]]);
    groups = kinds.map((fs, i) => {
      const total = i === 0 ? 0 : nz(-7, 8);
      return {
        fs,
        total,
        parts: total === 0 ? (() => { const a = _.random(2, 7); return _.shuffle([a, -a]); })() : parts(total, 2, -8, 8),
        alt: mono([...fs].reverse()),
      };
    });
    if (groups.slice(1).every((g) => g.total < 0)) { groups[1].total *= -1; groups[1].parts = groups[1].parts.map((c) => -c); }
  }

  const { question, answer, grouped } = assemble(groups);
  return {
    instruction: 'Simplify',
    questionMath: question,
    answer,
    workingOut: [grouped, answer].join(NL),
    metadata,
  };
};

