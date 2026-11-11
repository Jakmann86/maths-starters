// Substitute-the-answer-back harness for Speed, distance and time. Every
// answer is recomputed by speedGenerators.check.js from the printed prose,
// or for a travel graph from the journey in the figure config, and every
// working line is checked. The mutation test beside it shows the checker
// fails when it should.
//
// Run: npx vitest run src/generators/number/speedGenerators.test.js

import { describe, expect, it } from 'vitest';
import { BANDS, report, sample } from '../harness.check';
import { checkSpeed } from './speedGenerators.check';
import { getSkill, skillsInTopic, strandOf } from '../../curriculum/skills';

const SAMPLES = 6000;

export const KINDS = {
  'speed-distance-time': {
    foundation: ['distance', 'speed', 'time'],
    core: ['converting units', 'hours and minutes'],
    stretch: ['two distances', 'two times'],
  },
  'travel-graphs': {
    foundation: ['length of the stop', 'read the distance'],
    core: ['average speed', 'speed of a part'],
    stretch: ['round trip', 'two travellers'],
  },
};

// The fewest distinct questions in 6,000 per band. Foundation speed,
// distance and time is a whole speed for whole hours, about 2,000 of them.
const FLOOR = {
  'speed-distance-time': { foundation: 1800, core: 1900, stretch: 5000 },
  'travel-graphs': { foundation: 4900, core: 4500, stretch: 5000 },
};

describe('Speed, distance and time', () => {
  Object.keys(KINDS).forEach((id) => {
    BANDS.forEach((band) => {
      it(`${id} ${band}: every answer follows from what is printed`, () => {
        const result = sample(id, band, checkSpeed, SAMPLES);
        report(id, band, result, SAMPLES);
        expect(Object.keys(result.mix).sort()).toEqual(KINDS[id][band]);
        expect(result.distinct).toBeGreaterThanOrEqual(FLOOR[id][band]);
      });
    });
  });

  it('is its own Number topic, after Profit and interest', () => {
    Object.keys(KINDS).forEach((id) => expect(getSkill(id).topic).toBe('Speed, distance and time'));
    expect(skillsInTopic('Speed, distance and time')).toEqual(Object.keys(KINDS));
    expect(strandOf('Speed, distance and time')).toBe('Number');
  });
});
