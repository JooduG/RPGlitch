---
name: boot
description: Fresh Session Initialization. Syncs context, mental model, and global state.
risk: low
source: AI
date_added: 2024-03-29
---

# [/boot](./boot.md) - Fresh Session Initialization & State Sync

## Objectives: Initialization

- Objective: Synchronize the Agent's mental model with the current repository state.
- Objective: Ground the reasoning in the project-management shards.

## Context-Injection: Core Context

- [Foundation](../rules/01-foundation.md) Rule
- [Intelligence](../rules/05-intelligence.md) Rule
- [Master Dispatcher](../skills/using-agent-skills/SKILL.md)
- [Todo](../../tasks/todo.md)
- [Plan](../../tasks/plan.md)

## Capabilities: Boot Sequence

- **New Session**: Start of a conversation.
- **Wake Up**: "Hello", "Status check".
- **Slash Command**: [/boot](./boot.md)

## Procedure

### Phase 0: Router Load (Skill Activation)

1. **Dispatcher Load**: Read the [[Master Dispatcher]](../skills/using-agent-skills/SKILL.md). This activates the skill routing map, complexity triage table, and behavioral laws for the session. Signal: "Skill Router loaded. Behavioral laws active."

### Phase 1: Context Mastery (The Awakening)

1. **Mission Reconciler**: Reconcile the Mission Board and Log Book with the current repository state. Recover global architectural context from Pinecone via the [[Data]](../skills/data/SKILL.md) skill.
2. **Registry Sync**: Identify any active track `[/]` or pending tasks `[ ]`. Update the Skill Log in `tasks/todo.md`.

### Phase 2: Quality Gate (The Resonance)

1. **System Audit**: Verify project health and security invariants. This skill internally checks the "Permanent Record" for known vulnerabilities or overrides. [[Invoke: security-and-hardening]](../skills/security-and-hardening/SKILL.md)
2. **Report**: Signal the mission status and target environment. "Boot complete. Resonant with Global State."

## Anti-Patterns

- **Blind Boot**: Starting work without reading the Mission Board.
- **Amnesia**: Failing to parse the historical context in the log.
- **Path Drift**: Using absolute drive letters instead of relative `.agents/` paths.
