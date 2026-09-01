import _ from 'lodash';

const NL = '\n';

// A quadratic's roots are printed the way Haese prints them: "x = -7 or 4".
const roots = (p, q) => (p === q ? `x = ${p}` : `x = ${p} \\text{ or } ${q}`);
function gcd(a, b) { return b === 0 ? a : gcd(b, a % b); }
const frac = (n, d) => {
  const g = gcd(Math.abs(n), d);
  const [nn, dd] = [n / g, d / g];
  if (dd === 1) return `${nn}`;
  return nn < 0 ? `-\\frac{${-nn}}{${dd}}` : `\\frac{${nn}}{${dd}}`;
};

// x^2 + bx + c, written with the signs a student would actually see.
const quad = (a, b, c) => {
  const t = [];
  t.push(a === 1 ? 'x^2' : a === -1 ? '-x^2' : `${a}x^2`);
  if (b !== 0) t.push(`${b < 0 ? '-' : '+'} ${Math.abs(b) === 1 ? '' : Math.abs(b)}x`);
  if (c !== 0) t.push(`${c < 0 ? '-' : '+'} ${Math.abs(c)}`);
  return t.join(' ');
};

// k with no square factor, so sqrt(k) never needs simplifying afterwards.
const squarefree = (lo, hi) => {
  const out = [];
  for (let k = lo; k <= hi; k++) {
    let ok = true;
    for (let d = 2; d * d <= k; d++) if (k % (d * d) === 0) { ok = false; break; }
    if (ok) out.push(k);
  }
  return _.sample(out);
};

const nonZero = (lo, hi) => {
  let n = 0;
  while (n === 0) n = _.random(lo, hi);
  return n;
};

/* ------------------------------------------------- 21A: x^2 = k and (x+a)^2 = k */

export const generateSolveQuadraticRoots = (options = {}) => {
  const { difficulty = 'core' } = options;

  if (difficulty === 'foundation') {
    // ax^2 + d = e, reducing to x^2 = perfect square (Haese Example 1).
    const r = _.random(2, 20);
    const a = _.random(1, 9);
    const d = nonZero(-20, 20);
    const e = a * r * r + d;
    return {
      instruction: 'Solve for x',
      questionMath: `${a === 1 ? '' : a}x^2 ${d < 0 ? '-' : '+'} ${Math.abs(d)} = ${e}`,
      answer: `x = \\pm ${r}`,
      workingOut: `${a === 1 ? '' : a}x^2 = ${e - d}${NL}x^2 = ${r * r}${NL}x = \\pm ${r}`,
      metadata: { topic: 'solve-quadratic-roots', difficulty },
    };
  }

  const a = nonZero(-15, 15);
  const sign = a < 0 ? '+' : '-';
  const shown = `(x ${sign} ${Math.abs(a)})^2`;

  if (difficulty === 'core') {
    // (x - a)^2 = k with k a perfect square: two whole-number roots
    // (Haese Example 2a).
    const s = _.random(2, 20);
    return {
      instruction: 'Solve for x',
      questionMath: `${shown} = ${s * s}`,
      answer: roots(a + s, a - s),
      workingOut: `x ${sign} ${Math.abs(a)} = \\pm ${s}${NL}x = ${a} \\pm ${s}${NL}${roots(a + s, a - s)}`,
      metadata: { topic: 'solve-quadratic-roots', difficulty },
    };
  }

  // k not a perfect square, so the answer stays in surd form
  // (Haese Example 2b). k is squarefree, so no simplifying step is hidden.
  const k = squarefree(2, 95);
  return {
    instruction: 'Solve for x, giving your answer in exact form',
    questionMath: `${shown} = ${k}`,
    answer: `x = ${a} \\pm \\sqrt{${k}}`,
    workingOut: `x ${sign} ${Math.abs(a)} = \\pm \\sqrt{${k}}${NL}x = ${a} \\pm \\sqrt{${k}}`,
    metadata: { topic: 'solve-quadratic-roots', difficulty },
  };
};

/* ------------------------------------------------ 21B: the Null Factor law */

export const generateSolveQuadraticFactorising = (options = {}) => {
  const { difficulty = 'core' } = options;

  if (difficulty === 'foundation') {
    // Monic, already equal to zero (Haese Exercise 21B.2 Q2). p === q would
    // print a genuine repeated root, which no band in this skill should ever
    // hand a student — resample rather than let one through.
    let p; let q;
    do {
      p = nonZero(-13, 13);
      q = nonZero(-13, 13);
    } while (p === q);
    const b = -(p + q);
    const c = p * q;
    return {
      instruction: 'Solve for x',
      questionMath: `${quad(1, b, c)} = 0`,
      answer: roots(p, q),
      workingOut: `(x ${-p < 0 ? '-' : '+'} ${Math.abs(p)})(x ${-q < 0 ? '-' : '+'} ${Math.abs(q)}) = 0${NL}\\text{Null Factor law}${NL}${roots(p, q)}`,
      metadata: { topic: 'solve-quadratic-factorising', difficulty },
    };
  }

  if (difficulty === 'core') {
    // One side is not zero, so it has to be rearranged first (Haese
    // Exercise 21B.2 Q3). Half the time there is no constant term at all,
    // which is the common-factor case where cancelling x loses a root.
    const commonFactor = _.random(0, 1) === 1;
    if (commonFactor) {
      const m = nonZero(-15, 15);
      return {
        instruction: 'Solve for x',
        questionMath: `x^2 = ${m === 1 ? '' : m}x`,
        answer: roots(0, m),
        workingOut: `x^2 ${m < 0 ? '+' : '-'} ${Math.abs(m) === 1 ? '' : Math.abs(m)}x = 0${NL}x(x ${m < 0 ? '+' : '-'} ${Math.abs(m)}) = 0${NL}${roots(0, m)}`,
        metadata: { topic: 'solve-quadratic-factorising', difficulty },
      };
    }
    let p; let q;
    do {
      p = nonZero(-13, 13);
      q = nonZero(-13, 13);
    } while (p === q);
    const b = -(p + q);
    const c = p * q;
    // Present as x^2 + bx = -c so the student must move the constant across.
    return {
      instruction: 'Solve for x',
      questionMath: `${quad(1, b, 0)} = ${-c}`,
      answer: roots(p, q),
      workingOut: `${quad(1, b, c)} = 0${NL}(x ${-p < 0 ? '-' : '+'} ${Math.abs(p)})(x ${-q < 0 ? '-' : '+'} ${Math.abs(q)}) = 0${NL}${roots(p, q)}`,
      metadata: { topic: 'solve-quadratic-factorising', difficulty },
    };
  }

  // Non-monic: (px + q)(rx + s) = 0, so at least one root is a fraction
  // (Haese Exercise 21B.2 Q4-5).
  // Each bracket must be primitive (no common factor inside it), or the
  // equation comes out with a common numeric factor and the printed
  // factorisation is not fully factorised: 12x^2 - 3x - 9 = 0 shown as
  // (3x - 3)(4x + 3) rather than 3(x - 1)(4x + 3). Two primitive brackets can
  // still coincide by chance (p===r and q===s), which prints a repeated
  // root, so that is excluded too.
  let p; let q; let r; let s; let root1; let root2;
  do {
    p = _.random(2, 7);
    r = _.random(1, 6);
    q = nonZero(-11, 11);
    s = nonZero(-11, 11);
    root1 = frac(-q, p);
    root2 = frac(-s, r);
  } while (gcd(p, Math.abs(q)) !== 1 || gcd(r, Math.abs(s)) !== 1 || root1 === root2);
  const A = p * r;
  const B = p * s + q * r;
  const C = q * s;
  return {
    instruction: 'Solve for x',
    questionMath: `${quad(A, B, C)} = 0`,
    answer: `x = ${root1} \\text{ or } ${root2}`,
    workingOut: `(${p === 1 ? '' : p}x ${q < 0 ? '-' : '+'} ${Math.abs(q)})(${r === 1 ? '' : r}x ${s < 0 ? '-' : '+'} ${Math.abs(s)}) = 0${NL}\\text{Null Factor law}${NL}x = ${root1} \\text{ or } ${root2}`,
    metadata: { topic: 'solve-quadratic-factorising', difficulty },
  };
};

/* ------------------------------------------------- 21C: the quadratic formula */

export const generateSolveQuadraticFormula = (options = {}) => {
  const { difficulty = 'core' } = options;

  if (difficulty === 'foundation') {
    // Perfect-square discriminant, so the formula lands on whole numbers and
    // the student can check the answer by factorising. Haese demonstrates the
    // formula's validity on exactly this kind of equation (p427).
    const p = nonZero(-13, 13);
    const q = nonZero(-13, 13);
    if (p === q) return generateSolveQuadraticFormula(options);
    const b = -(p + q);
    const c = p * q;
    const D = b * b - 4 * c;
    return {
      instruction: 'Use the quadratic formula to solve for x',
      questionMath: `${quad(1, b, c)} = 0`,
      answer: roots(Math.max(p, q), Math.min(p, q)),
      workingOut: `a = 1,\\ b = ${b},\\ c = ${c}${NL}b^2 - 4ac = ${D},\\ \\sqrt{${D}} = ${Math.sqrt(D)}${NL}x = \\frac{${-b} \\pm ${Math.sqrt(D)}}{2}${NL}${roots(Math.max(p, q), Math.min(p, q))}`,
      metadata: { topic: 'solve-quadratic-formula', difficulty },
    };
  }

  if (difficulty === 'core') {
    // b even and k squarefree, so x = -m +- sqrt(k) exactly, with no hidden
    // surd-simplifying step (Haese Exercise 21C.1 Q1 asks for exact answers).
    const m = nonZero(-15, 15);
    const k = squarefree(2, 75);
    const b = 2 * m;
    const c = m * m - k;
    const D = b * b - 4 * c;
    return {
      instruction: 'Use the quadratic formula to solve for x, giving exact answers',
      questionMath: `${quad(1, b, c)} = 0`,
      answer: `x = ${-m} \\pm \\sqrt{${k}}`,
      // The surd-simplifying line is shown explicitly: D is always 4k here,
      // so sqrt(D) = 2 sqrt(k) and the 2 then cancels. Jumping straight to the
      // simplified answer hides the only step a student is likely to miss.
      workingOut: `a = 1,\\ b = ${b},\\ c = ${c}${NL}b^2 - 4ac = ${D},\\ \\sqrt{${D}} = 2\\sqrt{${k}}${NL}x = \\frac{${-b} \\pm 2\\sqrt{${k}}}{2}${NL}x = ${-m} \\pm \\sqrt{${k}}`,
      metadata: { topic: 'solve-quadratic-formula', difficulty },
    };
  }

  // a is not 1 and the discriminant is not a perfect square, so the formula
  // is genuinely required and the answer is a decimal. Haese asks for 2 d.p.
  // here (Example 7b, Exercise 21C.1 Q2), not 3 s.f.
  let a; let b; let c; let D;
  do {
    a = _.random(2, 6);
    b = nonZero(-12, 12);
    c = nonZero(-10, 10);
    D = b * b - 4 * a * c;
  } while (D <= 0 || Math.sqrt(D) % 1 === 0);
  const r1 = (-b + Math.sqrt(D)) / (2 * a);
  const r2 = (-b - Math.sqrt(D)) / (2 * a);
  const dp = (x) => x.toFixed(2);
  return {
    instruction: 'Use the quadratic formula to solve for x, correct to 2 decimal places',
    questionMath: `${quad(a, b, c)} = 0`,
    answer: `x = ${dp(r1)} \\text{ or } ${dp(r2)}`,
    workingOut: `a = ${a},\\ b = ${b},\\ c = ${c}${NL}b^2 - 4ac = ${D}${NL}x = \\frac{${-b} \\pm \\sqrt{${D}}}{${2 * a}}${NL}x = ${dp(r1)} \\text{ or } ${dp(r2)}`,
    metadata: { topic: 'solve-quadratic-formula', difficulty },
  };
};
