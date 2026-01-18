import devtoolsJson from "vite-plugin-devtools-json";
import { defineConfig } from "vitest/config";
import { playwright } from "@vitest/browser-playwright";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import { viteSingleFile } from "vite-plugin-singlefile";

export default defineConfig({
  // Set root to src directory where index.html is located
  root: "src",

  plugins: [svelte(), viteSingleFile(), devtoolsJson()],

  build: {
    // Target modern browsers (no legacy support)
    target: "esnext",

    // Force all assets to be inlined (critical for Perchance single-file requirement)
    assetsInlineLimit: 100000000,

    // Disable CSS code splitting to ensure single file output
    cssCodeSplit: false,

    // Output to dist directory (relative to project root, not src)
    outDir: "../dist",

    emptyOutDir: true,

    // Generate minified production bundle
    minify: "esbuild",

    // Sourcemaps for debugging (disable for final production)
    sourcemap: false,

    rollupOptions: {
      output: {
        // IIFE format for Perchance sandbox compatibility (ESM doesn't work in their eval context)
        format: "iife",

        name: "RPGlitch",

        // Single file output - everything inlined
        inlineDynamicImports: true,

        // Clean output naming
        entryFileNames: "RPGlitch.js",

        assetFileNames: "RPGlitch.[ext]",
      },
    },
  },

  resolve: {
    // Support for Svelte file resolution
    extensions: [".mjs", ".js", ".ts", ".jsx", ".tsx", ".json", ".svelte"],
  },

  server: {
    // Dev server configuration
    port: 3000,

    strictPort: false,
    open: false,
  },

  preview: { port: 8080 },

  test: {
    expect: { requireAssertions: true },

    projects: [
      {
        extends: "./vite.config.js",

        test: {
          name: "client",

          browser: {
            enabled: true,
            provider: playwright(),
            instances: [{ browser: "chromium", headless: true }],
          },

          include: ["src/**/*.svelte.{test,spec}.{js,ts}"],
          exclude: ["src/lib/server/**"],
        },
      },

      {
        extends: "./vite.config.js",

        test: {
          name: "server",
          environment: "node",
          include: ["src/**/*.{test,spec}.{js,ts}"],
          exclude: ["src/**/*.svelte.{test,spec}.{js,ts}"],
        },
      },
    ],
  },
});
