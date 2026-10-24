# Maths Starters

A maths starter board for the classroom. Generates four questions for the
start of a lesson, sized for an interactive whiteboard, with answers the
teacher reveals when ready.

Built for UK secondary teachers on the Cambridge IGCSE 0607 syllabus.
No login, no backend, no student accounts.

## Running it

```bash
npm install
npm run dev      # Vite dev server
npm test         # vitest
npm run lint     # oxlint
npm run build
```

Node 20 or later.

## How it works

The teacher picks a pool of topics in the topic panel (Pythagoras, Volume,
Sequences, ...). The pool is saved in the browser. Each of the four boxes
draws a topic at random from the pool and asks a question from it.

Questions are generated, not stored, so every board is fresh. Each box has
three buttons:

| Button | Action |
|--------|--------|
| # | Same skill, fresh numbers |
| ↻ | Next skill within the same topic |
| ⇄ | Swap this box to a different topic from the pool |

The header sets the difficulty for the whole board: Foundation, Core or
Stretch, plus Mixed, which ramps the four boxes from Foundation to Stretch.
Bands change the shape of a question, not just the size of its numbers.

Space reveals the answers, `r` draws four new questions, and there is a
countdown timer.

## Repository layout

```
src/
  components/              board, slots, figures, maths renderer
  curriculum/
    skills.js              catalogue: skill ids → generator functions, by topic
    topicPool.js           the teacher's topic selection
    schemes/*.json         textbook backlog; pure data, not used by the app
  generators/              pure functions returning question data
  lib/                     KaTeX loader, type sizing
reference/                 design export; read-only, nothing builds from it
```

## Documents

Read these before changing anything structural. They disagree with each other
nowhere; if they ever do, that's a bug.

| File | What it covers |
|------|----------------|
| `CLAUDE.md` | Conventions and non-negotiables. Read first. |
| `SPEC.md` | Question shape, maths rendering, persistence |
| `DESIGN.md` | Visual system, tokens, layout rules |
| `MIGRATION.md` | Porting generators from `maths-teaching-app` |

## Conventions worth knowing before you touch anything

**Generators return data, never JSX.** A generator takes an options object and
returns `{ instruction, questionMath, answer, workingOut, visualization,
metadata }`. It doesn't import React and doesn't read state. The board shows
the question and the answer; `workingOut` is not displayed.

**Schemes are pure JSON.** They must survive `JSON.parse(JSON.stringify(x))`
unchanged. Function references live in the catalogue, never the scheme.

**Type sizing is computed, not scaled.** Slots are `container-type: size` and
question sizes are `clamp()` values built from line count and line length in
`cqh`/`cqi` units. That's why the board never scrolls at any resolution. Don't
replace it with a fixed scale.

**Maths renders in KaTeX.** Every question and answer line is set in KaTeX's
serif, and figure labels in the same face; the interface and the instruction
stay in Archivo. KaTeX is its own chunk, preloaded on mount.

**No Tailwind.** Plain CSS with custom properties.

## Out of scope

Accounts, a backend, sharing between teachers, student-facing mode, answer
capture, analytics, printing, PDF export.

## Questions come from generators, not textbooks

Generators are calibrated against textbook exercises — matching notation,
number ranges and difficulty progression — and produce fresh parameterised
questions. Textbook questions are not copied into this repository.
