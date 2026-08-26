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

function figLabel(key, x, y, text, anchor = 'middle', color = 'var(--ink)', fontSize) {
  return (
    <text key={key} x={x} y={y} textAnchor={anchor} className="fig-label" fill={color} style={fontSize ? { fontSize } : undefined}>
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
// p1 and p2 — the arc matches the existing right-angle marker's stroke
// weight; the label always takes the slot colour, same as an 'x' side does.
function angleMarker(vertex, p1, p2, label, keyBase, color) {
  const r = 20;
  const [vx, vy] = vertex;
  const u1 = unitVec(p1[0] - vx, p1[1] - vy);
  const u2 = unitVec(p2[0] - vx, p2[1] - vy);
  const A = [vx + u1[0] * r, vy + u1[1] * r];
  const B = [vx + u2[0] * r, vy + u2[1] * r];
  const sweep = u1[0] * u2[1] - u1[1] * u2[0] > 0 ? 1 : 0;
  const bis = unitVec(u1[0] + u2[0], u1[1] + u2[1]);
  const text = plainAngleLabel(label);
  // The wedge here is a fixed ~38-52 deg regardless of what the label says,
  // so a longer string ('76°', or an algebraic '3x - 25' at Stretch) still
  // needs pushing out a little further than 'x' does or its sides spill
  // past the triangle's edges. Pushing straight out along the bisector does
  // that, but for the two base vertices of a triangle their bisectors both
  // lean inward toward the same central column — a long label on each
  // converges on the other and they collide over the base. Damping the
  // horizontal share of the push (keeping the full vertical share, since
  // there's headroom up toward the apex) sends long labels up rather than
  // sideways, so the two base labels spread apart instead of crashing.
  const labelDir = unitVec(bis[0] * 0.35, bis[1]);
  const labelR = r + 12 + Math.max(0, text.length - 1) * 4;
  const lx = vx + labelDir[0] * labelR - 2;
  const ly = vy + labelDir[1] * labelR + 3;
  return [
    <path key={`${keyBase}-arc`} d={`M ${A[0]} ${A[1]} A ${r} ${r} 0 0 ${sweep} ${B[0]} ${B[1]}`} fill="none" stroke={color} strokeWidth={3} />,
    figLabel(`${keyBase}-lbl`, lx, ly, text, 'middle', color, 15),
  ];
}

// Same arc-+-label idea as angleMarker, but for a wedge between two rays
// that both radiate from a shared point (angle-rays), given as absolute
// directions in degrees rather than as points on a fixed triangle.
//
// `gapDeg` is the wedge's true size in degrees, always supplied by the
// generator — it can't be recovered reliably from deg1/deg2 alone once a
// wedge wraps past 180°, since the two generators that build reflex-capable
// ray sets sweep in different rotational directions. Up to 100° this draws
// one small arc, same as before. Beyond that, it draws one right-angle
// corner mark (ink, same convention as the existing right-triangle marker)
// covering the first 90°, then a single arc for whatever's left — capped at
// one square regardless of how large the wedge gets, since "angles at a
// point" can have three or four of these markers crowded round the same
// centre and stacking more than one square per wedge made that unreadable.
// The remainder arc uses the real SVG large-arc-flag (derived from its own
// size, not guessed), so it sweeps correctly even reflex; the label sits at
// its true angular midpoint (found by interpolating degrees directly, which
// stays correct past 180° — unlike averaging the two end unit vectors) —
// one number, on one arc, never two pieces added together.
function pointAngleMarker(cx, cy, deg1, deg2, gapDeg, label, keyBase, labelColor = 'var(--ink)') {
  const r = 26;
  const raw = ((deg2 - deg1) % 360 + 360) % 360;
  const dir = Math.abs(raw - gapDeg) < Math.abs(360 - raw - gapDeg) ? 1 : -1;
  const toXY = (deg, rad) => [cx + Math.cos((deg * Math.PI) / 180) * rad, cy + Math.sin((deg * Math.PI) / 180) * rad];
  const nodes = [];

  const hasSquare = gapDeg > 100;
  let armStart = deg1;
  if (hasSquare) {
    const s = 16;
    const armEnd = deg1 + dir * 90;
    const P = toXY(deg1, s);
    const Q = toXY(armEnd, s);
    const corner = [P[0] + (Q[0] - cx), P[1] + (Q[1] - cy)];
    nodes.push(<path key={`${keyBase}-sq`} d={`M ${P[0]} ${P[1]} L ${corner[0]} ${corner[1]} L ${Q[0]} ${Q[1]}`} fill="none" stroke="var(--ink)" strokeWidth={3} />);
    armStart = armEnd;
  }

  const remainder = gapDeg - (hasSquare ? 90 : 0);
  const armEnd = armStart + dir * remainder;
  if (remainder > 1) {
    const A = toXY(armStart, r);
    const B = toXY(armEnd, r);
    const sweep = dir > 0 ? 1 : 0;
    const largeArc = remainder > 180 ? 1 : 0;
    nodes.push(<path key={`${keyBase}-arc`} d={`M ${A[0]} ${A[1]} A ${r} ${r} 0 ${largeArc} ${sweep} ${B[0]} ${B[1]}`} fill="none" stroke="var(--ink)" strokeWidth={3} />);
  }

  const text = plainAngleLabel(label);
  const midDeg = armStart + dir * (remainder / 2);
  const labelR = r + 12 + Math.max(0, text.length - 1) * 6;
  const [lx, lyBase] = toXY(midDeg, labelR);
  nodes.push(figLabel(`${keyBase}-lbl`, lx, lyBase + 5, text, 'middle', labelColor, 16));
  return nodes;
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
      if (fig.angleAt === 'top') nodes.push(...angleMarker(TOP, RIGHT_ANGLE, BOTTOM_RIGHT, fig.angleLabel, 'ang', color));
      else if (fig.angleAt === 'bottomRight') nodes.push(...angleMarker(BOTTOM_RIGHT, RIGHT_ANGLE, TOP, fig.angleLabel, 'ang', color));
    }
    return svgWrap(nodes, 230, 168, 'rt', fig.big, shown);
  }

  if (fig.type === 'angle-rays') {
    // 2-5 rays fanning out from a shared point (Haese 4A: angles on a line,
    // at a point, vertically opposite). `wrap` decides whether the gap
    // between the last ray and the first also gets an arc (closed, e.g.
    // angles at a point / vertically opposite) or not (open, e.g. a
    // straight line, whose two ends aren't "adjacent"). A falsy label
    // skips that gap's arc entirely — used when only some of the angles at
    // an intersection are actually part of the question.
    const { rays, gapDegrees = [], labels = [], unknownIndex, wrap } = fig;
    if (!Array.isArray(rays) || rays.length < 2) return null;
    const cx = 100, cy = 100, R = 90;
    const toXY = (deg) => [cx + R * Math.cos((deg * Math.PI) / 180), cy + R * Math.sin((deg * Math.PI) / 180)];
    const nodes = [<circle key="pt" cx={cx} cy={cy} r={3} fill="var(--ink)" />];
    rays.forEach((deg, i) => {
      const [x, y] = toXY(deg);
      nodes.push(<line key={`ray${i}`} x1={cx} y1={cy} x2={x} y2={y} stroke="var(--ink)" strokeWidth={3} strokeLinecap="round" />);
    });
    const gaps = wrap ? rays.length : rays.length - 1;
    for (let i = 0; i < gaps; i++) {
      const label = labels[i];
      if (!label) continue;
      const next = (i + 1) % rays.length;
      const labelColor = i === unknownIndex ? color : 'var(--ink)';
      nodes.push(...pointAngleMarker(cx, cy, rays[i], rays[next], gapDegrees[i], label, `g${i}`, labelColor));
    }
    return svgWrap(nodes, 200, 200, 'ar', fig.big, shown);
  }

  if (fig.type === 'triangle') {
    // A plain scalene outline — distinct from right-triangle (no right-angle
    // mark) and isosceles-triangle (no symmetry) — for Haese 4B's angle sum
    // and exterior angle theorems. Reuses angleMarker for each vertex's
    // interior angle; a falsy label skips that vertex, same convention as
    // angle-rays. An optional exterior extension beyond B (drawn only when
    // exteriorLabel is given) covers the exterior-angle-theorem figure.
    const TA = [20, 158], TB = [215, 158], TC = [130, 25];
    const { labels = [], unknownIndex, exteriorLabel, exteriorUnknown } = fig;
    const vertices = [TA, TB, TC];
    const adjacent = [[TC, TB], [TA, TC], [TA, TB]];
    const nodes = [
      <polygon key="p" points={`${TA.join(',')} ${TB.join(',')} ${TC.join(',')}`} fill="none" stroke="var(--ink)" strokeWidth={3} strokeLinejoin="round" />,
    ];
    vertices.forEach((v, i) => {
      const label = labels[i];
      if (!label) return;
      const labelColor = i === unknownIndex ? color : 'var(--ink)';
      nodes.push(...angleMarker(v, adjacent[i][0], adjacent[i][1], label, `tv${i}`, labelColor));
    });
    if (exteriorLabel) {
      const dir = unitVec(TB[0] - TA[0], TB[1] - TA[1]);
      const D = [TB[0] + dir[0] * 60, TB[1] + dir[1] * 60];
      nodes.push(<line key="ext" x1={TB[0]} y1={TB[1]} x2={D[0]} y2={D[1]} stroke="var(--ink)" strokeWidth={3} strokeLinecap="round" />);
      nodes.push(...angleMarker(TB, D, TC, exteriorLabel, 'text', exteriorUnknown ? color : 'var(--ink)'));
    }
    return svgWrap(nodes, 300, 180, 'tr', fig.big, shown);
  }

  if (fig.type === 'isosceles-angles') {
    // Same outline as isosceles-triangle, but labels the three angles
    // (Haese 4C: base angles are equal) instead of gating a hidden-height
    // reveal behind `shown` — kept as a sibling type rather than overloading
    // isosceles-triangle so pythagoras-isosceles's rendering is untouched.
    const APEX = [100, 24], BASE_L = [15, 140], BASE_R = [185, 140];
    const { apexLabel, baseLabel, unknownIsApex } = fig;
    const apexColor = unknownIsApex === true ? color : 'var(--ink)';
    const baseColor = unknownIsApex === false ? color : 'var(--ink)';
    const nodes = [
      <polygon key="p" points="100,24 185,140 15,140" fill="none" stroke="var(--ink)" strokeWidth={3} strokeLinejoin="round" />,
    ];
    if (apexLabel) nodes.push(...angleMarker(APEX, BASE_L, BASE_R, apexLabel, 'ia', apexColor));
    if (baseLabel) {
      nodes.push(...angleMarker(BASE_L, APEX, BASE_R, baseLabel, 'ib1', baseColor));
      nodes.push(...angleMarker(BASE_R, APEX, BASE_L, baseLabel, 'ib2', baseColor));
    }
    return svgWrap(nodes, 220, 170, 'ia', fig.big, shown);
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
