import MathDisplay from '../components/MathDisplay.jsx';
import './MathTestPage.css';

// Dev-only harness for src/components/MathDisplay.jsx. Not linked from the
// app and not part of the production build (Vite only bundles index.html
// unless told otherwise) — reach it at /math-test.html while `npm run dev`
// is running. See SPEC.md §6 for the native-vs-KaTeX fallback rules this
// checks.

const NATIVE_CASES = [
  { label: 'Fraction (shorthand)', math: '~f{3}{4}' },
  { label: 'Fraction (LaTeX)', math: '\\frac{3}{4}' },
  { label: 'Root (shorthand)', math: '~r{16}' },
  { label: 'Root (LaTeX)', math: '\\sqrt{16}' },
  { label: 'Power, single char', math: 'x^2' },
  { label: 'Power, braced', math: 'x^{10}' },
  { label: 'Subscript', math: 'a_{n+1}' },
  { label: 'Times / divide', math: '3 \\times 4 \\div 2' },
  { label: 'Plus-minus, inequalities', math: 'x \\pm 3,  x \\le 5,  x \\ge 5,  x \\ne 5' },
  { label: 'Pi', math: '2\\pi r' },
  { label: 'Degrees', math: '30^\\circ' },
  { label: 'Text mixed into maths', math: '\\text{pair multiplying to } 12' },
  { label: 'Negative-to-minus rewrite', math: '-5 - (-3)' },
  { label: 'Multi-line', math: 'a = 1\nb = 2' },
];

const FALLBACK_CASES = [
  { label: 'Recurring decimal dots', math: '0.\\dot{1}\\dot{2}' },
  { label: 'Column vector', math: '\\begin{pmatrix} 1 \\\\ 2 \\end{pmatrix}' },
  { label: 'Indexed surd', math: '\\sqrt[3]{8}' },
  { label: 'Stacked algebraic fraction', math: '\\frac{\\frac{a}{b} + 1}{c - \\frac{d}{e}}' },
  { label: 'Unknown command', math: '\\alpha + \\beta' },
];

function Row({ label, math }) {
  return (
    <tr>
      <td className="mt-label">{label}</td>
      <td className="mt-source"><code>{math}</code></td>
      <td className="mt-rendered"><MathDisplay math={math} /></td>
    </tr>
  );
}

export default function MathTestPage() {
  return (
    <div className="mt-page">
      <h1>MathDisplay test page</h1>
      <p>Dev-only. Not part of the production build.</p>

      <h2>Should render natively in Archivo</h2>
      <table className="mt-table">
        <tbody>
          {NATIVE_CASES.map((c) => <Row key={c.label} {...c} />)}
        </tbody>
      </table>

      <h2>Should fall back to KaTeX</h2>
      <table className="mt-table">
        <tbody>
          {FALLBACK_CASES.map((c) => <Row key={c.label} {...c} />)}
        </tbody>
      </table>
    </div>
  );
}
