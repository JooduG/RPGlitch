import { svelte } from "@sveltejs/vite-plugin-svelte";
import path from "path";
import { defineConfig } from "vitest/config";
export default defineConfig({
  plugins: [svelte()],
  resolve: {
    conditions: ["browser"],
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@core": path.resolve(__dirname, "./src/core"),
      "@data": path.resolve(__dirname, "./src/data"),
      "@state": path.resolve(__dirname, "./src/state"),
      "@ui": path.resolve(__dirname, "./src/ui"),
      "@atoms": path.resolve(__dirname, "./src/ui/atoms"),
      "@drawer": path.resolve(__dirname, "./src/ui/drawer"),
      "@storymode": path.resolve(__dirname, "./src/ui/storymode"),
      "@storyboard": path.resolve(__dirname, "./src/ui/storyboard"),
      "@profile": path.resolve(__dirname, "./src/ui/profile"),
      "@devmode": path.resolve(__dirname, "./src/ui/devmode"),
      "@utils": path.resolve(__dirname, "./src/ui/utils"),
      "@theme": path.resolve(__dirname, "./src/theme"),
      "@media": path.resolve(__dirname, "./src/media"),
      "@scholar": path.resolve(__dirname, "./src/data"),
    },
  },
  test: {
    environment: "jsdom",
    globals: true,
    // Explicitly include src and script test paths
    include: ["src/**/*.{test,spec}.{js,ts}", ".agents/skills/*/scripts/*.{test,spec}.{js,ts}"],
    exclude: ["**/node_modules/**", "**/.git/**"],
    // setupFiles: [".agents/skills/governance/scripts/setup.js"],
    setupFiles: [".agents/skills/governance/scripts/test-setup.js"],
  },
});
