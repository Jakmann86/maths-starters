# Design system — Maths Starters

The reference implementation is `reference/starter-board.html`.
Where this document and that file disagree, the file wins. This exists to
cover screens the mockup doesn't include (scheme editor, class management)
so they don't drift.

The direction is Modernist: flat, hard-edged, high contrast, no ornament.

## Tokens

```css
--ground:   #f3f2f2   /* page */
--surface:  #eae9e9   /* hover fill */
--ink:      #201e1d   /* text, rules, borders */
--ink-70:   #4a4746   /* instruction text */
--muted:    #605d5d   /* eyebrow labels, working, secondary */
--hairline: #d7d3d3   /* secondary button borders */

--slot-1: #ec3013                /* also the global accent */
--slot-2: oklch(0.45 0.115 250)
--slot-3: oklch(0.46 0.1 155)
--slot-4: oklch(0.52 0.11 68)
```

Slot 1's vermilion doubles as the accent for focus rings, the primary button,
and the expired-timer state. That overload is deliberate — do not introduce a
fifth colour to separate them.

## Rules

**Radius is zero.** `--radius-sm`, `-md` and `-lg` are all `0px`. Nothing in
this app has a rounded corner.

**No shadows, no gradients.** Structure comes from 2px `--ink` rules. The
design system defines shadow tokens; the board uses none of them. Keep it that
way.

**Two border weights.** 2px solid `--ink` for structure (grid gutters, header
divisions, primary buttons, the answer rule). 2px solid `--hairline` for
secondary controls. 1px `--hairline` for list separators inside the panel.

**Archivo only**, at three weights: 400 body, 600 semantic emphasis, 800
display. Question text, answers, eyebrow labels and primary buttons are all
800. Letter-spacing `-0.02em` on large display text, `+0.16em` to `+0.18em` on
uppercase eyebrow labels.

**Sentence case** everywhere except eyebrow labels, which are uppercase.

## Type sizing is computed, not scaled

Slots are `container-type: size`. Question and instruction sizes come from
`qSize()` and `iSize()`, which build a `clamp()` from line count and longest
line length using `cqh` / `cqi` units.

This is why the board never scrolls and never overflows at any resolution.
Do not replace it with a fixed type scale. When adding a new figure type or a
question shape with unusual dimensions, check it against those two functions
rather than hardcoding a size.

Fixed sizes that are safe: eyebrow 12px, topic name 14px, working 14px,
header labels 10px.

## Slot anatomy

Top to bottom, as a 4-row grid (`auto auto minmax(0,1fr) auto`):

1. A 10px full-bleed colour bar in the slot's hue.
2. Eyebrow (slot name, uppercase, slot hue) · topic name (muted) · spacer ·
   regenerate `↻` and swap `⇄` buttons, 34px, `--hairline` border.
3. Instruction, then figure and question side by side. The figure is
   `flex: 0 0 auto`; the question takes the rest.
4. The answer band — hidden at `opacity: 0` with no border and no padding;
   revealed at `opacity: 1` with a 2px `--ink` top rule. 180ms transition.
   Answer in the slot hue at 800; working beneath at 14px muted.

Figures shrink when the answer is showing (`30cqh` from `46cqh`) so the slot
never overflows on reveal.

## Header

A single row of segments divided by 2px `--ink` rules, each a label/value
pair. Left half: title, topics in play, difficulty stepper. Right half: timer,
new four, show answers, fullscreen.

Every segment is either a labelled value or a button that looks like one.
There is no toolbar iconography apart from the fullscreen glyph.

## Maths rendering

A custom renderer, not KaTeX — so everything stays in Archivo. Current syntax:
`~f{num}{den}` fractions, `~r{x}` roots, `^{n}` powers, `\n` for line breaks.
Hyphens before digits or letters are rewritten to proper minus signs (U+2212).

**Planned change:** extend the parser to accept a LaTeX subset (`\frac{}{}`,
`\sqrt{}`, `^{}`, `_{}`, `\times`, `\div`, `\text{}`) so the existing
generators migrate without rewriting their output strings. Keep the Archivo
rendering; only the input grammar widens.

## Figures

Inline SVG, no library. 3px `--ink` strokes, square linecaps, round linejoins,
labels in Archivo 700 at 20px. The unknown side is labelled in the slot hue;
everything else in ink. Currently: right triangle, circle, trapezium, regular
polygon.

`magic-square` is a grid, not a shape, and does not shrink on answer reveal
(unlike the other figures) — the grid is what has to be read after the
reveal.

New figures follow the same construction — a `figNode` branch returning
`svg([...], w, h, key, big, shown)`. Never introduce a charting or geometry
library for these.

## Interaction

Space toggles answers. `r` regenerates all four. Both ignored while an input
has focus. Controls are 34px minimum; on touch panels the slot buttons should
be permanently visible rather than hover-revealed.

## Extending to new screens

The scheme editor and class management don't exist in the mockup. Build them
from the same parts: 2px ink rules for structure, label-above-value segments,
uppercase eyebrows, square buttons with hairline borders, vermilion reserved
for the one primary action per screen.

The topic panel is the closest existing pattern — a right-hand sheet, 2px left
border, header row with All / None / Done, then grouped rows of toggle buttons
with a 20px square tick box. At 172 scheme entries that panel needs collapsible
groups and a filter field; the row and tick styling carries over unchanged.
