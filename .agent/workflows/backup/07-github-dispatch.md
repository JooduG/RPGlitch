---
name: 07-github-dispatch
description: Orchestration Protocol. Dispatching tasks to GitHub Copilot/Fleet.
---

# 07-github-dispatch (The Orchestration)

> **Goal:** Coordinate across the fleet. Dispatch instructions to GitHub Copilot/Fleet and monitor execution.

## 1. Triggers

- **Complex Feature**: Requirements that span multiple components.
- **Bulk Refactor**: Large-scale changes better suited for background execution.
- **Slash Command**: `/07-dispatch`

## 2. Brain (Context Injection)

- **Global State**: `.agent/state/global.md`
- **Active Track**: `.agent/state/tracks/<track>.md`
- **Execution Script**: `.github/workflows/ai-fleet-dispatch.yml`

## 3. Procedures

### Phase 1: Context Analysis

1. Read `.agent/state/global.md` for project context.
2. Build a checklist based on the incoming Issue/PR content.

### Phase 2: Plan & Approve

1. Follow `/02-execute` to formulate the technical approach.
2. **Post Plan**: Format as "🤖 AI Assistant: Plan of Action".
3. **Halt**: Do not execute until a maintainer comments `@gemini-cli /approve`.

## 4. Anti-Patterns

- **Blind Dispatch**: Sending instructions without full file context.
- **Ghosting**: Not checking back on the status of the dispatched job.
