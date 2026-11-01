# Engine Implementation Audit & Alignment Log

This document tracks all intentional clarifications, pending architectural alignment points, and completed deviations between [`nuclear-plan.md`](./nuclear-plan.md), [`gate-1-engine-scaffolding-plan.md`](./gate-1-engine-scaffolding-plan.md), and the greenfield engine code in [`src/engine/`](./src/engine/).

---

## 1. Intentional Clarifications (User Refinements)

These design decisions superseded earlier drafts in `nuclear-plan.md` during interactive pair programming:

1. **Purge of Theater Nomenclature ("Actor" $\rightarrow$ "Character")**:
   - Replaced theater-stage jargon across files, prompt tags, and functions (`execute_turn_2_character`, `CHARACTER_CORE`, etc.) to ground agent self-awareness strictly in sovereign entity identity.
2. **Kernel Class & File Nomenclature**:
   - Simplified `simulation.svelte.js` / `SimulationKernel` to `kernel.svelte.js` / `Kernel`.
3. **Axioms & Protocol Deconstruction**:
   - Renamed `<AXIOMS>` to `<AXIOMATIC_CONSTITUTION>` with `<CONSTITUTION_AMENDMENT>`.
   - Dissolved the monolithic, negative `<ANTI_SLOP>` block into 6 positive, single-responsibility operational protocol subtags:
     - `<PHYSICAL_GROUNDING>`: Sensory friction, posture, spatial truth, material inertia.
     - `<NARRATIVE_MOMENTUM>`: Dramatic momentum, unresolved tension, active stakes.
     - `<SPOKEN_DIALOGUE>`: Organic voice, dialect fidelity, anti-monologue brevity.
     - `<PROSE_DISCIPLINE>`: Concise descriptive density, third-person limited restraint.
     - `<NOTATION_AND_CHOICE>`: Narrative choice presentation, zero meta-commentary.
     - `<DATA_SANITIZATION>`: Epistemic boundary safety and bracket hygiene.
4. **Dynamic Participants & Zero-Tag Omission**:
   - Dynamically scales to 1, 2, or 3+ entities without emitting empty XML placeholder tags (`<WORLD>`, `<MEMORY>`, etc. are completely omitted when empty).
5. **Dynamic History Window & Real Macro Rounds**:
   - Replaced hardcoded `rounds="4"` with `count="${round_count}"`, labeled endpoints with `recency="oldest"` and `recency="newest"`, and rendered authentic macro round numbers (`h.round`) rather than slice indices.
6. **Purged `input` Redundancy from Task Core**:
   - Removed naked `User Action: "${input}"` strings from Block 11 because user input is already present and contextualized in `<RECENT>`.
7. **Elimination of Artificial Memory Hardcaps & Mid-Tier Fields**:
   - Removed arbitrary integer caps (`MAXIMUM_SESSION_MEMORIES = 20`, `TOTAL_MEMORY_BUDGET_CHARACTERS = 10000`, `MAXIMUM_DIRECTOR_KEYWORDS = 5`).
   - Purged mid-tier schema bloat (`keywords`, `story_status`) from Director prompt and fallback payloads, focusing strictly on actionable mechanics (`_thought_process`, `next_action`, `directors_note`, `dynamics_deltas`, `visual_staging`, `spotlight`).

---

## 2. Unsure / Pending Decisions (Deferred to Subsequent Gates)

1. **Motif Resurgence in `sieve.js` (`MOTIF_RESURGENCE`)**:
   - _Plan Reference_: `nuclear-plan.md` lines 415–432 describe an algorithm for pairwise cross-turn cosine clustering to detect repeating motifs/nouns in recent turns and boost them in memory recall.
   - _Status_: Parked. Will be evaluated during Gate 2 alongside the local ONNX embedding pipeline.
2. **Slash Command Pre-Pass in `transport.js`**:
   - _Plan Reference_: `nuclear-plan.md` lines 128 & 397–400 mention stripping slash commands (`/ooc`, `/reroll`, `/continue`) at the transport layer and wrapping `/ooc` in `<PLAYER_DIRECTIVE>`.
   - _Status_: Parked. Command routing is cleaner at the `kernel.svelte.js` or UI boundary rather than coupling text parsing into raw network transport.
3. **Tempo & Stagnation Nudges (`MOMENTUM_SOFT_PERMIT` / `MOMENTUM_HARD_MANDATE`)**:
   - _Plan Reference_: `nuclear-plan.md` lines 374–376 describe tempo escalation after 8 and 16 turns of low narrative delta.
   - _Status_: Parked. `TEMPO_ROUNDS` constants are in `config.js`; dynamic prompt injection will be wired during orchestration integration.
4. **Chaos / Entropy Recall Degradation Glyphs (`■■■`)**:
   - _Plan Reference_: `nuclear-plan.md` line 380 triggers memory corruption text glyphs (`■■■`) when `chaos >= 70` or `entropy >= 70`.
   - _Status_: Parked. Will be connected once the complete Somatic Physics engine is integrated.
5. **Fast-Path Recovery Task (`render_terse_director_task`)**:
   - _Plan Reference_: `nuclear-plan.md` lines 125 & 518 describe a minimal task string for fast 1-shot recovery when JSON generation fails or token budgets are critical.
   - _Status_: Parked for subsequent recovery handler hardening.

---

## 3. Implemented Misses (Completed)

1. **Complete Shot 1 Schema in Director Fallback (`turns.js`)**:
   - Added `visual_staging: ""` and `spotlight: ""` to the fallback staging object in `execute_turn_1_director`.
2. **Inventory & Stash Exclusion in Visualizer Appearance (`prompts.js` & `parser.js`)**:
   - Extended `format_clean_brackets` with `strip_inventory` option.
   - When compiling `VISUALIZER_CORE` (`see_hidden: "none"`), all `[INVENTORY: ...]` and `[STASH: ...]` brackets are excluded from the `<APPEARANCE>` block.
3. **`startWith: "<think>"` Cognition Prefill in Character Turn (`turns.js`)**:
   - `execute_turn_2_character` now passes `{ startWith: "<think>" }` in transport options to anchor internal cognition and prevent monologue bleed.
4. **Director Task Precision & Schema Guidance in Block 11 (`prompts.js`)**:
   - Enhanced Director Block 11 `<TASK>` with clear agency constraints, fatal event handling, allowed enum options for `next_action`/`story_status`, integer ranges for `dynamics_deltas`, psychological keywords, and pure JSON output formatting directives. All other blocks remain invariant.
