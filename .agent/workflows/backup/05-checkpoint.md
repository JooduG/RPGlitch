---
name: 05-checkpoint
description: Quality Gate & Triage. Audits work and organizes the next cycle.
---

# 05-checkpoint (The Vault)

> **Goal:** Verify phase completion and prepare the mission board for the next rotation.

## 1. Triggers
- **Track Complete**: All steps in `plan.md` marked `[x]`.
- **Milestone Reached**: Verification phase finished.
- **Slash Command**: `/05-checkpoint`

## 2. Brain (Context Injection)
- **Track Board**: `.agent/state/tracks.md`.
- **Active Plan**: `.agent/state/tracks/<slug>/<slug>.md`.

## 3. Procedures

### Phase 1: Quality Gate
1. **Review**: Audit all changes against Success Criteria.
2. **Baton Sync**: Update global status in `.agent/state/tracks.md`.
3. **Archive**: Move completed track files to `.agent/archive/state/tracks/`.

### Phase 2: Issue Triage
1. **Backlog**: Scan GitHub issues or the next items in `tracks.md`.
2. **Prioritization**: Categorize by `severity` and `impact`.

### Phase 3: Selection
1. **Pick**: Select the next high-leverage task.
2. **Seed**: Prompt user for "Proceed" on the next GENESIS phase.

## 4. Anti-Patterns
- **Ghosting Tracks**: Leaving completed tracks marked as `[/]`.
- **Silent Done**: Closing a task without a walkthrough or proof-of-work.
- **Zombie Tasks**: Letting low-priority items clutter the mission board.
