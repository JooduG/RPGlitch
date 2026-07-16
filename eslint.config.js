import css from "@eslint/css";
import js from "@eslint/js";
import json from "@eslint/json";
import markdown from "@eslint/markdown";
import vitest from "@vitest/eslint-plugin";
import eslintPluginBetterTailwindcss from "eslint-plugin-better-tailwindcss";
import svelte from "eslint-plugin-svelte";
import { defineConfig } from "eslint/config";
import globals from "globals";
import svelteParser from "svelte-eslint-parser";
import svelteConfig from "./svelte.config.js";

export default defineConfig([
  // 0. Global Quarantine (Prevents fatal parsing crashes on non-script files)
  {
    // @agent:ignore-start
    ignores: [
      "*.bak",
      "*.log",
      "*.template",
      "*.tmp",
      "**/*.lock",
      ".secrets",
      "**/.DS_Store",
      "**/.env*",
      "**/.eslintcache",
      "**/.git/**",
      "**/cache/**",
      "**/.next/**",
      "**/.playwright-auth/**",
      "**/*ignore",
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
      "**/*scribbles**",
      "**/templates/**",
      "**/test-results/**",
      "**/yarn.lock",
      "**/tmp/**",
      "tmp/**/*",
      "**/view-transitions-svelte.md",
      "**/.understand-anything/**",
    ],
    // @agent:ignore-end
  },
  {
    // ESLint-specific global ignores (not managed by sync-ignores.js)
    ignores: ["dist/**/*", "src/index.html", "types.d.ts", "**/.cache"],
  },

  // 1. Core JavaScript Engine Rules
  {
    ...js.configs.recommended,
    files: ["**/*.{js,mjs,cjs,jsx,ts,tsx,svelte}"],
  },
  {
    files: ["**/*.{js,mjs,cjs}"],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
  },

  // 2. Native Language Extensions (ESLint v9+ Native Processing)
  {
    files: ["**/*.json"],
    plugins: { json },
    language: "json/json",
  },
  {
    files: ["**/*.md"],
    plugins: { markdown },
    language: "markdown/gfm",
  },
  {
    files: ["**/*.css"],
    plugins: { css },
    language: "css/css",
  },

  // 3. Svelte Parsing Infrastructure
  {
    files: ["**/*.svelte", "*.svelte", "**/*.svelte.js", "*.svelte.js", "**/*.svelte.ts", "*.svelte.ts"],
    languageOptions: {
      parser: svelteParser,
      globals: {
        ...globals.browser,
      },
    },
  },

  // 4. Vitest Test Automation Pipeline
  {
    files: ["**/*.test.js"],
    plugins: {
      vitest,
    },
    rules: {
      ...vitest.configs.recommended.rules,
      "vitest/max-nested-describe": ["error", { max: 3 }],
      "vitest/expect-expect": "warn",
    },
  },

  // 5. Advanced Tailwind Configuration & Local Parser Binding
  {
    files: ["**/*.{js,mjs,cjs,jsx,ts,tsx,svelte,html}"],
    plugins: {
      "better-tailwindcss": eslintPluginBetterTailwindcss,
    },
    settings: {
      "better-tailwindcss": {
        cwd: "./",
        entryPoint: "src/media/design.css",
      },
    },
  },
  {
    files: ["**/*.svelte"],
    languageOptions: {
      parser: svelteParser,
    },
  },

  // 6. Official Svelte Rules & Compiler Integration
  ...svelte.configs["flat/recommended"].map((config) => {
    const newConfig = { ...config, files: config.files || ["**/*.svelte"] };
    if (newConfig.rules) {
      newConfig.rules = { ...newConfig.rules };
      delete newConfig.rules["svelte/prefer-svelte-reactivity"];
    }
    return newConfig;
  }),
  {
    files: ["**/*.svelte", "**/*.svelte.js"],
    languageOptions: {
      parserOptions: {
        svelteConfig,
      },
    },
  },

  // 7. Code Scope Overrides & Penalty Downgrades
  {
    files: ["**/*.{js,mjs,cjs,jsx,ts,tsx,svelte,html}"],
    rules: {
      "no-irregular-whitespace": "off",

      "no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],
      "no-undef": "warn",
      "better-tailwindcss/no-unknown-classes": [
        "warn",
        {
          ignore: ["scroll-area-viewport", "think-block-container", "display-text-container", "touch-target-coarse"],
        },
      ],
      "better-tailwindcss/enforce-consistent-line-wrapping": "off",
    },
  },
]);
