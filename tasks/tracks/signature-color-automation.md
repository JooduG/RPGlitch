# Plan: Signature Color Automation

## Objective

Fully automate the Signature Color pipeline by establishing `DESIGN.md` as the absolute Sovereign Source. The Weaver (`sync-tokens.js`) will dynamically generate the palette constants, eliminating hardcoded color mappings in `src/theme/palette.svelte.js` and hardcoded regex validation.

## Key Files & Context

- `DESIGN.md`: The Sovereign Source.
- `.agents/skills/css/scripts/sync-tokens.js`: The Weaver that generates code.
- `src/theme/palette.svelte.js`: The reactive theme store currently holding hardcoded colors.
- `src/theme/tokens.js`: The generated JS bridge.

## Proposed Solution

1.  **Refactor Weaver Pattern Matching**: Modify `CATEGORY_RULES` in `sync-tokens.js`. Instead of a hardcoded list of color names, the Weaver will rely on the `colors` category in the YAML hierarchy to classify tokens as colors.
2.  **Generate Palette Constants**: Update `generateJSBridge` in `sync-tokens.js` to output `PALETTE` and `PALETTE_VARS` containing all foundation colors.
    - Generate human-readable labels (e.g., `electric-cyan` -> `Electric Cyan`).
3.  **Refactor Palette Store**: Update `src/theme/palette.svelte.js` to import `PALETTE` and `PALETTE_VARS` from the generated `tokens.js` bridge.
4.  **Verification**: Ensure all tests (`npm run test:unit`) and audits (`npm run audit:css`) pass.

## Implementation Steps

### Phase 1: Weaver Upgrade

1.  Update `.agents/skills/css/scripts/sync-tokens.js`.
2.  Add logic to `generateJSBridge` to construct `PALETTE` and `PALETTE_VARS` from `data.foundations.colors`.
3.  Run `npm run sync:design`.

### Phase 2: Theme Store Refactor

1.  Update `src/theme/palette.svelte.js` to remove the hardcoded `PALETTE` and `PALETTE_VARS` objects.
2.  Import `PALETTE` and `PALETTE_VARS` from `@theme/tokens.js`.

### Phase 3: Verification

1.  Run `npm run audit:css` to ensure no Heresy.
2.  Run `npm run test:unit` to verify the palette store logic remains intact.

## Verification & Testing

- `src/theme/palette.test.js` verified.
- Warden checks pass.
