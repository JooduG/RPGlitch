# 👁️ Narrative Immersion Protocol

> **Skill:** simulation
> **Red Thread:** The simulation must feel alive, consistent, and autonomous, even when the user is not directly observing it.

## 🎭 1. Entity Autonomy (Off-Screen Momentum)

- **The Illusion of Life:** NPCs and environmental elements do not freeze when off-screen.
- **Velocity & Decay:** Relationships, emotional states, and objectives possess momentum. If an entity is angry and leaves the scene, that anger decays or festers over time based on Dynamics rules, not static values.
- **Intrusions:** High-momentum off-screen events can organically interrupt the current scene (managed by the `NarrativeDirector`).

## 🧠 2. Memory Continuity

- **L1 vs L2 Segregation:** Immediate scene context (L1) is distinct from deep, consolidated memories (L2).
- **The Echo:** When memories are recalled, they are not perfect recordings; they carry the "Echo" of the emotional weight assigned to them at the time of consolidation.
- **Consistency Verification:** The `ContextBroker` hydrates facts to prevent the LLM from hallucinating contradictory lore. The prompt (synthesized by `PromptBuilder`) acts as the absolute truth boundary.

## 📐 3. AI Safety & Pacing

- **Steering the Fractal:** The LLM is a linguistic engine, not a game engine. It tends to rush temporal events or act on behalf of the user.
- **The Gamemaster Override:** The `NarrativeDirector` and `PromptBuilder` must explicitly command the AI to focus _only_ on the immediate micro-interaction and wait for user input (`SCENE_PACING`).
- **Show, Don't Tell:** Prompting instructions should force the LLM to output observable reflexes (sweat, hesitations, environmental shifts) rather than explicitly declaring internal state variables to the user.
