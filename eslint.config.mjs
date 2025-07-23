// eslint.config.mjs
import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import { defineConfig } from "eslint/config";

export default defineConfig([
  {
    files: ["**/*.{js,mjs,cjs,ts,mts,cts}"],
    ignores: [
      "tizen/**/*",
      "browser-tools-mcp/**/*",
      "diagnostics/**/*",
      "automation-collect-diagnostics.js",
      "build-and-copy.js",
      "build-perchance.js",
      "apps/**/archive/**",
      "build/output/archive/**",
      "memory/**/archive/**",
      "memory/project/archive/collection.md"
    ],
    plugins: { js },
    extends: ["js/recommended"],
    languageOptions: {
      globals: globals.browser,
      ecmaVersion: 2021,
      sourceType: "module"
    },
    rules: {
      // General best practices and error prevention
      "no-unused-vars": "warn",
      "no-unused-labels": "warn",
      "no-empty": "warn",
      "no-duplicate-imports": "error",
      "no-dupe-else-if": "error",
      "no-dupe-keys": "error",
      "no-redeclare": "error",
      "no-restricted-globals": ["error", "event", "fdescribe"],
      "no-undef": "error",
      "no-duplicate-case": "error",
      "no-empty-function": "warn",
      "no-console": "warn" // Change to 'off' if you want to allow console logs
    }
  },
  // JavaScript files override (apps directory)
  {
    files: ["apps/**/*.js"],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.es2021,
      },
      ecmaVersion: 2021,
      sourceType: "script",
    },
    rules: {
      "@typescript-eslint/no-unused-vars": "off", // Disable TypeScript rule for JS files
      "no-unused-vars": "warn", // Use regular ESLint rule instead
      "no-undef": "off", // Allow undefined globals in browser context
      "no-console": "off", // Allow console logs in app code
    }
  },
  // TypeScript files
  {
    files: ["**/*.{ts,mts,cts}"],
    ...tseslint.configs.recommended
  }
]);