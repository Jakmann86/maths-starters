import { useLayoutEffect, useRef } from 'react';
import MathDisplay from './MathDisplay.jsx';
import Figure from './Figure.jsx';
import { iSize, pSize, qSize } from '../lib/typeSizing.js';

// qSize() estimates a question's width from its source, and KaTeX's serif
// set runs wider than the estimate: on a 1366px board (or a 1920px one at
// 125% scaling) the universal set and the three-set expressions ran off the
// right edge. So the rendered question is measured, and if it is wider or
// taller than its space its font is scaled down to fit. The scale goes in a
// custom property rather than React state, so fitting never re-renders.
function useFitToBox(innerRef, rowRef, content, revealed) {
  useLayoutEffect(() => {
    const inner = innerRef.current;
    const row = rowRef.current;
    if (!inner || !row) return undefined;
    const fit = () => {
      inner.style.setProperty('--fit', '1');
      const box = inner.parentElement;
      const s = Math.min(
        1,
        box.clientWidth / Math.max(inner.scrollWidth, 1),
        row.clientHeight / Math.max(inner.scrollHeight, 1),
      );
      if (s < 1) inner.style.setProperty('--fit', String(Math.floor(s * 98) / 100));
    };
    fit();
    // The row resizes with the screen and on reveal; the content changes
    // when KaTeX arrives after the first paint.
    const ro = new ResizeObserver(fit);
    ro.observe(row);
    const mo = new MutationObserver(fit);
    mo.observe(inner, { childList: true, subtree: true, characterData: true });
    return () => { ro.disconnect(); mo.disconnect(); };
  }, [innerRef, rowRef, content, revealed]);
}

export default function Slot({ label, colorVar, data, revealed, onRegenSame, onRegen, onSwap }) {
  const { topic, instr, q, qProse, qCompact, a, fig, parts } = data;
  const rowRef = useRef(null);
  const qRef = useRef(null);
  useFitToBox(qRef, rowRef, parts ? null : q, revealed);

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
        <div className="slot-row" ref={rowRef}>
          <div className="slot-figure-wrap">
            <Figure fig={fig} color={colorVar} shown={revealed} />
          </div>
          {/* `.slot-question` is an inline-size container, so the font's cqi
              term measures the width left beside the figure rather than the
              whole slot (typeSizing.js). The size goes on the inner div: an
              element cannot query its own container. */}
          {/* Parts take the instruction's size, set here on the container
              so cqi measures the slot, as it does for the instruction. */}
          <div className="slot-question" style={parts ? { fontSize: iSize(instr) } : undefined}>
            {parts ? (
              <div className="slot-parts">
                {parts.map((p) => <div key={p}>{p}</div>)}
              </div>
            ) : (
              <div ref={qRef} style={{ fontSize: `calc(${qProse ? pSize() : qSize(q, instr, qCompact, Boolean(fig))} * var(--fit, 1))` }}>
                {qProse
                  ? <span className="mprose">{q}</span>
                  : <MathDisplay math={q} />}
              </div>
            )}
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
