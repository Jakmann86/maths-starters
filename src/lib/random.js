export const R = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
export const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
export const sg = (n) => (n < 0 ? `− ${Math.abs(n)}` : `+ ${n}`);
export const gcd = (a, b) => (b ? gcd(b, a % b) : a);
