---
name: 01-plan
description: The Master Router. Enforces the 8-step process from AGENTS.md, categorizes risk, and routes complex features through the intake -> Directives -> Warden funnel.
risk: low
source: AI
date_added: 2024-03-29
---

# [/01-plan](./01-plan.md) - Blueprint Architect

## Objectives: Strategic Intent

- Objective: Resolve ambiguity using the Intake skill.
- Objective: Map complex tasks to the correct capability toolkit.

## Context-Injection: Strategic Routing

MUST INVOKE [Intake](../skills/orchestration-strategy/SKILL.md). 
- And then inject: 
    - [Intelligence](../rules/01-foundation.md)
    - [Intake](../skills/orchestration-strategy/)

## Capabilities: Decision Matrix

- **Feature Discovery**: [10x Strategic Mode](./10x.md)
- **Problem Solving**: [Sequential Thinking](../skills/orchestration-tactics/)
- **Risk Analysis**: [Warden Debugging](../skills/warden/)

## Procedure

### Phase 1: Strategic Intent (The Discovery)

1. **Strategic Intake**: If intent is vague or requires architectural definition, initiate the Strategy skill. This skill now internally handles context recovery from Pinecone. [[Invoke: orchestration-strategy]](../skills/orchestration-strategy/SKILL.md)
2. **Contextual Physics**: Resolve all semantic gaps and establish the "What" and "Why" of the mission.

### Phase 2: Tactical Blueprint (The Design)

1. **Blueprint Generation**: Once intent is crystalline, invoke the Tactics skill to map the structural topography and draft the checklist. This skill internally performs topographical research. [[Invoke: orchestration-tactics]](../skills/orchestration-tactics/SKILL.md)
2. **Authorization**: Present the finalized implementation plan for explicit user approval.

## Anti-Patterns

- **Premature Execution**: Coding before the plan is approved.
- **Vibe Coding**: Relying on assumptions without research for Medium/High-risk tasks.
- **Silent Pivot**: Making major architectural shifts without updating the plan.
