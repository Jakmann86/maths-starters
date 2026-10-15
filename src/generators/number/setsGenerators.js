// src/generators/number/setsGenerators.js
//
// Haese Chapter 2 (D Venn diagrams, E union and intersection, F problem
// solving) and Rayner Chapter 12. Two skills, both drawn on the same
// two-circle figure:
//
//   venn-counts          numbers in the regions
//     foundation  read and add                    "How many play rugby?"
//     core        one region withheld, total given
//     stretch     the regions are 16 - x, x, 11 - x   (Haese Example 12)
//
//   venn-set-operations  elements in the regions
//     foundation  list A                          no symbol
//     core        list A n B, A u B               one symbol
//     stretch     list (A u B)', A' n B, ...      complement plus a symbol
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
