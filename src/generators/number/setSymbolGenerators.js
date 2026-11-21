// src/generators/number/setSymbolGenerators.js
//
// Set symbols — Haese 2A, Rayner 12.1, syllabus E1.2b (∈, ∉, ⊆, ∅ and
// set-builder notation). First in Sets: two statements to mark true or
// false, with the reason for each in the working.
//
//   foundation  ∈ and ∉, for a set listed or described in words
//   core        ⊆, between listed sets, the empty set among them
//   stretch     a set in set-builder notation, empty or not; is one set
//               of multiples a subset of another
//
// Sets are built here and the truth of each statement worked out, so half
// or so of the statements are false, never by accident.

import _ from 'lodash';

const NL = '\n';
const range = (a, b) => _.range(a, b + 1);
const braces = (xs) => (xs.length ? `\\{${xs.join(', ')}\\}` : '\\varnothing');
const isPrime = (n) => n > 1 && range(2, Math.floor(Math.sqrt(n))).every((d) => n % d);
const tf = (b) => (b ? 'true' : 'false');
const answerOf = (a, b) => `\\text{(a) ${tf(a)}, (b) ${tf(b)}}`;

// Sets described in words, each up to a bound: [words, members].
const DESCRIBED = [
  (n) => [`\\text{factors of } ${n}`, range(1, n).filter((d) => n % d === 0)],
  (n) => [`\\text{prime numbers less than } ${n}`, range(2, n - 1).filter(isPrime)],
  (n) => [`\\text{square numbers less than } ${n}`, range(1, n - 1).filter((v) => Number.isInteger(Math.sqrt(v)))],
];

/* ------------------------------------------------------- set-symbols */

export const generateSetSymbols = (options = {}) => {
  const { difficulty = 'core' } = options;
  const metadata = { topic: 'set-symbols', difficulty };
  const instruction = 'True or false?';
  const emptyP = _.random(0, 1) === 1;

  for (;;) {
    if (difficulty === 'foundation') {
      // A listed set, or one in words; an element test each way.
      const worded = _.random(0, 1) === 1;
      let shown, members;
      if (worded) {
        const make = _.sample(DESCRIBED);
        const n = _.sample([12, 18, 20, 24, 30, 36, 40, 50]);
        [shown, members] = make(n);
        if (members.length < 3) continue;
      } else {
        members = _.sortBy(_.sampleSize(range(1, 20), _.random(4, 6)));
        shown = braces(members);
      }
      const top = Math.max(...members) + 3;
      const pool = range(1, top);
      // (a) uses ∈, (b) uses ∉; each true or false by its own draw.
      const pickFor = (wantIn) => _.sample(pool.filter((v) => members.includes(v) === wantIn));
      const aTrue = _.random(0, 1) === 1, bTrue = _.random(0, 1) === 1;
      const x = pickFor(aTrue), y = pickFor(!bTrue);
      if (x === undefined || y === undefined || x === y) continue;
      const answer = answerOf(aTrue, bTrue);
      const why = (v) => `${v} ${members.includes(v) ? '\\text{ is in }' : '\\text{ is not in }'} A`;
      return {
        instruction,
        questionMath: [`A = ${shown}`, `\\text{(a) } ${x} \\in A`, `\\text{(b) } ${y} \\notin A`].join(NL),
        answer,
        workingOut: [...(worded ? [`A = ${braces(members)}`] : []), `${why(x)}, \\ ${why(y)}`, answer].join(NL),
        metadata,
      };
    }

    if (difficulty === 'core') {
      // A listed; (a) a small set ⊆ A or not; (b) ∅ ⊆ A (always true), or
      // A ⊆ the small set (false, as it is smaller).
      const A = _.sortBy(_.sampleSize(range(1, 15), _.random(5, 7)));
      const aTrue = _.random(0, 1) === 1;
      let S;
      if (aTrue) S = _.sortBy(_.sampleSize(A, _.random(2, 3)));
      else {
        const outside = _.sample(range(1, 15).filter((v) => !A.includes(v)));
        S = _.sortBy([..._.sampleSize(A, _.random(1, 2)), outside]);
      }
      const empty = _.random(0, 1) === 1;
      const b = empty ? `\\varnothing \\subseteq A` : `A \\subseteq ${braces(S)}`;
      const reasonA = aTrue
        ? `\\text{(a) every element of } ${braces(S)} \\text{ is in } A`
        : `\\text{(a) } ${S.find((v) => !A.includes(v))} \\text{ is not in } A`;
      const reasonB = empty
        ? '\\text{(b) the empty set is a subset of every set}'
        : `\\text{(b) } ${A.find((v) => !S.includes(v))} \\text{ is in } A \\text{ but not in } ${braces(S)}`;
      const answer = answerOf(aTrue, empty);
      return {
        instruction,
        questionMath: [`A = ${braces(A)}`, `\\text{(a) } ${braces(S)} \\subseteq A`, `\\text{(b) } ${b}`].join(NL),
        answer,
        workingOut: [reasonA, reasonB, answer].join(NL),
        metadata,
      };
    }

    // stretch: P (in set-builder notation) empty or not; Q ⊆ R or not.
    const m = _.random(4, 13);
    const lo = _.random(10, 60);
    const hi = lo + _.random(2, 5);
    const P = range(lo + 1, hi - 1).filter((v) => v % m === 0);
    // Empty about half the time: drawn once, before the loop.
    if ((P.length === 0) !== emptyP) continue;
    const [q, r] = _.sample([[6, 3], [6, 2], [10, 5], [12, 4], [12, 6], [8, 4], [9, 3], [15, 5], [6, 4], [10, 4], [9, 6], [8, 6], [15, 10], [12, 8]]);
    const top = _.sample([30, 36, 40, 48, 60]);
    const Q = range(1, top).filter((v) => v % q === 0);
    const R = range(1, top).filter((v) => v % r === 0);
    const sub = Q.every((v) => R.includes(v));

    const answer = answerOf(P.length === 0, sub);
    return {
      instruction,
      questionMath: [
        // P in set-builder notation; Q and R in words, as Haese writes them.
        `P = \\{x \\mid x \\text{ is a multiple of } ${m}, \\ ${lo} < x < ${hi}\\}`,
        // Four lines: Q and R together are too wide for a printed half
        // page, but the two statements share one.
        `Q = \\{\\text{multiples of } ${q} \\le ${top}\\}`,
        `R = \\{\\text{multiples of } ${r} \\le ${top}\\}`,
        '\\text{(a) } P = \\varnothing, \\quad \\text{(b) } Q \\subseteq R',
      ].join(NL),
      answer,
      workingOut: [
        `P = ${braces(P)}`,
        sub
          ? `\\text{every multiple of } ${q} \\text{ is a multiple of } ${r}`
          : `${Q.find((v) => !R.includes(v))} \\in Q \\text{ but } ${Q.find((v) => !R.includes(v))} \\notin R`,
        answer,
      ].join(NL),
      metadata,
    };
  }
};
