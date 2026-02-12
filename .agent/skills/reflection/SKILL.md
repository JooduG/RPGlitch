---
description: Executive Function for "Slow Thinking" mode. Enforces planning, clarity, and rigorous logic before complex tasks.
---

# Reflection Protocol (The Strategist)

This skill acts as your Executive Function, ensuring "Slow Thinking" for complex tasks. It integrates the rigorous cognitive frameworks of the Cortex to prevent haste and logical fallacies.

## Mandatory Triggers

This skill MUST trigger for:

- **Complex Refactors** (>1 file or core logic)
- **New Feature Requests**
- **Architectural Decisions** ("A vs B" trade-offs)
- **Resolving Logic Conflicts**
- **Verifying Hypotheses**
- **Impossible Bugs**

## Phase 1: The Clarity Gate (A1-A5)

Before planning, assess the request's ambiguity.

1. **Assess**: "Is the request clear?" (Score 1-5).
2. **Act**:
    - **A1-A2 (Clear)**: Proceed to Phase 2.
    - **A3 (Ambiguous)**: **Propose Solution**. ("I recommend X. Proceed?").
    - **A4 (Vague)**: **Present Options**. ("Option A vs B?").
    - **A5 (Opaque)**: **Refuse/Clarify**. ("I need more context on Y.").

> **Rule**: Stop here if A > 2 and wait for user input.

## Phase 2: The Planning Phase

Draft a **"Planning Artifact"** (e.g., `implementation_plan.md` or a structured thought block) covering:

### 1. Strategic Intent

- **Goal**: What is the ultimate goal? Define success criteria.
- **First Principles**: Break the problem down to its fundamental truths if distinct from standard patterns.

### 2. Law Check

Cross-reference:

- [Security Rules](../../rules/security.md)
- [Anti-Patterns](../../rules/anti-patterns.md)

### 3. Hardware Constraints

- **Environment**: Ryzen 5 / 16GB RAM.
- **Constraint**: Avoid heavy background tasks. Optimize for memory efficiency.

### 4. Anticipated Glitches

List at least **2 potential risks** (e.g., State sync, Edge cases, Performance bottlenecks).

## Phase 3: Cognitive Execution

For the actual execution logic, you MUST use the following tools based on complexity:

- **Sequential Thinking (MANDATORY for C2+ Tasks)**:
    - Use for any logic requiring > 3 steps.
    - Track your thought process step-by-step.
    - Update the plan if dynamic complexity increases.

- **First Principles**:
    - Use for architectural decisions or when "best practices" conflict.
    - Strip away assumptions; reason from the ground up.

## Self-Correction (Sanity Audit)

After execution, verify:

- Did I follow the Law Check?
- Did I respect Hardware Constraints?
- Did the solution meet the Strategic Intent?
