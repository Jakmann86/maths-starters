// The tree-diagram checker, shared by the harness
// (treeDiagramGenerators.test.js) and the mutation test that proves the
// harness can fail (treeDiagramGenerators.mutation.test.js). Test support
// only — nothing in the app imports it.
//
// Every answer is recomputed from what a student can see: the branch labels
// on the figure, the set-up sentence, and the question. Nothing here imports
// the generator or its tables. The ask wording is re-stated below, by hand,
// so a generator whose words and paths quietly disagree fails rather than
// agreeing with itself.
//
// `checkTree` throws on the first problem and returns a summary otherwise.

/* ------------------------------------------------------------ rationals */

const gcd = (a, b) => (b ? gcd(b, a % b) : Math.abs(a));
const rat = (n, d) => {
  if (!Number.isInteger(n) || !Number.isInteger(d) || d <= 0) throw new Error(`bad rational ${n}/${d}`);
  const g = gcd(n, d) || 1;
  return { n: n / g, d: d / g };
};
const eq = (p, q) => p.n * q.d === q.n * p.d;
const plus = (p, q) => rat(p.n * q.d + q.n * p.d, p.d * q.d);
const times = (p, q) => rat(p.n * q.n, p.d * q.d);
const ONE = rat(1, 1);
const show = (p) => `${p.n}/${p.d}`;

const fail = (msg, q) => { throw new Error(`${msg}\n${JSON.stringify(q)}`); };
const must = (cond, msg, q) => { if (!cond) fail(msg, q); };

/* ------------------------------------------------------- figure labels */

// '4/9' or a decimal in tenths ('0.3'). Anything else is a fault.
function parseLabel(s, q) {
  let m = /^(\d+)\/(\d+)$/.exec(s);
  if (m) return { kind: 'frac', num: Number(m[1]), den: Number(m[2]), v: rat(Number(m[1]), Number(m[2])) };
  m = /^0\.([1-9])$/.exec(s);
  if (m) return { kind: 'dec', v: rat(Number(m[1]), 10) };
  return fail(`unreadable branch label "${s}"`, q);
}

/* -------------------------------------------------- answers and working */

// A decimal as written: no trailing zero, at most two places.
function parseDecimal(s) {
  const m = /^0\.(\d{1,2})$/.exec(s);
  if (!m || m[1].endsWith('0')) return null;
  return rat(Number(m[1]), m[1].length === 1 ? 10 : 100);
}

// An evaluator for exactly what the working may hold: \frac{a}{b}, decimals,
// whole numbers, \times, + and -. Returns null for anything else.
function evaluate(expr) {
  const tokens = expr.replace(/\\frac\{(\d+)\}\{(\d+)\}/g, ' F$1/$2 ')
    .replace(/\\times/g, ' * ').replace(/\+/g, ' + ').replace(/(^|\s)-(\s)/g, '$1 - $2')
    .trim().split(/\s+/);
  let i = 0;
  const atom = () => {
    const t = tokens[i++];
    if (t == null) return null;
    let m = /^F(\d+)\/(\d+)$/.exec(t);
    if (m) return rat(Number(m[1]), Number(m[2]));
    m = /^(\d+)$/.exec(t);
    if (m) return rat(Number(m[1]), 1);
    m = /^0\.(\d+)$/.exec(t);
    if (m) return rat(Number(m[1]), 10 ** m[1].length);
    return null;
  };
  const term = () => {
    let v = atom();
    while (v && tokens[i] === '*') { i += 1; const w = atom(); v = w && times(v, w); }
    return v;
  };
  let v = term();
  while (v && (tokens[i] === '+' || tokens[i] === '-')) {
    const op = tokens[i++];
    const w = term();
    v = w && (op === '+' ? plus(v, w) : plus(v, rat(-w.n, w.d)));
  }
  return v && i === tokens.length ? v : null;
}

const parseAnswer = (s) => {
  const m = /^\\frac\{(\d+)\}\{(\d+)\}$/.exec(s);
  if (m) return { kind: 'frac', num: Number(m[1]), den: Number(m[2]), v: rat(Number(m[1]), Number(m[2])) };
  const d = parseDecimal(s);
  return d ? { kind: 'dec', v: d } : null;
};

/* ---------------------------------------------------- set-up sentences */

const BAG = /^A (bag|box|jar) holds (\d+) ([a-z]+) \(([A-Z])\) and (\d+) ([a-z]+) \(([A-Z])\) ([a-z]+)\. Two are taken at random, (with|without) replacement\.$/;

// Each event set-up, and every ask it allows mapped to the paths it covers.
// Written out here independently of the generator's own table.
const EVENT_SETUPS = [
  {
    re: /^The tree shows whether it rains \(R\) or is dry \(D\) on Saturday and on Sunday\.$/,
    letters: ['R', 'D'],
    asks: {
      'it rains on both days': ['XX'],
      'it rains on Saturday but not on Sunday': ['XY'],
      'it is dry on Saturday but rains on Sunday': ['YX'],
      'it is dry on both days': ['YY'],
      'it rains on exactly one of the two days': ['XY', 'YX'],
      'the weather is the same on both days': ['XX', 'YY'],
    },
  },
  {
    re: /^The tree shows whether ([A-Z][a-zá]+) scores \(S\) or misses \(M\) each of two penalties\.$/,
    letters: ['S', 'M'],
    asks: (who) => ({
      [`${who} scores both penalties`]: ['XX'],
      [`${who} scores the first penalty and misses the second`]: ['XY'],
      [`${who} misses the first penalty and scores the second`]: ['YX'],
      [`${who} misses both penalties`]: ['YY'],
      [`${who} scores exactly one of the penalties`]: ['XY', 'YX'],
      'both penalties have the same result': ['XX', 'YY'],
    }),
  },
  {
    re: /^The tree shows whether a bus is late \(L\) or on time \(T\) on Monday and on Tuesday\.$/,
    letters: ['L', 'T'],
    asks: {
      'the bus is late on both days': ['XX'],
      'the bus is late on Monday but on time on Tuesday': ['XY'],
      'the bus is on time on Monday but late on Tuesday': ['YX'],
      'the bus is on time on both days': ['YY'],
      'the bus is late on exactly one of the two days': ['XY', 'YX'],
      'the bus is late on both days or on time on both days': ['XX', 'YY'],
    },
  },
  {
    re: /^The tree shows whether a team wins \(W\) or loses \(L\) each of its first two matches\.$/,
    letters: ['W', 'L'],
    asks: {
      'the team wins both matches': ['XX'],
      'the team wins the first match and loses the second': ['XY'],
      'the team loses the first match and wins the second': ['YX'],
      'the team loses both matches': ['YY'],
      'the team wins exactly one of the two matches': ['XY', 'YX'],
      'the team wins both matches or loses both': ['XX', 'YY'],
    },
  },
  {
    re: /^The tree shows whether a driver meets red \(R\) or green \(G\) at each of two sets of traffic lights\.$/,
    letters: ['R', 'G'],
    // Two sets of lights don't influence each other, so this context is
    // only ever drawn independent.
    independentOnly: true,
    asks: {
      'both lights are red': ['XX'],
      'the first light is red and the second is green': ['XY'],
      'the first light is green and the second is red': ['YX'],
      'both lights are green': ['YY'],
      'exactly one of the two lights is red': ['XY', 'YX'],
      'both lights show the same colour': ['XX', 'YY'],
    },
  },
];

const bagAsks = (c1, c2, plural) => ({
  [`both are ${c1}`]: ['XX'],
  [`both are ${c2}`]: ['YY'],
  [`the first is ${c1} and the second is ${c2}`]: ['XY'],
  [`the first is ${c2} and the second is ${c1}`]: ['YX'],
  [`the two ${plural} are different colours`]: ['XY', 'YX'],
  [`the two ${plural} are the same colour`]: ['XX', 'YY'],
  [`at least one is ${c1}`]: ['XX', 'XY', 'YX'],
  [`at least one is ${c2}`]: ['XY', 'YX', 'YY'],
});

const KEYS = ['x', 'y', 'xx', 'xy', 'yx', 'yy'];
const SECOND = ['xx', 'xy', 'yx', 'yy'];
const PATH = { XX: ['x', 'xx'], XY: ['x', 'xy'], YX: ['y', 'yx'], YY: ['y', 'yy'] };

/** The paths a question covers, read from its set-up and its ask. */
export function readQuestion(q) {
  const ask = /^Find the probability that (.+)\.$/.exec(q.questionText ?? '');
  must(ask, 'questionText is not a "Find the probability that ..." ask', q);
  const bag = BAG.exec(q.instruction);
  if (bag) {
    const [, , a, c1, L1, b, c2, L2, plural, mode] = bag;
    const paths = bagAsks(c1, c2, plural)[ask[1]];
    must(paths, `unrecognised ask "${ask[1]}"`, q);
    return { source: 'bag', a: Number(a), b: Number(b), letters: [L1, L2], replace: mode === 'with', paths };
  }
  for (const s of EVENT_SETUPS) {
    const m = s.re.exec(q.instruction);
    if (!m) continue;
    const table = typeof s.asks === 'function' ? s.asks(m[1]) : s.asks;
    const paths = table[ask[1]];
    must(paths, `unrecognised ask "${ask[1]}"`, q);
    return { source: 'event', letters: s.letters, independentOnly: Boolean(s.independentOnly), paths };
  }
  return fail('unrecognised set-up sentence', q);
}

/* ------------------------------------------------------------ the check */

export function checkTree(q, difficulty) {
  must(q && typeof q === 'object', 'not an object', q);
  must(q.metadata?.topic === 'tree-diagrams' && q.metadata?.difficulty === difficulty, 'metadata', q);
  must(q.questionMath === undefined, 'a worded tree question has no questionMath', q);
  must(typeof q.instruction === 'string' && !q.instruction.includes('\\'), 'instruction must be plain text', q);
  must(typeof q.questionText === 'string' && !q.questionText.includes('\\'), 'questionText must be plain text', q);
  must(q.answerUnits === undefined, 'a probability has no units', q);

  const fig = q.visualization;
  must(fig?.type === 'tree-diagram', 'figure type', q);
  must(Array.isArray(fig.outcomes) && fig.outcomes.length === 2 && fig.outcomes[0] !== fig.outcomes[1]
    && fig.outcomes.every((l) => /^[A-Z]$/.test(l)), 'outcomes are two different capital letters', q);
  must(KEYS.every((k) => typeof fig.probs?.[k] === 'string'), 'six branch labels', q);
  must(Object.keys(fig.probs).length === 6, 'exactly six branch labels', q);

  // Stretch withholds the second stage, and reveals it; the others show all.
  const hidden = difficulty === 'stretch';
  if (hidden) {
    must(SECOND.every((k) => fig.probs[k] === ''), 'stretch leaves the second stage blank', q);
    must(fig.probs.x !== '' && fig.probs.y !== '', 'stretch shows the first stage', q);
    must(SECOND.every((k) => typeof fig.solution?.[k] === 'string' && fig.solution[k] !== ''), 'stretch reveals the second stage', q);
    must(Object.keys(fig.solution).length === 4, 'solution holds only the second stage', q);
  } else {
    must(KEYS.every((k) => fig.probs[k] !== ''), 'every branch labelled', q);
    must(fig.solution === undefined, 'no solution below stretch', q);
  }
  const text = { ...fig.probs, ...(hidden ? fig.solution : {}) };
  KEYS.forEach((k) => must(!/[\\−-]/.test(text[k]), `figure label "${text[k]}" is plain and unsigned`, q));
  const L = Object.fromEntries(KEYS.map((k) => [k, parseLabel(text[k], q)]));
  const kinds = new Set(KEYS.map((k) => L[k].kind));
  must(kinds.size === 1, 'fractions and decimals are not mixed on one tree', q);

  // Each pair of branches leaving a point sums to 1.
  [['x', 'y'], ['xx', 'xy'], ['yx', 'yy']].forEach(([a, b]) => (
    must(eq(plus(L[a].v, L[b].v), ONE), `${a} + ${b} = 1`, q)
  ));

  // The tree agrees with the set-up.
  const r = readQuestion(q);
  must(r.letters[0] === fig.outcomes[0] && r.letters[1] === fig.outcomes[1], 'letters on the tree match the set-up', q);
  if (r.source === 'bag') {
    const { a, b } = r;
    const n = a + b;
    must(a >= 2 && b >= 2 && a !== b, 'bag counts at least 2 and different', q);
    const m = r.replace ? n : n - 1;
    const want = {
      x: `${a}/${n}`, y: `${b}/${n}`,
      xx: `${r.replace ? a : a - 1}/${m}`, xy: `${b}/${m}`,
      yx: `${a}/${m}`, yy: `${r.replace ? b : b - 1}/${m}`,
    };
    // Exact text: the counts over the total, unsimplified.
    KEYS.forEach((k) => must(text[k] === want[k], `${k} should read ${want[k]}, reads ${text[k]}`, q));
  } else {
    must(L.x.kind === 'dec', 'an event tree is in decimals', q);
    if (r.independentOnly) must(text.xx === text.yx, 'independent context, second stage the same both ways', q);
  }

  // What each band may ask, and of which trees.
  const independent = r.source === 'event' && text.xx === text.yx;
  if (difficulty === 'foundation') {
    must(r.paths.length === 1, 'foundation asks for one path', q);
    must((r.source === 'bag' && r.replace) || independent, 'foundation: with replacement or independent', q);
  }
  if (difficulty === 'core') {
    must(r.paths.length === 2, 'core asks for two paths', q);
  }
  if (difficulty === 'stretch') {
    must(r.source === 'bag' && !r.replace, 'stretch is without replacement', q);
    must(r.paths.length >= 2, 'stretch asks for two paths or at least one', q);
  }

  // The answer, from the branches.
  const pathValue = (p) => times(L[PATH[p][0]].v, L[PATH[p][1]].v);
  const want = r.paths.reduce((acc, p) => plus(acc, pathValue(p)), rat(0, 1));
  const ans = parseAnswer(q.answer);
  must(ans, `unreadable answer "${q.answer}"`, q);
  must(ans.kind === L.x.kind, 'answer is in the same form as the branches', q);
  must(eq(ans.v, want), `answer ${q.answer} should be ${show(want)}`, q);
  if (ans.kind === 'frac') {
    // Unsimplified: the denominator is the product of the two stages'.
    const den = L.x.den * L.xx.den;
    must(ans.den === den, `answer denominator should be ${den}, unsimplified`, q);
  }
  if (difficulty === 'foundation') {
    must(!KEYS.some((k) => text[k] === q.answer), 'answer is not also a branch label', q);
  }

  // Every working line balances, each P(..) matches its path on the tree,
  // and the last value written is the answer.
  must(typeof q.workingOut === 'string' && !q.workingOut.includes('\\n'), 'working uses real newlines', q);
  must(!q.workingOut.includes('−'), 'working uses an ASCII hyphen', q);
  const lines = q.workingOut.split('\n');
  let last = null;
  lines.forEach((line) => {
    const segs = line.split('=').map((s) => s.trim());
    const values = [];
    let label = null;
    segs.forEach((s, i) => {
      if (s === '' && i === 0) return; // a line continuing "= ..."
      const pm = /^P\(\\text\{([A-Z])([A-Z])\}\)$/.exec(s);
      if (pm) {
        must(i === 0, 'P(..) only at the start of a line', q);
        const idx = (c) => fig.outcomes.indexOf(c);
        must(idx(pm[1]) >= 0 && idx(pm[2]) >= 0, `P(${pm[1]}${pm[2]}) names outcomes on the tree`, q);
        label = `${'XY'[idx(pm[1])]}${'XY'[idx(pm[2])]}`;
        return;
      }
      const v = evaluate(s);
      must(v, `working segment "${s}" does not evaluate`, q);
      values.push(v);
    });
    must(values.length > 0, `working line "${line}" has a value`, q);
    values.forEach((v) => must(eq(v, values[0]), `working line "${line}" does not balance`, q));
    if (label) must(eq(values[0], pathValue(label)), `working "${line}" disagrees with the tree`, q);
    if (line.trim().startsWith('=')) must(last && eq(values[0], last), `"${line}" does not follow from the line before`, q);
    last = values[values.length - 1];
  });
  must(lines[lines.length - 1].trim().endsWith(q.answer), 'working ends on the answer as written', q);

  return { source: r.source, replace: r.replace, independent, paths: r.paths.join('+'), kind: L.x.kind };
}
