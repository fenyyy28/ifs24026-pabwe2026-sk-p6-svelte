import { defineConfig } from 'vitest/config'
import { loadEnv } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import { svelteTesting } from '@testing-library/svelte/vite'

// Menyisipkan CSS hasil build langsung ke index.html agar tidak ada file CSS
// yang memblokir render (Lighthouse: render-blocking, text compression).
function inlineCss() {
  return {
    name: 'inline-css',
    apply: 'build',
    enforce: 'post',
    generateBundle(_, bundle) {
      const html = bundle['index.html']
      if (!html || typeof html.source !== 'string') return
      let source = html.source
      for (const [name, file] of Object.entries(bundle)) {
        if (file.type !== 'asset' || !name.endsWith('.css')) continue
        const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
        const link = new RegExp(`<link[^>]*${escaped}[^>]*>`)
        if (!link.test(source)) continue
        const css = String(file.source).replace(/<\/style/gi, '<\\/style')
        source = source.replace(link, () => `<style>${css}</style>`)
        delete bundle[name]
      }
      html.source = source
    },
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const port = Number(env.APP_PORT) || 3004

  // Di Vercel, arahkan API lewat proxy satu-origin (/api -> vercel.json) agar tidak ada
  // request lintas-origin (CORS). Lokal dan test tetap memakai VITE_DELCOM_BASEURL dari .env.
  const vercelHost = process.env.VERCEL ? process.env.VERCEL_PROJECT_PRODUCTION_URL : ''
  const define = vercelHost
    ? { 'import.meta.env.VITE_DELCOM_BASEURL': JSON.stringify(`https://${vercelHost}/api/v1`) }
    : {}

  return {
    plugins: [svelte(), svelteTesting(), inlineCss()],
    define,
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