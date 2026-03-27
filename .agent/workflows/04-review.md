---
description: Reviews and stuff.
---

# [/04-review](./04-review.md) - The Vault & The Handoff

> **Goal:** Final quality audit, test validation, and mandatory session paperwork.

## 1. Triggers

- **Command**: "Finish task", "Ready for review", "Clock out".
- **Refactor Complete**: Moving from Build to Review.
- **Slash Command**: [/04-review](./04-review.md)

## 2. Context Injection

- **Rules**: [Foundation](../rules/01-foundation.md).
- **Rules**: [Compliance](../rules/06-compliance.md).
- **State**: [Track Log](../project-management/track-log.md) (Mission Board).
- **State**: [Next](../project-management/next.md) (Task Sync).

## 3. Procedures

### Phase 1: The Clarity Gate

1. **Analysis**: Verify implementation against the original Blueprint and Success Criteria. [[Invoke: Warden]](../skills/warden/SKILL.md)
2. **Standard Check**: Ensure code adheres strictly to **Svelte 5 Runes** and **Chalk Regime** styling. No Svelte 4 patterns or hex codes permitted. [[Invoke: Svelte]](../skills/svelte/SKILL.md)
3. **Validation**: Run internal test scripts (`npm run test` or `npm run verify`) to prove the logic holds weight before committing.

### Phase 2: Maintenance & Archival

1. **Archival**: If complete, move the track shards to [Archive](../archive/). [[Invoke: Agent Forge]](../skills/cognition/SKILL.md)
2. **Triage**: Sort incoming issues and seed the next [/01-blueprint](./01-blueprint.md) cycle. [[Invoke: Project Manager]](../skills/project-manager/SKILL.md)

### Phase 3: The Handoff Law

_You are strictly forbidden from clocking out without updating the state matrix. Never drop the baton. [[Invoke: intake]](../skills/intake/SKILL.md)_

1. **Update Tracks (Mission Board)**: Overwrite [Mission Board](../project-management/mission-board.md) with a bulleted payload of completed tasks for this session. Append a summary of the session's deltas to [Track Log](../project-management/track-log.md).
2. **Sync Backlog**: Move completed items from WIP to DONE in [Next](../project-management/next.md). Crucially, update this file with any **newly generated `#TODO-AI:` tags** discovered during the session.
3. **Pass the Baton**: Stage instructions in [Next](../project-management/next.md) with high-context instructions so the next agent knows exactly where to begin.

## 4. Anti-Patterns

- **The Dropped Baton**: Terminating a session without executing Phase 3 (Paperwork).
- **Silent Done**: Marking tasks complete without providing an audit report or terminal evidence (passing tests).
- **Fragmented Board**: Leaving stale or abandoned tracks on the mission board.
- **Logic Leak**: Committing untested edge cases or legacy reactivity to the Vault.
