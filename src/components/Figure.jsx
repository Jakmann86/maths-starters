import './Figure.css';

function svgWrap(children, w, h, key, big, shown, noShrink = false) {
  const capShown = noShrink ? false : shown;
  const cap = capShown ? (big ? '30cqh' : '24cqh') : (big ? '46cqh' : '34cqh');
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

// Figure labels are plain SVG text, not KaTeX (see fig.a etc. above, e.g.
// '3 cm') — so an angleLabel written in LaTeX-ish form ('35\circ') needs its
// degree command swapped for the literal symbol before it can be drawn.
const plainAngleLabel = (label) => String(label).replace(/\^?\\circ/g, '°');

function unitVec(dx, dy) {
  const len = Math.hypot(dx, dy) || 1;
  return [dx / len, dy / len];
}

// A small arc + label at `vertex`, spanning the angle between the rays to
// p1 and p2 — same visual weight as the existing right-angle marker (ink
// stroke, width 3).
function angleMarker(vertex, p1, p2, label, keyBase) {
  const r = 20;
  const [vx, vy] = vertex;
  const u1 = unitVec(p1[0] - vx, p1[1] - vy);
  const u2 = unitVec(p2[0] - vx, p2[1] - vy);
  const A = [vx + u1[0] * r, vy + u1[1] * r];
  const B = [vx + u2[0] * r, vy + u2[1] * r];
  const sweep = u1[0] * u2[1] - u1[1] * u2[0] > 0 ? 1 : 0;
  const bis = unitVec(u1[0] + u2[0], u1[1] + u2[1]);
  const lx = vx + bis[0] * (r + 16);
  const ly = vy + bis[1] * (r + 16) + 4;
  return [
    <path key={`${keyBase}-arc`} d={`M ${A[0]} ${A[1]} A ${r} ${r} 0 0 ${sweep} ${B[0]} ${B[1]}`} fill="none" stroke="var(--ink)" strokeWidth={3} />,
    figLabel(`${keyBase}-lbl`, lx, ly, plainAngleLabel(label), 'middle', 'var(--ink)'),
  ];
}

export default function Figure({ fig, color, shown }) {
  if (!fig) return null;

  if (fig.type === 'magic-square') {
    const { n, cells: given, solution, big } = fig;
    if (!Array.isArray(given) || !Array.isArray(solution)) return null;

    const cellSize = 56;
    const inset = 2;
    const w = n * cellSize + inset * 2;
    const h = n * cellSize + inset * 2;
    const nodes = [];
    for (let i = 0; i < n * n; i += 1) {
      const row = Math.floor(i / n);
      const col = i % n;
      const x = inset + col * cellSize;
      const y = inset + row * cellSize;
      const isBlank = given[i] === null;
      const value = isBlank ? (shown ? solution[i] : null) : given[i];
      nodes.push(
        <rect key={`b${i}`} x={x} y={y} width={cellSize} height={cellSize} fill="none" stroke="var(--ink)" strokeWidth={3} />
      );
      if (value !== null) {
        const cx = inset + (col + 0.5) * cellSize;
        const cy = inset + (row + 0.5) * cellSize + 7;
        nodes.push(figLabel(`v${i}`, cx, cy, value, 'middle', isBlank ? color : 'var(--ink)'));
      }
    }
    // Unlike the shape figures, the grid never shrinks on reveal (DESIGN.md
    // §Figures) — it's what has to be read after the reveal — so noShrink
    // pins the wrapper to the "not shown" size cap regardless of `shown`.
    return svgWrap(nodes, w, h, 'ms', big, shown, true);
  }

  if (fig.type === 'right-triangle') {
    // Whichever side the generator marks unknown gets the slot colour; the
    // other two stay ink. Defaults to 'c' so pythagoras-hypotenuse (which
    // predates this field) is unaffected.
    const unknown = fig.unknown ?? 'c';
    const labelColor = (side) => (side === unknown ? color : 'var(--ink)');
    const TOP = [64, 20], RIGHT_ANGLE = [64, 132], BOTTOM_RIGHT = [208, 132];
    const nodes = [
      <polygon key="p" points="64,132 64,20 208,132" fill="none" stroke="var(--ink)" strokeWidth={3} strokeLinejoin="round" />,
      <path key="r" d="M64 112 h20 v20" fill="none" stroke="var(--ink)" strokeWidth={3} />,
      figLabel('a', 54, 80, fig.a, 'end', labelColor('a')),
      figLabel('b', 136, 156, fig.b, 'middle', labelColor('b')),
      figLabel('c', 150, 66, fig.c, 'start', labelColor('c')),
    ];
    if (fig.angleAt && fig.angleLabel) {
      if (fig.angleAt === 'top') nodes.push(...angleMarker(TOP, RIGHT_ANGLE, BOTTOM_RIGHT, fig.angleLabel, 'ang'));
      else if (fig.angleAt === 'bottomRight') nodes.push(...angleMarker(BOTTOM_RIGHT, RIGHT_ANGLE, TOP, fig.angleLabel, 'ang'));
    }
    return svgWrap(nodes, 230, 168, 'rt', fig.big, shown);
  }

  if (fig.type === 'isosceles-triangle') {
    if (!fig.base || !fig.side) return null;
    const nodes = [
      <polygon key="p" points="100,24 170,140 30,140" fill="none" stroke="var(--ink)" strokeWidth={3} strokeLinejoin="round" />,
      <line key="tl" x1={59.9} y1={78.9} x2={70.1} y2={85.1} stroke="var(--ink)" strokeWidth={3} />,
      <line key="tr" x1={129.9} y1={85.1} x2={140.1} y2={78.9} stroke="var(--ink)" strokeWidth={3} />,
      figLabel('sl', 52, 80, fig.side, 'end'),
      figLabel('sr', 148, 80, fig.side, 'start'),
      figLabel('b', 100, 158, fig.base, 'middle'),
    ];
    if (shown) {
      nodes.push(
        <line key="h" x1={100} y1={24} x2={100} y2={140} stroke="var(--ink)" strokeWidth={2} strokeDasharray="6 6" />,
        <path key="r" d="M100 128 L112 128 L112 140" fill="none" stroke="var(--ink)" strokeWidth={2} />,
        figLabel('x', 108, 90, 'x', 'start', color),
      );
    }
    return svgWrap(nodes, 200, 170, 'it', fig.big, shown);
  }

  if (fig.type === 'circle') {
    return svgWrap([
      <circle key="c" cx={88} cy={88} r={72} fill="none" stroke="var(--ink)" strokeWidth={3} />,
      figLine('r', 88, 88, 160, 88),
      <circle key="d" cx={88} cy={88} r={4} fill="var(--ink)" />,
      figLabel('l', 124, 80, fig.r, 'middle', color),
    ], 176, 176, 'ci', fig.big, shown);
  }

  if (fig.type === 'trapezium') {
    return svgWrap([
      <polygon key="p" points="48,24 148,24 180,124 16,124" fill="none" stroke="var(--ink)" strokeWidth={3} strokeLinejoin="round" />,
      figLine('h', 98, 24, 98, 124, { strokeDasharray: '6 6', strokeWidth: 2 }),
      figLabel('a', 98, 16, fig.a),
      figLabel('b', 98, 144, fig.b),
      figLabel('hh', 106, 80, fig.h, 'start', color),
    ], 196, 152, 'tz', fig.big, shown);
  }

  if (fig.type === 'polygon') {
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
