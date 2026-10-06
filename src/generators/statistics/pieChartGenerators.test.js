// src/generators/statistics/pieChartGenerators.test.js
//
// Substitute-the-answer-back checks for pie-charts. Every answer is
// recomputed from the figure config and the printed instruction — the
// angle off each sector's drawn `note`, the total out of the prose, the
// frequencies out of the table rows — never from the generator's variables.
//
// Run: npx vitest run src/generators/statistics/pieChartGenerators.test.js

import { describe, expect, it } from 'vitest';
import { generatePieCharts } from './pieChartGenerators';
import { parseArchivoLine } from '../../lib/archivoMath.jsx';

const SAMPLES = 5000;

// a × b ÷ c, asserted whole — a fractional answer is itself a failure.
const whole = (a, b, c) => {
  expect((a * b) % c).toBe(0);
  return (a * b) / c;
};

const degOf = (note) => {
  const m = String(note).match(/^(\d+)°$/);
  return m ? Number(m[1]) : null;
};

// The sector a clause is about: the one whose name appears in it, and only one.
const sectorIn = (clause, sectors) => {
  const hits = sectors.filter((s) => new RegExp(`\\b${s.name}\\b`, 'i').test(clause));
  expect(hits).toHaveLength(1);
  return hits[0];
};

const checkChart = (fig) => {
  expect(fig.type).toBe('pie-chart');
  const angles = fig.sectors.map((s) => s.angle);
  expect(angles.reduce((a, b) => a + b, 0)).toBe(360);
  angles.forEach((a) => {
    expect(Number.isInteger(a)).toBe(true);
    expect(a).toBeGreaterThanOrEqual(45);
    expect(a).toBeLessThanOrEqual(200);
  });
  expect(new Set(angles).size).toBe(angles.length);
  expect(new Set(fig.sectors.map((s) => s.name)).size).toBe(angles.length);
  // A drawn note must tell the truth about the sector it sits in.
  fig.sectors.forEach((s) => {
    if (s.note !== '?') expect(degOf(s.note)).toBe(s.angle);
  });
  expect(fig.sectors.some((s) => s.name === fig.unknown)).toBe(true);
};

const checkText = (q) => {
  const all = [q.instruction, q.workingOut, q.answer, q.answerUnits].filter(Boolean).join(' ');
  expect(all).not.toMatch(/\\n|,\\ |\\sum/);
  expect(q.questionMath).toBeUndefined();
  q.workingOut.split('\n').forEach((line) => expect(parseArchivoLine(line, 'w')).not.toBeNull());
  const a = q.answerUnits ? `${q.answer}\\text{ }${q.answerUnits}` : q.answer;
  expect(parseArchivoLine(a, 'a')).not.toBeNull();
};

// Recompute the answer from what is on the board. Returns [answer, variant].
const solve = (q) => {
  const { instruction: text, visualization: fig } = q;

  if (fig.type === 'table') {
    const body = fig.rows.slice(1);
    const total = body.reduce((acc, r) => acc + Number(r[1]), 0);
    const name = text.match(/sector angle for (\w+) on a pie chart/)[1];
    const row = body.find((r) => r[0] === name);
    return [`${whole(Number(row[1]), 360, total)}^\\circ`, 'core'];
  }

  checkChart(fig);
  const asked = text.match(/How many ([^?]+)\?$/)[1];
  const target = sectorIn(asked, fig.sectors);
  // The slot colour marks the sector being asked for, in every shape.
  expect(fig.unknown).toBe(target.name);

  const blank = fig.sectors.filter((s) => s.note === '?');
  if (blank.length) {
    expect(blank).toHaveLength(1);
    expect(blank[0].name).toBe(target.name);
    const total = Number(text.match(/\d+/)[0]);
    const angle = 360 - fig.sectors.filter((s) => s.note !== '?').reduce((acc, s) => acc + degOf(s.note), 0);
    return [String(whole(angle, total, 360)), 'missing-angle'];
  }

  const given = text.match(/(\d+) of them ([^.]+)\./);
  if (given) {
    const g = sectorIn(given[2], fig.sectors);
    expect(g.name).not.toBe(target.name);
    const total = whole(Number(given[1]), 360, degOf(g.note));
    return [String(whole(degOf(target.note), total, 360)), 'scale'];
  }

  const total = Number(text.match(/\d+/)[0]);
  return [String(whole(degOf(target.note), total, 360)), 'foundation'];
};

describe('pie-charts', () => {
  const expected = { foundation: ['foundation'], core: ['core'], stretch: ['scale', 'missing-angle'] };

  Object.entries(expected).forEach(([band, variants]) => {
    it(`${band}: answer recomputed from the board`, () => {
      const answers = new Set();
      const questions = new Set();
      const seen = {};
      for (let i = 0; i < SAMPLES; i += 1) {
        const q = generatePieCharts({ difficulty: band });
        expect(q.metadata).toEqual({ topic: 'pie-charts', difficulty: band });
        checkText(q);
        const [answer, variant] = solve(q);
        expect(variants).toContain(variant);
        expect(q.answer).toBe(answer);
        expect(q.answer).toMatch(/^\d+(\^\\circ)?$/);
        seen[variant] = (seen[variant] ?? 0) + 1;
        answers.add(q.answer);
        questions.add(JSON.stringify([q.instruction, q.visualization]));
      }
      // Stretch samples its two variants 50/50; both must actually turn up.
      variants.forEach((v) => expect(seen[v] / SAMPLES).toBeGreaterThan(variants.length > 1 ? 0.45 : 0.99));
      expect(answers.size).toBeGreaterThan(40);
      expect(questions.size).toBeGreaterThan(SAMPLES * 0.95);
    });
  });
});
