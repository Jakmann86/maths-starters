import { reseed } from './seed.mjs';
const { skills, generateForSkill, BANDS } = await import('../../src/curriculum/skills.js');
export { skills, BANDS };
export const bandsOf = (id) => skills[id].difficulties;
export const draw = (id, band, n) => { reseed(id, band, n); return generateForSkill(id, band); };
