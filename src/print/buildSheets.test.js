// The printout's layout rules, checked with a stub generator so every
// question is known: which skill and band lands where, how versions fill the
// halves of a page, and how a long sheet runs on to further pages.
//
// Whether the questions physically fit their cells is measured in a browser,
// not here: see src/dev/PrintTestPage.jsx.
//
// Run: npx vitest run src/print/buildSheets.test.js

import { describe, expect, it, vi } from 'vitest';
import { buildSheets, PER_PAGE, PRESETS } from './buildSheets';

const BOXES = [
  { skillId: 'index-laws', band: 'foundation' },
  { skillId: 'volume-cuboid', band: 'core' },
  { skillId: 'pythagoras-hypotenuse', band: 'core' },
  { skillId: 'tree-diagrams', band: 'stretch' },
];

// Every call returns a new question, numbered, so repeats can be counted.
const counter = () => {
  let n = 0;
  const calls = [];
  const gen = (skillId, band) => {
    calls.push([skillId, band]);
    n += 1;
    return { instruction: `${skillId} ${band} #${n}`, answer: String(n) };
  };
  return { gen, calls };
};

const letters = (pages) => pages.flatMap((p) => (p.halves ? p.halves.map((h) => h.letter) : [p.sheet.letter]));

describe('buildSheets', () => {
  it('prints each box once, in box order, at that box\'s own band', () => {
    const { gen } = counter();
    const [page] = buildSheets(BOXES, { layout: 'half', perBox: 1, versions: 1 }, gen);
    const qs = page.halves[0].questions;
    expect(qs.map((q) => [q.skillId, q.band])).toEqual(BOXES.map((b) => [b.skillId, b.band]));
  });

  it('half page, one version: the same sheet twice, unlettered', () => {
    const { gen } = counter();
    const pages = buildSheets(BOXES, { layout: 'half', perBox: 1, versions: 1 }, gen);
    expect(pages).toHaveLength(1);
    expect(pages[0].halves[0]).toBe(pages[0].halves[1]);
    expect(letters(pages)).toEqual(['', '']);
  });

  it('half page, several versions: each half a different version, an odd count finishing on A', () => {
    const { gen } = counter();
    expect(letters(buildSheets(BOXES, { layout: 'half', perBox: 1, versions: 2 }, gen))).toEqual(['A', 'B']);
    expect(letters(buildSheets(BOXES, { layout: 'half', perBox: 1, versions: 3 }, gen))).toEqual(['A', 'B', 'C', 'A']);
    expect(letters(buildSheets(BOXES, { layout: 'half', perBox: 1, versions: 5 }, gen))).toEqual(['A', 'B', 'C', 'D', 'E', 'A']);
  });

  it('versions differ in their numbers but not in their skills', () => {
    const { gen } = counter();
    const [page] = buildSheets(BOXES, { layout: 'half', perBox: 1, versions: 2 }, gen);
    const [a, b] = page.halves.map((h) => h.questions);
    expect(a.map((q) => q.skillId)).toEqual(b.map((q) => q.skillId));
    a.forEach((q, i) => expect(q.view.instr).not.toBe(b[i].view.instr));
  });

  it('half page always prints one question per box, whatever perBox says', () => {
    const { gen } = counter();
    const [page] = buildSheets(BOXES, { layout: 'half', perBox: 3, versions: 1 }, gen);
    expect(page.halves[0].questions).toHaveLength(4);
  });

  it('full page: perBox questions per box, running on to further pages', () => {
    const { gen } = counter();
    const pages = buildSheets(BOXES, { layout: 'full', perBox: 3, versions: 1 }, gen);
    expect(pages).toHaveLength(Math.ceil(12 / PER_PAGE));
    expect(pages.map((p) => [p.sheet.part, p.sheet.parts, p.sheet.first, p.sheet.questions.length]))
      .toEqual([[1, 2, 0, 8], [2, 2, 8, 4]]);
    // Box order is kept across the page break: three of box 1, then box 2...
    const all = pages.flatMap((p) => p.sheet.questions.map((q) => q.skillId));
    expect(all).toEqual(BOXES.flatMap((b) => [b.skillId, b.skillId, b.skillId]));
  });

  it('full page, several versions: each version its own run of pages', () => {
    const { gen } = counter();
    const pages = buildSheets(BOXES, { layout: 'full', perBox: 3, versions: 2 }, gen);
    expect(letters(pages)).toEqual(['A', 'A', 'B', 'B']);
  });

  it('clamps the version count to 1-5', () => {
    const { gen } = counter();
    expect(letters(buildSheets(BOXES, { layout: 'full', perBox: 1, versions: 0 }, gen))).toEqual(['']);
    expect(letters(buildSheets(BOXES, { layout: 'full', perBox: 1, versions: 9 }, gen))).toEqual(['A', 'B', 'C', 'D', 'E']);
  });

  it('skips a box with no skill, or a skill that generates nothing', () => {
    const { gen } = counter();
    const boxes = [BOXES[0], { skillId: undefined, band: 'core' }, BOXES[1]];
    const nullGen = (id, band) => (id === 'volume-cuboid' ? null : gen(id, band));
    const [page] = buildSheets(boxes, { layout: 'half', perBox: 1, versions: 1 }, nullGen);
    expect(page.halves[0].questions.map((q) => q.skillId)).toEqual(['index-laws']);
  });

  it('leaves out a skill whose generator throws, and prints the rest', () => {
    const log = vi.spyOn(console, 'error').mockImplementation(() => {});
    const { gen } = counter();
    const throwing = (id, band) => { if (id === 'volume-cuboid') throw new Error('broken'); return gen(id, band); };
    const [page] = buildSheets(BOXES, { layout: 'half', perBox: 1, versions: 1 }, throwing);
    expect(page.halves[0].questions.map((q) => q.skillId)).toEqual(['index-laws', 'pythagoras-hypotenuse', 'tree-diagrams']);
    expect(log).toHaveBeenCalled();
    log.mockRestore();
  });

  it('redraws a repeat within a version, and gives up rather than looping', () => {
    // Two possible questions only: three per box must repeat one, once.
    let flip = 0;
    const two = (skillId) => ({ instruction: `${skillId} ${(flip += 1) % 2}`, answer: '1' });
    const pages = buildSheets([BOXES[0]], { layout: 'full', perBox: 2, versions: 1 }, two);
    const instr = pages[0].sheet.questions.map((q) => q.view.instr);
    expect(new Set(instr).size).toBe(2);
    const same = () => ({ instruction: 'always the same', answer: '1' });
    const stuck = buildSheets([BOXES[0]], { layout: 'full', perBox: 3, versions: 1 }, same);
    expect(stuck[0].sheet.questions).toHaveLength(3);
  });

  it('presets: exit ticket on half pages, practice and homework on full', () => {
    expect(PRESETS.exit).toMatchObject({ layout: 'half', perBox: 1 });
    expect(PRESETS.practice).toMatchObject({ layout: 'full', perBox: 2 });
    expect(PRESETS.homework).toMatchObject({ layout: 'full', perBox: 3, date: true });
  });

  it('works with the real generators', () => {
    const pages = buildSheets(BOXES, { layout: 'full', perBox: 2, versions: 2 });
    pages.forEach((p) => p.sheet.questions.forEach((q) => {
      expect(q.view.instr).toBeTruthy();
      expect(q.view.a).toBeTruthy();
    }));
  });

  describe('fromBoard', () => {
    const boardView = (i) => ({ instr: `board ${i}`, q: '', a: String(i) });
    const WITH_VIEWS = BOXES.map((b, i) => ({ ...b, view: boardView(i) }));

    it('opens version A with the board\'s own questions', () => {
      const { gen } = counter();
      const [page] = buildSheets(WITH_VIEWS, { layout: 'half', perBox: 1, versions: 1, fromBoard: true }, gen);
      expect(page.halves[0].questions.map((q) => q.view.instr)).toEqual(['board 0', 'board 1', 'board 2', 'board 3']);
    });

    it('draws versions B onwards fresh', () => {
      const { gen } = counter();
      const pages = buildSheets(WITH_VIEWS, { layout: 'half', perBox: 1, versions: 2, fromBoard: true }, gen);
      const b = pages[0].halves[1];
      expect(b.letter).toBe('B');
      expect(b.questions.every((q) => !q.view.instr.startsWith('board'))).toBe(true);
    });

    it('keeps the board question first and draws the rest of each box fresh', () => {
      const { gen } = counter();
      const [page] = buildSheets(WITH_VIEWS, { layout: 'full', ...PRESETS.practice, versions: 1, fromBoard: true }, gen);
      const instrs = page.sheet.questions.map((q) => q.view.instr);
      expect(instrs.filter((t, i) => i % 2 === 0)).toEqual(['board 0', 'board 1', 'board 2', 'board 3']);
      expect(instrs.filter((t, i) => i % 2 === 1).some((t) => t.startsWith('board'))).toBe(false);
    });

    it('ignores the board when fromBoard is off ("New numbers")', () => {
      const { gen } = counter();
      const [page] = buildSheets(WITH_VIEWS, { layout: 'half', perBox: 1, versions: 1 }, gen);
      expect(page.halves[0].questions.some((q) => q.view.instr.startsWith('board'))).toBe(false);
    });

    it('draws fresh for a box whose board question failed', () => {
      const { gen } = counter();
      const boxes = WITH_VIEWS.map((b, i) => (i === 1 ? { ...b, view: { ...b.view, failed: true } } : b));
      const [page] = buildSheets(boxes, { layout: 'half', perBox: 1, versions: 1, fromBoard: true }, gen);
      expect(page.halves[0].questions[1].view.instr).toMatch(/^volume-cuboid core/);
    });
  });
});
