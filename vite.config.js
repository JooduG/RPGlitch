import { svelte } from "@sveltejs/vite-plugin-svelte"
import path from "path"
import { defineConfig } from "vite"
import devtoolsJson from "vite-plugin-devtools-json"
import { viteSingleFile } from "vite-plugin-singlefile"

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
                // IIFE format for Perchance sandbox compatibility
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
        alias: {
            "@": path.resolve(__dirname, "./src"),
            "@core": path.resolve(__dirname, "./src/core"),
            "@core/gamemaster": path.resolve(__dirname, "./src/core/session"),
            "@data": path.resolve(__dirname, "./src/data"),
            "@state": path.resolve(__dirname, "./src/state"),
            "@ui": path.resolve(__dirname, "./src/ui"),
            "@theme": path.resolve(__dirname, "./src/theme/scss"),
            "@mesmer": path.resolve(__dirname, "./src/theme"),
            "@scholar": path.resolve(__dirname, "./src/data"),
        },
    },

    server: {
        // Dev server configuration
        port: 3000,
        strictPort: false,
        open: false,
    },

    preview: { port: 8080 },
})
