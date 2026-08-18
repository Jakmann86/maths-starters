export default function Header({
  diffLabel, onDiffUp, onDiffDown,
  clock, clockExpired, onClockChange, onClockFocus,
  onAddMinute, onSubMinute, timerRunning, onToggleTimer,
  onRegenAll, revealed, onToggleReveal, onFullscreen,
}) {
  return (
    <header className="board-header">
      <div className="header-half">
        <div className="header-seg">
          <div className="header-label">Starter bank</div>
          <div className="header-value">Four in a row</div>
        </div>

        <div className="header-seg header-seg--diff">
          <div className="header-label">Difficulty</div>
          <div className="diff-stepper">
            <button type="button" className="diff-btn" onClick={onDiffDown}>−</button>
            <div className="diff-value">{diffLabel}</div>
            <button type="button" className="diff-btn" onClick={onDiffUp}>+</button>
          </div>
        </div>
      </div>

      <div className="header-half header-half--right">
        <div className="timer-block">
          <div className="timer-field">
            <div className="header-label">Timer</div>
            <input
              className={`timer-input${clockExpired ? ' is-expired' : ''}`}
              value={clock}
              onChange={onClockChange}
              onFocus={onClockFocus}
              aria-label="Timer, minutes and seconds"
            />
          </div>
          <div className="timer-steppers">
            <button type="button" className="timer-step-btn" title="Add a minute" onClick={onAddMinute}>+</button>
            <button type="button" className="timer-step-btn" title="Take a minute off" onClick={onSubMinute}>−</button>
          </div>
          <button type="button" className="timer-toggle" onClick={onToggleTimer}>
            {timerRunning ? 'Pause' : 'Start'}
          </button>
        </div>

        <button type="button" className="new-four-btn" onClick={onRegenAll}>New four</button>

        <button type="button" className={`reveal-btn${revealed ? ' is-revealed' : ''}`} onClick={onToggleReveal}>
          {revealed ? 'Hide answers' : 'Show answers'}
        </button>

        <button type="button" className="fullscreen-btn" title="Full screen" onClick={onFullscreen}>⛶</button>
      </div>
    </header>
  );
}
