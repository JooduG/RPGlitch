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

## 3. Epistemic Wall Leak (`| hide` / `INVENTORY`) (Occurrences: 2)

- **Trigger**: Modifying entity rendering, `compile_prompt()`, `RelationalGraph.svelte`, or diffusion prompt builders (`src/simulation/brackets.js`, `src/simulation/prompts.js`).
- **Wrong Behavior**: Passing raw `non_physical` bracketed state (e.g., `fractal.eternal.non_physical` in `<REALITY>`, `future` in `<TRAJECTORY>`, or `eternal.non_physical` / `present.non_physical`) without `format_tagged_fields`, harvesting incoming `RelationalGraph` edges with `perspective = "owner"` outside `dev_mode`, or leaking `INVENTORY`/`STASH` into image prompts.
- **Correct Behavior**: Route **all** `physical`, `non_physical`, `<REALITY>`, and `<TRAJECTORY>` state in `compile_prompt()` through `format_tagged_fields(text, { see_hidden, is_counterpart })`, pass `perspective = app.settings.dev_mode ? "omniscient" : "other"` for incoming `RelationalGraph` edges, and route visual prompts through `build_aesthetic_map(entity)`.

## 4. Stale `src/intelligence/` or `PAST_VECTOR_CAP` References (Occurrences: 3)

- **Trigger**: Reading older docs or writing new simulation tests/modules.
- **Wrong Behavior**: Importing from eradicated `src/intelligence/*` paths, or assuming `PAST_VECTOR_CAP = 20`.
- **Correct Behavior**: Use `src/engine/` (`chrono.svelte.js`, `lifecycle.js`, `steps.js`, `transport.js`, `turns.js`), `src/simulation/` (`brackets.js`, `dynamics.js`, `history.js`, `llm-output.js`, `prompts.js`, `retrieval.js`), `src/state/` (`execution.svelte.js`, `interface.svelte.js`, `session.svelte.js`), and `FIELD_FLOORS` from `src/config.js`.

## 5. Value-Referenced `[KEY: ... @TARGET ...]` & `<MEMORIES>` Key Preservation (Occurrences: 1)

- **Trigger**: Authoring relationship brackets, Caretaker prompt instructions, or `<MEMORIES>` rendering in `src/simulation/prompts.js` and `src/simulation/brackets.js`.
- **Wrong Behavior**: Requiring `[@TARGET: ...]` as the bracket key (LLMs naturally emit `[GOAL: ... @TARGET ...]` and key-based entries clobber multiple facets toward the same target) or rendering `m.text` alone in `<MEMORIES>` (drops `m.key`).
- **Correct Behavior**: Use value-referenced `[KEY: ... @TARGET ... | flags]`, inject active-cast `@ID` slugs into `PURPOSE_CORES.CARETAKER`, and render `[${m.key}: ${m.text}]` in `<MEMORIES>`.

## 6. `normalize_entity()` Strips `dynamics_baseline` Before Gravity Stepping (Occurrences: 1)

- **Trigger**: Building transient turn copies with `normalize_entity()` in `src/engine/turns.js` before calling `step_dynamics()`.
- **Wrong Behavior**: Passing raw `normalize_entity(source)` output to `extract_metric_baselines()`, which drops `dynamics_baseline` and silently defaults every axis baseline to `50`.
- **Correct Behavior**: Copy `source.dynamics_baseline` onto the transient normalized entity (e.g., via `clone_entity_for_turn()`) before `step_dynamics()` runs.

## 7. Prologue Fractal Identity & Opening Turn Duplication (Occurrences: 1)

- **Trigger**: Editing `generate_opening()` (`src/engine/lifecycle.js`), `run_turn()` (`src/engine/turns.js`), or `PURPOSE_CORES.DIRECTOR` (`src/simulation/prompts.js`).
- **Wrong Behavior**: Passing `AI: fractal_quadrant` into `compile_prompt()` during the prologue (which anthropomorphizes the Fractal as `<MAIN_CHARACTER>` and duplicates `<TRAJECTORY>`/`<MEMORIES>`), passing `prologue_text` into `run_turn()` as a `user` message, or offering `OTHER_CHARACTERS` in `DIRECTOR` when no NPC exists.
- **Correct Behavior**: Omit `AI` in `generate_opening()` (`entities: { USER: user_quadrant, FRACTAL: fractal_quadrant }`), call `run_turn("", { is_opening_turn: true })` without pushing a `user` history entry, and gate `OTHER_CHARACTERS` on `has_npc` while forbidding `COUNTERPART` (User) routing.

## 8. Story vs. Profile Visual Style Ownership (Occurrences: 1)

- **Trigger**: Editing `capture_story_image()` or `refine_image_prompt()` (`src/engine/lifecycle.js`).
- **Wrong Behavior**: Calling `extract_aesthetic_traits(entity)` inside `capture_story_image()`, which duplicates `<MAIN_CHARACTER>` appearance and injects the character's portrait `visual_style` alongside the Fractal's `Aesthetic Style`.
- **Correct Behavior**: Inside a story, the Fractal owns the aesthetic style—pass `(prompt && prompt.trim()) || entity?.name || role_label` in `capture_story_image()`. Reserve Character `visual_style` for Profile Picture generation in `VisualWing.svelte`.

## 9. Dropped `rule.directive` & Orphaned Suppression Guards in `DYNAMICS_RULES` (Occurrences: 1)

- **Trigger**: Editing `DYNAMICS_RULES` (`src/definitions/dynamics-registry.js`) or `evaluate_dynamics_directives()` (`src/simulation/dynamics.js`).
- **Wrong Behavior**: Pushing `{ id: rule.id }` without `text: rule.directive` (leaving all directive prose unread) or deleting a compound rule without removing its mutual-exclusion guards from constituent baselines (creating silent dead zones where neither baseline fires).
- **Correct Behavior**: Emit `{ id: rule.id, text: rule.directive }` into `<SCENARIO_DIRECTIVES>`, and keep baseline suppression guards strictly matched to live Paradox Compounds (`DEVOTION`, `TENSION`, `SOLACE`).

## 10. Truthy `default_tier` Short-Circuiting Optical Tier Bias (Occurrences: 1)

- **Trigger**: Modifying `evaluate_image_trigger()` or `resolve_image_trigger()` in `src/simulation/dynamics.js`.
- **Wrong Behavior**: Returning a truthy `default_tier` (`"story_scene"`) from `evaluate_image_trigger()` on displacement-only triggers, which short-circuits `tier || biased_character_tier || IMAGE_POLICY.DEFAULT_TIER` and silently disables `camera_note` / high-dynamics character-portrait biasing.
- **Correct Behavior**: Return `null` for `tier` on displacement-only triggers so `biased_character_tier` is evaluated before falling back to `IMAGE_POLICY.DEFAULT_TIER`.
