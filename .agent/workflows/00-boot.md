---
description: Fresh Session Initialization. Syncs context, validates integrity, and prepares for work.
---

# WORKFLOW: 00-boot (The Ignition & Intake)

> **Goal:** Synchronize the Agent's mental model with reality at the start of a new session before any code is touched, and parse the autonomous loop baton.

## 1. Triggers

- **Session Start**: "Hello", "Wake up", "Status check", "Vibe check".
- **Autonomous Chain**: Agent spawned by an external script or continuous loop.
- **Slash Command**: `/00-boot`

## 2. Brain (Context Injection)

- **The Master Baton [CRITICAL]**: `STATE.md` (The absolute source of immediate truth and architectural history).
- **The Execution Baton [CRITICAL]**: `next-prompt.md` (The immediate active payload in the continuous loop).
- **Config**: `.agent/config.yaml`
- **Tracks**: `.agent/tracks.md`
- **Rules**: `.agent/rules/07-svelte-supremacy.md` and `.agent/rules/06-styling-regime.md`
- **Physics**: `.agent/knowledge/atlas/07-physics.md`

## 3. Procedures

### Phase 1: Context Synchronization (The Intake)

1. **Read The Master Baton**: You MUST read `STATE.md` immediately. This defines the exact current reality of the UI, active Svelte 5 paradigms, and any broken WIP code you should avoid.
2. **Read The Execution Baton**: You MUST read `next-prompt.md` to discover your immediate objective in the swarm loop.
3. **Load Config & Tracks**: Establish operational parameters from `config.yaml` and locate any active `[/]` task in `tracks.md`.
4. **Refresh Mandates**: Reload the Chalk Regime and Svelte 5 Supremacy rules into active memory.

### Phase 2: Integrity Check

1. **Sanction Scan**: Check for `[PENANCE]` or `[RESTRICTION]` tags in history.
2. **Secret Scan**: Ensure no `.env` exposure.
3. **State Verification**:
    - Cross-reference `STATE.md` with `next-prompt.md` and `.agent/tracks.md`.
    - If they align, system is **Resonant**.
    - If there is a mismatch (e.g., `next-prompt.md` is asking for a feature that `STATE.md` says is already completed), halt and trigger a **Status Report** to the Director.

### Phase 3: Action Selection

- **Scenario A (Active Payload Detected)**: `next-prompt.md` contains a clear directive.
    - **Action**: Acknowledge the payload. State "Boot sequence complete. Active payload acquired." Immediately transition into execution or `/10-vibe-intake`. Do NOT wait for the Director's permission to begin working on the payload.
- **Scenario B (Empty/Stalled Baton)**: `next-prompt.md` is empty or says "awaiting seed".
    - **Action**: State "Boot sequence complete. Swarm loop is idle." Await the Director's "vibe" prompt or proactively suggest the highest priority item from the `STATE.md` backlog to restart the loop.

## 4. Anti-Patterns

- **Amnesia**: Attempting to write Svelte code or formulate a plan without reading `STATE.md` and `next-prompt.md` first.
- **Hesitation**: Asking "What should I do next?" when `next-prompt.md` clearly dictates the next action.
- **Hallucinating Context**: Guessing the state of the Perchance bundle instead of reading the active memory files.
- **Ignoring Sanctions**: Acting while restricted.

## 5. Tools

- `read_file` (To read `STATE.md`, `next-prompt.md`, Config, and Rules)
- `list_dir` (To verify structure)
