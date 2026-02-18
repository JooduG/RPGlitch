import { svelte } from "@sveltejs/vite-plugin-svelte"
import path from "path"
import { defineConfig } from "vitest/config"

export default defineConfig({
    plugins: [svelte({ hot: !process.env.VITEST })],
    test: {
        environment: "jsdom",
        globals: true,
        // Explicitly include src test paths
        include: ["src/**/*.{test,spec}.{js,ts}"],
        exclude: ["**/node_modules/**", "**/.git/**"],
        alias: {
            "@": path.resolve(__dirname, "./src"),
            "@core": path.resolve(__dirname, "./src/core"),
            "@data": path.resolve(__dirname, "./src/data"),
            "@state": path.resolve(__dirname, "./src/state"),
            "@ui": path.resolve(__dirname, "./src/ui"),
            "@theme": path.resolve(__dirname, "./src/theme"),
            "@media": path.resolve(__dirname, "./src/media"),
            "@scholar": path.resolve(__dirname, "./src/data"),
        },
        // setupFiles: [".agent/skills/warden/scripts/setup.js"],
    },
})
