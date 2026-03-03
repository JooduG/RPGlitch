# Plan: SCSS Token Standardization

## 1. Audit & Preparation (<1hr)

- Run a global search for hardcoded hex codes (`#`), `rgba()`, and absolute measurements (`px`, `rem`) across `src/ui/**/*.svelte` and `src/theme/**/*.scss`.
- Document any missing variables in `_variables.scss` if functionally unique colors or critical spacing tiers are discovered that require formalization.

## 2. Color & Opacity Replacement (1hr)

- Replace all hardcoded colors with semantic / palette tokens (e.g., `$gunmetal`, `$chalk`, `$app-muted`, `$signature-*`).
- Replace hardcoded opacities or transparent RGBA blends with `$glass-*` presets or `rgba($color, $opacity-*)`.

## 3. Spacing & Typography Standardization (1hr)

- Convert all padding, margin, gap, and dimension offsets to `$spacing-*` variables or relative `rem` values.
- Enforce `$font-size-*` tokens for typography hierarchies.

## 4. Quality Gate & Verification (<1hr)

- Run `npm run verify` to ensure SCSS linting passes (`svelte-check` and `eslint`).
- Perform visual QA on key interfaces (Story Mode, Profile Modal) to guarantee absolute visual parity with the pre-refactored state.
