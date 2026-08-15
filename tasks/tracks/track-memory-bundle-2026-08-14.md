<!--
  tasks/tracks/track-memory-bundle-2026-08-14.md
  🚀 IMPLEMENTATION BLUEPRINT: MEMORY BUNDLE & STATE UNIFICATION
  Track Goal: Unify state architecture across PRESENT (Active State via Pseudo-JSON Brackets & Epistemic Filtering)
  and PAST (Pinned Memories via usr_ Prefix & Memory Forge), providing zero-latency active status mutation, native
  clothing-to-inventory lifecycles, visual prompt filtering, and forge-protected pinned memory persistence.
-->

# 🚀 Implementation Blueprint — `track-memory-bundle-2026-08-14`

> **Track Goal**: Unify state architecture across **`PRESENT` (Active State via Pseudo-JSON Brackets & Epistemic Filtering)** and **`PAST` (Pinned Memories via `usr_` Prefix & Memory Forge)**, providing zero-latency active status mutation, native clothing-to-inventory lifecycles, visual prompt filtering, and forge-protected pinned memory persistence.

```text
  DIRECTOR / ENGINE EMISSION
  ┌────────────────────────────────────────────────────────────────────────┐
  │ Present Physical (Pseudo-JSON):                                        │
  │   [SHIRT: none] [INVENTORY: white greasy tank-top] [HELD: plasma gun]  │
  │ Present Non-Physical (Epistemic Brackets):                             │
  │   [MOOD: alert] [SECRET: knows where the key is] [PLAN: reach docks]   │
  │ Historical Backstory / Memory:                                         │
  │   id: "usr_4f8a12bc..." -> "Banished from Ashenweald court."          │
  └───────────────────────────────────┬────────────────────────────────────┘
                                      │
                                ┌──────▼──────┐
                                │ Parser / DM │
                                └──────┬──────┘
                                       │
     ┌────────────────────────────────┴────────────────────────────────┐
     │                                                                 │
     ▼                                                                 ▼
ACTIVE PRESENT STATE (Mutable)                    HISTORICAL PAST MEMORY (Immutable)
┌──────────────────────────────────────────┐     ┌──────────────────────────────────────────┐
│ Target: entity.present (phys & non_phys) │     │ Target: entity.past[] (vectors)          │
│ • Pseudo-JSON Brackets ([KEY: VALUE])    │     │ • Pinned ID Prefix: `usr_...`            │
│ • Overwrite: [KEY: new_value]             │     │ • AI Session ID Prefix: `ai_...`         │
│ • Universal Clear: [KEY: none/bare/etc]  │     │ • Forge-Skip: id.startsWith("usr_") is   │
│ • Multi-Item: [INVENTORY: item1, item2]   │     │   NEVER altered, compressed, or evicted  │
│ • Visual Filter: INVENTORY/SECRET cut    │     │ • Deduplication: exact, substr, >60%     │
│   from image generation prompts          │     │ • Bounds: Max 200 entries, ≤220 chars    │
│ • Epistemic Filter: User's [SECRET:] and │     │ • Pinned Scoring Boost: 1.5x multiplier  │
│   [PLAN:] filtered from AI Character     │     │   in compute_relevance() in temporal.js  │
└──────────────────────────────────────────┘     └──────────────────────────────────────────┘
```

---

## 1. Active Present State (`PRESENT` via Pseudo-JSON & Epistemic Filters)

Active conditions, held weapons, worn clothing, inventory items, mood, secrets, and world truths are **present physical and psychological realities**, not past memories. They live directly in `entity.present` (`physical` and `non_physical`) and are governed by `safe_parse_pseudo_json` and `merge_prose_into_field`.

### A. Pseudo-JSON Bracket Taxonomies

| Key Taxonomy                            | Target Field               | Description & Example                                                    | Lifecycle & Mutation Behavior                                                               |
| :-------------------------------------- | :------------------------- | :----------------------------------------------------------------------- | :------------------------------------------------------------------------------------------ |
| **`[SHIRT: ...]`, `[PANTS: ...]`**      | `present.physical`         | Worn garments (e.g. `[SHIRT: white greasy tank-top]`).                   | Overwrites directly; `[SHIRT: none]` marks shirtless.                                       |
| **`[INVENTORY: ...]`**                  | `present.physical`         | Carried items, un-worn clothing, tools (e.g. `[INVENTORY: copper key]`). | Multi-item array/list; groups in UI; **filtered out** of image prompts.                     |
| **`[HELD: ...]`**                       | `present.physical`         | Weapon or held prop (e.g. `[HELD: plasma pistol]`).                      | Feeds image generation; clears via `[HELD: none]`.                                          |
| **`[INJURY: ...]`**                     | `present.physical`         | Physical wounds/braces (e.g. `[INJURY: left arm in sling]`).             | Feeds visual generation; clears via `[INJURY: none]` / `[INJURY: healed]`.                  |
| **`[DISGUISE: ...]`**                   | `present.physical`         | Active concealment (e.g. `[DISGUISE: watch cloak]`).                     | Modifies visual generation; clears via `[DISGUISE: none]`.                                  |
| **`[POSE: ...]`, `[POSTURE: ...]`**     | `present.physical`         | Stance (e.g. `[POSE: kneeling on gravel]`).                              | Isolated kinematic key; **never** pollutes inventory.                                       |
| **`[LOCATION: ...]`, `[WEATHER: ...]`** | `fractal.present.physical` | Active room & weather (e.g. `[LOCATION: clock tower]`).                  | Environmental backdrop; entity-agnostic structure.                                          |
| **`[MOOD: ...]`, `[STATUS: ...]`**      | `present.non_physical`     | Immediate mindset (e.g. `[MOOD: suspicious]`).                           | Injected into `<STATE_OF_MIND>`; clears via `[STATUS: normal]`.                             |
| **`[SECRET: ...]`, `[PLAN: ...]`**      | `present.non_physical`     | Private knowledge / intent (e.g. `[SECRET: stole ledger]`).              | Private truth; **filtered across the Epistemic Wall** from other characters' prompt blocks. |

### B. Natural Overwrite, Undressing & Redressing Lifecycle

1. **Direct Overwrites**:
   When changing clothes or gear, emitting `[SHIRT: knitted sweater]` overwrites `SHIRT` immediately without string duplication.
2. **Clothing-to-Inventory Transition (Undressing)**:
   When a character undresses, emitting `[SHIRT: none] [INVENTORY: white greasy tank-top]` marks the character as shirtless while safely stashing the item in inventory.
3. **Zero-Hallucination Redressing**:
   When redressing, the AI reads `INVENTORY: white greasy tank-top` from `<CURRENT_LOOK>` and emits `[SHIRT: white greasy tank-top]`. The character puts on their **actual original clothing**, rather than hallucinating a random new outfit.
4. **Universal Atomic Clearing**:
   Emitting `[KEY: none]`, `[KEY: bare]`, `[KEY: naked]`, `[KEY: off]`, `[KEY: removed]`, `[KEY: disrobed]`, `[KEY: healed]`, `[KEY: cleared]`, or `[KEY: normal]` automatically deletes `KEY` from the present state dictionary (e.g. `[HELD: none]` removes `HELD`, `[DISGUISE: none]` removes `DISGUISE`), preventing stale clutter. `[CLOTHING: none]` preserves wildcard purging of all `CLOTHING_KEYS`.

### C. Multi-Item Collection & UI Grouping

When multiple `[INVENTORY: ...]` brackets or comma-separated items are emitted:

```text
[INVENTORY: white greasy tank-top] [INVENTORY: plasma pistol] [INVENTORY: copper key]
```

- **Parser Normalization**: `safe_parse_pseudo_json` aggregates repeated `INVENTORY` (and `STASH`) keys into a normalized list: `INVENTORY: "white greasy tank-top, plasma pistol, copper key"` or string array.
- **Consumer Type Safety**: Downstream consumers (`physical_to_xml`, `flatten_physical`, `build_aesthetic_map`, `Profile.svelte`) safely support array or string representations with `.join(", ")` formatting.
- **UI Presentation**: Grouped under a single cohesive section in the Character Sheet and DevWing.

### D. Dual Filter Engine (Visual & Epistemic)

1. **Visual Prompt Filter (`image-prompts.js`)**:
   - `build_aesthetic_map()` and prompt constructors strictly **exclude `INVENTORY`**, `STASH`, `SECRET`, `PLAN`, and `STATUS` from image prompts so carried/stashed items are never painted on the body as worn clothing.
2. **Epistemic Prompt Filter (`prompts.js`)**:
   - **Director & Ghostwriter Context**: Receives 100% of all entities' `[SECRET: ...]` and `[PLAN: ...]` (omniscient DM overview).
   - **AI Character Context (`render_character`)**: Receives its own secrets and public physical tags, but **User's `[SECRET: ...]` and `[PLAN: ...]` are stripped across the Epistemic Wall** to prevent telepathic mind-reading and metagaming.

---

## 2. Historical Past & Pinned Memories (`PAST` via `usr_` Prefix)

Historical events that occurred in previous chapters are permanent backstory. They reside in `entity.past` as immutable memory anchors and render inside the existing `<MEMORIES>` block.

### A. ID Prefix Provenance & Forge-Skip

Memory provenance is identified directly by ID prefix:

```javascript
// User / Lore Pinned Memory (Permanently Protected)
id: `usr_${generate_uuid()}`; // e.g. "usr_4f8a12bc-..."

// AI Session Memory (Consolidating / Rolling)
id: `ai_${generate_uuid()}`; // e.g. "ai_99e03d41-..."
```

- **Forge-Skip Preservation**: During Memory Forge consolidation cycles, any record satisfying `v.id?.startsWith("usr_") || v.meta?.origin || v.origin || v.timestamp === 0` is **explicitly bypassed, preserved intact, and immune to eviction**.
- **Bound Limits**:
  - `PAST_VECTOR_CAP = 20`: Rolling cap for active session `ai_` memories (oldest `ai_` records evict first upon capacity overflow).
  - **200 records per entity**: Absolute safety ceiling for combined `usr_` and `ai_` records; **≤220 characters per entry**.
- **Lightweight Pinned Scoring Boost**: In `compute_relevance()` inside `temporal.js`, pinned memories receive a natural priority multiplier (`(v.id?.startsWith("usr_") || is_origin(v)) ? 1.5 : 1.0`) ensuring core backstory anchors rank near the top of the character's `<MEMORIES>` prompt block.

### B. Ingestion Deduplication Matrix

| Deduplication Layer      | Criteria                                                | Action                                              |
| :----------------------- | :------------------------------------------------------ | :-------------------------------------------------- |
| **Exact Match**          | Identical string content                                | Drop candidate duplicate.                           |
| **Substring Match**      | Candidate exists within an existing entry or vice-versa | Drop candidate or keep the most descriptive record. |
| **Fuzzy Semantic Match** | $>60\%$ word-overlap similarity or $>0.92$ cosine       | Reject candidate as duplicate.                      |

---

## 3. Implementation Playbook (Bite-Sized Checklist)

### Phase 1: Test-Driven Red Suite

- [x] **Step 1.1 (RED)**: Update `src/intelligence/parser.test.js` validating parsing, overwriting, multi-item `INVENTORY` aggregation, and universal deletion (`[KEY: none]`, `[HELD: none]`, `[DISGUISE: none]`, `[INJURY: healed]`).
- [x] **Step 1.2 (RED)**: Add test assertions in `src/intelligence/prompts.test.js` verifying that `[SECRET: ...]` and `[PLAN: ...]` of the User are filtered out from AI Character prompt rendering (`render_character`) while remaining visible in `render_director`.
- [x] **Step 1.3 (RED)**: Create `src/media/image-prompts.test.js` verifying that `INVENTORY`, `STASH`, and `SECRET` keys are excluded from `build_aesthetic_map()`.
- [x] **Step 1.4 (RED)**: Update `src/intelligence/temporal.test.js` proving `usr_` prefixed memories survive consolidation routines, are protected by `is_origin()`, receive the $1.5\times$ pinned scoring multiplier, enforce the $\le 220$-char budget, and respect the 200 total memory ceiling.

### Phase 2: Storage & Prefix Normalization

- [x] **Step 2.1 (GREEN)**: Update `src/data/normalizer.js` (`coerce_temporal_vectors`) and `src/ui/profile/Profile.svelte.js` (`add_vector_item`) to stamp user-created and imported memories with `usr_` ID prefixes.
- [x] **Step 2.2 (GREEN)**: Update `src/intelligence/temporal.js` to stamp `ai_` prefixes in `create()`, truncate payloads to 220 chars on creation, guard against total pool overflow (>200 hard max), update `is_origin()` to protect `usr_` IDs, and implement the $1.5\times$ relevance multiplier in `compute_relevance()`.

### Phase 3: Parser, Guardrails & Dual Filter Integration

- [x] **Step 3.1 (GREEN)**: Extend `safe_parse_pseudo_json` in `src/utils/text.js` and `merge_prose_into_field` in `src/intelligence/parser.js` to support multi-item `INVENTORY` aggregation and universal `[KEY: none]` deletion.
- [x] **Step 3.2 (GREEN)**: Update `build_aesthetic_map` in `src/media/image-prompts.js` to omit `INVENTORY`, `STASH`, and non-physical tags from image generation prompts.
- [x] **Step 3.3 (GREEN)**: Implement `strip_epistemic_tags` helper in `src/intelligence/prompts.js` and integrate into `render_character()` for `USER_PERSONA` state rendering.

### Phase 4: Prompt Directives & Lifecycle Integration

- [x] **Step 4.1 (GREEN)**: Add emission formatting instructions for Pseudo-JSON present tags, universal clearing, and clothing-to-inventory lifecycles into Director and Memory Forge system prompts within `src/intelligence/prompts.js` and `src/data/definitions/protocols.js`.

### Phase 5: Verification & Quality Gate

- [x] **Step 5.1 (VERIFY)**: Run full test verification suite:

  ```bash
  npm run verify
  ```

  _(Validates `lint`, `audit`, `test:unit`, and `test:design` — 37 test files, 524 tests passed)_.

- [x] **Step 5.2 (BUILD)**: Verify singlefile bundle build:

  ```bash
  npm run build
  ```

- [x] **Step 5.3 (ARCHIVE)**: Synchronize `tasks/PRESENT.md`, update task state, and archive track documentation.

<!--
  CHANGELOG
  2026-08-16: Completed track-memory-bundle-2026-08-14. Verified all 5 implementation phases, full test suite pass (37 test files, 524 tests), and single-file bundle build.
  2026-08-16: Refined track blueprint with 5 architectural calibrations (universal atomic [KEY: none] deletion, safe_parse_pseudo_json INVENTORY aggregation, epistemic prompt filtering across render_character/render_director boundaries, usr_ vs ai_ prefix lifecycle, and dedicated image-prompts test suite).
-->
