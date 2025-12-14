# 🗺️ RPGlitch Roadmap

**Purpose:** Strategic command center for knowing what to work on next. Pick an item, code it, ship it.

**Completed Work:** See [memory-bank/completed-2025-11-17-audit.md](memory-bank/completed-2025-11-17-audit.md)

---

## 📍 Current Context (Auto-updated by AI)

**Focus:** ✨ **MAINTENANCE & POLISH**
**In Progress:** **Documentation Sync**
**Recently Done:**

- **Terminology Standardization:** Rebranded "World" to "Fractal" across UI and Logic.
- **Visual Polish:** Implemented Scalable SVG Icon System (replaced emojis).
- **Messenger Mode:** Fixed icon sizing and heartbeat logic.

- **Visualize Architecture:** Added Mermaid.js data flow diagrams to README to explain the Worker/Bridge topology.
- **Type Safety:** Implemented `types.d.ts` for full IntelliSense support.
- **Configurable Physics:** Centralized game balance constants in `config-physics.js`.
- **WebWorker Offloading:** Successfully moved heavy simulation logic to background threads.

---

## 🚀 Critical Priorities (The "Will Do" List)

With the architecture hardened, we return to shipping user-facing features.

| Item | Category | Impact | Effort | Dependencies | Notes |
| :--- | :--- | :--- | :--- | :--- | :--- |
| <a id="skeleton-screens"></a>**Skeleton Screens** | [UI/UX] | M | S | CSS | **🎯 CURRENT FOCUS.** Add CSS-only placeholders to `index.html` to improve perceived load time while the "Complex Loader" runs. |
| <a id="branching-narrative"></a>**Branching Narratives** | [Feature] | H | L | DB Schema | Update `messages` schema with `parentId`. Allow users to "Fork" the story from any message node. |
| <a id="story-list-ui"></a>**Story List & Load UI** | [UI/UX] | L | M | Refactor | Create a proper "Load Game" modal reading from `db.stories` instead of the current placeholder. |

---

## 🟠 Feature Queue & Backlog (The "Might Do" List)

Polish and maintenance tasks to pick up when convenient.

| Item | Category | Impact | Effort | Dependencies | Notes |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Tag Management UI** | [UI/UX] | M | S | Refactor | Restore `tags` editing in the new Profile Modal. |
| **Custom Code Wiring** | [Features] | M | M | Refactor | Connect `#custom-js` in Settings to the new `ContextBuilder` (allow user scripts). |
| **Automate Hygiene** | [DevOps] | L | S | Scripting | Script to detect and delete orphan files (unused SCSS/JS). |
| **Parallel Build Scripts** | [DevOps] | L | S | NPM | Use `npm-run-all` to build RPGlitch and ImageGlitch simultaneously. |
| **Prompt Snapshots** | [Testing] | L | M | Jest | Test to assert that generated system prompts match a "Golden Master" snapshot. |

---

## ✅ The Architect's Mandate (Completed History)

**Status:** The "Technical Hardening" epoch is complete. The system is stable, type-safe, and performant.

| Item | Category | Status | Notes |
| :--- | :--- | :--- | :--- |
| **Visualize Architecture** | [Docs] | ✅ COMPLETE | Data flow diagrams added to `README.md`. |
| **Enhance Type Safety** | [DX] | ✅ COMPLETE | `types.d.ts` created; JSDoc interfaces defined. |
| **Configurable Physics** | [Refactor] | ✅ COMPLETE | `config-physics.js` implemented; magic numbers extracted. |
| **Offload Logic to WebWorkers** | [Perf] | ✅ COMPLETE | `worker.js` + `worker-bridge.js` implemented. |
| **Formalize Event Bus** | [Refactor] | ✅ COMPLETE | `core-events.js` created; UI subscribed to events. |
| **Virtual Scrolling** | [UI/Perf] | ✅ COMPLETE | `VirtualFeed` class with resize observers implemented. |
| **Security Enforcement** | [Security] | ✅ COMPLETE | |
| **Fracture `index.js`** | [Refactor] | ✅ COMPLETE | |
| **Eliminate Watchdog** | [Cleanup] | ✅ COMPLETE | |
| **Database Seeding** | [Data] | ✅ COMPLETE | |
| **Context Builder (RAG)** | [AI Logic] | ✅ COMPLETE | |
| **Terminology Standardization** | [Refactor] | ✅ COMPLETE | "World" -> "Fractal" migration. |
| **SVG Icon System** | [UI/UX] | ✅ COMPLETE | Replaced hardcoded emojis with SVGs. |

---

**Last Updated:** 2025-12-14
**Next Review:** Post-Branching Implementation
