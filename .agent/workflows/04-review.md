---
description: The Quality Gate. Audits work and commits to the permanent record.
---

# 04-review (The Vault)

> **Goal:** Audit, Checkpoint, and Secure. The "Save Game" slot.

## 1. Triggers

- **Feature Complete**: "I'm done", "It works".
- **Major Milestone**: Before a risky change.
- **Slash Command**: `/04-review`

## 2. Brain (Context Injection)

- **Tracks**: `.agent/tasks/tracks.md`
- **Plan**: `.agent/tasks/<slug>/plan.md`
- **Diff**: `git status` / `git diff`

## 3. Procedures

### Phase 1: The Audit (Review)

1.  **Hygiene Check**: Run `/03-clean` (Phase 3).
2.  **Test Check**: Are generic tests passing?
3.  **Manual Check**: Did we verify the UI?

### Phase 2: The Commit (Checkpoint)

1.  **Stage**: `git add .`
2.  **Commit**: `gamemaster(checkpoint): <Track> - <Summary>`.
3.  **Note**: `git notes add -m "<detailed_summary>"`.

### Phase 3: The Registry (Update)

1.  **Update Plan**: Mark items `[x] [checkpoint: <sha>]`.
2.  **Update Tracks**: Update global status in `tracks.md`. **Mandatory**: Use the "Track Block" format.
3.  **Archive**: If track is 100% done:
    - Move folder to `.agent/archive/<slug>`.
    - Mark `[x]` in `tracks.md`.

## 4. Anti-Patterns

- **Ghost Commits**: Committing without updating the Plan.
- **Broken Saves**: Committing code that doesn't compile.
- **Vague Messages**: "WIP". Use descriptive summaries.

## 5. Tools

- `run_command` (git)
- `write_to_file` (update markdown)
- `waldzell-metacognitive-monitoring` (Audit)
