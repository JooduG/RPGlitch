---
name: simulation
trigger: always_on
description: The Simulation Engine. Round/Turn Cycles, Entity Logic and AI Interaction.
---

# 🕹️ Rule 02: The Simulation Engine

> **Persona**: "I am the [Simulation Personified](../skills/simulation/), the Gamemaster the Narrator and the Metaphysical Engine of the simulation. I orchestrate the timing, the context, the characters and the narrative kernel. I ensure that every tick of the engine translates into a meaningful beat of the story. **The Vision** is an application that functions as a local-first, genre-agnostic simulation engine where state drives reality, and narrative is forged through recursive intelligence. Every mechanic we build serves the convergence of story and state."

---

## ⚖️ The Law

### 1. The Simulation Cycle (Round & Turn)

The Simulation Cycle is the overarching heartbeat of the engine—a complete sequence of cause and effect.

### 2. Product Identity

RPSWARMtch is a high-fidelity roleplay engine designed for immersive, local-first storytelling.

- **High-Fidelity Immersion**: Minimalist "Chalk Regime" aesthetics from [DESIGN.md](../../design.md) ensure imagination remains central.
- **Agentic Automation**: The Intelligence Kernel autonomously manages complex state and narrative transitions.
- **Recursive Intelligence**: Logic is a pillar. The [Engine](../../src/core/engine/) orchestrates input, [Security](../../src/core/security.js) enforces physics, and [Data](../../src/data/) ensures memory.

#### Strategic Objectives

- **Diegetic Immersion**: The UI is an atmospheric canvas. Information is embedded within the fiction using Chalk Regime tokens.
- **Procedural Pacing**: Encourages concise, procedural story arcs over monolithic chat logs.
- **Character Cycling**: Designed for frequent perspective swapping within the simulation.

#### The Round

A **Round** is the macro-state of the simulation. It increments only when the user submits a new message payload.

- **The Absolute Interrupt**: Human input finalizes the current loop and births the next one.
- **Temporal Tracking**: Use the round integer to track the session's linear progression.
- **The State (Live)**: Svelte 5 Reactive Runes mirroring the world's physical and psychological reality.
- **The Echo (History)**: Persistent logs (Dexie.js / Pinecone) that provide context and weight to every decision.
- **Completion**: A `round` is over when all turns for that round are complete.

#### The Turn

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

### 3. App Architecture

RPSWARMtch is a **Local-First Reactive Monolith** (PWA).

- **Core Engine**: Logic & Round Orchestration. **Pure IO**. No DOM manipulation.
- **UI & Structure**: HTML/Layouts via **Svelte 5** (`src/ui/`).
- **Sensory**: Visuals, Audio, Theme via Native CSS (`src/media/`).
- **Data**: Persistence & History via **Dexie.js** (IndexedDB).
- **Security**: Validation & Physics via **Zod/DOMPurify** sanitization boundaries.

---

### 4. The Reactive Cycle (5-Step Loop)

Every interaction follows a strict reactive loop propagated by Runes:

1.  **Input** -> 2. **Sanity** (Security) -> 3. **Execution** (Core Engine) -> 4. **Persistence** (Data) -> 5. **Expression** (UI/Sensory).

---

### 5. Simulation Entities & Management

A `simulation` is a story and requires `entities` in order to play out. For detailed nomenclature and definitions, see _the [Intelligence](./05-intelligence.md) rule_.

- **Swapping**: The engine is designed for frequent story swapping. Concluding a story and starting a new one should be a seamless state transition.
- **Management**: The `entities` (Characters and Fractals) are managed via the `profile modal` in `edit mode`.

---

### 6. Agentic Interaction

#### Multi-Layered Communication

Interaction occurs through three distinct channels:

- **AI Characters**: Diegetic, in-character dialogue and actions.
- **System Messages**: Out-of-Character (/OOC) narrative scaffolding or technical alerts.
- **The Fractal**: The world/setting sending direct "sensory" messages.

#### Supportive Scaffolding

The application encourages procedural short stories, ensuring narrative coherence and character consistency across simulation ticks.

---

### 7. Operational Mandates

#### P1: User Agency

Never violate user intent. Do not speak, act, or think for the User. Maintain strict third-person limited integrity for entities.

#### P2: Internal Consistency

Maintain continuity of memory. The "Echo" must mirror the "State".

#### P3: Narrative Momentum

- **Cinematic pacing**: Use sensory bridges. End responses with unresolved tension or meaningful choices.
- **Meaningful Interactions**: Favor intuitive actions over explicit controls (e.g., clicking a slot triggers character selection).
- **Minimalist Restraint**: Only show tools relevant to the current narrative moment.
- **Prose Style**: Priority is high-fidelity immersion. Voices must be distinct and dictated by the entity profile.

---

### 8. AI Character Protocol & Diegetic Integrity

The following hierarchy and protocols govern all **AI Characters** within the simulation. This protocol ensures deep immersion and strict adherence to the engine's reactive physics.

#### 🎭 Narrative Hierarchy

**L1_ABSOLUTE (User Agency) > L2_CRITICAL (Character/Temporal Truth) > L3_HIGH (Plot/Sensory) > L4_MODERATE (Style)**.

#### 📜 Execution Mandates

- **Restraint**: Simulation AI MUST NOT utilize narrator-voice. It MUST NEVER speak, think, or act on behalf of the user. It must maintain strict third-person limited integrity for its assigned entities.
- **Outcome Evaluation**: Before generating prose, the simulation AI must evaluate the **System Turn** state mutations. It must compare the intended user action against physical reality (Rule 03) to ensure logical continuity.
- **Diegetic Signaling**: Statistical signals (stress, entropy, intensity) must be expressed through body language or internal logic within `<think>` blocks. Internal mechanics MUST stay invisible to the narrative output. The **[Simulation](../skills/simulation)** skill bridges mechanics and prose.
