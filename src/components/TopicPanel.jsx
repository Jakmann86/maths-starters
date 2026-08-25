import { skillIds, getSkill } from '../curriculum/skills.js';
import './TopicPanel.css';

// Temporary heuristic for grouping the catalogue in this panel. Real
// chapter-based grouping arrives with the scheme screen (SPEC.md §4); until
// then a skill's own `group` field wins if it has one, and everything else
// is bucketed by a guess at its id.
function groupFor(id, skill) {
  if (skill?.group) return skill.group;
  if (id.startsWith('expand') || id.startsWith('difference-of-two-squares')) return 'Expanding';
  if (id.startsWith('factorise')) return 'Factorising';
  if (id.startsWith('solve') || id.startsWith('forming')) return 'Equations';
  if (id.startsWith('pythagoras')) return 'Geometry';
  if (id.includes('magic') || id.includes('puzzle')) return 'Puzzles';
  return 'Other';
}

const GROUP_ORDER = ['Expanding', 'Factorising', 'Equations', 'Geometry', 'Puzzles', 'Other'];

function buildGroups() {
  const byGroup = new Map();
  skillIds.forEach((id) => {
    const group = groupFor(id, getSkill(id));
    if (!byGroup.has(group)) byGroup.set(group, []);
    byGroup.get(group).push(id);
  });
  return GROUP_ORDER.filter((name) => byGroup.has(name)).map((name) => ({ name, ids: byGroup.get(name) }));
}

const GROUPS = buildGroups();

export default function TopicPanel({ open, selected, onToggle, onSelectAll, onSelectNone, onClose }) {
  if (!open) return null;

  return (
    <div className="topic-panel-overlay">
      <div className="topic-panel-sheet">
        <div className="topic-panel-header">
          <div>
            <div className="topic-panel-eyebrow">Choose the pool</div>
            <div className="topic-panel-title">Topics they have covered</div>
          </div>
          <span className="topic-panel-spacer" />
          <button type="button" className="topic-panel-btn" onClick={onSelectAll}>All</button>
          <button type="button" className="topic-panel-btn" onClick={onSelectNone}>None</button>
          <button type="button" className="topic-panel-btn topic-panel-btn--primary" onClick={onClose}>Done</button>
        </div>

        <div className="topic-panel-body">
          {GROUPS.map((group) => (
            <div key={group.name} className="topic-group">
              <div className="topic-group-label">{group.name}</div>
              <div className="topic-grid">
                {group.ids.map((id) => {
                  const isSelected = selected.includes(id);
                  return (
                    <button
                      key={id}
                      type="button"
                      className={`topic-row${isSelected ? ' is-selected' : ''}`}
                      onClick={() => onToggle(id)}
                    >
                      <span className={`topic-tick${isSelected ? ' is-checked' : ''}`}>
                        {isSelected ? '✓' : ''}
                      </span>
                      {getSkill(id)?.label ?? id}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
