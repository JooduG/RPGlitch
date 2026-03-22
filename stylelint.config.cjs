const master = require("./ignores.master.json");

/** @type {import('stylelint').Config} */
module.exports = {
  // one source of truth for ignore globs
  ignoreFiles: master.stylelintIgnore || [],
  extends: [
    "stylelint-config-standard-scss",
    "stylelint-config-html/svelte",
    "stylelint-prettier/recommended",
  ],
  overrides: [
    { files: ["**/*.scss"], customSyntax: "postcss-scss" },
    { files: ["**/*.svelte"], customSyntax: "postcss-html" },
  ],
  rules: {
    // Accept kebab-case and optional BEM modifier: e.g.
    // .card-title, .card-title--editing
    "selector-class-pattern": [
      "^[a-z][a-z0-9]*(?:-[a-z0-9]+)*(?:--[a-z0-9]+(?:-[a-z0-9]+)*)?$",
      {
        resolveNestedSelectors: true,
        message:
          "Expected class selector to be kebab-case, optionally with a BEM modifier (--modifier).",
      },
    ],
    "selector-pseudo-class-no-unknown": [
      true,
      {
        ignorePseudoClasses: ["global", "deep", "slotted"],
      },
    ],
    "no-descending-specificity": null,
    // 1. Unplug the rgba vs rgb debate completely
    "color-function-alias-notation": null,

    // 2. Unplug the decimals vs percentages debate
    "alpha-value-notation": null,

    // 3. Let yourself use empty lines for readability
    "custom-property-empty-line-before": null,

    // 4. Stop it from yelling about your cascading duplicate variables
    "declaration-block-no-duplicate-custom-properties": null,
  },
};
