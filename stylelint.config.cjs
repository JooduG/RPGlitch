const master = require("./ignores.master.json");

/** @type {import('stylelint').Config} */
module.exports = {
  // One source of truth for ignore globs
  ignoreFiles: master.stylelintIgnore || [],
  extends: [
    "stylelint-config-standard-scss",
    "stylelint-config-html/svelte",
    "stylelint-prettier/recommended",
  ],
  plugins: [
    // This is the AI-killer plugin. It enforces variables over raw values.
    "stylelint-declaration-strict-value",
  ],
  overrides: [
    {
      files: ["**/*.svelte"],
      customSyntax: "postcss-html",
    },
    {
      // THE CHALK REGIME EXEMPTION:
      // We must allow raw values ONLY in the theme files where the tokens are born.
      files: ["src/theme/**/*.css"],
      rules: {
        "scale-unlimited/declaration-strict-value": null,
        "color-no-hex": null,
        "declaration-property-value-disallowed-list": null,
      },
    },
  ],
  rules: {
    /* ========================================================================
       [**] THE CHALK REGIME (AI HALLUCINATION DEFENSES)
       ======================================================================== */

    // FATAL: Block all raw hex codes globally outside of design.css
    "color-no-hex": [
      true,
      {
        message:
          "RPGlitch Engine [FATAL]: Hex codes are strictly forbidden. Use var(--color-*) from design.css.",
      },
    ],

    // FATAL: Force AI to use variables for structural and aesthetic properties
    "scale-unlimited/declaration-strict-value": [
      [
        "/color/", // Catches color, background-color, border-color
        "fill",
        "stroke",
        "/padding/", // Catches padding, padding-top, padding-left, etc.
        "/margin/", // Catches margin, margin-top, etc.
        "/border/", // Catches border, border-top, border-radius, etc.
        "top",
        "right",
        "bottom",
        "left",
        "gap",
        "font-size",
        "box-shadow",
        "text-shadow",
        "z-index",
      ],
      {
        expandShorthand: true,
        // Allow structural constants that aren't tied to the design system
        ignoreValues: [
          "/^var\\(--[a-z0-9-]+\\),?$/",
          "/^rgb\\(from var\\(--[a-z0-9-]+\\) r g b \\/ [0-9.]+\\),?$/",
          "/^0(%|px|rem|em)?( 0(%|px|rem|em)?)*,?$/", // Matches 0, 0 0, 0 0 0, etc.
          "/^100%?( 100%?)*,?$/",
          "/^50%?,?$/",
          "/^100v[hw],?$/",
          "0",
          "0,",
          "0%",
          "0%,",
          "0px",
          "0px,",
          "0 0",
          "0 0,",
          "0 0 0",
          "0 0 0,",
          "0 0 0 0",
          "100",
          "100,",
          "100%",
          "100%,",
          "100% 100%",
          "50%",
          "50%,",
          "25%",
          "25%,",
          "75%",
          "75%,",
          "100vh",
          "100vw",
          "transparent",
          "transparent,",
          "inherit",
          "initial",
          "currentColor",
          "currentcolor",
          "none",
          "auto",
          "inset",
          "1fr",
          "solid",
          "dashed",
          "dotted",
          "double",
          "fit-content",
          "max-content",
          "min-content",
          "rgb",
          "hsl",
          "from",
          "r",
          "g",
          "b",
          "h",
          "s",
          "l",
          "/",
          ",",
        ],
        message:
          "RPGlitch Engine [FATAL]: Raw values hallucinated! You MUST use a variable from design.css (e.g., var(--spacing-4)). Halt and read the tokens file.",
      },
    ],

    // Allow calc() multiplication of --spacing-unit and --spacing-pixel as per our dynamic scaling standard
    "declaration-property-value-disallowed-list": null,

    /* ========================================================================
       [**] STANDARD ARCHITECTURE RULES
       ======================================================================== */

    // Accept kebab-case and optional BEM modifier: e.g., .card-title, .card-title--editing
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

    /* ========================================================================
       [**] DEVELOPER SANITY OVERRIDES
       ======================================================================== */

    // Unplug the decimals vs percentages debate for alpha
    "alpha-value-notation": null,

    // Let yourself use empty lines for readability
    "custom-property-empty-line-before": null,

    // Stop it from yelling about cascading duplicate variables in design.css
    "declaration-block-no-duplicate-custom-properties": null,

    // Unplug modern color-function demands to preserve legacy RPGlitch palettes
    "color-function-notation": null,
  },
};
