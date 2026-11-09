const master = require("./ignores.master.json");

/** @type {import('stylelint').Config} */
module.exports = {
  // One source of truth for ignore globs (complemented by .stylelintignore)
  ignoreFiles: master.linters?.stylelint || [],
  extends: ["stylelint-config-standard", "stylelint-config-html/svelte", "stylelint-prettier/recommended"],
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

    // Permit modern or legacy @import syntax
    "import-notation": null,

    // Permit decimal or percentage notation for alpha channel
    "alpha-value-notation": null,

    // Custom properties: allow grouping without forced blank lines
    "custom-property-empty-line-before": null,
  },
};
