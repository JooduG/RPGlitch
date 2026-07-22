# 📜 FUTURE (The Muscle)

> **Role**: Active implementation blueprint for the _current_ track.
> **Status**: Active (`prompt-pipeline-optimization-2026-07-22`).

This file mirrors the active implementation plan from [`tasks/tracks/prompt-pipeline-optimization-2026-07-22.md`](./tracks/prompt-pipeline-optimization-2026-07-22.md).

## 🚀 Active Mission: Prompt Pipeline Optimization

Track ID: `prompt-pipeline-optimization-2026-07-22`

### Phase 1: Protocol Library Consolidation & Deduplication (Pillar 4)

- [x] **RED**: Add protocol length & formatting assertion tests in `prompts.test.js`.
- [x] **GREEN**: Refactor `PROTOCOL_LIBRARY` in `src/intelligence/prompts.js` to deduplicate rules.
- [x] **REFACTOR**: Verify test suite passes (`npm test`).

### Phase 2: Prefix-Cache System Prompt Re-ordering (Pillar 1)

- [x] **RED**: Add system prompt structure test in `prompts.test.js`.
- [x] **GREEN**: Re-order `render_character` in `src/intelligence/prompts.js` to separate static `<SYSTEM>` from volatile `<SCENE_STATE>`.
- [x] **REFACTOR**: Verify `prompts.test.js` and `kernel.test.js` pass cleanly.

### Phase 3: Shot 1 (Director) Protocol & Token Compaction

- [x] **RED**: Add Director prompt schema test in `prompts.test.js`.
- [x] **GREEN**: Update `render_director` to supply `JSON_OUTPUT` protocol while preserving non-physical state vectors.
- [x] **REFACTOR**: Verify `kernel.test.js` passes cleanly.

### Phase 4: History Cache Key Optimization (Pillar 3)

- [x] **RED**: Add test in `context.test.js` for message text caching by ID.
- [x] **GREEN**: Update text caching in `src/intelligence/context.svelte.js` to key by message ID.
- [x] **REFACTOR**: Verify all intelligence tests pass.

### Phase 5: Verification & Full Suite Audit

- [x] **VERIFY**: Run full local verification (`npm test`).

## 🗺️ Roadmap (Tracks)

The canonical roadmap lives in [`PRESENT.md`](./PRESENT.md).
