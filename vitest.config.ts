import { defineConfig } from 'vitest/config'
import { fileURLToPath, URL } from 'node:url'
export default defineConfig({
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  // One worker avoids process-startup contention on modest development laptops.
  test: { environment: 'jsdom', clearMocks: true, maxWorkers: 1 },
})
