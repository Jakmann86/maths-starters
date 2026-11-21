// Test support only. Checks time from the question text: clock times and
// durations are read back to minutes and the answer recomputed, and each
// working line's times must add up.

const must = (cond, msg) => { if (!cond) throw new Error(msg); };
const T24 = /(\d{2})\{:\}(\d{2})/;
const read24 = (s) => {
  const m = new RegExp(`^${T24.source}$`).exec(s.trim());
  must(m, `a 24-hour time: ${s}`);
  const [h, mi] = [Number(m[1]), Number(m[2])];
  must(h < 24 && mi < 60, `a real time: ${s}`);
  return h * 60 + mi;
};
const read12 = (s) => {
  const m = /^(\d{1,2})\{:\}(\d{2}) \\text\{ (am|pm)\}$/.exec(s.trim());
  must(m, `a 12-hour time: ${s}`);
  const [h, mi] = [Number(m[1]), Number(m[2])];
  must(h >= 1 && h <= 12 && mi < 60, `a real 12-hour time: ${s}`);
  return (h % 12) * 60 + mi + (m[3] === 'pm' ? 720 : 0);
};
const readSpan = (s) => {
  const m = /^(?:(\d+) \\text\{ h\})?(?: ?(\d+) \\text\{ min\})?$/.exec(s.trim().replace('\\text{ h } ', '\\text{ h} '));
  must(m && (m[1] || m[2]), `a duration: ${s}`);
  must(m[2] === undefined || Number(m[2]) < 60, 'minutes under 60');
  must(m[2] === undefined || Number(m[2]) > 0, 'no zero minutes written');
  return Number(m[1] || 0) * 60 + Number(m[2] || 0);
};
const mod = (m) => ((m % 1440) + 1440) % 1440;

export function checkTime(q, band) {
  must(q.metadata?.topic === 'time' && q.metadata.difficulty === band, 'metadata');
  must(!q.visualization && !q.answerUnits, 'text only');
  must(typeof q.workingOut === 'string' && !/\\n(?![a-z])/.test(q.workingOut), 'real newlines');
  must(!/\d/.test(q.instruction), 'no digits in the instruction');
  const w = q.workingOut.split('\n');
  must(w.at(-1) === q.answer, 'the working ends on the answer');

  if (band === 'foundation') {
    must(w.length === 2, 'one step, then the answer');
    must(q.instruction === 'Change the clock', 'instruction');
    const [from, to] = q.questionMath.split(' \\ \\to \\ ');
    // The step names the hour: 12 am becomes 00, pm adds 12, and back.
    const stepFor = (m, toward24) => {
      const h = Math.floor(m / 60), h12 = h % 12 === 0 ? 12 : h % 12;
      if (toward24) {
        if (h === 0) return '12 \\text{ am} \\to 00';
        if (h === 12) return '12 \\text{ pm stays } 12';
        return h > 12 ? `${h12} + 12 = ${h}` : '\\text{am stays the same}';
      }
      if (h === 0) return '00 \\to 12 \\text{ am}';
      if (h === 12) return '12 \\text{ stays } 12 \\text{, pm}';
      return h > 12 ? `${h} - 12 = ${h12} \\text{, pm}` : '\\text{before } 12{:}00 \\text{, am}';
    };
    if (to === '\\text{24-hour clock}') {
      const m = read12(from);
      must(read24(q.answer) === m, `${q.answer} is not ${from}`);
      must(w[0] === stepFor(m, true), `the step: ${w[0]}`);
      return { kind: m < 60 || (m >= 720 && m < 780) ? 'midnight or noon' : 'to 24-hour' };
    }
    must(to === '\\text{12-hour clock}', 'to the 12-hour clock');
    const m = read24(from);
    must(read12(q.answer) === m, `${q.answer} is not ${from}`);
    must(w[0] === stepFor(m, false), `the step: ${w[0]}`);
    return { kind: m < 60 || (m >= 720 && m < 780) ? 'midnight or noon' : 'to 12-hour' };
  }

  if (band === 'core') {
    if (q.instruction === 'Find the time taken') {
      const m = /^\\text\{from \} (.+) \\text\{ to \} (.+)$/.exec(q.questionMath);
      must(m, 'from one time to another');
      const [a, b] = [read24(m[1]), read24(m[2])];
      must(b > a && a % 60 && b % 60, 'later the same day, neither on the hour');
      must(readSpan(q.answer) === b - a, `${q.answer} is not ${b - a} minutes`);
      // Three hops: to the hour, whole hours, past the hour; they add up.
      must(w.length === 4, 'three hops, then the answer');
      const hops = w.slice(0, 3).map((line) => {
        const h = /^(.+) \\to (.+): \\ (.+)$/.exec(line);
        must(h, `a hop: ${line}`);
        const [x, y, d] = [read24(h[1]), read24(h[2]), readSpan(h[3])];
        must(y - x === d, `a hop that does not add up: ${line}`);
        return [x, y];
      });
      must(hops[0][0] === a && hops[2][1] === b && hops[0][1] === hops[1][0] && hops[1][1] === hops[2][0], 'the hops join up');
      must(hops[0][1] % 60 === 0 && hops[2][0] % 60 === 0, 'whole hours in the middle');
      return { kind: 'time taken' };
    }
    must(q.instruction === 'Find the finishing time', 'instruction');
    const [l1, l2] = q.questionMath.split('\n');
    const start = read24(l1.replace('\\text{starts at } ', ''));
    const dur = readSpan(l2.replace('\\text{takes } ', ''));
    must(start + dur < 1440, 'the same day');
    must(read24(q.answer) === start + dur, `${q.answer} is not the finish`);
    must(w.length === 3, 'hours, minutes, answer');
    w.slice(0, 2).forEach((line) => {
      const h = /^(.+) \+ (.+) = (.+)$/.exec(line);
      must(h && read24(h[1]) + readSpan(h[2]) === read24(h[3]), `an addition that is wrong: ${line}`);
    });
    return { kind: 'finishing time' };
  }

  must(q.instruction === 'Find the local time when it arrives', 'instruction');
  const lines = q.questionMath.split('\n');
  must(lines.length === 3, 'departure, journey, time difference');
  const dep = read24(lines[0].replace('\\text{departs at } ', ''));
  const dur = readSpan(lines[1].replace('\\text{journey time } ', ''));
  const z = /^\\text\{destination is \} (\d+) \\text\{ hours (ahead|behind)\}$/.exec(lines[2]);
  must(z, 'the time difference');
  const shift = Number(z[1]) * (z[2] === 'ahead' ? 60 : -60);
  const local = dep + dur + shift;
  const day = Math.floor(local / 1440);
  must(day >= -1 && day <= 1, 'within a day');
  must(Math.floor((dep + dur) / 1440) !== 0 || day !== 0, 'midnight is crossed');
  const words = { '-1': 'the day before', 0: 'the same day', 1: 'the next day' }[day];
  const a = /^(.+) \\text\{ \((.+)\)\}$/.exec(q.answer);
  must(a && read24(a[1]) === mod(local) && a[2] === words, `${q.answer} is not ${mod(local)} minutes, ${words}`);
  must(w.length === 3, 'arrive in home time, change zone, answer');
  const home = dep + dur;
  const l1 = /^(.+) \+ (.+) = (\d{2}\{:\}\d{2})( \\text\{ \(next day\)\})?$/.exec(w[0]);
  must(l1 && read24(l1[1]) === dep && readSpan(l1[2]) === dur && read24(l1[3]) === mod(home), `the arrival in home time: ${w[0]}`);
  must(Boolean(l1[4]) === (home >= 1440), 'next day marked when it is');
  const l2 = /^(.+) ([+-]) (\d+) \\text\{ h\} = (.+)$/.exec(w[1]);
  must(l2 && read24(l2[1]) === mod(home) && (l2[2] === '+' ? 1 : -1) * Number(l2[3]) * 60 === shift && read24(l2[4]) === mod(local), `the change of zone: ${w[1]}`);
  return { kind: { '-1': 'day before', 0: 'same day', 1: 'next day' }[day] };
}
