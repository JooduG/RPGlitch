---
description: Structured Review Protocol. Audits track quality and readiness against system standards.
---

# 🎓 Scholar: Apex Review Protocol (06-review)

> **Goal:** Provide a high-fidelity, auditable assessment of implementation artifacts against the project's Prime Directive and technical truth.

## 1. Scope & Intelligence Synchronization

1.  **Target Identification**: Identify the Track, Phase, or specific Task ID from `.agent/tasks/queue.json`.
2.  **Context Retrieval**:
    - Load `spec.md` and `plan.md` for the track.
    - Load relevant Lore: `knowledge/incubator/mechanics-concepts.md`.
    - Load Technical Truth: `knowledge/tech/svelte-5.md`.
3.  **Handoff Scan**: Read the latest report in `.agent/tasks/handoffs/` to understand implementation choices.

## 2. Verification Protocol (The Truth Matrix)

Verify the implementation against the following specialized matrices:

### A. Core Integrity

- [ ] **Plan Compliance**: Does the code strictly match the steps defined in `plan.md`?
- [ ] **Lore Alignment**: Do new mechanics or terms conflict with established world-building?
- [ ] **Prime Directive**: Does it preserve the "Systemic Chaos" and "Core Pillars"?

### B. Technical Standards

- [ ] **Runes Audit**: Correct use of `$state`, `$derived`, `$effect`. No legacy Svelte 4 remnants.
- [ ] **Chalk Regime**: Does SCSS adhere to [.agent/rules/06-aesthetic.md](../../rules/06-aesthetic.md)?
- [ ] **Security**: Is `innerHTML` sanitized via DOMPurify? (Rule 04)
- [ ] **Hygiene**: No console logs, debuggers, or dead code. (Rule 05)

### C. Validation Integrity

- [ ] **Test Coverage**: Are there passing Vitest/Playwright tests covering the new logic paths?
- [ ] **Hallucination Check**: Verify that any used third-party APIs or library methods actually exist.

## 3. The Review Report

Output findings in the following format to `.agent/tasks/handoffs/review_[task_id].md`:

### Review Report: [Track-Slug]

**Verdict**: [PASS / REVISE / BLOCK]
**Summary**: [Single sentence on implementation quality]

| Check                  | Status        | Comment |
| :--------------------- | :------------ | :------ |
| **Plan Compliance**    | [Pass/Fail]   |         |
| **Tech Stack (Runes)** | [Pass/Fail]   |         |
| **Aesthetics (Chalk)** | [Pass/Fail]   |         |
| **Security Audit**     | [Clean/Dirty] |         |
| **Test Integrity**     | [Yes/No]      |         |

### Findings (Severity Grouping)

- **🔴 [CRITICAL]**: Security holes, breaking architectural changes, or Svelte 5 rune misuse.
- **🟠 [HIGH]**: Deviation from Lorebook, logic errors, or missing core tests.
- **🟡 [MEDIUM]**: Minor aesthetic drift or suboptimal reactivity patterns.
- **🟢 [LOW]**: Documentation typos, variable naming, or micro-optimizations.

## 4. Verdict & Handoff

1.  **Decision**:
    - **PASS**: Implementation is sound. Signal Gamemaster to proceed to `05-checkpoint.md`.
    - **REVISE**: Return to `03-implement.md` with specific repair instructions.
2.  **Sync**: If new technical patterns were established, update `knowledge/tech/optimization.md`.
