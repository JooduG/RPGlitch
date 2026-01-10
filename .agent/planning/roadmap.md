# 🗺️ Product Roadmap

**Phase:** 🛡️ **INTEGRITY & MODERNIZATION**

## 🎯 Current Objectives

1. **Svelte 5 Migration:** Upgrade all legacy UI to Runes.
2. **Documentation Overhaul:** Establish single source of truth.
3. **Security Audit:** Verify Freedom Protocol.

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

## ✅ Recent Achievements (The Architect's Mandate)

**Status:** The "Technical Hardening" epoch is complete.

| Item                         | Category   | Notes                                            |
| :--------------------------- | :--------- | :----------------------------------------------- |
| **Profile Picture Wiring**   | [Bugfix]   | Restored portrait click functionality.           |
| **Visualize Architecture**   | [Docs]     | Data flow diagrams added to `README.md`.         |
| **Enhance Type Safety**      | [DX]       | `types.d.ts` created.                            |
| **Configurable Physics**     | [Refactor] | `config-physics.js` implemented.                 |
| **Offload Logic to Workers** | [Perf]     | `worker.js` implemented.                         |
| **Formalize Event Bus**      | [Refactor] | `events.js` created.                             |
| **Virtual Scrolling**        | [UI/Perf]  | `VirtualFeed` implemented.                       |
| **Terminology Standard**     | [Refactor] | "World" -> "Fractal" migration.                  |
| **SVG Icon System**          | [UI/UX]    | Replaced hardcoded emojis.                       |
| **Narcissism Engine**        | [AI Logic] | Self-expression logic in `prompter.js`.          |
| **Automate Hygiene**         | [DevOps]   | `tools/ops/hygiene.js` created.                  |
| **Confirm Modal Polish**     | [UI]       | Refined styling & moved inline CSS.              |
| **Integrated Director Mode** | [DevTools] | Toggle added to sidebar. Shows `<think>` blocks. |
