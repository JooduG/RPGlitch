import { includeIgnoreFile } from "@eslint/compat";
import js from "@eslint/js";
import prettier from "eslint-config-prettier";
import svelte from "eslint-plugin-svelte";
import globals from "globals";
import { fileURLToPath } from "node:url";
// import markdownlintPlugin from "eslint-plugin-markdownlint";
// import markdownlintParser from "eslint-plugin-markdownlint/parser.js";

const gitignorePath = fileURLToPath(new URL("./.gitignore", import.meta.url));

/** @type {import('eslint').Linter.Config[]} */
export default [
  includeIgnoreFile(gitignorePath),

  {
    // @agent:ignore-start
    ignores: [
      "*.tmp",
      "*.template",
      "*.log",
      ".secrets",
      "*.bak",
      "**/yarn.lock",
      "**/test-results/**",
      "**/templates/**",
      "**/scribbles/**",
      "**/public/assets/**",
      "**/pnpm-lock.yaml",
      "**/package-lock.json",
      "**/out/**",
      "**/node_modules/**",
      "**/mcp.json",
      "**/dist/**",
      "**/coverage/**",
      "**/build/**",
      "**/archive/**",
      "**/__snapshots__/**",
      "**/Thumbs.db",
      "**/.turbo/**",
      "**/.stylelintignore",
      "**/.prettierignore",
      "**/.playwright-auth/**",
      "**/.next/**",
      "**/.markdownlintignore",
      "**/.htmlhintignore",
      "**/.gitignore",
      "**/.git/**",
      "**/.geminiignore",
      "**/.eslintcache",
      "**/.env*",
      "!**/.env.example",
      "**/bun.lockb",
      "**/.antigravityignore",
      "**/.DS_Store",
      "**/.jules/cache/**"
    ],
    // @agent:ignore-end
  },
  js.configs.recommended,
  ...svelte.configs.recommended,
  prettier,
  ...svelte.configs.prettier,
  // prettierPlugin (removed for performance - rely on format script)

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
    languageOptions: {
      parserOptions: {
        /* svelteConfig detected automatically */
      },
    },
  },
  // markdownlint (handled by markdownlint-cli2)
  {
    files: ["tools/**/*.js", "build/scripts/**/*.js"],
    languageOptions: {
      globals: {
        ...globals.node,
        KEYWORDS_EXTERNAL: "readonly",
      },
    },
  },
];
