// Parses one line of maths markup into Archivo-native React nodes.
// Understands the original `~f{}{}` / `~r{}` shorthand plus the LaTeX
// subset from SPEC.md §6: \frac{}{}, \sqrt{}, ^{}, _{}, \times, \div, \pm,
// \le, \ge, \ne, \pi, \text{}, \circ (degrees), and plain algebra. Hyphens
// before a digit or letter become U+2212.
//
// Returns `null` — instead of rendering anything — when it meets a command
// it doesn't know, a `\frac` (or `~f`) nested two or more levels deep, or an
// indexed root (`\sqrt[n]{}`). The caller falls back to KaTeX for the whole
// line in that case; this module never emits literal command text.

const SYMBOLS = {
  times: '×',
  div: '÷',
  pm: '±',
  le: '≤',
  ge: '≥',
  ne: '≠',
  pi: 'π',
  circ: '°',
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
      const isShorthand = s[i] === '~';
      const braceStart = isShorthand ? i + 2 : i + 5;
      if (!isShorthand && s[braceStart] === '[') return null; // indexed root — no support
      if (s[braceStart] !== '{') return null;
      const g = matchBrace(s, braceStart);
      if (!g) return null;
      const inner = parseSeq(g[0], kb + 'r' + k, fracDepth);
      if (inner === null) return null;
      flush();
      out.push(
        <span key={kb + k++} className="msqrt">
          {'√'}
          <span className="msqrt-bar">{inner}</span>
        </span>,
      );
      i = g[1];
      continue;
    }

    if (s.startsWith('\\text{', i)) {
      const g = matchBrace(s, i + 5);
      if (!g) return null;
      flush();
      out.push(<span key={kb + k++} className="mtext">{g[0]}</span>);
      i = g[1];
      continue;
    }

    if (s[i] === '^' || s[i] === '_') {
      const isSup = s[i] === '^';
      let arg, j;
      if (s[i + 1] === '{') {
        const g = matchBrace(s, i + 1);
        if (!g) return null;
        const inner = parseSeq(g[0], kb + (isSup ? 'S' : 's') + k, fracDepth);
        if (inner === null) return null;
        arg = inner; j = g[1];
      } else if (s[i + 1] === '\\') {
        const cmd = readCommand(s, i + 1);
        if (!cmd || !Object.hasOwn(SYMBOLS, cmd[0])) return null;
        arg = SYMBOLS[cmd[0]]; j = cmd[1];
      } else if (i + 1 < s.length) {
        arg = s[i + 1]; j = i + 2;
      } else {
        return null;
      }
      flush();
      const Tag = isSup ? 'sup' : 'sub';
      out.push(<Tag key={kb + k++} className={isSup ? 'msup' : 'msub'}>{arg}</Tag>);
      i = j;
      continue;
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
