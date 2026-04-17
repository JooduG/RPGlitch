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
      "!**/.env.example",
      "*.bak",
      "*.log",
      "*.template",
      "*.tmp",
      ".secrets",
      "**/.DS_Store",
      "**/.antigravityignore",
      "**/.env*",
      "**/.eslintcache",
      "**/.geminiignore",
      "**/.git/**",
      "**/.gitignore",
      "**/.htmlhintignore",
      "**/.jules/cache/**",
      "**/.markdownlintignore",
      "**/.next/**",
      "**/.playwright-auth/**",
      "**/.prettierignore",
      "**/.stylelintignore",
      "**/.turbo/**",
      "**/Thumbs.db",
      "**/__snapshots__/**",
      "**/archive/**",
      "**/build/**",
      "**/bun.lockb",
      "**/coverage/**",
      "**/dist/**",
      "**/mcp.json",
      "**/node_modules/**",
      "**/out/**",
      "**/package-lock.json",
      "**/pnpm-lock.yaml",
      "**/public/assets/**",
      "**/scribbles/**",
      "**/templates/**",
      "**/test-results/**",
      "**/yarn.lock",
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
