import { afterEach, describe, expect, it, vi } from 'vitest';
import { boxView, safeGenerate, TRIES } from './safeGenerate';
import { skills } from '../curriculum/skills';

const anySkill = Object.keys(skills)[0];
const question = { instruction: 'Find x.', answer: '3', metadata: {} };

describe('safeGenerate', () => {
  afterEach(() => vi.restoreAllMocks());

  it('passes a good question straight through', () => {
    expect(safeGenerate(anySkill, 'core', () => question)).toBe(question);
  });

  it('tries again after a throw, and keeps the first question that comes back', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    let calls = 0;
    const gen = () => { calls += 1; if (calls < TRIES) throw new Error('unlucky draw'); return question; };
    expect(safeGenerate(anySkill, 'core', gen)).toBe(question);
    expect(calls).toBe(TRIES);
  });

  it('gives up with null, logging each failure with its skill and band', () => {
    const log = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(safeGenerate('some-skill', 'stretch', () => { throw new Error('broken'); })).toBeNull();
    expect(log).toHaveBeenCalledTimes(TRIES);
    expect(log.mock.calls[0][0]).toContain('some-skill (stretch)');
  });
});

describe('boxView', () => {
  afterEach(() => vi.restoreAllMocks());

  it('marks a box whose generator always throws as failed, keeping its skill name', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const view = boxView(anySkill, 'core', () => { throw new Error('broken'); });
    expect(view.failed).toBe(true);
    expect(view.topic).toBe(skills[anySkill].label);
  });

  it('draws a working skill as usual', () => {
    const view = boxView(anySkill, 'core');
    expect(view.failed).toBeUndefined();
    expect(typeof view.instr).toBe('string');
  });
});
