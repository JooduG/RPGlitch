# 🧩 Gamemaster: The Simulation Engine

This document details the internal "Deep Logic" that drives the RPGlitch simulation, merging the responsibilities of the Gamemaster and Scholar pillars.

## 1. The Heartbeat Protocol

To maintain performance and logical consistency, we move beyond simple "Chat Bot" responses into a **Simulation Loop**.

1. **Actor (LLM):** Generates prose and dialogue based on the current reactive state ($state).
2. **Simulator (Gamemaster):** Calculates consequences _after_ prose generation (e.g., "Narrative impact -> HP -10").
3. **Archivist (Scholar):** Compresses turn history into "Memories" to optimize context space via `runtime.save()`.

## 2. Startup Protocol (Reality Check)

Every agent session MUST execute this sequence to ensure environment fidelity:

1. **Grounding:** Read `.agent/config.yaml` to confirm scope and role.
2. **Tooling Validation:** Read `.agent/tooling.json` and verify active MCP servers.
3. **Type Sync:** Read `types.d.ts` for source-of-truth interfaces.
4. **Task Registry:** Read the `task.md` artifact to acknowledge active work.
5. **Verification:** Execute `.gemini/on_startup.sh`.

## 3. Data Architecture (The Snapshot)

The engine separates immutable truth from mutable state using a **Four-Field Schema**:

- **Forever (Truth):** Immutable personality, biology, and core drives of an entity.
- **Present (State):** Current status, inventory, clothing, and wounds ($state).
- **Past (Log):** Compressed narrative history (Chronostore).
- **Future (Goals):** Immediate objectives and looming threats.

## 4. Architectural Constraints

### Pure Logic (IO Boundary)

The **Gamemaster (Logic)** and **Scholar (Persistence)** pillars must remain **Pure IO**. They are not allowed to touch the DOM or use CSS classes. They provide the "Mathematical Truth" that the **Artificer** and **Mesmer** interpret for the user.

### Dependency Hierarchy

- **Entities:** Zero dependencies on UI.
- **Runes:** Mandatory for state propagation.
- **Runtime:** `runtime.save()` is the only valid way to anchor reality to disk via the Scholar.
