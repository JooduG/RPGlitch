# Workflow: 07-github-dispatch

## Phase 1: Context Analysis

1. Read `.agent/state/global.md` for project context.
2. Build a checklist based on the incoming Issue/PR content.

## Phase 2: Plan & Approve

1. **Analyze Intent**: If ambiguous, use `add_issue_comment` to ask for clarification.
2. **Post Plan**: Format as "��� AI Assistant: Plan of Action".
3. **Halt**: Do not execute until a maintainer comments `@gemini-cli /approve`.

## Phase 3: Execution

1. Once approved, follow `.agent/workflows/02-execute.md`.
2. Report completion with a summary and PR link.
