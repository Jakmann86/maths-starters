import { createContext } from 'react';
import { P_RANGE, Q_RANGE } from '../lib/typeSizing.js';

// The question size ranges Slot sizes against. The app never provides this,
// so it always reads the defaults in typeSizing.js; only the dev page
// /size-test.html provides other values, to try spreads on a real board.
export const SizeRange = createContext({ q: Q_RANGE, p: P_RANGE });
