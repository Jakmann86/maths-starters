import { useEffect, useState } from 'react';
import Header from './Header.jsx';
import Slot from './Slot.jsx';
import { generateForSkill, getSkill } from '../curriculum/skills.js';
import { parseArchivoLine } from '../lib/archivoMath.jsx';
import './Board.css';

const SLOTS = ['Last lesson', 'Last week', 'Last topic', 'Last year'];
const SLOT_COLORS = ['var(--slot-1)', 'var(--slot-2)', 'var(--slot-3)', 'var(--slot-4)'];
const DIFF = ['Foundation', 'Core', 'Stretch'];
const BANDS = ['foundation', 'core', 'stretch'];

// Hardcoded until resolveSlots (SPEC.md §4) picks a skill per box from the
// scheme and class position. One fixed skill per box for now.
const SKILL_IDS = [
  'expand-single-brackets',
  'expand-double-brackets',
  'difference-of-two-squares',
  'expand-perfect-square',
];

// These generators (SPEC.md §6) emit only \times, \text{} and ^{}, all of
// which the Archivo parser handles — nothing here should ever reach the
// KaTeX fallback. A null means the parser can't take output it's supposed
// to, which is a parser bug, not expected behaviour.
function warnIfUnparseable(id, field, text) {
  if (!text) return;
  String(text).split('\n').forEach((line, i) => {
    if (parseArchivoLine(line, 'chk') === null) {
      console.warn(`[${id}] ${field}${i ? ` line ${i}` : ''} fell back to KaTeX: ${line}`);
    }
  });
}

function slotData(i, band) {
  const id = SKILL_IDS[i];
  const q = generateForSkill(id, band);
  if (!q) return { slot: SLOTS[i], topic: '—', instr: '', q: '', a: '', w: '' };

  warnIfUnparseable(id, 'questionMath', q.questionMath);
  warnIfUnparseable(id, 'answer', q.answer);
  warnIfUnparseable(id, 'workingOut', q.workingOut);

  return {
    slot: SLOTS[i],
    topic: getSkill(id)?.label ?? id,
    instr: q.instruction,
    q: q.questionMath,
    a: q.answer,
    w: q.workingOut,
  };
}

function fourFresh(band) {
  return SLOTS.map((_, i) => slotData(i, band));
}

export default function Board() {
  const [state, setState] = useState({
    slots: [],
    revealed: false,
    diff: 1,
    seconds: 300,
    running: false,
  });

  const regenAll = () => setState((s) => ({ ...s, revealed: false, slots: fourFresh(BANDS[s.diff]) }));

  const regenOne = (i) => setState((s) => {
    const slots = s.slots.slice();
    slots[i] = slotData(i, BANDS[s.diff]);
    return { ...s, slots };
  });

  const setDiff = (delta) => setState((s) => {
    const diff = Math.min(2, Math.max(0, s.diff + delta));
    return { ...s, diff, slots: fourFresh(BANDS[diff]), revealed: false };
  });

  useEffect(() => {
    setState((s) => ({ ...s, slots: fourFresh(BANDS[s.diff]) }));
  }, []);

  useEffect(() => {
    const id = setInterval(() => {
      setState((s) => (s.running && s.seconds > 0 ? { ...s, seconds: s.seconds - 1 } : s));
    }, 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const handler = (e) => {
      if (e.target && e.target.tagName === 'INPUT') return;
      if (e.code === 'Space') {
        e.preventDefault();
        setState((s) => ({ ...s, revealed: !s.revealed }));
      }
      if (e.key === 'r') regenAll();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  const { slots, revealed, diff, seconds, running } = state;
  const mm = String(Math.floor(seconds / 60)).padStart(2, '0');
  const ss = String(seconds % 60).padStart(2, '0');

  const handleClockChange = (e) => {
    const raw = String(e.target.value).replace(/[^0-9:]/g, '');
    const parts = raw.split(':');
    const secs = parts.length > 1
      ? parseInt(parts[0] || '0', 10) * 60 + parseInt(parts[1] || '0', 10)
      : parseInt(parts[0] || '0', 10) * 60;
    setState((s) => ({ ...s, seconds: Math.max(0, Math.min(5999, Number.isNaN(secs) ? 0 : secs)), running: false }));
  };

  const handleClockFocus = (e) => {
    setState((s) => ({ ...s, running: false }));
    e.target.select();
  };

  const handleFullscreen = () => {
    if (document.fullscreenElement) document.exitFullscreen();
    else document.documentElement.requestFullscreen?.();
  };

  return (
    <div className="board">
      <Header
        diffLabel={DIFF[diff]}
        onDiffUp={() => setDiff(1)}
        onDiffDown={() => setDiff(-1)}
        clock={`${mm}:${ss}`}
        clockExpired={seconds === 0}
        onClockChange={handleClockChange}
        onClockFocus={handleClockFocus}
        onAddMinute={() => setState((s) => ({ ...s, seconds: Math.min(5999, s.seconds + 60) }))}
        onSubMinute={() => setState((s) => ({ ...s, seconds: Math.max(0, s.seconds - 60) }))}
        timerRunning={running}
        onToggleTimer={() => setState((s) => ({ ...s, running: !s.running }))}
        onRegenAll={regenAll}
        revealed={revealed}
        onToggleReveal={() => setState((s) => ({ ...s, revealed: !s.revealed }))}
        onFullscreen={handleFullscreen}
      />

      <main className="board-main">
        {SLOTS.map((label, i) => (
          <Slot
            key={label}
            label={label}
            colorVar={SLOT_COLORS[i]}
            data={slots[i] || { topic: '—', instr: '', q: '', a: '', w: '' }}
            revealed={revealed}
            onRegen={() => regenOne(i)}
          />
        ))}
      </main>
    </div>
  );
}
