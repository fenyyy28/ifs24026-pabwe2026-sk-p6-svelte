import { sveltekit } from "@sveltejs/kit/vite";
import { defineConfig, loadEnv } from "vite";
import adapterBun from "@sveltejs/adapter-bun";
import adapterVercel from "@sveltejs/adapter-vercel";
import tailwindcss from "@tailwindcss/vite";
import { svelteTesting } from "@testing-library/svelte/vite";
import process from "process";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const isVercel = process.env.VERCEL === "1";
  const port = Number(process.env.APP_PORT || env.APP_PORT) || 3005;

  return {
    plugins: [
      sveltekit({
        // Sisipkan CSS ke dalam HTML agar tidak menjadi render-blocking request.
        inlineStyleThreshold: Infinity,
        // Vercel menyetel VERCEL=1 saat build; di tempat lain (lokal/Jenkins) tetap adapter-bun.
        adapter: isVercel
          ? adapterVercel()
          : adapterBun({
              envPrefix: "APP_",
              serverOptions: {
                port: port,
              },
            }),
      }),
      tailwindcss(),
      svelteTesting(),
    ],
    server: {
      port: port,
    },
    preview: {
      port: port,
    },
    build: {
      chunkSizeWarningLimit: 1500,
    },
    define: {
      DELCOM_BASEURL: JSON.stringify(
        env.VITE_DELCOM_BASEURL || "http://localhost:8000/api/v1"
      ),
    },
    test: {
      globals: true,
      environment: "jsdom",
      setupFiles: "./src/setupTests.ts",
      coverage: {
        provider: "v8",
        reporter: ["text", "json", "html", "lcov"],
        include: ["src/**/*.{js,ts,svelte}"],
        exclude: [
          "src/app.d.ts",
          "src/env.d.ts",
          "src/setupTests.ts",
          "src/test-utils.ts",
          "**/*.test.{js,ts}",
          "node_modules/**",
          ".svelte-kit/**",
          ".docs/**",
        ],
        thresholds: {
          lines: 100,
          functions: 100,
          branches: 100,
          statements: 100,
        },
      },
    },
  };
});