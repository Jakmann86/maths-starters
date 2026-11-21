// Test support only. Checks like-terms from what is printed: the question,
// the bracketed working and the answer are each expanded (polynomial.check)
// and must be the same polynomial. The answer must be fully collected, and
// each band's shape is read from the question itself.

import { expand } from './polynomial.check';

const must = (cond, msg) => { if (!cond) throw new Error(msg); };
const same = (p, q) => p.size === q.size && [...p].every(([k, v]) => q.get(k) === v);
/** The written terms of an expression: "3x - 2y + 5" → ['3x', '-2y', '5']. */
const terms = (s) => s.replace(/ - /g, ' + -').split(' + ');
const keyOf = (t) => [...expand(t).keys()][0];
const degree = (k) => (k.match(/\d+/g) || []).reduce((a, b) => a + Number(b), 0);

export function checkLikeTerms(q, band) {
  must(q.metadata?.topic === 'like-terms' && q.metadata.difficulty === band, 'metadata');
  must(q.instruction === 'Simplify' && !q.visualization && !q.answerUnits, 'instruction');
  must(typeof q.workingOut === 'string' && !/\\n(?![a-z])/.test(q.workingOut), 'real newlines');
  const question = expand(q.questionMath);
  const answer = expand(q.answer);
  must(same(question, answer), `${q.answer} is not ${q.questionMath}`);

  // Fully collected: one term per kind, none zero, no coefficient of 1.
  const at = terms(q.answer);
  must(at.length === answer.size, 'one term of each kind in the answer');
  at.forEach((t) => must(!/^-?1[a-z]/.test(t) && !/^-?0/.test(t), `no 1 or 0 written: ${t}`));
  // Descending powers.
  const degs = at.map((t) => degree(keyOf(t)));
  degs.slice(1).forEach((d, i) => must(d <= degs[i], 'the answer in descending powers'));

  const qt = terms(q.questionMath);
  const kinds = new Set(qt.map(keyOf));
  must(!q.questionMath.startsWith('-'), 'the question opens with a plus term');
  must(keyOf(qt[0]) !== keyOf(qt[1]), 'the first two terms are not alike');
  const letters = new Set(q.questionMath.match(/[a-z]/g));
  if (band === 'foundation') {
    must(qt.length === 4 && kinds.size === 2, 'four terms of two kinds');
    must([...kinds].every((k) => degree(k) <= 1), 'no powers or products');
    must([...answer.values()].every((c) => c > 0), 'a positive answer');
    must(qt.some((t) => t.startsWith('-')), 'one subtraction');
  } else if (band === 'core') {
    must(letters.size === 1 && qt.length === 5 && kinds.size === 3, 'one letter: its square, itself and a number, five terms');
    must([...answer.values()].some((c) => c < 0), 'a negative left in the answer');
  } else {
    must(letters.size === 2 && qt.length === 6 && kinds.size === 3, 'two letters, six terms of three kinds');
    must([...kinds].every((k) => degree(k) >= 2 && (k.match(/[a-z]/g) || []).length === 2), 'every term a product of both letters');
    must(answer.size === 2, 'one kind cancels');
    // Some term written out of alphabetical order (yx^2 for x^2y).
    must(qt.some((t) => { const ls = t.match(/[a-z]/g); return ls[0] > ls[1]; }), 'a term written back to front');
  }

  const w = q.workingOut.split('\n');
  must(w.length === 2 && w[1] === q.answer, 'the grouping, then the answer');
  const groups = w[0].split(') + (').map((g) => g.replace(/^\(|\)$/g, ''));
  must(groups.length === kinds.size, 'a bracket for each kind of term');
  groups.forEach((g) => must(new Set(terms(g).map(keyOf)).size === 1, `like terms only in a bracket: ${g}`));
  must(same(expand(w[0]), question), 'the grouping is the question rearranged');
  must(groups.flatMap(terms).sort().join() === [...qt].sort().join(), 'every question term, once, as written');
  return { kind: { foundation: 'two kinds', core: 'powers', stretch: 'products' }[band] };
}
