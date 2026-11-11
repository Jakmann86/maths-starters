// src/generators/number/speedGenerators.js
//
// Speed, distance and time — Haese 10G and 10H:
//
//   speed-distance-time  s = d / t in whole hours, then hours and minutes and
//                        converting m/s and km/h, then the average speed of a
//                        journey in two parts
//   travel-graphs        reading a distance-time graph, the speed of a part
//                        and the average speed, then two travellers and a
//                        round trip
//
// Names and journeys are phrasing, not a question bank: every number is
// generated, and every corner of a travel graph sits on a gridline so it can
// be read without estimating.

import _ from 'lodash';

const NL = '\n';
const NAMES = ['Ana', 'Ben', 'Sam', 'Priya', 'Leo', 'Mia', 'Kofi', 'Tom', 'Zara', 'Omar'];
const num = (v) => String(Number(v.toFixed(6)));
// v as a whole number or one decimal place, or null.
const oneDp = (v) => (Math.abs(v * 10 - Math.round(v * 10)) < 1e-9 ? num(v) : null);

/* ------------------------------------------------- speed-distance-time */
//
//   foundation  two of speed, distance and time in whole hours; find the third
//   core        times in hours and minutes, or a speed converted between m/s
//               and km/h
//   stretch     the average speed of a journey in two parts

const MOVERS = [
  ['A car travels', 'A car drives', 40, 110],
  ['A train travels', 'A train runs', 60, 160],
  ['A cyclist rides', 'A cyclist rides', 10, 28],
  ['A walker covers', 'A walker walks', 3, 6],
  ['A runner covers', 'A runner runs', 8, 16],
];
const MINUTES = [10, 15, 20, 30, 40, 45, 50];
const hm = (h, m) => [h ? `${h} ${h === 1 ? 'hour' : 'hours'}` : '', m ? `${m} minutes` : ''].filter(Boolean).join(' ');

export const generateSpeedDistanceTime = (options = {}) => {
  const { difficulty = 'core' } = options;
  const meta = { topic: 'speed-distance-time', difficulty };
  // Each kind is chosen once, before the draw: a retry redraws the numbers,
  // never the kind, so a kind that is harder to fill isn't drawn less often.
  const pick = _.random(0, 2);
  const twoParts = _.random(0, 1);

  for (;;) {
    const [covers, at, lo, hi] = _.sample(MOVERS);
    const s = _.random(lo, hi);

    if (difficulty === 'foundation') {
      const h = _.random(2, 6);
      const d = s * h;
      const find = _.sample(['speed', 'distance', 'time']);
      if (find === 'speed') {
        return {
          instruction: 'Find the average speed',
          questionText: `${covers} ${d} km in ${h} hours.`,
          answer: `${s}`, answerUnits: 'km/h',
          workingOut: [`s = \\frac{d}{t} = \\frac{${d}}{${h}}`, `s = ${s}`].join(NL),
          metadata: meta,
        };
      }
      if (find === 'distance') {
        return {
          instruction: 'Find the distance travelled',
          questionText: `${at} at ${s} km/h for ${h} hours.`,
          answer: `${d}`, answerUnits: 'km',
          workingOut: [`d = st = ${s} \\times ${h}`, `d = ${d}`].join(NL),
          metadata: meta,
        };
      }
      return {
        instruction: 'Find the time taken',
        questionText: `${covers} ${d} km at ${s} km/h.`,
        answer: `${h}`, answerUnits: 'hours',
        workingOut: [`t = \\frac{d}{s} = \\frac{${d}}{${s}}`, `t = ${h}`].join(NL),
        metadata: meta,
      };
    }

    if (difficulty === 'core') {
      if (pick === 0) {
        // Converting a speed: × 3.6 one way, ÷ 3.6 the other.
        if (_.random(0, 1)) {
          const v = _.random(4, 45);
          return {
            instruction: 'Convert to km/h',
            questionMath: `${v} \\text{ m/s}`,
            answer: num(v * 3.6), answerUnits: 'km/h',
            workingOut: [`${v} \\times 3600 = ${v * 3600} \\text{ m per hour}`, `${v * 3600} \\div 1000 = ${num(v * 3.6)}`].join(NL),
            metadata: meta,
          };
        }
        const k = 9 * _.random(2, 22);
        return {
          instruction: 'Convert to m/s',
          questionMath: `${k} \\text{ km/h}`,
          answer: num(k / 3.6), answerUnits: 'm/s',
          workingOut: [`${k} \\times 1000 = ${k * 1000} \\text{ m per hour}`, `${k * 1000} \\div 3600 = ${num(k / 3.6)}`].join(NL),
          metadata: meta,
        };
      }
      const h = _.random(0, 4), m = _.sample(MINUTES);
      if (h === 0 && m < 30) continue;
      const tMin = 60 * h + m;
      const d = (s * tMin) / 60;
      if (!Number.isInteger(d)) continue;
      const tTex = `${h} + \\frac{${m}}{60}`;
      const find = _.sample(['speed', 'distance', 'time']);
      if (find === 'speed') {
        return {
          instruction: 'Find the average speed',
          questionText: `${covers} ${d} km in ${hm(h, m)}.`,
          answer: `${s}`, answerUnits: 'km/h',
          workingOut: [`t = ${tTex} = \\frac{${tMin}}{60}`, `s = ${d} \\div \\frac{${tMin}}{60} = ${s}`].join(NL),
          metadata: meta,
        };
      }
      if (find === 'distance') {
        return {
          instruction: 'Find the distance travelled',
          questionText: `${at} at ${s} km/h for ${hm(h, m)}.`,
          answer: `${d}`, answerUnits: 'km',
          workingOut: [`t = ${tTex} = \\frac{${tMin}}{60}`, `d = ${s} \\times \\frac{${tMin}}{60} = ${d}`].join(NL),
          metadata: meta,
        };
      }
      const hmTex = `${h ? `${h} \\text{ h } ` : ''}${m} \\text{ min}`;
      return {
        instruction: 'Find the time taken, in hours and minutes',
        questionText: `${covers} ${d} km at ${s} km/h.`,
        answer: hmTex,
        workingOut: [`t = \\frac{${d}}{${s}} = \\frac{${tMin}}{60} \\text{ hours}`, `t = ${hmTex}`].join(NL),
        metadata: meta,
      };
    }

    // Stretch: two parts, then the average over the whole.
    const name = _.sample(NAMES);
    const [v1, v2] = _.sampleSize(_.range(3, 21).map((x) => x * 5), 2);
    if (twoParts) {
      // Two distances at two speeds.
      const t1 = _.sample([0.5, 1, 1.5, 2, 2.5, 3]), t2 = _.sample([0.25, 0.5, 1, 1.5, 2]);
      const d1 = v1 * t1, d2 = v2 * t2;
      if (!Number.isInteger(d1) || !Number.isInteger(d2)) continue;
      const avg = oneDp((d1 + d2) / (t1 + t2));
      if (!avg) continue;
      return {
        instruction: 'Find the average speed for the whole journey',
        questionText: `${name} travels ${d1} km at ${v1} km/h and then ${d2} km at ${v2} km/h.`,
        answer: avg, answerUnits: 'km/h',
        workingOut: [`t = \\frac{${d1}}{${v1}} + \\frac{${d2}}{${v2}} = ${num(t1 + t2)}`, `s = \\frac{${d1 + d2}}{${num(t1 + t2)}} = ${avg}`].join(NL),
        metadata: meta,
      };
    }
    // Two times at two speeds, the times in minutes.
    const m1 = _.sample([15, 20, 30, 40, 45, 60, 90]), m2 = _.sample([15, 20, 30, 40, 45, 60, 90]);
    const d1 = (v1 * m1) / 60, d2 = (v2 * m2) / 60;
    if (!Number.isInteger(d1) || !Number.isInteger(d2)) continue;
    const avg = oneDp(((d1 + d2) * 60) / (m1 + m2));
    if (!avg) continue;
    return {
      instruction: 'Find the average speed for the whole journey',
      questionText: `${name} travels for ${m1} minutes at ${v1} km/h and then for ${m2} minutes at ${v2} km/h.`,
      answer: avg, answerUnits: 'km/h',
      workingOut: [`d = ${v1} \\times \\frac{${m1}}{60} + ${v2} \\times \\frac{${m2}}{60} = ${d1 + d2}`, `s = ${d1 + d2} \\div \\frac{${m1 + m2}}{60} = ${avg}`].join(NL),
      metadata: meta,
    };
  }
};

/* ------------------------------------------------------- travel-graphs */
//
//   foundation  read the distance at a time, or the length of the stop
//   core        the speed of one part, or the average speed out to the
//               furthest point, in km/h
//   stretch     two travellers (where or when one passes the other), or the
//               average speed for a round trip
//
// The journey is built on the grid: every corner is a whole number of
// squares across and up.

const CONTEXTS = [
  { kind: 'walk', noun: 'walk', place: 'the park', unit: 'minutes', xStep: 10, yStep: 0.5, kmh: [2.5, 7] },
  { kind: 'walk', noun: 'walk', place: 'the shops', unit: 'minutes', xStep: 5, yStep: 0.25, kmh: [2.5, 7] },
  { kind: 'cycle', noun: 'bike ride', place: 'the lake', unit: 'minutes', xStep: 10, yStep: 1, kmh: [8, 24] },
  { kind: 'drive', noun: 'drive', place: 'the coast', unit: 'hours', xStep: 0.5, yStep: 20, kmh: [30, 110] },
];
// Grid units to real ones.
const tOf = (c, i) => i * c.xStep;
const dOf = (c, j) => j * c.yStep;
const hoursOf = (c, i) => (c.unit === 'minutes' ? (i * c.xStep) / 60 : i * c.xStep);
const timeWords = (c, i) => {
  const t = tOf(c, i);
  if (c.unit === 'minutes') return `${t} minutes`;
  return `${num(t)} ${t === 1 ? 'hour' : 'hours'}`;
};
// A time in hours for the working: 1.5, or 50/60 for minutes.
const hoursTex = (c, i) => (c.unit === 'minutes' ? `\\frac{${tOf(c, i)}}{60}` : num(tOf(c, i)));
const speedLine = (c, km, i, v) => `${num(km)} \\div ${hoursTex(c, i)} = ${v}`;
const speedOk = (c, di, dj) => {
  const v = dOf(c, Math.abs(dj)) / hoursOf(c, di);
  return v >= c.kmh[0] && v <= c.kmh[1];
};

// A journey there, a stop, and on to the furthest point; then, if asked, a
// second stop and home again. Grid points [[i, j], ...].
const buildJourney = (c, { back = false } = {}) => {
  for (;;) {
    const a = _.random(1, 4), b = _.random(1, 5);
    const stop = _.random(1, 3);
    const e = _.random(1, 4), f = _.random(1, 5);
    const pts = [[0, 0], [a, b], [a + stop, b], [a + stop + e, b + f]];
    if (!speedOk(c, a, b) || !speedOk(c, e, f)) continue;
    if (back) {
      const rest = _.random(1, 2), r = _.random(2, 5);
      const [i, j] = pts[3];
      pts.push([i + rest, j], [i + rest + r, 0]);
      if (!speedOk(c, r, j)) continue;
    }
    const nx = pts[pts.length - 1][0], ny = b + f;
    if (nx > 12 || nx < 5 || ny > 10 || ny < 4) continue;
    return pts;
  }
};
const axesFor = (c, nx, ny) => ({
  xAxis: { min: 0, max: tOf(c, nx), step: c.xStep, every: nx > 8 ? 2 : 1, title: `time (${c.unit})` },
  yAxis: { min: 0, max: dOf(c, ny), step: c.yStep, every: ny > 6 ? 2 : 1, title: 'distance from home (km)' },
});
const figureOf = (c, journeys, extra = {}) => {
  const nx = Math.max(...journeys.flatMap((j) => j.pts.map(([i]) => i)));
  const ny = Math.max(...journeys.flatMap((j) => j.pts.map(([, k]) => k)));
  return {
    type: 'travel-graph',
    ...axesFor(c, nx, ny),
    journeys: journeys.map((j) => ({ name: j.name, points: j.pts.map(([i, k]) => [tOf(c, i), dOf(c, k)]) })),
    big: true,
    ...extra,
  };
};
// The height of a polyline at grid time i.
const heightAt = (pts, i) => {
  for (let k = 1; k < pts.length; k += 1) {
    const [i0, j0] = pts[k - 1], [i1, j1] = pts[k];
    if (i >= i0 && i <= i1) return i1 === i0 ? j1 : j0 + ((j1 - j0) * (i - i0)) / (i1 - i0);
  }
  return null;
};

export const generateTravelGraphs = (options = {}) => {
  const { difficulty = 'core' } = options;
  const meta = { topic: 'travel-graphs', difficulty };
  const pick = _.random(0, 1); // chosen once, as above

  for (;;) {
    const c = _.sample(CONTEXTS);
    const [name, other] = _.sampleSize(NAMES, 2);
    const instruction = `The graph shows ${name}'s ${c.noun} from home to ${c.place}.`;

    if (difficulty === 'foundation') {
      const pts = buildJourney(c);
      if (pick) {
        // A time where the line crosses a gridline, so the distance reads exactly.
        const last = pts[pts.length - 1][0];
        const times = _.range(1, last + 1).filter((i) => Number.isInteger(heightAt(pts, i)));
        const i = _.sample(times);
        const j = heightAt(pts, i);
        return {
          instruction,
          questionText: `How far from home was ${name} after ${timeWords(c, i)}?`,
          answer: num(dOf(c, j)), answerUnits: 'km',
          workingOut: `\\text{read up from } ${num(tOf(c, i))} \\text{ to } ${num(dOf(c, j))}`,
          visualization: figureOf(c, [{ name, pts }], { reading: { x: tOf(c, i), y: dOf(c, j) } }),
          metadata: meta,
        };
      }
      const mins = (c.unit === 'minutes' ? 1 : 60) * tOf(c, pts[2][0] - pts[1][0]);
      return {
        instruction,
        questionText: `For how many minutes did ${name} stop?`,
        answer: `${mins}`, answerUnits: 'minutes',
        workingOut: `\\text{flat from } ${num(tOf(c, pts[1][0]))} \\text{ to } ${num(tOf(c, pts[2][0]))}`,
        visualization: figureOf(c, [{ name, pts }]),
        metadata: meta,
      };
    }

    if (difficulty === 'core') {
      const pts = buildJourney(c);
      if (pick) {
        const k = _.sample([1, 3]);
        const [i0, j0] = pts[k - 1], [i1, j1] = pts[k];
        const v = oneDp(dOf(c, j1 - j0) / hoursOf(c, i1 - i0));
        if (!v) continue;
        return {
          instruction,
          questionText: `Find ${name}'s speed between ${num(tOf(c, i0))} and ${timeWords(c, i1)}, in km/h.`,
          answer: v, answerUnits: 'km/h',
          workingOut: speedLine(c, dOf(c, j1 - j0), i1 - i0, v),
          visualization: figureOf(c, [{ name, pts }]),
          metadata: meta,
        };
      }
      const [iE, jE] = pts[3];
      const v = oneDp(dOf(c, jE) / hoursOf(c, iE));
      if (!v) continue;
      return {
        instruction,
        questionText: `Find ${name}'s average speed from home to ${c.place}, including the stop, in km/h.`,
        answer: v, answerUnits: 'km/h',
        workingOut: speedLine(c, dOf(c, jE), iE, v),
        visualization: figureOf(c, [{ name, pts }]),
        metadata: meta,
      };
    }

    // Stretch
    if (pick) {
      // A round trip, stops included.
      const pts = buildJourney(c, { back: true });
      const [iE] = pts[pts.length - 1];
      const D = 2 * dOf(c, pts[3][1]);
      const v = oneDp(D / hoursOf(c, iE));
      if (!v) continue;
      return {
        instruction: `The graph shows ${name}'s ${c.noun} to ${c.place} and back.`,
        questionText: `Find ${name}'s average speed for the whole trip, including the stops, in km/h.`,
        answer: v, answerUnits: 'km/h',
        workingOut: speedLine(c, D, iE, v),
        visualization: figureOf(c, [{ name, pts }]),
        metadata: meta,
      };
    }
    // Two travellers: the second leaves later, faster, and passes the first
    // at a grid point.
    const pts = buildJourney(c);
    const [iE, jE] = pts[3];
    const i0 = _.random(1, 3);
    const meets = [];
    for (let i = i0 + 1; i < iE; i += 1) {
      const j = heightAt(pts, i);
      if (!Number.isInteger(j) || j === 0 || j === jE) continue;
      // Straight on from (i0, 0) through (i, j) to the far distance jE.
      const iB = i0 + ((i - i0) * jE) / j;
      if (!Number.isInteger(iB) || iB > iE || iB <= i) continue;
      if (!speedOk(c, iB - i0, jE)) continue;
      // One crossing only: the second traveller is behind before and ahead after.
      const line = (t) => (jE * (t - i0)) / (iB - i0);
      const ok = _.range(i0, iB + 1).every((t) => t === i || (t < i ? line(t) < heightAt(pts, t) : line(t) > heightAt(pts, t)));
      if (ok) meets.push([i, j, iB]);
    }
    if (!meets.length) continue;
    const [im, jm, iB] = _.sample(meets);
    const askDistance = _.random(0, 1) === 1;
    const startWords = c.unit === 'minutes' ? `${tOf(c, i0)} minutes` : `${num(tOf(c, i0))} ${tOf(c, i0) === 1 ? 'hour' : 'hours'}`;
    return {
      instruction: `The graph shows ${name}'s ${c.noun} to ${c.place}, and ${other}'s on the same route.`,
      questionText: `${other} leaves ${startWords} after ${name}. ${askDistance
        ? `How far from home were they when ${other} passed ${name}?`
        : `How long after ${name} set off did ${other} pass ${name}?`}`,
      answer: askDistance ? num(dOf(c, jm)) : num(tOf(c, im)),
      answerUnits: askDistance ? 'km' : c.unit,
      workingOut: `\\text{the lines cross at } (${num(tOf(c, im))}, ${num(dOf(c, jm))})`,
      visualization: figureOf(c, [{ name, pts }, { name: other, pts: [[i0, 0], [iB, jE]] }], { reading: { x: tOf(c, im), y: dOf(c, jm) } }),
      metadata: meta,
    };
  }
};
