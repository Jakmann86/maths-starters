import { describe, expect, it } from 'vitest';
import { drawBoxTopics, togglePool, pickSwapTopic, migratePool, packStrands, columnCount, setPoolTopics } from './topicPool.js';
import { topics, topicGroups } from './skills.js';

describe('drawBoxTopics', () => {
  it('returns 4 distinct topics when the pool has at least 4', () => {
    const all = topics();
    for (let i = 0; i < 30; i += 1) {
      const result = drawBoxTopics(all, all);
      expect(result).toHaveLength(4);
      expect(new Set(result).size).toBe(4);
      result.forEach((t) => expect(all).toContain(t));
    }
  });

  it('allows repeats when the pool has fewer than 4 topics', () => {
    const all = topics();
    const small = all.slice(0, 2);
    for (let i = 0; i < 30; i += 1) {
      const result = drawBoxTopics(small, all);
      expect(result).toHaveLength(4);
      result.forEach((t) => expect(small).toContain(t));
    }
  });

  it('falls back to all topics when the pool is empty', () => {
    const all = topics();
    for (let i = 0; i < 30; i += 1) {
      const result = drawBoxTopics([], all);
      expect(result).toHaveLength(4);
      expect(new Set(result).size).toBe(4);
      result.forEach((t) => expect(all).toContain(t));
    }
  });
});

describe('pickSwapTopic', () => {
  it('prefers a topic not shown in another box when one is available', () => {
    const all = topics(); // 5 topics
    for (let i = 0; i < 30; i += 1) {
      const result = pickSwapTopic(all, all, all[0], [all[1], all[2]]);
      expect(result).not.toBe(all[0]);
      expect([all[1], all[2]]).not.toContain(result);
    }
  });

  it('never returns the box\'s own current topic when an alternative exists', () => {
    const all = topics();
    for (let i = 0; i < 30; i += 1) {
      // every other box already shows every other topic — no fresh option left,
      // but the current topic must still never come back
      const otherTopics = all.filter((t) => t !== all[0]);
      const result = pickSwapTopic(all, all, all[0], otherTopics);
      expect(result).not.toBe(all[0]);
      expect(all).toContain(result);
    }
  });

  it('falls back to the pool when repeats are unavoidable (small pool)', () => {
    const all = topics();
    const small = [all[0], all[1]];
    for (let i = 0; i < 30; i += 1) {
      const result = pickSwapTopic(small, all, all[0], [all[1], all[1], all[1]]);
      expect(result).toBe(all[1]); // the only non-current option in the pool
    }
  });

  it('is a no-op (returns the same topic) when the pool has only one topic', () => {
    const all = topics();
    const solo = [all[3]];
    expect(pickSwapTopic(solo, all, all[3], [])).toBe(all[3]);
    // even if the box's current topic isn't the pool's one topic, there's
    // nothing else to offer
    expect(pickSwapTopic(solo, all, all[0], [])).toBe(all[3]);
  });

  it('falls back to all topics when the pool is empty', () => {
    const all = topics();
    const result = pickSwapTopic([], all, all[0], []);
    expect(all).toContain(result);
    expect(result).not.toBe(all[0]);
  });
});

describe('togglePool', () => {
  it('adds a topic not yet in the pool', () => {
    expect(togglePool(['Equations'], 'Pythagoras')).toEqual(['Equations', 'Pythagoras']);
  });

  it('removes a topic already in the pool', () => {
    expect(togglePool(['Equations', 'Pythagoras'], 'Equations')).toEqual(['Pythagoras']);
  });

  it('does not mutate the input array', () => {
    const pool = ['Equations'];
    const copy = [...pool];
    togglePool(pool, 'Pythagoras');
    expect(pool).toEqual(copy);
  });
});

describe('migratePool', () => {
  it('replaces a renamed topic with its successors, once each', () => {
    expect(migratePool(['Volume', 'Statistics'])).toEqual(['Volume', 'Representing data', 'Averages']);
    expect(migratePool(['Pythagoras', 'Trigonometry'])).toEqual(['Pythagoras and trigonometry']);
    expect(migratePool(['Averages', 'Statistics'])).toEqual(['Averages', 'Representing data']);
  });

  it('leaves only topics the catalogue knows', () => {
    // Guards RENAMED itself: a successor misspelt there would drop silently.
    const all = topics();
    const old = ['Statistics', 'Angles', 'Pythagoras', 'Trigonometry', 'Sequences',
      'Formulae and simultaneous equations', 'Circles', 'Problem solving'];
    migratePool(old).forEach((t) => expect(all).toContain(t));
  });
});

describe('setPoolTopics', () => {
  it('adds a whole strand without duplicates, and takes it away again', () => {
    const on = setPoolTopics(['Surds', 'Volume'], ['Surds', 'Indices'], true);
    expect(on).toEqual(['Surds', 'Volume', 'Indices']);
    expect(setPoolTopics(on, ['Surds', 'Indices'], false)).toEqual(['Volume']);
  });
});

describe('packStrands', () => {
  const groups = topicGroups();
  [5, 4, 3, 1].forEach((n) => {
    it(`lays every strand out once, unsplit, in ${n} column${n === 1 ? '' : 's'}`, () => {
      const cols = packStrands(groups, n);
      expect(cols.length).toBe(Math.min(n, groups.length));
      expect(cols.flat().map((g) => g.name).sort()).toEqual(groups.map((g) => g.name).sort());
      expect(cols.flat().flatMap((g) => g.topics).sort()).toEqual(topics().sort());
    });
  });

  it('keeps the columns close in height on a board', () => {
    const heights = packStrands(groups, 5).map((c) => c.reduce((h, g) => h + g.topics.length + 1.5, 0));
    // No column more than half as tall again as the shortest that holds two
    // strands, so the sheet reads as a block rather than one long column.
    expect(Math.max(...heights)).toBeLessThanOrEqual(1.6 * Math.min(...heights.filter((h) => h > 6)));
  });

  it('uses five columns on a board or laptop and fewer below', () => {
    expect(columnCount(1920)).toBe(5);
    expect(columnCount(1366)).toBe(5);
    expect(columnCount(1024)).toBe(4);
    expect(columnCount(800)).toBe(3);
    expect(columnCount(400)).toBe(1);
  });
});
