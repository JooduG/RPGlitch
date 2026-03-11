---
description: Resume interrupted work. Pick up exactly where left off.
---

# 06-continue (The Resume & The Handoff)

> **Goal:** Pick up where you left off, finish the active task, and rigorously update the State Baton before concluding the session.

## 1. Triggers

- **Resume**: "Continue", "Next", "Resume <task>".
- **Context Loss**: "Where were we?", "I am lost".
- **Slash Command**: `/06-continue`

## 2. Brain (Context Injection)

- **The Baton [CRITICAL]**: `STATE.md` (Read to sync reality, Write to pass the baton).
- **Chat History**: Recent conversation logs (Immediate Context).
- **Tracks**: `.agent/tasks/tracks.md`.
- **Active Task**: Located via `tracks.md` -> `plan.md`.

## 3. Procedures

### Phase 1: Context Re-Acquisition (Picking up the Baton)

1. **Read The Baton**: Read `STATE.md` to anchor your mental model to the actual, current reality of the codebase and UI.
2. **Chat History**: Read the recent message history to identify the exact interruption point and the Director's immediate intent.
3. **Read Tracks**: Confirm the active `[/]` task in `tracks.md`.
4. **Locate Plan**: Read the `plan.md` associated with the active task.
5. **Read Task Artifact**: Read the `.gemini/antigravity/brain/<id>/task.md` (Session Task) if available.

### Phase 2: Momentum Restoration

1. **Identify Last Action**: Check the last checked item `[x]` in `task.md` or `plan.md`.
2. **Identify Next Action**: Find the first unchecked item `[ ]` or `[/]`.
3. **Verify State**: Fast-check the relevant `.svelte` or `.js` files to ensure their actual code matches the "Last Action" state.

### Phase 3: Execution Resume

- **Action**: Explicitly state: "Resuming [Task Name]. Last action was [Action]. Next step is [Step]."
- **Command**: Execute the next step immediately.

### Phase 4: The Handoff (Session Conclusion)

_Triggered when the final step in `plan.md` is completed._

1. **Update The Map**: Mark the task as complete `[x]` in `plan.md` and `tracks.md`.
2. **Overwrite The Baton**: You MUST update `STATE.md` before stopping.
    - Update **Section 4 (Recent Changes)** with a concise bullet point of what you just built.
    - Update **Section 5 (Active WIP & Known Quirks)** to remove the quirk you fixed, or add new `#TODO-AI` anomalies you discovered but didn't fix.
    - If you changed Svelte paradigms or visual rules, update Sections 2 and 3 to reflect the new reality.
3. **Clock Out**: Explicitly inform the Director that the task is complete and the Baton has been successfully passed.

## 4. Anti-Patterns

- **Dropping the Baton**: Concluding a task or ending a session WITHOUT writing your changes into `STATE.md`.
- **Starting Over**: Do not re-plan if a valid `plan.md` already exists.
- **Asking "What now?"**: The plan dictates the next step. Execute it.
- **Ignoring the Plan**: Do not deviate from `plan.md` unless the Director explicitly commands a pivot.

## 5. Tools

- `view_file` / `read_file` (Read Plan/Task/STATE)
- `write_file` / `replace_in_file` (Overwrite STATE.md)
- `task_boundary` (Update Context)
