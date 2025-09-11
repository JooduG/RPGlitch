module.exports = [
  {
    languageOptions: {
      globals: {
        router: "readonly",
      },
      ecmaVersion: 12,
      sourceType: "module",
    },
    rules: {
      // Add any specific rules here if needed
    },
  },
  {
    ignores: [
      "node_modules/",
      "build/output/",
      "memory-bank/archive/**",
      "build/local_libs/**",
      "build/config/build/output/coverage/**",
    ],
  },
];