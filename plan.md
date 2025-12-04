# 🗺️ RPGlitch Roadmap

**Purpose:** Strategic command center for knowing what to work on next. Pick an item, code it, ship it.

**Completed Work:** See [memory-bank/completed-2025-11-17-audit.md](memory-bank/completed-2025-11-17-audit.md)

---

## 📍 Current Context (Auto-updated by AI)

**Focus:** ✨ **UX & CORE GAMEPLAY POLISH**
**In Progress:** **[Improve Chat View Polish](#improve-chat-view-polish)**
**Recently Done:**

- **Architectural Mandate COMPLETE:** Monolith fractured, Database Seeding implemented, Security Enforcement (Fail Closed) validated, Watchdog eliminated, and Context Builder (RAG Dossier) structured.
- **World Profile Layout:** Conditional 2-Row/Landscape design implemented.
  **Codebase Health:** ✅ **STABLE: Architectural Mandate Complete.**
  **Critical Next:** Improve Core Chat Experience.

---

## ✅ The Architect's Mandate (Completed)

**Status:** All critical infrastructure tasks are complete.

| Item                                                       | Category   | Impact | Effort | Dependencies | Status      |
| :--------------------------------------------------------- | :--------- | :----- | :----- | :----------- | :---------- |
| <a id="security-hardening"></a>**Security Enforcement** 🔴 | [Security] | H      | S      | None         | ✅ COMPLETE |
| <a id="refactor-monolith"></a>**Fracture `index.js`** 🔴   | [Refactor] | H      | L      | Security     | ✅ COMPLETE |
| <a id="kill-watchdog"></a>**Eliminate Watchdog** 🔴        | [Cleanup]  | H      | M      | Store        | ✅ COMPLETE |
| <a id="data-hygiene"></a>**Database Seeding** 🟠           | [Data]     | M      | M      | Database     | ✅ COMPLETE |
| <a id="context-builder"></a>**Context Builder (RAG)** 🟠   | [AI Logic] | H      | M      | AI Service   | ✅ COMPLETE |

---

## 🟠 Feature Queue (Active & Paused)

Approved features queue. Moving 'Polish' to active focus.

| Item                                                              | Category   | Impact | Effort | Dependencies | Notes                                                                           |
| :---------------------------------------------------------------- | :--------- | :----- | :----- | :----------- | :------------------------------------------------------------------------------ |
| <a id="improve-chat-view-polish"></a>**Improve Chat View Polish** | [UI/UX]    | M      | M      | None         | **🎯 CURRENT FOCUS.** Refine avatar layout, typing indicators, message styling. |
| <a id="story-list-ui"></a>**Story List & Load UI**                | [UI/UX]    | L      | M      | Refactor     | **🅿️ PAUSED.** Create "Load Story" modal reading from `db.stories`.             |
| **Tag Management UI**                                             | [UI/UX]    | M      | S      | Refactor     | **🅿️ PAUSED.** Restore `tags` editing in the new Profile Modal.                 |
| **Custom Code Wiring**                                            | [Features] | M      | M      | Refactor     | **🅿️ PAUSED.** Connect `#custom-js` in Settings to the new `ContextBuilder`.    |

---

## 💡 Backlog

### High Priority

| Item                                                      | Category       | Impact | Effort | Dependencies  | Notes                                                   |
| :-------------------------------------------------------- | :------------- | :----- | :----- | :------------ | :------------------------------------------------------ |
| <a id="story-management"></a>**Story Management Actions** | [Features]     | M      | M      | Story List UI | Add "Delete", "Export", and "Clone" actions to Load UI. |
| **Extract Card Navigation**                               | [Code Quality] | S      | S      | None          | Shared utility for keyboard nav in drawers/storyboard.  |

### Medium Priority

| Item                   | Category       | Impact | Effort | Dependencies | Notes                                                                |
| :--------------------- | :------------- | :----- | :----- | :----------- | :------------------------------------------------------------------- |
| **Add JSDoc Comments** | [Code Quality] | M      | L      | None         | Document new modules (`store.js`, `services/*`) as they are created. |

---

## 🌙 Moonshots

- **Agentic Scene Director**: AI model proposes the next storyboard beat.
- **Co-op Sessions**: Shared state via PeerJS or similar.

---

**Last Updated:** 2025-11-23
**Next Review:** Post-Polish Audit
