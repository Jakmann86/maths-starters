// Test support only: the shared shape of a substitute-the-answer-back
// harness and its mutation test, for the harnesses written after the fact
// for generators that came over from the old app (Pythagoras, SOHCAHTOA,
// area, algebraic fractions, cubic sequences, arithmagons, data displays).
// Each of those files keeps its own checker; this only runs it.
//
// sample(): draws questions from the catalogue, checks every one, and
// counts the kinds the checker reports and the distinct questions.
//
// mutants(): breaks real questions with each operator and requires the
// checker to reject every broken copy. An operator returns false when it
// does not apply to a question; a copy that comes out unchanged is skipped.

import _ from 'lodash';
import { generateForSkill } from '../curriculum/skills';

export const BANDS = ['foundation', 'core', 'stretch'];

const signature = (q) => JSON.stringify([q.instruction, q.questionMath, q.questionText, q.visualization]);

export function sample(skillId, band, check, n) {
  const mix = {};
  const questions = new Set();
  for (let t = 0; t < n; t += 1) {
    const q = generateForSkill(skillId, band);
    const { kind } = check(q, band);
    mix[kind] = (mix[kind] ?? 0) + 1;
    questions.add(signature(q));
  }
  return { mix, distinct: questions.size };
}

export function report(skillId, band, { mix, distinct }, n) {
  const kinds = Object.entries(mix).sort().map(([k, v]) => `${k} ${v}`).join(', ');
  process.stdout.write(`${skillId} ${band}: ${distinct} distinct of ${n}; ${kinds}\n`);
}

/* --------------------------------------------------------- mutation ops */

const INT = /-?\d+(?:\.\d+)?/g;

/** Adds one to a randomly chosen number in s (to its last digit if a decimal). */
export function bump(s) {
  if (typeof s !== 'string') return null;
  const hits = [...s.matchAll(INT)];
  if (!hits.length) return null;
  const h = _.sample(hits);
  const txt = h[0];
  const dec = txt.includes('.') ? txt.split('.')[1].length : 0;
  const v = (Number(txt) * 10 ** dec + 1) / 10 ** dec;
  return s.slice(0, h.index) + v.toFixed(dec) + s.slice(h.index + txt.length);
}

/** Operators that apply to any question in the SPEC §3 shape. */
export const GENERIC = {
  'answer nudged': (q) => { const s = bump(q.answer); if (!s) return false; q.answer = s; },
  'question line nudged': (q) => { const s = bump(q.questionMath); if (!s) return false; q.questionMath = s; },
  'a working number nudged': (q) => { const s = bump(q.workingOut); if (!s) return false; q.workingOut = s; },
  'the working stops short': (q) => {
    const lines = q.workingOut.split('\n');
    if (lines.length < 2) return false;
    q.workingOut = lines.slice(0, -1).join('\n');
  },
  'a working line dropped': (q) => {
    const lines = q.workingOut.split('\n');
    if (lines.length < 3) return false;
    lines.splice(_.random(0, lines.length - 2), 1);
    q.workingOut = lines.join('\n');
  },
  'units changed': (q) => { if (!q.answerUnits) return false; q.answerUnits = q.answerUnits.includes('^2') ? q.answerUnits.replace('^2', '') : `${q.answerUnits}^2`; },
  'metadata changed': (q) => { q.metadata.difficulty = q.metadata.difficulty === 'core' ? 'stretch' : 'core'; },
};

/** The generic operators that apply to a skill's questions, by name. */
export const generic = (...names) => Object.fromEntries(names.map((n) => {
  if (!GENERIC[n]) throw new Error(`no generic operator ${n}`);
  return [n, GENERIC[n]];
}));

/**
 * A figure label nudged: one of the visualization's string fields that holds
 * a number, chosen at random among those not listed in `skip`.
 */
export const figureNudge = (skip = []) => (q) => {
  const f = q.visualization;
  if (!f) return false;
  const keys = Object.keys(f).filter((k) => typeof f[k] === 'string' && /\d/.test(f[k]) && !skip.includes(k));
  if (!keys.length) return false;
  const k = _.sample(keys);
  f[k] = bump(f[k]);
};

/**
 * Moves a question to another band (checked as if drawn there). `pairs`
 * maps a band to the band it moves to; a band left out is not moved, for
 * skills whose bands overlap by design.
 */
export const bandMove = (pairs = { foundation: 'core', core: 'stretch', stretch: 'core' }) => (q) => {
  const to = pairs[q.metadata.difficulty];
  if (!to) return false;
  q.__band = to;
  q.metadata.difficulty = to;
};

export function mutants({ skills, check, ops, perBand = 150 }) {
  const tally = {};
  skills.forEach((id) => BANDS.forEach((band) => {
    for (let t = 0; t < perBand; t += 1) {
      const q = generateForSkill(id, band);
      check(q, band);
      Object.entries(ops).forEach(([name, op]) => {
        const m = _.cloneDeep(q);
        if (op(m) === false) return;
        const b = m.__band ?? band;
        delete m.__band;
        if (_.isEqual(m, q) && b === band) return;
        const row = (tally[name] ??= { applied: 0, killed: 0, survivors: [] });
        row.applied += 1;
        try { check(m, b); row.survivors.push({ band: b, q: m }); } catch (err) {
          row.killed += 1;
          // Why each copy was rejected, numbers blanked, for reading by hand.
          (row.why ??= new Set()).add(err.message.split('\n')[0].replace(/-?\d+(\.\d+)?/g, '#').slice(0, 90));
        }
      });
    }
  }));
  Object.entries(tally).forEach(([name, r]) => {
    process.stdout.write(`${name}: ${r.killed}/${r.applied} killed\n`);
    // MUTANT_REASONS=1 lists why each operator's copies were rejected.
    if (process.env.MUTANT_REASONS) [...(r.why ?? [])].slice(0, 6).forEach((w) => process.stdout.write(`    ${w}\n`));
  });
  return tally;
}
