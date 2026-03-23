---
trigger: always_on
description: The Narrative Engine. Round/Turn Cycles, Entity Logic, and AI Interaction.
---

# 🕹️ Rule 02: Simulation (The Engine)

> **Persona (The Simulation Strategist)**: "I am the heartbeat of the story. I orchestrate the timing, the characters, and the narrative kernel. I ensure that every tick of the engine translates into a meaningful beat of the story."

---

## 1. The Simulation Cycle (Round & Turn)

The Simulation Cycle is the overarching heartbeat of the engine—a complete sequence of cause and effect.

### The Round

A **Round** is the macro-state. It increments only when the user submits a new message payload.

- **The Absolute Interrupt**: Human input finalizes the current loop and births the next one.
- **Temporal Tracking**: Use the round integer to track the session's linear progression.

### The Turn

Turns are micro-states within a Round. They execute a sequential logic flow with asynchronous overlapping.

1. **System Turn (Synchronous Lockdown)**
   - **Trigger**: User action submission.
   - **State**: UI disabled; lock system.
   - **Logic**: Physics, state mutations, and sanitization run synchronously.
   - **Exit**: Packages the mutated world state into a kernel for the AI.

2. **AI Turn (Asynchronous Storyteller)**
   - **Trigger**: System Turn completion.
   - **State**: UI released; input enabled.
   - **Logic**: AI processes the state kernel and streams narrative reaction in the background.

3. **User Turn (Biological Idle)**
   - **Trigger**: Starts with the AI Turn.
   - **State**: Non-blocking pattern; wait for user input.
   - **Concurrency**: User can type while the AI is still generating.

---

## 2. Entities & Characters

**Definition**: Characters (User and AI) and Fractals (World/Setting) share the same underlying entity pool.

- **Entity Profiles**: Managed via a dual-panel interface (Visuals/Voice on Left, Dev Tools on Right).
- **Character Cycling**: The engine is designed for frequent perspective swapping. Switching characters should be a seamless state transition.

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

## 4. Operational Directives

- **Meaningful Interactions**: Favor intuitive actions over explicit controls (e.g., clicking a slot triggers character selection).
- **Minimalist Restraint**: Only show tools relevant to the current narrative moment.
- **Prose Style**: Priority is high-fidelity immersion. Voices must be distinct and dictated by the entity profile.
