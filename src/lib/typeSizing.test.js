import { describe, it, expect } from 'vitest';
import { isSimpleFraction, qSize } from './typeSizing';

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
    expect(qSize('\\frac{3}{4}', 'Simplify', false, false)).toMatch(/,54px\)$/);
    expect(qSize('\\frac{x + 1}{3}', 'Simplify', false, false)).toMatch(/,76px\)$/);
    expect(qSize('3x + 2', 'Simplify', false, false)).toMatch(/,76px\)$/);
  });
});
