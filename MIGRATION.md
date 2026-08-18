# Migration from `maths-teaching-app`

Fresh repo. Files are copied across one at a time and normalised on arrival.
Nothing is bulk-moved.

## What comes across

### Source location

The old project is the `hexagon-maths` repo, but the app sits in a subfolder:

```
hexagon-maths/maths-teaching-app/src/
```

All paths below are relative to that `src/`. Clone it alongside this repo and
copy files across by hand — do not add it as a remote, and keep Claude Code's
working directory as `maths-starters` only.

### Generators — `src/generators/`

26 files across six categories. Not all are wanted; the table marks what to
take.

| File | Take | Notes |
|---|---|---|
| `algebra/expressionsGenerator.js` | yes | expanding single / double / triple brackets |
| `algebra/equationGenerators.js` | yes | linear, x both sides, think-of-a-number |
| `algebra/factorisingQuadraticsGenerator.js` | yes | **migrate first** — reference implementation |
| `algebra/indicesGenerator.js` | yes | has a working difficulty param |
| `algebra/recurringDecimalsGenerator.js` | check | duplicate of `number/recurringDecimalGenerator.js` — compare, keep one |
| `algebra/simultaneousEquationsGenerator.js` | yes | Haese 7E |
| `algebra/quadraticSimultaneousGenerator.js` | later | extension material |
| `algebra/quadraticGenerator.js` | yes | Haese 21A–C |
| `algebra/inequalitiesGenerator.js` | yes | Haese 3F–G |
| `algebra/rearrangingFormulaeGenerator.js` | check | duplicate of `formulaRearrangementGenerator.js` |
| `algebra/formulaRearrangementGenerator.js` | check | as above — compare, keep one |
| `algebra/indicesExamplesGenerator.js` | no | stepped solutions are an Examples concern |
| `geometry/pythagorasGenerators.js` | yes | hypotenuse, missing side, isosceles |
| `geometry/pythagoras3DGenerators.js` | later | needs Cuboid3D; most complex figure |
| `geometry/sohcahtoaGenerators.js` | yes | **has the missing-angle bug — see below** |
| `geometry/angleFactsGenerator.js` | yes | Haese 4A |
| `geometry/triangleGenerators.js` | yes | Haese 4B–C |
| `geometry/squareGenerators.js` | check | may overlap area/mensuration |
| `geometry/stackedTriangleGenerators.js` | later | unclear scope; inspect before porting |
| `number/lcmGenerator.js` | yes | Haese assumed knowledge |
| `number/recurringDecimalGenerator.js` | check | see algebra duplicate above |
| `puzzles/symbolPuzzleGenerators.js` | yes | retrieval pool |
| `puzzles/symbolThemes.js` | yes | supports the above |
| `puzzles/magicSquareGenerators.js` | yes | retrieval pool |
| `puzzles/magicSquareGenerator.js` | check | singular duplicate — likely dead |
| `puzzles/numberPuzzles.js` | yes | retrieval pool |
| `statistics/averageGenerators.js` | yes | Haese 13C |
| `core/baseGenerators.js` | partial | port `difficultyConfig` and the random helpers only |

Four `check` rows are duplicate pairs. Diff each pair before porting; at least
one of each is probably dead or broken. Resolve by keeping the better
implementation and deleting the other — do not port both.

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

- The IGCSE scheme of work document becomes `schemes/haese-igcse.json`.

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

Migrate what the first half-term needs, and what fills the retrieval pool.
Everything else can wait.

1. `factorisingQuadraticsGenerator` — reference implementation, no figure
2. `expressionsGenerator` — no figure, high volume
3. `equationGenerators` — no figure
4. `pythagorasGenerators` — first figure config mapping
5. `sohcahtoaGenerators` — fix the missing-angle bug here
6. `symbolPuzzleGenerators` + `symbolThemes` + `magicSquareGenerators` +
   `numberPuzzles` — fills the Last year pool, which the fallback chain in
   `SPEC.md` §4.2 depends on. Do not leave this until late.
7. `indicesGenerator`
8. `angleFactsGenerator`, `triangleGenerators`
9. `recurringDecimal*` (after resolving the duplicate)
10. `simultaneousEquationsGenerator`, `inequalitiesGenerator`
11. `averageGenerators`, `lcmGenerator`
12. `quadraticGenerator`
13. `pythagoras3DGenerators` — last, most complex figure

After step 6 the app works for a real lesson. Steps 7 onward widen coverage.