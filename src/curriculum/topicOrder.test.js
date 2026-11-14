// The topic panel's order within each strand follows the textbook. A topic
// sits at its home chapter: the Haese chapter (haese-igcse.json) that holds
// most of its skills, the earlier one on a tie. Topics sharing a home
// chapter run by the first section that uses one of their skills. A topic
// with no section of its own — assumed knowledge, such as order of
// operations — comes first in its strand.
//
// The home chapter, not simply the first mention, because a book reuses a
// topic early: Haese 8D puts chords and tangents into a Pythagoras chapter,
// but Circle theorems is chapter 27.
//
// Run: npx vitest run src/curriculum/topicOrder.test.js

import { describe, expect, it } from 'vitest';
import { STRANDS, skillsInTopic, topicGroups } from './skills';
import scheme from './schemes/haese-igcse.json';

/** Topic -> [home chapter, first section index], or [-1, -1] with none. */
const placeOf = (() => {
  const at = {};
  scheme.entries.forEach((e, i) => (e.skills ?? []).forEach((id) => { if (at[id] === undefined) at[id] = i; }));
  return (topic) => {
    const idx = skillsInTopic(topic).map((id) => at[id]).filter((v) => v !== undefined);
    if (!idx.length) return [-1, -1];
    const counts = countBy(idx.map((i) => scheme.entries[i].ch));
    const home = Math.min(...Object.keys(counts).filter((c) => counts[c] === Math.max(...Object.values(counts))).map(Number));
    return [home, Math.min(...idx)];
  };
})();
function countBy(xs) { const c = {}; xs.forEach((x) => { c[x] = (c[x] ?? 0) + 1; }); return c; }

describe('topic panel order', () => {
  it('runs in textbook order within each strand, assumed knowledge first', () => {
    STRANDS.forEach(({ name, topics }) => {
      const at = topics.map(placeOf);
      const sorted = [...at].sort((a, b) => a[0] - b[0] || a[1] - b[1]);
      expect(at, `${name}: ${topics.map((t, i) => `${t} ch ${at[i][0]}`).join(', ')}`).toEqual(sorted);
    });
  });

  it('lists every catalogue topic in a strand', () => {
    expect(topicGroups().map((g) => g.name)).not.toContain('Other');
  });
});
