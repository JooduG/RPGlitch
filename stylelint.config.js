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
    'selector-pseudo-class-no-unknown': true, // Removed Vue-specific ignore
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
  },
}; 

// npx stylelint "**/*.css" "**/*.scss" --fix