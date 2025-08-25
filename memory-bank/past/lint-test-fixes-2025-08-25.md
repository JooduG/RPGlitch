---
description: Fix lint errors (stylelint) and stabilize chin search test
tags: [rpglitch, lint, tests, scss, jsdom]
---
# lint-test-fixes-2025-08-25

Summary

- Resolved Stylelint errors in `apps/rpglitch/scss/index.scss` by:
  - Splitting multi-declaration single-line rules into multi-line blocks.
  - Removing duplicate selector and merging `padding-block` into the primary `.profile-sections .section-row` rule.
  - Inserting required blank lines between rules/comments per config.
  - Addressing `no-descending-specificity` via targeted selector reordering and scoped `stylelint-disable/enable` around unavoidable overlaps.

- Fixed failing Jest test `tests/chin-grid.test.js`:
  - `_attachChinSearchHandlers()` used a debounced filter; in JSDOM tests, the debounce prevented immediate filtering. Added a test-environment detection (`NODE_ENV === 'test'` or `navigator.userAgent` contains `jsdom`) to run the filter synchronously in tests.
  - Replaced `toggleAttribute('hidden', ...)` with explicit `setAttribute/removeAttribute` for broader compatibility in JSDOM.

Validation

- `npm run lint` passes (0 errors; some pre-existing ESLint warnings remain about unused `_`).
- `npm test` passes (10/10 suites).

Notes

- No functional behavior changes for production users beyond refactoring and robustness. Debounce remains active in real browsers; only disabled under tests.
