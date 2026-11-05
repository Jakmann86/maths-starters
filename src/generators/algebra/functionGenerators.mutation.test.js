// Mutation test for the Functions harness. Each operator breaks real
// generator output; the checker must reject every broken copy. Unchanged
// copies are skipped, and so are equivalent mutants: a changed number that
// leaves the printed answer still true (a coefficient times zero, say).
// Those are ruled out by stillTrue() below, which turns the LaTeX into
// JavaScript by text substitution, a different route from the checker's
// parser, and is not shared with it.
//
// Run: npx vitest run src/generators/algebra/functionGenerators.mutation.test.js

import { describe, expect, it } from 'vitest';
import _ from 'lodash';
import * as gen from './functionGenerators';
import * as chk from './functionGenerators.check';

const PER_BAND = 250;
const BANDS = ['foundation', 'core', 'stretch'];
const SKILLS = [
  [gen.generateFunctionNotation, chk.checkFunctionNotation],
  [gen.generateDomainRange, chk.checkDomainRange],
  [gen.generateCompositeFunctions, chk.checkComposite],
  [gen.generateInverseFunctions, chk.checkInverse],
  [gen.generateAbsoluteValue, chk.checkAbsolute],
  [gen.generateReciprocalFunctions, chk.checkReciprocal],
];

/* ----------------------------------- LaTeX to JavaScript, by text */

// Function calls first: fg(3) becomes F_f(F_g(3)), f^{-1}(x) becomes I_f(x).
function calls(src) {
  let s = src.replace(/([fgh])\^\{-1\}\(/g, 'I_$1(');
  for (;;) {
    const m = /(^|[^A-Za-z_])([fgh]+)\(/.exec(s);
    if (!m) return s;
    const start = m.index + m[1].length, open = start + m[2].length;
    let depth = 0, end = open;
    for (; end < s.length; end += 1) {
      if (s[end] === '(') depth += 1;
      if (s[end] === ')' && --depth === 0) break;
    }
    const names = [...m[2]];
    s = s.slice(0, start) + names.map((n) => `F_${n}(`).join('') + s.slice(open + 1, end) + ')'.repeat(names.length) + s.slice(end + 1);
  }
}

function js(tex) {
  let s = tex.replace(/\\left|\\right/g, '').replace(/\\times/g, '*').replace(/\\lvert/g, 'ABS(').replace(/\\rvert/g, ')');
  while (/\\frac/.test(s)) s = s.replace(/\\frac\{([^{}]*)\}\{([^{}]*)\}/, '(($1)/($2))');
  s = calls(s);
  s = s.replace(/\^\{([^{}]*)\}/g, '**($1)').replace(/\^(\d)/g, '**$1');
  s = s.replace(/(\d|\))(?=[a-z(]|ABS|F_|I_)/g, '$1*').replace(/(^|[^A-Za-z_])([abkxy])(?=[a-z(]|ABS|F_|I_)/g, '$1$2*');
  s = s.replace(/(^|[^A-Za-z_])([abkxy])(?=[abkxy])/g, '$1$2*');
  return s;
}
const fn = (tex) => {
  try {
    const f = new Function('x', 'a', 'b', 'k', 'y', 'F_f', 'F_g', 'F_h', 'ABS', `return ${js(tex)};`);
    return (x, a, b, k, y, Ff, Fg, Fh) => f(x, a, b, k, y, Ff, Fg, Fh, Math.abs);
  } catch { return null; }
};
const call = (f, x, env = {}) => f(x, env.a, env.b, env.k, env.y, env.F_f, env.F_g, env.F_h);
const near = (p, r) => Math.abs(p - r) < 1e-6 * Math.max(1, Math.abs(p));
const XS = [-1.7, 0.6, 2.2, 3.9];

function defs(lines) {
  const env = {};
  lines.forEach((l) => {
    const m = /^([fgh])(?:\(x\) = | : x \\mapsto )(.+)$/.exec(l);
    if (m) { const f = fn(m[2]); env[`F_${m[1]}`] = (x) => call(f, x, env); }
  });
  return env;
}

// Is the (mutated) question's printed answer still true? Only the claim is
// tested, not the shape; anything this cannot read counts as not true.
function stillTrue(q) {
  try {
    const lines = q.questionMath.split('\n');
    const I = q.instruction.replace(/\u2212/g, '-');
    const nums = (s) => (s.match(/-?\d+/g) ?? []).map(Number);
    const ans = nums(q.answer);
    let m;
    if ((m = /^Find ([fgh]+)\((-?\d+)\)$/.exec(I))) {   // f(5), fg(3)
      const env = defs(lines);
      return [...m[1]].reduceRight((v, n) => env[`F_${n}`](v), Number(m[2])) === ans[0];
    }
    if ((m = /^Find ([fgh])\(([fgh])\((-?\d+)\)\)$/.exec(I))) {
      const env = defs(lines);
      return env[`F_${m[1]}`](env[`F_${m[2]}`](Number(m[3]))) === ans[0];
    }
    if ((m = /^Find x when (.+) = (-?\d+)$/.exec(I))) {
      const env = defs(lines);
      const x = ans[ans.length - 1];
      return near(call(fn(m[1]), x, env), Number(m[2]));
    }
    if ((m = /^Find (.+) in simplest form$/.exec(I))) {
      const env = defs(lines);
      const rhs = fn(q.answer.split(' = ')[1]), lhs = fn(m[1]);
      return XS.every((x) => near(call(rhs, x, env), call(lhs, x, env)));
    }
    if (I === 'Find, in simplest form,') {
      const [lhs, def] = q.questionMath.split(' \\text{ when } ');
      const env = defs([def]);
      const rhs = fn(q.answer.split(' = ')[1]);
      return XS.every((x) => near(call(rhs, x, env), call(fn(lhs), x, env)));
    }
    if (I === 'Find a and b' || I === 'Find all the possible values of a and b') {
      const pairs = q.answer.split(' \\text{ or } ').map(nums);
      return pairs.every(([a, b]) => lines.slice(1).join(', \\quad ').split(', \\quad ').every((c) => {
        const [l, r] = c.split(' = ');
        const env = { a, b };
        env.F_f = env.F_g = env.F_h = (x) => a * x + b;
        return XS.every((x) => near(call(fn(l), x, env), call(fn(r), x, env)));
      }));
    }
    if (I === 'Find the inverse function') {
      const env = defs(lines);
      const f = Object.values(env)[0];
      const g = fn(q.answer.split(' = ')[1]);
      return XS.every((x) => near(f(call(g, x)), x));
    }
    if (I === 'Evaluate') {
      const [, def] = q.questionMath.split(' \\text{ when } ');
      const f = Object.values(defs([def]))[0];
      const k = nums(q.questionMath)[1];
      return near(f(ans[ans.length - 1]), k);
    }
    if (I === 'Solve' && q.questionMath.includes('^{-1}')) {
      const f = Object.values(defs([q.questionMath.split(' \\text{ when } ')[1]]))[0];
      return near(f(ans[0]), ans[0]);
    }
    if (I === 'Solve') {
      const [l, r] = q.questionMath.split(' = ').map(fn);
      const xs = nums(q.answer);
      if (!xs.every((x) => near(call(l, x), call(r, x)))) return false;
      // and no others, on a grid
      const g = (x) => call(l, x) - call(r, x);
      let roots = 0;
      for (let x = -40; x < 40; x += 0.125) if (g(x) === 0 || g(x) * g(x + 0.125) < 0) roots += 1;
      return roots === xs.length;
    }
    if ((m = /^Find the value when (.+)$/.exec(I))) {
      const env = {};
      m[1].split(' and ').forEach((p) => { const [v, n] = p.split(' = '); env[v] = Number(n); });
      return call(fn(q.questionMath), env.x, env) === ans[0];
    }
    if (I === 'Find the range of the function') return false;   // decided by sweep in the operator itself
    if (I === 'Find the equations of the asymptotes') {
      const f = fn(q.questionMath.slice(4));
      const [a, b] = ans;
      return Math.abs(call(f, a + 1e-7)) > 1e5 && Math.abs(call(f, 1e8) - b) < 1e-5;
    }
    if (I === 'Find k') {
      const k = ans[ans.length - 1];
      const p = nums(q.questionMath);
      if (lines.length === 1) return near(k / p[0], p[1]);
      return near(k / (p[2] - p[0]) + p[1], p[3]);
    }
  } catch { return false; }
  return false;
}

/* -------------------------------------------------------- operators */

const lastInt = /-?\d+(?!.*\d)/;
const replaceNth = (s, re, k, f) => { let n = -1; return s.replace(re, (m) => { n += 1; return n === k ? f(m) : m; }); };

const OPS = {
  'answer nudged': (q) => { q.answer = q.answer.replace(lastInt, (n) => String(Number(n) + 1)); return true; },
  'answer sign flipped': (q) => {
    const m = lastInt.exec(q.answer);
    if (!m || Number(m[0]) === 0) return false;
    q.answer = q.answer.replace(lastInt, (n) => String(-Number(n)));
    return !stillTrue(q);
  },
  'one of two answers dropped': (q) => {
    if (!q.answer.includes('\\text{ or }')) return false;
    q.answer = q.answer.split(' \\text{ or } ')[0];
    return true;
  },
  '"only" added or removed': (q) => {
    if (q.answer.endsWith('\\text{ only}')) q.answer = q.answer.replace(' \\text{ only}', '');
    else if (/^x = -?\d+$/.test(q.answer) && q.instruction === 'Solve') q.answer += ' \\text{ only}';
    else return false;
    return true;
  },
  'a number in the question changed': (q) => {
    const hits = [...q.questionMath.matchAll(/\d+/g)];
    if (!hits.length) return false;
    const k = _.random(0, hits.length - 1);
    q.questionMath = replaceNth(q.questionMath, /\d+/g, k, (n) => String(Number(n) + 1));
    if (q.instruction === 'Find the range of the function') return true;   // every number moves the range or the domain
    return !stillTrue(q);
  },
  'a number in the instruction changed': (q) => {
    if (!/\d/.test(q.instruction)) return false;
    const hits = [...q.instruction.matchAll(/\d+/g)];
    q.instruction = replaceNth(q.instruction, /\d+/g, _.random(0, hits.length - 1), (n) => String(Number(n) + 1));
    return !stillTrue(q);
  },
  'composite order swapped': (q) => {
    const m = /([fgh])\(([fgh])\(|\b([fgh])([fgh])\(/.exec(q.instruction);
    if (!m) return false;
    q.instruction = m[1] ? q.instruction.replace(`${m[1]}(${m[2]}(`, `${m[2]}(${m[1]}(`) : q.instruction.replace(`${m[3]}${m[4]}(`, `${m[4]}${m[3]}(`);
    if (q.answer.includes(m[1] ? `${m[1]}(${m[2]}(` : `${m[3]}${m[4]}(`)) {
      q.answer = m[1] ? q.answer.replace(`${m[1]}(${m[2]}(`, `${m[2]}(${m[1]}(`) : q.answer.replace(`${m[3]}${m[4]}(`, `${m[4]}${m[3]}(`);
    }
    return !stillTrue(q);
  },
  'function renamed in the question': (q) => {
    const m = /^([fgh])(?=\(x\) =| : x)/m.exec(q.questionMath) ?? /([fgh])(?=\(x\) =)/.exec(q.questionMath);
    if (!m) return false;
    const to = ['f', 'g', 'h'].find((n) => !q.questionMath.includes(`${n}(x)`) && !q.questionMath.includes(`${n} : x`) && !q.instruction.includes(`${n}(`) && n !== m[1]);
    if (!to) return false;
    q.questionMath = q.questionMath.replace(new RegExp(`(^|\\n|when )${m[1]}(?=\\(x\\) =| : x)`), `$1${to}`);
    return true;
  },
  'instruction swapped with another skill\'s': (q) => {
    const others = ['Find the inverse function', 'Find the range of the function', 'Find the equations of the asymptotes', 'Solve', 'Find k', 'Find a and b'];
    q.instruction = _.sample(others.filter((o) => o !== q.instruction));
    return true;
  },
  'metadata changed': (q) => { q.metadata.topic = q.metadata.topic === 'domain-range' ? 'function-notation' : 'domain-range'; return true; },
  'a working number changed': (q) => {
    const lines = q.workingOut.split('\n');
    const live = lines.map((l, k) => k).filter((k) => !/\\to |reject|\\text\{as |:/.test(lines[k]) && /\d/.test(lines[k]));
    if (!live.length) return false;
    const k = _.sample(live);
    const hits = [...lines[k].matchAll(/\d+/g)];
    lines[k] = replaceNth(lines[k], /\d+/g, _.random(0, hits.length - 1), (n) => String(Number(n) + 1));
    q.workingOut = lines.join('\n');
    // A line of plain arithmetic that still holds (1^3 = 1^2, 6 x 0, the
    // absolute value of either sign) is an equivalent mutant.
    if (!/\\text|[a-z](?!\()/.test(lines[k].replace(/\\(times|lvert|rvert|frac)/g, ''))) {
      try {
        const env = defs(q.questionMath.split('\n'));
        const vals = lines[k].split(' = ').map((side) => call(fn(side), 0, env));
        if (vals.every((v) => near(v, vals[0]))) return false;
      } catch { /* not plain arithmetic: keep the mutant */ }
    }
    return true;
  },
  'the working stops short': (q) => {
    const lines = q.workingOut.split('\n');
    if (lines.length < 2) return false;
    q.workingOut = lines.slice(0, -1).join('\n');
    return true;
  },
  'arrow notation broken': (q) => {
    if (!q.questionMath.includes('(x) = ')) return false;
    q.questionMath = q.questionMath.replace('(x) = ', '(y) = ');
    return true;
  },
};

describe('Functions mutation test', () => {
  it('rejects every broken copy', () => {
    const tally = {};
    SKILLS.forEach(([g, check]) => {
      BANDS.forEach((band) => {
        for (let t = 0; t < PER_BAND; t += 1) {
          // Read back as one sentence, so the operators can reach its numbers.
          const raw = g({ difficulty: band });
          check(raw, band);
          const q = g === gen.generateAbsoluteValue ? chk.askedAbsolute(raw) : chk.asked(raw);
          Object.entries(OPS).forEach(([name, op]) => {
            const m = _.cloneDeep(q);
            if (!op(m) || _.isEqual(m, q)) return;
            const row = (tally[name] ??= { applied: 0, killed: 0, survivors: [] });
            row.applied += 1;
            try { check(m, band); row.survivors.push(m); } catch { row.killed += 1; }
          });
        }
      });
    });
    Object.entries(tally).forEach(([name, r]) => process.stdout.write(`${name}: ${r.killed}/${r.applied} killed\n`));
    Object.entries(tally).forEach(([name, r]) => expect(r.survivors.slice(0, 2), name).toEqual([]));
    expect(Object.keys(tally).sort()).toEqual(Object.keys(OPS).sort());
  });
});
