# audit/

Working-out and figure audit (branch `audit/fable-day`). Nothing here ships; nothing in `src/` imports it.

| File | What |
|---|---|
| `SUMMARY.md` | Start here: counts, fixed list, Needs Joakim list, patterns, what was not covered |
| `defects.md` | The defect log, one entry per defect |
| `coverage.md` | One row per skill x band: status, seeds checked mechanically, samples read by eye |
| `progress.md` | What is done, for resuming |
| `scripts/` | The audit tools (below) |
| `out/` | Sweep output (`flags.jsonl`, `sweep-summary.json`) |
| `data/` | Source of `defects.md` / `coverage.md` (`log.py` renders them) |

## Reproducing a finding

```bash
node audit/scripts/show.mjs <skill-id> <band> <seed>      # prints that exact question
node audit/scripts/sweep.mjs 300                           # the whole mechanical sweep (~1 min)
node audit/scripts/flagsum.mjs '<check regex>' '<skill regex>' 2
```

Runs are reproducible without touching the generators: `seed.mjs` installs a seeded
PRNG (mulberry32) over `Math.random` before anything else is imported (lodash captures
`Math.random` when it loads), and re-keys it on `skill|band|seed` before each draw.
