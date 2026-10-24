import { useEffect, useState } from 'react';
import './MathDisplay.css';
import { loadKatex, loadedKatex } from '../lib/katexLoader.js';

// Maths renderer — see DESIGN.md §"Maths rendering" and SPEC.md §6. Every
// question and answer line is set in KaTeX, so the board's maths reads in one
// typeface whatever the topic.
//
// displayMode: true — a text-style (inline) fraction sets its numerator and
// denominator in \scriptstyle, ~30% smaller than the surrounding text. On a
// whiteboard that reads as "the fraction is tiny" even when the container
// itself is sized generously. Display style keeps them full-size.
// MathDisplay.css neutralises the block/centred/margined layout KaTeX
// normally pairs this with.
function toHtml(katex, tex) {
  try {
    return katex.renderToString(tex, { throwOnError: false, displayMode: true });
  } catch {
    return null;
  }
}

function KatexLine({ tex }) {
  const [state, setState] = useState(() => (
    loadedKatex() ? { tex, html: toHtml(loadedKatex(), tex) } : { tex, html: undefined }
  ));
  const current = state.tex === tex
    ? state
    : { tex, html: loadedKatex() ? toHtml(loadedKatex(), tex) : undefined };

  useEffect(() => {
    if (loadedKatex()) return undefined;
    let cancelled = false;
    loadKatex()
      .then((katex) => { if (!cancelled) setState({ tex, html: toHtml(katex, tex) }); })
      .catch(() => { if (!cancelled) setState({ tex, html: null }); });
    return () => { cancelled = true; };
  }, [tex]);

  if (current.html === null) return <span className="mkatex-error" title="KaTeX failed to load">⚠ {tex}</span>;
  if (current.html === undefined) return <span className="mkatex-pending">{tex}</span>;
  // eslint-disable-next-line react/no-danger -- KaTeX's own escaped output, not user input
  return <span className="mkatex" dangerouslySetInnerHTML={{ __html: current.html }} />;
}

export default function MathDisplay({ math }) {
  const raw = String(math == null ? '' : math);
  const lines = raw.split('\n');
  if (lines.length === 1) return <KatexLine tex={lines[0]} />;
  return lines.map((l, i) => (
    <div key={'L' + i} className="mline"><KatexLine tex={l} /></div>
  ));
}
