# Suggestion: Narrative Tragedy Engine & COLLAPSED Epilogue

> **Status:** Architectural Proposal / Backlog Reference  
> **Domain:** Narrative Tragedy, Irrevocable Failure & Rewind Mechanics  
> **Scope:** `SCENE.COLLAPSE` Protocol, Tragedy Theming in `Epilogue.svelte`, State Snapshots & Rewind  

---

## 1. Context & Baseline Infrastructure

The RPGlitch Director recognizes three overarching story states:
- `IN_PROGRESS`: Story active.
- `CONCLUDED`: Narrative victory / successful resolution.
- `COLLAPSED`: Irrevocable tragic collapse / catastrophic scenario failure.

While the engine flags `meta.conclusion_status: "COLLAPSED"` and renders a `💀 Story Collapsed` badge, the epilogue prose and styling currently reuse generic victory pipelines.

---

## 2. Proposed Tragedy Features

### 2.1 Dedicated Narrative Protocol (`SCENE.COLLAPSE`)
- **Location:** `src/data/definitions/protocols.js` & `src/intelligence/prompts.js`
- **Specification:**
  - Instruct the Fractal to narrate the permanent mark left on the world, unresolved wounds, and the departure/fall of entities.
  - Branch `prompt_builder.build_epilogue()` on `conclusion_status === "COLLAPSED"` to inject `SCENE.COLLAPSE`.

### 2.2 Tragedy Theme & Visual Styling in `Epilogue.svelte`
- **Visuals:** Desaturated, void-black shadow palette, crimson cracked borders.
- **Header:** Outcome badge (`💀 QUEST COLLAPSED` / `✕ TRAGIC RESOLUTION`).

### 2.3 State Snapshot Rewind / Retry Mechanism
- Maintain a state snapshot immediately prior to the catastrophic turn.
- Render a **"Rewind / Retry"** action button in the collapsed console bar, allowing players to rewind to the last `IN_PROGRESS` turn without losing their entity configurations.

### 2.4 Pre-Collapse Warning Hook
- An optional confirmation dialog when the Director first proposes `story_status: "COLLAPSED"`, giving the player a final opportunity to intervene or accept the tragedy.
