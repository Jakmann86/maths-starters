# CLAUDE.md — Maths Starters

Read this before writing any code in this repo.

## What this is

A single-purpose React app: it generates a four-box maths starter for a UK
secondary classroom, displayed on an interactive whiteboard. Nothing else.

The four boxes follow a spaced-retrieval pattern:

| Box | Label       | Content                                          |
|-----|-------------|--------------------------------------------------|
| 1   | Last Lesson | The immediately preceding lesson                 |
| 2   | Last Week   | Anything from the preceding teaching week        |
| 3   | Last Topic  | Anything from the preceding unit                 |
| 4   | Last Year   | Puzzles and long-term retrieval                  |

Which skill lands in each box is **derived from the class's position in an
ordered scheme of work**, not hardcoded per lesson. See `SPEC.md`.

## What this is not

This is a deliberate reduction of a larger five-section teaching app. Do not
add Diagnostic, Learn, Examples or Challenge sections. Do not add PDF worksheet
generation, JSXGraph, user accounts, or a backend. If a feature request would
pull any of those back in, say so rather than building it.

## Non-negotiable conventions

### 1. Generators are pure functions returning data

A generator takes an options object and returns a plain data object. It must
never return JSX, never import React, and never read from React state.

```js
export const generateFindHypotenuse = (options = {}) => {
  const { difficulty = 'medium' } = options;
  // ...
  return {
    instruction: 'Find the length of the hypotenuse',
    questionMath: 'a = 3,\\ b = 4',
    answer: 'c = 5',
    answerUnits: 'cm',
    workingOut: 'c^2 = 3^2 + 4^2 = 25 \\\\ c = 5',
    visualization: { type: 'right-triangle', base: 3, height: 4, /* ... */ },
    metadata: { topic: 'pythagoras', difficulty, tags: ['geometry'] }
  };
};
```

`visualization` is a **config object**. The renderer maps `type` to a
component. The old app violated this in places by returning `<RightTriangle />`
from generator wrappers — do not carry that pattern over.

### 2. One question shape

Every generator returns the shape documented in `SPEC.md` §3. There is no
legacy format in this repo. If a generator being migrated returns
`{ question, answer }`, convert it during migration rather than adding a
compatibility branch to the renderer.

### 3. The scheme is data, the catalogue is code

- `src/curriculum/skills.js` — the skill catalogue. Holds generator function
  references. Code.
- `src/curriculum/schemes/*.json` — ordered lists of skill ids. Pure JSON,
  serialisable, user-editable, exportable. No functions, ever.

A scheme must survive `JSON.parse(JSON.stringify(scheme))` unchanged.

### 4. Styling is plain CSS with custom properties

No Tailwind, no CSS-in-JS, no utility framework. Slot and section colours are
passed down as a `--c` custom property on the element and referenced as
`var(--c)` in the stylesheet — that is how one stylesheet serves four
differently-coloured slots without four sets of rules.

Tokens live in `:root`. Never hardcode a hex value in a component.

### 5. LaTeX

All mathematical content goes through `MathDisplay` (KaTeX). Text mixed into a
maths expression must be wrapped in `\text{}`. Units belong in `answerUnits`,
not baked into the `answer` string.

## UK conventions

Maths (not math), brackets, indices, standard form, factorise, centre.
Metric units. IGCSE/GCSE grade descriptors.

## Interactive whiteboard constraints

- Everything fits one screen at 1920×1080. No vertical scrolling on the
  starter view, ever.
- Minimum touch target 44px. Assume a finger, not a mouse.
- Minimum body text 18px; question text larger.
- High contrast — these screens are viewed in daylight with the blinds open.

## Stack

React 18 + Vite, plain CSS with custom properties, KaTeX (dynamically
imported, fallback only), lodash, react-router for three routes.
**No Tailwind.** No other dependencies without asking.

## Working style

- Ask before inventing a convention. Consistency across generators matters
  more than any individual generator being clever.
- Migrate one generator at a time and verify it renders before starting the
  next. See `MIGRATION.md`.
- Prefer deleting code from the old app over porting it "just in case".
