---
id: feature-inner-voice-2026-06-29
type: feature
status: new
created_at: 2026-06-29T20:25:00Z
updated_at: 2026-06-29T20:25:00Z
description: Implement 2-Shot Private Inner Voice architecture
---

# ETERNAL: Technical Specification

## Objective
Split AI turn generation into a two-shot pipeline (Director + Actor) to prevent meta-commentary bleed and enable dynamic state mutations and keyword-driven memory retrieval.

## Success Criteria
- Direct/silent LLM invocation for Shot 1 (Director) returning a structured JSON payload within a 150-token budget.
- Robust JSON parsing (extracting JSON blocks from potential markdown backticks/text).
- State mutations successfully patching active entity's `present.non_physical` attributes and shifting future vectors to past memories.
- Shot 2 (Actor) streaming natural, third-person limited prose using context fetched via Director search keys.
- Unit test suite passing with 100% coverage on new parsing, mutation, and kernel logic.

## Tech Stack
- Svelte 5 (Runes)
- Vitest for TDD verification
- Dexie.js for memory persistence

## Boundaries
- **Never**: Stream Shot 1 to the user interface.
- **Never**: Expose raw JSON parameters or thoughts to the Actor's narrative prose.
- **Always**: Parse and clean JSON response safely to avoid app crashes.

---

# FUTURE: Hierarchical Implementation Plan

## Phase 1: Platforms & State Upgrades (TDD)
- [ ] Write unit test for `temporal_engine.apply_state_mutations` in `temporal.test.js`.
- [ ] Implement `apply_state_mutations` in `temporal.js`.
- [ ] Update `llm_service._mock_generate` in `transport.js` to return mock JSON for Director prompts.

## Phase 2: Prompt Building & Parsing (TDD)
- [ ] Write unit tests for `parse_director_json` and prompt building in `prompts.test.js`.
- [ ] Define `build_director_prompt` and `build_actor_prompt` in `prompts.js`.
- [ ] Implement `parse_director_json` helper in `kernel.js`.

## Phase 3: Kernel Integration & Execution
- [ ] Refactor `gamemaster.execute_turn` in `kernel.js` to coordinate Shot 1 and Shot 2 sequential execution.
- [ ] Write unit tests in `kernel.test.js` to mock and verify the complete 2-shot pipeline execution.
- [ ] Run `npx vitest run src/intelligence/` to verify all tests pass.

## Phase 4: Verification & Clean Up
- [ ] Manually verify local devmode execution and inspect IndexedDB turns.
- [ ] Clean up temp files and run final linter verification (`npm run verify`).

---

# PRESENT: Navigation & Pulse

## Active Task
- Awaiting implementation plan approval.

## Pulse (History)
- **2026-06-29 20:25**: Track initialized. Plan created and submitted for review.
