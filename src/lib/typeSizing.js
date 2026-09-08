// Question and instruction sizes as clamp() built from line count and longest
// line length, in cqh/cqi units — see DESIGN.md "Type sizing is computed, not
// scaled". Do not replace with a fixed type scale.

export function iSize(instr) {
  return String(instr || '').length > 44
    ? 'clamp(17px,min(6cqh,3cqi),27px)'
    : 'clamp(19px,min(7cqh,3.6cqi),32px)';
}

function visualLength(str) {
  const s = str
    .replace(/\\ldots/g, '…')
    .replace(/\\times/g, '×')
    .replace(/\\div/g, '÷')
    .replace(/\\pm/g, '±')
    .replace(/\\le/g, '≤').replace(/\\ge/g, '≥').replace(/\\ne/g, '≠')
    .replace(/\\circ/g, '°')
    .replace(/\\text\{([^}]*)\}/g, '$1')
    .replace(/\\,|\\;|\\!/g, ' ')
    .replace(/\\ /g, ' ')
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

// `compact` is for the "given quantity" line of a reverse question (e.g.
// "Volume = 1030 cm^3") — it names the given, it isn't the thing being
// solved, so it should read smaller than the answer it leads to, not bigger.
export function qSize(q, instr, compact) {
  const lines = String(q || '').split('\n').length;
  const longest = Math.max(...String(q || '').split('\n').map((l) => visualLength(l)), 1);
  const wordy = String(instr || '').length > 44;
  const h = lines >= 3 ? 10 : lines === 2 ? 15 : wordy ? 19 : 24;
  const w = Math.min(109 / Math.max(longest, 7), 14);
  const floor = lines >= 3 ? 28 : 30;
  if (compact) {
    return `clamp(${Math.round(floor * 0.7)}px,min(${(h * 0.6).toFixed(1)}cqh,${(w * 0.7).toFixed(1)}cqi),44px)`;
  }
  return `clamp(${floor}px,min(${h}cqh,${w.toFixed(1)}cqi),76px)`;
}
