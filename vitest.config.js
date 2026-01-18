import { defineConfig } from "vitest/config";
import { svelte } from "@sveltejs/vite-plugin-svelte";

export default defineConfig({
  plugins: [svelte({ hot: !process.env.VITEST })],
  test: {
    // Use jsdom for DOM testing
    environment: "jsdom",
    // Global test utilities
    globals: true,
    // Setup files
    setupFiles: ["./tools/tests/setup.js"],
    // Coverage configuration
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      exclude: [
        "node_modules/",
        "tools/",
        "dist/",
        "**/*.config.js",
        "**/*.spec.js",
        "**/*.test.js",
      ],
    },
    // Mock IndexedDB for Scholar tests
    // Mock IndexedDB for Scholar tests
    server: {
      deps: {
        inline: ["fake-indexeddb"],
      },
    },
    // Test file patterns
    include: ["tools/tests/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}"],
    // Exclude patterns
    exclude: ["node_modules", "dist", ".git", "**/*.e2e.{test,spec}.{js,ts}"],
  },
  resolve: {
    alias: {
      // Map src for cleaner imports in tests
      "@": "/src",
    },
  },
});
