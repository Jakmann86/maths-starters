// The checker for scatter-correlation and line-of-best-fit, shared by the
// harness (scatterGenerators.test.js) and the mutation test that proves the
// harness can fail (scatterGenerators.mutation.test.js). Test support only.
//
// Everything is recomputed from what is on the board: the plotted points, the
// drawn line, the axis titles, the table, the printed sentences. Nothing
// comes from the generator's variables or tables. The two tables below —
// which way each pair of variables goes, and what each axis is called in a
// sentence — are written out again here by hand, so a generator whose
// contexts drift fails rather than agreeing with itself.
//
// Each check throws on the first problem and returns a summary otherwise.

const fail = (msg, q) => { throw new Error(`${msg}\n${JSON.stringify(q)}`); };
const must = (cond, msg, q) => { if (!cond) fail(msg, q); };

// Axis title -> its noun phrase in a sentence, and singular/plural.
const PHRASE = {
  'Temperature (°C)': ['the temperature', 'is'],
  'Sales (£)': ['the sales', 'are'],
  'Revision (hours)': ['the revision time', 'is'],
  'Test mark': ['the test mark', 'is'],
  'Maths mark': ['the maths mark', 'is'],
  'Science mark': ['the science mark', 'is'],
  'Height (cm)': ['the height', 'is'],
  'Arm span (cm)': ['the arm span', 'is'],
  'Distance (km)': ['the distance', 'is'],
  'Fare (£)': ['the fare', 'is'],
  'Age (years)': ['the age', 'is'],
  'Value (£)': ['the value', 'is'],
  'Hot drinks sold': ['the hot drink sales', 'are'],
  'Screen time (hours)': ['the screen time', 'is'],
  'Homework mark': ['the homework mark', 'is'],
  'Training (hours)': ['the training time', 'is'],
  'Race time (min)': ['the race time', 'is'],
  'Shoe size': ['the shoe size', 'is'],
  'Reading score': ['the reading score', 'is'],
  'Rainfall (mm)': ['the rainfall', 'is'],
  Visitors: ['the number of visitors', 'is'],
};

// Which way each pair of variables really goes.
const DIRECTION = {
  'Temperature (°C)|Sales (£)': 1,
  'Revision (hours)|Test mark': 1,
  'Maths mark|Science mark': 1,
  'Height (cm)|Arm span (cm)': 1,
  'Distance (km)|Fare (£)': 1,
  'Age (years)|Value (£)': -1,
  'Temperature (°C)|Hot drinks sold': -1,
  'Screen time (hours)|Homework mark': -1,
  'Training (hours)|Race time (min)': -1,
  'Height (cm)|Maths mark': 0,
  'Shoe size|Reading score': 0,
  'Rainfall (mm)|Visitors': 0,
};

// A unit read from an axis title: "(£)" before the number, "(cm)" after.
const unitOf = (title) => {
  const m = /\(([^)]+)\)$/.exec(title);
  if (!m) return {};
  return m[1] === '£' ? { pre: '£' } : { post: m[1] };
};

/* --------------------------------------------------------------- maths */

const mean = (xs) => xs.reduce((a, b) => a + b, 0) / xs.length;

export function pearson(pts) {
  const mx = mean(pts.map((p) => p.x)), my = mean(pts.map((p) => p.y));
  let sxy = 0, sxx = 0, syy = 0;
  for (const p of pts) { sxy += (p.x - mx) * (p.y - my); sxx += (p.x - mx) ** 2; syy += (p.y - my) ** 2; }
  return sxx && syy ? sxy / Math.sqrt(sxx * syy) : 0;
}

function fit(pts) {
  const mx = mean(pts.map((p) => p.x)), my = mean(pts.map((p) => p.y));
  let sxy = 0, sxx = 0;
  for (const p of pts) { sxy += (p.x - mx) * (p.y - my); sxx += (p.x - mx) ** 2; }
  const b = sxy / sxx;
  return { a: my - b * mx, b };
}

const near = (a, b) => Math.abs(a - b) < 1e-9;
const onGrid = (v, axis) => near(Math.round((v - axis.min) / axis.step), (v - axis.min) / axis.step);

/* ------------------------------------------------------------- figures */

function checkScatterFig(q, minGap) {
  const f = q.visualization;
  must(f?.type === 'scatter', 'figure type', q);
  must(f.big === true, 'big figure', q);
  for (const [k, cap] of [['xAxis', 12], ['yAxis', 8]]) {
    const a = f[k];
    must(a && a.max > a.min && a.step > 0, `${k} bounds`, q);
    const cells = (a.max - a.min) / a.step;
    must(near(cells, Math.round(cells)) && cells <= cap && cells >= 6, `${k} has a whole number of cells, at most ${cap}`, q);
    must(Number.isInteger(a.every) && a.every >= 1, `${k}.every`, q);
    // Numbered gridlines stay readable: at most 6 numbers up the side.
    if (k === 'yAxis') must(cells / a.every <= 8, 'y numbers not crowded', q);
    must(typeof a.title === 'string' && a.title in PHRASE, `${k} title "${a.title}" is known`, q);
    must(!/[\\^]/.test(a.title), 'axis titles are plain text', q);
  }
  const pts = f.points;
  must(Array.isArray(pts) && pts.length >= 5, 'enough points', q);
  const { xAxis: xa, yAxis: ya } = f;
  for (const p of pts) {
    must(Number.isFinite(p.x) && Number.isFinite(p.y), 'numeric points', q);
    must(p.x > xa.min && p.x < xa.max && p.y > ya.min && p.y < ya.max, `point (${p.x}, ${p.y}) inside the frame`, q);
  }
  // Crosses never sit on top of one another.
  const cell = (p, r) => Math.hypot((p.x - r.x) / xa.step, (p.y - r.y) / ya.step);
  pts.forEach((p, i) => pts.forEach((r, j) => {
    if (i < j) must(cell(p, r) >= minGap - 0.11, `points ${i} and ${j} are ${cell(p, r).toFixed(2)} cells apart`, q);
  }));
  const dir = DIRECTION[`${xa.title}|${ya.title}`];
  must(dir !== undefined, `the pair ${xa.title} / ${ya.title} is a known context`, q);
  return { pts, xa, ya, dir };
}

// The count in the set-up sentence: "of 12 students", "on 9 days".
const countIn = (s) => Number((/(\d+) (?:days|students|taxi journeys|cars|runners)\b/.exec(s) || [])[1]);

const lines = (answer) => answer.split('\n').map((l) => {
  const m = /^\\text\{(.*)\}$/.exec(l);
  return m ? m[1] : null;
});

/* --------------------------------------------------- scatter-correlation */

export function checkCorrelation(q, difficulty) {
  must(q.metadata?.topic === 'scatter-correlation' && q.metadata?.difficulty === difficulty, 'metadata', q);
  must(/^The scatter graph shows .+\.$/.test(q.instruction), 'set-up sentence', q);
  must(!/\\/.test(q.instruction + q.questionText), 'plain-text prose', q);
  const named = difficulty === 'stretch';
  const { pts, xa, ya, dir } = checkScatterFig(q, named ? 1.4 : 0.7);
  must(countIn(q.instruction) === pts.length, 'the count in the sentence matches the points drawn', q);
  const r = pearson(pts);
  const ans = lines(q.answer);
  must(ans.every((l) => l !== null), 'answer lines are \\text{}', q);
  // An answer line does not wrap on the board.
  must(ans.every((l) => l.length <= 34), 'every answer line fits the slot', q);

  if (difficulty !== 'stretch') {
    must(pts.every((p) => !p.name), 'no names below stretch', q);
    must(q.visualization.highlight == null, 'no highlight below stretch', q);
    const sign = Math.abs(r) < 0.2 ? 0 : Math.sign(r);
    must(sign === dir, `the cloud goes the way the context does (r = ${r.toFixed(2)})`, q);
    const strength = Math.abs(r) >= 0.85 ? 'strong' : Math.abs(r) >= 0.4 && Math.abs(r) <= 0.75 ? 'weak' : Math.abs(r) < 0.2 ? 'none' : null;
    must(strength, `r = ${r.toFixed(3)} sits in a clear band`, q);
    const word = sign === 0 ? 'no correlation' : `${sign > 0 ? 'positive' : 'negative'} correlation`;
    // Within rounding: r is invariant to the axes' scale, but the float
    // noise of computing it in different units can tip the second decimal.
    const wr = /^r = (-?\d\.\d\d)$/.exec(q.workingOut);
    must(wr && Math.abs(Number(wr[1]) - r) <= 0.005 + 1e-9, `working should give r = ${r.toFixed(2)}`, q);
    if (difficulty === 'foundation') {
      must(q.questionText === 'Describe the correlation.', 'foundation ask', q);
      must(strength !== 'weak', 'foundation is clear-cut', q);
      must(ans.length === 1 && ans[0] === word, `answer should be "${word}"`, q);
    } else {
      must(q.questionText === 'Describe the correlation, and say what it means.', 'core ask', q);
      const full = sign === 0 ? 'no correlation' : `${strength} ${word}`;
      must(ans[0] === full, `answer should start "${full}"`, q);
      if (sign === 0) {
        must(ans.length === 2 && ans[1] === 'there is no relationship', 'no-correlation meaning', q);
      } else {
        const [xp, xb] = PHRASE[xa.title], [yp, yb] = PHRASE[ya.title];
        const verb = (up, be) => `${up ? 'increase' : 'decrease'}${be === 'are' ? '' : 's'}`;
        must(ans.length === 3, 'core answer has three lines', q);
        must(ans[1] === `as ${xp} ${verb(true, xb)},`, `meaning line 1: "${ans[1]}"`, q);
        must(ans[2] === `${yp} ${verb(sign > 0, yb)}`, `meaning line 2: "${ans[2]}"`, q);
      }
    }
    return { r, strength, sign };
  }

  // Stretch: one named point off a strong trend.
  const names = pts.map((p) => p.name);
  must(names.every((n) => typeof n === 'string' && /^[A-Z][a-záéíóú]+$/.test(n)), 'every point named', q);
  must(new Set(names).size === names.length, 'names unique', q);
  const m = /^Which (student|runner) does not fit the trend\? Describe the correlation for the others\.$/.exec(q.questionText);
  must(m, 'stretch ask', q);
  must(ans.length === 2, 'stretch answer has two lines', q);
  const odd = ans[0];
  must(names.includes(odd), 'the answer names a point on the graph', q);
  must(q.visualization.highlight === odd, 'the highlight is the answer', q);
  must(dir !== 0, 'stretch contexts have a trend', q);
  // In cell units, so the two axes weigh the same.
  const cellPts = pts.map((p) => ({ x: (p.x - xa.min) / xa.step, y: (p.y - ya.min) / ya.step, name: p.name }));
  const rest = cellPts.filter((p) => p.name !== odd);
  const rr = pearson(rest);
  must(Math.abs(rr) >= 0.85 && Math.sign(rr) === dir, `without ${odd}, r = ${rr.toFixed(2)} is strong and the right way`, q);
  must(ans[1] === `strong ${dir > 0 ? 'positive' : 'negative'} correlation`, 'the others\' correlation', q);
  const wr = new RegExp(`^\\\\text\\{without ${odd}: \\} r = (-?\\d\\.\\d\\d)$`).exec(q.workingOut);
  must(wr && Math.abs(Number(wr[1]) - rr) <= 0.005 + 1e-9, 'working gives r without the odd one out', q);
  const L = fit(rest);
  const res = (p) => Math.abs(p.y - (L.a + L.b * p.x));
  const oddPt = cellPts.find((p) => p.name === odd);
  const worst = Math.max(...rest.map(res));
  must(res(oddPt) >= 2.5, `${odd} is ${res(oddPt).toFixed(2)} cells off the trend`, q);
  must(res(oddPt) >= 2 * worst, `${odd} stands out: ${res(oddPt).toFixed(2)} against ${worst.toFixed(2)}`, q);
  // And no one else would do: leaving out any other point gives a weaker
  // fit than leaving out the answer.
  for (const p of cellPts) {
    if (p.name === odd) continue;
    const without = cellPts.filter((s) => s !== p);
    must(Math.abs(pearson(without)) < Math.abs(rr), `leaving out ${p.name} instead fits better`, q);
  }
  return { r: rr, odd };
}

/* ------------------------------------------------------ line-of-best-fit */

const parseGiven = (s, unit) => {
  let t = s;
  if (unit.pre) { if (!t.startsWith(unit.pre)) return NaN; t = t.slice(unit.pre.length); }
  if (unit.post) { if (!t.endsWith(` ${unit.post}`)) return NaN; t = t.slice(0, -unit.post.length - 1); }
  return /^\d+(\.\d+)?$/.test(t) ? Number(t) : NaN;
};

// An answer as printed: "\text{£7000}", "160", or at Stretch "8\text{ hours}".
const answerValue = (s) => {
  let m = /^\\text\{£(\d+(?:\.\d+)?)\}$/.exec(s);
  if (m) return { v: Number(m[1]), pre: '£' };
  m = /^(\d+(?:\.\d+)?)(?:\\text\{ ([^}]+)\})?$/.exec(s);
  return m ? { v: Number(m[1]), post: m[2] } : null;
};
const sameUnit = (got, unit, inline) => (unit.pre
  ? got.pre === unit.pre
  : !got.pre && got.post === (inline ? unit.post : undefined));

export function checkLineOfBestFit(q, difficulty) {
  must(q.metadata?.topic === 'line-of-best-fit' && q.metadata?.difficulty === difficulty, 'metadata', q);
  if (difficulty === 'core') return checkMeanPoint(q);

  const { pts, xa, ya, dir } = checkScatterFig(q, 0.7);
  must(dir !== 0, 'a line of best fit only where there is a trend', q);
  must(countIn(q.instruction) === pts.length, 'the count in the sentence matches the points drawn', q);
  const f = q.visualization;
  must(Array.isArray(f.line) && f.line.length === 2, 'a drawn line', q);
  const [[x1, y1], [x2, y2]] = f.line;
  must(x2 > x1, 'line endpoints in order', q);
  // Through two grid crossings.
  [x1, x2].forEach((x) => must(onGrid(x, xa), 'line ends on a gridline', q));
  const at = (x) => y1 + ((y2 - y1) * (x - x1)) / (x2 - x1);
  const inv = (y) => x1 + ((x2 - x1) * (y - y1)) / (y2 - y1);

  // The line is a fair line of best fit for these points.
  const r = pearson(pts);
  must(Math.abs(r) >= 0.85 && Math.sign(r) === dir, `points strongly correlated the context's way (r = ${r.toFixed(2)})`, q);
  must(Math.sign(y2 - y1) === dir, 'the line slopes the way the points do', q);
  const above = pts.filter((p) => p.y > at(p.x) + 1e-9).length;
  const below = pts.filter((p) => p.y < at(p.x) - 1e-9).length;
  must(Math.abs(above - below) <= 2, `about as many above (${above}) as below (${below})`, q);
  const mx = mean(pts.map((p) => p.x)), my = mean(pts.map((p) => p.y));
  must(Math.abs(my - at(mx)) <= 0.4 * ya.step + 1e-9, 'the line passes close to the mean point', q);
  const L = fit(pts);
  const slopeCells = (b) => (b * xa.step) / ya.step;
  must(Math.abs(slopeCells(L.b) - slopeCells((y2 - y1) / (x2 - x1))) <= 0.35, 'gradient close to the least-squares one', q);

  // The question: which way it reads, and the value it gives.
  const lead = difficulty === 'foundation' ? 'Use the line of best fit to estimate' : 'Estimate';
  const [xp, xb] = PHRASE[xa.title], [yp, yb] = PHRASE[ya.title];
  const tail = difficulty === 'foundation' ? '' : ' Is this reliable?';
  const fromX = new RegExp(`^${lead} ${esc(yp)} when ${esc(xp)} ${xb} (.+)\\.${esc(tail)}$`).exec(q.questionText);
  const fromY = new RegExp(`^${lead} ${esc(xp)} when ${esc(yp)} ${yb} (.+)\\.${esc(tail)}$`).exec(q.questionText);
  must(Boolean(fromX) !== Boolean(fromY), `the ask reads one way: "${q.questionText}"`, q);
  if (difficulty === 'foundation') must(fromX, 'foundation reads from x', q);
  let gx, gy;
  if (fromX) {
    gx = parseGiven(fromX[1], unitOf(xa.title));
    must(Number.isFinite(gx), `given value "${fromX[1]}"`, q);
    gy = at(gx);
  } else {
    gy = parseGiven(fromY[1], unitOf(ya.title));
    must(Number.isFinite(gy), `given value "${fromY[1]}"`, q);
    gx = inv(gy);
  }
  must(gx > xa.min && gx < xa.max && gy > ya.min && gy < ya.max, 'the reading is on the graph', q);
  must(onGrid(gx, xa) && onGrid(gy, ya), 'the reading lands on a grid crossing', q);
  const want = fromX ? gy : gx;
  const given = fromX ? gx : gy;
  must(!near(want, given), 'the estimate is not the number in the question', q);
  const reading = f.reading;
  must(reading && near(reading.x, gx) && near(reading.y, gy) && reading.from === (fromX ? 'x' : 'y'), 'reading lines match the ask', q);

  const lo = Math.min(...pts.map((p) => p.x)), hi = Math.max(...pts.map((p) => p.x));
  const inside = gx >= lo + xa.step - 1e-9 && gx <= hi - xa.step + 1e-9;
  const outside = gx <= lo - xa.step + 1e-9 || gx >= hi + xa.step - 1e-9;
  must(inside || outside, 'clearly inside or clearly outside the data', q);
  const unit = unitOf((fromX ? ya : xa).title);

  const num = (t) => Number(t);
  if (difficulty === 'foundation') {
    const wm = /^\\text\{read from \} x = ([\d.]+) \\text\{ to the line\}$/.exec(q.workingOut);
    must(wm && near(num(wm[1]), gx), 'working reads from the given x', q);
    must(inside, 'foundation reads inside the data', q);
    const got = answerValue(q.answer);
    must(got && sameUnit(got, unit, false) && near(got.v, want), `answer ${q.answer} should be ${want}`, q);
    if (unit.post) must(q.answerUnits === `\\text{${unit.post}}`, 'answer units', q);
    else must(q.answerUnits === undefined, 'no answer units', q);
    return { inside };
  }
  const wl = q.workingOut.split('\n');
  const w1 = new RegExp(`^\\\\text\\{${esc(xp)}: data from \\} ([\\d.]+) \\\\text\\{ to \\} ([\\d.]+)$`).exec(wl[0]);
  must(w1 && near(num(w1[1]), lo) && near(num(w1[2]), hi), `working gives the data's x range ${lo} to ${hi}`, q);
  const w2 = /^x = ([\d.]+) \\text\{ is (inside|outside) that range\}$/.exec(wl[1] ?? '');
  must(w2 && near(num(w2[1]), gx) && w2[2] === (inside ? 'inside' : 'outside'), 'working places the reading', q);
  const al = q.answer.split('\n');
  must(al.length === 2, 'stretch answer has two lines', q);
  const got = answerValue(al[0]);
  must(got && sameUnit(got, unit, true) && near(got.v, want), `answer ${al[0]} should be ${want}`, q);
  must(q.answerUnits === undefined, 'stretch keeps units inline', q);
  must(al[1] === (inside ? '\\text{reliable (interpolation)}' : '\\text{not reliable (extrapolation)}'),
    `verdict should be ${inside ? 'reliable' : 'not reliable'}`, q);
  return { inside, fromX: Boolean(fromX) };
}

const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

function checkMeanPoint(q) {
  const f = q.visualization;
  must(f?.type === 'table' && f.header === 'column' && f.big === true, 'a table', q);
  const [xr, yr] = f.rows;
  must(f.rows.length === 2 && xr.length === yr.length, 'two equal rows', q);
  must(DIRECTION[`${xr[0]}|${yr[0]}`] !== undefined && DIRECTION[`${xr[0]}|${yr[0]}`] !== 0, 'a context with a trend', q);
  const xs = xr.slice(1).map(Number), ys = yr.slice(1).map(Number);
  must(xs.every(Number.isInteger) && ys.every(Number.isInteger), 'whole-number data', q);
  must([...xs, ...ys].every((v) => v < 1000), 'values small enough to add by hand', q);
  must(new Set(xs).size === xs.length, 'distinct x values', q);
  must(/^The table shows .+\.$/.test(q.instruction), 'set-up sentence', q);
  must(countIn(q.instruction) === xs.length, 'count matches the table', q);
  must(q.questionText === 'Find the mean point, which the line of best fit should pass through.', 'core ask', q);
  const mx = mean(xs), my = mean(ys);
  must(Number.isInteger(mx) && Number.isInteger(my), 'whole-number means', q);
  must(q.answer === `(${mx}, ${my})`, `answer should be (${mx}, ${my})`, q);
  // Each working line: \bar{x} = \frac{a + b + ...}{n} = m
  const wl = q.workingOut.split('\n');
  must(wl.length === 2, 'two working lines', q);
  [[wl[0], xs, mx], [wl[1], ys, my]].forEach(([l, vs, m]) => {
    const mm = /^\\bar\{[xy]\} = \\frac\{([\d +]+)\}\{(\d+)\} = (\d+)$/.exec(l);
    must(mm, `working line "${l}"`, q);
    const terms = mm[1].split(' + ').map(Number);
    must(terms.join() === vs.join(), 'working adds the table row', q);
    must(Number(mm[2]) === vs.length && Number(mm[3]) === m && terms.reduce((a, b) => a + b, 0) / Number(mm[2]) === m, 'working balances', q);
  });
  return { n: xs.length };
}
