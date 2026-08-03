# RPGlitch — DevTelemetryBlock Telemetry Q&A Pass

**Date**: 2026-08-03 · **Session**: perchance workspace (`scratch/src/src/`)
**User actions required**: `npm run test` → `npm run build` → redeploy. No schema migration, no new deps.

---

## 1. What changed and why

### 1.1 `"type": "DYNAMICS_DELTA"` — answered (no code change needed)

It's the **log-entry discriminator** on the `log_system_entry` payload. `DevTelemetryBlock` uses it to pick the card's `DataBox` label (`"System Update"`) and to branch (MEMORY_FORMATION → "Memory Forged", VECTOR_RESOLUTION, default). It's the kind-tag of the telemetry snapshot — harmless, kept top-level so old entries keep rendering.

### 1.2 Removed the "w4 stuff" (the `w{emotional_weight}` chips)

- MEMORY_FORMATION `NEWLY_WEAVED_MEMORIES` rows: chip removed.
- New-vector rows in the default branch: chip removed (replaced by the vector `id`).
- **Kept** (different metric): the PAST MEMORIES / FUTURE VECTORS grids still show `_relevance` (e.g. `8.1`), and the VECTOR_RESOLUTION row still shows `emotional_weight` as a leading number.

### 1.3 New vectors now have `id`

The director's `new_vectors` never carried an id — `temporal_engine.create()` generates one (`_uuid()`) at apply time. Now `apply_state_mutations` (temporal.js) stamps it back onto the mutation record:

```js
const new_vector = create(payload, v.type || "future", v.weight || 5);
v.id = new_vector.id;
```

So the telemetry's `vectors.new[].id` (already passed through by `build_update_entry`) shows the real id of the vector that was actually stored. The card renders it in mono next to the type.

### 1.4 Retrieved vectors now always carry `type`

`build_retrieval` stamps each vector with its source array's kind:

```js
const past = (vectors?.past || []).map((v) => clean(v, "past"));
const future = (vectors?.future || []).map((v) => clean(v, "future"));
```

`copy.type = copy.type || fallback_type` — stored vectors keep their real type, vectors missing one get stamped. No more guessing which bucket a retrieval entry came from.

### 1.5 The leading-space/lowercase " c..." content

That was the **director's raw output stored verbatim** — `create()` only used `.trim()` to test emptiness and stored the payload untouched. Now:

- `apply_state_mutations` trims before `create()` (`payload = (v.content || v.directive || "").trim()`),
- `build_update_entry` / `build_retrieval` trim before display,
  so both the stored memory and the dump read clean. (Capitalization is left to the LLM — we only strip whitespace.)

### 1.6 `thoughts` block in the system update + raw meta

`execute_turn` now assembles the director's think content once (Cognition / Intent / Somatic Tells / Dialogue Direction from `internal_monologue` etc., plus **Reasoning** from `_thought_process`) and:

- stores it as `final_meta.thoughts`,
- reuses it for the streamed `<think>` block (identical behavior to before; `_thought_process`-only turns now also produce telemetry thoughts),
- `capture_dynamics_delta` copies it into the payload (`{ ...(meta?.thoughts ? { thoughts: meta.thoughts } : {}) }`),
- the card gained a **THOUGHTS** section (`whitespace-pre-wrap` mono block) and the raw-meta Accordion shows it automatically.

### 1.7 `trigger_image`

`director_data.trigger_image` (boolean, schema at prompts.js:30) is coerced to a real boolean and always present in the payload:

```js
trigger_image: meta?.trigger_image === true,
```

The card renders a pulsing **TRIGGER IMAGE** row only when `true`. (The engine itself doesn't consume this flag for image generation — visualization is a separate user-triggered flow; this is observability.)

### 1.8 New card sections

- **THOUGHTS** (top of default branch, when present).
- **TRIGGER IMAGE** pulse row (when true).
- **RETRIEVED** rows per entity (when `updates.*.vectors.retrieval` exists) — type tag + id + `_relevance` + content, so past/future is visible in the card, not just the raw dump.

## 2. Files

| File                                         | Change                                                                                                                                                                                                                                                           |
| -------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/intelligence/kernel.js`                 | `build_update_entry` trims content + passes id; `build_retrieval` stamps `type` per source array; `capture_dynamics_delta` payload gains `trigger_image` + `thoughts`; `execute_turn` assembles `think_content` once, sets `final_meta.trigger_image`/`thoughts` |
| `src/intelligence/temporal.js`               | `apply_state_mutations` trims new-vector content, stamps `v.id = new_vector.id`                                                                                                                                                                                  |
| `src/ui/molecules/DevTelemetryBlock.svelte`  | w-chips removed; THOUGHTS section; TRIGGER IMAGE row; RETRIEVED rows; vector ids shown; block normalization maps `id` + `retrieval` (new shape) and `id` + `retrieval: []` (legacy)                                                                              |
| `src/intelligence/kernel.test.js`            | capture suite +2 (thoughts/trigger_image; retrieval type-stamping + false default) +1 execute_turn integration (director `_thought_process`/`trigger_image` → logged payload, content trimmed)                                                                   |
| `src/ui/molecules/DevTelemetryBlock.test.js` | mirror now maps `id` + `retrieval`; mirrors 12 → 15 (id passthrough, retrieval type/id/relevance, legacy empty retrieval)                                                                                                                                        |
| `tasks/FUTURE.md` / `tasks/PRESENT.md`       | new paragraph + pulse row                                                                                                                                                                                                                                        |

Not changed: `Message.svelte` (its gate already accepts `meta.updates`), `prompts.js` (`trigger_image` was already in `DIRECTOR_JSON_SCHEMA`).

## 3. Verification (this session, no Node)

- acorn syntax parse: all 4 edited JS files pass.
- Svelte 5.56.3 `client` + `server` compile: 0 warnings/errors.
- SSR render harness (compiled DevTelemetryBlock + stubbed `@atoms`/`@state`/`svelte/internal/server`):
  - new shape → THOUGHTS text + Reasoning, TRIGGER IMAGE, RETRIEVED rows (type/id/relevance), new-vector id, resolved id, zero `w<digit>` chips, no "emotional weight" title;
  - legacy shape → renders, zero chips; MEMORY_FORMATION → renders, zero chips.
- Mirror tests: 15/15 assertions pass.
- Kernel pure-fn probes (`compute_deltas`, `build_update_entry`, `build_retrieval` extracted from source): 10/10 pass (trim, id pass-through, emotional_weight rename, type stamping, relevance sort, internals stripped, null entry).
- temporal.js `apply_state_mutations` probe (stubbed deps): 5/5 pass (trimmed store, type/weight, id stamped on mutation record, empty-after-trim skipped).

## 4. Payload sample

```json
{
  "type": "DYNAMICS_DELTA",
  "trigger_image": false,
  "thoughts": "## Cognition\n...\n## Reasoning\n<director _thought_process>",
  "updates": {
    "AI_CHARACTER": {
      "name": "...",
      "present_mutations": { "physical": "...", "non_physical": "..." },
      "eternal_mutations": { "physical": "", "non_physical": "" },
      "vectors": {
        "resolved": [{ "id": "v-old", "resolution_summary": "..." }],
        "new": [{ "id": "<generated uuid>", "content": "trimmed...", "type": "future", "emotional_weight": 8 }],
        "retrieval": [{ "id": "...", "content": "...", "type": "past", "emotional_weight": 10, "_relevance": 10.9 }]
      },
      "dynamics": [{ "axis": "chaos", "old_value": 46, "new_value": 48, "diff": 2 }]
    }
  }
}
```
