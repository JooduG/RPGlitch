# Off-Screen Entropy Protocol (Specification)

## 1. Objective

Shatter the ontological solipsism of the simulation. Cure "protagonist syndrome" by empowering background T3-level NPCs to pursue private agendas and autonomously interrupt the User's active scene based on their off-screen momentum/velocity.

## 2. Alignment with Product Vision

According to `ANEX.json` and `lorebook.json` (Ecological Mesh / Protagonist Syndrome directives), the simulation must feel alive independent of the user. T3 NPCs must believe _they_ are the main characters and act accordingly. Intruding on stagnant scenes creates narrative friction and proves the world exists outside the user's immediate viewport.

## 3. Core Mechanics

### 3.1 Velocity Check (Off-Screen Momentum)

- The physics engine (`dynamics_engine.js`) must audit the `velocity` axis of all off-screen entities during a physics tick.
- Inputs that generate high kinetic/impact momentum for the User/AI should also influence these background entities, mapped against their specific `permeability` and `resonance` baselines.
- If an off-screen entity's velocity breaches the `LAW_HIGH` threshold, they are flagged as "Intruding."

### 3.2 FRACTAL Injection

- The Intelligence Broker (`intelligence_broker.js`) must assemble background entities and pass them to the engine.
- The Prompt Builder (`prompt_builder.js`) must inject a `<BACKGROUND_VELOCITY>` context block into the `FRACTAL` system prompt, listing any flagged entities.
- The `FRACTAL` is given explicit instructions to manifest these entities into the current scene.

### 3.3 The Pacing Failsafe

- To over-correct into pure chaos is a failure. Deliberate, low-velocity, high-resonance scenes (e.g., quiet conversations, emotional exposure) MUST be protected.
- The FRACTAL will receive a `SCENE_PACING` directive commanding it to suppress background intrusions if the active scene's velocity is deeply sub-baseline or its resonance is critically high.

## 4. Acceptance Criteria (Definition of Done)

- [ ] `intelligence_broker.js` correctly filters and packages off-screen entities.
- [ ] `dynamics_engine.js` correctly audits background velocity without polluting the active scene's physics data.
- [ ] `prompt_builder.js` correctly renders the `<BACKGROUND_VELOCITY>` block and `SCENE_PACING` protocol for the FRACTAL.
- [ ] T3 background entities successfully interrupt kinetic, stagnant scenes in testing.
- [ ] T3 background entities are correctly suppressed during slow-burn/high-empathy scenes.
- [ ] All unit tests (Vitest) pass.
