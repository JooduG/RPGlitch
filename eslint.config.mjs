import js from '@eslint/js';
import globals from 'globals';
import jest from 'eslint-plugin-jest';
import pluginImport from 'eslint-plugin-import';
import pluginN from 'eslint-plugin-n';
import pluginPromise from 'eslint-plugin-promise';
import { createRequire } from 'node:module';

// Use createRequire to import JSON without syntax errors in an ES module
const require = createRequire(import.meta.url);

// Default fallbacks in case the master file is missing
let eslintIgnores = [
  "**/node_modules/**",
  "**/build/output/**",
  "**/build/local_libs/**",
  "**/.cache/**",
  "**/dist/**",
  "**/.DS_Store",
  "**/Thumbs.db",
  "memory-bank/archive/",
  "memory-bank/scribbles.md",
];

// Try to read the central ignore list from the master config
try {
  // Corrected path: relative to the root, where this config file lives
  const master = require('./ignores.master.json');
  // Use the specific key from your master config
  if (master && master.linters && master.linters.eslint) {
    eslintIgnores = master.linters.eslint;
  }
} catch (e) {
  // Silently fail and use the fallback ignores
}

export default [
  // 1) Global ignores
  {
    ignores: eslintIgnores,
  },

  // 2) Base JS recommended rules for all files
  {
    ...js.configs.recommended,
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.node,
        // Declare 'image' as a known global from perchance.js
        'image': 'readonly',
      },
    },
    plugins: {
      import: pluginImport,
      n: pluginN,
      promise: pluginPromise,
    },
    rules: {
      'no-unused-vars': ['warn', { args: 'none', ignoreRestSiblings: true }],
      'no-undef': 'error',
      'import/no-unresolved': 'off',
      'n/no-missing-import': 'off',
      'no-console': 'off',
    },
  },

  // 3) Jest test files configuration
  {
    files: ['**/tests/**/*.js', '**/*.test.js'],
    ...jest.configs['flat/recommended'],
    rules: {
      ...jest.configs['flat/recommended'].rules,
      'jest/prefer-expect-assertions': 'off',
    },
  },

  // 4) Node-only overrides for build scripts
  {
    files: ['build/scripts/**/*.js'],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
        // Declare 'image' as a known global from perchance.js
        'image': 'readonly',
        'Dexie': 'readonly', 
      },
    },
    rules: {
      'import/no-extraneous-dependencies': 'off',
    },
  },
];

