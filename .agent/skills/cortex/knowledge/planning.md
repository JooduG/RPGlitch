# Cortex: Planning Layer (L2)

> **Goal**: Prevent "jump to solution" errors through structured, multi-step analysis.

## The Protocol

1. **Step Breakdown**: Before taking action, list the 1-N logical steps required to solve the problem.
2. **Tool Selection**: For each step, identify the specific tool (or skill) needed.
3. **Hypothesis**: Briefly state the expected outcome of the plan.

## When to Use

- Multi-file changes.
- Architectural adjustments.
- Any task where the solution path is not immediately obvious.

## Techniques

### 1. Step-by-Step Tracing

Use `sequentialthinking_tools` to maintain a formal chain of thought. Each thought represents a transition in state or a realization about the problem.

### 2. Dependency Mapping

Identify which steps depend on the output of previous steps to avoid race conditions in implementation.
