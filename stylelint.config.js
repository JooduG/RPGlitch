import { createRequire } from "module";
const require = createRequire(import.meta.url);
const master = require("./ignores.master.json");

/** @type {import('stylelint').Config} */
export default {
  // one source of truth for ignore globs
  ignoreFiles: master.stylelintIgnore || [],
  extends: ["stylelint-config-standard", "stylelint-config-standard-scss"],
  overrides: [{ files: ["**/*.scss"], customSyntax: "postcss-scss" }],
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
    "no-descending-specificity": null,
    "color-function-notation": null,
  },
};
