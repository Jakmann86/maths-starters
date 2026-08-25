import { useState } from 'react';
import { topics, skillsInTopic, getSkill } from '../curriculum/skills.js';
import './TopicPanel.css';

// The pool picker (SPEC.md "Design revision: topic-level selection (v1)").
// Each topic is a multi-select toggle — tapping it adds/removes it from the
// pool without closing the panel, so a teacher can build up a set in one
// visit. The skill list under a topic is informational only (what that
// topic's ↻ will cycle through); expanding it doesn't affect selection.
export default function TopicPanel({ open, selected, onToggle, onSelectAll, onSelectNone, onClose }) {
  const [expanded, setExpanded] = useState(() => new Set());

  if (!open) return null;

  const toggleExpanded = (topic) => setExpanded((prev) => {
    const next = new Set(prev);
    if (next.has(topic)) next.delete(topic);
    else next.add(topic);
    return next;
  });

  return (
    <div className="topic-panel-overlay">
      <div className="topic-panel-sheet">
        <div className="topic-panel-header">
          <div>
            <div className="topic-panel-eyebrow">Choose the pool</div>
            <div className="topic-panel-title">Topics in play</div>
          </div>
          <span className="topic-panel-spacer" />
          <button type="button" className="topic-panel-btn" onClick={onSelectAll}>All</button>
          <button type="button" className="topic-panel-btn" onClick={onSelectNone}>None</button>
          <button type="button" className="topic-panel-btn topic-panel-btn--primary" onClick={onClose}>Done</button>
        </div>

        <div className="topic-panel-body">
          {topics().map((topic) => {
            const isSelected = selected.includes(topic);
            const isExpanded = expanded.has(topic);
            return (
              <div key={topic} className="topic-group">
                <div className="topic-header-row">
                  <button
                    type="button"
                    className={`topic-toggle${isSelected ? ' is-selected' : ''}`}
                    onClick={() => onToggle(topic)}
                  >
                    <span className={`topic-tick${isSelected ? ' is-checked' : ''}`}>
                      {isSelected ? '✓' : ''}
                    </span>
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
                  <div className="topic-skill-list">
                    {skillsInTopic(topic).map((id) => (
                      <div key={id} className="topic-skill-row">{getSkill(id)?.label ?? id}</div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
