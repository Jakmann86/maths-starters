# Maths Starters — Specification

What the app does, as built. `CLAUDE.md` is the authority on conventions and
wins any conflict; this file goes into the detail. Designs that were written
for an earlier model of the app (class records, ticks, recency labels,
`resolveSlots`, shuffle, a scheme editor) now live in `FUTURE.md` and are not
part of the app.

Section numbers §3, §6 and §7.4 are referenced from code comments. Keep them
stable.

## 1. What it does

Generates four maths questions for the start of a lesson, on a classroom
board. The teacher chooses a **pool of topics** in the topic panel
("Pythagoras and trigonometry", "Volume", ...). Each of the four boxes draws
a topic at random from the pool and asks a question from that topic's first
skill.

The topic is the teacher's unit of choice, not the skill: there are about 35
topics against about 150 skills, and a teacher thinks "we did Pythagoras this
week", not "we did find-the-hypotenuse".

## 2. Data model

### 2.1 Skill catalogue — `src/curriculum/skills.js`

Maps skill ids to generator functions. Code, not data.

```js
export const skills = {
  'pythagoras-hypotenuse': {
    label: 'Pythagoras: find the hypotenuse',
    topic: 'Pythagoras and trigonometry',
    generate: (opts) => pythagoras.generatePythagorasHypotenuse(opts),
    difficulties: ['foundation', 'core', 'stretch'],
  },
};
```

- `topic` groups skills. Skills sharing a topic must be interchangeable within
  a lesson, and their order in the file is the order ↻ cycles through.
- `difficulties` lists only the bands the generator genuinely varies across.
- `STRANDS` sets the topic panel's display order (Number, Algebra, Geometry,
  Mensuration, Statistics and probability, Problem solving), deliberately
  separate from file order. A topic missing from `STRANDS` lands in "Other".
- `generateForSkill(id, band)` is the board's single entry point. It returns
  `null` for an unknown id rather than throwing.

### 2.2 Scheme backlog — `src/curriculum/schemes/haese-igcse.json`

**Not imported by the running app.** An ordered list of Haese textbook
sections, each with the skill ids it needs and a `status`:

```json
{ "id": "8A", "ch": 8, "unit": "The theorem of Pythagoras",
  "lesson": "Pythagoras' theorem", "page": 170,
  "skills": ["pythagoras-hypotenuse", "pythagoras-missing-side"],
  "status": "ready" }
```

`status` is `ready` (generators exist), `todo` (startable, generator needed)
or `skip` (not reducible to a starter question). It is the build backlog and
nothing more. Pure JSON — it must survive `JSON.parse(JSON.stringify(x))`
(guarded by `schemes.test.js`).

It drifts from `skills.js`: ids that no longer exist, `todo` entries whose
generators are written, `todo` entries with an empty `skills` list. Report
drift; don't read it as a missing generator.

### 2.3 Topic pool — `src/curriculum/topicPool.js`

The teacher's selection: an array of topic names in localStorage under
`maths-starters:topic-pool`. An empty pool draws from every topic, so the
board is never blank. `RENAMED` maps retired topic names to their successors,
so a pool saved before a rename still loads.

## 3. Question shape

Generators return this. The board adapts to it (`src/lib/questionView.js`) —
do not change generator output to match the board's internal field names.

**Any number a student needs goes in the question, not the instruction**
(`DESIGN.md` "Instruction or question").

```js
{
  instruction: 'Factorise',            // plain text, imperative
  questionMath: 'x^2 + 7x + 12',       // LaTeX, no delimiters
  questionText: undefined,             // instead of questionMath, for prose
  questionParts: undefined,            // ['(a) the mean', '(b) the mode'] —
                                        // the parts of a multi-part question,
                                        // listed beside the figure in the
                                        // instruction's regular type
  questionMathCompact: undefined,      // true → cap questionMath's size
                                        // (the "given" line of a reverse
                                        // question, e.g. "Volume = 1030 cm^3",
                                        // names the given, not the answer, so
                                        // it shouldn't outsize it, but keeps
                                        // the same floor as any question)
  answer: '(x + 3)(x + 4)',
  answerUnits: undefined,              // 'cm' or '\\text{cm}^3' — never baked
                                        // into answer
  workingOut: '\\text{pair multiplying to } 12',
  visualization: { type: 'right-triangle', a: '3 cm', b: '4 cm', c: 'x' },
  metadata: { topic: 'factorising-quadratics', difficulty: 'core' }
}
```

`visualization` is a config object. `Figure.jsx` maps `type` to an SVG
branch. Generators never return JSX.

`workingOut` is not shown on the board. Generators still return it, and the
verification tests read it.

Multi-line questions separate lines with a real newline character (`NL`,
`'\n'` in JavaScript source), never the two characters backslash and n.

## 4. Difficulty

One band for the whole board, set by the header stepper: Foundation, Core,
Stretch, or Mixed. Mixed ramps the boxes in reading order — Foundation, Core,
Core, Stretch — fixed rather than random, so "box 4 is the stretch" is always
true. Mixed is provisional (`CLAUDE.md`). The board opens on Core.

If a skill doesn't declare the band asked for, `nearestBand` gives the closest
it does: Stretch → Core → Foundation, Core → Foundation → Stretch,
Foundation → Core → Stretch. It steps down before up, so a Stretch board never
shows an easier question than a Core one.

Changing the band gives every box fresh numbers at the new band, keeps each
box's topic and skill, and hides the answers.

## 5. Board actions

| Control | Action |
|---|---|
| New questions (header), `r` | Four fresh topics from the pool, each on its first skill |
| `#` on a box | Same skill, fresh numbers |
| `↻` on a box | Next skill in the topic, in catalogue order, cycling back to the first |
| `⇄` on a box | A different topic from the pool, on its first skill |
| Show answers, Space | Toggle all four answers |

The draw takes four different topics when the pool has at least four, and
allows repeats below that. `⇄` prefers a topic not already on the board.
Space and `r` are ignored while an input has focus.

Always opening a topic on its first skill is deliberate: a long topic takes
several presses of ↻ to reach its later skills, which is the price of the
teacher choosing topics rather than skills.

### 5.1 When a question fails

The board is in front of a class, so one broken question never blanks it.

- **A generator that throws** is tried again (three tries in all, since
  most throws are one unlucky random draw). If every try throws, that box
  keeps its eyebrow and buttons and says "This question didn't load. Press
  # for another." (`src/lib/safeGenerate.js`). Each failure is logged to the
  console with its skill and band.
- **A question that throws while drawing** (a figure config or KaTeX string
  the renderer cannot handle) is caught by an error boundary around that
  box's content and shows the same note. A new question in the box tries
  again (`src/components/ErrorBoundary.jsx`, `Slot.jsx`).
- **The print screen** leaves out a question whose generator throws, and
  if the screen itself fails to draw it offers a way back to the board.
- **Anything else** (the header, the topic panel) falls back to a page
  with a Reload button rather than a blank screen (`App.jsx`).

## 6. Maths rendering

**Every question and answer line renders in KaTeX** (`MathDisplay.jsx`), in
every topic. The instruction stays in Archivo at regular weight; the maths
beneath it — expressions, lists, answers — is set in KaTeX's serif, and a
worded `questionText` in the same serif at regular weight (`.mprose`), at a
fixed size a step above the instruction (`pSize` in `typeSizing.js`).

Earlier versions ran a custom Archivo parser first and fell back to KaTeX for
roots, exponents and anything else it could not take, then moved whole topics
onto KaTeX because the board switched typeface from box to box. The remaining
Archivo 800 was hard to read from the back of the room, so the parser is gone
and KaTeX takes every line.

Generator strings are ordinary LaTeX. Two things KaTeX does that a plain
reading would not expect:

- A comma is punctuation, followed by a thin space. Money and population
  answers wrap in `\text{}` (`\text{£1,450}`) so the thousands comma does not
  open a gap.
- A character KaTeX has no metrics for (●, a literal `²` inside `\text{}`)
  renders in a fallback font and logs a console warning. Use KaTeX's own
  commands (`\bigstar`, `\blacktriangle`, `\blacksquare`) and LaTeX
  exponents (`\text{cm}^2`). Treat any KaTeX console warning as a generator
  bug.

KaTeX is its own chunk, but the board preloads it (and warms its main,
maths-italic and delimiter fonts) on mount, so once it has arrived each line
renders synchronously rather than flashing its source first
(`src/lib/katexLoader.js`).

Figure labels are not part of this: they are plain SVG text (`CLAUDE.md` §6),
set in KaTeX_Main at regular weight to match, with a lone variable letter in
KaTeX_Math italic and a degree sign drawn as a raised ∘ (`labelRuns` in
`Figure.jsx`).

## 7. Screens

### 7.1 Board — `/`

Header, then a 2×2 grid of boxes. Container-query type sizing (`DESIGN.md`),
per-box `#` `↻` `⇄`, countdown timer (opens at 5:00), show answers, print,
fullscreen. See §5 for the actions.

### 7.2 Topic panel

A right-hand sheet opened from the header's topics segment. Topics grouped by
strand (§2.1), each a toggle row with a 20px square tick box; All / Clear /
Done in its header. Each tap saves the pool (§2.3) and the panel stays open,
so several topics can be toggled in one visit. Done draws a fresh four if the
selection changed.

### 7.3 Dev pages

Not shipped to teachers. `math-test.html` renders a fixed list of LaTeX cases
(fractions, roots, degrees, ...) so KaTeX output and warnings can be checked in
one place. `print-test.html` draws every skill
at every band in both print layouts, so overflow is measured rather than
spotted.

### 7.4 Print — over the board

The header's Print button opens a print screen over the board. It prints
what the board holds: each box's skill at that box's band (so Mixed carries
over), with fresh numbers. Nothing is chosen afresh.

| Sheet | Layout | Questions |
|---|---|---|
| Exit ticket | two sheets per A4, cut apart | one per box |
| Practice | one sheet per A4 | two per box |
| Homework | one sheet per A4, with a date line | three per box, over two pages |

- **Versions**: 1–5. Every version has the same skills in the same order,
  with its own numbers, and is lettered A–E on the sheet. With one version an
  exit-ticket page prints the same sheet twice; with more, each half is a
  different version, and an odd count finishes on A.
- **Answers**: printed in place, in the first slot colour, with figure
  solutions filled — a teacher copy is the same sheet with its answers.
- It prints through the browser (`window.print()`), so Save as PDF comes for
  free. No PDF library.

On paper each question is a fixed cell. A question too big for its cell is
shrunk, text and figure together, in 5% steps to no less than 65%.

## 8. Persistence

Only the topic pool persists (§2.3). The board itself is not cached: a
refresh draws a fresh board. A per-day board cache is described in
`FUTURE.md` §1.4 and is not built.

## 9. Out of scope

Accounts, a backend, sharing between teachers, student-facing mode, answer
capture, analytics, a PDF library or worksheet engine, and the four other
lesson sections from the original app. Printing the board through the
browser is in scope (§7.4).

Calculator / non-calculator filtering is deferred — see `FUTURE.md` §3.
