# 🎯 Active Track Implementation Plan: Track Data & Definitions Hardening

**Track ID**: `track-data-definitions-hardening-2026-08-28`  
**Dependencies**: `tasks/PRESENT.md`  
**Status**: `[~]` In Progress

---

## 1. Goal & Architectural Overview

Remediate all issues identified in the `src/data/` and `src/data/definitions/` review:

1. **Canonical Voice Register**: Unify voice register constants (`plain`, `ornate`, `raw`, `clinical`) in a single source of truth (`src/data/definitions/registers.js`), wire into `normalizer.js`, `detox-rules.js`, and `profile-pipeline.js`.
2. **Export Preservation**: Fix `serialize_entity_for_export` in `normalizer.js` to preserve `chapters` and non-memory object arrays during JSON serialization.
3. **Premade Fallback Normalization**: Ensure `repository.js` normalizes premades returned from the map fallback.
4. **Dynamics & Type Defense**: Add numeric coercion and 1-100 clamping for `dynamics` in `normalizer.js`.
5. **Fresh-Clone Test Guard**: Ensure `signature-colors.js` stub/generation is safe for test runners on fresh checkouts.
6. **Test Coverage Expansion**: Add direct unit tests for `profile-fields.js` and `sessions.svelte.js` auto-roster logic.

---

## 2. Technical Alignments & Design Rules

- **Zero Backwards Compatibility**: Remove invalid register fallback hacks (`"low_curt"`), enforce exact canonical registers.
- **Layer Sovereignty**: Keep definitions pure within `src/data/definitions/`.

---

## 3. Tactical Phases

### Phase 1: Canonical Voice Registers & Genesis Defaults

- [ ] `task-1.1`: **`RED`** Add unit tests for `VOICE_REGISTERS` in `src/data/definitions/detox-rules.test.js` and `normalizer.test.js` asserting `raw` and `clinical` are preserved across normalization.
- [ ] `task-1.2`: **`GREEN`** Create `src/data/definitions/registers.js`, update `normalizer.js`, `detox-rules.js`, and `profile-pipeline.js`.

### Phase 2: JSON Export Roundtrip & Chapters Preservation

- [ ] `task-2.1`: **`RED`** Add unit tests asserting `chapters` array and nested custom objects are fully preserved in `serialize_entity_for_export`.
- [ ] `task-2.2`: **`GREEN`** Update `serialize_entity_for_export` in `normalizer.js` to only filter memory vector arrays (`past`).

### Phase 3: Repository Premade Fallback & Dynamics Defense

- [ ] `task-3.1`: **`RED`** Test `entities.get` fallback normalization and dynamics clamping.
- [ ] `task-3.2`: **`GREEN`** Update `repository.js` and `normalizer.js`.

### Phase 4: Extended Test Coverage (`profile-fields.js` & `sessions.svelte.js`)

- [ ] `task-4.1`: Create `src/data/definitions/profile-fields.test.js` testing taxonomy, catalog, leaf mapping, and section generator.
- [ ] `task-4.2`: Create `src/data/sessions.test.js` testing `create_from_selection` auto-roster and bond casting.

---

## 4. Verification Gate & Acceptance Criteria

- [ ] All 49+ test suites pass with 0 errors and 0 lint warnings (`npm run verify`).
