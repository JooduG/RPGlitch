# 🗺️ RPGlitch Roadmap

**Purpose:** Strategic command center for knowing what to work on next. Pick an item, code it, ship it.

**Completed Work:** See [memory-bank/completed-2025-11-17-audit.md](memory-bank/completed-2025-11-17-audit.md)

---

## 📍 Current Context (Auto-updated by AI)

**In Progress:** **[Story List & Load UI](#story-list-ui)**
**Recently Done:** - **Universal Stage:** 3-column "Morph Grid" layout (Storyboard ↔ Gameplay) complete.
- **Smart Drawer:** Context-aware dropdowns with collision detection and "drop-up" logic.
- **Profile Modal:** Frosted glass overlay with split interaction (Image -> View, Text -> Change).
- **Settings Modal:** Redesigned as a glass modal; added "Story Prompt" and "Custom JS" fields.
- **Entity Workflow:** "Clone" for premades, "Edit" for custom entities, integrated into Profile footer.
**Codebase Health:** ✅ Core 90% • ⚠️ Critical Feature Gap (No Load Screen) • 🔄 Code quality 80%
**Critical Next:** Story List/Load UI, Tag Management restoration.

---

## 🔴 Critical / Ready to Build

High-impact items that are approved and ready to start immediately.

| Item | Category | Impact | Effort | Dependencies | Notes |
| :--- | :--- | :--- | :--- | :--- | :--- |
| <a id="story-list-ui"></a>**Story List & Load UI** 🔴 | [UI/UX] | L | M | Database | **🎯 AI Impl:** Create a "Load Story" modal (similar style to Settings). List entries from `db.stories`. Clicking resumes the session (loads messages/entities into state). |
| **Tag Management UI** 🟠 | [UI/UX] | M | S | Profile Modal | **🎯 AI Impl:** Restore the ability to add/remove tags in the new Profile Modal. Use a "chip input" style field in the form section. |
| **Custom Code Wiring** | [Features] | M | M | Settings UI | **🎯 AI Impl:** Connect the `#custom-js` field in Settings to the app initialization/prompt loop. Safely `eval` or inject user scripts. |

---

## 🔄 In Progress

Currently active work with context tracking.

* **Refining Modal Interactions:** Polishing the specific behavior of the Profile and Settings modals (scrollbars, backgrounds, sizing).

---

## 🍎 Low Hanging Fruit

Quick wins for high-value progress without deep focus.

- **[Extract Remaining Constants](#extract-remaining-constants)** - Move `UI_BLOCK_THRESHOLD_MS` and `WATCHDOG_INTERVAL_MS` to constants.
- **[Story Management Actions]** - Add "Delete" buttons to the Story List items once the list is built.

---

## 💡 Backlog

### High Priority

Items with significant user impact or blocking other features.

| Item | Category | Impact | Effort | Dependencies | Notes |
| :--- | :--- | :--- | :--- | :--- | :--- |
| <a id="story-management"></a>**Story Management** | [Features] | M | M | [Story List UI](#story-list-ui) | Add "Delete", "Export", and "Clone" actions to individual stories in the Load UI. |
| **Advanced Memory & Lore System** | [Features] | L | L | AI Interaction | Unified system combining user-driven memory extraction ("Apply Memories") and automatic lorebook injection (RAG-lite). Should integrate with existing profile fields. |
| **Improve Chat View Polish** | [UI/UX] | M | M | Universal Stage | Refine the gameplay center column. Better avatar layout, typing indicators, message styling to match the new "Glass" aesthetic. |

### Medium Priority

Valuable improvements that enhance quality and developer experience.

| Item | Category | Impact | Effort | Dependencies | Notes |
| :--- | :--- | :--- | :--- | :--- | :--- |
| <a id="extract-card-navigation"></a>**Extract Card Navigation Handlers** | [Code Quality] | S | S | None | **🎯 AI Impl:** Create shared `attachCardNavigation` utility to dry up click/keydown handlers in drawers and storyboard. |
| **Add JSDoc Comments** | [Code Quality] | M | L | None | **Progress:** ~45% coverage. **🎯 AI Impl:** Document remaining exports in `index.js`, `views.js`, and `drawer.js`. |

### Low Priority / Future

Nice-to-have improvements and optimizations.

| Item | Category | Impact | Effort | Dependencies | Notes |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Split God Functions** | [Code Quality] | M | L | None | Break `initializeWhenReady()` in `index.js` into focused units (plugins, db, settings, ui). |
| **Advanced Theming Editor** | [Features] | L | L | None | In-app editor to customize the "Ambience" colors and background gradients beyond the presets. |

---

## 🌙 Moonshots (Speculative)

Big vision ideas for future exploration. Not prioritized yet.

- **Agentic Scene Director**: AI model proposes the next storyboard beat, drafts prompts, and assembles assets for RPGlitch automatically.
- **Co-op Sessions**: Two users role-play in a shared RPGlitch session with synchronized state.
- **Heuristics-Augmented Decider**: A lightweight rules layer that nudges AI sampling parameters based on scene type.
- **Screenshot-to-Persona**: Parse a character card from an image using OCR + heuristics.

---

## 📋 System Health & Tooling Ideas

Infrastructure and tooling improvements (not directly user-facing).

| Idea | Rationale | Impact | Effort | Status |
| :--- | :--- | :--- | :--- | :--- |
| **Architecture & Rules** | Review & Refine Rule Files for clarity. | M | M | idea |
| **Documentation** | Full Documentation Audit (docs vs code reality). | M | M | idea |
| **Testing** | Update tests to match the new 3-column Universal Stage layout. | L | L | idea |

---

**Last Updated:** 2025-11-23
**Next Review:** After Story List/Load UI implementation