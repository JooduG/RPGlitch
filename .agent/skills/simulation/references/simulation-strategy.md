---
name: simulation-strategy
version: 5.0.0
description: The unified playbook for the RPSWARMtch Narrative Engine. Governs the mechanical cycle, entity autonomy, and memory physics.
---

# 🕹️ Skill: Simulation Strategy (The Heartbeat)

> **Persona**: "I am the Simulation Strategist. I ensure that every tick of the engine—every byte of state—translates into a visceral narrative beat. I am the bridge between the logic of the code and the ghost in the machine."

---

## 🌀 1. The Red Thread: "State is Truth"

In RPSWARMtch, we do not write "stories"; we simulate **State** and let the story emerge from it. If a character is "angry" in the code, they must be "angry" in the prose. There is no gap between the math and the myth.

### The Triad of Reality

1. **The Spec**: The DNA. plans and lore.
2. **The State**: The Pulse. Live Svelte 5 Runes.
3. **The Echo**: The Shadow. Persistent memory logs.

---

## 🏃 2. The Simulation Cycle (Macro vs. Micro)

The engine operates on a nested loop of time.

### A. The Round (Macro-Time)

A **Round** increments **only when the User Persona submits a message**.

- **The Absolute Interrupt**: Human input kills the current loop and births the next one.
- **Temporal Tracking**: **Use the round integer** to track linear progression.

### B. The Turn (Micro-Time)

| Turn Type  | Responsibility                         | UI State     |
| :--------- | :------------------------------------- | :----------- |
| **System** | Physics, Sanitization, State Mutation. | **Locked**   |
| **AI**     | Processing state and streaming prose.  | **Unlocked** |
| **User**   | Biological idle; waiting for input.    | **Unlocked** |

---

## 🏗️ 3. The Technical Pulse (The Update Loop)

Any structural change to the core engine **must respect this decoupled data flow**. Do not cross the streams.

1. **Hydrate** (`ContextBroker.js`): **Fetch raw state geometry** (Entities, Lore, Logs) from the Database.
2. **Simulate** (`DynamicsEngine.js`): **Apply math/logic rules** to produce a "Snapshot" of reflexes and emotional weights.
3. **Synthesize** (`PromptBuilder.js`): **Format the data into an XML/Markdown payload** for the AI.
4. **Generate** (`LlmService`): The linguistic handoff.
5. **Consolidation** (`NarrativeDirector.js`): **Update L1/L2 memory** and persist the state back to Dexie.js.

---

## 🎭 4. Immersion Protocols (The Behavioral Layer)

### I. Entity Autonomy (Off-Screen Momentum)

- **The Illusion of Life**: NPCs do not freeze when the user leaves the room.
- **Velocity & Decay**: If an NPC is furious, that anger **must decay or fester over time** based on Dynamics rules, not static values.
- **Intrusions**: High-momentum events can **interrupt the current scene** (e.g., a wounded ally stumbling in).

### II. Memory Continuity (L1 vs. L2)

- **L1 (Scene Context)**: Immediate, volatile, high-detail focus.
- **L2 (The Echo)**: Consolidated, persistent history.
- **The Emotional Echo**: Memories carry the "Echo" of the emotional weight they had when they were formed. **Recalculate emotional bias** upon recall.

### III. AI Safety & Pacing

- **Steering**: The AI is a chatterbox. **Explicitly command the AI** to focus only on the immediate micro-interaction.
- **The User Shield**: **Never speak, act, or think for the User Persona.** This is a non-negotiable law of physics.
- **Show, Don't Tell**: Force the AI to **output observable reflexes** (e.g., sweating, eye-twitches) rather than declaring variables like "I feel stressed."

---

## 🛡️ 5. The Warden's Quality Gate (Logic Audit)

Before checking off an engine modification, the **Workshop Warden** must verify:

1. **Hydration Check**: Does the logic pass raw state to the LLM? (If yes: **Reject**).
2. **Physics Bounds**: Are `DynamicsEngine` values (like affinity) **clamped within 0-100**?
3. **Autoplay Security**: Does this change trigger audio? **Ensure AudioContext is suspended** until a user gesture occurs.
4. **Test Mandate**: **Write Vitest unit tests** for every state change.
5. **Zero-Trust**: **Assume all User Persona input is hostile** or malformed; sanitize via Zod/DOMPurify.

---

## ⚡ 6. Troubleshooting Logic

- **Problem**: The AI is rushing the story.
- **Solution**: **Invoke `SCENE_PACING`** in the `PromptBuilder` to force a micro-interaction.
- **Problem**: Logic conflicts between two entities.
- **Solution**: **Trigger `scientificMethod`** to test hypotheses via the Warden.
