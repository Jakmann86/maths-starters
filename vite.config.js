import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/maths-starters/',
  server: {
    host: true,
  },
  // The generator harnesses sample thousands of questions per band, and on
  // the CI runner several sit near vitest's 5s default.
  test: {
    testTimeout: 60000,
  },
})