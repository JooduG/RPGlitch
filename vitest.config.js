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
      "@data": path.resolve(import.meta.dirname, "./src/data"),
      "@definitions": path.resolve(import.meta.dirname, "./src/definitions"),
      "@engine": path.resolve(import.meta.dirname, "./src/engine"),
      "@simulation": path.resolve(import.meta.dirname, "./src/simulation"),
      "@state": path.resolve(import.meta.dirname, "./src/state"),
      "@media": path.resolve(import.meta.dirname, "./src/media"),
      "@atoms": path.resolve(import.meta.dirname, "./src/ui/atoms"),
      "@molecules": path.resolve(import.meta.dirname, "./src/ui/molecules"),
      "@organisms": path.resolve(import.meta.dirname, "./src/ui/organisms"),
      "@ui": path.resolve(import.meta.dirname, "./src/ui"),
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
