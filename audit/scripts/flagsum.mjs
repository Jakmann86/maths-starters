// node audit/scripts/flagsum.mjs [checkRegex] [idRegex] [examplesPerRow]  — flags grouped by check, then skill x band
import fs from 'node:fs';
const [cre = '.', ire = '.', ex = 1, file = 'flags.jsonl'] = process.argv.slice(2);
const rows = fs.readFileSync(new URL(`../out/${file}`, import.meta.url), 'utf8').trim().split('\n').filter(Boolean).map((l) => JSON.parse(l));
const by = {};
for (const r of rows) { if (!new RegExp(cre).test(r.check) || !new RegExp(ire).test(r.id)) continue; const k = `${r.check}`; const k2 = `${r.id} ${r.band[0].toUpperCase()}`; ((by[k] ??= {})[k2] ??= []).push(r); }
for (const [check, m] of Object.entries(by).sort()) {
  const tot = Object.values(m).reduce((a, b) => a + b.length, 0);
  console.log(`\n=== ${check}: ${tot} flags, ${Object.keys(m).length} skill-bands`);
  if (Number(ex) < 0) continue;
  for (const [k2, list] of Object.entries(m)) {
    console.log(`  ${k2} x${new Set(list.map((r) => r.seed)).size}`);
    for (const r of list.slice(0, Number(ex))) console.log(`      #${r.seed} ${r.detail ?? ''} :: ${(r.line ?? '').replace(/\n/g, ' ⏎ ').slice(0, 260)}`);
  }
}
