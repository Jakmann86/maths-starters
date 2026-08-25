import { useCallback, useEffect, useState } from 'react';
import Header from './Header.jsx';
import Slot from './Slot.jsx';
import TopicPanel from './TopicPanel.jsx';
import { generateForSkill, getSkill, skillsInTopic, nextSkillInTopic, topics } from '../curriculum/skills.js';
import { loadPool, savePool, togglePool, drawBoxTopics, pickSwapTopic } from '../curriculum/topicPool.js';
import { parseArchivoLine } from '../lib/archivoMath.jsx';
import './Board.css';

const SLOT_COLORS = ['var(--slot-1)', 'var(--slot-2)', 'var(--slot-3)', 'var(--slot-4)'];
const DIFF = ['Foundation', 'Core', 'Stretch'];
const BANDS = ['foundation', 'core', 'stretch'];

// Most generator output (SPEC.md §6) only ever emits \times, \text{} and
// ^{}, all of which the Archivo parser handles. solve-power-equations at
// stretch band is the one deliberate exception — it emits \sqrt[3]{}, which
// is expected to fall back to KaTeX (DESIGN.md §6). Anything else logging
// here is a parser bug.
function warnIfUnparseable(id, field, text) {
  if (!text) return;
  String(text).split('\n').forEach((line, i) => {
    if (parseArchivoLine(line, 'chk') === null) {
      console.warn(`[${id}] ${field}${i ? ` line ${i}` : ''} fell back to KaTeX: ${line}`);
    }
  });
}

function slotData(skillId, band) {
  const q = generateForSkill(skillId, band);
  if (!q) return { topic: '—', instr: '', q: '', a: '', w: '' };

  warnIfUnparseable(skillId, 'questionMath', q.questionMath);
  warnIfUnparseable(skillId, 'answer', q.answer);
  warnIfUnparseable(skillId, 'workingOut', q.workingOut);

  return {
    topic: getSkill(skillId)?.label ?? skillId,
    instr: q.instruction,
    q: q.questionMath != null ? q.questionMath : (q.questionText ?? ''),
    a: q.answerUnits ? `${q.answer}\\text{ ${q.answerUnits}}` : q.answer,
    w: q.workingOut,
    fig: q.visualization,
  };
}

// A fresh draw: 4 topics at random from the pool (SPEC.md "Design revision:
// topic-level selection (v1)"), each starting at its topic's first skill.
// Used on mount and by "New four" — every draw is independent, no memory of
// the previous one.
function drawBoxes(pool, band) {
  return drawBoxTopics(pool, topics()).map((topic) => {
    const skillId = skillsInTopic(topic)[0];
    return { topic, skillId, data: slotData(skillId, band) };
  });
}

// Re-rolls every box's question at the given band without touching topic or
// skill selection — used by the difficulty stepper (fresh numbers at the
// new band, same skills).
function refreshBoxes(boxes, band) {
  return boxes.map((b) => ({ ...b, data: slotData(b.skillId, band) }));
}

export default function Board() {
  const [state, setState] = useState({
    boxes: [],
    pool: [],
    revealed: false,
    diff: 1,
    seconds: 300,
    running: false,
  });
  const [panelOpen, setPanelOpen] = useState(false);

  const regenAll = useCallback(() => setState((s) => ({
    ...s,
    revealed: false,
    boxes: drawBoxes(s.pool, BANDS[s.diff]),
  })), []);

  const regenOne = (i) => setState((s) => {
    const boxes = s.boxes.slice();
    const { topic, skillId: current } = boxes[i];
    const skillId = nextSkillInTopic(topic, current);
    boxes[i] = { topic, skillId, data: slotData(skillId, BANDS[s.diff]) };
    return { ...s, boxes };
  });

  const swapOne = (i) => setState((s) => {
    const boxes = s.boxes.slice();
    const otherTopics = boxes.filter((_b, idx) => idx !== i).map((b) => b.topic);
    const topic = pickSwapTopic(s.pool, topics(), boxes[i].topic, otherTopics);
    const skillId = skillsInTopic(topic)[0];
    boxes[i] = { topic, skillId, data: slotData(skillId, BANDS[s.diff]) };
    return { ...s, boxes };
  });

  const setDiff = (delta) => setState((s) => {
    const diff = Math.min(2, Math.max(0, s.diff + delta));
    return { ...s, diff, revealed: false, boxes: refreshBoxes(s.boxes, BANDS[diff]) };
  });

  // Toggling only changes the pool; it takes effect on the next fresh draw
  // ("New four", or a future mount) rather than immediately reshuffling the
  // board while the teacher is still adjusting the set. The panel stays open
  // on tap so multiple topics can be toggled in one visit.
  const toggleTopic = (topicName) => setState((s) => {
    const pool = togglePool(s.pool, topicName);
    savePool(pool);
    return { ...s, pool };
  });
  const selectAllTopics = () => setState((s) => {
    const pool = topics();
    savePool(pool);
    return { ...s, pool };
  });
  const selectNoneTopics = () => setState((s) => {
    savePool([]);
    return { ...s, pool: [] };
  });

  useEffect(() => {
    setState((s) => {
      const pool = loadPool();
      return { ...s, pool, boxes: drawBoxes(pool, BANDS[s.diff]) };
    });
  }, []);

  useEffect(() => {
    const id = setInterval(() => {
      setState((s) => (s.running && s.seconds > 0 ? { ...s, seconds: s.seconds - 1 } : s));
    }, 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const handler = (e) => {
      if (panelOpen) return;
      if (e.target && e.target.tagName === 'INPUT') return;
      if (e.code === 'Space') {
        e.preventDefault();
        setState((s) => ({ ...s, revealed: !s.revealed }));
      }
      if (e.key === 'r') regenAll();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [panelOpen, regenAll]);

  const { boxes, revealed, diff, seconds, running, pool } = state;
  const total = topics().length;
  const poolSummary = (pool.length === 0 || pool.length === total)
    ? 'All topics'
    : `${pool.length} topic${pool.length === 1 ? '' : 's'}`;
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
        poolSummary={poolSummary}
        onOpenPool={() => setPanelOpen(true)}
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
        {SLOT_COLORS.map((colorVar, i) => (
          <Slot
            key={i}
            label={boxes[i]?.topic ?? '—'}
            colorVar={colorVar}
            data={boxes[i]?.data || { topic: '—', instr: '', q: '', a: '', w: '' }}
            revealed={revealed}
            onRegen={() => regenOne(i)}
            onSwap={() => swapOne(i)}
          />
        ))}
      </main>

      <TopicPanel
        open={panelOpen}
        selected={pool}
        onToggle={toggleTopic}
        onSelectAll={selectAllTopics}
        onSelectNone={selectNoneTopics}
        onClose={() => setPanelOpen(false)}
      />
    </div>
  );
}
