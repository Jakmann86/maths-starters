import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const BASE = '/maths-starters/'
const PORT = 5173

// In a Codespace, print the forwarded URL with the base path on the end:
// the bare forwarded URL shows "page can't be found".
const codespacesUrl = () => ({
  name: 'codespaces-url',
  apply: 'serve',
  configureServer(server) {
    const { CODESPACE_NAME, GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN } = process.env
    if (!CODESPACE_NAME || !GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN) return
    server.httpServer?.once('listening', () => {
      const url = `https://${CODESPACE_NAME}-${server.config.server.port}.${GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN}${BASE}`
      setTimeout(() => console.log(`\n  ➜  Codespace: \x1b[36m${url}\x1b[0m\n`), 0)
    })
  },
})

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), codespacesUrl()],
  base: BASE,
  server: {
    host: true,
    port: PORT,
    // Fail loudly rather than drift to 5174, where the forwarded URL is wrong.
    strictPort: true,
  },
  // The generator harnesses sample thousands of questions per band, and on
  // the CI runner several sit near vitest's 5s default.
  test: {
    testTimeout: 60000,
  },
})