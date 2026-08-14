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
│ • Clear: [KEY: none] (deletes key)        │     │ • Forge-Skip: id.startsWith("usr_") is   │
│ • Multi-Item: [INVENTORY: item1, item2]   │     │   NEVER altered, compressed, or evicted  │
│ • Visual Filter: INVENTORY excluded from │     │ • Deduplication: exact, substring, ≥85%  │
│   image generation prompts               │     │ • Bounds: Max 200 entries, ≤220 chars    │
│ • Epistemic Filter: User's [SECRET:] and │     │ • Naturally Ranks in existing <MEMORIES> │
│   [PLAN:] filtered from AI Character     │     │   via lightweight pinned priority boost  │
└──────────────────────────────────────────┘     └──────────────────────────────────────────┘
```

---

## 1. Active Present State (`PRESENT` via Pseudo-JSON & Epistemic Filters)

Active conditions, held weapons, worn clothing, inventory items, mood, secrets, and world truths are **present physical and psychological realities**, not past memories. They live directly in `entity.present` (`physical` and `non_physical`) and are governed by `safe_parse_pseudo_json` and `merge_prose_into_field`.

### A. Pseudo-JSON Bracket Taxonomies

| Key Taxonomy                            | Target Field               | Description & Example                                                    | Lifecycle & Mutation Behavior                                              |
| :-------------------------------------- | :------------------------- | :----------------------------------------------------------------------- | :------------------------------------------------------------------------- |
| **`[SHIRT: ...]`, `[PANTS: ...]`**      | `present.physical`         | Worn garments (e.g. `[SHIRT: white greasy tank-top]`).                   | Overwrites directly; `[SHIRT: none]` marks shirtless.                      |
| **`[INVENTORY: ...]`**                  | `present.physical`         | Carried items, un-worn clothing, tools (e.g. `[INVENTORY: copper key]`). | Multi-item array; groups in UI; **filtered out** of image prompts.         |
| **`[HELD: ...]`**                       | `present.physical`         | Weapon or held prop (e.g. `[HELD: plasma pistol]`).                      | Feeds image generation; clears via `[HELD: none]`.                         |
| **`[INJURY: ...]`**                     | `present.physical`         | Physical wounds/braces (e.g. `[INJURY: left arm in sling]`).             | Feeds visual generation; clears via `[INJURY: none]` / `[INJURY: healed]`. |
| **`[DISGUISE: ...]`**                   | `present.physical`         | Active concealment (e.g. `[DISGUISE: watch cloak]`).                     | Modifies visual generation; clears via `[DISGUISE: none]`.                 |
| **`[POSE: ...]`, `[POSTURE: ...]`**     | `present.physical`         | Stance (e.g. `[POSE: kneeling on gravel]`).                              | Isolated kinematic key; **never** pollutes inventory.                      |
| **`[LOCATION: ...]`, `[WEATHER: ...]`** | `fractal.present.physical` | Active room & weather (e.g. `[LOCATION: clock tower]`).                  | Environmental backdrop; entity-agnostic structure.                         |
| **`[MOOD: ...]`, `[STATUS: ...]`**      | `present.non_physical`     | Immediate mindset (e.g. `[MOOD: suspicious]`).                           | Injected into `<STATE_OF_MIND>`; clears via `[STATUS: normal]`.            |
| **`[SECRET: ...]`, `[PLAN: ...]`**      | `present.non_physical`     | Private knowledge / intent (e.g. `[SECRET: stole ledger]`).              | Private truth; **filtered across the Epistemic Wall**.                     |

### B. Natural Overwrite, Undressing & Redressing Lifecycle

1. **Direct Overwrites**:
   When changing clothes or gear, emitting `[SHIRT: knitted sweater]` overwrites `SHIRT` immediately without string duplication.
2. **Clothing-to-Inventory Transition (Undressing)**:
   When a character undresses, emitting `[SHIRT: none] [INVENTORY: white greasy tank-top]` marks the character as shirtless while safely stashing the item in inventory.
3. **Zero-Hallucination Redressing**:
   When redressing, the AI reads `INVENTORY: white greasy tank-top` from `<CURRENT_LOOK>` and emits `[SHIRT: white greasy tank-top]`. The character puts on their **actual original clothing**, rather than hallucinating a random new outfit.
4. **Atomic Clearing**:
   Emitting `[KEY: none]`, `[KEY: bare]`, or `[KEY: removed]` automatically deletes the key from the present state dictionary, preventing stale clutter.

### C. Multi-Item Collection & UI Grouping

When multiple `[INVENTORY: ...]` brackets or comma-separated items are emitted:

```text
[INVENTORY: white greasy tank-top] [INVENTORY: plasma pistol] [INVENTORY: copper key]
```

- **Parser Normalization**: `safe_parse_pseudo_json` aggregates repeated keys into an array: `inventory: ["white greasy tank-top", "plasma pistol", "copper key"]`.
- **UI Presentation**: Grouped under a single cohesive section in the Character Sheet and DevWing:
  $$\text{Inventory: white greasy tank-top, plasma pistol, copper key}$$

### D. Dual Filter Engine (Visual & Epistemic)

1. **Visual Prompt Filter (`image-prompts.js`)**:
   - `build_aesthetic_map()` strictly **excludes `INVENTORY`**, `STASH`, `SECRET`, and `STATUS` from image prompts so carried/stashed items are never painted on the body as worn clothing.
2. **Epistemic Prompt Filter (`prompts.js`)**:
   - **Director Context**: Receives 100% of all entities' `[SECRET: ...]` and `[PLAN: ...]` (omniscient DM overview).
   - **AI Character Context**: Receives its own secrets and public physical tags, but **User's `[SECRET: ...]` and `[PLAN: ...]` are filtered out** to prevent telepathic mind-reading and metagaming.

---

## 2. Historical Past & Pinned Memories (`PAST` via `usr_` Prefix)

Historical events that occurred in previous chapters are permanent backstory. They reside in `entity.past` as immutable memory anchors and render inside the existing `<MEMORIES>` block.

### A. ID Prefix Provenance & Forge-Skip

Instead of complex metadata flags (`meta.chronicle`), memory provenance is identified directly by ID prefix:

```javascript
// User / Lore Pinned Memory (Permanently Protected)
id: `usr_${generate_uuid()}`; // e.g. "usr_4f8a12bc-..."

// AI Session Memory (Consolidating / Rolling)
id: `ai_${generate_uuid()}`; // e.g. "ai_99e03d41-..."
```

- **Forge-Skip Preservation**: During Memory Forge consolidation cycles, any record satisfying `v.id?.startsWith("usr_") || v.timestamp === 0` is **explicitly bypassed, preserved intact, and immune to eviction**.
- **Bound Limits**: Hard maximum of **200 records per entity**; **≤220 characters per entry**. Oldest `ai_` records evict first upon capacity overflow.
- **Lightweight Pinned Scoring Boost**: In `compute_relevance()` inside `temporal.js`, pinned memories receive a natural priority multiplier (`v.id?.startsWith("usr_") ? 1.5 : 1.0`) ensuring core backstory anchors rank near the top of the character's `<MEMORIES>` prompt block.

### B. Ingestion Deduplication Matrix

| Deduplication Layer      | Criteria                                                | Action                                              |
| :----------------------- | :------------------------------------------------------ | :-------------------------------------------------- |
| **Exact Match**          | Identical string content                                | Drop candidate duplicate.                           |
| **Substring Match**      | Candidate exists within an existing entry or vice-versa | Drop candidate or keep the most descriptive record. |
| **Fuzzy Semantic Match** | $\ge 85\%$ word-overlap similarity                      | Reject candidate as duplicate.                      |

---

## 3. Implementation Playbook (Bite-Sized Checklist)

### Phase 1: Test-Driven Red Suite

- [ ] **Pseudo-JSON Extended Key Tests**: Add test assertions in `src/intelligence/parser.test.js` validating parsing, overwriting, multi-item `INVENTORY` aggregation, and deletion (`[KEY: none]`) for `SHIRT`, `PANTS`, `HELD`, `INVENTORY`, `INJURY`, `DISGUISE`, `MOOD`, `SECRET`, and `LOCATION`.
- [ ] **Epistemic Filter Tests**: Build test assertions in `src/intelligence/prompts.test.js` verifying that `[SECRET: ...]` and `[PLAN: ...]` of the User are filtered out from AI Character prompt rendering.
- [ ] **Visual Prompt Filtering Tests**: Add tests in `src/media/image-prompts.test.js` verifying that `INVENTORY` and `SECRET` keys are excluded from `build_aesthetic_map()`.
- [ ] **Prefix ID & Forge-Skip Protection**: Create tests in `src/intelligence/temporal.test.js` proving `usr_` prefixed memories survive consolidation routines, capacity evictions, and receive the pinned scoring boost.

### Phase 2: Storage & Prefix Normalization

- [ ] **Schema Normalization**: Update `src/data/normalizer.js` and `Profile.svelte.js` to stamp user-created memories with `usr_` ID prefixes.
- [ ] **Temporal Forge-Skip Engine**: Implement `usr_` prefix checks, pinned priority boosting, and string/overlap deduplication in `src/intelligence/temporal.js`.

### Phase 3: Parser, Guardrails & Dual Filter Integration

- [ ] **Pseudo-JSON Extended Parser**: Extend `merge_prose_into_field` and `safe_parse_pseudo_json` in `src/utils/text.js` and `src/intelligence/parser.js` to handle multi-item `INVENTORY` aggregation and posture guardrails.
- [ ] **Visual Filter Integration**: Update `build_aesthetic_map` in `src/media/image-prompts.js` to omit `INVENTORY` and non-physical tags from image generation prompts.
- [ ] **Epistemic Filter in Prompts**: Update `render_character` in `src/intelligence/prompts.js` to strip `SECRET` and `PLAN` tags from other entities' `present.non_physical` rendering.

### Phase 4: Prompt Directives & Lifecycle Integration

- [ ] **Prompt Directive Injection**: Add emission formatting instructions for Pseudo-JSON present tags and clothing-to-inventory lifecycles into Director and Character system prompts within `src/intelligence/prompts.js`.

### Phase 5: Verification & Deployment

- [ ] **Run Test Verification Suite**:

  ```bash
  npm run verify
  ```

  _(Validates `test:unit`, `test:design`, `lint`, and `svelte-check`)_.

- [ ] **Long-Session Simulation**: Simulate a 50+ turn narrative session to verify that active present states mutate cleanly, inventory persists without visual pollution, epistemic walls hold, and pinned memories survive consecutive forge cycles.
- [ ] **Production Bundle**:

  ```bash
  npm run build
  ```

- [ ] **Archival**: Update `tasks/PRESENT.md` and archive track documentation.
