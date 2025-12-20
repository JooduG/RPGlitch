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

---

## 🚀 Phase 1: Active Priorities (Foundations & Director Tools)

_Critical features and power tools to complete the product experience._
**Legend:** `S`=Small, `M`=Medium, `L`=Large, `XL`=Epic

| Item                         | Category   | Impact | Effort | Dependencies | Notes                                                                                       |
| :--------------------------- | :--------- | :----- | :----- | :----------- | :------------------------------------------------------------------------------------------ |
| **Writer's Block Rescue**    | [UX]       | M      | S      | `Modal`      | Compact "Engine Stalled" alert. Options: "Retry" (Reroll) or "Director's Note" (Variance).  |
| **Plot Thread Tracker**      | [Data]     | M      | S      | `DB`         | Add `customData.plot` (`active`, `resolved`) to schema. Hidden from UI for now.             |
| **Extend Message**           | [Logic]    | M      | S      | `Engine`     | "Continue": Force the AI to append text to its last message (generating a longer response). |
| **Integrated Director Mode** | [DevTools] | L      | M      | `UI`         | Unified toggle: Unhide `<think>`, reveal `<image_prompt>`, view raw JSON.                   |
| **State Editor**             | [Tool]     | L      | M      | `DB`         | Manually edit the `<PRESENT>`, `<FUTURE>`, or `<DYNAMICS>` text of any entity mid-story.    |
| **Snapshot Diffing**         | [Tool]     | M      | M      | `Delta`      | "What Changed?" view showing the text delta between Turn N and N-1.                         |
| **Context Inspector**        | [Tool]     | M      | S      | `Prompter`   | View the _exact_ raw prompt text sent to the LLM (crucial for debugging leaks).             |
| **"Bad Detective"**          | [Tool]     | M      | M      | `Logic`      | Analyze last 5 turns to highlight prompt conflicts or logic loops.                          |

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
| **Confirm Modal Polish**     | [UI]       | ✅ COMPLETE | Refined styling & moved inline CSS.      |

---

**Last Updated:** 2025-12-19

> [!TIP]
> **Looking for the big expansions?**
> Check **[possibilities.md](./possibilities.md)** for Concepts 1-5.
