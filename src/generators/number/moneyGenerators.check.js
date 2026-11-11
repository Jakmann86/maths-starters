// Test support only. Recomputes every Profit and interest answer from the
// printed question, never from the generator's variables: the prose is read
// back with patterns, the sums are redone in whole pence (BigInt for
// compound growth), and every working line is checked with the TeX reader
// from the Logarithms checker.

import { compiles } from './latexArithmetic.check';
import { value } from './logarithmGenerators.check';

const must = (cond, msg) => { if (!cond) throw new Error(msg); };
const close = (a, b, tol = 1e-9) => Number.isFinite(a) && Math.abs(a - b) <= tol * Math.max(1, Math.abs(a), Math.abs(b));

const money = (s) => Number(s.replace(/[£,]/g, ''));
const MONEY = '£(\\d{1,3}(?:,\\d{3})*(?:\\.\\d{2})?)';
// The checker's own money format: £1,450 or £1,450.25.
const fmt = (pence, always = false) => {
  must(Number.isInteger(pence) && pence >= 0, `not a whole number of pence: ${pence}`);
  const whole = String(Math.floor(pence / 100)).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  const rest = pence % 100;
  return `\\text{£${whole}${rest || always ? `.${String(rest).padStart(2, '0')}` : ''}}`;
};
const penceOf = (pounds) => {
  const p = Math.round(pounds * 100);
  must(close(p, pounds * 100, 1e-9), `not a whole number of pence: ${pounds}`);
  return p;
};
const roundHalfUp = (num, den) => (2n * num + den) / (2n * den);

// Every working line: the parts either side of each "=" agree, with the
// question's own quantities as letters. A part written to the nearest penny
// (the last on its line, with two decimal places) agrees to within half a
// penny; every other part exactly.
const working = (q, vars, abs = 0) => {
  q.workingOut.split('\n').forEach((line) => {
    const parts = line.replace(/\\text\{multiplier\}/g, 'M').replace(/\\text\{(profit|loss)\}/g, 'D').replace(/\\%/g, '').split(' = ');
    must(parts.length >= 2, `working line is not an equation: ${line}`);
    const vals = parts.map((p) => value(p, vars));
    const exact = vals[0];
    vals.forEach((v, k) => {
      const pennyPart = k === parts.length - 1 && /\.\d\d$/.test(parts[k]);
      must((pennyPart && Math.abs(v - exact) <= abs) || close(v, exact, 1e-9), `working line false: ${line}`);
    });
  });
};
const lastValue = (q) => {
  const last = q.workingOut.split('\n').pop().split(' = ').pop();
  must(/^-?\d+(\.\d+)?(\\%)?$/.test(last), `working does not end in a number: ${last}`);
  return value(last.replace(/\\%/g, ''));
};

function checkProfitLoss(q, band) {
  const t = q.questionText;
  if (band === 'foundation') {
    must(q.instruction === 'Find the selling price', 'instruction');
    const m = new RegExp(`^A shop buys (a|an) [a-z ]+ for ${MONEY} and (?:sells it at a (\\d+)% (profit|loss)|marks it (up|down) by (\\d+)%(?: in a sale)?)\\.$`).exec(t);
    must(m, `question: ${t}`);
    const C = money(m[2]);
    const p = Number(m[3] ?? m[6]);
    const up = (m[4] ?? m[5]) === 'profit' || m[5] === 'up';
    must(m[6] === undefined || m[5] !== 'down' || /in a sale/.test(t), 'wording');
    const S = (penceOf(C) * (100 + (up ? p : -p))) / 100;
    must(q.answer === fmt(S), `wrong: ${q.answer}, should be ${fmt(S)}`);
    working(q, { M: 1 + (up ? p : -p) / 100 });
    must(close(lastValue(q), S / 100), 'working ends elsewhere');
    return { kind: up ? 'profit' : 'loss' };
  }
  if (band === 'core') {
    must(q.instruction === 'Find the percentage profit or loss', 'instruction');
    const m = new RegExp(`^A trader buys (a|an) [a-z ]+ for ${MONEY} and sells it for ${MONEY}\\.$`).exec(t);
    must(m, `question: ${t}`);
    const C = money(m[2]), S = money(m[3]);
    must(C !== S, 'no profit or loss');
    const p = (Math.abs(S - C) / C) * 100;
    must(close(p * 10, Math.round(p * 10)), 'percentage needs rounding');
    const word = S > C ? 'profit' : 'loss';
    must(q.answer === `${Number(p.toFixed(1))}\\% \\text{ ${word}}`, `wrong: ${q.answer}`);
    working(q, { D: Math.abs(S - C) });
    must(q.workingOut.startsWith(`\\text{${word}}`), 'working names the wrong one');
    must(/^\\frac\{\d+\}\{\d+\} \\times 100 = [\d.]+\\%$/.test(q.workingOut.split('\n')[1] ?? ''), 'working ends at the percentage');
    return { kind: `percentage ${word}` };
  }
  must(q.instruction === 'Find the cost price', 'instruction');
  const m = new RegExp(`^(A|An) [a-z ]+ is sold for ${MONEY} at a (\\d+)% (profit|loss)\\.$`).exec(t);
  must(m, `question: ${t}`);
  const S = money(m[2]), p = Number(m[3]), up = m[4] === 'profit';
  const C = (penceOf(S) * 100) / (100 + (up ? p : -p));
  must(Number.isInteger(C), 'cost price is not whole pence');
  must(q.answer === fmt(C), `wrong: ${q.answer}, should be ${fmt(C)}`);
  working(q, { M: 1 + (up ? p : -p) / 100 });
  must(close(lastValue(q), C / 100), 'working ends elsewhere');
  return { kind: `cost price, ${up ? 'profit' : 'loss'}` };
}

const PCT = '(\\d+(?:\\.\\d)?)%';

function checkSimple(q, band) {
  const t = q.questionText;
  if (band !== 'stretch') {
    const m = new RegExp(`^${MONEY} is (invested|borrowed) at ${PCT} per year simple interest for (\\d+) (years|months)\\.$`).exec(t);
    must(m, `question: ${t}`);
    const P = money(m[1]), r = Number(m[3]) / 100;
    const years = m[5] === 'years' ? Number(m[4]) : Number(m[4]) / 12;
    const invest = m[2] === 'invested';
    const I = Math.round(penceOf(P) * r * years);
    must(close(I, penceOf(P) * r * years, 1e-9), 'interest is not whole pence');
    if (band === 'foundation') {
      must(m[5] === 'years', 'Foundation is in whole years');
      must(q.instruction === (invest ? 'Find the interest earned' : 'Find the interest charged'), 'instruction');
      must(q.answer === fmt(I), `wrong: ${q.answer}, should be ${fmt(I)}`);
      working(q, { I: I / 100, P, r, n: years });
      return { kind: invest ? 'interest earned' : 'interest charged' };
    }
    must(q.instruction === (invest ? 'Find the value of the investment at the end' : 'Find the total amount to repay'), 'instruction');
    must(q.answer === fmt(penceOf(P) + I), `wrong: ${q.answer}`);
    working(q, { I: I / 100 });
    must(close(lastValue(q), P + I / 100), 'working ends elsewhere');
    return { kind: m[5] === 'months' ? 'total over months' : 'total over years' };
  }
  let m = new RegExp(`^${MONEY} (earns|is charged) ${MONEY} simple interest in (\\d+) years\\.$`).exec(t);
  if (m) {
    must(q.instruction === 'Find the rate of simple interest per year', 'instruction');
    const P = money(m[1]), I = money(m[3]), n = Number(m[4]);
    const r = (I / (P * n)) * 100;
    must(close(r * 10, Math.round(r * 10)), 'rate needs rounding');
    must(q.answer === `${Number(r.toFixed(1))}\\%`, `wrong: ${q.answer}`);
    working(q, { r: r / 100 });
    return { kind: 'rate' };
  }
  m = new RegExp(`^${MONEY} is (invested|borrowed) at ${PCT} per year simple interest\\. The interest comes to ${MONEY}\\.$`).exec(t);
  if (m) {
    must(q.instruction === 'Find how many years it takes' && q.answerUnits === 'years', 'instruction');
    const P = money(m[1]), r = Number(m[3]) / 100, I = money(m[4]);
    const n = I / (P * r);
    must(close(n, Math.round(n)), 'not a whole number of years');
    must(q.answer === `${Math.round(n)}`, `wrong: ${q.answer}`);
    working(q, { n });
    return { kind: 'time' };
  }
  m = new RegExp(`^At ${PCT} per year simple interest, the interest over (\\d+) years is ${MONEY}\\.$`).exec(t);
  must(m, `question: ${t}`);
  must(/^Find the amount (invested|borrowed)$/.test(q.instruction), 'instruction');
  const r = Number(m[1]) / 100, n = Number(m[2]), I = money(m[3]);
  const P = penceOf(I / (r * n));
  must(q.answer === fmt(P), `wrong: ${q.answer}`);
  working(q, { P: P / 100 });
  return { kind: 'principal' };
}

const growth = (Ppence, tenthsUp, n) => {
  // P × ((1000 + t) / 1000)^n, in pence, half up.
  const num = BigInt(Ppence) * BigInt(1000 + tenthsUp) ** BigInt(n);
  return Number(roundHalfUp(num, 1000n ** BigInt(n)));
};
const tenths = (pctText) => Math.round(Number(pctText) * 10);

function checkCompound(q, band) {
  const t = q.questionText;
  let m = new RegExp(`^${MONEY} is invested for (\\d+) years at ${PCT} per year compound interest\\.$`).exec(t);
  if (m) {
    const P = penceOf(money(m[1])), n = Number(m[2]), r = tenths(m[3]);
    const V = growth(P, r, n);
    working(q, { M: 1 + r / 1000 }, 0.00501);
    if (band === 'foundation') {
      must(q.instruction === 'Find the value of the investment, to the nearest penny', 'instruction');
      must(q.answer === fmt(V, true), `wrong: ${q.answer}, should be ${fmt(V, true)}`);
      must(Math.abs(lastValue(q) - V / 100) < 1e-9, 'working ends elsewhere');
      return { kind: 'value' };
    }
    must(band === 'core' && q.instruction === 'Find the interest earned, to the nearest penny', 'instruction');
    must(q.answer === fmt(V - P, true), `wrong: ${q.answer}`);
    must(Math.abs(lastValue(q) - (V - P) / 100) < 1e-9, 'working ends elsewhere');
    return { kind: 'interest earned' };
  }
  m = new RegExp(`^(A|An) [a-z]+ is bought for ${MONEY}\\. It loses ${PCT} of its value each year\\. What is it worth after (\\d+) years\\?$`).exec(t);
  if (m) {
    must(band === 'core' && q.instruction === 'Find its value, to the nearest penny', 'instruction');
    const P = penceOf(money(m[2])), d = tenths(m[3]), n = Number(m[4]);
    const V = growth(P, -d, n);
    must(q.answer === fmt(V, true), `wrong: ${q.answer}, should be ${fmt(V, true)}`);
    working(q, { M: 1 - d / 1000 }, 0.00501);
    must(Math.abs(lastValue(q) - V / 100) < 1e-9, 'working ends elsewhere');
    return { kind: 'depreciation' };
  }
  must(band === 'stretch', `question: ${t}`);
  m = new RegExp(`^How much must be invested now at ${PCT} per year compound interest to be worth ${MONEY} in (\\d+) years\\?$`).exec(t);
  if (m) {
    must(q.instruction === 'Find the amount to invest now, to the nearest penny', 'instruction');
    const r = tenths(m[1]), A = penceOf(money(m[2])), n = Number(m[3]);
    const X = Number(roundHalfUp(BigInt(A) * 1000n ** BigInt(n), BigInt(1000 + r) ** BigInt(n)));
    must(q.answer === fmt(X, true), `wrong: ${q.answer}, should be ${fmt(X, true)}`);
    // x is the exact amount; the line's last part is it to the nearest penny.
    working(q, { x: (A / 100) / (1 + r / 1000) ** n }, 0.00501);
    must(Math.abs(lastValue(q) - X / 100) < 1e-9, 'working ends elsewhere');
    return { kind: 'principal' };
  }
  m = new RegExp(`^${MONEY} grows to ${MONEY} in (\\d+) years with compound interest\\.$`).exec(t);
  must(m, `question: ${t}`);
  must(q.instruction === 'Find the annual rate of interest, to 1 decimal place', 'instruction');
  const S = money(m[1]), E = money(m[2]), n = Number(m[3]);
  const r = ((E / S) ** (1 / n) - 1) * 100;
  const rounded = Math.round(r * 10) / 10;
  must(Math.abs(r * 10 - Math.round(r * 10)) < 0.45, 'rate sits on a rounding boundary');
  must(q.answer === `${rounded.toFixed(1)}\\%`, `wrong: ${q.answer}, should be ${rounded.toFixed(1)}%`);
  // The root line is to 4 decimal places, so only the equation line is exact.
  const [first, root, ...rest] = q.workingOut.split('\n');
  must(rest.length === 1 && rest[0] === `r = ${q.answer}`, 'working ends at the rate');
  const x = (E / S) ** (1 / n);
  must(close(value(first.split(' = ')[0], { x }), E, 1e-9) && value(first.split(' = ')[1]) === E, `working: ${first}`);
  must(Math.abs(Number(root.split(' = ').pop()) - x) < 5e-5 && close(value(root.split(' = ')[1]), x), `working: ${root}`);
  return { kind: 'rate' };
}

const CHECKS = { 'profit-loss': checkProfitLoss, 'simple-interest': checkSimple, 'compound-interest': checkCompound };

export function checkMoney(q, band) {
  const topic = q.metadata?.topic;
  must(CHECKS[topic], `unknown topic ${topic}`);
  must(q.metadata.difficulty === band, 'metadata difficulty');
  must(!q.visualization && !q.questionMath && q.questionText, 'a worded question, no figure');
  must(!/\d/.test(q.instruction.replace(/\d+ decimal place/, '')), 'a number in the instruction');
  [q.answer, q.workingOut].forEach(compiles);
  const result = CHECKS[topic](q, band);
  // The working ends at the answer: the last number written is the answer's
  // (a rate may end as a decimal, 0.045 for 4.5%).
  const a = Number(q.answer.replace(/\\text\{£|[,}]|\\%.*$/g, ''));
  const end = lastValue(q);
  must(close(end, a) || close(end * 100, a), `working does not end at the answer: ${end}`);
  return result;
}
