---
trigger: always_on
description: The Operational Loop. Meridian Progression, Clarity Gates, and Triad Resolution.
---

# ⚡ Workflow (The Loop)

## 1. The Meridian Progression

Every task follows this atomic sequence:

1. **[Project]** defines the Task (`task.md`).
2. **[Svelte]** builds the Logic (Runes/Components).
3. **[Sensory]** applies the Polish (Styles/Physics/Sound).
4. **[Data]** saves the State (Persistence).
5. **[Security]** audits for Compliance (Security/Tests).

## 2. The Clarity Gate (A-C-Q)

`Input -> Ambiguity Check (A) -> Complexity Selection (C) -> Execution -> Quality Gate (Q) -> Output`

### Phase 1: Ambiguity (A-Score)

| Score     | Meaning        | Action               |
| :-------- | :------------- | :------------------- |
| **A1/A2** | Clear/Inferred | Execute immediately. |
| **A3**    | Ambiguous      | **Propose & Wait**.  |
| **A4**    | Critical       | **Present Options**. |
| **A5**    | Hazard         | **REFUSE**.          |

### Phase 2: The Cognitive Engine (C-Level)

| Level  | Mode              | Tooling Requirement       |
| :----- | :---------------- | :------------------------ |
| **C1** | **Reflex**        | Direct Execution.         |
| **C2** | **Planning**      | `sequentialthinking`      |
| **C3** | **Metacognition** | `metacognitiveMonitoring` |
| **C4** | **Reframing**     | `research` skill          |
| **C5** | **Decision**      | `decisionFramework`       |
| **C6** | **Science**       | `scientificMethod`        |

## 3. The Triad Protocol (Context Resolution)

Context is unified under the `.agent/` root:

- **Passive Governance:** Rules and constraints (`.agent/rules/`).
- **Specialized Skills:** Modular capabilities (`.agent/skills/`).
- **Active State:** Current goals (`.agent/tasks/`).

### Dynamic Context Hooks (Grounding)

Before starting any task, read:

1. `.agent/config.yaml`
2. `.agent/knowledge/atlas/01-vision.md`
3. `.agent/tracks.md`

## 4. Definition of Done

- [ ] Code matches `spec.md` / `task.md`.
- [ ] Logic follows Pure IO where possible.
- [ ] Svelte components use **Runes** exclusively.
- [ ] Tests pass (Unit/E2E).
- [ ] Security sanitization (**🛡️ Security**) applied.
- [ ] Walkthrough documented.

## 5. The Workflow Registry (The Red Thread)

> **Location:** `.agent/workflows/*.md`

| Command        | Name              | Implementation                |
| :------------- | :---------------- | :---------------------------- |
| `/00-boot`     | **The Ignition**  | Sync Context & Initial Check. |
| `/01-plan`     | **The Blueprint** | Scope & Plan features.        |
| `/02-execute`  | **The Forge**     | Implement & Refactor.         |
| `/03-clean`    | **The Clinic**    | Fix Bugs & Hygiene.           |
| `/04-review`   | **The Vault**     | Audit & Checkpoint.           |
| `/05-deploy`   | **The Launch**    | Deploy to Production.         |
| `/06-continue` | **The Relay**     | Resume interrupted work.      |
| `/99-reset`    | **The Rewind**    | Emergency Revert.             |
