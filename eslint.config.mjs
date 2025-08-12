// eslint.config.mjs — ESLint v9 flat config
import js from '@eslint/js';
import globals from 'globals';

export default [
  // 1) Global ignores (v9: use config-based ignores, not .eslintignore)
  {
    ignores: [
      'node_modules/**',
      'build/output/**',
      'build/local_libs/**',
      'memory-bank/archive/**',
      '**/*.min.js'
    ]
  },

  // 2) Base recommended rules
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