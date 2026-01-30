# 📚 Scholar: Persistence Strategy

The **Scholar Pillar** acts as the archivist of reality. It ensures that the "Red Thread" of the story remains consistent across sessions.

## 1. The Scholar API

All persistent data is stored in **IndexedDB** via **Dexie.js**.

- **The Monolith Object:** The global game state. Contains player data, NPC states, and inventory.
- **`scholar.save()`:** The only way to commit memory to disk. Triggers a "Resonance Update" to listeners.
- **`scholar.recall()`:** Retrieves data atoms based on semantic tags or timestamps.

## 2. Memory Tiers (Weighting)

Memory is not binary (remembered vs. forgotten). It is weighted by **Emotional Intensity (W)**.

| Tier            | Weight (W) | Persistence | Examples                                     |
| :-------------- | :--------- | :---------- | :------------------------------------------- |
| **Core**        | 10         | Immutable   | Identity, Trauma, Death of an NPC.           |
| **Major**       | 8-9        | Resistant   | Betrayals, Life Decisions, Major Secrets.    |
| **Significant** | 6-7        | Stable      | Promises, Conflicts, Intimate Moments.       |
| **Minor**       | 1-5        | Decays      | Small talk, Routine actions, Sensory static. |

- **Weight Check:** If new info conflicts with old, the higher weight wins unless an explicit "Retcon" is triggered by the user.

## 3. Context Consolidation

To combat "Semantic Degeneracy" (the AI forgetting recent events), the Scholar performs **Pruning & Distillation**.

- **Rolling Context:** The most recent turns are high-resolution (Sensory).
- **Distilled Summaries:** Older turns are compressed into **Episodic Facts**.
- **The "Truth Hub":** A central list of "Immutable Facts" that is always injected into the AI context, regardless of session length.

## 4. Constraint: The Save Scrub

The Scholar automatically purges "Penalty Flags" and temporary session data on boot to ensure the **Freedom Protocol** remains active. Memory is a tool, not a cage.
