# 🚀 Implementation Blueprint — `track-remediate-stress-test-feedback-2026-08-13`

> **Track Goal**: Remediate the 3 actionable findings approved from the long-term stress test review:
>
> 1. Ghost Row Purge for failed/timed-out image placeholders.
> 2. Memory Forge Stale-Goal Eviction Law reinforcement.
> 3. Director Physical Causality Law enforcement.

---

## 🎯 Goal & Specifications

1. **Ghost Row Purge on Failed Image Placeholders**:
   - Update `mark_placeholder_failed` in `src/intelligence/kernel.js` to unconditionally delete empty-text image placeholder rows (from feed or direct IndexedDB query) instead of leaving lingering `src: null` rows in `simulation_log`.
   - Update `src/intelligence/kernel.test.js` to verify zero ghost rows on failed/evicted/timeout image beats.

2. **Stale Goal Eviction in Memory Forge**:
   - Strengthen `render_memory` in `src/intelligence/prompts.js` and `MEMORY_FORGE` in `src/data/definitions/protocols.js` with explicit physical milestone eviction directives (escapes, item acquisitions, curse resolutions must be evicted from `future` and replaced by subsequent objectives/aftermath).

3. **Present Physical Wardrobe & Equipment Preservation**:
   - In `src/intelligence/temporal.js` (`consolidate`), replace destructive `entity.present.physical = summary.physical` assignment with non-destructive `merge_prose_into_field(entity.present.physical, summary.physical)`.
   - Expand `CLOTHING_KEYS` in `src/utils/xml.js` to include `"ROBES"`, `"APPAREL"`, `"UNDERWEAR"`, `"OUTFIT"`, `"CLOTHING"`, `"EQUIPMENT"`, and `"GEAR"`.
   - Add unit tests in `src/intelligence/parser.test.js` and `src/intelligence/temporal.test.js` verifying that baseline clothing/apparel tags survive intact across Memory Forge cycles unless explicitly disrobed.

---

## 📋 Task Checklist

- [x] **Phase 1: Ghost Row Purge & Image Placeholder Cleanup**
  - [x] **Step 1.1 (RED)**: Write unit tests in `src/intelligence/kernel.test.js` verifying that `mark_placeholder_failed` and `sweep_stale_ghosts` delete empty-text placeholder entries from DB and feed.
  - [x] **Step 1.2 (GREEN)**: Update `mark_placeholder_failed` in `src/intelligence/kernel.js` to check direct DB if not in feed and delete empty-text placeholders cleanly.
  - [x] **Step 1.3 (VERIFY)**: Run `npx vitest run src/intelligence/kernel.test.js`.

- [x] **Phase 2: Stale Goal Eviction & Physical Causality Gate**
  - [x] **Step 2.1 (RED)**: Update unit tests in `src/intelligence/prompts.test.js` asserting the revised `render_memory` prompt and `DIRECTOR.CONTINUITY` protocols.
  - [x] **Step 2.2 (GREEN)**: Update `src/intelligence/prompts.js` and `src/data/definitions/protocols.js`.
  - [x] **Step 2.3 (VERIFY)**: Run `npx vitest run src/intelligence/prompts.test.js`.

- [x] **Phase 3: Present Physical Wardrobe & Equipment Preservation**
  - [x] **Step 3.1 (RED)**: Add unit tests in `src/intelligence/parser.test.js` and `src/intelligence/temporal.test.js` asserting `ROBES`, `APPAREL`, and equipment tag retention across memory forge cycles.
  - [x] **Step 3.2 (GREEN)**: Update `src/intelligence/temporal.js` to use `merge_prose_into_field` for `present.physical` and expand `CLOTHING_KEYS` in `src/utils/xml.js`.
  - [x] **Step 3.3 (VERIFY)**: Run `npx vitest run src/intelligence/parser.test.js src/intelligence/temporal.test.js`.

- [x] **Phase 4: Full System Verification & Quality Gate**
  - [x] **Step 4.1**: Run `npm run verify` (lint + audit + Vitest suite: 34 test files, 446 tests passed, 0 errors).
  - [x] **Step 4.2**: Run `npm run build` to verify clean singlefile production build (dist/index.html 1,274.78 kB).
