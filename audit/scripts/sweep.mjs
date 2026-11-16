// Mechanical sweep. node audit/scripts/sweep.mjs [seeds=300] [idRegex]
// Writes audit/out/flags.jsonl (one flag per line) and audit/out/sweep-summary.json.
import { skills, bandsOf, draw } from './gen.mjs';
import { prep, parse, splitTop, rewriteLogs, Unparsed, TEXT } from './latexEval.mjs';
import katex from 'katex';
import fs from 'node:fs';

const N = Number(process.argv[2] ?? 300);
const rx = new RegExp(process.argv[3] ?? '.');
fs.mkdirSync(new URL('../out/', import.meta.url), { recursive: true });
const tag = process.argv[3] ? '-partial' : '';
const out = fs.createWriteStream(new URL(`../out/flags${tag}.jsonl`, import.meta.url));

/* ---------------------------------------------------------------- KaTeX */
const kcache = new Map();
function katexCheck(tex) {
  if (kcache.has(tex)) return kcache.get(tex);
  const warns = [];
  let err = null;
  try { katex.renderToString(tex, { throwOnError: true, displayMode: true, strict: (code, msg) => { warns.push(`${code}: ${msg}`); return 'ignore'; } }); } catch (e) { err = e.message; }
  const r = { err, warns };
  kcache.set(tex, r);
  return r;
}

/* ------------------------------------------------------- regex patterns */
const stripText = (s) => s.replace(/\\text\{[^{}]*\}/g, ' ').replace(/\\(mathbf|mathrm|mathbb|overrightarrow)\b/g, ' ');
const noCmd = (s) => stripText(s).replace(/\\[a-zA-Z]+/g, ' ');
const AWK = [
  ['plus-minus', /\+\s*-/, stripText],
  ['minus-minus', /-\s*-\s*[\dA-Za-z\\(]/, stripText],
  ['plus-plus', /\+\s*\+/, stripText],
  ['minus-plus', /-\s*\+/, stripText],
  ['coef-1', /(^|[^\d.\w}^_])1[a-zA-Z](?![a-zA-Z_])/, noCmd],
  ['coef-1-bracket', /(^|[^\d.\w}^_{])1\(/, noCmd],
  ['power-1', /\^(\{1\}|1(?![\d.]))/, (s) => s],
  ['power-0', /\^(\{0\}|0(?![\d.]))/, (s) => s],
  ['coef-0', /(^|[^\d.\w}^_])0\s*([a-zA-Z](?![a-zA-Z_])|\()/, noCmd],
  ['add-0', /[+-]\s*0(?![\d.])\s*($|[^\d.a-zA-Z(\\^])/, noCmd],
  ['frac-over-1', /\\frac\{[^{}]*\}\{1\}/, (s) => s],
  ['frac-0-top', /\\frac\{0\}/, (s) => s],
  ['frac-neg-den', /\\frac\{[^{}]*\}\{-[^{}]*\}/, (s) => s],
  ['times-1', /\\times\s*1(?![\d.])\s*($|[^\d.^a-zA-Z(\\])/, (s) => s],
  ['1-times', /(^|[^\d.^_{])1\s*\\times/, (s) => s],
  ['float-noise', /\d\.\d{7,}|\d[eE][-+]\d/, (s) => s],
  ['bad-value', /NaN|undefined|Infinity|\bnull\b|\[object/, (s) => s],
  ['neg-zero', /(^|[^\d.\w])-0(?![.\d])/, noCmd],
  ['empty-group', /\{\s*\}|\(\s*\)/, (s) => s.replace(/\\phantom\{[^{}]*\}/g, 'x').replace(/\\text\{\s*\}/g, 'x')],
  ['literal-backslash-n', /\\n(?![a-zA-Z])/, (s) => s],
  ['bare-unit', /(^|[^\\a-zA-Z])(cm|mm|km|kg|ml)(?![a-zA-Z])/, stripText],
  ['double-space-text', /\\text\{[^{}]* {2,}[^{}]*\}/, (s) => s],
];
const PROSE = [
  ['singular-plural', /(^|[^\d.,/])\b1 (hours|minutes|seconds|units|students|sides|years|days|metres|counters|marks|people|times|cards|games|places|months|weeks|goals|points|litres|items|books)\b/],
  ['us-spelling', /\bmath\b|parenthes|\bexponent|\bfactor(ed|ing|ize|s out)\b|scientific notation|\bcenter|\bmeters?\b|\bliters?\b|\bcolor\b|\bfactorize|\bsimplify by canceling/i],
  ['latex-in-prose', /\\[a-zA-Z]+|\^\{|_\{|\$/],
];

const gcd = (a, b) => { let x = Math.abs(a); let y = Math.abs(b); while (y) [x, y] = [y, x % y]; return x; };
const norm = (s) => String(s).replace(/\\left|\\right|\\,|\;|\\!|\\ |\\quad|\s+/g, '').replace(/\\text\{\(.*?\)\}/g, '');

/* ------------------------------------------------- statement machinery */
// A line -> statements (split on top-level commas and TEXT markers) ->
// segments (split on = / ≈) -> each parsed or marked unparsed.
function statements(line) {
  let s;
  try { s = rewriteLogs(prep(line)); } catch { return null; }
  const pieces = [];
  for (const c of splitTop(s, [',']).parts) for (const t of c.split(TEXT)) pieces.push(t);
  return pieces.map((piece, idx) => {
    const st = piece.replace(/^[\s:;]+|[\s:;.]+$/g, '');
    if (!st) return null;
    const head = idx === 0;
    if (/[<>]|\\(le|ge|leq|geq|ne|neq|lt|gt|pm|mp|to|iff|in|mid|cup|cap|propto|Rightarrow|implies)\b/.test(st)) return { raw: st, kind: 'unparsed', head };
    const { parts, ops } = splitTop(st, ['=', '≈']);
    const segs = parts.map((p) => {
      const t = p.trim();
      if (t === '') return { empty: true };
      try { const r = parse(t); return { ...r, text: t }; } catch (e) { if (e instanceof Unparsed) return { bad: true, text: t }; throw e; }
    });
    return { raw: st, segs, ops, kind: 'ok', head, solo: pieces.length === 1 };
  }).filter(Boolean);
}
const noteTol = (line, v) => {
  const sf = line.match(/(\d)\s*(s\.f\.|significant)/); if (sf && v !== 0) return 0.5 * 10 ** (Math.floor(Math.log10(Math.abs(v))) - Number(sf[1]) + 1);
  const dp = line.match(/(\d)\s*(d\.p\.|decimal place)/); if (dp) return 0.5 * 10 ** -Number(dp[1]);
  if (/nearest whole|nearest integer|nearest degree|nearest person/.test(line)) return 0.5;
  if (/nearest penny|nearest cent/.test(line)) return 0.005;
  if (/nearest pound/.test(line)) return 0.5;
  if (/nearest (10|ten)\b/.test(line)) return 5;
  return null;
};
// Does `b` (possibly a rounded literal) agree with value a?
function agree(aSeg, aVal, bSeg, bVal, line, approx) {
  const scale = Math.max(1, Math.abs(aVal), Math.abs(bVal));
  if (Math.abs(aVal - bVal) <= 1e-9 * scale) return 'exact';
  for (const [seg, v, other] of [[bSeg, bVal, aVal], [aSeg, aVal, bVal]]) {
    if (seg.pct !== undefined) {
      // percentage written against a ratio x100
      if (Math.abs(other - v * 100) <= 1e-9 * scale * 100 || Math.abs(other * 100 - v) <= 1e-9 * scale) return 'pct';
    }
    if (seg.literal) {
      const lit = seg.literal; let tol = lit.trunc ? 10 ** -lit.dp : 0.5 * 10 ** -lit.dp;
      const nt = noteTol(line, v); if (nt != null) tol = Math.max(tol, nt);
      if (seg.pct) tol /= 100;
      tol *= 1 + 1e-9; tol += 1e-12 * scale;
      if (Math.abs(other - v) <= tol) return lit.dp === 0 && !approx && nt == null && !lit.trunc ? 'rounded-int-with-equals' : 'rounded';
      if (seg.pct && Math.abs(other / 100 - v) <= tol) return 'rounded';
      if (seg.pct && Math.abs(other - v * 100) <= tol * 100) return 'rounded';
    }
  }
  return null;
}

function parseAnswerAssignments(answer) {
  // "x = 3", "x = 1, \ y = -7", "x = 0 \text{ or } 8" -> {x:[..], y:[..]}
  const res = {}; let last = null; let ok = true;
  const sts = statements(String(answer).split('\n').join(','));
  if (!sts) return null;
  for (const st of sts) {
    if (st.kind !== 'ok') { ok = false; continue; }
    const { segs } = st;
    if (segs.length === 2 && segs[0].vars?.length === 1 && segs[0].text === segs[0].vars[0] && segs[1].f && segs[1].vars.length === 0) {
      last = segs[0].vars[0]; (res[last] ??= []).push(segs[1].f({}));
    } else if (segs.length === 1 && segs[0].f && segs[0].vars.length === 0 && last) {
      res[last].push(segs[0].f({}));
    } else ok = false;
  }
  return Object.keys(res).length ? { res, ok } : null;
}

const RAND_PTS = [1.3718, 0.8421, 2.2954, 0.6137, 1.7333, 3.1419];
function sameExpr(a, b) {
  const vars = [...new Set([...a.vars, ...b.vars])];
  let tested = 0;
  for (let k = 0; k < 3; k += 1) {
    const env = {}; vars.forEach((v, i) => { env[v] = RAND_PTS[(k * 2 + i) % RAND_PTS.length] + 0.137 * i + 0.071 * k; });
    const x = a.f(env); const y = b.f(env);
    if (!Number.isFinite(x) || !Number.isFinite(y)) continue;
    tested += 1;
    if (Math.abs(x - y) > 1e-7 * Math.max(1, Math.abs(x), Math.abs(y))) return false;
  }
  return tested ? true : null;
}

/* ------------------------------------------------------- per-question */
const stats = {};
function checkQuestion(id, band, n, q) {
  const flags = [];
  const flag = (check, detail, line) => flags.push({ id, band, seed: n, check, detail, line });
  const S = (stats[`${id}|${band}`] ??= { n: 0, lines: 0, stmts: 0, verified: 0, unparsed: 0, lastHasAnswer: 0, lastNumeric: 0, lineCounts: [] });
  S.n += 1;

  const w = q.workingOut;
  if (typeof w !== 'string' || !w.trim()) flag('working-empty', typeof w);
  if (typeof q.answer !== 'string' || !q.answer.trim()) flag('answer-empty', typeof q.answer);
  if (typeof q.instruction !== 'string' || !q.instruction.trim()) flag('instruction-empty', '');
  if (q.metadata?.difficulty !== band) flag('metadata-band', `${q.metadata?.difficulty}`);
  const wLines = String(w ?? '').split('\n');
  S.lineCounts.push(wLines.length);
  const qLines = q.questionMath != null ? String(q.questionMath).split('\n') : [];
  const aLines = String(q.answer ?? '').split('\n');
  const unitsTex = q.answerUnits ? (q.answerUnits.includes('\\') ? q.answerUnits : `\\text{${q.answerUnits}}`) : null;
  const aView = unitsTex ? `${q.answer}\\text{ }${unitsTex}` : String(q.answer ?? '');

  // KaTeX: every rendered line
  const texLines = [...qLines.map((l) => ['questionMath', l]), ...aView.split('\n').map((l) => ['answer', l]), ...wLines.map((l) => ['workingOut', l])];
  for (const [field, l] of texLines) {
    const r = katexCheck(l);
    if (r.err) flag('katex-error', `${field}: ${r.err}`, l);
    for (const wn of r.warns) flag('katex-warn', `${field}: ${wn}`, l);
    if (l.trim() === '') flag('blank-line', field, l);
    for (const [name, re, pre] of AWK) { if (re.test(pre(l))) flag(`awk:${name}`, field, l); }
    for (const m of l.matchAll(/\\text\{([^{}]*)\}/g)) for (const [name, re] of PROSE.slice(0, 2)) if (re.test(m[1])) flag(`prose:${name}`, field, l);
  }
  // duplicate consecutive working lines
  for (let i = 1; i < wLines.length; i += 1) if (norm(wLines[i]) === norm(wLines[i - 1])) flag('working-dup-line', '', wLines[i]);
  // prose fields
  for (const [field, val] of [['instruction', q.instruction], ['questionText', q.questionText], ...(q.questionParts ?? []).map((p) => ['questionParts', p])]) {
    if (val == null) continue;
    for (const [name, re] of PROSE) if (re.test(val)) flag(`prose:${name}`, field, val);
    if (/ {2,}|\s[,.;:?]|\(\s|\s\)/.test(val)) flag('prose:spacing', field, val);
    if (/NaN|undefined|\[object|Infinity/.test(val)) flag('awk:bad-value', field, val);
    if (/\d\.\d{7,}/.test(val)) flag('awk:float-noise', field, val);
  }
  // figure labels: plain text only
  const vizStrings = [];
  (function walk(o, path) {
    if (typeof o === 'string') vizStrings.push([path, o]);
    else if (Array.isArray(o)) o.forEach((x, i) => walk(x, `${path}[${i}]`));
    else if (o && typeof o === 'object') Object.entries(o).forEach(([k, v]) => walk(v, path ? `${path}.${k}` : k));
  }(q.visualization, ''));
  for (const [path, s] of vizStrings) {
    if (path === 'type') continue;
    const t = s.replace(/\^\\circ/g, '°');
    if (/\\|\^|_\{/.test(t)) flag('figure-label-latex', path, s);
    if (/NaN|undefined|\[object|Infinity|\d\.\d{7,}/.test(s)) flag('figure-label-bad-value', path, s);
    if (/(^|[^\d.])1 (hours|units|students|sides)\b/.test(s)) flag('prose:singular-plural', `viz ${path}`, s);
  }
  if (q.visualization) { const j = JSON.stringify(q.visualization); if (/null,?"?NaN|NaN/.test(j)) flag('figure-nan', '', j.slice(0, 200)); }

  // units
  if (/\\text\{\s*(cm|mm|m|km|kg|g|ml|l|litres|cm\^|m\^)\s*\}/.test(q.answer) && !q.answerUnits) flag('units-in-answer', '', q.answer);
  const figHasUnits = vizStrings.some(([p, s]) => /\d\s?(cm|mm|m|km)\b/.test(s));
  if (figHasUnits && !q.answerUnits && !/\\circ|°/.test(q.answer) && /^[a-zA-Z]?\s*=?\s*-?[\d.\\{}a-z]+$/.test(String(q.answer).trim()) && /\d/.test(q.answer)) flag('units-missing', '', q.answer);

  // stated rounding vs answer form
  const instrAll = `${q.instruction} ${q.questionText ?? ''} ${(q.questionParts ?? []).join(' ')}`;
  const ansNum = String(q.answer).match(/-?\d+\.?\d*(?!.*\d)/);
  const sfm = instrAll.match(/(\d|one|two|three)\s+significant figures?|(\d)\s*s\.f\./i);
  const dpm = instrAll.match(/(\d|one|two|three)\s+decimal places?|(\d)\s*d\.p\./i);
  const W2N = { one: 1, two: 2, three: 3 };
  if (ansNum && sfm && !/\\pi|\\sqrt|\\frac/.test(q.answer)) {
    const want = W2N[(sfm[1] ?? sfm[2]).toLowerCase()] ?? Number(sfm[1] ?? sfm[2]);
    const t = ansNum[0].replace('-', ''); const digits = t.replace('.', '').replace(/^0+/, '');
    const sig = t.includes('.') ? digits.length : digits.replace(/0+$/, '').length;
    if (t.includes('.') ? sig !== want : sig > want) flag('rounding-form', `wanted ${want} s.f.`, q.answer);
  }
  if (ansNum && dpm && !/\\pi|\\sqrt|\\frac/.test(q.answer)) {
    const want = W2N[(dpm[1] ?? dpm[2]).toLowerCase()] ?? Number(dpm[1] ?? dpm[2]);
    const dp = (ansNum[0].split('.')[1] ?? '').length;
    if (dp !== want) flag('rounding-form', `wanted ${want} d.p.`, q.answer);
  }
  // unsimplified fraction in the answer
  for (const m of String(q.answer).matchAll(/\\frac\{(-?\d+)\}\{(-?\d+)\}/g)) {
    const [a, b] = [Number(m[1]), Number(m[2])];
    if (b === 1 || b === 0 || b < 0 || a === 0) flag('answer-frac-degenerate', '', q.answer);
    else if (gcd(a, b) > 1) flag('answer-frac-unsimplified', '', q.answer);
  }

  // last step vs answer
  const lastLine = wLines[wLines.length - 1] ?? '';
  const wholeW = norm(w);
  const ansParts = aLines.map(norm);
  const inLast = ansParts.every((a) => norm(wLines.slice(-ansParts.length).join('')).includes(a) || norm(lastLine).includes(a));
  const inAny = ansParts.every((a) => wholeW.includes(a));
  if (inLast) S.lastHasAnswer += 1;

  // statement checks
  S.lines += wLines.length;
  const ansAssign = (() => { try { return parseAnswerAssignments(q.answer); } catch { return null; } })();
  const rounded = /s\.f\.|d\.p\.|nearest|significant|decimal place|≈|\\approx/.test(`${instrAll} ${w} ${q.answer}`);
  let prev = null; // { key, seg, val, bare }
  let lastVal = null;
  const allSt = [];
  const process = (line, field) => {
    const sts = statements(line);
    if (!sts) { S.unparsed += 1; return; }
    for (const st of sts) {
      S.stmts += 1;
      if (st.kind !== 'ok') { S.unparsed += 1; prev = null; continue; }
      const { segs, ops } = st;
      if (segs.some((s) => s.bad)) { S.unparsed += 1; if (segs.every((s) => s.bad || s.empty)) { prev = null; continue; } }
      allSt.push({ st, line, field });
      const numeric = (s) => s.f && s.vars.length === 0;
      let did = false;
      // (a) chain inside the statement
      for (let i = 1; i < segs.length; i += 1) {
        const [a, b] = [segs[i - 1], segs[i]];
        if (!numeric(a) || !numeric(b)) continue;
        const [x, y] = [a.f({}), b.f({})];
        if (!Number.isFinite(x) || !Number.isFinite(y)) { flag('step-nonfinite', field, line); continue; }
        const r = agree(a, x, b, y, line, ops[i - 1] === '≈');
        did = true;
        if (!r) flag('step-chain-unequal', `${a.text} [${+x.toPrecision(10)}] vs ${b.text} [${+y.toPrecision(10)}]`, line);
        else if (r === 'rounded-int-with-equals') flag('step-rounded-with-equals', `${a.text} [${+x.toPrecision(10)}] = ${b.text}`, line);
      }
      // (b) across statements: continuation "= …" or same left-hand label
      const first = segs[0];
      const firstNumIdx = segs.findIndex(numeric);
      const hasVar = first.f && first.vars.length > 0;
      const key = hasVar ? norm(first.text) : null;
      if (!st.head) prev = null;
      if (firstNumIdx >= 0 && prev && prev.val != null) {
        const link = (first.empty && st.head) || (key != null && key === prev.key && firstNumIdx === 1) || (st.solo && segs.length === 1 && prev.bare && numeric(first));
        if (link) {
          const b = segs[firstNumIdx]; const y = b.f({});
          const r = agree(prev.seg, prev.val, b, y, `${line} ${instrAll}`, true);
          did = true;
          if (!r) flag('step-cross-unequal', `prev ${prev.seg.text} [${+prev.val.toPrecision(10)}] vs ${b.text} [${+y.toPrecision(10)}]`, line);
        }
      }
      const lastNum = [...segs].reverse().find(numeric);
      if (lastNum && st.solo) {
        const v = lastNum.f({});
        prev = { key: first.empty ? prev?.key ?? null : key, seg: lastNum, val: v, bare: segs.length === 1 && numeric(first) };
      } else prev = null;
      if (lastNum && field === 'workingOut') lastVal = { seg: lastNum, val: lastNum.f({}), line };
      if (did) S.verified += 1;
    }
  };
  wLines.forEach((l) => process(l, 'workingOut'));

  // (c) the answer's solution satisfies every equation in the working and the question
  if (ansAssign) {
    const names = Object.keys(ansAssign.res);
    const combos = names.length === 1 ? ansAssign.res[names[0]].map((v) => ({ [names[0]]: v })) : (names.every((k) => ansAssign.res[k].length === 1) ? [Object.fromEntries(names.map((k) => [k, ansAssign.res[k][0]]))] : []);
    const multi = combos.length > 1;
    const eqCheck = (line, field) => {
      const sts = statements(line); if (!sts) return;
      for (const st of sts) {
        if (st.kind !== 'ok' || st.segs.some((s) => s.bad || s.empty) || st.segs.length < 2) continue;
        const vars = new Set(st.segs.flatMap((s) => s.vars));
        if (!vars.size || ![...vars].every((v) => names.includes(v))) continue;
        const trivial = st.segs.length === 2 && st.segs[0].text === st.segs[0].vars[0] && st.segs[1].vars.length === 0;
        if (multi && trivial) continue;
        for (const env of combos) {
          const vals = st.segs.map((s) => s.f(env));
          let bad = false;
          for (let i = 1; i < vals.length; i += 1) {
            const sc = Math.max(1, Math.abs(vals[i]), Math.abs(vals[i - 1]));
            let tol = rounded ? 0.02 * sc : 1e-7 * sc;
            if (Math.abs(vals[i] - vals[i - 1]) > tol) bad = true;
          }
          S.verified += 1;
          if (bad) { flag(field === 'workingOut' ? 'eq-not-satisfied' : 'question-eq-not-satisfied', `${JSON.stringify(env)} -> ${vals.map((v) => +v.toPrecision(8)).join(' | ')}`, line); break; }
        }
      }
    };
    wLines.forEach((l) => eqCheck(l, 'workingOut'));
    if (!/\\text\{when|Find|=.*=/.test(q.questionMath ?? '')) qLines.forEach((l) => eqCheck(l, 'questionMath'));
  }

  // (d) expression equivalence: bare question expression, bare working lines, bare answer
  const bare = (line) => {
    const sts = statements(line);
    if (!sts || sts.length !== 1 || sts[0].kind !== 'ok' || sts[0].segs.length !== 1 || !sts[0].segs[0].f) return null;
    return sts[0].segs[0];
  };
  if (qLines.length === 1 && aLines.length === 1) {
    const qe = bare(qLines[0]); const ae = bare(q.answer);
    if (qe && ae && (qe.vars.length || !/factor|prime|write|round|estimate|order|standard form|ordinary|percent|fraction|decimal|multiplier|convert/i.test(q.instruction))) {
      const isNumericQ = qe.vars.length === 0;
      const cmp = (x, y, what, line) => {
        let same;
        if (isNumericQ && x.vars.length === 0 && y.vars.length === 0) same = !!agree(x, x.f({}), y, y.f({}), `${line} ${instrAll}`, true);
        else same = sameExpr(x, y);
        S.verified += 1;
        if (same === false) flag(what, `${x.text}  !=  ${y.text}`, line);
      };
      cmp(qe, ae, 'answer-not-equivalent-to-question', q.answer);
      for (const l of wLines) { const we = bare(l); if (we && (we.vars.length || isNumericQ)) cmp(qe, we, 'working-line-not-equivalent', l); }
    }
  }

  // last step vs answer, numerically where the strings differ
  if (!inLast) {
    let numericOK = false;
    try {
      const ae = bare(aView.split('\n').slice(-1)[0]) ?? (() => { const sts = statements(aLines[aLines.length - 1]); const s = sts?.[sts.length - 1]; const seg = s?.segs?.[s.segs.length - 1]; return seg?.f && seg.vars.length === 0 ? seg : null; })();
      if (ae && ae.vars.length === 0 && lastVal && lastVal.line === lastLine) numericOK = !!agree(lastVal.seg, lastVal.val, ae, ae.f({}), `${lastLine} ${instrAll}`, true);
    } catch { /* eye */ }
    if (numericOK) S.lastNumeric += 1;
    else flag(inAny ? 'answer-not-last-line' : 'answer-not-in-working', '', `${lastLine}  ||  ${q.answer}`);
  }

  // numbers and letters: working vs question
  const numsOf = (s) => new Set((String(s).replace(/\\text\{[^{}]*\}/g, (m) => m).match(/\d+(?:\.\d+)?/g) ?? []).map((x) => String(Number(x))));
  const qSrc = `${q.questionMath ?? ''} ${q.questionText ?? ''} ${vizStrings.map(([, s]) => s).join(' ')} ${JSON.stringify(q.visualization ?? '')}`;
  const qNums = numsOf(qSrc); const wNums = numsOf(w);
  if (qNums.size && wNums.size && ![...qNums].some((x) => wNums.has(x))) flag('numbers-disjoint', `${[...qNums].slice(0, 6)} | ${[...wNums].slice(0, 6)}`, w);
  const lettersOf = (s) => new Set(noCmd(String(s)).replace(/[^a-z]/g, ' ').split(/\s+/).filter((t) => t.length === 1));
  const qVars = lettersOf(`${q.questionMath ?? ''}`); const wVars = lettersOf(w); const aVars = lettersOf(q.answer);
  if (qVars.size && wVars.size && ![...qVars].some((x) => wVars.has(x))) flag('letters-disjoint', `${[...qVars]} | ${[...wVars]}`, w);
  if (aVars.size && qVars.size && ![...aVars].some((x) => qVars.has(x))) flag('answer-letters-disjoint', `${[...qVars]} | ${[...aVars]}`, q.answer);
  if (wLines.length > 8) flag('working-long', `${wLines.length} lines`, '');
  for (const f of flags) out.write(`${JSON.stringify(f)}\n`);
  return flags.length;
}

let total = 0; let throws = 0;
for (const id of Object.keys(skills)) {
  if (!rx.test(id)) continue;
  for (const band of bandsOf(id)) {
    for (let n = 1; n <= N; n += 1) {
      let q;
      try { q = draw(id, band, n); } catch (e) { throws += 1; out.write(`${JSON.stringify({ id, band, seed: n, check: 'generator-throw', detail: String(e.message).slice(0, 200) })}\n`); continue; }
      try { total += checkQuestion(id, band, n, q); } catch (e) { out.write(`${JSON.stringify({ id, band, seed: n, check: 'audit-script-error', detail: String(e.stack).slice(0, 300) })}\n`); }
    }
  }
}
for (const s of Object.values(stats)) { const lc = s.lineCounts; s.minLines = Math.min(...lc); s.maxLines = Math.max(...lc); s.avgLines = +(lc.reduce((a, b) => a + b, 0) / lc.length).toFixed(2); delete s.lineCounts; }
fs.writeFileSync(new URL(`../out/sweep-summary${tag}.json`, import.meta.url), JSON.stringify({ seeds: N, stats }, null, 0));
out.end();
console.log(`seeds ${N}; flags ${total}; generator throws ${throws}`);
