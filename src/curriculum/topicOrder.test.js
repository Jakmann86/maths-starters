// The topic panel's order within each strand follows the textbook: a topic
// sits by the first Haese section (haese-igcse.json) that uses one of its
// skills, and a topic with no section of its own — assumed knowledge, such
// as order of operations — comes first in its strand.
//
// Run: npx vitest run src/curriculum/topicOrder.test.js

import { describe, expect, it } from 'vitest';
import { STRANDS, getSkill, topicGroups } from './skills';
import scheme from './schemes/haese-igcse.json';

/** Topic -> the index of the first scheme section that uses one of its skills. */
const firstSection = () => {
  const first = {};
  scheme.entries.forEach((e, i) => (e.skills ?? []).forEach((id) => {
    const t = getSkill(id)?.topic;
    if (t && first[t] === undefined) first[t] = i;
  }));
  return first;
};

describe('topic panel order', () => {
  it('runs in textbook order within each strand, assumed knowledge first', () => {
    const first = firstSection();
    STRANDS.forEach(({ name, topics }) => {
      const at = topics.map((t) => first[t] ?? -1);
      const sorted = [...at].sort((a, b) => a - b);
      expect(at, `${name}: ${topics.map((t, i) => `${t} ${at[i]}`).join(', ')}`).toEqual(sorted);
    });
  });

  it('lists every catalogue topic in a strand', () => {
    expect(topicGroups().map((g) => g.name)).not.toContain('Other');
  });
});
