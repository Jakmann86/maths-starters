// node audit/scripts/show.mjs <skill-id> <band> <seed> [count]  — reproduce a finding
import { draw } from './gen.mjs';
const [id, band, seed, count = 1] = process.argv.slice(2);
for (let i = 0; i < Number(count); i += 1) {
  const q = draw(id, band, Number(seed) + i);
  console.log(`--- ${id} ${band} seed ${Number(seed) + i}`);
  for (const k of ['instruction', 'questionMath', 'questionText', 'questionParts', 'answer', 'answerUnits', 'workingOut']) if (q[k] != null) console.log(`${k}: ${typeof q[k] === 'string' ? q[k] : JSON.stringify(q[k])}`);
  if (q.visualization) console.log('visualization:', JSON.stringify(q.visualization));
}
