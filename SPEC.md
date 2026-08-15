# Maths Starters — Specification

Supersedes the earlier draft. Reconciled with the final design
(`reference/starter-board.html`) and `DESIGN.md`.

## 1. What it does

Generates four maths questions for the start of a lesson, on a classroom
board. Each question sits in a slot representing a distance into the past:

| Slot | Label       | Drawn from                                   |
|------|-------------|----------------------------------------------|
| 1    | Last lesson | The most recently taught entry               |
| 2    | Last week   | Anything taught in the previous week         |
| 3    | Last topic  | Anything from the previous chapter           |
| 4    | Last year   | Long-ago material and puzzles                |

Spacing retrieval at widening intervals is the point. A pool of random topics
gives interleaving but leaves spacing to chance; with a full scheme checked,
chance regularly serves four things from the same half-term. Resolving each
slot by recency guarantees the distribution.

Shuffle mode overrides this — see §5.

## 2. Data model

### 2.1 Skill catalogue — `src/curriculum/skills.js`

Maps curriculum labels to generator functions. Code, not data.

```js
export const skills = {
  'pythagoras-hypotenuse': {
    label: 'Pythagoras: find the hypotenuse',
    generate: (opts) => pythagorasGenerators.generateFindHypotenuse(opts),
    difficulties: ['foundation', 'core', 'stretch'],
  },
};
```

`difficulties` lists only the bands the generator genuinely varies across. A
generator that ignores the option declares one band.

### 2.2 Scheme — `src/curriculum/schemes/haese-igcse.json`

An ordered array of entries. Order in the array is the teaching order. Pure
JSON — it must survive a round trip through `JSON.stringify`.

```json
{ "id": "8A", "ch": 8, "unit": "The theorem of Pythagoras",
  "lesson": "Pythagoras' theorem", "page": 170,
  "skills": ["pythagoras-hypotenuse", "pythagoras-missing-side"],
  "status": "ready" }
```

`status` is `ready` (a generator exists), `todo` (startable, generator needed)
or `skip` (not reducible to a starter question). Only `ready` entries can fill
a slot; the field doubles as the build backlog.

The shipped file follows Haese's chapter order. That is a reference order, not
a teaching order — expect to reorder it in the scheme editor.

### 2.3 Class — localStorage

```json
{ "id": "c1", "name": "10B/Ma2", "schemeId": "haese-igcse",
  "difficulty": 1,
  "ticks": [ { "entryId": "1A", "tickedAt": "2026-09-08" },
             { "entryId": "1B", "tickedAt": "2026-09-10" } ] }
```

Ticks are the only record of progress. There is no position integer and no
exclusion list — a class that skipped surds simply never ticked surds, and
untaught material can never appear.

`difficulty` is `0` Foundation, `1` Core, `2` Stretch.

Ticking sets `tickedAt` to today. Editing a tick's date is allowed (people
forget to tick on the day); unticking removes the record.

## 3. Question shape

Generators return this. The board adapts to it — do not change generator
output to match the board's internal field names.

```js
{
  instruction: 'Factorise',            // plain text, imperative
  questionMath: 'x^2 + 7x + 12',       // LaTeX, no delimiters
  questionText: undefined,             // instead of questionMath, for prose
  answer: '(x + 3)(x + 4)',
  answerUnits: undefined,              // 'cm' — never baked into answer
  workingOut: '\\text{pair multiplying to } 12',
  visualization: { type: 'right-triangle', a: '3 cm', b: '4 cm', c: 'x' },
  metadata: { topic: 'factorising-quadratics', difficulty: 'core' }
}
```

`visualization` is a config object. The board's `figNode` maps `type` to an
SVG branch. Generators never return JSX.

Multi-line questions use `\n` in `questionMath`.

## 4. Slot resolution

A pure function, unit tested: `resolveSlots(scheme, catalogue, cls, today)`.

Work from the class's ticks, sorted by `tickedAt` descending. Let `latest` be
the most recent tick.

- **Last lesson** — the skills of `latest`'s entry.
- **Last week** — entries ticked during the calendar week before the week
  containing `latest`. If that week is empty, step back a week at a time, up
  to four weeks, to clear half-terms and holidays.
- **Last topic** — walk back through ticks for the first entry whose `unit`
  differs from `latest`'s. Pool every ticked entry in that unit.
- **Last year** — everything ticked more than six weeks before `today`, plus
  every `Puzzles` entry regardless of tick state.

### 4.1 Filters, before sampling any pool

1. Drop entries whose `status` is not `ready`.
2. Drop entries with an empty `skills` array.
3. Drop any skill already chosen for an earlier slot — no repeats in one board.

### 4.2 Fallback chain

Pools are empty for most of the first half-term. When one empties after
filtering, fall through and take the first that isn't:

```
Last topic  → Last week → Last lesson → puzzles
Last week   → Last lesson → puzzles
Last lesson → puzzles
Last year   → puzzles
```

Puzzles are the backstop and have no prerequisites, so they can always fill a
slot. If even that fails, render the slot's empty state — never throw.

### 4.3 Difficulty

Pass the class band to `generate()`. If the skill doesn't declare that band,
pass the nearest it does (stretch → core → foundation). The header stepper
regenerates all four slots and hides answers, as it does now.

## 5. Shuffle

A header toggle. When on, all four slots sample independently from every
ticked `ready` entry, ignoring recency. For revision lessons and cover.

**The labels must change with it.** A box saying "Last year" over yesterday's
work is a lie, and the labels are load-bearing — they tell the class why the
question is there. In shuffle mode each eyebrow shows the entry's chapter name
instead of the temporal label. Slot colours stay as they are.

Shuffle is per-session, not stored on the class.

## 6. Maths rendering

Hybrid, in one component. The custom Archivo parser handles the common cases;
KaTeX covers what it can't.

**Parser handles** — `\frac{}{}` (one level), `\sqrt{}`, `^{}`, `_{}`,
`\times`, `\div`, `\pm`, `\le`, `\ge`, `\ne`, `\pi`, `\text{}`, degrees, and
plain algebra. Hyphens before a digit or letter become U+2212.

**Falls back to KaTeX** when it meets an unknown `\command`, or a `\frac`
nested two or more levels deep — at 0.82em per level, nested fractions become
unreadable at the back of a room. In practice this catches:

- recurring decimal dots, `0.\dot{1}\dot{2}` (chapter 6 and your existing
  recurring-decimals generator)
- column vectors, `\begin{pmatrix}` (chapter 24)
- indexed surds, `\sqrt[3]{}` (chapter 6)
- stacked algebraic fractions (chapter 16)

The parser returns `null` on anything it can't take, and the caller renders
KaTeX for that expression only. KaTeX is dynamically imported so it costs
nothing on boards that never hit a fallback.

Those expressions render in KaTeX's serif rather than Archivo. That is a
handful of questions across a year, and maths set in a serif is conventional
enough that it won't read as a fault.

## 7. Screens

### 7.1 Board — `/`

As built. Header segments, 2×2 grid, container-query type sizing, per-slot
regenerate and swap, timer, reveal, fullscreen. Space toggles answers, `r`
regenerates all.

Additions to what exists: a class selector in the header, and the shuffle
toggle.

`swapOne()` currently re-rolls to a random different topic. Keep that as the
click action — it is fast mid-lesson — and add a picker on long press or
right-click for when you want something specific.

### 7.2 Scheme — `/scheme`

The existing topic panel, grown up. Same sheet, same 20px square tick boxes,
same All / None / Done header.

Changes needed for 172 entries: group by chapter rather than strand, make
groups collapsible, add a filter field, show the tick date beside a ticked
row, and allow drag-and-drop reordering of entries. Export and import JSON.

Entries with `status: "todo"` show but are visibly inert — they can't be
ticked into play until a generator exists. That makes the panel the build
backlog as well as the progress record.

### 7.3 Classes — `/classes`

Create, rename, delete. Set scheme and difficulty band. Each class carries its
own ticks, so two classes on the same scheme sit at different points in it and
get genuinely different boards.

## 8. Persistence

localStorage throughout. Classes and schemes under stable keys; the four
resolved questions cached under `board:{classId}:{yyyy-mm-dd}` so a refresh
mid-lesson doesn't change the board, and tomorrow's is fresh. Regenerating a
slot overwrites its cache entry.

This is simpler than seeding the generators' RNG, which would mean touching
every one of them.

## 9. Out of scope

Accounts, a backend, sharing between teachers, student-facing mode, answer
capture, analytics, printing, PDF export, and the four other lesson sections
from the original app.

Calculator / non-calculator filtering is deferred — the catalogue may carry
the tag, but there is no UI for it and nothing filters on it yet.

## 10. Build order

1. Extract the board from the design bundle into a clean Vite + React project.
2. Question shape, the hybrid renderer, one migrated generator rendering live.
3. Skill catalogue with the 14 `ready` skills.
4. `resolveSlots` with tests covering the fallback chain and an empty tick list.
5. Classes, ticks, localStorage.
6. Scheme screen with grouping, filter, reorder, import/export.
7. Shuffle toggle and label switching.
8. Bulk generator migration — see `MIGRATION.md`.

Steps 1–5 give something usable in a real lesson.
