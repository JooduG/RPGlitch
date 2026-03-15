import { includeIgnoreFile } from "@eslint/compat"
import js from "@eslint/js"
import prettier from "eslint-config-prettier"
import svelte from "eslint-plugin-svelte"
import globals from "globals"
import { fileURLToPath } from "node:url"
import svelteConfig from "./svelte.config.js"

const gitignorePath = fileURLToPath(new URL("./.gitignore", import.meta.url))

/** @type {import('eslint').Linter.Config[]} */ export default [
    includeIgnoreFile(gitignorePath),
    {
        // @agent:ignore-start
        ignores: [
            "!.gemini/settings.json",
            "!dist/RPGlitch-left-panel.txt",
            "!src/RPGlitch-left-panel.txt",
            "*.bak",
            "*.log",
            "*.tmp",
            "**/.git/**",
            "**/*.scss.template",
            "**/*.template",
            "**/archive/**",
            "**/node_modules/**",
            "**/templates/**",
            ".gemini/**",
            ".geminiignore",
            ".gitignore",
            "/.DS_Store",
            "/.env",
            "dist/index.html",
            "mcp.json",
            "node_modules",
            "test-results/**",
        ],
        // @agent:ignore-end
    },
    js.configs.recommended,
    ...svelte.configs.recommended,
    prettier,
    ...svelte.configs.prettier,

    {
        languageOptions: {
            globals: {
                ...globals.browser,
                ...globals.node,
                image: "readonly",
                ai: "readonly",
                Dexie: "readonly",
                DOMPurify: "readonly",
                $state: "readonly",
                $derived: "readonly",
                $effect: "readonly",
                $props: "readonly",
                $bindable: "readonly",
                $snippet: "readonly",
                $inspect: "readonly",
            },
            ecmaVersion: 2022,
            sourceType: "module",
        },
        rules: {
            "no-unused-vars": [
                "warn",
                {
                    args: "none",
                    ignoreRestSiblings: true,
                    caughtErrors: "none",
                },
            ],
            "no-undef": "error",
            "no-console": "off",
        },
    },

    {
        files: ["**/*.svelte", "**/*.svelte.js"],
        languageOptions: { parserOptions: { svelteConfig } },
    },

    {
        files: ["tools/**/*.js", "build/scripts/**/*.js"],
        languageOptions: {
            globals: {
                ...globals.node,
                KEYWORDS_EXTERNAL: "readonly",
            },
        },
    },
]
