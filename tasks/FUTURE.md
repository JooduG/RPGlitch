# 🔍 TRACK: Tailwind Native Design Token Refactor

## Goal

Standardize all custom design variables to Tailwind v4 native namespaces directly in `DESIGN.md`, breaking backwards compatibility and updating all downstream JS and Svelte consumers.

## Steps

- [ ] Rename keys in `DESIGN.md` to use Tailwind namespaces (`color-`, `text-`, `spacing-`, `font-`).
- [ ] Refactor `sync-css.js` to strip `color-` prefixes when generating color labels in `PALETTE` and update output of `PALETTE_VARS` values.
- [ ] Re-run `npm run sync` to generate `design.css` and `tokens.js`.
- [ ] Update JS references in `src/engine/config.js` and `src/media/tokens.js`.
- [ ] Update Svelte templates to use native Tailwind utility classes.
- [ ] Update test files.
- [ ] Run `npm run verify` to test logic and style integrity.
