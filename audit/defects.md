# Defect log

One entry per defect. Reproduce any entry with `node audit/scripts/show.mjs <skill-id> <band> <seed>` (the seed keys a PRNG installed over `Math.random`; see `audit/scripts/seed.mjs`). Printed output is copied verbatim as the LaTeX source; `⏎` marks a line break.

ID | skill-id | band | seed | category | severity | exact printed output | what is wrong | status | suggested fix
---|---|---|---|---|---|---|---|---|---
D001 | solve-quadratic-roots | foundation | 38 | working-redundant | S2 | `x^2 = 196 ⏎ x^2 = 196 ⏎ x = \pm 14` | When the coefficient of x^2 is 1 (about 1 draw in 9) the "divide by a" line repeats the line above it. | fixed in "audit: solve-quadratic-roots - repeated line" | Print the ax^2 line only when a is not 1.
