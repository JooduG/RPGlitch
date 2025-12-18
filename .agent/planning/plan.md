# 🗺️ RPGlitch Roadmap

**Purpose:** Strategic command center for knowing what to work on next. Pick an item, code it, ship it.

**Completed Work:** See [../archive/legacy/completed-2025-11-17-audit.md](../archive/legacy/completed-2025-11-17-audit.md)

---

## 📍 Current Context (Auto-updated by AI)

**Focus:** ✨ **MAINTENANCE & POLISH**
**In Progress:** None
**Recently Done:**

- [x] **Profile Picture Wiring:** Fixed circular profile portrait clicks so they correctly open the edit modal.
- [x] **Storyboard Skeleton Symmetry (V6-V10):** Redesigned the loading state for 100% symmetry between boot and live views.
- [x] **Atmospheric Boot (V8):** Stripped labels/icons from boot skeletons for a cleaner, "naked" shimmering effect.
- [x] **Diamond Icon Logic (V10):** Standardized the fractal icon to a diamond path across all UI states including live skeletons.
- [x] **Unified Hover Interaction (V9):** Subtle "raise" effect consolidated across slots and previews.
- **Terminology Standardization:** Rebranded "World" to "Fractal" across UI and Logic.
- **Visual Polish:** Implemented Scalable SVG Icon System (replaced emojis).

- **Visualize Architecture:** Added Mermaid.js data flow diagrams to README to explain the Worker/Bridge topology.
- **Type Safety:** Implemented `types.d.ts` for full IntelliSense support.
- **Configurable Physics:** Centralized game balance constants in `config-physics.js`.
- **WebWorker Offloading:** Successfully moved heavy simulation logic to background threads.

---

## 🚀 Critical Priorities (The "Will Do" List)

With the architecture hardened, we return to shipping user-facing features.

| Item | Category | Impact | Effort | Dependencies | Notes |
| :--- | :------- | :----- | :----- | :----------- | :---- |

| <a id="story-list-ui"></a>**Story List & Load UI** | [UI/UX] | L | M | Refactor | Create a proper "Load Game" modal reading from `db.stories` instead of the current placeholder. |
| **Conclude Story Polish** | [UI/UX] | M | S | None | Finalize the "End Story" flow and UI polish. |
| **Branching Visuals** | [UI/UX] | M | M | None | Visual indicators for Choice nodes/divergence in the feed. |

---

## ✅ The Architect's Mandate (Completed History)

**Status:** The "Technical Hardening" epoch is complete. The system is stable, type-safe, and performant.

| Item                            | Category   | Status      | Notes                                                     |
| :------------------------------ | :--------- | :---------- | :-------------------------------------------------------- |
| **Profile Picture Wiring**      | [Bugfix]   | ✅ COMPLETE | Restored portrait click functionality.                    |
| **Visualize Architecture**      | [Docs]     | ✅ COMPLETE | Data flow diagrams added to `README.md`.                  |
| **Enhance Type Safety**         | [DX]       | ✅ COMPLETE | `types.d.ts` created; JSDoc interfaces defined.           |
| **Configurable Physics**        | [Refactor] | ✅ COMPLETE | `config-physics.js` implemented; magic numbers extracted. |
| **Offload Logic to WebWorkers** | [Perf]     | ✅ COMPLETE | `worker.js` + `worker-bridge.js` implemented.             |
| **Formalize Event Bus**         | [Refactor] | ✅ COMPLETE | `events.js` created; UI subscribed to events.             |
| **Virtual Scrolling**           | [UI/Perf]  | ✅ COMPLETE | `VirtualFeed` class with resize observers implemented.    |
| **Security Enforcement**        | [Security] | ✅ COMPLETE |                                                           |
| **Fracture `index.js`**         | [Refactor] | ✅ COMPLETE |                                                           |
| **Eliminate Watchdog**          | [Cleanup]  | ✅ COMPLETE |                                                           |
| **Database Seeding**            | [Data]     | ✅ COMPLETE |                                                           |
| **Context Builder (RAG)**       | [AI Logic] | ✅ COMPLETE |                                                           |
| **Terminology Standardization** | [Refactor] | ✅ COMPLETE | "World" -> "Fractal" migration.                           |
| **SVG Icon System**             | [UI/UX]    | ✅ COMPLETE | Replaced hardcoded emojis with SVGs.                      |
| **Storyboard Skeletons**        | [UI/UX]    | ✅ COMPLETE | 100% symmetry + Atmospheric Boot + Unified Hover.         |
| **Diamond ICON Coverage**       | [UI/UX]    | ✅ COMPLETE | Fractal icon standardized to diamond SVG.                 |
| **Skeleton Screens**            | [UI/UX]    | ✅ COMPLETE | CSS-only placeholders implemented in `_skeletons.scss`.   |
| **Narcissism Engine (Core)**    | [AI Logic] | ✅ COMPLETE | Logic for self-expression implemented in `prompter.js`.   |
| **Build Optimization**          | [DevOps]   | ✅ COMPLETE | Switched to `dexie.min.js` for production builds.         |

---

**Last Updated:** 2025-12-18
**Next Review:** Post-Branching Implementation

> [!TIP]
> **Wondering about other ideas?**
> Check **[possibilities.md](./possibilities.md)** for the "Might Do" queue.
