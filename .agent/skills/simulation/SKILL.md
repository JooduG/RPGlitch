---
name: simulation
version: 1.1.0
description: >
    Manages the core narrative engine loop, text-based entity simulation, memory physics, and Director state.
    Triggers: "Update narrative engine", "Simulate social dynamics", "Fix entity logic", "src/core/engine/**".
---

# 🛡️ Skill: Simulation Engine (The Narrative Director)

> **Persona**: "I am The Narrative Director. I manage the core text-based game loop, entity simulation (hydration, social physics, off-screen momentum), memory consolidation, and scene pacing."

## 1. Summoning Triggers

- **Territorial**: `src/core/engine/**`, `src/core/intelligence/**`.
- **Intent**: "Update engine loop", "Simulate dynamics", "Fix ContextBroker", "Adjust NarrativeDirector", "Context: [Simulation]".

## 2. The Brain (A-C-Q Protocol)

Define the Clarity Gate constraints specific to this skill.

- **A-Score Requirements**: A4 (Critical) when altering the Core Flow (Hydrate -> Simulate -> Synthesize -> Generate) or breaking PromptBuilder invariants.
- **C-Level Tools**: C5 (Decision) when implementing new memory mechanics or dynamic weight resolutions.

## 3. Capabilities

- **Game Loop (`Engine.js`)**: Turn-based chronos, asynchronous state resolution, handling Fractal/AI responses.
- **Data Hydration (`ContextBroker.js`)**: Intelligent selection of physical, non-physical, memory, and location vectors.
- **Social Physics (`DynamicsEngine.js`)**: Reflex calculation, evaluating emotional weight, inferring implicit intents, background/off-screen entity momentum.
- **Narrative Directing (`NarrativeDirector.js`)**: Managing pacing, L2 (Background) memory consolidation, timeline orchestration.
- **Prompt Synthesis (`PromptBuilder.js`)**: Packaging hydrated state and dynamics into the final XML/Markdown payload for linguistic generation.

## 4. Procedures

Every standard action follows the Engine Loop:

1. **Hydrate**: `ContextBroker` gathers context (Environment, Active Entities, Background Entities, Memories).
2. **Simulate**: `DynamicsEngine` evaluates hydrated data to produce reflexes, emotional weights, and off-screen mechanics.
3. **Synthesize**: `PromptBuilder` combines hydration and simulation into a deterministic LLM prompt structure.
4. **Generate**: `LlmService` executes the prompt.
5. **Persist & Consolidate**: `SessionDriver` records the result. `NarrativeDirector` evaluates if background memories require deeper consolidation.

## 5. Anti-Patterns

| Pattern                                            | Mitigation                                                                                                                          |
| :------------------------------------------------- | :---------------------------------------------------------------------------------------------------------------------------------- |
| **Bypassing ContextBroker**                        | Passing direct state to LLM without hydration breaks the entity memory boundary and risks hallucination.                            |
| **Continuous Time (Delta MS)**                     | This is a text-based, turn-based narrative engine. Time flows via Chrono ticks (`engineState.turn++`), not `requestAnimationFrame`. |
| **Injecting Raw User Input into Simulation Logic** | Unsanitized input risks prompt injection or state corruption. Always parse intents.                                                 |
| **Assuming Synchronous Execution**                 | Prompt generation and DB hydration are heavily asynchronous. State must be handled cautiously.                                      |

## 6. Tools & Assets

_No specialized tools assigned currently._
