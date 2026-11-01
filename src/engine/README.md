# RPGlitch Sovereign Simulation Engine (`src/engine/`)

## Overview

Headless, reactive simulation kernel and turn orchestration pipeline for **RPGlitch**.
This package encapsulates the complete 3-turn narrative heartbeat (Director Shot, Character Shot, and Caretaker Round-Robin), XML prompt envelope compilation, streaming transport abstraction, Two-Tier Sieve RAG vector memory, bracket parsing, and Svelte 5 state reactivity.

All engine components are greenfield, self-contained, and isolated from legacy stores until Phase 4 cutover.

## Interface

The package exposes its public interface via [`src/engine/index.js`](./index.js):

### 1. Authoritative State & Reactivity

- [`Kernel`](./kernel.svelte.js): Svelte 5 reactive kernel managing simulation state (`spine`, `dynamics`, `history`, `round`, `phase`), turn execution, differential updates, and transactional rollback on failure.
- [`DevLog`](./dev.svelte.js) / `dev_log`: Svelte 5 reactive telemetry ring-buffer (bounded to 100 events) recording prompt payloads, parse deltas, and lifecycle events.

### 2. Turn Orchestration & Life-Cycle

- [`execute_round(kernel, user_input, stream_fn, callbacks)`](./turns.js): Executes a full 3-turn round sequence with streaming callbacks.
- [`execute_turn_1_director(kernel, user_input, stream_fn)`](./turns.js): Turn 1 Director quick shot generating dynamics deltas, visual cues, and tempo.
- [`execute_turn_2_character(kernel, user_input, stream_fn, callbacks)`](./turns.js): Turn 2 in-character narrative shot with streaming prose and `<think>` cognitive extraction.
- [`execute_turn_3_caretaker(kernel, stream_fn)`](./turns.js): Turn 3 round-robin Caretaker maintenance updating quadrants (`eternal`, `present`, `future`, `past`).
- [`calculate_turn_tempo(user_input, previous_tempo)`](./turns.js): Dynamic pacing calculation based on input brevity and intensity.
- [`resolve_caretaker_target(round)`](./turns.js): Round-robin target selection (`user` -> `ai` -> `fractal`).
- `CARETAKER_ROTATION`: Canonical rotation order constant `['user', 'ai', 'fractal']`.

### 3. Prompt Assembly & Structural Verification

- [`compile_prompt(purpose, context)`](./prompts.js): Pure XML prompt compiler supporting the 4 Purpose Cores (`DIRECTOR`, `CHARACTER`, `CARETAKER`, `VISION`). Compiles characters, relations, somatic state, past memories, and system instructions.
- [`verify_compiled_prompt(xml_string)`](./verifier.js): Structural validator enforcing `<system>`, `<turn>`, `<user_input>` envelope integrity, tag symmetry, and anti-hallucination barriers.
- [`verify_prompt_hygiene(prompt)`](./verifier.js), [`verify_tag_order(tags)`](./verifier.js), [`verify_tag_balance(xml)`](./verifier.js), [`verify_system_envelope(xml)`](./verifier.js), [`extract_tag_sequence(xml)`](./verifier.js).

### 4. Parsing & Stream Tokenization

- [`parse_brackets(text)`](./parser.js): Extracts bracket tokens `[KEY: VALUE]` into structured key-value maps.
- [`parse_bracket_token(raw_token)`](./parser.js): Parses a single bracket string into key, value, and flags.
- [`extract_think_block(text)`](./parser.js): Extracts `<think>...</think>` internal monologue from streaming or completed LLM outputs.
- [`format_clean_brackets(state_obj)`](./parser.js): Serializes state objects into canonical `[KEY: VALUE]` bracket format.

### 5. Two-Tier Sieve RAG & Vector Math

- [`two_tier_sieve_rag(query, candidates, options)`](./sieve.js): Dual-tier vector retrieval with relevance decay, recency weighting, origin protection (`is_origin`), and diversity scoring.
- [`score_and_rank_memories(query_embedding, memories, options)`](./sieve.js): Cosine similarity scoring with temporal decay.
- [`create_ephemeral_vector_cache(max_size)`](./sieve.js): In-memory FIFO embedding cache bounded to 200 items.
- [`cosine_similarity(vec_a, vec_b)`](./sieve.js): Normalized dot-product vector similarity.
- [`count_text_tokens(text)`](./sieve.js): Approximate token counter (~4 chars/token).

### 6. Streaming Transport Boundary

- [`create_transport({ stream_fn, max_concurrency })`](./transport.js): Concurrency-controlled streaming gateway with queueing, cancellation, and chunk buffering.

## Invariants

- **Svelte 5 Purity**: All reactive state is modeled with `$state()` runes in `.svelte.js` files. No legacy stores (`writable`, `readable`) or Svelte 4 store subscriptions exist in `src/engine/`.
- **Epistemic Prompt Boundary**: Hidden properties flagged `| hide` are strictly excluded from opposing character contexts unless explicitly permitted by `see_hidden: true`.
- **Quadrant Partitioning**: Caretaker bracket updates strictly partition into explicit quadrants (`eternal`, `present`, `future`, `past`).
- **Dynamics Bounding**: Dynamics deltas are strictly clamped to `[-20, 20]` per turn, and overall metric values remain bounded within `[5, 95]`.
- **Transactional Rollback**: If Turn 1 or Turn 2 fails during `execute_round`, `round` counter, `dynamics`, and `history` mutations are restored to their pre-turn snapshots.
- **Ring Buffer Capping**: `DevLog` maintains an in-memory event buffer of at most 100 entries (`MAX_DEV_EVENTS = 100`). Sieve ephemeral vector cache caps at 200 items (`MAX_EPHEMERAL_VECTORS = 200`).
- **Camera Note JSON Hygiene**: Diffusion visualizer camera parameters escape JSON strings properly to prevent prompt injection or schema breakage.

## Side Effects

- **State Mutation**: `Kernel.prototype.apply_mutation` modifies reactive state, records diffs to the mutation history, and updates simulation turn timestamps.
- **Diagnostics & Telemetry**: Emits lifecycle events (`ROUND_START`, `PROMPT_COMPILED`, `STREAM_CHUNK`, `TURN_COMPLETE`, `ROUND_COMPLETE`, `ROLLBACK`) to `dev_log`.
- **Streaming Handlers**: Invokes consumer-provided `on_chunk` and `on_think` streaming callbacks during Turn 2 inference.

## Verification

- Run test suite: `npm run test:engine`
