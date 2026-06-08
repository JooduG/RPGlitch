import css from "@eslint/css";
import js from "@eslint/js";
import json from "@eslint/json";
import markdown from "@eslint/markdown";
import vitest from "@vitest/eslint-plugin";
import eslintPluginBetterTailwindcss from "eslint-plugin-better-tailwindcss";
import svelte from "eslint-plugin-svelte";
import tailwind from "eslint-plugin-tailwindcss";
import { defineConfig } from "eslint/config";
import globals from "globals";
import svelteParser from "svelte-eslint-parser";
import svelteConfig from "./svelte.config.js";

export default defineConfig([
  // 1. Core JavaScript Engine Rules
  js.configs.recommended,
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

  // 3. Standard Tailwind Ruleset
  ...tailwind.configs["flat/recommended"],

  // 4. Svelte Parsing Infrastructure
  {
    files: [
      "**/*.svelte",
      "*.svelte",
      "**/*.svelte.js",
      "*.svelte.js",
      "**/*.svelte.ts",
      "*.svelte.ts",
    ],
    languageOptions: {
      parser: svelteParser,
    },
  },

  // 5. Vitest Test Automation Pipeline
  {
    files: ["**/*.test.js"],
    plugins: {
      vitest,
    },
    rules: {
      ...vitest.configs.recommended.rules,
      "vitest/max-nested-describe": ["error", { max: 3 }],
    },
  },

  // 6. Monorepo Scoping for Specialized Tailwind Rules
  {
    files: ["packages/website/**/*.{js,jsx,cjs,mjs,ts,tsx}"],
    settings: {
      "better-tailwindcss": {
        cwd: "./packages/website",
      },
    },
  },
  {
    files: ["packages/app/**/*.{js,jsx,cjs,mjs,ts,tsx}"],
    settings: {
      "better-tailwindcss": {
        cwd: "./packages/app",
      },
    },
  },

  // 7. Advanced Tailwind Configuration & Svelte Parser Correction
  eslintPluginBetterTailwindcss.configs.recommended,
  {
    files: ["**/*.svelte"],
    settings: {
      "better-tailwindcss": {
        entryPoint: " src/media/design.css",
        tailwindConfig: "tailwind.config.js",
      },
    },
    languageOptions: {
      parser: svelteParser, // Resolved the missing eslintParserSvelte ReferenceError
    },
  },

  // 8. Official Svelte Rules & Compiler Integration
  ...svelte.configs["flat/recommended"],
  {
    files: ["**/*.svelte", "**/*.svelte.js"],
    languageOptions: {
      parserOptions: {
        svelteConfig,
      },
    },
  },

  // 9. Peace Treaty: Global Style Rule Overrides
  {
    rules: {
      // Disabled to prevent infinite layout sorting loops with your prettier-plugin-tailwindcss
      "tailwindcss/classnames-order": "off",
      "no-irregular-whitespace": "off",
    },
  },
]);
