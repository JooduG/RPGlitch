import { svelte } from "@sveltejs/vite-plugin-svelte"
import path from "path"
import { defineConfig } from "vitest/config"

export default defineConfig({
    plugins: [svelte({ hot: !process.env.VITEST })],
    test: {
        environment: "jsdom",
        globals: true,
        // Explicitly include both src and .agent test paths
        include: [
            "src/**/*.{test,spec}.{js,ts}",
            "tests/**/*.{test,spec}.{js,ts}",
            ".agent/skills/warden/scripts/unit/**/*.{test,spec}.{js,ts}",
        ],
        exclude: [
            "**/node_modules/**",
            "**/.git/**",
            // Broken legacy tests requiring refactor
            ".agent/skills/warden/scripts/unit/gamemaster.test.js",
            ".agent/skills/warden/scripts/unit/physics.test.js",
            ".agent/skills/warden/scripts/unit/scholar.test.js",
            ".agent/skills/warden/scripts/unit/validation.test.js",
            ".agent/skills/warden/scripts/unit/mesmer.test.js",
        ],
        alias: {
            "@": path.resolve(__dirname, "./src"),
            "@core": path.resolve(__dirname, "./src/core"),
            "@data": path.resolve(__dirname, "./src/data"),
            "@state": path.resolve(__dirname, "./src/state"),
            "@ui": path.resolve(__dirname, "./src/ui"),
            "@theme": path.resolve(__dirname, "./src/theme"),
            "@media": path.resolve(__dirname, "./src/media"),
            "@scholar": path.resolve(__dirname, "./src/data"),
            // Legacy paths for unit tests
            "@core/session": path.resolve(__dirname, "./src/core/engine"),
            "@core/llm": path.resolve(__dirname, "./src/core/intelligence"),
            "@core/prompts": path.resolve(__dirname, "./src/core/intelligence"),
            "@core/physics": path.resolve(__dirname, "./src/core/security"),
            "../bridge.js": path.resolve(__dirname, "./src/data/bridge.js"),
            "../../../../../src/theme/audio/sound-effects.js": path.resolve(
                __dirname,
                "./src/media/audio/effects.js"
            ),
            "../../../../../src/theme/index.js": path.resolve(
                __dirname,
                "./src/theme/palette.svelte.js"
            ),
        },
        // setupFiles: [".agent/skills/warden/scripts/setup.js"],
    },
})
