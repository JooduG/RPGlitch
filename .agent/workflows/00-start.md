---
description: Universal entry point. Initializes context, validates integrity, and resumes momentum.
---

# 00-start (The Ignition)

> **Goal:** Synchronize the Agent's mental model with reality and resume the Red Thread.

## 1. Triggers

- **Session Start**: "Hello", "Wake up", "Status check".
- **Resume**: "Continue", "Next", "Resume <task>".
- **Context Loss**: "Where were we?", "I am lost".
- **Slash Command**: `/00-start`

## 2. Brain (Context Injection)

- **Config**: `.agent/config.yaml`
- **Vision**: `.agent/knowledge/atlas/01-vision.md`
- **Tracks**: `.agent/tasks/tracks.md`
- **Rules**: `.agent/rules/02-workflow.md`

## 3. Procedures

### Phase 1: Context Synchronization

1.  **Load Config**: Establish operational parameters.
2.  **Read Tracks**: Identify the active `[/]` task in `tracks.md`.
3.  **Read Rules**: Refresh memory on `03-physics.md` constraint.

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
    - **Action**: Locate `plan.md`.
    - **Resume**: "Resuming [Task Name]... Executing next step."

## 4. Anti-Patterns

- **Hallucinating Context**: Guessing the state instead of reading `tracks.md`.
- **Ignoring Sanctions**: Acting while restricted.
- **Asking "What now?"**: When a plan already exists.

## 5. Tools

- `view_file` (Read Config/Rules)
- `list_dir` (Verify Structure)
