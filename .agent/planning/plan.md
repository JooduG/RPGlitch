# 🗺️ RPGlitch Roadmap

**Purpose:** Strategic command center for the Studio.
**Current Era:** ✨ **FOUNDATIONS & CLOSURES**

---

## 📍 Current Context

**Focus:** Transforming the engine from a "Tech Demo" into a "Shipped Product" by polishing the entry and exit points of the story experience.
**In Progress:** None
**Recently Done:**

- [x] **Profile Picture Wiring:** Fixed circular profile portrait clicks.
- [x] **Storyboard Skeleton Symmetry (V6-V10):** Perfected loading states.
- [x] **Atmospheric Boot (V8):** Cleaner, "naked" shimmering effect.
- [x] **Diamond Icon Logic (V10):** Standardized fractal icons.
- [x] **Unified Hover Interaction (V9):** Consolidated UI feedback.
- [x] **Terminology Standardization:** "World" -> "Fractal".
- [x] **Visual Polish:** Scalable SVG Icon System.
- [x] **Visualize Architecture:** Mermaid.js diagrams added to docs.
- [x] **Type Safety:** `types.d.ts` implemented.
- [x] **Configurable Physics:** Centralized `config-physics.js`.
- [x] **WebWorker Offloading:** Simulation logic moved to background threads.

---

## 🚀 Phase 1: Foundations & Closures (Active Priorities)

_The boring but critical features that make a story feel complete._
**Legend:** `S`=Small, `M`=Medium, `L`=Large, `XL`=Epic

| Item                      | Category | Impact | Effort | Dependencies | Notes                                                                                                             |
| :------------------------ | :------- | :----- | :----- | :----------- | :---------------------------------------------------------------------------------------------------------------- |
| **Library Interface**     | [UI]     | S      | M      | Refactor     | A proper "Bookshelf" modal for loading stories. Displays covers/summaries instead of a debug list.                |
| **The Epilogue Flow**     | [UI]     | M      | S      | None         | Finalize the "End Story" state. Lock inputs, generate a final summary, and save a "Golden Snapshot."              |
| **Writer's Block Rescue** | [UX]     | M      | S      | UI           | "Engine Stalled" modal. Offers a "Retry with Higher Entropy" button if the AI chokes or errors out.               |
| **Plot Thread Tracker**   | [Data]   | M      | S      | DB           | Formalize `customData.plot` (`active`, `resolved`) to display current objectives separate from the narrative log. |

---

## ✅ The Architect's Mandate (History)

**Status:** The "Technical Hardening" epoch is complete.

| Item                         | Category   | Status      | Notes                                    |
| :--------------------------- | :--------- | :---------- | :--------------------------------------- |
| **Profile Picture Wiring**   | [Bugfix]   | ✅ COMPLETE | Restored portrait click functionality.   |
| **Visualize Architecture**   | [Docs]     | ✅ COMPLETE | Data flow diagrams added to `README.md`. |
| **Enhance Type Safety**      | [DX]       | ✅ COMPLETE | `types.d.ts` created.                    |
| **Configurable Physics**     | [Refactor] | ✅ COMPLETE | `config-physics.js` implemented.         |
| **Offload Logic to Workers** | [Perf]     | ✅ COMPLETE | `worker.js` implemented.                 |
| **Formalize Event Bus**      | [Refactor] | ✅ COMPLETE | `events.js` created.                     |
| **Virtual Scrolling**        | [UI/Perf]  | ✅ COMPLETE | `VirtualFeed` implemented.               |
| **Terminology Standard**     | [Refactor] | ✅ COMPLETE | "World" -> "Fractal" migration.          |
| **SVG Icon System**          | [UI/UX]    | ✅ COMPLETE | Replaced hardcoded emojis.               |
| **Narcissism Engine**        | [AI Logic] | ✅ COMPLETE | Self-expression logic in `prompter.js`.  |
| **Automate Hygiene**         | [DevOps]   | ✅ COMPLETE | `tools/ops/hygiene.js` created.          |

---

**Last Updated:** 2025-12-18

> [!TIP]
> **Looking for the big expansions?**
> Check **[possibilities.md](./possibilities.md)** for Concepts 1-5.
