// Mutation test for the scatter harness: break real generator output in
// specific ways and require the checker to reject every broken copy. A
// harness that passes everything proves nothing until it has been seen to
// fail.
//
// A mutation that leaves the object unchanged is skipped. So is one that
// turns a question into a different but still correct one (an equivalent
// mutant) — those are ruled out per operator, by the rule written beside it,
// never by asking the checker.
//
// Run: npx vitest run src/generators/statistics/scatterGenerators.mutation.test.js

import { describe, expect, it } from 'vitest';
import _ from 'lodash';
import { generateScatterCorrelation, generateLineOfBestFit } from './scatterGenerators';
import { checkCorrelation, checkLineOfBestFit } from './scatterGenerators.check';

const PER_BAND = 300;
const BANDS = ['foundation', 'core', 'stretch'];

// Pearson's r, written here for deciding equivalence only.
const ownR = (pts) => {
  const mx = _.meanBy(pts, 'x'), my = _.meanBy(pts, 'y');
  const sxy = _.sumBy(pts, (p) => (p.x - mx) * (p.y - my));
  return sxy / Math.sqrt(_.sumBy(pts, (p) => (p.x - mx) ** 2) * _.sumBy(pts, (p) => (p.y - my) ** 2));
};

const swapWords = (s, a, b) => (s.includes(a) ? s.replace(a, b) : s.includes(b) ? s.replace(b, a) : s);

const CORRELATION_OPS = {
  // Equivalent when the working is r and r sits so close to x.xx5 that the
  // nudged figure is also a correct rounding of it — decided with this
  // file's own r, not the checker's.
  'a number in the working nudged': (q) => {
    const m = /(\d+)(?!.*\d)/.exec(q.workingOut);
    if (!m) return false;
    q.workingOut = q.workingOut.slice(0, m.index) + String(Number(m[1]) + 1) + q.workingOut.slice(m.index + m[1].length);
    const w = /r = (-?\d\.\d\d)$/.exec(q.workingOut);
    if (w) {
      const f = q.visualization;
      const pts = f.highlight ? f.points.filter((p) => p.name !== f.highlight) : f.points;
      if (Math.abs(Number(w[1]) - ownR(pts)) <= 0.005 + 1e-9) return false;
    }
    return true;
  },
  'direction word flipped': (q) => {
    const n = swapWords(q.answer, 'positive', 'negative');
    q.answer = n;
    return true;
  },
  'strength word flipped': (q) => { q.answer = swapWords(q.answer, 'strong', 'weak'); return true; },
  'meaning verb flipped': (q) => {
    const l = q.answer.split('\n');
    if (l.length < 3) return false;
    l[2] = /increase/.test(l[2]) ? l[2].replace('increase', 'decrease') : l[2].replace('decrease', 'increase');
    q.answer = l.join('\n');
    return true;
  },
  // Reflecting the cloud reverses the trend. A cloud with no trend reflects
  // to another with none, which is still a correct question: skipped.
  'cloud reflected top to bottom': (q) => {
    if (q.answer.includes('no correlation')) return false;
    const { yAxis: ya } = q.visualization;
    q.visualization.points.forEach((p) => { p.y = Number((ya.min + ya.max - p.y).toFixed(4)); });
    return true;
  },
  'one cross dropped onto another': (q) => {
    const [p, r] = q.visualization.points;
    p.x = r.x; p.y = r.y;
    return true;
  },
  'count in the sentence changed': (q) => {
    q.instruction = q.instruction.replace(/(\d+) (days|students|taxi journeys|cars|runners)\b/, (m, n, w) => `${Number(n) + 1} ${w}`);
    return true;
  },
  'axis titles swapped': (q) => {
    const f = q.visualization;
    [f.xAxis.title, f.yAxis.title] = [f.yAxis.title, f.xAxis.title];
    return true;
  },
  'a point pushed out of the frame': (q) => {
    q.visualization.points[0].y = q.visualization.yAxis.max + q.visualization.yAxis.step;
    return true;
  },
  'stretch: another name given': (q) => {
    const names = q.visualization.points.map((p) => p.name).filter(Boolean);
    if (!names.length) return false;
    const odd = q.answer.split('\n')[0].slice(6, -1);
    const other = names.find((n) => n !== odd);
    q.answer = q.answer.replace(odd, other);
    q.visualization.highlight = other;
    return true;
  },
  'stretch: highlight on the wrong point': (q) => {
    const names = q.visualization.points.map((p) => p.name).filter(Boolean);
    if (!names.length) return false;
    q.visualization.highlight = names.find((n) => n !== q.visualization.highlight);
    return true;
  },
  // The odd one out moved onto the trend of the others: no one stands out.
  'stretch: odd point moved onto the trend': (q) => {
    const f = q.visualization;
    if (!f.highlight) return false;
    const rest = f.points.filter((p) => p.name !== f.highlight);
    const odd = f.points.find((p) => p.name === f.highlight);
    const mx = _.meanBy(rest, 'x'), my = _.meanBy(rest, 'y');
    const b = _.sumBy(rest, (p) => (p.x - mx) * (p.y - my)) / _.sumBy(rest, (p) => (p.x - mx) ** 2);
    odd.y = Number((my + b * (odd.x - mx)).toFixed(4));
    return true;
  },
};

const LOBF_OPS = {
  'a number in the working nudged': (q) => {
    const m = /(\d+)(?!.*\d)/.exec(q.workingOut);
    if (!m) return false;
    q.workingOut = q.workingOut.slice(0, m.index) + String(Number(m[1]) + 1) + q.workingOut.slice(m.index + m[1].length);
    return true;
  },
  'answer value nudged': (q) => {
    const m = /(\d+(?:\.\d+)?)/.exec(q.answer);
    if (!m) return false;
    q.answer = q.answer.replace(m[1], String(Number(m[1]) + 1));
    return true;
  },
  'given value in the question nudged': (q) => {
    if (!q.questionText?.includes(' when ')) return false;
    q.questionText = q.questionText.replace(/(\d+(?:\.\d+)?)([^\d]*)$/, (m, d, rest) => `${Number(d) + 1}${rest}`);
    return true;
  },
  'line moved up a cell at one end': (q) => {
    const f = q.visualization;
    if (!f.line) return false;
    f.line[1][1] = Number((f.line[1][1] + f.yAxis.step).toFixed(4));
    return true;
  },
  'line reversed': (q) => {
    const f = q.visualization;
    if (!f.line) return false;
    [f.line[0][1], f.line[1][1]] = [f.line[1][1], f.line[0][1]];
    return true;
  },
  'reading lines moved': (q) => {
    const f = q.visualization;
    if (!f.reading) return false;
    f.reading.x = Number((f.reading.x + f.xAxis.step).toFixed(4));
    return true;
  },
  'verdict flipped': (q) => {
    if (!q.answer.includes('reliable')) return false;
    q.answer = q.answer.includes('not reliable')
      ? q.answer.replace('not reliable (extrapolation)', 'reliable (interpolation)')
      : q.answer.replace('reliable (interpolation)', 'not reliable (extrapolation)');
    return true;
  },
  'units dropped': (q) => {
    if (q.answerUnits) { delete q.answerUnits; return true; }
    if (/\\text\{ [a-z°]/.test(q.answer)) { q.answer = q.answer.replace(/\\text\{ [^}]+\}/, ''); return true; }
    if (q.answer.includes('£')) { q.answer = q.answer.replace(/\\text\{£(\d+)\}/, '$1'); return true; }
    return false;
  },
  'mean point: a table value nudged': (q) => {
    if (q.visualization.type !== 'table') return false;
    const row = q.visualization.rows[_.random(0, 1)];
    row[1] = String(Number(row[1]) + 1);
    return true;
  },
  'mean point: coordinates swapped': (q) => {
    const m = /^\((\d+), (\d+)\)$/.exec(q.answer);
    if (!m || m[1] === m[2]) return false; // equal coordinates swap to the same answer
    q.answer = `(${m[2]}, ${m[1]})`;
    return true;
  },
};

const mutate = (gen, check, ops) => {
  const tally = {};
  const survivors = [];
  const why = {};
  BANDS.forEach((difficulty) => {
    for (let t = 0; t < PER_BAND; t += 1) {
      const original = gen({ difficulty });
      check(original, difficulty);
      Object.entries(ops).forEach(([name, op]) => {
        const q = _.cloneDeep(original);
        if (!op(q) || _.isEqual(q, original)) return;
        tally[name] ??= { tried: 0, killed: 0 };
        tally[name].tried += 1;
        try {
          check(q, difficulty);
          survivors.push({ name, difficulty, q });
        } catch (e) {
          tally[name].killed += 1;
          (why[name] ??= new Set()).add(e.message.split('\n')[0].replace(/[\d.]+/g, '#').slice(0, 60));
        }
      });
    }
  });
  Object.entries(tally).forEach(([name, { tried, killed }]) => {
    process.stdout.write(`${name.padEnd(42)} ${killed}/${tried} killed   [${[...why[name] ?? []].slice(0, 2).join(' | ')}]\n`);
  });
  survivors.slice(0, 3).forEach((s) => process.stdout.write(`SURVIVOR ${s.name} (${s.difficulty}): ${JSON.stringify(s.q).slice(0, 400)}\n`));
  expect(Object.keys(tally).sort()).toEqual(Object.keys(ops).sort());
  expect(survivors).toHaveLength(0);
};

describe('scatter harness, mutation test', () => {
  it('scatter-correlation: rejects every mutated question', () => mutate(generateScatterCorrelation, checkCorrelation, CORRELATION_OPS), 120000);
  it('line-of-best-fit: rejects every mutated question', () => mutate(generateLineOfBestFit, checkLineOfBestFit, LOBF_OPS), 120000);
});
