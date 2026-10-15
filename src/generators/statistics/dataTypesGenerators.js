// src/generators/statistics/dataTypesGenerators.js
//
// Haese 13A: variables used in statistics. A context, a table of variables
// with an empty Type column, and the student classifies each one.
//
// Foundation  qualitative or quantitative, four variables
// Core        qualitative, discrete or continuous, five variables, every one
//             of them a plain case
// Stretch     the same three labels over five variables, at least two of
//             which are traps: a number that is only a label (shirt number,
//             registration), a measurement that comes in steps (shoe size),
//             or a "number of" that is really a measurement (hours of
//             sunshine)
//
// The contexts are vocabulary, not a question bank: which variables appear,
// and in which order, is drawn fresh each time. Ceiling: five contexts of
// 10-14 variables each, so Core runs to thousands of distinct tables, but a
// class that sees the board every day will meet the same variable names
// again — that is the topic, not a defect.

import _ from 'lodash';

const NL = '\n';

// type: 'qualitative' | 'discrete' | 'continuous'. trap: the obvious guess is
// wrong. A trap is never served below Stretch, because at Foundation and Core
// a student who answers it "wrongly" has applied the rule they were taught.
// Anything genuinely disputed between textbooks (age, money, pulse rate) is
// left out altogether rather than given an answer someone will argue with.
export const CONTEXTS = [
  {
    intro: 'A football scout records these for a player.',
    vars: [
      ['Nationality', 'qualitative'],
      ['Club', 'qualitative'],
      ['Preferred foot', 'qualitative'],
      ['Position', 'qualitative'],
      ['Goals scored', 'discrete'],
      ['Appearances', 'discrete'],
      ['Red cards', 'discrete'],
      ['Assists', 'discrete'],
      ['Height', 'continuous'],
      ['Mass', 'continuous'],
      ['Sprint speed', 'continuous'],
      ['Distance run in a match', 'continuous'],
      ['Shirt number', 'qualitative', true],
      ['Boot size', 'discrete', true],
    ],
  },
  {
    intro: 'A doctor records these for each patient.',
    vars: [
      ['Blood group', 'qualitative'],
      ['Eye colour', 'qualitative'],
      ['Hair colour', 'qualitative'],
      ['Number of visits this year', 'discrete'],
      ['Number of siblings', 'discrete'],
      ['Number of children', 'discrete'],
      ['Height', 'continuous'],
      ['Mass', 'continuous'],
      ['Body temperature', 'continuous'],
      ['Patient ID number', 'qualitative', true],
      ['Shoe size', 'discrete', true],
      ['Number of hours slept', 'continuous', true],
    ],
  },
  {
    intro: 'A school survey records these for each student.',
    vars: [
      ['Favourite subject', 'qualitative'],
      ['Form group', 'qualitative'],
      ['Way of travelling to school', 'qualitative'],
      ['Number of pets', 'discrete'],
      ['Number of siblings', 'discrete'],
      ['Books read this term', 'discrete'],
      ['Time taken to get to school', 'continuous'],
      ['Hand span', 'continuous'],
      ['Height', 'continuous'],
      ['House number', 'qualitative', true],
      ['Mark in a test out of 50', 'discrete', true],
      ['Number of hours of homework', 'continuous', true],
    ],
  },
  {
    intro: 'A car park survey records these for each car.',
    vars: [
      ['Colour', 'qualitative'],
      ['Make', 'qualitative'],
      ['Fuel type', 'qualitative'],
      ['Number of passengers', 'discrete'],
      ['Number of doors', 'discrete'],
      ['Speed on entry', 'continuous'],
      ['Length', 'continuous'],
      ['Time parked', 'continuous'],
      ['Registration number', 'qualitative', true],
      ['Litres of fuel in the tank', 'continuous', true],
    ],
  },
  {
    intro: 'A weather station records these each day.',
    vars: [
      ['Wind direction', 'qualitative'],
      ['Type of cloud', 'qualitative'],
      ['Number of lightning strikes', 'discrete'],
      ['Number of people at the station', 'discrete'],
      ['Rainfall', 'continuous'],
      ['Temperature', 'continuous'],
      ['Wind speed', 'continuous'],
      ['Station number', 'qualitative', true],
      ['Number of hours of sunshine', 'continuous', true],
    ],
  },
].map((c) => ({
  ...c,
  vars: c.vars.map(([name, type, trap = false]) => ({ name, type, trap })),
}));

const label = (v, difficulty) => (
  difficulty === 'foundation' && v.type !== 'qualitative' ? 'quantitative' : v.type
);

/** Draw the variables for one table, or null if this context cannot meet the
    band's requirements on this draw. */
function pick(context, difficulty) {
  const plain = context.vars.filter((v) => !v.trap);
  if (difficulty === 'foundation') {
    const vs = _.sampleSize(plain, 4);
    const kinds = new Set(vs.map((v) => label(v, difficulty)));
    return kinds.size === 2 ? vs : null;
  }
  const traps = difficulty === 'stretch'
    ? _.sampleSize(context.vars.filter((v) => v.trap), _.random(2, 3))
    : [];
  const chosen = [...traps, ..._.sampleSize(plain, 5 - traps.length)];
  // Every label used at least once, so no table can be answered by writing
  // the same word five times.
  return new Set(chosen.map((v) => v.type)).size === 3 ? _.shuffle(chosen) : null;
}

// "2 qualitative, 1 discrete, 2 continuous", in a fixed order.
const summary = (labels) => ['qualitative', 'quantitative', 'discrete', 'continuous']
  .map((k) => [k, labels.filter((l) => l === k).length])
  .filter(([, n]) => n)
  .map(([k, n]) => `${n} ${k}`)
  .join(', ');

export const generateDataTypes = (options = {}) => {
  const { difficulty = 'core' } = options;
  for (;;) {
    const context = _.sample(CONTEXTS);
    const vs = pick(context, difficulty);
    if (!vs) continue;

    const labels = difficulty === 'foundation'
      ? 'qualitative or quantitative'
      : 'qualitative, discrete or continuous';
    const why = (v) => {
      if (v.type === 'qualitative') return 'a label, not a quantity';
      if (v.type === 'discrete') return 'counted, or comes in steps';
      return 'measured';
    };

    return {
      instruction: `${context.intro} Classify each as ${labels}`,
      // The table itself fills in on reveal, so the answer band only
      // summarises it, as the magic square's does. A line per variable here
      // squeezed the table to 11px text; the types in a row overflowed the
      // box, since \\text{} cannot wrap.
      answer: `\\text{${summary(vs.map((v) => label(v, difficulty)))}}`,
      workingOut: vs.map((v) => `\\text{${v.name}: ${label(v, difficulty)} (${why(v)})}`).join(NL),
      visualization: {
        type: 'table',
        header: 'row',
        big: true,
        rows: [['Variable', 'Type'], ...vs.map((v) => [v.name, ''])],
        solution: [['', ''], ...vs.map((v) => ['', label(v, difficulty)])],
      },
      metadata: { topic: 'data-types', difficulty },
    };
  }
};
