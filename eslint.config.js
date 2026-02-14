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
            "**/*.template",
            "**/templates/**",
            "**/*.scss.template",
            "*.bak",
            "*.log",
            "*.tmp",
            "**/.git/**",
            "**/node_modules/**",
            "/.DS_Store",
            "/dist",
            "test-results/**",
            ".gitignore",
            "mcp.json",
            "**/archive/**",
            "/.env",
            "node_modules",
            "dist",
            ".gemini",
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
