import { PrintPage } from '../print/PrintSheet.jsx';
import { buildSheets } from '../print/buildSheets.js';
import { skillIds, getSkill } from '../curriculum/skills.js';
import { preloadKatex } from '../lib/katexLoader.js';

// Dev-only sweep for the printout: every skill, at one band, in one layout,
// so an overflowing question can be found by measuring rather than by eye.
// Not linked from the app and not in the production build — reach it at
// /print-test.html under `npm run dev`. The query string picks what to draw:
//
//   ?band=core&layout=half&answers=1&only=volume-cuboid,tree-diagrams
//
// Each skill fills a page on its own (all four boxes the same skill), so the
// tallest version of a skill is the one being measured.

preloadKatex();

export default function PrintTestPage() {
  const p = new URLSearchParams(window.location.search);
  const band = p.get('band') || 'core';
  const layout = p.get('layout') || 'half';
  const answers = p.get('answers') === '1';
  const only = p.get('only')?.split(',');
  const ids = skillIds.filter((id) => (!only || only.includes(id)) && getSkill(id).difficulties.length);
  const header = { title: 'Print test', date: true, answers };
  return (
    <div className="print-pages">
      {ids.map((id) => {
        const boxes = [0, 1, 2, 3].map(() => ({ skillId: id, band }));
        const [page] = buildSheets(boxes, { layout, perBox: 2, versions: 2 });
        return (
          <div key={id} data-sweep={id}>
            <PrintPage page={page} layout={layout} header={{ ...header, title: id }} />
          </div>
        );
      })}
    </div>
  );
}
