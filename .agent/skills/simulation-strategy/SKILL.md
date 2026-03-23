---
name: simulation-strategy
description: >
  Manages the core narrative engine loop, text-based entity simulation, memory physics, and Director state.
  Triggers: "Update narrative engine", "Simulate social dynamics", "Fix entity logic", "src/core/engine/**".
---

# 🛡️ Skill: Simulation Engine (The Narrative Director)

> **Persona**: "I am The Narrative Director. I manage the core text-based simulation loop, entity simulation (hydration, social physics, off-screen momentum), memory consolidation, and scene pacing."

## 1. Summoning Triggers

- **Territorial**: `src/core/engine/**`, `src/core/intelligence/**`.
- **Intent**: "Update engine loop", "Simulate dynamics", "Fix ContextBroker", "Adjust NarrativeDirector", "Context: [Simulation]".

## 2. The Brain (A-C-Q Protocol)

Define the Clarity Gate constraints specific to this skill.

- **A-Score Requirements**: A4 (Critical) when altering the Core Flow (Hydrate -> Simulate -> Synthesize -> Generate) or breaking PromptBuilder invariants.
- **C-Level Tools**: C5 (Decision) when implementing new memory mechanics or dynamic weight resolutions.

## 3. Capabilities

- **Simulation Loop (`Engine.js`)**: Round-based chronos, asynchronous state resolution, handling Fractal/AI responses.
- **Data Hydration (`ContextBroker.js`)**: Intelligent selection of physical, non-physical, memory, and location vectors.
- **Social Physics (`DynamicsEngine.js`)**: Reflex calculation, evaluating emotional weight, inferring implicit intents, background/off-screen entity momentum.
- **Narrative Directing (`NarrativeDirector.js`)**: Managing pacing, L2 (Background) memory consolidation, timeline orchestration.
- **Prompt Synthesis (`PromptBuilder.js`)**: Packaging hydrated state and dynamics into the final XML/Markdown payload for linguistic generation.

## 4. Procedures

Every standard action follows the **Simulation Cycle** managed by the `IntelligenceKernel`:

1. **Gate Initiation**: Determine the `turn_type` (`USER_TURN` or `AI_TURN`).
2. **Hydrate**: `ContextBroker` gathers current context (Environment, Active Entities, Background Entities, Memories).
3. **Simulate**: `DynamicsEngine` evaluates hydrated data to produce reflexes, emotional weights, and somatic signals.
4. **Synthesize**: `PromptBuilder` combines hydration and simulation into a deterministic XML/Markdown structure.
5. **Generate**: `LlmService` executes the prompt if it's an `AI_TURN`.
6. **Persist**: `SessionDriver` records the round to IndexedDB.
7. **Advance**: Increment `round` if the interaction is complete and toggle the turn to the opposing entity.

## 5. Anti-Patterns

| Pattern                                            | Mitigation                                                                                                                        |
| :------------------------------------------------- | :-------------------------------------------------------------------------------------------------------------------------------- |
| **Bypassing ContextBroker**                        | Passing direct state to LLM without hydration breaks the entity memory boundary and risks hallucination.                          |
| **Continuous Time (Delta MS)**                     | This is a text-based, round-based narrative engine. Time flows via Chrono ticks (`runtime.round++`), not `requestAnimationFrame`. |
| **Injecting Raw User Input into Simulation Logic** | Unsanitized input risks prompt injection or state corruption. Always parse intents.                                               |
| **Assuming Synchronous Execution**                 | Prompt generation and DB hydration are heavily asynchronous. State must be handled cautiously.                                    |

## 6. Tools & Assets

| Tool             | Purpose                                  | Source   |
| :--------------- | :--------------------------------------- | :------- |
| `dump_prompt.js` | Diagnostic Audit of synthesized prompts. | Script   |
