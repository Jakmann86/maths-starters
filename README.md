# Maths Starters

A maths starter board for the classroom. Generates four questions for the
start of a lesson, sized for an interactive whiteboard, with answers the
teacher reveals when ready.

Each slot represents a distance into the past:

| Slot | Label       | Drawn from                           |
|------|-------------|--------------------------------------|
| 1    | Last lesson | The most recently taught entry       |
| 2    | Last week   | Anything taught the previous week    |
| 3    | Last topic  | Anything from the previous chapter   |
| 4    | Last year   | Long-ago material and puzzles        |

Questions are generated, not stored, so every board is fresh. Which skill
lands in each slot is worked out from where the class has got to in an
ordered scheme of work — tick lessons off as you teach them and the board
keeps itself current. There is nothing to write each week.

Built for UK secondary teachers on the Cambridge IGCSE 0607 syllabus.
No login, no backend, no student accounts.

## Running it

```bash
npm install
npm run dev
```

Node 20 or later.

## How it works

Three pieces of state produce a board:

- **A scheme of work** — an ordered list of curriculum entries. Ships with
  Haese IGCSE order; reorder it to match how you actually teach.
- **A class's ticks** — which entries that class has covered, and when.
  This is the only progress record. Untaught material can never appear.
- **A difficulty band** — Foundation, Core or Stretch.

Two classes on the same scheme, ticked to different points, get genuinely
different boards. There is no per-class scheme to maintain.

Shuffle mode ignores recency and samples from everything ticked, for revision
lessons and cover. The slot labels change to chapter names when it's on,
since "Last year" over yesterday's work would be a lie.

## Repository layout

```
src/
  curriculum/
    skills.js              catalogue: curriculum labels → generator functions
    schemes/*.json         ordered schemes; pure data, user-editable
  generators/              pure functions returning question data
  lib/resolveSlots.js      the spiral; unit tested
  components/              board, slots, figures, maths renderer
reference/                 design exports; read-only, nothing builds from these
```

## Documents

Read these before changing anything structural. They disagree with each other
nowhere; if they ever do, that's a bug.

| File | What it covers |
|------|----------------|
| `CLAUDE.md` | Conventions and non-negotiables. Read first. |
| `SPEC.md` | Data model, slot resolution, maths rendering, screens |
| `DESIGN.md` | Visual system, tokens, layout rules |
| `MIGRATION.md` | Porting generators from `maths-teaching-app` |

## Status

The scheme file doubles as the build backlog. Each entry carries a `status`:

- **ready** — a generator exists and the entry can fill a slot
- **todo** — startable, generator still needed
- **skip** — not reducible to a starter question

Currently 5 ready, 165 todo, 19 skip across 32 Haese chapters. Only `ready`
entries can be ticked into play, so the scheme screen shows progress and
remaining work at once.

## Conventions worth knowing before you touch anything

**Generators return data, never JSX.** A generator takes an options object and
returns `{ instruction, questionMath, answer, workingOut, visualization,
metadata }`. It doesn't import React and doesn't read state.

**Schemes are pure JSON.** They must survive `JSON.parse(JSON.stringify(x))`
unchanged. Function references live in the catalogue, never the scheme.

**Type sizing is computed, not scaled.** Slots are `container-type: size` and
question sizes are `clamp()` values built from line count and line length in
`cqh`/`cqi` units. That's why the board never scrolls at any resolution. Don't
replace it with a fixed scale.

**Maths rendering is hybrid.** A custom parser handles the common cases in
Archivo; KaTeX is dynamically imported as a fallback for notation it can't
take — recurring decimal dots, column vectors, indexed surds, stacked
algebraic fractions.

**No Tailwind.** Plain CSS with custom properties.

## Out of scope

Accounts, a backend, sharing between teachers, student-facing mode, answer
capture, analytics, printing, PDF export.

## Questions come from generators, not textbooks

Generators are calibrated against textbook exercises — matching notation,
number ranges and difficulty progression — and produce fresh parameterised
questions. Textbook questions are not copied into this repository.
