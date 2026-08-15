import MathDisplay from './MathDisplay.jsx';
import Figure from './Figure.jsx';
import { iSize, qSize } from '../lib/typeSizing.js';

export default function Slot({ label, colorVar, data, revealed, onRegen, onSwap }) {
  const { topic, instr, q, a, w, fig } = data;

  return (
    <section className="slot" style={{ '--c': colorVar }}>
      <div className="slot-bar" />

      <div className="slot-eyebrow-row">
        <span className="slot-eyebrow">{label}</span>
        <span className="slot-topic">{topic}</span>
        <span className="slot-spacer" />
        <span className="slot-actions">
          <button type="button" className="slot-action-btn" title="New question, same topic" onClick={onRegen}>↻</button>
          <button type="button" className="slot-action-btn" title="Swap topic" onClick={onSwap}>⇄</button>
        </span>
      </div>

      <div className="slot-body">
        <div className="slot-instr" style={{ fontSize: iSize(instr) }}>{instr}</div>
        <div className="slot-row">
          <div className="slot-figure-wrap">
            <Figure fig={fig} color={colorVar} shown={revealed} />
          </div>
          <div className="slot-question" style={{ fontSize: qSize(q, instr) }}>
            <MathDisplay math={q} />
          </div>
        </div>
      </div>

      <div className={`slot-answer${revealed ? ' is-revealed' : ''}`}>
        {revealed && (
          <>
            <div className="answer-value"><MathDisplay math={a} /></div>
            <div className="answer-working"><MathDisplay math={w} /></div>
          </>
        )}
      </div>
    </section>
  );
}
