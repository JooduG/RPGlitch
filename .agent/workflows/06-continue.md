---
description: Resume interrupted work. Pick up exactly where left off.
disable-model-invocation: true
---

# 06-continue (The Resume)

> **Goal:** Something interrupted you. Please pick up where you left off and finish what you started.

## 1. Triggers

- **Resume**: "Continue", "Next", "Resume <task>".
- **Context Loss**: "Where were we?", "I am lost".
- **Slash Command**: `/06-continue`

## 2. Brain (Context Injection)

- **Chat History**: Recent conversation logs (Immediate Context).
- **Tracks**: `.agent/tasks/tracks.md` (Read Only).
- **Active Task**: Located via `tracks.md` -> `plan.md`.

## 3. Procedures

### Phase 1: Context Re-Acquisition

1.  **Chat History**: Read the recent message history to identify the interruption point and immediate intent.
2.  **Read Tracks**: Confirm the active `[/]` task.
3.  **Locate Plan**: Read the `plan.md` associated with the active task.
4.  **Read Task Artifact**: Read the `.gemini/antigravity/brain/<id>/task.md` (Session Task) if available, or the project `task.md`.

### Phase 2: Momentum Restoration

1.  **Identify Last Action**: Check the last checked item `[x]` in `task.md`.
2.  **Identify Next Action**: Find the first unchecked item `[ ]` or `[/]`.
3.  **Verify State**: fast-check relevant files to ensure they match the "Last Action" state.

### Phase 3: Execution Resume

- **Action**: Explicitly state: "Resuming [Task Name]. Last action was [Action]. Next step is [Step]."
- **Command**: Execute the next step immediately.

## 4. Anti-Patterns

- **Starting Over**: Do not re-plan if a plan exists.
- **Asking "What now?"**: The plan Dictates the next step.
- **Ignoring the Plan**: Do not deviate from `plan.md`.

## 5. Tools

- `view_file` (Read Plan/Task)
- `task_boundary` (Update Context)
