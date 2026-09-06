// Parses one line of maths markup into Archivo-native React nodes.
// Understands the `~f{}{}` shorthand plus the LaTeX subset from SPEC.md §6:
// \frac{}{} (one level), \times, \div, \pm, \le, \ge, \ne, \pi, \Delta,
// \text{}, \circ as a bare degree suffix (`30^\circ`), and plain algebra.
// Hyphens before a digit or letter become U+2212.
//
// Square roots (`\sqrt{}`, `~r{}`) and every exponent/subscript other than
// a bare degree suffix (`x^2`, `a^{m+n}`, `a_{n+1}`, ...) always fall back
// to KaTeX for proper mathematical typesetting — see SPEC.md §6.
//
// Returns `null` — instead of rendering anything — when it meets a command
// it doesn't know, a `\frac` (or `~f`) nested two or more levels deep, a
// square root, or a non-degree exponent/subscript. The caller falls back to
// KaTeX for the whole line in that case; this module never emits literal
// command text.

const SYMBOLS = {
  times: '×',
  div: '÷',
  pm: '±',
  le: '≤',
  ge: '≥',
  ne: '≠',
  pi: 'π',
  circ: '°',
  Delta: 'Δ',
};

function matchBrace(s, i) {
  let d = 0, j = i;
  for (; j < s.length; j++) {
    if (s[j] === '{') d++;
    else if (s[j] === '}') { d--; if (!d) break; }
  }
  if (d !== 0) return null;
  return [s.slice(i + 1, j), j + 1];
}

function readCommand(s, i) {
  let j = i + 1;
  while (j < s.length && /[a-zA-Z]/.test(s[j])) j++;
  if (j === i + 1) return null;
  return [s.slice(i + 1, j), j];
}

function parseSeq(s, kb, fracDepth) {
  const out = [];
  let i = 0, buf = '', k = 0;
  const flush = () => { if (buf) { out.push(buf); buf = ''; } };

  while (i < s.length) {
    if (s.startsWith('~f{', i) || s.startsWith('\\frac{', i)) {
      if (fracDepth >= 1) return null;
      const openLen = s[i] === '~' ? 2 : 5;
      const g1 = matchBrace(s, i + openLen);
      if (!g1) return null;
      const g2 = matchBrace(s, g1[1]);
      if (!g2) return null;
      const numNodes = parseSeq(g1[0], kb + 'n' + k, fracDepth + 1);
      if (numNodes === null) return null;
      const denNodes = parseSeq(g2[0], kb + 'd' + k, fracDepth + 1);
      if (denNodes === null) return null;
      flush();
      out.push(
        <span key={kb + k++} className="mfrac">
          <span className="mfrac-part">{numNodes}</span>
          <span className="mfrac-bar" />
          <span className="mfrac-part">{denNodes}</span>
        </span>,
      );
      i = g2[1];
      continue;
    }

    if (s.startsWith('~r{', i) || s.startsWith('\\sqrt', i)) {
      // Square roots always fall back to KaTeX — see SPEC.md §6.
      return null;
    }

    if (s.startsWith('\\text{', i)) {
      const g = matchBrace(s, i + 5);
      if (!g) return null;
      flush();
      out.push(<span key={kb + k++} className="mtext">{g[0]}</span>);
      i = g[1];
      continue;
    }

    if (s[i] === '^' && s[i + 1] === '\\') {
      // A bare degree suffix (`30^\circ`) is the one exponent form that
      // stays native — it is a unit glyph, not a real exponent, and is used
      // too widely across angle/circle-theorem/trig generators to push into
      // KaTeX. Every other exponent or subscript falls back — see SPEC.md §6.
      const cmd = readCommand(s, i + 1);
      if (cmd && cmd[0] === 'circ') {
        flush();
        out.push(<sup key={kb + k++} className="msup">°</sup>);
        i = cmd[1];
        continue;
      }
      return null;
    }

    if (s[i] === '^' || s[i] === '_') {
      return null;
    }

    if (s[i] === '\\') {
      const cmd = readCommand(s, i);
      if (!cmd || !Object.hasOwn(SYMBOLS, cmd[0])) return null;
      buf += SYMBOLS[cmd[0]];
      i = cmd[1];
      continue;
    }

    if (s[i] === '-' && /[\d.(a-zA-Z]/.test(s[i + 1] || '')) {
      buf += '−';
      i++;
      continue;
    }

    buf += s[i++];
  }
  flush();
  return out;
}

export function parseArchivoLine(text, keyBase) {
  return parseSeq(String(text == null ? '' : text), keyBase, 0);
}
