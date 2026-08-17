# Difficulty calibration

Foundation / Core / Stretch bands derived from how the textbooks actually
escalate within an exercise, not from guesswork.

Sources: Haese *International Mathematics for the Middle Years* (IGCSE 0607)
and Rayner *Complete International Mathematics for Cambridge IGCSE*.

Read this before writing any generator. Difficulty means a change in the
**shape** of the question, never a bigger number.

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

**Stretch** — Ex 1C Q3–Q4. Two variables, and the numerical application.
`(4x + 5y)(4x − 5y)`, `(7x − 2y)(7x + 2y)`
Also `43 × 37 = 40² − 3²`, and evaluating `18 × 22`, `49 × 51` without a
calculator. That last form is a good starter question and unlike anything
currently in the pool.

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

---

## Not yet calibrated

**Factorising x² + bx + c (Haese 1K)** and **splitting the middle term (1L)**
— pages 49–51, not supplied. This is first in the migration order, so either
send those pages or start with expanding instead.

Everything in `haese-igcse.json` with `status: "todo"` beyond the sections
above is uncalibrated. Add to this document as each is migrated rather than
guessing bands.