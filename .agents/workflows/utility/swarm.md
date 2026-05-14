---
name: swarm
description: Manual Swarm Orchestration. The human-initiated interface for deploying specialized sub-agents.
risk: high
source: AI
date_added: 2024-03-31
---

# [/07-swarm](./swarm.md) - Manual Swarm Commander & Parallel Tasking

## Objectives: Parallel Multi-Agent Strategy

- Manage user-requested parallel missions with surgical precision.
- Coordinate the "Swarm" (the set of sub-agents) before technical dispatch.
- Ensure all parallel operations are grounded in the same architectural truth.

## Context-Injection: Swarm Command

- [Intelligence](../rules/05-intelligence.md): Lexicon & Registry.
- [SWARM](../skills/swarm/SKILL.md): The Tactical Execution Captain.
- [Data](../skills/data/SKILL.md): Memory Protocol grounding.

## Capabilities: Strategic Coordination

- **Decomposition**: Breaking complex features into independent, agent-slotable tasks.
- **Specialization**: Assigning the correct expert (Svelte, CSS, etc.) to each sub-agent.
- **Synthesis**: Merging and auditing collective output to ensure global resonance.

## Procedure

### Phase 1: Mission Kernel (The Brief)

1. **Intake**: Parse the user's parallel request. Confirm it meets the "Parallel Win" criteria (>20m or modular architecture).
2. **Context Recovery**: Retrieve the **Global Mission Kernel** from Pinecone. Ensure the shared architectural constraints are identified. [[Invoke: Data]](../skills/data/SKILL.md)

### Phase 2: Planning (The Blueprint)

1. **Agent Selection**: Map the task to specific file boundaries. Identify the specialized skill required for each boundary.
2. **Task Creation**: Generate the `issue_tasks.json` defining the sub-agents and their restricted ranges. Verify no file ownership conflicts exist.

### Phase 3: Tactical Dispatch (The Launch)

1. **Handoff**: Invoke the `swarm` captain or use `npm run swarm:dispatch` to spin up parallel Jules Cloud sessions. Jules will automatically handle the environment setup and task execution. [[Invoke: swarm]](../skills/swarm/SKILL.md)
2. **Monitoring**: Track the swarm's progress through the Log Book or the interactive Jules session streams in `swarm:plan`.

### Phase 4: Resonance Synthesis (The Merge)

1. **PR Consolidation**: Consolidate the output of all sub-agents using `npm run swarm:merge`. This scripts finds the task PRs, updates them, and performs the merge logic.
2. **The 80% Gate**: Ensure the swarm has performed its own internal audit via the `swarm-review` prompt logic.
3. **Global Audit**: Run a final compliance sweep and verify CI locally using `act` before pushing. [[Invoke: security]](../skills/security/SKILL.md)

## Anti-Patterns

- **Ambiguous Boundaries**: Assigning multiple sub-agents to overlapping code ranges without locking.
- **Token Flooding**: Launching more than 3 agents for a single mission without clear justification.
- **Dirty Handoff**: Dispatching a swarm without a verified Pinecone context kernel.

### Definition of Done

- **Mission Success**: Parallel tasks merged and verified.
- **Historical Record**: Mission summary archived in Cold Storage.
- **Expected Output**: Resonance reached across all file boundaries; verified in Log Book.
