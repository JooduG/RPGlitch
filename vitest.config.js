import { svelte } from "@sveltejs/vite-plugin-svelte";
import path from "path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [svelte()],
  resolve: {
    conditions: ["browser"],
    // Aliases strictly synced with Vite and JSConfig to prevent spaghetti code
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@platform": path.resolve(__dirname, "./src/platform"),
      "@intelligence": path.resolve(__dirname, "./src/intelligence"),
      "@data": path.resolve(__dirname, "./src/data"),
      "@state": path.resolve(__dirname, "./src/state"),
      "@media": path.resolve(__dirname, "./src/media"),
      "@ui": path.resolve(__dirname, "./src/ui"),
      "@console": path.resolve(__dirname, "./src/ui/console"),
      "@story": path.resolve(__dirname, "./src/ui/story"),
      "@message": path.resolve(__dirname, "./src/ui/message"),
      "@entity": path.resolve(__dirname, "./src/ui/entity"),
      "@profile": path.resolve(__dirname, "./src/ui/profile"),
      "@image": path.resolve(__dirname, "./src/ui/image"),
      "@primitives": path.resolve(__dirname, "./src/ui/primitives"),
      "@motion": path.resolve(__dirname, "./src/ui/motion"),
      "@utils": path.resolve(__dirname, "./src/utils"),
    },
  },
  test: {
    // Uses jsdom to instantly fake a browser for blazing-fast component tests
    environment: "jsdom",

    // Automatically injects describe, it, expect, vi so the AI doesn't have to import them
    globals: true,

    include: ["src/**/*.test.{js,ts}", ".agents/skills/*/scripts/**/*.test.{js,ts}", "tests/**/*.test.{js,ts}"],
    // @agent:ignore-start
    exclude: ["**/node_modules/**", "**/dist/**", "**/.git/**", "**/tmp/**", "**/archive/**"],
    // @agent:ignore-end

    // Test setup hook (Path corrected to .agents)
    setupFiles: [".agents/skills/simulation/scripts/test-setup.js"],
    teardownTimeout: 1000,
    pool: "forks",
  },
});
