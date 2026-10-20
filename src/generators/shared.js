// src/generators/shared.js
//
// Arithmetic helpers that more than one generator family needs. Pure
// functions, like the generators that import them.

/** Greatest common divisor, always non-negative. gcd(0, 0) is 0. */
export const gcd = (a, b) => {
  let x = Math.abs(a);
  let y = Math.abs(b);
  while (y) [x, y] = [y, x % y];
  return x;
};

export const lcm = (a, b) => Math.abs(a * b) / gcd(a, b);

/** A whole number of tenths printed to one decimal place, dropping a .0.
 *  Built from integers, so no float error creeps in. The sign is taken off
 *  first, so a negative value prints as its positive one with a minus. */
export const dp1 = (tenths) => {
  const sign = tenths < 0 ? '-' : '';
  const a = Math.abs(tenths);
  return a % 10 === 0 ? `${sign}${a / 10}` : `${sign}${Math.floor(a / 10)}.${a % 10}`;
};

/** The median of an ascending list: the (n + 1)/2 th value, averaging the
 *  middle pair when n is even. */
export const median = (sorted) => {
  const n = sorted.length;
  return n % 2 ? sorted[(n - 1) / 2] : (sorted[n / 2 - 1] + sorted[n / 2]) / 2;
};

/**
 * Every Pythagorean triple [a, b, c] with hypotenuse c at most `limit`, by
 * Euclid's formula — never a hardcoded list (CLAUDE.md §8). Primitive triples
 * come from coprime m > n of opposite parity, and each is scaled by every k
 * that fits, so no triple appears twice. The legs are in the order the
 * formula gives them (a = m² − n², b = 2mn), so neither is always the shorter.
 */
export const pythagoreanTriples = (limit) => {
  const out = [];
  for (let m = 2; m * m < limit; m += 1) {
    for (let n = 1; n < m; n += 1) {
      if ((m - n) % 2 === 0 || gcd(m, n) !== 1) continue;
      const [a, b, c] = [m * m - n * n, 2 * m * n, m * m + n * n];
      for (let k = 1; k * c <= limit; k += 1) out.push([k * a, k * b, k * c]);
    }
  }
  return out;
};
