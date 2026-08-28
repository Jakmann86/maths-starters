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
  const h = lines >= 3 ? 10 : lines === 2 ? 15 : wordy ? 19 : 24;
  const w = Math.min(109 / Math.max(longest, 7), 14);
  const floor = lines >= 3 ? 28 : 30;
  return `clamp(${floor}px,min(${h}cqh,${w.toFixed(1)}cqi),76px)`;
}
