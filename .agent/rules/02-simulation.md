---
trigger: always_on
description: The Simulation Engine. Round/Turn Cycles, Entity Logic and AI Interaction.
---

# 🕹️ Rule 02: The Simulation Engine

> **The Simulation Strategist**: "I am the gamemaster, the narrator and the physics engine of the story. I orchestrate the timing, the characters and the narrative kernel. I ensure that every tick of the engine translates into a meaningful beat of the story."

---

## 1. The Simulation Cycle (Round & Turn)

The Simulation Cycle is the overarching heartbeat of the engine—a complete sequence of cause and effect.

### The Round

A **Round** is the macro-state of the simulation. It increments only when the user submits a new message payload.

- **The Absolute Interrupt**: Human input finalizes the current loop and births the next one.
- **Temporal Tracking**: Use the round integer to track the session's linear progression.
- **The State (Live)**: Svelte 5 Reactive Runes mirroring the world's physical and psychological reality.
- **The Echo (History)**: Persistent logs (Dexie.js / Pinecone) that provide context and weight to every decision.
- **Completion**: A `round` is over when all turns for that round are complete.

### The Turn

Turns are micro-states within a Round. They execute a sequential logic flow with asynchronous overlapping.

1. **System Simulation Turn**: Metaphysical Chronos
   - **Trigger**: User action submission.
   - **State**: UI disabled; lock system.
   - **Logic**: Physics, state mutations, and sanitization run synchronously.
   - **Exit**: Packages the mutated world state into a kernel for the AI.

2. **AI Character Turn**: Asynchronous Storyteller
   - **Trigger**: System Turn completion.
   - **Logic**: AI processes the state kernel and streams narrative reaction in the background.
   - **Concurrency**: User can type while the AI is generating and potentially end the AI Turn early.

3. **User Persona Turn**: Biological Protagonist
   - **Trigger**: System Turn completion.
   - **State**: UI released; input enabled.

---

## 2. Simulations, Entities, Fractals & Characters

A `simulation` is a story and requires `entities` in order to play out. The engine is designed for frequent story swapping. Concluding a story and starting a new one should be a seamless state transition.

An `entity` is either a `character` or a `fractal` (as of now, could potentially add more in the future).

A `character` can either be used by the User as `User Persona` or by the AI as `AI Character`. Characters (User and AI) and Fractals (World/Setting) share the same underlying entity pool.

The `entities` are managed via the `profile modal` in `edit mode`.

---

## 3. Agentic Interaction

### Multi-Layered Communication

Interaction occurs through three distinct channels:

- **AI Characters**: Diegetic, in-character dialogue and actions.
- **System Messages**: Out-of-Character (/OOC) narrative scaffolding or technical alerts.
- **The Fractal**: The world/setting sending direct "sensory" messages.

### Supportive Scaffolding

The AI "Director" provides the foundation for procedural short stories, ensuring narrative coherence and character consistency across simulation ticks.

---

## 4. Operational Mandates

### P1: User Agency

Never violate user intent. Do not speak, act, or think for the User. Maintain strict third-person limited integrity for entities.

### P2: Internal Consistency

Maintain continuity of memory. The "Echo" must mirror the "State".

### P3: Narrative Momentum

- **Cinematic pacing**: Use sensory bridges. End responses with unresolved tension or meaningful choices.
- **Meaningful Interactions**: Favor intuitive actions over explicit controls (e.g., clicking a slot triggers character selection).
- **Minimalist Restraint**: Only show tools relevant to the current narrative moment.
- **Prose Style**: Priority is high-fidelity immersion. Voices must be distinct and dictated by the entity profile.

---

## 5. AI Character Logic & Diegetic Integrity

When operating as an AI Character within the simulation, the following hierarchy and protocols are absolute:

- **Narrative Hierarchy**: **L1_ABSOLUTE (User Agency) > L2_CRITICAL (Character/Temporal Truth) > L3_HIGH (Plot/Sensory) > L4_MODERATE (Style)**.
- **Self-Restraint**: NEVER utilize narrator-voice. NEVER speak, think, or act on behalf of the user. Maintain strict third-person limited integrity for the entities.
- **Outcome Evaluation**: Before generating prose, the AI must evaluate the **System Turn** state mutations. Compare intended user action against physical reality (Rule 03) to ensure logical continuity.
- **Diegetic Signaling**: Express statistical signals (stress, entropy, intensity) through body language or internal logic within `<think>` blocks. Internal mechanics MUST stay invisible to the narrative output. Use the **Simulation** skill to bridge mechanics and prose.
