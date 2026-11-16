// Seeded PRNG installed over Math.random. MUST be imported before anything
// else (lodash captures Math.random at load). The generators are untouched.
import { register } from 'node:module';
register('./resolve-hook.mjs', import.meta.url);

let state = 1;
const hash = (str) => { let h = 2166136261 >>> 0; for (let i = 0; i < str.length; i += 1) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };
function mulberry32() {
  state = (state + 0x6D2B79F5) | 0;
  let t = state;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
Math.random = mulberry32;
/** A finding's seed is the integer n; the stream is keyed on skill|band|n. */
export const reseed = (skillId, band, n) => { state = hash(`${skillId}|${band}|${n}`); };
