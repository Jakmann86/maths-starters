import { describe, expect, it } from 'vitest';
import { skillIds, generateForSkill, skills, nearestBand } from './skills';

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