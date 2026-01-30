import { svelte } from "@sveltejs/vite-plugin-svelte"
import { defineConfig } from "vitest/config"

export default defineConfig({
    plugins: [svelte({ hot: !process.env.VITEST })],
    test: {
        // Use jsdom for DOM testing
        environment: "jsdom",
        // Global test utilities
        globals: true,
        // Setup files
        setupFiles: ["./.agent/skills/warden/scripts/setup.js"],
        // Coverage configuration
        coverage: {
            provider: "v8",
            reporter: ["text", "json", "html"],
            exclude: [
                "node_modules/",
                "tools/",
                "dist/",
                "**/*.config.js",
                "**/*.spec.js",
                "**/*.test.js",
            ],
        },
        // Mock IndexedDB for Scholar tests
        // Mock IndexedDB for Scholar tests
        server: {
            deps: {
                inline: ["fake-indexeddb"],
            },
        },
        // Test file patterns
        include: [
            "tools/tests/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}",
            "src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}",
            ".agent/skills/warden/scripts/unit/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}",
        ],
        // Exclude patterns
        exclude: ["node_modules", "dist", ".git", "tools/tests/e2e/**"],
    },
    resolve: {
        alias: {
            // Map src for cleaner imports in tests
            "@": "/src",
        },
    },
})
