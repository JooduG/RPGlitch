# 📋 Comprehensive Strategic & Architectural Report: RPGlitch Engine

> **Document Type**: Architecture, Mechanics Audit & Roadmap Blueprint  
> **Date**: 2026-08-24  
> **Repository**: RPGlitch  

---

## 🏛️ 1. Executive Summary & Context

This session conducted an in-depth forensic analysis and architectural cleanup of the **RPGlitch Simulation Engine**, covering:
1. The **turn-by-turn simulation lifecycle** (what is visible to the player vs. what executes sub-surface).
2. The **purging of dead architectural stubs and legacy code debts** (`Causality Shield` and `SINO_LOGIC`).
3. The exact boundaries between **Every-Round foreground mechanics** vs. **Conditional background workers**.
4. The formulation of a new, high-performance architecture:
   - **Fast Foreground Director** (preserving somatic tells & prompt causality).
   - **Staggered Single-Entity Memory Forging** (rolling round-robin background worker).
   - **Decoupled Image Trigger Cooldowns**.
   - **Rich UI & Interaction Upgrades** (Entity Databox redesign, typewriter sync, active story guards).

---

## 🧹 2. Completed Cleanups & Codebase Hardening

### A. Causality Shield Purge (`run_causality_shield`)
- **Finding**: The Causality Shield was a static stub that simply returned `{ causality: { result: "success" } }` while wrapping the turn driver in redundant parameter passing and try-catches.
- **Action Taken**: 
  - Purged `run_causality_shield` from [`src/intelligence/dynamics.js`](src/intelligence/dynamics.js) and [`src/intelligence/index.js`](src/intelligence/index.js).
  - Streamlined `advance_turn()` in [`src/state/chrono.svelte.js`](src/state/chrono.svelte.js) to send the player's prompt directly into the Director and narrative engine.
  - Cleaned `shield_context` references from [`src/intelligence/kernel.js`](src/intelligence/kernel.js).

### B. `SINO_LOGIC` Legacy Purge
- **Finding**: An old regex filter `[\u4e00-\u9fa5]` in `validate_and_repair_response()` stripped Chinese characters and logged `"SINO_LOGIC bleed intercepted"` (a remnant from early open-source models).
- **Action Taken**:
  - Removed all Chinese parsing and violation flags from [`src/intelligence/kernel.js`](src/intelligence/kernel.js).
  - Preserved `<think>` tag repair logic.
  - Updated validation test cases in [`src/intelligence/kernel.test.js`](src/intelligence/kernel.test.js).
- **Validation**: Full test suite (`npm run test:unit`) passes with **100% green status (47 test files, 697 tests passing, 0 errors)**.

---

## ⚙️ 3. Findings: The Engine Mechanics (Every-Round vs Conditional)

### The Macro-Round vs Micro-Turn Mental Model

```text
========================================================================================
  ONE ROUND (Macro-Cycle: Initiated when the User submits an action)
========================================================================================
  
  ┌─ 1. System Turn (Director — Foreground Shot 1)
  │  • Resolves speaker delegation (AI, NPC, or Fractal scene narrator)
  │  • Picks somatic keywords from triggers.js & supplies actor direction
  │  • Applies dynamics adjustments and stage spotlight entries/exits
  │
  ├─ 2. Character Turn (Speaker — Foreground Shot 2)
  │  • Injects <SOMATIC_DIRECTIVES> & <DYNAMICS_SIGNALS>
  │  • Streams in-character prose via typewriter into the active feed bubble
  │  • Triggers audio notification chime 🔔 upon completion
  │
  └─ 3. User Turn & Background Maintenance (Post-Stream)
     • Unlocks composer input for the player
     • (Asynchronously in background): Memory Forge worker & image ghost sweeps
========================================================================================
```

### Turn Trigger Matrix

| Subsystem | Frequency / Timing | Trigger Condition | Visibility to User | Purpose |
| :--- | :--- | :--- | :--- | :--- |
| **Chrono Lock & Stasis** | Every Round (Pre-Gen) | User clicks Send / Continue | Full (Composer locks, status changes) | Prevents race conditions & double submits. |
| **Context Hydration & RAG** | Every Round (Pre-Gen) | Automatic | Hidden | Fetches log, computes Transformers.js embeddings. |
| **Director Turn (Shot 1)** | Every Round (Foreground) | Automatic | Partial (Thinking avatar/badge) | Picks speaker, somatic tells, dynamics shifts. |
| **Character Turn (Shot 2)** | Every Round (Foreground) | Automatic post-Director | Full (Live typewriter stream) | Delivers in-character dialogue & narrative. |
| **Memory Forge (LLM)** | Conditional (Post-Stream) | $\ge 8$ unconsolidated messages | Partial (`MEMORY_FORMATION` databox) | Compresses story slice into permanent memory vectors. |
| **Image Trigger Gate** | Conditional (Post-Director) | Extreme physics or Director intent (Cooldown: 3) | Full (Image card rendered in feed) | Spawns visual beats for dramatic moments. |
| **Auto-Epilogue** | Conditional (End of Arc) | Director declares `CONCLUDED` / `COLLAPSED` | Full (Epilogue card & status badge) | Concludes the story arc cleanly without manual click. |
| **NPC Genesis & Promotions** | Conditional (As needed) | Director emits `genesis` or `promotions` | Partial (Roster expansion & badge updates) | Adds new living characters to world cast. |

---

## 🚀 4. Proposed Plans & Architecture Roadmap

### Plan 1: The "Fast Director" (Preserving Somatic Prompt Causality)
- **Rationale**: We must **NOT** move dynamics and somatic cues to the post-generation background, because the Speaker prompt *depends* on [`src/data/definitions/triggers.js`](src/data/definitions/triggers.js) and somatic tells to write convincing, emotionally grounded dialogue.
- **The Blueprint**:
  - Keep the **Foreground Director** extremely tight and fast (~300ms): only output speaker delegation, 1-2 somatic keywords from `triggers.js`, 1-line direction, and dynamics deltas.
  - Move heavy world-state ledger tasks (relational graph writes, NPC promotion persistence, chapter milestone checks) to the **Deep Background Worker**.

### Plan 2: Rolling Round-Robin Single-Entity Memory Forging
- **Rationale**: Moving away from the rigid "8-message batch that consolidates all entities simultaneously."
- **The Blueprint**:
  - Each round, the background worker consolidates **one specific entity** in sequence (Round 1: AI $\rightarrow$ Round 2: User $\rightarrow$ Round 3: Fractal $\rightarrow$ Round 4: NPC $\rightarrow$ repeat).
  - **Benefits**: Focused, single-entity LLM prompts with zero hallucination overlap; continuous rolling memory formation every turn without UI hiccups.

### Plan 3: Decoupled Image Trigger Cooldowns
- **Rationale**: Avoid blocking cinematic Director moments just because an emotional slider crossed a threshold.
- **The Blueprint**:
  - Separate cooldowns for **Director Explicit Beats** (2-round cooldown) vs **Physical Appearance / State Changes** (3-round cooldown).
  - Enforce a strict **Max 1 auto-image per round** ceiling.

### Plan 4: UI / UX Harmonization (From `scribbles.md`)
1. **System Telemetry Databox Redesign**:
   - Rework the collapsible telemetry message into clean, entity-specific databoxes (matching the refined Memory Forge aesthetic).
2. **Turn Generation Choreography**:
   - User hits enter $\rightarrow$ Director thinking shimmer $\rightarrow$ Selected speaker portrait pops up in left column with thinking animation $\rightarrow$ Chat bubble spawns with typewriter streaming $\rightarrow$ Audio cue on completion.
3. **Active Story Guard & Ghost Sweeper UI**:
   - Add an alert/modal when attempting to start a story while one is already active.
   - Replace automatic deletion of timed-out images with interactive `"Retry / Dismiss"` actions.

---
