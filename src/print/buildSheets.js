// src/print/buildSheets.js
//
// Turns the board's four boxes into printable sheets. No React here, so the
// layout rules can be tested without a browser.
//
// The board decides WHAT is printed: each box's skill at that box's own band
// (so Mixed carries over as Foundation, Core, Core, Stretch). The sheet type
// decides HOW MANY: one question per box for an exit ticket, more for
// practice and homework. Every version is generated fresh, so version B
// has the same skills in the same order as A, with different numbers.
//
// Two layouts:
//   half  two sheets on one A4, top and bottom, to be cut apart. Four
//         questions, one per box, in a 2 x 2 grid.
//   full  one sheet per A4 page, two columns, up to PER_PAGE questions on a
//         page; more run on to the next page.

import { generateForSkill } from '../curriculum/skills.js';
import { questionView } from '../lib/questionView.js';

export const PER_PAGE = 8;
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

function questionsFor(boxes, perBox, gen) {
  const out = [];
  // A box with no skill (an empty pool, a stale topic name) prints nothing,
  // rather than a numbered blank.
  boxes.filter((b) => b.skillId && gen(b.skillId, b.band)).forEach(({ skillId, band }) => {
    const seen = new Set();
    for (let k = 0; k < perBox; k += 1) {
      let q = gen(skillId, band);
      for (let t = 0; t < REDRAWS && q && seen.has(key(q)); t += 1) q = gen(skillId, band);
      if (q) seen.add(key(q));
      out.push({ skillId, band, view: questionView(q, skillId) });
    }
  });
  return out;
}

const key = (q) => JSON.stringify([q.instruction, q.questionMath, q.questionText, q.visualization]);

/**
 * versions: how many different versions (1-5). With one version, the half
 * layout prints the same sheet twice (A A); with more, every half is a
 * different version, in order, and an odd count finishes on version A again
 * so the last page is not half blank.
 *
 * Returns pages: [{ halves: [sheet, sheet] }] for half, [{ sheet }] for full,
 * where a sheet is { letter, questions, part, parts }.
 */
export function buildSheets(boxes, options, gen = generateForSkill) {
  const { layout, perBox, versions } = options;
  const n = Math.max(1, Math.min(MAX_VERSIONS, versions));
  const sheets = Array.from({ length: n }, (_v, i) => ({
    letter: n > 1 ? LETTERS[i] : '',
    questions: questionsFor(boxes, layout === 'half' ? 1 : perBox, gen),
  }));

  if (layout === 'half') {
    const halves = n === 1 ? [sheets[0], sheets[0]] : [...sheets, ...(n % 2 ? [sheets[0]] : [])];
    const pages = [];
    for (let i = 0; i < halves.length; i += 2) pages.push({ halves: [halves[i], halves[i + 1]] });
    return pages;
  }

  // Full: each version gets its own run of pages, PER_PAGE questions each.
  const pages = [];
  sheets.forEach((sheet) => {
    const parts = Math.ceil(sheet.questions.length / PER_PAGE);
    for (let p = 0; p < parts; p += 1) {
      pages.push({
        sheet: {
          ...sheet,
          questions: sheet.questions.slice(p * PER_PAGE, (p + 1) * PER_PAGE),
          first: p * PER_PAGE,
          part: p + 1,
          parts,
        },
      });
    }
  });
  return pages;
}
