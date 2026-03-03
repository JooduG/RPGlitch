# Spec: SCSS Token Standardization

## 🎯 Goal

Perform a codebase-wide hygienic sweep to replace hardcoded SCSS values (colors, spacing, typography, opacity) with the unified design tokens defined in `src/theme/abstracts/_variables.scss`.

## 📏 Success Criteria

1. **Zero Hardcoded Colors**: No stray `#hex`, `rgb()`, or `rgba()` values in component SCSS outside of `_variables.scss` (unless mathematically derived from a token).
2. **Unified Spacing**: Padding, margins, border radii, and gaps exclusively use `$spacing-*` variables or mathematically derived values.
3. **Typography Compliance**: Font sizes and weights rely on `$font-size-*` and `$font-bold`.
4. **Visual Parity**: The UI must look visually identical before and after the refactoring.

## 🛡️ Constraints (Physics)

- Must adhere strictly to Svelte 5 component-scoped SCSS or designated theme tokens.
- No Tailwind CSS.
- All standardizations must pass SCSS linting rules and verify build passes.
