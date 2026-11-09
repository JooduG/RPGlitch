import { svelte } from "@sveltejs/vite-plugin-svelte";
import path from "path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [svelte()],
  resolve: {
    conditions: ["browser"],
    // Aliases strictly synced with Vite and JSConfig to prevent spaghetti code
    alias: {
      "@": path.resolve(import.meta.dirname, "./src"),
      "@intelligence": path.resolve(import.meta.dirname, "./src/intelligence"),
      "@storage": path.resolve(import.meta.dirname, "./src/storage"),
      "@engine": path.resolve(import.meta.dirname, "./src/engine"),
      "@state": path.resolve(import.meta.dirname, "./src/state"),
      "@media": path.resolve(import.meta.dirname, "./src/media"),
      "@ui": path.resolve(import.meta.dirname, "./src/ui"),
      "@primitives": path.resolve(import.meta.dirname, "./src/ui/primitives"),
      "@utils": path.resolve(import.meta.dirname, "./src/utils"),
      "@config": path.resolve(import.meta.dirname, "./src/config.js"),
    },
  },
  test: {
    // Uses jsdom to instantly fake a browser for blazing-fast component tests
    environment: "jsdom",

    // Automatically injects describe, it, expect, vi so the AI doesn't have to import them
    globals: true,

    include: ["src/**/*.test.{js,ts}", ".agents/skills/*/scripts/**/*.test.{js,ts}", "tests/**/*.test.{js,ts}"],
    // @agent:ignore-start
    exclude: [
      "**/node_modules/**",
      "**/dist/**",
      "**/.git/**",
      "**/tmp/**",
      "**/archive/**"
    ],
    // @agent:ignore-end

    // Test setup hook (Path corrected to .agents)
    setupFiles: [".agents/skills/simulation/scripts/test-setup.js"],
    teardownTimeout: 4000,
    pool: "forks",
  },
});
