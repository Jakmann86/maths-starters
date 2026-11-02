# Future directions — not the app

**Nothing in this file is built, and nothing here is a requirement.** It
holds designs that were written for an earlier model of the app, or ideas
that were proposed and parked. They are kept because the app might grow into
them one day. If you are working on the app as it stands, read `SPEC.md`
instead.

Before building anything from this file, check with the user. Each section
would change what the app is, and `CLAUDE.md` takes precedence over all of it.

---

## 1. The recency model

Originally each of the four boxes represented a distance into the past,
resolved from the class's position in an ordered scheme of work:

| Slot | Label       | Drawn from                                   |
|------|-------------|----------------------------------------------|
| 1    | Last lesson | The most recently taught entry               |
| 2    | Last week   | Anything taught in the previous week         |
| 3    | Last topic  | Anything from the previous chapter           |
| 4    | Last year   | Long-ago material and puzzles                |

The reasoning: spacing retrieval at widening intervals is the point. A pool of
random topics gives interleaving but leaves spacing to chance; with a full
scheme checked, chance regularly serves four things from the same half-term.
Resolving each slot by recency guarantees the distribution.

**Why it was dropped (2026-08-25):** every class has a different scheme and
year group, and a single ordered scheme cannot represent that. A teacher going
room to room needs to load four questions in seconds without first telling the
app where their class is. The app moved to a topic pool chosen by the teacher.

A lighter version was also floated: drive "Last lesson / Last week" from
which *topics* were last ticked in the pool, with no calendar arithmetic. That
is not built either.

### 1.1 Class record — localStorage

```json
{ "id": "c1", "name": "10B/Ma2", "schemeId": "haese-igcse",
  "difficulty": 1,
  "ticks": [ { "entryId": "1A", "tickedAt": "2026-09-08" },
             { "entryId": "1B", "tickedAt": "2026-09-10" } ] }
```

Ticks would be the only record of progress. No position integer and no
exclusion list — a class that skipped surds simply never ticked surds, and
untaught material could never appear. `difficulty` is `0` Foundation, `1`
Core, `2` Stretch. Ticking sets `tickedAt` to today; editing a tick's date is
allowed (people forget to tick on the day); unticking removes the record.

Under this model the scheme JSON would be imported by the app, and only
entries with `status: "ready"` could fill a slot.

### 1.2 Slot resolution

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

Filters, before sampling any pool:

1. Drop entries whose `status` is not `ready`.
2. Drop entries with an empty `skills` array.
3. Drop any skill already chosen for an earlier slot — no repeats in one board.

Fallback chain. Pools are empty for most of the first half-term. When one
empties after filtering, fall through and take the first that isn't:

```
Last topic  → Last week → Last lesson → puzzles
Last week   → Last lesson → puzzles
Last lesson → puzzles
Last year   → puzzles
```

Puzzles are the backstop and have no prerequisites, so they can always fill a
slot. If even that fails, render the slot's empty state — never throw.

### 1.3 Shuffle

A header toggle. When on, all four slots sample independently from every
ticked `ready` entry, ignoring recency. For revision lessons and cover.

The labels would have to change with it. A box saying "Last year" over
yesterday's work is a lie, and the labels are load-bearing — they tell the
class why the question is there. In shuffle mode each eyebrow would show the
entry's chapter name instead of the temporal label. Slot colours stay as they
are. Shuffle is per-session, not stored on the class.

### 1.4 Board cache

The four resolved questions cached under `board:{classId}:{yyyy-mm-dd}` so a
refresh mid-lesson doesn't change the board, and tomorrow's is fresh.
Regenerating a slot overwrites its cache entry. Simpler than seeding every
generator's RNG.

(Today a refresh draws a fresh board; only the topic pool persists.)

---

## 2. Screens

### 2.1 Scheme editor — `/scheme`

The topic panel, grown up. Same sheet, same 20px square tick boxes, same
All / None / Done header. For ~170 scheme entries: group by chapter rather
than strand, make groups collapsible, add a filter field, show the tick date
beside a ticked row, allow drag-and-drop reordering, export and import JSON.

Entries with `status: "todo"` would show but be visibly inert, making the
panel the build backlog as well as the progress record.

### 2.2 Classes — `/classes`

Create, rename, delete. Set scheme and difficulty band. Each class carries its
own ticks, so two classes on the same scheme sit at different points in it and
get genuinely different boards. A class selector would sit in the header.

### 2.3 Design guidance for new screens

Build them from the board's parts: 2px ink rules for structure,
label-above-value segments, uppercase eyebrows, square buttons with hairline
borders, vermilion reserved for the one primary action per screen. The topic
panel is the closest existing pattern — a right-hand sheet, 2px left border,
header row with All / None / Done, grouped rows of toggle buttons with a 20px
square tick box.

---

## 3. Smaller parked ideas

- **Topic picker on ⇄.** Click stays a fast random swap; long press or
  right-click would open a picker for when the teacher wants a specific
  topic.
- **Per-question difficulty**, replacing the board-wide Mixed setting
  (`CLAUDE.md` calls Mixed provisional).
- **Calculator / non-calculator filtering.** The catalogue may carry the tag;
  nothing filters on it and there is no UI.
- **Porting more from `maths-teaching-app`.** Not yet ported:
  `quadraticSimultaneousGenerator.js` (extension material),
  `pythagoras3DGenerators.js` (needs a 3D figure),
  `stackedTriangleGenerators.js` (scope unclear). See the porting notes in
  `CLAUDE.md`.
