import { fileURLToPath, URL } from 'node:url'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['tests/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text'],
      include: ['src/lib/**', 'src/stores/**', 'src/router/**'],
      exclude: ['src/lib/adapters/supabase.ts', 'src/lib/adapters/SupabaseAdapter.ts'],
      thresholds: { lines: 80, functions: 80 },
    },
  },
})
