import { includeIgnoreFile } from "@eslint/compat";
import js from "@eslint/js";
import prettier from "eslint-config-prettier";
import svelte from "eslint-plugin-svelte";
import globals from "globals";
import { fileURLToPath } from "node:url";
import markdownlintPlugin from "eslint-plugin-markdownlint";
import markdownlintParser from "eslint-plugin-markdownlint/parser.js";
import prettierPlugin from "eslint-plugin-prettier";

const gitignorePath = fileURLToPath(new URL("./.gitignore", import.meta.url));

/** @type {import('eslint').Linter.Config[]} */
export default [
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
      "**/.gemini/**",
      ".geminiignore",
      ".gitignore",
      "/.DS_Store",
      "/.env",
      "dist/index.html",
      "mcp.json",
      "node_modules",
      "**/scribbles/**",
      "test-results/**",
      ".playwright-auth/**",
    ],
    // @agent:ignore-end
  },
  js.configs.recommended,
  ...svelte.configs.recommended,
  prettier,
  ...svelte.configs.prettier,
  {
    plugins: {
      prettier: prettierPlugin,
    },
    rules: {
      "prettier/prettier": ["warn", { endOfLine: "auto" }],
    },
  },

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
  {
    files: ["**/*.md"],
    plugins: { markdownlint: markdownlintPlugin },
    languageOptions: { parser: markdownlintParser },
    rules: {
      ...markdownlintPlugin.configs.recommended.rules,
      "markdownlint/md013": "off",
      "markdownlint/md033": "off",
      "prettier/prettier": "off",
    },
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
];
