import { useEffect, useState } from 'react';
import './MathDisplay.css';
import { parseArchivoLine } from '../lib/archivoMath.jsx';
import { loadKatex, loadedKatex } from '../lib/katexLoader.js';

// Hybrid maths renderer — see DESIGN.md §"Maths rendering" and SPEC.md §6.
// The Archivo parser (src/lib/archivoMath.js) handles the common cases and
// keeps everything in the display typeface. When it returns null for a
// line — an unknown \command, a \frac nested two or more levels deep, or an
// indexed root — that line falls back to KaTeX. `allKatex` skips the parser
// altogether: the Number strand renders every line in KaTeX, so a board of
// surds and percentages doesn't switch typeface from box to box.
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

function KatexFallback({ tex }) {
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

function renderLine(text, keyBase, allKatex) {
  const nodes = allKatex ? null : parseArchivoLine(text, keyBase);
  if (nodes === null) return <KatexFallback key={keyBase} tex={text} />;
  return nodes;
}

export default function MathDisplay({ math, allKatex = false }) {
  const raw = String(math == null ? '' : math);
  const lines = raw.split('\n');
  if (lines.length === 1) return renderLine(lines[0], 'm', allKatex);
  return lines.map((l, i) => (
    <div key={'L' + i} className="mline">{renderLine(l, 'm' + i, allKatex)}</div>
  ));
}
