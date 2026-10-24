import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import MathDisplay from '../components/MathDisplay.jsx';
import Figure from '../components/Figure.jsx';
import { buildSheets, PRESETS, MAX_VERSIONS } from './buildSheets.js';
import './print.css';

// The print screen. It opens over the board and prints through the browser's
// own Print / Save as PDF — no PDF library (CLAUDE.md, "What this is not").
//
// It is rendered into document.body, outside #root, so print CSS can hide the
// whole board with `#root { display: none }` and print only the pages.

// Answers and filled-in figure solutions print in the first slot colour, so a
// teacher copy reads apart from a student copy at a glance; it greys out
// on a black-and-white copier. Figure highlights (an unknown side, a
// shaded region) use the second, which copies as a mid grey.
const ANSWER = 'var(--slot-1)';
const FIGURE = 'var(--slot-2)';

export default function PrintSheet({ open, boxes, onClose }) {
  const [preset, setPreset] = useState('exit');
  const [title, setTitle] = useState(PRESETS.exit.title);
  const [versions, setVersions] = useState(1);
  const [answers, setAnswers] = useState(false);
  const [seed, setSeed] = useState(0);

  const { layout, perBox, date } = PRESETS[preset];
  const boxKey = JSON.stringify(boxes);
  // Generated once per set of choices, so toggling answers shows the same
  // questions with their answers rather than new questions. `seed` is the
  // "New numbers" button.
  const pages = useMemo(
    () => (open ? buildSheets(boxes, { layout, perBox, versions }) : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- boxKey stands for boxes
    [open, boxKey, layout, perBox, versions, seed],
  );

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  const choose = (p) => { setPreset(p); setTitle(PRESETS[p].title); };
  const header = { title, date, answers };

  return createPortal(
    <div className="print-overlay">
      <div className="print-controls">
        <div className="print-control-group">
          <div className="print-label">Sheet</div>
          <div className="print-seg">
            {Object.entries(PRESETS).map(([k, p]) => (
              <button key={k} type="button" className={`print-btn${preset === k ? ' is-on' : ''}`} onClick={() => choose(k)}>
                {p.title}
              </button>
            ))}
          </div>
        </div>
        <label className="print-control-group">
          <div className="print-label">Title</div>
          <input className="print-title-input" value={title} onChange={(e) => setTitle(e.target.value)} />
        </label>
        <div className="print-control-group">
          <div className="print-label">Versions</div>
          <div className="print-seg">
            <button type="button" className="print-btn" onClick={() => setVersions((v) => Math.max(1, v - 1))}>−</button>
            <div className="print-value">{versionLabel(versions, layout)}</div>
            <button type="button" className="print-btn" onClick={() => setVersions((v) => Math.min(MAX_VERSIONS, v + 1))}>+</button>
          </div>
        </div>
        <div className="print-control-group">
          <div className="print-label">Answers</div>
          <button type="button" className={`print-btn${answers ? ' is-on' : ''}`} onClick={() => setAnswers((a) => !a)}>
            {answers ? 'Shown' : 'Hidden'}
          </button>
        </div>
        <span className="print-spacer" />
        <button type="button" className="print-btn" onClick={() => setSeed((s) => s + 1)}>New numbers</button>
        <button type="button" className="print-btn print-btn--primary" onClick={() => window.print()}>Print</button>
        <button type="button" className="print-btn" onClick={onClose}>Close</button>
      </div>

      <div className="print-pages">
        {pages.map((page, i) => (
          <PrintPage key={i} page={page} layout={layout} header={header} />
        ))}
      </div>
    </div>,
    document.body,
  );
}

const versionLabel = (n, layout) => {
  if (n === 1) return layout === 'half' ? 'A A' : 'A';
  return ['A', 'B', 'C', 'D', 'E'].slice(0, n).join(' ');
};

export function PrintPage({ page, layout, header }) {
  if (layout === 'half') {
    return (
      <section className="print-page print-page--half">
        <Sheet sheet={page.halves[0]} header={header} half />
        <div className="print-cut" aria-hidden="true" />
        <Sheet sheet={page.halves[1]} header={header} half />
      </section>
    );
  }
  return (
    <section className="print-page print-page--full">
      <Sheet sheet={page.sheet} header={header} />
    </section>
  );
}

function Sheet({ sheet, header, half }) {
  const { letter, questions, first = 0, part, parts } = sheet;
  const rows = half ? 2 : Math.max(2, Math.ceil(questions.length / 2));
  return (
    <div className={`print-sheet${half ? ' print-sheet--half' : ''}`} style={{ '--rows': rows }}>
      <div className="print-sheet-head">
        <div className="print-sheet-title">
          {header.title}
          {parts > 1 && <span className="print-sheet-part"> ({part} of {parts})</span>}
        </div>
        <span className="print-spacer" />
        {part > 1 ? null : (
          <>
            <div className="print-field">Name <span className="print-line" /></div>
            {header.date && <div className="print-field">Date <span className="print-line print-line--short" /></div>}
          </>
        )}
        {letter && <div className="print-letter">{letter}</div>}
      </div>
      <div className="print-grid">
        {questions.map((item, i) => (
          <PrintQuestion key={i} n={first + i + 1} item={item} answers={header.answers} />
        ))}
      </div>
    </div>
  );
}

// A question that does not fit its cell is shrunk, text and figure together,
// in 5% steps down to FIT_MIN: the board's fit-to-box idea, on paper. Most
// questions fit at full size. Measured again whenever the content changes,
// because every KaTeX line arrives after the first paint, in place of its
// LaTeX source, which is longer and wraps. Watching size alone misses that:
// the body is stretched to the cell whatever is inside it, so the swap
// changes no box size. A MutationObserver sees it, as in Slot.jsx.
const FIT_MIN = 0.65;

function useFitToCell() {
  const cell = useRef(null);
  const body = useRef(null);
  useLayoutEffect(() => {
    const el = cell.current;
    if (!el) return undefined;
    const fit = () => {
      let f = 1;
      el.style.setProperty('--fit', '1');
      // Too tall, or too wide: a line that cannot wrap (a long \\text{}, a
      // KaTeX line) is as much a misfit as a tall figure.
      const over = () => el.scrollHeight > el.clientHeight + 1 || el.scrollWidth > el.clientWidth + 1;
      while (over() && f > FIT_MIN + 1e-9) {
        f = Math.round((f - 0.05) * 100) / 100;
        el.style.setProperty('--fit', String(f));
      }
      el.dataset.fit = String(f);
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    const mo = new MutationObserver(fit);
    mo.observe(body.current, { childList: true, subtree: true, characterData: true });
    return () => { ro.disconnect(); mo.disconnect(); };
  }, []);
  return { cell, body };
}

// A questionMath that is nothing but words in \\text{} ("Write the general
// rule for the nth term, then ...") has no maths in it, and KaTeX never wraps
// a line. On the board the fit-to-box copes; in a printed cell beside a
// figure it cannot, so on paper such a line is set as prose, which wraps.
const TEXT_ONLY = /^\\text\{([^{}\\]*)\}$/;
const textOnly = (q) => {
  const lines = String(q).split('\n');
  return lines.every((l) => TEXT_ONLY.test(l)) ? lines.map((l) => TEXT_ONLY.exec(l)[1]) : null;
};

export function PrintQuestion({ n, item, answers }) {
  const { instr, q, qProse, parts, a, fig } = item.view;
  const { cell, body } = useFitToCell();
  return (
    <div className="pq" ref={cell} data-skill={item.skillId} data-band={item.band}>
      <div className="pq-num">{n}</div>
      <div className="pq-body" ref={body}>
        {instr && <div className="pq-instr">{instr}</div>}
        {/* Figure and question side by side, as on the board. The row
            wraps: a wide figure (a long table) leaves no room beside it, so
            the question drops underneath instead of being squeezed. */}
        <div className="pq-row">
          {fig && (
            <div className="pq-fig">
              <Figure fig={fig} color={answers ? ANSWER : FIGURE} shown={answers} />
            </div>
          )}
          {parts ? (
            <div className="pq-parts">{parts.map((p) => <div key={p}>{p}</div>)}</div>
          ) : (
            // A worded question is set as wrapping serif prose, as Slot.jsx
            // does: a KaTeX \\text{} line never wraps.
            q && (
              <div className="pq-q">
                {qProse ? <span className="mprose">{q}</span>
                  : textOnly(q) ? textOnly(q).map((l) => <div key={l} className="mprose">{l}</div>)
                    : <MathDisplay math={q} />}
              </div>
            )
          )}
        </div>
        <div className="pq-space" />
        <div className={`pq-answer${answers ? ' is-shown' : ''}`}>
          {answers
            ? <div style={{ color: ANSWER }}><MathDisplay math={a} /></div>
            : <span className="pq-answer-line" />}
        </div>
      </div>
    </div>
  );
}
