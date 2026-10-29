import { defineConfig } from 'vitest/config'
import { fileURLToPath } from 'url'

// Pruebas de la lógica pura (sin navegador): npm test
export default defineConfig({
  resolve: { alias: { '@': fileURLToPath(new URL('.', import.meta.url)) } },
  test: { include: ['tests/**/*.test.ts'] },
})
