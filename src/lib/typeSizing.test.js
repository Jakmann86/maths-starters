import { describe, it, expect } from 'vitest';
import { iSize, isSimpleFraction, pSize, P_RANGE, qSize, Q_RANGE } from './typeSizing';

describe('isSimpleFraction', () => {
  it.each([
    '\\frac{3}{4}', '\\frac{15}{9y}', '-\\frac{2}{3}', '\\frac{x^{5}}{x^{2}}', '\\frac{x^{-2}}{y}', '\\frac{6x^2}{3x}',
  ])('one term over one term: %s', (tex) => expect(isSimpleFraction(tex)).toBe(true));

  it.each([
    '\\frac{x + 1}{3}', '\\frac{x^2 + 3x + 2}{x + 1}', '\\frac{2(x + 1)}{3}', '\\frac{1}{2} + \\frac{1}{3}',
    '\\frac{1}{2} \\times \\frac{3}{4}', 'x = \\frac{1}{2}', '\\frac{\\frac{1}{2}}{3}', '\\frac{1}{2}\n\\frac{3}{4}',
  ])('anything more: %s', (tex) => expect(isSimpleFraction(tex)).toBe(false));
});

describe('qSize', () => {
  it('caps a simple fraction below the ceiling of everything else', () => {
    expect(qSize('\\frac{3}{4}', 'Simplify', false, false)).toMatch(new RegExp(`,${Q_RANGE.fraction}px\\)$`));
    expect(qSize('\\frac{x + 1}{3}', 'Simplify', false, false)).toMatch(new RegExp(`,${Q_RANGE.ceiling}px\\)$`));
    expect(qSize('3x + 2', 'Simplify', false, false)).toMatch(new RegExp(`,${Q_RANGE.ceiling}px\\)$`));
  });

  it('measures a log by what it shows, not its source', () => {
    // log₂ x + log₂(x + 6) = 4 is as wide on screen as any 24-character line.
    expect(qSize('\\log_{2} x + \\log_{2}(x + 6) = 4', 'Solve', false, false))
      .toBe(qSize('abcd x + abcd(x + 6) = 4', 'Solve', false, false));
  });
});

// clamp(Apx, ..., Bpx) -> [A, B]
const bounds = (clamp) => {
  const m = /^clamp\((\d+(?:\.\d+)?)px,.*,(\d+(?:\.\d+)?)px\)$/.exec(clamp);
  return [Number(m[1]), Number(m[2])];
};

describe('the size range', () => {
  it('leaves the instruction size exactly as it was', () => {
    expect(iSize('Factorise')).toBe('clamp(19px,min(7cqh,3.6cqi),32px)');
    expect(iSize('The table shows the times people took to finish a race. Find the mean'))
      .toBe('clamp(17px,min(6cqh,3cqi),27px)');
  });

  // One, two and three lines; short and long; a lone fraction; beside a
  // figure and not; compact; scaled.
  const SAMPLES = [
    ['3x + 2', 'Simplify', false, false],
    ['\\log_{9} 729', 'Evaluate', false, false],
    ['\\frac{3}{4}', 'Simplify', false, false],
    ['\\frac{y + 7}{2} - \\frac{3y + 5}{9}', 'Simplify', false, false],
    ['\\left(-\\frac{5}{3}\\right)^{2} + \\left(-\\frac{5}{3}\\right) \\times \\frac{11}{3}', 'Calculate', false, false],
    ['y = x + 8\ny = 3x + 16', 'Solve the simultaneous equations', false, false],
    ['a + a + b = 22\nb + b + c = 19\na + c = 14', 'Find the value of each symbol', false, false],
    ["(B \\cup C) \\cap A'", 'Shade the region', false, true],
    ['V = 1030 \\text{ cm}^3', 'Find the height of the cuboid', true, true],
    ['x^2 + 7x + 12', 'Factorise', false, false, 0.75],
  ];

  it.each(SAMPLES)('keeps ceiling : floor within 1.75 for %s', (...args) => {
    const [floor, ceiling] = bounds(qSize(...args));
    expect(ceiling / floor).toBeLessThanOrEqual(1.75);
  });

  it('keeps a worded question within 1.75 too, a step below the maths', () => {
    const [floor, ceiling] = bounds(pSize());
    expect(pSize()).toBe('clamp(26px,7.75cqh,40px)');
    expect(ceiling / floor).toBeLessThanOrEqual(1.75);
    expect(P_RANGE.ceiling).toBeCloseTo(Q_RANGE.ceiling / 1.25, 0);
  });

  it('caps a lone fraction below the general ceiling', () => {
    const [, frac] = bounds(qSize('\\frac{3}{4}', 'Simplify', false, false));
    const [, general] = bounds(qSize('3x + 2', 'Simplify', false, false));
    expect(frac).toBeLessThan(general);
  });

  it('lowers the ceiling with questionScale but never the floor', () => {
    const q = 'y = x + 8\ny = 3x + 16';
    const [floor, ceiling] = bounds(qSize(q, 'Solve', false, false));
    const [sFloor, sCeiling] = bounds(qSize(q, 'Solve', false, false, 0.75));
    expect(sCeiling).toBeLessThan(ceiling);
    expect(sFloor).toBe(floor);
  });
});
