// src/generators/statistics/pieChartGenerators.js
//
// Haese Chapter 5 (pie charts, p113-115): reading a frequency off a pie
// chart, finding a sector angle from a frequency table, and the two-step
// questions of Exercise 5A Q6 where the sample size is not given.
//
// Both directions live in one skill, as bands:
//
//   foundation  chart + total given        -> a frequency        (read)
//   core        frequency table given      -> a sector angle     (construct)
//   stretch     two steps, total withheld  -> a frequency        (either way)
//
// Every sector angle in this file is a whole number of degrees. That is the
// binding constraint and it is what caps the variety: an angle is
// 360 x f / total, so the total has to divide 360. TOTALS below is therefore
// not a range but a list, and it is the whole list that exists.

import _ from 'lodash';

const NL = '\n';

// Totals that divide 360 and still read as a plausible survey size. 360/T is
// the degrees-per-item scale factor, shown here because it is what decides
// how coarse the chart is: at T = 20 every sector is a multiple of 18 deg.
const TOTALS = [20, 24, 30, 36, 40, 45, 60, 72, 90, 120];

// No sector below this, so its angle label still fits inside it. At 45 deg
// the arc at the label radius is ~43px against ~28px of text ("45°"); a
// three-digit label is wider but only ever appears on a sector over 100 deg.
const MIN_ANGLE = 45;

// And none above this. A 260 deg sector is legitimate data but a poor chart:
// it swallows three quarters of the circle, leaves the rest as slivers, and
// pushes every category name onto one side where they crowd each other.
const MAX_ANGLE = 200;

/* ---------------------------------------------------------------- contexts */

// `clause` completes "How many ...?" and also "<n> of them ...", so it has to
// work in both: "walk to school" / "18 of them walk to school".
const CONTEXTS = [
  {
    unit: 'students',
    col: 'Transport',
    intro: (n) => `${n} students were asked how they travel to school`,
    shows: 'how a group of students travel to school',
    cats: [
      { name: 'Car', clause: 'come by car' },
      { name: 'Bus', clause: 'come by bus' },
      { name: 'Walk', clause: 'walk to school' },
      { name: 'Cycle', clause: 'cycle to school' },
      { name: 'Train', clause: 'come by train' },
    ],
  },
  {
    unit: 'students',
    col: 'Sport',
    intro: (n) => `${n} students were asked to name their favourite sport`,
    shows: 'the favourite sport of a group of students',
    cats: [
      { name: 'Football', clause: 'chose football' },
      { name: 'Tennis', clause: 'chose tennis' },
      { name: 'Hockey', clause: 'chose hockey' },
      { name: 'Cricket', clause: 'chose cricket' },
      { name: 'Netball', clause: 'chose netball' },
      { name: 'Rugby', clause: 'chose rugby' },
    ],
  },
  {
    unit: 'students',
    col: 'Subject',
    intro: (n) => `${n} students were asked to name their favourite subject`,
    shows: 'the favourite subject of a group of students',
    cats: [
      { name: 'Maths', clause: 'chose maths' },
      { name: 'English', clause: 'chose English' },
      { name: 'Science', clause: 'chose science' },
      { name: 'History', clause: 'chose history' },
      { name: 'Art', clause: 'chose art' },
      { name: 'French', clause: 'chose French' },
    ],
  },
  {
    unit: 'families',
    col: 'Pet',
    intro: (n) => `${n} families were asked which pet they own`,
    shows: 'the pets owned by a group of families',
    cats: [
      { name: 'Dog', clause: 'own a dog' },
      { name: 'Cat', clause: 'own a cat' },
      { name: 'Fish', clause: 'own a fish' },
      { name: 'Rabbit', clause: 'own a rabbit' },
      { name: 'Bird', clause: 'own a bird' },
    ],
  },
  {
    unit: 'children',
    col: 'Eye colour',
    intro: (n) => `The eye colour of ${n} children was recorded`,
    shows: 'the eye colour of a group of children',
    cats: [
      { name: 'Brown', clause: 'have brown eyes' },
      { name: 'Blue', clause: 'have blue eyes' },
      { name: 'Green', clause: 'have green eyes' },
      { name: 'Grey', clause: 'have grey eyes' },
    ],
  },
  {
    unit: 'pupils',
    col: 'Lunch',
    intro: (n) => `${n} pupils each chose a school lunch`,
    shows: 'the lunches chosen by a group of pupils',
    cats: [
      { name: 'Pasta', clause: 'chose pasta' },
      { name: 'Salad', clause: 'chose salad' },
      { name: 'Pizza', clause: 'chose pizza' },
      { name: 'Curry', clause: 'chose curry' },
      { name: 'Soup', clause: 'chose soup' },
    ],
  },
  {
    unit: 'adults',
    col: 'Holiday',
    intro: (n) => `${n} adults were asked about their next holiday`,
    shows: 'the holidays booked by a group of adults',
    cats: [
      { name: 'Beach', clause: 'booked a beach holiday' },
      { name: 'City', clause: 'booked a city break' },
      { name: 'Skiing', clause: 'booked a skiing holiday' },
      { name: 'Cruise', clause: 'booked a cruise' },
    ],
  },
  {
    unit: 'customers',
    col: 'Drink',
    intro: (n) => `${n} customers each ordered one drink`,
    shows: 'the drinks ordered by a group of customers',
    cats: [
      { name: 'Tea', clause: 'ordered tea' },
      { name: 'Coffee', clause: 'ordered coffee' },
      { name: 'Juice', clause: 'ordered juice' },
      { name: 'Water', clause: 'ordered water' },
      { name: 'Cola', clause: 'ordered cola' },
    ],
  },
  {
    unit: 'visitors',
    col: 'Source',
    intro: (n) => `${n} visitors were asked how they heard about an event`,
    shows: 'how a group of visitors heard about an event',
    cats: [
      { name: 'Radio', clause: 'heard it on the radio' },
      { name: 'Online', clause: 'saw it online' },
      { name: 'Poster', clause: 'saw a poster' },
      { name: 'Friend', clause: 'heard it from a friend' },
    ],
  },
  {
    unit: 'cars',
    col: 'Colour',
    intro: (n) => `The colours of ${n} cars in a car park were recorded`,
    shows: 'the colours of the cars in a car park',
    cats: [
      { name: 'Red', clause: 'were red' },
      { name: 'Blue', clause: 'were blue' },
      { name: 'Silver', clause: 'were silver' },
      { name: 'Black', clause: 'were black' },
      { name: 'White', clause: 'were white' },
    ],
  },
];

/* ----------------------------------------------------------------- numbers */

// A uniform random composition of `total` into `k` distinct parts, each at
// least `minPart`. Distinct parts matter twice over: two equal sectors make a
// chart that cannot be read without the labels, and they would let a student
// answer a "how many chose X" question by pointing at the wrong sector and
// still being right.
const sampleFreqs = (total, k, minPart, maxPart) => {
  const slack = total - k * minPart;
  if (slack < 0 || maxPart < minPart || k * maxPart < total) return null;
  for (let attempt = 0; attempt < 300; attempt += 1) {
    const cuts = _.sortBy(_.times(k - 1, () => _.random(0, slack)));
    const parts = [];
    let prev = 0;
    cuts.forEach((c) => {
      parts.push(c - prev);
      prev = c;
    });
    parts.push(slack - prev);
    const fs = parts.map((p) => p + minPart);
    if (new Set(fs).size === k && Math.max(...fs) <= maxPart) return _.shuffle(fs);
  }
  return null;
};

// Pick a context, a total, and k categories with whole-degree sector angles.
const buildChart = (k) => {
  for (let attempt = 0; attempt < 60; attempt += 1) {
    const context = _.sample(CONTEXTS);
    if (context.cats.length < k) continue;
    const total = _.sample(TOTALS);
    const perItem = 360 / total;
    // f * 360 / total >= MIN_ANGLE  <=>  f >= MIN_ANGLE * total / 360
    const minPart = Math.ceil((MIN_ANGLE * total) / 360);
    const maxPart = Math.floor((MAX_ANGLE * total) / 360);
    const freqs = sampleFreqs(total, k, minPart, maxPart);
    if (!freqs) continue;
    // A sector angle equal to the total puts the same number twice into one
    // working line — "\frac{60}{360} \times 60" reads as a misprint even
    // though it is right. Same coincidence the variation generator rejects.
    if (freqs.some((f) => f * perItem === total)) continue;
    const cats = _.sampleSize(context.cats, k);
    const sectors = cats.map((cat, i) => ({
      name: cat.name,
      clause: cat.clause,
      freq: freqs[i],
      angle: freqs[i] * perItem,
    }));
    return { context, total, sectors };
  }
  return null;
};

const figure = (sectors, unknownName, notes) => ({
  type: 'pie-chart',
  sectors: sectors.map((s) => ({
    name: s.name,
    angle: s.angle,
    // `note` is the text drawn inside the sector. Default is its own angle;
    // the missing-angle band passes '?' for the one sector it withholds.
    note: notes && notes[s.name] !== undefined ? notes[s.name] : `${s.angle}°`,
  })),
  unknown: unknownName,
  // The chart is the question, not an illustration beside it, so it takes the
  // wide slot the way the coordinate grid does.
  big: true,
});

/* ------------------------------------------------------------- the skill */

export const generatePieCharts = (options = {}) => {
  const { difficulty = 'core' } = options;

  if (difficulty === 'core') return coreBand();
  if (difficulty === 'stretch') return stretchBand();
  return foundationBand();
};

/* foundation: every angle on the chart, the total in words, read off one
   frequency. One step: a fraction of the total. */
function foundationBand() {
  const built = buildChart(_.sample([3, 4]));
  if (!built) return foundationBand();
  const { context, total, sectors } = built;
  const target = _.sample(sectors);

  return {
    instruction: `${context.intro(total)}. The pie chart shows the results. How many ${target.clause}?`,
    answer: String(target.freq),
    answerUnits: `\\text{${context.unit}}`,
    workingOut:
      `\\frac{${target.angle}}{360} \\times ${total}${NL}` +
      `= ${target.freq}`,
    visualization: figure(sectors, target.name),
    metadata: { topic: 'pie-charts', difficulty: 'foundation' },
  };
}

/* core: the other direction. A frequency table, no total row, so the total
   has to be found before the angle can be. Haese Example 2's own working. */
function coreBand() {
  const built = buildChart(_.sample([3, 4]));
  if (!built) return coreBand();
  const { context, total, sectors } = built;
  const target = _.sample(sectors);

  const rows = [[context.col, 'Frequency'], ...sectors.map((s) => [s.name, String(s.freq)])];

  return {
    instruction: `The table shows ${context.shows}. Work out the sector angle for ${target.name} on a pie chart`,
    answer: `${target.angle}^\\circ`,
    workingOut:
      `\\text{total} = ${sectors.map((s) => s.freq).join(' + ')} = ${total}${NL}` +
      `\\frac{${target.freq}}{${total}} \\times 360${NL}` +
      `= ${target.angle}^\\circ`,
    visualization: { type: 'table', rows, header: 'row' },
    metadata: { topic: 'pie-charts', difficulty: 'core' },
  };
}

/* stretch: two steps, and the sample size is never handed over.

   scale          one sector's frequency is given in words; the total has to
                  be recovered from it before any other sector can be read.
                  (Haese Exercise 5A Q6a/c.)
   missing-angle  the total is given but one sector carries no angle, so
                  360 - the rest comes first. The withheld sector is the one
                  asked about, so the subtraction cannot be skipped. */
function stretchBand() {
  const variant = _.sample(['scale', 'missing-angle']);
  const built = buildChart(_.sample([3, 4]));
  if (!built) return stretchBand();
  const { context, total, sectors } = built;

  if (variant === 'scale') {
    const [given, target] = _.sampleSize(sectors, 2);
    // A given frequency equal to the answer reads as a misprint rather than
    // a question, and lets a guess land.
    if (given.freq === target.freq) return stretchBand();

    return {
      instruction:
        `The pie chart shows ${context.shows}. ` +
        `${given.freq} of them ${given.clause}. How many ${target.clause}?`,
      answer: String(target.freq),
      answerUnits: `\\text{${context.unit}}`,
      workingOut:
        `\\text{total} = \\frac{${given.freq}}{${given.angle}} \\times 360 = ${total}${NL}` +
        `\\frac{${target.angle}}{360} \\times ${total}${NL}` +
        `= ${target.freq}`,
      // The slot colour means one thing everywhere in this skill: this is the
      // sector you are being asked for. Highlighting the *given* sector here
      // would make the same cue mean the opposite in one band out of four.
      visualization: figure(sectors, target.name),
      metadata: { topic: 'pie-charts', difficulty: 'stretch' },
    };
  }

  const target = _.sample(sectors);
  const others = sectors.filter((s) => s.name !== target.name);

  return {
    instruction: `${context.intro(total)}. The pie chart shows the results. How many ${target.clause}?`,
    answer: String(target.freq),
    answerUnits: `\\text{${context.unit}}`,
    workingOut:
      `360 - (${others.map((s) => s.angle).join(' + ')}) = ${target.angle}${NL}` +
      `\\frac{${target.angle}}{360} \\times ${total}${NL}` +
      `= ${target.freq}`,
    visualization: figure(sectors, target.name, { [target.name]: '?' }),
    metadata: { topic: 'pie-charts', difficulty: 'stretch' },
  };
}
