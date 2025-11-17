# 🗺️ RPGlitch Roadmap

**Purpose:** Strategic command center for knowing what to work on next. Pick an item, code it, ship it.

**Completed Work:** See [memory-bank/completed-2025-11-17-audit.md](memory-bank/completed-2025-11-17-audit.md)

---

## 📍 Current Context (Auto-updated by AI)

**In Progress:** None
**Recently Done:** Console Logging Standardization, AI Chat System (full FSM + UI), Profile Image Generation (upload/generate/paste), Entity Color Picker, XSS Fixes (see [completed log](memory-bank/completed-2025-11-17-audit.md))
**Codebase Health:** ✅ Core 100% • ⚠️ 2 critical UI gaps • 🔄 Code quality 75%
**Critical Next:** Settings Drawer UI, Story List/Load UI

---

## 🔴 Critical / Ready to Build

High-impact items that are approved and ready to start immediately.

| Item | Category | Impact | Effort | Notes |
| :--- | :--- | :--- | :--- | :--- |
| **[Settings Drawer UI](#settings-drawer-ui)** 🍎 | [UI/UX] | M | S | **🎯 AI Impl:** Backend fully implemented at `index.js:1922-1968` (`_attachSettingsListeners()`). Add HTML elements: `#setting-temperature`, `#setting-top_p`, `#setting-max-tokens`, `#setting-stop`, `#setting-model`. Use Pico.css form styling. Reference ImageGlitch for UI pattern. **CRITICAL:** Users cannot currently adjust AI parameters. |
| **[Story List/Load UI](#story-list-ui)** | [UI/UX] | L | M | **🎯 AI Impl:** Stories table exists in `db.js`. CRUD operations exist (`App.story.loadActive()` works). Create: Story browser UI, "Load Story" view, story selection chin. Currently users lose access to old stories after refresh - they're in DB but no UI to access them. Consider infinite scroll or pagination for large story lists. |

---

## 🔄 In Progress

Currently active work with context tracking.

_No items currently in progress._

---

## 🍎 Low Hanging Fruit

Quick wins for high-value progress without deep focus. These reference items in the backlog below.

- **[Settings Drawer UI](#settings-drawer-ui)** - Add 5 HTML form elements, backend fully ready (15 min)
- **[Extract Remaining Constants](#extract-remaining-constants)** - Move 2 timing constants to top of file (5 min)
- **[Improve Chat View Polish](#improve-chat-view)** - Layout defined in design-system.md, just implementation (30-60 min)

---

## 💡 Backlog

### High Priority

Items with significant user impact or blocking other features.

| Item | Category | Impact | Effort | Dependencies | Notes |
| :--- | :--- | :--- | :--- | :--- | :--- |
| <a id="improve-chat-view"></a>**Improve Chat View** | [UI/UX] | M | M | AI Chat (✅ done) | Enhance chat interface with better character avatar layout, typing indicators polish, message styling. Layout defined in `design-system.md` (3-column desktop / 1-column mobile). `#conclude-story` button functionality needs design decision. |
| <a id="story-management"></a>**Story Management** | [Features] | M | M | Story List UI | ⛔ **Blocked:** Requires [Story List/Load UI](#story-list-ui) first. Then add: delete stories, clone stories, export individual stories. Full CRUD management. |
| **Advanced Memory & Lore System** | [Features] | L | L | AI Interaction, `App.prompt.build` | Unified system combining user-driven memory extraction ("Apply Memories") and automatic lorebook injection (RAG-lite). Needs design work. Should integrate with existing profile fields (e.g., 'past'). Combines previous Memory Mgmt & Lorebook ideas. |

### Medium Priority

Valuable improvements that enhance quality and developer experience.

| Item | Category | Impact | Effort | Dependencies | Notes |
| :--- | :--- | :--- | :--- | :--- | :--- |
| <a id="extract-card-navigation"></a>**Extract Card Navigation Handlers** | [Code Quality] | S | S | None | **🎯 AI Impl:** Create shared `attachCardNavigation(card, onActivate)` utility to eliminate 6+ duplicate click/keydown handlers in chin panels and storyboard. Saves ~60 lines of duplicate code. DRY principle. |
| **Improve Profile View** | [UI/UX] | S | S | Character/World Management (✅ done) | Enhance profile view with better image display and tag visualization. More informative display will help users choose characters/worlds. |
| **Improve Form View** | [UI/UX] | M | M | Character/World Management (✅ done) | Enhance form view with better tag input field (chip-style multi-select). More user-friendly content creation. |
| **Add JSDoc Comments** | [Code Quality] | M | L | None | **Progress:** 84 JSDoc comments added (~40% coverage). **🎯 AI Impl:** Add function documentation to remaining ~60% of exported functions across all modules. Priority: entities.js, index.js exports, views.js router. Better IDE autocomplete, easier onboarding, clearer API contracts. Well-documented areas: plugin loading, error handling, entity CRUD. |

### Low Priority / Future

Nice-to-have improvements and optimizations.

| Item | Category | Impact | Effort | Dependencies | Notes |
| :--- | :--- | :--- | :--- | :--- | :--- |
| <a id="extract-remaining-constants"></a>**Extract Remaining Constants** 🍎 | [Code Quality] | S | S | None | **🎯 AI Impl:** Extract final 2 timing constants: `UI_BLOCK_THRESHOLD_MS=1500`, `WATCHDOG_INTERVAL_MS=1200` to join the 4 already extracted (`PLUGIN_POLL_INTERVAL_MS`, `PLUGIN_WAIT_TIMEOUT_MS`, `MAX_INIT_RETRIES`, `INIT_BACKOFF_MS`). Self-documenting code, easier performance tuning. Also found: `BLUR_SUPPRESS_DURATION_MS`, `UI_WATCHDOG_MAX_ATTEMPTS`. |
| **Split God Functions** | [Code Quality] | M | L | None | Break 138-line `initializeWhenReady()` (index.js:2146-2380) into focused units: `initializePlugins()`, `initializeDatabase()`, `initializeSettings()`, `initializeUI()`, `initializeWatchdog()`. Optional enhancement. Improves testability and comprehension. See `memory-bank/archive/code-review-completion-2025-10-31.md`. |
| **Custom Code Execution** | [Features] | L | L | Perchance API | Allow users to add custom JavaScript to their characters and worlds. Advanced users want to script unique behaviors or game mechanics. Security implications need careful design. |

---

## 🌙 Moonshots (Speculative)

Big vision ideas for future exploration. Not prioritized yet.

- **Agentic Scene Director**: AI model proposes the next storyboard beat, drafts prompts, and assembles assets for RPGlitch automatically
- **Co-op Sessions**: Two users role-play in a shared RPGlitch session with synchronized state and per-user UI
- **Heuristics-Augmented Decider**: A lightweight rules layer that nudges AI sampling parameters based on scene type
- **Advanced Theming Editor**: In-app theming editor with export/import CSS tokens
- **Interactive Tutorial Mode**: In-app tutorial for new users with guided walkthrough
- **Screenshot-to-Persona**: Parse a character card from an image using OCR + heuristics
- **AI Co-writer and Summarizer**: Direct user-facing AI tools ("Summarize story," "Suggest next line") in chat UI

---

## 📋 System Health & Tooling Ideas

Infrastructure and tooling improvements (not directly user-facing).

| Idea | Rationale | Impact | Effort | Status | Signals to Commit |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Architecture & Rules** | | | | | |
| Review & Refine All Rule Files | Ensure clarity, completeness, and unambiguous AI interpretation to reduce errors | M | M | idea | Frequent AI errors related to rule misinterpretation; onboarding friction for new rules |
| Develop New Rule Protocols | Address emerging operational needs or complex scenarios as the project grows | M | M | idea | A new, complex task arises that isn't covered by current protocols |
| Update System Architecture Docs | Keep diagrams and descriptions in sync with the current state of the project | S | S | idea | A significant architectural change is implemented |
| **Documentation** | | | | | |
| Full Documentation Audit | Ensure all docs in /docs and READMEs are clear, accurate, and consistent | M | M | idea | Onboarding a new developer reveals significant gaps or outdated information |
| Internal Link Validation | Ensure all cross-references in the documentation are correct after the major refactor | S | S | idea | Users report broken links; automated link checker is implemented |
| Document /build/config Files | Explain the purpose and key settings of each configuration file | S | M | idea | Developers frequently ask what a specific config setting does |
| **Build & Tooling** | | | | | |
| Refactor Build Scripts | Improve modularity, reusability, and maintainability of the build system | M | L | idea | Build times become a significant bottleneck in the development workflow |
| Add Error Handling to Scripts | Make the build process more reliable and easier to debug when it fails | M | M | idea | A single build failure takes more than 15 minutes to diagnose |
| **Testing** | | | | | |
| Increase Test Coverage | Reach a target threshold for all apps and shared code to improve stability | L | L | idea | A critical regression is deployed to production that would have been caught by tests |
| Standardize Testing Frameworks | Ensure consistency across the project for easier maintenance | M | L | idea | Two or more fundamentally different testing patterns are used for similar features |
| Expand MCP Test Coverage | Ensure all MCP tool interactions are comprehensively validated | M | M | idea | An untested MCP integration fails silently |

---

## 📝 Item Template (For AI Reference)

When adding new items to the plan, use this format:

```markdown
| **Item Title** | [Category] | Impact | Effort | Dependencies | Notes with 🎯 AI Implementation hints |
```

**Categories:** `[UI/UX]`, `[Features]`, `[Code Quality]`, `[Security]`, `[Infrastructure]`, `[Docs]`

**Impact/Effort:** `S` (Small), `M` (Medium), `L` (Large)

**Status Indicators:**
- 🔴 Critical
- 🍎 Low Hanging Fruit
- ⛔ Blocked (with reference to blocker)
- 🎯 AI Implementation hints (technical guidance for AI agents)

**Workflow:**
1. New items start in appropriate Backlog section
2. When approved and clear, move to "Critical / Ready to Build"
3. When work starts, move to "In Progress" with context capture
4. When complete (after testing), AI asks for confirmation
5. After confirmation: update docs, unblock dependents, clean code, move to memory-bank

---

**Last Updated:** 2025-11-17
**Next Review:** After Settings UI and Story List UI completion
