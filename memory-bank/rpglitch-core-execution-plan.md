<!-- path: present/rpglitch-core-execution-plan.md -->

# RPGlitch — Core Execution Plan (30 Days) + Orchestration Blueprint

**Date:** 2025-08-25  
**Scope:** Lock the **chat core** (deterministic prompts, FSM, persistence, storyboard binding) and stabilize the UI. Excludes offline mode and auxiliary integrations.

---

## 1) Objectives (Definition of “Done” for this cycle)

1. Deterministic **Prompt Composer** with read-only Prompt Preview.
2. **Chat FSM** supporting Send / Stop / Retry / Regenerate / Continue.
3. **Dexie minimal schema** (`characters`, `threads`, `messages`, `settings`) with autosave.
4. **Storyboard → Thread binding** with dynamic title updates.
5. **Settings drawer (MVP)** mapped 1:1 to prompt params (temperature, top_p, maxTokens, stop, model).
6. **Import/Export JSON** (versioned bundle; safe merge on import).
7. **UI reliability**: fix select lock-in, shuffle, top-right actions, and “Cancel” on forms.

---

## 2) Workstreams

- **WS1 — State & Persistence**: App-state single source of truth and Dexie storage.
- **WS2 — Prompt & Preview**: deterministic builder, trimming, sanitized preview.
- **WS3 — Chat FSM**: lifecycle, streaming, AbortController wiring, error handling.
- **WS4 — Storyboard Binding**: selection → thread creation/activation; title sync.
- **WS5 — Settings Drawer (MVP)**: 1:1 param binding and per-thread snapshot.
- **WS6 — Import/Export**: bundle versioning, merge policy, validations.
- **WS7 — UI Reliability**: control truthiness and Dev HUD.

---

## 3) Milestones (Week-by-Week)

### Week 1 — Core Loop Online

- Establish `App.state` and `App.state.applyPatch(patch)`.
- Create Dexie tables; load/save happy path.
- Implement `App.prompt.build(threadId)` and Prompt Preview (sanitized).
- Implement streaming `App.chat.send()`, with Stop/Retry/Regenerate/Continue.

### Week 2 — Storyboard + Settings

- Bind storyboard selection to `App.thread.createFromSelection()` (create/select thread; update title).
- Implement Settings drawer (temperature, top_p, maxTokens, stop, model); snapshot settings into thread on first send.

### Week 3 — Persistence Comforts

- Export `{version:1, characters, threads, messages, settings}`.
- Import with ID conflict resolution; validate `version`.
- Trimming strategy to keep history within token budget.

### Week 4 — Reliability Polish

- Buttons bound to FSM; “Cancel” restores pristine slice.
- Deterministic shuffle; select controls as controlled components.
- Dev HUD toggle: active thread, FSM state, last payload, last error.

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

characters:  id ++, name, avatar, persona, scenario, tags, createdAt, updatedAt
threads:     id ++, characterId, title, settingsSnapshot, createdAt, updatedAt
messages:    id ++, threadId, role, text, seed, meta, createdAt
settings:    id=singleton, temperature, top_p, maxTokens, stop, model
```

Notes:

- `settingsSnapshot` stored on a thread upon its first send; ensures reproducibility.
- Keep raw `text` as plain strings; sanitize on render.

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

App.chat.stop        = () => {/* Abort via stored controller */};
App.chat.retry       = () => {/* Re-run last user message */};
App.chat.regenerate  = () => {/* Re-run last turn */};
App.chat.continue    = () => {/* Send small 'continue' user cue */};
App.chat._appendAssistantToken = (threadId, token) => {/* append/patch in-flight assistant msg */};
App.chat._finalizeAssistantMessage = (threadId) => {/* commit assistant msg end-of-stream */};
```

**UI Bindings:**

- `Send` enabled only when FSM is `idle|done|error|aborted`.
- `Stop` shown in `sending|streaming`.
- `Retry/Regenerate/Continue` enabled in `done|error|aborted`.

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

- **Export format:**
  `{ version: 1, characters: [...], threads: [...], messages: [...], settings: {...} }`
- **Import policy:**
  Validate `version`. On ID conflict, either keep existing or re-ID imported items; ensure referential integrity (`threadId` remaps).

### 4.7 UI Reliability

- All selects are controlled inputs bound to state.
- Shuffle is deterministic (seed-based or fixed RNG snapshot).
- “Cancel” restores pristine slice from state (no DOM-only revert).
- Dev HUD toggle (`Ctrl+~`): shows active thread, FSM state, last payload, last error.

---

## 5) Metrics

- Crash-free streaming ≥ **99%**.
- p50 LLM latency ≤ **1.5×** baseline.
- Memory stable for **100-turn** threads (no OOM).
- QA: **0** “dead button” defects across target flows.

---

## 6) Risks & Guards

- **Token overflow** → conservative trimming; summarizer hook deferred.
- **State drift** → single mutation path; log `applyPatch` in dev.
- **Schema churn** → versioned export; prepare a v1→v2 migration stub.

---

## 7) Acceptance Criteria (per Objective)

- Prompt Preview matches payload 1:1 and is sanitized.
- FSM transitions observable and consistent; Stop/Retry/Regenerate/Continue behave as specified.
- Dexie persists and restores across reloads; referential integrity holds.
- Storyboard selection always yields an active thread with a correct title.
- Settings drawer values affect prompt params; per-thread snapshot on first send.
- Import/Export round-trips data without corruption; conflicts resolved deterministically.
- UI controls accurately reflect state; Dev HUD is available in dev builds.
