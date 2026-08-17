import { useEffect, useState } from 'react';
import './MathDisplay.css';
import { parseArchivoLine } from '../lib/archivoMath.jsx';

// Hybrid maths renderer — see DESIGN.md §"Maths rendering" and SPEC.md §6.
// The Archivo parser (src/lib/archivoMath.js) handles the common cases and
// keeps everything in the display typeface. When it returns null for a
// line — an unknown \command, a \frac nested two or more levels deep, or an
// indexed root — that line falls back to KaTeX, dynamically imported so it
// costs nothing on boards that never hit a fallback.

let katexPromise = null;
function loadKatex() {
  if (!katexPromise) {
    katexPromise = Promise.all([
      import('katex'),
      import('katex/dist/katex.min.css'),
    ]).then(([mod]) => mod.default ?? mod);
  }
  return katexPromise;
}

function KatexFallback({ tex }) {
  const [html, setHtml] = useState(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setHtml(null);
    setFailed(false);
    loadKatex()
      .then((katex) => {
        if (cancelled) return;
        try {
          setHtml(katex.renderToString(tex, { throwOnError: false, displayMode: false }));
        } catch {
          setFailed(true);
        }
      })
      .catch(() => {
        if (cancelled) return;
        setFailed(true);
      });
    return () => { cancelled = true; };
  }, [tex]);

  if (failed) return <span className="mkatex-error" title="KaTeX failed to load">⚠ {tex}</span>;
  if (html == null) return <span className="mkatex-pending">{tex}</span>;
  // eslint-disable-next-line react/no-danger -- KaTeX's own escaped output, not user input
  return <span className="mkatex" dangerouslySetInnerHTML={{ __html: html }} />;
}

function renderLine(text, keyBase) {
  const nodes = parseArchivoLine(text, keyBase);
  if (nodes === null) return <KatexFallback key={keyBase} tex={text} />;
  return nodes;
}

export default function MathDisplay({ math }) {
  const raw = String(math == null ? '' : math);
  const lines = raw.split('\n');
  if (lines.length === 1) return renderLine(lines[0], 'm');
  return lines.map((l, i) => (
    <div key={'L' + i} className="mline">{renderLine(l, 'm' + i)}</div>
  ));
}
