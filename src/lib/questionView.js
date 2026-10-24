// What a generated question looks like to a renderer: the shape SPEC.md §3
// returns, flattened to the fields a box or a printed question draws. Shared by
// the board (Slot.jsx) and the printout (src/print), so the two can never
// disagree about how an answer and its units are put together.

import { getSkill } from '../curriculum/skills.js';

// answerUnits is either LaTeX ('\\text{cm}^3', passed through) or a plain
// word ('cm'), which is wrapped in \text{} so it does not render as the
// italic product c·m.
const unitsTex = (u) => (u.includes('\\') ? u : `\\text{${u}}`);

export function questionView(q, skillId) {
  if (!q) return { topic: '—', instr: '', q: '', a: '' };
  return {
    topic: getSkill(skillId)?.label ?? skillId,
    instr: q.instruction,
    q: q.questionMath != null ? q.questionMath : (q.questionText ?? ''),
    qProse: q.questionMath == null && q.questionText != null,
    parts: q.questionParts ?? null,
    qCompact: q.questionMathCompact === true,
    a: q.answerUnits ? `${q.answer}\\text{ }${unitsTex(q.answerUnits)}` : q.answer,
    fig: q.visualization,
  };
}
