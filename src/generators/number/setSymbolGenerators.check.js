// Test support only. Checks set-symbols from what is printed: each set is
// rebuilt from its list, its words or its condition, each statement's truth
// worked out here, and the reason given for it checked against the sets.

const must = (cond, msg) => { if (!cond) throw new Error(msg); };
const lines = (s) => String(s ?? '').split('\n');
const range = (a, b) => Array.from({ length: Math.max(0, b - a + 1) }, (_, i) => a + i);
const isPrime = (n) => n > 1 && range(2, Math.floor(Math.sqrt(n))).every((d) => n % d);
const braces = (xs) => (xs.length ? `\\{${xs.join(', ')}\\}` : '\\varnothing');
const tf = (b) => (b ? 'true' : 'false');

/** A listed set: \{1, 4, 9\}. */
const readList = (s) => {
  const m = /^\\\{(\d+(?:, \d+)*)\\\}$/.exec(s);
  must(m, `a listed set: ${s}`);
  const xs = m[1].split(', ').map(Number);
  xs.forEach((v, i) => must(!i || v > xs[i - 1], 'listed in order, once each'));
  return xs;
};
/** A set in words, as Foundation writes it. */
const readWords = (s) => {
  let m;
  if ((m = /^\\text\{factors of \} (\d+)$/.exec(s))) return range(1, Number(m[1])).filter((d) => Number(m[1]) % d === 0);
  if ((m = /^\\text\{prime numbers less than \} (\d+)$/.exec(s))) return range(2, Number(m[1]) - 1).filter(isPrime);
  if ((m = /^\\text\{square numbers less than \} (\d+)$/.exec(s))) return range(1, Number(m[1]) - 1).filter((v) => Number.isInteger(Math.sqrt(v)));
  return must(false, `a set in words: ${s}`);
};

export function checkSetSymbols(q, band) {
  must(q.metadata?.topic === 'set-symbols' && q.metadata.difficulty === band, 'metadata');
  must(q.instruction === 'True or false?' && !q.visualization && !q.answerUnits, 'instruction');
  // A literal backslash-n, not a command such as \notin.
  must(typeof q.workingOut === 'string' && !/\\n(?![a-z])/.test(q.workingOut), 'real newlines');
  const Q = lines(q.questionMath);
  const w = lines(q.workingOut);
  const answer = (a, b) => `\\text{(a) ${tf(a)}, (b) ${tf(b)}}`;
  must(w.at(-1) === q.answer, 'the working ends on the answer');

  if (band === 'foundation') {
    must(Q.length === 3 && Q[0].startsWith('A = '), 'A, then two statements');
    const shown = Q[0].slice(4);
    const worded = shown.startsWith('\\text');
    const A = worded ? readWords(shown) : readList(shown);
    must(A.length >= 3, 'at least three elements');
    const sa = /^\\text\{\(a\) \} (\d+) \\in A$/.exec(Q[1]);
    const sb = /^\\text\{\(b\) \} (\d+) \\notin A$/.exec(Q[2]);
    must(sa && sb && sa[1] !== sb[1], `an element test each way: ${Q[1]} / ${Q[2]}`);
    const [x, y] = [Number(sa[1]), Number(sb[1])];
    must(q.answer === answer(A.includes(x), !A.includes(y)), `answer ${q.answer}`);
    const why = (v) => `${v} ${A.includes(v) ? '\\text{ is in }' : '\\text{ is not in }'} A`;
    must(w.join('|') === [...(worded ? [`A = ${braces(A)}`] : []), `${why(x)}, \\ ${why(y)}`, q.answer].join('|'), `working: ${w.join(' / ')}`);
    return { kind: worded ? 'in words' : 'listed' };
  }

  if (band === 'core') {
    must(Q.length === 3 && Q[0].startsWith('A = '), 'A, then two statements');
    const A = readList(Q[0].slice(4));
    const sa = /^\\text\{\(a\) \} (\\\{.+\\\}) \\subseteq A$/.exec(Q[1]);
    must(sa, `(a) a subset statement: ${Q[1]}`);
    const S = readList(sa[1]);
    const aTrue = S.every((v) => A.includes(v));
    let bTrue, reasonB;
    if (Q[2] === '\\text{(b) } \\varnothing \\subseteq A') {
      bTrue = true;
      reasonB = '\\text{(b) the empty set is a subset of every set}';
    } else {
      const sb = /^\\text\{\(b\) \} A \\subseteq (\\\{.+\\\})$/.exec(Q[2]);
      must(sb && sb[1] === sa[1], `(b) A in the same small set: ${Q[2]}`);
      bTrue = A.every((v) => S.includes(v));
      must(!bTrue, 'A is bigger');
      reasonB = `\\text{(b) } ${A.find((v) => !S.includes(v))} \\text{ is in } A \\text{ but not in } ${braces(S)}`;
    }
    must(q.answer === answer(aTrue, bTrue), `answer ${q.answer}`);
    const reasonA = aTrue
      ? `\\text{(a) every element of } ${braces(S)} \\text{ is in } A`
      : `\\text{(a) } ${S.find((v) => !A.includes(v))} \\text{ is not in } A`;
    must(w.join('|') === [reasonA, reasonB, q.answer].join('|'), `working: ${w.join(' / ')}`);
    return { kind: Q[2].includes('varnothing') ? 'with the empty set' : 'two listed sets' };
  }

  must(Q.length === 4, 'P, Q, R, then the two statements');
  const p = /^P = \\\{x \\mid x \\text\{ is a multiple of \} (\d+), \\ (\d+) < x < (\d+)\\\}$/.exec(Q[0]);
  const [qLine, rLine] = [Q[1], Q[2]];
  const qq = /^Q = \\\{\\text\{multiples of \} (\d+) \\le (\d+)\\\}$/.exec(qLine);
  const rr = /^R = \\\{\\text\{multiples of \} (\d+) \\le (\d+)\\\}$/.exec(rLine ?? '');
  must(p && qq && rr && qq[2] === rr[2], `the three sets: ${Q.slice(0, 3).join(' / ')}`);
  must(Q[3] === '\\text{(a) } P = \\varnothing, \\quad \\text{(b) } Q \\subseteq R', 'the two statements');
  const P = range(Number(p[2]) + 1, Number(p[3]) - 1).filter((v) => v % Number(p[1]) === 0);
  const top = Number(qq[2]);
  const Qs = range(1, top).filter((v) => v % Number(qq[1]) === 0);
  const Rs = range(1, top).filter((v) => v % Number(rr[1]) === 0);
  const sub = Qs.every((v) => Rs.includes(v));
  must(Number(qq[1]) !== Number(rr[1]), 'two different sets of multiples');
  must(q.answer === answer(P.length === 0, sub), `answer ${q.answer}`);
  const out = Qs.find((v) => !Rs.includes(v));
  const reason = sub ? `\\text{every multiple of } ${qq[1]} \\text{ is a multiple of } ${rr[1]}` : `${out} \\in Q \\text{ but } ${out} \\notin R`;
  must(w.join('|') === [`P = ${braces(P)}`, reason, q.answer].join('|'), `working: ${w.join(' / ')}`);
  return { kind: P.length === 0 ? 'P empty' : 'P not empty' };
}
