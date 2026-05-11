import { includeIgnoreFile } from "@eslint/compat";
import js from "@eslint/js";
import prettier from "eslint-config-prettier";
import jsdoc from "eslint-plugin-jsdoc";
import svelte from "eslint-plugin-svelte";
import unusedImports from "eslint-plugin-unused-imports";
import globals from "globals";
import { fileURLToPath } from "node:url";
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
      "**/tmp/**",
      "**/.gemini/**"
    ],
    // @agent:ignore-end
  },
  js.configs.recommended,
  ...svelte.configs.recommended,
  prettier,
  ...svelte.configs.prettier,
  {
    plugins: {
      jsdoc,
      "unused-imports": unusedImports,
    },
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
      /* ========================================================================
			   [**] 1. THE RUNE REGIME (SVELTE 5)
			   ======================================================================== */
      // Vi litar på kompilatorn för export let, men blockerar legacy hooks.
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "svelte",
              importNames: [
                "onMount",
                "onDestroy",
                "afterUpdate",
                "beforeUpdate",
                "createEventDispatcher",
              ],
              message: "Legacy Svelte 4 logic forbidden. Use $effect() or callback props.",
            },
          ],
        },
      ],
      /* ========================================================================
			   [**] 2. TYPE SAFETY (MUFFLED TO WARN)
			   ======================================================================== */
      "jsdoc/require-jsdoc": "warn",
      "jsdoc/require-param-type": "warn",
      "jsdoc/require-returns-type": "warn",
      "jsdoc/valid-types": "warn",
      /* ========================================================================
			   [**] 3. GARBAGE COLLECTION (ACTIVE)
			   ======================================================================== */
      "no-unused-vars": "off",
      "unused-imports/no-unused-imports": "error",
      "unused-imports/no-unused-vars": [
        "warn",
        {
          vars: "all",
          varsIgnorePattern: "^_",
          args: "after-used",
          argsIgnorePattern: "^_",
        },
      ],
      /* ========================================================================
			   [**] 4. UTILITY
			   ======================================================================== */
      "no-console": "off",
      "no-undef": "error",
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
];
