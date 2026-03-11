---
description: Deconstruct a monolithic task into isolated shards and dispatch parallel execution.
---

# Workflow: Fleet Commander (Chaos Mode)

**Trigger:** The Director explicitly commands you to "Execute Fleet Plan [X]" or feeds you a massive multi-component refactoring spec.
**Objective:** Deconstruct a monolithic task into isolated shards and dispatch parallel execution.

## Execution Steps:

1. **Analyze the Payload:** Read the provided `plan.md` or `spec.md`.
2. **Chop the Block:** Divide the master plan into discrete, non-overlapping tasks (e.g., Task A edits `DebugPanel.svelte`, Task B edits `ControlPanel.svelte`).
3. **Generate Shards:** Write these individual tasks into temporary files in `.agent/tasks/active-fleet/`.
4. **Dispatch (Via MCP):** Use the system execution MCP tool to spawn parallel agent sessions for each shard.
    - _Directive to Sub-Agents:_ "You are a Fleet Worker. You must follow `10-vibe-intake.md`, execute your specific shard, and immediately close your session."
5. **The Merge Watch:** Monitor the completion of the sub-agents. If git conflicts arise in `src/`, use the conflict-resolution prompt format to squash and resolve them locally before reporting back to the Director.
