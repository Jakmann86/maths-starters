// src/print/buildSheets.js
//
// Turns the board's four boxes into printable sheets. No React here, so the
// layout rules can be tested without a browser.
//
// The board decides WHAT is printed: each box's skill at that box's own band
// (so Mixed carries over as Foundation, Core, Core, Stretch), and version A
// opens with the board's own four questions. The sheet type decides HOW
// MANY: one question per box for an exit ticket, more for practice and
// homework. Everything beyond the board's four is generated fresh, so
// version B has the same skills in the same order as A, with different
// numbers.
//
// Two layouts:
//   half  two sheets on one A4, top and bottom, to be cut apart. Four
//         questions, one per box, in a 2 x 2 grid.
//   full  one sheet per A4 page, two columns, up to PER_PAGE cells on a
//         page, a question with a grid or graph taking two (TALL_FIGURES);
//         more run on to the next page.

import { generateForSkill } from '../curriculum/skills.js';
import { safeGenerate } from '../lib/safeGenerate.js';
import { questionView } from '../lib/questionView.js';

export const PER_PAGE = 8;
// A full page is two columns of ROWS rows.
export const ROWS = PER_PAGE / 2;

// Figures that are read off, and so want room on paper: grids, graphs and
// bearings. On a full page each takes a tall cell, two rows high, so the
// grid can be big enough to count squares and read points from. A half
// page (an exit ticket) keeps its four equal cells.
export const TALL_FIGURES = new Set([
  'coordinate-grid', 'transform-grid', 'vector-grid', 'scatter', 'travel-graph', 'bearings',
]);
export const isTall = (view) => Boolean(view?.fig && TALL_FIGURES.has(view.fig.type));

/**
 * Lays questions on full pages the way the browser's grid will place them:
 * two columns, row by row, a tall question taking two rows of its column,
 * and nothing placed behind one already placed (CSS grid's default, sparse
 * auto-placement). A question that will not fit starts a new page. Returns
 * [{ questions, rows }], rows being how many the page uses (at least two).
 */
export function layFull(questions) {
  const pages = [];
  let grid = [], cursor = 0, page = [];
  const free = (r, c) => !grid[r]?.[c];
  const take = (r, c) => { (grid[r] ||= [])[c] = true; };
  const flush = () => {
    if (page.length) pages.push({ questions: page, rows: Math.max(2, grid.length) });
    grid = []; cursor = 0; page = [];
  };
  questions.forEach((q) => {
    const h = q.tall ? 2 : 1;
    for (;;) {
      let at = -1;
      for (let p = cursor; p < ROWS * 2; p += 1) {
        const r = Math.floor(p / 2), c = p % 2;
        if (r + h > ROWS) break;
        if (free(r, c) && (h === 1 || free(r + 1, c))) { at = p; break; }
      }
      if (at >= 0) {
        const r = Math.floor(at / 2), c = at % 2;
        take(r, c);
        if (h === 2) take(r + 1, c);
        cursor = at + 1;
        page.push(q);
        break;
      }
      flush();
    }
  });
  flush();
  return pages;
}
export const MAX_VERSIONS = 5;
export const LETTERS = ['A', 'B', 'C', 'D', 'E'];

export const PRESETS = {
  exit: { title: 'Exit ticket', layout: 'half', perBox: 1, date: false },
  practice: { title: 'Practice', layout: 'full', perBox: 2, date: false },
  homework: { title: 'Homework', layout: 'full', perBox: 3, date: true },
};

// The same skill twice in one version should not print the same question:
// a few redraws, then accept a repeat rather than loop (a skill with a small
// ceiling, like a cube's one parameter, can genuinely run out).
const REDRAWS = 6;

function questionsFor(boxes, perBox, rawGen, fromBoard) {
  // A generator that throws prints nothing for that question rather than
  // stopping the whole sheet (safeGenerate.js).
  const gen = (id, band) => safeGenerate(id, band, rawGen);
  const fresh = (skillId, band) => {
    const q = gen(skillId, band);
    return q ? questionView(q, skillId) : null;
  };
  const out = [];
  // A box with no skill (an empty pool, a stale topic name) prints nothing,
  // rather than a numbered blank.
  boxes.filter((b) => b.skillId && (usable(b.view) || gen(b.skillId, b.band))).forEach(({ skillId, band, view }) => {
    const seen = new Set();
    for (let k = 0; k < perBox; k += 1) {
      // The first question from each box is the one on the board, so what
      // the teacher set up is what prints; the rest are fresh.
      let v = fromBoard && k === 0 && usable(view) ? view : fresh(skillId, band);
      for (let t = 0; t < REDRAWS && v && seen.has(key(v)); t += 1) v = fresh(skillId, band);
      if (!v) continue;
      seen.add(key(v));
      out.push({ skillId, band, view: v });
    }
  });
  return out;
}

// A box whose generator failed shows a message, not a question: print a
// fresh draw instead.
const usable = (view) => Boolean(view && !view.failed);

const key = (v) => JSON.stringify([v.instr, v.q, v.parts, v.fig]);

/**
 * versions: how many different versions (1-5). With one version, the half
 * layout prints the same sheet twice (A A); with more, every half is a
 * different version, in order, and an odd count finishes on version A again
 * so the last page is not half blank.
 *
 * fromBoard: version A starts each box with the question the box carries
 * (`view`, as the board shows it). Versions B onwards, the extra questions
 * per box, and every question after "New numbers" are generated fresh.
 *
 * Returns pages: [{ halves: [sheet, sheet] }] for half, [{ sheet }] for full,
 * where a sheet is { letter, questions, part, parts }.
 */
export function buildSheets(boxes, options, gen = generateForSkill) {
  const { layout, perBox, versions, fromBoard = false } = options;
  const n = Math.max(1, Math.min(MAX_VERSIONS, versions));
  const sheets = Array.from({ length: n }, (_v, i) => ({
    letter: n > 1 ? LETTERS[i] : '',
    questions: questionsFor(boxes, layout === 'half' ? 1 : perBox, gen, fromBoard && i === 0),
  }));

  if (layout === 'half') {
    const halves = n === 1 ? [sheets[0], sheets[0]] : [...sheets, ...(n % 2 ? [sheets[0]] : [])];
    const pages = [];
    for (let i = 0; i < halves.length; i += 2) pages.push({ halves: [halves[i], halves[i + 1]] });
    return pages;
  }

  // Full: each version gets its own run of pages, up to PER_PAGE cells
  // each, a tall question taking two.
  const pages = [];
  sheets.forEach((sheet) => {
    const laid = layFull(sheet.questions.map((q) => ({ ...q, tall: isTall(q.view) })));
    let first = 0;
    laid.forEach(({ questions, rows }, p) => {
      pages.push({ sheet: { ...sheet, questions, rows, first, part: p + 1, parts: laid.length } });
      first += questions.length;
    });
  });
  return pages;
}
