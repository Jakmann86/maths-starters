// Test support only. Checks algebraic-denominators from what is printed:
// the equation is read into a function of x, the answer must satisfy it
// with no denominator zero, and it must be the only solution. Every working
// line must hold at the answer and fail one either side of it, so a line is
// only true by being right.

const must = (cond, msg) => { if (!cond) throw new Error(msg); };
const lines = (s) => String(s ?? '').split('\n');

/** A TeX side with x in it, as a function of x. */
export function fn(tex) {
  let s = String(tex).trim();
  for (let i = 0; i < 3; i += 1) s = s.replace(/\\frac\{([^{}]+)\}\{([^{}]+)\}/g, '(($1)/($2))');
  s = s.replace(/\s+/g, '')
    .replace(/(\d)(x|\()/g, '$1*$2')
    .replace(/\)(\(|x|\d)/g, ')*$1')
    .replace(/x\(/g, 'x*(');
  must(/^[\dx.+\-*/()]+$/.test(s), `not an expression in x: ${tex}`);
  // eslint-disable-next-line no-new-func
  return Function('x', `"use strict"; return (${s});`);
}
const near = (a, b) => Math.abs(a - b) < 1e-9;
/** "L = R" holds at x. */
const holds = (line, x) => {
  const [l, r, more] = line.split(' = ');
  must(r !== undefined && more === undefined, `one equation: ${line}`);
  return near(fn(l)(x), fn(r)(x));
};
const denominators = (tex) => [...tex.matchAll(/\\frac\{[^{}]+\}\{([^{}]+)\}/g)].map((m) => m[1]);

export function checkAlgebraicDenominators(q, band) {
  must(q.metadata?.topic === 'algebraic-denominators' && q.metadata.difficulty === band, 'metadata');
  must(q.instruction === 'Solve' && !q.visualization && !q.answerUnits, 'instruction');
  must(typeof q.workingOut === 'string' && !q.workingOut.includes('\\n'), 'real newlines');
  const eq = q.questionMath;
  const m = /^x = (-?\d+)$/.exec(q.answer);
  must(m, `x = a whole number: ${q.answer}`);
  const x = Number(m[1]);
  must(holds(eq, x), `x = ${x} does not satisfy ${eq}`);
  denominators(eq).forEach((d) => must(!near(fn(d)(x), 0), `a zero denominator at x = ${x}`));
  // Linear once cleared of fractions, so it fails either side of x.
  must(!holds(eq, x + 1) && !holds(eq, x - 1), 'one solution only');

  const [lhs, rhs] = eq.split(' = ');
  const plain = (s) => /^-?\d+$/.test(s);
  if (band === 'foundation') {
    must(/^\\frac\{\d+\}\{[^{}]*x[^{}]*\}$/.test(lhs) && plain(rhs), 'a number over an expression in x, equal to a number');
  } else if (band === 'core') {
    must(/^\\frac\{[^{}]*x[^{}]*\}\{[^{}]*x[^{}]*\}$/.test(lhs) && plain(rhs), 'x above and below, equal to a number');
  } else {
    must([lhs, rhs].every((s) => /^\\frac\{\d+\}\{x [+-] \d+\}$/.test(s)), 'two fractions, numbers over x plus or minus a number');
  }

  const w = lines(q.workingOut);
  // Clear the fractions, tidy, collect x, solve: Foundation skips the
  // collecting when x has no coefficient to divide by.
  const lead = /^\\frac\{\d+\}\{(\d*)x/.exec(lhs);
  const steps = band === 'foundation' ? (lead && lead[1] && lead[1] !== '1' ? 4 : 3) : 4;
  must(w.at(-1) === q.answer && w.length === steps, `the working ends on the answer, in ${steps} lines`);
  must(/\(/.test(w[0]), 'the first line clears the fractions with a bracket');
  w.slice(0, -1).forEach((line) => {
    must(!line.includes('\\frac'), `fractions cleared: ${line}`);
    must(holds(line, x) && !holds(line, x + 1), `false or empty: ${line}`);
  });
  // The first line clears the fractions: the two sides cross-multiplied.
  return { kind: { foundation: 'number over x', core: 'x above and below', stretch: 'two fractions' }[band] };
}
