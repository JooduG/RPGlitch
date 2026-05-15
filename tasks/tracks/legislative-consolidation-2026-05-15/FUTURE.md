# 🚀 FUTURE: Legislative Consolidation Plan

## Phase 1: Foundation Refactor (The Reflex)

- [x] Refactor `warden.js` to support nomenclature rules in its main loop.
- [x] Standardize the `Auditor` class to handle dynamic rule loading.
- [x] Update `package.json` to route primary audits through consolidated `warden.js`.

## Phase 2: Domain Rule Migration

- [x] Refactor `audit-nomenclature.js` to export a standard `nomenclatureRules` array.
- [x] Refactor `audit-skills.js` to ensure `skill_rules` are fully compatible.
- [x] Refactor `audit-templates.js` for export parity.
- [x] Refactor `warden-project.js` for export parity.

## Phase 3: Cleanup & Verification

- [x] Remove redundant `scan` functions and main entry points from constituent scripts.
- [x] Run full project audit and verify no regressions in violation detection.
- [x] Verify "HERESY" gate (exit 1) still works by creating a temporary violation.

## Phase 4: Metadata & Pulse Sync

- [x] Update `tasks/PRESENT.md` with the new track.
- [x] Log completion in the Skill Log.
