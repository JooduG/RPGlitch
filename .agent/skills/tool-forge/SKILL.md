---
name: tool-forge
version: 1.0.0
description: This skill should be used when designing client-side Perchance tools, Svelte 5 bridges, or formulating requests to host MCP servers. Covers architectural reduction, tool consolidation, and proper descriptions.
---

# Tool Design for Antigravity Agents

Tools are the primary mechanism through which agents interact with the world. In the Antigravity Engine, tools fall into two strict categories:

1. **Host MCP Tools:** External tools we _call_ via the environment (e.g., GitHub, File System).
2. **Perchance Bridges:** Client-side tools we _build_ to let the Perchance Left Panel communicate with our Svelte 5 Right Panel UI.

Poor tool design creates failure modes that no amount of prompt engineering can fix. Effective tool design follows specific principles that account for how agents perceive and use tools.

## Core Concepts

### The Consolidation Principle

If a human engineer cannot definitively say which tool should be used in a given situation, an agent cannot be expected to do better. Prefer single comprehensive tools over multiple narrow tools.
Instead of `listUsers`, `listEvents`, and `createEvent`, implement `scheduleEvent` that handles the full workflow internally.

### Architectural Reduction

Stop constraining reasoning. A common anti-pattern is building tools to "protect" the model from complexity. Instead of building custom tools for data exploration, provide direct file system access or standard web APIs. Build for future models by keeping the architecture minimal.

## Tool Description Engineering

Tool descriptions are prompt engineering. They must answer:

1. **What does the tool do?** Clear, specific functionality.
2. **When should it be used?** Specific triggers and contexts.
3. **What inputs does it accept?** Parameter descriptions, types, constraints, defaults.
4. **What does it return?** Output format and structure.

### MCP Tool Naming Requirements (Host Tools)

When instructing the swarm to use host MCP (Model Context Protocol) tools, **always use fully qualified tool names**.

File: qualified-naming.js

```javascript
// Correct: Fully qualified names
"Use the GitHub:create_issue tool to create issues."
"Use the Jules:execute_bash tool to list directories."

// Incorrect: Unqualified names
"Use the create_issue tool..." // May fail with multiple servers
```

## Practical Implementation (Perchance / Svelte 5)

When designing tools that bridge the Perchance Engine to the UI, strictly use standard JavaScript JSDoc patterns and Svelte 5 Runes.

### Example: Well-Designed Perchance Bridge Tool

File: bridge-example.js

```javascript
/**
 * Dispatches a narrative event from the Perchance Engine to the Svelte 5 UI.
 * * Use when:
 * - The procedural engine generates a new story beat.
 * - The user needs to make a branching choice.
 * * @param {string} eventId - The unique identifier for the event (e.g., "EVT-001")
 * @param {"dialogue"|"combat"|"exploration"} context - The current game state
 * @returns {boolean} True if the UI successfully queued the event
 */
window.exposed.dispatchNarrativeEvent = function (eventId, context = "exploration") {
    // Bridges into Svelte 5 $state
    narrativeState.queue.push({ id: eventId, context })
    return true
}
```

### Example: Poor Tool Design (Anti-Pattern)

File: anti-pattern-example.js

```javascript
// BAD: Vague name, no parameters documented, missing return types, zero context.
function updateUI(x) {
    uiStore.set(x) // BAD: Uses legacy Svelte 4 store instead of Svelte 5 $state
}
```

## Error Message Design

Error messages must be actionable for the agent. Include what went wrong, and how to recover.

File: error-design.js

```javascript
{
    error: "INVALID_EVENT_ID",
    message: "Event ID '123' does not match required format.",
    expected_format: "EVT-###### (e.g., EVT-000001)",
    resolution: "Provide an event ID matching the required pattern."
}
```

## 🛡️ Anti-Patterns

| Pattern | Mitigation |
| :--- | :--- |
| **Tool Proliferation** | Forbidden. Consolidate narrow tools into comprehensive functional workflows. |
| **Black Box Errors** | Forbidden. Errors must be actionable and include resolution steps. |
| **Legacy Stores** | Forbidden. Transition all bridge tools to Svelte 5 Runes (`$state`). |
| **Unqualified Names** | Avoid using unqualified MCP tool names; always specify the server prefix. |

## Checklist for Tool Design

1. Does the description clearly state what the tool does and when to use it?
2. Are parameter names self-documenting (e.g., `eventId` instead of `val`)?
3. Are error cases covered with actionable agent-recovery messages?
4. For Svelte 5: Is it leveraging `$state` or `$effect` cleanly without legacy stores?
5. For Perchance: Is the tool safely exposed via `window.exposed`?
