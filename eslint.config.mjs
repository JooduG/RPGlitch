// eslint.config.mjs — ESLint v9 flat config
import js from '@eslint/js';
import globals from 'globals';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

  // Load ignore patterns generated from config/ignore.master
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const ESLINT_IGNORES = JSON.parse(
    fs.readFileSync(path.join(__dirname, 'config', 'ignore.eslint.json'), 'utf8')
);

export default [
  // 1) Global ignores (v9: use config-based ignores, not .eslintignore)
  { ignores: ESLINT_IGNORES },

  // 2) Base recommended
  js.configs.recommended,

  // 3) App/browser code (default)
  {
    files: ['apps/**/*.js'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'script',
      globals: {
        ...globals.browser,
        App: 'readonly',          // global provided by RPGlitch bootstrap
        Dexie: 'readonly',        // if present in your app
        ai: 'readonly',           // if present
        image: 'readonly',        // if present
        _makeProfilePicturePlaceholderSVG: 'readonly',
        textToImage: 'readonly',
        textToText: 'readonly'
      }
    },
    rules: {
      'no-redeclare': 'error',
      'no-empty-function': ['warn', { allow: ['constructors'] }],
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      'no-duplicate-imports': 'error',
      'no-undef': 'error'
    }
  },

  // 4) Build/tools (Node)
  {
    files: ['build/**/*.js', 'tools/**/*.js'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'script',
      globals: { ...globals.node }
    },
    rules: {
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      'no-undef': 'error'
    }
  },

  // 5) Tests (Node + Jest)
  {
    files: ['tests/**/*.js'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'script',
      globals: {
        ...globals.node,
        ...globals.jest
      }
    },
    rules: {
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      'no-undef': 'error',
      'no-redeclare': 'off'
    }
  }
];