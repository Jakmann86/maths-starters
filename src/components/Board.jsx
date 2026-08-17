import { useEffect, useState } from 'react';
import Header from './Header.jsx';
import Slot from './Slot.jsx';
import TopicsPanel from './TopicsPanel.jsx';
import { TOPICS } from '../lib/placeholderTopics.js';
import { pick } from '../lib/random.js';
import './Board.css';

const SLOTS = ['Last lesson', 'Last week', 'Last topic', 'Last year'];
const SLOT_COLORS = ['var(--slot-1)', 'var(--slot-2)', 'var(--slot-3)', 'var(--slot-4)'];
const DIFF = ['Foundation', 'Core', 'Stretch'];

function pool(selected) {
  const p = TOPICS.filter((t) => selected.includes(t.id));
  return p.length ? p : TOPICS;
}

function build(selected, diff, i, avoid, used) {
  const p = pool(selected);
  const taken = (used || []).concat(avoid ? [avoid] : []).filter(Boolean);
  const unused = p.filter((t) => !taken.includes(t.id));
  const notAvoided = p.filter((t) => t.id !== avoid);
  const choices = unused.length ? unused : notAvoided.length ? notAvoided : p;
  const t = pick(choices);
  return { slot: SLOTS[i], topicId: t.id, topic: t.name, ...t.gen(diff + 1) };
}

function fourFresh(selected, diff) {
  const used = [];
  return SLOTS.map((_, i) => {
    const b = build(selected, diff, i, null, used);
    used.push(b.topicId);
    return b;
  });
}

export default function Board() {
  const [state, setState] = useState({
    selected: TOPICS.map((t) => t.id),
    slots: [],
    revealed: false,
    diff: 1,
    seconds: 300,
    running: false,
    panelOpen: false,
  });

  const regenAll = () => setState((s) => ({ ...s, revealed: false, slots: fourFresh(s.selected, s.diff) }));

  const regenOne = (i) => setState((s) => {
    const slots = s.slots.slice();
    const t = TOPICS.find((x) => x.id === slots[i].topicId);
    slots[i] = { slot: SLOTS[i], topicId: t.id, topic: t.name, ...t.gen(s.diff + 1) };
    return { ...s, slots };
  });

  const swapOne = (i) => setState((s) => {
    const slots = s.slots.slice();
    slots[i] = build(s.selected, s.diff, i, slots[i].topicId, slots.map((x) => x.topicId));
    return { ...s, slots };
  });

  const toggleTopic = (id) => setState((s) => ({
    ...s,
    selected: s.selected.includes(id) ? s.selected.filter((x) => x !== id) : s.selected.concat(id),
  }));

  const setDiff = (delta) => setState((s) => {
    const diff = Math.min(2, Math.max(0, s.diff + delta));
    const slots = s.slots.map((sl, i) => {
      const t = TOPICS.find((x) => x.id === sl.topicId);
      return { slot: SLOTS[i], topicId: t.id, topic: t.name, ...t.gen(diff + 1) };
    });
    return { ...s, diff, slots, revealed: false };
  });

  useEffect(() => {
    setState((s) => ({ ...s, slots: fourFresh(s.selected, s.diff) }));
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

  const { selected, slots, revealed, diff, seconds, running, panelOpen } = state;

  const strands = [...new Set(TOPICS.map((t) => t.strand))];
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

  const groups = strands.map((name) => ({
    name,
    items: TOPICS.filter((t) => t.strand === name).map((t) => ({
      id: t.id,
      name: t.name,
      on: selected.includes(t.id),
      toggle: () => toggleTopic(t.id),
    })),
  }));

  return (
    <div className="board">
      <Header
        topicSummary={selected.length === TOPICS.length ? 'All topics' : `${selected.length} of ${TOPICS.length} selected`}
        onOpenPanel={() => setState((s) => ({ ...s, panelOpen: true }))}
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
            onSwap={() => swapOne(i)}
          />
        ))}
      </main>

      <TopicsPanel
        open={panelOpen}
        groups={groups}
        onSelectAll={() => setState((s) => ({ ...s, selected: TOPICS.map((t) => t.id) }))}
        onSelectNone={() => setState((s) => ({ ...s, selected: [] }))}
        onClose={() => setState((s) => ({ ...s, panelOpen: false }))}
      />
    </div>
  );
}
