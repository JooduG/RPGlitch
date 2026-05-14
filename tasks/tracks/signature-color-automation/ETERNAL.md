# ETERNAL: Signature Color Automation

## Objective

Fully automate the Signature Color pipeline by establishing `DESIGN.md` as the absolute Sovereign Source. The Weaver (`sync-tokens.js`) will dynamically generate the palette constants, eliminating hardcoded color mappings in `src/theme/palette.svelte.js` and hardcoded regex validation.

## Success Criteria

1.  **Dynamic Generation**: The Weaver automatically extracts ALL `foundations.colors` from `DESIGN.md` and generates `PALETTE` and `PALETTE_VARS` objects in `tokens.js`.
2.  **Robust Validation**: The Weaver's color validation regex is dynamic, based on the keys present in `DESIGN.md`.
3.  **Refactored Store**: `src/theme/palette.svelte.js` consumes the dynamically generated constants.
4.  **Zero Heresy**: Running `npm run audit:css` and `npm run test:unit` passes with 0 violations.

## Boundaries

- **Always**: Derive all color mappings directly from `DESIGN.md`.
- **Never**: Hardcode color names or hex values in `palette.svelte.js`.
- **Never**: Break the 4-tier architecture. All color primitives remain in `foundations.colors`.
