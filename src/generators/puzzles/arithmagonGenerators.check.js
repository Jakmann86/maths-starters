// The checker for arithmagons and number walls, shared by the harness
// (arithmagonGenerators.test.js) and its mutation test. Test support only.
// Nothing is imported from the generator.
//
// An arithmagon's circles are solved from its three boxes, as drawn: box 0
// sits between circles a and b, box 1 between b and c, box 2 between c and
// a. A number wall is rebuilt from its bottom row, with x carried through as
// an unknown, and x solved from the top brick.

import { compiles } from '../number/latexArithmetic.check';

const fail = (msg, q) => { throw new Error(`${msg}\n${JSON.stringify(q)}`); };
const must = (cond, msg, q) => { if (!cond) fail(msg, q); };
const int = (s, q) => { must(/^-?\d+$/.test(s ?? ''), `a whole number: ${s}`, q); return Number(s); };

function common(q, topic, band, type) {
  must(q.metadata?.topic === topic && q.metadata?.difficulty === band, 'metadata', q);
  must(q.questionMath === undefined && q.answerUnits === undefined, 'everything is on the figure', q);
  must(typeof q.workingOut === 'string' && !q.workingOut.includes('\\n'), 'working uses real newlines', q);
  [q.answer, q.workingOut].forEach((s) => compiles(s));
  must(q.visualization?.type === type, `a ${type} figure`, q);
  return q.visualization;
}

/* ---------------------------------------------------------- arithmagon */

function arithmagon(q, band) {
  const f = common(q, 'arithmagon', band, 'arithmagon');
  must(JSON.stringify(f.vertices) === '["a","b","c"]', 'circles a, b, c', q);
  const [ab, bc, ca] = f.edges.map((e) => int(e, q));
  [ab, bc, ca].forEach((e) => must(e > 0, 'every box is positive', q));
  let a, b, c, lines;
  if (band === 'stretch') {
    must(f.op === '×' && q.instruction === 'Each box is the product of the two circles beside it. Find a, b and c', 'a product arithmagon', q);
    const sq = (ab * ca) / bc;
    a = Math.sqrt(sq);
    must(Number.isInteger(a), `ab × ca ÷ bc = ${sq} is a square`, q);
    [b, c] = [ab / a, ca / a];
    must(Number.isInteger(b) && Number.isInteger(c) && b * c === bc, 'whole-number circles that fit every box', q);
    must([a, b, c].every((v) => v >= 2) && !(a === b && b === c), 'circles of 2 or more, not all equal', q);
    lines = [
      'ab \\times ca \\div bc = a^2',
      `${ab} \\times ${ca} \\div ${bc} = ${sq}`,
      `a = ${a},\\ \\text{then } b = ${ab} \\div ${a} = ${b},\\ c = ${ca} \\div ${a} = ${c}`,
    ];
  } else {
    must(f.op === '+' && q.instruction === 'Each box is the sum of the two circles beside it. Find a, b and c', 'a sum arithmagon', q);
    const total = ab + bc + ca;
    must(total % 2 === 0, 'the boxes add to twice the circles', q);
    const s = total / 2;
    [a, b, c] = [s - bc, s - ca, s - ab];
    must(a + b === ab && b + c === bc && c + a === ca, 'the circles fit every box', q);
    const negatives = [a, b, c].filter((v) => v < 0).length;
    if (band === 'foundation') must(negatives === 0 && [a, b, c].every((v) => v >= 1 && v <= 20), 'Foundation circles are 1 to 20', q);
    else must(negatives === 1, 'Core has exactly one negative circle', q);
    lines = [
      `ab + bc + ca = ${total} = 2(a + b + c)`,
      `a + b + c = ${s}`,
      `a = ${s} - ${bc} = ${a},\\ b = ${b},\\ c = ${c}`,
    ];
  }
  must(q.answer === `a = ${a},\\ b = ${b},\\ c = ${c}`, `answer ${q.answer}, expected a = ${a}, b = ${b}, c = ${c}`, q);
  must(q.workingOut === lines.join('\n'), `working:\n${q.workingOut}\nexpected:\n${lines.join('\n')}`, q);
  return { kind: band === 'core' ? `negative ${['a', 'b', 'c'][[a, b, c].findIndex((v) => v < 0)]}` : band };
}

/* --------------------------------------------------------- number wall */

// Each brick is { k, m }: k·x + m.
const add = (p, r) => ({ k: p.k + r.k, m: p.m + r.m });

function numberWall(q, band) {
  const f = common(q, 'number-wall', band, 'number-wall');
  const { rows } = f;
  const width = band === 'stretch' ? 4 : 3;
  must(Array.isArray(rows) && rows.length === width && rows.every((r, i) => r.length === width - i), `a wall ${width} wide`, q);
  const xs = rows.flatMap((r, i) => r.map((cell, j) => (cell === 'x' ? [i, j] : null)).filter(Boolean));
  must(xs.length === 1 && JSON.stringify(f.unknown) === JSON.stringify(xs), 'one brick x, coloured', q);
  const [[xr, xc]] = xs;
  // Only the bottom row and the top brick are ever filled in.
  rows.forEach((r, i) => r.forEach((cell, j) => {
    if (i > 0 && i < width - 1) must(cell === '', 'the middle rows are blank', q);
    if (i === 0 && !(i === xr && j === xc)) must(/^\d+$/.test(cell), 'the bottom row is given', q);
  }));
  let wall = [rows[0].map((cell) => (cell === 'x' ? { k: 1, m: 0 } : { k: 0, m: Number(cell) }))];
  while (wall[wall.length - 1].length > 1) {
    const prev = wall[wall.length - 1];
    wall.push(prev.slice(1).map((v, i) => add(prev[i], v)));
  }
  const top = wall[width - 1][0];
  const bottom = rows[0];

  if (band === 'foundation') {
    must(xr === width - 1 && xc === 0, 'Foundation finds the top brick', q);
    must(q.instruction === 'Each brick is the sum of the two below it. Find the top brick', 'instruction', q);
    must(bottom.every((cell) => Number(cell) >= 1 && Number(cell) <= 20), 'bricks 1 to 20', q);
    const mid = wall[1].map((v) => v.m);
    must(q.answer === `x = ${top.m}`, `answer ${q.answer}, expected x = ${top.m}`, q);
    const lines = [`${bottom[0]} + ${bottom[1]} = ${mid[0]},\\ ${bottom[1]} + ${bottom[2]} = ${mid[1]}`, `${mid[0]} + ${mid[1]} = ${top.m}`];
    must(q.workingOut === lines.join('\n'), `working:\n${q.workingOut}`, q);
    return { kind: 'top' };
  }

  must(q.instruction === 'Each brick is the sum of the two below it. Find x', 'instruction', q);
  must(xr === 0, 'x is in the bottom row', q);
  if (band === 'stretch') must(xc === 1 || xc === 2, 'Stretch hides an inner brick', q);
  const T = int(rows[width - 1][0], q);
  must(top.k > 0 && (T - top.m) % top.k === 0, 'x comes out whole', q);
  const x = (T - top.m) / top.k;
  must(x >= 1, `x is a positive brick (${x})`, q);
  must(q.answer === `x = ${x}`, `answer ${q.answer}, expected x = ${x}`, q);
  const formula = width === 3 ? 'a + 2b + c' : 'a + 3b + 3c + d';
  const lines = [`\\text{top} = ${formula} = ${T}`, `${top.k === 1 ? '' : top.k}x + ${top.m} = ${T}`, `x = ${x}`];
  must(q.workingOut === lines.join('\n'), `working:\n${q.workingOut}\nexpected:\n${lines.join('\n')}`, q);
  return { kind: `x at ${xc}` };
}

export function checkArithmagon(q, band) {
  if (q.metadata?.topic === 'arithmagon') return arithmagon(q, band);
  if (q.metadata?.topic === 'number-wall') return numberWall(q, band);
  return fail(`topic ${q.metadata?.topic}`, q);
}
