# 🚀 Implementation Blueprint — `track-1-director-quick-shot-2026-08-24`

> **Track Goal**: Minimize perceived turn latency ($\le 300\text{ms}$ p50) by consolidating Director dispatch into a fast 4-field **Director Quick Shot** (`next_action`, `keywords`, `directors_note`, `dynamics_deltas`) and offloading relational/promotion/memory persistence to the rolling **Back Shot**.  
> **Workflow**: `/01-plan -> /02-implement`  
> **Status**: `[~] ACTIVE`  
> **Track Spec**: [tracks/track-1-quick-shot.md](tracks/track-1-quick-shot.md)

---

## 1. Tactical Tasks

### Phase 1: High-Resolution Quick Shot Instrumentation & Mutex Setup

- [ ] `task-1.1`: **`RED`** Write unit tests in `src/intelligence/kernel.test.js` asserting director timing capture on `runtime.last_director_ms` and `runtime.director_ms_pool` (ring buffer).
- [ ] `task-1.2`: **`GREEN`** Implement high-res timing in `src/intelligence/kernel.js` around the quick shot and retries; expose rolling p50/p95 in `runtime.svelte.js`.
- [ ] `task-1.3`: **`GREEN`** Create lightweight `generation_mutex` in `src/state/runtime.svelte.js` to coordinate foreground vs background LLM calls.

### Phase 2: Quick Shot Schema Streamlining (`next_action`, `keywords` 1-3, `directors_note`)

- [ ] `task-2.1`: **`RED`** Add unit tests in `src/intelligence/director.test.js` asserting normalization of `next_action`, `keywords` (1–3 items), `directors_note` (1–3 lines), and `dynamics_deltas`.
- [ ] `task-2.2`: **`GREEN`** Update `src/intelligence/prompts.js` to remove `<AVAILABLE_SIGNATURE_COLORS>` from the Director prompt, wire `directors_note` instructions (1–3 lines), and support 1–3 keywords from `<AVAILABLE_KEYWORDS>`.
- [ ] `task-2.3`: **`GREEN`** Update `src/intelligence/director.js` normalizer for unified `next_action` routing (`speaker`, `genesis`, `epilogue`).

### Phase 3: Genesis Inline Branch & Back Shot Pipeline Setup

- [ ] `task-3.1`: **`RED`** Add test verifying `_apply_genesis` executes synchronously when `next_action === "GENESIS"` (passing signature color palette to genesis prompt) before speaker compilation.
- [ ] `task-3.2`: **`GREEN`** Wire persistence offloading and round-freshness hooks for the Back Shot stream in `src/intelligence/kernel.js`.

---

## 2. Verification Gate

- Unit Tests: `npm run test:unit`
- Markdown & Code Lints: `npm run lint`
- Production Build: `npm run build`
- Telemetry Audit: p50 quick-shot $\le 300\text{ms}$ / p95 $\le 600\text{ms}$.
