// eslint.config.mjs
import js from "@eslint/js";
import globals from "globals";

export default [
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
      "memory-bank/**/archive/**",
      "memory-bank/project/archive/collection.md"
    ],
    // plugins: { js }, // Removed as it's already imported
    languageOptions: {
      globals: globals.browser,
      ecmaVersion: 2021,
      sourceType: "module"
    },
    rules: {
      ...js.configs.recommended.rules,
      // General best practices and error prevention
      "no-unused-vars": "warn",
      "no-unused-labels": "warn",
      "no-empty": "warn",
      "no-duplicate-imports": "error",
      "no-dupe-else-if": "error",
      "no-dupe-keys": "error",
      "no-redeclare": "error",
      "no-restricted-globals": ["error", "event", "fdescribe"],
      "no-undef": "error", // ENSURE THIS IS 'error' FOR GENERAL FILES
      "no-duplicate-case": "error",
      "no-empty-function": "warn",
    }
  },  
  // JavaScript files override (apps directory) - THIS IS THE CRITICAL FIX
  {
    files: ["apps/**/*.js"],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.es2021,
        // Explicitly add global variables that are NOT imported
        // These were identified in the previous linter run as 'not defined'
        Dexie: "readonly", // 'readonly' indicates it's a global variable that shouldn't be reassigned
        ai: "readonly",
        image: "readonly",
        App: "readonly", // Assuming 'App' is a global object
        _makeProfilePicturePlaceholderSVG: "readonly",
        textToImage: "readonly",
        textToText: "readonly"
      },
      ecmaVersion: 2021,
      sourceType: "script", // Reverted to 'script' as files are not modules
    },
    rules: {
      "no-unused-vars": "warn", // Use regular ESLint rule instead
      "no-undef": "error", // *** CRITICAL FIX: ENSURE THIS IS 'error' HERE ***
      "no-console": "off", // Allow console logs in app code (as per your previous setup)
      "no-redeclare": "error" // Changed to 'error' to enforce no redeclaration
    }
  },
];
