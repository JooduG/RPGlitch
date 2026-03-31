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

### Phase 1: Ambiguity Resolution (Step 1.5: Intent Decoding)

1. **Intake**: If intent is vague, halt and initiate the Intake skill. Resolve all semantic gaps before committing to a technical path. [[Invoke: orchestration-strategy]](../skills/orchestration-strategy/SKILL.md)
2. **Constraint Check**: Verify logical dependencies (Step 1.1) and prerequisites (Step 1.3). Ensure no cross-operational conflicts exist.

### Phase 2: Hypothesis & Triage (Step 2: Hypothesis)

1. **Brainstorming**: Draft multiple hypotheses (Step 2.1) and rank by probability.
2. **Orchestration**: Assign a complexity level (1, 2, or 3) and map the task to the appropriate capability toolkit (Step 2.2).
3. **Risk Profile**: Categorize risk (Low, Medium, High). High-risk tasks MUST trigger a research phase (Step 3).

### Phase 3: Drafting the Spec (Step 5: Grounding)

1. **Plan Generation**: Create the implementation plan artifact. Ensure it is grounded in absolute file paths and line numbers.
2. **User Authorization**: Wait for explicit user approval before execution begins.

## Anti-Patterns

- **Premature Execution**: Coding before the plan is approved.
- **Vibe Coding**: Relying on assumptions without research for Medium/High-risk tasks.
- **Silent Pivot**: Making major architectural shifts without updating the plan.
