// Where a number a student needs goes is decided topic by topic (DESIGN.md
// "Instruction or question"). By default it goes in the question, big, not
// in the instruction the teacher reads out.
//
// Every number left in an instruction has to be accounted for here: the form of
// the answer, a count that the data beside it already shows, or a topic the
// user has chosen to word that way.

import { describe, expect, it } from 'vitest';
import { skills } from './skills';

const ANSWER_FORM = /\d+ (significant figures?|decimal places?)/g;

// Skill, and why its instruction may keep a number.
const COUNT_OF_THE_DATA = /\d/;
const INFERRABLE = {
  // How much data there is, with all of it drawn or listed beside the sentence.
  'quartiles-iqr': COUNT_OF_THE_DATA,
  'five-number-summary': COUNT_OF_THE_DATA,
  'compare-distributions': COUNT_OF_THE_DATA,
  'table-averages': COUNT_OF_THE_DATA,
  'scatter-correlation': COUNT_OF_THE_DATA,
  'line-of-best-fit': COUNT_OF_THE_DATA,
  'simultaneous-problem-solving': /\d+°/,            // the equations beside it carry it
  'tree-diagrams': /holds \d+ .+ replacement\.$/,    // every branch is labelled (Stretch's aren't, and swaps)
  'polygon-interior-angles': /irregular \d+-sided/,  // every angle is labelled
  'polygon-exterior-angles': /of this \d+-sided/,    // ditto, and the sides can be counted
};

// Topics where the user chose to give the condition in words, beside the
// formula rather than inside the KaTeX (Quadratic graphs: "when x = −3",
// "given the vertex (5, −4)").
const GIVEN_IN_WORDS = {
  'quadratic-substitution': /^Find the value (?:of y|or values of x) when [xy] = \u2212?\d+$/,
  'quadratic-find-function': /^Find [a-z, ]+ and [a-z] given the /,
};

describe('instructions', () => {
  it('hold no number a student needs', () => {
    const out = [];
    Object.entries(skills).forEach(([id, skill]) => {
      (skill.difficulties ?? ['core']).forEach((difficulty) => {
        for (let i = 0; i < 300; i += 1) {
          const { instruction } = skill.generate({ difficulty });
          const rest = String(instruction).replace(ANSWER_FORM, '');
          if (!/\d/.test(rest)) continue;
          if (INFERRABLE[id]?.test(rest)) continue;
          if (GIVEN_IN_WORDS[id]?.test(rest)) continue;
          out.push(`${id} ${difficulty}: ${instruction}`);
        }
      });
    });
    expect([...new Set(out.map((s) => s.replace(/\d+/g, '#')))]).toEqual([]);
  }, 300000);
});
