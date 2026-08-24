---
id: track-2-back-shot-rolling-worker-2026-08-24
title: "Track 2: Back Shot Rolling Worker, Single-Entity State & Relational Mesh"
type: feature
status: proposed
created_at: 2026-08-24
author: Strategy Architect
dependencies:
  - track-1-director-quick-shot-2026-08-24
---

## Track 2 — Back Shot Rolling Worker, Single-Entity State & Relational Mesh

> **Goal**: Replace spiky, cross-entity batch forging with a smooth, focused single-entity **Back Shot** background worker that runs every turn on a round-robin rotation, consolidating lore memories, outward relational vectors, and state conditions strictly off the critical path while completely deprecating legacy NPC role tier promotions.

---

## 1. Context & Architectural Rationale

In our streamlined **Three-Phase Turn Loop**:

1. **Quick Shot**: Fast Director routing ($\le 300\text{ms}$) outputting `next_action`, `keywords`, `directors_note`, and `dynamics_deltas`.
2. **Head Shot**: Live character/NPC prose stream directly into the player's chat feed.
3. **Back Shot**: Rolling background worker executing **exclusively for one entity per round**.

### The Two-State Entity Taxonomy (Purging Legacy Tier System)

We purge the legacy `role_tier` (1 vs 2 vs 3) promotion system in favor of a clean, binary model:

1. **Prose Extras**: Fleeting background characters mentioned on-the-fly in narrative prose (no DB record).
2. **First-Class Entities**: Once minted via Genesis (`next_action: "GENESIS"`), every character is a full entity with an identity card, signature color, and persistent memory.

Because the **Back Shot** visits every active in-scene entity round-robin, all minted characters receive equal, continuous profile deepening without arbitrary tier gates.

### Single-Entity Back Shot Responsibilities

When the Back Shot runs for scheduled **Entity X**:

- **Lore & Memory Vectors**: Analyzes recent turns to append durable `past` vectors, refresh the `future` standing agenda, and update `eternal` baseline shifts.
- **State Conditions**: Updates `present.physical` and `present.non_physical` for Entity X.
- **Relational Mesh**: Updates outward relationship arrows originating from Entity X (`Entity X → Target: dynamic`).
- **Hallucination Elimination**: Focused strictly on 1 entity at a time, preventing cross-character state contamination.

> [!TIP]
> **Round-Robin Rotation Sequence**:
> $$\text{AI\_CHARACTER} \longrightarrow \text{USER\_PERSONA} \longrightarrow \text{FRACTAL} \longrightarrow \text{NPC}_1 \dots \text{NPC}_n \longrightarrow \text{Repeat}$$

---

## 2. Current Verified State

- **Consolidation Trigger & Execution**: [`src/intelligence/temporal.js:876-1034`](../../src/intelligence/temporal.js)
  - Evaluates `unconsolidated.length >= 8` across the whole slice.
  - Calls `forge_memory(entity_targets, slice)` covering all entities in a single JSON payload.
  - Marks entire slice with boolean `msg.meta.consolidated = true`.
  - Guarded by single `_is_consolidating` boolean (lacks foreground mutex coordination).
- **Legacy Promotion Leftover**: `_apply_promotions` and `promotions: [...]` schema fields exist in `kernel.js` and `prompts.js`.

---

## 3. Deep-Dive Technical Design

### 3.1 Per-Entity Progress Tracking

- Replace the global boolean `m.meta.consolidated = true` with per-entity tracking:

```javascript
m.meta.consolidated = { AI_CHARACTER: true, USER_PERSONA: false, FRACTAL: false };
// or a forged_entities: string[] registry
```

### 3.2 Round-Robin Scheduler & Entity Target Resolution

- Maintain a persistent `back_shot_cursor` on the active story record.
- **Rotation Sequence**:
  $$\text{AI\_CHARACTER} \longrightarrow \text{USER\_PERSONA} \longrightarrow \text{FRACTAL} \longrightarrow \text{NPC}_1 \longrightarrow \text{NPC}_n \longrightarrow \text{Repeat}$$
- Each post-stream turn, the Back Shot worker executes **only for the scheduled entity** against its unconsolidated messages.
- If an entity has no new unconsolidated facts, advance cursor to the next entity in sequence without stalling.

### 3.3 Back Shot Schema (Single-Entity Scope)

```json
{
  "_thought_process": "<one short sentence analyzing recent events for target entity>",
  "target": "AI_CHARACTER",
  "eternal": {
    "physical": "Permanent baseline appearance change or empty string",
    "non_physical": "Permanent personality shift or empty string"
  },
  "present": {
    "physical": "Clean updated current conditions",
    "non_physical": "Evocative present-tense state of mind"
  },
  "future": "2-5 sentences of active future tense standing agenda",
  "past": [{ "content": "Durable fact emerged worth keeping", "type": "past", "emotional_weight": 5 }],
  "relationships": ["AI_CHARACTER → Ghost: growing distrust"]
}
```

### 3.4 Non-Blocking Execution & Mutex Integration

- Coordinate with Track 1's generation mutex: if the player submits an action while a Back Shot is in-flight, the Back Shot yields gracefully without blocking the new turn.
- Maintain `{ latest: true }` round-freshness skips.
- Retain `skip_forge` on `CONCLUDED` / `COLLAPSED` stories and fallback consolidation per entity.

---

## 4. Tactical Blueprint & Phasing

### Phase 1: Per-Entity Progress Tracking & Legacy Promotion Purge

- [ ] `task-1.1`: **`RED`** Write unit tests in `src/intelligence/temporal.test.js` asserting per-entity consolidation markers (`forged_entities` / per-entity object map) instead of global slice boolean.
- [ ] `task-1.2`: **`GREEN`** Update consolidation slicer in `src/intelligence/temporal.js` to track per-entity unconsolidated message indices.
- [ ] `task-1.3`: **`GREEN`** Purge legacy `promotions` schema and methods from `kernel.js`, `prompts.js`, and `director.js`.

### Phase 2: Round-Robin Scheduler & Single-Entity Back Shot Compilation

- [ ] `task-2.1`: **`RED`** Add unit tests verifying rotation progression: $\text{AI} \rightarrow \text{User} \rightarrow \text{Fractal} \rightarrow \text{NPC}_n \rightarrow \text{Repeat}$, with cursor skip on inactive entities.
- [ ] `task-2.2`: **`GREEN`** Implement `back_shot_cursor` rotation and single-entity focused prompt in `src/intelligence/temporal.js` supporting memory and outward relational vectors.
- [ ] `task-2.3`: **`GREEN`** Integrate with Track 1 generation mutex to guarantee zero contention with live foreground character streams.

### Phase 3: Single-Entity Output Formatting & Invariant Verification

- [ ] `task-3.1`: **`RED`** Test that single-entity `MEMORY_FORMATION` entries preserve clean formatting for `memories`, `future`, `present`, `eternal`, and `relationships`.
- [ ] `task-3.2`: **`GREEN`** Verify `skip_forge` on concluded stories and fallback consolidation per entity.

---

## 5. File Changes

- [`src/intelligence/temporal.js`](../../src/intelligence/temporal.js) — Per-entity markers, round-robin scheduler, single-entity Back Shot prompts, relational integration.
- [`src/intelligence/kernel.js`](../../src/intelligence/kernel.js) — Pass cursor, integrate mutex, purge legacy `_apply_promotions`.
- [`src/intelligence/prompts.js`](../../src/intelligence/prompts.js) — Purge `promotions` schema fields, single-entity Back Shot prompt template.
- [`src/state/runtime.svelte.js`](../../src/state/runtime.svelte.js) — `back_shot_cursor` state binding.
- [`src/data/repository.js`](../../src/data/repository.js) — Update story Back Shot cursor persistence.

---

## 6. Verification Gate & Acceptance Criteria

- [ ] Round-robin cursor progresses smoothly turn by turn ($\text{AI} \rightarrow \text{User} \rightarrow \text{Fractal} \rightarrow \text{NPC}_n$).
- [ ] Mutex verification: Back Shot yields immediately to incoming user actions.
- [ ] Relational mesh updates execute smoothly for the active entity.
- [ ] Zero watchdog post-turn consolidation timeouts.
- [ ] Automated tests: `npm run test:unit` passing with 0 regressions.
- [ ] Production build: `npm run build`
