---
description: Multi-Agent Orchestration.
---

# WORKFLOW: Fleet Commander (Multi-Agent Orchestration)

## Context

Trigger this workflow when executing massive, multi-file refactors (e.g., global Svelte 5 migrations).
This sequence enforces a strict, prompt-driven pipeline without relying on external Node.js scripts.

## The 5-Phase Pipeline

1. **Analyze:** Scan the target directory for Perchance/Svelte 5 compliance.
2. **Plan:** Output a rigid, file-by-file refactoring strategy.
3. **Validate:** Verify no hallucinated imports or Svelte 4 artifacts exist in the plan.
4. **Dispatch:** Execute the code generation sequentially.
5. **Merge:** Integrate the diffs and update `STATE.md`.
