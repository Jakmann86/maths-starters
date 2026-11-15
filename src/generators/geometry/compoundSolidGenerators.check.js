// Test support only. Checks compound-volume and compound-surface-area from
// what is printed: every length is read off the figure's labels, the solid
// is named by the figure's shape, and the volume or surface area is worked
// out here, part by part, as a multiple of π. The answer, its form (exact or
// 3 s.f., as the instruction says) and every working line must agree.
// Nothing is imported from the generator.

const must = (cond, msg) => { if (!cond) throw new Error(msg); };
const lines = (s) => String(s ?? '').split('\n');
const UNITS = ['cm', 'm', 'mm'];

const pi = (n) => (n === 1 ? '\\pi' : `${n}\\pi`);
/** 3 significant figures, as the board prints them. */
function sf3(x) {
  const mag = Math.floor(Math.log10(Math.abs(x)));
  const f = 10 ** (2 - mag);
  const r = Math.round(x * f) / f;
  const m2 = Math.floor(Math.log10(Math.abs(r)));
  return m2 === mag ? r.toFixed(Math.max(0, 2 - mag)) : (Math.round(x * 10 ** (2 - m2)) / 10 ** (2 - m2)).toFixed(Math.max(0, 2 - m2));
}

/** The figure's labels, each "n u", read: { values, unit }. */
function readLabels(f) {
  const values = {};
  let unit = null;
  ['r', 'diameter', 'h', 'coneH', 'slant', 'r2', 'h2', 'inner', 'thickness'].forEach((k) => {
    if (f[k] === undefined) return;
    const m = /^(\d+) (cm|m|mm)$/.exec(f[k]);
    must(m, `a length label: ${k} = ${f[k]}`);
    must(unit === null || unit === m[2], 'one unit throughout');
    unit = m[2];
    values[k] = Number(m[1]);
  });
  must(UNITS.includes(unit), 'a unit');
  return { values, unit };
}

function form(q, what) {
  const exact = `${what}. Leave your answer in terms of π`;
  const rounded = `${what}. Give your answer to 3 significant figures`;
  must(q.instruction === exact || q.instruction === rounded, `instruction: ${q.instruction}`);
  return q.instruction === exact;
}

/** The answer and the last working lines, for a total k·π. */
function finish(q, k, sym, exact) {
  must(Number.isInteger(k) && k > 0, 'a whole multiple of π');
  must(q.answer === (exact ? pi(k) : sf3(k * Math.PI)), `answer ${q.answer}, expected ${exact ? pi(k) : sf3(k * Math.PI)}`);
  const w = lines(q.workingOut);
  if (exact) must(w.at(-1) === `${sym} = ${pi(k)}`, 'the working ends on the total');
  else must(w.at(-2) === `${sym} = ${pi(k)}` && w.at(-1) === `${sym} = ${sf3(k * Math.PI)} \\text{ (3 s.f.)}`, 'the working ends on the total, then 3 s.f.');
  return w.slice(0, exact ? -1 : -2);
}

const common = (q, topic, band) => {
  must(q.metadata?.topic === topic && q.metadata.difficulty === band, 'metadata');
  must(q.questionMath === undefined && q.questionText === undefined, 'everything on the figure');
  must(q.visualization?.type === 'compound-solid' && q.visualization.big === true && q.visualization.unknown === null, 'a compound solid, no edge unknown');
  must(typeof q.workingOut === 'string' && !q.workingOut.includes('\\n'), 'real newlines');
};

/* ------------------------------------------------------------------ volume */

export function checkCompoundVolume(q, band) {
  common(q, 'compound-volume', band);
  const f = q.visualization;
  const { values: v, unit } = readLabels(f);
  must(q.answerUnits === `\\text{${unit}}^3`, 'cubic units');
  const tube = f.shape === 'tube';
  const exact = form(q, tube ? 'Find the volume of the hollow cylinder' : 'Find the volume of the solid');
  let parts, op = ' + ', lead = [];

  if (band === 'foundation') {
    must(f.shape === 'cylinder-cylinder', 'a cylinder on a cylinder');
    must(Object.keys(v).sort().join() === 'h,h2,r,r2' && v.r2 < v.r, 'both radii and heights, the top narrower');
    parts = [
      { name: 'large cylinder', tex: `\\pi \\times ${v.r}^2 \\times ${v.h}`, k: v.r * v.r * v.h },
      { name: 'small cylinder', tex: `\\pi \\times ${v.r2}^2 \\times ${v.h2}`, k: v.r2 * v.r2 * v.h2 },
    ];
  } else if (band === 'core') {
    must(['cylinder-cone', 'cylinder-hemisphere', 'cone-hemisphere'].includes(f.shape), 'two different solids');
    const want = { 'cylinder-cone': 'coneH,h,r', 'cylinder-hemisphere': 'h,r', 'cone-hemisphere': 'coneH,r' }[f.shape];
    must(Object.keys(v).sort().join() === want, `labels ${want}`);
    parts = [];
    if (v.h) parts.push({ name: 'cylinder', tex: `\\pi \\times ${v.r}^2 \\times ${v.h}`, k: v.r * v.r * v.h });
    if (v.coneH) parts.push({ name: 'cone', tex: `\\frac{1}{3} \\times \\pi \\times ${v.r}^2 \\times ${v.coneH}`, k: (v.r * v.r * v.coneH) / 3 });
    if (f.shape !== 'cylinder-cone') parts.push({ name: 'hemisphere', tex: `\\frac{2}{3} \\times \\pi \\times ${v.r}^3`, k: (2 * v.r ** 3) / 3 });
    parts.forEach((p) => must(Number.isInteger(p.k), `each part a whole multiple of π: ${p.name}`));
  } else {
    must(tube, 'a hollow cylinder');
    let R, r;
    if (v.diameter !== undefined) {
      must(Object.keys(v).sort().join() === 'diameter,h,thickness', 'the outer diameter, the wall and the height');
      must(v.diameter % 2 === 0, 'an even diameter');
      R = v.diameter / 2;
      r = R - v.thickness;
      lead = [`R = ${v.diameter} \\div 2 = ${R}, \\ r = ${R} - ${v.thickness} = ${r}`];
    } else {
      must(Object.keys(v).sort().join() === 'h,inner,r', 'both radii and the height');
      [R, r] = [v.r, v.inner];
    }
    must(r >= 2 && r < R, 'a hole inside the cylinder');
    parts = [
      { name: 'outer cylinder', tex: `\\pi \\times ${R}^2 \\times ${v.h}`, k: R * R * v.h },
      { name: 'hole', tex: `\\pi \\times ${r}^2 \\times ${v.h}`, k: r * r * v.h },
    ];
    op = ' - ';
  }

  const k = op === ' + ' ? parts.reduce((a, p) => a + p.k, 0) : parts[0].k - parts[1].k;
  const w = finish(q, k, 'V', exact);
  must(w.join('|') === [
    ...lead,
    `V = ${parts.map((p) => `\\text{${p.name}}`).join(op)}`,
    `V = ${parts.map((p) => p.tex).join(op)}`,
    `V = ${parts.map((p) => pi(p.k)).join(op)}`,
  ].join('|'), 'working: the parts, substituted, then each as a multiple of π');
  return { kind: band === 'stretch' ? (lead.length ? 'tube from the wall' : 'tube from radii') : f.shape };
}

/* ------------------------------------------------------------ surface area */

export function checkCompoundSurfaceArea(q, band) {
  common(q, 'compound-surface-area', band);
  const f = q.visualization;
  const { values: v, unit } = readLabels(f);
  must(q.answerUnits === `\\text{${unit}}^2`, 'square units');
  const exact = form(q, 'Find the total surface area of the solid');
  let parts, lead = [];
  const side = { name: 'curved side', tex: `2 \\times \\pi \\times ${v.r} \\times ${v.h}`, k: 2 * v.r * v.h };
  const base = { name: 'base', tex: `\\pi \\times ${v.r}^2`, k: v.r * v.r };

  if (band === 'core') {
    must(f.shape === 'cylinder-hemisphere' && Object.keys(v).sort().join() === 'h,r', 'a hemisphere on a cylinder');
    parts = [{ name: 'hemisphere', tex: `2 \\times \\pi \\times ${v.r}^2`, k: 2 * v.r * v.r }, side, base];
  } else {
    must(f.shape === 'cylinder-cone', 'a cone on a cylinder');
    let l;
    if (band === 'foundation') {
      must(Object.keys(v).sort().join() === 'h,r,slant', 'the slant height given');
      l = v.slant;
      must(l > v.r, 'a slant longer than the radius');
    } else {
      must(Object.keys(v).sort().join() === 'coneH,h,r', 'the perpendicular height given');
      l = Math.sqrt(v.r ** 2 + v.coneH ** 2);
      must(Number.isInteger(l), 'a whole slant height');
      lead = [`l^2 = ${v.r}^2 + ${v.coneH}^2 = ${l * l}, \\ l = ${l}`];
    }
    parts = [{ name: 'cone', tex: `\\pi \\times ${v.r} \\times ${l}`, k: v.r * l }, side, base];
  }
  const k = parts.reduce((a, p) => a + p.k, 0);
  const w = finish(q, k, 'A', exact);
  must(w.join('|') === [
    ...lead,
    `A = ${parts.map((p) => `\\text{${p.name}}`).join(' + ')}`,
    `A = ${parts.map((p) => p.tex).join(' + ')}`,
    `A = ${parts.map((p) => pi(p.k)).join(' + ')}`,
  ].join('|'), 'working: the parts, substituted, then each as a multiple of π');
  return { kind: exact ? 'exact' : '3 s.f.' };
}
