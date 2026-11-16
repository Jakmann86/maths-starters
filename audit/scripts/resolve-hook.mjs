// Node resolve hook: lets node import the app's extensionless ESM imports
// (which Vite resolves) without modifying any source file.
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
export async function resolve(specifier, context, next) {
  if ((specifier.startsWith('.') || specifier.startsWith('/')) && !/\.(m?js|json|jsx|css)$/.test(specifier)) {
    for (const ext of ['.js', '.jsx', '/index.js']) {
      const url = new URL(specifier + ext, context.parentURL);
      if (existsSync(fileURLToPath(url))) return next(specifier + ext, context);
    }
  }
  return next(specifier, context);
}
