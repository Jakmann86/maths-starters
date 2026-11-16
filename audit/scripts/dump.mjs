// node audit/scripts/dump.mjs <band|all> <seedStart> <count> [idRegex]  — compact reading dump
import { skills, bandsOf, draw } from './gen.mjs';
const [bandArg = 'all', s0 = 1, cnt = 1, re = '.'] = process.argv.slice(2);
const rx = new RegExp(re);
const vz = (v) => { if (!v) return ''; const { type, ...rest } = v; let s = JSON.stringify(rest); if (s.length > 420) s = s.slice(0, 420) + '…'; return ` FIG[${type}] ${s}`; };
for (const id of Object.keys(skills)) {
  if (!rx.test(id)) continue;
  for (const band of bandsOf(id)) {
    if (bandArg !== 'all' && band !== bandArg) continue;
    for (let n = Number(s0); n < Number(s0) + Number(cnt); n += 1) {
      let q; try { q = draw(id, band, n); } catch (e) { console.log(`## ${id} ${band[0]} #${n} THROW ${e.message}`); continue; }
      const Q = q.questionMath ?? q.questionText ?? '';
      console.log(`## ${id} ${band[0].toUpperCase()} #${n} | ${q.instruction} | Q: ${String(Q).replace(/\n/g, ' ⏎ ')}${q.questionParts ? ' PARTS ' + JSON.stringify(q.questionParts) : ''}${vz(q.visualization)}\n   A: ${q.answer}${q.answerUnits ? ' [' + q.answerUnits + ']' : ''}\n   W: ${String(q.workingOut).replace(/\n/g, ' ⏎ ')}`);
    }
  }
}
