// Question and instruction sizes as clamp() built from line count and longest
// line length, in cqh/cqi units — see DESIGN.md "Type sizing is computed, not
// scaled". Do not replace with a fixed type scale.

// The size range of the question maths and of a worded question, in one place.
//
// The rule: on one board, the biggest question and the smallest differ by no
// more than about 1.75 : 1, so a mixed board (a short sum beside a three-line
// pair of equations, a lone fraction beside a worded question) looks in
// proportion. A worded question sits one step (÷ 1.25) below the maths: it is
// a sentence to read, not an expression to take in at a glance.
//
//   floor      the smallest a question is ever set, so the back row can read it
//   floor3     the floor for three or more lines, which need the height
//   ceiling    the largest a question grows to (before questionScale)
//   fraction   the ceiling for a lone fraction (isSimpleFraction), which stands
//              far taller than any other single line
//   compactCap the ceiling for a compact given line beside a figure
//   grow       scales the cqh growth terms with the ceiling (ceiling / 76, the
//              old ceiling), so one, two and three lines still step down in
//              size instead of all meeting the ceiling together
//
// The dev page /size-test.html can override these from its query string;
// the app itself only ever reads these defaults.
export const Q_RANGE = Object.freeze({
  floor: 32,
  floor3: 30,
  ceiling: 50,
  fraction: 36,
  compactCap: 44,
  grow: 50 / 76,
});

// A worded question: clamp(floor, grow cqh, ceiling), one step below the
// maths (Q_RANGE ÷ 1.25, rounded).
export const P_RANGE = Object.freeze({
  floor: 26,
  grow: 7.75,
  ceiling: 40,
});

export function iSize(instr) {
  return String(instr || '').length > 44
    ? 'clamp(17px,min(6cqh,3cqi),27px)'
    : 'clamp(19px,min(7cqh,3.6cqi),32px)';
}

// A worded question (questionText) is a sentence to read, not an expression
// to take in at a glance, so it is set a step above the instruction rather
// than at display size, in the regular-weight serif (.mprose). cqh resolves
// against the slot: `.slot-question` is an inline-size container only.
export function pSize(range = P_RANGE) {
  return `clamp(${range.floor}px,${range.grow}cqh,${range.ceiling}px)`;
}

function visualLength(str) {
  const s = str
    .replace(/\\ldots/g, '…')
    .replace(/\\times/g, '×')
    .replace(/\\div/g, '÷')
    .replace(/\\pm/g, '±')
    .replace(/\\cap/g, '∩').replace(/\\cup/g, '∪')
    .replace(/\\[{}]/g, '{')
    .replace(/\\le/g, '≤').replace(/\\ge/g, '≥').replace(/\\ne/g, '≠')
    .replace(/\\approx/g, '≈').replace(/\\quad/g, '  ')
    .replace(/\\circ/g, '°')
    .replace(/\\text\{([^}]*)\}/g, '$1')
    .replace(/\\,|\\;|\\!/g, ' ')
    .replace(/\\ /g, ' ')
    // A log's base is a small subscript: \log_{2} is about four characters
    // wide on screen (log₂), not the eight it takes to write.
    .replace(/\\log_\{([^{}]*(?:\{[^{}]*\})?[^{}]*)\}/g, 'log$1')
    .replace(/\\log/g, 'log')
    // An index sits small and raised; its braces take no room. Dropped
    // before the \frac rule below, which can't see past nested braces —
    // \frac{2^{8}}{2^{7}} otherwise counted as its full source length.
    .replace(/\^\{([^{}]*)\}/g, '^$1')
    // A recurring-decimal dot sits over its digit, and a number card's box
    // is one character wide however long `\boxed{\phantom{0}}` is to write.
    .replace(/\\dot\{([^{}]*)\}/g, '$1')
    .replace(/\\phantom\{([^{}]*)\}/g, '$1')
    .replace(/\\boxed\{([^{}]*)\}/g, '$1 ')
    // A \frac{a}{b} stacks its numerator and denominator instead of laying
    // them side by side, so its on-screen width is close to the wider of
    // the two, not the length of the whole `\frac{a}{b}` source — counting
    // the source literally (as the algebraic-fractions topic, chapter 16,
    // does almost every question) makes a fraction-only line look far
    // longer than it renders and sizes the question needlessly small.
    .replace(/\\frac\{([^{}]*)\}\{([^{}]*)\}/g, (_, num, den) => (
      'x'.repeat(Math.max(num.length, den.length) + 1)
    ));
  return s.length;
}

// One fraction and nothing else, one term on the top and one on the bottom:
// \frac{15}{9y}, \frac{x^{5}}{x^{2}}. Stacked at display size it stands much
// taller than any other single line, so its ceiling is lower. A bracket, a
// sum or a second fraction is more to read, and sizes like any other line.
const LONE_FRACTION = /^\s*-?\\frac\{((?:[^{}]|\{[^{}]*\})*)\}\{((?:[^{}]|\{[^{}]*\})*)\}\s*$/;
export function isSimpleFraction(q) {
  const m = LONE_FRACTION.exec(String(q || ''));
  if (!m) return false;
  // An index isn't a second term: x^{-2} is still one term.
  const oneTerm = (t) => !/[+\-(]|\\frac|\\times|\\div/.test(t.replace(/\^\{[^{}]*\}/g, ''));
  return oneTerm(m[1]) && oneTerm(m[2]);
}

// `compact` is for the "given quantity" line of a reverse question (e.g.
// "Volume = 1030 cm^3"). It names the given, so it stays below the display
// size of a question, but the class needs its number to do the question, so it
// has to read from the back of the room: the same floor as any other question.
//
// A skill with no `visualization` at all (Coordinate geometry, say) has no
// figure to defer to. Its compact line is the only text in the row, doing
// the job a normal (non-compact) question does everywhere else in the app —
// and everywhere else, the question reads larger than the answer, not
// smaller. So `hasFigure` says whether there's a figure for the compact line
// to stay smaller than; without one, it sizes like any other question.
//
// `scale` shrinks a skill's question below what the rules above would give,
// for a skill whose working the teacher writes in the box beside it (a pair
// of simultaneous equations). It scales the growth terms and the ceiling, not
// the floor: a scaled question still reads from the back of the room.
//
// `range` is Q_RANGE unless the dev size-test page is trying another spread.
//
// `max` is a plain ceiling in px, for a skill with several lines of working
// beside it (harder rearranging): the question grows as it would, but no
// further than `max`. Unlike `scale` it leaves a long line alone, which is
// already narrower than the cap, rather than shrinking it further.
export function qSize(q, instr, compact, hasFigure = true, scale = 1, range = Q_RANGE, max = Infinity) {
  const lines = String(q || '').split('\n').length;
  const longest = Math.max(...String(q || '').split('\n').map((l) => visualLength(l)), 1);
  const wordy = String(instr || '').length > 44;
  // The height term steps with the line count. Scaled by `grow` with the
  // ceiling: unscaled, at 1080p one and two lines both overshot the 50px
  // ceiling and came out the same size.
  const h = range.grow * (lines >= 3 ? 10 : lines === 2 ? 15 : wordy ? 19 : 24);
  // cqi here is the question's own box (`.slot-question` is an inline-size
  // container), not the slot: beside a figure that is only the width left
  // over. Without a figure the two are the same width (cqi measures inside
  // the slot's padding), so those questions size exactly as before. Sized
  // against the whole slot, a set expression beside a Venn diagram ran off
  // the right edge on a 1366px screen.
  //
  // Beside a figure the box is narrow, so the whole-slot rule — which fills
  // about two thirds of the width and caps at 14cqi for short lines — wastes
  // most of it. There the width term aims at about nine tenths instead
  // (0.6em a character — KaTeX digits run wide), and the ceiling does the
  // capping. The width term is not scaled by `grow`: it is what keeps a long
  // line inside the box, and scaling it would shrink a long line below the
  // size it fits at.
  const w = scale * (hasFigure
    ? 150 / Math.max(longest, 3)
    : Math.min(109 / Math.max(longest, 7), 14));
  const floor = lines >= 3 ? range.floor3 : range.floor;
  if (compact && hasFigure) {
    return `clamp(${floor}px,min(${(h * 0.6 * scale).toFixed(1)}cqh,${w.toFixed(1)}cqi),${Math.round(Math.min(range.compactCap * scale, max))}px)`;
  }
  const ceiling = Math.round(Math.min((isSimpleFraction(q) ? range.fraction : range.ceiling) * scale, max));
  return `clamp(${floor}px,min(${+(h * scale).toFixed(2)}cqh,${w.toFixed(1)}cqi),${ceiling}px)`;
}
