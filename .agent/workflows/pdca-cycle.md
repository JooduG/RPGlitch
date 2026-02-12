---
name: PDCA Engineering Cycle
description: Formal orchestration workflow enforcing Plan-Do-Check-Act.
---

# PDCA Engineering Cycle

## Phase 1: PLAN (Architect Mode)

- **Input:** Analyze the user request.
- **Routing:** Select the appropriate Agentic Mode (Skeleton, Skin, or Migration).
- **Blueprint:** List required imports and dependencies.
- **Stop:** Wait for user confirmation of the plan.

## Phase 2: DO (Builder Mode)

- **Execution:** Execute the selected Skill (e.g., generate-skeleton).
- **Adherence:** Strictly adhere to .agent/rules/tech-stack.md.

## Phase 3: CHECK (Auditor Mode)

- **Self-Correction:** The agent must scan its own output for BANNED PATTERNS defined in `.agent/rules/anti-patterns.md`.
- **Tool Use:** Run the audit-core skill to perform a static analysis.
- **Question:** "Does this code contain export let?" -> If YES, Refactor immediately.
- **Question:** "Does this code mix Svelte 4 and 5?" -> If YES, Refactor immediately.

## Phase 4: ACT (Deployer Mode)

- **Commit:** Write the file to the file system.
- **Integrate:** Update manifest or index files if necessary.
