// src/generators/number/timeGenerators.js
//
// Time — syllabus E1.14 ("calculate with time: units, 12-hour and 24-hour
// clock, timetables, time zones"), Haese assumed knowledge. In Speed,
// distance and time, first:
//
//   foundation  12-hour to 24-hour clock or back, midnight and noon among
//               them (00:15 is 12:15 am, 12:40 is 12:40 pm)
//   core        a time taken between two clock times, or a finishing time
//               from a start and a duration, across the hours
//   stretch     a journey across time zones: depart, travel, convert to the
//               local time at the other end, past midnight either way
//
// Clock times are written 16{:}35, so KaTeX sets the colon as punctuation
// rather than a relation with space round it.

import _ from 'lodash';

const NL = '\n';
const pad = (n) => String(n).padStart(2, '0');
/** Minutes after midnight as a 24-hour time: 16{:}35. */
export const clock = (m) => `${pad(Math.floor((((m % 1440) + 1440) % 1440) / 60))}{:}${pad((((m % 1440) + 1440) % 1440) % 60)}`;
/** Minutes after midnight as a 12-hour time: 4{:}35 \text{ pm}. */
export const twelve = (m) => {
  const h = Math.floor(m / 60), mi = m % 60;
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}{:}${pad(mi)} \\text{ ${h < 12 ? 'am' : 'pm'}}`;
};
/** A duration: 4 \text{ h } 28 \text{ min}, dropping a zero part. */
export const span = (m) => {
  const h = Math.floor(m / 60), mi = m % 60;
  if (!h) return `${mi} \\text{ min}`;
  if (!mi) return `${h} \\text{ h}`;
  return `${h} \\text{ h } ${mi} \\text{ min}`;
};
const minutes = () => _.sample([5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, ..._.range(1, 59)]);

export const generateTime = (options = {}) => {
  const { difficulty = 'core' } = options;
  const metadata = { topic: 'time', difficulty };

  if (difficulty === 'foundation') {
    // A quarter of the times in the midnight or noon hour, where the rule
    // is easy to get wrong.
    const h = _.random(0, 3) === 0 ? _.sample([0, 12]) : _.sample([..._.range(1, 12), ..._.range(13, 24)]);
    const m = h * 60 + _.random(0, 59);
    const h12 = h % 12 === 0 ? 12 : h % 12;
    const pm = h >= 12;
    // The step: add 12 for pm (not 12 pm), 12 am is 00.
    const rule = h === 0 ? `12 \\text{ am} \\to 00`
      : h === 12 ? `12 \\text{ pm stays } 12`
        : pm ? `${h12} + 12 = ${h}` : `\\text{am stays the same}`;
    if (_.random(0, 1)) {
      const answer = clock(m);
      return {
        instruction: 'Change the clock',
        questionMath: `${twelve(m)} \\ \\to \\ \\text{24-hour clock}`,
        answer,
        workingOut: [rule, answer].join(NL),
        metadata,
      };
    }
    const answer = twelve(m);
    const back = h === 0 ? `00 \\to 12 \\text{ am}`
      : h === 12 ? `12 \\text{ stays } 12 \\text{, pm}`
        : pm ? `${h} - 12 = ${h12} \\text{, pm}` : `\\text{before } 12{:}00 \\text{, am}`;
    return {
      instruction: 'Change the clock',
      questionMath: `${clock(m)} \\ \\to \\ \\text{12-hour clock}`,
      answer,
      workingOut: [back, answer].join(NL),
      metadata,
    };
  }

  if (difficulty === 'core') {
    for (;;) {
      const start = _.random(6 * 60, 20 * 60);
      const dur = _.random(1, 6) * 60 + minutes();
      const end = start + dur;
      // Before midnight, and neither time on the hour, so the hours have
      // to be bridged.
      if (end >= 24 * 60 || start % 60 === 0 || end % 60 === 0) continue;
      if (_.random(0, 1)) {
        // Time taken: up to the next hour, whole hours, then the minutes past.
        const up = 60 - (start % 60);
        const firstHour = start + up;
        const lastHour = end - (end % 60);
        if (lastHour <= firstHour) continue;
        const answer = span(dur);
        return {
          instruction: 'Find the time taken',
          questionMath: `\\text{from } ${clock(start)} \\text{ to } ${clock(end)}`,
          answer,
          workingOut: [
            `${clock(start)} \\to ${clock(firstHour)}: \\ ${up} \\text{ min}`,
            `${clock(firstHour)} \\to ${clock(lastHour)}: \\ ${(lastHour - firstHour) / 60} \\text{ h}`,
            `${clock(lastHour)} \\to ${clock(end)}: \\ ${end % 60} \\text{ min}`,
            answer,
          ].join(NL),
          metadata,
        };
      }
      const h = Math.floor(dur / 60), mi = dur % 60;
      const answer = clock(end);
      return {
        instruction: 'Find the finishing time',
        questionMath: [`\\text{starts at } ${clock(start)}`, `\\text{takes } ${span(dur)}`].join(NL),
        answer,
        workingOut: [
          `${clock(start)} + ${h} \\text{ h} = ${clock(start + h * 60)}`,
          `${clock(start + h * 60)} + ${mi} \\text{ min} = ${answer}`,
          answer,
        ].join(NL),
        metadata,
      };
    }
  }

  // stretch: across time zones, crossing midnight at least once.
  for (;;) {
    const dep = _.random(0, 23) * 60 + _.sample([0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55]);
    const dur = _.random(2, 13) * 60 + _.sample([0, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55]);
    const shift = _.sample([-8, -7, -6, -5, -4, -3, -2, 2, 3, 4, 5, 6, 7, 8, 9]);
    const home = dep + dur;
    const local = home + shift * 60;
    const dayOf = (m) => Math.floor(m / 1440);
    // Something must cross midnight, and the answer stays within a day
    // either side.
    if (dayOf(home) === 0 && dayOf(local) === 0) continue;
    // Minutes in the journey, and never exactly midnight, which is
    // neither one day nor the next.
    if (dur % 60 === 0 || local % 1440 === 0 || home % 1440 === 0) continue;
    const day = { '-1': ' \\text{ (the day before)}', 0: ' \\text{ (the same day)}', 1: ' \\text{ (the next day)}', 2: '' }[dayOf(local)];
    if (day === undefined || day === '') continue;
    const answer = `${clock(local)}${day}`;
    const whenHome = dayOf(home) === 1 ? ' \\text{ (next day)}' : '';
    return {
      instruction: 'Find the local time when it arrives',
      questionMath: [
        `\\text{departs at } ${clock(dep)}`,
        `\\text{journey time } ${span(dur)}`,
        `\\text{destination is } ${Math.abs(shift)} \\text{ hours ${shift > 0 ? 'ahead' : 'behind'}}`,
      ].join(NL),
      answer,
      workingOut: [
        `${clock(dep)} + ${span(dur)} = ${clock(home)}${whenHome}`,
        `${clock(home)} ${shift > 0 ? '+' : '-'} ${Math.abs(shift)} \\text{ h} = ${clock(local)}`,
        answer,
      ].join(NL),
      metadata,
    };
  }
};
