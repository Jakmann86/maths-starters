// Test support only. Checks prime-factors and hcf-lcm from what is
// printed. Primes are tested here, factorisations are multiplied back out,
// and an HCF or LCM is found from the two numbers themselves, never from
// the generator's factorisations.

import { evaluate, lineHolds } from './ratioGenerators.check';

const must = (cond, msg) => { if (!cond) throw new Error(msg); };
const lines = (s) => String(s ?? '').split('\n');
const gcd = (a, b) => (b ? gcd(b, a % b) : a);
const isPrime = (p) => p > 1 && Array.from({ length: Math.floor(Math.sqrt(p)) - 1 }, (_, i) => i + 2).every((d) => p % d);

function common(q, topic, band) {
  must(q.metadata?.topic === topic && q.metadata.difficulty === band, 'metadata');
  must(typeof q.workingOut === 'string' && !q.workingOut.includes('\\n'), 'real newlines');
  must(!/\d/.test(q.instruction), `no digits in the instruction: ${q.instruction}`);
  must(!q.visualization, 'no figure');
}

/** "2^3 \times 3 \times 5": [[2, 3], [3, 1], [5, 1]], primes rising. */
function readIndexForm(s) {
  const terms = s.split(' \\times ').map((t) => {
    const m = /^(\d+)(?:\^(\d+))?$/.exec(t);
    must(m, `a prime or a prime power: ${t}`);
    return [Number(m[1]), m[2] ? Number(m[2]) : 1];
  });
  terms.forEach(([p, e], i) => must(isPrime(p) && e >= 1 && (i === 0 || p > terms[i - 1][0]), `primes rising, once each: ${s}`));
  return terms;
}
const valueOf = (terms) => terms.reduce((v, [p, e]) => v * p ** e, 1);
const said = (name, n, line) => {
  const m = new RegExp(`^\\\\text\\{${name}\\} = (?:(.+) = )?(\\d+)$`).exec(line);
  must(m && Number(m[2]) === n, `${name} line: ${line}`);
  if (m[1]) must(evaluate(m[1]) === n && readIndexForm(m[1]), `${name} in index form: ${line}`);
  else must(isPrime(n), `${name} written bare only when it is prime: ${line}`);
};

/* -------------------------------------------------------- prime-factors */

/** The division ladder: n ÷ p, then the quotient ÷ its smallest prime, ... */
function ladder(n, w) {
  let m = n;
  let i = 0;
  while (!isPrime(m)) {
    const d = /^(\d+) \\div (\d+) = (\d+)$/.exec(w[i] ?? '');
    must(d && Number(d[1]) === m && isPrime(Number(d[2])), `division line ${i}: ${w[i]}`);
    lineHolds(w[i]);
    m = Number(d[3]);
    i += 1;
  }
  return i;
}

export function checkPrimeFactors(q, band) {
  common(q, 'prime-factors', band);
  const w = lines(q.workingOut);

  if (band !== 'stretch') {
    const n = Number(q.questionMath);
    must(Number.isInteger(n) && !isPrime(n), 'a composite number');
    const used = ladder(n, w);
    if (band === 'foundation') {
      must(q.instruction === 'Write as a product of prime factors', 'instruction');
      const fs = q.answer.split(' \\times ').map(Number);
      must(fs.every(isPrime) && fs.every((p, i) => !i || p >= fs[i - 1]), `primes, smallest first: ${q.answer}`);
      must(fs.reduce((a, b) => a * b) === n && fs.length >= 3 && n <= 200, 'their product is the number');
      must(w.length === used + 1 && w.at(-1) === q.answer, 'the ladder, then the answer');
      return { kind: 'product' };
    }
    must(q.instruction === 'Write as a product of prime factors, in index form', 'instruction');
    const terms = readIndexForm(q.answer);
    must(valueOf(terms) === n && terms.some(([, e]) => e > 1) && terms.length >= 2, `index form of ${n}: ${q.answer}`);
    must(w.length === used + 2 && evaluate(w[used].slice(2)) === n && w[used].startsWith('= ') && !w[used].includes('^'), 'the primes written out');
    must(w.at(-1) === `= ${q.answer}`, 'the working ends on the answer');
    return { kind: 'index form' };
  }

  const power = { 'Find the smallest whole number to multiply by to make a square number': 2, 'Find the smallest whole number to multiply by to make a cube number': 3 }[q.instruction];
  must(power, 'instruction');
  const terms = readIndexForm(q.questionMath);
  const k = terms.reduce((v, [p, e]) => v * p ** ((power - (e % power)) % power), 1);
  must(k > 1 && q.answer === String(k), `answer ${q.answer}, expected ${k}`);
  must(w.length === 3 && w[0] === `\\text{every power a multiple of } ${power}`, 'the rule first');
  const [lhs, rhs] = w[1].split(' = ');
  must(lhs.startsWith(`${q.questionMath} \\times `), 'the number times what it needs');
  must(evaluate(lhs) === evaluate(rhs) && readIndexForm(rhs).every(([, e]) => e % power === 0), `a perfect power: ${w[1]}`);
  must(w[2].endsWith(` = ${k}`) && evaluate(w[2].split(' = ')[0]) === k, 'the multiplier worked out');
  return { kind: power === 2 ? 'square' : 'cube' };
}

/* -------------------------------------------------------------- hcf-lcm */

const range = (a, b, step = 1) => Array.from({ length: Math.floor((b - a) / step) + 1 }, (_, i) => a + i * step);

export function checkHcfLcm(q, band) {
  common(q, 'hcf-lcm', band);
  const w = lines(q.workingOut);

  if (band === 'foundation') {
    const m = /^(\d+) \\text\{ and \} (\d+)$/.exec(q.questionMath);
    must(m, 'two numbers');
    const [a, b] = [Number(m[1]), Number(m[2])];
    const h = gcd(a, b), l = a * b / h;
    must(a < b && h > 1 && b % a !== 0, 'a common factor, neither a multiple of the other');
    if (q.instruction === 'Find the lowest common multiple') {
      must(q.answer === String(l) && l <= 120, `answer ${q.answer}, expected ${l}`);
      must(w[0] === `${a}: ${range(a, l, a).join(', ')}` && w[1] === `${b}: ${range(b, l, b).join(', ')}` && w[2] === `\\text{LCM} = ${l}` && w.length === 3, 'multiples listed to the LCM');
      return { kind: 'LCM' };
    }
    must(q.instruction === 'Find the highest common factor', 'instruction');
    const fs = (n) => range(1, n).filter((d) => n % d === 0).join(', ');
    must(q.answer === String(h), `answer ${q.answer}, expected ${h}`);
    must(w[0] === `${a}: ${fs(a)}` && w[1] === `${b}: ${fs(b)}` && w[2] === `\\text{HCF} = ${h}` && w.length === 3, 'factors listed');
    return { kind: 'HCF' };
  }

  // Both numbers printed with their factorisations: each must be right.
  const pair = (line) => {
    const m = /^(\d+) = (.+), \\ (\d+) = (.+)$/.exec(line);
    must(m, `two factorisations: ${line}`);
    [[m[1], m[2]], [m[3], m[4]]].forEach(([n, f]) => must(valueOf(readIndexForm(f)) === Number(n), `${n} = ${f}`));
    return [Number(m[1]), Number(m[3])];
  };

  if (band === 'core') {
    must(q.instruction === 'Find the HCF and the LCM', 'instruction');
    const [a, b] = pair(q.questionMath);
    const h = gcd(a, b), l = a * b / h;
    must(h > 1 && a % b !== 0 && b % a !== 0, 'a common factor, neither a multiple of the other');
    const answer = `\\text{HCF} = ${h}, \\ \\text{LCM} = ${l}`;
    must(q.answer === answer, `answer ${q.answer}, expected ${answer}`);
    must(w.length === 3 && w[2] === answer, 'three lines');
    said('HCF', h, w[0]);
    said('LCM', l, w[1]);
    return { kind: 'both' };
  }

  const t = q.questionText;
  let m = /^Two (buses leave a bus station|lights flash) together\. One (?:leaves|flashes) every (\d+) (minutes|seconds) and the other every (\d+) \3\. After how many \3 do they next (?:leave|flash) together\?$/.exec(t);
  if (m) {
    must(q.instruction === 'Find when they are next together', 'instruction');
    must((m[1].startsWith('buses') ? 'minutes' : 'seconds') === m[3], 'buses in minutes, lights in seconds');
    const [a, b] = [Number(m[2]), Number(m[4])];
    const l = a * b / gcd(a, b);
    must(gcd(a, b) > 1 && b % a !== 0, 'a common factor, neither a multiple of the other');
    must(q.answer === String(l) && q.answerUnits === m[3], `answer ${q.answer}, expected ${l}`);
    must(w.length === 2 && pair(w[0]).join() === [a, b].join(), 'both factorised');
    said('LCM', l, w[1]);
    return { kind: 'LCM problem' };
  }
  m = /^Two ribbons are (\d+) cm and (\d+) cm long\. Both are cut into pieces of the same length, as long as possible, with nothing left over\. How long is each piece\?$/.exec(t);
  must(m && q.instruction === 'Find the longest equal pieces', `a problem the skill sets: ${t}`);
  const [a, b] = [Number(m[1]), Number(m[2])];
  const h = gcd(a, b);
  must(h >= 4 && b % a !== 0, 'a real common factor');
  must(q.answer === String(h) && q.answerUnits === 'cm', `answer ${q.answer}, expected ${h}`);
  must(w.length === 2 && pair(w[0]).join() === [a, b].join(), 'both factorised');
  said('HCF', h, w[1]);
  return { kind: 'HCF problem' };
}
