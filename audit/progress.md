# Progress (resume from here)

Branch `audit/fable-day`. Tools in `audit/scripts/` (see `audit/README.md`).

- [x] Recon; baseline `npm test`: 87 files, 769 tests, all pass (774 s). No pre-existing failures.
- [x] Seeded PRNG + resolve hook (`seed.mjs`), no generator modified.
- [x] Mechanical sweep, 300 seeds x every skill x band (`sweep.mjs`) -> `audit/out/`
- [ ] Reads by eye, in catalogue order (see coverage.md for what is read; batches of ~18 skills via `node audit/scripts/read.mjs <from> <to>`). Done: skills 0-91.
- [ ] Figures
- [ ] SUMMARY.md

Note: the catalogue holds 228 skills (681 skill x band), not 180; 3 skills have two bands, not 4. All 228 are in scope.

## How commits are tested

Per fix commit: the mechanical sweep for that skill (300 seeds) and the test files of that
generator family plus `src/generators/workingOut.regression.test.js`.
The full suite (13 minutes) is run at checkpoints on the branch tip, as two shards
(`npx vitest run --shard=1/2`, `--shard=2/2`), and the branch is pushed only after a green
checkpoint. Running it before every single commit was not practical: the session's background
processes were killed twice mid-run. Checkpoints (all green):

- 33a2857 (after 44 fix commits): 88 files, 792 tests pass.
