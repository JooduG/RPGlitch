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
      "@engine": path.resolve(__dirname, "./src/engine"),
      "@data": path.resolve(__dirname, "./src/data"),
      "@state": path.resolve(__dirname, "./src/state"),
      "@media": path.resolve(__dirname, "./src/media"),
      "@ui": path.resolve(__dirname, "./src/ui"),
      "@atoms": path.resolve(__dirname, "./src/ui/atoms"),
      "@actions": path.resolve(__dirname, "./src/ui/actions"),
      "@motion": path.resolve(__dirname, "./src/ui/motion"),
      "@components": path.resolve(__dirname, "./src/ui/components"),
      "@devmode": path.resolve(__dirname, "./src/ui/devmode"),
      "@profile": path.resolve(__dirname, "./src/ui/profile"),
      "@storyboard": path.resolve(__dirname, "./src/ui/storyboard"),
      "@storymode": path.resolve(__dirname, "./src/ui/storymode"),
    },
  },
  test: {
    // Uses jsdom to instantly fake a browser for blazing-fast component tests
    environment: "jsdom",

    // Automatically injects describe, it, expect, vi so the AI doesn't have to import them
    globals: true,

    // THE BOUNDARY: Vitest strictly owns .test.js. Playwright owns .e2e.js and .spec.js.
    // Notice the paths now correctly point to `.agents` instead of `.agent`
    include: [
      "src/**/*.test.{js,ts}",
      ".agents/skills/*/scripts/**/*.test.{js,ts}",
      "tests/**/*.test.{js,ts}",
    ],
    exclude: ["**/node_modules/**", "**/dist/**", "**/.git/**"],

    // Test setup hook (Path corrected to .agents)
    setupFiles: [".agents/skills/simulation/scripts/test-setup.js"],
  },
});
