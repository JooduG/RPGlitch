// Flat config for ESLint v9+ (no JSON import assertions)
// Loads ignore patterns from ignores.master.json using createRequire to avoid `assert { type: 'json' }`.

import js from '@eslint/js';
import globals from 'globals';
import pluginImport from 'eslint-plugin-import';
import pluginN from 'eslint-plugin-n';
import pluginPromise from 'eslint-plugin-promise';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

// Default fallbacks in case the master file is missing or shaped differently
let eslintIgnores = [
  'node_modules/',
  'build/output/',
  'build/local_libs/',
  '.cache/',
  'dist/',
  '_DS_Store',
  'Thumbs.db',
  // workspace-specific
  'memory-bank/archive',
  'memory-bank/scribbles.md',
];

// Try to read central ignore list
try {
  const master = require('./ignores.master.json');
  // Accept a few possible keys to be resilient
  eslintIgnores =
    master.eslintIgnore ||
    master.eslint_ignore ||
    master.common?.eslint ||
    master.all?.eslint ||
    master.eslint ||
    eslintIgnores;
} catch {
  // keep defaults
}

export default [
  // 1) Global ignores
  {
    ignores: eslintIgnores,
  },

  // 2) Base JS recommended rules
  js.configs.recommended,

  // 3) Project rules (browser + node)
  {
    files: ['**/*.js', '**/*.mjs', '**/*.cjs'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    plugins: {
      import: pluginImport,
      n: pluginN,
      promise: pluginPromise,
    },
    rules: {
      // Reasonable defaults
      'no-unused-vars': ['warn', { args: 'none', ignoreRestSiblings: true }],
      'no-undef': 'error',

      // You rely on bundling/Perchance includes; relax unresolved warnings
      'import/no-unresolved': 'off',
      'n/no-missing-import': 'off',

      // Optional ergonomics
      'promise/no-return-wrap': 'warn',
      'promise/param-names': 'warn',
      'promise/no-nesting': 'off',
      'promise/catch-or-return': 'off',
      'promise/always-return': 'off',
      'no-console': 'off',
    },
  },

  // 4) Node-only overrides for build scripts
  {
    files: ['build/scripts/**/*.js'],
    languageOptions: {
      sourceType: 'module',
      globals: {
        ...globals.node,
      },
    },
    rules: {
      // scripts often use sync fs/child_process — keep them permissive
      'import/no-extraneous-dependencies': 'off',
    },
  },
];
