---
name: reflection
version: 1.0.0
description: Executive Function for "Slow Thinking" mode. Enforces planning, clarity, and rigorous logic before complex tasks.
Triggers:
    - "Resolve Logic Conflict"
    - "Architectural Decision"
    - "Verify Hypothesis"
    - "Context: [Reflection]"
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

31. **Assess**: "Is the request clear?" (Score 1-5).
32. **Act**:
33.     - **A1-A2 (Clear)**: Proceed to Phase 2.
34.     - **A3 (Ambiguous)**: **Propose Solution**. Trigger `metacognitiveMonitoring` (Stage: planning).
35.     - **A4 (Vague)**: **Present Options**. Trigger `metacognitiveMonitoring` (Stage: knowledge-assessment).
36.     - **A5 (Opaque)**: **Refuse/Clarify**. ("I need more context on Y.").
37.
38. > **Rule**: Stop here if A > 2 and wait for user input (or self-correction via Waldzell).

## Phase 2: The Planning Phase

Draft a **"Planning Artifact"** (e.g., `implementation_plan.md` or a structured thought block) covering:

### 1. Strategic Intent

- **Goal**: What is the ultimate goal? Define success criteria.
- **First Principles**: Break the problem down to its fundamental truths if distinct from standard patterns.

### 2. Law Check

Cross-reference:

- [Security Rules](../../rules/security.md)
- [Anti-Patterns](../../rules/standards.md)

### 3. Hardware Constraints

- **Environment**: Ryzen 5 / 16GB RAM.
- **Constraint**: Avoid heavy background tasks. Optimize for memory efficiency.

### 4. Anticipated Glitches

List at least **2 potential risks** (e.g., State sync, Edge cases, Performance bottlenecks).

## Phase 3: Cognitive Execution

67. For the actual execution logic, you MUST use the following tools based on complexity:
68.
69. - **Sequential Thinking (Legacy)**:
70.     - Use for straightforward logic (< 3 steps).
71.
72. - **Waldzell Reasoning (MANDATORY for C2+ Tasks)**:
73.     - **`clear_thought`**: Primary engine for complex reasoning chains.
74.         - Use `operation: "sequential_thinking"` for standard problem solving.
75.         - Use `operation: "debugging_approach"` for defect analysis.
76.     - **`structuredArgumentation`**: Use for "A vs B" architectural debates.
77.     - **`visualReasoning`**: Use to graph complex relationships or state machines.

## Self-Correction (Sanity Audit)

After execution, verify:

- Did I follow the Law Check?
- Did I respect Hardware Constraints?
- Did the solution meet the Strategic Intent?

## Anti-Patterns

| Pattern                                     | Mitigation                                                              |
| :------------------------------------------ | :---------------------------------------------------------------------- |
| **Skipping Clarity Gate for complex tasks** | **Forbidden**. All C2+ tasks require ambiguity assessment first.        |
| **Guessing at A3+ ambiguity**               | **Forbidden**. Propose or present options; never assume intent.         |
| **Executing without a plan artifact**       | **Forbidden** for >3 step tasks. Create `implementation_plan.md` first. |
| **Ignoring Hardware Constraints**           | **Avoid**. Always factor in Ryzen 5 / 16GB RAM limitations.             |
