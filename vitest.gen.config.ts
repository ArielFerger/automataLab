import { defineConfig } from 'vitest/config'

/**
 * Configuración aparte para el generador de referencias del banco.
 * Se corre con `npm run generar`; no forma parte de `npm test` porque escribe
 * archivos fuente.
 */
export default defineConfig({
  test: {
    include: ['test/**/*.gen.test.ts'],
    exclude: ['**/node_modules/**'],
    testTimeout: 300000,
  },
})
