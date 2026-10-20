// src/generators/statistics/barChartGenerators.js
//
// Haese 5A: reading a bar chart. Every frequency is a whole number and the
// figure draws a gridline at every unit, so each bar is read exactly.
//
//   foundation  categorical chart: how many more chose one than another
//   core        categorical chart: what fraction chose one category, so the
//               total has to be found from every bar first
//   stretch     a chart of discrete numeric data (goals, siblings): the mean,
//               which means reading the chart as a frequency table and
//               working with value x frequency, not the bar heights alone

import _ from 'lodash';
import { CONTEXTS } from './pieChartGenerators';
import { DISCRETE, discreteData } from './frequencyTableGenerators';
import { gcd, dp1 } from '../shared';

const NL = '\n';



/** 4 or 5 categories with distinct heights, so no two bars can be confused
 *  and no comparison comes out as zero. */
const categorical = () => {
  const context = _.sample(CONTEXTS.filter((c) => c.cats.length >= 4));
  const k = Math.min(_.sample([4, 5]), context.cats.length);
  const cats = _.sampleSize(context.cats, k);
  const values = _.sampleSize(_.range(2, 13), k);
  return { context, cats: cats.map((c, i) => ({ ...c, value: values[i] })) };
};

const figure = (bars, xTitle, highlight = []) => ({
  type: 'bar-chart',
  bars: bars.map((b) => ({ name: String(b.name), value: b.value })),
  xTitle,
  yTitle: 'Frequency',
  highlight,
  big: true,
});

export const generateBarCharts = (options = {}) => {
  const { difficulty = 'core' } = options;
  if (difficulty === 'foundation') return foundationBand();
  if (difficulty === 'stretch') return stretchBand();
  return coreBand();
};

function foundationBand() {
  const { context, cats } = categorical();
  const [a, b] = _.sortBy(_.sampleSize(cats, 2), (c) => -c.value);
  return {
    instruction: `The bar chart shows ${context.shows}. How many more ${context.unit} ${a.clause} than ${b.clause}?`,
    answer: String(a.value - b.value),
    answerUnits: `\\text{${context.unit}}`,
    workingOut: `${a.value} - ${b.value} = ${a.value - b.value}`,
    visualization: figure(cats, context.col, [a.name, b.name]),
    metadata: { topic: 'bar-charts', difficulty: 'foundation' },
  };
}

function coreBand() {
  const { context, cats } = categorical();
  const target = _.sample(cats);
  const total = _.sum(cats.map((c) => c.value));
  const g = gcd(target.value, total);
  const simplified = `\\frac{${target.value / g}}{${total / g}}`;
  return {
    instruction: `The bar chart shows ${context.shows}. What fraction of the ${context.unit} ${target.clause}?`,
    answer: simplified,
    workingOut: [
      `\\text{total} = ${cats.map((c) => c.value).join(' + ')} = ${total}`,
      g > 1 ? `\\frac{${target.value}}{${total}} = ${simplified}` : simplified,
    ].join(NL),
    visualization: figure(cats, context.col, [target.name]),
    metadata: { topic: 'bar-charts', difficulty: 'core' },
  };
}

function stretchBand() {
  for (;;) {
    const { context, xs, fs } = discreteData(_.sample(DISCRETE));
    const n = _.sum(fs);
    const sumFX = _.sum(xs.map((x, i) => x * fs[i]));
    // A mean that comes out at exactly one decimal place, so the answer is
    // exact rather than rounded.
    if ((sumFX * 10) % n !== 0) continue;
    const mean = dp1((sumFX * 10) / n);
    return {
      instruction: `The bar chart shows ${context.shows}. ${context.meanQ}`,
      answer: mean,
      workingOut: [
        `\\text{total} = ${xs.map((x, i) => `${x} \\times ${fs[i]}`).join(' + ')} = ${sumFX}`,
        `\\text{number} = ${fs.join(' + ')} = ${n}`,
        `\\text{mean} = \\frac{${sumFX}}{${n}} = ${mean}`,
      ].join(NL),
      visualization: figure(xs.map((x, i) => ({ name: x, value: fs[i] })), context.col),
      metadata: { topic: 'bar-charts', difficulty: 'stretch' },
    };
  }
}
