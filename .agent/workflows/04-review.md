---
description: Reviews and stuff.
---

# 04-review (The Vault & The Handoff)

> **Goal:** Final quality audit, test validation, and mandatory session paperwork.

## 1. Triggers

- **Command**: "Finish task", "Ready for review", "Clock out".
- **Refactor Complete**: Moving from Build to Review.
- **Slash Command**: [/04-review](./04-review.md)

## 2. Brain (Context Injection)

- **Rules**: [.agent/rules/01-foundation.md](../rules/01-foundation.md).
- **Rules**: [.agent/rules/05-compliance.md](../rules/05-compliance.md).
- **State**: [.agent/state/tracks.md](../state/tracks.md) (Mission Board).
- **State**: [.agent/state/backlog.md](../state/backlog.md) (Task Sync).

## 3. Procedures

### Phase 1: The Clarity Gate (Audit)

1. **Analysis**: Verify implementation against the original Blueprint and Success Criteria. [[Invoke: warden]](../skills/warden/SKILL.md)
2. **Standard Check**: Ensure code adheres strictly to **Svelte 5 Runes** and **Chalk Regime** styling. No Svelte 4 patterns or hex codes permitted. [[Invoke: svelte]](../skills/svelte/SKILL.md)
3. **Validation**: Run internal test scripts (`npm run test` or `npm run verify`) to prove the logic holds weight before committing.

### Phase 2: Maintenance & Archival

1. **Archival**: If complete, move the track shards to [.agent/archive/](../archive/). [[Invoke: agent-forge]](../skills/agent-forge/SKILL.md)
2. **Triage**: Sort incoming issues and seed the next `/01-plan` cycle. [[Invoke: methodology]](../skills/methodology/SKILL.md)

### Phase 3: The Handoff Law (Anti-Amnesia Protocol)

_You are strictly forbidden from clocking out without updating the state matrix. Never drop the baton._

1. **Update Tracks (Global)**: Overwrite `.agent/state/global.md` with a bulleted payload of completed tasks for this session. Append a summary of the session's deltas to `.agent/state/tracks.md`.
2. **Sync Backlog**: Move completed items from WIP to DONE in `.agent/state/backlog.md`. Crucially, update this file with any **newly generated `#TODO-AI:` tags** discovered during the session.
3. **Pass the Baton**: Stage the next logical task or prompt in `.agent/state/next-prompt.md` with high-context instructions so the next agent knows exactly where to begin.

## 4. Anti-Patterns

- **The Dropped Baton**: Terminating a session without executing Phase 3 (Paperwork).
- **Silent Done**: Marking tasks complete without providing an audit report or terminal evidence (passing tests).
- **Fragmented Board**: Leaving stale or abandoned tracks on the mission board.
- **Logic Leak**: Committing untested edge cases or legacy reactivity to the Vault.
