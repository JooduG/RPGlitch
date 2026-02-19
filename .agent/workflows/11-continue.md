---
trigger: manual
description: Resume execution of the active plan or interrupted task.
---

# 11-continue (The Resonance)

> **Goal:** Restore momentum to the active track.

## 1. Triggers

- "Continue"
- "Proceed"
- "Go ahead"
- "Resume"
- "Fix it" (Context dependent)
- Slash Command: `/11-continue`

## 2. Procedures

### Phase 1: State Reconstruction

1.  **Read Tracks**: Review `task.md` to identify the `[/]` (In Progress) item.
2.  **Check Plans**: Look for `implementation_plan.md` in the current context.
    - If `Plan` exists and is `[Approved]`: **EXECUTE**.
    - If `Plan` exists and is `[Pending]`: **ASSUME APPROVAL** (since user said "Proceed") and **EXECUTE**.
3.  **Analyze History**: Briefly review the last turn's tool output.
    - **Error Detected?** -> Apply fix logic (Reflex Mode).
    - **Success Detected?** -> Execute next logical step (Cortex Mode).

### Phase 2: Engagement

1.  **Action**: Call the next logical tool in the sequence.
2.  **Constraint**: Do NOT ask for permission if the user has already said "Continue".
3.  **Output**: "Resuming [Task Name]..."

## 3. Anti-Patterns

- Asking "What should I do?" when a plan exists.
- Restarting a task from scratch instead of resuming.
- Stopping to summarize history instead of acting.
