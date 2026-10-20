import { useCallback, useEffect, useRef, useState } from 'react';
import Header from './Header.jsx';
import Slot from './Slot.jsx';
import TopicPanel from './TopicPanel.jsx';
import { generateForSkill, getSkill, skillsInTopic, nextSkillInTopic, topics, strandOf, ALL_KATEX_STRANDS } from '../curriculum/skills.js';
import { loadPool, savePool, togglePool, drawBoxTopics, pickSwapTopic } from '../curriculum/topicPool.js';
import { parseArchivoLine } from '../lib/archivoMath.jsx';
import { preloadKatex } from '../lib/katexLoader.js';
import './Board.css';

const SLOT_COLORS = ['var(--slot-1)', 'var(--slot-2)', 'var(--slot-3)', 'var(--slot-4)'];
const DIFF = ['Foundation', 'Core', 'Stretch', 'Mixed'];
const BANDS = ['foundation', 'core', 'stretch'];
// In Mixed the four boxes ramp in reading order, so the last box is always the
// hard one. Fixed rather than random: a teacher should be able to say "box 4
// is the stretch" and be right every time.
const MIXED = ['foundation', 'core', 'core', 'stretch'];
// The board opens on Core (an index into DIFF).
const INITIAL_DIFF = 1;
const bandFor = (diff, i) => (diff === 3 ? MIXED[i] : BANDS[diff]);

// A line the Archivo parser cannot take falls back to KaTeX (SPEC.md §6).
// Square roots and every exponent or subscript except ^\circ fall back by
// design, so they are skipped here; so is the all-KaTeX Number strand, which
// never meets the parser. Anything else logging here is either a parser gap
// or a generator using notation outside the subset.
const DELIBERATE_FALLBACK = /\\sqrt|_|\^(?!\\circ)/;

function warnIfUnparseable(id, field, text) {
  if (!text) return;
  String(text).split('\n').forEach((line, i) => {
    if (DELIBERATE_FALLBACK.test(line)) return;
    if (parseArchivoLine(line, 'chk') === null) {
      console.warn(`[${id}] ${field}${i ? ` line ${i}` : ''} fell back to KaTeX: ${line}`);
    }
  });
}

// answerUnits is either LaTeX ('\\text{cm}^3', passed through) or a plain
// word ('cm'), which is wrapped in \text{} so it does not render as the
// italic product c·m.
const unitsTex = (u) => (u.includes('\\') ? u : `\\text{${u}}`);

function slotData(skillId, band) {
  const q = generateForSkill(skillId, band);
  if (!q) return { topic: '—', instr: '', q: '', a: '' };

  const allKatex = ALL_KATEX_STRANDS.includes(strandOf(getSkill(skillId)?.topic));
  if (!allKatex) {
    warnIfUnparseable(skillId, 'questionMath', q.questionMath);
    warnIfUnparseable(skillId, 'answer', q.answer);
  }

  return {
    topic: getSkill(skillId)?.label ?? skillId,
    instr: q.instruction,
    q: q.questionMath != null ? q.questionMath : (q.questionText ?? ''),
    qProse: q.questionMath == null && q.questionText != null,
    qCompact: q.questionMathCompact === true,
    allKatex,
    a: q.answerUnits ? `${q.answer}\\text{ }${unitsTex(q.answerUnits)}` : q.answer,
    fig: q.visualization,
  };
}

// A fresh draw: 4 topics at random from the pool (SPEC.md "Design revision:
// topic-level selection (v1)"), each starting at its topic's first skill.
// Used on mount and by "New four" — every draw is independent, no memory of
// the previous one.
function drawBoxes(pool, diff) {
  return drawBoxTopics(pool, topics()).map((topic, i) => {
    const skillId = skillsInTopic(topic)[0];
    return { topic, skillId, data: slotData(skillId, bandFor(diff, i)) };
  });
}

// Re-rolls every box's question at the given difficulty without touching
// topic or skill selection — used by the difficulty stepper (fresh numbers
// at the new band, same skills).
function refreshBoxes(boxes, diff) {
  return boxes.map((b, i) => ({ ...b, data: slotData(b.skillId, bandFor(diff, i)) }));
}

export default function Board() {
  const [state, setState] = useState({
    boxes: [],
    pool: [],
    revealed: false,
    diff: INITIAL_DIFF,
    seconds: 300,
    running: false,
  });
  const [panelOpen, setPanelOpen] = useState(false);

  const { boxes, revealed, diff, seconds, running, pool } = state;

  // Questions are generated here in the handlers, from the current state,
  // never inside a setState updater: React runs updaters twice in development
  // (StrictMode), which generated every question twice. An updater only
  // merges in what the handler has already built.
  const setBox = (i, box) => setState((s) => {
    const next = s.boxes.slice();
    next[i] = box;
    return { ...s, boxes: next };
  });

  const regenAll = useCallback(() => {
    const fresh = drawBoxes(pool, diff);
    setState((s) => ({ ...s, revealed: false, boxes: fresh }));
  }, [pool, diff]);

  const regenOne = (i) => {
    const { topic, skillId: current } = boxes[i];
    const skillId = nextSkillInTopic(topic, current);
    setBox(i, { topic, skillId, data: slotData(skillId, bandFor(diff, i)) });
  };

  const regenSame = (i) => {
    const { topic, skillId } = boxes[i];
    setBox(i, { topic, skillId, data: slotData(skillId, bandFor(diff, i)) });
  };

  const swapOne = (i) => {
    const otherTopics = boxes.filter((_b, idx) => idx !== i).map((b) => b.topic);
    const topic = pickSwapTopic(pool, topics(), boxes[i].topic, otherTopics);
    const skillId = skillsInTopic(topic)[0];
    setBox(i, { topic, skillId, data: slotData(skillId, bandFor(diff, i)) });
  };

  const setDiff = (delta) => {
    const next = Math.min(DIFF.length - 1, Math.max(0, diff + delta));
    const fresh = refreshBoxes(boxes, next);
    setState((s) => ({ ...s, diff: next, revealed: false, boxes: fresh }));
  };

  // Toggling only changes the pool; it takes effect on the next fresh draw
  // ("New four", or a future mount) rather than immediately reshuffling the
  // board while the teacher is still adjusting the set. The panel stays open
  // on tap so multiple topics can be toggled in one visit.
  const changePool = (next) => {
    savePool(next);
    setState((s) => ({ ...s, pool: next }));
  };
  const toggleTopic = (topicName) => changePool(togglePool(pool, topicName));
  const selectAllTopics = () => changePool(topics());
  const selectNoneTopics = () => changePool([]);

  // Fetch KaTeX up front rather than on the first surd — most boards hit it.
  useEffect(() => { preloadKatex(); }, []);

  // StrictMode also mounts effects twice in development. The ref keeps the
  // first board from being thrown away and drawn again.
  const drawn = useRef(false);
  useEffect(() => {
    if (drawn.current) return;
    drawn.current = true;
    const saved = loadPool();
    const first = drawBoxes(saved, INITIAL_DIFF);
    setState((s) => ({ ...s, pool: saved, boxes: first }));
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
            data={boxes[i]?.data || { topic: '—', instr: '', q: '', a: '' }}
            revealed={revealed}
            onRegenSame={() => regenSame(i)}
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
