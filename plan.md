# 🗺️ RPGlitch Roadmap

**Purpose:** Strategic command center for knowing what to work on next. Pick an item, code it, ship it.

---

## 📍 Current Context (Auto-updated by AI)

**Focus:** ⚡ **TECHNICAL HARDENING & PERFORMANCE**
**In Progress:** **[Offload Logic to WebWorkers](#webworkers)**
**Recently Done:**

- **Architectural Mandate COMPLETE:** Monolith fractured, Database Seeding implemented, Context Builder (RAG) operational.
- **Codebase Status:** Stable but suffering from synchronous UI blocking (Main Thread overload) and implicit event chains.

---

## 🚀 Critical Priorities (The "Will Do" List)

These are the non-negotiable next steps to fix performance lag and architectural debt.

| Item | Category | Impact | Effort | Dependencies | Notes |
| :--- | :--- | :--- | :--- | :--- | :--- |
| <a id="webworkers"></a>**Offload Logic to WebWorkers** | [Perf] | H | M | None | **🎯 CURRENT FOCUS.** Move `TurnManager` and Physics to a "Blob" worker to unblock the Main Thread. |
| <a id="event-bus"></a>**Formalize Event Bus** | [Refactor] | H | M | None | Replace implicit DOM events with a structured `StateStore` or `EventTarget` class. |
| <a id="virtual-scrolling"></a>**Virtual Scrolling** | [UI/Perf] | H | M | Event Bus | Implement DOM recycling in `ui-render-chat.js`. Only render visible messages. |
| <a id="types-d-ts"></a>**Enhance Type Safety** | [DX] | M | S | None | Create `types.d.ts` for JSDoc "Job Descriptions" (Entity, Story, Dynamics). |
| <a id="config-physics"></a>**Configurable Physics** | [Refactor] | M | S | None | Extract magic numbers (Entropy/Velocity thresholds) to `physics-config.js`. |
| <a id="viz-arch"></a>**Visualize Architecture** | [Docs] | M | S | None | Add Mermaid.js diagrams to `README.md` (User -> DB -> Kernel -> AI -> UI). |

---

## 🟠 Feature Queue & Backlog (The "Might Do" List)

Approved features and polish items. Prioritize based on user feedback.

| Item | Category | Impact | Effort | Dependencies | Notes |
| :--- | :--- | :--- | :--- | :--- | :--- |
| <a id="skeleton-screens"></a>**Skeleton Screens** | [UI/UX] | M | S | CSS | CSS-only placeholders to fix perceived load time during "Complex Loader" stitching. |
| <a id="branching-narrative"></a>**Branching Narratives** | [Feature] | H | L | DB Schema | Add `parentId` to messages in `core-db.js` to enable "Fork Story" (DAG structure). |
| <a id="story-list-ui"></a>**Story List & Load UI** | [UI/UX] | L | M | Refactor | **🅿️ PAUSED.** Create "Load Story" modal reading from `db.stories`. |
| **Tag Management UI** | [UI/UX] | M | S | Refactor | **🅿️ PAUSED.** Restore `tags` editing in the new Profile Modal. |
| **Custom Code Wiring** | [Features] | M | M | Refactor | **🅿️ PAUSED.** Connect `#custom-js` in Settings to the new `ContextBuilder`. |
| **Automate Hygiene** | [DevOps] | L | S | Scripting | Script to detect and delete orphan files (unused SCSS/JS). |
| **Parallel Build Scripts** | [DevOps] | L | S | NPM | Use `npm-run-all` to build RPGlitch and ImageGlitch simultaneously. |
| **Prompt Snapshots** | [Testing] | L | M | Jest | Test to assert that generated system prompts match a "Golden Master" snapshot. |

---

## ✅ The Architect's Mandate (Completed History)

**Status:** All critical infrastructure tasks from the previous epoch are complete.

| Item | Category | Status |
| :--- | :--- | :--- |
| **Security Enforcement** | [Security] | ✅ COMPLETE |
| **Fracture `index.js`** | [Refactor] | ✅ COMPLETE |
| **Eliminate Watchdog** | [Cleanup] | ✅ COMPLETE |
| **Database Seeding** | [Data] | ✅ COMPLETE |
| **Context Builder (RAG)** | [AI Logic] | ✅ COMPLETE |

---

**Last Updated:** 2025-12-10
**Next Review:** Post-WebWorker Implementation
