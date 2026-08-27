// Question and instruction sizes as clamp() built from line count and longest
// line length, in cqh/cqi units — see DESIGN.md "Type sizing is computed, not
// scaled". Do not replace with a fixed type scale.

export function iSize(instr) {
  return String(instr || '').length > 44
    ? 'clamp(17px,min(6cqh,3cqi),27px)'
    : 'clamp(19px,min(7cqh,3.6cqi),32px)';
}

function visualLength(str) {
  return str
    .replace(/\\ldots/g, '…')
    .replace(/\\times/g, '×')
    .replace(/\\div/g, '÷')
    .replace(/\\pm/g, '±')
    .replace(/\\le/g, '≤').replace(/\\ge/g, '≥').replace(/\\ne/g, '≠')
    .replace(/\\circ/g, '°')
    .replace(/\\text\{([^}]*)\}/g, '$1')
    .replace(/\\,|\\;|\\!/g, ' ')
    .replace(/\\ /g, ' ')
    .length;
}

export function qSize(q, instr) {
  const lines = String(q || '').split('\n').length;
  const longest = Math.max(...String(q || '').split('\n').map((l) => visualLength(l)), 1);
  const wordy = String(instr || '').length > 44;
  const h = lines >= 3 ? 9 : lines === 2 ? 13 : wordy ? 17 : 21;
  const w = Math.min(95 / Math.max(longest, 7), 12);
  const floor = lines >= 3 ? 24 : 26;
  return `clamp(${floor}px,min(${h}cqh,${w.toFixed(1)}cqi),66px)`;
}
