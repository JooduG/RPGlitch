# FUTURE: Signature Color Automation

## Phase 1: Weaver Upgrade

- [x] **Task 1.1**: Update `CATEGORY_RULES` in `.agents/skills/css/scripts/sync-tokens.js` to remove hardcoded color names.
- [x] **Task 1.2**: Refactor `generateJSBridge` in `.agents/skills/css/scripts/sync-tokens.js` to dynamically build `PALETTE` and `PALETTE_VARS` from `data.foundations.colors`.
- [x] **Task 1.3**: Run `npm run sync:design` and verify `src/theme/tokens.js` contains the new objects.

## Phase 2: Theme Store Refactor

- [x] **Task 2.1**: Update `src/theme/palette.svelte.js` to remove hardcoded `PALETTE` and `PALETTE_VARS`.
- [x] **Task 2.2**: Import `PALETTE` and `PALETTE_VARS` from `@theme/tokens.js`.
- [x] **Task 2.3**: Verify logic in `get_signature_label` and `get_signature_color`.

## Phase 3: Verification

- [x] **Task 3.1**: Run `npm run audit:css` to ensure no Heresy.
- [x] **Task 3.2**: Run `npm run test:unit` to verify palette tests.
- [x] **Task 3.3**: Final check of `src/core/engine/config.js` and other consumers.

---

> ⚒️ Operations | `incremental-implementation` | /02-implement
