import MathDisplay from './MathDisplay.jsx';
import Figure from './Figure.jsx';
import { iSize, qSize } from '../lib/typeSizing.js';

export default function Slot({ label, colorVar, data, revealed, onRegenSame, onRegen, onSwap }) {
  const { topic, instr, q, qCompact, a, fig } = data;

  return (
    <section className="slot" style={{ '--c': colorVar }}>
      <div className="slot-bar" />

      <div className="slot-eyebrow-row">
        <span className="slot-eyebrow">{label}</span>
        <span className="slot-topic">{topic}</span>
        <span className="slot-spacer" />
        <span className="slot-actions">
          <button
            type="button"
            className="slot-action-btn"
            title="New numbers, same question"
            aria-label="New numbers, same question"
            onClick={onRegenSame}
          >
            #
          </button>
          <button
            type="button"
            className="slot-action-btn"
            title="New question type, same topic"
            aria-label="New question type, same topic"
            onClick={onRegen}
          >
            ↻
          </button>
          <button
            type="button"
            className="slot-action-btn"
            title="Different topic"
            aria-label="Different topic"
            onClick={onSwap}
          >
            ⇄
          </button>
        </span>
      </div>

      <div className="slot-body">
        <div className="slot-instr" style={{ fontSize: iSize(instr) }}>{instr}</div>
        <div className="slot-row">
          <div className="slot-figure-wrap">
            <Figure fig={fig} color={colorVar} shown={revealed} />
          </div>
          <div className="slot-question" style={{ fontSize: qSize(q, instr, qCompact, Boolean(fig)) }}>
            <MathDisplay math={q} />
          </div>
        </div>
      </div>

      {/* Always mounted, never conditionally rendered — DESIGN.md's answer
          band is a pure opacity/padding transition on `.slot-answer`, and
          `.slot`'s grid rows are sized by content that has to already be in
          the DOM for a fixed-height, overflow:hidden container to measure
          correctly. Mounting `.answer-value` only on reveal left the "auto"
          answer row's height uncomputed until that first keypress — Chromium
          happened to recover, but WebKit did not, and kept the row's
          pre-reveal (empty) height, clipping most of a tall KaTeX answer
          (a fraction with a surd numerator, e.g. rationalise-denominator)
          against `.slot`'s overflow:hidden. */}
      <div className={`slot-answer${revealed ? ' is-revealed' : ''}`}>
        <div className="answer-value"><MathDisplay math={a} /></div>
      </div>
    </section>
  );
}
