import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: './',
  server: { port: 5173 },
  // La verificación del banco recorre miles de cadenas por ejercicio.
  test: {
    testTimeout: 180000,
    // Los *.gen.test.ts generan archivos fuente; se corren a mano, no en cada test.
    exclude: ["**/node_modules/**", "**/dist/**", "**/*.gen.test.ts"],
  },
})
