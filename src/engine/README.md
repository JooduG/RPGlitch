# RPGlitch Sovereign Simulation Engine (`src/engine/`)

## Overview

Headless, reactive simulation kernel and turn orchestration pipeline for **RPGlitch**.
This package encapsulates the complete 3-turn narrative heartbeat (Director Shot, Character Shot, and Caretaker Round-Robin), XML prompt envelope compilation, streaming transport abstraction, Two-Tier Sieve RAG vector memory, bracket parsing, and Svelte 5 state reactivity.

### Parallel Coexistence & Migration Architecture

`src/engine/` is built as a **sovereign parallel application engine** running alongside the legacy codebase until Phase 4 (Gate 4) cutover:

- **Zero Legacy Dependency**: The engine does not import from legacy stores (`src/state/runtime.svelte.js`, `src/state/status.svelte.js`, `src/intelligence/director.js`).
- **Data Layer Integration**: When Gate 2 consolidates the data layer (`src/data/db.js`), `Kernel` will read and write to the shared Dexie database schema. Existing user profiles, saved entities, and stories remain preserved.
- **Preview Coexistence**: During Gate 3, a toggle/query parameter in the root shell mounts the greenfield UI alongside legacy.
- **Wholesale Cutover**: At Gate 4, the top-level application root switches from the legacy controller to `Kernel`, and deprecated files in `src/intelligence/` and `src/state/` are pruned.

## Interface

The package exposes its public interface via [`src/engine/index.js`](./index.js):

### 1. Authoritative State & Reactivity

- [`Kernel`](./kernel.svelte.js): Authoritative Svelte 5 state class managing active entities (`user`, `ai`, `fractal`), macro state (`round`, `phase`), transcript `history`, and turn dispatch with transactional rollback on failure.
  - `submit_turn(userText, options)`: Submits a user prompt, increments `round`, and executes the turn pipeline.
  - `rewind_to_round(targetRound)`: Rewinds dialogue and macro round state.
- [`DevLog`](./dev.svelte.js) / `dev_log`: Svelte 5 reactive telemetry ring buffer bounded to 100 events (`MAX_DEV_EVENTS = 100`) recording diagnostics (`DYNAMICS_DELTA`, `TURN_TEMPO`, `ERROR`).
  - `record(type, payload)`: Appends an event to the ring buffer.
  - `clear()`: Wipes the buffer.

### 2. Turn Orchestration & Life-Cycle

- [`execute_round(options)`](./turns.js): Orchestrates turns across a round with options `{ transport, round, entities, history, director_enabled, onChunk }`.
- [`execute_turn_1_director(options)`](./turns.js): Turn 1 Director quick-shot generating dynamics deltas, visual cues, and tempo.
- [`execute_turn_2_character(options)`](./turns.js): Turn 2 narrative shot streaming in-character prose and extracting `<think>` blocks.
- [`execute_turn_3_caretaker(options)`](./turns.js): Turn 3 round-robin Caretaker maintenance updating quadrants (`eternal`, `present`, `future`, `past`).
- [`calculate_turn_tempo(history)`](./turns.js): Dynamic pacing calculation based on recent dialogue history density.
- [`resolve_caretaker_target(round, entities)`](./turns.js): Round-robin target selection (`AI` -> `USER` -> `FRACTAL` + active `npc`).
- `CARETAKER_ROTATION`: Canonical rotation order constant `["AI", "USER", "FRACTAL"]`.

### 3. Prompt Assembly & Structural Verification

- [`compile_prompt(options)`](./prompts.js): Pure XML prompt compiler supporting the 4 Purpose Cores (`director`, `character`, `caretaker`, `visualizer`). Compiles characters, relations, somatic state, past memories, and system instructions.
- [`verify_compiled_prompt(xml_string)`](./verifier.js): Structural validator enforcing `<SYSTEM>` envelope integrity, tag symmetry, and anti-hallucination barriers.
- [`verify_prompt_hygiene(prompt)`](./verifier.js), [`verify_tag_order(prompt, order)`](./verifier.js), [`verify_tag_balance(xml)`](./verifier.js), [`verify_system_envelope(xml)`](./verifier.js), [`extract_tag_sequence(xml)`](./verifier.js).

### 4. Parsing & Stream Tokenization

- [`parse_brackets(text)`](./parser.js): Extracts bracket tokens `[KEY: VALUE]` into structured token lists.
- [`parse_bracket_token(raw_token)`](./parser.js): Parses a single bracket string into key, value, and metadata flags.
- [`extract_think_block(text)`](./parser.js): Extracts `<think>...</think>` internal monologue from streaming or completed LLM outputs.
- [`format_clean_brackets(state_obj)`](./parser.js): Serializes state objects into canonical `[KEY: VALUE]` bracket format.

### 5. Two-Tier Sieve RAG & Vector Math

- [`two_tier_sieve_rag(query, candidates, options)`](./sieve.js): Dual-tier vector retrieval with relevance decay, recency weighting, origin protection (`is_origin`), and diversity scoring.
- [`score_and_rank_memories(query_embedding, memories, options)`](./sieve.js): Cosine similarity scoring with temporal decay.
- [`create_ephemeral_vector_cache(max_size)`](./sieve.js): In-memory FIFO embedding cache bounded to 200 items.
- [`cosine_similarity(vec_a, vec_b)`](./sieve.js): Normalized dot-product vector similarity.
- [`count_text_tokens(text)`](./sieve.js): Hybrid token counter using native Perchance counter with character-ratio fallback.

### 6. Streaming Transport Boundary

- [`create_transport({ stream_fn, max_concurrency })`](./transport.js): Concurrency-controlled streaming gateway with queueing, cancellation, and chunk buffering.

## Invariants

- **Svelte 5 Purity**: All reactive state is modeled with `$state()` runes in `.svelte.js` files. No legacy stores (`writable`, `readable`) or Svelte 4 store subscriptions exist in `src/engine/`.
- **Envelope Standard**: All compiled prompts strictly open with `<SYSTEM>` and close with `</SYSTEM>`.
- **Epistemic Prompt Boundary**: Hidden properties flagged `| hide` are strictly excluded from opposing character contexts unless explicitly permitted by `see_hidden: true`.
- **Quadrant Partitioning**: Caretaker bracket updates strictly partition into explicit quadrants (`eternal`, `present`, `future`, `past`).
- **Dynamics Ownership & Bounding**:
  - In 2-shot mode (`director_enabled: true`), dynamics deltas emitted by the Director are clamped to `[-20, 20]` per turn, and entity dynamics values are clamped within `[5, 95]`.
  - In 1-shot mode (`director_enabled: false`), dynamics meters remain steady at current values (no LLM delta pass).
- **Transactional Rollback**: If Turn 1 or Turn 2 fails during `Kernel.submit_turn()`, the `round` counter, `history` transcript, and both `ai.dynamics` and `fractal.dynamics` snapshots are restored to their pre-turn state.
- **Ring Buffer Capping**: `DevLog` maintains an in-memory event buffer of at most 100 entries (`MAX_DEV_EVENTS = 100`). Sieve ephemeral vector cache caps at 200 items (`MAX_EPHEMERAL_VECTORS = 200`).
- **Camera Note JSON Hygiene**: Diffusion visualizer camera parameters escape JSON strings properly to prevent prompt injection or schema breakage.

## Side Effects

- **State Mutation**: `Kernel.submit_turn()` mutates reactive state (`round`, `history`, `phase`, `ai.dynamics`, `fractal.dynamics`).
- **Diagnostics & Telemetry**: Emits lifecycle events (`DYNAMICS_DELTA`, `TURN_TEMPO`, `ERROR`) to `dev_log`.
- **Streaming Handlers**: Invokes consumer-provided `onChunk` streaming callback during Turn 2 inference.

## Verification

- Run test suite: `npm run test:engine`
