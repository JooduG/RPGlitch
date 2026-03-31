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

### Phase 1: Context Mastery (The Awakening)

1. **Mission Reconciler**: Reconcile the Mission Board and Log Book with the current repository state. This skill now internally recovers global architectural context from Pinecone. [[Invoke: orchestration-tactics]](../skills/orchestration-tactics/SKILL.md)
2. **Registry Sync**: Identifies any active track `[/]` or pending tasks `[ ]`.

### Phase 2: Quality Gate (The Resonance)

1. **System Audit**: Verify project health and security invariants. This skill internally checks the "Permanent Record" for known vulnerabilities or overrides. [[Invoke: warden]](../skills/warden/SKILL.md)
2. **Report**: Signal the mission status and target environment. "Boot complete. Resonant with Global State."

## Anti-Patterns

- **Blind Boot**: Starting work without reading the Mission Board.
- **Amnesia**: Failing to parse the historical context in the log.
- **Path Drift**: Using absolute drive letters instead of relative `.agent/` paths.
