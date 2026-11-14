# Difficulty calibration

Foundation / Core / Stretch bands derived from how the textbooks actually
escalate within an exercise, not from guesswork.

Sources: Haese *International Mathematics for the Middle Years* (IGCSE 0607)
and Rayner *Complete International Mathematics for Cambridge IGCSE*.

Read this before writing any generator. Difficulty means a change in the
**shape** of the question, never a bigger number.

The example questions and answers below are quoted from the textbooks to show
how each exercise escalates. They are calibration evidence, not material:
never use one of these values in a generator (`CLAUDE.md`, Working style).

---

## Two findings that override existing assumptions

### 1. Pythagoras answers are irrational, not triples

The old project's guidelines said to use Pythagorean triples for clean answers.
Haese does not. Its worked examples are 3 and 2 giving √13 ≈ 3.61, and 6 and 5
giving √11 ≈ 3.32. Exercise 8A.1 asks for answers correct to 3 significant
figures throughout, and 8A.1 Q3–Q4 ask for answers in **simplest surd form**.

Triples appear in Haese only in 8A.2, and as a *recognition* task in their own
right: "determine whether {8, 15, 17} is a Pythagorean triple", "find k if
{8, 15, k} is a triple". That is a different skill from finding a missing side.

Rayner Ex 7.4 does open with 6-8-10, but Q2 onward is 8 and 9, 9 and 9 — again
irrational.

**Consequence:** the Pythagoras generator should produce irrational answers by
default and expect a calculator. Triple recognition becomes a separate skill.
Do not constrain side lengths to triples for the sake of tidiness — it
misrepresents what 0607 asks for.

### 2. Linear equation answers are often fractional

Haese Example 4 gives x = −3¼, Example 6 gives x = −3½, Example 7 gives
x = 1⅓. Exercise 3A.2 Q3 includes 3x − 8 = 5x − 2 and x − 3 = 5x + 11, neither
of which is integral.

**Consequence:** forcing integer solutions is a Foundation-band constraint
only. Core and Stretch should allow fractions, which means the answer needs
LaTeX `\frac`, not a plain number.

---

## Expanding single brackets — Haese 1A

The exercise moves through four clear stages.

**Foundation** — Ex 1A Q1 a–h. One bracket, positive integer coefficient,
two terms inside.
`3(x + 1)`, `2(5 − x)`, `4(a + 2b)`, `5(x − y)`

**Core** — Ex 1A Q1 i–t and Q2. Negative coefficients, bare minus signs, and
variable coefficients. Then a bracket plus loose terms to collect.
`−2(x + 4)`, `−(3 − x)`, `x(x + 3)`, `2x(x − 5)`, `a(a + b)`
`13 − 4(x + 3)`, `4x − 3x(x − 1)`, `7x² − 5x(x + 2)`

**Stretch** — Ex 1A Q3. Two brackets, both expanded, then collected. At least
one with a variable coefficient or a leading minus.
`2(y − 3) − 4(2y + 1)`, `x(x + 4) − 2(x − 3)`, `−4(x − 2) − (3 − x)`,
`4x(x − 3) − 2x(5 − x)`, `x(x + y) − y(x + y)`

Note Haese's sidebar warning: the minus sign in front of `2x` affects **both**
terms inside the bracket. Sign errors are the intended difficulty at Core, so
generate negatives deliberately rather than by accident.

## Expanding double brackets — Haese 1B

**Foundation** — Ex 1B Q2 a–e. Monic, x first in both brackets, at most one
negative.
`(x + 3)(x + 7)`, `(x + 5)(x − 4)`, `(x − 8)(x + 3)`

**Core** — Ex 1B Q2 f–l. Non-monic, and brackets written with the constant
first.
`(2x + 1)(3x + 4)`, `(1 − 2x)(4x + 1)`, `(4 − x)(2x + 3)`, `(5 − 3x)(5 + x)`

**Stretch** — Ex 1B Q4 and Q3 f. Squares of binomials, and two variables.
`(3x − 2)²`, `(1 − 3x)²`, `(3 − 4x)²`, `(5x − y)²`, `(4 + 3a)(4 − 3a)`

## Difference of two squares — Haese 1C

Worth a separate skill from general double-bracket expansion, because Haese
teaches it as a pattern to recognise rather than a product to multiply out.

**Foundation** — Ex 1C Q1. `(a + b)(a − b)` with a single letter and an
integer, in either order.
`(x + 2)(x − 2)`, `(2 − x)(2 + x)`, `(c + 8)(c − 8)`

**Core** — Ex 1C Q2. Coefficient on the variable.
`(2x − 1)(2x + 1)`, `(4y − 5)(4y + 5)`, `(1 − 3x)(1 + 3x)`

**Stretch** — Ex 1C Q3. Two variables.
`(4x + 5y)(4x − 5y)`, `(7x − 2y)(7x + 2y)`
The numerical application (Ex 1C Q4, `43 × 37 = 40² − 3²`) had its own skill
and was removed in the skill-ladder review: a one-off trick, and not on the
GCSE.

## Further algebra — Haese 1E, 1I, 1M, 7D, 16C–D

Bands set from how Haese escalates; not yet reviewed in class.

**Further expansion** — Haese 1E. Foundation: a monic bracket times a
quadratic, `(x + a)(x² + bx + c)`. Core: three monic brackets, or
`(x + a)³`. Stretch: coefficients — a cube of `(px + q)`, a linear times a
quadratic, or three brackets. Answers in descending powers.

**Perfect squares** — Haese 1I. Foundation: `x² ± 2ax + a²`, in a mix of
letters. Core: a coefficient, `(px + q)²`. Stretch: a common factor first,
`k(px + q)²`, including a negative k.

**Factorising fully** — Haese 1M. Foundation: a common factor, then the
difference of two squares. Core: a number or x out first, then a monic
quadratic. Stretch: a negative first term with monic brackets, or a common
factor then a non-monic quadratic.

**Harder rearranging** — Haese 7D. Foundation: the subject under a square
or a square root (`y = ax² + b`, `y = a√x`, `y = √(x/a)`). Core: the
subject in a denominator (`y = a/(x + b)`, `y = a/x + b`). Stretch: the
subject appears twice, so it has to be collected and factorised
(`y = (x + a)/(x − b)`, `ax + b = cxy`).

**Adding and subtracting algebraic fractions** — Haese 16C–D. Foundation:
single terms over number denominators. Core: binomial numerators over
number denominators, subtraction needing the bracket. Stretch: letters in
the denominator, `p/(x + a) ± q/(x + b)` or `p/x ± q/(x + b)`, the
denominator left in factors. Answers in lowest terms, a negative leading
numerator taken out in front.

## Skill-ladder review: algebra

Changes Joakim decided in the November 2026 skill-ladder review (rows marked
"Use Claude's ladder" or "Use my ladder"). Rows still "To decide" were left
alone.

- **Difference of two squares: mental arithmetic** removed: a one-off trick,
  and not on the GCSE.
- **Factorising by grouping**, Stretch: a third kind with letters only,
  `ax + bn + an + bx`, shuffled so that half the time the printed pairs
  share nothing and must be regrouped first.
- **Factorising x² + bx + c**, Stretch: a common number factor first (now
  and then negative), then the monic quadratic.
- **Algebraic fractions (16B)** split into Multiplying and Dividing, each
  F single terms (no indices), C indices, S a quadratic to factorise (a
  difference of two squares or a trinomial) cancelling across.
- **Arithmetic sequences: use the nth term**: F the first five terms; C one
  far term; S which term has a value, or the rule from two terms some way
  apart.
- **Formula substitution**: sixteen real formulae, not three. F substitute
  forward; C substitute then solve for the letter left; S rearrange first
  (a square or a root to undo), then substitute, to 3 s.f.
- **Formula rearrangement**: Solve for x has gone (it is an equation; see
  Equations, unknown on both sides). F `ax + by = c`; C a negative y
  coefficient, the answer tidied (`(4x − 20)/3`, never over a negative);
  S the subject in a denominator or under a root.
- **Simultaneous equations** split by method. Substitution: F `y = …` with
  another `y = …` or `x + y = k`; C into `ax + by = k`; S neither in `y =`
  form, one rearranged first. Elimination: F the y coefficients already
  match; C multiply one equation; S multiply both.
- **Index laws** split by law. Multiplying and dividing: F a number base,
  evaluated; C a letter, one law; S three or four terms. A power of a power:
  F `(t⁸)²`; C `(4a³)²`; S two letters or a fraction inside.
- **Fractional powers** evaluate in every band: F a unit fraction
  (`8^(1/3)`); C a numerator or a negative (`32^(3/5)`, `16^(−3/4)`); S a
  coefficient and a letter (`(27x⁶/8)^(−2/3)`). Writing a root as a power
  is now its own skill: F `∛(p²)`; C a perfect power under the root
  (`∛(8x²)`); S the reciprocal of a root, sometimes with a number on top.

## Solving linear equations — Haese 3A

Five stages across 3A.1 and 3A.2.

**Foundation** — Ex 3A.1 Q1. Positive coefficient, one or two steps, integer
answer.
`5x + 3 = 28`, `3x − 9 = 18`, `4x − 5 = −17`, `14 = 3x + 5`

**Core** — Ex 3A.1 Q2–Q3 and 3A.2 Q1. Negative coefficient, unknown on the
right, a single fraction, or one bracket to expand. Answers may be fractional.
`3 − 2x = 11`, `15 = 3 − 2x`, `x/2 + 3 = −5`, `(x − 1)/3 = 6`,
`3(x − 2) − x = 12`

**Stretch** — Ex 3A.2 Q3–Q5. Unknown on both sides, two brackets, or both.
`5x + 2 = 3x + 14`, `x − 3 = 5x + 11`, `9 − 2x = 3 − x`,
`3(x + 2) + 2(x + 4) = −1`, `8 − (2 − x) = 2x`, `3(2x − 4) = 5x − (12 − x)`

Haese's own summary gives the method order: expand brackets, collect like
terms, remove the unknown from one side aiming to leave a positive
coefficient, then inverse operations. The `workingOut` string should follow
that sequence.

## Pythagoras — Haese 8A, 8C, 8E and Rayner 7.4

**Foundation** — Haese 8A.1 Q1–Q2, Rayner 7.4 Q1–Q4. Two sides given
numerically, find the third. Answer to 3 s.f. Both cases must appear: finding
the hypotenuse, and finding a leg.
Legs 4 and 7 → 8.06 cm. Hypotenuse 11, leg 6 → 9.22 cm.

**Core** — Haese 8A.1 Q3, 8C Q1–Q6, Rayner 7.4 Q11–Q13. Either an answer in
simplest surd form, or a named figure where the right angle has to be found
first.
`√2` and `√7` as given sides → answer `3`
Rectangle 8 cm by 3 cm, find the diagonal
Rhombus with diagonals 8 cm and 10 cm, find the side (diagonals bisect at
right angles)
Equilateral triangle side 12 cm, find the altitude

**Stretch** — Haese 8A.1 Q4, Q7–Q8, 8E; Rayner 7.4 Q8–Q10, 7.6 Q2–Q4.
Algebraic sides requiring an equation, two-stage problems where one triangle
feeds another, or three dimensions.
`(2x)² = x² + 6²` → `x = 2√3`
Legs `x` and `x + 8`, hypotenuse 12
Rayner Q10: legs `(x + 3)` and hypotenuse 25 with `4(x + 2)`
Cuboid 12 by 5 by 4, find the space diagonal
Two-stage: find the shared side of triangle ABC, then use it in ACD

Keep the intermediate value in surd form through a two-stage question. Haese
says this explicitly — rounding the middle step loses accuracy in the final
answer. The `workingOut` string should model that.

**Separate skill: triple recognition** — Haese 8A.2.
Foundation: is {8, 15, 17} a triple? Core: find k if {k, 24, 26} is a triple.

## Angle facts — Rayner 7.1

The cleanest three-band structure of any exercise here.

**Foundation** — Ex 7.1 Q1–Q6. One fact, one step, all values numeric.
Angles on a straight line, at a point, vertically opposite, angle sum of a
triangle or quadrilateral.
`25° + a + 60° = 180°`

**Core** — Ex 7.1 Q7–Q12. Angles expressed as multiples of a single unknown,
so an equation is formed and solved.
`a + 2a + 3a` on a straight line
`f = 2e` with `e + e + f + f` at a point
`a + b + c + d = 360°` with `b = 2a`, `c = 4a`, `d = 3a`

**Stretch** — Ex 7.1 Q13–Q27. Two or more facts chained, isosceles markings
carrying information, or a worded construction with no diagram.
Isosceles triangle inside a straight line with an exterior angle
"Calculate the largest angle of a triangle in which one angle is eight times
each of the others"
"In a rectangle KLMN, angle LNM = 34°. Calculate angle KLN"

The isosceles tick-mark convention is doing real work in Q17–Q19. If the
figure config can't express equal-side markings, those questions can't be
generated — worth checking the SVG figure props before starting.

## Angles in polygons — Rayner 7.2

**Foundation** — Ex 7.2 Q1, Q4, Q6. Regular polygon, find one interior or
exterior angle. Or one missing angle in an irregular polygon given the rest.

**Core** — Ex 7.2 Q7–Q9. The reverse direction: given the angle, find the
number of sides.
"A regular polygon has interior angles of 156°. How many sides?"
"A regular polygon has exterior angles of 40°. How many sides?"

**Stretch** — Ex 7.2 Q10–Q11, Q14, Q16. A relationship between interior and
exterior angle, or a missing-total problem.
"Each interior angle is 140° greater than each exterior angle. Find the number
of sides."
"Satheesh measured all the interior angles but missed one. His total was
1147°. What is the missing angle?"

That last one is an excellent starter question — one line, no figure, and it
forces the student to work out how many sides there must have been.

**Regular polygons meeting at a point** (interior Stretch, half of it, beyond
both books' exercises but a standard GCSE question): two regular polygons and
a polygon P meet at a point, or P shares a side with one, the angle left
between them marked. P's interior angle is what is left of 360°, then its
exterior angle, then n. Only seven sets of polygons close round a point with
a whole-number n; the marked gap is what gives the variety.

**As built** (after the skill-ladder review). Interior angles: F a regular
polygon, n given; C the angle given, find n; S an irregular polygon's
missing angle, drawn to its true angles, or regular polygons meeting at a
point (half each). Exterior angles: F n given; C the angle given, find n;
S an irregular polygon. A Core question has no figure, since a regular
polygon drawn would let the class count its sides.

## Functions — Haese 19A–F, 23B and Rayner 5.1–5.3

Both books mix two notations, `f(x) = 3x − 7` and `f : x ↦ 3x − 7`, and two
for composites: Haese writes `f(g(x))`, Rayner `fg(x)`. The generators mix
both, so a class meets each.

**Function notation** — Haese 19C, Rayner 5.1.
Foundation: evaluate a linear function, Haese 19C Q2 ("If f(x) = 5 − 4x,
find f(3)"). Core: a quadratic at a negative input (Haese Example 4,
`f(−5)` for `3x² − 4x`), or the reverse, "find x when f(x) = 1" (19C Q3).
Stretch: substitute an expression and simplify, Haese 19C Q8–Q9
(`f(a + 1)`, `f(−x)`, `f(2x)`); or Rayner 5.1 Q26, "f(1) = 8 and
f(4) = 17, find a and b".

**Domain and range** — Haese 19A–B, Rayner 5.1 Example 1. Haese's mapping
diagrams become a listed domain: "the domain {0, 1, 2, 3} and the function
'subtract 2', find the range". Core: an interval, Rayner's
`f(x) = 2x + 1, x > 0` gives `f(x) > 1`, and a decreasing function turns
the inequality round. Stretch: a quadratic whose turning point is inside
the domain, so one end of the range is the turning point and not an end
value.

**Composite functions** — Haese 19D, Rayner 5.1–5.2.
Foundation: a number, Haese 19D Q1 (`f(g(3))`). Core: in simplest form with
one function quadratic, Haese Example 6 (`f(g(x)) = (2x − 3)² + 1`).
Stretch: the reverse, Haese 19D Q8 ("find x when g(f(x)) = 17"), or Q11
("f(x) = ax + b and f(f(x)) = 4x − 15, find a and b"), which has two
answers; Haese's answer key gives both.

**Inverse functions** — Haese 23B, Rayner 5.2.
Foundation: two operations, Rayner 5.2 Q9–Q10 (`5x − 2`, `5(x − 2)`).
Core: three operations or a reversal (Rayner Example 4, `(5x − 2)/3`;
Q16, `7 − x`-type), or the inverse at a number. Stretch: x on top and
bottom, Rayner Q17; or where a function meets its inverse.

**The absolute value function** — Haese 19F, Rayner 5.3.
Foundation: evaluate, Haese Example 7 (`|a + b|` with a = −7, b = 3) and
19F.1 Q2 (`|2x + 3|` at x = −4). Core: Haese 19F.1 Q4, `|x + 1| = 3`,
`5 − |x| = 1`: two answers. Stretch goes past both books to `|px + q| =
mx + d`, where a candidate making the right side negative is rejected; it
is in Cambridge Additional Mathematics and is the step a strong 0607 class
is ready for.

**Reciprocal functions** — Haese 19E.
Foundation: the asymptotes of `k/(x − a)`, or k from a point on `y = k/x`
(19E Q3). Core: `k/(x − a) + b` (19E Q4c). Stretch: `(bx + c)/(x − a)`,
which has to be rewritten as `b + k/(x − a)` first; or k from the
asymptotes and a point.

## Quadratic graphs — Haese 21D–H

Bands set from how Haese escalates; not yet reviewed in class. A topic of
its own after Quadratic equations. Drawn graphs use `coordinate-grid` with
`curves`, so they are to scale: every intercept the question reads sits on a
gridline, and the window holds the intercepts and vertex, not always the
y-intercept.

**Substituting** — 21D. Foundation: monic, x positive. Core: a leading
coefficient, often negative, and x negative. Stretch: x from y, a quadratic
to solve, sometimes with one root.

**Vertex from turning point form** — 21E. Foundation: one shift,
`y = x² + k` or `y = (x − h)²`, either way up. Core: both shifts, a = ±1.
Stretch: a non-unit a, and the y-intercept too.

**Axes intercepts** — 21F. Foundation: x-intercepts from factorised form.
Core: from expanded monic, factorised first. Stretch: both axes from a
non-monic or negative-leading quadratic, sometimes with a fractional root.

**Line of symmetry and vertex** — 21G. Foundation: midway between the
x-intercepts, read off a drawn graph or from factorised form. Core:
`x = −b/2a`, the answer often a fraction. Stretch: the vertex.

**Finding a quadratic function** — 21H. Foundation: a = 1, from the
x-intercepts (given or drawn) or the vertex. Core: the vertex and the
y-intercept, in turning point form. Stretch: the vertex and another point,
or the x-intercepts and another point to expanded form.

## The sine and cosine rules — Haese 29B–F and Rayner 10

**Sine rule** — Haese 29C. Foundation: a side from its pair of angles.
Core: the angle sum first, or an angle. Stretch: the ambiguous case
(Example 6, 44.8° or 135.2°; Example 7 rejects the obtuse value because
KM < LM).

**Cosine rule** — Haese 29D. SAS for a side, then SSS for an angle, then
Rayner's "smallest angle of a triangle with sides 3x, 4x and 6x".

**Area, ½ab sin C** — Haese 29B. The area; the area given, find a side; the
area given, find the angle, which has two values.

**Mixed** — Haese 29E–F, Rayner 10.13. Bearings (Haese Example 10) and two
triangles sharing a side (Example 11, cosine rule then sine rule). Haese's
advice for a choice: use the cosine rule, since it has no ambiguous case.

## Similarity — Haese 18A, 18B, 18D and Rayner 7.4

**Similar shapes** — Haese 18A, Rayner Ex 7.8. Foundation: two shapes side
by side, a whole-number scale factor, x on the larger (Haese 18A Q2).
Core: a fractional scale factor, x on either, the second shape turned
round so the sides match by their angles (Rayner Ex 7.8 Q3-Q11). Stretch:
no figure, the shapes named in an order that is not the obvious one,
Haese 18A Q6 ("rectangles ABCD and FGHE are similar").

**Similar triangles** — Haese 18B, Rayner Ex 7.9. Foundation: the A shape
with whole sides given. Core: the parts AD and DB given, so AB comes first
(Haese Example 3), or the X shape (Rayner Ex 7.8 Q13, the trapezium's
diagonals). Stretch: x is the part of a side, so subtract at the end, or
the X shape with the whole line given. Haese 18C (shadows, ramps) is left
out, as the scheme marks it.

**Areas of similar shapes** — Haese 18D, Rayner Ex 7.11-7.12. Foundation:
k from two lengths, area times k squared (Haese Example 7). Core: areas
given, find a length (Rayner Example 6). Stretch: the trapezium left in
the A shape (Haese 18D Q3, Rayner Ex 7.12 Q5).

**Volumes of similar solids** — Haese 18D. Foundation: volume from
lengths (Haese Example 9). Core: volumes given, find a length, k a cube
root. Stretch: surface areas given, find a volume (Haese 18D Q7-8).

## Transformations — Haese 20A–D and Rayner 11.6–11.12

On a coordinate grid; the vectors in Rayner 11.1–11.5 and Haese's
stretches, function transformations, inverses and combinations (20E–H)
are left out. Translation, reflection, rotation and enlargement are
carried out only: a question letters one corner A and asks for A′, and
the image is drawn on reveal so the class can check their drawing. One
question in three (not for enlargement) moves a single point P instead,
quicker to read off a projected grid. Describing is its own skill: it
draws shapes A and B, and the reveal draws the mirror line or the centre.

**Translation** — Haese 20A, Rayner Ex 11.10. Foundation: in words,
"3 squares right and 2 squares down". Core: by a column vector, the form
both books use, with no negative entry. Stretch: a column vector with a
negative entry, or one vector and then another (find A″).

**Reflection** — Haese 20C, Rayner Ex 11.6–11.7. Foundation: in the
x-axis or the y-axis. Core: in a line x = a or y = b. Stretch: in y = x
or y = −x (Rayner Ex 11.7).

**Rotation** — Haese 20B, Rayner Ex 11.8–11.9. Foundation: 90° either way
or 180° about the origin. Core: 180° about a centre marked on the grid.
Stretch: 90°, clockwise or anticlockwise, about a marked centre.

**Enlargement** — Haese 20D, Rayner Ex 11.11. Foundation: scale factor 2
or 3, the centre at a corner of the shape, so the image grows out of it.
Core: scale factor 2 or 3 from a centre off the shape. Stretch: scale
factor ½ (Haese's reduction; "enlargement, scale factor ½" is what the
mark schemes ask for), −1 or −2, the centre between the shape and its
image.

**Describing a transformation** — Rayner Ex 11.12, "describe fully the
following transformations". Foundation: a translation, a reflection in a
vertical or horizontal line, or a rotation about the origin. Core: any of
the four, centres anywhere and scale factors 2 and 3. Stretch: the harder
case of three: reflection in y = x or y = −x, a quarter turn about a
centre off the origin, scale factor ½. A translation has no harder case,
so it stops at Core.

## Skill-ladder review: geometry

Changes Joakim decided in the November 2026 skill-ladder review. Rows still
"To decide" were left alone.

- **Translation, reflection, rotation and enlargement** are carried out
  only, with single-point questions mixed into every band of the first
  three; describing is left to Describing a transformation. Bands as in
  the Transformations section above.
- **Polygon interior and exterior angles**: F n given; C the angle given,
  find n; S irregular. See Angles in polygons above.
- **Parallel and perpendicular gradients** split. Parallel lines: F
  y = mx + c; C ax + by = d; S the equation of the parallel line through a
  point. Perpendicular lines: F a whole-number gradient; C a fraction;
  S general form.
- **Vertical and horizontal lines**: F read x = a or y = b off a graph; C
  through two points; S from a description ("parallel to the x-axis,
  through (3, −2)"; perpendicular to an axis; gradient 0). Where a line
  meets one is its own skill, *Where a line meets x = a or y = b*: F x = a
  and y = b; C y = mx + c with x = k or y = k; S ax + by = d with x = k or
  y = k.
- **Straight lines in general form**: F y = mx + c to ax + by = d; C back;
  S the equation through two points, in ax + by = d.
- **Areas and volumes of similar shapes** split; see Similarity above.

## Vectors — Haese 24A–H and Rayner 11.1–11.5

Year 10, IGCSE 0607. Vectors are bold (\mathbf{a}) as the books and exam
papers print them; a vector between points is \overrightarrow{AB}. Haese's
scale drawings with bearings (24A) and the wind, river and aircraft problems
of 24C–D are left out: they are bearings and trigonometry, not vectors.

**Column vectors** — Haese 24E, Rayner 11.2, 11.4. Foundation: read an arrow
off a squared grid. Core: the vector from one point to another, from their
coordinates (Haese Examples 8–9), sometimes the reverse direction. Stretch:
one end and the vector given, find the other end.

**Adding and scaling vectors** — Haese 24E.2, 24F, Rayner 11.3. Foundation:
a + b, a − b. Core: scalar multiples, 2a − 3b. Stretch: solve a vector
equation for x (Rayner 11.3 questions 25–36), kx ± v = u or u − kx = v.

**Magnitude** — Haese 24E.2, Rayner 11.5. Foundation: a whole-number length
from a Pythagorean pair. Core: an exact length, given in simplest surd form
(√45 = 3√5), as chosen for this topic; half the Core lengths need the
simplifying step. Stretch: the length of a combination, |a − 2b|, or the
distance between two points: find the vector first.

**Parallel vectors** — Haese 24G, Rayner 11.2. Foundation: one vector is k
times the other, find k. Core: a missing component that makes two vectors
parallel (Haese 24G question 2). Stretch: three points on a straight line,
find a missing coordinate (Haese 24G questions 5 and 7).

**Vectors in geometry** — Haese 24B, 24H, Rayner 11.1 Example 2 and 11.2.
Foundation: a vector between two corners of a triangle OAB (OA = a, OB = b)
or a parallelogram ABCD (AB = a, AD = b): a negative, an equal side, or a
route through a corner. Core: to or from the midpoint of a side. Stretch:
to or from a point dividing a side in a ratio m : n (Haese 24H question 6,
Rayner 11.2 question 8). The working takes the route round the shape and
never the whole third side of the triangle, which is what is being found.

## Probability — Haese 25B–E, G, J

IGCSE 0607 10.2–10.6, alongside `simple-probability` (25A, F) and
`tree-diagrams` (25H, I). Fractions are the count over the total, then
simplified; estimated probabilities are exact decimals. The ask sits in the
question, beside any table, and carries the numbers; the instruction names
the set-up.

**Relative frequency** — 25B. Foundation: one event from a count (a coin,
a drawing pin, an archer, a late bus). Core: from a frequency table, one
outcome or two together. Stretch: a frequency missing, with the number of
spins given, or two people's results pooled.

**Two-way tables** — 25C. Foundation: one cell, or a whole row or column.
Core: a union (row + column − the cell), or a table printed with its totals
and one cell blank. Stretch: given a row or a column (Example 3 d, e).

**Expectation** — 25D. Foundation: np from a given probability, or from a
fair dice. Core: the probability first, from an experiment or a bag. Stretch:
an expected score from points and probabilities (question 7b), or the
number of trials back from the expected count.

**Sample spaces** — 25E, F. Foundation: a filled two-dice (or dice and
spinner) grid of totals or products, counted. Core: the grid headed but
empty, filled on reveal, including differences. Stretch: three coins listed,
or a probability given that something has happened (Example 7c), read from a
filled grid. The pools are small by nature, about 230 and 300 questions.

**Independent events** — 25G. Foundation: P(A and B) = P(A) × P(B), in
fractions or tenths. Core: with complements (both miss, one but not the
other). Stretch: exactly one, or at least one, without the tree that
`tree-diagrams` draws.

**Either or** — 25J. Foundation: mutually exclusive outcomes of a spinner,
added, or the one left. Core: overlapping events on numbered cards or a pack
of 52, by P(A) + P(B) − P(A and B). Stretch: the addition rule with the
probabilities given, forwards or back to P(A and B).

## Skill-ladder review: number

Changes Joakim decided in the November 2026 skill-ladder review. Rows still
"To decide" were left alone.

- **Percentages** is six skills, each holding one task:
  - *Percentage of an amount*: F friendly percentages (10%, 25%, …); C any
    whole percentage that is not one of those, over 100% a quarter of the
    time; S a half percentage (12.5%, 7.5%).
  - *Reverse percentages* (new): F 10% or 50% of it known; C any friendly
    percentage, so 1% first; S the amount after an increase or decrease.
  - *Finding a multiplier*: F a whole percentage; C an awkward one (45.9%,
    or past 100%); S two changes as one multiplier.
  - *Reading a multiplier as a change* (new): F × 1.15; C × 1.075;
    S two multipliers in turn as one overall change.
  - *Increasing or decreasing by a percentage*: F one step; C two steps;
    S the same change compounded over several years.
  - *Percentage change, profit and loss* (new): F a whole-number change;
    C to one decimal place; S the cost price from a selling price and a
    profit or loss.
- **Fractions, decimals and percentages** split by direction. Decimals and
  percentages to fractions: F 0.35, 6%; C three places, or 12.5% and its
  family; S any other half percentage. Fractions to decimals and
  percentages: F halves to twenty-fifths; C sixteenths, fortieths, 125ths;
  S mixed numbers.
- **Rational or irrational?** no longer has its own box: it is one
  Foundation question in three in Simplifying surds.
- **Negative fractions** split. Adding and subtracting: F one denominator
  divides the other, simplify first; C different denominators; S three
  terms. Multiplying and dividing: F one product; C a division, simplify
  first; S a square in the product.
- **Standard form** is four skills. Writing in standard form: F large;
  C small; S already a × 10ⁿ but with a outside 1 to 10 (45 × 10³,
  0.0004 × 10⁵). As an ordinary number (new): F positive power; C negative;
  S powers of 8 to 12. Multiplying and dividing: F × with no carry; C ×
  with a carry, or ÷ exactly; S ÷ needing adjustment. Adding and
  subtracting: F the same power; C powers one apart; S two or three apart.
- **Simplifying surds** already held one task after Joakim's own surds
  rework (prime square factor, composite square factor, a coefficient), so
  its bands were kept as he wrote them.

## Profit and interest — Haese 10B, 10C, 10F

IGCSE 0607 1.8. Every question is worded, as Haese's are; money is in
pounds, worked in whole pence, and compound growth in exact arithmetic, so a
nearest-penny answer is never a floating-point accident.

**Profit and loss** — Haese 10B, 10D question 9. Foundation: bought for £C
and marked up or down by p%, the selling price (Examples 1 and 2). Core:
bought for £C, sold for £S, the percentage profit or loss, which the student
names (Examples 3 and 4). Stretch: sold for £S at a p% profit or loss, the
cost price, a reverse percentage.

**Simple interest** — Haese 10C. Foundation: I = Prn for whole years.
Core: the total to repay or the value at the end, with the time in months
or years. Stretch: the rate, the time or the principal back from the
interest (Examples 6, 9 and 10, Review 10A question 10). Answers are exact:
no rounded rates or times.

**Compound interest** — Haese 10F. Foundation: the value after n years, to
the nearest penny. Core: the interest earned, or a depreciating asset's
value (questions 9 and 10 turned forwards). Stretch: the amount to invest now
for a target (Example 20), or the annual rate from the start and end values
(Example 21), to 1 decimal place.

## Speed, distance and time — Haese 10G, 10H

IGCSE 0607 1.13.

**Speed, distance and time** — Haese 10G. Foundation: two of speed,
distance and time in whole hours, find the third. Core: times in hours and
minutes (the answer to a time question in hours and minutes), or converting
between m/s and km/h (question 10). Stretch: the average speed of a journey
in two parts, given two distances or two times (Example 23, questions 7–9).
Averages come out whole or to 1 decimal place exactly.

**Travel graphs** — Haese 10H, on the `travel-graph` figure. Every corner
sits on a gridline. Foundation: read the distance at a time, or the length
of the stop. Core: the speed of one part, or the average speed out to the
furthest point, stop included, in km/h. Stretch: a round trip's average
speed, stops included, or two travellers, the second leaving later and
passing the first at a grid point: where, or when (questions 2 and 3).
Walks and bike rides are timed in minutes, drives in hours.

## Logarithms — Haese 31A–E

Year 10, IGCSE 0607 (syllabus 3.10). Rayner has no logarithms chapter. Base
10 is written plain, as "log", the way Haese 31D and the exam papers write
it; every other base carries its subscript. A Number topic, after Indices,
since a log is read as the power that gives a number. The graph of y = log x
(31B) and the graphics-calculator equations of 31B question 4 are left out;
31B's inverses are the Stretch of the first skill.

**Logarithmic and index form** — Haese 31A questions 1, 2, 4–6, 31B Example
3. Foundation: a whole-number power either way round, 2^5 = 32 and
log_2 32 = 5. Core: negative and fractional powers (5^−2 = 1/25,
27^(1/3) = 3, 8^(−1/3) = 1/2). Stretch: make x the subject, from an index
(y = 3^(2x), y = 5 × 2^x) or from a log (w = log_5(2x), y = 3 log_2 x).

**Evaluating logarithms** — Haese 31A question 3, 31D.1. Foundation: whole
answers, with log 1 = 0 and log_a a = 1 among them. Core: the reciprocals,
as fractions or terminating decimals, for negative answers (log_2(1/8),
log 0.001). Stretch: fractional answers through a root in the argument
(log_2 √8, log_3(1/√27), log_2(4√2)), a power as the base (log_4 8 = 3/2)
or a root as the base (log_√2 4 = 4).

**Writing as a single logarithm** — Haese 31C question 1, 31D.1 question 2.
Foundation: one law, two terms. Core: coefficients (3 log_5 2 + 2 log_5 3)
or three terms. Stretch: a whole number to write as a log first
(1 + log_3 4, 2 − log 5), or ½ or ⅓ in front (½ log 9 = log 3). The answer
is never a power of the base, which would simplify to a number.

**Logarithms in terms of p and q** — Haese 31C question 2, Example 5.
Foundation: one law (log 21 = p + q, log(3/7) = q − p, log 49 = 2p). Core:
powers of both (log(7/9) = p − 2q). Stretch: a power of the base folded in
(log_2 56 = p + 3, log(0.21) = p + q − 2). The given numbers are primes that
don't divide the base, so p, q and 1 are independent and the answer is the
only one.

**Equations without logarithms** — Haese 31C question 3, 31D.2 questions
2–3. Foundation: one law (log_2 y = 3 log_2 u → y = u^3), or straight from
the definition (log D = 2x + 1 → D = 10^(2x + 1)), which Haese sets before
the laws. Core: two terms with coefficients, or a single negative one
(y = u^2 v^3, y = u^3 / v^2, y = 1/u^2). Stretch: a whole number among the
logs (log_7 y = 1 + 2 log_7 v → y = 7v^2), or ½ or ⅓ in front
(y = √v / u^2).

**Solving exponential equations with logarithms** — Haese 31E questions
1–4. Every answer to 3 significant figures (the IGCSE default; Haese's
exercise asks for 4). Foundation: 10^x = b, so x = log b. Core: a^x = b by
x = log b / log a, with decimal bases bracketed as Haese prints them,
(1.05)^x, and negative answers. Stretch: half equations (k × a^x = b,
a^(mx + c) = b) and half worded growth and decay models (bees, bacteria,
savings, a car's value, a medicine): find t when P reaches a value.

**Solving logarithmic equations** — Haese 31E question 8, Challenge 2b.
Foundation: log_2 x = 5, or the base unknown, log_x 64 = 3. Core: a negative
or fractional right-hand side (log_5 x = −2, log_8 x = 2/3), or a linear
argument kept as clean as Haese's (log_5(2x) = −1; a whole answer when the
power is positive). Stretch: combine with a number first
(log_2 x + log_2 3 = 4 → x = 16/3), or two logs of x
(log_2 x + log_2(x + 2) = 3 → x = 2, the negative root rejected).

---

## Skill-ladder review: statistics

Changes Joakim decided in the November 2026 skill-ladder review. Rows still
"To decide" were left alone.

- **Types of data**: F qualitative or quantitative; C qualitative, discrete
  or continuous; S the edge cases (shoe size, shirt number, hours of
  sunshine), four variables with a Reason column filled in on reveal.
- **Averages from a list** (Joakim's ladder): F one measure at a time
  (mean, mode, median or range); C all four, as parts (a)–(d); S
  backwards, x found from a given mean, median, range or mode. For the
  median and the range the list is given in order, so x has one place.
- **Reading a frequency table**: F read and add; C the total of value ×
  frequency; S backwards, the missing frequency from that total, with the
  number asked not given.
- **Cumulative frequency tables**: F discrete; C grouped; S grouped with
  gaps in both columns, so frequencies come from cumulative ones.
- **Modal class** and **Class containing the median** split. Modal: F four
  or five classes; C six, with a close second; S from a cumulative table.
  Median: F a total of 30 or under; C a total of 50 to 100; S from a
  cumulative table.
- **Averages from a stem-and-leaf plot**: F the median of a short plot, odd
  count; C the median with an even count; S the mean of 15 to 20 values.
- **Pie charts** split. Reading: F a frequency from a labelled angle; C the
  same with one angle withheld (360 minus the rest first); S the scale
  from one known frequency. Drawing: F a total that divides 360; C any
  total, to the nearest degree; S from percentages, one sometimes missing.
- **Line of best fit**: F read an estimate; C estimate and say
  interpolation or extrapolation; S estimate either way and judge
  reliability with a reason. **The mean point** is its own skill: F four or
  five pairs; C six or seven; S the mean point given, a missing value k.

## Not yet calibrated

**Factorising x² + bx + c (Haese 1K)** and **splitting the middle term (1L)**
— pages 49–51, not supplied. This is first in the migration order, so either
send those pages or start with expanding instead.

Everything in `haese-igcse.json` with `status: "todo"` beyond the sections
above is uncalibrated. Add to this document as each is migrated rather than
guessing bands.