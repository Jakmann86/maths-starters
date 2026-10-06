// Loads KaTeX as its own chunk — see MathDisplay.jsx.
//
// preloadKatex() fetches it (and warms
// the fonts it uses most) as soon as the app mounts, so by the time a
// teacher reaches a surd it renders synchronously instead of flashing its
// source text while the module and each new font file arrive.

let katexPromise = null;
let katexModule = null;

// The faces a starter actually uses: upright and italic maths, plus the
// delimiter sizes behind \sqrt and \left( \right). Fonts only download on
// first use, so without this each new glyph family (the first root, the
// first bracket) pops in late.
const KATEX_FONTS = [
  '400 1em KaTeX_Main',
  'italic 400 1em KaTeX_Math',
  '400 1em KaTeX_Size1',
  '400 1em KaTeX_Size2',
  '400 1em KaTeX_Size3',
  '400 1em KaTeX_Size4',
];

export function loadKatex() {
  if (!katexPromise) {
    katexPromise = Promise.all([
      import('katex'),
      import('katex/dist/katex.min.css'),
    ]).then(([mod]) => {
      katexModule = mod.default ?? mod;
      if (document.fonts?.load) KATEX_FONTS.forEach((f) => document.fonts.load(f).catch(() => {}));
      return katexModule;
    });
  }
  return katexPromise;
}

export function preloadKatex() {
  loadKatex().catch(() => {});
}

/** The KaTeX module once loaded, else null — lets a render use it synchronously. */
export const loadedKatex = () => katexModule;
