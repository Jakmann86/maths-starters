import './MathDisplay.css';

// Custom Archivo-native maths renderer — see DESIGN.md §"Maths rendering".
// Handles `~f{num}{den}` fractions, `~r{x}` roots, `^{n}` / `^n` powers,
// and `\n` line breaks. Hyphens before a digit/letter become U+2212.
// KaTeX fallback for anything wider (LaTeX subset, nested fractions) is a
// planned addition, not built yet — see SPEC.md §6.

function brace(s, i) {
  let d = 0, j = i;
  for (; j < s.length; j++) {
    if (s[j] === '{') d++;
    else if (s[j] === '}') { d--; if (!d) break; }
  }
  return [s.slice(i + 1, j), j + 1];
}

function maths(str, kb) {
  const out = [];
  let i = 0, buf = '', k = 0;
  const flush = () => { if (buf) { out.push(buf); buf = ''; } };
  const s = String(str == null ? '' : str).replace(/-(?=[\d.(a-zA-Z])/g, '−');
  while (i < s.length) {
    if (s.startsWith('~f{', i)) {
      const [num, j] = brace(s, i + 2);
      const [den, j2] = brace(s, j);
      flush();
      out.push(
        <span key={kb + k++} className="mfrac">
          <span className="mfrac-part">{maths(num, kb + 'n' + k)}</span>
          <span className="mfrac-bar" />
          <span className="mfrac-part">{maths(den, kb + 'd' + k)}</span>
        </span>,
      );
      i = j2;
      continue;
    }
    if (s.startsWith('~r{', i)) {
      const [v, j] = brace(s, i + 2);
      flush();
      out.push(
        <span key={kb + k++} className="msqrt">
          {'√'}
          <span className="msqrt-bar">{maths(v, kb + 'r' + k)}</span>
        </span>,
      );
      i = j;
      continue;
    }
    if (s[i] === '^') {
      let v, j;
      if (s[i + 1] === '{') {
        const r = brace(s, i + 1);
        v = r[0]; j = r[1];
      } else {
        v = s[i + 1]; j = i + 2;
      }
      flush();
      out.push(<sup key={kb + k++} className="msup">{v}</sup>);
      i = j;
      continue;
    }
    buf += s[i++];
  }
  flush();
  return out;
}

export default function MathDisplay({ math }) {
  const lines = String(math == null ? '' : math).split('\n');
  if (lines.length === 1) return maths(lines[0], 'm');
  return lines.map((l, i) => (
    <div key={'L' + i} className="mline">{maths(l, 'm' + i)}</div>
  ));
}
