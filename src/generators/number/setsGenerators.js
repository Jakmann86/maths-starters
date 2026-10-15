// src/generators/number/setsGenerators.js
//
// Haese Chapter 2 (D Venn diagrams, E union and intersection, F problem
// solving) and Rayner Chapter 12. Three skills, on the two-circle figure and,
// at Stretch, the three-circle one:
//
//   venn-counts          numbers in the regions
//     foundation  read and add                    "How many play rugby?"
//     core        one region withheld, total given
//     stretch     the regions are 16 - x, x, 11 - x   (Haese Example 12)
//
//   venn-place-elements  sort a universe into the regions (fills on reveal)
//     foundation  A and B listed
//     core        A and B described: "factors of 12", "prime numbers"
//     stretch     three sets described, three circles
//
//   venn-set-operations  elements in the regions
//     foundation  list A                          no symbol
//     core        list A n B, A u B               one symbol
//     stretch     half two-set: (A u B)', A' n B, ...   complement plus a symbol
//                 half three-set: (B n C) n A', (A u B) n C, ...
//                                                 a bracket, then a second operation
//
// MINUS SIGNS. The figure carries "16 − x" with a literal U+2212, because
// figure labels are plain SVG text and never reach the renderer (CLAUDE.md
// §6). The working carries "16 - x" with an ASCII hyphen, because that text
// does go through the parser, which turns a hyphen before a digit or letter
// into U+2212 itself (SPEC §6). The two are deliberately different.

import _ from 'lodash';

const NL = '\n';
const MINUS = '−';

/* ---------------------------------------------------------------- counts */

// Both sets in a context share a verb, so one phrasing serves every question
// the band asks: "play rugby", "play both rugby and cricket", "do not play
// rugby or cricket". Circle labels are the objects themselves rather than
// letters — on a starter there is no room to define R and C first, and the
// notation is skill two's job.
// `label` goes on the circle, where there is room for one word; `phrase` goes
// in the sentence, where it needs its article. Keeping them separate is what
// makes "How many workers use the bus?" read as English rather than
// "How many workers use bus?".
export const COUNT_CONTEXTS = [
  { unit: 'students', verb: 'play', a: { label: 'Rugby', phrase: 'rugby' }, b: { label: 'Cricket', phrase: 'cricket' } },
  { unit: 'students', verb: 'study', a: { label: 'French', phrase: 'French' }, b: { label: 'Spanish', phrase: 'Spanish' } },
  { unit: 'houses', verb: 'have', a: { label: 'Garden', phrase: 'a garden' }, b: { label: 'Garage', phrase: 'a garage' } },
  { unit: 'pupils', verb: 'take', a: { label: 'Music', phrase: 'music' }, b: { label: 'Drama', phrase: 'drama' } },
  { unit: 'families', verb: 'own', a: { label: 'Dog', phrase: 'a dog' }, b: { label: 'Cat', phrase: 'a cat' } },
  { unit: 'people', verb: 'take', a: { label: 'Milk', phrase: 'milk' }, b: { label: 'Sugar', phrase: 'sugar' } },
  { unit: 'members', verb: 'attend', a: { label: 'Yoga', phrase: 'yoga' }, b: { label: 'Pilates', phrase: 'pilates' } },
  { unit: 'students', verb: 'play', a: { label: 'Piano', phrase: 'the piano' }, b: { label: 'Guitar', phrase: 'the guitar' } },
  { unit: 'children', verb: 'like', a: { label: 'Apples', phrase: 'apples' }, b: { label: 'Bananas', phrase: 'bananas' } },
  { unit: 'workers', verb: 'use', a: { label: 'Bus', phrase: 'the bus' }, b: { label: 'Train', phrase: 'the train' } },
];

export const generateVennCounts = (options = {}) => {
  const { difficulty = 'core' } = options;
  if (difficulty === 'core') return countsCore();
  if (difficulty === 'stretch') return countsStretch();
  return countsFoundation();
};

// Four regions, all shown. Every question asked here needs at least one
// addition — "how many play both" would be a bare read of one label, so it is
// left out. No region is coloured as the unknown: the answer is a sum, and
// colouring one of its parts invites reading that part off alone — the
// forgotten overlap is the mistake this band exists to catch.
function countsFoundation() {
  const c = _.sample(COUNT_CONTEXTS);
  for (;;) {
    const q = countsFoundationDraw(c);
    // A sum that happens to equal a printed region (3 + 5 = 8, with 8
    // outside) lets a student who reads the wrong region off be right.
    if (!Object.values(q.visualization.regions).includes(q.answer)) return q;
  }
}

function countsFoundationDraw(c) {
  const aOnly = _.random(3, 18), both = _.random(2, 12), bOnly = _.random(3, 18), outside = _.random(2, 15);

  const asks = [
    { q: `How many ${c.unit} ${c.verb} ${c.a.phrase}?`, parts: [aOnly, both] },
    { q: `How many ${c.unit} ${c.verb} ${c.b.phrase}?`, parts: [bOnly, both] },
    { q: `How many ${c.unit} ${c.verb} ${c.a.phrase} or ${c.b.phrase}, or both?`, parts: [aOnly, both, bOnly] },
    { q: `How many ${c.unit} are there altogether?`, parts: [aOnly, both, bOnly, outside] },
  ];
  const ask = _.sample(asks);
  const total = _.sum(ask.parts);

  return {
    instruction: ask.q,
    answer: String(total),
    answerUnits: `\\text{${c.unit}}`,
    workingOut: `${ask.parts.join(' + ')} = ${total}`,
    visualization: venn(c, { aOnly, both, bOnly, outside }, null),
    metadata: { topic: 'venn-counts', difficulty: 'foundation' },
  };
}

// One region withheld and the total given in words, so the answer has to be
// subtracted out rather than read off.
function countsCore() {
  const c = _.sample(COUNT_CONTEXTS);
  const parts = { aOnly: _.random(3, 24), both: _.random(2, 16), bOnly: _.random(3, 24), outside: _.random(2, 20) };
  const hidden = _.sample(['aOnly', 'both', 'bOnly', 'outside']);
  const total = parts.aOnly + parts.both + parts.bOnly + parts.outside;
  const shown = Object.entries(parts).filter(([k]) => k !== hidden).map(([, v]) => v);

  const ASK = {
    aOnly: `How many ${c.unit} ${c.verb} ${c.a.phrase} but not ${c.b.phrase}?`,
    both: `How many ${c.unit} ${c.verb} both ${c.a.phrase} and ${c.b.phrase}?`,
    bOnly: `How many ${c.unit} ${c.verb} ${c.b.phrase} but not ${c.a.phrase}?`,
    outside: `How many ${c.unit} ${c.verb} neither ${c.a.phrase} nor ${c.b.phrase}?`,
  };

  const regions = { ...parts, [hidden]: '?' };
  return {
    instruction: `There are ${total} ${c.unit} altogether. ${ASK[hidden]}`,
    answer: String(parts[hidden]),
    answerUnits: `\\text{${c.unit}}`,
    workingOut:
      `${shown.join(' + ')} = ${_.sum(shown)}${NL}` +
      `${total} - ${_.sum(shown)} = ${parts[hidden]}`,
    visualization: venn(c, regions, hidden),
    metadata: { topic: 'venn-counts', difficulty: 'core' },
  };
}

// Haese Example 12: name the overlap x and every other region follows from
// it, so the diagram becomes an equation in one unknown.
function countsStretch() {
  let a, b, x, neither, total;
  do {
    a = _.random(10, 34);
    b = _.random(9, 30);
    x = _.random(2, 18);
    neither = _.random(2, 10);
    total = a + b - x + neither;
    // Every region has to hold at least one, or the diagram shows a 0 that
    // makes the algebra look like a trick rather than a method.
  } while (a - x < 2 || b - x < 2 || a === b || total > 75);

  const c = _.sample(COUNT_CONTEXTS);
  const sum = a + b + neither;

  return {
    instruction:
      `In a group of ${total} ${c.unit}, ${a} ${c.verb} ${c.a.phrase} and ${b} ${c.verb} ${c.b.phrase}. ` +
      `${neither} ${c.verb} neither. How many ${c.verb} both?`,
    answer: String(x),
    answerUnits: `\\text{${c.unit}}`,
    workingOut:
      `(${a} - x) + x + (${b} - x) + ${neither} = ${total}${NL}` +
      `${sum} - x = ${total}${NL}` +
      `x = ${sum} - ${total} = ${x}`,
    visualization: venn(
      c,
      { aOnly: `${a} ${MINUS} x`, both: 'x', bOnly: `${b} ${MINUS} x`, outside: String(neither) },
      'both',
    ),
    metadata: { topic: 'venn-counts', difficulty: 'stretch' },
  };
}

const venn = (c, regions, unknown) => ({
  type: 'venn-two-set',
  labels: { a: c.a.label, b: c.b.label },
  regions: Object.fromEntries(Object.entries(regions).map(([k, v]) => [k, String(v)])),
  unknown,
  universe: 'U',
  big: true,
});

/* -------------------------------------------------------- set operations */

const LETTER_PAIRS = [['A', 'B'], ['C', 'D'], ['M', 'N'], ['P', 'Q'], ['X', 'Y'], ['R', 'S']];

// Two elements to a line is what the lunes and the overlap both hold at the
// figure's width; the line caps below follow from that.
const CAP = { aOnly: 4, both: 3, bOnly: 4, outside: 4 };
const chunk = (xs) => _.chunk(xs, 2).map((row) => row.join(', '));
const setTex = (xs) => `\\{${xs.join(', ')}\\}`;

export const generateVennSetOperations = (options = {}) => {
  const { difficulty = 'core' } = options;
  if (difficulty === 'stretch' && Math.random() < 0.5) return setOperationsThree();
  const [A, B] = _.sample(LETTER_PAIRS);

  // A universe of 1..n split four ways, every region occupied so that no
  // question has an empty set for an answer and the drawn overlap is honest.
  let regions;
  do {
    const n = _.random(9, 12);
    const elements = _.shuffle(_.range(1, n + 1));
    const sizes = { aOnly: _.random(2, CAP.aOnly), both: _.random(1, CAP.both), bOnly: _.random(2, CAP.bOnly) };
    sizes.outside = n - sizes.aOnly - sizes.both - sizes.bOnly;
    if (sizes.outside < 1 || sizes.outside > CAP.outside) { regions = null; continue; }
    // A u B is the longest answer this skill can ask for; past eight elements
    // it stops being readable from the back of a room.
    if (sizes.aOnly + sizes.both + sizes.bOnly > 8) { regions = null; continue; }
    let i = 0;
    regions = {};
    ['aOnly', 'both', 'bOnly', 'outside'].forEach((k) => {
      regions[k] = _.sortBy(elements.slice(i, i + sizes[k]));
      i += sizes[k];
    });
  } while (!regions);

  const { aOnly, both, bOnly, outside } = regions;
  const union = (...gs) => _.sortBy([].concat(...gs));

  const setA = union(aOnly, both), setB = union(bOnly, both);

  // Every answer here is one region or a union of regions that stays short
  // enough to read across a classroom. (A n B)' is deliberately absent: with a
  // universe of 12 and a single shared element it lists eleven numbers.
  const BY_BAND = {
    foundation: [
      { tex: A, els: setA, work: [`${A} = ${setTex(aOnly)} \\cup ${setTex(both)}`] },
      { tex: B, els: setB, work: [`${B} = ${setTex(bOnly)} \\cup ${setTex(both)}`] },
    ],
    core: [
      {
        tex: `${A} \\cap ${B}`, els: both,
        work: [`${A} = ${setTex(setA)}`, `${B} = ${setTex(setB)}`, `\\text{in both: }`],
      },
      {
        tex: `${A} \\cup ${B}`, els: union(aOnly, both, bOnly),
        work: [`${A} = ${setTex(setA)}`, `${B} = ${setTex(setB)}`, `\\text{in either: }`],
      },
    ],
    stretch: [
      {
        tex: `(${A} \\cup ${B})'`, els: outside,
        work: [`${A} \\cup ${B} = ${setTex(union(aOnly, both, bOnly))}`, `\\text{everything else: }`],
      },
      {
        tex: `${A}' \\cap ${B}`, els: bOnly,
        work: [`${A}' = ${setTex(union(bOnly, outside))}`, `\\text{of those, the ones in } ${B}:`],
      },
      {
        tex: `${A} \\cap ${B}'`, els: aOnly,
        work: [`${B}' = ${setTex(union(aOnly, outside))}`, `\\text{of those, the ones in } ${A}:`],
      },
      {
        tex: `${A}' \\cap ${B}'`, els: outside,
        work: [`${A}' = ${setTex(union(bOnly, outside))}`, `${B}' = ${setTex(union(aOnly, outside))}`, `\\text{in both: }`],
      },
    ],
  };
  const pick = _.sample(BY_BAND[difficulty] ?? BY_BAND.core);

  return {
    instruction: 'List the elements of the set',
    questionMath: pick.tex,
    answer: setTex(pick.els),
    workingOut: [...pick.work, `= ${setTex(pick.els)}`].join(NL),
    visualization: {
      type: 'venn-two-set',
      labels: { a: A, b: B },
      regions: Object.fromEntries(Object.entries(regions).map(([k, v]) => [k, chunk(v)])),
      unknown: null,
      universe: 'U',
      big: true,
    },
    metadata: { topic: 'venn-set-operations', difficulty },
  };
};

/* ------------------------------------------------- three-set operations */

const LETTER_TRIPLES = [['A', 'B', 'C'], ['P', 'Q', 'R'], ['X', 'Y', 'Z']];
const KEYS3 = ['aOnly', 'bOnly', 'cOnly', 'ab', 'ac', 'bc', 'abc', 'outside'];
// Which of the three sets each region of `venn-three-set` lies in.
const MEMBERS3 = {
  aOnly: 'a', bOnly: 'b', cOnly: 'c', ab: 'ab', ac: 'ac', bc: 'bc', abc: 'abc', outside: '',
};

// What each region holds at the figure's anchor (Figure.jsx), as elements per
// line and lines. The overlaps of two are the tight ones.
const LAYOUT3 = {
  aOnly: [2, 2], bOnly: [2, 2], cOnly: [2, 2],
  ab: [2, 1], abc: [2, 1], ac: [1, 2], bc: [1, 2],
  outside: [2, 3],
};
const CAP3 = _.mapValues(LAYOUT3, ([per, lines]) => per * lines);
const lines3 = (key, els) => _.chunk(els, LAYOUT3[key][0]).map((row) => row.join(', '));

// Expressions as trees, so the LaTeX and the evaluation come from one place
// and cannot disagree. x, y, z are the three sets in some order: the
// generator permutes them, so "(B n C) n A'" and "(A n C) n B'" are one
// template.
const set = (k) => ({ k });
const and = (l, r) => ({ op: 'cap', l, r });
const or = (l, r) => ({ op: 'cup', l, r });
const not = (e) => ({ op: 'not', e });

const TEMPLATES3 = [
  (x, y, z) => and(and(y, z), not(x)),       // (B n C) n A'
  (x, y, z) => and(not(x), and(y, z)),       // A' n (B n C)
  (x, y, z) => and(or(x, y), z),             // (A u B) n C
  (x, y, z) => and(or(x, y), not(z)),        // (A u B) n C'
  (x, y, z) => and(not(or(x, y)), z),        // (A u B)' n C
  (x, y, z) => and(x, not(or(y, z))),        // A n (B u C)'
  (x, y, z) => and(not(and(x, y)), z),       // (A n B)' n C
  (x, y, z) => or(and(x, y), and(x, z)),     // (A n B) u (A n C)
  (x, y, z) => or(and(x, y), z),             // (A n B) u C
];

const isLeaf = (e) => e.k != null;
function tex3(e, names) {
  if (isLeaf(e)) return names[e.k];
  if (e.op === 'not') return isLeaf(e.e) ? `${names[e.e.k]}'` : `(${tex3(e.e, names)})'`;
  const side = (c) => (isLeaf(c) || c.op === 'not' ? tex3(c, names) : `(${tex3(c, names)})`);
  // The permutation can put a bracket's letters out of order; "Y n X" is
  // the same set as "X n Y" and reads like a typo.
  const [l, r] = isLeaf(e.l) && isLeaf(e.r) ? _.sortBy([e.l, e.r], (c) => names[c.k]) : [e.l, e.r];
  return `${side(l)} \\${e.op} ${side(r)}`;
}
// The regions an expression covers.
function regions3(e) {
  if (isLeaf(e)) return KEYS3.filter((r) => MEMBERS3[r].includes(e.k));
  if (e.op === 'not') return _.difference(KEYS3, regions3(e.e));
  return e.op === 'cap' ? _.intersection(regions3(e.l), regions3(e.r)) : _.union(regions3(e.l), regions3(e.r));
}

// Fill a universe of 1..n into the eight regions at random, each region
// within what the figure can hold.
function fillThree(minEach) {
  for (;;) {
    const n = _.random(12, 16);
    const sizes = _.mapValues(CAP3, (cap) => _.random(minEach, cap));
    const inside = _.sum(KEYS3.filter((k) => k !== 'outside').map((k) => sizes[k]));
    sizes.outside = n - inside;
    if (sizes.outside < 1 || sizes.outside > CAP3.outside) continue;
    const elements = _.shuffle(_.range(1, n + 1));
    let i = 0;
    const regions = {};
    KEYS3.forEach((k) => { regions[k] = _.sortBy(elements.slice(i, i + sizes[k])); i += sizes[k]; });
    return regions;
  }
}

function setOperationsThree() {
  const [A, B, C] = _.sample(LETTER_TRIPLES);
  const names = { a: A, b: B, c: C };
  // Every region occupied, so the drawn diagram never has an empty overlap
  // that a student might read as a mistake.
  const regions = fillThree(1);
  const els = (keys) => _.sortBy(keys.flatMap((k) => regions[k]));

  for (;;) {
    const [x, y, z] = _.shuffle(['a', 'b', 'c']).map(set);
    const e = _.sample(TEMPLATES3)(x, y, z);
    const answer = els(regions3(e));
    // Same ceiling as the two-set answers: past eight it stops being
    // readable from the back of the room.
    if (!answer.length || answer.length > 8) continue;

    // Bracket first, then the outer operation. A complement is worked as
    // "not in" rather than listed: (A n C)' runs to a dozen elements.
    const listed = (p) => `${tex3(p, names)} = ${setTex(els(regions3(p)))}`;
    let work;
    if (e.op === 'cup') work = [listed(e.l), listed(e.r), '\\text{in either: }'];
    else {
      const [neg, pos] = e.l.op === 'not' ? [e.l, e.r] : e.r.op === 'not' ? [e.r, e.l] : [null, null];
      work = neg
        ? [listed(pos), listed(neg.e), `\\text{in the first, not the second: }`]
        : [listed(e.l), listed(e.r), '\\text{in both: }'];
    }

    return {
      instruction: 'List the elements of the set',
      questionMath: tex3(e, names),
      answer: setTex(answer),
      workingOut: [...work, `= ${setTex(answer)}`].join(NL),
      visualization: {
        type: 'venn-three-set',
        labels: { a: A, b: B, c: C },
        regions: _.mapValues(regions, (v, k) => lines3(k, v)),
        unknown: null,
        universe: 'U',
        big: true,
      },
      metadata: { topic: 'venn-set-operations', difficulty: 'stretch' },
    };
  }
}

/* ------------------------------------------------------ place elements */

// Sets a class can list from a description. `test` is the definition; the
// tex is what the question prints.
export const PROPERTIES = [
  { tex: 'even numbers', test: (k) => k % 2 === 0 },
  { tex: 'odd numbers', test: (k) => k % 2 === 1 },
  { tex: 'prime numbers', test: (k) => k > 1 && _.range(2, k).every((d) => k % d) },
  { tex: 'square numbers', test: (k) => Number.isInteger(Math.sqrt(k)) },
  ...[3, 4, 5].map((m) => ({ tex: `multiples of ${m}`, test: (k) => k % m === 0 })),
  ...[12, 16, 18, 20, 24, 30].map((m) => ({ tex: `factors of ${m}`, test: (k) => m % k === 0 })),
];

// The two-set figure's capacities, as the set-operations skill uses them.
const KEYS2 = ['aOnly', 'both', 'bOnly', 'outside'];

const universeTex = (n) => `U = \\{1, 2, 3, \\ldots, ${n}\\}`;

export const generateVennPlaceElements = (options = {}) => {
  const { difficulty = 'core' } = options;
  if (difficulty === 'stretch') return placeThree();
  return placeTwo(difficulty);
};

function placeTwo(difficulty) {
  const [A, B] = _.sample(LETTER_PAIRS);
  let n, setA, setB, describe;
  for (;;) {
    if (difficulty === 'foundation') {
      // Listed sets: any subsets will do, so draw the regions directly.
      n = _.random(8, 12);
      const u = _.range(1, n + 1);
      setA = _.sortBy(_.sampleSize(u, _.random(3, 6)));
      setB = _.sortBy(_.sampleSize(u, _.random(3, 6)));
      describe = null;
    } else {
      n = _.sample([10, 12, 15, 16, 20]);
      const [pa, pb] = _.sampleSize(PROPERTIES, 2);
      const u = _.range(1, n + 1);
      setA = u.filter(pa.test);
      setB = u.filter(pb.test);
      describe = [pa.tex, pb.tex];
    }
    const regions = splitTwo(n, setA, setB);
    // Every region occupied (so neither set sits inside the other and the
    // overlap is real), and each within what the two-set figure holds.
    if (KEYS2.some((k) => !regions[k].length || regions[k].length > CAP[k])) continue;

    const q = describe
      ? [universeTex(n), `${A} = \\text{${describe[0]}}`, `${B} = \\text{${describe[1]}}`]
      : [universeTex(n), `${A} = ${setTex(setA)}`, `${B} = ${setTex(setB)}`];
    const overlap = `${A} \\cap ${B} = ${setTex(regions.both)}`;
    return {
      instruction: 'Place each element of U in the Venn diagram',
      questionMath: q.join(NL),
      answer: overlap,
      workingOut: (describe ? [`${A} = ${setTex(setA)}`, `${B} = ${setTex(setB)}`, overlap] : [overlap]).join(NL),
      visualization: {
        type: 'venn-two-set',
        labels: { a: A, b: B },
        regions: {},
        solution: _.mapValues(regions, chunk),
        unknown: null,
        universe: 'U',
        big: true,
      },
      metadata: { topic: 'venn-place-elements', difficulty },
    };
  }
}

function splitTwo(n, setA, setB) {
  const regions = { aOnly: [], both: [], bOnly: [], outside: [] };
  _.range(1, n + 1).forEach((k) => {
    const inA = setA.includes(k), inB = setB.includes(k);
    regions[inA && inB ? 'both' : inA ? 'aOnly' : inB ? 'bOnly' : 'outside'].push(k);
  });
  return regions;
}

function placeThree() {
  const [A, B, C] = _.sample(LETTER_TRIPLES);
  for (;;) {
    const n = _.sample([10, 12, 15, 16, 20]);
    const props = _.sampleSize(PROPERTIES, 3);
    const u = _.range(1, n + 1);
    const sets = props.map((p) => u.filter(p.test));
    const regions = _.fromPairs(KEYS3.map((k) => [k, []]));
    u.forEach((k) => {
      const key = ['a', 'b', 'c'].filter((s, i) => sets[i].includes(k)).join('');
      regions[key.length === 1 ? `${key}Only` : key || 'outside'].push(k);
    });
    if (KEYS3.some((k) => regions[k].length > CAP3[k])) continue;
    // The centre has to hold something, and no more than two regions may be
    // empty: a diagram that is mostly blank is three separate lists.
    if (!regions.abc.length || KEYS3.filter((k) => !regions[k].length).length > 2) continue;

    const centre = `${A} \\cap ${B} \\cap ${C} = ${setTex(regions.abc)}`;
    return {
      instruction: 'Place each element of U in the Venn diagram',
      questionMath: [
        universeTex(n),
        `${A} = \\text{${props[0].tex}}`,
        `${B} = \\text{${props[1].tex}}`,
        `${C} = \\text{${props[2].tex}}`,
      ].join(NL),
      answer: centre,
      workingOut: [
        `${A} = ${setTex(sets[0])}`,
        `${B} = ${setTex(sets[1])}`,
        `${C} = ${setTex(sets[2])}`,
        centre,
      ].join(NL),
      visualization: {
        type: 'venn-three-set',
        labels: { a: A, b: B, c: C },
        regions: {},
        solution: _.mapValues(regions, (v, k) => lines3(k, v)),
        unknown: null,
        universe: 'U',
        big: true,
      },
      metadata: { topic: 'venn-place-elements', difficulty: 'stretch' },
    };
  }
}
