# Suggestion: Narrative Tragedy Engine & COLLAPSED Epilogue

> **Status:** Architectural Proposal / Backlog Reference  
> **Domain:** Narrative Tragedy, Irrevocable Failure & Rewind Mechanics  
> **Scope:** `SCENE.COLLAPSE` Protocol, Tragedy Theming in `Epilogue.svelte`, State Snapshots & Rewind  

---

## 1. Executive Summary

While RPGlitch recognizes `story_status: "COLLAPSED"` and renders a status badge in the console ([`src/ui/console/Console.svelte`](file:///c:/Users/johng/source/repos/RPGlitch/src/ui/console/Console.svelte)), collapsed storylines currently reuse the generic victory epilogue prose and styling.

This specification proposes **dedicated tragedy mechanics and recovery systems**:
1. **Dedicated `SCENE.COLLAPSE` Protocol:** Fatalistic narrative directives emphasizing permanent world scars and aftermath.
2. **Tragedy Theming in `Epilogue.svelte`:** Crimson cracked borders and `💀 QUEST COLLAPSED` visual badges.
3. **State Snapshot Rewind / Retry Engine:** Allowing players to rewind to the turn immediately prior to catastrophic failure without losing initial entity setups.
4. **Pre-Collapse Confirmation Hook:** An optional interrupt before dispatching irrevocable failure.

---

## 2. Dedicated Narrative Protocol (`SCENE.COLLAPSE`)

- **Location:** `src/data/definitions/protocols.js` & `src/intelligence/prompts.js`
- **Specification:**

  ```javascript
  SCENE: {
    COLLAPSE: `You see everything. Close the scene on irrevocable tragedy. Use <think> to evaluate what was permanently broken, lost, or severed. Write the epilogue focusing on physical aftermath, lingering environmental scars, and the departure or fall of the entities. Do not force heroic silver linings or unearned closure. End on enduring sensory silence. No dialogue.`,
  }
  ```

- Branch `prompt_builder.build_epilogue()` on `conclusion_status === "COLLAPSED"` to inject `SCENE.COLLAPSE` instead of standard `SCENE.EPILOGUE`.

---

## 3. Tragedy Theme & Visual Styling in `Epilogue.svelte`

- **Visuals:** Desaturated, void-black shadow palette, crimson cracked borders (`border-rose-900/60`).
- **Header:** Outcome badge (`💀 QUEST COLLAPSED` / `✕ TRAGIC RESOLUTION`).
- **Export Header:** `> **State:** Collapsed (Tragic Ending)` in `story-export.js`.

---

## 4. State Snapshot Rewind / Retry Mechanism

- **Location:** `src/state/runtime.svelte.js` & `src/ui/console/Console.svelte`
- **Specification:**
  - Maintain an in-memory state snapshot of the turn immediately prior to the failure event.
  - Render a **"Rewind to Pre-Collapse Turn"** button inside the collapsed console bar.
  - Clicking Rewind restores the previous turn state and unfreezes the UI without resetting the user's initial character or fractal configuration.

---

## 5. Pre-Collapse Warning Hook

- When the Director first proposes `story_status: "COLLAPSED"`, display an optional pre-dispatch confirmation modal giving the player an opportunity to accept the tragedy or intervene with a desperate action.
