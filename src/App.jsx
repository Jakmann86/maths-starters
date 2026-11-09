import Board from './components/Board.jsx';
import ErrorBoundary from './components/ErrorBoundary.jsx';

// The last line of defence: anything the boxes' own boundaries do not catch
// (the header, the topic panel) shows a reload button rather than a blank
// page.
function Crashed() {
  return (
    <div className="app-crashed">
      <p>Something went wrong with the board.</p>
      <button type="button" onClick={() => window.location.reload()}>Reload</button>
    </div>
  );
}

function App() {
  return (
    <ErrorBoundary name="board" fallback={<Crashed />}>
      <Board />
    </ErrorBoundary>
  );
}

export default App;
