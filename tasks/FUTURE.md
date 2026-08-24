# Track 2: Back Shot Rolling Worker, Single-Entity State & Relational Mesh

> Track ID: `track-2-back-shot-rolling-worker-2026-08-24`
> Status: `[~]` In Progress

## 1. Tactical Tasks

### Phase 1: Per-Entity Progress Tracking & Legacy Promotion Purge

- [ ] `task-1.1`: **`RED`** Write unit tests in `src/intelligence/temporal.test.js` asserting per-entity consolidation markers (`forged_entities` / per-entity object map) instead of global slice boolean.
- [ ] `task-1.2`: **`GREEN`** Update consolidation slicer in `src/intelligence/temporal.js` to track per-entity unconsolidated message indices.
- [ ] `task-1.3`: **`GREEN`** Purge legacy `promotions` schema, `role_tier` references, and methods from `kernel.js`, `prompts.js`, and `director.js`.

### Phase 2: Round-Robin Scheduler & Single-Entity Back Shot Compilation

- [ ] `task-2.1`: **`RED`** Add unit tests verifying rotation progression: $\text{AI} \rightarrow \text{User} \rightarrow \text{Fractal} \rightarrow \text{NPC}_n \rightarrow \text{Repeat}$, with cursor auto-advancement across inactive entities (0 unconsolidated messages).
- [ ] `task-2.2`: **`GREEN`** Implement `back_shot_cursor` rotation and single-entity focused prompt in `src/intelligence/temporal.js` supporting memory and outward relational vectors.
- [ ] `task-2.3`: **`GREEN`** Integrate with Track 1 generation mutex to guarantee zero contention with live foreground character streams and immediate discard on preemption.

### Phase 3: Single-Entity Output Formatting & Invariant Verification

- [ ] `task-3.1`: **`RED`** Test that single-entity `MEMORY_FORMATION` entries preserve clean formatting for `memories`, `future`, `present`, `eternal`, and outward `relationships` vectors.
- [ ] `task-3.2`: **`GREEN`** Verify `skip_forge` on concluded stories and fallback consolidation per entity.

---

## 2. Verification Gate

- Unit Tests: `npm run test:unit`
- Markdown & Code Lints: `npm run lint`
- Production Build: `npm run build`
