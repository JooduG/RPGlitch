# 🧠 RPGlitch Memory System (Runtime)

> **Platform**: Perchance.org
> **Storage**: Dexie.js (IndexedDB)
> **Constraint**: Local-First, Privacy-Focused.

## 1. The Runtime Stack

The application runs exclusively in the browser. All memory is stored locally via **Dexie.js**. There is no backend database for the user's game state.

## 2. ⚖️ Memory Weighting (The Mechanics)

Data is not binary. It decays based on **Emotional Intensity (W)**.

| Tier            | Weight (W) | Persistence | Examples                         |
| :-------------- | :--------- | :---------- | :------------------------------- |
| **Core**        | 10         | Immutable   | Identity, Trauma, Death.         |
| **Major**       | 8-9        | Resistant   | Betrayals, Key Decisions.        |
| **Significant** | 6-7        | Stable      | Promises, Conflicts.             |
| **Minor**       | 1-5        | Decays      | Routine actions, Sensory static. |

## 2. The Decay Protocol

Memories with lower weight are subject to decay or compression over time, simulating human forgetfulness. High-weight memories remain vivid and accessible.
