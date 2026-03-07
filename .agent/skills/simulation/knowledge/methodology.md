# 🏗️ Simulation Engine Methodology

> **Skill:** simulation
> **Red Thread:** The playbook for maintaining, extending, and debugging the Narrative Engine.

## 🏃 1. The Core Update Loop (Hydrate -> Simulate -> Synthesize)

Any structural change to the core engine must respect the decoupled data flow:

1. **Hydration (`ContextBroker.js`)**: Fetch pure, raw state geometry (Entities, Locations, Lore, recent Logs) from the Database.
2. **Simulation (`DynamicsEngine.js`)**: Apply mathematical and logic rules (reflexes, weight scoring, off-screen momentum) to the hydrated data. Produce a _Snapshot_.
3. **Synthesis (`PromptBuilder.js`)**: Format the Hydrated Data + Snapshot into the deterministic XML/Markdown prompt intended for the AI.
4. **Generation (`engine.js`/`LlmService`)**: The final handoff to the linguistic model.
5. **Consolidation (`NarrativeDirector.js`)**: Process the AI's output, update L1/L2 memory, and persist state.

## ⚡ 2. Debugging & Testing Protocols

- **Test Without Generation:** Never use live LLM calls to test engine logic. Inspect the output of `PromptBuilder.synthesize()` directly. If the prompt is structurally correct, the engine did its job.
- **Zero-Trust Input:** Never trust raw user text. Always assume the input could contain prompt injections or formatting that breaks the XML tags.
- **Deterministic Vectors:** Code logic operates on "Vectors". Only the final formatted string passed to the LLM uses the term "Memories".

## 🛡️ 3. The Quality Gate (Audit)

Before considering an engine modification complete:

1. **Schema Check:** Does `ContextBroker` output match `PromptBuilder` expectations?
2. **Physics Bounds:** Do `DynamicsEngine` values (like weight) remain clamped within expected minimums and maximums?
3. **Pacing:** Does the change risk causing the LLM to rush or skip narrative beats?
