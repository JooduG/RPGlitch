---
id: remediate-stress-test-issues-2026-08-12
type: bug
status: in-progress
created_at: 2026-08-12
updated_at: 2026-08-12
description: Fix 7 stress-test issues from long-term-review-4 (Fractal future stagnation, session_driver reload sync, ONNX WASM recovery, Director terse thought formatting, and telemetry logging).
---

# 🏛️ ETERNAL — Track Specification

## Objective

Remediate the 7 runtime issues identified in [long-term-review-4.md](file:///c:/Users/johng/source/repos/RPGlitch/.agents/skills/simulation/data/long-term-review-4.md) to guarantee unbroken 30+ round story continuity, local-first session resilience across browser reloads, resilient 384-dim semantic RAG vector retrieval, and 100% telemetry completeness.

## Success Criteria

1. **Fractal Future Progression**: Memory Forge forces a refreshed `future_consolidated` standing agenda on every forge run; fractal agendas never stall post-climax.
2. **Session Driver Reload Parity**: `session_driver._active_id` is automatically restored during `runtime.sync()` on page reload; `require_active()` never throws `No active session found`.
3. **ONNX WASM Error Resilience**: `embeddings.svelte.js` falls back to main-thread ONNX execution if WASM worker proxy fails, and automatically re-initializes on pipeline error.
4. **Director Terse Thought Formatting**: Terse Director retries preserve `_thought_process` and maintain `<think>` block `**Reasoning:**` bold-key formatting.
5. **Telemetry Logging Parity**: `MEMORY_FORMATION` system entries are logged for all target entities on every forge run.
6. **Local CI Pass**: `npm run verify` passes cleanly with 0 errors and 0 warnings.

---

## 🚀 FUTURE — Implementation Roadmap

## Phase 1: Engine Persistence & Session Sync

- [ ] **Step 1.1 (RED)**: Write test in `src/state/runtime.test.js` asserting `session_driver.active_id` is synchronized during `runtime.sync()`.
- [ ] **Step 1.2 (GREEN)**: Update `runtime.sync()` in `src/state/runtime.svelte.js` to call `session_driver.set_active()` when `simulation_story_id` is restored.
- [ ] **Step 1.3 (VERIFY)**: Verify session restoration unit tests pass.

## Phase 2: RAG Vector Engine & ONNX WASM Resilience

- [ ] **Step 2.1 (RED)**: Write unit tests in `src/intelligence/embeddings.test.js` simulating WASM worker initialization failure and embedding retry.
- [ ] **Step 2.2 (GREEN)**: Enhance `load_model()` and `embed()` in `src/intelligence/embeddings.svelte.js` to handle WASM worker proxy failure by falling back to main thread and re-initializing the pipeline on error.
- [ ] **Step 2.3 (VERIFY)**: Verify embedding tests pass cleanly.

## Phase 3: Intelligence Kernel & Prompts Optimization

- [ ] **Step 3.1 (RED)**: Write unit tests in `src/intelligence/prompts.test.js` and `temporal.test.js` asserting non-empty fractal `future_consolidated` directives and `MEMORY_FORMATION` logging for all targets.
- [ ] **Step 3.2 (GREEN)**: Update `render_memory` in `src/intelligence/prompts.js` to require non-empty standing agendas for fractals; update `temporal.js` to fallback fractal agendas if empty and log telemetry for all targets.
- [ ] **Step 3.3 (GREEN)**: Update `DIRECTOR_JSON_SCHEMA` and `kernel.js` terse retry handling to preserve `_thought_process` and `<think>` block formatting.
- [ ] **Step 3.4 (VERIFY)**: Run `src/intelligence` test suite.

## Phase 4: Full System Verification

- [ ] **Step 4.1**: Run `npm run verify` (lint + audit + Vitest suite).
- [ ] **Step 4.2**: Verify clean singlefile bundle compilation (`npm run build`).

---

## 🛰️ PRESENT — Active Execution Board

- **Active Task**: Phase 1: Engine Persistence & Session Sync
- **Status**: [~] In Progress
- **Pulse Log**:
  - `2026-08-12 12:10` | Track Initialized | `/01-plan` / `planning` | 🔄 Active
