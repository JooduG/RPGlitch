module.exports = {
  extends: ['stylelint-config-standard'],
  rules: {
    // Enforce dash-case for class and ID names (from user memory)
    'selector-class-pattern': '^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$',
    'selector-id-pattern': '^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$',

    // Other general rules for consistency and best practices
    'block-no-empty': true,
    'color-no-invalid-hex': true,
    'unit-no-unknown': true,
    'selector-pseudo-class-no-unknown': true,
    'at-rule-no-unknown': [
      true,
      {
        ignoreAtRules: ['include', 'mixin', 'each', 'if', 'else', 'for', 'function', 'return', 'use', 'forward'] // Allow Sass at-rules
      }
    ],
    'property-no-unknown': true,
    'declaration-block-no-duplicate-properties': true,
    'declaration-block-no-redundant-longhand-properties': true,
    'no-duplicate-selectors': true,
    'no-empty-source': true,
    'no-invalid-double-slash-comments': true,
    // Add specific rule overrides or disables for known framework issues if truly unavoidable
    // For 'no-descending-specificity' with Pico CSS, often best handled with inline comments
    // Example (if you wanted to disable it globally, which is generally not recommended):
    // 'no-descending-specificity': null,
    'at-rule-no-deprecated': true, // Ensured this is explicitly enabled if it was an issue
    'selector-pseudo-element-no-unknown': [
      true,
      {
        ignorePseudoElements: ['-webkit-scrollbar', '-webkit-scrollbar-thumb'] // Example: if you use these
      }
    ]
  },
  ignoreFiles: [
    "memory-bank/archives/code/**/*.css",
    "memory-bank/archives/code/**/*.scss",
    "memory-bank/archives/**/*.css",
    "memory-bank/archives/**/*.scss",
    "memory-bank/archives/code/**/*.css",
    "memory-bank/archives/code/**/*.scss",
    "tools/test-globs/test-globs.scss",
    "**/archive/**/*.css",
    "**/archive/**/*.scss",
    "**/archives/**/*.css",
    "**/archives/**/*.scss",
  ],
};
