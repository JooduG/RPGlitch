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
      "@platform": path.resolve(import.meta.dirname, "./src/platform"),
      "@intelligence": path.resolve(import.meta.dirname, "./src/intelligence"),
      "@data": path.resolve(import.meta.dirname, "./src/data"),
      "@state": path.resolve(import.meta.dirname, "./src/state"),
      "@media": path.resolve(import.meta.dirname, "./src/media"),
      "@ui": path.resolve(import.meta.dirname, "./src/ui"),
      "@console": path.resolve(import.meta.dirname, "./src/ui/console"),
      "@story": path.resolve(import.meta.dirname, "./src/ui/story"),
      "@message": path.resolve(import.meta.dirname, "./src/ui/message"),
      "@entity": path.resolve(import.meta.dirname, "./src/ui/entity"),
      "@profile": path.resolve(import.meta.dirname, "./src/ui/profile"),
      "@image": path.resolve(import.meta.dirname, "./src/ui/image"),
      "@primitives": path.resolve(import.meta.dirname, "./src/ui/primitives"),
      "@motion": path.resolve(import.meta.dirname, "./src/ui/motion"),
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
