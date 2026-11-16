# Simulation Skill Pitfalls

> **Tier 2 Scar Tissue**: Empirical failure modes recorded in Triadic Entry Format (`Trigger` / `Wrong Behavior` / `Correct Behavior`).

---

## 1. Non-Deterministic Prompt Prefix (KV-Cache Miss)

- **Trigger**: Editing `src/engine/prompts.js` or `compile_prompt()`.
- **Wrong Behavior**: Injecting dynamic timestamps, round numbers, or volatile entity state into the opening `<SYSTEM>` / `<AXIOMATIC_CONSTITUTION>` prefix.
- **Correct Behavior**: Keep the opening system/constitution prefix byte-identical across turns; place volatile round/state context after the static prefix.

## 2. Broken User Agency (P1 Violation)

- **Trigger**: Authoring or tuning Director/Actor prompt cores in `src/engine/prompts.js` or `src/engine/turns.js`.
- **Wrong Behavior**: Allowing the AI actor to generate dialogue, thoughts, or actions attributed to the user persona.
- **Correct Behavior**: Enforce strict third-person limited boundaries for non-user entities and reject/detox any user-persona speech.

## 3. Epistemic Wall Leak (`| hide` / `INVENTORY`)

- **Trigger**: Modifying entity rendering or diffusion prompt builders (`src/data/parser.js`, `src/media/optics.js`).
- **Wrong Behavior**: Passing raw bracketed state with `| hide` flags or `INVENTORY`/`STASH` keys across character perspectives or into image prompts.
- **Correct Behavior**: Route character context through `filter_epistemic_brackets(text, perspective)` / `format_clean_brackets()` and visual prompts through `build_aesthetic_map(entity)`.

## 4. Stale `src/intelligence/` or `PAST_VECTOR_CAP` References

- **Trigger**: Reading older docs or writing new simulation tests/modules.
- **Wrong Behavior**: Importing from eradicated `src/intelligence/*` or `src/state/*` paths, or assuming `PAST_VECTOR_CAP = 20`.
- **Correct Behavior**: Use `src/engine/` (`prompts.js`, `turns.js`, `runs.js`, `sieve.js`, `gate.js`, `kernel.svelte.js`, `chrono.svelte.js`) and `FIELD_FLOORS` / `EMBEDDING_SPECS.MAX_EPHEMERAL_VECTORS = 200` from `src/config.js`.
