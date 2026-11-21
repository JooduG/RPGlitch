# Simulation Skill Pitfalls

> **Tier 2 Scar Tissue**: Empirical failure modes recorded in Triadic Entry Format (`Trigger` / `Wrong Behavior` / `Correct Behavior`).

---

## 1. Non-Deterministic Prompt Prefix (KV-Cache Miss) (Occurrences: 1)

- **Trigger**: Editing `src/simulation/prompts.js` or `compile_prompt()`.
- **Wrong Behavior**: Injecting dynamic timestamps, round numbers, or volatile entity state into the opening `<SYSTEM>` / `<AXIOMATIC_CONSTITUTION>` prefix.
- **Correct Behavior**: Keep the opening system/constitution prefix byte-identical across turns; place volatile round/state context after the static prefix.

## 2. Broken User Agency (P1 Violation) (Occurrences: 1)

- **Trigger**: Authoring or tuning Director/Actor prompt cores in `src/simulation/prompts.js` or `src/engine/steps.js`.
- **Wrong Behavior**: Allowing the AI actor to generate dialogue, thoughts, or actions attributed to the user persona.
- **Correct Behavior**: Enforce strict third-person limited boundaries for non-user entities and reject/detox any user-persona speech.

## 3. Epistemic Wall Leak (`| hide` / `INVENTORY`) (Occurrences: 1)

- **Trigger**: Modifying entity rendering, `compile_prompt()`, `RelationalGraph.svelte`, or diffusion prompt builders (`src/simulation/brackets.js`, `src/simulation/prompts.js`).
- **Wrong Behavior**: Passing raw `non_physical` bracketed state (e.g., `eternal.non_physical` / `present.non_physical`) without `format_tagged_fields`, harvesting incoming `RelationalGraph` edges with `perspective = "owner"` outside `dev_mode`, or leaking `INVENTORY`/`STASH` into image prompts.
- **Correct Behavior**: Route **all** `physical` and `non_physical` character context in `compile_prompt()` through `format_tagged_fields(text, { see_hidden, is_counterpart })`, pass `perspective = app.settings.dev_mode ? "omniscient" : "other"` for incoming `RelationalGraph` edges, and route visual prompts through `build_aesthetic_map(entity)`.

## 4. Stale `src/intelligence/` or `PAST_VECTOR_CAP` References (Occurrences: 3)

- **Trigger**: Reading older docs or writing new simulation tests/modules.
- **Wrong Behavior**: Importing from eradicated `src/intelligence/*` paths, or assuming `PAST_VECTOR_CAP = 20`.
- **Correct Behavior**: Use `src/engine/` (`chrono.svelte.js`, `lifecycle.js`, `steps.js`, `transport.js`, `turns.js`), `src/simulation/` (`brackets.js`, `dynamics.js`, `history.js`, `llm-output.js`, `prompts.js`, `retrieval.js`), `src/state/` (`execution.svelte.js`, `interface.svelte.js`, `session.svelte.js`), and `FIELD_FLOORS` / `EMBEDDING_SPECS.MAX_EPHEMERAL_VECTORS = 200` from `src/config.js`.

## 5. Value-Referenced `[KEY: ... @TARGET ...]` & `<MEMORIES>` Key Preservation (Occurrences: 1)

- **Trigger**: Authoring relationship brackets, Caretaker prompt instructions, or `<MEMORIES>` rendering in `src/simulation/prompts.js` and `src/simulation/brackets.js`.
- **Wrong Behavior**: Requiring `[@TARGET: ...]` as the bracket key (LLMs naturally emit `[GOAL: ... @TARGET ...]` and key-based entries clobber multiple facets toward the same target) or rendering `m.text` alone in `<MEMORIES>` (drops `m.key`).
- **Correct Behavior**: Use value-referenced `[KEY: ... @TARGET ... | flags]`, inject active-cast `@ID` slugs into `PURPOSE_CORES.CARETAKER`, and render `[${m.key}: ${m.text}]` in `<MEMORIES>`.
