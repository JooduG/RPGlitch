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
    ignores: ["dist/**/*", "src/index.html", "types.d.ts", "**/.cache", "node_modules/**/*"],
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

  // 5. Monorepo Scoping for Specialized Tailwind Rules
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

  // 6. Advanced Tailwind Configuration & Svelte Parser Correction
  {
    ...eslintPluginBetterTailwindcss.configs.recommended,
    files: ["**/*.{js,mjs,cjs,jsx,ts,tsx,svelte,html}"],
  },
  {
    files: ["**/*.svelte"],
    settings: {
      "better-tailwindcss": {
        entryPoint: "src/media/design.css",
      },
    },
    languageOptions: {
      parser: svelteParser,
    },
  },

  // 7. Official Svelte Rules & Compiler Integration
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

  // 8. Peace Treaty: Code Scope Overrides & Penalty Downgrades
  {
    files: ["**/*.{js,mjs,cjs,jsx,ts,tsx,svelte,html}"],
    rules: {
      "no-irregular-whitespace": "off",

      // Demoting rule validations down to yellow text warnings safely
      "no-unused-vars": "warn",
      "no-undef": "warn",
      "better-tailwindcss/no-unknown-classes": "warn",
    },
  },
]);
