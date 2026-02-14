---
description: Formal process to anchor progress and update project tracking.
---

# 05-checkpoint (The Anchor)

> **Goal:** Securely commit work-in-progress and update the navigational charts.

## 1. Triggers

- **Phase Complete**: "Finished skeleton", "UI structure ready".
- **Handoff**: "Switching tasks", "Taking a break".
- **Slash Command**: `/05-checkpoint`

## 2. Brain (Context Injection)

- **Tracks**: `.agent/tasks/tracks.md`
- **Plan**: `.agent/tasks/<slug>/plan.md`

## 3. Procedures

### Phase 1: Pre-Flight Check

1. **Test**: Ensure no critical errors exist (unless saving broken state explicitly).
2. **Lint**: Run `08-hygiene` quick scan (optional).
3. **Diff**: Review `git status` to ensure no unintended files are included.

### Phase 2: The Anchor

1. **Stage**: `git add <files>` (or `.` if clean).
2. **Commit**: `gamemaster(checkpoint): [Track Name] - [Phase Summary]`.
3. **Git Note**: Attach a task summary to the commit.
    - `git notes add -m "<summary>" <sha>`
    - Include: task name, changes summary, files modified.

### Phase 3: The Registry

1. **Update Plan**:
    - Mark current phase item as `[x]`.
    - Append `[checkpoint: <git-short-sha>]`.
2. **Update Tracks**:
    - Update status in `.agent/tasks/tracks.md`.
    - If track is 100% complete, move to "Done" section or mark `[x]`.
3. **Commit Plan**: `gamemaster(plan): Mark phase '<name>' as complete`.

## 4. Anti-Patterns

- **Broken Builds**: Committing code that crashes the build without a `[broken]` tag.
- **Ghost Commits**: Committing without updating the `plan.md`.
- **Megacommit**: Saving an entire week's work in one go.

## 5. Tools

- `run_command` (git)
- `write_to_file` (update markdown)
