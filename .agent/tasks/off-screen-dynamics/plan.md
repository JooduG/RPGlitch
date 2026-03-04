# Off-Screen Dynamics Protocol (Implementation Plan)

## Phase 1: State (The Entities)

1. **`src/data/repository.js` or `intelligence_broker.js`**:
    - Ensure `entities.list("character")` is available and efficiently caches/loads background NPCs.
    - We need a way to selectively pull T3 NPCs to avoid processing every minor character in the database.

## Phase 2: Logic (The Physics Engine)

1. **`src/core/intelligence/dynamics_engine.js`**:
    - **Task**: Implement `calculate_offscreen_dynamics(input, background_entities)`.
    - **Details**: Loop through the `background_entities` array. For each entity, resolve a mini-dynamics tick based on the user's `input` and the entity's current `dynamics`.
    - Track tracking of `intensity` axes. If `intensity >= LAW_HIGH` (e.g., 85), push the entity to a `flagged_intruders` list.
    - **Task**: Update `compose(context)` to accept background entities, execute the audit, and append the `flagged_intruders` to the returned `meta` object and `SYSTEM_PROMPTS` context.
    - _Estimated Time: 45 minutes._

2. **`src/core/intelligence/intelligence_broker.js`**:
    - **Task**: Update `ContextBroker.assemble()` to fetch background entities.
    - **Details**: Fetch all background characters, strip out `active_user` and `active_ai`, and append them to the payload structured for `Engine.compose()`.
    - _Estimated Time: 30 minutes._

## Phase 3: UI/Prompt Engineering (The FRACTAL)

1. **`src/core/intelligence/prompt_builder.js`**:
    - **Task**: Implement `<BACKGROUND_INTENSITY>` injection.
    - **Details**: If `flagged_intruders` exists and is not empty, generate an XML block listing the entities.
    - **Task**: Implement `SCENE_PACING` failsafe.
    - **Details**: Add instructions to the `<FRACTAL>` persona to explicitly evaluate the active scene's intensity. If the scene is slow ("BREATHER" reflexes, high openness/affinity), instruct the FRACTAL to suppress the intrusion to maintain the mood.
    - _Estimated Time: 45 minutes._

## Phase 4: Verification (Tests)

1. **`src/core/intelligence/dynamics_engine.test.js`**:
    - **Task**: Write unit tests for the background dynamics math to ensure off-screen intensity is correctly calculated and does not bleed into the active AI's state.
    - _Estimated Time: 45 minutes._

## 5. Deployment

- Re-run `npm run test` and `npm run lint`.
- Ensure no Svelte 5 rune violations.
- Verify through manual testing with a kinetic prompt vs. a static prompt.
