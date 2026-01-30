# [Cortex](../../../skills/cortex/SKILL.md): Planning Layer (L2)

## The Protocol

1. **Step Breakdown**: Before taking action, list the 1-N logical steps required to solve the problem.
2. **Tool Selection**: For each step, identify the specific tool (or skill) needed.
3. **Registry Sync**: Align every plan with the active tracks in [.agent/tasks/tracks.md](../../../tasks/tracks.md).
4. **Hypothesis**: Briefly state the expected outcome of the plan.

## When to Use

- Architectural adjustments.
- Any task where the solution path is not immediately obvious.

## Required Tooling

- **MCP**: `mcp-sequentialthinking-tools`
- **Function**: `sequentialthinking`
- **Mode**: `plan`

## Techniques

### 1. Step-by-Step Tracing

Use `sequentialthinking_tools` to maintain a formal chain of thought. Each thought represents a transition in state or a realization about the problem.

### 2. Dependency Mapping

Identify which steps depend on the output of previous steps to avoid race conditions in implementation.
