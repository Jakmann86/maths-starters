import { describe, expect, it } from 'vitest';
import { skillIds, generateForSkill, skills, nearestBand, topics, skillsInTopic, nextSkillInTopic } from './skills';

describe('skill catalogue', () => {
  it('resolves every declared skill at every declared band', () => {
    skillIds.forEach((id) => {
      skills[id].difficulties.forEach((band) => {
        const q = generateForSkill(id, band);
        expect(q, `${id} at ${band}`).not.toBeNull();
        expect(q.instruction).toBeTruthy();
        expect(q.answer).toBeTruthy();
        expect(q.questionMath || q.questionText).toBeTruthy();
        expect(q.metadata.topic).toBe(id);
      });
    });
  });

  it('serves something for any band on any skill', () => {
    skillIds.forEach((id) => {
      ['foundation', 'core', 'stretch'].forEach((band) => {
        expect(nearestBand(id, band), `${id} at ${band}`).not.toBeNull();
        expect(generateForSkill(id, band)).not.toBeNull();
      });
    });
  });

  it('returns null rather than throwing for an unknown id', () => {
    expect(generateForSkill('not-a-skill', 'core')).toBeNull();
  });

  it('never returns JSX from a generator', () => {
    skillIds.forEach((id) => {
      const q = generateForSkill(id, 'core');
      expect(q.$$typeof).toBeUndefined();
      if (q.visualization) expect(q.visualization.$$typeof).toBeUndefined();
    });
  });
});

describe('topic grouping', () => {
  it('cycles through a multi-skill topic and wraps back to the first', () => {
    const ids = skillsInTopic('Equations');
    expect(ids.length).toBeGreaterThan(1);

    let current = null;
    ids.forEach((expected) => {
      current = nextSkillInTopic('Equations', current);
      expect(current).toBe(expected);
    });
    // one more step wraps back to the first
    expect(nextSkillInTopic('Equations', current)).toBe(ids[0]);
  });

  // A single-skill topic makes ↻ a no-op — that was the Indices topic's
  // defect before indices-zero-negative joined index-laws there. Assert the
  // property directly rather than hunting for an example: every topic must
  // hold at least two skills, so this can't silently reappear.
  it('never leaves a topic with only one skill', () => {
    topics().forEach((t) => {
      expect(skillsInTopic(t).length, t).toBeGreaterThan(1);
    });
  });

  it('returns the first skill for a null or unknown currentSkillId', () => {
    const ids = skillsInTopic('Pythagoras');
    expect(nextSkillInTopic('Pythagoras', null)).toBe(ids[0]);
    expect(nextSkillInTopic('Pythagoras', undefined)).toBe(ids[0]);
    expect(nextSkillInTopic('Pythagoras', 'not-a-skill')).toBe(ids[0]);
  });
});