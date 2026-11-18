// Test support only. Checks exchange-rates and rates from their prose: the
// rate and the amounts are read back with patterns and the answer worked
// out here, in whole pence, cents or yen. Every working line must hold as
// arithmetic.

import { lineHolds } from './ratioGenerators.check';

const must = (cond, msg) => { if (!cond) throw new Error(msg); };
const lines = (s) => String(s ?? '').split('\n');
const close = (a, b) => Math.abs(a - b) < 1e-6;
const minor = (s) => Math.round(Number(s.replace(/,/g, '')) * 100);
const grouped = (n) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
/** £1,450 or £1,450.25 from pence; the same for cents; yen whole. */
const money = (sym, units, whole = false) => {
  if (whole) return `${sym}${grouped(units)}`;
  const p = Math.round(units);
  return `${sym}${grouped(Math.floor(p / 100))}${p % 100 ? `.${String(p % 100).padStart(2, '0')}` : ''}`;
};
// A dollar sign inside \text must be escaped, or KaTeX reads it as maths.
const tx = (s) => `\\text{${s.replace(/\$/g, '\\$')}}`;

function common(q, topic, band) {
  must(q.metadata?.topic === topic && q.metadata.difficulty === band, 'metadata');
  must(typeof q.workingOut === 'string' && !q.workingOut.includes('\\n'), 'real newlines');
  must(!/\d/.test(q.instruction), `no digits in the instruction: ${q.instruction}`);
  must(!q.visualization && !q.questionMath, 'prose only');
  const w = lines(q.workingOut);
  w.filter((l) => l.includes(' = ')).forEach(lineHolds);
  return w;
}

/* ------------------------------------------------------- exchange-rates */

const CUR = { '€': ['euros', false], $: ['US dollars', false], '¥': ['yen', true] };
const AMOUNT = '([\\d,]+(?:\\.\\d\\d)?)';

export function checkExchangeRates(q, band) {
  const w = common(q, 'exchange-rates', band);
  const t = q.questionText;
  const rate = /The exchange rate is £1 = ([€$¥])([\d.]+)\./.exec(t);
  must(rate, `an exchange rate: ${t}`);
  const [sym, r] = [rate[1], Number(rate[2])];
  const [name, yen] = CUR[sym];
  must(yen ? Number.isInteger(r) : /^\d\.\d\d$/.test(rate[2]), 'a rate as it is quoted');
  // pence -> the other currency's smallest unit (cents, or whole yen)
  const out = (pence) => (yen ? pence * r / 100 : pence * r);
  const back = (units) => (yen ? units * 100 / r : units / r);
  const foreign = (s) => (yen ? Number(s.replace(/,/g, '')) : minor(s));

  if (band === 'foundation') {
    const m = new RegExp(`^The exchange rate is £1 = \\${sym}[\\d.]+\\. Change £${AMOUNT} into ${name}\\.$`).exec(t);
    must(m && q.instruction === `Change the pounds into ${name}`, `question: ${t}`);
    const v = out(minor(m[1]));
    must(close(v, Math.round(v)), 'exact in the other currency');
    const shown = yen || Math.round(v) % 100 === 0 ? String(yen ? Math.round(v) : Math.round(v) / 100) : (Math.round(v) / 100).toFixed(2);
    must(q.answer === shown && q.answerUnits === name && w.length === 1 && w[0].endsWith(`= ${shown}`), `answer ${q.answer} ${q.answerUnits}, expected ${shown} ${name}`);
    return { kind: 'to another currency' };
  }
  if (band === 'core') {
    const m = new RegExp(`^The exchange rate is £1 = \\${sym}[\\d.]+\\. Change \\${sym}${AMOUNT} into pounds\\.$`).exec(t);
    must(m && q.instruction === `Change the ${name} into pounds`, `question: ${t}`);
    const v = back(foreign(m[1]));
    must(close(v, Math.round(v)), 'exact in pounds');
    must(q.answer === tx(money('£', Math.round(v))) && w.at(-1) === q.answer, `answer ${q.answer}`);
    return { kind: 'to pounds' };
  }
  const m = new RegExp(`^(A [a-z ]+) costs £${AMOUNT} in London and \\${sym}${AMOUNT} in ([A-Z][A-Za-z ]+)\\. The exchange rate is £1 = \\${sym}[\\d.]+\\. (Where is it|Where are they) cheaper, and by how much in pounds\\?$`).exec(t);
  must(m && q.instruction === 'Find where it is cheaper', `question: ${t}`);
  must((m[5] === 'Where are they') === /^A pair/.test(m[1]), 'they for a pair, it otherwise');
  const home = minor(m[2]);
  const there = back(foreign(m[3]));
  must(close(there, Math.round(there)) && Math.round(there) !== home, 'a whole number of pence, and a difference');
  const diff = Math.abs(home - Math.round(there));
  must(diff <= home * 0.15 + 1, 'within about 15%');
  const where = Math.round(there) < home ? m[4] : 'London';
  must(q.answer === tx(`${where}, by ${money('£', diff)}`) && w.at(-1) === q.answer, `answer ${q.answer}`);
  return { kind: where === 'London' ? 'cheaper in London' : 'cheaper abroad' };
}

/* ---------------------------------------------------------------- rates */

export function checkRates(q, band) {
  const w = common(q, 'rates', band);
  const t = q.questionText;
  const ends = (v) => must(w.at(-1).endsWith(`= ${v}`) || w.at(-1) === q.answer, 'the working ends on the answer');
  let m;

  if ((m = new RegExp(`^([A-Z][a-z]+) earns £${AMOUNT} an hour\\. How much does (she|he) earn for (\\d+) hours\\?$`).exec(t))) {
    must(band === 'foundation' && q.instruction === 'Find the pay', 'pay is Foundation');
    const v = minor(m[2]) * Number(m[4]);
    must(q.answer === tx(money('£', v)), `answer ${q.answer}`);
    ends(v);
    return { kind: 'pay' };
  }
  if ((m = /^Water flows into a tank at (\d+) litres per minute\. How much flows in during (\d+) minutes\?$/.exec(t))) {
    must(band === 'foundation' && q.instruction === 'Find how much water', 'flow is Foundation');
    const v = Number(m[1]) * Number(m[2]);
    must(q.answer === String(v) && q.answerUnits === 'litres', `answer ${q.answer}`);
    ends(v);
    return { kind: 'flow' };
  }
  if ((m = /^A tank holds (\d+) litres\. Water flows in at (\d+) litres per minute\. How long does the empty tank take to fill\?$/.exec(t))) {
    must(band === 'core' && q.instruction === 'Find how long it takes', 'time to fill is Core');
    const v = Number(m[1]) / Number(m[2]);
    must(Number.isInteger(v) && q.answer === String(v) && q.answerUnits === 'minutes', `answer ${q.answer}`);
    ends(v);
    return { kind: 'time to fill' };
  }
  if ((m = /^A car uses ([\d.]+) litres of fuel per 100 km\. How much fuel does it use on a (\d+) km journey\?$/.exec(t))) {
    must(band === 'core' && q.instruction === 'Find how much fuel', 'fuel is Core');
    const v = Number(m[1]) * Number(m[2]) / 100;
    must(Number(m[2]) % 100 !== 0 && q.answer === String(Number(v.toFixed(6))) && q.answerUnits === 'litres', `answer ${q.answer}`);
    ends(q.answer);
    return { kind: 'fuel' };
  }
  if ((m = new RegExp(`^([A-Z][a-z]+) is paid £${AMOUNT} an hour for the first (\\d+) hours each week, and time and a half after that\\. One week (she|he) works (\\d+) hours\\. How much is \\4 paid\\?$`).exec(t))) {
    must(band === 'stretch' && q.instruction === 'Find the pay for the week', 'overtime is Stretch');
    const [rate, base, worked] = [minor(m[2]), Number(m[3]), Number(m[5])];
    must(worked > base && rate % 2 === 0, 'some overtime, at a whole number of pence');
    const v = rate * base + rate * 1.5 * (worked - base);
    must(q.answer === tx(money('£', v)) && w.at(-1) === q.answer && w.length === 5, `answer ${q.answer}`);
    must(w[1] === `${(rate / 100).toFixed(rate % 100 ? 2 : 0)} \\times 1.5 = ${(rate * 1.5) % 100 ? (rate * 1.5 / 100).toFixed(2) : rate * 1.5 / 100}`, 'the overtime rate');
    return { kind: 'overtime' };
  }
  m = new RegExp(`^A car uses ([\\d.]+) litres of fuel per 100 km\\. Fuel costs £${AMOUNT} a litre\\. How much does the fuel for a (\\d+) km journey cost\\?$`).exec(t);
  must(m && band === 'stretch' && q.instruction === 'Find the cost of the fuel', `a problem the skill sets: ${t}`);
  const litres = Number(m[1]) * Number(m[3]) / 100;
  const v = litres * minor(m[2]);
  must(close(v, Math.round(v)), 'a whole number of pence');
  must(q.answer === tx(money('£', Math.round(v))) && w.at(-1) === q.answer && w.length === 3, `answer ${q.answer}`);
  must(w[0].endsWith(`= ${Number(litres.toFixed(6))}\\text{ litres}`), 'the litres first');
  return { kind: 'fuel cost' };
}
