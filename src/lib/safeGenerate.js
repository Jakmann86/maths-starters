// A generator that throws must never take the board down with it. The board
// is in front of a class: one bad question empties its own box, and the
// teacher presses # for another, while the other three boxes stay as they
// were.
//
// Generators are random, so a throw is usually one unlucky draw. A failed
// draw is tried again a few times before the box gives up; each failure is
// logged with its skill and band, so it can be found and fixed.

import { generateForSkill, getSkill } from '../curriculum/skills.js';
import { questionView } from './questionView.js';

export const TRIES = 3;

/**
 * Returns the generated question, or null if every try threw (or the skill
 * is unknown). `gen` is injectable for tests.
 */
export function safeGenerate(skillId, band, gen = generateForSkill, tries = TRIES) {
  for (let t = 0; t < tries; t += 1) {
    try {
      return gen(skillId, band);
    } catch (err) {
      console.error(`Generator failed: ${skillId} (${band}), try ${t + 1} of ${tries}`, err);
    }
  }
  return null;
}

/**
 * What one box on the board shows. If the skill exists but every try threw,
 * the box keeps its skill's name and is marked `failed`, and Slot.jsx says
 * so in place of the question.
 */
export function boxView(skillId, band, gen = generateForSkill) {
  const q = safeGenerate(skillId, band, gen);
  const skill = getSkill(skillId);
  if (!q && skill) return { ...questionView(null, skillId), topic: skill.label, failed: true };
  return questionView(q, skillId);
}
