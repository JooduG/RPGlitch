# FUTURE: Signature Color Consolidation

## Phase 1: Weaver Upgrade & Automation

- [x] **Task 1.1**: Update `CATEGORY_RULES` in `.agents/skills/css/scripts/sync-tokens.js` to remove hardcoded color names. (Ref: `fc452b0a`)
- [x] **Task 1.2**: Refactor `generateJSBridge` in `.agents/skills/css/scripts/sync-tokens.js` to dynamically build `PALETTE` and `PALETTE_VARS` from `data.foundations.colors`. (Ref: `fc452b0a`)
- [x] **Task 1.3**: Run `npm run sync:design` and verify `src/media/tokens.js` contains the new objects. (Ref: `fc452b0a`)

## Phase 2: Theme Store Refactor & Hardening Whitelist

- [x] **Task 2.1**: Update `src/theme/palette.svelte.js` to remove hardcoded `PALETTE` and `PALETTE_VARS` and import them from `@theme/tokens.js`. (Ref: `fc452b0a`)
- [x] **Task 2.2**: Define `SIGNATURE_COLORS` whitelist in `src/theme/palette.svelte.js` to dynamically filter out background, neutral, and non-vibrant utility colors. (Ref: `fc452b0a`)
- [x] **Task 2.3**: Refactor `ThemeStore.get_deterministic_color` to only hash and return vibrant colors from `SIGNATURE_COLORS`. (Ref: `fc452b0a`)
- [x] **Task 2.4**: Update `ThemeStore.get_signature_color` to enforce a safe, hard default (e.g., `electric-cyan`) for null/undefined inputs and handle empty entities gracefully. (Ref: `fc452b0a`)

## Phase 3: Verification & Audits

- [x] **Task 3.1**: Run `npm run audit:css` to ensure no Heresy. (Ref: `fc452b0a`)
- [x] **Task 3.2**: Update `src/theme/palette.test.js` to cover deterministic consistency, whitelist compliance, and fallback safety. (Ref: `fc452b0a` / `b25ce934`)
- [x] **Task 3.3**: Run `npm run test` to verify all unit tests pass (100% green). (Ref: `fc452b0a` / `b25ce934`)

---

> ⚒️ Operations | `incremental-implementation` | /02-implement
