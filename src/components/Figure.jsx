import './Figure.css';

function svgWrap(children, w, h, key, big, shown) {
  const cap = shown ? (big ? '30cqh' : '24cqh') : (big ? '46cqh' : '34cqh');
  return (
    <svg
      key={key}
      className="fig-svg"
      viewBox={`0 0 ${w} ${h}`}
      preserveAspectRatio="xMidYMid meet"
      style={{ width: big ? 'min(50cqi,420px)' : 'min(34cqi,250px)', maxHeight: cap }}
    >
      {children}
    </svg>
  );
}

function figLine(key, x1, y1, x2, y2, extra) {
  return <line key={key} x1={x1} y1={y1} x2={x2} y2={y2} stroke="var(--ink)" strokeWidth={3} strokeLinecap="square" {...extra} />;
}

function figLabel(key, x, y, text, anchor = 'middle', color = 'var(--ink)') {
  return (
    <text key={key} x={x} y={y} textAnchor={anchor} className="fig-label" fill={color}>
      {text}
    </text>
  );
}

export default function Figure({ fig, color, shown }) {
  if (!fig) return null;

  if (fig.kind === 'right-triangle') {
    return svgWrap([
      <polygon key="p" points="24,132 24,20 168,132" fill="none" stroke="var(--ink)" strokeWidth={3} strokeLinejoin="round" />,
      <path key="r" d="M24 112 h20 v20" fill="none" stroke="var(--ink)" strokeWidth={3} />,
      figLabel('a', 34, 80, fig.a, 'start'),
      figLabel('b', 96, 156, fig.b),
      figLabel('c', 110, 66, fig.c, 'start', color),
    ], 190, 168, 'rt', fig.big, shown);
  }

  if (fig.kind === 'circle') {
    return svgWrap([
      <circle key="c" cx={88} cy={88} r={72} fill="none" stroke="var(--ink)" strokeWidth={3} />,
      figLine('r', 88, 88, 160, 88),
      <circle key="d" cx={88} cy={88} r={4} fill="var(--ink)" />,
      figLabel('l', 124, 80, fig.r, 'middle', color),
    ], 176, 176, 'ci', fig.big, shown);
  }

  if (fig.kind === 'trapezium') {
    return svgWrap([
      <polygon key="p" points="48,24 148,24 180,124 16,124" fill="none" stroke="var(--ink)" strokeWidth={3} strokeLinejoin="round" />,
      figLine('h', 98, 24, 98, 124, { strokeDasharray: '6 6', strokeWidth: 2 }),
      figLabel('a', 98, 16, fig.a),
      figLabel('b', 98, 144, fig.b),
      figLabel('hh', 106, 80, fig.h, 'start', color),
    ], 196, 152, 'tz', fig.big, shown);
  }

  if (fig.kind === 'polygon') {
    const n = fig.n, radius = 68, cx = 84, cy = 84, pts = [];
    for (let i = 0; i < n; i++) {
      const t = (Math.PI * 2 * i) / n - Math.PI / 2;
      pts.push(`${(cx + radius * Math.cos(t)).toFixed(1)},${(cy + radius * Math.sin(t)).toFixed(1)}`);
    }
    return svgWrap([
      <polygon key="p" points={pts.join(' ')} fill="none" stroke="var(--ink)" strokeWidth={3} strokeLinejoin="round" />,
      <path key="arc" d={`M ${cx} ${cy - radius + 22} a 22 22 0 0 1 18 12`} fill="none" stroke={color} strokeWidth={3} />,
    ], 168, 168, 'pg', fig.big, shown);
  }

  return null;
}
