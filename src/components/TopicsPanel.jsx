export default function TopicsPanel({ open, groups, onSelectAll, onSelectNone, onClose }) {
  if (!open) return null;

  return (
    <div className="panel-backdrop">
      <div className="panel">
        <div className="panel-header">
          <div>
            <div className="panel-heading-label">Choose the pool</div>
            <div className="panel-heading-title">Topics they have covered</div>
          </div>
          <span className="panel-spacer" />
          <button type="button" className="panel-btn" onClick={onSelectAll}>All</button>
          <button type="button" className="panel-btn" onClick={onSelectNone}>None</button>
          <button type="button" className="panel-btn-primary" onClick={onClose}>Done</button>
        </div>

        <div className="panel-body">
          {groups.map((g) => (
            <div className="panel-group" key={g.name}>
              <div className="panel-group-title">{g.name}</div>
              <div className="panel-grid">
                {g.items.map((t) => (
                  <button
                    type="button"
                    key={t.id}
                    className={`panel-item${t.on ? ' is-on' : ''}`}
                    onClick={t.toggle}
                  >
                    <span className={`panel-tick${t.on ? ' is-on' : ''}`}>{t.on ? '✓' : ''}</span>
                    {t.name}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
