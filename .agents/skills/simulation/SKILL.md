---
name: simulation
description: Operational runbook for RPGlitch's 3-turn simulation engine, prompt compilation, Sieve RAG memory, and deterministic somatic physics in `src/engine/`. Use when modifying `turns.js`, `runs.js`, `prompts.js`, `sieve.js`, `dynamics.js`, `gate.js`, `kernel.svelte.js`, or `chrono.svelte.js`. Do NOT use for UI components or runes (use `svelte`), visual tokens/layouts (use `design`), animations (use `motion`), or Web Audio/TTS (use `audio`).
---

# Simulation Engine Runbook

> **Pre-Flight Check**: Read [PITFALLS.md](./PITFALLS.md) before editing any simulation module.

> **Spec Boundary**: Authoritative product specs live in [README.md](../../../README.md) and [GEMINI.md](../../../GEMINI.md). This skill covers **how** to modify and verify the live engine in `src/engine/`.

---

## 1. Live Engine Map

- **Entry & Lifecycle**: `src/engine/chrono.svelte.js` (`chrono_engine.send()`), `src/engine/kernel.svelte.js` (`Kernel`), `src/engine/runs.js` (`execute_turn`, `execute_continue`, `dispatch_caretaker_consolidation`).
- **3-Turn Pipeline (`src/engine/turns.js`)**:
  - **Turn 1 (Director)**: `execute_turn_1_director` — fast staging pass; evaluates somatic deltas, delegates next actor, optionally schedules image beats (`spawn_image_beat` in `runs.js`), and emits `directors_note`.
  - **Turn 2 (Character)**: `execute_turn_2_character` — streams in-character dialogue, `<think>` cognition, and sensory prose; runs `detox_prose(text, resolved_style)`.
  - **Turn 3 (Caretaker)**: `execute_turn_3_caretaker` — background consolidation (`LLM_PRIORITY.BACKGROUND` via `gate.js`), computing 384-d embeddings and writing `mutation_ledger` diffs.
- **Prompt Compilation (`src/engine/prompts.js`)**: `PURPOSE_CORES` and `compile_prompt()` assemble the 11-block Spatial State Spine (`<SYSTEM>`, `<AXIOMATIC_CONSTITUTION>`, `<PROTOCOLS>`, etc.). Keep the opening prefix byte-identical across turns for KV-cache reuse.
- **Memory & Budgets (`src/engine/sieve.js`)**: Two-Tier Sieve RAG enforces character budgets (`FIELD_FLOORS`, `TOTAL_FIELD_FLOORS_CHARACTERS = 1700`) and `EMBEDDING_SPECS.MAX_EPHEMERAL_VECTORS = 200` (`src/config.js`). `usr_` memories are origin-protected (`1.5x` relevance).
- **Somatic Physics & Gate**: `src/engine/dynamics.js` (`reduce_dynamics`, clamped to `DYNAMICS.DELTA.CLIP` `[5, 95]` in `Kernel.submit_turn`), `src/engine/gate.js` (`run_llm_job`, `LLM_PRIORITY`).

---

## 2. Execution Workflow

1. **Ground**: Read [PITFALLS.md](./PITFALLS.md) and the target `src/engine/` module(s).
2. **Preserve Prefix & Agency**: Keep `<SYSTEM>` / `<AXIOMATIC_CONSTITUTION>` byte-identical across turns and never emit user-persona speech/thoughts.
3. **Verify Epistemic & Visual Filters**: Ensure `filter_epistemic_brackets` / `format_clean_brackets` (`src/data/parser.js`) and `build_aesthetic_map` (`src/media/optics.js`) remain intact.
4. **In-Folder Imports**: Use relative `./file.js` imports inside `src/engine/` (never `@engine`).
5. **Test**: Run `npm run audit:simulation` and `npm run test:unit` after edits.

---

## 3. Counter-Rationalization Table

| Excuse                                             | Reality                                                                                    |
| :------------------------------------------------- | :----------------------------------------------------------------------------------------- |
| "I'll just put the round number in `<SYSTEM>`."    | Breaks provider KV-cache prefix reuse. Put volatile state after the static prefix.         |
| "I'll import from `@engine` inside `src/engine/`." | Causes circular barrel imports. Use relative `./file.js` inside `src/engine/`.             |
| "It's just a small prompt tweak, no test needed."  | Prompt structure is contract-tested. Run `npm run audit:simulation` and `prompts.test.js`. |

---

## 4. Verification Checklist

- [ ] `npm run audit:simulation` passes (`sim-check.test.js`).
- [ ] `npm run audit:layers` reports 0 layer boundary violations.
- [ ] `npm run test:unit` passes with 0 regressions.
