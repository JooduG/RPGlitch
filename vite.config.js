import { svelte } from "@sveltejs/vite-plugin-svelte";
import { execSync } from "child_process";
import path from "path";
import { defineConfig } from "vite";
import devtoolsJson from "vite-plugin-devtools-json";
import { viteSingleFile } from "vite-plugin-singlefile";

// 🎨 Design Token Sync Plugin
/**
 * Vite plugin to synchronize design tokens on build and file changes.
 * @returns {import('vite').Plugin} The Vite plugin object.
 */
function designTokenSync() {
  return {
    name: "design-token-sync",
    buildStart() {
      try {
        console.log("🎨 Syncing design tokens...");
        execSync("node ./.agents/skills/css/scripts/design-sync.js", { stdio: "inherit" });
      } catch (err) {
        console.error("❌ Design token sync failed:", err.message);
      }
    },
    handleHotUpdate({ file }) {
      if (file.endsWith("DESIGN.md")) {
        try {
          console.log("🎨 DESIGN.md changed, resyncing tokens...");
          execSync("node ./.agents/skills/css/scripts/design-sync.js", { stdio: "inherit" });
          // Optionally trigger a full reload or just let Vite handle the CSS update
        } catch (err) {
          console.error("❌ Design token sync failed:", err.message);
        }
      }
    },
  };
}

export default defineConfig(({ command, mode }) => {
  const isDev = command === "serve";

  return {
    // Root must point to where index.html lives
    root: "src",
    plugins: [designTokenSync(), svelte(), !isDev && viteSingleFile(), devtoolsJson()].filter(
      Boolean,
    ),
    resolve: {
      // Top-Level Domain Aliasing
      // Restricting aliases to major folders forces better structural boundaries.
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
      // Force Vite to prioritize Svelte and modern JS
      extensions: [".svelte", ".js", ".ts", ".mjs"],
    },
    build: {
      target: "esnext",
      outDir: "../dist",
      emptyOutDir: true,
      // Perchance Single-File Mandates
      cssCodeSplit: false,
      minify: "esbuild",
      sourcemap: mode === "development",
      // WARNING: If you put large assets (.mp3, .png) in the src folder,
      // this limit will Base64 encode them and bloat your HTML file.
      // Host assets externally (Imgur/Perchance uploads) and link to them via URL.
      assetsInlineLimit: 100000000,
      rollupOptions: {
        output: {
          // IIFE format encapsulates the app to prevent variable collisions in Perchance
          format: "iife",
          name: "RPGlitch",
          inlineDynamicImports: true,
        },
      },
    },
    server: {
      port: 4001,
      strictPort: false, // Fail if port 4000 is taken, rather than silently jumping to 4001
      open: true, // Automatically open embedded browser on boot
      watch: {
        // Ensure DESIGN.md is watched even though it's outside the src root
        ignored: ["!**/DESIGN.md"],
      },
    },
    preview: {
      port: 8080,
    },
  };
});
