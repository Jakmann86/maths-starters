import { useMemo } from 'react';
import Header from '../components/Header.jsx';
import Slot from '../components/Slot.jsx';
import { SizeRange } from '../components/sizeRange.js';
import { getSkill } from '../curriculum/skills.js';
import { boxView } from '../lib/safeGenerate.js';
import { preloadKatex } from '../lib/katexLoader.js';
import { P_RANGE, Q_RANGE } from '../lib/typeSizing.js';
import '../components/Board.css';

// Dev-only preview of the question size range on mixed boards. Not linked
// from the app and not in the production build: reach it at
// /maths-starters/size-test.html under `npm run dev`.
//
// Each board is the real Slot in the real board grid, drawn in an iframe of
// a real screen size (1366 x 768 and 1920 x 1080), because the board sizes
// itself from the viewport. The questions are real ones from the catalogue,
// generated once by this page and shared with every frame, so both screen
// sizes show the same four questions. Reload for new numbers.
//
// The query string overrides Q_RANGE and P_RANGE, to try another spread
// without a rebuild:
//
//   ?spread=1.5        ceiling = floor x spread (and the rest follow, below)
//   ?ceil=45           the maths ceiling
//   ?floor=32 &floor3=30 &frac=36 &compact=44 &grow=0.66
//   ?pfloor=26 &pceil=40 &pgrow=7.75   a worded question
//   ?reveal=1          show the answers
//
// What is not given follows the ceiling: grow = ceiling / 76, the fraction
// ceiling keeps its 36 : 50 ratio, and a worded question sits ÷ 1.25 below
// the maths.

preloadKatex();

const SLOT_COLORS = ['var(--slot-1)', 'var(--slot-2)', 'var(--slot-3)', 'var(--slot-4)'];
const FRAMES = [[1366, 768], [1920, 1080]];

// [skill, band] for each of the four boxes.
const BOARDS = {
  a: {
    title: 'A logarithm, an algebraic fraction, a worded statistics question, short arithmetic',
    boxes: [['evaluate-logs', 'foundation'], ['add-algebraic-fractions', 'core'], ['relative-frequency', 'foundation'], ['order-of-operations', 'core']],
  },
  b: {
    title: 'Three-line simultaneous equations, a lone fraction, a set expression beside a Venn diagram, a worded question',
    boxes: [['symbol-puzzle', 'stretch'], ['simplify-algebraic-fractions', 'foundation'], ['venn-set-operations', 'stretch'], ['forming-equations', 'core']],
  },
  c: {
    title: 'Four short questions',
    boxes: [['fdp-conversions', 'foundation'], ['evaluate-logs', 'foundation'], ['log-solve-exponential', 'foundation'], ['log-equations', 'foundation']],
  },
};

const num = (p, k) => (p.has(k) && p.get(k) !== '' && Number.isFinite(Number(p.get(k))) ? Number(p.get(k)) : undefined);

function rangesFrom(search) {
  const p = new URLSearchParams(search);
  const floor = num(p, 'floor') ?? Q_RANGE.floor;
  const spread = num(p, 'spread');
  const ceiling = num(p, 'ceil') ?? (spread ? Math.round(floor * spread) : Q_RANGE.ceiling);
  const q = {
    floor,
    floor3: num(p, 'floor3') ?? Q_RANGE.floor3,
    ceiling,
    fraction: num(p, 'frac') ?? Math.round(ceiling * (Q_RANGE.fraction / Q_RANGE.ceiling)),
    compactCap: num(p, 'compact') ?? Q_RANGE.compactCap,
    grow: num(p, 'grow') ?? (ceiling === Q_RANGE.ceiling ? Q_RANGE.grow : ceiling / 76),
  };
  const pr = {
    floor: num(p, 'pfloor') ?? (floor === Q_RANGE.floor ? P_RANGE.floor : Math.round(floor / 1.25)),
    grow: num(p, 'pgrow') ?? P_RANGE.grow,
    ceiling: num(p, 'pceil') ?? (ceiling === Q_RANGE.ceiling ? P_RANGE.ceiling : Math.round(ceiling / 1.25)),
  };
  return { q, p: pr };
}

const makeBoards = () => Object.fromEntries(Object.entries(BOARDS).map(([key, b]) => [
  key,
  b.boxes.map(([id, band]) => ({ id, band, label: getSkill(id)?.topic ?? id, data: boxView(id, band) })),
]));

// One board, full screen: what each iframe shows.
function FrameBoard({ boardKey, boxes, reveal, range }) {
  const noop = () => {};
  return (
    <SizeRange.Provider value={range}>
      <div className="board" data-board={boardKey}>
        <Header
          poolSummary="Size test" onOpenPool={noop}
          diffLabel="Mixed" onDiffUp={noop} onDiffDown={noop}
          clock="05:00" clockExpired={false} onClockChange={noop} onClockFocus={noop}
          onAddMinute={noop} onSubMinute={noop} timerRunning={false} onToggleTimer={noop}
          onRegenAll={noop} revealed={reveal} onToggleReveal={noop} onFullscreen={noop} onPrint={noop}
        />
        <main className="board-main">
          {boxes.map((b, i) => (
            <Slot
              key={i}
              label={b.label}
              colorVar={SLOT_COLORS[i]}
              data={b.data}
              revealed={reveal}
              onRegenSame={noop} onRegen={noop} onSwap={noop}
            />
          ))}
        </main>
      </div>
    </SizeRange.Provider>
  );
}

export default function SizeTestPage() {
  const params = new URLSearchParams(window.location.search);
  const frameBoard = params.get('board');
  const reveal = params.get('reveal') === '1';
  const range = rangesFrom(window.location.search);

  // A frame takes the parent's questions, so both screen sizes match; opened
  // on its own (full size, from the link) it draws its own.
  const boards = useMemo(() => {
    if (frameBoard) {
      try {
        if (window.parent !== window && window.parent.__sizeTestBoards) return window.parent.__sizeTestBoards;
      } catch { /* not same-origin: draw our own */ }
    }
    const b = makeBoards();
    window.__sizeTestBoards = b;
    return b;
  }, [frameBoard]);

  if (frameBoard) {
    return <FrameBoard boardKey={frameBoard} boxes={boards[frameBoard]} reveal={reveal} range={range} />;
  }

  const base = window.location.search ? `${window.location.search}&` : '?';
  const scale = 0.42;
  const spread = (range.q.ceiling / Math.min(range.q.floor3, range.q.floor)).toFixed(2);
  return (
    <div style={{ padding: 16, background: 'var(--ground)', color: 'var(--ink)', fontFamily: 'Archivo, sans-serif' }}>
      <h1 style={{ fontSize: 20, margin: '0 0 6px' }}>Question size range: mixed boards</h1>
      <p style={{ margin: '0 0 4px', fontSize: 14 }}>
        Maths {range.q.floor3}/{range.q.floor}–{range.q.ceiling}px (spread {spread} : 1), lone fraction ≤ {range.q.fraction}px,
        compact ≤ {range.q.compactCap}px, grow {range.q.grow.toFixed(3)} · Worded {range.p.floor}px, {range.p.grow}cqh, ≤ {range.p.ceiling}px
      </p>
      <p style={{ margin: '0 0 16px', fontSize: 13 }}>
        Try <a href="?spread=1.5">?spread=1.5</a> · <a href="?spread=1.75">1.75</a> · <a href="?spread=2">2.0</a> ·{' '}
        <a href="?">defaults</a> · <a href={`${base}reveal=1`}>answers</a>. Reload for new numbers.
      </p>
      {Object.entries(BOARDS).map(([key, b]) => (
        <section key={key} style={{ marginBottom: 28 }}>
          <h2 style={{ fontSize: 16, margin: '0 0 8px' }}>{key}) {b.title}</h2>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'flex-start' }}>
            {FRAMES.map(([w, h]) => (
              <figure key={w} style={{ margin: 0 }}>
                <figcaption style={{ fontSize: 13, marginBottom: 4 }}>
                  {w} × {h} · <a href={`${base}board=${key}`} target="_blank" rel="noreferrer">open</a>
                </figcaption>
                <div style={{ width: w * scale, height: h * scale, overflow: 'hidden', outline: '1px solid var(--hairline)' }}>
                  <iframe
                    title={`Board ${key} at ${w} × ${h}`}
                    src={`${base}board=${key}`}
                    width={w}
                    height={h}
                    style={{ border: 0, transform: `scale(${scale})`, transformOrigin: '0 0' }}
                  />
                </div>
              </figure>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
