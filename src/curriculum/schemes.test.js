// Guards CLAUDE.md §3 / SPEC.md §2.2: everything under curriculum/schemes/ is
// plain, serialisable JSON — no functions, ever. That went unnoticed once (a
// generator's source landed there in place of the catalogue) because nothing
// checked. This lives beside schemes/, not inside it, so the directory it
// guards stays JSON-only with no self-exempting exception.
import { describe, expect, it } from 'vitest';
import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const schemesDir = join(dirname(fileURLToPath(import.meta.url)), 'schemes');
const files = readdirSync(schemesDir);

describe('curriculum/schemes/', () => {
  it('contains only .json files', () => {
    expect(files.every((f) => f.endsWith('.json'))).toBe(true);
  });

  it.each(files.filter((f) => f.endsWith('.json')))(
    '%s survives JSON.parse(JSON.stringify())',
    (file) => {
      const parsed = JSON.parse(readFileSync(join(schemesDir, file), 'utf8'));
      expect(JSON.parse(JSON.stringify(parsed))).toEqual(parsed);
    },
  );
});
