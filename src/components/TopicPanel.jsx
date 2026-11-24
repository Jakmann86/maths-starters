import { useEffect, useState } from 'react';
import { topicGroups, skillsInTopic, getSkill } from '../curriculum/skills.js';
import { columnCount, packStrands } from '../curriculum/topicPool.js';
import './TopicPanel.css';

// The pool picker (SPEC.md §2.3, §7.2). A full-screen sheet with every topic
// on it at once: the strands laid out as columns, so a topic is found by
// looking, not scrolling. Each topic is a toggle tile; tapping adds it to or
// removes it from the pool and the sheet stays open. A strand's heading
// chooses or clears that whole strand. The + beside a topic lists its skills
// (what that topic's ↻ cycles through); it does not change the selection.

export default function TopicPanel({ open, selected, onToggle, onSetMany, onSelectAll, onSelectNone, onClose }) {
  const [expanded, setExpanded] = useState(() => new Set());
  const [width, setWidth] = useState(() => (typeof window === 'undefined' ? 1920 : window.innerWidth));

  useEffect(() => {
    const onResize = () => setWidth(window.innerWidth);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  if (!open) return null;

  const toggleExpanded = (topic) => setExpanded((prev) => {
    const next = new Set(prev);
    if (next.has(topic)) next.delete(topic);
    else next.add(topic);
    return next;
  });

  const columns = packStrands(topicGroups(), columnCount(width));
  const count = selected.length;

  return (
    <div className="topic-panel-overlay">
      <div className="topic-panel-sheet">
        <div className="topic-panel-header">
          <div>
            <div className="topic-panel-eyebrow">Choose the pool</div>
            <div className="topic-panel-title">
              Topics <span className="topic-panel-count">{count ? `${count} chosen` : 'none chosen'}</span>
            </div>
          </div>
          <span className="topic-panel-spacer" />
          <button type="button" className="topic-panel-btn" onClick={onSelectAll}>All</button>
          <button type="button" className="topic-panel-btn" onClick={onSelectNone}>Clear</button>
          <button type="button" className="topic-panel-btn topic-panel-btn--primary" onClick={onClose}>Done</button>
        </div>

        {count === 0 && (
          // An empty pool draws from every topic (topicPool.js). Saying so
          // here, rather than ticking every box, keeps the first tap meaning
          // "this one".
          <div className="topic-panel-note">
            Nothing chosen, so the board draws from every topic. Tap the topics you want.
          </div>
        )}

        <div className="topic-panel-body" style={{ '--cols': columns.length }}>
          {columns.map((groups, ci) => (
            <div key={ci} className="topic-column">
              {groups.map((group) => {
                const allOn = group.topics.every((t) => selected.includes(t));
                return (
                  <section key={group.name} className="topic-strand">
                    <div className="topic-strand-head">
                      <span className="topic-strand-label">{group.name}</span>
                      <button
                        type="button"
                        className="topic-strand-all"
                        onClick={() => onSetMany(group.topics, !allOn)}
                      >
                        {allOn ? 'none' : 'all'}
                      </button>
                    </div>
                    {group.topics.map((topic) => {
                      const isSelected = selected.includes(topic);
                      const isExpanded = expanded.has(topic);
                      return (
                        <div key={topic} className={`topic-item${isSelected ? ' is-selected' : ''}`}>
                          <div className="topic-tile">
                            <button
                              type="button"
                              className="topic-toggle"
                              aria-pressed={isSelected}
                              onClick={() => onToggle(topic)}
                            >
                              <span className="topic-tick">{isSelected ? '✓' : ''}</span>
                              <span className="topic-name">{topic}</span>
                            </button>
                            <button
                              type="button"
                              className="topic-expand-btn"
                              onClick={() => toggleExpanded(topic)}
                              aria-expanded={isExpanded}
                              aria-label={`${isExpanded ? 'Hide' : 'Show'} ${topic} skills`}
                            >
                              {isExpanded ? '−' : '+'}
                            </button>
                          </div>
                          {isExpanded && (
                            <ol className="topic-skill-list">
                              {skillsInTopic(topic).map((id) => (
                                <li key={id} className="topic-skill-row">{getSkill(id)?.label ?? id}</li>
                              ))}
                            </ol>
                          )}
                        </div>
                      );
                    })}
                  </section>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
