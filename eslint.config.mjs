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
      "build-perchance.js"
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
  // Node.js override for build/automation scripts
  {
    files: ["Perchance/*.js", "Perchance/**/*.js"],
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.es2021,
      },
      ecmaVersion: 2021,
      sourceType: "script",
    },
    rules: {
      "@typescript-eslint/no-require-imports": "off",
      "no-undef": "off",
      "no-console": "off",
    }
  },
  tseslint.configs.recommended
]);