---
description: Formal process to anchor progress and update project tracking.
---

# 04-checkpoint (The Anchor)

> **Goal:** Securely commit work-in-progress and update the navigational charts.

## 1. Triggers

- **Phase Complete**: "Finished skeleton", "UI structure ready".
- **Handoff**: "Switching tasks", "Taking a break".
- **Slash Command**: `/04-checkpoint`

## 2. Brain (Context Injection)

- **Tracks**: `.agent/tasks/tracks.md`
- **Plan**: `.agent/tasks/<slug>/plan.md`
- **Roadmap**: `.agent/roadmap.md`

## 3. Capabilities

- **Builder**: Staging, Committing.
- **Auditor**: Updating Plan Status.

## 4. Procedures

### Phase 1: Pre-Flight Check (Auditor)

1.  **Test**: Ensure no critical errors exist (unless saving broken state explicitly).
2.  **Lint**: Run `07-hygiene.md` (optional quick scan).
3.  **Diff**: Review `git status` to ensure no unintended files are included.

### Phase 2: The Anchor (Builder)

1.  **Stage**: `git add <files>` (or `.` if clean).
2.  **Commit**:
    - Format: `chore(checkpoint): [Track Name] - [Phase Summary]`
    - Example: `chore(checkpoint): User Auth - Skeleton Complete`
3.  **Notes**:
    - If complex, add details to the commit body.

### Phase 3: The Registry (Architect)

1.  **Update Plan**:
    - Open active `plan.md`.
    - Mark current phase generic task item as `[x]`.
    - Append `[checkpoint: <git-short-hash>]` if useful.
2.  **Update Tracks**:
    - Update status in `.agent/tasks/tracks.md`.
    - If track is 100% complete, move to "Done" section or mark `[x]`.

## 5. Anti-Patterns

- **Broken Builds**: Committing code that crashes the build without a `[broken]` tag.
- **Ghost Commits**: Committing without updating the `plan.md`.
- **Megacommit**: Saving an entire week's work in one go.

## 6. Tools

- `run_command` (git)
- `write_to_file` (update markdown)
