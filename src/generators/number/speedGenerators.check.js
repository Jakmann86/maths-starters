// Test support only. Recomputes every Speed, distance and time answer from
// what is printed: the prose read back with patterns, and for a travel graph
// the journey read off the figure config (the figure is drawn to its data,
// so its points are what a student reads). Never from the generator's
// variables. Working lines are checked with the TeX reader from the
// Logarithms checker.

import { compiles } from './latexArithmetic.check';
import { value } from './logarithmGenerators.check';

const must = (cond, msg) => { if (!cond) throw new Error(msg); };
const close = (a, b, tol = 1e-9) => Number.isFinite(a) && Math.abs(a - b) <= tol * Math.max(1, Math.abs(a), Math.abs(b));
const num = (v) => String(Number(v.toFixed(6)));
const oneDp = (v) => {
  must(close(v * 10, Math.round(v * 10)), `needs rounding: ${v}`);
  return num(Math.round(v * 10) / 10);
};

// "2 h 20 min" as hours, and unit words dropped, before the TeX reader.
const plain = (part) => part
  .replace(/(\d+) \\text\{ h \} (\d+) \\text\{ min\}/g, '($1 + \\frac{$2}{60})')
  .replace(/^(\d+) \\text\{ min\}$/, '\\frac{$1}{60}')
  .replace(/\s*\\text\{ [^}]*\}/g, '');
const working = (q, vars = {}) => {
  q.workingOut.split('\n').forEach((line) => {
    const parts = line.split(' = ').map(plain);
    must(parts.length >= 2, `working line is not an equation: ${line}`);
    const vals = parts.map((p) => value(p, vars));
    vals.forEach((v) => must(close(v, vals[0], 1e-9), `working line false: ${line}`));
  });
};
const answerIs = (q, v, units) => {
  must(q.answer === v, `wrong: ${q.answer}, should be ${v}`);
  must(q.answerUnits === units, `units: ${q.answerUnits}, should be ${units}`);
};

/* ------------------------------------------------- speed-distance-time */

const SUBJECT = '(A (?:car|train|cyclist|walker|runner) (?:travels|drives|runs|rides|covers|walks))';
// "2 hours 15 minutes", "45 minutes", "3 hours" as hours.
const TIME = '((?:\\d+ hours?)?(?: ?\\d+ minutes)?)';
const hoursOf = (s) => {
  const h = /(\d+) hours?/.exec(s), m = /(\d+) minutes/.exec(s);
  must(h || m, `time: ${s}`);
  return (h ? Number(h[1]) : 0) + (m ? Number(m[1]) / 60 : 0);
};

function checkSdt(q, band) {
  if (q.questionMath) {
    must(band === 'core', 'a conversion below or above Core');
    let m = /^(\d+) \\text\{ m\/s\}$/.exec(q.questionMath);
    if (m) {
      must(q.instruction === 'Convert to km/h', 'instruction');
      answerIs(q, num(Number(m[1]) * 3.6), 'km/h');
    } else {
      m = /^(\d+) \\text\{ km\/h\}$/.exec(q.questionMath);
      must(m && q.instruction === 'Convert to m/s', `question: ${q.questionMath}`);
      answerIs(q, num(Number(m[1]) / 3.6), 'm/s');
      must(close(Number(m[1]) / 3.6 * 10, Math.round(Number(m[1]) / 3.6 * 10)), 'answer needs rounding');
    }
    working(q);
    return { kind: 'converting units' };
  }
  const t = q.questionText;
  if (band === 'stretch') {
    must(q.instruction === 'Find the average speed for the whole journey', 'instruction');
    let m = /^[A-Z][a-z]+ travels (\d+) km at (\d+) km\/h and then (\d+) km at (\d+) km\/h\.$/.exec(t);
    if (m) {
      const [d1, v1, d2, v2] = m.slice(1).map(Number);
      must(v1 !== v2, 'two different speeds');
      const T = d1 / v1 + d2 / v2;
      answerIs(q, oneDp((d1 + d2) / T), 'km/h');
      working(q, { t: T, s: (d1 + d2) / T });
      return { kind: 'two distances' };
    }
    m = /^[A-Z][a-z]+ travels for (\d+) minutes at (\d+) km\/h and then for (\d+) minutes at (\d+) km\/h\.$/.exec(t);
    must(m, `question: ${t}`);
    const [m1, v1, m2, v2] = m.slice(1).map(Number);
    must(v1 !== v2, 'two different speeds');
    const D = (v1 * m1 + v2 * m2) / 60;
    answerIs(q, oneDp((D * 60) / (m1 + m2)), 'km/h');
    working(q, { d: D, s: (D * 60) / (m1 + m2) });
    return { kind: 'two times' };
  }
  let m = new RegExp(`^${SUBJECT} (\\d+) km in ${TIME}\\.$`).exec(t);
  let kind;
  if (m) {
    must(q.instruction === 'Find the average speed', 'instruction');
    const d = Number(m[2]), h = hoursOf(m[3]);
    answerIs(q, num(d / h), 'km/h');
    must(close(d / h, Math.round(d / h)), 'speed is not whole');
    working(q, { s: d / h, d, t: h });
    kind = m[3].includes('minutes') ? 'hours and minutes' : 'speed';
  } else if ((m = new RegExp(`^${SUBJECT} at (\\d+) km/h for ${TIME}\\.$`).exec(t))) {
    must(q.instruction === 'Find the distance travelled', 'instruction');
    const s = Number(m[2]), h = hoursOf(m[3]);
    answerIs(q, num(s * h), 'km');
    must(close(s * h, Math.round(s * h)), 'distance is not whole');
    working(q, { d: s * h, s, t: h });
    kind = m[3].includes('minutes') ? 'hours and minutes' : 'distance';
  } else {
    m = new RegExp(`^${SUBJECT} (\\d+) km at (\\d+) km/h\\.$`).exec(t);
    must(m, `question: ${t}`);
    const d = Number(m[2]), s = Number(m[3]), h = d / s;
    if (band === 'foundation') {
      must(q.instruction === 'Find the time taken' && Number.isInteger(h), 'Foundation time is whole hours');
      answerIs(q, `${h}`, 'hours');
      kind = 'time';
    } else {
      must(q.instruction === 'Find the time taken, in hours and minutes', 'instruction');
      const mins = Math.round(h * 60);
      must(close(mins, h * 60) && !Number.isInteger(h), 'time is a whole number of minutes, not hours');
      const H = Math.floor(mins / 60), M = mins % 60;
      must(q.answer === `${H ? `${H} \\text{ h } ` : ''}${M} \\text{ min}` && !q.answerUnits, `wrong: ${q.answer}`);
      kind = 'hours and minutes';
    }
    working(q, { t: h, d, s });
  }
  if (band === 'foundation') must(kind !== 'hours and minutes', 'Foundation is whole hours');
  else must(kind === 'hours and minutes', 'Core has hours and minutes');
  return { kind };
}

/* ------------------------------------------------------- travel-graphs */

const onGrid = (v, step) => close(v / step, Math.round(v / step), 1e-9);
// The distance along a polyline at time x, or null off its ends.
const at = (pts, x) => {
  for (let k = 1; k < pts.length; k += 1) {
    const [x0, y0] = pts[k - 1], [x1, y1] = pts[k];
    if (x >= x0 - 1e-9 && x <= x1 + 1e-9) return x1 === x0 ? y1 : y0 + ((y1 - y0) * (x - x0)) / (x1 - x0);
  }
  return null;
};
// Where two polylines cross: every time either has a corner, plus the
// crossing inside each piece between them.
const crossings = (a, b) => {
  const xs = [...new Set([...a, ...b].map(([x]) => x))].sort((p, r) => p - r)
    .filter((x) => at(a, x) !== null && at(b, x) !== null);
  const out = [];
  for (let k = 1; k < xs.length; k += 1) {
    const [x0, x1] = [xs[k - 1], xs[k]];
    const g0 = at(a, x0) - at(b, x0), g1 = at(a, x1) - at(b, x1);
    if (g0 === 0 && k > 1) continue;
    if (g0 * g1 < 0) out.push(x0 + ((x1 - x0) * g0) / (g0 - g1));
    else if (g1 === 0 && k < xs.length - 1) out.push(x1);
  }
  return out.map((x) => [x, at(a, x)]);
};
const TIME_AT = '(\\d+(?:\\.\\d+)?) (minutes|hours?)';

function checkTravel(q, band) {
  const f = q.visualization;
  must(f?.type === 'travel-graph', 'figure');
  const { xAxis: xa, yAxis: ya, journeys } = f;
  const unit = /^time \((minutes|hours)\)$/.exec(xa.title)?.[1];
  must(unit && ya.title === 'distance from home (km)', 'axis titles');
  const hours = (dx) => (unit === 'minutes' ? dx / 60 : dx);
  // Every corner on a gridline, inside the axes, in time order.
  journeys.forEach((j) => j.points.forEach(([x, y], k) => {
    must(onGrid(x, xa.step) && onGrid(y, ya.step), `a corner off the grid: ${x}, ${y}`);
    must(x >= xa.min && x <= xa.max && y >= ya.min && y <= ya.max, 'a corner outside the axes');
    if (k) must(x > j.points[k - 1][0], 'time goes backwards');
  }));
  const allX = journeys.flatMap((j) => j.points.map(([x]) => x)), allY = journeys.flatMap((j) => j.points.map(([, y]) => y));
  must(xa.max === Math.max(...allX) && ya.max === Math.max(...allY), 'the axes fit the journey');
  const [A, B] = journeys;
  const name = A.name;
  const t = q.questionText;
  must(q.instruction.startsWith(`The graph shows ${name}'s `), 'instruction names the traveller');
  const pts = A.points;
  must(pts[0][0] === 0 && pts[0][1] === 0, 'starts at home at time 0');
  const last = q.workingOut;

  if (band === 'foundation') {
    must(journeys.length === 1, 'one traveller');
    let m = new RegExp(`^How far from home was ${name} after ${TIME_AT}\\?$`).exec(t);
    if (m) {
      const x = Number(m[1]);
      must((m[2] === 'minutes') === (unit === 'minutes'), 'time in the axis unit');
      const y = at(pts, x);
      must(y !== null && onGrid(y, ya.step), 'reading off a gridline');
      answerIs(q, num(y), 'km');
      must(f.reading && f.reading.x === x && f.reading.y === y, 'reading lines');
      must(last === `\\text{read up from } ${num(x)} \\text{ to } ${num(y)}`, `working: ${last}`);
      return { kind: 'read the distance' };
    }
    must(t === `For how many minutes did ${name} stop?`, `question: ${t}`);
    const flats = pts.slice(1).map((p, k) => [pts[k], p]).filter(([p, r]) => p[1] === r[1]);
    must(flats.length === 1, 'one stop');
    const [[x0], [x1]] = flats[0];
    answerIs(q, num(unit === 'minutes' ? x1 - x0 : (x1 - x0) * 60), 'minutes');
    must(last === `\\text{flat from } ${num(x0)} \\text{ to } ${num(x1)}`, `working: ${last}`);
    return { kind: 'length of the stop' };
  }

  if (band === 'core') {
    must(journeys.length === 1, 'one traveller');
    let m = new RegExp(`^Find ${name}'s speed between (\\d+(?:\\.\\d+)?) and ${TIME_AT}, in km/h\\.$`).exec(t);
    let v, km, dt;
    if (m) {
      must((m[3] === 'minutes') === (unit === 'minutes'), 'time in the axis unit');
      const [x0, x1] = [Number(m[1]), Number(m[2])];
      const k = pts.findIndex(([x]) => x === x0);
      must(k >= 0 && pts[k + 1]?.[0] === x1, 'between two neighbouring corners');
      km = pts[k + 1][1] - pts[k][1]; dt = x1 - x0;
      must(km > 0, 'a moving part');
      v = oneDp(km / hours(dt));
      answerIs(q, v, 'km/h');
      working(q);
      must(close(value(last.split(' = ')[0]), km / hours(dt)), 'working uses that part');
      return { kind: 'speed of a part' };
    }
    m = new RegExp(`^Find ${name}'s average speed from home to (the [a-z]+), including the stop, in km/h\\.$`).exec(t);
    must(m && q.instruction.endsWith(`to ${m[1]}.`), `question: ${t}`);
    const far = Math.max(...pts.map(([, y]) => y));
    const xFar = pts.find(([, y]) => y === far)[0];
    must(pts.slice(1).some(([, y], k) => y === pts[k][1]), 'there is a stop');
    v = oneDp(far / hours(xFar));
    answerIs(q, v, 'km/h');
    working(q);
    must(close(value(last.split(' = ')[0]), far / hours(xFar)), 'working uses the whole way out');
    return { kind: 'average speed' };
  }

  // Stretch
  if (journeys.length === 1) {
    must(t === `Find ${name}'s average speed for the whole trip, including the stops, in km/h.`, `question: ${t}`);
    must(pts[pts.length - 1][1] === 0 && q.instruction.endsWith('and back.'), 'a round trip');
    // Out with a stop, a stop at the far end, then home: two flat parts, the
    // second at the furthest point.
    const flats = pts.slice(1).map((p, k) => [pts[k], p]).filter(([p, r]) => p[1] === r[1]);
    const far = Math.max(...pts.map(([, y]) => y));
    must(flats.length === 2 && flats[1][0][1] === far, 'two stops, the second at the far end');
    const D = pts.slice(1).reduce((s, [, y], k) => s + Math.abs(y - pts[k][1]), 0);
    const T = pts[pts.length - 1][0];
    answerIs(q, oneDp(D / hours(T)), 'km/h');
    working(q);
    must(close(value(last.split(' = ')[0]), D / hours(T)), 'working uses the whole trip');
    return { kind: 'round trip' };
  }
  must(journeys.length === 2 && B.name && B.name !== name, 'two named travellers');
  const m = new RegExp(`^${B.name} leaves ${TIME_AT} after ${name}\\. (How far from home were they when ${B.name} passed ${name}\\?|How long after ${name} set off did ${B.name} pass ${name}\\?)$`).exec(t);
  must(m, `question: ${t}`);
  const x0 = Number(m[1]);
  must((m[2] === 'minutes') === (unit === 'minutes'), 'time in the axis unit');
  must(B.points[0][0] === x0 && B.points[0][1] === 0, 'the second leaves home then');
  must(B.points[B.points.length - 1][0] < pts[pts.length - 1][0], 'the second arrives first');
  const cross = crossings(pts, B.points).filter(([x]) => x > x0);
  must(cross.length === 1, `they pass ${cross.length} times`);
  const [[xc, yc]] = cross;
  must(onGrid(xc, xa.step) && onGrid(yc, ya.step), 'they pass at a grid point');
  if (m[3].startsWith('How far')) answerIs(q, num(yc), 'km');
  else answerIs(q, num(xc), unit);
  must(f.reading && f.reading.x === xc && f.reading.y === yc, 'reading lines');
  must(last === `\\text{the lines cross at } (${num(xc)}, ${num(yc)})`, `working: ${last}`);
  return { kind: 'two travellers' };
}

const CHECKS = { 'speed-distance-time': checkSdt, 'travel-graphs': checkTravel };

export function checkSpeed(q, band) {
  const topic = q.metadata?.topic;
  must(CHECKS[topic], `unknown topic ${topic}`);
  must(q.metadata.difficulty === band, 'metadata difficulty');
  must(!/\d/.test(q.instruction), 'a number in the instruction');
  [q.questionMath ?? '1', q.answer, q.workingOut].forEach(compiles);
  const result = CHECKS[topic](q, band);
  // The working ends at the answer.
  if (topic === 'speed-distance-time') {
    const end = q.workingOut.split('\n').pop().split(' = ').pop();
    must(end === q.answer || (/^[\d.]+$/.test(end) && Number(end) === Number(q.answer)), `working ends at ${end}`);
    if (!q.questionMath) {
      const letter = { 'km/h': 's', km: 'd' }[q.answerUnits] ?? 't';
      must(q.workingOut.split('\n').pop().startsWith(`${letter} = `), 'working ends at the quantity asked for');
    }
  }
  return result;
}
