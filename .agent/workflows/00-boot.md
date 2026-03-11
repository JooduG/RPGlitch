---
description: Fresh Session Initialization. Syncs context, validates integrity, and prepares for work.
---

# 00-boot (The Ignition)

> **Goal:** Synchronize the Agent's mental model with reality at the start of a new session before any code is touched or planned.

## 1. Triggers

- **Session Start**: "Hello", "Wake up", "Status check", "Vibe check".
- **Slash Command**: `/00-boot`

## 2. Brain (Context Injection)

- **The Baton [CRITICAL]**: `STATE.md` (The absolute source of immediate truth)
- **Config**: `.agent/config.yaml`
- **Vision**: `.agent/knowledge/atlas/01-vision.md`
- **Tracks**: `.agent/tasks/tracks.md`
- **Rules**: `.agent/rules/02-workflow.md`
- **Stack**: `.agent/rules/03-physics.md`

## 3. Procedures

### Phase 1: Context Synchronization (The Intake)

1. **Read The Baton**: You MUST read `STATE.md` immediately. This defines the exact current reality of the UI, active Svelte 5 paradigms, and any broken WIP code you should avoid.
2. **Load Config**: Establish operational parameters from `.agent/config.yaml`.
3. **Read Tracks**: Identify the active `[/]` task in `tracks.md`.
4. **Read Rules**: Refresh memory on `03-physics.md` and `01-governance.md` constraints.

### Phase 2: Integrity Check

1. **Sanction Scan**: Check for `[PENANCE]` or `[RESTRICTION]` tags in history.
2. **Secret Scan**: Ensure no `.env` exposure.
3. **State Verification**:
    - Cross-reference `STATE.md` with `tracks.md`.
    - If they align with `git status`, system is **Resonant**.
    - If there is a mismatch (e.g., `STATE.md` says a feature is WIP but `tracks.md` says it is done), trigger a **Status Report** to the Director.

### Phase 3: Action Selection

- **Scenario A (Clean Start)**: No active task in `tracks.md`.
    - **Action**: Await the Director's "vibe" prompt or suggest the next item from the backlog. Do NOT start coding.
- **Scenario B (In Progress)**: Active task `[/]` detected.
    - **Action**: State "Active Task Detected: [Task Name]" and explicitly ask if the Director wants to run `/01-plan` to map out the next steps, or `/06-continue` to resume previous execution.

## 4. Anti-Patterns

- **Ignoring the Baton**: Attempting to write Svelte code or formulate a plan without reading `STATE.md` first.
- **Hallucinating Context**: Guessing the state of the Perchance bundle instead of reading the active memory files.
- **Ignoring Sanctions**: Acting while restricted.

## 5. Tools

- `view_file` / `read_file` (To read `STATE.md`, Config, and Rules)
- `list_dir` (To verify structure)
