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
--ink-instr: #2e2b2a  /* instruction text: dark enough to read on a
                        whiteboard in daylight */
--muted:    #605d5d   /* eyebrow labels, secondary */
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

**Archivo for the interface, KaTeX's serif for the maths.** Archivo at three
weights: 400 body and instructions, 600 semantic emphasis, 800 display
(eyebrow labels, primary buttons, the timer). Questions, answers and figure
labels are set in KaTeX_Main at regular weight, with variables in KaTeX_Math
italic: heavy Archivo closed up 6, 8 and 9 from the back of the room.
Letter-spacing `-0.02em` on large display text, `+0.16em` to `+0.18em` on
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

Fixed sizes that are safe: eyebrow 12px, topic name 14px, header labels
10px.

## Slot anatomy

Top to bottom, as a 4-row grid (`auto auto minmax(0,1fr) auto`):

1. A 10px full-bleed colour bar in the slot's hue.
2. Eyebrow (slot name, uppercase, slot hue) · topic name (muted) · spacer ·
   new numbers `#`, next skill `↻` and swap topic `⇄` buttons, 34px,
   `--hairline` border.
3. Instruction, then figure and question side by side. The figure is
   `flex: 0 0 auto`; the question takes the rest.
4. The answer band — hidden at `opacity: 0` with no border, no padding and
   `max-height: 0`, so a hidden answer holds back no space from the figure;
   revealed at `opacity: 1` with a 2px `--ink` top rule. 180ms transition.
   Answer in the slot hue at 800. Working is not shown on the board.

Figures shrink when the answer is showing (`30cqh` from `46cqh`) so the slot
never overflows on reveal.

## Header

A single row of segments divided by 2px `--ink` rules, each a label/value
pair. Left half: title (a compact slot that will hold the Hexagon Maths logo),
topics in play, difficulty stepper. Right half: timer, new four, show answers,
print, fullscreen. The right half sizes to its controls and never wraps; the
left half takes the remaining width and the topics summary truncates.

Every segment is either a labelled value or a button that looks like one.
The only toolbar iconography is the two square 56px icon buttons at the right
end: print (an inline SVG printer in `currentColor`) and the fullscreen glyph.

## Maths rendering

KaTeX for every question and answer line — see SPEC.md §6. The instruction
above it stays in Archivo.

## Figures

Inline SVG, no library. 3px `--ink` strokes, square linecaps, round linejoins,
labels in KaTeX_Main 400 at 20px, a lone variable letter in KaTeX_Math
italic. The unknown side is labelled in the slot hue;
everything else in ink. Currently: right triangle, circle, trapezium, regular
polygon.

`magic-square` is a grid, not a shape, and does not shrink on answer reveal
(unlike the other figures) — the grid is what has to be read after the
reveal.
A `table` with a `solution` (cells left blank in `rows`, filled in the slot
hue on reveal) follows the same rule, for the same reason.

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
