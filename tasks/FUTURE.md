# 📜 FUTURE (The Muscle)

> **Role**: Active implementation blueprint for the _current_ track.
> **Status**: Complete — all 5 phases implemented + tested (awaiting local `npm run verify` + `npm run build`)
> **Tracks**: `memory-engine-tuning-2026-08-03` ✅ · `engine-stability-fixes-2026-08-03` ✅

---

## 🎯 Active Goal

Two coordinated workstreams on the live engine:

1. **Memory Engine & Temporal Mechanics** — recalibrate recency-vs-semantic scoring so relevant old memories are not drowned out, upgrade the embedding cache to a true bounded LRU with a higher cap, and persist vector embeddings so cold loads stop re-inferring.
2. **Engine Bugs & System Stability** — stop the LLM output cleaner from stripping legitimate closing dialogue quotes, and make Dexie `versionchange` reloads graceful so active runtime session pointers survive.

All changes are source-tree edits in `src/`. The user runs `npm run verify` + `npm run build` locally; every modified file is handed off for download.

---

## 📐 Audit Summary (grounded findings)

| #   | Item                        | Location                                                                                                                                    | Diagnosis                                                                                                                                                                                                                                                                                                                                                                                              |
| --- | --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1A  | Recency/semantic imbalance  | `src/intelligence/temporal.js` `recency_factor` (59-76), `compute_relevance` (89-94), `score` (103-122), `score_async` (160-179)            | `relevance = weight × (1 + semantic) × recency`. Decay exponent `(10-w)/5` multiplies down to ~0.13 (w1) / 0.33 (w5) by ~100 turns, so `recency` (0.13–1.0) swamps the `(1 + semantic)` ceiling (1–2). A fresh irrelevant memory (sem=0, rec=1.0) outranks an old highly relevant one (sem=1.0, rec=0.33).                                                                                             |
| 1B  | Cache cap / FIFO            | `src/intelligence/embeddings.svelte.js` `MAX_CACHE = 500` (26), `embed()` eviction (100-104)                                                | Hard 500 cap + first-key eviction = FIFO, not LRU (no recency refresh on hit). Repeated contexts churn out and get re-embedded.                                                                                                                                                                                                                                                                        |
| 1C  | Cold-load re-inference      | `src/intelligence/embeddings.svelte.js` (`_embedding` transient, 112-118); `src/data/repository.js` `upsert` (102-124) & `update` (148-159) | `ensure_embedding` stores `Float32Array`, but `repository.js` round-trips entities through `JSON.parse(JSON.stringify())`, flattening the typed array to `{"0":…}` — on reload `_embedding.length` is undefined, so every vector re-infers. `prune()` (224-234) also drops embeddings from snapshots.                                                                                                  |
| 2A  | Trailing quote stripping    | `src/platform/transport.js` `sanitize_llm` (25-47, esp. line 44)                                                                            | `.replace(/^["']                                                                                                                                                                                                                                                                                            [ "']$/g, "")`strips a valid closing dialogue quote (`"`/`'`) from generated message ends. |
| 2B  | Abrupt versionchange reload | `src/data/db.js` (60-63)                                                                                                                    | `db.on("versionchange")` closes + `location.reload()` immediately, killing in-memory pointers (`session_driver._active_id`, `runtime.simulation_story_id`, active entities) mid-turn. `kv_settings` restore exists but races in-flight writes.                                                                                                                                                         |

---

## 📋 Execution Plan

### Phase 1 — Scoring recalibration (1A) + sanitizer fix (2A) [low risk, quick wins]

**1A Recalibrate recency against semantics**

- Introduce a single config block `TEMPORAL_SCORING = { SEMANTIC_GAIN, RECENCY_FLOOR, DECAY_SOFTEN }` at top of `temporal.js`.
- New `compute_relevance`: `weight × (1 + SEMANTIC_GAIN × semantic) × max(RECENCY_FLOOR, pow(recency, DECAY_SOFTEN))`.
  - Proposed: `SEMANTIC_GAIN = 3`, `RECENCY_FLOOR = 0.5`, `DECAY_SOFTEN = 0.5`.
  - Effect: old-but-relevant (sem 1.0, age 100, w5) ≈ `5 × 4 × 0.5 = 10` > fresh-but-irrelevant (sem 0, w5) = `5 × 1 × 1 = 5`. Recency becomes a soft bias/tiebreaker, semantic drives retrieval.
- Keep `v._recency_factor` telemetry as the _effective_ softened value so `DYNAMICS_DELTA` stays honest.
- **TDD** (`temporal.test.js`): (1) old high-sem outranks recent low-sem; (2) recency still decides among equal semantics; (3) floor respected; (4) w10 vectors immune (factor 1.0); (5) `_recency_factor` telemetry reflects softened factor.

**2A Preserve closing dialogue quotes**

- Rework `sanitize_llm` line 44: remove the blanket `[ "']$` class strip. Keep `.trim()`, filler-phrase strip, code-fence strip.
- Strip a leading quote only when **unmatched** (no trailing quote) — removes the `"Sure, here is…` artifact while never eating a closing dialogue quote. Paired outer quotes stay intact (rendered as dialogue spans by `wrap_dialogue` anyway).
- **TDD** (`src/platform/transport.test.js`, new): trailing `"`/`'` preserved; unmatched leading quote stripped; paired outer quotes preserved; fences + filler still stripped.
- Audit `src/ui/utils/text.js` `derive_vector_title` (103) — title-only strip, leave unless a test flags it.

### Phase 2 — True bounded LRU cache (1B)

- `embeddings.svelte.js`: raise `MAX_CACHE` to `1500`; make `embed()` a real LRU — on hit, `delete` + re-`set` key (refresh recency); on overflow evict the Map head. Add `embeddings_engine.cacheStats()` (`{size, hits, max}`) for DevWing telemetry.
- **TDD** (`embeddings.test.js`, new): stub pipeline module; assert LRU order, hit-refresh recency, cap enforcement. (Existing `temporal.test.js` mocks this module — keep `embed`/`score_by_semantics` signatures stable.)

### Phase 3 — Persist vector embeddings (1C)

- `embeddings.svelte.js`: add `serialize_embedding(Float32Array) → number[]` and `deserialize_embedding(any) → Float32Array | null` (accept Float32Array, `number[]`, JSON `{"0":…}`; validate `length === EMBED_DIM`; corrupt → `null`). `ensure_embedding` upgrades persisted plain arrays in place.
- `repository.js`: in `upsert` and `update`, before the JSON round-trip, map `entity.past`/`entity.future` `_embedding` → `serialize_embedding`; in `entities.get` and `runtime.sync`, restore via `deserialize_embedding` so vectors hydrate with ready embeddings.
- Schema-compatible (no migration; `_embedding` already persists as a JSON blob — this just makes it round-trip correctly).
- **TDD** (`repository.test.js` / new assertions + `embeddings.test.js`): upsert→get round-trips `_embedding` as Float32Array; invalid embedding hydrates to `null` (re-infer path); snapshot `prune()` opts embeddings out (keep lean).

### Phase 4 — Graceful versionchange resilience (2B)

- `data/db.js`: versionchange handler quiesces instead of hard-reloading — write a synchronous checkpoint `{story_id, round, phase}` via a new `session_checkpoint` helper (tiered: `sessionStorage` → `window.name`; both synchronous and reload-safe; SecurityError caught), close DB, then schedule `location.reload()` on the next tick. Add a once-per-event guard to prevent reload loops.
- `engine/session.svelte.js` / `state/runtime.svelte.js` `sync()`: on boot, restore from checkpoint before falling back to `kv_settings`; clear checkpoint after restore.
- **TDD** (`db.test.js` + `runtime.test.js`): simulate versionchange (fake event emitter) → asserts `db.close()`, checkpoint written, reload scheduled once; boot restore precedence checkpoint > kv_settings.
- **Manual gate**: two tabs, bump schema, old tab reloads and resumes active story + round.

### Delivery per phase

- Run all affected unit tests locally via `vitest run` (user side, no Node here), static review via `browser_eval` where the live shell permits, then `npm run verify` → `npm run build` → hand off every modified file as a download.

---

## 🗺️ Roadmap Log

- [x] memory-engine-tuning-2026-08-03: 1A recency/semantic rebalance (TEMPORAL_SCORING block, `temporal.js:41`) → 1B true-LRU cache (cap 1500, `embeddings.svelte.js`) → 1C embedding persistence (`vectors.js` serialize/deserialize + `repository.js` round-trip).
- [x] engine-stability-fixes-2026-08-03: 2A dialogue-quote preservation (`transport.js` sanitize_llm) → 2B versionchange resilience (`db.js` quiesce + `session-checkpoint.js` + `runtime.svelte.js` boot restore).

## ✅ Delivery Status

All five phases are implemented with TDD coverage:

| Phase | Deliverable                                                                                                                                                                                                       | Tests                                                                            |
| ----- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| 1A    | `TEMPORAL_SCORING` config; `compute_relevance = weight × (1 + 3·semantic) × max(0.5, raw^0.5)`; `_recency_factor` softened telemetry                                                                              | `temporal.test.js` (outrank, tiebreak, floor, w10 immunity, telemetry)           |
| 1B    | `EMBEDDING_CACHE_MAX = 1500`; true LRU (hit refresh, head eviction); `cacheStats()`                                                                                                                               | `embeddings.test.js` (LRU order, refresh, cap, stats)                            |
| 1C    | `serialize_embedding` / `deserialize_embedding` (`@utils/vectors.js`); repository upsert/update/get round-trip; `ensure_embedding` in-place upgrade                                                               | `repository.test.js` (Float32Array round-trip, legacy `{"0":…}`, corrupt→null)   |
| 2A    | `sanitize_llm` strips leading quote only when unmatched; closing dialogue quotes preserved                                                                                                                        | `transport.test.js` (trailing `"`/`'`, paired quotes, lone quote, fences/filler) |
| 2B    | `db.js` versionchange quiesce→close→reload (loop-guarded); `session-checkpoint.js` (sessionStorage→window.name→memory); `boot.js` hook; `runtime.sync()` checkpoint>kv_settings restore + round/phase propagation | `db.test.js`, `session-checkpoint.test.js`, `runtime-sync.test.js`               |

**Pending (user-side):** `npm run verify` → `npm run build` → redeploy. Every modified file is attached in the session handoff.

### Follow-up fixes (2026-08-03, from `npm run verify` run)

- `engine/boot.js` — the module-scope quiesce registration is now guarded (`typeof set_versionchange_quiesce === "function"`) so importing `@engine` can't hard-crash in test environments with partial `@data` mocks or a stale `@data` barrel.
- `engine/index.js` — barrel now re-exports `save_session_checkpoint` / `load_session_checkpoint` / `clear_session_checkpoint` from `session-checkpoint.js`.
- `ui/organisms/Profile.test.js` — its `@data/db.js` mock now provides `set_versionchange_quiesce` (boot.js imports it via the `@data` barrel).
- `intelligence/embeddings.test.js` — "exposes the configured maximum cache size" resets the cache cap first; `beforeEach` sets cap=4 for the LRU tests, which leaked into the cap assertion (`expected 4 to be 1500`).
