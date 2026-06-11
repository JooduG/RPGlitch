# 🔮 TRACK: Flatten Palette & Optimize Tokens

## Goal

Flatten the `ThemeStore` pseudo-class from `palette.svelte.js` into pure JavaScript functions, and merge them with `tokens.js`. Update `sync-css.js` to inject auto-generated design data securely inside designated comment boundaries in `tokens.js`, eliminating `palette.svelte.js`.

## Research

- `src/media/palette.svelte.js` contains the `ThemeStore` class which uses no Svelte runes.
- `src/media/tokens.js` contains auto-generated JSON tokens.
- `sync-css.js` currently overwrites `tokens.js` entirely.
- UI components import `themeStore` and call methods on the class instance.

## Audit & Verification

- Unit tests (`optics.test.js`, `normalizer.test.js`, `palette.test.js`) must be updated.
- `npm run sync:css` must successfully inject JSON between `// --- BEGIN AUTO-GENERATED TOKENS ---` boundaries without deleting logic.
- UI must remain stable and linted.

## Steps

- [ ] Initialize `tokens.js` with pure math logic and the boundary block.
- [ ] Update `sync-css.js` to inject within the boundaries of `tokens.js`.
- [ ] Delete `palette.svelte.js`.
- [ ] Update `index.js` and all UI consumers.
- [ ] Run test and lint checks.
