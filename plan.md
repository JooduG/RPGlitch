# 🗺️ RPGlitch Roadmap

**Purpose:** Strategic command center for knowing what to work on next. Pick an item, code it, ship it.

**Completed Work:** See [memory-bank/completed-2025-11-17-audit.md](memory-bank/completed-2025-11-17-audit.md)

---

## 📍 Current Context (Auto-updated by AI)

**Focus:** 🏗️ **ARCHITECTURAL RESCUE OPERATION**
**In Progress:** **[Deconstruct `index.js` Monolith](#refactor-monolith)**
**Recently Done:**
- **Universal Stage:** 3-column "Morph Grid" layout complete.
- **Smart Drawer:** Context-aware dropdowns with collision detection.
- **Profile & Settings Modals:** "Glass" design implementation.
**Codebase Health:** 🟥 **CRITICAL: Unmaintainable Monolith & Security Risks**
**Critical Next:** Security Hardening, Store Extraction, Watchdog Elimination.

---

## 🔴 The Architect's Mandate (Immediate Action Items)

**Strict Priority:** These items must be resolved before new features are added to ensure stability and security.

| Item | Category | Impact | Effort | Dependencies | Notes |
| :--- | :--- | :--- | :--- | :--- | :--- |
| <a id="security-hardening"></a>**Security Enforcement** 🔴 | [Security] | H | S | None | **🎯 AI Impl:** Enforce `DOMPurify` check at application boot (`index.js`). Throw critical error if missing. Remove "optional" checks in `views.js`. **Fail Closed.** |
| <a id="refactor-monolith"></a>**Fracture `index.js`** 🔴 | [Refactor] | H | L | Security | **🎯 AI Impl:** Explode the `App` object. <br>1. `js/store.js`: State & `applyPatch`.<br>2. `js/services/ai.js`: Pure AI logic (no DOM).<br>3. `js/controllers/story.js`: Orchestration.<br>4. `js/index.js`: Bootstrapper only. |
| <a id="kill-watchdog"></a>**Eliminate Watchdog** 🔴 | [Cleanup] | H | M | Store | **🎯 AI Impl:** Delete `startUIWatchdog` and polling logic in `utils.js`. Replace with proper state-based UI blocking (`ui.fsm` in Store) and standard `<dialog>` API usage. |
| <a id="data-hygiene"></a>**Database Seeding** 🟠 | [Data] | M | M | Database | **🎯 AI Impl:** Stop runtime merging of `premade` objects in `entities.js`. "Seed" premades into `db.entities` (with `isPremade: 1`) on app init. |
| <a id="context-builder"></a>**Context Builder (RAG)** 🟠 | [AI Logic] | H | M | AI Service | **🎯 AI Impl:** Replace hardcoded string concatenation in AI service. Build a `ContextBuilder` class that fetches Character, **Lorebook** (missing), and Memories before generation. |

---

## 🟠 Feature Queue (Paused)

Approved features temporarily on hold until architecture stabilizes.

| Item | Category | Impact | Effort | Dependencies | Notes |
| :--- | :--- | :--- | :--- | :--- | :--- |
| <a id="story-list-ui"></a>**Story List & Load UI** | [UI/UX] | L | M | Refactor | **Blocked by Refactor.** Create "Load Story" modal reading from `db.stories`. |
| **Tag Management UI** | [UI/UX] | M | S | Refactor | Restore `tags` editing in the new Profile Modal. |
| **Custom Code Wiring** | [Features] | M | M | Refactor | Connect `#custom-js` in Settings to the new `ContextBuilder`. |

---

## 💡 Backlog

### High Priority

| Item | Category | Impact | Effort | Dependencies | Notes |
| :--- | :--- | :--- | :--- | :--- | :--- |
| <a id="story-management"></a>**Story Management Actions** | [Features] | M | M | Story List UI | Add "Delete", "Export", and "Clone" actions to Load UI. |
| **Improve Chat View Polish** | [UI/UX] | M | M | Universal Stage | Refine avatar layout, typing indicators, message styling. |

### Medium Priority

| Item | Category | Impact | Effort | Dependencies | Notes |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Extract Card Navigation** | [Code Quality] | S | S | None | Shared utility for keyboard nav in drawers/storyboard. |
| **Add JSDoc Comments** | [Code Quality] | M | L | None | Document new modules (`store.js`, `services/*`) as they are created. |

---

## 🌙 Moonshots

- **Agentic Scene Director**: AI model proposes the next storyboard beat.
- **Co-op Sessions**: Shared state via PeerJS or similar.

---

**Last Updated:** 2025-11-23
**Next Review:** Post-Refactor Audit