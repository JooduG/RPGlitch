# 🗺️ RPGlitch Roadmap

**Purpose:** Strategic command center for the Studio.
**Current Era:** ✨ **FOUNDATIONS & CLOSURES**

---

## 📍 Current Context

**Focus:** Transforming the engine from a "Tech Demo" into a "Shipped Product" by polishing the entry and exit points.
**In Progress:** Concept 0 (Foundations)
**Recently Done:**

- [x] **Profile Picture Wiring**
- [x] **Storyboard Skeleton Symmetry**
- [x] **Atmospheric Boot**
- [x] **Diamond Icon Logic**
- [x] **Unified Hover Interaction**
- [x] **Terminology Standardization**
- [x] **WebWorker Offloading**
- [x] **Button Harmonization (UI)**
- [x] **The Epilogue Flow**
- [x] **Library Interface**
- [x] **Confirm Modal Polish**
- [x] **State Sync & Visuals**
- [x] **Pico.css Removal**
- [x] **UI Polish & Standardization**
- [x] **Smartphone Mode Refactor**
- [x] **Logic Bridge Decoupling**
- [x] **AI Image Generation Fix**

---

## 🚀 Phase 1: Active Priorities (Foundations & Director Tools)

_Critical features and power tools to complete the product experience._
**Legend:** `S`=Small, `M`=Medium, `L`=Large, `XL`=Epic

| **Simulation Pulse** | [Logic] | XL | L | `Physics` | ✅ **COMPLETED (V3):** Gravity-based baseline, auto-logging. |
| **Ghostwriter 2.0** | [UX] | L | M | `UI` | ✅ **COMPLETED:** Draft Mode, Player Persona, Intent-based. |
| **Input UI Refinement** | [UI] | S | S | `CSS` | ✅ **COMPLETED:** Smart Pill, Clamped Height. |

---

## 🔮 Phase 2.5: The Archivist (Memory Optimization)

_The next critical step to enable long-term play without token limits._

### The Archivist Spec

- **Trigger:** Every ~20 turns OR when `entity.past` exceeds N tokens.
- **Job:** Analyze the raw "Captain's Log" entries in `entity.past`.
  - _Input:_ "[Turn 15] Lost arm. [Turn 16] Found a medkit."
  - _Process:_ Rewrite into cohesive narrative summary.
- **Output:** "During the siege, he lost his left arm but managed to stabilize it with a found medkit."
- **Action:** Replace the raw log list with this specific summary.
- **Goal:** Keep prompts lean while retaining critical history.

---

## ✅ The Architect's Mandate (History)

**Status:** The "Technical Hardening" epoch is complete.

| Item                         | Category   | Status      | Notes                                              |
| :--------------------------- | :--------- | :---------- | :------------------------------------------------- |
| **Profile Picture Wiring**   | [Bugfix]   | ✅ COMPLETE | Restored portrait click functionality.             |
| **Visualize Architecture**   | [Docs]     | ✅ COMPLETE | Data flow diagrams added to `README.md`.           |
| **Enhance Type Safety**      | [DX]       | ✅ COMPLETE | `types.d.ts` created.                              |
| **Configurable Physics**     | [Refactor] | ✅ COMPLETE | `config-physics.js` implemented.                   |
| **Offload Logic to Workers** | [Perf]     | ✅ COMPLETE | `worker.js` implemented.                           |
| **Formalize Event Bus**      | [Refactor] | ✅ COMPLETE | `events.js` created.                               |
| **Virtual Scrolling**        | [UI/Perf]  | ✅ COMPLETE | `VirtualFeed` implemented.                         |
| **Terminology Standard**     | [Refactor] | ✅ COMPLETE | "World" -> "Fractal" migration.                    |
| **SVG Icon System**          | [UI/UX]    | ✅ COMPLETE | Replaced hardcoded emojis.                         |
| **Narcissism Engine**        | [AI Logic] | ✅ COMPLETE | Self-expression logic in `prompter.js`.            |
| **Automate Hygiene**         | [DevOps]   | ✅ COMPLETE | `tools/ops/hygiene.js` created.                    |
| **Confirm Modal Polish**     | [UI]       | ✅ COMPLETE | Refined styling & moved inline CSS.                |
| **Integrated Director Mode** | [DevTools] | ✅ COMPLETE | Toggle added to sidebar. Shows `<think>` blocks.   |
| **Writer's Block Rescue**    | [UX]       | ✅ COMPLETE | Error Monitor: Vanilla/Spicy retry actions.        |
| **Extend Message**           | [Logic]    | ✅ COMPLETE | `extendAiResponse` implemented with "Continue" UI. |

---

**Last Updated:** 2025-12-19

> [!TIP]
> **Looking for the big expansions?**
> Check **[possibilities.md](./possibilities.md)** for Concepts 1-5.
