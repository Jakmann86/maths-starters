# Migration from `maths-teaching-app`

Fresh repo. Files are copied across one at a time and normalised on arrival.
Nothing is bulk-moved.

## What comes across

### Generators — `src/generators/`

| Source file | Skills it should yield | Notes |
|---|---|---|
| `algebra/expressionsGenerator.js` | expanding single / double / triple brackets | Already close to standard shape |
| `algebra/equationGenerators.js` | linear equations, x both sides, think-of-a-number | |
| `algebra/indicesGenerator.js` | negative & fractional indices, numeric and algebraic | Has a working `difficulty` param |
| `algebra/factorisingQuadraticsGenerator.js` | simple quadratics, difference of two squares | Best existing example of the standard shape — use as the reference |
| `algebra/recurringDecimalsGenerator.js` | 1/2/3-digit recurring | Emits full `metadata` already |
| `geometry/pythagorasGenerators.js` | hypotenuse, missing side, isosceles area/height | |
| `geometry/pythagoras3DGenerators.js` | 3D diagonals | Needs `Cuboid3D`; migrate late |
| `geometry/sohcahtoaGenerators.js` | find side, find angle, trig calculator | **See known issues** |
| `puzzles/symbolPuzzleGenerators.js` | emoji symbol puzzles | Retrieval pool |
| `puzzles/magicSquareGenerators.js` | magic squares with negatives | Retrieval pool |
| `core/baseGenerators.js` | — | Utilities; port `difficultyConfig` and the random helpers |

### Components — `src/components/`

- `common/MathDisplay.jsx`
- `common/Timer.jsx`
- `math/shapes/triangles/RightTriangle.jsx`
- `math/visualizations/RightTriangleSVG.jsx`, `SquareSVG.jsx`
- `math/puzzles/SymbolPuzzleDisplay.jsx`, `MagicSquareDisplay.jsx`
- `math/shapes/Cuboid3D.jsx` (only if 3D Pythagoras is wanted)

Take the layout and answer-reveal *logic* from `StarterSectionBase.jsx`, but
rewrite rather than copy — the existing component carries four format-detection
branches that this repo doesn't need.

### Data

- The IGCSE scheme of work document becomes `schemes/igcse-higher.json`.

## What does not come across

`ExamplesSectionBase`, `DiagnosticSectionBase`, `ChallengeSection`, all
`LearnSection` files, `LessonContentProvider.jsx`, `curriculum.js`, the entire
`src/worksheets/` tree (PDF generation, jsPDF), `angleMarkers.js`, JSXGraph and
every component depending on it, `indicesExamplesGenerator.js` (stepped
solutions are an Examples concern).

## Known issues to fix during migration

These are real defects in the source repo. Fix them on arrival; do not
reproduce them.

1. **`generateFindMissingAngleTrig` does not exist.** Several StarterSection
   files call it on `sohcahtoaGenerators`. Find the actual export name, or
   write the generator. This is the outstanding SOHCAHTOA bug.

2. **Two competing question formats.** Older generators return
   `{ question, answer }` with `question` sometimes a string, sometimes LaTeX,
   sometimes a React element. Newer ones return
   `{ instruction, questionMath, answer, workingOut, metadata }`. Normalise
   everything to the second. `factorisingQuadraticsGenerator.js` is the model.

3. **JSX leaking into generator wrappers.** The lesson-level StarterSection
   files wrap generator output and inject `<RightTriangle {...viz} />`. In the
   new repo, generators return the config object and a single
   `<Visualisation config={...} />` component does the `type` → component
   mapping. No JSX above the renderer.

4. **Inconsistent file naming.** `magicSquareGenerator.js` and
   `magicSquareGenerators.js` are both imported in different files —
   at least one import is broken. Settle on plural for all generator
   filenames.

5. **`difficulty` is honoured inconsistently.** Some generators accept and use
   it, some accept and ignore it, some don't take it. Every migrated generator
   must either genuinely vary output across its declared bands, or declare
   fewer bands in the catalogue. Do not declare a band you don't support.

6. **`sectionType: 'starter'` is passed everywhere and mostly unused.** Drop
   the parameter — this repo has one section type.

## Per-generator checklist

For each generator moved, in order:

- [ ] Copy the file, remove React imports if any
- [ ] Normalise the return to the shape in `SPEC.md` §3
- [ ] Convert any JSX visualisation to a config object
- [ ] Add or complete `metadata` (`topic`, `difficulty`)
- [ ] Verify it varies meaningfully across each declared difficulty band,
      named `foundation` / `core` / `stretch`
- [ ] Register the skill(s) in `src/curriculum/skills.js`
- [ ] Check every LaTeX string against the Archivo parser. Anything that
      falls back to KaTeX should do so deliberately — if a `\frac` is nested
      only because of how the string was built, flatten it instead
- [ ] Render it in a slot at Foundation and at Stretch, and check it fits
      without overflow both before and after the answer is revealed
- [ ] Add its skill ids to the matching entry in `haese-igcse.json` and flip
      that entry's `status` from `todo` to `ready`

## Suggested migration order

Start with Week 1–5 content, since that's what a class needs first and it
exercises the widest variety of visualisation types:

1. `factorisingQuadraticsGenerator` — reference implementation, no visuals
2. `expressionsGenerator` — no visuals, high volume
3. `equationGenerators` — no visuals
4. `pythagorasGenerators` — introduces `RightTriangle` config mapping
5. `sohcahtoaGenerators` — fix the missing-angle bug here
6. `symbolPuzzleGenerators` + `magicSquareGenerators` — fills the Last Year
   pool, which the fallback chain depends on
7. `indicesGenerator`
8. `recurringDecimalsGenerator`
9. `pythagoras3DGenerators` — last, most complex visualisation

After step 6 the app is usable for a real lesson.
