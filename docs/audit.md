# Repo audit — 2026-08-17

Read-only audit ahead of the first live generator. Covers: state vs. plan,
the archivoMath/dev-harness work, the uncommitted MIGRATION.md rewrite, and
open decisions.

## 1. State vs. plan

`MIGRATION.md`'s build order (`SPEC.md` §10) is:

1. Extract the board — **done.** `src/components/Board.jsx` + `.css`,
   `Figure.jsx`, `Header.jsx`, `Slot.jsx`, `TopicsPanel.jsx` exist and the app
   renders. The last commit (`8a3ee63`) touched `Board.css`/`Board.jsx`
   further: touch targets grew from 28–30px to 34px, `100vh` → `100dvh`,
   `overflow: auto` → `hidden`, and the slot-bar margin became a `clamp()`
   instead of a fixed `-34px` — all small robustness fixes, no scope change.
2. Question shape, hybrid renderer, one migrated generator rendering live —
   **half done.** The hybrid renderer (`MathDisplay.jsx` +
   `lib/archivoMath.jsx`) is built and matches `SPEC.md` §6 and `DESIGN.md`'s
   "Planned change" note precisely (see §2 below). No generator has been
   migrated yet — `src/generators/` doesn't exist, and `Board.jsx`'s
   `SLOTS`/topic pool is still placeholder data (`lib/placeholderTopics.js`),
   not a real generator.
3. Skill catalogue — doesn't exist (`src/curriculum/skills.js` absent).
4. `resolveSlots` with tests — doesn't exist (`src/lib/resolveSlots.js`
   absent), and no test runner is configured in `package.json` (only
   `vite`, `oxlint`, `@vitejs/plugin-react` as devDeps).
5–8. Classes/ticks/localStorage, scheme screen, shuffle, bulk migration —
   not started.

So the repo is mid-step-2: the rendering half of that step is finished and
solid; the generator half hasn't begun. That lines up with `README.md`'s
"14 ready, 137 todo" count being aspirational, not current — right now 0
generators are wired into the app.

## 2. The archivoMath / dev-harness work

This is in scope, not scope creep. `DESIGN.md` ("Maths rendering") explicitly
plans "extend the parser to accept a LaTeX subset... so the existing
generators migrate without rewriting their output strings," and `SPEC.md` §6
specifies the exact fallback contract: Archivo parser handles the common
cases, KaTeX (dynamically imported) covers `\frac` nested ≥2 levels, unknown
commands, indexed roots, recurring-decimal dots, column vectors. What's in
`src/lib/archivoMath.jsx` and `src/components/MathDisplay.jsx` implements
that contract line for line — same symbol list, same nesting-depth cutoff,
same indexed-root exclusion, same dynamic KaTeX import. The Stack line in
CLAUDE.md ("KaTeX (dynamically imported, fallback only)") is honoured: KaTeX
is never imported until `parseArchivoLine` returns `null`.

The dev harness (`src/dev/MathTestPage.{jsx,css}`, `src/mathTestMain.jsx`,
`math-test.html`) is a second Vite HTML entry point exercising every case
`SPEC.md` §6 names, both native and fallback. I verified it's genuinely
excluded from the shipped app: `vite.config.js` has no
`build.rollupOptions.input` for multi-page builds, so `npm run build` only
processes root `index.html`. Running the build confirms `dist/` contains no
trace of `math-test.html`, `MathTestPage`, or `mathTestMain.jsx` — the
comment at `src/dev/MathTestPage.jsx:6-7` claiming this is accurate.

One real gap: `.gitignore` doesn't exclude anything under `src/dev/` or
`math-test.html`, and CLAUDE.md has no stated convention for dev-only tooling
at all — it isn't scratch (it's committed, useful, and tied to a spec
section) but it also isn't mentioned as a permanent pattern anywhere in the
docs. Worth a one-line decision (see §4) rather than leaving it implicit.

## 3. The uncommitted MIGRATION.md rewrite

No conflicts found against `SPEC.md`, `DESIGN.md`, or `README.md`. The
rewrite adds a "Source location" section pointing at a sibling
`hexagon-maths/maths-teaching-app/src/` checkout, expands the generator table
from 10 illustrative rows to a complete 26-row take/check/no/later list, and
reorders "Suggested migration order" to front-load the Last Year puzzle pool
(step 6) ahead of some algebra generators — consistent with `SPEC.md` §4.2's
fallback chain, which needs a non-empty puzzle pool before anything else can
fall back to it.

I checked the new dependency: `/workspaces/hexagon-maths` exists as a sibling
directory (its own git repo, checked out today), and
`hexagon-maths/maths-teaching-app/src/generators/` contains all 26 files the
rewritten table names, across the same six category folders (algebra,
geometry, number, puzzles, statistics, core). The migration plan's
precondition is satisfied — nothing here is blocked on a missing source repo.

No inconsistency to flag; this file is ready to commit as-is once whoever
authored the rewrite is done. The only content still worth a second pair of
eyes is the four `check` rows, which is a decision item, not a doc conflict —
see §4.

## 4. Open decisions blocking the first live generator

1. **Which four `check` rows keep which implementation.** MIGRATION.md
   flags two duplicate pairs plus one singular/plural pair as needing a
   human diff before porting: `algebra/recurringDecimalsGenerator.js` vs.
   `number/recurringDecimalGenerator.js`; `algebra/rearrangingFormulaeGenerator.js`
   vs. `algebra/formulaRearrangementGenerator.js`; `puzzles/magicSquareGenerator.js`
   (singular, "likely dead") vs. `puzzles/magicSquareGenerators.js`; and
   `geometry/squareGenerators.js`, flagged as possibly overlapping
   area/mensuration content elsewhere in the scheme rather than having a
   named duplicate. None of these block starting migration — `MIGRATION.md`
   already sequences `recurringDecimal*` at step 9 and doesn't need
   `squareGenerators` or the formula-rearranging pair until later either —
   but they do need the person who knows the Haese source and the current
   scheme content to pick a winner, since "keep the better implementation"
   isn't an engineering call.

2. **Whether `factorisingQuadraticsGenerator` is still the agreed first
   port.** Both the old and rewritten `MIGRATION.md` name it as reference
   implementation and step 1, and `SPEC.md`'s question-shape example
   (§3) is itself a factorising example — so this reads as already settled,
   not actually open. Flagging only because CLAUDE.md's "Current state vs
   planned structure" note said not to assume; on inspection there's no
   disagreement to resolve here.

3. **Difficulty-band convention.** `MIGRATION.md`'s "Known issues" §5 says
   every migrated generator "must either genuinely vary output across its
   declared bands, or declare fewer bands" — `foundation`/`core`/`stretch`
   is the fixed label set (`SPEC.md` §2.3's `difficulty: 0/1/2` maps to
   Foundation/Core/Stretch). What's *not* specified anywhere is how a
   generator should vary — is a harder band a wider number range, more
   steps, an unfamiliar structure, or some combination? The old repo's
   generators were inconsistent about this per the same "Known issues"
   section, so porting them will silently inherit whatever convention (or
   lack of one) each source file happened to use unless someone decides
   what "harder" means before generator 1 is written. Genuinely open.

4. **Dev-harness convention.** Per §2: `src/dev/` and the second HTML entry
   point work and are excluded from the build, but no document says this is
   the sanctioned pattern for future dev tooling (vs. a one-off for
   `MathDisplay`). Worth either a short note in `README.md`'s repository
   layout table or a decision to fold `math-test.html` into Storybook-style
   tooling later — low stakes, but currently undocumented.

Item 2 turned out not to be open on inspection — listed for completeness
since it was checked, not because it needs a decision.
