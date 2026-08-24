# 🚀 Implementation Blueprint — `track-1-director-quick-shot-2026-08-24`

> **Track Goal**: Minimize perceived turn latency ($\le 300\text{ms}$ p50) by consolidating Director dispatch into a fast 4-field **Director Quick Shot** (`next_action`, `keywords`, `directors_note`, `dynamics_deltas`) and offloading relational/promotion/memory persistence to the rolling **Back Shot**.  
> **Workflow**: `/01-plan -> /02-implement`  
> **Status**: `[~] ACTIVE`  
> **Track Spec**: [tracks/track-1-quick-shot.md](tracks/track-1-quick-shot.md)

---

## 1. Tactical Tasks

### Phase 1: Director Latency Instrumentation & Generation Mutex

- [x] `task-1.1`: **`RED`** Unit tests in `src/state/runtime.test.js` asserting Director latency recording (`last_director_ms`, `director_ms_pool`, `director_p50_ms`, `director_p95_ms`) and `generation_mutex` state.
- [x] `task-1.2`: **`GREEN`** Implement high-resolution timer (`performance.now()`) around Director LLM call in `src/intelligence/kernel.js` and record duration into `runtime.svelte.js` rolling ring buffer.
- [x] `task-1.3`: **`GREEN`** Expose `generation_mutex` in `src/state/runtime.svelte.js` allowing foreground streams to preempt/yield background tasks.

### Phase 2: Streamlined Quick Shot Schema & Prompt Pruning

- [x] `task-2.1`: **`RED`** Unit tests in `src/intelligence/prompts.test.js` & `src/intelligence/director.test.js` verifying the 4-field schema (`next_action`, `keywords` 1–3, `directors_note` 1–3 lines, `dynamics_deltas`), stripping `<AVAILABLE_SIGNATURE_COLORS>` from the Director prompt, and testing normalizers.
- [x] `task-2.2`: **`GREEN`** Update `DIRECTOR_JSON_SCHEMA` in `src/intelligence/prompts.js` to the streamlined 4-field payload and prune `<AVAILABLE_SIGNATURE_COLORS>`.
- [x] `task-2.3`: **`GREEN`** Update `src/intelligence/director.js` to normalize `next_action`, cap `keywords` at 3, sanitize `directors_note` to 1–3 lines, and strip legacy promotion/relationship fields.

### Phase 3: Genesis Inline Branch & Back Shot Pipeline Setup

- [x] `task-3.1`: **`RED`** Add test verifying `_apply_genesis` executes synchronously when `next_action === "GENESIS"` (passing signature color palette to genesis prompt) before speaker compilation.
- [x] `task-3.2`: **`GREEN`** Wire persistence offloading and round-freshness hooks for the Back Shot stream in `src/intelligence/kernel.js`.

---

## 2. Verification Gate

- Unit Tests: `npm run test:unit`
- Markdown & Code Lints: `npm run lint`
- Production Build: `npm run build`
- Telemetry Audit: p50 quick-shot $\le 300\text{ms}$ / p95 $\le 600\text{ms}$.
