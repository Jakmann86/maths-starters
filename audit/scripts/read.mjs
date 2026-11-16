// node audit/scripts/read.mjs <fromIndex> <toIndex> [seedStart=101] [count=3]  — compact reading dump by catalogue position
import { skills, bandsOf, draw } from './gen.mjs';
const [a, b, s0 = 101, cnt = 3] = process.argv.slice(2).map(Number);
const ids = Object.keys(skills).slice(a, b);
const vz = (v) => { if (!v) return ''; const { type, big, ...rest } = v; let s = JSON.stringify(rest); if (s.length > 260) s = s.slice(0, 260) + '…'; return ` FIG[${type}]${s}`; };
for (const id of ids) for (const band of bandsOf(id)) {
  let lastI = null;
  console.log(`## ${id} ${band[0].toUpperCase()}`);
  for (let n = s0; n < s0 + cnt; n += 1) {
    const q = draw(id, band, n);
    const Q = q.questionMath ?? q.questionText ?? '';
    const ins = q.instruction === lastI ? '〃' : q.instruction; lastI = q.instruction;
    console.log(`#${n} ${ins} | ${String(Q).replace(/\n/g, ' ⏎ ')}${q.questionParts ? ' PARTS ' + JSON.stringify(q.questionParts) : ''}${vz(q.visualization)}\n  A: ${String(q.answer).replace(/\n/g, ' ⏎ ')}${q.answerUnits ? ' [' + q.answerUnits + ']' : ''}\n  W: ${String(q.workingOut).replace(/\n/g, ' ⏎ ')}`);
  }
}
