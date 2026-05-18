# ETERNAL: Signature Color Consolidation

## Objective

Consolidate the automation and hardening of the Signature Color pipeline to establish `DESIGN.md` as the absolute Sovereign Source of truth and eliminate visual anomalies.
This combines:
1. **Signature Color Automation**: The Weaver (`sync-tokens.js`) dynamically generates the palette constants, eliminating hardcoded color mappings in `src/theme/palette.svelte.js` and hardcoded validation rules.
2. **Signature Color Hardening**: The `ThemeStore` color resolution logic is hardened to ensure that entity signature colors always resolve to vibrant, Nordic-compliant tokens, preventing white-background text contrast anomalies even when entity data is missing or corrupted.

## Success Criteria

1. **Dynamic Generation**: The Weaver automatically extracts all `foundations.colors` from `DESIGN.md` and generates `PALETTE` and `PALETTE_VARS` objects in `src/theme/tokens.js`.
2. **Safe Registry Filtering**: `SIGNATURE_COLORS` dynamically filters out backgrounds, neutrals, and non-vibrant utility colors from the palette to define a safe whitelist.
3. **Hardened Theme Store**: `ThemeStore.get_deterministic_color` hashes seed strings deterministically into the safe `SIGNATURE_COLORS` whitelist. `ThemeStore.get_signature_color` enforces a safe fallback for null, undefined, or empty-string inputs.
4. **Zero Heresy**: Running `npm run audit:css` and unit tests (`npm run test:unit`) passes with 0 violations.

## Boundaries

- **Always**: Derive all color mappings directly from `DESIGN.md`.
- **Never**: Hardcode color names or hex values in `palette.svelte.js` or `sync-tokens.js`.
- **Never**: Return backgrounds or neutral tones for signature color resolution.
- **Never**: Break the 4-tier design system architecture.
