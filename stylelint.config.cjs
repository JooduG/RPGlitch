const master = require("./ignores.master.json");

/** @type {import('stylelint').Config} */
module.exports = {
  // One source of truth for ignore globs (complemented by .stylelintignore)
  ignoreFiles: master.linters?.stylelint || [],
  extends: ["stylelint-config-standard-scss", "stylelint-config-html/svelte", "stylelint-prettier/recommended"],
  overrides: [
    {
      files: ["**/*.svelte"],
      customSyntax: "postcss-html",
    },
  ],
  rules: {
    /* ========================================================================
       STANDARD ARCHITECTURE RULES
       ======================================================================== */

    // Accept kebab-case and optional BEM modifier: e.g., .card-title, .card-title--editing
    "selector-class-pattern": [
      "^[a-z][a-z0-9]*(?:-[a-z0-9]+)*(?:--[a-z0-9]+(?:-[a-z0-9]+)*)?$",
      {
        resolveNestedSelectors: true,
        message: "Expected class selector to be kebab-case, optionally with a BEM modifier (--modifier).",
      },
    ],

    "selector-pseudo-class-no-unknown": [
      true,
      {
        ignorePseudoClasses: ["global", "deep", "slotted"],
      },
    ],

    "scss/at-rule-no-unknown": [
      true,
      {
        ignoreAtRules: ["tailwind", "utility", "theme", "source", "config", "plugin", "custom-variant", "variant", "import"],
      },
    ],

    "at-rule-no-unknown": [
      true,
      {
        ignoreAtRules: ["tailwind", "utility", "theme", "source", "config", "plugin", "custom-variant", "variant", "import"],
      },
    ],

    "function-no-unknown": [
      true,
      {
        ignoreFunctions: ["theme", "color-mix"],
      },
    ],

    /* ========================================================================
       DEVELOPER SANITY OVERRIDES
       ======================================================================== */

    // Unplug the decimals vs percentages debate for alpha
    "alpha-value-notation": null,

    // Permit vendor prefixes for WebKit mask compositing
    "property-no-vendor-prefix": null,

    // Let yourself use empty lines for readability
    "custom-property-empty-line-before": null,

    // Stop it from yelling about cascading duplicate variables
    "declaration-block-no-duplicate-custom-properties": null,

    // Unplug modern color-function demands to preserve legacy RPGlitch palettes
    "color-function-notation": null,
  },
};
