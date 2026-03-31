---
name: 00-boot
description: Fresh Session Initialization. Syncs context, mental model, and global state.
risk: low
source: AI
date_added: 2024-03-29
---

# [/00-boot](./00-boot.md) - Fresh Session Initialization & State Sync

## Objectives: Initialization

- Objective: Synchronize the Agent's mental model with the current repository state.
- Objective: Ground the reasoning in the project-management shards.

## Context-Injection: Core Context

- [Foundation](../rules/01-foundation.md) Rule
- [Intelligence](../rules/05-intelligence.md) Rule
- [Log](../orchestration/operation-logs.md) Book
- [Mission Board](../orchestration/strategy-board.md)
- [Next](../orchestration/handover.md)

## Capabilities: Boot Sequence

- **New Session**: Start of a conversation.
- **Wake Up**: "Hello", "Status check".
- **Slash Command**: [/00-boot](./00-boot.md)

## Procedure

### Phase 1: The Clarity Gate (Step 1: Dependencies)

1. **Intake**: Read [Mission Board](../orchestration/strategy-board.md), [log](../orchestration/operation-logs.md), and [Next](../orchestration/handover.md). Ensure intent matches the current mission. [[Invoke: intake]](../skills/intake/SKILL.md)
2. **Environment Verification**: Explicitly acknowledge the target environment (Perchance sandboxed runtime) and reactivity standard (Svelte 5 Runes).
3. **State Sync**: Use [sync.js](../skills/orchestration-tactics/scripts/sync.js) to reconcile the mission board and ignore layers. [[Invoke: orchestration-tactics]](../skills/orchestration-tactics/SKILL.md)

### Phase 2: Registry (Step 1.3: Prerequisites)

1. **Registry**: Identify any active track `[/]` or pending tasks `[ ]` in [log](../orchestration/operation-logs.md). If no active track exists, wait for user input or initiate [/01-plan](./01-plan.md). [[Invoke: orchestration-tactics]](../skills/orchestration-tactics/SKILL.md)

### Phase 3: The Quality Gate (Audit & Heartbeat)

1. **Audit**: Verify project health using Rule 06 (Compliance). Identify any immediate hygiene anomalies or security leaks. [[Invoke: warden]](../skills/warden/SKILL.md)
2. **Report**: State current mission, environment acknowledgment, and ready status. "Boot complete. Resonant with Global State."

## Anti-Patterns

- **Blind Boot**: Starting work without reading the Mission Board.
- **Amnesia**: Failing to parse the historical context in the log.
- **Path Drift**: Using absolute drive letters instead of relative `.agent/` paths.
