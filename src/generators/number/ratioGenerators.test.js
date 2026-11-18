// Substitute-the-answer-back harness for the ratio skills of Ratio and
// proportion, with its mutation test: ratio-simplify, ratio-proportion,
// ratio-share and map-scale. The checker (ratioGenerators.check.js) reads
// each ratio, prose or scale back from what is printed and checks every
// working line in a common unit.
//
// Run: npx vitest run src/generators/number/ratioGenerators.test.js

import { describe, expect, it } from 'vitest';
import { BANDS, sample, report, mutants, generic, bandMove } from '../harness.check';
import { checkRatioSimplify, checkRatioProportion, checkRatioShare, checkMapScale } from './ratioGenerators.check';
import { skillsInTopic, strandOf } from '../../curriculum/skills';

const N = 6000;
const CHECKS = {
  'ratio-simplify': checkRatioSimplify,
  'ratio-proportion': checkRatioProportion,
  'ratio-share': checkRatioShare,
  'map-scale': checkMapScale,
};
const check = (q, band) => CHECKS[q.metadata?.topic]?.(q, band) ?? (() => { throw new Error('topic'); })();

const KINDS = {
  'ratio-simplify': { foundation: ['three parts', 'two parts'], core: ['different units'], stretch: ['decimals', 'fractions'] },
  'ratio-proportion': { foundation: ['scaled down', 'scaled up'], core: ['cost', 'recipe'], stretch: ['bigger is better', 'smaller is better'] },
  'ratio-share': { foundation: ['three parts', 'two parts'], core: ['find a share', 'find the total'], stretch: ['find a share', 'find the total'] },
  'map-scale': { foundation: ['real distance'], core: ['map distance'], stretch: ['the scale'] },
};

// Distinct questions in 6,000, with each floor a little under what is
// seen, so a run that happens to miss a few does not fail. Most bands run
// to thousands. Three are small pools by nature, and their floors sit just
// under their real size. A map distance is a scale and a distance in half
// centimetres: 348 in all, each way. Finding the scale needs a whole
// centimetre: 168 in all. Decimal and fractional ratios that simplify to
// something small: about 660.
const FLOOR = {
  'ratio-simplify': { foundation: 2700, core: 4200, stretch: 620 },
  'ratio-proportion': { foundation: 3800, core: 5200, stretch: 5600 },
  'ratio-share': { foundation: 5000, core: 5600, stretch: 5500 },
  'map-scale': { foundation: 340, core: 340, stretch: 160 },
};

describe('ratio', () => {
  Object.keys(CHECKS).forEach((id) => BANDS.forEach((band) => {
    it(`${id} ${band}: the answer follows from what is printed`, () => {
      const r = sample(id, band, check, N);
      report(id, band, r, N);
      expect(Object.keys(r.mix).sort()).toEqual([...KINDS[id][band]].sort());
      expect(r.distinct).toBeGreaterThanOrEqual(FLOOR[id][band]);
    });
  }));

  it('opens Ratio and proportion, before variation', () => {
    expect(skillsInTopic('Ratio and proportion')).toEqual([...Object.keys(CHECKS), 'direct-variation', 'inverse-variation']);
    expect(strandOf('Ratio and proportion')).toBe('Algebra');
  });

  it('rejects every broken copy', () => {
    const ops = {
      ...generic('answer nudged', 'question line nudged', 'a working number nudged', 'the working stops short', 'metadata changed'),
      'a number in the prose nudged': (q) => {
        const hits = [...(q.questionText ?? '').matchAll(/\d+/g)];
        if (!hits.length) return false;
        const h = hits[hits.length > 1 ? 1 : 0];
        q.questionText = q.questionText.slice(0, h.index) + String(Number(h[0]) + 1) + q.questionText.slice(h.index + h[0].length);
      },
      'the ratio turned round': (q) => {
        const src = q.questionText ?? q.questionMath;
        const m = /(\d+) : (\d+)(?! :)/.exec(src);
        if (!m || m[1] === m[2] || m[1] === '1') return false;
        const out = src.replace(m[0], `${m[2]} : ${m[1]}`);
        if (q.questionText) q.questionText = out; else q.questionMath = out;
      },
      'the answer unit changed': (q) => {
        if (!q.answerUnits) return false;
        q.answerUnits = { g: 'ml', ml: 'g', m: 'km', km: 'm', cm: 'm' }[q.answerUnits] ?? 'cm';
      },
      'the better pack swapped': (q) => {
        const m = /^\\text\{the (\d+) /.exec(q.answer);
        if (!m) return false;
        const other = [...q.questionText.matchAll(/An? (\d+) (?:g|ml)/g)].map((h) => h[1]).find((v) => v !== m[1]);
        q.answer = q.answer.replace(m[1], other);
        const w = q.workingOut.split('\n');
        w[w.length - 1] = q.answer;
        q.workingOut = w.join('\n');
      },
      'moved to another band': bandMove({ foundation: 'core', core: 'stretch', stretch: 'foundation' }),
    };
    const tally = mutants({ skills: Object.keys(CHECKS), check, ops, perBand: 200 });
    Object.entries(tally).forEach(([name, r]) => expect(r.survivors.slice(0, 2).map((s) => s.q), name).toEqual([]));
    expect(Object.keys(tally).sort()).toEqual(Object.keys(ops).sort());
  });
});
