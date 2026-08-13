# 🚀 Implementation Blueprint — `track-codebase-improvements-2026-08-13`

> **Track Goal**: Execute approved architectural optimizations across `src/` (Areas A–E):
>
> 1. Layer Boundary Decoupling: Move `IMAGE_TRIGGER` from `src/engine/config.js` to `src/intelligence/dynamics.js`, eliminating upward import from `kernel.js`.
> 2. Cognitive Refactoring: Extract `_resolve_image_trigger()` helper in `src/intelligence/kernel.js`.
> 3. Audio Lifecycle: Add explicit `teardown()` method to `AudioEngine` in `src/media/audio.svelte.js`.
> 4. Export Pruning: Prune unused zero-reference exports across `temporal.js`, `app.svelte.js`, `log.svelte.js`, `Storyboard.svelte.js`, `normalizer.js`, and `embedding-serialization.js`.

---

## 🎯 Goal & Specifications

1. **Layer Boundary Decoupling (Area A & C)**:
   - Move `IMAGE_TRIGGER` configuration to `src/intelligence/dynamics.js`.
   - Re-export in `src/engine/config.js` for backward compatibility.
   - Update `src/intelligence/kernel.js` to import `IMAGE_TRIGGER` from `@intelligence/dynamics.js`.

2. **Cognitive Refactoring (Area A)**:
   - Extract `_resolve_image_trigger` helper inside `src/intelligence/kernel.js` to simplify `execute_turn`.

3. **Media Layer Audio Lifecycle (Area B)**:
   - Add an explicit `teardown()` method on `audio_engine` in `src/media/audio.svelte.js` that cleanly closes `AudioContext` and flushes playback queues.

4. **Dead Code & Export Surface Pruning (Areas A, C, D, E)**:
   - Prune unreferenced exports in `src/intelligence/temporal.js`, `src/state/app.svelte.js`, `src/state/log.svelte.js`, `src/ui/Storyboard.svelte.js`, `src/data/normalizer.js`, and `src/utils/embedding-serialization.js`.

---

## 📋 Task Checklist

- [x] **Phase 1: Layer Boundary Decoupling & Cognitive Refactoring**
  - [x] **Step 1.1 (RED)**: Write/update unit test in `src/intelligence/dynamics.test.js` asserting `IMAGE_TRIGGER` exports and thresholds.
  - [x] **Step 1.2 (GREEN)**: Move `IMAGE_TRIGGER` to `src/intelligence/dynamics.js`, re-export in `src/engine/config.js`, and update `src/intelligence/kernel.js`.
  - [x] **Step 1.3 (REFACTOR)**: Extract `_resolve_image_trigger` helper in `src/intelligence/kernel.js`.
  - [x] **Step 1.4 (VERIFY)**: Run `npx vitest run src/intelligence/dynamics.test.js src/intelligence/kernel.test.js`.

- [x] **Phase 2: Audio Lifecycle Teardown**
  - [x] **Step 2.1 (RED)**: Write unit test in `src/media/audio.test.js` asserting `teardown()` cleanly closes/suspends AudioContext and flushes buffers.
  - [x] **Step 2.2 (GREEN)**: Implement `teardown()` in `src/media/audio.svelte.js`.
  - [x] **Step 2.3 (VERIFY)**: Run `npx vitest run src/media/audio.test.js`.

- [x] **Phase 3: Export Surface Pruning**
  - [x] **Step 3.1 (GREEN)**: Prune unused exports in `temporal.js`, `app.svelte.js`, `log.svelte.js`, `Storyboard.svelte.js`, `normalizer.js`, `embedding-serialization.js`.
  - [x] **Step 3.2 (VERIFY)**: Run `tmp/audit-src.cjs` to confirm 0 layer boundary violations and 0 dangling zero-ref exports.

- [x] **Phase 4: Full Verification & Quality Gate**
  - [x] **Step 4.1**: Run `npm run verify` (lint + audit + vitest suite: 34 test files, 448 tests passed, 0 errors).
  - [x] **Step 4.2**: Run `npm run build` to verify singlefile bundle (dist/index.html 1,275.37 kB).
