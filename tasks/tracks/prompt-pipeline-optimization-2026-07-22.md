---
id: prompt-pipeline-optimization-2026-07-22
type: refactor
status: in-progress
created_at: 2026-07-22
updated_at: 2026-07-22
description: Optimize prompt synthesis, prefix caching, protocol library tokens, and history caching across the Intelligence Kernel.
---

# 🚀 Track: Prompt Pipeline Optimization & Cache Architecture

## ETERNAL (The Spec)

### Objective

Optimize the RPGlitch prompt pipeline across 4 major performance vectors:

1. **Protocol Library Consolidation**: Deduplicate and compact verbose rule strings in `PROTOCOL_LIBRARY`.
2. **Prefix-Cache Re-ordering**: Partition `render_character` into a stable `<SYSTEM>` prefix (100% prompt cache hits) and a volatile `<SCENE_STATE>` suffix.
3. **Shot 1 (Director) Token Compaction**: Retain non-physical state (`PRESENT_NON_PHYSICAL`, `ETERNAL_NON_PHYSICAL`, `FUTURE` vectors) for physics calculation while stripping non-essential narrative prose protocols.
4. **History Cache Key Optimization**: Key message history caches by message ID to prevent re-parsing clean past messages on every turn.

### Success Criteria

- **Unit Tests**: All 259+ Vitest tests pass cleanly (`npm test`).
- **Prompt Token Savings**: ~20-30% reduction in system prompt token overhead per turn.
- **Prefix Cache Hit Rate**: High cache hit potential by maintaining identical system prefixes between turns.
- **Physics Continuity**: Uncompromised state mutation accuracy in Shot 1.

### Boundaries

- **Always**: Maintain third-person limited POV integrity and epistemic physics rules.
- **Always**: Keep non-physical fields in Shot 1 for Director dynamics settlement.
- **Never**: Break Svelte 5 rune reactivity or Dexie DB schema persistence.

---

## FUTURE (Implementation Plan)

### Phase 1: Protocol Library Consolidation & Deduplication (Pillar 4)

- [x] **RED**: Add protocol length & formatting assertion tests in `prompts.test.js`.
- [x] **GREEN**: Refactor `PROTOCOL_LIBRARY` in `src/intelligence/prompts.js` to deduplicate rules (`HYGIENE`, `COGNITION`, `USER_AGENCY`, `MOMENTUM`, `MARKDOWN_FORMAT`).
- [x] **REFACTOR**: Verify test suite passes (`npm test`).

### Phase 2: Prefix-Cache System Prompt Re-ordering (Pillar 1)

- [x] **RED**: Add system prompt structure test in `prompts.test.js` verifying `<SYSTEM>` is stable and `<SCENE_STATE>` is appended.
- [x] **GREEN**: Re-order `render_character` in `src/intelligence/prompts.js` so static identity, narrative style, epistemic physics, and protocols sit in `<SYSTEM>`, while dynamic sliders (`chaos`, `intensity`) and present/past/future vectors sit in `<SCENE_STATE>`.
- [x] **REFACTOR**: Verify `prompts.test.js` and `kernel.test.js` pass cleanly.

### Phase 3: Shot 1 (Director) Protocol & Token Compaction

- [x] **RED**: Add Director prompt schema test in `prompts.test.js` validating presence of non-physical traits and exclusion of verbose prose protocols.
- [x] **GREEN**: Update `render_director` in `src/intelligence/prompts.js` to supply only `JSON_OUTPUT` protocol while keeping `PRESENT_NON_PHYSICAL`, `ETERNAL_NON_PHYSICAL`, and `FUTURE` vectors.
- [x] **REFACTOR**: Verify `kernel.test.js` passes cleanly.

### Phase 4: History Cache Key Optimization (Pillar 3)

- [x] **RED**: Add test in `context.test.js` for message text caching by ID.
- [x] **GREEN**: Update `RAW_CACHE` / snapshot formatting in `src/intelligence/context.svelte.js` to key cached sanitized text by message ID instead of transient object reference.
- [x] **REFACTOR**: Verify all intelligence tests pass.

### Phase 5: Verification & Full Suite Audit

- [x] **VERIFY**: Run full local verification (`npm test`).
- [x] **AUDIT**: Ensure 0 regressions.

---

## PRESENT (The State)

- **Active Track**: `prompt-pipeline-optimization-2026-07-22`
- **Active Phase**: Phase 1 (Protocol Library Consolidation)
- **Status**: [~] In Progress
