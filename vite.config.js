import { svelte } from "@sveltejs/vite-plugin-svelte";
import path from "path";
import { defineConfig } from "vite";
import devtoolsJson from "vite-plugin-devtools-json";
import { viteSingleFile } from "vite-plugin-singlefile";
export default defineConfig({
  // Root must point to where index.html lives
  root: "src",
  plugins: [svelte(), viteSingleFile(), devtoolsJson()],
  resolve: {
    // Top-Level Domain Aliasing
    // Restricting aliases to major folders forces better structural boundaries.
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@core": path.resolve(__dirname, "./src/core"),
      "@data": path.resolve(__dirname, "./src/data"),
      "@state": path.resolve(__dirname, "./src/state"),
      "@media": path.resolve(__dirname, "./src/media"),
      "@theme": path.resolve(__dirname, "./src/theme"),
      "@ui": path.resolve(__dirname, "./src/ui"),
      "@atoms": path.resolve(__dirname, "./src/ui/atoms"),
      "@devmode": path.resolve(__dirname, "./src/ui/devmode"),
      "@drawer": path.resolve(__dirname, "./src/ui/drawer"),
      "@profile": path.resolve(__dirname, "./src/ui/profile"),
      "@storyboard": path.resolve(__dirname, "./src/ui/storyboard"),
      "@storymode": path.resolve(__dirname, "./src/ui/storymode"),
      "@utils": path.resolve(__dirname, "./src/ui/utils"),
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
    sourcemap: false,
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
  },
  preview: {
    port: 8080,
  },
});
