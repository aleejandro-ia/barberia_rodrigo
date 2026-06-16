import { defineConfig } from 'vitest/config'
import { fileURLToPath } from 'node:url'

// Pure-logic unit tests (datetime/TZ, day classification, auto-complete filter).
// Node environment — no DOM, no Next runtime. `@/` resolves to the repo root so
// tests import app modules exactly like the app does.
export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./', import.meta.url)),
    },
  },
})
