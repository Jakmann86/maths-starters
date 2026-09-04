import './Figure.css';

// All sizes here are 1.2x the original figures — shapes and labels share one
// viewBox-relative coordinate system, so scaling this shared wrapper scales
// both together for every figure type without touching any branch's own
// coordinates.
function svgWrap(children, w, h, key, big, shown, noShrink = false) {
  const capShown = noShrink ? false : shown;
  const cap = capShown ? (big ? '41cqh' : '34cqh') : (big ? '64cqh' : '47cqh');
  return (
    <svg
      key={key}
      className="fig-svg"
      viewBox={`0 0 ${w} ${h}`}
      preserveAspectRatio="xMidYMid meet"
      style={{ width: big ? 'min(70cqi,580px)' : 'min(47cqi,346px)', maxHeight: cap }}
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
function angleMarker(vertex, p1, p2, label, keyBase, color, opts = {}, r = 20) {
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
  // past the triangle's edges — that widening is automatic, based purely on
  // text length, regardless of any directional nudge below.
  //
  // `horizScale`/`vShift` (short labels) and `longHorizScale`/`longVShift`
  // (long ones) are an explicit per-call push, independent of each other —
  // a figure can want its short numeric labels nudged one way and its long
  // algebraic ones nudged differently (e.g. a triangle's base vertices pull
  // in a little for an ordinary numeric label, but pull in much more *and*
  // drop further down for a long algebraic one, since two long labels on
  // adjacent base vertices would otherwise collide over the base). Default
  // is a plain bisector push either way — no change from the original
  // behaviour for a caller that doesn't set them.
  const long = text.length > 4;
  const { horizScale = 1, vShift = 0, longHorizScale = 0.35, longVShift = 0 } = opts;
  const hs = long ? longHorizScale : horizScale;
  const vs = long ? longVShift : vShift;
  const labelDir = hs === 1 ? bis : unitVec(bis[0] * hs, bis[1]);
  const labelR = r + 12 + Math.max(0, text.length - 1) * (long ? 4 : 6);
  const lx = vx + labelDir[0] * labelR - 2;
  const ly = vy + labelDir[1] * labelR + 3 + vs;
  return [
    <path key={`${keyBase}-arc`} d={`M ${A[0]} ${A[1]} A ${r} ${r} 0 0 ${sweep} ${B[0]} ${B[1]}`} fill="none" stroke={color} strokeWidth={3} />,
    figLabel(`${keyBase}-lbl`, lx, ly, text, 'middle', color, 15),
  ];
}

// A short tick mark crossing the midpoint of p1-p2, perpendicular to that
// side — the standard "these two sides are equal" convention, matching
// isosceles-triangle's and isosceles-angles' existing tick marks.
function tickMark(p1, p2, keySuffix) {
  const mx = (p1[0] + p2[0]) / 2, my = (p1[1] + p2[1]) / 2;
  const dx = p2[0] - p1[0], dy = p2[1] - p1[1];
  const len = Math.hypot(dx, dy) || 1;
  const px = -dy / len, py = dx / len;
  const half = 6;
  return <line key={`tick-${keySuffix}`} x1={mx - px * half} y1={my - py * half} x2={mx + px * half} y2={my + py * half} stroke="var(--ink)" strokeWidth={3} />;
}

// Same arc-+-label idea as angleMarker, but for a wedge between two rays
// that both radiate from a shared point (angle-rays), given as absolute
// directions in degrees rather than as points on a fixed triangle.
//
// `gapDeg` is the wedge's true size in degrees, always supplied by the
// generator — it can't be recovered reliably from deg1/deg2 alone once a
// wedge wraps past 180°, since the two generators that build reflex-capable
// ray sets sweep in different rotational directions. The arc always spans
// the wedge's full true size (a reflex angle already reads as visually much
// bigger than an acute one once it sweeps that much of the circle — no
// right-angle corner mark needed, and a real one can't be drawn here
// anyway: unlike right-triangle's, this wedge's only two real sides are its
// two rays, so any split into a "first 90° + remainder" invents a corner
// edge that has no ray under it and reads as a floating, disconnected
// square). The real bug this fixes is the SVG large-arc-flag: it must come
// from gapDeg itself, not be assumed 0, or any wedge over 180° draws the
// wrong, complementary-sized notch. The label sits at the wedge's true
// angular midpoint (interpolating degrees directly, which stays correct
// past 180° — unlike averaging the two end unit vectors).
function pointAngleMarker(cx, cy, deg1, deg2, gapDeg, label, keyBase, labelColor = 'var(--ink)') {
  const r = 26;
  const raw = ((deg2 - deg1) % 360 + 360) % 360;
  const dir = Math.abs(raw - gapDeg) < Math.abs(360 - raw - gapDeg) ? 1 : -1;
  const toXY = (deg, rad) => [cx + Math.cos((deg * Math.PI) / 180) * rad, cy + Math.sin((deg * Math.PI) / 180) * rad];
  const armEnd = deg1 + dir * gapDeg;
  const A = toXY(deg1, r);
  const B = toXY(armEnd, r);
  const sweep = dir > 0 ? 1 : 0;
  const largeArc = gapDeg > 180 ? 1 : 0;
  const nodes = [
    <path key={`${keyBase}-arc`} d={`M ${A[0]} ${A[1]} A ${r} ${r} 0 ${largeArc} ${sweep} ${B[0]} ${B[1]}`} fill="none" stroke="var(--ink)" strokeWidth={3} />,
  ];

  const text = plainAngleLabel(label);
  const midDeg = deg1 + dir * (gapDeg / 2);
  const labelR = r + 12 + Math.max(0, text.length - 1) * 6;
  const [lx, lyBase] = toXY(midDeg, labelR);
  nodes.push(figLabel(`${keyBase}-lbl`, lx, lyBase + 5, text, 'middle', labelColor, 16));
  return nodes;
}

// Shared by the three circle-theorem figures below (semicircle, angle at the
// centre, cyclic quadrilateral): one circle, and every configuration point on
// it placed by SVG angle rather than by hand — `rotate` (0/90/180/270, chosen
// per question) is added to each point's angle before the coordinate is
// computed, so the whole configuration turns as a rigid shape and nothing
// else about a branch needs to change.
const CIRC = { cx: 110, cy: 110, r: 88 };
const onCircle = (degrees, rotate = 0) => {
  const t = ((degrees + rotate) * Math.PI) / 180;
  return [CIRC.cx + CIRC.r * Math.cos(t), CIRC.cy + CIRC.r * Math.sin(t)];
};
const circleOutline = () => (
  <circle key="o" cx={CIRC.cx} cy={CIRC.cy} r={CIRC.r} fill="none" stroke="var(--ink)" strokeWidth={3} />
);
// A small square at `vertex`, in the corner between the rays to p1 and p2.
const rightAngleAt = (vertex, p1, p2, key, size = 13) => {
  const u1 = unitVec(p1[0] - vertex[0], p1[1] - vertex[1]);
  const u2 = unitVec(p2[0] - vertex[0], p2[1] - vertex[1]);
  const a = [vertex[0] + u1[0] * size, vertex[1] + u1[1] * size];
  const b = [vertex[0] + (u1[0] + u2[0]) * size, vertex[1] + (u1[1] + u2[1]) * size];
  const c = [vertex[0] + u2[0] * size, vertex[1] + u2[1] * size];
  return <path key={key} d={`M ${a[0]} ${a[1]} L ${b[0]} ${b[1]} L ${c[0]} ${c[1]}`} fill="none" stroke="var(--ink)" strokeWidth={2} />;
};

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

  if (fig.type === 'cuboid') {
    // Cabinet oblique: the front face is drawn as a true rectangle, and depth
    // recedes up-right at 45 degrees at half scale. Isometric was the
    // alternative and was rejected because figLabel only draws horizontal
    // text — isometric puts all three edge directions on a slant, leaving
    // every dimension label floating with nothing to align against. Here two
    // of the three sit against a genuinely horizontal or vertical edge.
    //
    // Geometry is fixed regardless of the label values, the same schematic
    // convention parallel-transversal uses: a 20 x 3 x 2 box drawn to scale
    // is an unreadable sliver, so only the labels vary.
    //
    // F = front face, B = back face; T/B = top/bottom, L/R = left/right.
    // Back is the front offset by (+45, -45) — that offset IS the projection.
    const FBL = [58, 158], FBR = [208, 158], FTR = [208, 63], FTL = [58, 63];
    const BBL = [103, 113], BBR = [253, 113], BTR = [253, 18], BTL = [103, 18];
    const edge = (key, p, q, extra) => figLine(key, p[0], p[1], q[0], q[1], extra);

    // Whichever dimension the generator marks unknown gets the slot colour.
    // Defaults to null, not 'l' — unlike right-triangle, the usual case here
    // is that the unknown is the volume or the surface area, i.e. not a
    // labelled edge at all, so nothing should be coloured.
    const unknown = fig.unknown ?? null;
    const labelColor = (dim) => (dim === unknown ? color : 'var(--ink)');

    const nodes = [];

    // A tint on the front face, for questions that give the cross-sectional
    // area rather than two separate dimensions ("area of cross-section x
    // length", Haese 11B). Drawn first so every edge sits over it.
    if (fig.crossSection) {
      nodes.push(
        <polygon
          key="xs"
          points={`${FBL.join(',')} ${FBR.join(',')} ${FTR.join(',')} ${FTL.join(',')}`}
          fill={color}
          fillOpacity={0.12}
          stroke="none"
        />
      );
      // The true centre of the front face (133, 116) sits almost exactly on
      // the hidden back-bottom-left vertex's projection — h1/h2/h3 all pass
      // through that point, so a label there gets a hidden edge drawn right
      // through it. The upper-right quarter of the face (right of h3, above
      // h2) is the one region those three edges never cross, so the label
      // sits there instead. It is given information rather than the
      // unknown, so it takes ink, not the slot colour — the tint alone is
      // enough to tie it to the face.
      if (fig.crossSectionLabel) {
        nodes.push(figLabel('xsl', 155, 92, fig.crossSectionLabel, 'middle'));
      }
    }

    // Nine visible edges. The three that meet at BBL (the back-bottom-left
    // vertex) are the only occluded ones on a solid box.
    nodes.push(
      edge('e1', FBL, FBR),
      edge('e2', FBR, FTR),
      edge('e3', FTR, FTL),
      edge('e4', FTL, FBL),
      edge('e5', FBR, BBR),
      edge('e6', FTR, BTR),
      edge('e7', FTL, BTL),
      edge('e8', BTL, BTR),
      edge('e9', BBR, BTR),
    );

    // The three edges at BBL. On a closed box they are hidden, so they are
    // dashed, matching isosceles-triangle's hidden height and trapezium's
    // internal height line. On an open box (`open`, for the five-face
    // Stretch band) you are genuinely looking down into it through the
    // missing lid and those same three edges are the visible inside corner,
    // so they become solid. The instruction text still carries the "no lid"
    // wording — the figure supports it rather than being sole evidence, the
    // same way isosceles-angles' tick marks support rather than replace the
    // word "isosceles".
    const hidden = fig.open ? undefined : { strokeDasharray: '6 6', strokeWidth: 2 };
    nodes.push(
      edge('h1', FBL, BBL, hidden),
      edge('h2', BBL, BBR, hidden),
      edge('h3', BBL, BTL, hidden),
    );

    // Three dimension labels. A cube is not a special case here — the
    // generator simply passes the same value for l, h and d, and all three
    // are drawn. That repetition is the point: it is the visual cue that
    // makes 6s^2 obvious rather than something to be recalled, the same
    // argument as the tick marks on the isosceles figures.
    if (fig.l) nodes.push(figLabel('l', 133, 181, fig.l, 'middle', labelColor('l')));
    if (fig.h) nodes.push(figLabel('h', 48, 116, fig.h, 'end', labelColor('h')));
    // Sits just outside the midpoint of the bottom-right receding edge,
    // pushed along that edge's outward normal into clear space. .fig-svg has
    // overflow: visible, so a long label here is not clipped.
    if (fig.d) nodes.push(figLabel('d', 245, 150, fig.d, 'start', labelColor('d')));

    return svgWrap(nodes, 300, 195, 'cb', fig.big, shown);
  }

  if (fig.type === 'cylinder') {
    // Upright, following Haese p235 rather than Rayner's horizontal p143
    // drawing: standing on end puts h against a true vertical edge, which is
    // the same reason the cuboid uses oblique — figLabel only draws
    // horizontal text.
    const RX = 62, RY = 18, CX = 105, TOP = 42, BOT = 195;
    const L = CX - RX, R = CX + RX;
    const unknown = fig.unknown ?? null;
    const col = (k) => (k === unknown ? color : 'var(--ink)');
    const nodes = [
      // Far half of the base, hidden behind the body.
      <path key="bb" d={`M ${L} ${BOT} A ${RX} ${RY} 0 0 1 ${R} ${BOT}`} fill="none" stroke="var(--ink)" strokeWidth={2} strokeDasharray="6 6" />,
      <path key="bf" d={`M ${L} ${BOT} A ${RX} ${RY} 0 0 0 ${R} ${BOT}`} fill="none" stroke="var(--ink)" strokeWidth={3} />,
      figLine('sl', L, TOP, L, BOT),
      figLine('sr', R, TOP, R, BOT),
      <ellipse key="top" cx={CX} cy={TOP} rx={RX} ry={RY} fill="none" stroke="var(--ink)" strokeWidth={3} />,
    ];
    // An inner rim ellipse is how both textbooks show a cylinder that is open
    // at the top (hollow, or a can with one end). The instruction still says
    // so in words — this supports it rather than replacing it.
    if (fig.openTop) {
      nodes.push(<ellipse key="rim" cx={CX} cy={TOP} rx={RX * 0.84} ry={RY * 0.84} fill="none" stroke="var(--ink)" strokeWidth={2} />);
    }
    // The label sits above the ellipse's own crest (TOP - RY), not just above
    // the diameter line at TOP — at font-size 20 a fixed 8-unit offset from
    // the line lands the text on top of the curve itself.
    if (fig.diameter) {
      nodes.push(figLine('dl', L, TOP, R, TOP, { strokeWidth: 2 }));
      nodes.push(figLabel('dv', CX, TOP - RY - 8, fig.diameter, 'middle', col('diameter')));
    } else if (fig.r) {
      nodes.push(figLine('rl', CX, TOP, R, TOP, { strokeWidth: 2 }));
      nodes.push(<circle key="rc" cx={CX} cy={TOP} r={3} fill="var(--ink)" />);
      nodes.push(figLabel('rv', CX + RX / 2, TOP - RY - 8, fig.r, 'middle', col('r')));
    }
    if (fig.h) nodes.push(figLabel('hv', L - 10, (TOP + BOT) / 2 + 5, fig.h, 'end', col('h')));
    return svgWrap(nodes, 210, 240, 'cy', fig.big, shown);
  }

  if (fig.type === 'cone') {
    const RX = 62, RY = 17, CX = 105, BASE = 178, APEX_Y = 28;
    const L = CX - RX, R = CX + RX;
    const unknown = fig.unknown ?? null;
    const col = (k) => (k === unknown ? color : 'var(--ink)');
    const nodes = [
      <path key="bb" d={`M ${L} ${BASE} A ${RX} ${RY} 0 0 1 ${R} ${BASE}`} fill="none" stroke="var(--ink)" strokeWidth={2} strokeDasharray="6 6" />,
      <path key="bf" d={`M ${L} ${BASE} A ${RX} ${RY} 0 0 0 ${R} ${BASE}`} fill="none" stroke="var(--ink)" strokeWidth={3} />,
      figLine('s1', CX, APEX_Y, L, BASE),
      figLine('s2', CX, APEX_Y, R, BASE),
    ];
    // The perpendicular height is a construction line, not an edge, so it is
    // dashed and carries a right-angle mark where it meets the base — the
    // detail that tells a student which length Pythagoras actually uses.
    if (fig.h) {
      nodes.push(figLine('hl', CX, APEX_Y, CX, BASE, { strokeDasharray: '6 6', strokeWidth: 2 }));
      nodes.push(<path key="ra" d={`M ${CX} ${BASE - 12} L ${CX + 12} ${BASE - 12} L ${CX + 12} ${BASE}`} fill="none" stroke="var(--ink)" strokeWidth={2} />);
      // Sitting next to the dashed line, between it and the left slant,
      // doesn't work — the two lines are only ~60 units apart at their
      // widest and a label is routinely wider than that. Outside the base,
      // past L, is the only place with guaranteed clearance from both.
      nodes.push(figLabel('hv', L - 10, (APEX_Y + BASE) / 2 + 5, fig.h, 'end', col('h')));
    }
    // Same reasoning as the cylinder's top label: clear the base ellipse's
    // own lowest point (BASE + RY), not just the diameter line at BASE. The
    // label's own ascent (~18 units at this font size) has to fit in that
    // gap too, not just its baseline.
    if (fig.diameter) {
      nodes.push(figLine('dl', L, BASE, R, BASE, { strokeWidth: 2 }));
      nodes.push(figLabel('dv', CX, BASE + RY + 21, fig.diameter, 'middle', col('diameter')));
    } else if (fig.r) {
      nodes.push(figLine('rl', CX, BASE, R, BASE, { strokeWidth: 2 }));
      nodes.push(figLabel('rv', CX + RX / 2, BASE + RY + 21, fig.r, 'middle', col('r')));
    }
    // Slant height sits just outside the right-hand slant, pushed along that
    // edge's outward normal.
    if (fig.l) nodes.push(figLabel('lv', 151, 97, fig.l, 'start', col('l')));
    return svgWrap(nodes, 210, 220, 'cn', fig.big, shown);
  }

  if (fig.type === 'sphere') {
    // A plain circle would be indistinguishable from the existing 'circle'
    // figure, which matters because both live in this app. The dashed far
    // half of the equator is what makes it read as a solid.
    const CX = 94, CY = 94, RAD = 72, ERY = 20;
    const L = CX - RAD, R = CX + RAD;
    const unknown = fig.unknown ?? null;
    const col = (k) => (k === unknown ? color : 'var(--ink)');
    const nodes = [
      <circle key="o" cx={CX} cy={CY} r={RAD} fill="none" stroke="var(--ink)" strokeWidth={3} />,
      <path key="eb" d={`M ${L} ${CY} A ${RAD} ${ERY} 0 0 1 ${R} ${CY}`} fill="none" stroke="var(--ink)" strokeWidth={2} strokeDasharray="6 6" />,
      <path key="ef" d={`M ${L} ${CY} A ${RAD} ${ERY} 0 0 0 ${R} ${CY}`} fill="none" stroke="var(--ink)" strokeWidth={2} />,
    ];
    // Clears the sphere's own outline (its topmost point is CY - RAD, well
    // above the equator line at CY) rather than just the equator line.
    if (fig.diameter) {
      nodes.push(figLine('dl', L, CY, R, CY, { strokeWidth: 2 }));
      nodes.push(figLabel('dv', CX, CY - RAD - 8, fig.diameter, 'middle', col('diameter')));
    } else if (fig.r) {
      nodes.push(figLine('rl', CX, CY, R, CY, { strokeWidth: 2 }));
      nodes.push(<circle key="c" cx={CX} cy={CY} r={4} fill="var(--ink)" />);
      nodes.push(figLabel('rv', CX + RAD / 2, CY - RAD - 8, fig.r, 'middle', col('r')));
    }
    return svgWrap(nodes, 190, 190, 'sp', fig.big, shown);
  }

  if (fig.type === 'prism') {
    // Cross-section on the front face, length receding — the orientation both
    // textbooks use (Haese p241, Rayner p142). `shape` picks the cross-section:
    // a right-angled triangle, or a trapezium for the Cambridge exam version
    // (Haese p155 Q3, the gold bar).
    const OFF = [45, -45];
    const back = (p) => [p[0] + OFF[0], p[1] + OFF[1]];
    const unknown = fig.unknown ?? null;
    const col = (k) => (k === unknown ? color : 'var(--ink)');
    const isTrap = fig.shape === 'trapezium';

    // Front face, anticlockwise from bottom-left. The triangle is right-angled
    // at its bottom-left corner so b and ht sit on true horizontal/vertical
    // edges; the trapezium's parallel sides are its top and bottom.
    const front = isTrap
      ? [[45, 165], [175, 165], [150, 90], [75, 90]]
      : [[55, 165], [165, 165], [55, 75]];
    const rear = front.map(back);
    const pts = (ps) => ps.map((p) => p.join(',')).join(' ');
    const nodes = [];

    if (fig.crossSection) {
      nodes.push(<polygon key="xs" points={pts(front)} fill={color} fillOpacity={0.12} stroke="none" />);
    }

    // Front outline is always whole. Of the rear outline, only the edges that
    // touch the hidden vertex are dashed — that vertex is front[0]'s partner,
    // the one the body sits in front of.
    nodes.push(<polygon key="fp" points={pts(front)} fill="none" stroke="var(--ink)" strokeWidth={3} strokeLinejoin="round" />);
    for (let i = 0; i < rear.length; i++) {
      const j = (i + 1) % rear.length;
      const hiddenEdge = i === 0 || j === 0;
      nodes.push(figLine(`r${i}`, rear[i][0], rear[i][1], rear[j][0], rear[j][1],
        hiddenEdge ? { strokeDasharray: '6 6', strokeWidth: 2 } : undefined));
    }
    front.forEach((p, i) => {
      const q = rear[i];
      nodes.push(figLine(`c${i}`, p[0], p[1], q[0], q[1],
        i === 0 ? { strokeDasharray: '6 6', strokeWidth: 2 } : undefined));
    });

    if (!isTrap) {
      // Right-angle mark at the triangle's corner, so it is clear which two
      // lengths Pythagoras applies to.
      nodes.push(<path key="ra" d="M55 151 L69 151 L69 165" fill="none" stroke="var(--ink)" strokeWidth={2} />);
    }

    if (isTrap) {
      if (fig.a) nodes.push(figLabel('la', 112, 82, fig.a, 'middle', col('a')));
      if (fig.b) nodes.push(figLabel('lb', 110, 188, fig.b, 'middle', col('b')));
      if (fig.ht) nodes.push(figLine('hl', 110, 90, 110, 165, { strokeDasharray: '6 6', strokeWidth: 2 }));
      if (fig.ht) nodes.push(figLabel('lh', 118, 132, fig.ht, 'start', col('ht')));
      if (fig.L) nodes.push(figLabel('lL', 211, 157, fig.L, 'start', col('L')));
    } else {
      if (fig.b) nodes.push(figLabel('lb', 110, 188, fig.b, 'middle', col('b')));
      if (fig.ht) nodes.push(figLabel('lh', 45, 126, fig.ht, 'end', col('ht')));
      if (fig.hyp) nodes.push(figLabel('ly', 122, 112, fig.hyp, 'start', col('hyp')));
      if (fig.L) nodes.push(figLabel('lL', 201, 157, fig.L, 'start', col('L')));
    }
    if (fig.crossSectionLabel) {
      const cx = front.reduce((s, p) => s + p[0], 0) / front.length;
      const cy = front.reduce((s, p) => s + p[1], 0) / front.length;
      nodes.push(figLabel('xsl', cx, cy + 5, fig.crossSectionLabel, 'middle'));
    }
    return svgWrap(nodes, 280, 205, 'pr', fig.big, shown);
  }

  if (fig.type === 'pyramid') {
    // Square or rectangular base in oblique, apex above the base centre.
    const FL = [60, 175], FR = [200, 175], BR = [240, 135], BL = [100, 135];
    const CENTRE = [150, 155], APEX = [150, 30];
    const unknown = fig.unknown ?? null;
    const col = (k) => (k === unknown ? color : 'var(--ink)');
    const dash = { strokeDasharray: '6 6', strokeWidth: 2 };
    const e = (k, p, q, extra) => figLine(k, p[0], p[1], q[0], q[1], extra);
    // BL is the occluded corner, so its three edges are the dashed ones.
    const nodes = [
      e('b1', FL, FR), e('b2', FR, BR),
      e('b3', BR, BL, dash), e('b4', BL, FL, dash),
      e('e1', FL, APEX), e('e2', FR, APEX), e('e3', BR, APEX),
      e('e4', BL, APEX, dash),
    ];
    if (fig.h) {
      nodes.push(e('hl', APEX, CENTRE, dash));
      nodes.push(<path key="ra" d={`M ${CENTRE[0]} ${CENTRE[1] - 13} L ${CENTRE[0] + 13} ${CENTRE[1] - 13} L ${CENTRE[0] + 13} ${CENTRE[1]}`} fill="none" stroke="var(--ink)" strokeWidth={2} />);
      nodes.push(figLabel('lh', 141, 100, fig.h, 'end', col('h')));
    }
    if (fig.l) {
      // Slant height runs to the midpoint of the RIGHT base edge, not the
      // front one — on the front edge its label would collide with h.
      const MID = [(FR[0] + BR[0]) / 2, (FR[1] + BR[1]) / 2];
      nodes.push(e('sl', APEX, MID));
      nodes.push(figLabel('ll', 202, 88, fig.l, 'start', col('l')));
    }
    if (fig.base) nodes.push(figLabel('lb', 130, 196, fig.base, 'middle', col('base')));
    if (fig.baseSide) nodes.push(figLabel('lbs', 232, 168, fig.baseSide, 'start', col('baseSide')));
    return svgWrap(nodes, 285, 215, 'py', fig.big, shown);
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
    // Same ray geometry, tighter box (182 vs 200) — ~10% bigger on screen
    // for the same reason the previous 230->200 tightening was: the SVG's
    // on-screen size is set by CSS (svgWrap's width/maxHeight), not by the
    // viewBox, so shrinking the box just lets the same geometry fill more
    // of that fixed on-screen area. .fig-svg has overflow: visible, so the
    // ~1px a ray's rounded cap can poke past the box at the four cardinal
    // directions isn't clipped.
    const cx = 91, cy = 91, R = 90;
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
    return svgWrap(nodes, 182, 182, 'ar', fig.big, shown);
  }

  if (fig.type === 'triangle') {
    // A plain scalene outline — distinct from right-triangle (no right-angle
    // mark) and isosceles-triangle (no symmetry) — for Haese 4B's angle sum
    // and exterior angle theorems. Reuses angleMarker for each vertex's
    // interior angle; a falsy label skips that vertex, same convention as
    // angle-rays. An optional exterior extension beyond B (drawn only when
    // exteriorLabel is given) covers the exterior-angle-theorem figure.
    // Default shape reads as acute/isosceles-ish regardless of the actual
    // angle values. `obtuseIndex` (numeric bands only — see the generator)
    // swaps in a second shape with one genuinely obtuse corner instead, so
    // an obtuse answer doesn't always get drawn as if it were acute; the
    // labelled vertex named by obtuseIndex lands on that obtuse corner, the
    // other two on the shape's two acute corners in index order.
    const ACUTE_TRI = [[20, 158], [215, 158], [130, 25]];
    const OBTUSE_CORNER = [250, 150], OBTUSE_ACUTE_A = [20, 150], OBTUSE_ACUTE_B = [280, 40];
    const { labels = [], unknownIndex, exteriorLabel, exteriorUnknown, obtuseIndex } = fig;
    let vertices = ACUTE_TRI;
    if (obtuseIndex === 0 || obtuseIndex === 1 || obtuseIndex === 2) {
      const acuteSlots = [OBTUSE_ACUTE_A, OBTUSE_ACUTE_B];
      vertices = [0, 1, 2].map((i) => (i === obtuseIndex ? OBTUSE_CORNER : acuteSlots.shift()));
    }
    const [TA, TB, TC] = vertices;
    const adjacent = [[TC, TB], [TA, TC], [TA, TB]];
    const nodes = [
      <polygon key="p" points={`${TA.join(',')} ${TB.join(',')} ${TC.join(',')}`} fill="none" stroke="var(--ink)" strokeWidth={3} strokeLinejoin="round" />,
    ];
    // Tick-marking the two sides into the apex is the one visual cue that
    // tells the student the isosceles base-angles theorem even applies —
    // without it the figure looks like an ordinary scalene triangle with a
    // blank third corner. Only generateAnglesProblemSolving's
    // isosceles-exterior chain sets this; the ordinary triangle-angle-sum
    // and exterior-angle-theorem uses of this same figure never do.
    if (fig.isosceles) nodes.push(tickMark(TA, TC, 'l'), tickMark(TB, TC, 'r'));
    vertices.forEach((v, i) => {
      const label = labels[i];
      if (!label) return;
      const labelColor = i === unknownIndex ? color : 'var(--ink)';
      // Algebraic (long) Stretch labels only ever land on the default
      // ACUTE_TRI shape (see generator), so index 2 reliably means "apex"
      // here: it nudges up a touch when long, while the two base labels
      // (0, 1) pull in closer together and drop further down the open
      // lower area when long — and pull in a touch even for the ordinary
      // short numeric case, where the apex stays untouched either way.
      const opts = i === 2 ? { longVShift: -5 } : { horizScale: 0.85, longHorizScale: 0.6, longVShift: 10 };
      nodes.push(...angleMarker(v, adjacent[i][0], adjacent[i][1], label, `tv${i}`, labelColor, opts));
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
    // A single matching tick at the midpoint of each of the two equal
    // sides — the usual "these sides are equal" convention, and the thing
    // that told isosceles-triangle apart from a plain scalene one; this
    // sibling type needs its own pair since it draws angle labels instead.
    const tick = (key, p1, p2) => {
      const [mx, my] = [(p1[0] + p2[0]) / 2, (p1[1] + p2[1]) / 2];
      const [ux, uy] = unitVec(p2[0] - p1[0], p2[1] - p1[1]);
      const [px, py] = [-uy * 7, ux * 7];
      return <line key={key} x1={mx - px} y1={my - py} x2={mx + px} y2={my + py} stroke="var(--ink)" strokeWidth={3} />;
    };
    const nodes = [
      <polygon key="p" points="100,24 185,140 15,140" fill="none" stroke="var(--ink)" strokeWidth={3} strokeLinejoin="round" />,
      tick('t1', APEX, BASE_L),
      tick('t2', APEX, BASE_R),
    ];
    // All three labels sit a little further down and in from the plain
    // bisector push — same nudge whether the label is a short number or a
    // long Stretch expression (unlike the plain 'triangle' figure, this
    // isn't scoped to just the algebraic case). Harmless no-op on the
    // apex's horizontal share, which is already dead vertical by symmetry.
    const isoNudge = { horizScale: 0.8, vShift: 6, longHorizScale: 0.8, longVShift: 6 };
    if (apexLabel) nodes.push(...angleMarker(APEX, BASE_L, BASE_R, apexLabel, 'ia', apexColor, isoNudge));
    if (baseLabel) {
      nodes.push(...angleMarker(BASE_L, APEX, BASE_R, baseLabel, 'ib1', baseColor, isoNudge));
      nodes.push(...angleMarker(BASE_R, APEX, BASE_L, baseLabel, 'ib2', baseColor, isoNudge));
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
    const CX = 88, CY = 88, RAD = 72;
    // Defaults to 'r' so pythagoras-circle-problems, which predates this
    // field and always asks for the radius, is unaffected.
    const unknown = fig.unknown ?? 'r';
    const col = (k) => (k === unknown ? color : 'var(--ink)');
    const nodes = [
      <circle key="c" cx={CX} cy={CY} r={RAD} fill="none" stroke="var(--ink)" strokeWidth={3} />,
      <circle key="d" cx={CX} cy={CY} r={4} fill="var(--ink)" />,
    ];
    if (fig.diameter) {
      nodes.push(figLine('dl', CX - RAD, CY, CX + RAD, CY));
      nodes.push(figLabel('dv', CX, CY - 10, fig.diameter, 'middle', col('diameter')));
    } else if (fig.r) {
      nodes.push(figLine('rl', CX, CY, CX + RAD, CY));
      nodes.push(figLabel('rv', CX + 36, CY - 10, fig.r, 'middle', col('r')));
    }
    // A given circumference or area is not a length on the figure, so it sits
    // below the centre where it cannot collide with the radius line.
    if (fig.given) nodes.push(figLabel('gv', CX, CY + 34, fig.given, 'middle'));
    return svgWrap(nodes, 176, 176, 'ci', fig.big, shown);
  }

  if (fig.type === 'circle-semicircle') {
    // AB is a diameter through the centre, C is elsewhere on the circle, so
    // angle ACB is a right angle. The two remaining angles sum to 90.
    const rot = fig.rotate ?? 0;
    const A = onCircle(180, rot), B = onCircle(0, rot), C = onCircle(240, rot);
    const O = [CIRC.cx, CIRC.cy];
    const colA = fig.unknown === 'A' || fig.unknown === 'both' ? color : 'var(--ink)';
    const colB = fig.unknown === 'B' || fig.unknown === 'both' ? color : 'var(--ink)';
    const nodes = [
      circleOutline(),
      figLine('ab', A[0], A[1], B[0], B[1], { strokeWidth: 2 }),
      figLine('ac', A[0], A[1], C[0], C[1]),
      figLine('cb', C[0], C[1], B[0], B[1]),
      <circle key="ctr" cx={O[0]} cy={O[1]} r={4} fill="var(--ink)" />,
      rightAngleAt(C, A, B, 'ra'),
    ];
    if (fig.angleA) nodes.push(...angleMarker(A, C, B, fig.angleA, 'sa', colA, {}, 22));
    if (fig.angleB) nodes.push(...angleMarker(B, C, A, fig.angleB, 'sb', colB, {}, 22));
    return svgWrap(nodes, 240, 240, 'csc', fig.big, shown);
  }

  if (fig.type === 'circle-angle-centre') {
    // A and B on the circle, P on the major arc. The drawn angle at O really
    // is twice the drawn angle at P.
    const rot = fig.rotate ?? 0;
    const A = onCircle(150, rot), B = onCircle(30, rot), P = onCircle(270, rot);
    const O = [CIRC.cx, CIRC.cy];
    const colC = fig.unknown === 'centre' ? color : 'var(--ink)';
    const colP = fig.unknown === 'circumference' ? color : 'var(--ink)';
    // A, B and P sit exactly 120deg apart (150, 30, 270), so the gap centred
    // on local 90deg — the one the non-reflex centre-angle arc occupies — is
    // the only one still clear once the reflex arc sweeps the other two. Pick
    // whichever is free and turn it by `rot` with the rest of the figure,
    // rather than a fixed screen-space offset that drifts onto a ray at some
    // rotations (it used to sit almost on top of line OB at rotate=90).
    const oGap = ((fig.reflex ? 90 : 210) + rot) * (Math.PI / 180);
    const oLabelPos = [O[0] + Math.cos(oGap) * 20, O[1] + Math.sin(oGap) * 20 + 5];
    const nodes = [
      circleOutline(),
      figLine('oa', O[0], O[1], A[0], A[1]),
      figLine('ob', O[0], O[1], B[0], B[1]),
      figLine('pa', P[0], P[1], A[0], A[1]),
      figLine('pb', P[0], P[1], B[0], B[1]),
      <circle key="ctr" cx={O[0]} cy={O[1]} r={4} fill="var(--ink)" />,
      figLabel('ol', oLabelPos[0], oLabelPos[1], 'O', 'middle'),
    ];
    if (fig.centre) {
      // The reflex case sweeps the long way round, past P. pointAngleMarker
      // already sets the SVG large-arc flag from gapDeg, so the arc itself
      // is drawn the same way either way.
      const gap = fig.reflex ? 240 : 120;
      const marker = pointAngleMarker(O[0], O[1], 150 + rot, 30 + rot, gap, fig.centre, 'ac', colC);
      if (fig.reflex) {
        // pointAngleMarker's own label sits at the sweep's true angular
        // midpoint — which, for this fixed A/B/P configuration, is exactly
        // P's own direction from O (the reflex angle is defined to sweep
        // past P), the same spot the circumference angle's own label sits.
        // Keep the arc pointAngleMarker drew, but move the label further
        // round the same sweep, clear of both P's label and the OA line.
        const text = plainAngleLabel(fig.centre);
        const labelDeg = 150 + rot + 55;
        const labelR = 40 + Math.max(0, text.length - 1) * 4;
        const lx = O[0] + Math.cos((labelDeg * Math.PI) / 180) * labelR;
        const ly = O[1] + Math.sin((labelDeg * Math.PI) / 180) * labelR;
        nodes.push(marker[0], figLabel('ac-lbl', lx, ly + 5, text, 'middle', colC, 16));
      } else {
        nodes.push(...marker);
      }
    }
    if (fig.circumference) nodes.push(...angleMarker(P, A, B, fig.circumference, 'ap', colP, {}, 24));
    return svgWrap(nodes, 240, 240, 'cac', fig.big, shown);
  }

  if (fig.type === 'cyclic-quadrilateral') {
    // Four points in order round the circle, so a is opposite c and b is
    // opposite d.
    const rot = fig.rotate ?? 0;
    const V = [200, 290, 20, 110].map((d) => onCircle(d, rot));
    const keys = ['a', 'b', 'c', 'd'];
    const unknown = fig.unknown ?? [];
    const nodes = [
      circleOutline(),
      <polygon key="q" points={V.map((p) => p.join(',')).join(' ')} fill="none" stroke="var(--ink)" strokeWidth={3} strokeLinejoin="round" />,
    ];
    V.forEach((v, i) => {
      const label = fig[keys[i]];
      if (!label) return;
      const prev = V[(i + 3) % 4], next = V[(i + 1) % 4];
      const col = unknown.includes(keys[i]) ? color : 'var(--ink)';
      nodes.push(...angleMarker(v, prev, next, label, `cq${i}`, col, {}, 20));
    });
    return svgWrap(nodes, 240, 240, 'cqd', fig.big, shown);
  }

  if (fig.type === 'cyclic-quadrilateral-centre') {
    // A composite Stretch case: the given is a centre angle on diagonal AC,
    // and the unknown is an opposite-pair angle of the quadrilateral —
    // solving it chains the centre-angle theorem into the opposite-angles
    // rule, rather than testing either alone. A, B, C, D sit at uneven gaps
    // (20/100/130/110), not the 90-90-90-90 square `cyclic-quadrilateral`
    // uses — a diagonal there is a true diameter, which would make radii OA
    // and OC collinear and the centre-angle wedge degenerate into a straight
    // line no matter what it's labelled. B specifically sits off the AC arc's
    // true bisector (not at its midpoint, local 260) — a vertex exactly at
    // that midpoint has its own interior-angle bisector run straight back
    // through O, landing its "x" label on top of the centre label.
    const rot = fig.rotate ?? 0;
    const A = onCircle(200, rot), B = onCircle(220, rot), C = onCircle(320, rot), D = onCircle(90, rot);
    const O = [CIRC.cx, CIRC.cy];
    const colB = fig.unknown === 'B' ? color : 'var(--ink)';
    const colD = fig.unknown === 'D' ? color : 'var(--ink)';
    const nodes = [
      circleOutline(),
      <polygon key="q" points={[A, B, C, D].map((p) => p.join(',')).join(' ')} fill="none" stroke="var(--ink)" strokeWidth={3} strokeLinejoin="round" />,
      figLine('oa', O[0], O[1], A[0], A[1]),
      figLine('oc', O[0], O[1], C[0], C[1]),
      figLine('ac', A[0], A[1], C[0], C[1], { strokeDasharray: '5 5', strokeWidth: 2 }),
      <circle key="ctr" cx={O[0]} cy={O[1]} r={4} fill="var(--ink)" />,
    ];
    nodes.push(...pointAngleMarker(O[0], O[1], 200 + rot, 320 + rot, 120, fig.centreAngle, 'cqc-o', 'var(--ink)'));
    if (fig.unknown === 'B') nodes.push(...angleMarker(B, A, C, 'x', 'cqc-b', colB, {}, 20));
    else nodes.push(...angleMarker(D, C, A, 'x', 'cqc-d', colD, {}, 20));
    return svgWrap(nodes, 240, 240, 'cqc', fig.big, shown);
  }

  if (fig.type === 'l-shape') {
    // Six sides, four labelled. The two unlabelled ones are the bottom
    // (= a + c) and the left (= b + d), and deriving them is the skill —
    // so they are deliberately left blank, never labelled.
    const A = [20, 20], B = [140, 20], C = [140, 90], D = [230, 90], E = [230, 160], F = [20, 160];
    const unknown = fig.unknown ?? null;
    const col = (k) => (k === unknown ? color : 'var(--ink)');
    const nodes = [
      <polygon
        key="p"
        points={[A, B, C, D, E, F].map((p) => p.join(',')).join(' ')}
        fill="none"
        stroke="var(--ink)"
        strokeWidth={3}
        strokeLinejoin="round"
      />,
    ];
    if (fig.a) nodes.push(figLabel('la', 80, 13, fig.a, 'middle', col('a')));
    if (fig.b) nodes.push(figLabel('lb', 148, 60, fig.b, 'start', col('b')));
    if (fig.c) nodes.push(figLabel('lc', 185, 82, fig.c, 'middle', col('c')));
    if (fig.d) nodes.push(figLabel('ld', 238, 130, fig.d, 'start', col('d')));
    if (fig.given) nodes.push(figLabel('lg', 100, 130, fig.given, 'middle'));
    return svgWrap(nodes, 262, 175, 'ls', fig.big, shown);
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

  if (fig.type === 'rectangle') {
    const L = 30, R = 200, T = 25, B = 125;
    const unknown = fig.unknown ?? null;
    const col = (k) => (k === unknown ? color : 'var(--ink)');
    const nodes = [
      <rect key="r" x={L} y={T} width={R - L} height={B - T} fill="none" stroke="var(--ink)" strokeWidth={3} />,
      <path key="ra" d={`M ${L} ${B - 14} L ${L + 14} ${B - 14} L ${L + 14} ${B}`} fill="none" stroke="var(--ink)" strokeWidth={2} />,
    ];
    // The diagonal is drawn solid because it is a real edge of the data, not
    // a construction line — the student has to decide it is irrelevant,
    // which is the whole point of the band.
    if (fig.diagonal) {
      nodes.push(figLine('dg', L, B, R, T, { strokeWidth: 2 }));
      // Sits in the upper-left half the diagonal cuts off — the only region
      // with nothing else drawn in it — rather than on the diagonal's own
      // midpoint, which the line itself runs straight through.
      nodes.push(figLabel('dl', 85, 50, fig.diagonal, 'middle', col('diagonal')));
    }
    if (fig.l) nodes.push(figLabel('ll', (L + R) / 2, B + 24, fig.l, 'middle', col('l')));
    if (fig.w) nodes.push(figLabel('wl', R + 10, (T + B) / 2 + 5, fig.w, 'start', col('w')));
    if (fig.area) nodes.push(figLabel('ar', (L + R) / 2, (T + B) / 2 + 5, fig.area, 'middle'));
    return svgWrap(nodes, 245, 155, 'rc', fig.big, shown);
  }

  if (fig.type === 'triangle-area') {
    // Base horizontal, apex above it, perpendicular height dropped inside.
    // Deliberately not the existing 'triangle' type, which labels angles.
    const BL = [30, 145], BR = [210, 145], APEX = [95, 30];
    const FOOT = [APEX[0], BL[1]];
    const unknown = fig.unknown ?? null;
    const col = (k) => (k === unknown ? color : 'var(--ink)');
    const nodes = [
      <polygon key="p" points={`${BL.join(',')} ${BR.join(',')} ${APEX.join(',')}`} fill="none" stroke="var(--ink)" strokeWidth={3} strokeLinejoin="round" />,
      figLine('hl', APEX[0], APEX[1], FOOT[0], FOOT[1], { strokeDasharray: '6 6', strokeWidth: 2 }),
      <path key="ra" d={`M ${FOOT[0]} ${FOOT[1] - 13} L ${FOOT[0] + 13} ${FOOT[1] - 13} L ${FOOT[0] + 13} ${FOOT[1]}`} fill="none" stroke="var(--ink)" strokeWidth={2} />,
    ];
    if (fig.b) nodes.push(figLabel('bl', 120, 168, fig.b, 'middle', col('b')));
    // Lower down the dashed line than a height label "should" sit, but the
    // right edge's slope closes the gap to it fast near the apex — even a
    // short "10 cm" two rows up from here (y=95) still clips it. Down here,
    // near the base, the triangle is wide enough for the full label width.
    if (fig.h) nodes.push(figLabel('hh', FOOT[0] + 2, 127, fig.h, 'start', col('h')));
    if (fig.slant) nodes.push(figLabel('sl', 48, 82, fig.slant, 'end', col('slant')));
    // Below the base, alongside 'bl' rather than inside the triangle — 'area'
    // only appears in the Stretch band, where 'slant' is never set, so there
    // is nothing else down here for it to collide with.
    if (fig.area) nodes.push(figLabel('ar', 178, 168, fig.area, 'start'));
    return svgWrap(nodes, 240, 178, 'ta', fig.big, shown);
  }

  if (fig.type === 'parallelogram') {
    // Shifted 30 units right of where the shape would naturally sit (and the
    // viewBox widened to match) so the end-anchored slant label — which grows
    // leftward and can be a 2-digit "24 mm"-length string — has real room
    // before the slot's own clip boundary, rather than sitting right at the
    // viewBox's x=0 edge where a long label gets cut off.
    const TL = [90, 25], TR = [245, 25], BR = [205, 125], BL = [50, 125];
    const FOOT = [TL[0], BL[1]];
    const unknown = fig.unknown ?? null;
    const col = (k) => (k === unknown ? color : 'var(--ink)');
    const nodes = [
      <polygon key="p" points={`${TL.join(',')} ${TR.join(',')} ${BR.join(',')} ${BL.join(',')}`} fill="none" stroke="var(--ink)" strokeWidth={3} strokeLinejoin="round" />,
      figLine('hl', TL[0], TL[1], FOOT[0], FOOT[1], { strokeDasharray: '6 6', strokeWidth: 2 }),
      <path key="ra" d={`M ${FOOT[0]} ${FOOT[1] - 13} L ${FOOT[0] + 13} ${FOOT[1] - 13} L ${FOOT[0] + 13} ${FOOT[1]}`} fill="none" stroke="var(--ink)" strokeWidth={2} />,
    ];
    if (fig.b) nodes.push(figLabel('bl', 127, 148, fig.b, 'middle', col('b')));
    if (fig.h) nodes.push(figLabel('hh', FOOT[0] + 8, 82, fig.h, 'start', col('h')));
    if (fig.slant) nodes.push(figLabel('sl', 60, 72, fig.slant, 'end', col('slant')));
    if (fig.area) nodes.push(figLabel('ar', 170, 82, fig.area, 'middle'));
    return svgWrap(nodes, 270, 160, 'pl', fig.big, shown);
  }

  if (fig.type === 'trapezium-area') {
    // Sibling of the existing 'trapezium', which hardcodes h as the coloured
    // label and has no distractor slot. Leave that branch untouched — it is
    // still used elsewhere.
    const TL = [58, 24], TR = [148, 24], BR = [190, 124], BL = [16, 124];
    const unknown = fig.unknown ?? null;
    const col = (k) => (k === unknown ? color : 'var(--ink)');
    const nodes = [
      <polygon key="p" points={`${TL.join(',')} ${TR.join(',')} ${BR.join(',')} ${BL.join(',')}`} fill="none" stroke="var(--ink)" strokeWidth={3} strokeLinejoin="round" />,
      figLine('hl', 103, 24, 103, 124, { strokeDasharray: '6 6', strokeWidth: 2 }),
      <path key="ra" d="M103 111 L116 111 L116 124" fill="none" stroke="var(--ink)" strokeWidth={2} />,
    ];
    if (fig.a) nodes.push(figLabel('al', 103, 16, fig.a, 'middle', col('a')));
    if (fig.b) nodes.push(figLabel('bl', 103, 146, fig.b, 'middle', col('b')));
    // Right edge (TR to BR) widens going down, and starting hard against the
    // dashed line rather than 8 units clear of it buys back the room that
    // costs — at the original (111, 80) even a plain "10 cm" clipped it.
    if (fig.h) nodes.push(figLabel('hh', 106, 100, fig.h, 'start', col('h')));
    if (fig.slant) nodes.push(figLabel('sl', 196, 80, fig.slant, 'start', col('slant')));
    // 'area' only appears in the Stretch band, where 'slant' is never set —
    // reuses that same outside-the-right-edge spot rather than the shape's
    // own interior, which the left slanting edge cuts close to.
    if (fig.area) nodes.push(figLabel('ar', 196, 80, fig.area, 'start'));
    return svgWrap(nodes, 250, 158, 'tza', fig.big, shown);
  }

  if (fig.type === 'kite') {
    const TOP = [100, 15], LEFT = [40, 80], RIGHT = [160, 80], BOT = [100, 165];
    const unknown = fig.unknown ?? null;
    const col = (k) => (k === unknown ? color : 'var(--ink)');
    const nodes = [
      <polygon key="p" points={`${TOP.join(',')} ${RIGHT.join(',')} ${BOT.join(',')} ${LEFT.join(',')}`} fill="none" stroke="var(--ink)" strokeWidth={3} strokeLinejoin="round" />,
      // Both diagonals are construction lines, so both are dashed.
      figLine('dh', LEFT[0], LEFT[1], RIGHT[0], RIGHT[1], { strokeDasharray: '6 6', strokeWidth: 2 }),
      figLine('dv', TOP[0], TOP[1], BOT[0], BOT[1], { strokeDasharray: '6 6', strokeWidth: 2 }),
      // One tick on each short side, two on each long side: the usual
      // convention, and what tells a kite from a rhombus at a glance.
      tickMark(TOP, LEFT, 'kl'),
      tickMark(TOP, RIGHT, 'kr'),
    ];
    if (fig.d1) nodes.push(figLabel('d1', 66, 72, fig.d1, 'middle', col('d1')));
    if (fig.d2) nodes.push(figLabel('d2', 110, 128, fig.d2, 'start', col('d2')));
    if (fig.area) nodes.push(figLabel('ar', 100, 185, fig.area, 'middle'));
    return svgWrap(nodes, 220, 195, 'kt', fig.big, shown);
  }

  if (fig.type === 'parallel-transversal') {
    // Two parallel lines cut by one transversal (Haese: corresponding /
    // alternate / co-interior angles). Fixed schematic geometry, matching
    // textbook convention — the transversal's slant never reflects the
    // actual angle values, only the arc + label at each of the eight fixed
    // positions changes per question. TL/TR/BL/BR name the quadrant around
    // each of the two crossings (1 = upper crossing, 2 = lower).
    const POS = {
      TL1: { arc: [80, 60, 88.53, 43.62], label: [68.07, 43.38] },
      TR1: { arc: [88.53, 43.62, 120, 60], label: [116.62, 28.07] },
      BL1: { arc: [111.47, 76.38, 80, 60], label: [83.38, 91.93] },
      BR1: { arc: [120, 60, 111.47, 76.38], label: [131.93, 76.62] },
      TL2: { arc: [143, 150, 151.53, 133.62], label: [131.07, 133.38] },
      TR2: { arc: [151.53, 133.62, 183, 150], label: [179.62, 118.07] },
      BL2: { arc: [174.47, 166.38, 143, 150], label: [146.38, 181.93] },
      BR2: { arc: [183, 150, 174.47, 166.38], label: [194.93, 166.62] },
    };
    const { given, unknown } = fig;
    const arcPath = ([x1, y1, x2, y2]) => `M ${x1} ${y1} A 20 20 0 0 1 ${x2} ${y2}`;
    const elements = [
      <line key="l1" x1={20} y1={60} x2={240} y2={60} stroke="var(--ink)" strokeWidth={2} />,
      <line key="l2" x1={20} y1={150} x2={240} y2={150} stroke="var(--ink)" strokeWidth={2} />,
      <path key="t1" d="M40,54 L48,60 L40,66" fill="none" stroke="var(--ink)" strokeWidth={2} />,
      <path key="t2" d="M40,144 L48,150 L40,156" fill="none" stroke="var(--ink)" strokeWidth={2} />,
      <line key="tv" x1={80} y1={31} x2={183} y2={179} stroke="var(--ink)" strokeWidth={2} />,
    ];
    if (given) {
      const p = POS[given.position];
      elements.push(
        <path key="ga" d={arcPath(p.arc)} fill="none" stroke="var(--ink)" strokeWidth={2} />,
        figLabel('gl', p.label[0], p.label[1] + 6, plainAngleLabel(given.label), 'middle', 'var(--ink)'),
      );
    }
    if (unknown) {
      const p = POS[unknown.position];
      elements.push(
        <path key="ua" d={arcPath(p.arc)} fill="none" stroke={color} strokeWidth={2.5} />,
        figLabel('ul', p.label[0], p.label[1] + 6, plainAngleLabel(unknown.label), 'middle', color),
      );
    }
    return svgWrap(elements, 260, 210, 'pt', fig.big, shown);
  }

  if (fig.type === 'polygon') {
    const n = fig.n, radius = 68, cx = 84, cy = 84;
    const verts = [];
    for (let i = 0; i < n; i++) {
      const t = (Math.PI * 2 * i) / n - Math.PI / 2;
      verts.push([cx + radius * Math.cos(t), cy + radius * Math.sin(t)]);
    }
    const ptsStr = verts.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' ');
    const elements = [
      <polygon key="p" points={ptsStr} fill="none" stroke="var(--ink)" strokeWidth={3} strokeLinejoin="round" />,
    ];

    if (fig.exterior) {
      // Extend the side INTO vertex 0 past vertex 0, mark the angle between
      // that extension and the side OUT of vertex 0. General vertex math,
      // not hand-tuned to one n. The arc + label reuse angleMarker (the same
      // helper the 'triangle' figure's own exterior-angle mark uses) rather
      // than hand-rolled trig — its bisector-based label placement stays
      // inside the wedge for any n, where a fixed offset from vertex 0 could
      // land outside the polygon for a sharp n=3/4 corner.
      const [x0, y0] = verts[0];
      const [xPrev, yPrev] = verts[n - 1];
      const [xNext, yNext] = verts[1];
      const dirExt = [x0 - xPrev, y0 - yPrev];
      const lenExt = Math.hypot(...dirExt);
      const ext = [x0 + (dirExt[0] / lenExt) * 40, y0 + (dirExt[1] / lenExt) * 40];
      elements.push(<line key="ext" x1={x0} y1={y0} x2={ext[0]} y2={ext[1]} stroke="var(--ink)" strokeWidth={2} strokeDasharray="5,5" />);
      if (fig.angleLabel) elements.push(...angleMarker([x0, y0], ext, [xNext, yNext], fig.angleLabel, 'al', color, {}, 30));
    } else {
      // Interior: same angleMarker reuse, at vertex 0 between its two real
      // neighbours — bigger (r=30) and the label always lands inside the
      // polygon by construction (true bisector), unlike the old fixed
      // corner-mark's hand-tuned offset which could spill outside for a
      // sharp n=3/4 corner.
      if (fig.angleLabel) elements.push(...angleMarker(verts[0], verts[n - 1], verts[1], fig.angleLabel, 'al', color, {}, 30));
    }

    return svgWrap(elements, 168, 168, 'pg', fig.big, shown);
  }

  if (fig.type === 'polygon-irregular') {
    // Interior-angle-sum Stretch band: all-but-one interior angle labelled
    // around an irregular n-gon. `radiusFactors` (per-vertex multipliers on
    // the regular n-gon's radius, from the generator) makes the outline
    // read as genuinely irregular rather than a regular shape carrying
    // mismatched labels — the actual drawn angles still needn't match the
    // label values exactly (schematic, like every other angle figure here).
    const { n, angles = [], unknownIndex, radiusFactors = [] } = fig;
    if (!Array.isArray(angles) || angles.length < 3) return null;
    // Bigger and further out than the single-label polygon types above
    // (radius 90 vs 68, angleMarker's own arc radius pulled down to 6 vs
    // the default 20): this figure labels every vertex at once, so with
    // the default radius a 3-digit label at one vertex and its neighbour's
    // routinely landed on top of each other (checked by hand — median
    // adjacent-label gap was single-digit pixels, sometimes literally
    // overlapping) on a compact hexagon/heptagon. This spacing keeps every
    // pair of labels comfortably apart even at n=7 with 3-digit angles.
    const radius = 90, cx = 98, cy = 98;
    const verts = [];
    for (let i = 0; i < n; i++) {
      const t = (Math.PI * 2 * i) / n - Math.PI / 2;
      const rf = radiusFactors[i] ?? 1;
      verts.push([cx + radius * rf * Math.cos(t), cy + radius * rf * Math.sin(t)]);
    }
    const ptsStr = verts.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' ');
    const elements = [
      <polygon key="p" points={ptsStr} fill="none" stroke="var(--ink)" strokeWidth={3} strokeLinejoin="round" />,
    ];
    verts.forEach((v, i) => {
      const label = angles[i];
      if (!label) return;
      const prev = verts[(i - 1 + n) % n];
      const next = verts[(i + 1) % n];
      // unknownIndex is either a single vertex or a list of them: a
      // quadrilateral question can have two equal unknowns, or three vertices
      // carrying the same x. Every existing caller passes a number and is
      // unaffected.
      const labelColor = (Array.isArray(unknownIndex) ? unknownIndex.includes(i) : i === unknownIndex)
        ? color
        : 'var(--ink)';
      elements.push(...angleMarker(v, prev, next, label, `pi${i}`, labelColor, {}, 6));
    });
    return svgWrap(elements, 200, 200, 'pgi', fig.big, shown);
  }

  if (fig.type === 'branching-pattern') {
    // Each node at generation k grows `ratio` children at generation k+1
    // (Haese 26C: geometric growth shown as a tree, not literal dots, since
    // raw counts explode too fast to lay out honestly past 3 generations).
    // `counts` is the node count per row, already computed by the
    // generator; children of node i in one row sit directly under it as a
    // contiguous block (index Math.floor(i / ratio) in the row above), so
    // the drawn tree reads as one growing shape rather than loose dots.
    const { ratio, counts = [] } = fig;
    if (!Array.isArray(counts) || counts.length < 1) return null;
    const W = 260;
    const rowY = [30, 95, 160].slice(0, counts.length);
    const nodeAt = (row, i) => {
      const n = counts[row];
      return [(W / (n + 1)) * (i + 1), rowY[row]];
    };
    const lines = [];
    const dots = [];
    for (let row = 0; row < counts.length; row++) {
      for (let i = 0; i < counts[row]; i++) {
        const [x, y] = nodeAt(row, i);
        if (row > 0) {
          const [px, py] = nodeAt(row - 1, Math.floor(i / ratio));
          lines.push(<line key={`ln${row}-${i}`} x1={px} y1={py} x2={x} y2={y} stroke="var(--ink)" strokeWidth={2} />);
        }
        dots.push(<circle key={`nd${row}-${i}`} cx={x} cy={y} r={6} fill="var(--ink)" />);
      }
    }
    return svgWrap([...lines, ...dots], W, 180, 'bp', fig.big, shown);
  }

  if (fig.type === 'growing-pattern') {
    // Terms 1-3 of an arithmetic "continue the pattern" question (Haese
    // 26B), one row each, as small repeated marks whose count is exactly
    // `counts[row]` — not a to-scale rebuild of a specific real construction
    // (a genuine matchstick-squares chain needs step = 3 exactly; this
    // generator's step is any 2-9), so each motif is a schematic stand-in
    // for "this many units" rather than a literal count of matches. Cell
    // size shrinks with the row's count so even the widest term (up to the
    // upper 20s) still fits the same box.
    const { motif, counts = [] } = fig;
    if (!Array.isArray(counts) || counts.length < 1) return null;
    const W = 280;
    const rowY = [40, 100, 160].slice(0, counts.length);
    const nodes = [];
    counts.forEach((n, row) => {
      const y = rowY[row];
      const cell = Math.min(22, (W - 16) / n);
      const startX = (W - n * cell) / 2 + cell / 2;
      for (let i = 0; i < n; i++) {
        const x = startX + i * cell;
        if (motif === 'matchstick-squares') {
          const s = cell * 0.82;
          nodes.push(<rect key={`sq${row}-${i}`} x={x - s / 2} y={y - s / 2} width={s} height={s} fill="none" stroke="var(--ink)" strokeWidth={2.5} />);
        } else if (motif === 'tile-squares') {
          const s = cell * 0.6;
          nodes.push(<rect key={`ts${row}-${i}`} x={x - s / 2} y={y - s / 2} width={s} height={s} fill="var(--ink)" />);
        } else {
          nodes.push(<circle key={`dt${row}-${i}`} cx={x} cy={y} r={Math.min(6, cell * 0.3)} fill="var(--ink)" />);
        }
      }
    });
    return svgWrap(nodes, W, 190, 'gp', fig.big, shown);
  }

  if (fig.type === 'dot-grid-pattern') {
    // Terms 1-3 of a quadratic "continue the pattern" question (Haese
    // 26D), one column each: an n×n dot grid (the n² part) plus a row of
    // `extraDots` underneath (the constant +c part). The extra-dots row
    // sits at the same fixed height in every column regardless of that
    // column's grid size, so the one thing that visibly *doesn't* grow
    // across terms 1-3 reads as clearly constant.
    const { extraDots = 0, counts = [] } = fig;
    if (!Array.isArray(counts) || counts.length < 1) return null;
    const W = 280;
    const spacing = 15;
    const dotR = 4;
    const gridTop = 30;
    const extraY = gridTop + 3 * spacing + 24; // fixed baseline, sized for the largest (3x3) grid shown
    const nodes = [];
    counts.forEach((_count, col) => {
      const n = col + 1; // term number
      const cx = (W / (counts.length + 1)) * (col + 1);
      const gridSpan = (n - 1) * spacing;
      for (let row = 0; row < n; row++) {
        for (let gcol = 0; gcol < n; gcol++) {
          const x = cx - gridSpan / 2 + gcol * spacing;
          const y = gridTop + row * spacing;
          nodes.push(<circle key={`g${col}-${row}-${gcol}`} cx={x} cy={y} r={dotR} fill="var(--ink)" />);
        }
      }
      if (extraDots > 0) {
        const rowSpan = (extraDots - 1) * (spacing * 0.7);
        for (let i = 0; i < extraDots; i++) {
          const x = cx - rowSpan / 2 + i * (spacing * 0.7);
          nodes.push(<circle key={`e${col}-${i}`} cx={x} cy={extraY} r={dotR * 0.75} fill="var(--ink)" />);
        }
      }
    });
    return svgWrap(nodes, W, 190, 'dg', fig.big, shown);
  }

  return null;
}
