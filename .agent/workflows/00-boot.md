---
description: Fresh Session Initialization. Syncs context, validates integrity, and prepares for work.
disable-model-invocation: true
---

# 00-boot (The Ignition)

> **Goal:** Synchronize the Agent's mental model with reality at the start of a new session.

## 1. Triggers

- **Session Start**: "Hello", "Wake up", "Status check".
- **Slash Command**: `/00-boot`

## 2. Brain (Context Injection)

- **Config**: `.agent/config.yaml`
- **Vision**: `.agent/knowledge/atlas/01-vision.md`
- **Tracks**: `.agent/tasks/tracks.md`
- **Rules**: `.agent/rules/02-workflow.md`
- **Stack**: `.agent/rules/03-physics.md`

## 3. Procedures

### Phase 1: Context Synchronization

1.  **Load Config**: Establish operational parameters.
2.  **Read Tracks**: Identify the active `[/]` task in `tracks.md`.
3.  **Read Rules**: Refresh memory on `03-physics.md` and `01-governance.md` constraints.

### Phase 2: Integrity Check

1.  **Sanction Scan**: Check for `[PENANCE]` or `[RESTRICTION]` tags in history.
2.  **Secret Scan**: Ensure no `.env` exposure.
3.  **State Verification**:
    - If `tracks.md` matches `git status`, system is **Resonant**.
    - If mismatch, trigger **Status Report**.

### Phase 3: Action Selection

- **Scenario A (Clean Start)**: No active task.
    - **Action**: Suggest next item from `tracks.md` or await user input.
- **Scenario B (In Progress)**: Active task `[/]`.
    - **Action**: State "Active Task Detected: [Task Name]" and ask if user wants to `/11-continue`.

## 4. Anti-Patterns

- **Hallucinating Context**: Guessing the state instead of reading `tracks.md`.
- **Ignoring Sanctions**: Acting while restricted.

## 5. Tools

- `view_file` (Read Config/Rules)
- `list_dir` (Verify Structure)
