# 🗺️ Product Roadmap

## 🔮 Future Concepts

### 1. The Archivist (Memory Optimization)

> **The next critical step to enable long-term play without token limits.**

- **Trigger:** Every ~20 turns OR when `entity.past` exceeds N tokens.
- **Job:** Analyze the raw "Captain's Log" entries in `entity.past`.
  - _Input:_ "[Turn 15] Lost arm. [Turn 16] Found a medkit."
  - _Process:_ Rewrite into cohesive narrative summary.
- **Output:** "During the siege, he lost his left arm but managed to stabilize it with a found medkit."
- **Action:** Replace the raw log list with this specific summary.
- **Goal:** Keep prompts lean while retaining critical history.

### 2. Multi-Agent Council

- **Concept:** "Council of Voices" feature where different agents debate the narrative direction.

---

## 🏛️ Strategic Epochs

- **Epoch 1: Foundations** — Core Pillars and Unidirectional Data Flow (Complete).
- **Epoch 2: Hardening** — Security, DX, and Performance (Complete).
- **Epoch 3: Expansion** — Memory optimization and Multi-Agent logic (Upcoming).