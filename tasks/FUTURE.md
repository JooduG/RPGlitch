# 🚀 Implementation Blueprint — `remediate-stress-test-issues-2026-08-12`

> **Track Goal**: Remediate the 7 runtime issues identified in `long-term-review-4.md` (Fractal future standing agenda stagnation, `session_driver._active_id` reload sync, ONNX WASM embed recovery, Director terse thought formatting, reply length allocation, and telemetry logging completeness).

---

## 🎯 Goal & Specifications

1. **Fractal Future Standing Agenda Progression**:
   - Update `prompts.js` (`render_memory`) to mandate non-empty `future_consolidated` for `FRACTAL` entities on every forge run.
   - Update `temporal.js` to fallback refreshed fractal agendas when LLM output is empty.

2. **Session Driver Reload Sync**:
   - Update `runtime.sync()` in `src/state/runtime.svelte.js` to invoke `session_driver.set_active()` when `simulation_story_id` is restored on reload.

3. **ONNX WASM Error Recovery**:
   - Update `load_model()` and `embed()` in `src/intelligence/embeddings.svelte.js` to fallback to main-thread ONNX execution (`wasm.proxy = false`) if WebWorker WASM fails, and auto-retry pipeline init on error.

4. **Director Terse Thought Formatting & Telemetry**:
   - Update terse Director schema in `prompts.js` and retry handling in `kernel.js` to preserve `_thought_process` and `<think>` block bold-key formatting (`**Reasoning:**`).
   - Log `MEMORY_FORMATION` telemetry entries in `temporal.js` for all target entities.

---

## 📋 Task Checklist

- [x] **Phase 1: Engine Persistence & Session Sync**
  - [x] **Step 1.1 (RED)**: Write unit test in `src/state/runtime.test.js` asserting `session_driver.active_id` is restored during `runtime.sync()`.
  - [x] **Step 1.2 (GREEN)**: Update `runtime.sync()` in `src/state/runtime.svelte.js` to call `session_driver.set_active()`.
  - [x] **Step 1.3 (VERIFY)**: Run `npx vitest run src/state/runtime.test.js`.

- [x] **Phase 2: RAG Vector Engine & ONNX WASM Resilience**
  - [x] **Step 2.1 (RED)**: Write unit test in `src/intelligence/embeddings.test.js` for WASM worker proxy fallback and embed error retry.
  - [x] **Step 2.2 (GREEN)**: Enhance `load_model()` and `embed()` in `src/intelligence/embeddings.svelte.js` to fallback `wasm.proxy = false` and re-init pipeline on error.
  - [x] **Step 2.3 (VERIFY)**: Run `npx vitest run src/intelligence/embeddings.test.js`.

- [x] **Phase 3: Intelligence Kernel & Prompts Optimization**
  - [x] **Step 3.1 (RED)**: Write unit tests in `src/intelligence/prompts.test.js` and `temporal.test.js` asserting fractal future requirements and memory formation telemetry.
  - [x] **Step 3.2 (GREEN)**: Update `render_memory` in `prompts.js`, `temporal.js` forge logic & telemetry, and `kernel.js` director terse handling.
  - [x] **Step 3.3 (VERIFY)**: Run `npx vitest run src/intelligence`.

- [x] **Phase 4: Full System Verification & Quality Gate**
  - [x] **Step 4.1**: Run `npm run verify` (lint + audit + Vitest suite).
  - [x] **Step 4.2**: Run `npm run build` to verify clean singlefile production build.
