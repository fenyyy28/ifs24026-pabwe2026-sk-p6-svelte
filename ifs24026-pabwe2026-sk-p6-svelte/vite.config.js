import { defineConfig } from 'vitest/config'
import { loadEnv } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import { svelteTesting } from '@testing-library/svelte/vite'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const port = Number(env.APP_PORT) || 3004

  return {
    plugins: [svelte(), svelteTesting()],
    server: { port, strictPort: true },
    preview: { port, strictPort: true },
    test: {
      environment: 'jsdom',
      globals: true,
      setupFiles: ['./vitest.setup.js'],
      include: ['src/**/*.test.js'],
      env: { VITE_DELCOM_BASEURL: 'https://open-api.delcom.org/api/v1' },
      clearMocks: true,
      coverage: {
        provider: 'v8',
        include: ['src/**/*.{js,svelte}'],
        exclude: ['src/**/*.test.js', 'src/main.js'],
        reporter: ['text', 'html'],
        thresholds: { statements: 100, branches: 100, functions: 100, lines: 100 },
      },
    },
  }
})
