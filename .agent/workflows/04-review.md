---
description: Reviews and stuff.
---

# [/04-review](./04-review.md) - The Vault

> **Goal:** Final quality audit, test validation, and mandatory session paperwork (AGENTS.md Step 8).

## 1. Triggers

- **Command**: "Finish task", "Ready for review", "Clock out".
- **Refactor Complete**: Moving from Build to Review.
- **Slash Command**: [/04-review](./04-review.md)

## 2. Context Injection

- **Rules**: [Foundation](../rules/01-foundation.md).
- **Rules**: [Compliance](../rules/06-compliance.md).
- **Rules**: [Intelligence](../rules/05-intelligence.md).
- **State**: [.agent/project-management/log.md](../project-management/log.md).
- **State**: [.agent/project-management/mission-board.md](../project-management/mission-board.md).
- **State**: [.agent/project-management/next.md](../project-management/next.md).

## 3. Procedures

### Phase 1: The Clarity Gate (Step 6-7)

1. **Analysis**: Verify implementation against the original plan and Success Criteria. [[Invoke: warden]](../skills/warden/SKILL.md)
2. **Standard Check**: Ensure code adheres strictly to **Svelte 5 Runes** and **Chalk Regime** styling. No Svelte 4 patterns or hex codes permitted. [[Invoke: svelte]](../skills/svelte/SKILL.md)
3. **Validation**: Run internal test scripts (`npm run verify`) to prove the logic holds weight before committing.

### Phase 2: Maintenance & Archival

1. **Archival**: If complete, move the track shards to `.agent/project-management/archive/`. [[Invoke: directives]](../skills/directives/SKILL.md)
2. **Triage**: Sort incoming issues and seed the next [/01-plan](./01-plan.md) cycle. [[Invoke: project-manager]](../skills/project-manager/SKILL.md)

### Phase 3: The Handoff Law (Step 8.2)

1. **Update Tracks**: Overwrite [Mission Board](../project-management/mission-board.md) with a bulleted payload of completed tasks for this session. Append a summary of the session's deltas to [log](../project-management/log.md).
2. **Sync Backlog**: Move completed items from WIP to DONE in [Next](../project-management/next.md). Update this file with any **newly generated `TODO-AI:` tags**.
3. **Pass the Baton**: Stage instructions in `next.md` with high-context instructions so the next agent knows exactly where to begin. [[Invoke: intake]](../skills/intake/SKILL.md)

## 4. Anti-Patterns

- **The Dropped Baton**: Terminating a session without executing Phase 3 (Paperwork).
- **Silent Done**: Marking tasks complete without providing an audit report or terminal evidence.
- **Logic Leak**: Committing untested edge cases or legacy reactivity.

### 🕹️ Operational Heartbeat

- **🤖 AGENTS.md**: Step 8.2 (The Close-out - Vault secured)
- **📜 Rules**: Rule 01 (Foundation), Rule 05 (Intelligence)
- **🧠 Capabilities**: project-manager (Paperwork), intake (The Handoff)
- **💾 State**: .agent/project-management/next.md
