// Substitute-the-answer-back harness for interval notation, with its
// mutation test: interval-list-elements and interval-write. The checker
// (intervalGenerators.check.js) parses set-builder notation into a
// membership test and reads number lines off their figure config.
//
// Run: npx vitest run src/generators/number/intervalGenerators.test.js

import { describe, expect, it } from 'vitest';
import { BANDS, sample, report, mutants, generic, bandMove } from '../harness.check';
import { checkListElements, checkWrite } from './intervalGenerators.check';
import { skillsInTopic, topicGroups } from '../../curriculum/skills';

const N = 6000;
const CHECKS = { 'interval-list-elements': checkListElements, 'interval-write': checkWrite };
const check = (q, band) => CHECKS[q.metadata?.topic]?.(q, band) ?? (() => { throw new Error('topic'); })();

const KINDS = {
  'interval-list-elements': {
    foundation: ['< <', '< ≤', '≤ <', '≤ ≤'],
    core: ['N two bounds', 'N upper bound', 'Z+ two bounds', 'Z+ upper bound'],
    stretch: ['down Z', 'up N', 'up Z'],
  },
  'interval-write': { foundation: ['finite list'], core: ['between'], stretch: ['list carrying on', 'ray', 'two rays'] },
};

// Distinct questions in 6,000. These are small pools by nature, and the
// floors are their real sizes, not targets. A list of integers between two
// bounds is fixed by where it starts and stops, so Foundation listing has
// about 190. A list that carries on is fixed by one number and its
// direction, about 70. Writing a finite list of consecutive integers: 13
// starts and 5 lengths, 65 in all, every one of them seen.
const FLOOR = {
  'interval-list-elements': { foundation: 180, core: 250, stretch: 60 },
  'interval-write': { foundation: 65, core: 700, stretch: 300 },
};

describe('interval notation', () => {
  Object.keys(CHECKS).forEach((id) => BANDS.forEach((band) => {
    it(`${id} ${band}: the answer is the set, exactly`, () => {
      const r = sample(id, band, check, N);
      report(id, band, r, N);
      expect(Object.keys(r.mix).sort()).toEqual([...KINDS[id][band]].sort());
      expect(r.distinct).toBeGreaterThanOrEqual(FLOOR[id][band]);
    });
  }));

  it('sits in Number, after the assumed knowledge', () => {
    expect(skillsInTopic('Interval notation')).toEqual(['interval-list-elements', 'interval-write']);
    const num = topicGroups().find((g) => g.name === 'Number').topics;
    expect(num.indexOf('Interval notation')).toBe(num.indexOf('Rational numbers') + 1);
  });

  it('rejects every broken copy', () => {
    const flipFirst = (s) => (s.includes('\\le') ? s.replace('\\le', '<') : s.includes('<') ? s.replace('<', '\\le') : null);
    // Flips the last bound's symbol: in Core listing, the first is the
    // distractor below where N or Z+ starts, and flipping it changes nothing.
    const flipLast = (s) => {
      const i = Math.max(s.lastIndexOf('\\le'), s.lastIndexOf('<'));
      if (i < 0) return null;
      return s.startsWith('\\le', i) ? `${s.slice(0, i)}<${s.slice(i + 3)}` : `${s.slice(0, i)}\\le${s.slice(i + 1)}`;
    };
    // Core listing's lower bound is a distractor, and with N a bound above
    // the set's start in Stretch changes nothing whichever set it is in, so
    // those numbers are left alone: changing them is no change at all.
    const listCore = (q) => q.metadata.topic === 'interval-list-elements' && q.metadata.difficulty === 'core';
    const ops = {
      ...generic('answer nudged', 'a working number nudged', 'the working stops short', 'metadata changed'),
      'the last number in the question nudged': (q) => {
        const m = [...(q.questionMath ?? '').matchAll(/-?\d+/g)].at(-1);
        if (!m) return false;
        q.questionMath = q.questionMath.slice(0, m.index) + String(Number(m[0]) + 1) + q.questionMath.slice(m.index + m[0].length);
      },
      'question line nudged': (q) => {
        if (listCore(q) || !q.questionMath) return false;
        const m = /-?\d+/.exec(q.questionMath);
        if (!m) return false;
        q.questionMath = q.questionMath.slice(0, m.index) + String(Number(m[0]) - 1) + q.questionMath.slice(m.index + m[0].length);
      },
      'an end flipped in the answer': (q) => { const s = flipFirst(q.answer); if (!s) return false; q.answer = s; },
      'an end flipped in the question': (q) => { const s = flipLast(q.questionMath ?? ''); if (!s || !/mid/.test(s)) return false; q.questionMath = s; },
      'the number set changed': (q) => {
        const t = /mathbb/.test(q.questionMath ?? '') ? 'questionMath' : /mathbb/.test(q.answer) ? 'answer' : null;
        if (!t || (q.metadata.topic === 'interval-list-elements' && q.metadata.difficulty === 'stretch')) return false;
        q[t] = q[t].includes('\\mathbb{Z}^+') ? q[t].replace('\\mathbb{Z}^+', '\\mathbb{N}')
          : q[t].includes('\\mathbb{N}') ? q[t].replace('\\mathbb{N}', '\\mathbb{Z}') : q[t].replace('\\mathbb{Z}', '\\mathbb{N}');
      },
      'the dots dropped': (q) => {
        const t = /ldots/.test(q.answer) ? 'answer' : /ldots/.test(q.questionMath ?? '') && !/mid/.test(q.questionMath) ? 'questionMath' : null;
        if (!t) return false;
        q[t] = q[t].replace('\\ldots, ', '').replace(', \\ldots', '');
      },
      'a circle filled or emptied': (q) => {
        const p = q.visualization?.set?.parts?.[0];
        if (!p) return false;
        if (p.from !== null) p.fromIn = !p.fromIn; else p.toIn = !p.toIn;
      },
      'a circle moved': (q) => {
        const p = q.visualization?.set?.parts?.at(-1);
        if (!p) return false;
        if (p.to !== null) p.to -= 1; else p.from += 1;
      },
      'a ray turned round': (q) => {
        const ps = q.visualization?.set?.parts;
        if (!ps || ps.length !== 1 || (ps[0].from !== null && ps[0].to !== null)) return false;
        const p = ps[0];
        ps[0] = p.from === null ? { from: p.to, to: null, fromIn: p.toIn } : { from: null, to: p.from, toIn: p.fromIn };
      },
      'moved to another band': bandMove({ foundation: 'core', core: 'stretch', stretch: 'foundation' }),
    };
    const tally = mutants({ skills: Object.keys(CHECKS), check, ops, perBand: 200 });
    Object.entries(tally).forEach(([name, r]) => expect(r.survivors.slice(0, 2).map((s) => s.q), name).toEqual([]));
    expect(Object.keys(tally).sort()).toEqual(Object.keys(ops).sort());
  });
});
