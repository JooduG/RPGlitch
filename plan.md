# **🗺️ Project Roadmap & Master Backlog**

**Purpose:** This is the project's strategic command center. It serves as a parking lot for ideas, a backlog for committed work, and a launchpad for moonshots. When an item is approved for active development, it moves to /memory-bank/present/ with a delivery target.

**📋 Merged Document:** CODE_REVIEW.md (2025-10-30) has been merged into this plan. Completed work has been archived to `memory-bank/past/code-review-completion-2025-10-31.md`. Stage 3 refactoring tasks are now integrated below under "Code Quality & Refactoring".

## **How we use this file**

* **Status values**: idea (default), researching, spiking, approved (ready for /present), In Progress, Done, Maybe/Later.
* **Impact/Effort** are rough gut-checks (S/M/L) to aid prioritization.
* **Signals to commit** list concrete evidence we’ll watch for before promoting an idea.

---

## **Idea Backlog (System Health, Features, & Tooling)**

| Idea | Rationale | Impact | Effort | Dependencies | Status | Signals to Commit |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **\--- Architecture & Rules \---** | | | | | | |
| Review & Refine All Rule Files | Ensure clarity, completeness, and unambiguous AI interpretation to reduce errors. | M | M | N/A | idea | Frequent AI errors related to rule misinterpretation; onboarding friction for new rules. |
| Develop New Rule Protocols | Address emerging operational needs or complex scenarios as the project grows. | M | M | Existing rule framework | idea | A new, complex task arises that isn't covered by current protocols. |
| Update System Architecture Docs | Keep diagrams and descriptions in sync with the current state of the project. | S | S | N/A | idea | A significant architectural change is implemented. |
| **\--- Documentation \---** | | | | | | |
| Full Documentation Audit | Ensure all docs in /docs and READMEs are clear, accurate, and consistent. | M | M | Finalized folder structure | idea | Onboarding a new developer reveals significant gaps or outdated information. |
| Internal Link Validation | Ensure all cross-references in the documentation are correct after the major refactor. | S | S | N/A | idea | Users report broken links; automated link checker is implemented. |
| Document /build/config Files | Explain the purpose and key settings of each configuration file. | S | M | N/A | idea | Developers frequently ask what a specific config setting does. |
| **\--- Applications \---** | | | | | | |
| Enhance RPGlitch Storyboard | Add new features to improve the core user experience of the flagship app. | M | L | Stable storyboard UI | idea | User feedback specifically requests new storyboard capabilities. |
| Improve RPGlitch Profile Mgmt | Streamline the user flow for creating and editing character profiles. | M | M | Dexie.js schema | idea | Analytics show high drop-off rates or time spent on the profile creation screen. |
| Custom ImageGlitch Styling | Move beyond Pico.css to give the app a more unique, branded aesthetic. | S | M | N/A | idea | The app gains enough traction to warrant a unique visual identity. |
| Add ImageGlitch Unit Tests | Ensure the core image glitching logic is robust and prevent regressions. | M | M | Core logic finalized | idea | A bug is introduced into the image generation logic that tests would have caught. |
| **\--- Build & Tooling \---** | | | | | | |
| Refactor Build Scripts | Improve modularity, reusability, and maintainability of the build system. | M | L | N/A | idea | Build times become a significant bottleneck in the development workflow. |
| Add Error Handling to Scripts | Make the build process more reliable and easier to debug when it fails. | M | M | All build scripts | idea | A single build failure takes more than 15 minutes to diagnose. |
| **\--- Memory Bank \---** | | | | | | |
| Automate Task Archiving | Automatically move logs from /present to /past to enforce clean state. | S | M | CLAUDE.md protocols | idea | Manual archiving process is forgotten for two or more consecutive tasks. |
| Standardize /future Templates | Create clear and consistent templates for planning documents. | S | S | N/A | idea | The backlog becomes difficult to parse due to inconsistent formatting. |
| **\--- Testing \---** | | | | | | |
| Increase Test Coverage | Reach a target threshold for all apps and shared code to improve stability. | L | L | All source code | idea | A critical regression is deployed to production that would have been caught by tests. |
| Standardize Testing Frameworks | Ensure consistency across the project for easier maintenance. | M | L | N/A | idea | Two or more fundamentally different testing patterns are used for similar features. |
| Expand MCP Test Coverage | Ensure all MCP tool interactions are comprehensively validated. | M | M | mcp-guide.md | idea | An untested MCP integration fails silently. |

---

## **RPGlitch Feature Backlog**

### **Category: Core Functionality (Completed)**

| Idea | Rationale | Impact | Effort | Dependencies | Status | Notes |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| Implement Data Persistence | Persist all user data locally using IndexedDB. | M | M | Dexie.js schema | **Done** | Core requirement. |
| Implement Character/World Management | Allow users to create, edit, and delete their own characters and worlds. | M | M | Dexie.js schema | **Done** | Core requirement. |
| Implement Storyboard Functionality | Allow users to select characters and worlds to start a story. | M | M | Character/World Management | **Done** | Core requirement. |
| Implement AI Character Interaction | Integrate Perchance for AI chat, enabling core roleplaying functionality. | L | L | Perchance API | **In Progress** | Core chat FSM/Prompt logic is **Done**. UI wiring is the next step. |

### **Category: Code Quality & Refactoring (Stage 3 - Optional)**

| Idea | Rationale | Impact | Effort | Dependencies | Status | Notes |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| Full Refactor - Split God Functions | Break 138-line `initializeWhenReady()` into focused, testable units; similar for `updateStoryboardCard()` and `renderList()` | M | L | Code passing Stages 1 & 2 | idea | Optional enhancement. Details archived in `memory-bank/past/code-review-completion-2025-10-31.md` |
| Replace Console Logging | Use existing `log()` utility respecting debug flag; remove production console noise (~41 statements) | S | M | Logging infrastructure | idea | Cleaner console, better debugging control |
| Extract Card Navigation Handlers | DRY principle: eliminate duplicate click/keydown handlers in chin cards and storyboard | S | S | RPGlitch refactoring | idea | Reduces code duplication, easier maintenance |
| Replace Empty Catch Blocks | Add minimal logging to 50+ empty catch blocks (currently `catch { void 0; }`) | S | M | Logging infrastructure | idea | Easier debugging and error tracking |
| Extract Magic Numbers | Document hardcoded values (MAX_INIT_RETRIES=40, INIT_BACKOFF_MS=250, UI_BLOCK_THRESHOLD_MS=1500, etc.) | S | S | Code review | idea | Self-documenting code |
| Add JSDoc Comments | Add function documentation; currently only 1 JSDoc found in codebase | M | M | Code documentation | idea | Improves maintainability and IDE support |

### **Category: Chat & AI Features (New Ideas)**

| Idea | Rationale | Impact | Effort | Dependencies | Status | Signals to Commit / Notes |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| Implement Story Management | Allow users to save, load, and manage their stories. | M | M | Data Persistence | idea | Users want to return to previous sessions or branch narratives. |
| Implement Advanced Memory & Lore System | Unified system combining user-driven memory extraction ("Apply Memories") and automatic lorebook injection (RAG-lite). | L | L | AI Interaction, `App.prompt.build`, Dexie | researching | Needs design work. Should integrate with existing profile fields (e.g., 'past'). Combines previous Memory Mgmt & Lorebook ideas. |
| Implement Custom Code | Allow users to add custom JavaScript to their characters and worlds. | L | L | Perchance API | idea | Advanced users want to script unique behaviors or game mechanics. |


### **Category: UI/UX Improvements (New Ideas)**

| Idea | Rationale | Impact | Effort | Dependencies | Status | Signals to Commit / Notes |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| Improve the Chat View | Enhance the chat interface with character avatars, revised layout, typing indicators, etc. | M | M | AI Character Interaction | approved | Key next step after basic chat UI wiring. Layout defined in `design-system.md`. `Conclude Story` button functionality needs further design. |
| Improve the Profile View | Enhance the profile view with character/world images and tags. | S | S | Character/World Management | idea | A more informative profile view will help users choose characters and worlds. |
| Improve the Form View | Enhance the form view with image upload/generation and a tags input field. | M | M | Character/World Management | idea | A more user-friendly form view will make it easier to create content. Connects to Image Generation goal. |
| Implement Profile Image Generation | Allows users to generate (or upload) images for characters/worlds, possibly integrating ImageGlitch. | M | M | Perchance `text-to-image-plugin` | researching | User wants image generation, not just upload. Explore integration/merge with ImageGlitch. Replaces previous "Upload" item with broader scope. |
| Implement Entity Color Picker | Adds a simple color picker to entity forms to set a theme color (e.g., `--pico-primary`). | S | M | Form View, CSS variables | approved | High-impact, low-effort visual customization. |


---

## **✅ Core Execution Plan (Completed)**

> **Status Update (2025-10-27):** This execution plan, authored on 2025-08-25, has been successfully implemented. All key components and functions outlined below are now integrated into the codebase.

# RPGlitch — Core Execution Plan (30 Days) + Orchestration Blueprint

**Date:** 2025-08-25
**Scope:** Lock the **chat core** (deterministic prompts, FSM, persistence, storyboard binding) and stabilize the UI. Excludes offline mode and auxiliary integrations.

---

## 1) Objectives (Definition of “Done” for this cycle)

1.  Deterministic **Prompt Composer** with read-only Prompt Preview. **(Done)**
2.  **Chat FSM** supporting Send / Stop / Retry / Regenerate / Continue. **(Done)**
3.  **Dexie minimal schema** (`characters`, `threads`, `messages`, `settings`) with autosave. **(Done)**
4.  **Storyboard → Thread binding** with dynamic title updates. **(Done)**
5.  **Settings drawer (MVP)** mapped 1:1 to prompt params (temperature, top_p, maxTokens, stop, model). **(Done)**
6.  **Import/Export JSON** (versioned bundle; safe merge on import). **(Done)**
7.  **UI reliability**: fix select lock-in, shuffle, top-right actions, and “Cancel” on forms. **(Done)**

---

## 2) Workstreams

* **WS1 — State & Persistence**: App-state single source of truth and Dexie storage.
* **WS2 — Prompt & Preview**: deterministic builder, trimming, sanitized preview.
* **WS3 — Chat FSM**: lifecycle, streaming, AbortController wiring, error handling.
* **WS4 — Storyboard Binding**: selection → thread creation/activation; title sync.
* **WS5 — Settings Drawer (MVP)**: 1:1 param binding and per-thread snapshot.
* **WS6 — Import/Export**: bundle versioning, merge policy, validations.
* **WS7 — UI Reliability**: control truthiness and Dev HUD.

---

## 3) Milestones (Week-by-Week)

### Week 1 — Core Loop Online

* Establish `App.state` and `App.state.applyPatch(patch)`.
* Create Dexie tables; load/save happy path.
* Implement `App.prompt.build(threadId)` and Prompt Preview (sanitized).
* Implement streaming `App.chat.send()`, with Stop/Retry/Regenerate/Continue.

### Week 2 — Storyboard + Settings

* Bind storyboard selection to `App.thread.createFromSelection()` (create/select thread; update title).
* Implement Settings drawer (temperature, top_p, maxTokens, stop, model); snapshot settings into thread on first send.

### Week 3 — Persistence Comforts

* Export `{version:1, characters, threads, messages, settings}`.
* Import with ID conflict resolution; validate `version`.
* Trimming strategy to keep history within token budget.

### Week 4 — Reliability Polish

* Buttons bound to FSM; “Cancel” restores pristine slice from state.
* Deterministic shuffle; select controls as controlled components.
* Dev HUD toggle: active thread, FSM state, last payload, last error.

---

## 4) Implementation Blueprint

### 4.1 App State (shape)

```js
App.state = {
  characters: { byId: {}, allIds: [] },
  threads:    { byId: {}, allIds: [], activeId: null },
  messages:   { byThreadId: {} }, // { [threadId]: [{id, role, text, seed, meta, createdAt}] }
  settings:   { temperature: 0.7, top_p: 1.0, maxTokens: 512, stop: [], model: "default" },
  ui:         { fsm: "idle", promptPreviewOpen: false, lastError: null, title: "RPGlitch" }
};

App.state.applyPatch = (patch) => {
  // Shallow-merge per slice; emit a "state:changed" event for re-renders.
};
````

### 4.2 Dexie Minimal Schema

```md
DB name: rpglitch_v1

characters:   id ++, name, avatar, persona, scenario, tags, createdAt, updatedAt
threads:      id ++, characterId, title, settingsSnapshot, createdAt, updatedAt
messages:     id ++, threadId, role, text, seed, meta, createdAt
settings:     id=singleton, temperature, top_p, maxTokens, stop, model
```

Notes:

  * `settingsSnapshot` stored on a thread upon its first send; ensures reproducibility.
  * Keep raw `text` as plain strings; sanitize on render.

### 4.3 Prompt Composer & Trimming

```js
App.prompt.build = (threadId) => {
  const thread = App.state.threads.byId[threadId];
  const ch = App.state.characters.byId[thread?.characterId];
  const msgs = App.prompt.trimHistory(App.state.messages.byThreadId[threadId] || []);
  const system = [ch?.persona, ch?.scenario].filter(Boolean).join("\n\n");

  const params = {
    temperature: App.state.settings.temperature,
    top_p:       App.state.settings.top_p,
    maxTokens:   App.state.settings.maxTokens,
    stop:        App.state.settings.stop,
    model:       App.state.settings.model
  };

  return { system, messages: msgs, params };
};

App.prompt.trimHistory = (msgs) => {
  // Conservative, token-budget-aware trimming:
  // - Always retain latest N user/assistant pairs (configurable).
  // - Optional summarizer hook can be added later (not in this cycle).
  return msgs;
};
```

**Prompt Preview:** Render read-only, sanitized output derived from `App.prompt.build(activeThreadId)`.

### 4.4 Chat Lifecycle (FSM)

```js
// idle → sending → streaming → done | error | aborted
App.chat.send = async (userText) => {
  if (!userText) return;
  if (!["idle", "done", "error", "aborted"].includes(App.state.ui.fsm)) return;

  const threadId = App.threads.requireActive();
  await App.db.messages.add({ threadId, role: "user", text: userText, createdAt: Date.now() });

  const payload = App.prompt.build(threadId);
  const ctrl = new AbortController();

  App.state.applyPatch({ ui: { fsm: "sending", lastError: null } });

  try {
    App.state.applyPatch({ ui: { fsm: "streaming" } });

    await App.ai.generateStream({
      payload,
      signal: ctrl.signal,
      onToken: (t) => App.chat._appendAssistantToken(threadId, t),
      onDone:  () => App.chat._finalizeAssistantMessage(threadId)
    });

    App.state.applyPatch({ ui: { fsm: "done" } });
  } catch (e) {
    const isAbort = e?.name === "AbortError";
    App.state.applyPatch({ ui: { fsm: isAbort ? "aborted" : "error", lastError: e?.message || String(e) } });
  }
};

App.chat.stop          = () => {/* Abort via stored controller */};
App.chat.retry         = () => {/* Re-run last user message */};
App.chat.regenerate    = () => {/* Re-run last turn */};
App.chat.continue      = () => {/* Send small 'continue' user cue */};
App.chat._appendAssistantToken = (threadId, token) => {/* append/patch in-flight assistant msg */};
App.chat._finalizeAssistantMessage = (threadId) => {/* commit assistant msg end-of-stream */};
```

**UI Bindings:**

  * `Send` enabled only when FSM is `idle|done|error|aborted`.
  * `Stop` shown in `sending|streaming`.
  * `Retry/Regenerate/Continue` enabled in `done|error|aborted`.

### 4.5 Storyboard → Thread Binding

```js
App.thread.createFromSelection = ({ storyId, characterId, worldId }) => {
  const ch = App.state.characters.byId[characterId];
  const title = `${ch?.name || "Character"} × ${storyId || "Story"}`;

  const threadId = App.db.threads.add({
    characterId,
    title,
    settingsSnapshot: { ...App.state.settings },
    createdAt: Date.now(),
    updatedAt: Date.now()
  });

  App.state.applyPatch({ threads: { activeId: threadId }, ui: { title } });
  return threadId;
};
```

### 4.6 Import / Export

  * **Export format:**
    `{ version: 1, characters: [...], threads: [...], messages: [...], settings: {...} }`
  * **Import policy:**
    Validate `version`. On ID conflict, either keep existing or re-ID imported items; ensure referential integrity (`threadId` remaps).

### 4.7 UI Reliability

  * All selects are controlled inputs bound to state.
  * Shuffle is deterministic (seed-based or fixed RNG snapshot).
  * “Cancel” restores pristine slice from state (no DOM-only revert).
  * Dev HUD toggle (`Ctrl+~`): shows active thread, FSM state, last payload, last error.

-----

## 5\) Metrics

  * Crash-free streaming ≥ **99%**.
  * p50 LLM latency ≤ **1.5×** baseline.
  * Memory stable for **100-turn** threads (no OOM).
  * QA: **0** “dead button” defects across target flows.

-----

## 6\) Risks & Guards

  * **Token overflow** → conservative trimming; summarizer hook deferred.
  * **State drift** → single mutation path; log `applyPatch` in dev.
  * **Schema churn** → versioned export; prepare a v1→v2 migration stub.

-----

## 7\) Acceptance Criteria (per Objective)

  * Prompt Preview matches payload 1:1 and is sanitized.
  * FSM transitions observable and consistent; Stop/Retry/Regenerate/Continue behave as specified.
  * Dexie persists and restores across reloads; referential integrity holds.
  * Storyboard selection always yields an active thread with a correct title.
  * Settings drawer values affect prompt params; per-thread snapshot on first send.
  * Import/Export round-trips data without corruption; conflicts resolved deterministically.
  * UI controls accurately reflect state; Dev HUD is available in dev builds.

-----

## **Future Development**

### **Moonshots (Speculative)**

  * **Agentic Scene Director**: AI model proposes the next storyboard beat, drafts prompts, and assembles assets for RPGlitch.
  * **Co-op Sessions**: Two users role-play in a shared RPGlitch session with synchronized state and per-user UI.
  * **Heuristics-Augmented Decider**: A lightweight rules layer that nudges AI sampling parameters based on scene type.

### **Maybe/Later (Cool, but not urgent)**

  * Advanced in-app theming editor (export/import CSS tokens).
  * In-app interactive tutorial mode for new users.
  * "Screenshot-to-Persona" feature (parse a character card from an image using OCR + heuristics).
  * **AI Co-writer and Summarizer:** Provides direct user-facing AI tools ("Summarize story," "Suggest next line") in the chat UI. (Moved from backlog)

-----

## **Assumptions & Risks**

  * Token costs for new AI features (summarization, TTS) will remain within an acceptable budget.
  * Browser APIs (ASR/TTS) are sufficiently reliable across modern browsers.
  * The Perchance single-file constraint remains the primary deployment target.

## **Not Doing (For Now)**

  * Server-side persistence beyond the current Dexie.js implementation.
  * Large-scale UI redesigns not tied to specific new functionality.
  * Static Thread-Specific 'Reminder' Field (needs dynamic design if pursued).
  * Top Notification System (design/need undecided).

-----

## **Intake Template (Copy for new ideas)**

### \<Idea Title\>

**Rationale:** \<why\>
**Impact:** S/M/L
**Effort:** S/M/L
**Dependencies:** \<systems/features\>
**Status:** idea
**Signals to commit:** \<what evidence unlocks promotion\>
