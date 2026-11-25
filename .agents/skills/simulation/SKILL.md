---
name: simulation
description: Operational runbook for RPGlitch's 3-turn simulation engine (`src/engine/`), prompt compilation, Sieve RAG memory, and deterministic character & fractal physics (`src/simulation/`). Use when modifying `transport.js`, `steps.js`, `turns.js`, `lifecycle.js`, `chrono.svelte.js`, `prompts.js`, `retrieval.js`, or `dynamics.js`. Do NOT use for UI components or runes (use `svelte`), visual tokens/layouts (use `design`), animations (use `motion`), or Web Audio/TTS (use `audio`).
---

# Simulation Engine Runbook

> **Pre-Flight Check**: Read [PITFALLS.md](./PITFALLS.md) before editing any simulation or engine module.

> **Spec Boundary**: Authoritative product specs live in [README.md](../../../README.md) and [GEMINI.md](../../../GEMINI.md). This skill covers **how** to modify and verify the live engine in `src/engine/` and pure simulation logic in `src/simulation/`.

---

## 1. Live Engine Map

### Rank 4 (`src/engine/`)

- **Transport (`src/engine/transport.js`)**: `get_transport()`, `create_live_stream_fn()`, `is_abort_error()`, `get_mock_message()`; delegates single-flight priority queuing (`LLM_PRIORITY`, `enqueue_llm_job`) to `src/utils/async.js`.
- **Stateless Steps (`src/engine/steps.js`)**: Zero `@state` imports.
  - **Turn 1 (Director)**: `run_planner_step` — evaluates dynamics deltas (`[-20, 20]`), delegates `next_action`, and emits `directors_note` + `camera_note`.
  - **Turn 2 (Character)**: `run_generation_step`, `continue_generation_step`, `run_round`.
  - **Turn 3 (Caretaker / Schemas)**: `run_memory_consolidation_step`, `run_schema_extraction_step`, `run_image_prompt_step`.
- **Stateful Turns (`src/engine/turns.js`)**: `run_turn`, `continue_turn`, `persist_turn_rows`, `write_back_turn_state`, `dispatch_consolidation`, `maybe_spawn_turn_image` (clamps dynamics to `[5, 95]` via `step_dynamics`, preserves `dynamics_baseline`, schedules non-blocking `capture_story_image({ ..., background: true })`).
- **Lifecycle (`src/engine/lifecycle.js`)**: `generate_opening`, `generate_closing`, `refine_image_prompt`, `capture_story_image`, `parse_entity_profile`, `create_entity_with_profile`, `generate_user_draft`.
- **Facade (`src/engine/chrono.svelte.js`)**: `ChronoEngine` / `chrono_engine` (`start`, `send`, `retry`, `continue`, `advance_turn`, `stop`).

### Rank 1 (`src/simulation/`)

- **Prompt Compilation (`src/simulation/prompts.js`)**: `PURPOSE_CORES` and `compile_prompt()` assemble the Spatial State Spine (`<SYSTEM>`, `<AXIOMATIC_CONSTITUTION>`, `<PROTOCOLS>`, etc.). Keep the opening prefix byte-identical across turns for KV-cache reuse.
- **Memory & Budgets (`src/simulation/retrieval.js`)**: Two-Tier Sieve RAG enforces character budgets (`FIELD_FLOORS`, `TOTAL_FIELD_FLOORS_CHARACTERS = 1700`). `usr_` memories are origin-protected (`1.5x` relevance).
- **Dynamics & Output (`src/simulation/dynamics.js`, `brackets.js`, `history.js`, `llm-output.js`)**: `step_dynamics` (`"character"` / `"fractal"` scopes), `evaluate_dynamics_directives`, `resolve_image_trigger` (unified `TEMPO_ROUNDS.FAST` cooldown), `resolve_caretaker_target`, `format_tagged_fields`, `clean_generated_prose`, `clean_image_prompts`, `sanitize_visual_text`.

---

## 2. Execution Workflow

1. **Ground**: Read [PITFALLS.md](./PITFALLS.md) and the target `src/engine/` or `src/simulation/` module(s).
2. **Preserve Prefix & Agency**: Keep `<SYSTEM>` / `<AXIOMATIC_CONSTITUTION>` byte-identical across turns and never emit user-persona speech/thoughts.
3. **Verify Epistemic & Visual Filters**: Ensure `format_tagged_fields` (`src/simulation/brackets.js`, including `strip_inventory: see_hidden === "none"`) remains intact inside `compile_prompt()`.
4. **In-Folder Imports**: Use relative `./file.js` imports inside `src/engine/` (never `@engine`).
5. **Test**: Run `npm run agent:test:simulation` and `npm run test:unit` after edits.

---

## 3. Counter-Rationalization Table

| Excuse                                             | Reality                                                                                         |
| :------------------------------------------------- | :---------------------------------------------------------------------------------------------- |
| "I'll just put the round number in `<SYSTEM>`."    | Breaks provider KV-cache prefix reuse. Put volatile state after the static prefix.              |
| "I'll import from `@engine` inside `src/engine/`." | Causes circular barrel imports. Use relative `./file.js` inside `src/engine/`.                  |
| "It's just a small prompt tweak, no test needed."  | Prompt structure is contract-tested. Run `npm run agent:test:simulation` and `prompts.test.js`. |

---

## 4. Verification Checklist

- [ ] `npm run agent:test:simulation` passes (`sim-check.test.js`).
- [ ] `npm run audit:layers` reports 0 layer boundary violations.
- [ ] `npm run test:unit` passes with 0 regressions.
