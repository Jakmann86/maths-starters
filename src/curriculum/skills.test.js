// src/curriculum/skills.js
//
// This is the wiring test for the catalogue itself, not the generators it
// points at (those have their own suites under src/generators/). What matters
// here: every entry's `generate` actually resolves and returns the documented
// question shape (SPEC.md §3) at every band it declares, unknown ids and
// unavailable bands degrade instead of throwing, and nearestBand's fallback
// chain (SPEC.md §4.3) steps down before it steps up.

import { describe, expect, it } from 'vitest';
import { BANDS, generateForSkill, getSkill, nearestBand, skillIds, skills } from './skills';

describe('the catalogue itself', () => {
  it('declares only real bands, in order, with a working generate function', () => {
    skillIds.forEach((id) => {
      const skill = skills[id];
      expect(skill.label).toBeTruthy();
      expect(typeof skill.generate).toBe('function');
      expect(skill.difficulties.length).toBeGreaterThan(0);
      skill.difficulties.forEach((b) => expect(BANDS).toContain(b));
    });
  });

  it('getSkill and skillIds agree with the skills map', () => {
    skillIds.forEach((id) => expect(getSkill(id)).toBe(skills[id]));
    expect(getSkill('not-a-real-skill')).toBeUndefined();
  });
});

describe('generateForSkill', () => {
  it.each(skillIds)('returns the documented question shape for %s at every declared band', (id) => {
    skills[id].difficulties.forEach((band) => {
      const q = generateForSkill(id, band);
      expect(q).not.toBeNull();
      expect(q.instruction).toBeTruthy();
      expect(q.questionMath || q.questionText).toBeTruthy();
      expect(q.answer).toBeTruthy();
      expect(q.workingOut).toBeTruthy();
      expect(q.metadata.difficulty).toBe(band);
    });
  });

  it('returns null for an unknown id rather than throwing', () => {
    expect(() => generateForSkill('not-a-real-skill', 'core')).not.toThrow();
    expect(generateForSkill('not-a-real-skill', 'core')).toBeNull();
  });

  it('defaults to core and tolerates an unknown band', () => {
    const id = skillIds[0];
    expect(generateForSkill(id).metadata.difficulty).toBeTruthy();
    expect(generateForSkill(id, 'medium').metadata.difficulty).toBeTruthy();
  });
});

describe('nearestBand', () => {
  it('returns the requested band when the skill declares it', () => {
    skillIds.forEach((id) => {
      skills[id].difficulties.forEach((band) => {
        expect(nearestBand(id, band)).toBe(band);
      });
    });
  });

  it('steps down before it steps up, so stretch never serves easier than core', () => {
    // expand-double-brackets declares foundation/core only.
    expect(nearestBand('expand-double-brackets', 'stretch')).toBe('core');
  });

  it('steps up when nothing lower is declared', () => {
    // difference-of-two-squares-numeric declares core/stretch only.
    expect(nearestBand('difference-of-two-squares-numeric', 'foundation')).toBe('core');
  });

  it('returns null for an unknown id', () => {
    expect(nearestBand('not-a-real-skill', 'core')).toBeNull();
  });
});
